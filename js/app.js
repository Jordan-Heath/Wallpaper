import { CONFIG } from './config.js';
import { render } from './draw.js';
import { getSeason } from './astro.js';
import { initRain, resize as resizeRain, setRainIntensity } from './rain.js';
import { fetchWeather } from './weather.js';
import { initClouds, spawnClouds, startClouds, stopClouds } from './clouds.js';
import { initMountains, updateSeason, startMountains, stopMountains } from './mountains.js';
import { initDebug } from './debug.js';
import { initParticles, setParticleSeason, startParticles, stopParticles } from './particles.js';

const { errorToast: errCfg, fallback: fbCfg, rainOverlay: roCfg } = CONFIG;

const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');

initRain(document.getElementById('rain'));
initClouds(document.getElementById('scene'));
initMountains(['mountains1', 'mountains2', 'hills1', 'hills2']);
initParticles(document.getElementById('scene'));

const rainOverlay = document.createElement('div');
rainOverlay.id = 'rain-overlay';
document.getElementById('scene').appendChild(rainOverlay);

let lastCloudCover = -1;
let lastRainIntensity = 0;
let lastRenderTime = 0;
let W, H;
let location_ = null;
let weatherData = null;
let pollIntervalId = null;
let currentSeason = null;
let seasonOverride = null;
let timeOverride = null;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  resizeRain();
  lastCloudCover = -1;
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
    background:rgba(${errCfg.bgColor[0]},${errCfg.bgColor[1]},${errCfg.bgColor[2]},${errCfg.bgOpacity});
    backdrop-filter:blur(${errCfg.backdropBlur});
    color:${errCfg.textColor}; padding:${errCfg.padding}; border-radius:${errCfg.borderRadius};
    font:${errCfg.fontSize} system-ui,sans-serif; max-width:${errCfg.maxWidth};
    box-shadow:0 4px ${errCfg.shadowBlur} rgba(0,0,0,${errCfg.shadowOpacity});
    animation: errIn 0.25s ease;
    pointer-events:auto;
  `;
  errorToast.appendChild(el);
  setTimeout(() => {
    el.style.transition = `opacity ${errCfg.fadeMs}ms, transform ${errCfg.fadeMs}ms`;
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), errCfg.fadeMs);
  }, errCfg.displayMs);
}



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
  let renderNow;
  if (timeOverride != null) {
    renderNow = new Date();
    const h = Math.floor(timeOverride);
    const m = Math.round((timeOverride - h) * 60);
    renderNow.setHours(h, m % 60, 0, 0);
  }
  const data = render(ctx, W, H, location_, weatherData, renderNow, weatherData ? weatherData.cloudCover : 0);
  if (data) updatePanel(data);

  const season = seasonOverride || getSeason(renderNow || new Date(), location_.lat);
  if (season !== currentSeason) {
    currentSeason = season;
    updateSeason(season);
    setParticleSeason(season);
  }

  const cloudCover = weatherData ? weatherData.cloudCover : 0;
  const rainIntensity = weatherData ? weatherData.rainIntensity : 0;
  if (cloudCover !== lastCloudCover) {
    lastCloudCover = cloudCover;
    spawnClouds(cloudCover);
  }

  const rainAlpha = rainIntensity * roCfg.intensityScaling;
  rainOverlay.style.background = `rgba(${roCfg.color[0]},${roCfg.color[1]},${roCfg.color[2]},${rainAlpha})`;

  lastRenderTime = performance.now();
}

function pollWeather() {
  fetchWeather(location_.lat, location_.lng).then(data => {
    if (!data) showError('Could not fetch weather data');
    weatherData = data;
    setRainIntensity(data ? data.rainIntensity : 0);
    renderScene();
  });
}

fetch('default-location.json')
  .then(r => r.json())
  .then(loc => {
    location_ = loc;
    renderScene();
    pollWeather();
    pollIntervalId = setInterval(pollWeather, CONFIG.weatherPollIntervalMs);
  })
  .catch(() => {
    showError('Could not load location config, using fallback');
    location_ = { lat: fbCfg.lat, lng: fbCfg.lng, label: fbCfg.label };
    renderScene();
  });

function mainLoop(time) {
  if (time - lastRenderTime >= CONFIG.renderInterval) {
    lastRenderTime = time;
    renderScene();
  }
  requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);

spawnClouds(0);
startClouds();
startMountains();
startParticles();

function resumeWeatherPolling() {
  seasonOverride = null;
  currentSeason = null;
  pollWeather();
  pollIntervalId = setInterval(pollWeather, CONFIG.weatherPollIntervalMs);
}

initDebug({
  getWeather: () => weatherData,
  applyWeather(data) {
    weatherData = data;
    setRainIntensity(data.rainIntensity);
    renderScene();
  },
  getSeasonOverride: () => seasonOverride,
  setSeasonOverride(s) {
    seasonOverride = s;
    currentSeason = null;
  },
  getTimeOverride: () => timeOverride,
  setTimeOverride(t) {
    timeOverride = t;
  },
  onEnter() {
    if (pollIntervalId) { clearInterval(pollIntervalId); pollIntervalId = null; }
  },
  onExit() {
    seasonOverride = null;
    timeOverride = null;
    currentSeason = null;
    resumeWeatherPolling();
  },
});

window.addEventListener('error', e => showError(e.message));
window.addEventListener('unhandledrejection', e => showError(e.reason?.message || 'Unhandled promise rejection'));
