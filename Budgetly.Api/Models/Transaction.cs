using Microsoft.EntityFrameworkCore;

namespace Budgetly.Api.Models;

public class Transaction
{
    public int Id { get; set; }

    // Le dinar tunisien a 3 décimales (millimes)
    [Precision(10, 3)]
    public decimal Amount { get; set; }

    public TransactionType Type { get; set; }
    // Jour de la transaction, sans heure ni fuseau horaire (colonne SQL "date")
    public DateOnly Date { get; set; }
    public string? Note { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}
