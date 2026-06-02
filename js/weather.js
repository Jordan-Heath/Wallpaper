const API_URL = 'https://api.open-meteo.com/v1/forecast';

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

function cloudCoverFromWeather(current) {
  const code = current.weather_code;

  if (code >= 95) return 0.95;
  if (code >= 80) return 0.85;
  if (code >= 71) return 0.8;
  if (code >= 61) return 0.85;
  if (code >= 51) return 0.7;
  if (code === 45 || code === 48) return 0.8;
  if (code === 3) return 0.95;
  if (code === 2) return 0.5;
  if (code === 1) return 0.2;
  return 0;
}

function rainIntensityFromWeather(current) {
  const code = current.weather_code;
  const rain = current.rain || 0;

  if (rain > 0) return Math.min(rain / 8, 1);

  if (code >= 95) return 0.9;
  if (code >= 80) return 0.3 + (code - 80) * 0.3;
  if (code >= 71) return 0.3 + (code - 71) * 0.2;
  if (code >= 61) return 0.2 + (code - 61) * 0.25;
  if (code >= 51) return 0.1 + (code - 51) * 0.1;
  return 0;
}

export async function fetchWeather(lat, lng) {
  try {
    const url = `${API_URL}?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,rain,weather_code&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    const c = data.current;
    return {
      cloudCover: cloudCoverFromWeather(c),
      rainIntensity: rainIntensityFromWeather(c),
      temperature: c.temperature_2m,
      weatherCode: c.weather_code,
      description: WMO[c.weather_code] || 'Unknown',
    };
  } catch (e) {
    console.warn('Weather fetch failed:', e);
    return null;
  }
}
