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
  animTime += 0.005;
  const sx = Math.sin(animTime);
  const scale = W / 1920;
  layers.mountains1.style.transform = `translate(${sx * -6 * scale}px, 0)`;
  layers.mountains2.style.transform = `translate(${sx * -14 * scale}px, 0)`;
  layers.hills1.style.transform = `translate(${sx * -22 * scale}px, 0)`;
  layers.hills2.style.transform = `translate(${sx * -30 * scale}px, 0)`;
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
