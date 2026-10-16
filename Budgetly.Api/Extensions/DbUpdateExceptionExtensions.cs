using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Budgetly.Api.Extensions;

public static class DbUpdateExceptionExtensions
{
    // PostgreSQL : code SQLSTATE 23505 = "unique_violation" (doublon dans un index ou une contrainte unique)
    public static bool IsUniqueConstraintViolation(this DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
