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

// Initialize the scene
function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Initialize the raycaster
    raycaster = new THREE.Raycaster();

    // Set up the orthographic camera for isometric view
    const aspectRatio = window.innerWidth / window.innerHeight;
    const cameraSize = 10;  // Adjust this value to zoom in/out
    camera = new THREE.OrthographicCamera(
        -cameraSize * aspectRatio, cameraSize * aspectRatio,  // left, right
        cameraSize, -cameraSize,  // top, bottom
        0.1, 1000  // near, far
    );
    camera.position.set(0, 10, 20);  // Isometric view from above
    camera.lookAt(0, 0, 0);  // Camera looks at the center of the scene

    // Set up the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable antialiasing for smoother edges
    renderer.setSize(window.innerWidth, window.innerHeight);  // Fullscreen rendering
    document.body.appendChild(renderer.domElement);  // Add renderer to the DOM

    // Smoother outdoor lighting
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);  // Sky light and ground light
    scene.add(hemisphereLight);
    // Directional light for shadows and focus
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);  // Positioned above and to the side
    scene.add(directionalLight);

    // Create the character (a simple cube)
    createCharacter();

    // Create the museum environment (floor and walls)
    createMuseum();

    // Fetch project data and create pedestals dynamically
    fetchProjectsAndCreatePedestals();

    // Create the 'Add Testimonial' interaction box
    createAddTestimonialBox();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Set up keyboard controls for character movement
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
}

// Function to create the character (a small cube)
function createCharacter() {
    const charGeometry = new THREE.BoxGeometry(1, 1, 1);  // Cube geometry for the character
    const charMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });  // Smooth shaded green character
    character = new THREE.Mesh(charGeometry, charMaterial);
    character.position.set(-15, 0.5, 0);  // Start the character outside the museum
    scene.add(character);
}

let frontWall, backWall, leftWall, rightWall;
let wallBoxes = [];  // Array to store bounding boxes for the walls

// Function to create the museum environment (floor and walls)
function createMuseum() {
    // Create floor (no bounding box needed for the floor)
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    // Create the walls
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });

    // Front wall
    frontWall = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 0.5), wallMaterial);
    frontWall.position.set(0, 1, 30);  // Move the wall further back
    scene.add(frontWall);
    wallBoxes.push(new THREE.Box3().setFromObject(frontWall));  // Add bounding box for collision

    // Back wall
    backWall = frontWall.clone();
    backWall.position.set(0, 1, 10);  // Position the back wall
    scene.add(backWall);
    wallBoxes.push(new THREE.Box3().setFromObject(backWall));

    // Left wall
    leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 20), wallMaterial);
    leftWall.position.set(-10, 1, 20);  // Adjusted position
    scene.add(leftWall);
    wallBoxes.push(new THREE.Box3().setFromObject(leftWall));

    // Right wall (leave a gap for a doorway)
    rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 10), wallMaterial);  // Half-size wall for doorway
    rightWall.position.set(10, 1, 25);  // Position it to leave a doorway space
    scene.add(rightWall);
    wallBoxes.push(new THREE.Box3().setFromObject(rightWall));
}

// Create 'Add Testimonial' interaction box
let addTestimonialBox;
function createAddTestimonialBox() {
    const boxGeometry = new THREE.PlaneGeometry(3, 1);
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
    addTestimonialBox = new THREE.Mesh(boxGeometry, boxMaterial);
    addTestimonialBox.position.set(5, 0.001, 5);  // Slightly above ground to avoid z-fighting
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

    // Add label text
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeometry = new THREE.TextGeometry('Add Review', {
            font: font,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });
        const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(addTestimonialBox.position.x - 1.4, 0.02, addTestimonialBox.position.z);
        textMesh.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(textMesh);
    });
}

// Create project dropdown
let projectDropdown; // Dropdown for selecting project
let interactionBoxes = []; // Array to store interaction boxes
let projectInteractionBoxes = []; // Array to store project interaction boxes
let selectedProjectId = null; // Store the selected project ID
let dropdownOpen = false; // Track if the dropdown is open
let projectNameEntries = [];
let selectedProjectMesh = null;
async function createProjectDropdown() {
    const dropdownGeometry = new THREE.PlaneGeometry(3, 1);
    const dropdownMaterial = new THREE.MeshLambertMaterial({
        color: 0x0000ff,
        opacity: 0.5,
        transparent: true,
    });
    projectDropdown = new THREE.Mesh(dropdownGeometry, dropdownMaterial);
    projectDropdown.position.set(10, 0.001, 5); // Position next to the testimonial box
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

    // Load the font before proceeding
    let font;
    try {
        font = await new Promise((resolve, reject) => {
            const loader = new THREE.FontLoader();
            loader.load(
                'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
                (loadedFont) => {
                    resolve(loadedFont);
                },
                undefined,
                (error) => {
                    reject(error);
                }
            );
        });
    } catch (error) {
        console.error('Error loading font:', error);
        return; // Exit the function if the font can't be loaded
    }

    // Add label text for dropdown using the loaded font
    const textGeometry = new THREE.TextGeometry('Select Project', {
        font: font,
        size: 0.3,
        height: 0.01,
        curveSegments: 12,
    });
    const textMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        shininess: 100,
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(projectDropdown.position.x - 1.4, 0.02, projectDropdown.position.z);
    textMesh.rotation.set(-Math.PI / 2, 0, 0);
    scene.add(textMesh);

    // Fetch projects from the backend
    try {
        const response = await fetch('/api/projectsAPI');
        const result = await response.json();
        const projects = result.$values || result; // Handle both wrapped and plain array
        console.log('Fetched projects:', projects);

        // Create and position each project name as an interaction element in the dropdown
        if (projects && Array.isArray(projects)) {
            projects.forEach((project, index) => {
                const projectTextGeometry = new THREE.TextGeometry(project.title || '', {
                    font: font, // Use the loaded font here
                    size: 0.3,
                    height: 0.01,
                    curveSegments: 12,
                });
                const projectTextMaterial = new THREE.MeshPhongMaterial({
                    color: 0x000000,
                    shininess: 100,
                });
                const projectTextMesh = new THREE.Mesh(projectTextGeometry, projectTextMaterial);

                // Position each option relative to the dropdown box
                const dropdownPosition = projectDropdown.position;
                projectTextMesh.position.set(
                    dropdownPosition.x - 1.5,
                    0.1, // Raise it slightly above the floor
                    dropdownPosition.z - index * 0.4 - 1
                );
                projectTextMesh.rotation.set(-Math.PI / 2, 0, 0);

                // Set the visibility to false initially
                projectTextMesh.visible = false;

                // Store the project name in userData for debugging
                projectTextMesh.userData.title = project.title || '';

                scene.add(projectTextMesh);

                // Add interaction box for each project
                const projectBox = new THREE.Box3().setFromObject(projectTextMesh);
                if (projectBox) {
                    projectInteractionBoxes.push({
                        box: projectBox,
                        projectId: project.projectId,
                        mesh: projectTextMesh,
                    });
                    projectNameEntries.push({
                        mesh: projectTextMesh,
                        box: projectBox,
                        projectId: project.projectId,
                    });
                } else {
                    console.error('Failed to create interaction box for project:', project.title);
                }

                console.log(`Created project name for project ID ${project.projectId}:`, project.title);
            });

        } else {
            console.error('Expected an array but received:', projects);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
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

    // Update the character's bounding box
    characterBox.setFromObject(character);

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
        const projects = result.$values || result; // Handle both wrapped and plain array

        if (Array.isArray(projects)) {
            createPedestals(projects);
        } else {
            console.error('Expected an array but received:', projects);
        }
    } catch (error) {
        console.error('Error fetching projects:', error);
    }
}

let pedestals = [];
let pedestalBoxes = [];  // For collision detection with the character
let pedestalTouched = [];  // To track if the pedestal has already triggered

function createPedestals(projects) {
    const pedestalGeometry = new THREE.BoxGeometry(1, 1, 1);  // Cube geometry for the pedestal
    const pedestalMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd });  // Light gray color

    projects.forEach((project, index) => {

        // Check if project has a valid URL
        if (!project.projectUrl) {
            console.warn(`Project at index ${index} is missing a URL:`, project);
        }

        const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        pedestal.position.set(index * 8, 0.5, 0);  // Position pedestals with some spacing
        pedestal.userData = project;  // Store project data in userData for later use
        scene.add(pedestal);
        pedestals.push(pedestal);
        pedestalBoxes.push(new THREE.Box3().setFromObject(pedestal));  // Initialize bounding box
        pedestalTouched.push(false);  // Not touched initially

        // Create a flat interaction box on the ground next to the pedestal
        const interactionBoxGeometry = new THREE.PlaneGeometry(1, 1);  // Plane geometry for the interaction box
        const interactionBoxMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
        const interactionBoxMesh = new THREE.Mesh(interactionBoxGeometry, interactionBoxMaterial);
        interactionBoxMesh.position.set(pedestal.position.x + 1.5, 0.001, pedestal.position.z);  // Slightly above the ground to avoid z-fighting
        interactionBoxMesh.rotation.x = -Math.PI / 2;  // Lay flat on the ground

        // Assign the project URL to interaction box userData if it exists
        if (project.projectUrl) {
            interactionBoxMesh.userData = { url: project.projectUrl };
            console.log(`Assigned URL: ${project.projectUrl} to interaction box at index ${index}`);
        } else {
            interactionBoxMesh.userData = { url: undefined };
            console.log(`URL could not be assigned`);
        }
        scene.add(interactionBoxMesh);

        // Create bounding box and add to interactionBoxes
        const interactionBox3 = new THREE.Box3().setFromObject(interactionBoxMesh);
        interactionBoxes.push({
            box: interactionBox3,
            type: 'link',
            mesh: interactionBoxMesh,
            url: project.projectUrl
        });

        // Logging for debuggingsd
        console.log(`Interaction box created at position: ${interactionBoxMesh.position.x}, ${interactionBoxMesh.position.y}, ${interactionBoxMesh.position.z}`);

        // Add "Link" text on the interaction box
        const loader = new THREE.FontLoader();
        loader.load(
            'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
            function (font) {
                const linkTextGeometry = new THREE.TextGeometry('Link', {
                    font: font,
                    size: 0.3,  // Size of the text
                    height: 0.01,  // Thickness of the text
                    curveSegments: 12,  // Increase for smoother curves
                });

                const linkTextMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 });
                const linkTextMesh = new THREE.Mesh(linkTextGeometry, linkTextMaterial);
                linkTextMesh.position.set(interactionBoxMesh.position.x - 0.3, 0.01, interactionBoxMesh.position.z);
                linkTextMesh.rotation.set(-Math.PI / 2, 0, 0);  // Rotate to lay flat on the interaction box

                scene.add(linkTextMesh);
            },
            undefined,
            function (error) {
                console.error('An error occurred while loading the font:', error);
            }
        );
    });
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

// Fetch and Display Project Information
function showProjectDetails(pedestalIndex, pedestal) {
    // Assume projects data is already available in "pedestals" array
    const project = pedestals[pedestalIndex]?.userData;

    if (!project) {
        console.error('No project data found for pedestal index:', pedestalIndex);
        return;
    }

    // Render project details on the ground in front of the pedestal
    createProjectInfoOnGround(project, pedestal);
}

function createProjectInfoOnGround(project, pedestal) {
    const loader = new THREE.FontLoader();

    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        function (font) {
            createTextMeshes(font, project, pedestal);
        },
        undefined,
        function (error) {
            console.error('An error occurred while loading the font:', error);
        }
    );
}

function createTextMeshes(font, project, pedestal) {
    if (!project || !project.title || !project.description) {
        console.error('Invalid project data:', project);
        return;
    }
    // Create 3D text for the project title
    const textGeometry = new THREE.TextGeometry(project.title, {
        font: font,
        size: 0.4,  // Increase size for better legibility
        height: 0.01,  // Increase thickness of the text
        curveSegments: 24,  // Increase segments for smoother curves
    });

    const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 });  // Phong material for better shading and legibility
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Position the text on the ground in front of the pedestal
    textMesh.position.set(pedestal.position.x + 0.7, 0.1, pedestal.position.z + 2);
    textMesh.rotation.set(0, Math.PI / 4, 0);  // Lay flat on the ground

    // Add the text to the scene
    scene.add(textMesh);

    // Create 3D text for the project description
    const descriptionGeometry = new THREE.TextGeometry(project.description, {
        font: font,
        size: 0.3,  // Larger size for better legibility
        height: 0.01,
        curveSegments: 24,
    });

    const descriptionMesh = new THREE.Mesh(descriptionGeometry, textMaterial);

    // Position the description below the title
    descriptionMesh.position.set(pedestal.position.x, 0.1, pedestal.position.z + 4);
    descriptionMesh.rotation.set(0, Math.PI / 4, 0);  // Lay flat on the ground

    // Add the description to the scene
    scene.add(descriptionMesh);
}

// Handle interactions when the 'Enter' key is pressed
function handleInteraction() {
    // Update the character's bounding box
    characterBox.setFromObject(character);

    console.log("Checking interaction...");

    if (dropdownOpen) {
        if (projectNameEntries.length === 0) {
            console.warn('Project names are not loaded yet.');
            return;
        }

        let projectSelected = false;
        for (let i = 0; i < projectNameEntries.length; i++) {
            const projectEntry = projectNameEntries[i];
            projectEntry.box.setFromObject(projectEntry.mesh); // Update bounding box

            // Log positions and bounding boxes for debugging
            console.log(`Checking project '${projectEntry.mesh.userData.title}' at index ${i}`);
            console.log('Character position:', character.position);
            console.log('Character bounding box:', characterBox);
            console.log('Project bounding box:', projectEntry.box);

            if (characterBox.intersectsBox(projectEntry.box)) {
                selectedProjectId = projectEntry.projectId;
                console.log('Selected project ID:', selectedProjectId);

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
            } else {
                console.log(`Character is not intersecting with project '${projectEntry.mesh.userData.title}'.`);
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
                console.log('Character is on the project dropdown.');
                dropdownOpen = !dropdownOpen; // Toggle dropdown open state
                console.log(`Dropdown is now ${dropdownOpen ? 'open' : 'closed'}.`);

                // Show or hide the project names
                for (let j = 0; j < projectNameEntries.length; j++) {
                    projectNameEntries[j].mesh.visible = dropdownOpen;
                    console.log(`Setting visibility of project '${projectNameEntries[j].mesh.userData.title}' to ${dropdownOpen}`);
                }
                return;

            } else if (interactionBoxEntry.type === 'testimonial') {
                console.log('Character is on the add testimonial box.');
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
                    console.log(`Opening URL: ${url}`);
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
    console.log('Entering testimonial mode...');

    // Add event listener to capture input only in testimonial mode
    document.addEventListener('keydown', handleTextInput, false);

    // Create a text input field on the ground
    const inputFieldGeometry = new THREE.PlaneGeometry(3, 1);
    const inputFieldMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 0.8, transparent: true });
    testimonialTextField = new THREE.Mesh(inputFieldGeometry, inputFieldMaterial);
    testimonialTextField.position.set(addTestimonialBox.position.x, 0.001, addTestimonialBox.position.z - 2);
    testimonialTextField.rotation.x = -Math.PI / 2;
    scene.add(testimonialTextField);

    // Load the font and create the text mesh for displaying testimonial text
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        const projectName = projectNameEntries.find(entry => entry.projectId === selectedProjectId)?.mesh.userData.title || 'Unknown Project';
        const projectNameGeometry = new THREE.TextGeometry(projectName, {
            font: font,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });
        const projectNameMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 });
        projectNameTextMesh = new THREE.Mesh(projectNameGeometry, projectNameMaterial);
        projectNameTextMesh.position.set(addTestimonialBox.position.x - 1.5, 0.1, addTestimonialBox.position.z - 1.5);
        projectNameTextMesh.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(projectNameTextMesh);

        const testimonialGeometry = new THREE.TextGeometry('', {
            font: font,
            size: 0.3,
            height: 0.01,
            curveSegments: 12,
        });
        testimonialDisplayTextMesh = new THREE.Mesh(testimonialGeometry, projectNameMaterial);
        testimonialDisplayTextMesh.position.set(addTestimonialBox.position.x - 1.5, 0.1, addTestimonialBox.position.z - 2);
        testimonialDisplayTextMesh.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(testimonialDisplayTextMesh);
    });
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
    console.log('Current testimonial text:', testimonialText);

    // Update the testimonial text display
    if (testimonialDisplayTextMesh) {
        const loader = new THREE.FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const updatedGeometry = new THREE.TextGeometry(testimonialText, {
                font: font,
                size: 0.3,
                height: 0.01,
                curveSegments: 12,
            });
            testimonialDisplayTextMesh.geometry.dispose();  // Clean up old geometry
            testimonialDisplayTextMesh.geometry = updatedGeometry;
        });
    }
}


// Load testimonials and display them
function loadTestimonials() {
    fetch('/api/testimonialsAPI')
        .then(response => response.json())
        .then(result => {
            const testimonials = result.$values || result; // Handle both wrapped and plain array

            if (Array.isArray(testimonials)) {
                testimonials.forEach((testimonial, index) => {
                    const projectId = testimonial.projectId;

                    // Find the associated pedestal for this project
                    const associatedPedestal = pedestals.find(pedestal => pedestal.userData.projectId === projectId);

                    if (associatedPedestal) {
                        const loader = new THREE.FontLoader();
                        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
                            // Create geometry and material for testimonial text
                            const textGeometry = new THREE.TextGeometry(testimonial.content, {
                                font: font,
                                size: 0.3,
                                height: 0.01,
                                curveSegments: 12,
                            });
                            const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 });
                            const textMesh = new THREE.Mesh(textGeometry, textMaterial);

                            // Position the testimonial text to the right of the pedestal's interaction box
                            const interactionBox = interactionBoxes.find(box => box.mesh.userData.url === associatedPedestal.userData.projectUrl);
                            if (interactionBox) {
                                textMesh.position.set(
                                    interactionBox.mesh.position.x + 1.5,  // Offset to the right of the box
                                    0.01,
                                    interactionBox.mesh.position.z - (index * 0.4)  // Stack testimonials vertically for this project
                                );
                                textMesh.rotation.set(-Math.PI / 2, 0, 0);
                                scene.add(textMesh);
                            }
                        });
                    } else {
                        console.error(`No pedestal found for project ID ${projectId}`);
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

// Animation loop to render the scene and update the movement
function animate() {
    requestAnimationFrame(animate);
    updateMovement();  // Update character movement
    checkProximityToPedestals();  // Check proximity to pedestals
    renderer.render(scene, camera);
}

// Start the scene once the window has loaded
window.onload = async function () {
    init();
    // Create project dropdown next to testimonial
    await createProjectDropdown();

    loadTestimonials();

    // Start the animation loop
    animate();
};
