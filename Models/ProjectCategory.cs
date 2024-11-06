namespace ProjectPortfolio.Models
{
    public class ProjectCategory
    {
        public int ProjectId { get; set; }
        public Project Project { get; set; } = new Project();

        public int CategoryId { get; set; }
        public Category Category { get; set; } = new Category();
    }


}
