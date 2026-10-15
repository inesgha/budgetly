using System.Globalization;
using Budgetly.Api.Data;
using Budgetly.Api.Extensions;
using Budgetly.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Budgetly.Api.Services;

public class AlertService
{
    private static readonly int[] Levels = { BudgetCalculator.WarningLevel, BudgetCalculator.ReachedLevel };

    // Format français : virgule décimale, 3 décimales pour les millimes (214,000)
    private static readonly CultureInfo French = CultureInfo.GetCultureInfo("fr-FR");

    private readonly AppDbContext _db;

    public AlertService(AppDbContext db)
    {
        _db = db;
    }

    // Crée les alertes 80 % et 100 % du budget de cette catégorie et de ce mois, si elles sont atteintes
    // et pas encore créées. Ne fait rien s'il n'y a pas de budget.
    public async Task CheckBudgetAsync(int userId, int categoryId, int month, int year)
    {
        var budget = await _db.Budgets
            .AsNoTracking()
            .Where(b => b.UserId == userId && b.CategoryId == categoryId && b.Month == month && b.Year == year)
            .Select(b => new { b.Id, b.Limit, CategoryName = b.Category.Name, b.User.Currency })
            .FirstOrDefaultAsync();

        if (budget is null)
        {
            return;
        }

        var period = new MonthPeriod(year, month);
        var start = period.Start;
        var end = period.End;

        var spent = await _db.Transactions
            .Where(t => t.UserId == userId
                && t.CategoryId == categoryId
                && t.Type == TransactionType.Expense
                && t.Date >= start
                && t.Date < end)
            .SumAsync(t => t.Amount);

        var existingLevels = await _db.Alerts
            .AsNoTracking()
            .Where(a => a.BudgetId == budget.Id)
            .Select(a => a.Level)
            .ToListAsync();

        foreach (var level in Levels)
        {
            if (!BudgetCalculator.HasReachedLevel(spent, budget.Limit, level) || existingLevels.Contains(level))
            {
                continue;
            }

            var percent = BudgetCalculator.Percent(spent, budget.Limit);
            var alert = new Alert
            {
                Level = level,
                Message = string.Format(French, "{0} : {1} % du budget atteint ({2:N3} / {3:N3} {4})",
                    budget.CategoryName, percent, spent, budget.Limit, budget.Currency),
                UserId = userId,
                BudgetId = budget.Id
            };

            _db.Alerts.Add(alert);

            try
            {
                await _db.SaveChangesAsync();
            }
            // Une requête simultanée a déjà créé cette alerte (index unique BudgetId + Level) : rien à faire
            catch (DbUpdateException ex) when (ex.IsUniqueConstraintViolation())
            {
                _db.Entry(alert).State = EntityState.Detached;
            }
        }
    }
}
