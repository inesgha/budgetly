using System.ComponentModel.DataAnnotations;

namespace Budgetly.Api.Dtos;

public class RegisterRequest
{
    [Required(ErrorMessage = "Le nom est obligatoire.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "L'email est obligatoire.")]
    [EmailAddress(ErrorMessage = "L'email n'est pas valide.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le mot de passe est obligatoire.")]
    [MinLength(8, ErrorMessage = "Le mot de passe doit contenir au moins 8 caractères.")]
    public string Password { get; set; } = string.Empty;
}
