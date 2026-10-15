using System.Linq.Expressions;
using Budgetly.Api.Models;

namespace Budgetly.Api.Dtos;

public class TransactionDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;

    // Utilisée dans les requêtes EF : la jointure avec Categories est faite en SQL
    public static readonly Expression<Func<Transaction, TransactionDto>> Projection = t => new TransactionDto
    {
        Id = t.Id,
        Amount = t.Amount,
        Type = t.Type,
        Date = t.Date,
        Note = t.Note,
        CategoryId = t.CategoryId,
        CategoryName = t.Category.Name,
        CategoryColor = t.Category.Color
    };

    private static readonly Func<Transaction, TransactionDto> FromTransactionCompiled = Projection.Compile();

    // Même conversion, pour une entité déjà chargée en mémoire (avec sa Category)
    public static TransactionDto FromTransaction(Transaction transaction) => FromTransactionCompiled(transaction);
}
