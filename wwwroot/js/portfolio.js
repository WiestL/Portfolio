// Variables for the scene, camera, renderer, and character
let scene, camera, renderer, character;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const moveSpeed = 0.5;  // Character movement speed
let raycaster;
let inTestimonialMode = false;  // Track whether user is in testimonial mode
const proximityDistance = 2;  // The proximity distance in front of the pedestal
let intersectedPedestal = null;  // Track the current pedestal in proximity
let testimonialDisplayTextMesh;
let projectNameTextMesh;
let cachedFont; // Cache the font for reuse

// Initialize the scene
async function init() {
    // Set up the scene, camera, and lighting
    setupSceneAndLighting();

    // Load the font and cache it
    const fontLoader = new THREE.FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', async (font) => {
        cachedFont = font;
        console.log('Font loaded:', cachedFont);

        // Now proceed with functions that depend on the font
        createCharacter();
        createAddTestimonialBox();
        createProjectDropdown();

        createControlInstructions();

        // Fetch projects and proceed after fetching
        const projects = await fetchProjectsAndCreatePedestals();
        const numProjects = projects.length;

        createMuseum(numProjects); // Pass the correct number of projects
        loadTestimonials(); // Proceed with testimonials after loading projects

        animate(); // Start the animation loop
    });

    // Set up event listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // Throttle proximity check
    setInterval(checkProximityToPedestals, 100); // Check every 100ms
}

function setupSceneAndLighting() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xcccccc, 50, 200);

    const aspectRatio = window.innerWidth / window.innerHeight;
    const cameraSize = 10;
    camera = new THREE.OrthographicCamera(
        -cameraSize * aspectRatio, cameraSize * aspectRatio,
        cameraSize, -cameraSize,
        0.1, 1000
    );
    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(scene.fog.color);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
}
function checkProximityToPedestals() {
    characterBox.setFromObject(character);  // Update character's bounding box

    for (let i = 0; i < pedestalBoxes.length; i++) {
        pedestalBoxes[i].setFromObject(pedestals[i]);  // Ensure pedestal bounding boxes are up to date

        if (characterBox.intersectsBox(pedestalBoxes[i])) {
            if (!pedestalTouched[i]) {
                console.log("Character is near pedestal:", i);  // Log proximity
                showProjectDetails(i, pedestals[i]);  // Pass pedestal reference
                pedestalTouched[i] = true;  // Ensure it's only shown once
            }
            return;  // Exit after detecting the first interaction
        }
    }
}

function createControlInstructions() {
    if (!cachedFont) {
        console.error('Font not loaded yet.');
        return;
    }

    const instructions = [
        "- HAVE FUN",
        "- Use W, A, S, D, or arrowkeys, to walk around",
        "- Walk up to a project to see details",
        "- Press Enter to interact with Link Boxes and Review Writing",
        "Controls:"
        
    ];

    const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0 });
    let offsetZ = 0;
    let instructionMeshes = [];

    instructions.forEach((line, index) => {
        const textGeometry = new THREE.TextGeometry(line, {
            font: cachedFont,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial.clone()); // Clone material to independently control opacity
        textMesh.position.set(-30, 0.1, 15 - offsetZ);
        textMesh.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(textMesh);
        instructionMeshes.push(textMesh);

        offsetZ += 1; // Adjust this value for spacing between lines
    });

    // Animate the fading in of the instructions
    let fadeInDuration = 2000; // Duration in milliseconds
    let startTime = performance.now();

    function fadeIn() {
        let elapsed = performance.now() - startTime;
        let progress = Math.min(elapsed / fadeInDuration, 1); // Cap progress at 1
        instructionMeshes.forEach(mesh => {
            mesh.material.opacity = progress; // Gradually increase opacity
        });

        if (progress < 1) {
            requestAnimationFrame(fadeIn); // Continue until fully visible
        }
    }

    fadeIn();
}


// Function to create the character (a small cube)
function createCharacter() {
    const charGeometry = new THREE.BoxGeometry(1, 1, 1);  // Cube geometry for the character
    const charMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });  // Smooth shaded green character
    character = new THREE.Mesh(charGeometry, charMaterial);
    logGeometry(charGeometry, 'Character');
    character.position.set(-30, 0.5, 15);  // Start the character outside the museum
    scene.add(character);
}

let wallBoxes = [];  // Array to store bounding boxes for the walls

// Function to create the museum environment (floor and walls)
function createMuseum(numProjects) {
    // Log number of projects
    console.log(`Number of projects: ${numProjects}`);

    // Fallback for invalid numProjects
    numProjects = isNaN(numProjects) ? 0 : numProjects;

    // Calculate museum dimensions based on the number of projects
    const projectSpacing = 20;
    const museumWidth = Math.max(30, numProjects * projectSpacing);
    const museumDepth = 15;
    const openingSize = 10;

    // Validate dimensions
    if (isNaN(museumWidth) || isNaN(museumDepth) || isNaN(openingSize)) {
        console.error('Invalid museum dimensions', { museumWidth, museumDepth, openingSize });
        return; // Exit the function if dimensions are invalid
    }

    console.log(`Museum dimensions: width=${museumWidth}, depth=${museumDepth}, openingSize=${openingSize}`);

    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x89CFF0 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(museumWidth, museumDepth), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    logGeometry(floor.geometry, 'Floor');

    // Wall material
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });

    // Create walls with an opening for entrance
    createWall(museumWidth, 2, 0.5, 0, 1, -museumDepth / 2, wallMaterial);  // Back wall
    createWall(museumWidth / 2 - openingSize / 2, 2, 0.5, -museumWidth / 4 - openingSize / 4, 1, museumDepth / 2, wallMaterial);  // Left part of front wall
    createWall(museumWidth / 2 - openingSize / 2, 2, 0.5, museumWidth / 4 + openingSize / 4, 1, museumDepth / 2, wallMaterial);  // Right part of front wall
    createWall(0.5, 2, museumDepth, -museumWidth / 2, 1, 0, wallMaterial);  // Left wall
    createWall(0.5, 2, museumDepth, museumWidth / 2, 1, 0, wallMaterial);  // Right wall
}

// Helper function to create a wall with bounding box and add to the scene
function createWall(width, height, depth, x, y, z, material) {
    if (isNaN(width) || isNaN(height) || isNaN(depth) || isNaN(x) || isNaN(y) || isNaN(z)) {
        console.error('NaN detected in createWall parameters', { width, height, depth, x, y, z });
        return; // Exit the function if any parameter is invalid
    }

    console.log(`Creating wall with dimensions: width=${width}, height=${height}, depth=${depth}, position=(${x}, ${y}, ${z})`);

    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    wall.position.set(x, y, z);
    scene.add(wall);
    logGeometry(wall.geometry, `Wall at (${x}, ${y}, ${z})`);

    // Add a visible edge for clarity
    const edge = new THREE.EdgesGeometry(wall.geometry);
    const line = new THREE.LineSegments(edge, new THREE.LineBasicMaterial({ color: 0x000000 }));
    line.position.copy(wall.position);
    scene.add(line);

    wallBoxes.push(new THREE.Box3().setFromObject(wall));
}

// Create 'Add Testimonial' interaction box
let addTestimonialBox;
function createAddTestimonialBox() {
    const boxGeometry = new THREE.PlaneGeometry(3, 1);
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
    addTestimonialBox = new THREE.Mesh(boxGeometry, boxMaterial);
    addTestimonialBox.position.set(-3, 0.001, 12);  // Slightly above ground to avoid z-fighting
    addTestimonialBox.rotation.x = -Math.PI / 2;
    addTestimonialBox.userData = { isTestimonialBox: true };
    scene.add(addTestimonialBox);

    // Create bounding box and add to interactionBoxes
    const testimonialBox3 = new THREE.Box3().setFromObject(addTestimonialBox);
    interactionBoxes.push({
        box: testimonialBox3,
        type: 'testimonial',
        mesh: addTestimonialBox
    });

    // Add label text using cached font
    if (cachedFont) {
        const textGeometry = new THREE.TextGeometry('Add Review', {
            font: cachedFont,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });
        const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(addTestimonialBox.position.x - 1.4, 0.02, addTestimonialBox.position.z);
        textMesh.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(textMesh);
    } else {
        console.error('Font not loaded yet.');
    }
}

// Create project dropdown
let projectDropdown; // Dropdown for selecting project
let interactionBoxes = []; // Array to store interaction boxes
let selectedProjectId = null; // Store the selected project ID
let dropdownOpen = false; // Track if the dropdown is open
let projectNameEntries = [];
let selectedProjectMesh = null;
function createProjectDropdown() {
    const dropdownGeometry = new THREE.PlaneGeometry(3, 1);
    const dropdownMaterial = new THREE.MeshLambertMaterial({
        color: 0x0000ff,
        opacity: 0.5,
        transparent: true,
    });
    projectDropdown = new THREE.Mesh(dropdownGeometry, dropdownMaterial);
    projectDropdown.position.set(3, 0.001, 12); // Position next to the testimonial box
    projectDropdown.rotation.x = -Math.PI / 2;
    scene.add(projectDropdown);

    // Add interaction box for the dropdown
    const dropdownBox = new THREE.Box3().setFromObject(projectDropdown);
    if (dropdownBox) {
        interactionBoxes.push({
            box: dropdownBox,
            type: 'dropdown',
            mesh: projectDropdown,
        });
    } else {
        console.error('Failed to create interaction box for dropdown');
    }

    // Add label text using cached font
    if (cachedFont) {
        const textGeometry = new THREE.TextGeometry('Select Project', {
            font: cachedFont,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });
        const textMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 100,
            transparent: true,
            opacity: 0, // Start with opacity 0 for fade-in effect
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(projectDropdown.position.x - 1.4, 0.02, projectDropdown.position.z);
        textMesh.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(textMesh);

        // Start fade-in effect for the label text
        fadeInText([textMesh]);

        // Fetch projects from the backend
        fetch('/api/projectsAPI')
            .then(response => response.json())
            .then(result => {
                const projects = result.$values || result;
                if (Array.isArray(projects)) {
                    projects.forEach((project, index) => {
                        const projectTextGeometry = new THREE.TextGeometry(project.title || '', {
                            font: cachedFont,
                            size: 0.3,
                            height: 0.01,
                            curveSegments: 12,
                        });
                        const projectTextMaterial = new THREE.MeshPhongMaterial({
                            color: 0x000000,
                            shininess: 100,
                            transparent: true,
                            opacity: 0, // Start with opacity 0 for fade-in effect
                        });
                        const projectTextMesh = new THREE.Mesh(projectTextGeometry, projectTextMaterial);

                        // Position each option relative to the dropdown box
                        const dropdownPosition = projectDropdown.position;
                        projectTextMesh.position.set(
                            dropdownPosition.x - 1.5,
                            0.1, // Slight elevation above the ground
                            (dropdownPosition.z - index * 1) - 1 // Increase vertical spacing between options
                        );
                        projectTextMesh.rotation.set(-Math.PI / 2, 0, 0);

                        // Set the visibility to false initially
                        projectTextMesh.visible = false;

                        // Store the project name in userData for debugging
                        projectTextMesh.userData.title = project.title || '';

                        scene.add(projectTextMesh);

                        // Start fade-in effect for each project text
                        fadeInText([projectTextMesh]);

                        // Add interaction box for each project
                        const projectBox = new THREE.Box3().setFromObject(projectTextMesh);
                        if (projectBox) {
                            projectNameEntries.push({
                                mesh: projectTextMesh,
                                box: projectBox,
                                projectId: project.projectId,
                            });
                        } else {
                            console.error('Failed to create interaction box for project:', project.title);
                        }
                    });
                } else {
                    console.error('Expected an array but received:', projects);
                }
            })
            .catch(error => {
                console.error('Error loading projects:', error);
            });
    } else {
        console.error('Font not loaded yet.');
    }
}

function fadeInText(meshes) {
    const duration = 1000; // Duration in milliseconds
    const step = 16; // Step for requestAnimationFrame
    const increment = step / duration;

    let opacity = 0;
    const interval = setInterval(() => {
        opacity += increment;
        if (opacity >= 1) {
            opacity = 1;
            clearInterval(interval);
        }
        meshes.forEach(mesh => {
            mesh.material.opacity = opacity;
        });
    }, step);
}

// Handle window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;  // Maintain aspect ratio
    camera.updateProjectionMatrix();  // Update the camera projection
    renderer.setSize(window.innerWidth, window.innerHeight);  // Resize the renderer
}

// Handle keydown events for movement
function onKeyDown(event) {
    if (inTestimonialMode) return;

    switch (event.key) {
        case 'ArrowUp': case 'w': moveForward = true; break;
        case 'ArrowDown': case 's': moveBackward = true; break;
        case 'ArrowLeft': case 'a': moveLeft = true; break;
        case 'ArrowRight': case 'd': moveRight = true; break;
        case 'Enter':
            console.log("Enter key pressed, attempting interaction...");
            handleInteraction();
            break;
    }
}

// Handle keyup events to stop movement
function onKeyUp(event) {
    if (inTestimonialMode) return;  // Ignore movement keys when in testimonial mode

    switch (event.key) {
        case 'ArrowUp': case 'w': moveForward = false; break;
        case 'ArrowDown': case 's': moveBackward = false; break;
        case 'ArrowLeft': case 'a': moveLeft = false; break;
        case 'ArrowRight': case 'd': moveRight = false; break;
    }
}

// Update the character's movement
let characterBox = new THREE.Box3();

function updateMovement() {
    if (inTestimonialMode) return;  // Disable movement when in testimonial mode

    const oldPosition = character.position.clone();

    // Adjust isometric movement
    const forwardVector = new THREE.Vector3(-1, 0, -1).normalize();
    const backwardVector = new THREE.Vector3(1, 0, 1).normalize();
    const leftVector = new THREE.Vector3(-1, 0, 1).normalize();
    const rightVector = new THREE.Vector3(1, 0, -1).normalize();

    // Move the character based on input
    if (moveForward) character.position.add(forwardVector.clone().multiplyScalar(moveSpeed));
    if (moveBackward) character.position.add(backwardVector.clone().multiplyScalar(moveSpeed));
    if (moveLeft) character.position.add(leftVector.clone().multiplyScalar(moveSpeed));
    if (moveRight) character.position.add(rightVector.clone().multiplyScalar(moveSpeed));

    // Update the character's bounding box only if position changed
    if (!oldPosition.equals(character.position)) {
        characterBox.setFromObject(character);
    }

    // Check for collisions with walls and pedestals
    let isCollision = false;
    for (let i = 0; i < wallBoxes.length; i++) {
        if (characterBox.intersectsBox(wallBoxes[i])) {
            isCollision = true;
            break;
        }
    }
    for (let i = 0; i < pedestalBoxes.length; i++) {
        if (characterBox.intersectsBox(pedestalBoxes[i])) {
            isCollision = true;
            break;
        }
    }

    // Allow walking over interaction boxes
    for (let i = 0; i < interactionBoxes.length; i++) {
        const interactionBoxEntry = interactionBoxes[i];
        const interactionBox = interactionBoxEntry.box;

        if (interactionBox && interactionBox.isBox3) {
            if (characterBox.intersectsBox(interactionBox)) {
                // Character is on an interaction box, but it should not be blocked
                isCollision = false;
                break; // Stop checking after finding an interaction
            }
        } else {
            console.error('Invalid interaction box:', interactionBox);
        }
    }

    if (isCollision) {
        character.position.copy(oldPosition);  // Revert to old position on collision
    }

    // Update the camera to follow the character
    camera.position.x = character.position.x + 10;
    camera.position.z = character.position.z + 10;
    camera.lookAt(character.position);
}

async function fetchProjectsAndCreatePedestals() {
    try {
        const response = await fetch('/api/projectsAPI');
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const projects = result.$values || result;

        if (!Array.isArray(projects)) {
            throw new Error('Expected an array of projects but received: ' + JSON.stringify(projects));
        }

        createMuseum(projects.length);  // Adjust museum size based on project count
        createPedestals(projects);

        return projects;
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];  // Return an empty array if there's an error
    }
}


let pedestals = [];
let pedestalBoxes = [];  // For collision detection with the character
let pedestalTouched = [];  // To track if the pedestal has already triggered

function createPedestals(projects) {
    console.log('Projects:', projects);
    const pedestalGeometry = new THREE.BoxGeometry(1, 1, 1);  // Cube geometry for the pedestal
    const pedestalMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd });  // Light gray color

    const museumWidth = Math.max(30, projects.length * 20);  // Use the same logic as in createMuseum
    const startX = -museumWidth / 2 + 10;  // Start 10 units away from the left wall
    const projectSpacing = museumWidth / (projects.length + 1);  // Evenly distribute projects

    projects.forEach((project, index) => {
        console.log('Creating pedestal for project ID:', project.projectId);
        const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);

        // Center the pedestals by calculating their position based on the index
        pedestal.position.set(startX + index * projectSpacing, 0.5, 0);  // Centered along the x-axis
        pedestal.userData = project;  // Store project data in userData for later use
        scene.add(pedestal);
        pedestals.push(pedestal);
        pedestalBoxes.push(new THREE.Box3().setFromObject(pedestal));  // Initialize bounding box
        pedestalTouched.push(false);  // Not touched initially

        // Optionally, add interaction box and label for each pedestal
        addInteractionBoxAndLabel(pedestal, project);
    });
}

function addInteractionBoxAndLabel(pedestal, project) {
    // Create a flat interaction box on the ground next to the pedestal
    const interactionBoxGeometry = new THREE.PlaneGeometry(1, 1);
    const interactionBoxMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
    const interactionBoxMesh = new THREE.Mesh(interactionBoxGeometry, interactionBoxMaterial);

    interactionBoxMesh.position.set(pedestal.position.x + 1.5, 0.001, pedestal.position.z);
    interactionBoxMesh.rotation.x = -Math.PI / 2;

    interactionBoxMesh.userData = { url: project.projectUrl };
    scene.add(interactionBoxMesh);

    const interactionBox3 = new THREE.Box3().setFromObject(interactionBoxMesh);
    interactionBoxes.push({
        box: interactionBox3,
        type: 'link',
        mesh: interactionBoxMesh,
        url: project.projectUrl
    });

    // Add "Link" text using cached font
    if (cachedFont) {
        const linkTextGeometry = new THREE.TextGeometry('Link', {
            font: cachedFont,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });

        const linkTextMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 });
        const linkTextMesh = new THREE.Mesh(linkTextGeometry, linkTextMaterial);
        linkTextMesh.position.set(interactionBoxMesh.position.x - 0.3, 0.01, interactionBoxMesh.position.z);
        linkTextMesh.rotation.set(-Math.PI / 2, 0, 0);  // Rotate to lay flat on the interaction box

        scene.add(linkTextMesh);
    } else {
        console.error('Font not loaded yet.');
    }
}

// Fetch and Display Project Information
function showProjectDetails(pedestalIndex, pedestal) {
    const project = pedestals[pedestalIndex]?.userData;

    if (!project) {
        console.error('No project data found for pedestal index:', pedestalIndex);
        return;
    }

    // Render project details on the ground in front of the pedestal
    createProjectInfoOnGround(project, pedestal);
}

function createProjectInfoOnGround(project, pedestal) {
    if (cachedFont) {
        createTextMeshes(cachedFont, project, pedestal);
    } else {
        console.error('Font not loaded yet.');
    }
}

function createTextMeshes(font, project, pedestal) {
    if (!project || !project.title || !project.description) {
        console.error('Invalid project data:', project);
        return;
    }

    // Create 3D text for the project title
    const textGeometry = new THREE.TextGeometry(project.title, {
        font: font,
        size: 0.4,
        height: 0.01,
        curveSegments: 24,
    });

    const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100, transparent: true, opacity: 0 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Position the text on the ground in front of the pedestal
    textMesh.position.set(pedestal.position.x - 3, 0, pedestal.position.z);
    textMesh.rotation.set(0, Math.PI / 4, 0);

    // Add the text to the scene
    scene.add(textMesh);

    // Create 3D text for the project description
    const descriptionGeometry = new THREE.TextGeometry(project.description, {
        font: font,
        size: 0.3,
        height: 0.01,
        curveSegments: 24,
    });

    const descriptionMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100, transparent: true, opacity: 0 });
    const descriptionMesh = new THREE.Mesh(descriptionGeometry, descriptionMaterial);

    // Position the description below the title
    descriptionMesh.position.set(pedestal.position.x - 3.5, 0.7, pedestal.position.z);
    descriptionMesh.rotation.set(0, Math.PI / 4, 0);

    // Add the description to the scene
    scene.add(descriptionMesh);

    // Start fade-in effect for both title and description
    fadeInText([textMesh, descriptionMesh]);
}

function fadeInText(textMeshes) {
    let fadeInDuration = 2000; // Duration in milliseconds
    let startTime = performance.now();

    function fadeIn() {
        let elapsed = performance.now() - startTime;
        let progress = Math.min(elapsed / fadeInDuration, 1); // Cap progress at 1
        textMeshes.forEach(mesh => {
            mesh.material.opacity = progress; // Gradually increase opacity
        });

        if (progress < 1) {
            requestAnimationFrame(fadeIn); // Continue until fully visible
        }
    }

    fadeIn();
}


// Handle interactions when the 'Enter' key is pressed
function handleInteraction() {
    // Update the character's bounding box
    characterBox.setFromObject(character);

    if (dropdownOpen) {
        if (projectNameEntries.length === 0) {
            console.warn('Project names are not loaded yet.');
            return;
        }

        let projectSelected = false;
        for (let i = 0; i < projectNameEntries.length; i++) {
            const projectEntry = projectNameEntries[i];
            projectEntry.box.setFromObject(projectEntry.mesh); // Update bounding box

            if (characterBox.intersectsBox(projectEntry.box)) {
                selectedProjectId = projectEntry.projectId;

                // Reset color of previous selection
                if (selectedProjectMesh) {
                    selectedProjectMesh.material.color.set(0x000000);
                }

                // Set color of new selection
                selectedProjectMesh = projectEntry.mesh;
                selectedProjectMesh.material.color.set(0xff0000); // Change color to red

                // Close the dropdown and hide project names
                dropdownOpen = false;
                for (let j = 0; j < projectNameEntries.length; j++) {
                    projectNameEntries[j].mesh.visible = false;
                }

                projectSelected = true;
                break;
            }
        }

        if (!projectSelected) {
            console.log('Character is not over any project name.');
        }

        return;
    }

    // Check for interactions with other boxes
    let foundInteraction = false;
    for (let i = 0; i < interactionBoxes.length; i++) {
        const interactionBoxEntry = interactionBoxes[i];
        const interactionBox = interactionBoxEntry.box;

        if (characterBox.intersectsBox(interactionBox)) {
            foundInteraction = true;

            if (interactionBoxEntry.type === 'dropdown') {
                dropdownOpen = !dropdownOpen; // Toggle dropdown open state

                // Show or hide the project names with fade-in effect
                for (let j = 0; j < projectNameEntries.length; j++) {
                    const projectMesh = projectNameEntries[j].mesh;
                    if (dropdownOpen) {
                        projectMesh.visible = true;
                        fadeInText([projectMesh]); // Apply fade-in when opened
                    } else {
                        projectMesh.visible = false;
                    }
                }
                return;

            } else if (interactionBoxEntry.type === 'testimonial') {
                if (selectedProjectId) {
                    enterTestimonialMode();
                } else {
                    console.error('No project selected. Please select a project from the dropdown first.');
                }
                return;

            } else if (interactionBoxEntry.type === 'link') {
                const url = interactionBoxEntry.url;
                if (url) {
                    window.open(url, '_blank');
                } else {
                    console.error('No URL assigned to this interaction box.');
                }
                return;
            }
        }
    }

    if (!foundInteraction) {
        console.log("Character is not on any interaction box.");
    }
}


// Enter testimonial mode
let testimonialTextField;
function enterTestimonialMode() {
    if (!selectedProjectId) {
        console.error('No project selected. Please select a project from the dropdown first.');
        return;
    }

    inTestimonialMode = true;

    // Add event listener to capture input only in testimonial mode
    document.addEventListener('keydown', handleTextInput, false);

    // Create a text input field on the ground
    const inputFieldGeometry = new THREE.PlaneGeometry(3, 1);
    const inputFieldMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 0.8, transparent: true });
    testimonialTextField = new THREE.Mesh(inputFieldGeometry, inputFieldMaterial);
    testimonialTextField.position.set(addTestimonialBox.position.x, 0.001, addTestimonialBox.position.z - 2);
    testimonialTextField.rotation.x = -Math.PI / 2;
    scene.add(testimonialTextField);

    if (cachedFont) {
        const projectName = projectNameEntries.find(entry => entry.projectId === selectedProjectId)?.mesh.userData.title || 'Unknown Project';

        const projectNameGeometry = new THREE.TextGeometry(projectName, {
            font: cachedFont,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });

        const projectNameMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100, transparent: true, opacity: 0 });
        projectNameTextMesh = new THREE.Mesh(projectNameGeometry, projectNameMaterial);
        projectNameTextMesh.position.set(addTestimonialBox.position.x - 1.5, 0.1, addTestimonialBox.position.z - 1.5);
        projectNameTextMesh.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(projectNameTextMesh);

        const testimonialGeometry = new THREE.TextGeometry('', {
            font: cachedFont,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });

        const testimonialMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100, transparent: true, opacity: 0 });
        testimonialDisplayTextMesh = new THREE.Mesh(testimonialGeometry, testimonialMaterial);
        testimonialDisplayTextMesh.position.set(addTestimonialBox.position.x - 1.5, 0.1, addTestimonialBox.position.z - 2);
        testimonialDisplayTextMesh.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(testimonialDisplayTextMesh);

        // Start fade-in effect
        fadeInText([projectNameTextMesh, testimonialDisplayTextMesh]);
    } else {
        console.error('Font not loaded yet.');
    }
}

function fadeInText(textMeshes) {
    let fadeInDuration = 2000; // Duration in milliseconds
    let startTime = performance.now();

    function fadeIn() {
        let elapsed = performance.now() - startTime;
        let progress = Math.min(elapsed / fadeInDuration, 1); // Cap progress at 1
        textMeshes.forEach(mesh => {
            mesh.material.opacity = progress; // Gradually increase opacity
        });

        if (progress < 1) {
            requestAnimationFrame(fadeIn); // Continue until fully visible
        }
    }

    fadeIn();
}


// Submit the testimonial to the backend
function submitTestimonial(text) {
    if (!selectedProjectId) {
        console.error('No project selected. Cannot submit testimonial.');
        return;
    }
    fetch('/api/testimonialsAPI', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: text, authorName: "Anonymous", projectId: selectedProjectId })
    }).then(response => {
        if (response.ok) {
            console.log('Testimonial added successfully');
            loadTestimonials();
        } else {
            response.json().then(data => {
                console.error('Failed to add testimonial:', data);
            });
        }
    }).catch(error => {
        console.error('Error submitting testimonial:', error);
    });
}

// Exit testimonial mode
function exitTestimonialMode() {
    inTestimonialMode = false;
    testimonialText = '';
    scene.remove(testimonialTextField, testimonialDisplayTextMesh, projectNameTextMesh);

    // Ensure we remove the event listener to prevent further text input
    document.removeEventListener('keydown', handleTextInput, false);
    console.log("Exited testimonial mode and removed keydown listener");
}

// Handle text input for the testimonial
let testimonialText = '';
function handleTextInput(event) {
    // Check if inTestimonialMode is true to process input
    if (!inTestimonialMode) return;

    // Exit testimonial mode if Escape is pressed
    if (event.key === 'Escape') {
        exitTestimonialMode();
        return;
    }

    // Process other keys for input
    if (event.key === 'Enter') {
        if (testimonialText.trim() === '') {
            console.error('Cannot submit an empty testimonial.');
            return;
        }
        console.log('Submitting testimonial:', testimonialText);
        submitTestimonial(testimonialText);
        exitTestimonialMode();
    } else if (event.key === 'Backspace') {
        testimonialText = testimonialText.slice(0, -1);
    } else if (event.key.length === 1) {
        testimonialText += event.key;
    }

    // Update the testimonial text display using cached font
    if (testimonialDisplayTextMesh && cachedFont) {
        const updatedGeometry = new THREE.TextGeometry(testimonialText, {
            font: cachedFont,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });
        testimonialDisplayTextMesh.geometry.dispose();  // Clean up old geometry
        testimonialDisplayTextMesh.geometry = updatedGeometry;
    }
}

// Load testimonials and display them
function loadTestimonials() {
    fetch('/api/testimonialsAPI')
        .then(response => response.json())
        .then(result => {
            const testimonials = result.$values || result; // Handle both wrapped and plain array

            if (Array.isArray(testimonials)) {
                const testimonialsByProject = {};

                // Group testimonials by projectId
                testimonials.forEach(testimonial => {
                    const projectId = testimonial.projectId;
                    if (!testimonialsByProject[projectId]) {
                        testimonialsByProject[projectId] = [];
                    }
                    testimonialsByProject[projectId].push(testimonial);
                });

                // Render each group of testimonials
                Object.keys(testimonialsByProject).forEach(projectId => {
                    const testimonials = testimonialsByProject[projectId];
                    const associatedPedestal = pedestals.find(pedestal => pedestal.userData.projectId === parseInt(projectId));

                    if (associatedPedestal && cachedFont) {
                        testimonials.forEach((testimonial, index) => {
                            // Create geometry and material for testimonial text
                            const textGeometry = new THREE.TextGeometry(testimonial.content, {
                                font: cachedFont,
                                size: 0.3,
                                height: 0.01,
                                curveSegments: 12,
                            });
                            const textMaterial = new THREE.MeshPhongMaterial({
                                color: 0x000000,
                                shininess: 100,
                                transparent: true,
                                opacity: 0 // Start with opacity 0 for fade-in effect
                            });
                            const textMesh = new THREE.Mesh(textGeometry, textMaterial);

                            // Position the testimonial text relative to the associated pedestal
                            textMesh.position.set(
                                associatedPedestal.position.x + 2.2,
                                0.01,
                                associatedPedestal.position.z - (index * 0.6) // Offset each testimonial for the same project
                            );
                            textMesh.rotation.set(-Math.PI / 2, 0, 0);
                            scene.add(textMesh);

                            // Apply fade-in effect
                            fadeInText([textMesh]);
                        });
                    } else {
                        console.error(`No pedestal found for project ID ${projectId} or font not loaded`);
                    }
                });
            } else {
                console.error('Expected an array but received:', testimonials);
            }
        })
        .catch(error => {
            console.error('Error loading testimonials:', error);
        });
}



//Stop spacebar from affecting scrolling
window.addEventListener('keydown', function (e) {
    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
    }
});
function logGeometry(geometry, name) {
    if (geometry.attributes.position) {
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            if (isNaN(positions[i]) || isNaN(positions[i + 1]) || isNaN(positions[i + 2])) {
                console.error(`NaN found in ${name} at index ${i / 3}:`, positions[i], positions[i + 1], positions[i + 2]);
            }
        }
    } else {
        console.error(`No position attribute in ${name}`);
    }
}

// Animation loop to render the scene and update the movement
function animate() {
    requestAnimationFrame(animate);
    updateMovement();  // Update character movement
    renderer.render(scene, camera);
}

// Start the scene once the window has loaded
window.onload = function () {
    init();
};
