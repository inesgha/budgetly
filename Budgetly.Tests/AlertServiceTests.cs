using Budgetly.Api.Data;
using Budgetly.Api.Models;
using Budgetly.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Budgetly.Tests;

/// <summary>
/// AlertService.CheckBudgetAsync, sur une base EF Core "InMemory" neuve pour chaque test.
/// Scénario de base : un budget Alimentation de 100 DT en octobre 2026.
/// </summary>
public class AlertServiceTests
{
    private const int Month = 10;
    private const int Year = 2026;

    private readonly AppDbContext _db;
    private readonly AlertService _service;
    private readonly User _user;
    private readonly Category _food;
    private readonly Category _salary;

    // xUnit crée une nouvelle instance de la classe pour chaque test : chaque test a sa propre base
    public AlertServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _service = new AlertService(_db);

        _user = new User { Name = "Ines", Email = "ines@example.com", PasswordHash = "x", Currency = "DT" };
        _food = new Category { Name = "Alimentation", Type = TransactionType.Expense, User = _user };
        _salary = new Category { Name = "Bourse", Type = TransactionType.Income, User = _user };
        _db.AddRange(_user, _food, _salary);
        _db.SaveChanges();
    }

    private async Task<Budget> AddBudgetAsync(decimal limit = 100m)
    {
        var budget = new Budget { UserId = _user.Id, CategoryId = _food.Id, Limit = limit, Month = Month, Year = Year };
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();
        return budget;
    }

    private async Task AddTransactionAsync(decimal amount, Category? category = null, DateOnly? date = null, int? userId = null)
    {
        category ??= _food;
        _db.Transactions.Add(new Transaction
        {
            UserId = userId ?? _user.Id,
            CategoryId = category.Id,
            Type = category.Type,
            Amount = amount,
            Date = date ?? new DateOnly(Year, Month, 15)
        });
        await _db.SaveChangesAsync();
    }

    private Task CheckAsync() => _service.CheckBudgetAsync(_user.Id, _food.Id, Month, Year);

    private Task<List<int>> LevelsAsync() =>
        _db.Alerts.OrderBy(a => a.Level).Select(a => a.Level).ToListAsync();

    [Fact]
    public async Task Sans_budget_aucune_alerte()
    {
        await AddTransactionAsync(500m);

        await CheckAsync();

        Assert.Empty(await LevelsAsync());
    }

    [Fact]
    public async Task Sous_80_pourcent_aucune_alerte()
    {
        await AddBudgetAsync();
        await AddTransactionAsync(79.999m);

        await CheckAsync();

        Assert.Empty(await LevelsAsync());
    }

    [Fact]
    public async Task A_80_pourcent_pile_cree_l_alerte_80()
    {
        var budget = await AddBudgetAsync();
        await AddTransactionAsync(80m);

        await CheckAsync();

        var alert = Assert.Single(await _db.Alerts.ToListAsync());
        Assert.Equal(80, alert.Level);
        Assert.Equal(budget.Id, alert.BudgetId);
        Assert.Equal(_user.Id, alert.UserId);
        Assert.False(alert.IsRead);
        Assert.Equal("Alimentation : 80 % du budget atteint (80,000 / 100,000 DT)", alert.Message);
    }

    [Fact]
    public async Task Entre_80_et_100_pourcent_seulement_l_alerte_80()
    {
        await AddBudgetAsync();
        await AddTransactionAsync(85m);

        await CheckAsync();

        Assert.Equal(new[] { 80 }, await LevelsAsync());
        Assert.Contains("85 %", (await _db.Alerts.SingleAsync()).Message);
    }

    [Fact]
    public async Task A_100_pourcent_pile_cree_les_alertes_80_et_100()
    {
        await AddBudgetAsync();
        await AddTransactionAsync(100m);

        await CheckAsync();

        Assert.Equal(new[] { 80, 100 }, await LevelsAsync());
    }

    [Fact]
    public async Task Relancer_la_verification_ne_cree_pas_de_doublon()
    {
        await AddBudgetAsync();
        await AddTransactionAsync(105m);

        await CheckAsync();
        await CheckAsync();
        await CheckAsync();

        Assert.Equal(new[] { 80, 100 }, await LevelsAsync());
    }

    [Fact]
    public async Task Le_seuil_100_s_ajoute_sans_dupliquer_l_alerte_80()
    {
        await AddBudgetAsync();
        await AddTransactionAsync(85m);
        await CheckAsync();

        // Nouvelle dépense : le budget passe de 85 % à 105 %
        await AddTransactionAsync(20m);
        await CheckAsync();

        Assert.Equal(new[] { 80, 100 }, await LevelsAsync());
    }

    [Fact]
    public async Task Seules_les_depenses_du_mois_de_l_utilisateur_et_de_la_categorie_comptent()
    {
        await AddBudgetAsync();
        await AddTransactionAsync(50m);                                         // compte : 50 DT
        await AddTransactionAsync(500m, category: _salary);                     // revenu : ignoré
        await AddTransactionAsync(500m, date: new DateOnly(Year, Month + 1, 1)); // autre mois : ignoré
        await AddTransactionAsync(500m, date: new DateOnly(Year, Month - 1, 30));

        var otherUser = new User { Name = "Autre", Email = "autre@example.com", PasswordHash = "x" };
        _db.Users.Add(otherUser);
        await _db.SaveChangesAsync();
        await AddTransactionAsync(500m, userId: otherUser.Id);                  // autre utilisateur : ignoré

        await CheckAsync();

        Assert.Empty(await LevelsAsync());
    }

    [Fact]
    public async Task Le_budget_d_un_autre_mois_n_est_pas_verifie()
    {
        await AddBudgetAsync();
        await AddTransactionAsync(150m);

        await _service.CheckBudgetAsync(_user.Id, _food.Id, Month + 1, Year);

        Assert.Empty(await LevelsAsync());
    }
}
