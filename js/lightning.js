import { CONFIG } from './config.js';

const lCfg = CONFIG.lightning;

let flashEl = null;
let boltEl = null;
let intensity = 0;
let timerId = null;
let activeEls = false;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function scheduleNext() {
  if (intensity <= 0) return;
  if (timerId) clearTimeout(timerId);
  const minD = lCfg.minInterval - (lCfg.minInterval * intensity * 0.4);
  const maxD = lCfg.maxInterval - (lCfg.maxInterval * intensity * 0.5);
  timerId = setTimeout(strike, randomBetween(minD, maxD));
}

function strike() {
  if (!flashEl || !boltEl || intensity <= 0) return;

  const n = Math.floor(Math.random() * 3) + 1;
  boltEl.src = `images/lightning${n}.svg`;

  const behindClouds = Math.random() < 0.5;
  boltEl.style.zIndex = behindClouds ? String(lCfg.zIndex.boltBehind) : String(lCfg.zIndex.boltFront);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const bw = 140;
  const bh = 320;
  const x = Math.random() * (w - bw);
  const y = Math.random() * (h * 0.45 - bh * 0.5);
  boltEl.style.left = `${x}px`;
  boltEl.style.top = `${y}px`;

  flashEl.style.transition = 'none';
  flashEl.style.opacity = String(lCfg.flashOpacity);
  boltEl.style.transition = 'none';
  boltEl.style.opacity = '1';
  activeEls = true;

  flashEl.offsetHeight;

  flashEl.style.transition = `opacity ${lCfg.flashFadeMs}ms ease-out`;
  boltEl.style.transition = `opacity ${lCfg.boltFadeMs}ms ease-out`;
  flashEl.style.opacity = '0';
  boltEl.style.opacity = '0';

  const fadeDuration = Math.max(lCfg.flashFadeMs, lCfg.boltFadeMs);
  setTimeout(() => { activeEls = false; }, fadeDuration);

  scheduleNext();
}

export function initLightning(sceneEl) {
  flashEl = document.createElement('div');
  flashEl.id = 'lightning-flash';
  sceneEl.appendChild(flashEl);

  boltEl = document.createElement('img');
  boltEl.id = 'lightning-bolt';
  boltEl.className = 'lightning-bolt';
  boltEl.alt = '';
  sceneEl.appendChild(boltEl);
}

export function lightningIntensityFromCode(code) {
  if (code >= 99) return 1.0;
  if (code >= 96) return 0.7;
  if (code >= 95) return 0.4;
  return 0;
}

export function setLightningIntensity(value) {
  intensity = Math.max(0, Math.min(1, value));

  if (timerId) { clearTimeout(timerId); timerId = null; }

  if (flashEl && boltEl) {
    flashEl.style.transition = `opacity 150ms ease-out`;
    boltEl.style.transition = `opacity 150ms ease-out`;
    flashEl.style.opacity = '0';
    boltEl.style.opacity = '0';
    activeEls = false;
  }

  if (intensity > 0) scheduleNext();
}

export function setThunderstormIntensity(code) {
  setLightningIntensity(lightningIntensityFromCode(code));
}
