﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectPortfolio.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTestimonialProjectLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Testimonials_Projects_ProjectName",
                table: "Testimonials");

            migrationBuilder.DropIndex(
                name: "IX_Testimonials_ProjectName",
                table: "Testimonials");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Projects_Title",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ProjectName",
                table: "Testimonials");

            migrationBuilder.AddColumn<string>(
                name: "ProjectId",
                table: "Testimonials",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ProjectId1",
                table: "Testimonials",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Projects",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Testimonials_Projects_ProjectId1",
                table: "Testimonials");

            migrationBuilder.DropIndex(
                name: "IX_Testimonials_ProjectId1",
                table: "Testimonials");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "Testimonials");

            migrationBuilder.DropColumn(
                name: "ProjectId1",
                table: "Testimonials");

            migrationBuilder.AddColumn<string>(
                name: "ProjectName",
                table: "Testimonials",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Projects",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Projects_Title",
                table: "Projects",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_Testimonials_ProjectName",
                table: "Testimonials",
                column: "ProjectName");

            migrationBuilder.AddForeignKey(
                name: "FK_Testimonials_Projects_ProjectName",
                table: "Testimonials",
                column: "ProjectName",
                principalTable: "Projects",
                principalColumn: "Title");
        }
    }
}
