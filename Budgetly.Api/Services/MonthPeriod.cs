namespace Budgetly.Api.Services;

// Un mois précis (ex. octobre 2026), avec ses bornes de dates [Start, End[
public readonly record struct MonthPeriod(int Year, int Month)
{
    public DateOnly Start => new(Year, Month, 1);

    // 1er jour du mois suivant (exclu)
    public DateOnly End => Start.AddMonths(1);

    // Mois en cours selon l'heure du serveur
    public static MonthPeriod Current()
    {
        var today = DateTime.Today;
        return new MonthPeriod(today.Year, today.Month);
    }

    public MonthPeriod AddMonths(int months)
    {
        var start = Start.AddMonths(months);
        return new MonthPeriod(start.Year, start.Month);
    }
}
