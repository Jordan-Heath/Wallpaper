import { CONFIG } from './config.js';

const cCfg = CONFIG.clouds;

let container = null;
let clouds = [];
let rafId = null;
let running = false;

function createCloud(intensity) {
  const variant = Math.floor(Math.random() * 3) + 1;
  const scale = cCfg.scaleMin + Math.random() * cCfg.scaleRange;
  const el = document.createElement('div');
  el.innerHTML = `<img src="images/cloud${variant}.svg" style="width:${cCfg.baseWidth * scale}px">`;
  const bright = 100 - intensity * cCfg.brightnessDrop;
  el.style.cssText = `
    position:absolute;
    left:${Math.random() * (window.innerWidth + cCfg.initialXSpread) + cCfg.initialXOffset}px;
    top:${Math.random() * window.innerHeight * cCfg.yLimit + cCfg.yOffset}px;
    opacity:${cCfg.opacityBase + intensity * cCfg.opacityIntensityFactor};
    filter:brightness(${bright}%);
    will-change:transform;
  `;
  container.appendChild(el);
  return { el, speed: cCfg.speedMin + Math.random() * cCfg.speedRange, x: parseFloat(el.style.left) };
}

export function initClouds(sceneEl) {
  container = document.createElement('div');
  container.style.cssText = `position:absolute;inset:0;pointer-events:none;z-index:${cCfg.zIndex};overflow:hidden;`;
  sceneEl.appendChild(container);
}

export function spawnClouds(intensity) {
  for (const c of clouds) c.el.remove();
  clouds = [];
  const count = Math.max(cCfg.minCount, Math.min(Math.floor(window.innerWidth), Math.floor(intensity * cCfg.countPerIntensity)));
  for (let i = 0; i < count; i++) {
    clouds.push(createCloud(intensity));
  }
}

function animate() {
  for (const c of clouds) {
    c.x -= c.speed;
    if (c.x < cCfg.wrapLeft) {
      c.x = window.innerWidth + cCfg.wrapResetRight;
      c.el.style.top = `${Math.random() * window.innerHeight * cCfg.yLimit + cCfg.yOffset}px`;
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
