# Sky Canvas

A real-time sky simulation that renders the sun, moon, stars, clouds, rain, snow, lightning, birds, wind, and seasonal foliage based on your geographic location, the current time, and live weather data. Zero dependencies — just a browser and a static file server.

## How It Works

The application is a single-page vanilla JS app that runs entirely in the browser using ES modules (`<script type="module">`). It loads a default location from `default-location.json` (Melbourne, Australia), fetches live weather from the [Open-Meteo API](https://open-meteo.com/), and renders the scene onto five `<canvas>` elements, four `<div>` layers of mountain/hill SVGs, and several dynamically created DOM elements.

### Architecture

```
default-location.json ──> app.js (orchestrator)
                                │
           ┌────────────────────┼────────────────────┐
           │        ┌──────────┼──────────┐          │
       weather.js astro.js   draw.js   config.js
      (Open-Meteo) (astronomy) (canvas)  (constants)
           │          │          │          │
      ┌────┼────┐     │     ┌────┼────┐     │
  clouds.js rain.js snow.js  │  birds.js   │
  (images) (drops) (flakes)  │  (summer)   │
           │          │      │       │      │
  lightning.js particles.js  │ winter-wind.js │
  (flashes) (leaves/petals)  │ (winter)      │
           │          │      │       │      │
           └──────────┴──────┴───────┴──────┘
                                │
                      ┌─────────┴─────────┐
                      │                   │
                  5x Canvases      DOM layers
                  (sky, rain,    (SVGs, clouds,
                   snow, birds,   particles,
                   wind)          overlays)
```

## Update & Refresh Mechanisms

The application uses several concurrent update loops, each running at a different cadence.

### 1. Main Render Loop — ~1 fps via requestAnimationFrame

Throttled inside the rAF callback to run at most once per second (interval set in `config.js`):

```js
function mainLoop(time) {
  if (time - lastRenderTime >= CONFIG.renderInterval) {
    lastRenderTime = time;
    renderScene();
  }
  requestAnimationFrame(mainLoop);
}
```

Called (at most) every second to:

- **Re-read the current time** via `new Date()` inside `draw.js:render()`.
- **Recalculate sun/moon position** along a parabolic arc across the sky.
- **Recompute twilight** (0–1) near sunrise/sunset, which shifts sky gradient colors between blue/gold (day), warm orange (twilight), and dark purple (night).
- **Redraw the entire sky** gradient, all 140 stars (night only), and the sun or moon with radial glow.
- **Apply cloud cover desaturation** to the sky gradient and fade the sun/moon.
- **Apply season tint overlay** (subtle color shift per season).
- **Check for season changes** — when the season flips, the mountain SVGs, particle type, bird activity, and winter wind all switch.
- **Spawn or respawn clouds** when cloud cover changes.
- **Update the info panel** DOM elements with current local time, date, season, sunrise/sunset times, day phase, temperature, and weather conditions.

This ensures smooth second-by-second updates of the clock and celestial positions.

### 2. Weather Polling — every 10 minutes

```js
pollIntervalId = setInterval(pollWeather, CONFIG.weatherPollIntervalMs);
```

Calls the Open-Meteo API every 10 minutes to fetch:

- `temperature_2m`
- `precipitation`
- `rain`
- `snowfall`
- `weather_code`

On success, it updates the global `weatherData` object, which triggers:

- **Rain particles** — `setRainIntensity()` adjusts target drop count (0–300). If intensity drops to zero, the particle loop stops and the canvas clears.
- **Snow particles** — `setSnowIntensity()` adjusts target flake count (0–400). Same start/stop behaviour as rain.
- **Cloud spawning** — `spawnClouds(intensity)` removes all existing cloud `<img>` elements and creates new ones. Higher intensity produces more clouds with lower opacity/brightness.
- **Lightning** — `setThunderstormIntensity()` reads the WMO code and schedules random lightning flashes with bolt SVGs for thunderstorms (codes 95+).
- **Rain overlay** — a semi-transparent blue/purple `<div>` tint that scales with rain intensity.
- **Snow overlay** — a semi-transparent white/blue `<div>` tint that scales with snow intensity.
- **Info panel** — temperature and conditions text update immediately.

### 3. Continuous Animation Loops — ~60 fps (requestAnimationFrame)

Multiple independent `requestAnimationFrame` loops run concurrently for smooth motion:

| Loop | What It Animates |
|---|---|
| `clouds.js` (`startClouds`) | Each cloud `<img>` drifts left at its own speed. When it exits the left edge, it resets to the right at a random height. |
| `mountains.js` (`startMountains`) | Four mountain/hill layers oscillate sinusoidally with parallax amplitude (scales with viewport width). |
| `rain.js` (`initRain` / `loop`) | Rain particles fall diagonally, wrapping top-to-bottom. Active only when intensity > 0. |
| `snow.js` (`initSnow` / `loop`) | Snow flakes drift down with sinusoidal sway, wrapping top-to-bottom. Active only when intensity > 0. |
| `birds.js` (`initBirds` / `loop`) | Birds fly across the screen with flapping wings. Active only in Summer. |
| `winter-wind.js` (`initWinterWind` / `loop`) | Semi-transparent sine wave lines drift across the screen. Active only in Winter. |

### 4. Particles (DOM-based) — Autumn leaves & Spring petals

`particles.js` creates DOM `<div>` elements that drift and tumble across the scene:

- **Autumn** — falling leaves with brown/orange colours, leaf-shaped elements.
- **Spring** — falling cherry blossom petals with pink colours, rounded elements.
- **Summer/Winter** — no particles.

Each particle has velocity, gravity, updrafts, sinusoidal sway, and rotation. They wrap around all edges.

### 5. Lightning (timer-based)

`lightning.js` uses `setTimeout` to schedule random lightning strikes during thunderstorms (WMO codes 95+):

- A full-screen white flash `<div>` fades in then out.
- A random lightning bolt SVG (`lightning1.svg`–`lightning3.svg`) appears at a random position and fades out.
- Bolts randomly render either in front of or behind the mountain layers.
- Strike interval shortens as thunderstorm severity increases.

### 6. Resize Handling

```js
window.addEventListener('resize', resize);
```

On window resize, all canvas dimensions update, cloud state resets, and a full re-render occurs.

### 7. Seasonal Transitions

Inside `renderScene()`, the current season is compared against `currentSeason`. When it changes:

- **Mountain SVGs** — `updateSeason(season)` swaps the `background-image` on all four mountain/hill layers (e.g., `images/mountains1-summer.svg`).
- **Particles** — `setParticleSeason(season)` clears existing particles and spawns leaves (Autumn) or petals (Spring).
- **Birds** — `setBirdsActive(season === 'Summer')` starts or stops the bird animation.
- **Winter wind** — `setWinterWindActive(season === 'Winter')` starts or stops the wind animation.
- **Season tint** — a subtle colour overlay shifts the sky gradient hue (greenish for Spring, warm for Summer, orange for Autumn, blue for Winter).

### 8. Debug Mode

Press **`D`** to toggle debug mode, which:

- Pauses weather polling.
- Provides sliders for rain intensity (0–1), snow intensity (0–1), cloud cover (0–1), and lightning intensity (0–1).
- Provides a dropdown of WMO weather codes — selecting one auto-fills the sliders.
- Provides a season override dropdown (Spring/Summer/Autumn/Winter/Auto).
- Provides a time-of-day slider (0–24) to preview any time of day.
- Persists the debug panel state across page reloads via `localStorage`.
- Clicking **"Exit debug mode"** or pressing **`D`** again clears overrides and resumes normal operation.

## Layers (z-order)

| Layer | Element | z-index |
|---|---|---|
| Sky gradient + sun/moon/stars | `#sky` canvas | 0 |
| Lightning bolt (behind) | `.lightning-bolt` | 2 |
| Clouds + particles + birds + wind | dynamic `<div>` + `<canvas>` | 3–5 |
| Mountains (far) | `#mountains1` | 1 |
| Mountains (near) | `#mountains2` | 2 |
| Hills (far) | `#hills1` | 3 |
| Snow/rain overlays + particles | dynamic `<div>` | 4–5 |
| Hills (near) | `#hills2` | 4 |
| Rain particles | `#rain` canvas | 6 |
| Snow particles | `#snow` canvas | 6 |
| Lightning flash | `#lightning-flash` | 7 |
| Lightning bolt (front) | `.lightning-bolt` | 8 |
| Info panel | `#panel` | 50 |
| Debug panel | `#dbgPanel` | 100 |

## Getting Started

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Then open `http://localhost:8080`.

No build step, no package install, no API key required.

## Configuration

- **`default-location.json`** — change the default latitude, longitude, and display label.
- **`js/config.js`** — central configuration for every visual parameter: sky colours, sun/moon size and glow, star count, rain/snow drop counts and speeds, cloud density and animation, particle behaviour, mountain parallax, bird/wind settings, lightning intervals, weather mapping thresholds, overlay colours, debug panel styles, and error toast styling.

## Files

| File | Role |
|---|---|
| `index.html` | Entry point, 5 canvases + 4 mountain layers + info panel |
| `styles.css` | Full-screen layout, z-index layering, CSS variables |
| `js/config.js` | Central configuration — all visual & behavioural constants |
| `js/app.js` | Orchestrator — initializes modules, polls weather, coordinates seasons, error toasts |
| `js/astro.js` | Astronomical calculations — sun times, seasons, day-of-year |
| `js/draw.js` | Canvas rendering — sky gradient, sun, moon, stars, info panel |
| `js/weather.js` | Open-Meteo API client, WMO code lookup, intensity mapping |
| `js/clouds.js` | Cloud image spawning and horizontal drift animation |
| `js/rain.js` | Rain particle system (canvas) |
| `js/snow.js` | Snow particle system (canvas) |
| `js/mountains.js` | Mountain/hill parallax oscillation animation |
| `js/birds.js` | Bird silhouettes with flapping wings (Summer) |
| `js/winter-wind.js` | Winter wind sine-wave streaks (Winter) |
| `js/particles.js` | Falling leaves (Autumn) and cherry blossom petals (Spring) |
| `js/lightning.js` | Lightning flash + bolt SVG for thunderstorms |
| `js/debug.js` | Debug panel — weather, season, and time overrides |
| `images/*.svg` | Seasonal mountain/hill SVGs, cloud variants, lightning bolts |
