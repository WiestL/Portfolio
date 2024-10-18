namespace ProjectPortfolio.Models
{
    public class User
    {
        public int UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }

        // Navigation Properties
        // Here you would also implement roles and other identity management properties
    }

}
