using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectPortfolio.Models;
using System.Threading.Tasks;
using System.Linq;
using ProjectPortfolio.Contexts;

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

            // Option 1: Use ViewBag
            ViewBag.Skills = skills;
            ViewBag.Categories = categories;

            return View();
        }
    }
}
