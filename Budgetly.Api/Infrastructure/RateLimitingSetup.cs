using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Budgetly.Api.Infrastructure;

public static class RateLimitingSetup
{
    // Nom de la politique, utilisé par [EnableRateLimiting] sur /api/auth/login et /api/auth/register
    public const string AuthPolicy = "auth";

    private const int PermitLimit = 5;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);

    // 5 tentatives par minute et par adresse IP : freine les attaques qui essaient des mots de passe en boucle
    public static IServiceCollection AddAuthRateLimiting(this IServiceCollection services)
    {
        return services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy(AuthPolicy, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    // Un compteur par adresse IP (derrière un proxy, il faudra configurer les en-têtes X-Forwarded-For)
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "inconnue",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = PermitLimit,
                        Window = Window,
                        QueueLimit = 0
                    }));

            // Même format que les autres erreurs de l'API ({ message }), affiché tel quel par le front
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
                }

                await context.HttpContext.Response.WriteAsJsonAsync(
                    new { message = "Trop de tentatives. Patiente une minute avant de réessayer." },
                    cancellationToken);
            };
        });
    }
}
