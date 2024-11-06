﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectPortfolio.Models;
using ProjectPortfolio.Contexts;
using Microsoft.Extensions.Logging; // Import the logging namespace

namespace ProjectPortfolio.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectsAPIController : ControllerBase // Inherit from ControllerBase for API controllers
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProjectsAPIController> _logger; // Declare the logger

        // Inject ILogger through the constructor
        public ProjectsAPIController(ApplicationDbContext context, ILogger<ProjectsAPIController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Projects
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            try
            {
                var projects = await _context.Projects
                    .Include(p => p.ProjectSkills)
                    .Include(p => p.ProjectCategories)
                    .Include(p => p.Testimonials)
                    .Select(p => new
                    {
                        p.ProjectId,
                        p.Title,
                        p.Description,
                        p.ProjectUrl
                    })
                    .ToListAsync();
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching projects."); // Log the error with stack trace
                return StatusCode(500, "Internal server error while fetching projects.");
            }
        }

        // GET: api/Projects/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.ProjectSkills)
                    .Include(p => p.ProjectCategories)
                    .Include(p => p.Testimonials)
                    .FirstOrDefaultAsync(p => p.ProjectId == id);

                if (project == null)
                {
                    _logger.LogWarning("GetProject: Project with ID {ProjectId} not found.", id);
                    return NotFound();
                }

                return Ok(project);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching project with ID {ProjectId}.", id);
                return StatusCode(500, "Internal server error while fetching the project.");
            }
        }

        // POST: api/Projects
        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] Project project)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("CreateProject: Invalid model state.");
                return BadRequest(ModelState);
            }

            _context.Projects.Add(project);
            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("CreateProject: Project with ID {ProjectId} created successfully.", project.ProjectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project.");
                return StatusCode(500, "Internal server error while creating the project.");
            }

            return CreatedAtAction(nameof(GetProject), new { id = project.ProjectId }, project);
        }

        // PUT: api/Projects/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] Project project)
        {
            if (id != project.ProjectId || !ModelState.IsValid)
            {
                _logger.LogWarning("UpdateProject: Invalid project ID or model state.");
                return BadRequest();
            }

            _context.Entry(project).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("UpdateProject: Project with ID {ProjectId} updated successfully.", id);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!_context.Projects.Any(p => p.ProjectId == id))
                {
                    _logger.LogWarning("UpdateProject: Project with ID {ProjectId} not found for update.", id);
                    return NotFound();
                }
                _logger.LogError(ex, "UpdateProject: Concurrency error while updating project with ID {ProjectId}.", id);
                throw; // Rethrow to let the framework handle it
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UpdateProject: Error updating project with ID {ProjectId}.", id);
                return StatusCode(500, "Internal server error while updating the project.");
            }

            return NoContent();
        }

        // DELETE: api/Projects/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            try
            {
                var project = await _context.Projects.FindAsync(id);
                if (project == null)
                {
                    _logger.LogWarning("DeleteProject: Project with ID {ProjectId} not found.", id);
                    return NotFound();
                }

                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();
                _logger.LogInformation("DeleteProject: Project with ID {ProjectId} deleted successfully.", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DeleteProject: Error deleting project with ID {ProjectId}.", id);
                return StatusCode(500, "Internal server error while deleting the project.");
            }
        }
    }
}
