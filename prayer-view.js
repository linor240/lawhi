"use strict";
// Onglet Prières. Chargé avant app.js ; utilise store, esc, I, render et toast d'app.js au moment de l'appel.
// Les heures sont affichées dans le fuseau de la ville choisie (une ville du Maroc reste à l'heure marocaine
// même si le téléphone est en France).
const COUNTRIES = {
  france: { nom: "France", tz: "Europe/Paris", method: "france15", villes: [
    ["Paris", 48.8566, 2.3522], ["Marseille", 43.2965, 5.3698], ["Lyon", 45.764, 4.8357], ["Toulouse", 43.6047, 1.4442],
    ["Nice", 43.7102, 7.262], ["Nantes", 47.2184, -1.5536], ["Strasbourg", 48.5734, 7.7521], ["Montpellier", 43.6108, 3.8767],
    ["Bordeaux", 44.8378, -0.5792], ["Lille", 50.6292, 3.0573], ["Rennes", 48.1173, -1.6778], ["Reims", 49.2583, 4.0317],
    ["Saint-Étienne", 45.4397, 4.3872], ["Toulon", 43.1242, 5.928], ["Grenoble", 45.1885, 5.7245], ["Dijon", 47.322, 5.0415],
    ["Angers", 47.4784, -0.5632], ["Nîmes", 43.8367, 4.3601], ["Clermont-Ferrand", 45.7772, 3.087], ["Le Havre", 49.4944, 0.1079],
    ["Rouen", 49.4432, 1.0999], ["Mulhouse", 47.7508, 7.3359], ["Metz", 49.1193, 6.1757], ["Perpignan", 42.6887, 2.8948],
    ["Orléans", 47.9029, 1.9093], ["Tours", 47.3941, 0.6848], ["Limoges", 45.8336, 1.2611], ["Avignon", 43.9493, 4.8055]
  ] },
  maroc: { nom: "Maroc", tz: "Africa/Casablanca", method: "maroc", villes: [
    ["Casablanca", 33.5731, -7.5898], ["Rabat", 34.0209, -6.8416], ["Marrakech", 31.6295, -7.9811], ["Fès", 34.0181, -5.0078],
    ["Tanger", 35.7595, -5.834], ["Agadir", 30.4278, -9.5981], ["Meknès", 33.8935, -5.5473], ["Oujda", 34.6814, -1.9086],
    ["Kénitra", 34.261, -6.5802], ["Tétouan", 35.5785, -5.3684], ["Nador", 35.1681, -2.9335], ["Al Hoceïma", 35.2517, -3.9372],
    ["Safi", 32.2994, -9.2372], ["El Jadida", 33.2316, -8.5007], ["Béni Mellal", 32.3373, -6.3498], ["Essaouira", 31.5085, -9.7595],
    ["Errachidia", 31.9314, -4.4246], ["Ouarzazate", 30.9189, -6.8934], ["Taza", 34.2133, -4.0103], ["Khouribga", 32.8811, -6.9063]
  ] },
  belgique: { nom: "Belgique", tz: "Europe/Brussels", method: "france15", villes: [
    ["Bruxelles", 50.8503, 4.3517], ["Anvers", 51.2194, 4.4025], ["Liège", 50.6326, 5.5797], ["Charleroi", 50.4108, 4.4446]
  ] },
  suisse: { nom: "Suisse", tz: "Europe/Zurich", method: "france15", villes: [
    ["Genève", 46.2044, 6.1432], ["Lausanne", 46.5197, 6.6323], ["Zurich", 47.3769, 8.5417], ["Bâle", 47.5596, 7.5886]
  ] }
};
const PRAYERS = [["fajr", "Fajr", "الفجر"], ["sunrise", "Chourouq", "الشروق"], ["dhuhr", "Dhuhr", "الظهر"], ["asr", "'Asr", "العصر"], ["maghrib", "Maghrib", "المغرب"], ["isha", "'Ishā'", "العشاء"]];
const pset = () => {
  const p = store.get("prayer", null) || {};
  return Object.assign({ loc: { name: "Paris", lat: 48.8566, lng: 2.3522 }, country: "france", method: "france15", asr: 1, view: "chiffres" }, p);
};
let dayOffset = 0;
// Fuseau de la ville choisie ; pour « Ma position », celui du téléphone.
const ptz = () => { const p = pset(); return p.loc.tz || undefined; };
const hm = (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: ptz() });
const hmParts = (d) => { const [h, m] = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ptz() }).split(":").map(Number); return { h: h % 24, m }; };
const dayDate = (off) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
const timesFor = (date) => { const p = pset(); return PrayerCalc.compute(date, p.loc.lat, p.loc.lng, p.method, p.asr); };

function nextPrayer() {
  const now = new Date();
  for (const off of [0, 1]) {
    const t = timesFor(dayDate(off));
    for (const [k, nom] of PRAYERS) if (k !== "sunrise" && t[k] > now) return { k, nom, at: t[k], off };
  }
  return null;
}
function hijri(d) {
  try { return new Intl.DateTimeFormat("fr-FR-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(d); } catch { return ""; }
}
function setPrayer(patch) { store.set("prayer", Object.assign(pset(), patch)); render(); }

// Horloge à aiguilles, pour lire l'heure sans les chiffres. Un soleil ou une lune dit si c'est le jour ou la nuit.
function clockSvg(d, size) {
  const { h, m } = hmParts(d);
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6, day = h >= 6 && h < 18;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180, r1 = i % 3 ? 41 : 37, r2 = 45;
    return `<line x1="${50 + r1 * Math.sin(a)}" y1="${50 - r1 * Math.cos(a)}" x2="${50 + r2 * Math.sin(a)}" y2="${50 - r2 * Math.cos(a)}" stroke-width="${i % 3 ? 2 : 3.5}"/>`;
  }).join("");
  const icon = day
    ? `<circle cx="50" cy="70" r="5" fill="var(--gold)" stroke="none"/>`
    : `<path d="M53 64a7 7 0 1 0 0 12 5.5 5.5 0 0 1 0-12Z" fill="var(--gold)" stroke="none"/>`;
  return `<svg class="clock" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${hm(d)}${day ? ", le jour" : ", la nuit"}">
    <circle cx="50" cy="50" r="47" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/>
    <g stroke="var(--muted)" stroke-linecap="round">${ticks}</g>
    ${icon}
    <line x1="50" y1="50" x2="50" y2="25" stroke="var(--fg)" stroke-width="6" stroke-linecap="round" transform="rotate(${ha} 50 50)"/>
    <line x1="50" y1="50" x2="50" y2="12" stroke="var(--fg)" stroke-width="3.5" stroke-linecap="round" transform="rotate(${ma} 50 50)"/>
    <circle cx="50" cy="50" r="4" fill="var(--fg)"/>
  </svg>`;
}

function viewPrayers() {
  const p = pset(), date = dayDate(dayOffset), t = timesFor(date), now = new Date(), nx = nextPrayer();
  const clock = p.view === "horloge";
  const mins = nx ? Math.max(0, Math.round((nx.at - now) / 60000)) : 0;
  const left = mins >= 60 ? Math.floor(mins / 60) + " h " + String(mins % 60).padStart(2, "0") : mins + " min";
  const week = Array.from({ length: 7 }, (_, i) => { const d = dayDate(dayOffset + i); return [d, timesFor(d)]; });
  const q = Math.round(PrayerCalc.qibla(p.loc.lat, p.loc.lng));
  const label = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const five = PRAYERS.filter((x) => x[0] !== "sunrise");
  const country = COUNTRIES[p.country] || null;

  const rows = PRAYERS.map(([k, nom, ar]) => {
    const isNext = dayOffset === 0 && nx && nx.off === 0 && nx.k === k;
    const past = dayOffset === 0 && t[k] < now;
    const cls = "prow" + (isNext ? " on" : "") + (past ? " past" : "") + (k === "sunrise" ? " sun" : "") + (clock ? " withclock" : "");
    const sub = k === "sunrise" ? "<small>lever du soleil, pas une prière</small>" : "";
    return `<div class="${cls}"><span class="pname">${nom}${sub}</span><span class="ar">${ar}</span>${clock ? clockSvg(t[k], 52) : `<b>${hm(t[k])}</b>`}</div>`;
  }).join("");

  const nextCard = nx
    ? `<div class="next${clock ? " withclock" : ""}">${clock ? clockSvg(nx.at, 96) : ""}<div><div class="eyebrow">Prochaine prière${nx.off ? " · demain" : ""}</div><b>${nx.nom}${clock ? "" : " · " + hm(nx.at)}</b><span>dans ${left}</span></div><span class="ar">${PRAYERS.find((x) => x[0] === nx.k)[2]}</span></div>`
    : "";
  const dayTitle = dayOffset === 0 ? "Aujourd'hui" : label.charAt(0).toUpperCase() + label.slice(1);
  const daySub = (dayOffset === 0 ? label + " · " : "") + hijri(date);

  const head = "<tr><th></th>" + five.map((x) => `<th>${x[1]}</th>`).join("") + "</tr>";
  const body = week.map(([d, w]) => "<tr><th>" + d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }) + "</th>" + five.map(([k]) => `<td>${hm(w[k])}</td>`).join("") + "</tr>").join("");

  const countryOpts = Object.entries(COUNTRIES).map(([id, c]) => `<option value="${id}"${id === p.country ? " selected" : ""}>${c.nom}</option>`).join("");
  const cityOpts = country ? country.villes.map(([c]) => `<option${c === p.loc.name ? " selected" : ""}>${c}</option>`).join("") : "";
  const methodOpts = Object.entries(PrayerCalc.METHODS).map(([id, m]) => `<option value="${id}"${id === p.method ? " selected" : ""}>${m.nom}</option>`).join("");

  return `<section class="view">
    <div class="segm" role="group" aria-label="Affichage des heures"><button data-pview="chiffres" aria-pressed="${!clock}">12:38 · Chiffres</button><button data-pview="horloge" aria-pressed="${clock}">${I.clock}Horloge</button></div>
    ${nextCard}
    <div class="daynav"><button class="icon-btn" data-day="-1" aria-label="Jour précédent">‹</button><div><b>${dayTitle}</b><small class="muted">${daySub}</small></div><button class="icon-btn" data-day="1" aria-label="Jour suivant">›</button></div>
    <div class="list">${rows}</div>
    <p class="muted" style="font-size:13px">${esc(p.loc.name)}${country && p.loc.name !== "Ma position" ? ", " + country.nom : ""} · ${esc(PrayerCalc.METHODS[p.method].nom)}</p>
    <div class="card"><h3>Les 7 prochains jours</h3>
      <p class="muted" style="font-size:13px">Les horaires suivent la course du soleil : ils changent chaque jour et avec les saisons.</p>
      <div class="wtable"><table><thead>${head}</thead><tbody>${body}</tbody></table></div></div>
    <div class="card"><h3>Réglages</h3>
      <div class="field"><span class="eyebrow">Lieu · ${esc(p.loc.name)}</span>
        <button class="btn ghost" data-act="geo">${I.pin}Utiliser ma position</button>
        <div class="row" style="flex-wrap:nowrap">
          <select id="countrySel" aria-label="Pays">${countryOpts}</select>
          <select id="citySel" aria-label="Ville"><option value="">Ville…</option>${cityOpts}</select>
        </div></div>
      <div class="field"><label class="eyebrow" for="methodSel">Méthode de calcul</label><select id="methodSel">${methodOpts}</select></div>
      <div class="field"><label class="eyebrow" for="asrSel">Heure de 'Asr</label>
        <select id="asrSel"><option value="1"${p.asr === 1 ? " selected" : ""}>Majorité (malikite, chaféite, hanbalite)</option><option value="2"${p.asr === 2 ? " selected" : ""}>Hanafite (plus tard)</option></select></div>
      <p class="note">Les mosquées n'utilisent pas toutes la même méthode. Compare avec les horaires affichés dans ta mosquée et garde la méthode qui correspond.</p>
      <div class="qibla"><div class="needle" style="transform:rotate(${q}deg)"><span></span></div><p><b>Qibla : ${q}°</b><br><span class="muted">depuis le nord, dans le sens des aiguilles d'une montre</span></p></div>
    </div>
  </section>`;
}
// Choix du pays : propose ses villes et la méthode officielle du pays.
function setCountry(id) {
  const c = COUNTRIES[id]; if (!c) return;
  const [name, lat, lng] = c.villes[0];
  setPrayer({ country: id, method: c.method, loc: { name, lat, lng, tz: c.tz } });
}
function setCity(name) {
  const p = pset(), c = COUNTRIES[p.country]; if (!c) return;
  const v = c.villes.find((x) => x[0] === name); if (!v) return;
  setPrayer({ loc: { name: v[0], lat: v[1], lng: v[2], tz: c.tz } });
}
