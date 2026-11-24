// Calcul des heures de prière, hors-ligne (algorithme astronomique classique, type PrayTimes).
// Retourne des objets Date (heure locale du téléphone).
(function (root) {
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const sin = (d) => Math.sin(rad(d)), cos = (d) => Math.cos(rad(d)), tan = (d) => Math.tan(rad(d));
  const asin = (x) => deg(Math.asin(x)), acos = (x) => deg(Math.acos(x)), atan2 = (y, x) => deg(Math.atan2(y, x)), acot = (x) => deg(Math.atan(1 / x));
  const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

  // fajr / isha : angle sous l'horizon, ou isha en minutes après le maghrib.
  const METHODS = {
    france15: { nom: "France 15° (courant en France)", fajr: 15, isha: 15 },
    uoif: { nom: "UOIF 12°", fajr: 12, isha: 12 },
    mwl: { nom: "Ligue islamique mondiale 18° / 17°", fajr: 18, isha: 17 },
    france18: { nom: "18° / 18°", fajr: 18, isha: 18 },
    egypt: { nom: "Égypte 19,5° / 17,5°", fajr: 19.5, isha: 17.5 },
    makkah: { nom: "Umm al-Qura (La Mecque)", fajr: 18.5, ishaMin: 90 }
  };

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPos(jd) {
    const D = jd - 2451545.0;
    const g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
    const L = fix(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360);
    const e = 23.439 - 0.00000036 * D;
    const RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - RA };
  }

  function compute(date, lat, lng, methodId, asrFactor) {
    const M = METHODS[methodId] || METHODS.france15;
    const y = date.getFullYear(), mo = date.getMonth() + 1, d = date.getDate();
    const jd = julian(y, mo, d) - lng / (15 * 24);
    const midDay = (t) => fix(12 - sunPos(jd + t).eqt, 24);
    const angleTime = (angle, t, before) => {
      const decl = sunPos(jd + t).decl, noon = midDay(t);
      const T = acos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
      return noon + (before ? -T : T);
    };
    const asrTime = (f, t) => { const decl = sunPos(jd + t).decl; return angleTime(-acot(f + tan(Math.abs(lat - decl))), t); };

    // Deux passes : la première avec des heures approchées.
    let t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
    for (let i = 0; i < 2; i++) {
      const p = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / 24]));
      t = {
        fajr: angleTime(M.fajr, p.fajr, true),
        sunrise: angleTime(0.833, p.sunrise, true),
        dhuhr: midDay(p.dhuhr),
        asr: asrTime(asrFactor, p.asr),
        sunset: angleTime(0.833, p.sunset),
        isha: M.ishaMin ? NaN : angleTime(M.isha, p.isha)
      };
    }
    // Hautes latitudes (été en France) : si l'angle n'est jamais atteint, méthode « angle ».
    const night = fix(t.sunrise - t.sunset, 24);
    const fajrMax = (M.fajr / 60) * night;
    if (isNaN(t.fajr) || fix(t.sunrise - t.fajr, 24) > fajrMax) t.fajr = t.sunrise - fajrMax;
    if (M.ishaMin) t.isha = t.sunset + M.ishaMin / 60;
    else { const ishaMax = (M.isha / 60) * night; if (isNaN(t.isha) || fix(t.isha - t.sunset, 24) > ishaMax) t.isha = t.sunset + ishaMax; }
    t.dhuhr += 1 / 60; // marge d'une minute après le zénith
    t.maghrib = t.sunset;

    const base = Date.UTC(y, mo - 1, d);
    const toDate = (h) => new Date(base + Math.round((h - lng / 15) * 60) * 60000);
    return {
      fajr: toDate(t.fajr), sunrise: toDate(t.sunrise), dhuhr: toDate(t.dhuhr),
      asr: toDate(t.asr), maghrib: toDate(t.maghrib), isha: toDate(t.isha)
    };
  }

  // Direction de la Ka'ba, en degrés depuis le nord.
  function qibla(lat, lng) {
    const kLat = 21.4225, kLng = 39.8262;
    return fix(atan2(sin(kLng - lng), cos(lat) * tan(kLat) - sin(lat) * cos(kLng - lng)), 360);
  }

  const api = { compute, qibla, METHODS };
  if (typeof module !== "undefined") module.exports = api; else root.PrayerCalc = api;
})(this);
