// Variables for the scene, camera, renderer, and character
let scene, camera, renderer, character;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const moveSpeed = 0.5;  // Character movement speed
let raycaster;
const proximityDistance = 2;  // The proximity distance in front of the pedestal
let intersectedPedestal = null;  // Track the current pedestal in proximity

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
    renderer = new THREE.WebGLRenderer();
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

    // Ensure pedestals are created
    createPedestals();

    createInteractiveLink();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Set up keyboard controls for character movement
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    // Start the animation loop
    animate();
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

// Handle window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;  // Maintain aspect ratio
    camera.updateProjectionMatrix();  // Update the camera projection
    renderer.setSize(window.innerWidth, window.innerHeight);  // Resize the renderer
}

// Handle keydown events for movement
function onKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp': case 'w': moveForward = true; break;
        case 'ArrowDown': case 's': moveBackward = true; break;
        case 'ArrowLeft': case 'a': moveLeft = true; break;
        case 'ArrowRight': case 'd': moveRight = true; break;
    }
}

// Handle keyup events to stop movement
function onKeyUp(event) {
    switch (event.key) {
        case 'ArrowUp': case 'w': moveForward = false; break;
        case 'ArrowDown': case 's': moveBackward = false; break;
        case 'ArrowLeft': case 'a': moveLeft = false; break;
        case 'ArrowRight': case 'd': moveRight = false; break;
    }
}

// Update the character's movement
let characterBox = new THREE.Box3();

// Update the character's movement
function updateMovement() {
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
    for (let i = 0; i < wallBoxes.length; i++) {
        if (characterBox.intersectsBox(wallBoxes[i])) {
            character.position.copy(oldPosition);  // Revert to old position on collision
            break;
        }
    }
    for (let i = 0; i < pedestalBoxes.length; i++) {
        if (characterBox.intersectsBox(pedestalBoxes[i])) {
            if (!pedestalTouched[i]) {
                console.log("Character collided with pedestal:", i);  // Added log for collision
                showProjectDetails(i, pedestals[i]);  // Display the project details when colliding
                pedestalTouched[i] = true;  // Mark pedestal as triggered
            }
            character.position.copy(oldPosition);  // Block movement through the pedestal
            break;
        }
    }

    // Update the camera to follow the character
    camera.position.x = character.position.x + 10;
    camera.position.z = character.position.z + 10;
    camera.lookAt(character.position);
}
let pedestals = [];
let pedestalBoxes = [];  // For collision detection with the character
let pedestalTouched = [];  // To track if the pedestal has already triggered

function createPedestals() {
    const pedestalGeometry = new THREE.BoxGeometry(1, 1, 1);  // Cube geometry for the pedestal
    const pedestalMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd });  // Light gray color

    // Example: Add three pedestals
    const pedestal1 = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal1.position.set(0, 0.5, -5);
    scene.add(pedestal1);
    pedestals.push(pedestal1);
    pedestalBoxes.push(new THREE.Box3().setFromObject(pedestal1));  // Initialize bounding box
    pedestalTouched.push(false);  // Not touched initially

    const pedestal2 = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal2.position.set(10, 0.5, -15);
    scene.add(pedestal2);
    pedestals.push(pedestal2);
    pedestalBoxes.push(new THREE.Box3().setFromObject(pedestal2));
    pedestalTouched.push(false);  // Not touched initially

    const pedestal3 = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal3.position.set(20, 0.5, -25);
    scene.add(pedestal3);
    pedestals.push(pedestal3);
    pedestalBoxes.push(new THREE.Box3().setFromObject(pedestal3));
    pedestalTouched.push(false);  // Not touched initially
}

function checkProximityToPedestals() {
    characterBox.setFromObject(character);  // Update character's bounding box

    for (let i = 0; i < pedestalBoxes.length; i++) {
        pedestalBoxes[i].setFromObject(pedestals[i]);  // Ensure pedestal bounding boxes are up to date

        if (characterBox.intersectsBox(pedestalBoxes[i])) {
            if (!pedestalTouched[i]) {
                console.log("Character is near pedestal:", i);  // Log proximity
                console.log("Displaying project details for pedestal:", i);  // Added console log for debugging
                showProjectDetails(i, pedestals[i]);  // Pass pedestal reference
                pedestalTouched[i] = true;  // Ensure it's only shown once
            }
            return;  // Exit after detecting the first interaction
        }
    }
}

// Fetch and Display Project Information
function showProjectDetails(pedestalIndex, pedestal) {
    const projects = [
        { title: 'Project 1', description: 'This is the first project.' },
        { title: 'Project 2', description: 'This is the second project.' },
        { title: 'Project 3', description: 'This is the third project.' },
    ];

    const project = projects[pedestalIndex];  // Get project details based on pedestal index

    // Render project details on the ground in front of the pedestal
    console.log("Creating project info on ground for:", project);  // Added console log for debugging
    createProjectInfoOnGround(project, pedestal);
}

function createProjectInfoOnGround(project, pedestal) {
    const loader = new THREE.FontLoader();

    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        function (font) {
            console.log("Font loaded successfully.");  // Added console log for debugging
            createTextMeshes(font, project, pedestal);
        },
        undefined,
        function (error) {
            console.error('An error occurred while loading the font:', error);
        }
    );
}

function createTextMeshes(font, project, pedestal) {
    // Create 3D text for the project title
    const textGeometry = new THREE.TextGeometry(project.title, {
        font: font,
        size: 0.5,  // Adjust size to fit
        height: 0.05,  // Thickness of the text
        curveSegments: 12,
    });

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });  // Black text for contrast
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Position the text on the ground in front of the pedestal
    textMesh.position.set(pedestal.position.x, 0.1, pedestal.position.z - 1);
    textMesh.rotation.x = -Math.PI / 2;  // Lay flat on the ground

    // Add the text to the scene
    scene.add(textMesh);

    // Create 3D text for the project description
    const descriptionGeometry = new THREE.TextGeometry(project.description, {
        font: font,
        size: 0.3,  // Smaller size for description
        height: 0.05,
        curveSegments: 12,
    });

    const descriptionMesh = new THREE.Mesh(descriptionGeometry, textMaterial);

    // Position the description below the title
    descriptionMesh.position.set(pedestal.position.x, 0.1, pedestal.position.z - 2);
    descriptionMesh.rotation.x = -Math.PI / 2;  // Lay flat on the ground

    // Add the description to the scene
    scene.add(descriptionMesh);

    // Log for verification
    console.log(`Text for "${project.title}" created at: `, textMesh.position);
    console.log(`Description for "${project.description}" created at: `, descriptionMesh.position);
}

let linkRectangles = [];
function createInteractiveLink() {
    const linkGeometry = new THREE.PlaneGeometry(3, 1);  // Rectangle size
    const linkMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });  // Green rectangle for visibility
    const linkRectangle = new THREE.Mesh(linkGeometry, linkMaterial);
    linkRectangle.position.set(0, 0.1, 12);  // Position it on the ground
    linkRectangle.rotation.x = -Math.PI / 2;  // Ensure it's lying flat on the ground
    scene.add(linkRectangle);
    // Create bounding box for the rectangle to detect interaction
    const linkBox = new THREE.Box3().setFromObject(linkRectangle);
    linkRectangles.push({ linkBox, url: 'https://example.com' });  // Add URL for the project
}

let linkInteractionActive = false;  // Track if the character is in a link zone
let linkOpened = false;  // Track if the link has already been opened

function checkForLinkInteraction() {
    let isIntersecting = false;

    for (let i = 0; i < linkRectangles.length; i++) {
        const { linkBox, url } = linkRectangles[i];

        if (characterBox.intersectsBox(linkBox)) {
            isIntersecting = true;  // The character is on a link rectangle

            if (!linkOpened && !linkInteractionActive) {
                linkInteractionActive = true;  // Allow interaction when character enters the rectangle
                document.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' && !linkOpened) {
                        window.open(url, '_blank');  // Open the link in a new tab
                        linkOpened = true;  // Prevent further tabs from opening
                    }
                });
            }
        }
    }

    // Reset the flag if the character moves away from the interactive rectangle
    if (!isIntersecting) {
        linkInteractionActive = false;
        linkOpened = false;  // Reset the link interaction flag for the next interaction
    }
}

// Animation loop to render the scene and update the movement
function animate() {
    requestAnimationFrame(animate);
    updateMovement();  // Update character movement
    checkProximityToPedestals();  // Check proximity to pedestals
    checkForLinkInteraction();  // Check if the character is on a link rectangle
    renderer.render(scene, camera);
}

// Start the scene once the window has loaded
window.onload = init;