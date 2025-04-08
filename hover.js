import * as THREE from 'three';
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

  const handedness = controller.userData.handedness || "unknown";

  // Clear previous highlights
  while (intersected.length) {
    const obj = intersected.pop();
    if (obj.material?.emissive) {
      obj.material.emissive.setRGB(0, 0, 0);
    }
    console.log(`[Hover:${handedness}] Cleared emissive from`, obj.name || obj.type);
  }

  // Ray from controller
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  raycaster.far = 10;

  const intersections = raycaster.intersectObjects(group.children, true);
  const line = controller.userData.laser;

  // console.log(`[Hover:${handedness}] Intersections:`, intersections);

  if (intersections.length > 0) {
    const hit = intersections[0].object;
    console.log(`[Hover:${handedness}] Hit object:`, hit);

    if (hit instanceof THREE.Mesh) {
      console.log(`[Hover:${handedness}] Mesh detected — trying haptics`);

      const inputSource = controller.userData.inputSource;
      if (!inputSource) {
        console.warn(`[Hover:${handedness}] 🚫 No inputSource`);
        return;
      }

      const gamepad = inputSource.gamepad;
      if (!gamepad) {
        console.warn(`[Hover:${handedness}] 🚫 No gamepad`);
        return;
      }

      const actuator = gamepad.hapticActuators?.[0];
      if (!actuator) {
        console.warn(`[Hover:${handedness}] 🚫 No haptic actuator`);
        return;
      }

      if (typeof actuator.pulse === "function") {
        console.log(`[Hover:${handedness}] ✅ actuator.pulse() triggered!`);
        actuator.pulse(1.0, 100);
      } else {
        console.warn(`[Hover:${handedness}] ❌ pulse not supported`);
      }
    } else {
      console.log("I'm not instamnce of THREE.Mesh !")
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
