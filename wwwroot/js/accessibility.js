// accessibility.js

document.addEventListener('DOMContentLoaded', () => {
    fetchProjects();
    setupFilterListeners();
    setupProjectTestimonials();
    setupContactForm();
});

// Fetch and display projects
async function fetchProjects(filters = {}) {
    try {
        let url = '/api/ProjectsAPI';
        const queryParams = [];

        if (filters.skills && filters.skills.length > 0) {
            filters.skills.forEach(skillId => queryParams.push(`skillId=${skillId}`));
        }
        if (filters.categories && filters.categories.length > 0) {
            filters.categories.forEach(categoryId => queryParams.push(`categoryId=${categoryId}`));
        }

        if (queryParams.length > 0) {
            url += `/filter?` + queryParams.join('&');
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

    // After rendering projects, fetch testimonials for each project
    projects.forEach(project => {
        fetchTestimonials(project.ProjectId);
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

// Setup project-specific testimonials
function setupProjectTestimonials() {
    const addButtons = document.querySelectorAll('.add-testimonial-button');
    addButtons.forEach(button => {
        button.addEventListener('click', () => {
            const projectId = button.getAttribute('data-project-id');
            openTestimonialModal(projectId);
        });
    });
}

// Open the testimonial modal with the selected project ID
function openTestimonialModal(projectId) {
    const modal = document.getElementById('testimonial-modal');
    const projectIdInput = document.getElementById('testimonial-project-id');

    projectIdInput.value = projectId;

    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('author-name').focus();
    trapFocus(modal);
}

// Fetch and display testimonials for a specific project
async function fetchTestimonials(projectId) {
    try {
        const response = await fetch(`/api/testimonialsAPI?projectId=${projectId}`);
        if (!response.ok) throw new Error(`Error fetching testimonials: ${response.statusText}`);

        const data = await response.json();
        const testimonials = data.$values || data;

        displayProjectTestimonials(projectId, testimonials);
    } catch (error) {
        console.error(error);
        alert('Failed to load testimonials. Please try again later.');
    }
}

// Display testimonials for a specific project in the DOM
function displayProjectTestimonials(projectId, testimonials) {
    const container = document.querySelector(`.testimonials-container[data-project-id="${projectId}"]`);
    if (!container) return;

    container.innerHTML = ''; // Clear existing testimonials

    if (testimonials.length === 0) {
        container.innerHTML = '<p>No testimonials yet.</p>';
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

// Setup testimonials
function setupTestimonials() {
    // No longer needed since we're handling project-specific testimonials
    // All testimonial handling is now project-specific
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

        // Implement form submission logic here (e.g., send an email or store the message)
        // For demonstration, we'll just reset the form and show a thank-you message.

        alert('Thank you for reaching out! I will get back to you shortly.');
        contactForm.reset();
    });
}

// Accessibility: Focus Trap in Modal
let focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
let firstTabStop;
let lastTabStop;

function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(focusableElementsString);
    const focusableArray = Array.prototype.slice.call(focusableElements);

    if (focusableArray.length === 0) return;

    firstTabStop = focusableArray[0];
    lastTabStop = focusableArray[focusableArray.length - 1];

    modal.addEventListener('keydown', handleTrapFocus);
}

function handleTrapFocus(e) {
    if (e.key === 'Tab') {
        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstTabStop) {
                e.preventDefault();
                lastTabStop.focus();
            }
        } else { // Tab
            if (document.activeElement === lastTabStop) {
                e.preventDefault();
                firstTabStop.focus();
            }
        }
    }

    if (e.key === 'Escape') {
        const modal = document.getElementById('testimonial-modal');
        modal.setAttribute('aria-hidden', 'true');
        const closeButton = document.getElementById('close-modal');
        closeButton.click();
    }
}

function removeTrapFocus(modal) {
    modal.removeEventListener('keydown', handleTrapFocus);
}
