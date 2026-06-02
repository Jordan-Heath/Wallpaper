import { render } from './draw.js';
import { getSeason } from './astro.js';
import { initRain, resize as resizeRain, setRainIntensity } from './rain.js';
import { fetchWeather } from './weather.js';
import { initClouds, spawnClouds, startClouds, stopClouds } from './clouds.js';
import { initMountains, updateSeason, startMountains, stopMountains } from './mountains.js';
import { initDebug } from './debug.js';

const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');

initRain(document.getElementById('rain'));
initClouds(document.getElementById('scene'));
initMountains(['mountains1', 'mountains2', 'hills1', 'hills2']);

let lastIntensity = 0;
let lastRenderTime = 0;
const RENDER_INTERVAL = 1000;
let W, H;
let location_ = null;
let weatherData = null;
let pollIntervalId = null;
let currentSeason = null;
let seasonOverride = null;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  resizeRain();
  lastIntensity = -1;
  renderScene();
}
window.addEventListener('resize', resize);
resize();

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

const weatherOverlay = document.createElement('div');
weatherOverlay.id = 'weather-overlay';
document.getElementById('scene').appendChild(weatherOverlay);

function updatePanel(data) {
  document.getElementById('loc').textContent = data.location;
  document.getElementById('time').textContent = data.time;
  document.getElementById('date').textContent = data.date;
  document.getElementById('season').textContent = data.season;
  document.getElementById('sunrise').textContent = data.sunrise;
  document.getElementById('sunset').textContent = data.sunset;
  document.getElementById('phase').textContent = data.phase;
  document.getElementById('temp').textContent = data.temperature != null ? `${Math.round(data.temperature)}\u00B0C` : '\u2014';
  document.getElementById('conditions').textContent = data.conditions || '\u2014';
}

function renderScene() {
  if (!location_) return;
  const data = render(ctx, W, H, location_, weatherData);
  if (data) updatePanel(data);

  const season = seasonOverride || getSeason(new Date(), location_.lat);
  if (season !== currentSeason) {
    currentSeason = season;
    updateSeason(season);
  }

  const intensity = weatherData ? weatherData.intensity : 0;
  if (intensity !== lastIntensity) {
    lastIntensity = intensity;
    spawnClouds(intensity);
  }

  const cover = intensity * 0.55;
  const c = Math.round(60 + cover * 40);
  weatherOverlay.style.background = `rgba(${c},${Math.round(c * 0.85)},${Math.round(c * 0.9)},${cover})`;
  lastRenderTime = performance.now();
}

function pollWeather() {
  fetchWeather(location_.lat, location_.lng).then(data => {
    if (!data) showError('Could not fetch weather data');
    weatherData = data;
    setRainIntensity(data ? data.intensity : 0);
    renderScene();
  });
}

fetch('default-location.json')
  .then(r => r.json())
  .then(loc => {
    location_ = loc;
    renderScene();
    pollWeather();
    pollIntervalId = setInterval(pollWeather, 600000);
  })
  .catch(() => {
    showError('Could not load location config, using fallback');
    location_ = { lat: -37.8142454, lng: 144.9631732, label: 'Melbourne' };
    renderScene();
  });

function mainLoop(time) {
  if (time - lastRenderTime >= RENDER_INTERVAL) {
    lastRenderTime = time;
    renderScene();
  }
  requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);

spawnClouds(0);
startClouds();
startMountains();

function resumeWeatherPolling() {
  seasonOverride = null;
  currentSeason = null;
  pollWeather();
  pollIntervalId = setInterval(pollWeather, 600000);
}

initDebug({
  getWeather: () => weatherData,
  applyWeather(data) {
    weatherData = data;
    setRainIntensity(data.intensity);
    renderScene();
  },
  getSeasonOverride: () => seasonOverride,
  setSeasonOverride(s) {
    seasonOverride = s;
    currentSeason = null;
  },
  onEnter() {
    if (pollIntervalId) { clearInterval(pollIntervalId); pollIntervalId = null; }
  },
  onExit() {
    resumeWeatherPolling();
  },
});

window.addEventListener('error', e => showError(e.message));
window.addEventListener('unhandledrejection', e => showError(e.reason?.message || 'Unhandled promise rejection'));
