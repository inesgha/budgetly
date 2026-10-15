using Budgetly.Api.Data;
using Budgetly.Api.Dtos;
using Budgetly.Api.Extensions;
using Budgetly.Api.Models;
using Budgetly.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Budgetly.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/budgets")]
public class BudgetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AlertService _alertService;

    public BudgetsController(AppDbContext db, AlertService alertService)
    {
        _db = db;
        _alertService = alertService;
    }

    [HttpGet]
    public async Task<ActionResult<List<BudgetDto>>> GetAll([FromQuery] MonthQuery query)
    {
        var userId = User.GetUserId();
        var period = query.ToPeriod();

        return await ProjectWithSpent(_db.Budgets
                .AsNoTracking()
                .Where(b => b.UserId == userId && b.Month == period.Month && b.Year == period.Year))
            .OrderBy(b => b.CategoryName)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<BudgetDto>> Create(CreateBudgetRequest request)
    {
        var userId = User.GetUserId();
        var month = request.Month!.Value;
        var year = request.Year!.Value;

        var category = await _db.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.UserId == userId);

        if (category is null)
        {
            ModelState.AddModelError(nameof(request.CategoryId), "Cette catégorie n'existe pas.");
            return ValidationProblem(ModelState);
        }

        if (category.Type != TransactionType.Expense)
        {
            ModelState.AddModelError(nameof(request.CategoryId), "Un budget ne peut concerner qu'une catégorie de dépense.");
            return ValidationProblem(ModelState);
        }

        if (await _db.Budgets.AnyAsync(b => b.CategoryId == category.Id && b.Month == month && b.Year == year))
        {
            return DuplicateBudget(category.Name);
        }

        var budget = new Budget
        {
            CategoryId = category.Id,
            Limit = decimal.Round(request.Limit, 3),
            Month = month,
            Year = year,
            UserId = userId
        };

        _db.Budgets.Add(budget);

        try
        {
            await _db.SaveChangesAsync();
        }
        // Deux créations simultanées passent la vérification ci-dessus : l'index unique bloque la seconde
        catch (DbUpdateException ex) when (ex.IsUniqueConstraintViolation())
        {
            return DuplicateBudget(category.Name);
        }

        // Des dépenses existent peut-être déjà ce mois-ci
        await _alertService.CheckBudgetAsync(userId, budget.CategoryId, month, year);

        return CreatedAtAction(nameof(GetAll), new { month, year }, await GetDtoAsync(budget.Id));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BudgetDto>> Update(int id, UpdateBudgetRequest request)
    {
        var userId = User.GetUserId();

        var budget = await _db.Budgets.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
        if (budget is null)
        {
            return NotFound();
        }

        budget.Limit = decimal.Round(request.Limit, 3);
        await _db.SaveChangesAsync();

        // Une limite plus basse peut faire franchir un seuil
        await _alertService.CheckBudgetAsync(userId, budget.CategoryId, budget.Month, budget.Year);

        return await GetDtoAsync(budget.Id);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();

        var budget = await _db.Budgets.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
        if (budget is null)
        {
            return NotFound();
        }

        // Un seul SaveChanges : les alertes et le budget sont supprimés ensemble, ou pas du tout
        var alerts = await _db.Alerts.Where(a => a.BudgetId == id).ToListAsync();
        _db.Alerts.RemoveRange(alerts);
        _db.Budgets.Remove(budget);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // Spent est une sous-requête SQL : SQL Server fait la somme, aucune transaction n'est chargée en mémoire
    private IQueryable<BudgetDto> ProjectWithSpent(IQueryable<Budget> budgets) =>
        budgets.Select(b => new BudgetDto
        {
            Id = b.Id,
            CategoryId = b.CategoryId,
            CategoryName = b.Category.Name,
            CategoryColor = b.Category.Color,
            Month = b.Month,
            Year = b.Year,
            Limit = b.Limit,
            Spent = _db.Transactions
                .Where(t => t.UserId == b.UserId
                    && t.CategoryId == b.CategoryId
                    && t.Type == TransactionType.Expense
                    && t.Date.Year == b.Year
                    && t.Date.Month == b.Month)
                .Sum(t => t.Amount)
        });

    private Task<BudgetDto> GetDtoAsync(int budgetId) =>
        ProjectWithSpent(_db.Budgets.AsNoTracking().Where(b => b.Id == budgetId)).SingleAsync();

    private ConflictObjectResult DuplicateBudget(string categoryName) =>
        Conflict(new { message = $"Un budget existe déjà pour \"{categoryName}\" ce mois-ci." });
}
