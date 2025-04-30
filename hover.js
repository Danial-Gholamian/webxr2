// hover.js (Refactored for PointsMaterial)
import * as THREE from 'three';

// --- State for Hover Effects ---
let currentlyHoveredIndex = null; // Index of the point currently hovered
let currentlyHoveredController = null;

const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();

// Set threshold for points raycasting (IMPORTANT!) Adjust value as needed.
raycaster.params.Points.threshold = 0.5; // How close ray needs to be to point center

// Removed setupInteractiveGroup - no longer needed

// --- Detect Hover on Points Object ---
export function detectHover(controller, pointsObject, nodeMap) {
    // Ensure controller and points object are valid
    if (!controller || !controller.visible || !pointsObject || !pointsObject.userData.isNodePointsObject) {
        // If controller becomes invalid, clear previous hover for this controller
         if (currentlyHoveredController === controller) {
            clearHoverEffect(pointsObject);
            currentlyHoveredIndex = null;
            currentlyHoveredController = null;
            controller.userData.hoveredNodeData = null;
         }
        return;
    }

    // Raycast from controller
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix); // Forward direction
    raycaster.far = 10; // Limit ray distance

    const intersections = raycaster.intersectObject(pointsObject, false); // Raycast against the single Points object
    const laser = controller.userData.laser;

    let foundHoverThisFrame = false;
    let hitNodeData = null;
    let hitIndex = -1;

    if (intersections.length > 0) {
        // Sort by distance is good practice, though threshold might dominate
        intersections.sort((a, b) => a.distance - b.distance);

        // The 'index' property tells you which point (vertex) was hit
        hitIndex = intersections[0].index;

        // Find the node data corresponding to this index
        // This assumes nodeDataMap maps ID -> { index, ... }
        // We need to find the entry where entry.index === hitIndex
        // Creating an index-to-data map might be faster if nodeMap is huge
        for (const nodeData of nodeMap.values()) {
            if (nodeData.index === hitIndex) {
                hitNodeData = nodeData;
                break;
            }
        }

        if (hitNodeData && !hitNodeData.isBeingHeld) { // Only hover if not being held
             foundHoverThisFrame = true;

             // --- Handle Hover State Change ---
             if (hitIndex !== currentlyHoveredIndex) {
                // Clear previous hover effect if different point or different controller
                 clearHoverEffect(pointsObject);

                // Apply new hover effect
                applyHoverEffect(pointsObject, hitIndex, controller);
                currentlyHoveredIndex = hitIndex;
                currentlyHoveredController = controller;

                // Store data on controller for grabbing/selection
                controller.userData.hoveredNodeData = hitNodeData;

                // Haptics feedback
                const inputSource = controller.userData.inputSource;
                const actuator = inputSource?.gamepad?.hapticActuators?.[0];
                if (actuator?.pulse) {
                     try { actuator.pulse(0.5, 50); } catch (e) { /* ignore */ } // Pulse lightly
                }
             } else {
                 // Still hovering the same point with the same controller
                 controller.userData.hoveredNodeData = hitNodeData; // Ensure data is still set
             }


            if (laser) laser.scale.z = intersections[0].distance; // Adjust laser length

        } else {
             // Hit a point, but it's being held or data not found
             if (laser) laser.scale.z = intersections[0].distance;
        }
    }

    // --- Handle No Hover or Hover Ended ---
    if (!foundHoverThisFrame) {
        // If this controller was the one hovering, clear the effect
         if (currentlyHoveredController === controller) {
            clearHoverEffect(pointsObject);
            currentlyHoveredIndex = null;
            currentlyHoveredController = null;
         }
         // Clear data on this controller regardless
         controller.userData.hoveredNodeData = null;
         if (laser) laser.scale.z = 10; // Reset laser length
    }
}


// --- Apply Hover Effect (Example: Brighten Color) ---
function applyHoverEffect(pointsObject, index, controller) {
    const colorAttribute = pointsObject.geometry.attributes.color;
    if (!colorAttribute) return;

    // Set color to bright white (or another highlight color)
    colorAttribute.setXYZ(index, 1.0, 1.0, 1.0); // White
    colorAttribute.needsUpdate = true; // IMPORTANT!
    console.log(`Applied hover color to index: ${index} by controller ${controller.userData.handedness}`);

}

// --- Clear Hover Effect (Reset Color) ---
function clearHoverEffect(pointsObject) {
     if (currentlyHoveredIndex !== null) {
        const colorAttribute = pointsObject.geometry.attributes.color;
        const originalColors = pointsObject.geometry.userData.originalColors; // Get stored original colors

        if (colorAttribute && originalColors) {
            const i3 = currentlyHoveredIndex * 3;
            // Reset to original color
            colorAttribute.setXYZ(currentlyHoveredIndex, originalColors[i3], originalColors[i3 + 1], originalColors[i3 + 2]);
            colorAttribute.needsUpdate = true; // IMPORTANT!
            // console.log(`Cleared hover color for index: ${currentlyHoveredIndex}`);

        }
         currentlyHoveredIndex = null; // Reset state
         currentlyHoveredController = null; // Reset state
     }

}