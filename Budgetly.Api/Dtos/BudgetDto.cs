using Budgetly.Api.Services;

namespace Budgetly.Api.Dtos;

public class BudgetDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Limit { get; set; }

    // Calculé en SQL (somme des dépenses de la catégorie sur le mois)
    public decimal Spent { get; set; }

    // Déduits de Limit et Spent
    public decimal Remaining => Limit - Spent;
    public int Percent => BudgetCalculator.Percent(Spent, Limit);
    public string Status => BudgetCalculator.Status(Spent, Limit);
}
