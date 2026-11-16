// Starfall Arena - UI Module (v4)
export class UI {
  constructor() {
    this.bossBar = { active: false, name: '', hp: 1, maxHp: 1 };
    this.combo = { count: 0, mult: 1, timer: 0, maxTimer: 3.0, best: 0 };
    this.waveBanner = { text: '', subtext: '', timer: 0, isBoss: false };
    this.vignetteAlpha = 0;
    this.floatingTexts = [];
    this.pausedStats = null;
    this.settings = {
      screenShake: localStorage.getItem('s_shake') !== 'false',
      sound: localStorage.getItem('s_sound') !== 'false',
      fps: localStorage.getItem('s_fps') === 'true'
    };
    this.endRunStats = null;
  }

  showBoss(name, hp, maxHp) {
    this.bossBar.active = true;
    this.bossBar.name = name;
    this.bossBar.hp = hp;
    this.bossBar.maxHp = maxHp;
  }

  hideBoss() {
    this.bossBar.active = false;
  }

  updateBossHp(hp, maxHp) {
    this.bossBar.hp = hp;
    this.bossBar.maxHp = maxHp;
  }

  addCombo(amount = 1) {
    this.combo.count += amount;
    this.combo.timer = this.combo.maxTimer;
    this.combo.mult = 1 + Math.floor(this.combo.count / 5) * 0.5;
    if (this.combo.count > this.combo.best) {
      this.combo.best = this.combo.count;
    }
  }

  resetCombo() {
    this.combo.count = 0;
    this.combo.mult = 1;
    this.combo.timer = 0;
  }

  showWaveBanner(text, subtext = '', isBoss = false) {
    this.waveBanner.text = text;
    this.waveBanner.subtext = subtext;
    this.waveBanner.timer = 2.5;
    this.waveBanner.isBoss = isBoss;
  }

  triggerVignette() {
    this.vignetteAlpha = 0.8;
  }

  addFloatingText(text, x, y, color = '#00ffff', size = 16) {
    this.floatingTexts.push({
      text, x, y, color, size, alpha: 1.0, vy: -30, life: 1.0
    });
  }

  update(dt) {
    if (this.combo.timer > 0) {
      this.combo.timer -= dt;
      if (this.combo.timer <= 0) {
        this.resetCombo();
      }
    }
    if (this.waveBanner.timer > 0) {
      this.waveBanner.timer -= dt;
    }
    if (this.vignetteAlpha > 0) {
      this.vignetteAlpha -= dt * 2.0;
      if (this.vignetteAlpha < 0) this.vignetteAlpha = 0;
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      let ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx, width, height, playerHp, playerMaxHp, score, wave, fpsVal) {
    // 1. Damage vignette
    if (this.vignetteAlpha > 0) {
      ctx.save();
      let grad = ctx.createRadialGradient(width/2, height/2, width*0.3, width/2, height/2, width*0.7);
      grad.addColorStop(0, 'rgba(255,0,0,0)');
      grad.addColorStop(1, `rgba(255,0,0,${this.vignetteAlpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 2. Low health pulse
    if (playerHp > 0 && playerHp / playerMaxHp < 0.3) {
      ctx.save();
      let pulse = Math.sin(Date.now() * 0.01) * 0.15 + 0.2;
      ctx.strokeStyle = `rgba(255, 0, 0, ${pulse})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, width, height);
      ctx.restore();
    }

    // 3. Boss health bar top center
    if (this.bossBar.active) {
      ctx.save();
      let bw = 400, bh = 20;
      let bx = (width - bw) / 2;
      let by = 20;
      ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
      ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);

      let ratio = Math.max(0, Math.min(1, this.bossBar.hp / this.bossBar.maxHp));
      ctx.fillStyle = '#ff2255';
      ctx.fillRect(bx, by, bw * ratio, bh);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.bossBar.name} - ${Math.ceil(this.bossBar.hp)}/${this.bossBar.maxHp}`, width / 2, by + 15);
      ctx.restore();
    }

    // 4. Combo meter under score
    if (this.combo.count > 1) {
      ctx.save();
      ctx.fillStyle = '#00ffcc';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`COMBO x${this.combo.mult.toFixed(1)} (${this.combo.count})`, 20, 75);

      let cw = 120, ch = 6;
      let cx = 20, cy = 82;
      let ratio = Math.max(0, Math.min(1, this.combo.timer / this.combo.maxTimer));
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(cx, cy, cw, ch);
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(cx, cy, cw * ratio, ch);
      ctx.restore();
    }

    // 5. Wave Banner
    if (this.waveBanner.timer > 0) {
      ctx.save();
      let alpha = Math.min(1, this.waveBanner.timer);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.waveBanner.isBoss ? 'rgba(200, 0, 50, 0.85)' : 'rgba(10, 30, 50, 0.85)';
      ctx.fillRect(0, height / 2 - 60, width, 120);
      ctx.strokeStyle = this.waveBanner.isBoss ? '#ff0055' : '#00ffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, height / 2 - 60, width, 120);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.waveBanner.text, width / 2, height / 2 - 10);

      if (this.waveBanner.subtext) {
        ctx.font = '18px monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(this.waveBanner.subtext, width / 2, height / 2 + 25);
      }
      ctx.restore();
    }

    // 6. Floating combat text
    ctx.save();
    for (let ft of this.floatingTexts) {
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();

    // 7. FPS display if enabled
    if (this.settings.fps && fpsVal !== undefined) {
      ctx.save();
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`FPS: ${Math.round(fpsVal)}`, width - 20, 20);
      ctx.restore();
    }
  }

  renderPauseOverlay(ctx, width, height, stats) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', width / 2, height / 2 - 120);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#ffffff';
    let startY = height / 2 - 70;
    let lines = [
      `Kills: ${stats.kills || 0}`,
      `Shots Fired: ${stats.shots || 0}`,
      `Accuracy: ${stats.accuracy || '0%'}`,
      `Time Survived: ${Math.floor(stats.time || 0)}s`,
      `Best Combo: ${this.combo.best || 0}`
    ];
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], width / 2, startY + i * 28);
    }

    ctx.fillStyle = '#00ffcc';
    ctx.font = '14px monospace';
    ctx.fillText('Press ESC or P to Resume', width / 2, height / 2 + 90);
    ctx.restore();
  }

  renderEndRunStats(ctx, width, height, stats) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 5, 15, 0.9)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION COMPLETE', width / 2, height / 2 - 160);

    ctx.font = '20px monospace';
    ctx.fillStyle = '#ffffff';
    let startY = height / 2 - 100;
    let items = [
      `Final Score: ${stats.score || 0}`,
      `Wave Reached: ${stats.wave || 1}`,
      `Total Kills: ${stats.kills || 0}`,
      `Level Reached: ${stats.level || 1}`,
      `Accuracy: ${stats.accuracy || '0%'}`,
      `Best Combo: ${this.combo.best || 0}`,
      `Time Survived: ${Math.floor(stats.time || 0)}s`
    ];
    for (let i = 0; i < items.length; i++) {
      ctx.fillText(items[i], width / 2, startY + i * 28);
    }

    ctx.fillStyle = '#00ffff';
    ctx.font = '16px monospace';
    ctx.fillText('Press ENTER to Restart', width / 2, height / 2 + 120);
    ctx.restore();
  }
}
