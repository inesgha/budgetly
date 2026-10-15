namespace Budgetly.Api.Models;

public class Alert
{
    public int Id { get; set; }

    // 80 = seuil d'avertissement, 100 = budget dépassé
    public int Level { get; set; }

    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int BudgetId { get; set; }
    public Budget Budget { get; set; } = null!;
}
