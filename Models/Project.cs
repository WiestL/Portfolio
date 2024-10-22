namespace ProjectPortfolio.Models
{
    public class Project
    {
        public int ProjectId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string ProjectUrl { get; set; }
        public string ImageUrl { get; set; }
        public DateTime DateCreated { get; set; }

        // Navigation Properties
        public ICollection<ProjectSkill>? ProjectSkills { get; set; }
        public ICollection<ProjectCategory>? ProjectCategories { get; set; }
        public ICollection<Testimonial>? Testimonials { get; set; }
    }

}
