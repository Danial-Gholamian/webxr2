// main.js (Refactored for PointsMaterial Nodes)
import * as THREE from 'three';
import { scene, camera, renderer } from './sceneSetup.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import {
    handleJoystickInput,
    updateLaserPointer,
    controller1,
    controller2,
    grabbedObjectData, // Import the grabbed node data state
    grabbingController // Import the controller holding the node
} from './vrSetup.js';

// Import keyboard controls if still needed
import { movement } from './controls.js';

// Import the NEW graph elements and functions
import {
    allNodesPoints,   // The single THREE.Points object for nodes
    nodeDataMap,      // Map from node ID to { data, index, isBeingHeld }
    updateGraphLinks  // Function to update edge positions
 } from './pendulum.js';

// Import the NEW hover detection function
import { detectHover } from './hover.js';

// Add VR button
document.body.appendChild(VRButton.createButton(renderer));
// Ensure XR is enabled (likely redundant if done in sceneSetup, but safe)
renderer.xr.enabled = true;

// --- Grab event listeners are now set up INSIDE vrSetup.js ---
// controller1.addEventListener('selectstart', ...); // REMOVED
// controller1.addEventListener('selectend', ...);   // REMOVED
// controller2.addEventListener('selectstart', ...); // REMOVED
// controller2.addEventListener('selectend', ...);   // REMOVED


// --- Keyboard movement handler (Keep if needed) ---
function updateCameraMovement() {
    const forwardVector = new THREE.Vector3();
    camera.getWorldDirection(forwardVector);
    camera.position.addScaledVector(forwardVector, movement.forward * 0.05); // Slightly slower?

    const rightVector = new THREE.Vector3();
    // Use camera.up to get a reliable right vector, even if looking up/down
    rightVector.crossVectors(camera.up, forwardVector).normalize();
    camera.position.addScaledVector(rightVector, movement.right * 0.05);
}

// --- Main Animation Loop ---
renderer.setAnimationLoop((time, xrFrame) => {

    // --- VR Specific Updates ---
    if (xrFrame) {
        handleJoystickInput(xrFrame); // Handle VR controller movement/rotation

        // Hover detection needs the points object and the node map
        // Check if input sources exist before detecting hover
        if (controller1.userData.inputSource) {
             detectHover(controller1, allNodesPoints, nodeDataMap);
        }
         if (controller2.userData.inputSource) {
             detectHover(controller2, allNodesPoints, nodeDataMap);
         }
    } else {
        // Non-VR updates (e.g., keyboard movement if enabled)
        updateCameraMovement();
    }

    // --- Update Controller Visuals (Lasers) ---
    // updateLaserPointer can be called regardless of VR frame,
    // handles laser visibility/length updates based on hover state potentially
    updateLaserPointer(controller1);
    updateLaserPointer(controller2);


    // --- Grabbed Object Position Update (NEW LOGIC) ---
    if (grabbedObjectData && grabbingController) {
        const positionAttribute = allNodesPoints.geometry.attributes.position;
        const nodeIndex = grabbedObjectData.index;

        // Get target position from the grabbing controller
        const controllerPos = new THREE.Vector3();
        grabbingController.getWorldPosition(controllerPos);

        // Get current position from the buffer attribute
        const currentPos = new THREE.Vector3();
        currentPos.fromBufferAttribute(positionAttribute, nodeIndex);

        // Smoothly interpolate (lerp) towards the controller position
        currentPos.lerp(controllerPos, 0.2); // Adjust lerp factor (0.0 to 1.0) for smoothness

        // Update the position IN THE BUFFER ATTRIBUTE ARRAY
        positionAttribute.setXYZ(nodeIndex, currentPos.x, currentPos.y, currentPos.z);

        // IMPORTANT: Mark the attribute as needing update
        positionAttribute.needsUpdate = true;

        // Update links AFTER node position has been potentially updated
        updateGraphLinks(); // keep link positions updated visually

    } else {
         // If nothing is grabbed, still update links in case nodes move via physics later
         // updateGraphLinks(); // Uncomment if physics might move nodes
    }


    // --- Render the scene ---
    renderer.render(scene, camera);
});