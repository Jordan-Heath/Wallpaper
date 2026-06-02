import { sunTimesUTC, utcToLocalHour, fmtHour, getSeason } from './astro.js';

const seasonTint = {
  Spring: [120, 200, 140],
  Summer: [255, 220, 120],
  Autumn: [220, 140, 70],
  Winter: [150, 180, 230]
};

const skyDayTop = [90, 150, 235], skyDayBot = [175, 215, 255];
const skyGoldTop = [250, 160, 70], skyGoldBot = [255, 205, 130];
const skyNightTop = [20, 12, 45], skyNightBot = [60, 40, 90];

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

export function drawSun(ctx, x, y, twilight, W, H) {
  const r = Math.min(W, H) * 0.06;
  const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 4);
  const core = lerpColor([255, 245, 200], [255, 170, 80], twilight);
  glow.addColorStop(0, rgb(core, 0.9));
  glow.addColorStop(0.3, rgb(core, 0.35));
  glow.addColorStop(1, rgb(core, 0));
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgb(core);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

export function drawMoon(ctx, x, y, W, H) {
  const r = Math.min(W, H) * 0.045;
  const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3);
  glow.addColorStop(0, 'rgba(230,235,255,0.45)');
  glow.addColorStop(1, 'rgba(230,235,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8ecff';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(180,190,220,0.6)';
  ctx.beginPath(); ctx.arc(x - r*0.3, y - r*0.2, r*0.22, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r*0.35, y + r*0.25, r*0.16, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r*0.1, y - r*0.4, r*0.12, 0, Math.PI*2); ctx.fill();
}

export function drawStars(ctx, W, H) {
  if (!starField || starField.W !== W || starField.H !== H) {
    starField = { W, H, stars: [] };
    let seed = 12345;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 140; i++) {
      starField.stars.push({
        x: rnd() * W, y: rnd() * H * 0.7,
        r: rnd() * 1.4 + 0.3, a: rnd() * 0.6 + 0.3
      });
    }
  }
  for (const s of starField.stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
}

export function render(ctx, W, H, location_, weather) {
  const now = new Date();
  const { sunriseUTC, sunsetUTC } = sunTimesUTC(now, location_.lat, location_.lng);
  const sunrise = sunriseUTC == null ? null : utcToLocalHour(sunriseUTC, now);
  const sunset  = sunsetUTC  == null ? null : utcToLocalHour(sunsetUTC, now);

  const nowH = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const season = getSeason(now, location_.lat);

  let isDay, progress, phase, twilight = 0;
  if (sunrise != null && sunset != null && sunset > sunrise) {
    isDay = nowH >= sunrise && nowH <= sunset;
    if (isDay) {
      progress = (nowH - sunrise) / (sunset - sunrise);
      const edge = Math.min(progress, 1 - progress);
      twilight = Math.max(0, 1 - edge / 0.12);
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
    botC = lerpColor(skyDayBot, skyGoldBot, twilight);
  } else {
    topC = skyNightTop;
    botC = skyNightBot;
  }

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, rgb(topC));
  grad.addColorStop(1, rgb(botC));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (!isDay) drawStars(ctx, W, H);

  const horizonY = H * 0.78;
  const peakHeight = H * 0.62;
  const x = lerp(W * 0.92, W * 0.08, progress);
  const arc = 4 * progress * (1 - progress);
  const y = horizonY - peakHeight * arc;

  if (isDay) drawSun(ctx, x, y, twilight, W, H);
  else       drawMoon(ctx, x, y, W, H);

  let overlay, alpha;
  if (!isDay) {
    overlay = [80, 40, 140]; alpha = 0.32;
  } else if (twilight > 0) {
    overlay = [255, 120, 30]; alpha = 0.10 + 0.30 * twilight;
  } else {
    overlay = [255, 255, 255]; alpha = 0.04;
  }
  ctx.fillStyle = rgb(overlay, alpha);
  ctx.fillRect(0, 0, W, H);

  const st = seasonTint[season];
  ctx.fillStyle = rgb(st, 0.06);
  ctx.fillRect(0, 0, W, H);

  document.getElementById('loc').textContent = location_.label;
  document.getElementById('time').textContent = now.toLocaleTimeString();
  document.getElementById('date').textContent = now.toLocaleDateString();
  document.getElementById('season').textContent = season;
  document.getElementById('sunrise').textContent = fmtHour(sunrise);
  document.getElementById('sunset').textContent = fmtHour(sunset);
  document.getElementById('phase').textContent = phase;

  if (weather) {
    document.getElementById('temp').textContent = weather.temperature != null ? `${Math.round(weather.temperature)}°C` : '—';
    document.getElementById('conditions').textContent = weather.description || '—';
  } else {
    document.getElementById('temp').textContent = '—';
    document.getElementById('conditions').textContent = '—';
  }
}
