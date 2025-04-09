import * as THREE from 'three';
import { scene } from './sceneSetup.js';

const length = 2;
const gravity = 9.81;
const damping = 0.995;

const matcapTexture = new THREE.TextureLoader().load(
  'https://raw.githubusercontent.com/nidorx/matcaps/master/1024/5C4E41_CCCDD6_9B979B_B1AFB0.png'
);

export const pendulums = [];

export function createPendulum(position) {
  const angle = Math.PI / 4;
  const velocity = 0;
  const acceleration = 0;

  // Arm
  const armGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 32);
  const armMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
  const arm = new THREE.Mesh(armGeometry, armMaterial);
  arm.position.y = -length / 2;
  arm.userData.grabbable = true;
  arm.userData.type = 'pendulum';

  // Bob
  const bobGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const bobMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
  const bob = new THREE.Mesh(bobGeometry, bobMaterial);
  bob.position.y = -length;
  bob.userData.grabbable = true;
  bob.userData.type = 'pendulum';

  // Pivot
  const pivot = new THREE.Object3D();
  pivot.position.copy(position);
  pivot.add(arm);
  pivot.add(bob);
  pivot.userData.type = 'pendulum';
  pivot.userData.isBeingHeld = false;

  scene.add(pivot);

  const pendulum = {
    pivot,
    arm,
    bob,
    angle,
    velocity,
    acceleration
  };

  pendulums.push(pendulum);
  return pendulum;
}

export function updatePendulums(deltaTime) {
  pendulums.forEach(p => {
    if (p.pivot.userData.isBeingHeld) return;

    p.acceleration = (-gravity / length) * Math.sin(p.angle);
    p.velocity += p.acceleration * deltaTime;
    p.velocity *= damping;
    p.angle += p.velocity * deltaTime;
    p.pivot.rotation.z = p.angle;
  });
}
