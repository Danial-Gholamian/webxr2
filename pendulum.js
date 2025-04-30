// pendulum.js (Refactored for PointsMaterial)
import * as THREE from 'three';
import { scene } from './sceneSetup.js';
// Removed imports related to old hover/interaction group setup
import graphData from './graph-data.js';

// --- Graph State ---
// Store node data (id, original data, position index) mapped by ID
export const nodeDataMap = new Map();
// Store logical links { sourceId, targetId }
export const links = [];
// Store the THREE.Line objects for updating link visuals
const linkLines = [];

// --- Materials ---
// Single material for all point nodes
const pointsMaterial = new THREE.PointsMaterial({
    size: 0.5,             // Adjust point size as needed
    sizeAttenuation: true, // Points smaller further away
    vertexColors: true,    // Use colors defined in geometry attribute
    transparent: true,     // Often useful for points visual clarity
    opacity: 1.0
    // depthWrite: false,  // Consider if alpha/blending issues occur
    // blending: THREE.AdditiveBlending // Optional: for bright overlapping points
});

// Material for edges (links)
const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.6
});

// --- Node Processing & Geometry Creation ---
const nodeCount = graphData.nodes.length;
const positions = new Float32Array(nodeCount * 3); // x, y, z for each node
const colors = new Float32Array(nodeCount * 3);    // r, g, b for each node
const originalColors = new Float32Array(nodeCount * 3); // To store original colors for hover reset

const tempColor = new THREE.Color(); // Reusable color object

graphData.nodes.forEach((data, index) => {
    const i3 = index * 3;

    // Initial Position (random example, use your layout logic if you have one)
    const x = Math.random() * 10 - 5;
    const y = Math.random() * 5 + 1; // Ensure y > 0 ?
    const z = Math.random() * 10 - 5;
    positions[i3    ] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    // Color (example: based on group or random)
    // Adapt this based on your 'graphData' structure and desired coloring
    if (data.group !== undefined) {
        tempColor.setHSL((data.group / 10) % 1, 0.7, 0.6); // Example color from group
    } else {
        tempColor.setHex(0x00ff00); // Default color if no group
    }
    colors[i3    ] = tempColor.r;
    colors[i3 + 1] = tempColor.g;
    colors[i3 + 2] = tempColor.b;

    // Store original colors
    originalColors[i3    ] = tempColor.r;
    originalColors[i3 + 1] = tempColor.g;
    originalColors[i3 + 2] = tempColor.b;


    // Store node data mapped by ID, including its index
    nodeDataMap.set(data.id, {
        id: data.id,
        originalData: data, // Keep original data if needed
        index: index,       // The index for accessing attributes
        isBeingHeld: false, // Flag for grabbing logic
        // Store initial position Vector3 if needed elsewhere, but primary source is the attribute array
        // position: new THREE.Vector3(x, y, z)
    });
});

// --- Create Single Points Geometry ---
const pointsGeometry = new THREE.BufferGeometry();
pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
// Store original colors directly on geometry for easier access in hover.js
pointsGeometry.userData.originalColors = originalColors;

// --- Create Single Points Object ---
// This is the main object representing all nodes visually
export const allNodesPoints = new THREE.Points(pointsGeometry, pointsMaterial);
allNodesPoints.userData.isNodePointsObject = true; // Identifier for raycasting logic
scene.add(allNodesPoints);

// --- Process Logical Links ---
graphData.links.forEach(linkData => {
    // Ensure source/target are IDs
    const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
    const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;

    if (nodeDataMap.has(sourceId) && nodeDataMap.has(targetId)) {
        links.push({ sourceId: sourceId, targetId: targetId });
    } else {
        console.warn("Skipping link due to missing node:", linkData);
    }
});

// --- Draw Links (Edges) - Adapted ---
function drawGraphLinks() {
    const posAttr = allNodesPoints.geometry.attributes.position; // Reference position attribute

    links.forEach(link => {
        const sourceNodeData = nodeDataMap.get(link.sourceId);
        const targetNodeData = nodeDataMap.get(link.targetId);

        if (!sourceNodeData || !targetNodeData) return;

        // Get positions directly from the main geometry's attribute array
        const sourcePos = new THREE.Vector3().fromBufferAttribute(posAttr, sourceNodeData.index);
        const targetPos = new THREE.Vector3().fromBufferAttribute(posAttr, targetNodeData.index);

        const points = [sourcePos, targetPos];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, edgeMaterial.clone()); // Use clone if edge materials might differ

        line.userData.type = 'edge';
        // Store indices for easy update later
        line.userData.sourceIndex = sourceNodeData.index;
        line.userData.targetIndex = targetNodeData.index;
        scene.add(line);

        linkLines.push(line); // Store the line object for updating
    });
}

// Initial drawing of links
drawGraphLinks();

// --- Update Link Positions if Nodes Move - Adapted ---
export function updateGraphLinks() {
    const posAttr = allNodesPoints.geometry.attributes.position; // Get attribute reference once

    linkLines.forEach(line => {
        const linePosAttr = line.geometry.attributes.position;
        const sourceIndex = line.userData.sourceIndex;
        const targetIndex = line.userData.targetIndex;

        // Read current positions directly from the Points geometry attribute array
        linePosAttr.setXYZ(0, posAttr.getX(sourceIndex), posAttr.getY(sourceIndex), posAttr.getZ(sourceIndex));
        linePosAttr.setXYZ(1, posAttr.getX(targetIndex), posAttr.getY(targetIndex), posAttr.getZ(targetIndex));

        linePosAttr.needsUpdate = true; // Tell Three.js to update this line geometry
    });
}

// --- Removed interactiveGroup setup ---
// Interaction logic is now handled via raycasting the `allNodesPoints` object
// in hover.js and vrSetup.js

console.log("pendulum.js refactored for PointsMaterial.");