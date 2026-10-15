using Budgetly.Api.Models;

namespace Budgetly.Api.Dtos;

// Version "publique" de User : jamais de PasswordHash ici
public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;

    public static UserDto FromUser(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Currency = user.Currency
    };
}
