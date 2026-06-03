import { CONFIG } from './config.js';

const pCfg = CONFIG.particles;

let container = null;
let particles = [];
let rafId = null;
let running = false;

function createParticle(type) {
  const colors = type === 'leaf' ? pCfg.leafColors : pCfg.petalColors;
  const size = pCfg.sizeBase + Math.random() * pCfg.sizeRange;
  const el = document.createElement('div');
  el.style.cssText = `
    position:absolute;
    width:${size}px;
    height:${type === 'leaf' ? size * pCfg.leafHeightRatio : size * pCfg.petalHeightRatio}px;
    background:${colors[Math.floor(Math.random() * colors.length)]};
    border-radius:${type === 'leaf' ? '2px 10px 2px 10px' : '50% 0 50% 0'};
    opacity:${pCfg.opacityBase + Math.random() * pCfg.opacityRange};
    pointer-events:none;
  `;
  container.appendChild(el);
  return {
    el,
    x: window.innerWidth + Math.random() * 200,
    y: Math.random() * window.innerHeight,
    vx: -(pCfg.vxMin + Math.random() * pCfg.vxRange),
    vy: pCfg.vyMin + Math.random() * pCfg.vyRange,
    swayPhase: Math.random() * Math.PI * 2,
    swayFreq: pCfg.swayFreqMin + Math.random() * pCfg.swayFreqRange,
    swayAmp: pCfg.swayAmpMin + Math.random() * pCfg.swayAmpRange,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * pCfg.rotSpeedRange,
  };
}

export function initParticles(sceneEl) {
  container = document.createElement('div');
  container.style.cssText = `position:absolute;inset:0;pointer-events:none;z-index:${pCfg.zIndex};overflow:hidden;`;
  sceneEl.appendChild(container);
}

export function setParticleSeason(season) {
  for (const p of particles) p.el.remove();
  particles = [];

  const type = season === 'Spring' ? 'petal' : season === 'Autumn' ? 'leaf' : null;
  if (!type) return;

  const count = pCfg.countBase + Math.floor(Math.random() * pCfg.countRange);
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(type));
  }
}

function animate() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  for (const p of particles) {
    p.vy = Math.min(p.vy + pCfg.gravity, pCfg.maxVy);

    if (Math.random() < pCfg.updraftChance) {
      p.vy -= pCfg.updraftStrengthMin + Math.random() * pCfg.updraftStrengthRange;
    }

    p.y += p.vy;
    p.x += p.vx + Math.sin(p.y * p.swayFreq + p.swayPhase) * p.swayAmp;
    p.rotation += p.rotSpeed;

    if (p.y > H + pCfg.wrapBottomThreshold) { p.y = pCfg.wrapBottomReset; p.x = W + Math.random() * 200; }
    if (p.y < -50) { p.y = H + 20; p.vy = pCfg.vyMin + Math.random() * pCfg.vyRange; p.x = W + Math.random() * 200; }
    if (p.x < pCfg.wrapLeft) p.x = W + 10;
    if (p.x > W + pCfg.wrapRight) p.x = -10;

    p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
  }
  rafId = requestAnimationFrame(animate);
}

export function startParticles() {
  if (running) return;
  running = true;
  rafId = requestAnimationFrame(animate);
}

export function stopParticles() {
  running = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}
