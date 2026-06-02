import { CONFIG } from './config.js';

const rCfg = CONFIG.rain;

let drops = [];
let intensity = 0;
let canvas = null;
let ctx = null;
let rafId = null;

function createDrop(W) {
  return {
    x: Math.random() * (W || 1920),
    y: -Math.random() * 30,
    len: rCfg.dropLenMin + Math.random() * rCfg.dropLenRange,
    speed: rCfg.dropSpeedMin + Math.random() * rCfg.dropSpeedRange,
    opacity: rCfg.dropOpacityMin + Math.random() * rCfg.dropOpacityRange,
  };
}

function ensureDrops(target, W) {
  while (drops.length < target) drops.push(createDrop(W));
  while (drops.length > target) drops.pop();
}

function update(W, H) {
  for (const d of drops) {
    d.x += rCfg.driftBase - Math.random() * rCfg.driftRandom;
    d.y += d.speed;
    if (d.y > H + rCfg.wrapBottom) { d.y = -d.len; d.x = Math.random() * W; }
    if (d.x < rCfg.wrapLeft) d.x = W + 10;
  }
}

function draw() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = `rgb(${rCfg.color[0]},${rCfg.color[1]},${rCfg.color[2]})`;
  ctx.lineWidth = rCfg.lineWidthBase + intensity * rCfg.lineWidthIntensityFactor;
  ctx.lineCap = 'butt';
  for (const d of drops) {
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + rCfg.diagonalOffsetBase + intensity * rCfg.diagonalOffsetIntensityFactor, d.y - d.len);
    ctx.stroke();
  }
}

function loop() {
  const W = canvas.width;
  const H = canvas.height;
  const target = Math.floor(rCfg.maxDropsPerIntensity * intensity);
  ensureDrops(target, W);
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

export function initRain(el) {
  canvas = el;
  ctx = el.getContext('2d');
  resize();
}

export function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function setRainIntensity(value) {
  intensity = Math.max(0, Math.min(1, value));
  if (intensity > 0) start();
  else stop();
}
