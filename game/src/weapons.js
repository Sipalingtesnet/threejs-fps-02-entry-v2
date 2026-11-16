import * as THREE from 'three';
import { state } from './state.js';

export const WEAPON_DATA = {
  rifle: { name: 'NORD-7', damage: 32, fireRate: 0.12, recoil: 0.03, spread: 0.015, reloadTime: 2.2, auto: true },
  smg: { name: 'BLIZZARD-9', damage: 22, fireRate: 0.08, recoil: 0.02, spread: 0.025, reloadTime: 1.8, auto: true },
  sniper: { name: 'AURORA-50', damage: 95, fireRate: 1.1, recoil: 0.15, spread: 0.001, reloadTime: 3.0, auto: false, scopedZoom: 3.5 },
  pistol: { name: 'FROST-9', damage: 26, fireRate: 0.2, recoil: 0.04, spread: 0.02, reloadTime: 1.5, auto: false }
};

export class WeaponSystem {
  constructor(camera, audio) {
    this.camera = camera;
    this.audio = audio;
    this.fireCooldown = 0;
    this.reloading = false;
    this.reloadTimer = 0;
    this.isAds = false;
    this.recoilPitch = 0;
    this.recoilYaw = 0;
  }

  update(dt, playerController) {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.finishReload();
      }
    }

    // Recoil recovery
    if (this.recoilPitch > 0) {
      const rec = this.recoilPitch * dt * 10;
      playerController.pitch += rec;
      this.recoilPitch -= rec;
    }

    // ADS right click toggle / hold
    // We can handle mouse down in main / listeners
  }

  tryFire(playerController, enemies, scene) {
    if (state.phase !== 'live') return;
    if (this.reloading || this.fireCooldown > 0) return;

    const wData = WEAPON_DATA[state.activeWeapon];
    const wState = state.weapons[state.activeWeapon];

    if (wState.ammo <= 0) {
      this.startReload();
      return;
    }

    wState.ammo--;
    this.fireCooldown = wData.fireRate;
    this.audio.playGunshot(state.activeWeapon);

    // Apply recoil
    this.recoilPitch += wData.recoil;
    playerController.pitch -= wData.recoil;

    // Raycast hit detection
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0); // screen center
    raycaster.setFromCamera(center, this.camera);

    const hits = raycaster.intersectObjects(scene.children, true);
    for (const hit of hits) {
      // Check if hit enemy bot
      const bot = hit.object.userData?.bot;
      if (bot && bot.team === 'enemy' && bot.alive) {
        const isHeadshot = hit.object.userData?.isHead === true;
        const dmg = isHeadshot ? wData.damage * 2.5 : wData.damage;
        bot.takeDamage(dmg, this.camera.position);
        state.hitMarkers.push({ time: 0.2, headshot: isHeadshot });
        break;
      }
      // Stop at first non-transparent solid
      if (!hit.object.userData?.isBot && hit.distance > 0.5) {
        break;
      }
    }
  }

  startReload() {
    const wState = state.weapons[state.activeWeapon];
    const wData = WEAPON_DATA[state.activeWeapon];
    if (wState.reserve <= 0 || wState.ammo === (state.activeWeapon === 'sniper' ? 5 : (state.activeWeapon === 'rifle' ? 30 : 32))) return;
    this.reloading = true;
    this.reloadTimer = wData.reloadTime;
    this.audio.playReload();
  }

  finishReload() {
    this.reloading = false;
    const wState = state.weapons[state.activeWeapon];
    const maxAmmo = state.activeWeapon === 'sniper' ? 5 : (state.activeWeapon === 'rifle' ? 30 : 32);
    const needed = maxAmmo - wState.ammo;
    const take = Math.min(needed, wState.reserve);
    wState.ammo += take;
    wState.reserve -= take;
  }
}
