using System.ComponentModel.DataAnnotations;

namespace Budgetly.Api.Dtos;

public class LoginRequest
{
    [Required(ErrorMessage = "L'email est obligatoire.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le mot de passe est obligatoire.")]
    public string Password { get; set; } = string.Empty;
}
