namespace Budgetly.Api.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#5B3FE0";
    public string Icon { get; set; } = string.Empty;
    public TransactionType Type { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
