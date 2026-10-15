using System.Linq.Expressions;
using Budgetly.Api.Models;

namespace Budgetly.Api.Dtos;

public class AlertDto
{
    public int Id { get; set; }
    public int Level { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public int BudgetId { get; set; }

    public static readonly Expression<Func<Alert, AlertDto>> Projection = a => new AlertDto
    {
        Id = a.Id,
        Level = a.Level,
        Message = a.Message,
        IsRead = a.IsRead,
        // SQL Server ne garde pas le "Kind" : on indique que la date lue est en UTC (renvoyée avec un "Z")
        CreatedAt = DateTime.SpecifyKind(a.CreatedAt, DateTimeKind.Utc),
        BudgetId = a.BudgetId
    };
}
