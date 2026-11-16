// Main entry point for Starfall Arena game loop & state machine
import { audio } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Player } from './player.js';
import { WeaponSystem } from './weapons.js';
import { EnemySystem } from './enemies.js';
import { UpgradeSystem } from './upgrades.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Arena dimensions
    this.arenaWidth = 3000;
    this.arenaHeight = 3000;

    // Viewport camera offset
    this.camera = { x: 0, y: 0 };

    this.state = 'START'; // START, PLAYING, PAUSED, UPGRADE, GAMEOVER

    this.score = 0;
    this.wave = 1;
    this.elapsedSeconds = 0;
    this.timeTimer = null;

    this.xp = 0;
    this.xpToNextLevel = 30;
    this.level = 1;

    // Systems
    this.particles = new ParticleSystem();
    this.player = new Player(this.arenaWidth, this.arenaHeight);
    this.weapons = new WeaponSystem();
    this.enemies = new EnemySystem();
    this.upgrades = new UpgradeSystem();

    this.input = {
      keys: {},
      mouseX: 0,
      mouseY: 0,
      mouseDown: false
    };

    this.initInput();
    this.initUI();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Start game loop
    requestAnimationFrame((ts) => this.loop(ts));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      audio.init();
      this.input.keys[e.code] = true;

      if (e.code === 'KeyM') {
        audio.toggleMute();
      }

      if ((e.code === 'KeyP' || e.code === 'Escape') && (this.state === 'PLAYING' || this.state === 'PAUSED')) {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      // Convert screen coords to world coords via camera
      this.input.mouseX = clientX + this.camera.x;
      this.input.mouseY = clientY + this.camera.y;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      audio.init();
      if (e.button === 0) this.input.mouseDown = true;
    });

    window.addEventListener('mouseup', () => {
      this.input.mouseDown = false;
    });
  }

  initUI() {
    document.getElementById('start-btn').addEventListener('click', () => {
      audio.init();
      this.startGame();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      audio.init();
      this.startGame();
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('quit-btn').addEventListener('click', () => {
      this.returnToTitle();
    });
  }

  startGame() {
    this.score = 0;
    this.wave = 1;
    this.elapsedSeconds = 0;
    this.xp = 0;
    this.level = 1;
    this.xpToNextLevel = 30;

    this.player.reset(this.arenaWidth, this.arenaHeight);
    this.weapons.reset();
    this.enemies.reset();
    this.particles.reset();

    this.enemies.spawnWave(this.wave, this.arenaWidth, this.arenaHeight);

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    this.state = 'PLAYING';

    if (this.timeTimer) clearInterval(this.timeTimer);
    this.timeTimer = setInterval(() => {
      if (this.state === 'PLAYING') {
        this.elapsedSeconds++;
        this.updateHudStats();
      }
    }, 1000);
  }

  returnToTitle() {
    if (this.timeTimer) clearInterval(this.timeTimer);
    this.state = 'START';
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pause-screen').classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pause-screen').classList.add('hidden');
    }
  }

  triggerGameOver() {
    if (this.timeTimer) clearInterval(this.timeTimer);
    this.state = 'GAMEOVER';

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('go-score').textContent = this.score;
    document.getElementById('go-wave').textContent = this.wave;
    const mins = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(this.elapsedSeconds % 60).padStart(2, '0');
    document.getElementById('go-time').textContent = `${mins}:${secs}`;
    document.getElementById('game-over-screen').classList.remove('hidden');
  }

  triggerLevelUp() {
    this.state = 'UPGRADE';
    audio.playLevelUp();
    const modal = document.getElementById('upgrades-modal');
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    const choices = this.upgrades.getRandomUpgrades(3);
    choices.forEach((cardData) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'upgrade-card';
      cardEl.innerHTML = `
        <div class="card-icon">${cardData.icon}</div>
        <div class="card-title">${cardData.title}</div>
        <div class="card-desc">${cardData.desc}</div>
      `;
      cardEl.addEventListener('click', () => {
        cardData.apply(this.player);
        modal.classList.add('hidden');
        this.state = 'PLAYING';
      });
      container.appendChild(cardEl);
    });

    modal.classList.remove('hidden');
  }

  updateHudStats() {
    if (this.state !== 'PLAYING') return;

    // HP & Shield bars
    const hpPct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    document.getElementById('hp-fill').style.width = `${hpPct}%`;
    document.getElementById('hp-label').textContent = `HP: ${Math.round(this.player.hp)}/${this.player.maxHp}`;

    const shieldPct = Math.max(0, (this.player.shield / this.player.maxShield) * 100);
    document.getElementById('shield-fill').style.width = `${shieldPct}%`;
    document.getElementById('shield-label').textContent = `SHIELD: ${Math.round(this.player.shield)}/${this.player.maxShield}`;

    const xpPct = Math.min(100, (this.xp / this.xpToNextLevel) * 100);
    document.getElementById('xp-fill').style.width = `${xpPct}%`;
    document.getElementById('xp-label').textContent = `LVL ${this.level} (${this.xp}/${this.xpToNextLevel})`;

    document.getElementById('hud-wave').textContent = this.wave;
    document.getElementById('hud-score').textContent = this.score;

    const mins = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(this.elapsedSeconds % 60).padStart(2, '0');
    document.getElementById('hud-time').textContent = `${mins}:${secs}`;
  }

  update() {
    if (this.state !== 'PLAYING') return;

    this.player.update(this.input, this.arenaWidth, this.arenaHeight, this.particles);
    this.weapons.update(this.player, this.input, this.particles);
    this.enemies.update(this.player, this.weapons, this.particles);

    const xpEarned = this.enemies.checkCollisions(this.player, this.weapons, this.particles, (pts) => {
      this.score += pts;
    });

    if (xpEarned > 0) {
      this.xp += xpEarned;
      if (this.xp >= this.xpToNextLevel) {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.3);
        this.triggerLevelUp();
      }
    }

    // Check wave clear
    if (this.enemies.enemies.length === 0) {
      this.wave++;
      this.enemies.spawnWave(this.wave, this.arenaWidth, this.arenaHeight);
    }

    // Check player death
    if (this.player.hp <= 0) {
      this.triggerGameOver();
    }

    // Camera follow player smoothly
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    // Clamp camera to arena
    this.camera.x = Math.max(0, Math.min(this.arenaWidth - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.arenaHeight - this.canvas.height, this.camera.y));

    this.particles.update();
    this.updateHudStats();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'START') return;

    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw Arena Grid
    this.drawGrid();

    // Draw entities
    this.enemies.draw(this.ctx);
    this.weapons.draw(this.ctx);
    this.player.draw(this.ctx);
    this.particles.draw(this.ctx);

    this.ctx.restore();
  }

  drawGrid() {
    const gridSize = 100;
    const startX = Math.floor(this.camera.x / gridSize) * gridSize;
    const startY = Math.floor(this.camera.y / gridSize) * gridSize;
    const endX = startX + this.canvas.width + gridSize;
    const endY = startY + this.canvas.height + gridSize;

    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;

    for (let x = startX; x < endX; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }

    // Arena border boundary
    this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 15;
    this.ctx.strokeRect(0, 0, this.arenaWidth, this.arenaHeight);
    this.ctx.shadowBlur = 0;
  }

  loop(timestamp) {
    this.update();
    this.draw();
    requestAnimationFrame((ts) => this.loop(ts));
  }
}

window.addEventListener('load', () => {
  new Game();
});
