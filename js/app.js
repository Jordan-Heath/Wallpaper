import { render } from './draw.js';
import { getSeason } from './astro.js';
import { initRain, resize as resizeRain, setRainIntensity } from './rain.js';
import { fetchWeather, WMO } from './weather.js';

const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');

initRain(document.getElementById('rain'));

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  resizeRain();
}
window.addEventListener('resize', () => {
  resize();
  lastCloudInt = -1;
  renderScene();
});
resize();

// Error toast in top-right corner
const errorToast = document.createElement('div');
errorToast.style.cssText = `
  position:fixed; top:16px; right:16px; z-index:999;
  display:flex; flex-direction:column; gap:8px;
  pointer-events:none;
`;
document.body.appendChild(errorToast);

function showError(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `
    background:rgba(200,50,50,0.9); backdrop-filter:blur(8px);
    color:#fff; padding:10px 16px; border-radius:10px;
    font:14px system-ui,sans-serif; max-width:320px;
    box-shadow:0 4px 20px rgba(0,0,0,0.5);
    animation: errIn 0.25s ease;
    pointer-events:auto;
  `;
  errorToast.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s, transform 0.4s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 400);
  }, 5000);
}

// Weather overlay for cloud cover
const weatherOverlay = document.createElement('div');
weatherOverlay.id = 'weather-overlay';
document.getElementById('scene').appendChild(weatherOverlay);

let location_ = null;
let weatherData = null;
let pollIntervalId = null;
let debugMode = false;
let currentSeason = null;
let seasonOverride = null;
let lastCloudInt = -1;

function renderScene() {
  if (!location_) return;
  render(ctx, W, H, location_, weatherData);
  const season = seasonName(new Date(), location_.lat);
  if (season !== currentSeason) {
    currentSeason = season;
    updateSeasonalLayers(season);
  }
  const intensity = weatherData ? weatherData.intensity : 0;
  const cover = intensity * 0.55;
  const c = Math.round(60 + cover * 40);
  weatherOverlay.style.background = `rgba(${c},${Math.round(c * 0.85)},${Math.round(c * 0.9)},${cover})`;
  if (intensity !== lastCloudInt) {
    lastCloudInt = intensity;
    spawnClouds(intensity);
  }
}

function pollWeather() {
  fetchWeather(location_.lat, location_.lng).then(data => {
    if (debugMode) return;
    if (!data) showError('Could not fetch weather data');
    weatherData = data;
    setRainIntensity(data ? data.intensity : 0);
    renderScene();
  });
}

function applyDebugWeather(intensity, temperature, weatherCode) {
  weatherData = {
    intensity,
    temperature,
    weatherCode,
    description: WMO[weatherCode] || 'Unknown',
  };
  setRainIntensity(intensity);
  renderScene();
}

// ----- Dynamic clouds -----

const cloudsContainer = document.createElement('div');
cloudsContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden;';
document.getElementById('scene').appendChild(cloudsContainer);

let cloudEls = [];
let cloudAnimId = null;

function maxClouds() { return Math.max(2, Math.floor(window.innerWidth / 1)); }

function spawnClouds(intensity) {
  for (const el of cloudEls) el.remove();
  cloudEls = [];
  const count = Math.max(2, Math.min(maxClouds(), Math.floor(intensity * 100)));
  const bright = 100 - intensity * 40;
  for (let i = 0; i < count; i++) {
    const variant = Math.floor(Math.random() * 3) + 1;
    const scale = 1 + Math.random() * 0.7;
    const el = document.createElement('div');
    el.innerHTML = `<img src="images/cloud${variant}.svg" style="width:${200 * scale}px">`;
    el.style.cssText = `
      position:absolute;
      left:${Math.random() * (window.innerWidth + 400) - 200}px;
      top:${Math.random() * window.innerHeight * 0.35 - 40}px;
      opacity:${0.5 + intensity * 0.45};
      filter:brightness(${bright}%);
      will-change:transform;
    `;
    el.dataset.speed = 0.15 + Math.random() * 0.45;
    cloudsContainer.appendChild(el);
    cloudEls.push(el);
  }
}

function animateClouds() {
  for (const el of cloudEls) {
    const x = parseFloat(el.style.left);
    const speed = parseFloat(el.dataset.speed);
    let nx = x - speed;
    if (nx < -250) {
      nx = window.innerWidth + 50;
      el.style.top = `${Math.random() * window.innerHeight * 0.35 - 40}px`;
    }
    el.style.left = `${nx}px`;
  }
  cloudAnimId = requestAnimationFrame(animateClouds);
}

spawnClouds(0);
animateClouds();

const layerEls = {
  mountains1: document.getElementById('mountains1'),
  mountains2: document.getElementById('mountains2'),
  hills1: document.getElementById('hills1'),
  hills2: document.getElementById('hills2'),
};

let animTime = 0;
function animateMountains() {
  animTime += 0.005;
  const sx = Math.sin(animTime);
  const s = W / 1920;
  layerEls.mountains1.style.transform = `translate(${sx * -6 * s}px, 0)`;
  layerEls.mountains2.style.transform = `translate(${sx * -14 * s}px, 0)`;
  layerEls.hills1.style.transform = `translate(${sx * -22 * s}px, 0)`;
  layerEls.hills2.style.transform = `translate(${sx * -30 * s}px, 0)`;
  requestAnimationFrame(animateMountains);
}
animateMountains();

function seasonName(now, lat) {
  return seasonOverride || getSeason(now, lat);
}

function updateSeasonalLayers(season) {
  const s = season.toLowerCase();
  const names = ['mountains1', 'mountains2', 'hills1', 'hills2'];
  for (const name of names) {
    layerEls[name].style.backgroundImage = `url(images/${name}-${s}.svg)`;
  }
}

fetch('default-location.json')
  .then(r => r.json())
  .then(loc => {
    location_ = loc;
    renderScene();
    pollWeather();
    pollIntervalId = setInterval(pollWeather, 600000);
  })
  .catch(e => {
    showError('Could not load location config, using fallback');
    location_ = { lat: -37.8142454, lng: 144.9631732, label: 'Melbourne' };
    renderScene();
  });

setInterval(renderScene, 1000);

// ----- Debug controls -----

const dbgPanel = document.createElement('div');
dbgPanel.id = 'dbgPanel';
const sortedCodes = Object.keys(WMO).map(Number).sort((a, b) => a - b);
dbgPanel.innerHTML = `
  <style>
    #dbgPanel {
      position:fixed; bottom:60px; left:10px; z-index:100;
      background:rgba(0,0,0,0.8); backdrop-filter:blur(8px);
      color:#fff; padding:14px 16px; border-radius:12px;
      font:13px system-ui,sans-serif; width:240px;
      display:none; box-shadow:0 4px 20px rgba(0,0,0,0.6);
    }
    #dbgPanel h3 { margin:0 0 10px; font-size:14px; letter-spacing:.5px; }
    #dbgPanel label { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:8px; }
    #dbgPanel input, #dbgPanel select {
      background:#333; color:#fff; border:1px solid #555;
      border-radius:6px; padding:3px 8px; font:inherit; width:110px;
    }
    #dbgPanel input[type=range] { width:110px; padding:0; border:none; background:none; accent-color:#ffae42; }
    #dbgPanel .dbg-val { min-width:30px; text-align:right; }
    #dbgReset {
      width:100%; margin-top:6px; padding:6px; border:none; border-radius:6px;
      background:#ffae42; color:#222; font-weight:600; cursor:pointer;
    }
    #dbgReset:hover { background:#ffc06b; }
  </style>
  <h3>Weather Debug <span style="font-weight:400;font-size:11px;color:#999">[D]</span></h3>
  <label>Intensity <span style="display:flex;align-items:center;gap:4px;width:110px">
    <input type="range" id="dbgIntensity" min="0" max="1" step="0.05" value="0">
    <span class="dbg-val" id="dbgIntVal">0.00</span>
  </span></label>
  <label>Temp &deg;C <input type="number" id="dbgTemp" value="15"></label>
  <label>Code <select id="dbgCode">${sortedCodes.map(c => `<option value="${c}">${c} — ${WMO[c]}</option>`).join('')}</select></label>
  <label>Season <select id="dbgSeason">
    <option value="">Auto</option>
    <option value="Spring">Spring</option>
    <option value="Summer">Summer</option>
    <option value="Autumn">Autumn</option>
    <option value="Winter">Winter</option>
  </select></label>
  <button id="dbgReset">Exit debug mode</button>
`;
document.body.appendChild(dbgPanel);

const dbgIntensity = document.getElementById('dbgIntensity');
const dbgIntVal = document.getElementById('dbgIntVal');
const dbgTemp = document.getElementById('dbgTemp');
const dbgCode = document.getElementById('dbgCode');
const dbgSeason = document.getElementById('dbgSeason');
const dbgReset = document.getElementById('dbgReset');

function applyDebug() {
  seasonOverride = dbgSeason.value || null;
  currentSeason = null;
  applyDebugWeather(
    parseFloat(dbgIntensity.value),
    parseFloat(dbgTemp.value),
    parseInt(dbgCode.value)
  );
}

dbgIntensity.addEventListener('input', () => {
  dbgIntVal.textContent = parseFloat(dbgIntensity.value).toFixed(2);
  applyDebug();
});
dbgTemp.addEventListener('input', applyDebug);
dbgCode.addEventListener('change', applyDebug);
dbgSeason.addEventListener('change', applyDebug);
dbgReset.addEventListener('click', () => {
  debugMode = false;
  seasonOverride = null;
  currentSeason = null;
  dbgPanel.style.display = 'none';
  pollWeather();
  pollIntervalId = setInterval(pollWeather, 600000);
});

function toggleDebug() {
  debugMode = !debugMode;
  if (debugMode) {
    if (pollIntervalId) { clearInterval(pollIntervalId); pollIntervalId = null; }
    const vals = weatherData || { intensity: 0, temperature: 15, weatherCode: 0 };
    dbgIntensity.value = vals.intensity;
    dbgIntVal.textContent = vals.intensity.toFixed(2);
    dbgTemp.value = vals.temperature;
    dbgCode.value = vals.weatherCode;
    dbgSeason.value = seasonOverride || '';
    dbgPanel.style.display = 'block';
    applyDebug();
  } else {
    seasonOverride = null;
    currentSeason = null;
    dbgPanel.style.display = 'none';
    pollWeather();
    pollIntervalId = setInterval(pollWeather, 600000);
  }
}

document.addEventListener('keydown', e => {
  if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey) {
    toggleDebug();
  }
});

window.addEventListener('error', e => {
  showError(e.message);
});
window.addEventListener('unhandledrejection', e => {
  showError(e.reason?.message || 'Unhandled promise rejection');
});
