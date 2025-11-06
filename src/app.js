import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.18/+esm';

const appContainer = document.getElementById('app');
const statusLabel = document.getElementById('status');
const fileInput = document.getElementById('file-input');
const audioElement = document.getElementById('audio');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
appContainer.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#021013', 0.04);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 16);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxDistance = 32;
controls.minDistance = 6;

const ambientLight = new THREE.AmbientLight('#73ffe0', 0.6);
scene.add(ambientLight);

const pointLight = new THREE.PointLight('#8ef7ff', 2.2, 60, 2);
pointLight.position.set(5, 8, 12);
scene.add(pointLight);

const sphereGeometry = new THREE.IcosahedronGeometry(5, 6);
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: '#7fffd4',
  wireframe: true,
  emissive: '#3ce0b8',
  emissiveIntensity: 0.2,
  transparent: true,
  opacity: 0.9,
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const basePositions = sphere.geometry.attributes.position.array.slice();
const normals = sphere.geometry.attributes.normal;

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2,
  0.8,
  0.1
);
composer.addPass(bloomPass);

const analyserOptions = {
  fftSize: 2048,
  smoothingTimeConstant: 0.82,
};

const params = {
  wireframe: true,
  color: '#7fffd4',
  emissive: '#3ce0b8',
  bloomStrength: 1.2,
  bloomRadius: 0.8,
  bloomThreshold: 0.12,
  distortion: 2.8,
  noiseFloor: 0.12,
  audioLevel: 0,
  rotationSpeed: 0.18,
};

const gui = new GUI({ title: 'Controles' });

const materialFolder = gui.addFolder('Cores');
materialFolder.addColor(params, 'color').name('Base').onChange((value) => {
  sphere.material.color.set(value);
});
materialFolder.addColor(params, 'emissive').name('Emissivo').onChange((value) => {
  sphere.material.emissive.set(value);
});
materialFolder.add(params, 'wireframe').name('Wireframe').onChange((value) => {
  sphere.material.wireframe = value;
});
materialFolder.open();

const bloomFolder = gui.addFolder('Glow');
bloomFolder.add(params, 'bloomStrength', 0, 4, 0.05).name('Intensidade');
bloomFolder.add(params, 'bloomRadius', 0, 2, 0.01).name('Raio');
bloomFolder.add(params, 'bloomThreshold', 0, 1, 0.01).name('Limite');

const motionFolder = gui.addFolder('Dinâmica');
motionFolder.add(params, 'distortion', 0, 6, 0.05).name('Amplitude');
motionFolder.add(params, 'noiseFloor', 0, 0.5, 0.01).name('Sensibilidade');
motionFolder.add(params, 'rotationSpeed', 0, 0.4, 0.01).name('Rotação');

let audioContext;
let analyser;
let dataArray;
let isPlaying = false;
let currentObjectUrl = null;
let currentFileName = '';

function setupAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = analyserOptions.fftSize;
    analyser.smoothingTimeConstant = analyserOptions.smoothingTimeConstant;
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }
}

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.includes('audio')) {
    statusLabel.textContent = 'Por favor, selecione um arquivo de áudio válido.';
    return;
  }

  setupAudio();

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  const objectUrl = URL.createObjectURL(file);
  currentObjectUrl = objectUrl;
  currentFileName = file.name;
  audioElement.src = objectUrl;
  audioElement.load();
  await audioElement.play();
  isPlaying = true;
  statusLabel.textContent = `Tocando: ${file.name}`;
});

audioElement.addEventListener('play', () => {
  setupAudio();
  isPlaying = true;
  if (currentFileName) {
    statusLabel.textContent = `Tocando: ${currentFileName}`;
  }
});

audioElement.addEventListener('pause', () => {
  isPlaying = false;
  statusLabel.textContent = 'Música pausada';
});

audioElement.addEventListener('ended', () => {
  isPlaying = false;
  statusLabel.textContent = 'Reprodução finalizada';
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  currentFileName = '';
});

window.addEventListener('click', () => {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
});

const clock = new THREE.Clock();
const tempVec3 = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;
  const positionAttribute = sphere.geometry.attributes.position;

  if (analyser && isPlaying) {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    params.audioLevel = avg / 255;
  } else {
    params.audioLevel *= 0.92;
  }

  const strength = params.noiseFloor + params.audioLevel * params.distortion;
  const vertexCount = positionAttribute.count;

  for (let i = 0; i < vertexCount; i++) {
    const ix = i * 3;
    const baseX = basePositions[ix];
    const baseY = basePositions[ix + 1];
    const baseZ = basePositions[ix + 2];

    const normalX = normals.getX(i);
    const normalY = normals.getY(i);
    const normalZ = normals.getZ(i);

    const noise = Math.sin(elapsed * 2 + baseX * 0.4 + baseY * 0.6 + baseZ * 0.8);
    const displacement = strength * noise;

    tempVec3.set(baseX, baseY, baseZ).normalize();

    positionAttribute.setXYZ(
      i,
      baseX + (normalX + tempVec3.x) * displacement,
      baseY + (normalY + tempVec3.y) * displacement,
      baseZ + (normalZ + tempVec3.z) * displacement
    );
  }

  positionAttribute.needsUpdate = true;
  sphere.geometry.computeVertexNormals();

  sphere.rotation.y += params.rotationSpeed * delta;
  sphere.rotation.x += (params.rotationSpeed * 0.5 + params.audioLevel * 0.1) * delta;

  controls.update();

  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;
  bloomPass.threshold = params.bloomThreshold;

  renderer.setClearColor('#010203', 0.12);
  composer.render(delta);
}

animate();

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);
});
