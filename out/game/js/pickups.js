// Pickups and Combo System for Starfall Arena (v4)

export class PickupSystem {
  constructor() {
    this.pickups = []; // { x, y, type: 'repair'|'shield'|'overdrive', radius, vx, vy, life }
  }

  reset() {
    this.pickups = [];
  }

  spawn(x, y, type = null) {
    const types = ['repair', 'shield', 'overdrive'];
    if (!type) {
      const rand = Math.random();
      if (rand < 0.45) type = 'repair';
      else if (rand < 0.8) type = 'shield';
      else type = 'overdrive';
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    this.pickups.push({
      x,
      y,
      type,
      radius: 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 600 // 10 seconds at 60fps
    });
  }

  update(player, particles) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life--;

      if (p.life <= 0) {
        this.pickups.splice(i, 1);
        continue;
      }

      // Magnet pull toward player if close
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const distSq = dx * dx + dy * dy;
      const magnetDist = 180; // range

      if (distSq < magnetDist * magnetDist) {
        const dist = Math.sqrt(distSq);
        const pull = 4.5 * (1 - dist / magnetDist);
        p.x += (dx / dist) * pull;
        p.y += (dy / dist) * pull;
      }

      // Pickup collection check
      const collectDist = player.radius + p.radius;
      if (distSq < collectDist * collectDist) {
        this.applyPickup(player, p.type, particles);
        this.pickups.splice(i, 1);
      }
    }
  }

  applyPickup(player, type, particles) {
    if (type === 'repair') {
      player.hp = Math.min(player.maxHp, player.hp + 35);
      particles.spawnBurst(player.x, player.y, '#ff3366', 15);
    } else if (type === 'shield') {
      player.shield = Math.min(player.maxShield, player.shield + 40);
      particles.spawnBurst(player.x, player.y, '#33ccff', 15);
    } else if (type === 'overdrive') {
      player.overdriveTimer = 480; // 8 seconds at 60fps
      particles.spawnBurst(player.x, player.y, '#ff00ff', 20);
    }
  }

  draw(ctx) {
    for (const p of this.pickups) {
      ctx.save();
      ctx.translate(p.x, p.y);

      let color = '#ff3366';
      let icon = '➕';
      if (p.type === 'shield') {
        color = '#33ccff';
        icon = '🛡️';
      } else if (p.type === 'overdrive') {
        color = '#ff00ff';
        icon = '⚡';
      }

      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fill();
      ctx.stroke();

      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, 0, 0);

      ctx.restore();
    }
  }
}
