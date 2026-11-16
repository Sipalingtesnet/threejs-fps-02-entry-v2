import { state, resetRoundState } from './state.js';

export class RoundManager {
  constructor(player, botManager) {
    this.player = player;
    this.botManager = botManager;
    state.phase = 'buy';
  }

  update(dt) {
    if (state.phase === 'buy') {
      state.buyTimer -= dt;
      if (state.buyTimer <= 0) {
        state.phase = 'live';
        document.exitPointerLock();
      }
    } else if (state.phase === 'live') {
      state.timer -= dt;

      // Check win conditions
      // 1. All enemy bots dead -> CT win
      const enemyAlive = this.botManager.bots.some(b => b.team === 'enemy' && b.alive);
      if (!enemyAlive) {
        this.endRound('ct');
        return;
      }

      // 2. Player dead -> T win
      if (state.health <= 0) {
        this.endRound('t');
        return;
      }

      // 3. Timer expires -> CT win (defenders win if bomb not planted)
      if (state.timer <= 0) {
        this.endRound('ct');
        return;
      }
    }
  }

  endRound(winner) {
    state.phase = 'roundEnd';
    if (winner === 'ct') {
      state.score.playerTeam++;
      state.money += 3250;
    } else {
      state.score.enemyTeam++;
      state.money += 1400;
    }

    // Check match end (First to 5)
    if (state.score.playerTeam >= 5 || state.score.enemyTeam >= 5) {
      state.phase = 'matchEnd';
      state.matchWinner = state.score.playerTeam >= 5 ? 'PLAYER TEAM' : 'ENEMY TEAM';
    } else {
      setTimeout(() => {
        this.nextRound();
      }, 3000);
    }
  }

  nextRound() {
    state.round++;
    resetRoundState();
    state.phase = 'buy';
    this.player.teleport(this.player.map.spawnPoints.ct[0]);
    this.botManager.spawnBots();
  }
}
