using System.ComponentModel.DataAnnotations;

namespace Budgetly.Api.Dtos;

// Seule la limite est modifiable : pour changer de catégorie ou de mois, on crée un autre budget
public class UpdateBudgetRequest
{
    [Range(typeof(decimal), "0.001", "1000000",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true,
        ErrorMessage = "La limite doit être supérieure à 0 et au maximum 1 000 000.")]
    public decimal Limit { get; set; }
}
