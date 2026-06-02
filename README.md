# Sky Canvas

A real-time sky simulation that renders the sun, moon, stars, clouds, rain, and mountain landscapes based on your geographic location, the current time, and live weather data. Zero dependencies — just a browser and a static file server.

## How It Works

The application is a single-page, vanilla JavaScript app that runs entirely in the browser. It loads a default location from `default-location.json` (Melbourne, Australia), fetches live weather from the [Open-Meteo API](https://open-meteo.com/), and renders the scene onto two `<canvas>` elements and four `<div>` layers of mountain/hill SVGs.

### Architecture

```
default-location.json ──> app.js (orchestrator)
                               │
            ┌───────────────────┼───────────────────┐
            │          ┌────────┼────────┐          │
       weather.js  astro.js   draw.js  debug.js
       (Open-Meteo) (astronomy) (canvas) (debug UI)
            │          │          │          │
       clouds.js  rain.js   mountains.js    │
       (images)  (particles) (parallax)     │
            │          │          │          │
            └──────────┴──────────┴──────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                 HTML Canvas     DOM layers
                                 (SVGs, overlay)
```

## Update & Refresh Mechanisms

The application uses three concurrent update loops, each running at a different cadence.

### 1. Main Render Loop — ~1 fps via requestAnimationFrame

Throttled inside the rAF callback to run at most once per second:

```js
function mainLoop(time) {
  if (time - lastRenderTime >= 1000) {
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
- **Update the info panel** DOM elements with current local time, date, season, sunrise/sunset times, day phase, temperature, and weather conditions.

This ensures smooth second-by-second updates of the clock and celestial positions.

### 2. Weather Polling — every 10 minutes

```js
pollIntervalId = setInterval(pollWeather, 600000);
```

Calls the Open-Meteo API every 10 minutes to fetch:

- `temperature_2m`
- `precipitation`
- `rain`
- `weather_code`

On success, it updates the global `weatherData` object, which triggers:

- **Rain particles** — `setRainIntensity()` adjusts the target drop count (0–300 drops). If intensity drops to zero, the particle loop stops and the canvas clears.
- **Cloud spawning** — `spawnClouds(intensity)` removes all existing cloud `<img>` elements and creates new ones. Higher intensity produces more clouds with lower opacity/brightness.
- **Weather overlay** — a semi-transparent `<div>` tint's the scene grey based on cloud intensity.
- **Info panel** — temperature and conditions text update immediately.

### 3. Continuous Animation Loops — ~60 fps (requestAnimationFrame)

Three independent `requestAnimationFrame` loops run concurrently for smooth motion:

| Loop | What It Animates |
|---|---|
| `clouds.js` (`startClouds`) | Each cloud `<img>` drifts left at its own speed. When it exits the left edge, it resets to the right at a random height. |
| `mountains.js` (`startMountains`) | Four mountain/hill layers oscillate sinusoidally with increasing amplitude (6px → 30px) for a parallax depth effect. Amplitude scales with viewport width. |
| `rain.js` (`initRain` / `loop`) | Rain particles fall diagonally, wrapping top-to-bottom. Active only when intensity > 0. Drop count, speed, opacity, and line width all scale with intensity. |

### 4. Resize Handling

```js
window.addEventListener('resize', resize);
```

On window resize, canvas dimensions update, the rain canvas resizes, cloud state resets, and a full re-render occurs.

### 5. Seasonal Transitions

Inside `renderScene()`, the current season is compared against `currentSeason`. When it changes (e.g., Spring → Summer), `updateSeasonalLayers(season)` swaps the `background-image` on all four mountain/hill `<div>` elements to the corresponding SVGs (e.g., `images/mountains1-summer.svg`). This requires no page reload.

### 6. Debug Mode

Press **`D`** to toggle debug mode, which:

- Pauses weather polling.
- Provides sliders/dropdowns to manually override rain intensity (0–1), temperature, WMO weather code, and season.
- Clicking "Exit debug mode" resumes normal operation.

## Layers (z-order)

| Layer | Element | z-index |
|---|---|---|
| Sky gradient + sun/moon/stars | `#sky` canvas | 0 |
| Mountains (far) | `#mountains1` | 1 |
| Mountains (near) | `#mountains2` | 2 |
| Hills (far) | `#hills1` | 3 |
| Weather overlay + clouds | dynamic `<div>` + `<img>` | 3–5 |
| Hills (near) | `#hills2` | 4 |
| Rain particles | `#rain` canvas | 6 |
| Info panel | `#panel` | 50 |
| Debug panel | dynamic | 100 |

## Getting Started

```bash
PORT=8080 python3 -m http.server 8080 --bind 127.0.0.1
```

Then open `http://localhost:8080`.

No build step, no package install, no API key required.

## Configuration

- **`default-location.json`** — change the default latitude, longitude, and display label.
- **`PORT`** environment variable — set a custom server port (default: 8080).

## Files

| File | Role |
|---|---|
| `index.html` | Entry point, canvas/layout |
| `styles.css` | Full-screen layout, z-index layering |
| `js/app.js` | Orchestrator — initializes modules, polls weather, coordinates seasons, error toasts |
| `js/astro.js` | Astronomical calculations — sun times, seasons, day-of-year |
| `js/draw.js` | Canvas rendering — sky gradient, sun, moon, stars, info panel |
| `js/rain.js` | Rain particle system |
| `js/weather.js` | Open-Meteo API client, WMO code lookup |
| `js/clouds.js` | Cloud image spawning and horizontal drift animation |
| `js/mountains.js` | Mountain/hill parallax oscillation animation |
| `js/debug.js` | Debug panel — weather & season overrides |
| `images/*.svg` | Seasonal mountain, hill, and cloud assets |
