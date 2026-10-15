using System.Linq.Expressions;
using Budgetly.Api.Models;

namespace Budgetly.Api.Dtos;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public TransactionType Type { get; set; }

    // Utilisée dans les requêtes EF : seules les colonnes nécessaires sont lues en SQL
    public static readonly Expression<Func<Category, CategoryDto>> Projection = c => new CategoryDto
    {
        Id = c.Id,
        Name = c.Name,
        Color = c.Color,
        Icon = c.Icon,
        Type = c.Type
    };

    private static readonly Func<Category, CategoryDto> FromCategoryCompiled = Projection.Compile();

    // Même conversion, pour une entité déjà chargée en mémoire
    public static CategoryDto FromCategory(Category category) => FromCategoryCompiled(category);
}
