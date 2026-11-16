import { state } from './state.js';
import { WEAPON_DATA } from './weapons.js';

export class HUD {
  constructor(container = document.body) {
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;font-family:monospace;color:#e2f1ff;z-index:10;';
    container.appendChild(this.el);

    this.buildHTML();
  }

  buildHTML() {
    this.el.innerHTML = `
      <div id="crosshair" style="position:absolute;top:50%;left:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border:2px solid rgba(255,255,255,0.7);border-radius:50%;"></div>
      <div id="top-bar" style="position:absolute;top:16px;left:50%;transform:translateX(-50%);display:flex;gap:20px;font-size:20px;font-weight:bold;background:rgba(13,27,42,0.8);padding:8px 16px;border-radius:6px;border:1px solid #415a77;">
        <span id="score-ct" style="color:#3a86ff;">5</span>
        <span id="round-timer" style="color:#f0f4f8;">1:40</span>
        <span id="score-t" style="color:#d90429;">5</span>
      </div>
      <div id="bottom-left" style="position:absolute;bottom:20px;left:20px;background:rgba(13,27,42,0.85);padding:12px 20px;border-radius:6px;border:1px solid #415a77;font-size:16px;">
        <div>HP: <span id="hp-val" style="color:#00f5d4;font-weight:bold;">100</span></div>
        <div>ARMOR: <span id="armor-val" style="color:#00bbf9;">100</span></div>
        <div>MONEY: <span id="money-val" style="color:#ffb703;">$800</span></div>
      </div>
      <div id="bottom-right" style="position:absolute;bottom:20px;right:20px;background:rgba(13,27,42,0.85);padding:12px 20px;border-radius:6px;border:1px solid #415a77;font-size:20px;text-align:right;">
        <div><span id="weapon-name" style="color:#00f5d4;">NORD-7</span></div>
        <div style="font-size:28px;font-weight:bold;"><span id="ammo-val">30</span> / <span id="reserve-val" style="font-size:16px;color:#778da9;">90</span></div>
      </div>
      <div id="overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(10,17,26,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:auto;">
        <h1 style="font-size:48px;color:#00f5d4;margin:0 0 10px 0;letter-spacing:4px;">FROSTLINE</h1>
        <p style="color:#778da9;margin:0 0 30px 0;font-size:16px;">Tactical Arctic FPS</p>
        <div id="menu-btn" style="background:#00f5d4;color:#0a111a;padding:14px 28px;font-weight:bold;font-size:18px;border-radius:6px;cursor:pointer;">DEPLOY (CLICK TO START)</div>
      </div>
      <div id="buy-menu" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(13,27,42,0.95);padding:30px;border-radius:10px;border:2px solid #00f5d4;display:none;pointer-events:auto;width:400px;text-align:center;">
        <h2 style="color:#00f5d4;margin-top:0;">BUY PHASE (PRESS B)</h2>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
          <button id="buy-smg" style="padding:10px;background:#415a77;color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:monospace;font-size:16px;">BLIZZARD-9 (SMG) - $1500</button>
          <button id="buy-sniper" style="padding:10px;background:#415a77;color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:monospace;font-size:16px;">AURORA-50 (SNIPER) - $4750</button>
        </div>
      </div>
    `;

    document.getElementById('menu-btn').addEventListener('click', () => {
      state.phase = 'buy';
      document.getElementById('overlay').style.display = 'none';
    });

    document.getElementById('buy-smg').addEventListener('click', () => {
      if (state.money >= 1500) {
        state.money -= 1500;
        state.weapons.smg.owned = true;
        state.activeWeapon = 'smg';
      }
    });

    document.getElementById('buy-sniper').addEventListener('click', () => {
      if (state.money >= 4750) {
        state.money -= 4750;
        state.weapons.sniper.owned = true;
        state.activeWeapon = 'sniper';
      }
    });
  }

  update() {
    document.getElementById('hp-val').textContent = state.health;
    document.getElementById('armor-val').textContent = state.armor;
    document.getElementById('money-val').textContent = `$${state.money}`;
    document.getElementById('score-ct').textContent = state.score.playerTeam;
    document.getElementById('score-t').textContent = state.score.enemyTeam;

    const mins = Math.floor(state.timer / 60);
    const secs = Math.floor(state.timer % 60);
    document.getElementById('round-timer').textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const w = state.weapons[state.activeWeapon];
    document.getElementById('weapon-name').textContent = WEAPON_DATA[state.activeWeapon].name;
    document.getElementById('ammo-val').textContent = w.ammo;
    document.getElementById('reserve-val').textContent = w.reserve;

    const buyMenu = document.getElementById('buy-menu');
    if (state.phase === 'buy') {
      buyMenu.style.display = 'block';
    } else {
      buyMenu.style.display = 'none';
    }
  }
}
