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
  console.log(`[Hover:${handedness}] Intersections:`, intersections);
  if (intersections.length > 0) {
    const hit = intersections[0].object;
    const hitName = hit.name || hit.type;
    console.log(`[Hover:${handedness}] Hit object: ${hitName}`);
    console.log(`[Hover:${handedness}] Hit object name/type: ${hitName}`);

    const pendulum = pendulums.find(p => {
      return (
        hit === p.bob ||                     // direct match
        hit === p.arm ||
        hit === p.pivot ||
        hit.parent === p.bob ||             // one level up
        hit.parent === p.arm ||
        hit.parent === p.pivot ||
        p.pivot.children.includes(hit) ||   // children array match
        p.arm.children?.includes(hit) ||
        p.bob.children?.includes(hit)
      );
    });
    

    if (pendulum && pendulum.bob.material?.emissive) {
      pendulum.bob.material.emissive.setRGB(1, 0, 0); // red
      intersected.push(pendulum.bob);
    
      console.log(`[Hover:${handedness}] Highlighting pendulum at`, pendulum.pivot.position);
    
      if (!controller.userData.lastHovered || controller.userData.lastHovered !== pendulum) {
        controller.userData.lastHovered = pendulum;
        console.log(`[Hover:${handedness}] New hover — triggering haptics`);
        
        // ... haptics code ...    
        const inputSource = controller.userData.inputSource;
        if (!inputSource) {
          console.warn(`[Hover:${handedness}] 🚫 No inputSource on controller.userData`);
          return;
        }
        
        console.log(`[Hover:${handedness}] ✅ inputSource`, inputSource);
        
        const gamepad = inputSource.gamepad;
        if (!gamepad) {
          console.warn(`[Hover:${handedness}] 🚫 inputSource has no gamepad`);
          return;
        }
        
        console.log(`[Hover:${handedness}] 🎮 Gamepad detected`, gamepad);
        console.log(`[Hover:${handedness}] 🔧 hapticActuators`, gamepad.hapticActuators);
        
        const actuator = gamepad.hapticActuators?.[0];
        if (!actuator) {
          console.warn(`[Hover:${handedness}] 🚫 No haptic actuator found`);
          return;
        }
        
        if (typeof actuator.pulse === "function") {
          console.log(`[Hover:${handedness}] ✅ actuator.pulse exists — sending pulse!`);
          actuator.pulse(1.0, 100);
        } else {
          console.warn(`[Hover:${handedness}] ❌ actuator.pulse is not a function`);
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
