import { CONFIG } from './config.js';

const wCfg = CONFIG.winterWind;

let pieces = [];
let canvas = null;
let ctx = null;
let rafId = null;
let animTime = 0;

function createPiece(W, H) {
  const amp = wCfg.ampMin + Math.random() * wCfg.ampRange;
  const freq = wCfg.freqMin + Math.random() * wCfg.freqRange;
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    amp,
    freq,
    speed: freq * wCfg.speedFreqFactor,
    driftAmp: amp * wCfg.driftAmpFactor,
    phase: Math.random() * Math.PI * 2,
    driftPhase: Math.random() * Math.PI * 2,
    driftSpeed: wCfg.driftSpeedMin + Math.random() * wCfg.driftSpeedRange,
    spacing: wCfg.lineSpacingMin + Math.random() * wCfg.lineSpacingRange,
    opacity: wCfg.opacityMin + Math.random() * wCfg.opacityRange,
    width: wCfg.widthMin + Math.random() * wCfg.widthRange,
  };
}

function ensurePieces(target, W, H) {
  while (pieces.length < target) pieces.push(createPiece(W, H));
  while (pieces.length > target) pieces.pop();
}

function update(W, H) {
  for (const p of pieces) {
    p.x -= p.speed;
    p.phase += p.driftSpeed;
    p.driftPhase += p.driftSpeed;
    p.y += Math.sin(p.driftPhase) * p.driftAmp;

    if (p.x < -wCfg.length) {
      p.x = W + wCfg.length;
      p.y = Math.random() * H;
    }
  }
}

function draw() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const p of pieces) {
    const offsets = [-p.spacing, 0, p.spacing];
    ctx.strokeStyle = `rgba(${wCfg.color[0]},${wCfg.color[1]},${wCfg.color[2]},${p.opacity})`;
    ctx.lineWidth = p.width;
    ctx.lineCap = 'round';

    for (const off of offsets) {
      ctx.beginPath();
      for (let dx = 0; dx <= wCfg.length; dx += 2) {
        const x = p.x + dx;
        const y = p.y + off + Math.sin(x * p.freq + p.phase) * p.amp;
        if (dx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

function loop() {
  const W = canvas.width;
  const H = canvas.height;
  ensurePieces(wCfg.count, W, H);
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
