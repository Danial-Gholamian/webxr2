// controls.js (Refactored for PointsMaterial Nodes)

import * as THREE from 'three';
import { camera } from './sceneSetup.js';
// Import the new Points object, node data map, and link update function
import { allNodesPoints, nodeDataMap, updateGraphLinks } from './pendulum.js';

// --- Raycaster for Mouse Interaction ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
// Set threshold for points raycasting (match hover.js or adjust)
raycaster.params.Points.threshold = 0.5;

// State for mouse grabbing
let grabbedNodeData = null; // Stores { id, index } of the grabbed node
let isGrabbingEnabled = false; // Was 'isDragging', renamed for clarity

// --- Detect "V" key press (Enable Grabbing) ---
document.addEventListener("keydown", (event) => {
  // Allow grabbing only if not already grabbing something via VR? (Optional check)
  // Add check here if needed: if (grabbingController) return;
  if (event.key.toLowerCase() === "v") {
      isGrabbingEnabled = true;
      // Optional: Add visual feedback that grabbing is enabled (e.g., change cursor)
      document.body.style.cursor = 'grabbing';
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key.toLowerCase() === "v") {
    isGrabbingEnabled = false;
    document.body.style.cursor = 'default'; // Reset cursor

    // If a node was being grabbed with the mouse, release it
    if (grabbedNodeData) {
        const nodeData = nodeDataMap.get(grabbedNodeData.id);
        if (nodeData) {
            nodeData.isBeingHeld = false; // Update state in central map
        }
        console.log(`Mouse released node: ${grabbedNodeData.id}`);
        grabbedNodeData = null;
    }
  }
});

// --- Detect mouse click (Start Grabbing) ---
document.addEventListener("mousedown", (event) => {
  // Only try to grab if 'V' is held (grabbing enabled) and it's a left click
  if (!isGrabbingEnabled || event.button !== 0) return;

  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  // Intersect with the single Points object
  const intersections = raycaster.intersectObject(allNodesPoints);

  if (intersections.length > 0) {
    // Get the index of the intersected point
    const hitIndex = intersections[0].index;
    let hitNodeData = null;

    // Find the corresponding node data using the index
    for (const nodeData of nodeDataMap.values()) {
        if (nodeData.index === hitIndex) {
            hitNodeData = nodeData;
            break;
        }
    }

    // Check if node exists and isn't already held (e.g., by VR controller)
    if (hitNodeData && !hitNodeData.isBeingHeld) {
        grabbedNodeData = { id: hitNodeData.id, index: hitNodeData.index };
        hitNodeData.isBeingHeld = true; // Mark as held
        console.log(`Mouse grabbed node: ${grabbedNodeData.id}`);
        // Prevent default browser drag behavior if needed
        event.preventDefault();
    } else if (hitNodeData && hitNodeData.isBeingHeld) {
         console.log(`Mouse tried to grab node ${hitNodeData.id}, but it's already held.`);
    }
  }
});

// --- Move grabbed node with mouse ---
document.addEventListener("mousemove", (event) => {
  // Only move if grabbing is enabled AND a node is actually grabbed by the mouse
  if (!isGrabbingEnabled || !grabbedNodeData) return;

  const positionAttribute = allNodesPoints.geometry.attributes.position;
  const nodeIndex = grabbedNodeData.index;

  // Get current node position to define drag plane height
  const currentNodeY = positionAttribute.getY(nodeIndex);

  // Update mouse position
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Project ray from camera
  raycaster.setFromCamera(mouse, camera);

  // Drag on a horizontal plane at the node's current Y level
  // This prevents the node from jumping vertically when dragging starts
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -currentNodeY);
  const intersection = new THREE.Vector3();

  if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
    // Optional: Add a slight offset while dragging?
    // intersection.y += 0.1; // Example: slightly lift

    // Get the actual current position for lerping
    const currentPos = new THREE.Vector3().fromBufferAttribute(positionAttribute, nodeIndex);

    // Smooth movement using lerp
    currentPos.lerp(intersection, 0.3); // Adjust lerp factor for desired smoothness

    // Update the position IN THE BUFFER ATTRIBUTE ARRAY
    positionAttribute.setXYZ(nodeIndex, currentPos.x, currentPos.y, currentPos.z);

    // IMPORTANT: Mark the attribute as needing update
    positionAttribute.needsUpdate = true;

    // IMPORTANT: Update the links visually to follow the dragged node
    updateGraphLinks();
  }
});


// --- Keyboard Movement Data (Unchanged) ---
const movementSpeed = 0.1; // Keep or adjust as needed
const movement = { forward: 0, right: 0 };

window.addEventListener('keydown', (event) => {
    // Ignore keyboard input if typing in an input field, etc.
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    // Ignore if holding V for grabbing
    if (event.key.toLowerCase() === "v") return;

  switch (event.key.toLowerCase()) { // Use toLowerCase for consistency
    case 'w':
    case 'arrowup':
      movement.forward = 1;
      break;
    case 's':
    case 'arrowdown':
      movement.forward = -1;
      break;
    case 'a':
    case 'arrowleft':
      movement.right = -1; // Corrected direction (A typically moves left)
      break;
    case 'd':
    case 'arrowright':
      movement.right = 1; // Corrected direction (D typically moves right)
      break;
  }
});

window.addEventListener('keyup', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
     // No need to check for 'v' on keyup here

  switch (event.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
    case 's':
    case 'arrowdown':
      movement.forward = 0;
      break;
    case 'a':
    case 'arrowleft':
    case 'd':
    case 'arrowright':
      movement.right = 0;
      break;
  }
});

// --- Mouse Look (Unchanged) ---
let isLooking = false;
let previousMouseX = 0, previousMouseY = 0;

window.addEventListener('mousedown', (event) => {
  if (event.button === 2) { // Right-click
    isLooking = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
    document.body.style.cursor = 'move'; // Indicate camera look mode
  }
});

window.addEventListener('mouseup', (event) => {
  if (event.button === 2) { // Right-click release
    isLooking = false;
     document.body.style.cursor = isGrabbingEnabled ? 'grabbing' : 'default'; // Revert cursor based on grab state
  }
});

window.addEventListener('mousemove', (event) => {
  if (isLooking) {
    const deltaX = event.clientX - previousMouseX;
    const deltaY = event.clientY - previousMouseY;

    const rotationSpeed = 0.002;
    camera.rotation.order = 'YXZ'; // Common order for FPS style look
    camera.rotation.y -= deltaX * rotationSpeed;
    camera.rotation.x -= deltaY * rotationSpeed;
    // Clamp vertical look to prevent camera flipping
    camera.rotation.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, camera.rotation.x));

    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
  }
});

// Disable right-click context menu (optional, but feels cleaner for mouse look)
window.addEventListener('contextmenu', event => {
    // Allow context menu on input fields etc.
     if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
         event.preventDefault();
     }
});

// --- Export movement data for use in main.js ---
export { movement };

console.log("controls.js refactored for PointsMaterial interaction.");