  // main.js
  import * as THREE from 'three';
  import { scene, camera, renderer } from './sceneSetup.js';
  import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
  import {
    handleJoystickInput,
    updateLaserPointer,
    controller1,
    controller2,
  } from './vrSetup.js';
  import { createPendulum, updatePendulums, highlightPendulum } from './pendulum.js';
  import { movement } from './controls.js';

  document.body.appendChild(VRButton.createButton(renderer));
  renderer.xr.enabled = true;

  // Create pendulums
  for (let i = 0; i < 5; i++) {
    createPendulum(new THREE.Vector3(i * 1.5 - 3, 2, -2));
  }

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
    highlightPendulum(controller1);
    highlightPendulum(controller2);

    updatePendulums(0.016);
    updateCameraMovement();
    // updatePendulumPosition();
    renderer.render(scene, camera);
  });
