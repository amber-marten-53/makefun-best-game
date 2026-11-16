// WebAudio Synthesizer & Sound FX for Starfall Arena
let ctx = null;
let muted = false;

export function initAudio() {
  if (ctx) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
    ctx = new AudioCtx();
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function playTone(freq, type, duration, vol = 0.1, freqEnd = null) {
  if (muted || !ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // ignore audio errors
  }
}

export function playShoot() {
  playTone(440, 'square', 0.08, 0.08, 110);
}

export function playHit() {
  playTone(180, 'sawtooth', 0.05, 0.1, 60);
}

export function playExplosion() {
  if (muted || !ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  try {
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (e) {}
}

export function playLevelUp() {
  if (muted || !ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  playTone(300, 'sine', 0.1, 0.15);
  setTimeout(() => playTone(450, 'sine', 0.1, 0.15), 100);
  setTimeout(() => playTone(600, 'sine', 0.2, 0.2), 200);
  setTimeout(() => playTone(900, 'sine', 0.3, 0.25), 300);
}

export function playPowerup() {
  playTone(523.25, 'triangle', 0.15, 0.1, 1046.5);
}
