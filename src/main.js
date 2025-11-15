// --- Scene ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  25,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 18;

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#webgl"),
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// --- Lights ---
scene.add(new THREE.AmbientLight(0xffffff, 1));
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(2, 2, 3);
scene.add(dir);

// --- 12 ballon groottes + posities ---
const radii = [1, 0.8, 0.6, 0.9, 0.5, 1.1, 0.7, 0.4, 0.65, 0.85, 0.55, 0.95];

const positions = [
  { x: 0, y: 0, z: 0 },
  { x: 1.2, y: 0.6, z: -0.3 },
  { x: -1.3, y: -0.4, z: 0.4 },
  { x: -1, y: 1.2, z: -0.2 },
  { x: 0.7, y: -1.1, z: 0.6 },
  { x: -0.4, y: -1.4, z: -0.3 },
  { x: 1.6, y: -0.3, z: 0.5 },
  { x: -1.7, y: 0.3, z: -0.6 },
  { x: 0.4, y: 1.6, z: 0.2 },
  { x: -0.9, y: -1.8, z: 0.8 },
  { x: 1.1, y: -1.3, z: -0.5 },
  { x: -1.5, y: 1.5, z: 0.4 },
];

const spheres = [];
const group = new THREE.Group();
scene.add(group);

const material = new THREE.MeshLambertMaterial({ color: "#e6b7b7" });

positions.forEach((pos, i) => {
  const geom = new THREE.SphereGeometry(radii[i], 48, 48);
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.userData.original = { ...pos };
  spheres.push(mesh);
  group.add(mesh);
});

// --- Mouse interaction ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const forces = new Map();

window.addEventListener("mousemove", (e) => {
  // cursor movement
  circleQuickX(e.clientX);
  circleQuickY(e.clientY);
  circleFollowX(e.clientX);
  circleFollowY(e.clientY);

  // raycaster position
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(spheres);

  if (hit.length > 0) {
    const balloon = hit[0].object;

    // push away smoothly
    const force = new THREE.Vector3()
      .subVectors(hit[0].point, balloon.position)
      .normalize()
      .multiplyScalar(0.2);

    forces.set(balloon.uuid, force);
  }
});

// --- Breathing + motion ---
function animate() {
  requestAnimationFrame(animate);

  const t = Date.now() * 0.0015;

  spheres.forEach((s, i) => {
    const base = s.userData.original;

    // breathing motion
    const breathY = Math.sin(t + i) * 0.1;
    const breathZ = Math.cos(t + i) * 0.08;

    const target = new THREE.Vector3(
      base.x,
      base.y + breathY,
      base.z + breathZ
    );

    s.position.lerp(target, 0.03);

    // hover forces
    const f = forces.get(s.uuid);
    if (f) {
      s.position.add(f);
      f.multiplyScalar(0.9);
      if (f.length() < 0.01) forces.delete(s.uuid);
    }
  });

  renderer.render(scene, camera);
}
animate();

// --- Cursor animation ---
gsap.set(".circle", { xPercent: -50, yPercent: -50 });
gsap.set(".circle-follow", { xPercent: -50, yPercent: -50 });

const circleQuickX = gsap.quickTo(".circle", "x", { duration: 0.3 });
const circleQuickY = gsap.quickTo(".circle", "y", { duration: 0.3 });
const circleFollowX = gsap.quickTo(".circle-follow", "x", { duration: 0.6 });
const circleFollowY = gsap.quickTo(".circle-follow", "y", { duration: 0.6 });

// Resize
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
