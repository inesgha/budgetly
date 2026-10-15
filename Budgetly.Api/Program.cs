using System.Text;
using System.Text.Json.Serialization;
using Budgetly.Api.Data;
using Budgetly.Api.Infrastructure;
using Budgetly.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

const string FrontendCorsPolicy = "Frontend";
const string SeedDemoArgument = "--seed-demo";

// "dotnet run -- --seed-demo" : crée le compte démo puis s'arrête (voir plus bas).
// L'argument est retiré avant de construire l'application : la configuration ne doit pas le lire.
var seedDemo = args.Contains(SeedDemoArgument);
var builder = WebApplication.CreateBuilder(args.Where(arg => arg != SeedDemoArgument).ToArray());

// Secrets et réglages lus dans la configuration : user-secrets en développement,
// variables d'environnement en production (ConnectionStrings__DefaultConnection, Jwt__Key, Cors__AllowedOrigins__0)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection est manquante. En production, définissez la variable ConnectionStrings__DefaultConnection.");
}

var jwtKey = builder.Configuration["Jwt:Key"];
// HMAC-SHA256 exige une clé d'au moins 256 bits (32 octets) : sinon chaque connexion échouerait plus tard
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key est manquante ou trop courte (32 caractères minimum, 64 conseillés). "
        + "En développement : dotnet user-secrets set \"Jwt:Key\" \"<clé>\" ; en production : variable Jwt__Key.");
}

// Sites autorisés à appeler l'API depuis un navigateur (sans "/" final)
var allowedOrigins = (builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim().TrimEnd('/'))
    .ToArray();

// Add services to the container.

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sql =>
        // Azure SQL serverless peut être en pause : la première connexion échoue le temps du réveil.
        // EF Core réessaie alors automatiquement (6 fois, en attendant de plus en plus longtemps).
        sql.EnableRetryOnFailure(maxRetryCount: 6, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)));

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AlertService>();

// Toute exception non gérée devient une réponse ProblemDetails propre (jamais de pile d'appels)
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// 5 tentatives par minute et par IP sur /api/auth/login et /api/auth/register
builder.Services.AddAuthRateLimiting();

// Derrière le proxy d'Azure App Service, la vraie IP du visiteur et le protocole (https) arrivent dans les
// en-têtes X-Forwarded-For / X-Forwarded-Proto. ForwardLimit = 1 : on ne lit que la dernière valeur, ajoutée
// par Azure, et non celles qu'un visiteur pourrait inventer.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});
builder.Services.AddHttpsRedirection(options => options.HttpsPort = 443);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Garde les noms de claims du JWT tels quels ("sub", "email", "name")
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
            NameClaimType = JwtRegisteredClaimNames.Name
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddControllers()
    // Les enums circulent en texte dans le JSON ("Expense"/"Income") plutôt qu'en nombre (0/1)
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

if (seedDemo)
{
    // Possible dans tous les environnements (pour remplir la base Azure depuis son PC),
    // mais uniquement sur demande explicite : jamais au démarrage normal de l'API.
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var alertService = scope.ServiceProvider.GetRequiredService<AlertService>();
    app.Logger.LogInformation("Création du compte démo (environnement {Environment})…", app.Environment.EnvironmentName);
    var summary = await DemoSeeder.SeedAsync(db, alertService, DateOnly.FromDateTime(DateTime.Today));
    app.Logger.LogInformation("Compte démo prêt : {Email} ({Summary})", DemoSeeder.Email, summary);
    return 0;
}

if (allowedOrigins.Length == 0)
{
    app.Logger.LogWarning("Aucune origine CORS configurée (Cors:AllowedOrigins) : le front ne pourra pas appeler l'API.");
}

// Configure the HTTP request pipeline.

if (!app.Environment.IsDevelopment())
{
    // Tout en premier : les middlewares suivants voient la vraie IP et le vrai protocole
    app.UseForwardedHeaders();
}

// Attrape les exceptions de tout ce qui suit
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    // En développement, l'API tourne en HTTP seul : la redirection n'aurait pas de port HTTPS
    // ("Failed to determine the https port"). En production, tout passe en HTTPS.
    app.UseHttpsRedirection();
}

app.UseCors(FrontendCorsPolicy);

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Sonde de santé : vérifie que l'API répond (sans toucher à la base, pour ne pas la réveiller)
app.MapGet("/health", () => Results.Text("OK"));

app.Run();
return 0;
