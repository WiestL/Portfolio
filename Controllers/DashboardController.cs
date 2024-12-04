using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectPortfolio.Contexts;
using Microsoft.EntityFrameworkCore;

namespace ProjectPortfolio.Controllers
{
    public class DashboardController : Controller
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Dashboard()
        {
            ViewData["ProjectCount"] = await _context.Projects.CountAsync();
            ViewData["ReviewCount"] = await _context.Testimonials.CountAsync();
            ViewData["SkillCount"] = await _context.Skills.CountAsync();
            ViewData["CategoryCount"] = await _context.Categories.CountAsync();

            return View();
        }
    }
}
