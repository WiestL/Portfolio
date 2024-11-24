// accessibility.js

document.addEventListener('DOMContentLoaded', () => {
    fetchProjects();
    setupFilterListeners();
    setupTestimonials();
    setupContactForm();
});

// Fetch and display projects
async function fetchProjects(filters = {}) {
    try {
        let url = '/api/ProjectsAPI';
        if (filters.skills || filters.categories) {
            url += '/filter?';
            const queryParams = [];
            if (filters.skills && filters.skills.length > 0) {
                filters.skills.forEach(skill => queryParams.push(`skillId=${skill}`));
            }
            if (filters.categories && filters.categories.length > 0) {
                filters.categories.forEach(category => queryParams.push(`categoryId=${category}`));
            }
            url += queryParams.join('&');
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error fetching projects: ${response.statusText}`);

        const data = await response.json();
        const projects = data.$values || data;

        displayProjects(projects);
    } catch (error) {
        console.error(error);
        alert('Failed to load projects. Please try again later.');
    }
}

// Display projects in the DOM
function displayProjects(projects) {
    const container = document.getElementById('projects-container');
    container.innerHTML = ''; // Clear existing projects

    if (projects.length === 0) {
        container.innerHTML = '<p>No projects match the selected filters.</p>';
        return;
    }

    projects.forEach(project => {
        const card = document.createElement('div');
        card.classList.add('project-card');
        card.setAttribute('role', 'listitem');

        // Image
        const img = document.createElement('img');
        img.src = project.imageUrl || 'placeholder.jpg'; // Use a placeholder if no image
        img.alt = project.title;
        card.appendChild(img);

        // Title
        const title = document.createElement('h3');
        title.textContent = project.title;
        card.appendChild(title);

        // Description
        const desc = document.createElement('p');
        desc.textContent = project.description;
        card.appendChild(desc);

        // Project URL
        if (project.projectUrl) {
            const link = document.createElement('a');
            link.href = project.projectUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'View Project';
            link.classList.add('button');
            card.appendChild(link);
        }

        // Add to container
        container.appendChild(card);
    });
}

// Setup filter listeners
function setupFilterListeners() {
    const applyButton = document.getElementById('apply-filters');
    applyButton.addEventListener('click', () => {
        const selectedSkills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(input => input.value);
        const selectedCategories = Array.from(document.querySelectorAll('input[name="categories"]:checked')).map(input => input.value);
        fetchProjects({ skills: selectedSkills, categories: selectedCategories });
    });
}

// Setup testimonials
function setupTestimonials() {
    const addButton = document.getElementById('add-testimonial-button');
    const modal = document.getElementById('testimonial-modal');
    const closeButton = document.getElementById('close-modal');
    const testimonialForm = document.getElementById('testimonial-form');

    addButton.addEventListener('click', () => {
        // Open modal
        modal.setAttribute('aria-hidden', 'false');
        document.getElementById('author-name').focus();
    });

    closeButton.addEventListener('click', () => {
        // Close modal
        modal.setAttribute('aria-hidden', 'true');
        testimonialForm.reset();
    });

    testimonialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const authorName = document.getElementById('author-name').value.trim();
        const content = document.getElementById('testimonial-content').value.trim();
        const projectId = document.getElementById('testimonial-project-id').value;

        if (!authorName || !content || !projectId) {
            alert('Please fill in all fields.');
            return;
        }

        try {
            const response = await fetch('/api/testimonialsAPI', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authorName, content, projectId })
            });

            if (!response.ok) throw new Error('Failed to submit testimonial.');

            alert('Thank you for your review!');
            testimonialForm.reset();
            modal.setAttribute('aria-hidden', 'true');
            fetchTestimonials();
        } catch (error) {
            console.error(error);
            alert('An error occurred while submitting your testimonial. Please try again.');
        }
    });

    // Fetch and display testimonials
    fetchTestimonials();
}

// Fetch and display testimonials
async function fetchTestimonials() {
    try {
        const response = await fetch('/api/testimonialsAPI');
        if (!response.ok) throw new Error(`Error fetching testimonials: ${response.statusText}`);

        const data = await response.json();
        const testimonials = data.$values || data;

        displayTestimonials(testimonials);
    } catch (error) {
        console.error(error);
        alert('Failed to load testimonials. Please try again later.');
    }
}

// Display testimonials in the DOM
function displayTestimonials(testimonials) {
    const container = document.getElementById('testimonials-container');
    container.innerHTML = ''; // Clear existing testimonials

    if (testimonials.length === 0) {
        container.innerHTML = '<p>No testimonials yet. Be the first to add one!</p>';
        return;
    }

    testimonials.forEach(testimonial => {
        const testimonialDiv = document.createElement('div');
        testimonialDiv.classList.add('testimonial');

        const content = document.createElement('p');
        content.textContent = `"${testimonial.content}"`;
        testimonialDiv.appendChild(content);

        const author = document.createElement('p');
        author.textContent = `- ${testimonial.authorName}`;
        author.style.fontWeight = 'bold';
        testimonialDiv.appendChild(author);

        container.appendChild(testimonialDiv);
    });
}

// Setup contact form
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (!name || !email || !message) {
            alert('Please fill in all fields.');
            return;
        }

        // Here, you can implement form submission logic, e.g., sending an email or storing the message.
        // For demonstration, we'll just reset the form and show a thank-you message.

        alert('Thank you for reaching out! I will get back to you shortly.');
        contactForm.reset();
    });
}
