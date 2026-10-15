using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Budgetly.Api.Models;

public class Budget
{
    public int Id { get; set; }

    [Precision(10, 3)]
    public decimal Limit { get; set; }

    [Range(1, 12)]
    public int Month { get; set; }

    public int Year { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}
