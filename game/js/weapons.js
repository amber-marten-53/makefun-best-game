// Projectiles and weapon firing with speed spread penalty system
import { audio } from './audio.js';

export class WeaponSystem {
  constructor() {
    this.bullets = [];
    this.enemyBullets = [];
    this.missiles = [];
    this.beams = [];
    this.currentWeapon = 'blaster'; // blaster, railgun, missiles, nova
    this.unlockedWeapons = { blaster: true, railgun: false, missiles: false, nova: false };
    this.railgunCooldown = 0;
    this.missileCooldown = 0;
    this.novaCooldown = 0;
  }

  reset() {
    this.bullets = [];
    this.enemyBullets = [];
    this.missiles = [];
    this.beams = [];
    this.currentWeapon = 'blaster';
    this.unlockedWeapons = { blaster: true, railgun: false, missiles: false, nova: false };
    this.railgunCooldown = 0;
    this.missileCooldown = 0;
    this.novaCooldown = 0;
  }

  update(player, input, particles, enemies) {
    // Weapon switching via number keys 1, 2, 3, 4
    if (input.keys['Digit1'] && this.unlockedWeapons.blaster) this.currentWeapon = 'blaster';
    if (input.keys['Digit2'] && this.unlockedWeapons.railgun) this.currentWeapon = 'railgun';
    if (input.keys['Digit3'] && this.unlockedWeapons.missiles) this.currentWeapon = 'missiles';
    if (input.keys['Digit4'] && this.unlockedWeapons.nova) this.currentWeapon = 'nova';

    // Decrement weapon cooldowns
    if (this.railgunCooldown > 0) this.railgunCooldown--;
    if (this.missileCooldown > 0) this.missileCooldown--;
    if (this.novaCooldown > 0) this.novaCooldown--;

    // Shooting check
    const isFiring = input.mouseDown || input.keys['Space'];
    const rateFactor = (player.overdriveTimer > 0) ? (player.fireRateMult * 2.0) : player.fireRateMult;
    if (isFiring && player.fireCooldown <= 0) {
      if (this.currentWeapon === 'blaster') {
        this.firePlayerBullets(player, particles);
        player.fireCooldown = Math.max(4, Math.floor(18 / rateFactor));
      } else if (this.currentWeapon === 'railgun' && this.railgunCooldown <= 0) {
        this.fireRailgun(player, particles, enemies);
        this.railgunCooldown = Math.max(30, Math.floor(75 / (player.overdriveTimer > 0 ? 1.5 : 1)));
        player.fireCooldown = Math.max(10, Math.floor(25 / rateFactor));
      } else if (this.currentWeapon === 'missiles' && this.missileCooldown <= 0) {
        this.fireHomingMissiles(player, particles);
        this.missileCooldown = Math.max(20, Math.floor(50 / (player.overdriveTimer > 0 ? 1.5 : 1)));
        player.fireCooldown = Math.max(8, Math.floor(20 / rateFactor));
      } else if (this.currentWeapon === 'nova' && this.novaCooldown <= 0) {
        this.fireNovaBurst(player, particles, enemies);
        this.novaCooldown = Math.max(40, Math.floor(90 / (player.overdriveTimer > 0 ? 1.5 : 1)));
        player.fireCooldown = Math.max(12, Math.floor(30 / rateFactor));
      } else if (this.currentWeapon !== 'blaster' && player.fireCooldown <= 0) {
        // Fallback blaster if specific weapon on cooldown
        this.firePlayerBullets(player, particles);
        player.fireCooldown = Math.max(6, Math.floor(15 / rateFactor));
      }
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

    // Update homing missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life--;
      // Steer towards nearest enemy if available
      if (enemies && enemies.enemies && enemies.enemies.length > 0) {
        let nearest = null;
        let minDist = 99999;
        for (const en of enemies.enemies) {
          const d = Math.hypot(en.x - m.x, en.y - m.y);
          if (d < minDist) {
            minDist = d;
            nearest = en;
          }
        }
        if (nearest) {
          const targetAngle = Math.atan2(nearest.y - m.y, nearest.x - m.x);
          const currentAngle = Math.atan2(m.vy, m.vx);
          let angleDiff = targetAngle - currentAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(0.1, Math.abs(angleDiff));
          const spd = Math.hypot(m.vx, m.vy);
          m.vx = Math.cos(newAngle) * spd;
          m.vy = Math.sin(newAngle) * spd;
        }
      }
      m.x += m.vx;
      m.y += m.vy;

      if (m.life <= 0 || m.x < 0 || m.x > 3000 || m.y < 0 || m.y > 3000) {
        this.missiles.splice(i, 1);
      }
    }

    // Update beams (fade out)
    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life--;
      if (this.beams[i].life <= 0) {
        this.beams.splice(i, 1);
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

  fireRailgun(player, particles, enemies) {
    audio.playLaser();
    const length = 800;
    const endX = player.x + Math.cos(player.angle) * length;
    const endY = player.y + Math.sin(player.angle) * length;

    this.beams.push({
      x1: player.x, y1: player.y,
      x2: endX, y2: endY,
      life: 15,
      color: '#00ffff'
    });

    if (enemies && enemies.enemies) {
      for (const e of enemies.enemies) {
        // Distance from point (e.x, e.y) to line segment (player.x,player.y)-(endX,endY)
        const lineLen = Math.hypot(endX - player.x, endY - player.y);
        if (lineLen === 0) continue;
        const u = ((e.x - player.x) * (endX - player.x) + (e.y - player.y) * (endY - player.y)) / (lineLen * lineLen);
        const clampedU = Math.max(0, Math.min(1, u));
        const nearestX = player.x + clampedU * (endX - player.x);
        const nearestY = player.y + clampedU * (endY - player.y);
        const dist = Math.hypot(e.x - nearestX, e.y - nearestY);

        if (dist < e.radius + 15) {
          e.hp -= 90 * player.damageMult;
          particles.spawnSpark(e.x, e.y, '#00ffff');
        }
      }
    }
  }

  fireHomingMissiles(player, particles) {
    audio.playLaser();
    for (let i = -1; i <= 1; i++) {
      const angle = player.angle + i * 0.35;
      this.missiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 5,
        vy: Math.sin(angle) * 5,
        damage: 40 * player.damageMult,
        life: 90,
        radius: 5,
        color: '#ff9900'
      });
    }
  }

  fireNovaBurst(player, particles, enemies) {
    audio.playExplosion(false);
    this.beams.push({
      x1: player.x, y1: player.y,
      x2: player.x, y2: player.y,
      radius: 200,
      life: 20,
      color: '#ff00ff'
    });

    if (enemies && enemies.enemies) {
      for (const e of enemies.enemies) {
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < 220) {
          e.hp -= 60 * player.damageMult;
          const pushAngle = Math.atan2(e.y - player.y, e.x - player.x);
          e.x += Math.cos(pushAngle) * 50;
          e.y += Math.sin(pushAngle) * 50;
          particles.spawnSpark(e.x, e.y, '#ff00ff');
        }
      }
    }
  }
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

    for (const m of this.missiles) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 10;
      ctx.fill();
    }

    for (const bm of this.beams) {
      ctx.save();
      ctx.strokeStyle = bm.color;
      ctx.lineWidth = bm.radius ? (20 - bm.life) : 4;
      ctx.shadowColor = bm.color;
      ctx.shadowBlur = 15;
      if (bm.radius) {
        ctx.beginPath();
        ctx.arc(bm.x1, bm.y1, bm.radius * (20 - bm.life), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(bm.x1, bm.y1);
        ctx.lineTo(bm.x2, bm.y2);
        ctx.stroke();
      }
      ctx.restore();
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
