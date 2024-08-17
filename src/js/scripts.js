import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass';

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    820,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const params = {
    red: 1.0,
    green: 1.0,
    blue: 1.0,
    threshold: 0.5,
    strength: 0.5,
    radius: 0.8
}

renderer.outputColorSpace = THREE.SRGBColorSpace;

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight));
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const bloomComposer = new EffectComposer(renderer);
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

const outputPass = new OutputPass();
bloomComposer.addPass(outputPass);

camera.position.set(0, -20, 14);
camera.lookAt(0, 0, 0);

const uniforms = {
    u_time: {type: 'f', value: 0.0},
    u_frequency: {type: 'f', value: 0.0},
    u_red: {type: 'f', value: 1.0},
    u_green: {type: 'f', value: 0.1},
    u_blue: {type: 'f', value: 0.1}
}

const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: document.getElementById('vertexshader').textContent,
    fragmentShader: document.getElementById('fragmentshader').textContent
});

const geo = new THREE.IcosahedronGeometry(4, 100);
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);
mesh.material.wireframe = true;

const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('./assets/Beats.mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.play();
});

const analyser = new THREE.AudioAnalyser(sound, 32);

let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', function(e) {
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    mouseX = (e.clientX - windowHalfX) / 100;
    mouseY = (e.clientY - windowHalfY) / 100;
});

// Create Play Button (Triangle with Rounded Corners)
const playButton = document.createElement('button');
playButton.innerHTML = `
    <svg width="100" height="100" viewBox="0 0 100 100">
        <polygon points="30,20 80,50 30,80" fill="black" stroke="black" stroke-width="5" stroke-linejoin="round"/>
    </svg>`;
playButton.style.position = 'absolute';
playButton.style.top = '50%';
playButton.style.left = '50%';
playButton.style.transform = 'translate(-50%, -50%)';
playButton.style.padding = '0';
playButton.style.backgroundColor = 'transparent';
playButton.style.border = 'none';
playButton.style.cursor = 'pointer';
playButton.style.zIndex = '1000'; // Ensure it's in front of everything else
document.body.appendChild(playButton);

// Create Pause Button (Rounded Sticks)
const pauseButton = document.createElement('button');
pauseButton.innerHTML = `
    <svg width="100" height="100" viewBox="0 0 100 100">
        <rect x="30" y="20" width="15" height="60" fill="black" rx="8" ry="8"/>
        <rect x="55" y="20" width="15" height="60" fill="black" rx="8" ry="8"/>
    </svg>`;
pauseButton.style.position = 'absolute';
pauseButton.style.top = '50%';
pauseButton.style.left = '50%';
pauseButton.style.transform = 'translate(-50%, -50%)';
pauseButton.style.padding = '0';
pauseButton.style.backgroundColor = 'transparent';
pauseButton.style.border = 'none';
pauseButton.style.cursor = 'pointer';
pauseButton.style.zIndex = '1000'; // Ensure it's in front of everything else
pauseButton.style.display = 'none'; // Initially hidden
document.body.appendChild(pauseButton);

let isPlaying = true;

playButton.addEventListener('click', () => {
    sound.play();
    isPlaying = true;
    playButton.style.display = 'none';
    pauseButton.style.display = 'inline';
    requestAnimationFrame(animate); // Resume animation
});

pauseButton.addEventListener('click', () => {
    sound.pause();
    isPlaying = false;
    playButton.style.display = 'inline';
    pauseButton.style.display = 'none';
    cancelAnimationFrame(animate); // Stop animation
});

const clock = new THREE.Clock();
function animate() {
    if (isPlaying) {
        camera.position.x += (mouseX - camera.position.x) * .05;
        camera.position.y += (-mouseY - camera.position.y) * 0.5;
        camera.lookAt(scene.position);
        uniforms.u_time.value = clock.getElapsedTime();
        uniforms.u_frequency.value = analyser.getAverageFrequency();
        bloomComposer.render();
        requestAnimationFrame(animate);
    }
}
animate();

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
});