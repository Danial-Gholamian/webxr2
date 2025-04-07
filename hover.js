// hover.js
import * as THREE from 'three';
import { pendulums } from './pendulum.js';
import { renderer } from './sceneSetup.js';

const intersected = [];
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();

export function setupInteractiveGroup(pendulums) {
  const group = new THREE.Group();
  pendulums.forEach(p => group.add(p.pivot));
  return group;
}

export function detectHover(controller, group) {
  if (controller.userData.selected) return;

  // Identify controller handedness
  const handedness = controller.userData.handedness || "unknown";

  // Clear previous highlights
  while (intersected.length) {
    const obj = intersected.pop();
    if (obj.material?.emissive) {
      obj.material.emissive.setRGB(0, 0, 0);
    }
    console.log(`[Hover:${handedness}] Cleared emissive from`, obj.name || obj.type);
  }

  // Set up ray from controller
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  raycaster.far = 10;

  const intersections = raycaster.intersectObjects(group.children, true);
  const line = controller.userData.laser;

  if (intersections.length > 0) {
    const hit = intersections[0].object;
    const hitName = hit.name || hit.type;
    console.log(`[Hover:${handedness}] Hit object: ${hitName}`);

    const pendulumIndex = pendulums.findIndex(p =>
      p.arm === hit || p.bob === hit || p.pivot === hit.parent || p.pivot === hit
    );
    const pendulum = pendulums[pendulumIndex];

    if (pendulum && pendulum.bob.material?.emissive) {
      pendulum.bob.material.emissive.setRGB(1, 0, 0); // red
      intersected.push(pendulum.bob);

      console.log(`[Hover:${handedness}] Highlighting bob of pendulum #${pendulumIndex} at`, pendulum.pivot.position);

      if (!controller.userData.lastHovered || controller.userData.lastHovered !== pendulum) {
        controller.userData.lastHovered = pendulum;
        console.log(`[Hover:${handedness}] New hover — triggering haptics`);

        const session = renderer.xr.getSession();
        const inputSource = session?.inputSources.find(src => src.targetRaySpace === controller);
        if (inputSource?.gamepad?.hapticActuators?.[0]) {
          inputSource.gamepad.hapticActuators[0].pulse(1.0, 50);
        } else {
          console.log(`[Hover:${handedness}] Haptics not available`);
        }
      }
    }

    if (line) line.scale.z = intersections[0].distance;
  } else {
    if (line) line.scale.z = 10;

    if (controller.userData.lastHovered) {
      console.log(`[Hover:${handedness}] No intersection — clearing lastHovered`);
    }

    controller.userData.lastHovered = null;
  }
}

