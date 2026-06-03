import { CONFIG } from './config.js';

const bCfg = CONFIG.birds;

let birds = [];
let canvas = null;
let ctx = null;
let rafId = null;

function createBird(W, H) {
  const dir = Math.random() < 0.5 ? 1 : -1;
  return {
    x: dir === 1 ? -30 : (W || 1920) + 30,
    y: bCfg.yBaseMin + Math.random() * (H * bCfg.yLimit - bCfg.yBaseMin),
    speed: bCfg.speedBase + Math.random() * bCfg.speedRange,
    size: bCfg.sizeBase + Math.random() * bCfg.sizeRange,
    wingPhase: Math.random() * Math.PI * 2,
    wingFreq: bCfg.wingFreqBase + Math.random() * bCfg.wingFreqRange,
    wingAmp: bCfg.wingAmpBase + Math.random() * bCfg.wingAmpRange,
    opacity: bCfg.opacityBase + Math.random() * bCfg.opacityRange,
    dir,
  };
}

function ensureBirds(target, W, H) {
  while (birds.length < target) birds.push(createBird(W, H));
  while (birds.length > target) birds.pop();
}

function update(W, H) {
  for (const b of birds) {
    b.x += b.speed * b.dir;
    b.wingPhase += b.wingFreq;

    if (b.dir === 1 && b.x > W + 50) {
      b.x = -30;
      b.y = bCfg.yBaseMin + Math.random() * (H * bCfg.yLimit - bCfg.yBaseMin);
    } else if (b.dir === -1 && b.x < -50) {
      b.x = W + 30;
      b.y = bCfg.yBaseMin + Math.random() * (H * bCfg.yLimit - bCfg.yBaseMin);
    }
  }
}

function drawBird(b) {
  const s = b.size;
  const flap = Math.sin(b.wingPhase) * b.wingAmp;

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(b.dir, 1);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.3 - flap, -s * 0.7, -flap * 0.4);
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.3, -s * 0.3 - flap, s * 0.7, -flap * 0.4);

  ctx.strokeStyle = `rgba(${bCfg.color[0]},${bCfg.color[1]},${bCfg.color[2]},${b.opacity})`;
  ctx.lineWidth = bCfg.lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

function draw() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const b of birds) {
    drawBird(b);
  }
}

function loop() {
  const W = canvas.width;
  const H = canvas.height;
  ensureBirds(bCfg.count, W, H);
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

export function initBirds(el) {
  canvas = el;
  ctx = el.getContext('2d');
  resize();
}

export function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function setBirdsActive(active) {
  if (active) start();
  else stop();
}
