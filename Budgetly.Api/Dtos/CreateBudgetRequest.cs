using System.ComponentModel.DataAnnotations;

namespace Budgetly.Api.Dtos;

public class CreateBudgetRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "La catégorie est obligatoire.")]
    public int CategoryId { get; set; }

    [Range(typeof(decimal), "0.001", "1000000",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true,
        ErrorMessage = "La limite doit être supérieure à 0 et au maximum 1 000 000.")]
    public decimal Limit { get; set; }

    [Required(ErrorMessage = "Le mois est obligatoire.")]
    [Range(1, 12, ErrorMessage = "Le mois doit être entre 1 et 12.")]
    public int? Month { get; set; }

    [Required(ErrorMessage = "L'année est obligatoire.")]
    [Range(2000, 2100, ErrorMessage = "L'année doit être entre 2000 et 2100.")]
    public int? Year { get; set; }
}
