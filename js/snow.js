import { CONFIG } from './config.js';

const sCfg = CONFIG.snow;

let flakes = [];
let intensity = 0;
let canvas = null;
let ctx = null;
let rafId = null;

function createFlake(W) {
  return {
    x: Math.random() * (W || 1920),
    y: -Math.random() * 30,
    r: sCfg.flakeRadiusMin + Math.random() * sCfg.flakeRadiusRange,
    speed: sCfg.fallSpeedMin + Math.random() * sCfg.fallSpeedRange,
    opacity: sCfg.flakeOpacityMin + Math.random() * sCfg.flakeOpacityRange,
    swayOffset: Math.random() * Math.PI * 2,
    swayFreq: sCfg.swayFreqMin + Math.random() * sCfg.swayFreqRange,
    swayAmp: sCfg.swayAmpMin + Math.random() * sCfg.swayAmpRange,
  };
}

function ensureFlakes(target, W) {
  while (flakes.length < target) flakes.push(createFlake(W));
  while (flakes.length > target) flakes.pop();
}

function update(W, H, time) {
  for (const f of flakes) {
    f.x += sCfg.driftBase - Math.random() * sCfg.driftRandom + Math.sin(time * f.swayFreq + f.swayOffset) * f.swayAmp;
    f.y += f.speed;
    if (f.y > H + sCfg.wrapBottom) { f.y = -f.r * 4; f.x = Math.random() * W; }
    if (f.x < sCfg.wrapLeft) f.x = W + 10;
  }
}

function draw() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const f of flakes) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${sCfg.color[0]},${sCfg.color[1]},${sCfg.color[2]},${f.opacity})`;
    ctx.fill();
  }
}

let animTime = 0;

function loop() {
  const W = canvas.width;
  const H = canvas.height;
  const target = Math.floor(sCfg.maxFlakesPerIntensity * intensity);
  ensureFlakes(target, W);
  animTime += 0.016;
  update(W, H, animTime);
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

export function initSnow(el) {
  canvas = el;
  ctx = el.getContext('2d');
  resize();
}

export function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function setSnowIntensity(value) {
  intensity = Math.max(0, Math.min(1, value));
  if (intensity > 0) start();
  else stop();
}
