using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectPortfolio.Migrations
{
    /// <inheritdoc />
    public partial class FixTestimonialForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Testimonials_Projects_ProjectId1",
                table: "Testimonials");

            migrationBuilder.DropIndex(
                name: "IX_Testimonials_ProjectId1",
                table: "Testimonials");

            migrationBuilder.DropColumn(
                name: "ProjectId1",
                table: "Testimonials");

            migrationBuilder.AlterColumn<int>(
                name: "ProjectId",
                table: "Testimonials",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_Testimonials_ProjectId",
                table: "Testimonials",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_Testimonials_Projects_ProjectId",
                table: "Testimonials",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "ProjectId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Testimonials_Projects_ProjectId",
                table: "Testimonials");

            migrationBuilder.DropIndex(
                name: "IX_Testimonials_ProjectId",
                table: "Testimonials");

            migrationBuilder.AlterColumn<string>(
                name: "ProjectId",
                table: "Testimonials",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "ProjectId1",
                table: "Testimonials",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Testimonials_ProjectId1",
                table: "Testimonials",
                column: "ProjectId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Testimonials_Projects_ProjectId1",
                table: "Testimonials",
                column: "ProjectId1",
                principalTable: "Projects",
                principalColumn: "ProjectId");
        }
    }
}
