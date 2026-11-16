export const state = {
  phase: 'menu', // 'menu' | 'buy' | 'live' | 'roundEnd' | 'matchEnd'
  round: 1,
  maxRounds: 9,
  score: { playerTeam: 0, enemyTeam: 0 },
  money: 800,
  health: 100,
  maxHealth: 100,
  armor: 100,
  activeWeapon: 'rifle', // 'rifle' | 'smg' | 'sniper' | 'pistol'
  weapons: {
    rifle: { owned: true, ammo: 30, reserve: 90, price: 2700 },
    smg: { owned: false, ammo: 32, reserve: 96, price: 1500 },
    sniper: { owned: false, ammo: 5, reserve: 15, price: 4750 },
    pistol: { owned: true, ammo: 12, reserve: 36, price: 0 }
  },
  grenades: { smoke: 1, he: 0 },
  timer: 100, // round timer
  buyTimer: 15,
  bombState: 'idle', // 'idle' | 'planted' | 'defused' | 'exploded'
  bombTimer: 45,
  bombPlantedSite: null, // 'A' | 'B'
  kills: 0,
  deaths: 0,
  matchWinner: null,
  hitMarkers: [],
  killFeed: []
};

export function resetRoundState() {
  state.health = 100;
  state.armor = 100;
  state.timer = 100;
  state.buyTimer = 15;
  state.bombState = 'idle';
  state.bombTimer = 45;
  state.bombPlantedSite = null;
  // Refill ammo
  for (const k in state.weapons) {
    const w = state.weapons[k];
    if (k === 'rifle') { w.ammo = 30; w.reserve = 90; }
    if (k === 'smg') { w.ammo = 32; w.reserve = 96; }
    if (k === 'sniper') { w.ammo = 5; w.reserve = 15; }
    if (k === 'pistol') { w.ammo = 12; w.reserve = 36; }
  }
}
