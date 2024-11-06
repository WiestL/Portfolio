using Microsoft.AspNetCore.Identity;

namespace ProjectPortfolio.Models
{
    public class User : IdentityUser
    {
        // Custom properties
        public string? CustomUsername { get; set; }

        // Additional properties can go here
    }
}