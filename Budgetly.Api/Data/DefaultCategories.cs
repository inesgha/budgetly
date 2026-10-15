using Budgetly.Api.Models;

namespace Budgetly.Api.Data;

// Catégories créées pour chaque nouveau compte (inscription et compte démo)
public static class DefaultCategories
{
    public static readonly (string Name, string Color, TransactionType Type)[] All =
    {
        ("Alimentation", "#E8743B", TransactionType.Expense),
        ("Transport", "#2C8C99", TransactionType.Expense),
        ("Loyer", "#5B3FE0", TransactionType.Expense),
        ("Loisirs", "#D9467A", TransactionType.Expense),
        ("Études", "#E3B23C", TransactionType.Expense),
        ("Shopping", "#8C8798", TransactionType.Expense),
        ("Bourse", "#1E7A50", TransactionType.Income),
        ("Famille", "#1E7A50", TransactionType.Income),
        ("Job", "#1E7A50", TransactionType.Income)
    };

    public static List<Category> Create() =>
        All.Select(c => new Category { Name = c.Name, Color = c.Color, Type = c.Type }).ToList();
}
