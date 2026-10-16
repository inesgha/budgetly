using Npgsql;

namespace Budgetly.Api.Infrastructure;

/// <summary>
/// Trouve la chaîne de connexion PostgreSQL, par ordre de priorité :
/// 1. l'option en ligne de commande --connection (ex. "dotnet run -- --seed-demo --connection ...") ;
/// 2. la variable d'environnement DATABASE_URL (injectée par Vercel / Neon) ;
/// 3. ConnectionStrings:DefaultConnection (user-secrets en développement).
/// Les adresses au format URL ("postgres://user:pass@host/db") sont converties au format Npgsql.
/// </summary>
public static class DatabaseConnection
{
    public static string? Resolve(IConfiguration configuration)
    {
        var raw = new[]
            {
                configuration["connection"],
                configuration["DATABASE_URL"],
                configuration.GetConnectionString("DefaultConnection")
            }
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

        return raw is null ? null : Normalize(raw);
    }

    /// <summary>URL "postgres://..." ou "postgresql://..." convertie ; chaîne Npgsql classique renvoyée telle quelle.</summary>
    public static string Normalize(string value)
    {
        var trimmed = value.Trim();
        return trimmed.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
            ? FromUrl(trimmed)
            : trimmed;
    }

    /// <summary>
    /// "postgres://user:pass@host:5432/db?sslmode=require" -> "Host=host;Port=5432;Database=db;Username=user;Password=pass;SSL Mode=Require".
    /// Sans précision dans l'URL, le chiffrement SSL est exigé (obligatoire chez Neon).
    /// </summary>
    public static string FromUrl(string url)
    {
        var uri = new Uri(url);
        var userInfo = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            // Schéma inconnu de .NET : sans port explicite, Uri.Port vaut -1
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            // Les caractères spéciaux d'un identifiant ou d'un mot de passe sont encodés dans une URL (%40 pour @…)
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : null,
            SslMode = SslMode.Require
        };

        foreach (var (key, value) in ParseQuery(uri.Query))
        {
            switch (key)
            {
                case "sslmode":
                    builder.SslMode = value switch
                    {
                        "disable" => SslMode.Disable,
                        "allow" => SslMode.Allow,
                        "prefer" => SslMode.Prefer,
                        "verify-ca" => SslMode.VerifyCA,
                        "verify-full" => SslMode.VerifyFull,
                        _ => SslMode.Require
                    };
                    break;
                case "channel_binding":
                    builder.ChannelBinding = value switch
                    {
                        "require" => ChannelBinding.Require,
                        "disable" => ChannelBinding.Disable,
                        _ => ChannelBinding.Prefer
                    };
                    break;
            }
        }

        return builder.ConnectionString;
    }

    private static IEnumerable<(string Key, string Value)> ParseQuery(string query) =>
        query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(pair => pair.Split('=', 2))
            .Select(parts => (
                Uri.UnescapeDataString(parts[0]).ToLowerInvariant(),
                parts.Length > 1 ? Uri.UnescapeDataString(parts[1]).ToLowerInvariant() : string.Empty));
}
