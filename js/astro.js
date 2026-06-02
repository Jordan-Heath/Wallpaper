export function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

export function sunTimesUTC(date, lat, lng) {
  const rad = Math.PI / 180;
  const zenith = 90.833;
  const day = dayOfYear(date);

  function calc(isSunrise) {
    const lngHour = lng / 15;
    const t = isSunrise ? day + ((6 - lngHour) / 24) : day + ((18 - lngHour) / 24);
    const M = (0.9856 * t) - 3.289;
    let L = M + (1.916 * Math.sin(rad * M)) + (0.020 * Math.sin(rad * 2 * M)) + 282.634;
    L = (L % 360 + 360) % 360;
    let RA = (1 / rad) * Math.atan(0.91764 * Math.tan(rad * L));
    RA = (RA % 360 + 360) % 360;
    const Lq = Math.floor(L / 90) * 90;
    const RAq = Math.floor(RA / 90) * 90;
    RA = (RA + (Lq - RAq)) / 15;
    const sinDec = 0.39782 * Math.sin(rad * L);
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos(rad * zenith) - (sinDec * Math.sin(rad * lat))) /
                 (cosDec * Math.cos(rad * lat));
    if (cosH > 1 || cosH < -1) return null;
    let Hh = isSunrise ? 360 - (1 / rad) * Math.acos(cosH)
                       : (1 / rad) * Math.acos(cosH);
    Hh /= 15;
    const T = Hh + RA - (0.06571 * t) - 6.622;
    let UT = (T - lngHour) % 24;
    UT = (UT + 24) % 24;
    return UT;
  }
  return { sunriseUTC: calc(true), sunsetUTC: calc(false) };
}

export function utcToLocalHour(utcHour, date) {
  const offsetH = -date.getTimezoneOffset() / 60;
  let local = utcHour + offsetH;
  local = (local % 24 + 24) % 24;
  return local;
}

export function fmtHour(h) {
  if (h == null) return '\u2014';
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const mm = (min === 60) ? 0 : min;
  const HH = (min === 60) ? hr + 1 : hr;
  return String(HH).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

export function getSeason(date, lat) {
  const m = date.getMonth();
  const north = lat >= 0;
  let s;
  if (m >= 2 && m <= 4) s = 'Spring';
  else if (m >= 5 && m <= 7) s = 'Summer';
  else if (m >= 8 && m <= 10) s = 'Autumn';
  else s = 'Winter';
  if (!north) {
    s = { Spring: 'Autumn', Summer: 'Winter', Autumn: 'Spring', Winter: 'Summer' }[s];
  }
  return s;
}
