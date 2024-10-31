using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectPortfolio.Contexts;
using ProjectPortfolio.Models;

namespace ProjectPortfolio.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestimonialsAPIController : Controller
    {
        private readonly ApplicationDbContext _context;

        public TestimonialsAPIController(ApplicationDbContext context)
        {
            _context = context;
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
                Console.WriteLine($"Error fetching testimonials: {ex.Message}");
                return StatusCode(500, "Internal server error while fetching testimonials.");
            }
        }


        // GET: api/Testimonials/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTestimonial(int id)
        {
            var testimonial = await _context.Testimonials.FindAsync(id);

            if (testimonial == null)
            {
                return NotFound();
            }

            return Ok(testimonial);
        }

        // POST: api/Testimonials
        [HttpPost]
        public async Task<IActionResult> CreateTestimonial([FromBody] Testimonial testimonial)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Testimonials.Add(testimonial);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving testimonial: {ex.InnerException?.Message}");
                return StatusCode(500, "Internal server error");
            }


            return CreatedAtAction(nameof(GetTestimonial), new { id = testimonial.TestimonialId }, testimonial);
        }


        // PUT: api/Testimonials/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTestimonial(int id, [FromBody] Testimonial testimonial)
        {
            if (id != testimonial.TestimonialId || !ModelState.IsValid)
            {
                return BadRequest();
            }

            _context.Entry(testimonial).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Testimonials.Any(t => t.TestimonialId == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Testimonials/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTestimonial(int id)
        {
            var testimonial = await _context.Testimonials.FindAsync(id);
            if (testimonial == null)
            {
                return NotFound();
            }

            _context.Testimonials.Remove(testimonial);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
