import * as THREE from 'three';
import { scene } from './sceneSetup.js';

// --- Graph State ---
export const nodes = [];
export const links = [];

const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

// --- Create a Node ---
export function createGraphNode(position) {
  const geometry = new THREE.SphereGeometry(0.2, 16, 16);
  const node = new THREE.Mesh(geometry, nodeMaterial.clone());
  node.position.copy(position);
  node.userData.type = 'node';
  scene.add(node);
  nodes.push(node);
  return node;
}

// --- Create a Logical Link ---
export function createGraphLink(nodeA, nodeB) {
  links.push({ source: nodeA, target: nodeB });
}

// --- Draw Links (edges) ---
export function drawGraphLinks() {
  links.forEach(link => {
    const points = [link.source.position.clone(), link.target.position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, edgeMaterial.clone());
    line.userData.type = 'edge';
    scene.add(line);

    // Store the line inside the link if you want to update later
    link.lineObject = line;
  });
}

// --- Update Link Positions if Nodes Move ---
export function updateGraphLinks() {
  links.forEach(link => {
    if (!link.lineObject) return;

    const positions = link.lineObject.geometry.attributes.position.array;

    positions[0] = link.source.position.x;
    positions[1] = link.source.position.y;
    positions[2] = link.source.position.z;

    positions[3] = link.target.position.x;
    positions[4] = link.target.position.y;
    positions[5] = link.target.position.z;

    link.lineObject.geometry.attributes.position.needsUpdate = true;
  });
}
