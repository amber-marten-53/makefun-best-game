// Enemy types: chasers, splitters, shooters, orbiters, dashers, spawners, snipers, tanks, and epic bosses
import { audio } from './audio.js';

export class EnemySystem {
  constructor() {
    this.enemies = [];
    this.xpShards = [];
  }

  reset() {
    this.enemies = [];
    this.xpShards = [];
  }

  spawnWave(waveNum, arenaWidth, arenaHeight) {
    this.enemies = [];
    const isBossWave = (waveNum % 5 === 0);

    if (isBossWave) {
      // Spawn Boss
      const bossHp = 400 + waveNum * 100;
      this.enemies.push({
        type: 'boss',
        x: arenaWidth / 2,
        y: arenaHeight / 2 - 200,
        radius: 35,
        hp: bossHp,
        maxHp: bossHp,
        speed: 1.5,
        attackCooldown: 100,
        color: '#ff00ff',
        phase: 1,
        entranceTimer: 60
      });
      return;
    }

    // Normal wave composition
    const count = 4 + waveNum * 3;
    for (let i = 0; i < count; i++) {
      // Spawn along perimeter
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(arenaWidth, arenaHeight) * 0.6 + Math.random() * 200;
      const x = arenaWidth / 2 + Math.cos(angle) * dist;
      const y = arenaHeight / 2 + Math.sin(angle) * dist;

      // Mix enemy types based on wave
      let type = 'chaser';
      const rand = Math.random();
      if (waveNum >= 2 && rand < 0.2) type = 'splitter';
      else if (waveNum >= 3 && rand < 0.35) type = 'shooter';
      else if (waveNum >= 4 && rand < 0.5) type = 'orbiter';
      else if (waveNum >= 5 && rand < 0.65) type = 'dasher';
      else if (waveNum >= 6 && rand < 0.75) type = 'spawner';
      else if (waveNum >= 7 && rand < 0.88) type = 'sniper';
      else if (waveNum >= 8 && rand < 1.0) type = 'tank';

      let radius = 14;
      let hp = 30 + waveNum * 5;
      let speed = 2.2;
      let color = '#ff3366';

      if (type === 'splitter') {
        radius = 18;
        hp = 50 + waveNum * 8;
        speed = 1.8;
        color = '#ff9900';
      } else if (type === 'shooter') {
        radius = 15;
        hp = 35 + waveNum * 5;
        speed = 1.6;
        color = '#33ccff';
      } else if (type === 'orbiter') {
        radius = 12;
        hp = 25 + waveNum * 4;
        speed = 2.8;
        color = '#00ff66';
      } else if (type === 'dasher') {
        radius = 13;
        hp = 30 + waveNum * 5;
        speed = 2.0;
        color = '#ff33ff';
      } else if (type === 'spawner') {
        radius = 20;
        hp = 70 + waveNum * 10;
        speed = 1.2;
        color = '#99ff33';
      } else if (type === 'sniper') {
        radius = 14;
        hp = 25 + waveNum * 4;
        speed = 1.4;
        color = '#ffff33';
      } else if (type === 'tank') {
        radius = 26;
        hp = 150 + waveNum * 25;
        speed = 0.9;
        color = '#ff5533';
      }

      this.enemies.push({
        type,
        x, y,
        radius,
        hp, maxHp: hp,
        speed,
        attackCooldown: Math.floor(Math.random() * 60 + 40),
        orbitAngle: Math.random() * Math.PI * 2,
        dashTimer: 0,
        isDashing: false,
        dashDx: 0,
        dashDy: 0,
        sniperAngle: 0,
        color
      });
    }
  }

  update(player, weaponSystem, particles) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // AI movement by type
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (e.type === 'chaser') {
        if (dist > 1) {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }
      } else if (e.type === 'splitter') {
        if (dist > 1) {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }
      } else if (e.type === 'shooter') {
        // Keep distance around 250px
        if (dist > 280) {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        } else if (dist < 200) {
          e.x -= (dx / dist) * e.speed;
          e.y -= (dy / dist) * e.speed;
        }
        e.attackCooldown--;
        if (e.attackCooldown <= 0) {
          weaponSystem.fireEnemyBullet(e.x, e.y, player.x, player.y, 4, '#33ccff');
          e.attackCooldown = 120;
        }
      } else if (e.type === 'orbiter') {
        // Orbit player
        e.orbitAngle += 0.03;
        const targetX = player.x + Math.cos(e.orbitAngle) * 180;
        const targetY = player.y + Math.sin(e.orbitAngle) * 180;
        const odx = targetX - e.x;
        const ody = targetY - e.y;
        e.x += odx * 0.05;
        e.y += ody * 0.05;
      } else if (e.type === 'dasher') {
        e.attackCooldown--;
        if (!e.isDashing) {
          if (dist > 150) {
            e.x += (dx / dist) * e.speed;
            e.y += (dy / dist) * e.speed;
          }
          if (e.attackCooldown <= 0) {
            e.isDashing = true;
            e.dashTimer = 30; // 0.5s telegraph/dash
            const dashAngle = Math.atan2(dy, dx);
            e.dashDx = Math.cos(dashAngle) * 7.5;
            e.dashDy = Math.sin(dashAngle) * 7.5;
            e.attackCooldown = 140;
          }
        } else {
          e.x += e.dashDx;
          e.y += e.dashDy;
          e.dashTimer--;
          if (e.dashTimer <= 0) {
            e.isDashing = false;
          }
        }
      } else if (e.type === 'spawner') {
        if (dist > 220) {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }
        e.attackCooldown--;
        if (e.attackCooldown <= 0) {
          // Release a small mite if total enemies < 60
          if (this.enemies.length < 60) {
            this.enemies.push({
              type: 'chaser',
              x: e.x + (Math.random() - 0.5) * 20,
              y: e.y + (Math.random() - 0.5) * 20,
              radius: 9,
              hp: 15, maxHp: 15,
              speed: 3.2,
              color: '#99ff33'
            });
          }
          e.attackCooldown = 180;
        }
      } else if (e.type === 'sniper') {
        if (dist > 320) {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        } else if (dist < 260) {
          e.x -= (dx / dist) * e.speed;
          e.y -= (dy / dist) * e.speed;
        }
        e.attackCooldown--;
        if (e.attackCooldown <= 0) {
          weaponSystem.fireEnemyBullet(e.x, e.y, player.x, player.y, 6, '#ffff33');
          e.attackCooldown = 160;
        }
      } else if (e.type === 'tank') {
        if (dist > 1) {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }
      } else if (e.type === 'boss') {
        if (e.entranceTimer > 0) {
          e.entranceTimer--;
          return;
        }

        const hpRatio = e.hp / e.maxHp;
        if (hpRatio < 0.33) {
          e.phase = 3;
          e.speed = 2.2;
        } else if (hpRatio < 0.66) {
          e.phase = 2;
          e.speed = 1.8;
        }

        if (dist > 150) {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }

        e.attackCooldown--;
        if (e.attackCooldown <= 0) {
          if (e.phase === 3) {
            if (this.enemies.length < 50) {
              for (let m = 0; m < 2; m++) {
                this.enemies.push({
                  type: 'dasher',
                  x: e.x + (Math.random() - 0.5) * 40,
                  y: e.y + (Math.random() - 0.5) * 40,
                  radius: 12,
                  hp: 30, maxHp: 30,
                  speed: 2.8,
                  color: '#ff00ff'
                });
              }
            }
            const burstCount = 12;
            for (let b = 0; b < burstCount; b++) {
              const angle = (Math.PI * 2 / burstCount) * b;
              weaponSystem.enemyBullets.push({
                x: e.x, y: e.y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                damage: 25,
                life: 150,
                radius: 6,
                color: '#ff00ff'
              });
            }
            audio.playExplosion(true);
            e.attackCooldown = 70;
          } else if (e.phase === 2) {
            const spiralCount = 6;
            const baseAngle = Date.now() * 0.005;
            for (let b = 0; b < spiralCount; b++) {
              const angle = baseAngle + (Math.PI * 2 / spiralCount) * b;
              weaponSystem.enemyBullets.push({
                x: e.x, y: e.y,
                vx: Math.cos(angle) * 4.5,
                vy: Math.sin(angle) * 4.5,
                damage: 20,
                life: 140,
                radius: 5,
                color: '#ff55ff'
              });
            }
            audio.playExplosion(false);
            e.attackCooldown = 60;
          } else {
            const burstCount = 8;
            for (let b = 0; b < burstCount; b++) {
              const angle = (Math.PI * 2 / burstCount) * b;
              weaponSystem.enemyBullets.push({
                x: e.x, y: e.y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                damage: 15,
                life: 130,
                radius: 5,
                color: '#ff00ff'
              });
            }
            audio.playExplosion(false);
            e.attackCooldown = 90;
          }
        }
      }
  }

  checkCollisions(player, weaponSystem, particles, pickupSystem, onScore) {
    // Player bullets vs Enemies
    for (let bi = weaponSystem.bullets.length - 1; bi >= 0; bi--) {
      const b = weaponSystem.bullets[bi];
      let bulletConsumed = false;

      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei];
        const dist = Math.hypot(b.x - e.x, b.y - e.y);

        if (dist < b.radius + e.radius) {
          // Hit! Damage reduction for tank from front arc
          let finalDmg = b.damage;
          if (e.type === 'tank') {
            const bAngle = Math.atan2(b.y - e.y, b.x - e.x);
            // tank facing player or bullet angle check - front armor reduces dmg by 50%
            finalDmg *= 0.5;
          }

          e.hp -= finalDmg;
          particles.spawnSpark(b.x, b.y, e.color);
          particles.addFloatingText(e.x, e.y - 10, Math.round(finalDmg), '#00ffff');

          if (e.hp <= 0) {
            // Destroyed enemy
            audio.playExplosion(e.type === 'boss');
            particles.spawnExplosion(e.x, e.y, e.color, e.type === 'boss' ? 40 : 15, e.type === 'boss' ? 2 : 1);
            onScore(e.type === 'boss' ? 500 : 50);

            // Spawn XP Shard(s)
            const shardCount = e.type === 'boss' ? 10 : (e.type === 'splitter' ? 3 : 1);
            for (let s = 0; s < shardCount; s++) {
              this.xpShards.push({
                x: e.x + (Math.random() - 0.5) * 30,
                y: e.y + (Math.random() - 0.5) * 30,
                value: e.type === 'boss' ? 20 : 10,
                radius: 6
              });
            }

            if (pickupSystem && (Math.random() < 0.35 || e.type === 'boss' || e.type === 'tank' || e.type === 'spawner')) {
              pickupSystem.spawn(e.x, e.y);
            }
            if (e.type === 'splitter') {
              for (let sp = 0; sp < 2; sp++) {
                this.enemies.push({
                  type: 'chaser',
                  x: e.x + (Math.random() - 0.5) * 20,
                  y: e.y + (Math.random() - 0.5) * 20,
                  radius: 10,
                  hp: 20, maxHp: 20,
                  speed: 2.6,
                  color: '#ff9900'
                });
              }
            }

            this.enemies.splice(ei, 1);
          }

          if (b.pierce > 0) {
            b.pierce--;
          } else {
            bulletConsumed = true;
            break;
          }
        }
      }

      if (bulletConsumed) {
        weaponSystem.bullets.splice(bi, 1);
      }
    }

    // Enemies vs Player
    for (const e of this.enemies) {
      const dist = Math.hypot(player.x - e.x, player.y - e.y);
      if (dist < player.radius + e.radius) {
        player.takeDamage(e.type === 'boss' ? 30 : 15);
      }
    }

    // Enemy Bullets vs Player
    for (let ebi = weaponSystem.enemyBullets.length - 1; ebi >= 0; ebi--) {
      const eb = weaponSystem.enemyBullets[ebi];
      const dist = Math.hypot(player.x - eb.x, player.y - eb.y);
      if (dist < player.radius + eb.radius) {
        player.takeDamage(eb.damage);
        weaponSystem.enemyBullets.splice(ebi, 1);
      }
    }

    // XP Shards collection
    for (let si = this.xpShards.length - 1; si >= 0; si--) {
      const shard = this.xpShards[si];
      const dist = Math.hypot(player.x - shard.x, player.y - shard.y);

      if (dist < player.magnetRadius) {
        // Pull shard toward player
        const angle = Math.atan2(player.y - shard.y, player.x - shard.x);
        shard.x += Math.cos(angle) * 6;
        shard.y += Math.sin(angle) * 6;

        if (dist < player.radius + shard.radius) {
          audio.playXp();
          this.xpShards.splice(si, 1);
          return shard.value; // Returns XP amount earned
        }
      }
    }

    return 0;
  }

  draw(ctx) {
    ctx.save();
    // Draw XP Shards
    for (const s of this.xpShards) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#9900ff';
      ctx.shadowColor = '#9900ff';
      ctx.shadowBlur = 10;
      ctx.fill();
    }

    // Draw Enemies
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);

      if (e.type === 'boss') {
        // Boss drawing (pulsing giant hexagon)
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i + (Date.now() * 0.001);
          const px = Math.cos(angle) * e.radius;
          const py = Math.sin(angle) * e.radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#1a052b';
        ctx.fill();
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 15;
        ctx.stroke();
      } else {
        // Regular enemies drawing
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0b0b1a';
        ctx.fill();
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
      }

      ctx.restore();
    }
    ctx.restore();
  }
}
