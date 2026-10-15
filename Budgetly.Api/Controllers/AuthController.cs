using System.Security.Claims;
using Budgetly.Api.Data;
using Budgetly.Api.Dtos;
using Budgetly.Api.Models;
using Budgetly.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Budgetly.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private static readonly (string Name, string Color, TransactionType Type)[] DefaultCategories =
    {
        ("Alimentation", "#E8743B", TransactionType.Expense),
        ("Transport", "#2C8C99", TransactionType.Expense),
        ("Loyer", "#5B3FE0", TransactionType.Expense),
        ("Loisirs", "#D9467A", TransactionType.Expense),
        ("Études", "#E3B23C", TransactionType.Expense),
        ("Shopping", "#8C8798", TransactionType.Expense),
        ("Bourse", "#1E7A50", TransactionType.Income),
        ("Famille", "#1E7A50", TransactionType.Income),
        ("Job", "#1E7A50", TransactionType.Income)
    };

    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;

    public AuthController(AppDbContext db, TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email))
        {
            return Conflict(new { message = "Un compte existe déjà avec cet email." });
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Categories = DefaultCategories
                .Select(c => new Category { Name = c.Name, Color = c.Color, Type = c.Type })
                .ToList()
        };

        _db.Users.Add(user);

        try
        {
            await _db.SaveChangesAsync();
        }
        // Deux inscriptions simultanées avec le même email : l'index unique bloque la seconde
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return Conflict(new { message = "Un compte existe déjà avec cet email." });
        }

        return CreatedAtAction(nameof(Me), CreateAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.SingleOrDefaultAsync(u => u.Email == email);

        // Même message dans les deux cas pour ne pas révéler quels emails sont inscrits
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Email ou mot de passe incorrect" });
        }

        return Ok(CreateAuthResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        if (!int.TryParse(User.FindFirstValue(JwtRegisteredClaimNames.Sub), out var userId))
        {
            return Unauthorized();
        }

        // Le token peut être encore valide alors que le compte a été supprimé
        var user = await _db.Users.FindAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        return UserDto.FromUser(user);
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var (token, expiresAt) = _tokenService.CreateToken(user);
        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = UserDto.FromUser(user)
        };
    }
}
