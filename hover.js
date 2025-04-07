import * as THREE from 'three';

const intersected = [];
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();

export function setupInteractiveGroup(pendulums) {
  const group = new THREE.Group();
  pendulums.forEach(p => group.add(p.bob)); // or p.arm
  return group;
}

export function detectHover(controller, group) {
  if (controller.userData.selected) return;

  while (intersected.length) {
    const obj = intersected.pop();
    if (obj.material?.emissive) obj.material.emissive.r = 0;
  }

  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  raycaster.far = 10;

  const intersections = raycaster.intersectObjects(group.children, true);

  const line = controller.userData.laser;
  if (intersections.length > 0) {
    const object = intersections[0].object;
    if (object.material?.emissive) object.material.emissive.r = 1;
    intersected.push(object);
    if (line) line.scale.z = intersections[0].distance;
  } else {
    if (line) line.scale.z = 10;
  }
}
