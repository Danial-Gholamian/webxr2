import * as THREE from 'three';
import { scene } from './sceneSetup.js';

const length = 2;
const gravity = 9.81;
const damping = 0.995;

const matcapTexture = new THREE.TextureLoader().load(
  'https://raw.githubusercontent.com/nidorx/matcaps/master/1024/5C4E41_CCCDD6_9B979B_B1AFB0.png'
);

export const pendulums = [];

export class Pendulum {
  constructor(position) {
    this.angle = Math.PI / 4;
    this.velocity = 0;
    this.acceleration = 0;

    const armGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 32);
    const armMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
    this.arm = new THREE.Mesh(armGeometry, armMaterial);
    this.arm.position.y = -length / 2;
    this.arm.userData.grabbable = true;
    this.arm.userData.type = 'pendulum';

    const bobGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const bobMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
    this.bob = new THREE.Mesh(bobGeometry, bobMaterial);
    this.bob.position.y = -length;
    this.bob.userData.grabbable = true;
    this.bob.userData.type = 'pendulum';

    this.pivot = new THREE.Object3D();
    this.pivot.position.copy(position);
    this.pivot.add(this.arm);
    this.pivot.add(this.bob);
    this.pivot.userData.type = 'pendulum';

    scene.add(this.pivot);
  }

  update(deltaTime) {
    this.acceleration = (-gravity / length) * Math.sin(this.angle);
    this.velocity += this.acceleration * deltaTime;
    this.velocity *= damping;
    this.angle += this.velocity * deltaTime;
    this.pivot.rotation.z = this.angle;
  }
}

export function createPendulum(position) {
  const p = new Pendulum(position);
  pendulums.push(p);
  return p;
}

export function updatePendulums(deltaTime) {
  pendulums.forEach(p => p.update(deltaTime));
}
