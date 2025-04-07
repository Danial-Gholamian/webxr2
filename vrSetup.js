// vrSetup.js
import * as THREE from 'three';
import { scene, camera, renderer } from './sceneSetup.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { grabPendulum, releasePendulum } from './pendulum.js';

let cameraGroup = new THREE.Group();
cameraGroup.add(camera);
scene.add(cameraGroup);

const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
cameraGroup.add(controller1);
cameraGroup.add(controller2);

// Handedness tagging
controller1.userData.handedness = "left";
controller2.userData.handedness = "right";

// Setup grabbing
controller1.addEventListener('selectstart', () => grabPendulum(controller1));
controller1.addEventListener('selectend', releasePendulum);
controller2.addEventListener('selectstart', () => grabPendulum(controller2));
controller2.addEventListener('selectend', releasePendulum);

function setupController(controller, index) {
  const controllerGrip = renderer.xr.getControllerGrip(index);
  const modelFactory = new XRControllerModelFactory();
  controllerGrip.add(modelFactory.createControllerModel(controllerGrip));
  cameraGroup.add(controllerGrip);

  const laserGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
  ]);
  const laserMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const laser = new THREE.Line(laserGeometry, laserMaterial);
  laser.scale.z = 50;

  controller.add(laser);
  controller.userData.laser = laser;
  cameraGroup.add(controller);
}

setupController(controller1, 0);
setupController(controller2, 1);

// Assign inputSources once XR session starts
renderer.xr.addEventListener("sessionstart", () => {
  const session = renderer.xr.getSession();
  session.inputSources.forEach((source) => {
    if (source.handedness === "left") controller1.userData.inputSource = source;
    if (source.handedness === "right") controller2.userData.inputSource = source;
  });
});

// Optional test log when pressing trigger
function handleTriggerClick(controller) {
  controller.addEventListener('selectstart', () => {
    console.log(`[Trigger] ${controller.userData.handedness} controller clicked`);
    if (controller.userData.laser) {
      const pos = new THREE.Vector3();
      controller.userData.laser.getWorldPosition(pos);
      console.log(`[Trigger] Laser World Position: x=${pos.x}, y=${pos.y}, z=${pos.z}`);
    }
  });
}

handleTriggerClick(controller1);
handleTriggerClick(controller2);

// Thumbstick movement
const movementSpeed = 0.05;
const rotationSpeed = 0.03;
const deadZone = 0.1;

function moveThumbstick(inputX, inputY, speed = movementSpeed) {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(camera.up, direction).normalize();

  if (Math.abs(inputX) > deadZone || Math.abs(inputY) > deadZone) {
    cameraGroup.position.add(right.multiplyScalar(inputX * speed));
    cameraGroup.position.add(direction.multiplyScalar(-inputY * speed));
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
    controller.userData.laser.scale.z = 50;
  }
}

export {
  handleJoystickInput,
  updateLaserPointer,
  controller1,
  controller2,
  cameraGroup
};
