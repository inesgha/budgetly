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
[Route("api/transactions")]
public class TransactionsController : ControllerBase
{
    private const int MaxPageSize = 100;

    private readonly AppDbContext _db;
    private readonly AlertService _alertService;

    public TransactionsController(AppDbContext db, AlertService alertService)
    {
        _db = db;
        _alertService = alertService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TransactionDto>>> GetAll([FromQuery] TransactionQuery filters)
    {
        var userId = User.GetUserId();

        if (filters.Month is not null && filters.Year is null)
        {
            ModelState.AddModelError(nameof(filters.Year), "L'année est obligatoire quand le mois est indiqué.");
            return ValidationProblem(ModelState);
        }

        var page = Math.Max(filters.Page, 1);
        var pageSize = Math.Clamp(filters.PageSize, 1, MaxPageSize);

        var query = _db.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId);

        // Intervalle de dates [début, fin[ plutôt que t.Date.Month : SQL Server peut utiliser un index
        if (filters.Year is not null)
        {
            var start = new DateOnly(filters.Year.Value, filters.Month ?? 1, 1);
            var end = filters.Month is not null ? start.AddMonths(1) : start.AddYears(1);

            query = query.Where(t => t.Date >= start && t.Date < end);
        }

        if (filters.CategoryId is not null)
        {
            query = query.Where(t => t.CategoryId == filters.CategoryId);
        }

        if (filters.Type is not null)
        {
            query = query.Where(t => t.Type == filters.Type);
        }

        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            // ILIKE : recherche sans tenir compte des majuscules ("espresso" trouve "Espresso").
            // Les caractères spéciaux de LIKE (% _ \) tapés par l'utilisateur sont échappés pour rester du texte.
            var escaped = filters.Search.Trim().Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
            var pattern = $"%{escaped}%";
            query = query.Where(t =>
                (t.Note != null && EF.Functions.ILike(t.Note, pattern)) || EF.Functions.ILike(t.Category.Name, pattern));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.Id) // ordre stable entre les pages quand deux dates sont égales
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(TransactionDto.Projection)
            .ToListAsync();

        return new PagedResult<TransactionDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TransactionDto>> GetById(int id)
    {
        var userId = User.GetUserId();

        var transaction = await _db.Transactions
            .AsNoTracking()
            .Where(t => t.Id == id && t.UserId == userId)
            .Select(TransactionDto.Projection)
            .FirstOrDefaultAsync();

        return transaction is null ? NotFound() : transaction;
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create(CreateTransactionRequest request)
    {
        var userId = User.GetUserId();

        var category = await FindUserCategoryAsync(request.CategoryId, userId);
        if (category is null)
        {
            return CategoryNotFound();
        }

        var transaction = new Transaction
        {
            Amount = decimal.Round(request.Amount, 3),
            Type = category.Type,
            Date = request.Date!.Value,
            Note = NormalizeNote(request.Note),
            UserId = userId,
            Category = category
        };

        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        await CheckBudgetsAsync(userId, (category.Id, transaction.Date, transaction.Type));

        return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, TransactionDto.FromTransaction(transaction));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TransactionDto>> Update(int id, UpdateTransactionRequest request)
    {
        var userId = User.GetUserId();

        var transaction = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (transaction is null)
        {
            return NotFound();
        }

        var category = await FindUserCategoryAsync(request.CategoryId, userId);
        if (category is null)
        {
            return CategoryNotFound();
        }

        // Gardé avant modification : l'ancien budget (catégorie ou mois) est aussi concerné
        var before = (transaction.CategoryId, transaction.Date, transaction.Type);

        transaction.Amount = decimal.Round(request.Amount, 3);
        transaction.Type = category.Type;
        transaction.Date = request.Date!.Value;
        transaction.Note = NormalizeNote(request.Note);
        transaction.Category = category;

        await _db.SaveChangesAsync();

        await CheckBudgetsAsync(userId, before, (category.Id, transaction.Date, transaction.Type));

        return TransactionDto.FromTransaction(transaction);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();

        var transaction = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (transaction is null)
        {
            return NotFound();
        }

        _db.Transactions.Remove(transaction);
        await _db.SaveChangesAsync();

        await CheckBudgetsAsync(userId, (transaction.CategoryId, transaction.Date, transaction.Type));

        return NoContent();
    }

    // Vérifie une seule fois chaque budget (catégorie + mois) concerné ; seules les dépenses comptent
    private async Task CheckBudgetsAsync(int userId, params (int CategoryId, DateOnly Date, TransactionType Type)[] transactions)
    {
        var budgetsToCheck = transactions
            .Where(t => t.Type == TransactionType.Expense)
            .Select(t => (t.CategoryId, t.Date.Month, t.Date.Year))
            .Distinct();

        foreach (var (categoryId, month, year) in budgetsToCheck)
        {
            await _alertService.CheckBudgetAsync(userId, categoryId, month, year);
        }
    }

    // Chargée avec suivi (sans AsNoTracking) car elle est rattachée à la transaction enregistrée
    private Task<Category?> FindUserCategoryAsync(int categoryId, int userId) =>
        _db.Categories.FirstOrDefaultAsync(c => c.Id == categoryId && c.UserId == userId);

    // Même réponse que la catégorie n'existe pas ou qu'elle appartienne à un autre utilisateur
    private ActionResult CategoryNotFound()
    {
        ModelState.AddModelError(nameof(CreateTransactionRequest.CategoryId), "Cette catégorie n'existe pas.");
        return ValidationProblem(ModelState);
    }

    private static string? NormalizeNote(string? note) =>
        string.IsNullOrWhiteSpace(note) ? null : note.Trim();
}
