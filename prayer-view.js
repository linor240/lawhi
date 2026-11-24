"use strict";
// Onglet Prières. Chargé avant app.js ; utilise store, esc, I, render et toast d'app.js au moment de l'appel.
const CITIES = [
  ["Paris", 48.8566, 2.3522], ["Marseille", 43.2965, 5.3698], ["Lyon", 45.764, 4.8357], ["Toulouse", 43.6047, 1.4442],
  ["Nice", 43.7102, 7.262], ["Nantes", 47.2184, -1.5536], ["Strasbourg", 48.5734, 7.7521], ["Montpellier", 43.6108, 3.8767],
  ["Bordeaux", 44.8378, -0.5792], ["Lille", 50.6292, 3.0573], ["Rennes", 48.1173, -1.6778], ["Reims", 49.2583, 4.0317],
  ["Saint-Étienne", 45.4397, 4.3872], ["Toulon", 43.1242, 5.928], ["Grenoble", 45.1885, 5.7245], ["Dijon", 47.322, 5.0415],
  ["Angers", 47.4784, -0.5632], ["Nîmes", 43.8367, 4.3601], ["Clermont-Ferrand", 45.7772, 3.087], ["Le Havre", 49.4944, 0.1079],
  ["Rouen", 49.4432, 1.0999], ["Mulhouse", 47.7508, 7.3359], ["Metz", 49.1193, 6.1757], ["Perpignan", 42.6887, 2.8948],
  ["Orléans", 47.9029, 1.9093], ["Tours", 47.3941, 0.6848], ["Limoges", 45.8336, 1.2611], ["Avignon", 43.9493, 4.8055],
  ["Bruxelles", 50.8503, 4.3517], ["Genève", 46.2044, 6.1432]
];
const PRAYERS = [["fajr", "Fajr", "الفجر"], ["sunrise", "Chourouq", "الشروق"], ["dhuhr", "Dhuhr", "الظهر"], ["asr", "'Asr", "العصر"], ["maghrib", "Maghrib", "المغرب"], ["isha", "'Ishā'", "العشاء"]];
const pset = () => store.get("prayer", { loc: { name: "Paris", lat: 48.8566, lng: 2.3522 }, method: "france15", asr: 1 });
let dayOffset = 0;
const hm = (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
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

function viewPrayers() {
  const p = pset(), date = dayDate(dayOffset), t = timesFor(date), now = new Date(), nx = nextPrayer();
  const mins = nx ? Math.max(0, Math.round((nx.at - now) / 60000)) : 0;
  const left = mins >= 60 ? Math.floor(mins / 60) + " h " + String(mins % 60).padStart(2, "0") : mins + " min";
  const week = Array.from({ length: 7 }, (_, i) => { const d = dayDate(dayOffset + i); return [d, timesFor(d)]; });
  const q = Math.round(PrayerCalc.qibla(p.loc.lat, p.loc.lng));
  const label = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const five = PRAYERS.filter((x) => x[0] !== "sunrise");

  const rows = PRAYERS.map(([k, nom, ar]) => {
    const isNext = dayOffset === 0 && nx && nx.off === 0 && nx.k === k;
    const past = dayOffset === 0 && t[k] < now;
    const cls = "prow" + (isNext ? " on" : "") + (past ? " past" : "") + (k === "sunrise" ? " sun" : "");
    const sub = k === "sunrise" ? "<small>lever du soleil, pas une prière</small>" : "";
    return `<div class="${cls}"><span class="pname">${nom}${sub}</span><span class="ar">${ar}</span><b>${hm(t[k])}</b></div>`;
  }).join("");

  const nextCard = nx
    ? `<div class="next"><div><div class="eyebrow">Prochaine prière${nx.off ? " · demain" : ""}</div><b>${nx.nom} · ${hm(nx.at)}</b><span>dans ${left}</span></div><span class="ar">${PRAYERS.find((x) => x[0] === nx.k)[2]}</span></div>`
    : "";
  const dayTitle = dayOffset === 0 ? "Aujourd'hui" : label.charAt(0).toUpperCase() + label.slice(1);
  const daySub = (dayOffset === 0 ? label + " · " : "") + hijri(date);

  const head = "<tr><th></th>" + five.map((x) => `<th>${x[1]}</th>`).join("") + "</tr>";
  const body = week.map(([d, w]) => "<tr><th>" + d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }) + "</th>" + five.map(([k]) => `<td>${hm(w[k])}</td>`).join("") + "</tr>").join("");

  const cityOpts = CITIES.map(([c]) => `<option${c === p.loc.name ? " selected" : ""}>${c}</option>`).join("");
  const methodOpts = Object.entries(PrayerCalc.METHODS).map(([id, m]) => `<option value="${id}"${id === p.method ? " selected" : ""}>${m.nom}</option>`).join("");

  return `<section class="view">
    ${nextCard}
    <div class="daynav"><button class="icon-btn" data-day="-1" aria-label="Jour précédent">‹</button><div><b>${dayTitle}</b><small class="muted">${daySub}</small></div><button class="icon-btn" data-day="1" aria-label="Jour suivant">›</button></div>
    <div class="list">${rows}</div>
    <p class="muted" style="font-size:13px">${esc(p.loc.name)} · ${esc(PrayerCalc.METHODS[p.method].nom)}</p>
    <div class="card"><h3>Les 7 prochains jours</h3>
      <p class="muted" style="font-size:13px">Les horaires suivent la course du soleil : ils changent chaque jour et avec les saisons.</p>
      <div class="wtable"><table><thead>${head}</thead><tbody>${body}</tbody></table></div></div>
    <div class="card"><h3>Réglages</h3>
      <div class="field"><span class="eyebrow">Lieu · ${esc(p.loc.name)}</span>
        <button class="btn ghost" data-act="geo">${I.pin}Utiliser ma position</button>
        <select id="citySel" aria-label="Ville"><option value="">Ou choisir une ville…</option>${cityOpts}</select></div>
      <div class="field"><label class="eyebrow" for="methodSel">Méthode de calcul</label><select id="methodSel">${methodOpts}</select></div>
      <div class="field"><label class="eyebrow" for="asrSel">Heure de 'Asr</label>
        <select id="asrSel"><option value="1"${p.asr === 1 ? " selected" : ""}>Majorité (malikite, chaféite, hanbalite)</option><option value="2"${p.asr === 2 ? " selected" : ""}>Hanafite (plus tard)</option></select></div>
      <p class="note">Les mosquées n'utilisent pas toutes la même méthode. Compare avec les horaires affichés dans ta mosquée et garde la méthode qui correspond.</p>
      <div class="qibla"><div class="needle" style="transform:rotate(${q}deg)"><span></span></div><p><b>Qibla : ${q}°</b><br><span class="muted">depuis le nord, dans le sens des aiguilles d'une montre</span></p></div>
    </div>
  </section>`;
}
