// Projectiles and weapon firing with speed spread penalty
import { audio } from './audio.js';

export class WeaponSystem {
  constructor() {
    this.bullets = [];
    this.enemyBullets = [];
  }

  reset() {
    this.bullets = [];
    this.enemyBullets = [];
  }

  update(player, input, particles) {
    // Shooting check
    const isFiring = input.mouseDown || input.keys['Space'];
    if (isFiring && player.fireCooldown <= 0) {
      this.firePlayerBullets(player, particles);
      player.fireCooldown = Math.max(6, Math.floor(18 / player.fireRateMult));
    }

    // Update player bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      if (b.life <= 0 || b.x < 0 || b.x > 3000 || b.y < 0 || b.y > 3000) {
        this.bullets.splice(i, 1);
      }
    }

    // Update enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.x += eb.vx;
      eb.y += eb.vy;
      eb.life--;

      if (eb.life <= 0 || eb.x < 0 || eb.x > 3000 || eb.y < 0 || eb.y > 3000) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  firePlayerBullets(player, particles) {
    audio.playLaser();
    const speed = 12;
    const count = player.projectilesCount;

    // Movement speed increases spread inaccuracy
    const speedMag = Math.hypot(player.vx, player.vy);
    const spreadFactor = speedMag * 0.08;

    for (let i = 0; i < count; i++) {
      let offsetAngle = 0;
      if (count > 1) {
        const span = 0.25;
        offsetAngle = -span / 2 + (span / (count - 1)) * i;
      }
      // Add random spread based on movement speed
      const randomSpread = (Math.random() - 0.5) * spreadFactor;
      const finalAngle = player.angle + offsetAngle + randomSpread;

      this.bullets.push({
        x: player.x + Math.cos(player.angle) * 16,
        y: player.y + Math.sin(player.angle) * 16,
        vx: Math.cos(finalAngle) * speed,
        vy: Math.sin(finalAngle) * speed,
        damage: 25 * player.damageMult,
        pierce: player.pierceCount,
        life: 60,
        radius: 4,
        color: '#00ffff'
      });
    }
  }

  fireEnemyBullet(x, y, targetX, targetY, speed = 5, color = '#ff3366') {
    const angle = Math.atan2(targetY - y, targetX - x);
    this.enemyBullets.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: 15,
      life: 120,
      radius: 5,
      color
    });
  }

  draw(ctx) {
    ctx.save();
    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    for (const eb of this.enemyBullets) {
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
      ctx.fillStyle = eb.color;
      ctx.shadowColor = eb.color;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.restore();
  }
}
