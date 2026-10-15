using Budgetly.Api.Data;
using Budgetly.Api.Dtos;
using Budgetly.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Budgetly.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/alerts")]
public class AlertsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AlertsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<AlertDto>>> GetAll([FromQuery] bool unreadOnly = false)
    {
        var userId = User.GetUserId();

        var query = _db.Alerts
            .AsNoTracking()
            .Where(a => a.UserId == userId);

        if (unreadOnly)
        {
            query = query.Where(a => !a.IsRead);
        }

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .ThenByDescending(a => a.Id)
            .Select(AlertDto.Projection)
            .ToListAsync();
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<object>> GetUnreadCount()
    {
        var userId = User.GetUserId();

        var count = await _db.Alerts.CountAsync(a => a.UserId == userId && !a.IsRead);

        return new { count };
    }

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = User.GetUserId();

        // UPDATE direct en SQL ; 0 ligne touchée = alerte inexistante ou d'un autre utilisateur
        var updated = await _db.Alerts
            .Where(a => a.Id == id && a.UserId == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.IsRead, true));

        return updated == 0 ? NotFound() : NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = User.GetUserId();

        await _db.Alerts
            .Where(a => a.UserId == userId && !a.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.IsRead, true));

        return NoContent();
    }
}
