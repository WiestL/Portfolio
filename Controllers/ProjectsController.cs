using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectPortfolio.Models;
using ProjectPortfolio.Contexts;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ProjectPortfolio.Controllers
{
    [Authorize(Roles = "Admin")]
    public class ProjectsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ProjectsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Projects
        public async Task<IActionResult> Index()
        {
            var projects = await _context.Projects
                .Include(p => p.ProjectSkills)
                .Include(p => p.ProjectCategories)
                .Include(p => p.Testimonials)
                .ToListAsync();
            return View(projects);
        }

        // GET: Projects/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var project = await _context.Projects
                .Include(p => p.ProjectSkills)
                    .ThenInclude(ps => ps.Skill)
                .Include(p => p.ProjectCategories)
                    .ThenInclude(pc => pc.Category)
                .Include(p => p.Testimonials)
                .FirstOrDefaultAsync(p => p.ProjectId == id);

            if (project == null)
            {
                return NotFound();
            }

            return View(project);
        }

        // GET: Projects/Create
        public async Task<IActionResult> Create()
        {
            ViewBag.AvailableSkills = await _context.Skills.ToListAsync();
            ViewBag.AvailableCategories = await _context.Categories.ToListAsync();
            return View();
        }

        // POST: Projects/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Title,Description,ProjectUrl,ImageUrl,DateCreated")] Project project, List<int> skillIds, List<int> categoryIds)
        {
            if (ModelState.IsValid)
            {
                // Ensure the date is set if it's not provided
                project.DateCreated = project.DateCreated == default ? DateTime.Now : project.DateCreated;
                project.DateCreated = DateTime.UtcNow;
                // Save the main project first to get the generated ProjectId
                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                // Add valid skill associations only if skillIds is not null and contains items
                if (skillIds != null && skillIds.Any())
                {
                    foreach (var skillId in skillIds)
                    {
                        // Verify that the skill exists in the database to prevent blank entries
                        if (_context.Skills.Any(s => s.SkillId == skillId))
                        {
                            _context.ProjectSkills.Add(new ProjectSkill { ProjectId = project.ProjectId, SkillId = skillId });
                        }
                    }
                }

                // Add valid category associations only if categoryIds is not null and contains items
                if (categoryIds != null && categoryIds.Any())
                {
                    foreach (var categoryId in categoryIds)
                    {
                        // Verify that the category exists in the database to prevent blank entries
                        if (_context.Categories.Any(c => c.CategoryId == categoryId))
                        {
                            _context.ProjectCategories.Add(new ProjectCategory { ProjectId = project.ProjectId, CategoryId = categoryId });
                        }
                    }
                }

                // Save all changes for project associations
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }

            // Reload skills and categories if validation fails
            ViewBag.AvailableSkills = await _context.Skills.ToListAsync();
            ViewBag.AvailableCategories = await _context.Categories.ToListAsync();
            return View(project);
        }

        // GET: Projects/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var project = await _context.Projects
                .Include(p => p.ProjectSkills)
                .Include(p => p.ProjectCategories)
                .FirstOrDefaultAsync(p => p.ProjectId == id);

            if (project == null)
            {
                return NotFound();
            }

            ViewBag.AvailableSkills = await _context.Skills.ToListAsync();
            ViewBag.AvailableCategories = await _context.Categories.ToListAsync();
            ViewBag.SelectedSkillIds = project.ProjectSkills.Select(ps => ps.SkillId).ToList();
            ViewBag.SelectedCategoryIds = project.ProjectCategories.Select(pc => pc.CategoryId).ToList();

            return View(project);
        }

        // POST: Projects/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("ProjectId,Title,Description,ProjectUrl,ImageUrl,DateCreated")] Project project, List<int> skillIds, List<int> categoryIds)
        {
            if (id != project.ProjectId)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                var existingProject = await _context.Projects
                    .Include(p => p.ProjectSkills)
                    .Include(p => p.ProjectCategories)
                    .FirstOrDefaultAsync(p => p.ProjectId == id);

                if (existingProject == null)
                {
                    return NotFound();
                }

                // Ensure DateCreated is in UTC
                if (project.DateCreated.Kind == DateTimeKind.Unspecified)
                {
                    project.DateCreated = DateTime.SpecifyKind(project.DateCreated, DateTimeKind.Utc);
                }
                else if (project.DateCreated.Kind == DateTimeKind.Local)
                {
                    project.DateCreated = project.DateCreated.ToUniversalTime();
                }

                // Update project properties
                existingProject.Title = project.Title;
                existingProject.Description = project.Description;
                existingProject.ProjectUrl = project.ProjectUrl;
                existingProject.ImageUrl = project.ImageUrl;
                existingProject.DateCreated = project.DateCreated;

                // Clear current skills and categories to prevent duplicate associations
                _context.ProjectSkills.RemoveRange(existingProject.ProjectSkills);
                _context.ProjectCategories.RemoveRange(existingProject.ProjectCategories);

                // Add new skills
                if (skillIds != null && skillIds.Any())
                {
                    foreach (var skillId in skillIds)
                    {
                        if (_context.Skills.Any(s => s.SkillId == skillId))
                        {
                            _context.ProjectSkills.Add(new ProjectSkill { ProjectId = existingProject.ProjectId, SkillId = skillId });
                        }
                    }
                }

                // Add new categories
                if (categoryIds != null && categoryIds.Any())
                {
                    foreach (var categoryId in categoryIds)
                    {
                        if (_context.Categories.Any(c => c.CategoryId == categoryId))
                        {
                            _context.ProjectCategories.Add(new ProjectCategory { ProjectId = existingProject.ProjectId, CategoryId = categoryId });
                        }
                    }
                }

                try
                {
                    await _context.SaveChangesAsync();
                    return RedirectToAction(nameof(Index));
                }
                catch (Exception ex)
                {
                    ModelState.AddModelError("", "An error occurred while updating the project. Please try again.");
                }
            }

            // Reload skills and categories if model state is invalid
            ViewBag.AvailableSkills = await _context.Skills.ToListAsync();
            ViewBag.AvailableCategories = await _context.Categories.ToListAsync();
            ViewBag.SelectedSkillIds = skillIds;
            ViewBag.SelectedCategoryIds = categoryIds;

            return View(project);
        }


        // GET: Projects/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.ProjectId == id);
            if (project == null)
            {
                return NotFound();
            }

            return View(project);
        }

        // POST: Projects/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool ProjectExists(int id)
        {
            return _context.Projects.Any(e => e.ProjectId == id);
        }
    }
}
