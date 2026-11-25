"use strict";
/* Lawhi — lecteur de Coran + apprentissage de l'arabe. Aucune musique, aucun compte. */

// ---------- Données ----------
const RECITERS = [
  { id: "alafasy", ev: "Alafasy_128kbps", nom: "Mishary Alafasy", slug: "mishary-alafasy/r1" },
  { id: "husary", ev: "Husary_128kbps", nom: "Mahmoud al-Husary", slug: "mahmoud-husary/r1", note: "lent, idéal pour apprendre" },
  { id: "minshawi", ev: "Minshawy_Murattal_128kbps", nom: "Muhammad al-Minshawi", slug: "muhammad-minshawi/r1" },
  { id: "basit", ev: "Abdul_Basit_Murattal_192kbps", nom: "Abdul Basit Abdul Samad", slug: "abdulbasit-abdulsamad/r3" },
  { id: "sudais", ev: "Abdurrahmaan_As-Sudais_192kbps", nom: "Abdul Rahman al-Sudais", slug: "abdulrahman-sudais/r1" },
  { id: "maher", ev: "MaherAlMuaiqly128kbps", nom: "Maher al-Muaiqly", slug: "maher-muaiqly/r1" },
  { id: "dosari", ev: "Yasser_Ad-Dussary_128kbps", nom: "Yasser al-Dosari", slug: "yasser-dosari/r1" },
  { id: "qatami", ev: "Nasser_Alqatami_128kbps", nom: "Nasser al-Qatami", slug: "nasser-qatami/r1" },
  // Pas de version verset par verset, et 5 sourates absentes chez mp3quran : la voix d'Alafasy les remplace.
  { id: "sobhi", nom: "Islam Sobhi", slug: "islam-sobhi/r1", manque: [37, 39, 40, 45, 65], note: "traduction avec la voix d'Alafasy" }
];
const pad3 = (n) => String(n).padStart(3, "0");
const srcRec = (rec, n) => (rec.manque && rec.manque.includes(n) ? RECITERS[0] : rec);
const surahUrl = (rec, n) => `https://cdn.mp3quran.net/audio/${srcRec(rec, n).slug}/${pad3(n)}.mp3`;
const ayahUrl = (r, s, a) => `https://everyayah.com/data/${r.ev || RECITERS[0].ev}/${pad3(s)}${pad3(a)}.mp3`;
const textUrl = (n) => `https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.transliteration,fr.hamidullah`;
const S = (n) => { const s = window.SURAHS[n - 1]; return { n, ar: s[0], tr: s[1], fr: s[2], ayahs: s[3], type: s[4] }; };
const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const AUDIO_CACHE = "lawhi-audio-v1";

// ---------- Stockage local ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem("lawhi:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("lawhi:" + k, JSON.stringify(v)); } catch {} }
};
const state = {
  tab: store.get("tab", "ecouter"),
  reciter: store.get("reciter", "alafasy"),
  favs: new Set(store.get("favs", [1, 18, 36, 67])),
  downloaded: new Set(),
  downloading: new Map(),
  filter: "tout",
  query: "",
  repeat: store.get("repeat", "suite"), // suite | une | stop
  rate: store.get("rate", 1),
  current: null,
  learn: store.get("learn", "alphabet"),
  lessonsDone: new Set(store.get("lessonsDone", [])),
  mastery: store.get("mastery", {}), // lettre -> série de bonnes réponses
  showTr: store.get("showTr", true),
  showFr: store.get("showFr", true),
  qsize: store.get("qsize", 30),
  sleepAt: 0,
  verseMode: store.get("verseMode", false)
};
const rec = () => RECITERS.find((r) => r.id === state.reciter) || RECITERS[0];

// ---------- Icônes ----------
const I = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1.2"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.2"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 6.5v11a1 1 0 0 0 1.55.83L14 13.2V17a1 1 0 0 0 2 0V7a1 1 0 0 0-2 0v3.8L6.55 5.67A1 1 0 0 0 5 6.5Z"/><rect x="17" y="6" width="2.2" height="12" rx="1.1"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.5v11a1 1 0 0 1-1.55.83L10 13.2V17a1 1 0 0 1-2 0V7a1 1 0 0 1 2 0v3.8l7.45-5.13A1 1 0 0 1 19 6.5Z"/><rect x="4.8" y="6" width="2.2" height="12" rx="1.1"/></svg>',
  back15: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><text x="12" y="15.5" font-size="7" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif" font-weight="700">15</text></svg>',
  fwd15: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/><text x="12" y="15.5" font-size="7" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif" font-weight="700">15</text></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9L12 3.5Z"/></svg>',
  starOn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9L12 3.5Z"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 19h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chevDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 6.5C10 5 7 4.5 3.5 5v13.5C7 18 10 18.5 12 20c2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z"/><path d="M12 6.5V20"/></svg>',
  ear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4.5" height="6" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="6" rx="1.5"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
  hist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8h18l-9-5Z"/><path d="M5 8v9M9.5 8v9M14.5 8v9M19 8v9"/><path d="M3 20h18"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6.5 3.5h11v17l-5.5-4-5.5 4v-17Z"/></svg>',
  bookmarkOn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 3.5h11v17l-5.5-4-5.5 4v-17Z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
};

// ---------- Utilitaires ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (t) => { if (!isFinite(t)) return "--:--"; t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0"); };
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let toastTimer;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600); }
const ZWJ = "‍";
function letterForms(L) {
  return L.j
    ? [["Seule", L.c], ["Début", L.c + ZWJ], ["Milieu", ZWJ + L.c + ZWJ], ["Fin", ZWJ + L.c]]
    : [["Seule", L.c], ["Début", L.c], ["Milieu", ZWJ + L.c], ["Fin", ZWJ + L.c]];
}

// Voix arabe du téléphone (synthèse vocale) pour prononcer les lettres et les mots.
let arVoice = null;
function pickVoice() { try { const v = speechSynthesis.getVoices(); arVoice = v.find((x) => /^ar/i.test(x.lang)) || null; } catch {} }
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text) {
  if (!("speechSynthesis" in window)) { toast("Ton navigateur ne sait pas lire à voix haute."); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = "ar-SA"; u.rate = 0.75; if (arVoice) u.voice = arVoice;
  speechSynthesis.speak(u);
  if (!arVoice) setTimeout(() => { if (!arVoice) toast("Pas de voix arabe installée : ajoute « arabe » dans la synthèse vocale du téléphone."); }, 400);
}

// ---------- Lecteur audio ----------
const audio = new Audio();
audio.preload = "metadata";
let blobUrl = null;

async function sourceFor(n) {
  const url = surahUrl(rec(), n);
  try {
    const c = await caches.open(AUDIO_CACHE);
    const hit = await c.match(url);
    if (hit) { const b = await hit.blob(); if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = URL.createObjectURL(b); return { src: blobUrl, offline: true }; }
  } catch {}
  return { src: url, offline: false };
}

function setMeta(title) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title, artist: rec().nom, album: "Lawhi · Coran",
    artwork: [{ src: "icon-512.png", sizes: "512x512", type: "image/png" }]
  });
}
// Mode traduction : la sourate est jouée verset par verset ; les versets s'empilent
// dans le lecteur, le plus récent en bas, les précédents remontent.
let feed = []; // versets déjà récités de la sourate en cours : { n, k, ar, fr }
async function playVerseMode(n, k = 1) {
  let ayahs;
  try { ayahs = await getText(n); } catch { toast("Le texte de cette sourate n'est pas disponible sans réseau. Lecture sans traduction."); state.verseMode = false; store.set("verseMode", false); return playSurah(n); }
  const s = S(n), a = ayahs[k - 1];
  const changed = !state.current || state.current.n !== n || state.current.k == null;
  if (changed || k === 1) feed = [];
  if (!feed.some((v) => v.n === n && v.k === k)) feed.push({ n, k, ar: a.ar, fr: a.fr });
  state.current = { n, reciter: state.reciter, offline: false, k, a };
  audio.src = ayahUrl(rec(), n, k);
  audio.playbackRate = state.rate;
  try { await audio.play(); } catch { if (!navigator.onLine) toast("La traduction pendant l'écoute demande du réseau."); }
  setMeta(`${s.n}. ${s.fr} · verset ${k}/${s.ayahs}`);
  store.set("last", { n, reciter: state.reciter, t: 0, k });
  renderMini(); refreshRows(); markVerse(n, k);
  if (!$("#playerSheet").hidden) { if (changed || !$("#feed")) renderPlayer(); else updateFeed(); }
}
function markVerse(n, k) {
  updateReaderBar();
  if ($("#readerSheet").hidden || readingN !== n) return;
  document.querySelectorAll(".ayah.on").forEach((e) => e.classList.remove("on"));
  const el = document.querySelector(`.ayah[data-k="${k}"]`); if (el) { el.classList.add("on"); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
}
function afterVerse() {
  const c = state.current; if (!c || c.k == null) return;
  if (c.k < S(c.n).ayahs) return playVerseMode(c.n, c.k + 1);
  if (state.repeat === "une") return playVerseMode(c.n, 1);
  if (state.repeat === "suite" && c.n < 114) return playVerseMode(c.n + 1, 1);
  store.set("last", { n: c.n, reciter: c.reciter, t: 0 });
}

async function playSurah(n, startAt = 0) {
  if (state.verseMode) return playVerseMode(n, 1);
  const s = S(n);
  const { src, offline } = await sourceFor(n);
  state.current = { n, reciter: state.reciter, offline };
  audio.src = src;
  audio.playbackRate = state.rate;
  if (startAt) audio.addEventListener("loadedmetadata", () => { audio.currentTime = startAt; }, { once: true });
  try { await audio.play(); } catch (e) { if (!navigator.onLine && !offline) toast("Hors connexion : télécharge cette sourate pour l'écouter sans réseau."); }
  setMeta(`${s.n}. ${s.fr} (${s.tr})`);
  store.set("last", { n, reciter: state.reciter, t: startAt });
  renderMini(); refreshRows(); if (!$("#playerSheet").hidden) renderPlayer();
}
function togglePlay() {
  if (!state.current) { const l = store.get("last", null); playSurah(l ? l.n : 1, l ? l.t : 0); return; } audio.paused ? audio.play() : audio.pause(); }
function nextSurah(d = 1) { if (!state.current) return; const n = state.current.n + d; if (n >= 1 && n <= 114) playSurah(n); }

if ("mediaSession" in navigator) {
  const ms = navigator.mediaSession;
  const h = (a, f) => { try { ms.setActionHandler(a, f); } catch {} };
  h("play", () => audio.play()); h("pause", () => audio.pause());
  h("nexttrack", () => nextSurah(1)); h("previoustrack", () => nextSurah(-1));
  h("seekbackward", () => (audio.currentTime = Math.max(0, audio.currentTime - 15)));
  h("seekforward", () => (audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15)));
  h("seekto", (e) => (audio.currentTime = e.seekTime));
}

let lastSave = 0;
audio.addEventListener("timeupdate", () => {
  const p = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  const bar = $("#miniBar"); if (bar) bar.style.width = p + "%";
  const sk = $("#seek"); if (sk && !sk.dataset.drag) { sk.value = audio.currentTime; sk.max = audio.duration || 0; $("#tCur").textContent = fmt(audio.currentTime); $("#tDur").textContent = fmt(audio.duration); }
  if (Date.now() - lastSave > 4000 && state.current) { lastSave = Date.now(); store.set("last", { n: state.current.n, reciter: state.current.reciter, t: audio.currentTime }); }
  if (state.sleepAt && Date.now() >= state.sleepAt) { audio.pause(); state.sleepAt = 0; toast("Minuterie terminée, lecture en pause."); if (!$("#playerSheet").hidden) renderPlayer(); }
  if ("mediaSession" in navigator && audio.duration && navigator.mediaSession.setPositionState) {
    try { navigator.mediaSession.setPositionState({ duration: audio.duration, position: audio.currentTime, playbackRate: audio.playbackRate }); } catch {}
  }
});
["play", "pause"].forEach((e) => audio.addEventListener(e, () => { renderMiniBtn(); updateReaderBar(); const b = $("#bigPlay"); if (b) b.innerHTML = audio.paused ? I.play : I.pause; }));
audio.addEventListener("ended", () => {
  if (!state.current) return;
  if (state.current.k != null) return afterVerse();
  if (state.repeat === "une") { audio.currentTime = 0; audio.play(); }
  else if (state.repeat === "suite" && state.current.n < 114) playSurah(state.current.n + 1);
  else store.set("last", { n: state.current.n, reciter: state.current.reciter, t: 0 });
});
audio.addEventListener("error", () => { if (state.current && !navigator.onLine) toast("Hors connexion : cette sourate n'est pas téléchargée."); });

// ---------- Téléchargement hors-ligne ----------
async function loadDownloaded() {
  state.downloaded.clear();
  try {
    const c = await caches.open(AUDIO_CACHE);
    const keys = await c.keys();
    for (let n = 1; n <= 114; n++) if (keys.some((k) => k.url === surahUrl(rec(), n))) state.downloaded.add(n);
  } catch {}
}
async function download(n) {
  if (state.downloading.has(n)) return;
  const url = surahUrl(rec(), n);
  state.downloading.set(n, 0); refreshRows();
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) throw new Error(r.status);
    const total = +r.headers.get("content-length") || 0;
    const reader = r.body.getReader(); const parts = []; let got = 0;
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      parts.push(value); got += value.length;
      if (total) { state.downloading.set(n, Math.round((got / total) * 100)); updatePct(n); }
    }
    const blob = new Blob(parts, { type: "audio/mpeg" });
    const c = await caches.open(AUDIO_CACHE);
    await c.put(url, new Response(blob, { headers: { "Content-Type": "audio/mpeg", "Content-Length": String(blob.size) } }));
    state.downloaded.add(n);
    toast(`${S(n).fr} est disponible hors-ligne.`);
  } catch (e) {
    toast("Téléchargement impossible. Vérifie ta connexion.");
  }
  state.downloading.delete(n); refreshRows();
}
async function removeDownload(n) {
  try { const c = await caches.open(AUDIO_CACHE); await c.delete(surahUrl(rec(), n)); } catch {}
  state.downloaded.delete(n); refreshRows(); toast("Téléchargement supprimé.");
}
function updatePct(n) { const el = document.querySelector(`[data-dl="${n}"]`); if (el) el.innerHTML = `<span class="dl-pct">${state.downloading.get(n)}%</span>`; }

// ---------- Onglets ----------
const TABS = [
  { id: "ecouter", nom: "Écouter", icon: I.ear },
  { id: "lire", nom: "Lire", icon: I.book },
  { id: "prieres", nom: "Prières", icon: I.clock },
  { id: "apprendre", nom: "Apprendre", icon: I.pen },
  { id: "histoire", nom: "Histoire", icon: I.hist }
];
function renderTabs() {
  $("#tabs").innerHTML = TABS.map((t) => `<button class="tab" role="tab" aria-selected="${state.tab === t.id}" data-tab="${t.id}">${t.icon}<span>${t.nom}</span></button>`).join("");
}
// Compte à rebours de la prochaine prière, rafraîchi toutes les 30 s.
setInterval(() => { if (state.tab === "prieres" && document.visibilityState === "visible" && !document.querySelector("select:focus")) { const y = window.scrollY; render(); window.scrollTo(0, y); } }, 30000);
function go(tab) {
  dayOffset = 0;
  state.tab = tab; store.set("tab", tab); renderTabs(); render(); window.scrollTo(0, 0);
  if (location.hash !== "#" + tab) history.replaceState(null, "", "#" + tab);
}

function render() {
  const m = $("#main");
  if (state.tab === "ecouter") m.innerHTML = viewListen();
  else if (state.tab === "lire") m.innerHTML = viewRead();
  else if (state.tab === "prieres") m.innerHTML = viewPrayers();
  else if (state.tab === "apprendre") { m.innerHTML = viewLearn(); afterLearn(); }
  else m.innerHTML = viewHistory();
}

// ---------- Marque-pages et reprise de lecture ----------
// marks : marque-page posé à la main ; readPos : dernier verset lu (enregistré tout seul en faisant défiler).
const marks = store.get("marks", {}), readPos = store.get("readPos", {});
function resumeBtn(n) {
  const m = marks[n], p = readPos[n];
  if (m) return `<button class="bm on" data-act="readAt" data-n="${n}" data-k="${m}" aria-label="Aller au marque-page, verset ${m}">${I.bookmarkOn}<span>v. ${m}</span></button>`;
  if (p > 1) return `<button class="bm" data-act="readAt" data-n="${n}" data-k="${p}" aria-label="Reprendre au verset ${p}">${I.play}<span>v. ${p}</span></button>`;
  return "";
}
function toggleMark(n, k) {
  if (marks[n] === k) delete marks[n]; else marks[n] = k;
  store.set("marks", marks);
  document.querySelectorAll(".ayah.marked").forEach((e) => e.classList.remove("marked"));
  document.querySelectorAll(".ayah [data-act=mark]").forEach((b) => { b.innerHTML = I.bookmark + "Marque-page"; b.setAttribute("aria-pressed", "false"); });
  if (marks[n]) {
    const el = document.querySelector(`.ayah[data-k="${k}"]`);
    if (el) { el.classList.add("marked"); const b = el.querySelector("[data-act=mark]"); b.innerHTML = I.bookmarkOn + "Marque-page"; b.setAttribute("aria-pressed", "true"); }
    toast(`Marque-page posé au verset ${k}.`);
  } else toast("Marque-page retiré.");
}
let readSaveT = 0;
function trackReading() {
  const sh = $("#readerSheet"); if (sh.hidden || readingN == null) return;
  clearTimeout(readSaveT);
  readSaveT = setTimeout(() => {
    const top = sh.getBoundingClientRect().top + 90;
    const first = [...sh.querySelectorAll(".ayah")].find((a) => a.getBoundingClientRect().bottom > top);
    if (first) { readPos[readingN] = +first.dataset.k; store.set("readPos", readPos); }
  }, 400);
}

// ---------- Écouter ----------
let openRow = null; // ligne dont les actions sont dépliées
function surahRow(n, mode) {
  const s = S(n), playing = state.current && state.current.n === n;
  const fav = state.favs.has(n), dl = state.downloaded.has(n), pct = state.downloading.get(n);
  const marks = (fav ? `<i class="mk star" title="Favori">${I.starOn}</i>` : "") + (dl ? `<i class="mk" title="Disponible hors-ligne">${I.check}</i>` : "") + (pct != null ? `<i class="mk pct">${pct}%</i>` : "");
  const open = mode !== "lire" && openRow === n;
  return `<div class="srow${playing ? " playing" : ""}${open ? " open" : ""}" data-row="${n}">
    <div class="sline">
      <span class="snum">${n}</span>
      <button class="smain" data-act="${mode === "lire" ? "read" : "play"}" data-n="${n}"><b>${esc(s.fr)}${marks}</b><small>${esc(s.tr)} · ${s.ayahs} versets</small></button>
      <span class="sar">${s.ar}</span>
      ${mode === "lire" ? resumeBtn(n) : `<button class="more" data-act="rowMenu" data-n="${n}" aria-label="Options de la sourate" aria-expanded="${open}">${I.dots}</button>`}
    </div>
    ${open ? `<div class="sacts">
      <button data-act="fav" data-n="${n}">${fav ? I.starOn : I.star}${fav ? "Retirer des favoris" : "Favori"}</button>
      ${pct != null ? `<button disabled>${I.down}${pct}%</button>` : dl ? `<button data-act="undl" data-dl="${n}">${I.trash}Supprimer</button>` : `<button data-act="dl" data-dl="${n}">${I.down}Télécharger</button>`}
      <button data-act="read" data-n="${n}">${I.book}Lire</button>
    </div>` : ""}
  </div>`;
}
function filtered(mode) {
  const norm = (x) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['-]/g, " ");
  const q = norm(state.query.trim());
  let ns = Array.from({ length: 114 }, (_, i) => i + 1);
  if (mode !== "lire") {
    if (state.filter === "favoris") ns = ns.filter((n) => state.favs.has(n));
    if (state.filter === "hors") ns = ns.filter((n) => state.downloaded.has(n));
    if (state.filter === "courtes") ns = ns.filter((n) => n >= 78);
  }
  if (q) ns = ns.filter((n) => { const s = S(n); return String(n) === q || norm(s.fr + " " + s.tr).includes(q) || s.ar.includes(state.query.trim()); });
  return ns;
}
function viewListen() {
  const list = filtered("ecouter");
  const empty = state.filter === "favoris" ? "Aucun favori. Touche ⋯ sur une sourate pour l'ajouter."
    : state.filter === "hors" ? "Rien de téléchargé. Touche ⋯ sur une sourate pour l'avoir sans réseau."
    : "Aucune sourate ne correspond.";
  return `<section class="view">
    <div class="searchbar">
      <input class="search" id="q" type="search" placeholder="Chercher une sourate" value="${esc(state.query)}" autocomplete="off">
      ${recGear()}
    </div>
    <p class="recline">${esc(rec().nom)} · ${state.verseMode ? "avec traduction" : "récitation seule"}</p>
    <div class="tabs-text" role="group" aria-label="Filtre">
      ${[["tout", "Toutes"], ["favoris", "Favoris"], ["hors", "Hors-ligne"], ["courtes", "Juz' 'Amma"]].map(([id, l]) => `<button data-filter="${id}" aria-pressed="${state.filter === id}">${l}</button>`).join("")}
    </div>
    <div class="list" id="slist">${list.length ? list.map((n) => surahRow(n)).join("") : `<p class="empty">${empty}</p>`}</div>
  </section>`;
}
function refreshRows() {
  document.querySelectorAll("[data-row]").forEach((row) => {
    const n = +row.dataset.row; const mode = state.tab === "lire" ? "lire" : "ecouter";
    const tmp = document.createElement("div"); tmp.innerHTML = surahRow(n, mode); row.replaceWith(tmp.firstElementChild);
  });
}

// Engrenage de la récitation : les réglages n'apparaissent qu'en le touchant.
const seg = (key, opts, cur) => `<div class="segm">${opts.map(([v, l]) => `<button data-set="${key}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join("")}</div>`;
function recGear() {
  return `<div class="gearwrap"><button class="icon-btn" data-act="recMenu" aria-label="Réglages de la récitation" aria-expanded="false">${I.gear}</button>
    <div class="menu" id="recMenu" hidden></div></div>`;
}
function recMenuHtml() {
  const sleepLeft = state.sleepAt ? Math.max(1, Math.round((state.sleepAt - Date.now()) / 60000)) : 0;
  return `<div class="mrow"><span>Affichage</span>${seg("mode", [["audio", "Récitation"], ["texte", "+ Traduction"]], state.verseMode ? "texte" : "audio")}</div>
    <div class="mrow"><label for="reciterSel">Récitateur</label>
      <select id="reciterSel">${RECITERS.map((r) => `<option value="${r.id}"${r.id === state.reciter ? " selected" : ""}>${esc(r.nom)}${r.note ? " · " + r.note : ""}</option>`).join("")}</select></div>
    <div class="mrow"><span>À la fin</span>${seg("repeat", [["suite", "Continuer"], ["une", "Répéter"], ["stop", "Arrêter"]], state.repeat)}</div>
    <div class="mrow"><span>Vitesse</span>${seg("rate", [[0.75, "0,75×"], [1, "1×"], [1.25, "1,25×"]], state.rate)}</div>
    <div class="mrow"><span>Minuterie${sleepLeft ? ` · ${sleepLeft} min` : ""}</span>${seg("sleep", [[0, "Non"], [15, "15 min"], [30, "30"], [60, "60"]], state.sleepAt ? state.sleepMin : 0)}</div>`;
}
function toggleRecMenu(btn) {
  const menu = btn.parentElement.querySelector(".menu");
  const show = menu.hidden;
  document.querySelectorAll(".menu").forEach((m) => { m.hidden = true; m.parentElement.querySelector("[aria-expanded]").setAttribute("aria-expanded", "false"); });
  if (show) { menu.innerHTML = recMenuHtml(); menu.hidden = false; btn.setAttribute("aria-expanded", "true"); }
}
function refreshRecMenu() { document.querySelectorAll(".menu:not([hidden])").forEach((m) => (m.innerHTML = recMenuHtml())); const rl = $(".recline"); if (rl) rl.textContent = `${rec().nom} · ${state.verseMode ? "avec traduction" : "récitation seule"}`; }
function setMode(m) {
  state.verseMode = m === "texte"; store.set("verseMode", state.verseMode);
  if (state.current) {
    const c = state.current;
    if (state.verseMode && c.k == null) playVerseMode(c.n, 1);
    else if (!state.verseMode && c.k != null) playSurah(c.n);
  }
  refreshRecMenu();
  if (!$("#playerSheet").hidden) renderPlayer();
}
document.addEventListener("click", (e) => {
  if (!e.target.closest(".gearwrap")) document.querySelectorAll(".menu:not([hidden])").forEach((m) => { m.hidden = true; m.parentElement.querySelector("[aria-expanded]").setAttribute("aria-expanded", "false"); });
}, true);

// ---------- Mini lecteur et lecteur plein écran ----------
function renderMiniBtn() { const b = $("#miniPlay"); b.innerHTML = audio.paused ? I.play : I.pause; b.setAttribute("aria-label", audio.paused ? "Lecture" : "Pause"); }
function renderMini() {
  const mini = $("#mini");
  const last = store.get("last", null);
  const n = state.current ? state.current.n : last ? last.n : null;
  if (!n) { mini.hidden = true; return; }
  mini.hidden = false;
  const s = S(n);
  $("#miniTitle").textContent = s.fr;
  $("#miniSub").textContent = state.current ? (state.current.k ? `Verset ${state.current.k} sur ${s.ayahs}` : rec().nom) + (state.current.offline ? " · hors-ligne" : "") : "Reprendre l'écoute";
  $("#miniNext").innerHTML = I.next; renderMiniBtn();
}
function openPlayer() { if (!state.current) { const l = store.get("last", null); if (l) playSurah(l.n, l.t); else return; } $("#playerSheet").hidden = false; document.body.style.overflow = "hidden"; renderPlayer(); }
function closeSheet(id) { $(id).hidden = true; document.body.style.overflow = ""; }
const verseHtml = (v, last) => `<div class="fv${last ? " now" : ""}" data-fk="${v.n}-${v.k}"><span class="fk">${v.k}</span><p class="q">${v.ar}</p><p class="fr">${esc(v.fr)}</p></div>`;
function renderPlayer() {
  if (!state.current) return;
  const s = S(state.current.n), vm = state.current.k != null;
  $("#playerSheet").innerHTML = `<div class="player">
    <div class="phead">
      <button class="icon-btn" data-act="closePlayer" aria-label="Fermer">${I.chevDown}</button>
      <div class="ptitle"><b>${esc(s.fr)}</b><small id="pSub">${esc(s.tr)} · ${vm ? `verset ${state.current.k}/${s.ayahs}` : esc(rec().nom)}</small></div>
      ${recGear()}
    </div>
    ${vm ? `<div class="feed" id="feed">${s.n !== 1 && s.n !== 9 && feed[0] && feed[0].k === 1 ? `<p class="basmala">${BASMALA}</p>` : ""}${feed.map((v, i) => verseHtml(v, i === feed.length - 1)).join("")}</div>`
      : `<div class="pcover"><span class="ar">${s.ar}</span><span class="muted">Sourate ${s.n} · ${s.ayahs} versets · ${s.type}</span></div>`}
    <div class="pbottom">
      <div class="seek"><input type="range" id="seek" min="0" step="1" value="${audio.currentTime || 0}" max="${audio.duration || 0}" aria-label="Position"><div class="row"><span id="tCur">${fmt(audio.currentTime)}</span><span id="tDur">${fmt(audio.duration)}</span></div></div>
      <div class="pctl">
        <button data-act="prev" aria-label="Sourate précédente">${I.prev}</button>
        <button class="big" id="bigPlay" data-act="toggle" aria-label="Lecture ou pause">${audio.paused ? I.play : I.pause}</button>
        <button data-act="next" aria-label="Sourate suivante">${I.next}</button>
      </div>
    </div>
  </div>`;
  const f = $("#feed"); if (f) f.scrollTop = f.scrollHeight;
}
// Ajoute le nouveau verset en bas ; les précédents remontent et s'estompent.
function updateFeed() {
  const f = $("#feed"); if (!f) return;
  const v = feed[feed.length - 1];
  f.querySelectorAll(".fv.now").forEach((e) => e.classList.remove("now"));
  if (!f.querySelector(`[data-fk="${v.n}-${v.k}"]`)) f.insertAdjacentHTML("beforeend", verseHtml(v, true));
  else f.querySelector(`[data-fk="${v.n}-${v.k}"]`).classList.add("now");
  const s = S(v.n); const sub = $("#pSub"); if (sub) sub.textContent = `${s.tr} · verset ${v.k}/${s.ayahs}`;
  f.scrollTo({ top: f.scrollHeight, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

// ---------- Lire ----------
function viewRead() {
  const ms = Object.entries(marks).map(([n, k]) => [+n, k]).sort((a, b) => a[0] - b[0]);
  return `<section class="view">
    ${ms.length ? `<div class="field"><span class="eyebrow">Marque-pages</span><div class="chips">${ms.map(([n, k]) => `<button class="chip" data-act="readAt" data-n="${n}" data-k="${k}">${I.bookmarkOn}${esc(S(n).fr)} · v. ${k}</button>`).join("")}</div></div>` : ""}
    <input class="search" id="q" type="search" placeholder="Chercher une sourate à lire" value="${esc(state.query)}" autocomplete="off">
    <div class="list">${filtered("lire").map((n) => surahRow(n, "lire")).join("")}</div>
  </section>`;
}
const textCache = new Map();
async function getText(n) {
  if (textCache.has(n)) return textCache.get(n);
  const r = await fetch(textUrl(n)); if (!r.ok) throw new Error(r.status);
  const j = await r.json(); const [ar, tr, fr] = j.data;
  const ayahs = ar.ayahs.map((a, i) => {
    let t = a.text.replace(/^﻿/, "");
    // Le verset 1 contient la basmala (sauf sourates 1 et 9) : on retire ses 4 mots, affichés en en-tête.
    if (n !== 1 && n !== 9 && i === 0) { const w = t.split(/\s+/); if (w.length > 4 && w[0].startsWith("ب")) t = w.slice(4).join(" "); }
    return { k: a.numberInSurah, ar: t, tr: tr.ayahs[i].text, fr: fr.ayahs[i].text };
  });
  textCache.set(n, ayahs); return ayahs;
}
let readingN = null;
async function openReader(n, goTo) {
  readingN = n; closeSheet("#playerSheet");
  const sh = $("#readerSheet"); sh.hidden = false; document.body.style.overflow = "hidden"; sh.scrollTop = 0;
  const s = S(n);
  sh.innerHTML = `<div class="sheet-in">
    <div class="sheet-head"><button class="icon-btn" data-act="closeReader" aria-label="Fermer">${I.close}</button><div><b>${s.n}. ${esc(s.fr)}</b><div class="muted" style="font-size:12.5px">${esc(s.tr)} · ${s.ayahs} versets</div></div><button class="icon-btn" data-act="verses" data-n="${n}" aria-label="Écouter verset par verset">${I.ear}</button></div>
    <div class="toggles">
      <button class="chip" data-tog="showTr" aria-pressed="${state.showTr}">Phonétique</button>
      <button class="chip" data-tog="showFr" aria-pressed="${state.showFr}">Traduction</button>
      <button class="chip" data-size="-2" aria-label="Texte plus petit">A−</button><button class="chip" data-size="2" aria-label="Texte plus grand">A+</button>
    </div>
    <div id="ayahs"><p class="muted">Chargement du texte…</p></div>
  </div>
  <div class="rbar" id="rbar" hidden></div>`;
  sh.onscroll = trackReading;
  try {
    const ayahs = await getText(n); if (readingN !== n) return;
    $("#ayahs").innerHTML = (n !== 1 && n !== 9 ? `<p class="basmala">${BASMALA}</p>` : "") + ayahs.map((a) => { const mk = marks[n] === a.k; return `<div class="ayah${mk ? " marked" : ""}" data-k="${a.k}" style="--qsize:${state.qsize}px">
      <p class="q">${a.ar}<span class="num">${a.k}</span></p>
      <p class="tr"${state.showTr ? "" : " hidden"}>${esc(a.tr)}</p>
      <p class="fr"${state.showFr ? "" : " hidden"}>${esc(a.fr)}</p>
      <div class="ayah-tools"><button data-act="verse" data-n="${n}" data-k="${a.k}">${I.speaker}Écouter d'ici</button><button data-act="mark" data-n="${n}" data-k="${a.k}" aria-pressed="${mk}">${mk ? I.bookmarkOn : I.bookmark}Marque-page</button></div>
    </div>`; }).join("");
    if (goTo > 1) { const el = sh.querySelector(`.ayah[data-k="${goTo}"]`); if (el) el.scrollIntoView({ block: "start" }); sh.scrollTop -= 70; }
    updateReaderBar();
  } catch {
    $("#ayahs").innerHTML = `<p class="note">Le texte n'a pas pu être chargé. Il faut du réseau la première fois, ensuite la sourate reste disponible hors-ligne.</p>`;
  }
}
// Barre qui suit le défilement pendant l'écoute : pause, arrêt, retour au verset en cours.
function updateReaderBar() {
  const bar = $("#rbar"); if (!bar) return;
  const c = state.current;
  if ($("#readerSheet").hidden || !c || c.k == null || c.n !== readingN) { bar.hidden = true; return; }
  bar.hidden = false;
  bar.innerHTML = `<button class="rb-go" data-act="goVerse" aria-label="Aller au verset en cours">${audio.paused ? "En pause" : "Écoute"} · verset ${c.k}</button>
    <button class="rb-btn" data-act="toggle" aria-label="${audio.paused ? "Reprendre" : "Pause"}">${audio.paused ? I.play : I.pause}</button>
    <button class="rb-btn" data-act="stopListen" aria-label="Arrêter l'écoute">${I.stop}</button>`;
}
function stopListen() {
  audio.pause(); state.current = null;
  document.querySelectorAll(".ayah.on").forEach((e) => e.classList.remove("on"));
  updateReaderBar(); renderMini(); refreshRows();
}

// ---------- Apprendre ----------
const LEARN_TABS = [["alphabet", "Alphabet"], ["lecons", "Leçons"], ["ecrire", "Écrire"], ["quiz", "Quiz"], ["essentiel", "L'essentiel"]];
let learnDetail = null; // lettre ouverte ou leçon ouverte
let traceIdx = 0;
let quiz = null;
const mastered = () => window.LETTERS.filter((L) => (state.mastery[L.c] || 0) >= 3).length;

function viewLearn() {
  const seg = `<div class="seg" role="tablist">${LEARN_TABS.map(([id, l]) => `<button role="tab" data-learn="${id}" aria-selected="${state.learn === id}">${l}</button>`).join("")}</div>`;
  let body = "";
  if (state.learn === "alphabet") body = learnDetail != null ? letterDetail(window.LETTERS[learnDetail]) : alphabetGrid();
  else if (state.learn === "lecons") body = learnDetail != null ? lessonDetail(learnDetail) : lessonList();
  else if (state.learn === "ecrire") body = traceView();
  else if (state.learn === "quiz") body = quizView();
  else body = basicsView();
  return `<section class="view">${seg}${body}</section>`;
}
function alphabetGrid() {
  const m = mastered();
  return `<div><h2>Les 28 lettres</h2><p class="muted">De droite à gauche, dans l'ordre de l'alphabet. Touche une lettre pour voir ses formes et l'entendre.</p></div>
  <div class="progress-line"><span>${m} / 28 maîtrisées</span><div class="track"><div class="fill" style="width:${(m / 28) * 100}%"></div></div></div>
  <div class="letters">${window.LETTERS.map((L, i) => `<button class="lcell${(state.mastery[L.c] || 0) >= 3 ? " m" : ""}" data-letter="${i}"><span class="ar">${L.c}</span><small>${esc(L.n)}</small></button>`).join("")}</div>
  <p class="note">Un point vert = lettre reconnue 3 fois de suite dans le quiz.</p>`;
}
function letterDetail(L) {
  const i = window.LETTERS.indexOf(L);
  return `<div class="row"><button class="btn ghost" data-act="learnBack">← Alphabet</button></div>
  <div class="card">
    <div class="lhero"><span class="ar">${L.c}</span><div><div class="eyebrow">Lettre ${i + 1} sur 28</div><h2>${esc(L.n)}</h2><p class="muted">Se transcrit « ${esc(L.t)} »</p></div></div>
    <p>${esc(L.p)}</p>
    <div class="row"><button class="btn" data-say="${L.c}">${I.speaker}Écouter</button><button class="btn ghost" data-say="${L.c}َ ${L.c}ِ ${L.c}ُ">${I.speaker}${L.c}َ ${L.c}ِ ${L.c}ُ</button><button class="btn ghost" data-act="traceThis" data-i="${i}">${I.pen}Tracer</button></div>
  </div>
  <div class="card"><h3>Ses formes dans un mot</h3>
    <div class="forms">${letterForms(L).map(([l, f]) => `<div><span class="ar">${f}</span><small>${l}</small></div>`).join("")}</div>
    ${L.j ? "" : `<p class="muted" style="font-size:13.5px">Cette lettre ne s'attache jamais à la lettre suivante : ses formes de début et de milieu ressemblent à sa forme seule.</p>`}
    <p class="muted" style="font-size:13.5px">${esc(L.w)}</p>
  </div>
  <div class="row">${i > 0 ? `<button class="btn ghost" data-letter="${i - 1}">← ${window.LETTERS[i - 1].c} ${esc(window.LETTERS[i - 1].n)}</button>` : ""}${i < 27 ? `<button class="btn ghost" data-letter="${i + 1}" style="margin-left:auto">${esc(window.LETTERS[i + 1].n)} ${window.LETTERS[i + 1].c} →</button>` : ""}</div>`;
}
function lessonList() {
  return `<div><h2>Apprendre à lire</h2><p class="muted">Six leçons courtes, dans l'ordre. Fais d'abord l'alphabet.</p></div>
  <div class="list">${window.LESSONS.map((l, i) => `<button class="lesson${state.lessonsDone.has(l.id) ? " done" : ""}" data-lesson="${i}"><span class="k">${state.lessonsDone.has(l.id) ? "✓" : i + 1}</span><span>${esc(l.titre)}</span>›</button>`).join("")}</div>`;
}
function lessonDetail(i) {
  const l = window.LESSONS[i];
  return `<div class="row"><button class="btn ghost" data-act="learnBack">← Leçons</button></div>
  <div><div class="eyebrow">Leçon ${i + 1} sur ${window.LESSONS.length}</div><h2>${esc(l.titre)}</h2></div>
  <div class="prose">${l.corps.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  <div class="examples">${l.exemples.map(([a, t, s]) => `<button class="ex" data-say="${a}"><span class="q">${a}</span><b>${esc(t)}</b><small>${esc(s)}</small></button>`).join("")}</div>
  <p class="muted" style="font-size:13px">Touche un exemple pour l'entendre (voix arabe du téléphone).</p>
  <div class="row"><button class="btn" data-act="lessonDone" data-i="${i}">${state.lessonsDone.has(l.id) ? "Leçon terminée ✓" : "J'ai compris"}</button>${i < window.LESSONS.length - 1 ? `<button class="btn ghost" data-lesson="${i + 1}">Leçon suivante →</button>` : ""}</div>`;
}
function traceView() {
  const L = window.LETTERS[traceIdx];
  return `<div><h2>Écrire</h2><p class="muted">Repasse la lettre avec ton doigt. Commence par la droite.</p></div>
  <div class="chips">${window.LETTERS.map((x, i) => `<button class="chip ar" style="font-size:20px;padding:4px 14px" data-trace="${i}" aria-pressed="${i === traceIdx}">${x.c}</button>`).join("")}</div>
  <div class="trace-wrap" id="traceWrap"><div class="baseline"></div><div class="ghost" id="ghost">${L.c}</div><canvas id="traceCv"></canvas></div>
  <p class="muted" style="text-align:center">${esc(L.n)} · ${esc(L.w)}</p>
  <div class="row" style="justify-content:center">
    <button class="btn ghost" data-act="traceForm">Forme : <span id="formLbl">seule</span></button>
    <button class="btn ghost" data-act="traceClear">${I.trash}Effacer</button>
    <button class="btn" data-act="traceNext">Lettre suivante →</button>
  </div>`;
}
let traceForm = 0;
function afterLearn() {
  if (state.learn === "ecrire") setupTrace();
  if (state.learn === "quiz" && !quiz) newQuestion();
}
function setupTrace() {
  const cv = $("#traceCv"); if (!cv) return;
  const L = window.LETTERS[traceIdx]; const forms = letterForms(L);
  $("#ghost").textContent = forms[traceForm][1]; $("#formLbl").textContent = forms[traceForm][0].toLowerCase();
  const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1;
  cv.width = r.width * d; cv.height = r.height * d;
  const x = cv.getContext("2d"); x.scale(d, d);
  x.lineCap = "round"; x.lineJoin = "round"; x.lineWidth = Math.max(10, r.width / 28);
  x.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  let drawing = false, lx = 0, ly = 0;
  const pos = (e) => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.onpointerdown = (e) => { drawing = true; cv.setPointerCapture(e.pointerId); [lx, ly] = pos(e); x.beginPath(); x.arc(lx, ly, x.lineWidth / 2, 0, 7); x.fillStyle = x.strokeStyle; x.fill(); };
  cv.onpointermove = (e) => { if (!drawing) return; const [px, py] = pos(e); x.beginPath(); x.moveTo(lx, ly); x.lineTo(px, py); x.stroke(); lx = px; ly = py; };
  cv.onpointerup = cv.onpointercancel = () => (drawing = false);
}
// Quiz : trois types de questions, les lettres les moins maîtrisées reviennent plus souvent.
function newQuestion() {
  const Ls = window.LETTERS;
  const weights = Ls.map((L) => 1 / (1 + (state.mastery[L.c] || 0)));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0), idx = 0;
  while ((r -= weights[idx]) > 0) idx++;
  const L = Ls[Math.min(idx, 27)];
  const kind = ["nom", "lettre", "forme"][Math.floor(Math.random() * 3)];
  const others = shuffle(Ls.filter((x) => x !== L)).slice(0, 3);
  const opts = shuffle([L, ...others]);
  let shownForm = L.c;
  if (kind === "forme") { const f = letterForms(L); shownForm = f[1 + Math.floor(Math.random() * 3)][1]; }
  quiz = { L, kind, opts, shownForm, answered: null, good: quiz ? quiz.good : 0, total: quiz ? quiz.total : 0 };
}
function quizView() {
  if (!quiz) newQuestion();
  const q = quiz;
  const prompt = q.kind === "nom" ? `<span class="eyebrow">Quelle est cette lettre ?</span><span class="ar">${q.L.c}</span>`
    : q.kind === "forme" ? `<span class="eyebrow">Cette forme vient de quelle lettre ?</span><span class="ar">${q.shownForm}</span>`
    : `<span class="eyebrow">Trouve la lettre</span><span class="big-txt">${esc(q.L.n)}</span><span class="muted">son « ${esc(q.L.t)} »</span>`;
  const btns = q.opts.map((o, i) => {
    let cls = ""; if (q.answered != null) { if (o === q.L) cls = "ok"; else if (i === q.answered) cls = "ko"; }
    return `<button class="${cls}" data-answer="${i}"${q.answered != null ? " disabled" : ""}>${q.kind === "lettre" ? `<span class="ar">${o.c}</span>` : esc(o.n)}</button>`;
  }).join("");
  return `<div class="score"><span>Score : ${q.good} / ${q.total}</span><span>${mastered()} / 28 lettres maîtrisées</span></div>
  <div class="card"><div class="quiz-q">${prompt}</div><div class="answers">${btns}</div>
  ${q.answered != null ? `<p>${q.opts[q.answered] === q.L ? "Juste." : `C'était <b>${esc(q.L.n)}</b> <span class="ar" style="font-size:22px">${q.L.c}</span>.`} ${esc(q.L.p)}</p><div class="row"><button class="btn" data-act="quizNext">Question suivante →</button><button class="btn ghost" data-say="${q.L.c}">${I.speaker}Écouter</button></div>` : ""}
  </div>`;
}
function basicsView() {
  return `<div><h2>L'essentiel à savoir</h2><p class="muted">Les bases, à revoir de temps en temps.</p></div>
  ${window.BASICS.map((b) => `<div class="card basics"><h3>${esc(b.titre)}</h3><dl>${b.items.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl></div>`).join("")}
  <p class="note">Pour la pratique (ablutions, gestes de la prière, règles détaillées), rien ne remplace un professeur ou l'imam de ta mosquée.</p>`;
}

// ---------- Histoire ----------
function viewHistory() {
  return `<section class="view">
    <div><h2>Histoire de l'islam</h2><p class="muted">De la naissance du Prophète ﷺ aux grands empires. Les dates de la vie du Prophète avant l'Hégire sont approximatives.</p></div>
    <div class="timeline">${window.HISTORY.map((e) => `<article class="ev"><span class="date">${esc(e.y)}${e.h ? ` <em>· ${esc(e.h)} de l'Hégire</em>` : ""}</span><h3>${esc(e.t)}</h3><p>${esc(e.d)}</p></article>`).join("")}</div>
  </section>`;
}

// ---------- Thème ----------
function applyTheme() {
  const t = store.get("theme", null);
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  const dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const tb = $("#themeBtn"); if (tb) tb.innerHTML = dark ? I.sun : I.moon;
  document.querySelector('meta[name="theme-color"]').content = dark ? "#231e11" : "#f5efd8";
}

// ---------- Événements ----------
document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  const d = t.dataset, n = d.n ? +d.n : null;
  if (d.tab) return go(d.tab);
  if (d.filter) { state.filter = d.filter; return render(); }
  if (d.learn) { state.learn = d.learn; store.set("learn", d.learn); learnDetail = null; return render(); }
  if (d.letter != null) { state.learn = "alphabet"; learnDetail = +d.letter; render(); return window.scrollTo(0, 0); }
  if (d.lesson != null) { learnDetail = +d.lesson; render(); return window.scrollTo(0, 0); }
  if (d.say) return say(d.say);
  if (d.trace != null) { traceIdx = +d.trace; traceForm = 0; return render(); }
  if (d.answer != null) {
    const i = +d.answer; quiz.answered = i; quiz.total++;
    const ok = quiz.opts[i] === quiz.L;
    if (ok) quiz.good++;
    state.mastery[quiz.L.c] = ok ? (state.mastery[quiz.L.c] || 0) + 1 : 0; store.set("mastery", state.mastery);
    if (ok) setTimeout(() => { if (quiz && quiz.answered === i && state.learn === "quiz") { newQuestion(); render(); } }, 900);
    return render();
  }
  if (d.set) {
    const v = d.v;
    if (d.set === "mode") return setMode(v);
    if (d.set === "repeat") { state.repeat = v; store.set("repeat", v); }
    if (d.set === "rate") { state.rate = +v; audio.playbackRate = state.rate; store.set("rate", state.rate); }
    if (d.set === "sleep") { const m = +v; state.sleepMin = m; state.sleepAt = m ? Date.now() + m * 60000 : 0; if (m) toast(`Pause automatique dans ${m} minutes.`); }
    return refreshRecMenu();
  }
  if (d.day) { dayOffset += +d.day; return render(); }
  if (d.pview) return setPrayer({ view: d.pview });
  if (d.repeat) { state.repeat = d.repeat; store.set("repeat", d.repeat); return renderPlayer(); }
  if (d.rate) { state.rate = +d.rate; audio.playbackRate = state.rate; store.set("rate", state.rate); return renderPlayer(); }
  if (d.sleep != null) { const m = +d.sleep; state.sleepAt = m ? Date.now() + m * 60000 : 0; if (m) toast(`Pause automatique dans ${m} minutes.`); return renderPlayer(); }
  if (d.tog) {
    state[d.tog] = !state[d.tog]; store.set(d.tog, state[d.tog]); t.setAttribute("aria-pressed", state[d.tog]);
    document.querySelectorAll(d.tog === "showTr" ? ".ayah .tr" : ".ayah .fr").forEach((p) => (p.hidden = !state[d.tog])); return;
  }
  if (d.size) { state.qsize = Math.min(48, Math.max(22, state.qsize + +d.size)); store.set("qsize", state.qsize); document.querySelectorAll(".ayah").forEach((a) => a.style.setProperty("--qsize", state.qsize + "px")); return; }
  switch (d.act) {
    case "play": if (state.current && state.current.n === n && state.current.reciter === state.reciter) { audio.paused ? audio.play() : audio.pause(); } else playSurah(n); if (!$("#readerSheet").hidden) closeSheet("#readerSheet"); break;
    case "read": openReader(n); break;
    case "resume": { const l = store.get("last", null); if (l) { if (l.reciter !== state.reciter) { state.reciter = l.reciter; store.set("reciter", l.reciter); loadDownloaded().then(render); } playSurah(l.n, l.t); render(); } break; }
    case "fav": state.favs.has(n) ? state.favs.delete(n) : state.favs.add(n); store.set("favs", [...state.favs]); refreshRows(); break;
    case "rowMenu": openRow = openRow === n ? null : n; refreshRows(); break;
    case "recMenu": toggleRecMenu(t); break;
    case "dl": download(+t.dataset.dl); break;
    case "undl": removeDownload(+t.dataset.dl); break;
    case "toggle": togglePlay(); break;
    case "geo":
      if (!navigator.geolocation) { toast("La localisation n'est pas disponible ici. Choisis une ville."); break; }
      toast("Recherche de ta position…");
      navigator.geolocation.getCurrentPosition(
        (pos) => { setPrayer({ loc: { name: "Ma position", lat: pos.coords.latitude, lng: pos.coords.longitude } }); toast("Horaires calculés pour ta position."); },
        () => toast("Position refusée ou introuvable. Choisis une ville dans la liste."),
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 3600000 });
      break;
    case "prev": nextSurah(-1); break;
    case "next": nextSurah(1); break;
    case "back15": audio.currentTime = Math.max(0, audio.currentTime - 15); break;
    case "fwd15": audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15); break;
    case "closePlayer": closeSheet("#playerSheet"); break;
    case "closeReader": closeSheet("#readerSheet"); if (state.tab === "lire") render(); break;
    case "verse": playVerseMode(n, +d.k); break;
    case "verses": playVerseMode(n, 1); break;
    case "readAt": openReader(n, +d.k); break;
    case "mark": toggleMark(n, +d.k); break;
    case "stopListen": stopListen(); break;
    case "goVerse": if (state.current && state.current.k) markVerse(state.current.n, state.current.k); break;
    case "learnBack": learnDetail = null; render(); break;
    case "lessonDone": state.lessonsDone.add(window.LESSONS[+d.i].id); store.set("lessonsDone", [...state.lessonsDone]); render(); break;
    case "traceThis": traceIdx = +d.i; traceForm = 0; state.learn = "ecrire"; learnDetail = null; render(); break;
    case "traceClear": setupTrace(); break;
    case "traceForm": traceForm = (traceForm + 1) % 4; setupTrace(); break;
    case "traceNext": traceIdx = (traceIdx + 1) % 28; traceForm = 0; render(); break;
    case "quizNext": newQuestion(); render(); break;
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "q") {
    state.query = e.target.value;
    const listEl = e.target.parentElement.querySelector(".list"); const mode = state.tab === "lire" ? "lire" : "ecouter";
    const ns = filtered(mode); listEl.innerHTML = ns.length ? ns.map((n) => surahRow(n, mode)).join("") : `<div class="srow"><p class="muted">Aucune sourate ne correspond.</p></div>`;
  }
  if (e.target.id === "seek") { e.target.dataset.drag = "1"; $("#tCur").textContent = fmt(+e.target.value); }
});
document.addEventListener("change", async (e) => {
  if (e.target.id === "reciterSel") { state.reciter = e.target.value; store.set("reciter", state.reciter); await loadDownloaded(); if (state.tab === "ecouter") { const m = $(".view .menu"); const open = m && !m.hidden; render(); if (open) toggleRecMenu($(".view [data-act=recMenu]")); } refreshRecMenu(); if (state.current) { const t = audio.currentTime; const playing = !audio.paused; if (playing) playSurah(state.current.n); else { state.current = null; renderMini(); } } }
  if (e.target.id === "countrySel") setCountry(e.target.value);
  if (e.target.id === "citySel" && e.target.value) setCity(e.target.value);
  if (e.target.id === "methodSel") setPrayer({ method: e.target.value });
  if (e.target.id === "asrSel") setPrayer({ asr: +e.target.value });
  if (e.target.id === "seek") { audio.currentTime = +e.target.value; delete e.target.dataset.drag; }
});
$("#miniPlay").onclick = (e) => { e.stopPropagation(); togglePlay(); };
$("#miniNext").onclick = (e) => { e.stopPropagation(); nextSurah(1); };
$("#miniOpen").onclick = openPlayer;
if ($("#themeBtn")) $("#themeBtn").onclick = () => {
  const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  store.set("theme", cur === "dark" ? "light" : "dark"); applyTheme(); if (!$("#playerSheet").hidden) renderPlayer();
};
window.addEventListener("hashchange", () => { const h = location.hash.slice(1); if (TABS.some((t) => t.id === h) && h !== state.tab) go(h); });
window.addEventListener("resize", () => { if (state.tab === "apprendre" && state.learn === "ecrire") setupTrace(); });
window.addEventListener("offline", () => toast("Hors connexion : seules les sourates téléchargées sont disponibles."));

// ---------- Démarrage ----------
(async function start() {
  const h = location.hash.slice(1); if (TABS.some((t) => t.id === h)) state.tab = h;
  applyTheme(); renderTabs(); render(); renderMini();
  await loadDownloaded(); if (state.tab === "ecouter") refreshRows();

})();
