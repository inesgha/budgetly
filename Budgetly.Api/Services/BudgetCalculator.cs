namespace Budgetly.Api.Services;

// Règles de calcul partagées par les budgets (affichage) et les alertes
public static class BudgetCalculator
{
    public const int WarningLevel = 80;
    public const int ReachedLevel = 100;

    // Pourcentage dépensé, arrondi à l'entier (86,5 % -> 87 %)
    public static int Percent(decimal spent, decimal limit) =>
        limit <= 0 ? 0 : (int)Math.Round(spent * 100 / limit, MidpointRounding.AwayFromZero);

    // Comparaison exacte des montants, sans passer par le pourcentage arrondi
    public static bool HasReachedLevel(decimal spent, decimal limit, int level) =>
        spent * 100 >= limit * level;

    public static string Status(decimal spent, decimal limit)
    {
        if (spent > limit) return "exceeded";
        if (spent == limit) return "reached";
        if (HasReachedLevel(spent, limit, WarningLevel)) return "warning";
        return "ok";
    }
}
