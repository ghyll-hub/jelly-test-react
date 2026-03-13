import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Setup basic scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// Load Video for Background
const video = document.getElementById('bgVideo');
// Ensure it plays even with restrictions
video.play().catch(console.error);
const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = videoTexture; 

// Load HDRI for environment reflections
new RGBELoader().load('assets/abandoned_hopper_terminal_04_1k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    // We intentionally don't set scene.background to HDR because we want the video background.
});

// Load Normal Map for Jelly Effect
const textureLoader = new THREE.TextureLoader();
const normalMap = textureLoader.load('assets/jellytext_worldnormal.png');
normalMap.wrapS = THREE.RepeatWrapping;
normalMap.wrapT = THREE.RepeatWrapping;

// Setup Jelly Material parameters
const params = {
    color: '#ff0000',
    transmission: 1.0,
    opacity: 1.0,
    metalness: 0.238,
    roughness: 0.0,
    ior: 1.693,
    thickness: 2.0,
    specularIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.263,
    normalScale: 0.0,
    envMapIntensity: 1.99
};

const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(params.color),
    transmission: params.transmission,
    opacity: params.opacity,
    metalness: params.metalness,
    roughness: params.roughness,
    ior: params.ior,
    thickness: params.thickness,
    specularIntensity: params.specularIntensity,
    clearcoat: params.clearcoat,
    clearcoatRoughness: params.clearcoatRoughness,
    // normalMap: normalMap, // Completely removed to test UV artifacting
    // normalScale: new THREE.Vector2(params.normalScale, params.normalScale),
    envMapIntensity: params.envMapIntensity,
    transparent: true,
    side: THREE.DoubleSide
});

// Load the 3D Text Model
let textMesh = null;
const gltfLoader = new GLTFLoader();
gltfLoader.load('assets/ghyll-3d-model-web.glb', (gltf) => {
    // Center the model
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    gltf.scene.position.x += (gltf.scene.position.x - center.x);
    gltf.scene.position.y += (gltf.scene.position.y - center.y);
    gltf.scene.position.z += (gltf.scene.position.z - center.z);
    
    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.material = material;
            textMesh = child;
        }
    });
    scene.add(gltf.scene);
});

// Setup GUI
const gui = new GUI();
gui.addColor(params, 'color').onChange(v => material.color.set(v));
gui.add(params, 'transmission', 0, 1).onChange(v => material.transmission = v);
gui.add(params, 'opacity', 0, 1).onChange(v => material.opacity = v);
gui.add(params, 'metalness', 0, 1).onChange(v => material.metalness = v);
gui.add(params, 'roughness', 0, 1).onChange(v => material.roughness = v);
gui.add(params, 'ior', 1, 2.33).onChange(v => material.ior = v);
gui.add(params, 'thickness', 0, 10).onChange(v => material.thickness = v);
gui.add(params, 'specularIntensity', 0, 2).onChange(v => material.specularIntensity = v);
gui.add(params, 'clearcoat', 0, 1).onChange(v => material.clearcoat = v);
gui.add(params, 'clearcoatRoughness', 0, 1).onChange(v => material.clearcoatRoughness = v);
gui.add(params, 'normalScale', 0, 5).onChange(v => material.normalScale.set(v, v));
gui.add(params, 'envMapIntensity', 0, 5).onChange(v => material.envMapIntensity = v);

// Video play requires user interaction in some browsers unless volume is 0 or muted
// Wait for click anywhere to play if paused
document.addEventListener('click', () => {
    if (video.paused) {
        video.play();
    }
});

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
