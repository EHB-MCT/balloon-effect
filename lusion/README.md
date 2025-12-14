# Lusion-style 3D Shapes (Three.js + GLTF)

Dit project toont een groep **3D-vormen** die zweven, botsen en reageren op muisbeweging.  
Geïnspireerd op de esthetiek van **Lusion**: artistiek, donker, zacht reflecterend.

## Functionaliteiten
- Shapes geladen met **GLTFLoader**
- Unieke **kleur + materiaal** per clone (mat of glossy)
- Realistische belichting met 5 lichtbronnen
- **Zweefeffect** via `Math.sin` + `lerp`
- **Botsingdetectie** tussen vormen
- Interactie via **muiskracht** en **raycaster**
- Volledig **responsief**

## Gebruikte code en bronnen

1. `import * as THREE from "three";`  
   → Core Three.js functionaliteit (scene, camera, mesh, vector, etc.)  
   🔗 https://threejs.org/docs/

2. `import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";`  
   → Voor het laden van `.glb` modellen  
   🔗 https://threejs.org/docs/#examples/en/loaders/GLTFLoader

3. `new THREE.Group()`  
   → Om meerdere clones te groeperen in de scene  
   🔗 https://threejs.org/docs/#api/en/objects/Group

4. `scene.background = new THREE.Color("#251018");`  
   → Achtergrondkleur instellen op de 3D canvas  
   🔗 https://threejs.org/docs/#api/en/scenes/Scene.background

5. `new THREE.DirectionalLight(), HemisphereLight(), AmbientLight()`  
   → Voor belichting vanuit verschillende richtingen  
   🔗 https://threejs.org/docs/#api/en/lights/DirectionalLight  
   🔗 https://threejs.org/docs/#api/en/lights/AmbientLight  
   🔗 https://threejs.org/docs/#api/en/lights/HemisphereLight

6. `child.material.clone()` + `mat.metalness`, `roughness`  
   → Glossy/matte materialen toepassen  
   🔗 https://threejs.org/docs/#api/en/materials/MeshStandardMaterial

7. `raycaster.setFromCamera(mouse, camera)`  
   → Detectie van welke shape onder de muis zit  
   🔗 https://threejs.org/docs/#api/en/core/Raycaster

8. `Vector3.lerp()`  
   → Soepele overgang naar ademende posities  
   🔗 https://threejs.org/docs/#api/en/math/Vector3.lerp

9. `Box3().setFromObject(...)`  
   → Om de grootte en center van het model te bepalen  
   🔗 https://threejs.org/docs/#api/en/math/Box3


10. `window.addEventListener("resize", ...)`  
    → Zorgt dat canvas correct schaalt bij schermgrootte  
    🔗 https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.aspect
