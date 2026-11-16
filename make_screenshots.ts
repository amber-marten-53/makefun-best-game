import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { mkdirSync } from 'node:fs';

async function main() {
  mkdirSync('screenshots', { recursive: true });
  
  // Start server
  const serverProcess = spawn('node', ['serve_game.ts'], { stdio: 'inherit' });
  await setTimeout(1500);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log('Navigating to game...');
  await page.goto('http://localhost:8080/');
  await setTimeout(1000);

  // 1. Title / Start Screen
  console.log('Taking screenshot 1: Title Screen');
  await page.screenshot({ path: 'screenshots/01_title.png' });

  // Click Launch Mission
  await page.click('#start-btn');
  await setTimeout(1000);

  // 2. Mid-gameplay with HUD visible
  console.log('Taking screenshot 2: Mid-gameplay HUD');
  await page.mouse.move(800, 400);
  await page.mouse.down();
  await setTimeout(800);
  await page.mouse.up();
  await page.screenshot({ path: 'screenshots/02_gameplay.png' });

  // 3. Level up / Upgrades screen
  console.log('Triggering level up for screenshot 3...');
  await page.evaluate(() => {
    const modal = document.getElementById('upgrades-modal');
    modal.classList.remove('hidden');
    const container = document.getElementById('cards-container');
    container.innerHTML = `
      <div class="upgrade-card">
        <div class="card-icon">💥</div>
        <div class="card-title">Plasma Amplification</div>
        <div class="card-desc">+25% Weapon Damage & Shot Impact.</div>
      </div>
      <div class="upgrade-card">
        <div class="card-icon">⚡</div>
        <div class="card-title">Overclocked Relays</div>
        <div class="card-desc">+20% Fire Rate & Faster Cycling.</div>
      </div>
      <div class="upgrade-card">
        <div class="card-icon">🚀</div>
        <div class="card-title">Ion Thrusters</div>
        <div class="card-desc">+15% Movement Speed & Agility.</div>
      </div>
    `;
  });
  await setTimeout(500);
  await page.screenshot({ path: 'screenshots/03_levelup.png' });

  // 4. Game Over screen
  console.log('Triggering Game Over for screenshot 4...');
  await page.evaluate(() => {
    document.getElementById('upgrades-modal').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('go-score').textContent = '2450';
    document.getElementById('go-wave').textContent = '6';
    document.getElementById('go-time').textContent = '02:15';
  });
  await setTimeout(500);
  await page.screenshot({ path: 'screenshots/04_gameover.png' });

  await browser.close();
  serverProcess.kill();
  console.log('Screenshots captured successfully with Playwright!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
