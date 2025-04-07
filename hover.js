// hover.js
import * as THREE from 'three';
import { pendulums } from './pendulum.js';
import { renderer } from './sceneSetup.js';

const intersected = [];
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();

export function setupInteractiveGroup(pendulums) {
  const group = new THREE.Group();
  pendulums.forEach(p => group.add(p.pivot)); // ✅ Keep hierarchy intact
  return group;
}

export function detectHover(controller, group) {
  if (controller.userData.selected) return;

  // Clear previous highlights
  while (intersected.length) {
    const obj = intersected.pop();
    if (obj.material?.emissive) {
      obj.material.emissive.setRGB(0, 0, 0); // reset emissive to default
    }
  }

  // Set up ray from controller
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  raycaster.far = 10;

  // Intersect with pendulum pivots and children
  const intersections = raycaster.intersectObjects(group.children, true);
  const line = controller.userData.laser;

  if (intersections.length > 0) {
    const hit = intersections[0].object;

    // Find the matching pendulum
    const pendulum = pendulums.find(p =>
      p.arm === hit || p.bob === hit || p.pivot === hit.parent || p.pivot === hit
    );

    if (pendulum && pendulum.bob.material?.emissive) {
      // Set color while hovering
      pendulum.bob.material.emissive.setRGB(1, 0, 0); // red highlight
      intersected.push(pendulum.bob);

      // One-time haptic on first hover hit
      if (!controller.userData.lastHovered || controller.userData.lastHovered !== pendulum) {
        controller.userData.lastHovered = pendulum;

        const session = renderer.xr.getSession();
        const inputSource = session?.inputSources.find(src => src.targetRaySpace === controller);

        if (inputSource?.gamepad?.hapticActuators?.[0]) {
          inputSource.gamepad.hapticActuators[0].pulse(1.0, 50); // short buzz
        }
      }
    }

    if (line) line.scale.z = intersections[0].distance;
  } else {
    if (line) line.scale.z = 10;

    // Reset for next hit
    controller.userData.lastHovered = null;
  }
}
