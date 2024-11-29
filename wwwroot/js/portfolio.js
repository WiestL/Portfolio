// Variables for the scene, camera, renderer, and character
let scene, camera, renderer, character;
let characterModel; // Reference to the loaded character model
let controlSignModel; // Reference to the loaded control sign model
let controlSign; // Instance of the control sign added to the scene
let grassModel1, grassModel2; // References to the loaded grass models
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const moveSpeed = 7;  // Character movement speed
let raycaster;
let inTestimonialMode = false;  // Track whether user is in testimonial mode
let intersectedPedestal = null;  // Track the current pedestal in proximity
let testimonialDisplayTextMesh;
let projectNameTextMesh;
let cachedFont; // Cache the font for reuse
let clock = new THREE.Clock(); // Keeps track of time between frames
let skillsSigns = [];    // Store skill signs
let categoriesSigns = []; // Store category signs
let wallMeshes = []; // Track each wall object for proper removal
let floor; // Reference to the floor mesh
let pedestalModel; // Reference to the loaded pedestal model
let testimonialMeshes = []; // Array to store testimonial meshes
let addTestimonialBox; // Reference to the testimonial box

// Variables for materials
const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x62afa3 });
const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xb2feff });
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x67e571 });

// New variables for proximity detection
let proximitySpheres = []; // Array to store proximity spheres for each pedestal
let projectInfoVisible = []; // Track visibility state for each pedestal's info
let pedestalInfoMeshes = []; // Store the text meshes for each pedestal's info

let fontLoader, gltfLoader, loadingManager;

const progressBar = document.getElementById('progressBar');
const loadingOverlay = document.getElementById('loadingOverlay');

let initCalled = false; // Flag to prevent multiple calls to init()

// Initialize the scene
async function init() {
    if (initCalled) {
        console.warn("init() has already been called.");
        return;
    }
    initCalled = true;

    console.log("init() called"); // Debugging statement

    // Set up the scene and camera
    setupScene();

    // Now that assets are loaded, proceed with functions that depend on them
    createCharacter();           // Uses preloaded `characterModel`
    createAddTestimonialBox();
    createProjectDropdown();

    createControlInstructions(); // Uses preloaded `controlSignModel`

    // Fetch projects and proceed after fetching
    const projects = await fetchProjectsAndCreatePedestals();
    const numProjects = projects.length;

    createMuseum(numProjects); // Pass the correct number of projects

    // Extract project IDs
    const visibleProjectIds = projects.map(project => project.projectId);
    loadTestimonials(visibleProjectIds); // Proceed with testimonials after loading projects

    const skills = await fetchSkills();       // Fetch skills from API
    const categories = await fetchCategories(); // Fetch categories from API
    createSkillAndCategorySigns(skills, categories);

    makeGround(); // Uses preloaded `grassModel1` and `grassModel2`

    // Set up event listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // Throttle proximity check
    setInterval(checkProximityToPedestals, 100); // Check every 100ms

    animate(); // Start the animation loop
}

function setupScene() {
    scene = new THREE.Scene();

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
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    // Directional light without shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6); // Color and intensity
    directionalLight.position.set(10, 20, 10); // Position the light to cast from a specific direction
    scene.add(directionalLight);
}

function makeGround() {
    // Create the ground plane
    const groundSize = 300;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    scene.add(ground);


    scatterGrass(grassModel1, 200);
    scatterGrass(grassModel2, 600);
}

function scatterGrass(model, count) {
    for (let i = 0; i < count; i++) {
        const grassClone = model.clone();
        grassClone.position.x = Math.random() * 300 - 150;
        grassClone.position.z = Math.random() * 300 - 150;
        grassClone.position.y = 0.2;
        grassClone.rotation.y = Math.random() * Math.PI * 2;
        scene.add(grassClone);
    }
}


function checkProximityToPedestals() {
    if (!character) return;
    const characterPosition = character.position.clone();  // Get character's position

    for (let i = 0; i < proximitySpheres.length; i++) {
        const isNear = proximitySpheres[i].containsPoint(characterPosition);

        if (isNear && !projectInfoVisible[i]) {
            // Show project info
            console.log("Character is near pedestal:", i);
            showProjectDetails(i, pedestals[i]);
            projectInfoVisible[i] = true;
        } else if (!isNear && projectInfoVisible[i]) {
            // Hide project info
            console.log("Character moved away from pedestal:", i);
            hideProjectDetails(i);
            projectInfoVisible[i] = false;
        }
    }
}

function createSkillAndCategorySigns(skills, categories) {
    // Ensure font is loaded
    if (!cachedFont) {
        console.error("Font not loaded yet.");
        return;
    }

    // Avoid creating signs multiple times
    if (skillsSigns.length > 0 || categoriesSigns.length > 0) {
        console.log("Skill and category signs already created.");
        return;
    }

    // Define grid parameters
    const signsPerRow = 4; // Number of signs per row
    const gridSpacing = 5; // Spacing between signs
    const signSize = { width: 4, height: 1 };
    const skillStartPosition = new THREE.Vector3(-10, 0.1, 20);
    const categoryStartPosition = new THREE.Vector3(10, 0.1, 20);

    // Helper function to create a sign
    function createSign(text, position, color) {
        const signGeometry = new THREE.BoxGeometry(signSize.width, signSize.height, 0.2);
        const signMaterial = new THREE.MeshLambertMaterial({ color: color });
        const signMesh = new THREE.Mesh(signGeometry, signMaterial);
        signMesh.position.copy(position);

        // Create text mesh
        const textGeometry = new THREE.TextGeometry(text, {
            font: cachedFont,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });
        const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(position.x - signSize.width / 2 + 0.2, position.y + signSize.height / 2 - 0.2, position.z + 0.11);
        textMesh.rotation.y = 0;

        scene.add(signMesh);
        scene.add(textMesh);

        return signMesh;
    }

    // Create skill signs
    skills.forEach((skill, index) => {
        const row = Math.floor(index / signsPerRow);
        const col = index % signsPerRow;

        const position = new THREE.Vector3(
            skillStartPosition.x + col * gridSpacing,
            skillStartPosition.y + signSize.height / 2,
            skillStartPosition.z + row * gridSpacing
        );

        const signMesh = createSign(skill.name, position, 0x00ff00); // Green color for skills

        // Add bounding box for interaction
        skillsSigns.push({
            skillId: skill.skillId,
            mesh: signMesh
        });
    });

    // Create category signs
    categories.forEach((category, index) => {
        const row = Math.floor(index / signsPerRow);
        const col = index % signsPerRow;

        const position = new THREE.Vector3(
            categoryStartPosition.x + col * gridSpacing,
            categoryStartPosition.y + signSize.height / 2,
            categoryStartPosition.z + row * gridSpacing
        );

        const signMesh = createSign(category.name, position, 0xffff00); // Yellow color for categories

        // Add bounding box for interaction
        categoriesSigns.push({
            categoryId: category.categoryId,
            mesh: signMesh
        });
    });
}

function createControlInstructions() {
    if (!cachedFont || !controlSignModel) {
        console.error('Font or control sign model not loaded yet.');
        return;
    }

    if (controlSign) {
        console.log("Control sign already added to the scene.");
        return;
    }

    const instructions = [
        "- HAVE FUN",
        "- Use W, A, S, D, or arrow keys to walk around",
        "- Walk up to a project to see details",
        "- Press Enter to interact with Signs/Boxes",
        "Controls:"
    ];

    controlSign = controlSignModel.clone();

    // Adjust the scale of the sign model as needed
    controlSign.scale.set(11, 11, 10);
    controlSign.traverse((child) => {
        if (child.isMesh) {
            child.material.emissive = new THREE.Color(0xffffff);
            child.material.emissiveIntensity = 0.1;
            child.material.roughness = 0.1;
            child.material.metalness = 0.1;
        }
    });

    // Set the position of the sign model
    controlSign.position.set(-35, 0, 18);
    controlSign.rotation.set(0, Math.PI / 4, 0);

    scene.add(controlSign);

    // Update the world matrix to ensure transformations are applied
    controlSign.updateMatrixWorld(true);

    // Create and position each line of instruction text on the sign
    const textMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        transparent: false,
        opacity: 1
    });

    const lineHeight = 2;

    instructions.forEach((line, index) => {
        const textGeometry = new THREE.TextGeometry(line, {
            font: cachedFont,
            size: 0.4,
            height: 0.02,
            curveSegments: 12,
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial.clone());

        textMesh.position.x = -36;
        textMesh.position.y = index * lineHeight + 15;
        textMesh.position.z = 25;

        textMesh.rotation.set(0, controlSign.rotation.y, 0);

        scene.add(textMesh);
    });
}

function createCharacter() {
    if (character) {
        console.log("Character model already added to the scene.");
        return;
    }

    if (!characterModel) {
        console.error("Character model not loaded yet.");
        return;
    }

    character = characterModel.clone(); // Use preloaded character model

    // Set the character's initial position
    character.position.set(-28, 0.5, 15); // Start the character outside the museum
    character.scale.set(7, 7, 7);

    // Add the character model to the scene
    scene.add(character);
}

let wallBoxes = [];  // Array to store bounding boxes for the walls

let museumCreated = false;
// Function to create the museum environment (floor and walls)
function createMuseum(numProjects) {
    // Log number of projects
    if (museumCreated) return; // Prevent multiple calls
    museumCreated = true;
    console.log(`Number of projects: ${numProjects}`);

    // Fallback for invalid numProjects
    numProjects = isNaN(numProjects) ? 0 : numProjects;

    // Calculate museum dimensions based on the number of projects
    const projectSpacing = 15;
    const museumWidth = Math.max(30, numProjects * projectSpacing);
    const museumDepth = 20;
    const openingSize = 10;

    // Validate dimensions
    if (isNaN(museumWidth) || isNaN(museumDepth) || isNaN(openingSize)) {
        console.error('Invalid museum dimensions', { museumWidth, museumDepth, openingSize });
        return; // Exit the function if dimensions are invalid
    }

    console.log(`Museum dimensions: width=${museumWidth}, depth=${museumDepth}, openingSize=${openingSize}`);

    floor = new THREE.Mesh(new THREE.PlaneGeometry(museumWidth, museumDepth), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    logGeometry(floor.geometry, 'Floor');

    // Create walls with an opening for entrance
    createWall(museumWidth, 5, 0.5, 0, 3, -museumDepth / 2, wallMaterial);  // Back wall
    createWall(museumWidth / 2 - openingSize / 2, 5, 0.5, -museumWidth / 4 - openingSize / 4, 3, museumDepth / 2, wallMaterial);  // Left part of front wall
    createWall(museumWidth / 2 - openingSize / 2, 5, 0.5, museumWidth / 4 + openingSize / 4, 3, museumDepth / 2, wallMaterial);  // Right part of front wall
    createWall(0.5, 5, museumDepth, -museumWidth / 2, 3, 0, wallMaterial);  // Left wall
    createWall(0.5, 5, museumDepth, museumWidth / 2, 3, 0, wallMaterial);  // Right wall
}

// Helper function to create a wall with bounding box and add to the scene
function createWall(width, height, depth, x, y, z, material) {
    if (isNaN(width) || isNaN(height) || isNaN(depth) || isNaN(x) || isNaN(y) || isNaN(z)) {
        console.error('NaN detected in createWall parameters', { width, height, depth, x, y, z });
        return null;
    }

    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    wall.position.set(x, y, z);
    wall.userData = { type: 'museumWall' }; // Set userData property for easy identification
    scene.add(wall);

    const edge = new THREE.EdgesGeometry(wall.geometry);
    const line = new THREE.LineSegments(edge, new THREE.LineBasicMaterial({ color: 0x000000 }));
    line.position.copy(wall.position);
    scene.add(line);

    wallBoxes.push(new THREE.Box3().setFromObject(wall));

    wallMeshes.push({ wall, line });

    return { wall, line };
}

// Helper function to dispose of objects
function disposeObject(object) {
    if (object.geometry) object.geometry.dispose();
    if (Array.isArray(object.material)) {
        object.material.forEach(material => material.dispose());
    } else if (object.material) {
        object.material.dispose();
    }
}

function createAddTestimonialBox() {
    if (addTestimonialBox) {
        console.log("Add Testimonial Box already created.");
        return;
    }
    const boxGeometry = new THREE.PlaneGeometry(3, 1);
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
    addTestimonialBox = new THREE.Mesh(boxGeometry, boxMaterial);
    addTestimonialBox.position.set(3, 0.001, 12);  // Slightly above ground to avoid z-fighting
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

    // Add label text using cachedFont
    if (cachedFont) {
        const textGeometry = new THREE.TextGeometry('Add Review', {
            font: cachedFont,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });
        const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(addTestimonialBox.position.x - 1.4, 0.02, addTestimonialBox.position.z);
        textMesh.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(textMesh);
    } else {
        console.error('Font not loaded yet.');
    }
}

let projectDropdown; // Dropdown for selecting project
let interactionBoxes = []; // Array to store interaction boxes
let selectedProjectId = null; // Store the selected project ID
let dropdownOpen = false; // Track if the dropdown is open
let projectNameEntries = [];
let selectedProjectMesh = null;
function createProjectDropdown() {
    if (projectDropdown) {
        console.log("Project Dropdown already created.");
        return;
    }
    const dropdownGeometry = new THREE.PlaneGeometry(3, 1);
    const dropdownMaterial = new THREE.MeshLambertMaterial({
        color: 0x0000ff,
        opacity: 0.5,
        transparent: true,
    });
    projectDropdown = new THREE.Mesh(dropdownGeometry, dropdownMaterial);
    projectDropdown.position.set(-3, 0.001, 12); // Position next to the testimonial box
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

    // Add label text using cachedFont
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
    const duration = 200; // Duration in milliseconds
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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;  // Maintain aspect ratio
    camera.updateProjectionMatrix();  // Update the camera projection
    renderer.setSize(window.innerWidth, window.innerHeight);  // Resize the renderer
}

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

function onKeyUp(event) {
    if (inTestimonialMode) return;  // Ignore movement keys when in testimonial mode

    switch (event.key) {
        case 'ArrowUp': case 'w': moveForward = false; break;
        case 'ArrowDown': case 's': moveBackward = false; break;
        case 'ArrowLeft': case 'a': moveLeft = false; break;
        case 'ArrowRight': case 'd': moveRight = false; break;
    }
}

let characterBox = new THREE.Box3();

function updateMovement() {
    if (inTestimonialMode) return;  // Disable movement when in testimonial mode
    if (!character) return;

    const deltaTime = clock.getDelta(); // Time elapsed since the last frame
    const adjustedSpeed = moveSpeed * deltaTime; // Adjust speed based on time

    // Adjust isometric movement vectors
    const forwardVector = new THREE.Vector3(-1, 0, -1).normalize();
    const backwardVector = new THREE.Vector3(1, 0, 1).normalize();
    const leftVector = new THREE.Vector3(-1, 0, 1).normalize();
    const rightVector = new THREE.Vector3(1, 0, -1).normalize();

    // Initialize movement vector
    let movementVector = new THREE.Vector3();

    // Calculate movement vector based on input
    if (moveForward) movementVector.add(forwardVector);
    if (moveBackward) movementVector.add(backwardVector);
    if (moveLeft) movementVector.add(leftVector);
    if (moveRight) movementVector.add(rightVector);

    if (movementVector.length() > 0) {
        movementVector.normalize().multiplyScalar(adjustedSpeed);

        const oldPosition = character.position.clone();

        // Move in X direction
        character.position.x += movementVector.x;
        // Update the character's bounding box
        characterBox.setFromObject(character);

        // Check for collisions in X direction
        if (checkCollision()) {
            // If collision in X, revert X movement
            character.position.x = oldPosition.x;
            characterBox.setFromObject(character);
        }

        // Move in Z direction
        character.position.z += movementVector.z;
        // Update the character's bounding box
        characterBox.setFromObject(character);

        // Check for collisions in Z direction
        if (checkCollision()) {
            // If collision in Z, revert Z movement
            character.position.z = oldPosition.z;
            characterBox.setFromObject(character);
        }

        // Rotate the character to face the movement direction
        const angleOffset = -Math.PI / 2; // Adjusted angle offset
        const angle = Math.atan2(movementVector.x, movementVector.z) + angleOffset;
        character.rotation.y = angle;
    }

    // Update the camera to follow the character
    camera.position.x = character.position.x + 10;
    camera.position.z = character.position.z + 10;
    camera.lookAt(character.position);
}

function checkCollision() {
    // Update collision boxes for pedestals
    for (let i = 0; i < pedestalBoxes.length; i++) {
        pedestalBoxes[i].setFromObject(collisionBoxes[i]); // Update the pedestal's collision box
    }

    // Check for collisions with walls
    for (let i = 0; i < wallBoxes.length; i++) {
        if (characterBox.intersectsBox(wallBoxes[i])) {
            return true;
        }
    }

    // Check for collisions with pedestals
    for (let i = 0; i < pedestalBoxes.length; i++) {
        if (characterBox.intersectsBox(pedestalBoxes[i])) {
            return true;
        }
    }

    return false;
}

async function fetchProjectsAndCreatePedestals() {
    try {
        const response = await fetch('/api/projectsAPI');
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Handle cases where the response is either an array directly or wrapped in a $values property
        const projects = Array.isArray(result) ? result : result.$values || [];

        // Verify that projects is indeed an array
        if (!Array.isArray(projects)) {
            throw new Error('Expected an array of projects but received: ' + JSON.stringify(projects));
        }

        // Proceed with your logic
        createMuseum(projects.length);  // Adjust museum size based on project count
        createPedestals(projects);

        return projects;
    } catch (error) {
        console.error('Error fetching projects:', error);
        alert("An error occurred while fetching projects. Check the console for details.");
        return [];  // Return an empty array if there's an error
    }
}

let pedestals = [];
let pedestalBoxes = [];  // For collision detection with the character
let collisionBoxes = []; // To store collision boxes

function createPedestals(projects) {
    // Use the preloaded pedestal model
    createPedestalsFromModel(pedestalModel, projects);
}

function createPedestalsFromModel(model, projects) {
    const museumWidth = Math.max(30, projects.length * 20);
    const startX = -museumWidth / 2 + 10;
    const totalProjects = projects.length;
    const projectSpacing = 15; // Fixed spacing between projects

    projects.forEach((project, index) => {
        // Clone the pedestal model for each project
        const pedestal = model.clone();

        // Calculate the position to center the projects
        const positionX = (index - (totalProjects - 1) / 2) * projectSpacing;
        pedestal.position.set(positionX, 0, 0);
        pedestal.userData = project;
        scene.add(pedestal);

        // Add pedestal to the array for tracking
        pedestals.push(pedestal);

        // Calculate the pedestal's bounding box size
        const pedestalBox3 = new THREE.Box3().setFromObject(pedestal);
        const size = new THREE.Vector3();
        pedestalBox3.getSize(size);
        size.multiplyScalar(0.6);

        // Create the collision box with the new size
        const collisionBoxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const collisionBoxMaterial = new THREE.MeshBasicMaterial({ visible: false });
        const collisionBox = new THREE.Mesh(collisionBoxGeometry, collisionBoxMaterial);

        // Position the collision box to match the pedestal
        collisionBox.position.copy(pedestal.position);
        collisionBox.position.y += size.y / 2; // Center vertically
        scene.add(collisionBox);

        // Update bounding box for the collision box
        const pedestalBox = new THREE.Box3().setFromObject(collisionBox);
        pedestalBoxes.push(pedestalBox);

        // Store the collision box for updates
        collisionBoxes.push(collisionBox);

        // Create the proximity sphere for displaying project info when the character is near
        const proximityRadius = 5; // Adjust this value as needed
        const proximitySphere = new THREE.Sphere(pedestal.position.clone(), proximityRadius);
        proximitySpheres.push(proximitySphere);

        // Initialize visibility and meshes arrays for project info
        projectInfoVisible.push(false);
        pedestalInfoMeshes.push(null);

        // Add the interaction link box and label for each pedestal
        addInteractionBoxAndLabel(pedestal, project);
    });
}

function addInteractionBoxAndLabel(pedestal, project) {
    // Create a smaller interaction box based on the pedestal's scale
    const interactionBoxGeometry = new THREE.PlaneGeometry(1, 1); // Smaller box size
    const interactionBoxMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
    const interactionBoxMesh = new THREE.Mesh(interactionBoxGeometry, interactionBoxMaterial);

    // Position the interaction box closer to the pedestal
    interactionBoxMesh.position.set(pedestal.position.x, pedestal.position.y + 0.1, pedestal.position.z + 1);
    interactionBoxMesh.rotation.x = -Math.PI / 2;

    interactionBoxMesh.userData = { url: project.projectUrl };
    scene.add(interactionBoxMesh);
    const interactionBox3 = new THREE.Box3().setFromObject(interactionBoxMesh);

    const interactionBoxEntry = {
        box: interactionBox3,
        type: 'link',
        mesh: interactionBoxMesh,
        url: project.projectUrl,
        textMesh: null // Placeholder for the Link text mesh
    };

    // Add "Link" text using cachedFont
    if (cachedFont) {
        const linkTextGeometry = new THREE.TextGeometry('Link', {
            font: cachedFont,
            size: 0.3, // Smaller size for scaled-down objects
            height: 0.01,
            curveSegments: 12,
        });

        const linkTextMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const linkTextMesh = new THREE.Mesh(linkTextGeometry, linkTextMaterial);
        linkTextMesh.position.set(interactionBoxMesh.position.x - 0.25, 0.1, interactionBoxMesh.position.z);
        linkTextMesh.rotation.set(-Math.PI / 2, 0, 0);  // Rotate to lay flat on the interaction box

        scene.add(linkTextMesh);

        // Store the text mesh in the interaction box entry
        interactionBoxEntry.textMesh = linkTextMesh;
    } else {
        console.error('Font not loaded yet.');
    }

    interactionBoxes.push(interactionBoxEntry);
}

// Fetch and Display Project Information
function showProjectDetails(pedestalIndex, pedestal) {
    const project = pedestals[pedestalIndex]?.userData;

    if (!project) {
        console.error('No project data found for pedestal index:', pedestalIndex);
        return;
    }

    // Render project details on the ground in front of the pedestal
    const textMeshes = createProjectInfoOnGround(project, pedestal);
    console.log("Displaying project info:", project.title, project.description);

    // Store the text meshes in pedestalInfoMeshes
    pedestalInfoMeshes[pedestalIndex] = textMeshes;
}

function hideProjectDetails(pedestalIndex) {
    const meshes = pedestalInfoMeshes[pedestalIndex];
    if (meshes) {
        meshes.forEach(mesh => {
            scene.remove(mesh);
            disposeObject(mesh);
        });
        pedestalInfoMeshes[pedestalIndex] = null;
    }
}

function createProjectInfoOnGround(project, pedestal) {
    if (cachedFont) {
        const textMeshes = createTextMeshes(cachedFont, project, pedestal);
        return textMeshes; // Return the text meshes
    } else {
        console.error('Font not loaded yet.');
        return null;
    }
}

function createTextMeshes(font, project, pedestal) {
    if (!project || !project.title || !project.description) {
        console.error('Invalid project data:', project);
        return null;
    }

    // Create 3D text for the project title
    const textGeometry = new THREE.TextGeometry(project.title, {
        font: font,
        size: 0.4,
        height: 0.01,
        curveSegments: 24,
    });

    const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Position the text on the ground in front of the pedestal
    textMesh.position.set(pedestal.position.x - 3, 0, pedestal.position.z - 0.2);
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

    const descriptionMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0 });
    const descriptionMesh = new THREE.Mesh(descriptionGeometry, descriptionMaterial);

    // Position the description below the title
    descriptionMesh.position.set(pedestal.position.x - 4, 0.7, pedestal.position.z - 0.2);
    descriptionMesh.rotation.set(0, Math.PI / 4, 0);

    // Add the description to the scene
    scene.add(descriptionMesh);

    // Start fade-in effect for both title and description
    fadeInText([textMesh, descriptionMesh]);

    // Return the meshes so we can remove them later
    return [textMesh, descriptionMesh];
}

// Handle interactions when the 'Enter' key is pressed
function handleInteraction() {
    // Update the character's bounding box
    if (!character) return;
    characterBox.setFromObject(character);

    // Check if the dropdown is open and handle project selection
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

    // Check for interactions with skill signs
    for (let i = 0; i < skillsSigns.length; i++) {
        const skillSign = skillsSigns[i];
        const signBox = new THREE.Box3().setFromObject(skillSign.mesh); // Update bounding box for the sign

        if (characterBox.intersectsBox(signBox)) {
            console.log(`Interacting with skill sign: ${skillSign.skillId}`);
            filterProjects(skillSign.skillId, null); // Filter by the skill associated with this sign
            return;
        }
    }

    // Check for interactions with category signs
    for (let i = 0; i < categoriesSigns.length; i++) {
        const categorySign = categoriesSigns[i];
        const signBox = new THREE.Box3().setFromObject(categorySign.mesh); // Update bounding box for the sign

        if (characterBox.intersectsBox(signBox)) {
            console.log(`Interacting with category sign: ${categorySign.categoryId}`);
            filterProjects(null, categorySign.categoryId); // Filter by the category associated with this sign
            return;
        }
    }

    // Existing interaction logic for other interaction boxes (dropdowns, testimonials, links)
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

        const projectNameMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0 });
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

        const testimonialMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0 });
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
    disposeObject(testimonialTextField);
    disposeObject(testimonialDisplayTextMesh);
    disposeObject(projectNameTextMesh);

    // Ensure we remove the event listener to prevent further text input
    document.removeEventListener('keydown', handleTextInput, false);
    console.log("Exited testimonial mode and removed keydown listener");
}

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

    // Update the testimonial text display using cachedFont
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
function loadTestimonials(visibleProjectIds = []) {
    fetch('/api/testimonialsAPI')
        .then(response => response.json())
        .then(result => {
            const testimonials = result.$values || result; // Handle both wrapped and plain array

            if (Array.isArray(testimonials)) {
                const testimonialsByProject = {};

                // Group testimonials by projectId
                testimonials.forEach(testimonial => {
                    const projectId = testimonial.projectId;
                    // Include testimonials if visibleProjectIds is empty or includes the projectId
                    if (visibleProjectIds.length === 0 || visibleProjectIds.includes(projectId)) {
                        if (!testimonialsByProject[projectId]) {
                            testimonialsByProject[projectId] = [];
                        }
                        testimonialsByProject[projectId].push(testimonial);
                    }
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
                                transparent: true,
                                opacity: 0 // Start with opacity 0 for fade-in effect
                            });
                            const textMesh = new THREE.Mesh(textGeometry, textMaterial);

                            // Position the testimonial text relative to the associated pedestal
                            textMesh.position.set(
                                associatedPedestal.position.x + 1.2,
                                0.01,
                                associatedPedestal.position.z - (index * 0.6) // Offset each testimonial for the same project
                            );
                            textMesh.rotation.set(-Math.PI / 2, 0, 0);
                            scene.add(textMesh);

                            // Apply fade-in effect
                            fadeInText([textMesh]);

                            // Store the testimonial mesh
                            textMesh.userData.projectId = projectId;
                            testimonialMeshes.push(textMesh);
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

function animate() {
    requestAnimationFrame(animate);
    updateMovement();  // Update character movement
    renderer.render(scene, camera);
}

async function filterProjects(skillId = null, categoryId = null) {
    try {
        // Construct the query parameters based on the provided skill or category
        let url = '/api/ProjectsAPI/filter';
        if (skillId) url += `?skillId=${skillId}`;
        if (categoryId) url += `${skillId ? '&' : '?'}categoryId=${categoryId}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch filtered projects: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Check if the response has a $values property; if so, use it
        const projects = Array.isArray(result) ? result : result.$values || [];

        // Update the 3D scene to show only filtered projects
        displayFilteredProjects(projects);
    } catch (error) {
        console.error('Error filtering projects:', error);
    }
}

function displayFilteredProjects(filteredProjects) {
    if (!Array.isArray(filteredProjects)) {
        console.error('Expected an array for filtered projects but received:', filteredProjects);
        return;
    }

    // Remove all existing pedestals and their associated components
    removeAllPedestals();

    // Adjust museum size to fit the visible pedestals
    resizeMuseum(filteredProjects.length);

    // Re-create the pedestals based on the filtered projects
    createPedestals(filteredProjects);

    // Load testimonials for the visible projects
    const visibleProjectIds = filteredProjects.map(p => p.projectId);
    loadTestimonials(visibleProjectIds);
}

function removeAllPedestals() {
    // Remove pedestals
    pedestals.forEach(pedestal => {
        scene.remove(pedestal);
        disposeObject(pedestal);
    });
    pedestals = [];

    // Remove interaction boxes (link boxes)
    interactionBoxes = interactionBoxes.filter(entry => {
        if (entry.type === 'link') {
            // Remove the interaction box mesh
            scene.remove(entry.mesh);
            disposeObject(entry.mesh);

            // Remove the associated Link text mesh
            if (entry.textMesh) {
                scene.remove(entry.textMesh);
                disposeObject(entry.textMesh);
            }

            return false; // Remove from interactionBoxes array
        }
        return true; // Keep other types (e.g., dropdown, testimonial)
    });

    // Remove project info meshes (titles and descriptions)
    pedestalInfoMeshes.forEach(meshes => {
        if (meshes) {
            meshes.forEach(mesh => {
                scene.remove(mesh);
                disposeObject(mesh);
            });
        }
    });
    pedestalInfoMeshes = [];

    // Remove proximity spheres and related arrays
    proximitySpheres = [];
    projectInfoVisible = [];

    // Remove collision boxes
    collisionBoxes.forEach(box => {
        scene.remove(box);
        disposeObject(box);
    });
    collisionBoxes = [];

    // Remove pedestal bounding boxes
    pedestalBoxes = [];

    // Remove testimonial meshes
    testimonialMeshes.forEach(mesh => {
        scene.remove(mesh);
        disposeObject(mesh);
    });
    testimonialMeshes = [];
}

function clearWalls() {
    // Remove tracked walls and lines specifically
    wallMeshes.forEach(({ wall, line }, index) => {
        if (wall) {
            scene.remove(wall);
            disposeObject(wall);
            console.log(`Wall ${index} removed and disposed`);
        }

        if (line) {
            scene.remove(line);
            disposeObject(line);
            console.log(`Wall edge line ${index} removed and disposed`);
        }
    });

    // Clear the arrays after removal
    wallMeshes.length = 0;
    wallBoxes.length = 0;

    // Double-check for any lingering walls specifically based on wall properties
    scene.children = scene.children.filter(child => {
        if (
            child.material === wallMaterial ||
            (child.userData && child.userData.type === 'museumWall')
        ) {
            scene.remove(child);
            disposeObject(child);
            console.log("Removed lingering wall from scene.children");
            return false; // Don't keep this child in scene.children
        }
        return true; // Keep non-wall elements
    });

    console.log("All wall meshes, lines, and lingering wall children removed.");
}

function resizeMuseum(visibleProjectCount) {
    clearWalls();
    // Remove old floor
    if (floor) {
        scene.remove(floor);
        disposeObject(floor);
    }
    const projectSpacing = 15;
    const museumWidth = Math.max(30, visibleProjectCount * projectSpacing);
    const museumDepth = 20;
    const openingSize = 10;

    floor = new THREE.Mesh(new THREE.PlaneGeometry(museumWidth, museumDepth), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Re-create walls and store references in wallMeshes
    const backWall = createWall(museumWidth, 5, 0.5, 0, 3, -museumDepth / 2, wallMaterial);
    if (backWall) wallMeshes.push(backWall);

    const leftFrontWall = createWall(museumWidth / 2 - openingSize / 2, 5, 0.5, -museumWidth / 4 - openingSize / 4, 3, museumDepth / 2, wallMaterial);
    if (leftFrontWall) wallMeshes.push(leftFrontWall);

    const rightFrontWall = createWall(museumWidth / 2 - openingSize / 2, 5, 0.5, museumWidth / 4 + openingSize / 4, 3, museumDepth / 2, wallMaterial);
    if (rightFrontWall) wallMeshes.push(rightFrontWall);

    const leftWall = createWall(0.5, 5, museumDepth, -museumWidth / 2, 3, 0, wallMaterial);
    if (leftWall) wallMeshes.push(leftWall);

    const rightWall = createWall(0.5, 5, museumDepth, museumWidth / 2, 3, 0, wallMaterial);
    if (rightWall) wallMeshes.push(rightWall);

    console.log(`Museum resized to width=${museumWidth} based on ${visibleProjectCount} visible projects.`);
}

async function fetchSkills() {
    try {
        const response = await fetch('/api/skillsAPI');
        const data = await response.json();

        // If the data has a `$values` property, use it; otherwise, use data as is
        return data.$values || data;
    } catch (error) {
        console.error("Error fetching skills:", error);
        return [];
    }
}

async function fetchCategories() {
    try {
        const response = await fetch('/api/categoriesAPI');
        const data = await response.json();

        // If the data has a `$values` property, use it; otherwise, use data as is
        return data.$values || data;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

// Start the scene once the window has loaded
window.onload = function () {
    // Initialize the loading manager
    loadingManager = new THREE.LoadingManager();

    loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
        const progress = (itemsLoaded / itemsTotal) * 100;
        progressBar.style.width = `${progress}%`;
    };

    loadingManager.onLoad = function () {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none'; // Hide overlay when loading is complete
        }
        init(); // Initialize the Three.js scene only once
    };

    // Create loaders using loadingManager
    fontLoader = new THREE.FontLoader(loadingManager);
    gltfLoader = new THREE.GLTFLoader(loadingManager);

    // Load assets that need to be tracked by the loading manager
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        cachedFont = font;
        console.log("Font loaded:", cachedFont);
    });

    gltfLoader.load('/3DModels/LowPolyPedestal.glb', (gltf) => {
        pedestalModel = gltf.scene;
        pedestalModel.scale.set(0.0025, 0.0025, 0.0025); // Apply scaling here
        console.log("Pedestal model loaded:", pedestalModel);
    });

    gltfLoader.load('/3DModels/Bee.glb', (gltf) => {
        characterModel = gltf.scene;
        console.log("Character model loaded:", characterModel);
    });

    gltfLoader.load('/3DModels/Wooden Sign-3MStJYAez7.glb', (gltf) => {
        controlSignModel = gltf.scene;
        console.log("Control sign model loaded:", controlSignModel);
    });

    // Load grass models
    gltfLoader.load('/3DModels/Grass.glb', (gltf) => {
        grassModel1 = gltf.scene;
        grassModel1.scale.set(3, 3, 3);
        console.log("Grass model 1 loaded:", grassModel1);
    });

    gltfLoader.load('/3DModels/Grass2.glb', (gltf) => {
        grassModel2 = gltf.scene;
        grassModel2.scale.set(4, 4, 4);
        console.log("Grass model 2 loaded:", grassModel2);
    });
};
