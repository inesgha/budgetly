using Budgetly.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Budgetly.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Alert> Alerts => Set<Alert>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Un email ne peut être utilisé que par un seul compte
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Un seul budget par catégorie et par mois
        modelBuilder.Entity<Budget>()
            .HasIndex(b => new { b.CategoryId, b.Month, b.Year })
            .IsUnique();

        // Pas de suppression en cascade : évite l'erreur SQL Server "multiple cascade paths"
        foreach (var foreignKey in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            foreignKey.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }
}
