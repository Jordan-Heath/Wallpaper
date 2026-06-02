import { CONFIG } from './config.js';
import { sunTimesUTC, utcToLocalHour, fmtHour, getSeason } from './astro.js';

const { seasonTints, cloudCover: cloudCfg } = CONFIG;
const {
  skyDayTop, skyDayBottom,
  skyGoldTop, skyGoldBottom,
  skyNightTop, skyNightBottom,
  horizonYRatio, peakHeightRatio,
  sunPathStart, sunPathEnd,
  twilightEdgeWidth,
  overlays, seasonTintAlpha,
} = CONFIG;
const sunCfg = CONFIG.sun;
const moonCfg = CONFIG.moon;
const starCfg = CONFIG.stars;

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t))
  ];
}

function rgb(c, a = 1) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

let starField = null;

export function drawSun(ctx, x, y, twilight, W, H, cloudCover) {
  const fade = 1 - cloudCover * cloudCfg.sunFadeFactor;
  const r = Math.min(W, H) * sunCfg.radiusRatio;
  const glow = ctx.createRadialGradient(x, y, r * sunCfg.glowCoreRadiusRatio, x, y, r * sunCfg.glowOuterRadiusRatio);
  const core = lerpColor(sunCfg.coreColorDay, sunCfg.coreColorTwilight, twilight);
  glow.addColorStop(0, rgb(core, sunCfg.coreOpacity * fade));
  glow.addColorStop(0.3, rgb(core, sunCfg.midGlowOpacity * fade));
  glow.addColorStop(1, rgb(core, sunCfg.edgeGlowOpacity * fade));
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, r * sunCfg.glowOuterRadiusRatio, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgb(core, fade);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

export function drawMoon(ctx, x, y, W, H, cloudCover) {
  const fade = 1 - cloudCover * cloudCfg.moonFadeFactor;
  const r = Math.min(W, H) * moonCfg.radiusRatio;
  const glow = ctx.createRadialGradient(x, y, r * moonCfg.glowInnerRadiusRatio, x, y, r * moonCfg.glowOuterRadiusRatio);
  glow.addColorStop(0, rgb(moonCfg.glowColor, moonCfg.glowCoreOpacity * fade));
  glow.addColorStop(1, rgb(moonCfg.glowColor, moonCfg.glowEdgeOpacity * fade));
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, r * moonCfg.glowOuterRadiusRatio, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = moonCfg.bodyColor;
  ctx.globalAlpha = fade;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = rgb(moonCfg.craterColor, moonCfg.craterOpacity * fade);
  for (const c of moonCfg.craters) {
    ctx.beginPath(); ctx.arc(x + c.dx * r, y + c.dy * r, r * c.dr, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawStars(ctx, W, H) {
  if (!starField || starField.W !== W || starField.H !== H) {
    starField = { W, H, stars: [] };
    let seed = Date.now();
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < starCfg.count; i++) {
      starField.stars.push({
        x: rnd() * W, y: rnd() * H * starCfg.heightLimit,
        r: rnd() * starCfg.radiusRange + starCfg.radiusMin,
        a: rnd() * starCfg.alphaRange + starCfg.alphaMin,
      });
    }
  }
  for (const s of starField.stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
}

export function render(ctx, W, H, location_, weather, nowOverride, cloudCover = 0) {
  const now = nowOverride || new Date();
  const { sunriseUTC, sunsetUTC } = sunTimesUTC(now, location_.lat, location_.lng);
  const sunrise = sunriseUTC == null ? null : utcToLocalHour(sunriseUTC, now);
  const sunset = sunsetUTC == null ? null : utcToLocalHour(sunsetUTC, now);

  const nowH = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const season = getSeason(now, location_.lat);

  let isDay, progress, phase, twilight = 0;
  if (sunrise != null && sunset != null && sunset > sunrise) {
    isDay = nowH >= sunrise && nowH <= sunset;
    if (isDay) {
      progress = (nowH - sunrise) / (sunset - sunrise);
      const edge = Math.min(progress, 1 - progress);
      twilight = Math.max(0, 1 - edge / twilightEdgeWidth);
    } else {
      let nightLen, since;
      if (nowH > sunset) { since = nowH - sunset; nightLen = 24 - sunset + sunrise; }
      else { since = nowH + (24 - sunset); nightLen = 24 - sunset + sunrise; }
      progress = since / nightLen;
    }
  } else {
    isDay = sunrise != null;
    progress = nowH / 24;
  }

  if (isDay) {
    phase = twilight > 0.4 ? (progress < 0.5 ? 'Sunrise' : 'Sunset') : 'Daytime';
  } else {
    phase = 'Night';
  }

  let topC, botC;
  if (isDay) {
    topC = lerpColor(skyDayTop, skyGoldTop, twilight);
    botC = lerpColor(skyDayBottom, skyGoldBottom, twilight);
  } else {
    topC = skyNightTop;
    botC = skyNightBottom;
  }

  if (cloudCover > 0) {
    topC = lerpColor(topC, cloudCfg.skyGrayTop, cloudCover);
    botC = lerpColor(botC, cloudCfg.skyGrayBottom, cloudCover);
  }

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, rgb(topC));
  grad.addColorStop(1, rgb(botC));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (!isDay) drawStars(ctx, W, H);

  const horizonY = H * horizonYRatio;
  const peakHeight = H * peakHeightRatio;
  const x = lerp(W * sunPathStart, W * sunPathEnd, progress);
  const y = horizonY - (4 * progress * (1 - progress)) * peakHeight;

  if (isDay) drawSun(ctx, x, y, twilight, W, H, cloudCover);
  else drawMoon(ctx, x, y, W, H, cloudCover);

  let overlay, alpha;
  if (!isDay) {
    overlay = overlays.night.color; alpha = overlays.night.alpha;
  } else if (twilight > 0) {
    overlay = overlays.twilight.color;
    alpha = overlays.twilight.baseAlpha + overlays.twilight.twilightAlphaFactor * twilight;
  } else {
    overlay = overlays.day.color; alpha = overlays.day.alpha;
  }
  ctx.fillStyle = rgb(overlay, alpha);
  ctx.fillRect(0, 0, W, H);

  const st = seasonTints[season];
  ctx.fillStyle = rgb(st, seasonTintAlpha);
  ctx.fillRect(0, 0, W, H);

  return {
    location: location_.label,
    time: now.toLocaleTimeString(),
    date: now.toLocaleDateString(),
    season,
    sunrise: fmtHour(sunrise),
    sunset: fmtHour(sunset),
    phase,
    temperature: weather?.temperature,
    conditions: weather?.description,
  };
}
