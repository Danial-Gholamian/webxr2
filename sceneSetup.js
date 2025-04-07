// sceneSetup.js
import * as THREE from 'three';

// Scene setup
export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.6, 5);

// Renderer setup
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Skybox
const skyboxTexture = new THREE.TextureLoader().load('background.webp');
const skybox = new THREE.Mesh(
  new THREE.SphereGeometry(100, 32, 32),
  new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide })
);
scene.add(skybox);

// Lighting
const light = new THREE.PointLight(0xffffff, 1, 10);
light.position.set(0, 3, 0);
scene.add(light);
