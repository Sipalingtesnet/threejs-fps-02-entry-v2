import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { state } from './state.js';

export class BotManager {
  constructor(scene, map, audio) {
    this.scene = scene;
    this.map = map;
    this.audio = audio;
    this.bots = [];
    this.spawnBots();
  }

  spawnBots() {
    // Clear existing bots if any
    for (const b of this.bots) {
      this.scene.remove(b.mesh);
    }
    this.bots = [];

    // 4 Enemy Bots (T team)
    for (let i = 0; i < 4; i++) {
      const pos = new THREE.Vector3(15 + i * 3, 0, 30);
      const bot = new Bot(this.scene, pos, 'enemy', this.map, this.audio);
      this.bots.push(bot);
    }

    // 2 Friendly Bots (CT team)
    for (let i = 0; i < 2; i++) {
      const pos = new THREE.Vector3(-10 + i * 6, 0, -30);
      const bot = new Bot(this.scene, pos, 'friendly', this.map, this.audio);
      this.bots.push(bot);
    }
  }

  update(dt, playerPos) {
    if (state.phase !== 'live') return;
    for (const b of this.bots) {
      b.update(dt, playerPos, this.bots);
    }
  }
}

class Bot {
  constructor(scene, pos, team, map, audio) {
    this.scene = scene;
    this.team = team;
    this.map = map;
    this.audio = audio;
    this.position = pos.clone();
    this.alive = true;
    this.health = 100;
    this.state = 'patrol'; // 'patrol' | 'engage' | 'plant' | 'defuse'
    this.targetWaypoint = 0;
    this.fireCooldown = 0;

    // Build visual mesh (capsule/cylinder body + head)
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: team === 'enemy' ? PALETTE.redTeam : PALETTE.blueTeam,
      roughness: 0.5
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    body.userData = { bot: this, isBot: true };
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: PALETTE.snow, roughness: 0.4 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.5;
    head.castShadow = true;
    head.userData = { bot: this, isBot: true, isHead: true };
    group.add(head);

    group.position.copy(this.position);
    this.scene.add(group);
    this.mesh = group;
  }

  update(dt, playerPos, allBots) {
    if (!this.alive) return;

    // Simple AI movement & engagement
    const distToPlayer = this.position.distanceTo(playerPos);

    if (distToPlayer < 20) {
      this.state = 'engage';
    } else {
      this.state = 'patrol';
    }

    if (this.state === 'engage') {
      // Move towards player or shoot
      const dir = new THREE.Vector3().subVectors(playerPos, this.position).normalize();
      this.position.addScaledVector(dir, dt * 3.5);
      this.mesh.lookAt(playerPos.x, this.position.y, playerPos.z);

      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0 && distToPlayer < 18) {
        this.fireCooldown = 0.6 + Math.random() * 0.4;
        this.audio.playGunshot('rifle');
        // Chance to damage player
        if (this.team === 'enemy' && Math.random() < 0.4) {
          state.health = Math.max(0, state.health - 12);
        }
      }
    } else {
      // Patrol wander around waypoints
      const target = this.map.waypointGraph.nodes[this.targetWaypoint].pos;
      const dir = new THREE.Vector3().subVectors(target, this.position);
      if (dir.length() < 2) {
        this.targetWaypoint = Math.floor(Math.random() * this.map.waypointGraph.nodes.length);
      } else {
        dir.normalize();
        this.position.addScaledVector(dir, dt * 2.0);
        this.mesh.lookAt(target.x, this.position.y, target.z);
      }
    }

    this.mesh.position.copy(this.position);
  }

  takeDamage(amount, sourcePos) {
    if (!this.alive) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    this.scene.remove(this.mesh);
    if (this.team === 'enemy') {
      state.kills++;
      state.money += 300;
    }
  }
}
