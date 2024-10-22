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
            var testimonials = await _context.Testimonials.ToListAsync();
            return Ok(testimonials);
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
            await _context.SaveChangesAsync();

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
