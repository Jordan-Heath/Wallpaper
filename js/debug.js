import { CONFIG } from './config.js';
import { WMO, cloudCoverFromWeather, rainIntensityFromWeather, snowIntensityFromWeather } from './weather.js';
import { lightningIntensityFromCode } from './lightning.js';

const dCfg = CONFIG.debug;

function fmtTimeH(h) {
  const hr = Math.floor(h);
  const mn = Math.round((h - hr) * 60);
  return `${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
}

export function initDebug({
  getWeather,
  applyWeather,
  getSeasonOverride,
  setSeasonOverride,
  getTimeOverride,
  setTimeOverride,
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
        background:${dCfg.bg}; backdrop-filter:blur(${dCfg.backdropBlur});
        color:${dCfg.textColor}; padding:${dCfg.padding}; border-radius:${dCfg.borderRadius};
        font:13px system-ui,sans-serif; width:${dCfg.width};
        display:none; box-shadow:${dCfg.shadow};
      }
      #dbgPanel h3 { margin:0 0 10px; font-size:14px; letter-spacing:.5px; }
      #dbgPanel label { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:8px; }
      #dbgPanel input, #dbgPanel select {
        background:${dCfg.inputBg}; color:${dCfg.inputColor}; border:${dCfg.inputBorder};
        border-radius:${dCfg.inputBorderRadius}; padding:3px 8px; font:inherit; width:110px;
      }
      #dbgPanel input[type=range] { width:110px; padding:0; border:none; background:none; accent-color:${dCfg.accentColor}; }
      #dbgPanel .dbg-val { min-width:30px; text-align:right; }
      #dbgReset {
        width:100%; margin-top:6px; padding:6px; border:none; border-radius:6px;
        background:${dCfg.buttonBg}; color:${dCfg.buttonColor}; font-weight:600; cursor:pointer;
      }
      #dbgReset:hover { background:${dCfg.buttonHoverBg}; }
    </style>
    <h3>Weather Debug <span style="font-weight:400;font-size:11px;color:#999">[D]</span></h3>
    <label>Code <select id="dbgCode">
      <option value="">Custom</option>
      ${sortedCodes.map(c => `<option value="${c}">${c} \u2014 ${WMO[c]}</option>`).join('')}
    </select></label>
    <label>Cloud Cover <span style="display:flex;align-items:center;gap:4px;width:110px">
      <input type="range" id="dbgCloudCover" min="0" max="1" step="0.05" value="0">
      <span class="dbg-val" id="dbgCCVal">0.00</span>
    </span></label>
    <label>Rain Intensity <span style="display:flex;align-items:center;gap:4px;width:110px">
      <input type="range" id="dbgRainIntensity" min="0" max="1" step="0.05" value="0">
      <span class="dbg-val" id="dbgRainVal">0.00</span>
    </span></label>
    <label>Snow Intensity <span style="display:flex;align-items:center;gap:4px;width:110px">
      <input type="range" id="dbgSnowIntensity" min="0" max="1" step="0.05" value="0">
      <span class="dbg-val" id="dbgSnowVal">0.00</span>
    </span></label>
    <label>Lightning <span style="display:flex;align-items:center;gap:4px;width:110px">
      <input type="range" id="dbgLightning" min="0" max="1" step="0.05" value="0">
      <span class="dbg-val" id="dbgLVal">0.00</span>
    </span></label>
    <label>Season <select id="dbgSeason">
      <option value="">Auto</option>
      <option value="Spring">Spring</option>
      <option value="Summer">Summer</option>
      <option value="Autumn">Autumn</option>
      <option value="Winter">Winter</option>
    </select></label>
    <label>Time <span style="display:flex;align-items:center;gap:4px;width:110px">
      <input type="range" id="dbgTime" min="0" max="24" step="0.05" value="12">
      <span class="dbg-val" id="dbgTimeVal">12:00</span>
    </span></label>
    <button id="dbgReset">Exit debug mode</button>
  `;
  document.body.appendChild(panel);

  const dbgCloudCover = document.getElementById('dbgCloudCover');
  const dbgCCVal = document.getElementById('dbgCCVal');
  const dbgRainIntensity = document.getElementById('dbgRainIntensity');
  const dbgRainVal = document.getElementById('dbgRainVal');
  const dbgLightning = document.getElementById('dbgLightning');
  const dbgLVal = document.getElementById('dbgLVal');
  const dbgSnowIntensity = document.getElementById('dbgSnowIntensity');
  const dbgSnowVal = document.getElementById('dbgSnowVal');
  const dbgCode = document.getElementById('dbgCode');
  const dbgSeason = document.getElementById('dbgSeason');
  const dbgTime = document.getElementById('dbgTime');
  const dbgTimeVal = document.getElementById('dbgTimeVal');
  const dbgReset = document.getElementById('dbgReset');

  let active = false;

  function apply() {
    setSeasonOverride(dbgSeason.value || null);
    const current = getWeather() || {};
    const isCustom = dbgCode.value === '';
    dbgCloudCover.disabled = !isCustom;
    dbgRainIntensity.disabled = !isCustom;
    dbgSnowIntensity.disabled = !isCustom;
    dbgLightning.disabled = !isCustom;
    if (isCustom) {
      applyWeather({
        cloudCover: parseFloat(dbgCloudCover.value),
        rainIntensity: parseFloat(dbgRainIntensity.value),
        snowIntensity: parseFloat(dbgSnowIntensity.value),
        lightningIntensity: parseFloat(dbgLightning.value),
        temperature: current.temperature,
        weatherCode: 0,
        description: 'Custom',
      });
    } else {
      const code = parseInt(dbgCode.value);
      const computed = {
        cloudCover: cloudCoverFromWeather({ weather_code: code, rain: 0 }),
        rainIntensity: rainIntensityFromWeather({ weather_code: code, rain: 0 }),
        snowIntensity: snowIntensityFromWeather({ weather_code: code, snowfall: 0 }),
        lightningIntensity: lightningIntensityFromCode(code),
      };
      dbgCloudCover.value = computed.cloudCover;
      dbgCCVal.textContent = computed.cloudCover.toFixed(2);
      dbgRainIntensity.value = computed.rainIntensity;
      dbgRainVal.textContent = computed.rainIntensity.toFixed(2);
      dbgSnowIntensity.value = computed.snowIntensity;
      dbgSnowVal.textContent = computed.snowIntensity.toFixed(2);
      dbgLightning.value = computed.lightningIntensity;
      dbgLVal.textContent = computed.lightningIntensity.toFixed(2);
      applyWeather({
        cloudCover: computed.cloudCover,
        rainIntensity: computed.rainIntensity,
        snowIntensity: computed.snowIntensity,
        lightningIntensity: computed.lightningIntensity,
        temperature: current.temperature,
        weatherCode: code,
        description: WMO[code] || 'Unknown',
      });
    }
  }

  dbgCloudCover.addEventListener('input', () => {
    dbgCCVal.textContent = parseFloat(dbgCloudCover.value).toFixed(2);
    apply();
  });
  dbgRainIntensity.addEventListener('input', () => {
    dbgRainVal.textContent = parseFloat(dbgRainIntensity.value).toFixed(2);
    apply();
  });
  dbgSnowIntensity.addEventListener('input', () => {
    dbgSnowVal.textContent = parseFloat(dbgSnowIntensity.value).toFixed(2);
    apply();
  });
  dbgLightning.addEventListener('input', () => {
    dbgLVal.textContent = parseFloat(dbgLightning.value).toFixed(2);
    apply();
  });
  dbgCode.addEventListener('change', () => {
    const isCustom = dbgCode.value === '';
    dbgCloudCover.disabled = !isCustom;
    dbgRainIntensity.disabled = !isCustom;
    dbgSnowIntensity.disabled = !isCustom;
    dbgLightning.disabled = !isCustom;
    apply();
  });
  dbgSeason.addEventListener('change', apply);

  dbgTime.addEventListener('input', () => {
    dbgTimeVal.textContent = fmtTimeH(parseFloat(dbgTime.value));
    setTimeOverride(parseFloat(dbgTime.value));
    apply();
  });

  dbgReset.addEventListener('click', () => {
    if (active) toggle();
  });

  function toggle() {
    active = !active;
    if (active) {
      onEnter();
      const w = getWeather() || { cloudCover: 0, rainIntensity: 0, snowIntensity: 0, lightningIntensity: 0, temperature: 15, weatherCode: 0 };
      dbgCloudCover.value = w.cloudCover;
      dbgCCVal.textContent = w.cloudCover.toFixed(2);
      dbgRainIntensity.value = w.rainIntensity;
      dbgRainVal.textContent = w.rainIntensity.toFixed(2);
      dbgSnowIntensity.value = w.snowIntensity != null ? w.snowIntensity : 0;
      dbgSnowVal.textContent = parseFloat(dbgSnowIntensity.value).toFixed(2);
      dbgLightning.value = w.lightningIntensity != null ? w.lightningIntensity : lightningIntensityFromCode(w.weatherCode || 0);
      dbgLVal.textContent = parseFloat(dbgLightning.value).toFixed(2);
      dbgCode.value = w.weatherCode;
      dbgSeason.value = getSeasonOverride() || '';
      const override = getTimeOverride();
      if (override != null) {
        dbgTime.value = override;
        dbgTimeVal.textContent = fmtTimeH(override);
      } else {
        const now = new Date();
        const h = now.getHours() + now.getMinutes() / 60;
        dbgTime.value = h;
        dbgTimeVal.textContent = fmtTimeH(h);
        setTimeOverride(h);
      }
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
