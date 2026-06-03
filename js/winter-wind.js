import { CONFIG } from './config.js';

const wCfg = CONFIG.winterWind;

let waves = [];
let canvas = null;
let ctx = null;
let rafId = null;
let animTime = 0;

function createWave(W, H) {
  return {
    y: Math.random() * H,
    amp: wCfg.ampMin + Math.random() * wCfg.ampRange,
    freq: wCfg.freqMin + Math.random() * wCfg.freqRange,
    speed: (wCfg.speedMin + Math.random() * wCfg.speedRange) * (Math.random() < 0.5 ? 1 : -1),
    phase: Math.random() * Math.PI * 2,
    gustPhase: Math.random() * Math.PI * 2,
    gustSpeed: wCfg.gustSpeedMin + Math.random() * wCfg.gustSpeedRange,
    opacity: wCfg.opacityMin + Math.random() * wCfg.opacityRange,
    width: wCfg.widthMin + Math.random() * wCfg.widthRange,
  };
}

function ensureWaves(target, W, H) {
  while (waves.length < target) waves.push(createWave(W, H));
  while (waves.length > target) waves.pop();
}

function update(W, H) {
  for (const w of waves) {
    w.phase += w.speed * 0.02;
    w.gustPhase += w.gustSpeed;
    w.y += Math.sin(animTime * 0.0003 + w.phase * 0.1) * 0.05;
    if (w.y > H + 50) w.y = -50;
    if (w.y < -50) w.y = H + 50;
  }
}

function draw() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width;

  for (const w of waves) {
    const gust = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(w.gustPhase));
    const alpha = w.opacity * gust;

    ctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const y = w.y + Math.sin(x * w.freq + w.phase) * w.amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${wCfg.color[0]},${wCfg.color[1]},${wCfg.color[2]},${alpha})`;
    ctx.lineWidth = w.width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function loop() {
  const W = canvas.width;
  const H = canvas.height;
  ensureWaves(wCfg.count, W, H);
  animTime += 0.016;
  update(W, H);
  draw();
  rafId = requestAnimationFrame(loop);
}

function start() {
  if (rafId) return;
  rafId = requestAnimationFrame(loop);
}

function stop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function initWinterWind(el) {
  canvas = el;
  ctx = el.getContext('2d');
  resize();
}

export function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function setWinterWindActive(active) {
  if (active) start();
  else stop();
}
