using System.ComponentModel.DataAnnotations;
using Budgetly.Api.Models;

namespace Budgetly.Api.Dtos;

// Paramètres de GET /api/transactions?month=10&year=2026&page=1...
public class TransactionQuery
{
    [Range(1, 12, ErrorMessage = "Le mois doit être entre 1 et 12.")]
    public int? Month { get; set; }

    [Range(2000, 2100, ErrorMessage = "L'année doit être entre 2000 et 2100.")]
    public int? Year { get; set; }

    public int? CategoryId { get; set; }

    [EnumDataType(typeof(TransactionType), ErrorMessage = "Le type doit être Expense ou Income.")]
    public TransactionType? Type { get; set; }

    [MaxLength(100, ErrorMessage = "La recherche ne doit pas dépasser 100 caractères.")]
    public string? Search { get; set; }

    // Borne haute : sans elle, (page - 1) * pageSize dépasse la capacité d'un int, devient négatif,
    // et SQL Server refuse le décalage (erreur 500). Avec elle, la requête répond 400.
    [Range(1, 1_000_000, ErrorMessage = "La page doit être entre 1 et 1 000 000.")]
    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 20;
}
