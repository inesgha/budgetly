using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Budgetly.Api.Extensions;

public static class DbUpdateExceptionExtensions
{
    // Codes SQL Server : 2601 = doublon dans un index unique, 2627 = doublon dans une contrainte unique
    public static bool IsUniqueConstraintViolation(this DbUpdateException exception) =>
        exception.InnerException is SqlException { Number: 2601 or 2627 };
}
