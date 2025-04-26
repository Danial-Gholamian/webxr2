// main.js
import * as THREE from 'three';
import { scene, camera, renderer } from './sceneSetup.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import {
  handleJoystickInput,
  updateLaserPointer,
  controller1,
  controller2,
  tryGrabObject,
  releaseObject,
  grabbedObject,
  grabbingController
} from './vrSetup.js';

import { movement } from './controls.js';
import { detectHover, setupInteractiveGroup } from './hover.js';

import { createGraphNode, createGraphLink, drawGraphLinks, updateGraphLinks, nodes } from './graph.js'; // << updated import

// Add VR button and enable WebXR
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

// Create some graph nodes
const node1 = createGraphNode(new THREE.Vector3(-2, 2, -2));
const node2 = createGraphNode(new THREE.Vector3(2, 2, -2));
const node3 = createGraphNode(new THREE.Vector3(0, 0, -2));

createGraphLink(node1, node2);
createGraphLink(node2, node3);
createGraphLink(node3, node1);

// Now that nodes are created, draw edges
drawGraphLinks();

// Create an interactive group for grabbing nodes
const interactiveGroup = setupInteractiveGroup(nodes);
scene.add(interactiveGroup);

controller1.addEventListener('selectstart', () => tryGrabObject(controller1));
controller1.addEventListener('selectend', () => releaseObject());
controller2.addEventListener('selectstart', () => tryGrabObject(controller2));
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

  updateGraphLinks(); // <-- update edge positions if nodes move
  updateCameraMovement();

  if (grabbedObject && grabbingController) {
    const controllerPos = new THREE.Vector3();
    grabbingController.getWorldPosition(controllerPos);
    grabbedObject.position.lerp(controllerPos, 0.3); // smooth follow
  }

  renderer.render(scene, camera);
});
