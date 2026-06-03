import { CONFIG } from './config.js';

const wCfg = CONFIG.weather;

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const RAIN_CODES = new Set([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82]);
const STORM_CODES = new Set([95, 96, 99]);

export const WMO = {
  0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Light snow showers', 86: 'Snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Severe thunderstorm',
};

export function cloudCoverFromWeather(current) {
  const code = current.weather_code;

  for (const [minCode, value] of wCfg.cloudCoverThresholds) {
    if (code >= minCode) return value;
  }
  if (wCfg.cloudCoverExact[code] != null) return wCfg.cloudCoverExact[code];
  return wCfg.cloudCoverDefault;
}

export function rainIntensityFromWeather(current) {
  const code = current.weather_code;
  const rain = current.rain || 0;

  if (SNOW_CODES.has(code)) return 0;

  if (rain > 0) return Math.min(rain / wCfg.rainMaxRatio, 1);

  for (const [minCode, baseValue] of wCfg.rainIntensityThresholds) {
    if (code >= minCode) {
      const factor = wCfg.rainIntensityFactors[minCode] || 0;
      return baseValue + (code - minCode) * factor;
    }
  }
  return 0;
}

export function snowIntensityFromWeather(current) {
  const code = current.weather_code;
  const snow = current.snowfall || 0;

  if (STORM_CODES.has(code)) return 0;
  if (RAIN_CODES.has(code)) return 0;

  if (snow > 0) return Math.min(snow / wCfg.snowMaxRatio, 1);

  for (const [minCode, baseValue] of wCfg.snowIntensityThresholds) {
    if (code >= minCode) {
      const factor = wCfg.snowIntensityFactors[minCode] || 0;
      return baseValue + (code - minCode) * factor;
    }
  }
  return 0;
}

export async function fetchWeather(lat, lng) {
  try {
    const url = `${wCfg.apiUrl}?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,rain,snowfall,weather_code&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    const c = data.current;
    return {
      cloudCover: cloudCoverFromWeather(c),
      rainIntensity: rainIntensityFromWeather(c),
      snowIntensity: snowIntensityFromWeather(c),
      temperature: c.temperature_2m,
      weatherCode: c.weather_code,
      description: WMO[c.weather_code] || 'Unknown',
    };
  } catch (e) {
    console.warn('Weather fetch failed:', e);
    return null;
  }
}
