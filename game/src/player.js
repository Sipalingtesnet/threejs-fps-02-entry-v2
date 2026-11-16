import * as THREE from 'three';
import { state } from './state.js';

export class PlayerController {
  constructor(camera, domElement, map) {
    this.camera = camera;
    this.domElement = domElement;
    this.map = map;

    this.position = new THREE.Vector3(0, 1.6, -35);
    this.velocity = new THREE.Vector3();
    this.camera.position.copy(this.position);

    this.pitch = 0;
    this.yaw = 0;

    this.moveState = { forward: false, backward: false, left: false, right: false, sprint: false, crouch: false };
    this.isGrounded = true;
    this.canJump = true;

    this.speed = 6.0;
    this.crouchHeight = 1.0;
    this.standHeight = 1.6;
    this.currentHeight = this.standHeight;

    this.footstepTimer = 0;
    this.bobTimer = 0;

    this.initEvents();
  }

  initEvents() {
    document.addEventListener('keydown', (e) => this.onKey(e, true));
    document.addEventListener('keyup', (e) => this.onKey(e, false));
    this.domElement.addEventListener('click', () => {
      if (state.phase === 'live' || state.phase === 'buy') {
        this.domElement.requestPointerLock();
      }
    });
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  onKey(e, isDown) {
    if (state.phase !== 'live' && state.phase !== 'buy') return;
    switch (e.code) {
      case 'KeyW': this.moveState.forward = isDown; break;
      case 'KeyS': this.moveState.backward = isDown; break;
      case 'KeyA': this.moveState.left = isDown; break;
      case 'KeyD': this.moveState.right = isDown; break;
      case 'ShiftLeft': this.moveState.sprint = isDown; break;
      case 'ControlLeft':
      case 'KeyC': this.moveState.crouch = isDown; break;
      case 'Space':
        if (isDown && this.isGrounded && this.canJump) {
          this.velocity.y = 5.5;
          this.isGrounded = false;
          this.canJump = false;
        } else if (!isDown) {
          this.canJump = true;
        }
        break;
      case 'Digit1': if (isDown) state.activeWeapon = 'rifle'; break;
      case 'Digit2': if (isDown && state.weapons.smg.owned) state.activeWeapon = 'smg'; break;
      case 'Digit3': if (isDown && state.weapons.sniper.owned) state.activeWeapon = 'sniper'; break;
      case 'Digit4': if (isDown) state.activeWeapon = 'pistol'; break;
    }
  }

  onMouseMove(e) {
    if (document.pointerLockElement !== this.domElement) return;
    const sens = 0.002;
    this.yaw -= e.movementX * sens;
    this.pitch -= e.movementY * sens;
    this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
  }

  update(dt) {
    if (state.phase !== 'live' && state.phase !== 'buy') return;

    // Target height for crouch
    const targetHeight = this.moveState.crouch ? this.crouchHeight : this.standHeight;
    this.currentHeight += (targetHeight - this.currentHeight) * dt * 10;

    let currentSpeed = this.speed;
    if (this.moveState.crouch) currentSpeed *= 0.5;
    else if (this.moveState.sprint && this.moveState.forward) currentSpeed *= 1.4;

    // Movement direction vector
    const dir = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    if (this.moveState.forward) dir.add(forward);
    if (this.moveState.backward) dir.sub(forward);
    if (this.moveState.right) dir.add(right);
    if (this.moveState.left) dir.sub(right);
    dir.normalize();

    // Horizontal velocity acceleration/damping
    const targetVx = dir.x * currentSpeed;
    const targetVz = dir.z * currentSpeed;
    this.velocity.x += (targetVx - this.velocity.x) * dt * 12;
    this.velocity.z += (targetVz - this.velocity.z) * dt * 12;

    // Gravity
    this.velocity.y -= 18 * dt;

    // Step position with AABB collision separation
    const deltaPos = this.velocity.clone().multiplyScalar(dt);
    
    // Try X
    this.position.x += deltaPos.x;
    if (this.map.checkCollision(this.getPlayerBox())) {
      this.position.x -= deltaPos.x;
      this.velocity.x = 0;
    }

    // Try Z
    this.position.z += deltaPos.z;
    if (this.map.checkCollision(this.getPlayerBox())) {
      this.position.z -= deltaPos.z;
      this.velocity.z = 0;
    }

    // Try Y
    this.position.y += deltaPos.y;
    if (this.map.checkCollision(this.getPlayerBox())) {
      if (this.velocity.y < 0) {
        this.isGrounded = true;
      }
      this.position.y -= deltaPos.y;
      this.velocity.y = 0;
    } else {
      if (this.position.y <= 1.6 && !this.moveState.crouch) {
        this.position.y = 1.6;
        this.isGrounded = true;
        this.velocity.y = 0;
      }
    }

    // Footsteps / Bobbing
    if (this.isGrounded && (Math.abs(this.velocity.x) > 0.5 || Math.abs(this.velocity.z) > 0.5)) {
      this.bobTimer += dt * currentSpeed * 2;
      this.footstepTimer += dt * currentSpeed;
      if (this.footstepTimer > 0.5) {
        this.footstepTimer = 0;
        // play footstep sound via audio module if available
      }
    } else {
      this.bobTimer = 0;
    }

    // Update camera transform
    this.camera.position.copy(this.position);
    this.camera.position.y += this.currentHeight + Math.sin(this.bobTimer) * 0.05;

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  getPlayerBox() {
    const hw = 0.4;
    const hh = this.currentHeight / 2;
    return new THREE.Box3(
      new THREE.Vector3(this.position.x - hw, this.position.y - hh, this.position.z - hw),
      new THREE.Vector3(this.position.x + hw, this.position.y + hh, this.position.z + hw)
    );
  }

  teleport(pos) {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
  }
}
