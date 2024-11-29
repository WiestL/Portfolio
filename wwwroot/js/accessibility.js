// accessibility.js

document.addEventListener('DOMContentLoaded', () => {
    fetchSkills();
    fetchCategories();
    fetchProjects();
    setupFilterListeners();
    setupTestimonials();
});

// Fetch and display Skills
async function fetchSkills() {
    try {
        const response = await fetch('/api/SkillsAPI');
        if (!response.ok) throw new Error(`Error fetching skills: ${response.statusText}`);

        const data = await response.json();
        const skills = data.$values || data; // Adjust based on your API response structure

        displaySkills(skills);
    } catch (error) {
        console.error(error);
        const skillsContainer = document.getElementById('skills-container');
        skillsContainer.innerHTML = '<p>Failed to load skills.</p>';
    }
}

// Display Skills in the DOM
function displaySkills(skills) {
    const container = document.getElementById('skills-container');
    container.innerHTML = ''; // Clear placeholder

    if (!skills || skills.length === 0) {
        container.innerHTML = '<p>No skills available.</p>';
        return;
    }

    skills.forEach(skill => {
        const skillId = skill.id || skill.skillId; // Adjusted property name
        const skillName = skill.name || skill.skillName; // Adjusted property name

        if (!skillId || !skillName) {
            console.error('Invalid skill data:', skill);
            return; // Skip this skill
        }

        const div = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `skill-${skillId}`;
        checkbox.name = 'skills';
        checkbox.value = skillId; // Use the correct ID field
        div.appendChild(checkbox);

        const label = document.createElement('label');
        label.htmlFor = `skill-${skillId}`;
        label.textContent = skillName;
        div.appendChild(label);

        container.appendChild(div);
    });
}


// Fetch and display Categories
async function fetchCategories() {
    try {
        const response = await fetch('/api/CategoriesAPI');
        if (!response.ok) throw new Error(`Error fetching categories: ${response.statusText}`);

        const data = await response.json();
        const categories = data.$values || data; // Adjust based on your API response structure

        displayCategories(categories);
    } catch (error) {
        console.error(error);
        const categoriesContainer = document.getElementById('categories-container');
        categoriesContainer.innerHTML = '<p>Failed to load categories.</p>';
    }
}

// Display Categories in the DOM
function displayCategories(categories) {
    const container = document.getElementById('categories-container');
    container.innerHTML = ''; // Clear placeholder

    if (!categories || categories.length === 0) {
        container.innerHTML = '<p>No categories available.</p>';
        return;
    }

    categories.forEach(category => {
        const categoryId = category.id || category.categoryId; // Adjusted property name
        const categoryName = category.name || category.categoryName; // Adjusted property name

        if (!categoryId || !categoryName) {
            console.error('Invalid category data:', category);
            return; // Skip this category
        }

        const div = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `category-${categoryId}`;
        checkbox.name = 'categories';
        checkbox.value = categoryId;
        div.appendChild(checkbox);

        const label = document.createElement('label');
        label.htmlFor = `category-${categoryId}`;
        label.textContent = categoryName;
        div.appendChild(label);

        container.appendChild(div);
    });
}

function setupFilterListeners() {
    const applyButton = document.getElementById('apply-filters');
    applyButton.addEventListener('click', () => {
        const selectedSkills = Array.from(document.querySelectorAll('input[name="skills"]:checked'))
            .map(input => input.value)
            .filter(value => value !== undefined && value !== '');

        const selectedCategories = Array.from(document.querySelectorAll('input[name="categories"]:checked'))
            .map(input => input.value)
            .filter(value => value !== undefined && value !== '');

        console.log('Selected Skills:', selectedSkills);
        console.log('Selected Categories:', selectedCategories);

        fetchProjects({ skills: selectedSkills, categories: selectedCategories });
    });
}

// Fetch and display projects based on filters
async function fetchProjects(filters = {}) {
    try {
        let url = '/api/ProjectsAPI';
        const queryParams = [];

        if (filters.skills && filters.skills.length > 0) {
            filters.skills.forEach(skill => {
                if (skill) {
                    queryParams.push(`skillId=${encodeURIComponent(skill)}`);
                }
            });
        }

        if (filters.categories && filters.categories.length > 0) {
            filters.categories.forEach(category => {
                if (category) {
                    queryParams.push(`categoryId=${encodeURIComponent(category)}`);
                }
            });
        }

        if (queryParams.length > 0) {
            url += '/filter?' + queryParams.join('&');
        }

        console.log('Fetching projects with URL:', url);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error fetching projects: ${response.statusText}`);

        const data = await response.json();
        const projects = data.$values || data; // Adjust based on your API response structure

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
        if (project.imagePath) {
            const img = document.createElement('img');
            img.src = project.imagePath; // Use the project's image path
            img.alt = `Image of project: ${project.title}`;
            img.classList.add('project-image'); // Add a class for styling if needed
            card.appendChild(img);
        }

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
        const testimonials = data.$values || data; // Adjust based on your API response structure

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
