let container = null;
let clouds = [];
let rafId = null;
let running = false;

function createCloud(intensity) {
  const variant = Math.floor(Math.random() * 3) + 1;
  const scale = 1 + Math.random() * 0.7;
  const el = document.createElement('div');
  el.innerHTML = `<img src="images/cloud${variant}.svg" style="width:${200 * scale}px">`;
  const bright = 100 - intensity * 40;
  el.style.cssText = `
    position:absolute;
    left:${Math.random() * (window.innerWidth + 400) - 200}px;
    top:${Math.random() * window.innerHeight * 0.35 - 40}px;
    opacity:${0.5 + intensity * 0.45};
    filter:brightness(${bright}%);
    will-change:transform;
  `;
  container.appendChild(el);
  return { el, speed: 0.15 + Math.random() * 0.45, x: parseFloat(el.style.left) };
}

export function initClouds(sceneEl) {
  container = document.createElement('div');
  container.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden;';
  sceneEl.appendChild(container);
}

export function spawnClouds(intensity) {
  for (const c of clouds) c.el.remove();
  clouds = [];
  const count = Math.max(2, Math.min(Math.floor(window.innerWidth), Math.floor(intensity * 100)));
  for (let i = 0; i < count; i++) {
    clouds.push(createCloud(intensity));
  }
}

function animate() {
  for (const c of clouds) {
    c.x -= c.speed;
    if (c.x < -250) {
      c.x = window.innerWidth + 50;
      c.el.style.top = `${Math.random() * window.innerHeight * 0.35 - 40}px`;
    }
    c.el.style.left = `${c.x}px`;
  }
  rafId = requestAnimationFrame(animate);
}

export function startClouds() {
  if (running) return;
  running = true;
  rafId = requestAnimationFrame(animate);
}

export function stopClouds() {
  running = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}
