namespace ProjectPortfolio.Models
{
    public class Project
    {
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ProjectUrl { get; set; } = string.Empty;  
        public string ImageUrl { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }

        // Navigation Properties
        public ICollection<ProjectSkill>? ProjectSkills { get; set; }
        public ICollection<ProjectCategory>? ProjectCategories { get; set; }
        public ICollection<Testimonial>? Testimonials { get; set; }
    }

}
