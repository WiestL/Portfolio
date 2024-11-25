// Controllers/AccessibilityController.cs

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectPortfolio.Models;
using ProjectPortfolio.ViewModels;
using ProjectPortfolio.Contexts;
using System.Threading.Tasks;
using System.Linq;

namespace ProjectPortfolio.Controllers
{
    public class AccessibilityController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AccessibilityController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /Accessibility/
        public async Task<IActionResult> Index()
        {
            // Fetch Skills and Categories from the database
            var skills = await _context.Skills.ToListAsync();
            var categories = await _context.Categories.ToListAsync();

            // Optionally, fetch Projects if the ViewModel includes them
            var projects = await _context.Projects.ToListAsync();

            // Initialize the ViewModel
            var viewModel = new AccessibilityVM
            {
                Skills = skills,
                Categories = categories,
                Projects = projects 
            };

            return View(viewModel);
        }
    }
}
