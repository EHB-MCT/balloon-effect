import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function Canvas3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    console.log("🚀 Canvas mounted");

    // -------------------
    // BASIC THREE SETUP
    // -------------------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      25,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(4, 4, 6);
    scene.add(dir);

    const group = new THREE.Group();
    scene.add(group);

    const loader = new GLTFLoader();
    const clones = [];

    // -------------------
    // LOAD YOUR GLB
    // -------------------
    loader.load("/models/forms.glb", (gltf) => {
      console.log("✔ GLB loaded");

      const base = gltf.scene;

      // Crée 10 modèles max
      for (let i = 0; i < 10; i++) {
        const c = base.clone(true);
        c.scale.set(0.5, 0.5, 0.5);

        // Position initiale (mélange aléatoire comme CodePen)
        c.position.set(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        );

        c.userData.original = c.position.clone();
        c.userData.radius = 0.6;
        c.userData.seed = Math.random() * 10;

        group.add(c);
        clones.push(c);
      }

      console.log("✨ Models created:", clones.length);
    });

    // -------------------
    // FORCE SYSTEM
    // -------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const forces = new Map();
    const temp = new THREE.Vector3();

    let lastMouse = new THREE.Vector2();

    window.addEventListener("mousemove", (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      // direction mouvement souris
      const movement = new THREE.Vector2(
        e.clientX - lastMouse.x,
        e.clientY - lastMouse.y
      );
      lastMouse.set(e.clientX, e.clientY);

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(group.children, true);

      if (hits.length > 0) {
        let root = hits[0].object;
        while (root.parent && root.parent !== group) root = root.parent;

        // Force basée sur direction souris (COMME CODEPEN)
        const f = new THREE.Vector3(movement.x, -movement.y, 0)
          .normalize()
          .multiplyScalar(0.12);

        forces.set(root.uuid, f);
      }
    });

    // -------------------
    // COLLISIONS (comme CodePen)
    // -------------------
    function handleCollisions() {
      for (let i = 0; i < clones.length; i++) {
        for (let j = i + 1; j < clones.length; j++) {
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
    }

    // -------------------
    // ANIMATION LOOP
    // -------------------
    function animate() {
      requestAnimationFrame(animate);

      const t = Date.now() * 0.0015;

      clones.forEach((c, idx) => {
        if (!c.userData.original) return;

        // Breathing
        const breathing = Math.sin(t + c.userData.seed) * 0.1;

        const goal = c.userData.original.clone();
        goal.y += breathing;

        // Retour smooth
        c.position.lerp(goal, 0.04);

        // Hover forces
        const f = forces.get(c.uuid);
        if (f) {
          c.position.add(f);
          f.multiplyScalar(0.88);

          if (f.length() < 0.005) forces.delete(c.uuid);
        }
      });

      handleCollisions();
      renderer.render(scene, camera);
    }

    animate();

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="canvas-3d"></div>;
}
