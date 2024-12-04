using Microsoft.AspNetCore.Mvc;
using ProjectPortfolio.Contexts;
using ProjectPortfolio.Models;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;

namespace ProjectPortfolio.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly ApplicationDbContext _context;

        public HomeController(ILogger<HomeController> logger, ApplicationDbContext context)
        {
            _logger = logger;
            _context = context;
        }

        public IActionResult Portfolio()
        {
            return View();
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminDashboard()
        {
            ViewData["ProjectCount"] = await _context.Projects.CountAsync();
            ViewData["ReviewCount"] = await _context.Testimonials.CountAsync();
            ViewData["SkillCount"] = await _context.Skills.CountAsync();
            ViewData["CategoryCount"] = await _context.Categories.CountAsync();

            return View(); // Maps to Views/Home/AdminDashboard.cshtml
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
