namespace Budgetly.Api.Dtos;

public class StatsSummaryDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal Balance => TotalIncome - TotalExpenses;
    public List<CategoryExpenseDto> ExpensesByCategory { get; set; } = new();
    public List<TransactionDto> RecentTransactions { get; set; } = new();
}

public class CategoryExpenseDto
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal Total { get; set; }

    // Part des dépenses du mois, avec 1 décimale (ex. 42,5)
    public decimal Percent { get; set; }
}
