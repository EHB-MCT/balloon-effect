import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// ---------- CONSTANTS ----------

const POSITIONS = [
  // --- RANGÉE DU HAUT ---
  new THREE.Vector3(-2.2, 1.6, 0.5), // blanc
  new THREE.Vector3(0.0, 1.4, -0.8), // bleu
  new THREE.Vector3(2.4, 1.5, 0.4), // gris

  // --- RANGÉE DU MILIEU (profondeur max) ---
  new THREE.Vector3(-2.0, 0.3, -1.2), // noir mat
  new THREE.Vector3(0.0, 0.2, 0.0), // blanc brillant central
  new THREE.Vector3(2.0, 0.3, -1.0), // bleu électrique
  new THREE.Vector3(-1.2, 0.1, 1.1), // bleu profond
  new THREE.Vector3(1.4, 0.2, 1.0), // noir brillant

  // --- RANGÉE DU BAS ---
  new THREE.Vector3(-1.0, -1.3, -0.6), // gris clair
  new THREE.Vector3(0.0, -1.4, 0.4), // bleu néon
  new THREE.Vector3(2.0, -1.2, -0.5), // noir mat

  // --- PROFONDEUR ADDITIONNELLE (comme Lusion) ---
  new THREE.Vector3(-1.0, -0.2, -2.4), // forme qui “sort” en arrière
  new THREE.Vector3(1.2, 0.4, -2.2), // profondeur 2
];

// Kleuren (mauve / gris / noir)
const COLOR_PALETTE = [
  new THREE.Color("#1a3aff"), // bleu électrique pur
  new THREE.Color("#0d1dfc"), // bleu profond glossy
  new THREE.Color("#f3f3f3"), // gris clair
  new THREE.Color("#ffffff"), // blanc propre
  new THREE.Color("#1d1d1f"), // noir mat
  new THREE.Color("#0a0a0f"), // noir brillant
  new THREE.Color("#5865F2"), // bleu néon
];

// Settings voor beweging / physics
// Settings voor beweging / physics
const CLONE_SCALE = 0.9;
const BASE_RADIUS = 1.2;
const FLOAT_STRENGTH = 0.25; // amplitude "zweef"
const LERP_FACTOR = 0.04; // terug naar positie
const FORCE_DECAY = 0.88; // traag uitdempen
const MIN_FORCE = 0.005; // threshold om force te verwijderen

// ---------- HELPERS ----------

function setupLights(scene) {
  // Lumière ambiante forte → éclaire tout de manière égale
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  // Key light (douce, pas trop directionnelle)
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(3, 4, 8);
  scene.add(key);

  // Fill light (éclaircit les ombres)
  const fill = new THREE.DirectionalLight(0xffffff, 0.2);
  fill.position.set(-5, 3, 5);
  scene.add(fill);

  // Rim backlight très léger
  const rim = new THREE.DirectionalLight(0xffffff, 0.7);
  rim.position.set(0, -3, -8);
  scene.add(rim);
}

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

function applyMaterial(child, color, isMatte) {
  const mat = child.material.clone();
  mat.color.copy(color);

  if (isMatte) {
    // ULTRA MATTE
    mat.metalness = 0.0;
    mat.roughness = 2.97;
    mat.envMapIntensity = 0.08;
  } else {
    // GLOSSY
    mat.metalness = 0.5;
    mat.roughness = 0.38;
    mat.envMapIntensity = 1.0;
  }

  child.material = mat;
}

export default function Canvas3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ---------- SCENE / CAMERA / RENDERER ----------
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      25,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 0.5, 5);
    camera.lookAt(0, 0, 0);

    const renderer = createRenderer(mount);
    setupLights(scene);

    // ---------- GROUP + GLB ----------
    const group = new THREE.Group();
    scene.add(group);

    const loader = new GLTFLoader();
    const clones = [];

    loader.load("/models/shape.glb", (gltf) => {
      const base = gltf.scene;

      POSITIONS.forEach((position, i) => {
        const clone = base.clone(true);

        // schaal
        clone.scale.set(CLONE_SCALE, CLONE_SCALE, CLONE_SCALE);

        // positie
        clone.position.copy(position);

        // rotatie
        clone.rotation.set(0.4 + i * 0.35, 0.8 + i * 0.22, 0.3 + i * 0.18);

        // userData voor movement
        clone.userData.original = clone.position.clone();
        clone.userData.radius = BASE_RADIUS;
        clone.userData.seed = 2.5 + i * 0.7;

        const color = COLOR_PALETTE[i % COLOR_PALETTE.length];
        const isMatte = i % 3 === 0;

        clone.traverse((child) => {
          if (!child.isMesh) return;
          applyMaterial(child, color, isMatte);
        });

        group.add(clone);
        clones.push(clone);
      });

      console.log("[Canvas3D] clones:", clones.length);
    });

    // ---------- MOUSE / FORCES ----------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const forces = new Map();
    const temp = new THREE.Vector3();
    const lastMouse = new THREE.Vector2();

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // alleen reageren als de muis boven de canvas is
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

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
        while (root.parent && root.parent !== group) {
          root = root.parent;
        }

        const force = new THREE.Vector3(movement.x, -movement.y, 0)
          .normalize()
          .multiplyScalar(0.12);

        forces.set(root.uuid, force);
      }
    };

    window.addEventListener("mousemove", onMouseMove);

    // ---------- COLLISIONS ----------
    const handleCollisions = () => {
      const len = clones.length;

      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const A = clones[i];
          const B = clones[j];

          const dist = A.position.distanceTo(B.position);
          const minDist = A.userData.radius + B.userData.radius;

          if (dist < minDist) {
            temp.copy(B.position).sub(A.position).normalize();
            const push = (minDist - dist) * 0.1;
            A.position.addScaledVector(temp, -push);
            B.position.addScaledVector(temp, push);
          }
        }
      }
    };

    // ---------- ANIMATE ----------
    const animate = () => {
      requestAnimationFrame(animate);

      const t = Date.now() * 0.0015;

      clones.forEach((clone) => {
        if (!clone.userData.original) return;

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
    };

    animate();

    // ---------- RESIZE ----------
    const onResize = () => {
      const { clientWidth, clientHeight } = mount;
      if (!clientWidth || !clientHeight) return;

      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    window.addEventListener("resize", onResize);

    // ---------- CLEANUP ----------
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);

      mount.removeChild(renderer.domElement);
      renderer.dispose();

      scene.clear();
    };
  }, []);

  return <div ref={mountRef} className="canvas-3d" />;
}
