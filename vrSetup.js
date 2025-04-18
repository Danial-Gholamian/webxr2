
import * as THREE from 'three';


import { scene, camera, renderer } from './sceneSetup.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import {pendulums} from './pendulum.js'
// import { grabPendulum, releasePendulum } from './pendulum.js';




const cameraGroup = new THREE.Group();
cameraGroup.add(camera);
scene.add(cameraGroup);

const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
cameraGroup.add(controller1);
cameraGroup.add(controller2);

let grabbedObject = null;
let grabbingController = null;

//const raycaster = new THREE.Raycaster(); // reuse for grabbing



// controller1.addEventListener('selectstart', () => grabPendulum(controller1));
// controller1.addEventListener('selectend', releasePendulum);
// controller2.addEventListener('selectstart', () => grabPendulum(controller2));
// controller2.addEventListener('selectend', releasePendulum);

// What I do is to try for any type of object to see if it works 




function setupController(controller) {
const controllerGrip = renderer.xr.getControllerGrip(controller === controller1 ? 0 : 1);
const modelFactory = new XRControllerModelFactory();
controllerGrip.add(modelFactory.createControllerModel(controllerGrip));
cameraGroup.add(controllerGrip);

const laserGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -1)
]);
const laserMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const laser = new THREE.Line(laserGeometry, laserMaterial);
laser.userData.isLaser = true; // so we can ignore it later
laser.scale.z = 50;

controller.add(laser);
controller.userData.laser = laser;

cameraGroup.add(controller);

}


setupController(controller1);
setupController(controller2);



function tryGrabObject(controller) {
  const hovered = controller.userData.hoveredObject;

  if (!hovered) {
    console.log("🚫 No hovered object to grab.");
    return;
  }

  if (hovered.userData.isBeingHeld) {
    console.log("⚠️ Object is already being held.");
    return;
  }

  // Try to find the matching pendulum based on pivot, arm, or bob
  const match = pendulums.find(p =>
    hovered === p.pivot || hovered.parent === p.pivot || hovered.parent?.parent === p.pivot
  );

  if (match) {
    grabbedObject = match.pivot;
    grabbingController = controller;

    match.pivot.userData.isBeingHeld = true;
    hovered.userData.isHovered = false; // Stop hover feedback
    controller.userData.hoveredObject = null;

    console.log("✅ Grabbed pendulum:", grabbedObject);
  } else {
    console.warn("❓ Hovered object did not match any known pendulum.");
  }
}



function releaseObject() {
  if (grabbedObject) {
    grabbedObject.userData.isBeingHeld = false;
    grabbedObject = null;
    grabbingController = null;
  }
}



const controllers = { left: null, right: null };

renderer.xr.addEventListener("sessionstart", () => {
    const session = renderer.xr.getSession();
    session.inputSources.forEach((source) => {
        if (source.handedness === "left") controllers.left = source;
        if (source.handedness === "right") controllers.right = source;
    });
});

const movementSpeed = 0.05;
const rotationSpeed = 0.03;
const deadZone = 0.1;

function moveThumbstick(inputX, inputY, speed = movementSpeed) {
    let direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    let right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();

    if (Math.abs(inputX) > deadZone || Math.abs(inputY) > deadZone) {
        let moveX = right.multiplyScalar(inputX * speed);
        let moveZ = direction.multiplyScalar(-inputY * speed);
        cameraGroup.position.add(moveX).add(moveZ);
        // console.log("Move x: ", moveX);
        // console.log("Move z: ", moveZ);
    }
}

function handleJoystickInput(xrFrame) {
    const session = xrFrame.session;

    for (const source of session.inputSources) {
        if (!source.gamepad) continue;

        const handedness = source.handedness;
        const { axes } = source.gamepad;

        if (axes.length < 4) continue;

        if (handedness === "left") {
            cameraGroup.rotation.y -= axes[2] * rotationSpeed;
        }

        if (handedness === "right") {
            moveThumbstick(axes[2], axes[3]);
        }
    }

    cameraGroup.updateMatrixWorld(true);
}

function updateLaserPointer(controller) {
    if (controller.userData.laser) {
      // If you want to dynamically adjust length, you can still do that
      controller.userData.laser.scale.z = 50;
      // No need to manually update position or rotation —
      // it's already a child of the controller and follows it automatically
    }
  }
  


// ITS NEW FOR TEST MARCH 14 
function handleTriggerClick(controller) {
    controller.addEventListener('selectstart', () => {
      console.log("I'm clicking !!!");
  
      if (controller.userData.laser) {
        const laserWorldPos = new THREE.Vector3();
        controller.userData.laser.getWorldPosition(laserWorldPos);
        console.log(`Laser World Position: X=${laserWorldPos.x}, Y=${laserWorldPos.y}, Z=${laserWorldPos.z}`);
      }
    });
  }


controller1.userData.handedness = "left";
controller2.userData.handedness = "right";

renderer.xr.addEventListener("sessionstart", () => {
  const session = renderer.xr.getSession();

  // Immediately check just in case
  console.log("📦 XR InputSources on session start:", session.inputSources);

  // ALSO listen for when controllers become available
  session.addEventListener("inputsourceschange", () => {
    console.log("🎮 XR InputSources changed:", session.inputSources);

    session.inputSources.forEach((source) => {
      console.log("🎮 Source detected:", source);
      if (source.handedness === "left") controller1.userData.inputSource = source;
      if (source.handedness === "right") controller2.userData.inputSource = source;
    });
  });
});

function teleportFromController(controller) {
  const laserLength = 50;
  const direction = new THREE.Vector3();
  const position = new THREE.Vector3();

  // Get forward direction from controller
  controller.getWorldDirection(direction);
  direction.normalize();

  // Get controller position
  controller.getWorldPosition(position);

  // Calculate target point
  const target = position.clone().add(direction.multiplyScalar(-laserLength));

  // Set cameraGroup position (keeping Y height the same)
  cameraGroup.position.set(target.x, cameraGroup.position.y, target.z);

  console.log("🚀 Teleported to laser tip:", target);
}

// Teleportation
controller1.addEventListener('squeezestart', () => teleportFromController(controller1));
controller2.addEventListener('squeezestart', () => teleportFromController(controller2));



handleTriggerClick(controller1);
handleTriggerClick(controller2);
// UNTIL HERE 

export { handleJoystickInput, updateLaserPointer, controller1, controller2, cameraGroup, grabbedObject, grabbingController,tryGrabObject,releaseObject};
