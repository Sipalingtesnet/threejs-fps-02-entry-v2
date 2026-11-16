import * as THREE from 'three';
import { state } from './state.js';
import { AuroraMap } from './map.js';
import { PlayerController } from './player.js';
import { WeaponSystem } from './weapons.js';
import { BotManager } from './bots.js';
import { RoundManager } from './rounds.js';
import { AudioSystem } from './audio.js';
import { HUD } from './hud.js';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const audio = new AudioSystem();
const map = new AuroraMap(scene);
const player = new PlayerController(camera, canvas, map);
const botManager = new BotManager(scene, map, audio);
const weaponSystem = new WeaponSystem(camera, audio);
const roundManager = new RoundManager(player, botManager);
const hud = new HUD();

// Listen for firing
window.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    weaponSystem.tryFire(player, botManager.bots, scene);
  }
});

// Handle URL ?shot= capture modes
const urlParams = new URLSearchParams(window.location.search);
const shotMode = urlParams.get('shot');
if (shotMode) {
  document.getElementById('overlay').style.display = 'none';
  if (shotMode === 'start') {
    state.phase = 'menu';
    document.getElementById('overlay').style.display = 'flex';
  } else if (shotMode === 'play') {
    state.phase = 'live';
  } else if (shotMode === 'buy') {
    state.phase = 'buy';
  } else if (shotMode === 'end') {
    state.phase = 'roundEnd';
    state.score.playerTeam = 5;
  }
}

let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  player.update(dt);
  weaponSystem.update(dt, player);
  botManager.update(dt, player.position);
  roundManager.update(dt);
  hud.update();

  renderer.render(scene, camera);

  if (shotMode) {
    // Render twice then set __shotReady
    renderer.render(scene, camera);
    window.__shotReady = true;
  }
}

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
