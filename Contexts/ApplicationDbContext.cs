using Microsoft.EntityFrameworkCore;
using ProjectPortfolio.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace ProjectPortfolio.Contexts
{
    public class ApplicationDbContext : IdentityDbContext<IdentityUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Testimonial> Testimonials { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<ProjectSkill> ProjectSkills { get; set; }
        public DbSet<ProjectCategory> ProjectCategories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Testimonial>()
           .HasOne(t => t.Project)
           .WithMany(p => p.Testimonials)
           .HasForeignKey(t => t.ProjectId)
           .OnDelete(DeleteBehavior.Cascade);

            // Many-to-Many: Project-Skill
            modelBuilder.Entity<ProjectSkill>()
                .HasKey(ps => new { ps.ProjectId, ps.SkillId });

            modelBuilder.Entity<ProjectSkill>()
                .HasOne(ps => ps.Project)
                .WithMany(p => p.ProjectSkills)
                .HasForeignKey(ps => ps.ProjectId);

            modelBuilder.Entity<ProjectSkill>()
                .HasOne(ps => ps.Skill)
                .WithMany(s => s.ProjectSkills)
                .HasForeignKey(ps => ps.SkillId);

            // Many-to-Many: Project-Category
            modelBuilder.Entity<ProjectCategory>()
                .HasKey(pc => new { pc.ProjectId, pc.CategoryId });

            modelBuilder.Entity<ProjectCategory>()
                .HasOne(pc => pc.Project)
                .WithMany(p => p.ProjectCategories)
                .HasForeignKey(pc => pc.ProjectId);

            modelBuilder.Entity<ProjectCategory>()
                .HasOne(pc => pc.Category)
                .WithMany(c => c.ProjectCategories)
                .HasForeignKey(pc => pc.CategoryId);
        }
    }

}
