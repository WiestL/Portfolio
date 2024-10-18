namespace ProjectPortfolio.Models
{
    public class Testimonial
    {
        public int TestimonialId { get; set; }
        public string AuthorName { get; set; }
        public string Content { get; set; }
        public DateTime DatePosted { get; set; }

        // Foreign Key
        public int ProjectId { get; set; }

        // Navigation Properties
        public Project Project { get; set; }
    }

}
