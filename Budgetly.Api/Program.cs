using System.Text;
using System.Text.Json.Serialization;
using Budgetly.Api.Data;
using Budgetly.Api.Infrastructure;
using Budgetly.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

const string FrontendCorsPolicy = "Frontend";
const string SeedDemoArgument = "--seed-demo";

// "dotnet run -- --seed-demo" : crée le compte démo puis s'arrête (voir plus bas).
// L'argument est retiré avant de construire l'application : la configuration ne doit pas le lire.
var seedDemo = args.Contains(SeedDemoArgument);
var builder = WebApplication.CreateBuilder(args.Where(arg => arg != SeedDemoArgument).ToArray());

// La clé n'est pas dans appsettings.json : en développement elle vient de "dotnet user-secrets"
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key est manquante. Configurez-la avec : dotnet user-secrets set \"Jwt:Key\" \"<clé>\"");

// Add services to the container.

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AlertService>();

// Toute exception non gérée devient une réponse ProblemDetails propre (jamais de pile d'appels)
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// 5 tentatives par minute et par IP sur /api/auth/login et /api/auth/register
builder.Services.AddAuthRateLimiting();

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
        policy.WithOrigins("http://localhost:5173")
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
    // Uniquement en développement : on ne veut jamais créer un compte au mot de passe connu en production
    if (!app.Environment.IsDevelopment())
    {
        app.Logger.LogError("{Argument} n'est autorisé qu'en environnement Development.", SeedDemoArgument);
        return 1;
    }

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var alertService = scope.ServiceProvider.GetRequiredService<AlertService>();
    var summary = await DemoSeeder.SeedAsync(db, alertService, DateOnly.FromDateTime(DateTime.Today));
    app.Logger.LogInformation("Compte démo prêt : {Email} / {Password} ({Summary})", DemoSeeder.Email, DemoSeeder.Password, summary);
    return 0;
}

// Configure the HTTP request pipeline.

// En premier : attrape les exceptions de tout ce qui suit
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

// Sonde de santé pour un hébergeur ou un outil de supervision
app.MapGet("/health", () => Results.Text("OK"));

app.Run();
return 0;
