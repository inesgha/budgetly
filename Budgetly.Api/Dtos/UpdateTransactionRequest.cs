using System.ComponentModel.DataAnnotations;

namespace Budgetly.Api.Dtos;

public class UpdateTransactionRequest
{
    // 0,001 = 1 millime, le plus petit montant possible en dinars
    [Range(typeof(decimal), "0.001", "1000000",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true,
        ErrorMessage = "Le montant doit être supérieur à 0 et au maximum 1 000 000.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "La date est obligatoire.")]
    public DateOnly? Date { get; set; }

    [MaxLength(200, ErrorMessage = "La note ne doit pas dépasser 200 caractères.")]
    public string? Note { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La catégorie est obligatoire.")]
    public int CategoryId { get; set; }
}
