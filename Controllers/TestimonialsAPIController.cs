using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectPortfolio.Contexts;
using ProjectPortfolio.Models;

namespace ProjectPortfolio.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestimonialsAPIController : ControllerBase // Inherit from ControllerBase for API controllers
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TestimonialsAPIController> _logger; // Declare the logger

        // Inject ILogger through the constructor
        public TestimonialsAPIController(ApplicationDbContext context, ILogger<TestimonialsAPIController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Testimonials
        [HttpGet]
        public async Task<IActionResult> GetTestimonials()
        {
            try
            {
                var testimonials = await _context.Testimonials
                    .Select(t => new
                    {
                        t.TestimonialId,
                        t.Content,
                        t.AuthorName,
                        t.ProjectId
                    })
                    .ToListAsync();
                return Ok(testimonials);
            }
            catch (Exception ex)
            {
                // Log detailed error information, including stack trace and inner exception
                _logger.LogError(ex, "Error fetching testimonials. Exception: {Message}", ex.Message);
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner Exception: {InnerMessage}", ex.InnerException.Message);
                }
                _logger.LogError("Stack Trace: {StackTrace}", ex.StackTrace);

                // Return JSON response with error details for debugging
                return StatusCode(500, new
                {
                    error = "Internal server error while fetching testimonials.",
                    message = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }


        // GET: api/Testimonials/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTestimonial(int id)
        {
            try
            {
                var testimonial = await _context.Testimonials.FindAsync(id);

                if (testimonial == null)
                {
                    _logger.LogWarning("GetTestimonial: Testimonial with ID {TestimonialId} not found.", id);
                    return NotFound();
                }

                return Ok(testimonial);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching testimonial with ID {TestimonialId}.", id);
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner Exception: {InnerMessage}", ex.InnerException.Message);
                }
                _logger.LogError("Stack Trace: {StackTrace}", ex.StackTrace);

                return StatusCode(500, new
                {
                    error = "Internal server error while fetching the testimonial.",
                    message = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }


        // POST: api/Testimonials
        [HttpPost]
        public async Task<IActionResult> CreateTestimonial([FromBody] Testimonial testimonial)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("CreateTestimonial: Invalid model state.");
                return BadRequest(ModelState);
            }

            _context.Testimonials.Add(testimonial);
            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("CreateTestimonial: Testimonial with ID {TestimonialId} created successfully.", testimonial.TestimonialId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving testimonial.");
                return StatusCode(500, "Internal server error while saving the testimonial.");
            }

            return CreatedAtAction(nameof(GetTestimonial), new { id = testimonial.TestimonialId }, testimonial);
        }

        // PUT: api/Testimonials/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTestimonial(int id, [FromBody] Testimonial testimonial)
        {
            if (id != testimonial.TestimonialId || !ModelState.IsValid)
            {
                _logger.LogWarning("UpdateTestimonial: Invalid testimonial ID or model state.");
                return BadRequest();
            }

            _context.Entry(testimonial).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("UpdateTestimonial: Testimonial with ID {TestimonialId} updated successfully.", id);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!_context.Testimonials.Any(t => t.TestimonialId == id))
                {
                    _logger.LogWarning("UpdateTestimonial: Testimonial with ID {TestimonialId} not found for update.", id);
                    return NotFound();
                }
                _logger.LogError(ex, "UpdateTestimonial: Concurrency error while updating testimonial with ID {TestimonialId}.", id);
                throw; // Rethrow to let the framework handle it
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UpdateTestimonial: Error updating testimonial with ID {TestimonialId}.", id);
                return StatusCode(500, "Internal server error while updating the testimonial.");
            }

            return NoContent();
        }

        // DELETE: api/Testimonials/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTestimonial(int id)
        {
            try
            {
                var testimonial = await _context.Testimonials.FindAsync(id);
                if (testimonial == null)
                {
                    _logger.LogWarning("DeleteTestimonial: Testimonial with ID {TestimonialId} not found.", id);
                    return NotFound();
                }

                _context.Testimonials.Remove(testimonial);
                await _context.SaveChangesAsync();
                _logger.LogInformation("DeleteTestimonial: Testimonial with ID {TestimonialId} deleted successfully.", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DeleteTestimonial: Error deleting testimonial with ID {TestimonialId}.", id);
                return StatusCode(500, "Internal server error while deleting the testimonial.");
            }
        }
    }
}
