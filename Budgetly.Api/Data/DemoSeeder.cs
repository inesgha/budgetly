using Budgetly.Api.Models;
using Budgetly.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Budgetly.Api.Data;

/// <summary>
/// Compte de démonstration : une étudiante tunisienne avec 6 mois de revenus, de dépenses, de budgets et d'alertes.
/// Lancé uniquement par la commande explicite "dotnet run -- --seed-demo" (voir Program.cs), quel que soit l'environnement.
/// Relancé, il supprime puis recrée UNIQUEMENT le compte démo (filtre sur son UserId) : les autres comptes ne sont jamais touchés.
/// </summary>
public static class DemoSeeder
{
    public const string Email = "demo@budgetly.tn";
    public const string Password = "Demo1234!";
    private const string Name = "Yasmine Trabelsi";
    private const int MonthsOfHistory = 6;

    // Loyer mensuel : dépense fixe, avec un budget exactement égal (statut "Atteint", jamais "Dépassé")
    private const decimal Rent = 200m;

    // Limites mensuelles des budgets des dépenses variables (générées ci-dessous en part de chaque budget)
    private static readonly Dictionary<string, decimal> BudgetLimits = new()
    {
        ["Alimentation"] = 230m,
        ["Transport"] = 90m,
        ["Loisirs"] = 70m,
        ["Études"] = 50m,
        ["Shopping"] = 80m
    };

    // Part de chaque budget dépensée, du mois le plus ancien (index 0) au mois en cours (index 5).
    // Choisie à la main pour obtenir des statuts variés : > 0,8 = alerte 80 %, > 1 = budget dépassé.
    private static readonly Dictionary<string, decimal[]> SpendingRatios = new()
    {
        ["Alimentation"] = new[] { 0.84m, 0.93m, 0.78m, 1.04m, 0.86m, 0.87m },
        ["Transport"] = new[] { 0.72m, 0.81m, 0.66m, 0.88m, 0.74m, 1.13m },
        ["Loisirs"] = new[] { 0.55m, 0.62m, 0.95m, 0.48m, 0.82m, 0.46m },
        ["Études"] = new[] { 0.90m, 0.35m, 0.50m, 0.60m, 0.44m, 0.38m },
        ["Shopping"] = new[] { 0.40m, 1.12m, 0.30m, 0.70m, 0.58m, 0.22m }
    };

    // Libellés réalistes et fourchette de prix (en DT) par catégorie de dépense
    private static readonly Dictionary<string, (string[] Labels, int Min, int Max)> ExpenseTemplates = new()
    {
        ["Alimentation"] = (new[]
        {
            "Courses Monoprix", "Marché de Mahdia", "Courses Carrefour Market", "Boulangerie", "Sandwich chapati",
            "Lablebi au resto du coin", "Café avec les copines", "Fruits et légumes", "Pizza du vendredi", "Supérette du quartier"
        }, 3, 40),
        ["Transport"] = (new[]
        {
            "Louage Mahdia → Sousse", "Louage Mahdia → Monastir", "Louage retour chez les parents", "Taxi collectif",
            "Bus vers l'ISET", "Taxi jusqu'à la gare routière"
        }, 2, 14),
        ["Loisirs"] = (new[]
        {
            "Sortie à la plage", "Cinéma à Sousse", "Crêpes entre amies", "Abonnement streaming",
            "Anniversaire d'une amie", "Café en terrasse"
        }, 5, 25),
        ["Études"] = (new[]
        {
            "Photocopies des cours", "Impression du rapport de stage", "Clé USB 64 Go", "Livre d'algorithmique",
            "Recharge internet 4G", "Cahiers et stylos"
        }, 2, 25),
        ["Shopping"] = (new[]
        {
            "Friperie", "Chaussures", "Pull d'hiver", "Cadeau pour maman", "Produits de beauté", "Coque de téléphone"
        }, 10, 45)
    };

    private static readonly string[] TutoringLabels =
    {
        "Cours de maths – élève de 9e", "Cours d'anglais – préparation du bac", "Cours d'informatique – lycéen"
    };

    /// <param name="today">Date du jour (paramètre pour pouvoir tester avec une date fixe)</param>
    /// <returns>Un résumé de ce qui a été créé</returns>
    public static async Task<string> SeedAsync(AppDbContext db, AlertService alertService, DateOnly today)
    {
        // Avec EnableRetryOnFailure, une transaction ouverte à la main doit passer par la "stratégie d'exécution" :
        // si la connexion tombe (base Neon qui se réveille), EF rejoue TOUT le bloc depuis le début.
        var strategy = db.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            // Une tentative précédente a pu laisser des entités en mémoire : on repart de zéro
            db.ChangeTracker.Clear();

            // Tout ou rien : en cas d'erreur, l'ancien compte démo reste intact
            await using var dbTransaction = await db.Database.BeginTransactionAsync();
            var summary = await SeedInTransactionAsync(db, alertService, today);
            await dbTransaction.CommitAsync();
            return summary;
        });
    }

    private static async Task<string> SeedInTransactionAsync(AppDbContext db, AlertService alertService, DateOnly today)
    {
        await DeleteDemoAccountAsync(db);

        var user = new User
        {
            Name = Name,
            Email = Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Password),
            Categories = DefaultCategories.Create()
        };
        user.Categories.Add(new Category { Name = "Cours particuliers", Color = "#2C8C99", Type = TransactionType.Income });
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var categories = user.Categories.ToDictionary(c => c.Name);
        // Graine fixe : les mêmes données à chaque exécution (seules les dates suivent le jour courant)
        var random = new Random(2026);
        int transactionCount = 0, budgetCount = 0;

        var currentMonth = new MonthPeriod(today.Year, today.Month);
        for (var index = 0; index < MonthsOfHistory; index++)
        {
            var period = currentMonth.AddMonths(index - (MonthsOfHistory - 1));
            var isCurrentMonth = period == currentMonth;
            // Pas de transaction dans le futur : le mois en cours s'arrête à aujourd'hui
            var lastDay = isCurrentMonth ? today.Day : DateTime.DaysInMonth(period.Year, period.Month);

            // Jour au hasard parmi les jours écoulés du mois (sinon, ce mois-ci, tout tomberait sur aujourd'hui)
            int RandomDay(int from = 2) => random.Next(Math.Min(from, lastDay), lastDay + 1);

            var transactions = new List<Transaction>();
            void Add(string categoryName, decimal amount, int day, string note)
            {
                var category = categories[categoryName];
                transactions.Add(new Transaction
                {
                    UserId = user.Id,
                    CategoryId = category.Id,
                    Type = category.Type,
                    Amount = amount,
                    Date = new DateOnly(period.Year, period.Month, Math.Min(day, lastDay)),
                    Note = note
                });
            }

            // Revenus
            Add("Famille", 300m, 1, "Virement des parents");
            Add("Bourse", 250m, 10, "Bourse de l'État");
            var lessons = random.Next(2, 5);
            for (var i = 0; i < lessons; i++)
            {
                Add("Cours particuliers", random.Next(6, 10) * 5m, RandomDay(3), TutoringLabels[random.Next(TutoringLabels.Length)]);
            }

            // Dépenses : le loyer, puis chaque catégorie jusqu'à la part prévue de son budget
            Add("Loyer", Rent, 1, "Loyer du studio");
            foreach (var (categoryName, limit) in BudgetLimits)
            {
                var target = RoundToHalf(limit * SpendingRatios[categoryName][index]);
                var (labels, min, max) = ExpenseTemplates[categoryName];
                foreach (var amount in SplitAmount(target, min, max, random))
                {
                    Add(categoryName, amount, RandomDay(), labels[random.Next(labels.Length)]);
                }
            }

            db.Transactions.AddRange(transactions);
            var budgets = BudgetLimits
                .Append(new KeyValuePair<string, decimal>("Loyer", Rent))
                .Select(b => new Budget
                {
                    UserId = user.Id,
                    CategoryId = categories[b.Key].Id,
                    Limit = b.Value,
                    Month = period.Month,
                    Year = period.Year
                }).ToList();
            db.Budgets.AddRange(budgets);
            await db.SaveChangesAsync();

            transactionCount += transactions.Count;
            budgetCount += budgets.Count;

            // Les alertes sont créées par le vrai service, comme dans l'application
            foreach (var budget in budgets)
            {
                await alertService.CheckBudgetAsync(user.Id, budget.CategoryId, period.Month, period.Year);
            }

            await BackdateAlertsAsync(db, budgets, transactions, markAsRead: !isCurrentMonth);
        }

        var alertCount = await db.Alerts.CountAsync(a => a.UserId == user.Id);
        return $"{transactionCount} transactions, {budgetCount} budgets et {alertCount} alertes sur {MonthsOfHistory} mois";
    }

    // Supprime le compte démo et toutes ses données, en filtrant TOUJOURS sur son identifiant
    private static async Task DeleteDemoAccountAsync(AppDbContext db)
    {
        var demoUserId = await db.Users
            .Where(u => u.Email == Email)
            .Select(u => (int?)u.Id)
            .SingleOrDefaultAsync();

        if (demoUserId is not int userId)
        {
            return;
        }

        // Ordre imposé par les clés étrangères (pas de suppression en cascade) : des enfants vers le parent
        await db.Alerts.Where(a => a.UserId == userId).ExecuteDeleteAsync();
        await db.Budgets.Where(b => b.UserId == userId).ExecuteDeleteAsync();
        await db.Transactions.Where(t => t.UserId == userId).ExecuteDeleteAsync();
        await db.Categories.Where(c => c.UserId == userId).ExecuteDeleteAsync();
        await db.Users.Where(u => u.Id == userId).ExecuteDeleteAsync();
    }

    // Découpe un montant en achats compris entre min et max DT (multiples de 0,5 DT), dont la somme vaut exactement total
    private static IEnumerable<decimal> SplitAmount(decimal total, int min, int max, Random random)
    {
        var remaining = total;
        while (remaining > 0)
        {
            if (remaining <= max)
            {
                yield return remaining;
                yield break;
            }

            var amount = RoundToHalf(min + (decimal)random.NextDouble() * (max - min));
            remaining -= amount;
            yield return amount;
        }
    }

    private static decimal RoundToHalf(decimal value) => Math.Round(value * 2, MidpointRounding.AwayFromZero) / 2;

    /// <summary>
    /// AlertService date les alertes d'aujourd'hui : on leur donne le jour où le seuil a vraiment été franchi.
    /// Les alertes des mois passés sont marquées comme lues (seules celles du mois en cours restent à lire).
    /// </summary>
    private static async Task BackdateAlertsAsync(AppDbContext db, List<Budget> budgets, List<Transaction> transactions, bool markAsRead)
    {
        var budgetIds = budgets.Select(b => b.Id).ToList();
        var alerts = await db.Alerts.Where(a => budgetIds.Contains(a.BudgetId)).ToListAsync();

        foreach (var alert in alerts)
        {
            var budget = budgets.Single(b => b.Id == alert.BudgetId);
            var threshold = budget.Limit * alert.Level / 100m;

            // Cumul des dépenses de la catégorie, jour après jour, jusqu'au franchissement du seuil
            var spent = 0m;
            foreach (var transaction in transactions.Where(t => t.CategoryId == budget.CategoryId).OrderBy(t => t.Date))
            {
                spent += transaction.Amount;
                if (spent >= threshold)
                {
                    var crossedAt = transaction.Date.ToDateTime(new TimeOnly(18, 30), DateTimeKind.Utc);
                    alert.CreatedAt = crossedAt < DateTime.UtcNow ? crossedAt : DateTime.UtcNow;
                    break;
                }
            }

            alert.IsRead = markAsRead;
        }

        await db.SaveChangesAsync();
    }
}
