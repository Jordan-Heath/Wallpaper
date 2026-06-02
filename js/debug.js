import { WMO } from './weather.js';

export function initDebug({
  getWeather,
  applyWeather,
  getSeasonOverride,
  setSeasonOverride,
  onEnter,
  onExit,
}) {
  const sortedCodes = Object.keys(WMO).map(Number).sort((a, b) => a - b);

  const panel = document.createElement('div');
  panel.id = 'dbgPanel';
  panel.innerHTML = `
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
    <label>Code <select id="dbgCode">${sortedCodes.map(c => `<option value="${c}">${c} \u2014 ${WMO[c]}</option>`).join('')}</select></label>
    <label>Season <select id="dbgSeason">
      <option value="">Auto</option>
      <option value="Spring">Spring</option>
      <option value="Summer">Summer</option>
      <option value="Autumn">Autumn</option>
      <option value="Winter">Winter</option>
    </select></label>
    <button id="dbgReset">Exit debug mode</button>
  `;
  document.body.appendChild(panel);

  const dbgIntensity = document.getElementById('dbgIntensity');
  const dbgIntVal = document.getElementById('dbgIntVal');
  const dbgTemp = document.getElementById('dbgTemp');
  const dbgCode = document.getElementById('dbgCode');
  const dbgSeason = document.getElementById('dbgSeason');
  const dbgReset = document.getElementById('dbgReset');

  let active = false;

  function apply() {
    setSeasonOverride(dbgSeason.value || null);
    applyWeather({
      intensity: parseFloat(dbgIntensity.value),
      temperature: parseFloat(dbgTemp.value),
      weatherCode: parseInt(dbgCode.value),
    });
  }

  dbgIntensity.addEventListener('input', () => {
    dbgIntVal.textContent = parseFloat(dbgIntensity.value).toFixed(2);
    apply();
  });
  dbgTemp.addEventListener('input', apply);
  dbgCode.addEventListener('change', apply);
  dbgSeason.addEventListener('change', apply);

  dbgReset.addEventListener('click', () => {
    if (active) toggle();
  });

  function toggle() {
    active = !active;
    if (active) {
      onEnter();
      const w = getWeather() || { intensity: 0, temperature: 15, weatherCode: 0 };
      dbgIntensity.value = w.intensity;
      dbgIntVal.textContent = w.intensity.toFixed(2);
      dbgTemp.value = w.temperature;
      dbgCode.value = w.weatherCode;
      dbgSeason.value = getSeasonOverride() || '';
      panel.style.display = 'block';
      apply();
    } else {
      setSeasonOverride(null);
      panel.style.display = 'none';
      onExit();
    }
  }

  document.addEventListener('keydown', e => {
    if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey) {
      toggle();
    }
  });
}
