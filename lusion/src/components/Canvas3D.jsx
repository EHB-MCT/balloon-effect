import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// ---------- CONSTANTS ----------

// Layout EXACT Lusion (profondeur, rangées…)
const POSITIONS = [
  new THREE.Vector3(-2.2, 1.6, 0.5),
  new THREE.Vector3(0.0, 1.4, -0.8),
  new THREE.Vector3(2.4, 1.5, 0.4),

  new THREE.Vector3(-1.0, 0.3, -1.2),
  new THREE.Vector3(0.0, 0.2, 0.0),
  new THREE.Vector3(2.0, 0.3, -1.0),
  new THREE.Vector3(-1.2, 0.1, 1.1),
  new THREE.Vector3(1.4, 0.2, 1.0),

  new THREE.Vector3(0.5, -1, -0.6),
  new THREE.Vector3(0.5, -1.6, 0.9),
  new THREE.Vector3(1.0, -1.2, -0.5),

  new THREE.Vector3(-1.0, -0.2, -2.4),
  new THREE.Vector3(1.2, 0.4, -2.2),
];

// Couleurs dark glossy / matte FINAL
const COLOR_PALETTE = [
  new THREE.Color("#1a3aff"),
  new THREE.Color("#0d1dfc"),
  new THREE.Color("#f3f3f3"),
  new THREE.Color("#ffffff"),
  new THREE.Color("#1d1d1f"),
  new THREE.Color("#0a0a0f"),
  new THREE.Color("#5865F2"),
];

// Physics settings
const CLONE_SCALE = 1.07;
const BASE_RADIUS = 1.2;
const FLOAT_STRENGTH = 0.15;
const LERP_FACTOR = 0.04;
const FORCE_DECAY = 0.98;
const MIN_FORCE = 0.005;

// ---------- HELPERS ----------

// LUMINOSITÉ EXACTE → dark deep glossy
function setupLights(scene) {
  // Ambient Light – un peu plus lumineuse
  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);

  // Key light – augmente légèrement l’impact du blanc
  const key = new THREE.DirectionalLight(0x5ba3ff, 2.4);
  key.position.set(5, 7, 6);
  scene.add(key);

  // Fill light – seulement une légère augmentation
  const fill = new THREE.DirectionalLight(0x7c3aed, 3.0);
  fill.position.set(-9, 4, -6);
  scene.add(fill);

  // Rim – une touche un peu plus forte pour renforcer le contraste du blanc
  const rim = new THREE.DirectionalLight(0x38bdf8, 1.5);
  rim.position.set(0, -3, -12);
  scene.add(rim);
}

// MATÉRIAUX — glossy OU matte
function applyMaterial(child, color, isMatte) {
  const mat = child.material.clone();
  mat.color.copy(color);

  if (isMatte) {
    mat.metalness = 0.0;
    mat.roughness = 2.9;
    mat.envMapIntensity = 0.06;
  } else {
    mat.metalness = 0.5;
    mat.roughness = 0.38;
    mat.envMapIntensity = 1.25;
  }

  child.material = mat;
}

// RENDERER
function createRenderer(mount) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);

  mount.appendChild(renderer.domElement);
  return renderer;
}

// ---------- MAIN COMPONENT ----------
export default function Canvas3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0d0d12");

    // CAMERA
    const camera = new THREE.PerspectiveCamera(
      25,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(6, 0.5, 6);
    camera.lookAt(0, 0, 0);

    // RENDERER
    const renderer = createRenderer(mount);

    // LIGHTS
    setupLights(scene);

    // GROUP + GLB
    const group = new THREE.Group();
    scene.add(group);

    const loader = new GLTFLoader();
    const clones = [];

    loader.load("/models/shape.glb", (gltf) => {
      const base = gltf.scene;

      POSITIONS.forEach((pos, i) => {
        const clone = base.clone(true);

        clone.scale.set(CLONE_SCALE, CLONE_SCALE, CLONE_SCALE);
        clone.position.copy(pos);

        clone.rotation.set(0.4 + i * 0.3, 0.8 + i * 0.25, 0.3 + i * 0.2);

        clone.userData.original = pos.clone();
        clone.userData.radius = BASE_RADIUS;
        clone.userData.seed = i * 0.6 + 1.2;

        const color = COLOR_PALETTE[i % COLOR_PALETTE.length];
        const isMatte = i % 3 === 0;

        clone.traverse((child) => {
          if (child.isMesh) applyMaterial(child, color, isMatte);
        });

        group.add(clone);
        clones.push(clone);
      });
    });

    // ---------- MOUSE FORCES ----------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const forces = new Map();
    const temp = new THREE.Vector3();
    const lastMouse = new THREE.Vector2();

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouse.x = (x / rect.width) * 2 - 1;
      mouse.y = -(y / rect.height) * 2 + 1;

      const movement = new THREE.Vector2(
        e.clientX - lastMouse.x,
        e.clientY - lastMouse.y
      );
      lastMouse.set(e.clientX, e.clientY);

      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(group.children, true);

      if (hits.length > 0) {
        let root = hits[0].object;

        while (root.parent !== group) root = root.parent;

        const force = new THREE.Vector3(movement.x, -movement.y, 0)
          .normalize()
          .multiplyScalar(0.12);

        forces.set(root.uuid, force);
      }
    };

    window.addEventListener("mousemove", onMouseMove);

    // ---------- COLLISIONS ----------
    function handleCollisions() {
      for (let i = 0; i < clones.length; i++) {
        for (let j = i + 1; j < clones.length; j++) {
          const A = clones[i];
          const B = clones[j];

          const dist = A.position.distanceTo(B.position);
          const minDist = A.userData.radius + B.userData.radius;

          if (dist < minDist) {
            temp.copy(B.position).sub(A.position).normalize();
            const push = (minDist - dist) * 0.09;

            A.position.addScaledVector(temp, -push);
            B.position.addScaledVector(temp, push);
          }
        }
      }
    }

    // ---------- ANIMATE ----------
    function animate() {
      requestAnimationFrame(animate);

      const t = Date.now() * 0.0012;

      clones.forEach((clone) => {
        const breathing = Math.sin(t + clone.userData.seed) * FLOAT_STRENGTH;

        const goal = clone.userData.original.clone();
        goal.y += breathing;

        clone.position.lerp(goal, LERP_FACTOR);

        const force = forces.get(clone.uuid);
        if (force) {
          clone.position.add(force);
          force.multiplyScalar(FORCE_DECAY);

          if (force.length() < MIN_FORCE) {
            forces.delete(clone.uuid);
          }
        }
      });

      handleCollisions();

      renderer.render(scene, camera);
    }

    animate();

    // ---------- RESIZE ----------
    const onResize = () => {
      const { clientWidth, clientHeight } = mount;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    window.addEventListener("resize", onResize);

    // CLEANUP
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="canvas-3d" />;
}
