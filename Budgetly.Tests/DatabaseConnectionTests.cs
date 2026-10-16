using Budgetly.Api.Extensions;
using Budgetly.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Budgetly.Tests;

/// <summary>
/// Conversion de DATABASE_URL (format Vercel / Neon) et choix de la chaîne de connexion.
/// Les identifiants ci-dessous sont factices.
/// </summary>
public class DatabaseConnectionTests
{
    private static NpgsqlConnectionStringBuilder Parse(string url) => new(DatabaseConnection.FromUrl(url));

    [Fact]
    public void Url_Neon_est_convertie_avec_SSL_exige()
    {
        var builder = Parse("postgresql://alice:secret@ep-test-123-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

        Assert.Equal("ep-test-123-pooler.eu-central-1.aws.neon.tech", builder.Host);
        Assert.Equal(5432, builder.Port);
        Assert.Equal("neondb", builder.Database);
        Assert.Equal("alice", builder.Username);
        Assert.Equal("secret", builder.Password);
        Assert.Equal(SslMode.Require, builder.SslMode);
        Assert.Equal(ChannelBinding.Require, builder.ChannelBinding);
    }

    [Fact]
    public void Sans_sslmode_le_SSL_est_exige_par_defaut()
    {
        var builder = Parse("postgres://bob:pw@db.example.com:6543/budgetly");

        Assert.Equal(6543, builder.Port);
        Assert.Equal(SslMode.Require, builder.SslMode);
    }

    [Fact]
    public void Caracteres_speciaux_encodes_dans_l_url_sont_decodes()
    {
        var builder = Parse("postgres://user%40mail:p%40ss%3Aw%2Frd@localhost/my%20db?sslmode=disable");

        Assert.Equal("user@mail", builder.Username);
        Assert.Equal("p@ss:w/rd", builder.Password);
        Assert.Equal("my db", builder.Database);
        Assert.Equal(SslMode.Disable, builder.SslMode);
    }

    [Fact]
    public void Chaine_Npgsql_classique_est_gardee_telle_quelle()
    {
        const string connectionString = "Host=localhost;Port=5432;Database=budgetly;Username=budgetly;Password=x";

        Assert.Equal(connectionString, DatabaseConnection.Normalize(connectionString));
    }

    [Theory]
    [InlineData(true, true, true, "connection")]     // --connection gagne toujours
    [InlineData(false, true, true, "DATABASE_URL")]  // puis DATABASE_URL (Vercel / Neon)
    [InlineData(false, false, true, "DefaultConnection")]
    public void Ordre_de_priorite_des_sources(bool withOption, bool withUrl, bool withDefault, string expected)
    {
        var values = new Dictionary<string, string?>();
        if (withOption) values["connection"] = "Host=from-option;Database=a";
        if (withUrl) values["DATABASE_URL"] = "postgres://u:p@from-url/b";
        if (withDefault) values["ConnectionStrings:DefaultConnection"] = "Host=from-default;Database=c";
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        var host = new NpgsqlConnectionStringBuilder(DatabaseConnection.Resolve(configuration)).Host;

        var expectedHost = expected switch
        {
            "connection" => "from-option",
            "DATABASE_URL" => "from-url",
            _ => "from-default"
        };
        Assert.Equal(expectedHost, host);
    }

    [Fact]
    public void Aucune_source_renvoie_null()
    {
        var configuration = new ConfigurationBuilder().Build();

        Assert.Null(DatabaseConnection.Resolve(configuration));
    }

    [Theory]
    [InlineData(PostgresErrorCodes.UniqueViolation, true)]       // 23505 : doublon
    [InlineData(PostgresErrorCodes.ForeignKeyViolation, false)]  // 23503 : autre erreur
    public void Doublon_PostgreSQL_reconnu_par_son_code_SQLSTATE(string sqlState, bool expected)
    {
        var postgresError = new PostgresException("erreur simulée", "ERROR", "ERROR", sqlState);
        var exception = new DbUpdateException("échec de l'enregistrement", postgresError);

        Assert.Equal(expected, exception.IsUniqueConstraintViolation());
    }
}
