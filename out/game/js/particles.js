// Particle system for Starfall Arena
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  add(x, y, vx, vy, color, size, life, shape = 'circle') {
    this.particles.push({
      x, y, vx, vy, color, size, maxLife: life, life, shape
    });
  }

  explosion(x, y, color, count = 15, speed = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.8 + 0.2) * speed;
      this.add(
        x, y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        color,
        Math.random() * 3 + 1.5,
        Math.random() * 25 + 15,
        Math.random() > 0.5 ? 'circle' : 'spark'
      );
    }
  }

  // Update all active particles (apply velocity, drag, and age)
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * alpha), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
