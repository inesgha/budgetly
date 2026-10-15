using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Budgetly.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    // L'id est dans le claim "sub" (MapInboundClaims = false dans Program.cs).
    // NameIdentifier est lu en secours si le mapping des claims est réactivé un jour.
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(value, out var userId))
        {
            throw new InvalidOperationException("Le token ne contient pas d'identifiant utilisateur valide.");
        }

        return userId;
    }
}
