// vrSetup.js (Refactored for PointsMaterial Nodes)
import * as THREE from 'three';
import { scene, camera, renderer } from './sceneSetup.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
// Import nodeDataMap for checking 'isBeingHeld' state
import { nodeDataMap } from './pendulum.js';

// --- Camera and Controller Setup ---
const cameraGroup = new THREE.Group();
cameraGroup.add(camera);
scene.add(cameraGroup);

const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
// Add controllers directly to cameraGroup AFTER setupController is called
// cameraGroup.add(controller1); // Moved inside setupController
// cameraGroup.add(controller2); // Moved inside setupController


// --- State for Grabbing ---
// Store data { id, index } of the grabbed node
let grabbedObjectData = null;
let grabbingController = null;

// --- Setup Individual Controller ---
function setupController(controller, id) {
    controller.userData.handedness = (id === 0) ? "left" : "right"; // Assign handedness early

    const controllerGrip = renderer.xr.getControllerGrip(id);
    const modelFactory = new XRControllerModelFactory();
    const model = modelFactory.createControllerModel(controllerGrip);
    controllerGrip.add(model);
    cameraGroup.add(controllerGrip); // Add grip to camera group

    // Laser Pointer
    const laserGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1) // Points forward from controller
    ]);
    const laserMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2, // Make laser slightly thicker?
        transparent: true,
        opacity: 0.7
    });
    const laser = new THREE.Line(laserGeometry, laserMaterial);
    laser.name = 'controller-laser';
    laser.userData.isLaser = true;
    laser.scale.z = 10; // Initial length
    controller.add(laser); // Add laser as child of controller
    controller.userData.laser = laser;

    // Add the controller itself to the camera group AFTER laser is added
    cameraGroup.add(controller);

    // Add event listeners specific to this controller if needed here
    // Example trigger click listener (can be used for selection)
    controller.addEventListener('selectstart', () => {
         console.log(`${controller.userData.handedness} controller select START`);
         tryGrabObject(controller); // Attempt to grab on select start
    });
    controller.addEventListener('selectend', () => {
         console.log(`${controller.userData.handedness} controller select END`);
         releaseObject(controller); // Release on select end
    });

     // Teleportation listener
     controller.addEventListener('squeezestart', () => teleportFromController(controller));

}

setupController(controller1, 0);
setupController(controller2, 1);


// --- Grabbing Logic (Adapted for Points Nodes) ---
function tryGrabObject(controller) {
    // Object to grab is determined by hover state (set in hover.js)
    const hoveredNode = controller.userData.hoveredNodeData;

    if (!hoveredNode) {
        // console.log("🚫 No hovered node to grab.");
        return;
    }

    // Check if the node is already held (using the flag in nodeDataMap)
    if (nodeDataMap.get(hoveredNode.id)?.isBeingHeld) {
         console.log(`⚠️ Node ${hoveredNode.id} is already being held.`);
        return;
    }

    // Successfully grab the node
    grabbedObjectData = { id: hoveredNode.id, index: hoveredNode.index };
    grabbingController = controller;

    // Mark the node as held in the central map
    const nodeData = nodeDataMap.get(hoveredNode.id);
    if (nodeData) {
        nodeData.isBeingHeld = true;
    }

    // Clear hover state from the controller that grabbed
    controller.userData.hoveredNodeData = null;
    // Potentially trigger haptics or visual feedback for grab

    console.log(`✅ Grabbed node: ${grabbedObjectData.id} (Index: ${grabbedObjectData.index}) with ${controller.userData.handedness} controller`);
}

function releaseObject(controller) {
    // Only release if this controller is the one currently grabbing
    if (grabbedObjectData && grabbingController === controller) {
         console.log(`🆗 Releasing node: ${grabbedObjectData.id} with ${controller.userData.handedness} controller`);

        // Mark the node as released in the central map
        const nodeData = nodeDataMap.get(grabbedObjectData.id);
        if (nodeData) {
            nodeData.isBeingHeld = false;
        }

        // Clear grabbing state
        grabbedObjectData = null;
        grabbingController = null;

        // Potentially trigger haptics or visual feedback for release
    }
}


// --- VR Session Input Source Handling ---
renderer.xr.addEventListener("sessionstart", () => {
    const session = renderer.xr.getSession();
    const assignSources = () => {
        session.inputSources.forEach((source) => {
            console.log("🎮 Input source detected:", source.handedness);
            if (source.handedness === "left") controller1.userData.inputSource = source;
            if (source.handedness === "right") controller2.userData.inputSource = source;
        });
    };
    assignSources(); // Initial check
    session.addEventListener("inputsourceschange", assignSources); // Listen for changes
});


// --- Movement and Rotation ---
const movementSpeed = 0.05;
const rotationSpeed = 0.03;
const deadZone = 0.1;

function moveThumbstick(inputX, inputY, speed = movementSpeed) {
    // Calculates forward direction based on camera orientation (Y is ignored)
    let direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    // Calculates right direction
    let right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize(); // Use camera.up for reliable right vector

    // Apply movement based on input, considering deadzone
    let moveX = right.multiplyScalar(inputX * speed);
    let moveZ = direction.multiplyScalar(-inputY * speed); // Invert Y for typical forward movement
    cameraGroup.position.add(moveX).add(moveZ);
}

function handleJoystickInput(xrFrame) {
    const session = xrFrame.session;

    for (const source of session.inputSources) {
        if (!source.gamepad || !source.handedness) continue; // Need gamepad and handedness

        const handedness = source.handedness;
        const { axes } = source.gamepad; // axes: [LeftX, LeftY, RightX, RightY] typically

        if (axes.length < 4) continue; // Oculus Quest/Touch controllers have 4 axes

        // Left controller thumbstick for rotation (snap or smooth)
        if (handedness === "left") {
            const turn = axes[2]; // Use X-axis of the left thumbstick for turning
            if (Math.abs(turn) > deadZone) {
                // Simple smooth rotation, could add snap turning logic here
                cameraGroup.rotation.y -= turn * rotationSpeed;
            }
        }

        // Right controller thumbstick for movement
        if (handedness === "right") {
             const moveX = axes[2]; // Right stick X
             const moveY = axes[3]; // Right stick Y
             if (Math.abs(moveX) > deadZone || Math.abs(moveY) > deadZone) {
                 moveThumbstick(moveX, moveY);
             }
        }
    }
    // Update matrix after position/rotation changes
    cameraGroup.updateMatrixWorld(true);
}

// --- Laser Pointer Update (No changes needed) ---
function updateLaserPointer(controller) {
    // Laser automatically follows controller as it's a child object.
    // Length scaling is handled in hover.js based on intersections.
    // We could potentially change color or visibility here if needed.
}


// --- Teleportation ---
function teleportFromController(controller) {
    // Check if laser hit something valid? (Optional: Add raycast here to check for floor/valid surfaces)
    // For now, just teleport fixed distance along laser direction

    const laserLength = 10; // Adjust teleport distance
    const direction = new THREE.Vector3();
    const position = new THREE.Vector3();

    // Get world direction controller is pointing
    controller.getWorldDirection(direction);
    direction.multiplyScalar(-1); // Point forward from controller grip
    direction.normalize();

    // Get controller world position
    controller.getWorldPosition(position);

    // Calculate target point
    const target = position.clone().add(direction.multiplyScalar(laserLength));

    // Set cameraGroup position (keeping current Y height)
    cameraGroup.position.set(target.x, cameraGroup.position.y, target.z);

    console.log(`🚀 Teleported via ${controller.userData.handedness} controller`);
}


// --- Exports ---
export {
    handleJoystickInput,
    updateLaserPointer,
    controller1,
    controller2,
    cameraGroup,
    // Export grabbedObjectData and grabbingController for main loop to use
    grabbedObjectData,
    grabbingController
    // tryGrabObject, // No longer needed externally? Called via event listener
    // releaseObject // No longer needed externally? Called via event listener
};