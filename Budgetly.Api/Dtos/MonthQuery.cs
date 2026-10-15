using System.ComponentModel.DataAnnotations;
using Budgetly.Api.Services;

namespace Budgetly.Api.Dtos;

// Paramètres ?month=&year= : chacun prend la valeur du mois en cours s'il est absent
public class MonthQuery
{
    [Range(1, 12, ErrorMessage = "Le mois doit être entre 1 et 12.")]
    public int? Month { get; set; }

    [Range(2000, 2100, ErrorMessage = "L'année doit être entre 2000 et 2100.")]
    public int? Year { get; set; }

    public MonthPeriod ToPeriod()
    {
        var current = MonthPeriod.Current();
        return new MonthPeriod(Year ?? current.Year, Month ?? current.Month);
    }
}
