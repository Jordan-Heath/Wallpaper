let container = null;
let particles = [];
let rafId = null;
let running = false;

const LEAF_COLORS = ['#c47a2b', '#a35d1a', '#d4923a', '#8b4513', '#b8860b'];
const PETAL_COLORS = ['#f8b4c8', '#f2a0b8', '#fcc8d8', '#f0d0e0', '#ffe0ec'];

function createParticle(type) {
  const colors = type === 'leaf' ? LEAF_COLORS : PETAL_COLORS;
  const size = 4 + Math.random() * 6;
  const el = document.createElement('div');
  el.style.cssText = `
    position:absolute;
    width:${size}px;
    height:${type === 'leaf' ? size * 1.3 : size * 0.8}px;
    background:${colors[Math.floor(Math.random() * colors.length)]};
    border-radius:${type === 'leaf' ? '2px 10px 2px 10px' : '50% 0 50% 0'};
    opacity:${0.5 + Math.random() * 0.4};
    pointer-events:none;
  `;
  container.appendChild(el);
  return {
    el,
    x: Math.random() * window.innerWidth,
    y: -Math.random() * window.innerHeight,
    vx: -0.2 - Math.random() * 0.3,
    vy: 0.3 + Math.random() * 0.4,
    swayPhase: Math.random() * Math.PI * 2,
    swayFreq: 0.008 + Math.random() * 0.012,
    swayAmp: 0.15 + Math.random() * 0.25,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 1.5,
  };
}

export function initParticles(sceneEl) {
  container = document.createElement('div');
  container.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;overflow:hidden;';
  sceneEl.appendChild(container);
}

export function setParticleSeason(season) {
  for (const p of particles) p.el.remove();
  particles = [];

  const type = season === 'Spring' ? 'petal' : season === 'Autumn' ? 'leaf' : null;
  if (!type) return;

  const count = 10 + Math.floor(Math.random() * 11);
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(type));
  }
}

function animate() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  for (const p of particles) {
    p.vy = Math.min(p.vy + 0.001, 0.7);
    p.y += p.vy;
    p.x += p.vx + Math.sin(p.y * p.swayFreq + p.swayPhase) * p.swayAmp;
    p.rotation += p.rotSpeed;

    if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
    if (p.x < -30) p.x = W + 10;
    if (p.x > W + 30) p.x = -10;

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
