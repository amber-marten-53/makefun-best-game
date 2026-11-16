// Player starfighter model, controls, movement, shooting, collision
import { audio } from './audio.js';

export class Player {
  constructor(arenaWidth, arenaHeight) {
    this.x = arenaWidth / 2;
    this.y = arenaHeight / 2;
    this.radius = 14;
    this.angle = 0;

    // Base stats & combat attributes
    this.maxHp = 100;
    this.hp = 100;
    this.maxShield = 50;
    this.shield = 50;
    this.shieldRechargeDelay = 0;

    this.baseSpeed = 4.5;
    this.speedMult = 1.0;

    this.damageMult = 1.0;
    this.fireRateMult = 1.0; // Cooldown multiplier
    this.projectilesCount = 1;
    this.pierceCount = 0;
    this.magnetRadius = 100;

    this.fireCooldown = 0;
    this.invulnerableTimer = 0;

    // Movement state
    this.vx = 0;
    this.vy = 0;
  }

  reset(arenaWidth, arenaHeight) {
    this.x = arenaWidth / 2;
    this.y = arenaHeight / 2;
    this.maxHp = 100;
    this.hp = 100;
    this.maxShield = 50;
    this.shield = 50;
    this.speedMult = 1.0;
    this.damageMult = 1.0;
    this.fireRateMult = 1.0;
    this.projectilesCount = 1;
    this.pierceCount = 0;
    this.magnetRadius = 100;
    this.fireCooldown = 0;
    this.invulnerableTimer = 0;
    this.overdriveTimer = 0;
    this.vx = 0;
    this.vy = 0;
  }

  update(input, arenaWidth, arenaHeight, particles) {
    // Movement input
    let dx = 0;
    let dy = 0;
    if (input.keys['KeyW'] || input.keys['ArrowUp']) dy -= 1;
    if (input.keys['KeyS'] || input.keys['ArrowDown']) dy += 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) dx -= 1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) dx += 1;

    const currentSpeed = this.baseSpeed * this.speedMult;
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.vx = dx * currentSpeed;
    this.vy = dy * currentSpeed;

    this.x += this.vx;
    this.y += this.vy;

    // Arena bounds
    const margin = this.radius + 10;
    this.x = Math.max(margin, Math.min(arenaWidth - margin, this.x));
    this.y = Math.max(margin, Math.min(arenaHeight - margin, this.y));

    // Aim angle toward mouse
    const aimDx = input.mouseX - this.x;
    const aimDy = input.mouseY - this.y;
    this.angle = Math.atan2(aimDy, aimDx);

    // Engine trail particles when moving
    if ((dx !== 0 || dy !== 0) && Math.random() < 0.6) {
      particles.spawnEngineTrail(this.x - Math.cos(this.angle) * 12, this.y - Math.sin(this.angle) * 12, this.angle, '#00ffff');
    }

    // Cooldowns
    if (this.fireCooldown > 0) this.fireCooldown--;
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;

    // Shield recharge
    if (this.shieldRechargeDelay > 0) {
      this.shieldRechargeDelay--;
    } else if (this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + 0.1);
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return;
    this.shieldRechargeDelay = 180; // 3 seconds before recharge

    if (this.shield > 0) {
      this.shield -= amount;
      if (this.shield < 0) {
        this.hp += this.shield; // Overflow to HP
        this.shield = 0;
      }
    } else {
      this.hp -= amount;
    }

    this.invulnerableTimer = 20; // brief i-frames
    audio.playHit();
    if (this.hp <= 0) {
      this.hp = 0;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Invulnerability flash
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 3) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Shield aura if active
    if (this.shield > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    // Starfighter hull (neon triangle design)
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 12);
    ctx.closePath();

    ctx.fillStyle = '#0b0b1a';
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Cockpit glow
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.restore();
  }
}
