import { CONFIG } from './config.js';

const mCfg = CONFIG.mountains;

let layers = {};
let animTime = 0;
let rafId = null;
let running = false;
let W = window.innerWidth;

export function initMountains(ids) {
  for (const id of ids) {
    layers[id] = document.getElementById(id);
  }
  window.addEventListener('resize', () => { W = window.innerWidth; });
}

export function updateSeason(season) {
  const s = season.toLowerCase();
  for (const [name, el] of Object.entries(layers)) {
    el.style.backgroundImage = `url(images/${name}-${s}.svg)`;
  }
}

function animate() {
  animTime += mCfg.animSpeed;
  const sx = Math.sin(animTime);
  const scale = W / mCfg.referenceWidth;
  layers.mountains1.style.transform = `translate(${sx * mCfg.parallax.mountains1 * scale}px, 0)`;
  layers.mountains2.style.transform = `translate(${sx * mCfg.parallax.mountains2 * scale}px, 0)`;
  layers.hills1.style.transform = `translate(${sx * mCfg.parallax.hills1 * scale}px, 0)`;
  layers.hills2.style.transform = `translate(${sx * mCfg.parallax.hills2 * scale}px, 0)`;
  rafId = requestAnimationFrame(animate);
}

export function startMountains() {
  if (running) return;
  running = true;
  rafId = requestAnimationFrame(animate);
}

export function stopMountains() {
  running = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}
