using System.Globalization;
using Budgetly.Api.Services;

namespace Budgetly.Tests;

/// <summary>
/// Statut d'un budget : ok (&lt; 80 %), warning (≥ 80 %), reached (= 100 %), exceeded (&gt; 100 %).
/// Les montants sont passés en texte car C# n'accepte pas de decimal dans un attribut.
/// </summary>
public class BudgetCalculatorTests
{
    private static decimal D(string value) => decimal.Parse(value, CultureInfo.InvariantCulture);

    [Theory]
    [InlineData("0", "100", "ok")]
    [InlineData("79.999", "100", "ok")]         // 1 millime sous le seuil
    [InlineData("80", "100", "warning")]        // limite exacte : 80 %
    [InlineData("99.999", "100", "warning")]    // 1 millime sous 100 %
    [InlineData("100", "100", "reached")]       // limite exacte : 100 %
    [InlineData("100.001", "100", "exceeded")]  // 1 millime au-dessus
    [InlineData("150", "100", "exceeded")]
    [InlineData("184", "230", "warning")]       // 80 % pile d'une limite non ronde
    [InlineData("183.999", "230", "ok")]
    public void Status_compare_les_montants_exacts(string spent, string limit, string expected)
    {
        Assert.Equal(expected, BudgetCalculator.Status(D(spent), D(limit)));
    }

    [Fact]
    public void Status_ne_se_fie_pas_au_pourcentage_arrondi()
    {
        // 79,6 % s'affiche "80 %" une fois arrondi, mais le seuil n'est pas atteint
        Assert.Equal(80, BudgetCalculator.Percent(79.6m, 100m));
        Assert.Equal("ok", BudgetCalculator.Status(79.6m, 100m));
    }

    [Theory]
    [InlineData("86.5", "100", 87)]   // arrondi "commercial" : 0,5 vers le haut
    [InlineData("85.4", "100", 85)]
    [InlineData("214", "250", 86)]
    [InlineData("105", "100", 105)]
    [InlineData("10", "0", 0)]        // limite nulle : pas de division par zéro
    public void Percent_arrondit_a_l_entier(string spent, string limit, int expected)
    {
        Assert.Equal(expected, BudgetCalculator.Percent(D(spent), D(limit)));
    }

    [Theory]
    [InlineData("80", 80, true)]
    [InlineData("79.999", 80, false)]
    [InlineData("100", 100, true)]
    [InlineData("99.999", 100, false)]
    public void HasReachedLevel_inclut_le_seuil_exact(string spent, int level, bool expected)
    {
        Assert.Equal(expected, BudgetCalculator.HasReachedLevel(D(spent), 100m, level));
    }
}
