// main.js
import * as THREE from 'three';
import { scene, camera, renderer } from './sceneSetup.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import {
  handleJoystickInput,
  updateLaserPointer,
  controller1,
  controller2,
  grabbedObject,
  grabbingController,
  tryGrabObject,
  releaseObject
} from './vrSetup.js';
import { createPendulum, updatePendulums} from './pendulum.js';
import { movement } from './controls.js';
import { detectHover, setupInteractiveGroup } from './hover.js';
import { pendulums } from './pendulum.js';

// Add VR button and enable WebXR
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

// Create pendulums
for (let i = 0; i < 5; i++) {
  createPendulum(new THREE.Vector3(i * 1.5 - 3, 2, -2));
}

// Now that pendulums are created, create the interactive group
const interactiveGroup = setupInteractiveGroup(pendulums);
scene.add(interactiveGroup);
controller1.addEventListener('selectstart', () => tryGrabObject(controller1, interactiveGroup));
controller1.addEventListener('selectend', () => releaseObject());
controller2.addEventListener('selectstart', () => tryGrabObject(controller2, interactiveGroup));
controller2.addEventListener('selectend', () => releaseObject());

// Keyboard movement handler
function updateCameraMovement() {
  const forwardVector = new THREE.Vector3();
  camera.getWorldDirection(forwardVector);
  camera.position.addScaledVector(forwardVector, movement.forward * 0.1);

  const rightVector = new THREE.Vector3();
  rightVector.crossVectors(camera.up, forwardVector);
  camera.position.addScaledVector(rightVector, movement.right * 0.1);
}

// Main animation loop
renderer.setAnimationLoop((time, xrFrame) => {
  if (xrFrame) handleJoystickInput(xrFrame);

  updateLaserPointer(controller1);
  updateLaserPointer(controller2);
  if (controller1.userData.inputSource) detectHover(controller1, interactiveGroup);
  if (controller2.userData.inputSource) detectHover(controller2, interactiveGroup);
  

  updatePendulums(0.016);
  updateCameraMovement();
  // updateGrabbedPendulum();

  if (grabbedObject && grabbingController) {
    console.log("🧲 Moving grabbed object:", grabbedObject.name || grabbedObject.uuid);
    const controllerPos = new THREE.Vector3();
    grabbingController.getWorldPosition(controllerPos);
    console.log("🎮 Controller position:", controllerPos);
    grabbedObject.position.lerp(controllerPos, 0.3); // smooth follow

  }  
  renderer.render(scene, camera);
});
