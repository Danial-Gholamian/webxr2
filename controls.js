// controls.js

import * as THREE from 'three';
import { camera } from './sceneSetup.js';
import { pendulums } from './pendulum.js';

// --- Raycaster for Mouse Selection ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let grabbedPendulum = null;
let isDragging = false;

// --- Detect "V" key press ---
document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "v") isDragging = true;
});

document.addEventListener("keyup", (event) => {
  if (event.key.toLowerCase() === "v") {
    isDragging = false;
    grabbedPendulum = null; // Release pendulum
  }
});

// --- Detect mouse click (start dragging) ---
document.addEventListener("mousedown", (event) => {
  if (!isDragging) return;

  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersections = raycaster.intersectObjects(pendulums.map(p => p.pivot), true);

  if (intersections.length > 0) {
    grabbedPendulum = intersections[0].object; // ✅ Correct: grab sphere directly
  }
});

// --- Move pendulum with mouse ---
document.addEventListener("mousemove", (event) => {
  if (!grabbedPendulum) return;

  // Update mouse position
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Project ray from camera
  raycaster.setFromCamera(mouse, camera);

  // Drag on a horizontal plane at current Y level
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -grabbedPendulum.position.y);
  const intersection = new THREE.Vector3();

  if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
    // Optional: float the pendulum slightly upwards while dragging
    intersection.y += 0.5;

    // Smooth movement
    grabbedPendulum.position.lerp(intersection, 0.2);
  }
});

// --- Keyboard Movement Data ---
const movementSpeed = 0.1;
const movement = { forward: 0, right: 0 };

window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
    case 'ArrowUp':
      movement.forward = 1;
      break;
    case 's':
    case 'ArrowDown':
      movement.forward = -1;
      break;
    case 'a':
    case 'ArrowLeft':
      movement.right = 1;
      break;
    case 'd':
    case 'ArrowRight':
      movement.right = -1;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'w':
    case 'ArrowUp':
    case 's':
    case 'ArrowDown':
      movement.forward = 0;
      break;
    case 'a':
    case 'ArrowLeft':
    case 'd':
    case 'ArrowRight':
      movement.right = 0;
      break;
  }
});

// --- Mouse Look (right-click to rotate camera) ---
let isLooking = false;
let previousMouseX = 0, previousMouseY = 0;

window.addEventListener('mousedown', (event) => {
  if (event.button === 2) { // Right-click
    isLooking = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
  }
});

window.addEventListener('mouseup', () => {
  isLooking = false;
});

window.addEventListener('mousemove', (event) => {
  if (isLooking) {
    const deltaX = event.clientX - previousMouseX;
    const deltaY = event.clientY - previousMouseY;

    const rotationSpeed = 0.002;
    camera.rotation.y -= deltaX * rotationSpeed;
    camera.rotation.x -= deltaY * rotationSpeed;
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x)); // Clamp vertical look

    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
  }
});

// --- Disable right-click context menu (optional, but feels cleaner) ---
window.addEventListener('contextmenu', event => event.preventDefault());

// --- Export movement data for use in main.js ---
export { movement };
