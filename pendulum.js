// pendulum.js
import * as THREE from 'three';
import { scene } from './sceneSetup.js';
import { renderer } from './sceneSetup.js';

const length = 2;
const gravity = 9.81;
const damping = 0.995;

export const pendulums = [];
// let grabbedPendulum = null;
// let grabbedController = null;

const matcapTexture = new THREE.TextureLoader().load(
  'https://raw.githubusercontent.com/nidorx/matcaps/master/1024/5C4E41_CCCDD6_9B979B_B1AFB0.png'
);

function createPendulum(position) {


  const armGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 32);
  const armMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
  const arm = new THREE.Mesh(armGeometry, armMaterial);

  const bobGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const bobMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
//   const bobMaterial = new THREE.MeshStandardMaterial({
//   color: 0x3333ff,
//   emissive: 0x000000,
//   metalness: 0.2,
//   roughness: 0.5,
// });
  const bob = new THREE.Mesh(bobGeometry, bobMaterial);

  bob.userData.defaultMaterial = bobMaterial;
  
  bob.userData.grabbable = true;
  arm.userData.grabbable = true;
  arm.position.y = -length / 2;
  bob.position.y = -length;

  const pivot = new THREE.Object3D();
  pivot.add(arm);
  pivot.add(bob);
  pivot.position.copy(position);

  pivot.userData.boundingBox = new THREE.Box3().setFromObject(pivot);

  scene.add(pivot);

  pendulums.push({ pivot, bob, arm, angle: Math.PI / 4, velocity: 0, acceleration: 0 });

  return pivot;
}


// Raycasting for controller selection
// const raycaster = new THREE.Raycaster();

// function grabPendulum(controller) {
//   scene.updateMatrixWorld(true);

//   const rayOrigin = new THREE.Vector3();
//   controller.getWorldPosition(rayOrigin);

//   const rayDirection = new THREE.Vector3();
//   controller.getWorldDirection(rayDirection).normalize().multiplyScalar(5);

//   raycaster.set(rayOrigin, rayDirection);
//   const intersects = raycaster.intersectObjects(pendulums.map(p => p.pivot), true);

//   if (intersects.length > 0) {
//     const hit = intersects[0].object;

//     grabbedPendulum = pendulums.find(p =>
//       hit === p.bob ||
//       hit === p.arm ||
//       hit === p.pivot ||
//       p.pivot.children.includes(hit) ||
//       p.arm.children?.includes(hit) ||
//       p.bob.children?.includes(hit) ||
//       hit.parent === p.pivot ||
//       hit.parent === p.arm ||
//       hit.parent === p.bob
//     );

//     if (grabbedPendulum) {
//       grabbedController = controller;
//       console.log("🎯 Pendulum grabbed!", grabbedPendulum.pivot.position);
//     } else {
//       console.warn("❌ Hit something, but it didn't match a pendulum:", hit);
//     }
//   } else {
//     console.log("🚫 No pendulum detected.");
//   }
// }



// function releasePendulum() {
//   if (grabbedPendulum) {
//     grabbedPendulum.velocity = 0;
//     grabbedPendulum.acceleration = 0;
//     grabbedPendulum = null;
//     grabbedController = null;
//   }
// }

function updatePendulums(deltaTime) {
  pendulums.forEach((p, index) => {

    p.acceleration = (-gravity / length) * Math.sin(p.angle);
    p.velocity += p.acceleration * deltaTime;
    p.velocity *= damping;
    p.angle += p.velocity * deltaTime;
    p.pivot.rotation.z = p.angle;
  });
}

// function updateGrabbedPendulum() {
//   if (grabbedPendulum && grabbedController) {
//     const controllerPos = new THREE.Vector3();
//     grabbedController.getWorldPosition(controllerPos);

//     grabbedPendulum.pivot.position.copy(controllerPos);
//   }
// }

// updatePendulums, grabPendulum, releasePendulum, updateGrabbedPendulum
export { createPendulum, updatePendulums};
