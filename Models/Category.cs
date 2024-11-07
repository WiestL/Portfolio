namespace ProjectPortfolio.Models
{
    public class Category
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // Navigation Properties
        public ICollection<ProjectCategory>? ProjectCategories { get; set; }
    }
}
