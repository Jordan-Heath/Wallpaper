let drops = [];
let intensity = 0;
let canvas = null;
let ctx = null;
let rafId = null;

function createDrop(W) {
  return {
    x: Math.random() * (W || 1920),
    y: -Math.random() * 30,
    len: Math.random() * 14 + 8,
    speed: Math.random() * 8 + 5,
    opacity: Math.random() * 0.35 + 0.15,
  };
}

function ensureDrops(target, W) {
  while (drops.length < target) drops.push(createDrop(W));
  while (drops.length > target) drops.pop();
}

function update(W, H) {
  for (const d of drops) {
    d.x += -1.5 - Math.random() * 0.5;
    d.y += d.speed;
    if (d.y > H + 10) { d.y = -d.len; d.x = Math.random() * W; }
    if (d.x < -20) d.x = W + 10;
  }
}

function draw() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgb(70,140,255)';
  ctx.lineWidth = 1 + intensity * 0.5;
  ctx.lineCap = 'butt';
  for (const d of drops) {
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + 3 + intensity * 2, d.y - d.len);
    ctx.stroke();
  }
}

function loop() {
  const W = canvas.width;
  const H = canvas.height;
  const target = Math.floor(300 * intensity);
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
