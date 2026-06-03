export const CONFIG = {
  // ====================================================================
  // RENDER LOOP
  // ====================================================================
  renderInterval: 1000,

  // ====================================================================
  // LAYOUT — horizon, sun/moon path
  // ====================================================================
  horizonYRatio: 0.78,
  peakHeightRatio: 0.62,
  sunPathStart: 0.92,
  sunPathEnd: 0.08,

  // ====================================================================
  // SKY GRADIENT COLORS  (RGB 0‑255)
  // ====================================================================
  skyDayTop: [90, 150, 235],
  skyDayBottom: [175, 215, 255],
  skyGoldTop: [250, 160, 70],
  skyGoldBottom: [255, 205, 130],
  skyNightTop: [20, 12, 45],
  skyNightBottom: [60, 40, 90],

  // ====================================================================
  // SEASON TINT OVERLAY COLORS  (RGB)
  // ====================================================================
  seasonTints: {
    Spring: [120, 200, 140],
    Summer: [255, 220, 120],
    Autumn: [220, 140, 70],
    Winter: [150, 180, 230],
  },
  seasonTintAlpha: 0.06,

  // ====================================================================
  // SCENE OVERLAYS  (night / twilight / day tint)
  // ====================================================================
  overlays: {
    night:   { color: [80, 40, 140],   alpha: 0.32 },
    twilight:{ color: [255, 120, 30],  baseAlpha: 0.10, twilightAlphaFactor: 0.30 },
    day:     { color: [255, 255, 255], alpha: 0.04 },
  },

  // ====================================================================
  // TWILIGHT
  // ====================================================================
  twilightEdgeWidth: 0.12,

  // ====================================================================
  // SUN
  // ====================================================================
  sun: {
    radiusRatio: 0.06,
    glowCoreRadiusRatio: 0.4,
    glowOuterRadiusRatio: 4,
    coreOpacity: 0.9,
    midGlowOpacity: 0.35,
    edgeGlowOpacity: 0,
    coreColorDay: [255, 245, 200],
    coreColorTwilight: [255, 170, 80],
  },

  // ====================================================================
  // MOON
  // ====================================================================
  moon: {
    radiusRatio: 0.045,
    glowInnerRadiusRatio: 0.5,
    glowOuterRadiusRatio: 3,
    glowColor: [230, 235, 255],
    glowCoreOpacity: 0.45,
    glowEdgeOpacity: 0,
    bodyColor: '#e8ecff',
    craterColor: [180, 190, 220],
    craterOpacity: 0.6,
    craters: [
      { dx: -0.30, dy: -0.20, dr: 0.22 },
      { dx:  0.35, dy:  0.25, dr: 0.16 },
      { dx:  0.10, dy: -0.40, dr: 0.12 },
    ],
  },

  // ====================================================================
  // STARS
  // ====================================================================
  stars: {
    count: 140,
    heightLimit: 0.7,
    radiusMin: 0.3,
    radiusRange: 1.4,
    alphaMin: 0.3,
    alphaRange: 0.6,
  },

  // ====================================================================
  // RAIN OVERLAY  (blue/purple tint that fades in when it rains)
  // ====================================================================
  rainOverlay: {
    color: [70, 60, 165],
    intensityScaling: 0.35,
  },

  // ====================================================================
  // CLOUD COVER VISUALS  (sky desaturation + sun/moon fade instead of
  // a coloured overlay over the whole scene)
  // ====================================================================
  cloudCover: {
    skyGrayTop: [130, 130, 130],
    skyGrayBottom: [190, 190, 190],
    sunFadeFactor: 0.85,
    moonFadeFactor: 0.3,
  },

  // ====================================================================
  // CLOUDS
  // ====================================================================
  clouds: {
    baseWidth: 200,
    scaleMin: 1,
    scaleRange: 0.7,
    brightnessDrop: 40,
    initialXSpread: 400,
    initialXOffset: -200,
    yLimit: 0.35,
    yOffset: -40,
    opacityBase: 0.5,
    opacityIntensityFactor: 0.45,
    speedMin: 0.15,
    speedRange: 0.45,
    zIndex: 3,
    countPerIntensity: 100,
    minCount: 2,
    wrapLeft: -250,
    wrapResetRight: 50,
  },

  // ====================================================================
  // RAIN
  // ====================================================================
  rain: {
    maxDropsPerIntensity: 300,
    dropLenMin: 8,
    dropLenRange: 14,
    dropSpeedMin: 5,
    dropSpeedRange: 8,
    dropOpacityMin: 0.15,
    dropOpacityRange: 0.35,
    driftBase: -1.5,
    driftRandom: 0.5,
    color: [70, 140, 255],
    lineWidthBase: 1,
    lineWidthIntensityFactor: 0.5,
    diagonalOffsetBase: 3,
    diagonalOffsetIntensityFactor: 2,
    wrapBottom: 10,
    wrapLeft: -20,
  },

  // ====================================================================
  // MOUNTAINS  (parallax oscillation speed & amplitude)
  // ====================================================================
  mountains: {
    animSpeed: 0.005,
    referenceWidth: 1920,
    parallax: {
      mountains1: -10,
      mountains2: -25,
      hills1: -50,
      hills2: -100,
    },
  },

  // ====================================================================
  // PARTICLES  (leaves / petals)
  // ====================================================================
  particles: {
    zIndex: 4,
    leafColors: ['#c47a2b', '#a35d1a', '#d4923a', '#8b4513', '#b8860b'],
    petalColors: ['#f8b4c8', '#f2a0b8', '#fcc8d8', '#f0d0e0', '#ffe0ec'],
    countBase: 10,
    countRange: 11,
    sizeBase: 4,
    sizeRange: 6,
    leafHeightRatio: 1.3,
    petalHeightRatio: 0.8,
    opacityBase: 0.5,
    opacityRange: 0.4,
    vxMin: -0.2,
    vxRange: 0.3,
    vyMin: 0.3,
    vyRange: 0.4,
    gravity: 0.001,
    maxVy: 0.7,
    swayFreqMin: 0.008,
    swayFreqRange: 0.012,
    swayAmpMin: 0.15,
    swayAmpRange: 0.25,
    rotSpeedRange: 1.5,
    wrapBottomThreshold: 20,
    wrapBottomReset: -20,
    wrapLeft: -30,
    wrapRight: 30,
  },

  // ====================================================================
  // ERROR TOAST
  // ====================================================================
  errorToast: {
    displayMs: 5000,
    fadeMs: 400,
    bgColor: [200, 50, 50],
    bgOpacity: 0.9,
    backdropBlur: '8px',
    textColor: '#fff',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    maxWidth: '320px',
    shadowBlur: '20px',
    shadowOpacity: 0.5,
  },

  // ====================================================================
  // WEATHER POLLING
  // ====================================================================
  weatherPollIntervalMs: 600000,

  // ====================================================================
  // WEATHER API & MAPPING  (WMO → cloud cover / rain intensity)
  // ====================================================================
  weather: {
    apiUrl: 'https://api.open-meteo.com/v1/forecast',

    // Checked top‑to‑bottom; first match wins (code ≥ threshold)
    cloudCoverThresholds: [
      [95, 0.95],
      [80, 0.85],
      [71, 0.80],
      [61, 0.85],
      [51, 0.70],
    ],
    cloudCoverExact: {
      45: 0.8,
      48: 0.8,
       3: 0.95,
       2: 0.5,
       1: 0.2,
    },
    cloudCoverDefault: 0,

    rainMaxRatio: 8,
    rainIntensityThresholds: [
      [95, 0.9],
      [80, 0.3],
      [71, 0.3],
      [61, 0.2],
      [51, 0.1],
    ],
    rainIntensityFactors: {
      80: 0.3,
      71: 0.2,
      61: 0.25,
      51: 0.1,
    },
  },

  // ====================================================================
  // FALLBACK LOCATION  (when default-location.json cannot be loaded)
  // ====================================================================
  fallback: {
    lat: -37.8142454,
    lng: 144.9631732,
    label: 'Melbourne',
  },

  // ====================================================================
  // DEBUG PANEL  (inline styles)
  // ====================================================================
  debug: {
    bg: 'rgba(0,0,0,0.8)',
    backdropBlur: '8px',
    textColor: '#fff',
    padding: '14px 16px',
    borderRadius: '12px',
    width: '240px',
    shadow: '0 4px 20px rgba(0,0,0,0.6)',
    inputBg: '#333',
    inputColor: '#fff',
    inputBorder: '1px solid #555',
    inputBorderRadius: '6px',
    accentColor: '#ffae42',
    buttonBg: '#ffae42',
    buttonColor: '#222',
    buttonHoverBg: '#ffc06b',
  },
};
