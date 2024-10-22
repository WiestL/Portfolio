namespace ProjectPortfolio.Models
{
    public class Category
    {
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        // Navigation Properties
        public ICollection<ProjectCategory>? ProjectCategories { get; set; }
    }

}
