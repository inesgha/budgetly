using System.ComponentModel.DataAnnotations;
using Budgetly.Api.Models;

namespace Budgetly.Api.Dtos;

public class UpdateCategoryRequest
{
    [Required(ErrorMessage = "Le nom est obligatoire.")]
    [MaxLength(50, ErrorMessage = "Le nom ne doit pas dépasser 50 caractères.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "La couleur est obligatoire.")]
    [RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "La couleur doit être au format #RRGGBB.")]
    public string Color { get; set; } = "#5B3FE0";

    [MaxLength(50, ErrorMessage = "L'icône ne doit pas dépasser 50 caractères.")]
    public string? Icon { get; set; }

    [Required(ErrorMessage = "Le type est obligatoire (Expense ou Income).")]
    [EnumDataType(typeof(TransactionType), ErrorMessage = "Le type doit être Expense ou Income.")]
    public TransactionType? Type { get; set; }
}
