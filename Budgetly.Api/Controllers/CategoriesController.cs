using Budgetly.Api.Data;
using Budgetly.Api.Dtos;
using Budgetly.Api.Extensions;
using Budgetly.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Budgetly.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] TransactionType? type)
    {
        var userId = User.GetUserId();

        var query = _db.Categories
            .AsNoTracking()
            .Where(c => c.UserId == userId);

        if (type is not null)
        {
            query = query.Where(c => c.Type == type);
        }

        return await query
            .OrderBy(c => c.Type)
            .ThenBy(c => c.Name)
            .Select(CategoryDto.Projection)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CreateCategoryRequest request)
    {
        var userId = User.GetUserId();
        var name = request.Name.Trim();
        var type = request.Type!.Value;

        if (await NameExistsAsync(userId, name, type, excludedId: null))
        {
            return DuplicateName(name);
        }

        var category = new Category
        {
            Name = name,
            Color = request.Color.ToUpperInvariant(),
            Icon = request.Icon?.Trim() ?? string.Empty,
            Type = type,
            UserId = userId
        };

        _db.Categories.Add(category);

        try
        {
            await _db.SaveChangesAsync();
        }
        // Deux créations simultanées passent la vérification ci-dessus : l'index unique bloque la seconde
        catch (DbUpdateException ex) when (ex.IsUniqueConstraintViolation())
        {
            return DuplicateName(name);
        }

        return CreatedAtAction(nameof(GetAll), CategoryDto.FromCategory(category));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, UpdateCategoryRequest request)
    {
        var userId = User.GetUserId();

        // Filtrer par UserId : la catégorie d'un autre utilisateur est traitée comme inexistante (404)
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (category is null)
        {
            return NotFound();
        }

        var name = request.Name.Trim();
        var type = request.Type!.Value;

        if (await NameExistsAsync(userId, name, type, excludedId: id))
        {
            return DuplicateName(name);
        }

        // Le type des transactions est copié depuis la catégorie : le changer les rendrait incohérentes
        if (type != category.Type && await IsUsedAsync(id))
        {
            return Conflict(new { message = "Impossible de changer le type d'une catégorie déjà utilisée par des transactions ou des budgets." });
        }

        category.Name = name;
        category.Color = request.Color.ToUpperInvariant();
        category.Icon = request.Icon?.Trim() ?? string.Empty;
        category.Type = type;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.IsUniqueConstraintViolation())
        {
            return DuplicateName(name);
        }

        return CategoryDto.FromCategory(category);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();

        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (category is null)
        {
            return NotFound();
        }

        var transactionCount = await _db.Transactions.CountAsync(t => t.CategoryId == id);
        var budgetCount = await _db.Budgets.CountAsync(b => b.CategoryId == id);

        if (transactionCount > 0 || budgetCount > 0)
        {
            return Conflict(new
            {
                message = $"Impossible de supprimer \"{category.Name}\" : elle est utilisée par "
                    + $"{transactionCount} transaction(s) et {budgetCount} budget(s). "
                    + "Supprimez-les ou changez-les de catégorie d'abord."
            });
        }

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private ConflictObjectResult DuplicateName(string name) =>
        Conflict(new { message = $"Vous avez déjà une catégorie \"{name}\" de ce type." });

    // PostgreSQL distingue les majuscules : on compare en minuscules pour que "café" et "Café" soient un doublon
    private Task<bool> NameExistsAsync(int userId, string name, TransactionType type, int? excludedId)
    {
        var lowerName = name.ToLower();
        return _db.Categories.AnyAsync(c =>
            c.UserId == userId && c.Name.ToLower() == lowerName && c.Type == type && c.Id != excludedId);
    }

    private async Task<bool> IsUsedAsync(int categoryId) =>
        await _db.Transactions.AnyAsync(t => t.CategoryId == categoryId)
        || await _db.Budgets.AnyAsync(b => b.CategoryId == categoryId);
}
