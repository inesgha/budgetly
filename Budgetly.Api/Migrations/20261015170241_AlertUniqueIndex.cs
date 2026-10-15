using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Budgetly.Api.Migrations
{
    /// <inheritdoc />
    public partial class AlertUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Alerts_BudgetId",
                table: "Alerts");

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_BudgetId_Level",
                table: "Alerts",
                columns: new[] { "BudgetId", "Level" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Alerts_BudgetId_Level",
                table: "Alerts");

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_BudgetId",
                table: "Alerts",
                column: "BudgetId");
        }
    }
}
