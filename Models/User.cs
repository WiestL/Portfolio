using Microsoft.AspNetCore.Identity;

namespace ProjectPortfolio.Models
{
    public class User : IdentityUser
    {
        // Custom properties
        public string? CustomUsername { get; set; } // Rename Username to avoid confusion with IdentityUser.UserName

        // Additional properties can go here
    }
}