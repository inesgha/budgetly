namespace Budgetly.Api.Dtos;

public class MonthlyStatDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal Income { get; set; }
    public decimal Expenses { get; set; }
}
