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
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private const int RecentTransactionCount = 5;
    private const int MaxMonths = 24;

    private readonly AppDbContext _db;

    public StatsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<StatsSummaryDto>> GetSummary([FromQuery] MonthQuery query)
    {
        var userId = User.GetUserId();
        var period = query.ToPeriod();
        var start = period.Start;
        var end = period.End;

        var monthTransactions = _db.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.Date >= start && t.Date < end);

        // Une seule requête SQL : SUM(Amount) ... GROUP BY Type
        var totalsByType = await monthTransactions
            .GroupBy(t => t.Type)
            .Select(g => new { Type = g.Key, Total = g.Sum(t => t.Amount) })
            .ToListAsync();

        var totalIncome = totalsByType.FirstOrDefault(x => x.Type == TransactionType.Income)?.Total ?? 0;
        var totalExpenses = totalsByType.FirstOrDefault(x => x.Type == TransactionType.Expense)?.Total ?? 0;

        // SUM(Amount) ... GROUP BY catégorie, de la plus grosse dépense à la plus petite
        var expensesByCategory = await monthTransactions
            .Where(t => t.Type == TransactionType.Expense)
            .GroupBy(t => new { t.CategoryId, t.Category.Name, t.Category.Color })
            .Select(g => new CategoryExpenseDto
            {
                CategoryId = g.Key.CategoryId,
                Name = g.Key.Name,
                Color = g.Key.Color,
                Total = g.Sum(t => t.Amount)
            })
            .OrderByDescending(c => c.Total)
            .ToListAsync();

        foreach (var category in expensesByCategory)
        {
            category.Percent = totalExpenses == 0
                ? 0
                : Math.Round(category.Total * 100 / totalExpenses, 1, MidpointRounding.AwayFromZero);
        }

        var recentTransactions = await monthTransactions
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.Id)
            .Take(RecentTransactionCount)
            .Select(TransactionDto.Projection)
            .ToListAsync();

        return new StatsSummaryDto
        {
            Month = period.Month,
            Year = period.Year,
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            ExpensesByCategory = expensesByCategory,
            RecentTransactions = recentTransactions
        };
    }

    [HttpGet("monthly")]
    public async Task<ActionResult<List<MonthlyStatDto>>> GetMonthly([FromQuery] int months = 6)
    {
        var userId = User.GetUserId();
        months = Math.Clamp(months, 1, MaxMonths);

        var lastMonth = MonthPeriod.Current();
        var firstMonth = lastMonth.AddMonths(-(months - 1));
        var start = firstMonth.Start;
        var end = lastMonth.End;

        // Une seule requête SQL : SUM(Amount) ... GROUP BY année, mois, type
        var totals = await _db.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.Date >= start && t.Date < end)
            .GroupBy(t => new { t.Date.Year, t.Date.Month, t.Type })
            .Select(g => new { g.Key.Year, g.Key.Month, g.Key.Type, Total = g.Sum(t => t.Amount) })
            .ToListAsync();

        // SQL ne renvoie rien pour un mois sans transaction : on complète avec des zéros
        return Enumerable.Range(0, months)
            .Select(i => firstMonth.AddMonths(i))
            .Select(m => new MonthlyStatDto
            {
                Year = m.Year,
                Month = m.Month,
                Income = totals
                    .Where(x => x.Year == m.Year && x.Month == m.Month && x.Type == TransactionType.Income)
                    .Sum(x => x.Total),
                Expenses = totals
                    .Where(x => x.Year == m.Year && x.Month == m.Month && x.Type == TransactionType.Expense)
                    .Sum(x => x.Total)
            })
            .ToList();
    }
}
