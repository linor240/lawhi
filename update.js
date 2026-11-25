"use strict";
// Mises à jour de Lawhi, sur le modèle de Lagon :
// vérification 30 s après l'ouverture puis toutes les 6 h, point rouge sur l'engrenage,
// « Version X · à jour » avec un bouton Vérifier / Installer dans les réglages,
// et installation automatique quand l'appli n'est pas utilisée (option).
const APP_VERSION = "1.3.0";
const up = { status: "idle", available: null, notes: [], error: "", lastCheck: 0 };
let swReg = null;

const newer = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
const autoUpdate = () => store.get("autoUpdate", true);

function upText() {
  return {
    checking: "Recherche de mise à jour…",
    downloading: `Téléchargement de la version ${up.available}…`,
    available: `Version ${up.available} disponible (tu as la ${APP_VERSION})`,
    uptodate: `Version ${APP_VERSION} · à jour`,
    error: `Version ${APP_VERSION} · vérification impossible`
  }[up.status] || `Version ${APP_VERSION}`;
}
function renderUpdate() {
  const g = $("#gearBtn"); if (g) g.classList.toggle("has-update", up.status === "available");
  if (!$("#settingsSheet").hidden) renderSettings();
}
function setUp(patch) { Object.assign(up, patch); renderUpdate(); }

// Attend que le service worker ait fini de télécharger la nouvelle version.
function watchWaiting() {
  if (!swReg) return;
  if (swReg.waiting) { setUp({ status: "available" }); maybeAutoInstall(); return; }
  const sw = swReg.installing;
  if (sw) sw.addEventListener("statechange", () => { if (sw.state === "installed") watchWaiting(); if (sw.state === "redundant") setUp({ status: "error", error: "Le téléchargement a échoué." }); });
}

async function checkUpdate(manual = false) {
  if (up.status === "checking" || up.status === "downloading") return;
  if (up.status === "available") { if (manual) installUpdate(); return; }
  setUp({ status: "checking", error: "" });
  try {
    const r = await fetch("version.json?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("Serveur indisponible (" + r.status + ")");
    const v = await r.json();
    up.lastCheck = Date.now(); store.set("lastCheck", up.lastCheck);
    if (!newer(v.version, APP_VERSION)) { setUp({ status: "uptodate", available: null, notes: [] }); return; }
    setUp({ status: "downloading", available: v.version, notes: v.notes || [] });
    if (!manual) toast(`Mise à jour ${v.version} disponible : Réglages`);
    if (!swReg) { setUp({ status: "available" }); return; }
    if (swReg.waiting) return watchWaiting();
    swReg.addEventListener("updatefound", watchWaiting, { once: true });
    await swReg.update();
    watchWaiting();
  } catch (e) {
    setUp({ status: "error", error: navigator.onLine ? String(e.message || e) : "Pas de connexion." });
  }
}

let reloading = false;
function installUpdate() {
  if (swReg && swReg.waiting) { swReg.waiting.postMessage("installer"); return; }
  location.reload(); // pas de service worker : un simple rechargement suffit
}
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading || !store.get("hadController", false)) { store.set("hadController", true); return; }
    reloading = true; store.set("justUpdatedFrom", APP_VERSION); location.reload();
  });
}

// Installation automatique : seulement quand ça ne dérange pas (rien en lecture, appli en arrière-plan ou juste ouverte).
let openedAt = Date.now();
function maybeAutoInstall() {
  if (!autoUpdate() || up.status !== "available") return;
  const playing = typeof audio !== "undefined" && !audio.paused;
  if (playing) return;
  if (document.visibilityState === "hidden" || Date.now() - openedAt < 8000) installUpdate();
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") maybeAutoInstall();
  else if (Date.now() - (up.lastCheck || 0) > 3600000) checkUpdate();
});

// ---------- Réglages ----------
function openSettings() { $("#settingsSheet").hidden = false; document.body.style.overflow = "hidden"; renderSettings(); }
function renderSettings() {
  const btnLabel = up.status === "available" ? "Installer" : "Vérifier";
  const busy = up.status === "checking" || up.status === "downloading";
  const theme = store.get("theme", "system");
  const notes = up.status === "available" || up.status === "downloading" ? up.notes : [];
  const last = store.get("lastCheck", 0);
  $("#settingsSheet").innerHTML = `<div class="sheet-in">
    <div class="sheet-head"><button class="icon-btn" data-act="closeSettings" aria-label="Fermer">${I.close}</button><div><b>Réglages</b></div><span class="icon-btn"></span></div>
    <div class="card up-row${up.status === "available" ? " ready" : ""}">
      <div class="eyebrow">Mises à jour</div>
      <div class="row" style="justify-content:space-between;flex-wrap:nowrap">
        <b style="min-width:0">${esc(upText())}</b>
        <button class="btn${up.status === "available" ? "" : " ghost"}" id="upBtn"${busy ? " disabled" : ""}>${btnLabel}</button>
      </div>
      ${up.status === "error" && up.error ? `<p class="muted" style="font-size:13px">${esc(up.error)}</p>` : ""}
      ${notes.length ? `<div><div class="eyebrow" style="margin-bottom:6px">Nouveautés de la ${esc(up.available)}</div><ul class="notes">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>` : ""}
      <label class="sw-row" for="autoUp"><span>Installer automatiquement<small>quand l'appli n'est pas utilisée et que rien n'est en lecture</small></span><input type="checkbox" id="autoUp"${autoUpdate() ? " checked" : ""}><i class="sw"></i></label>
      <p class="muted" style="font-size:12.5px">${last ? "Dernière vérification : " + new Date(last).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "Pas encore vérifié."} Vérification automatique à l'ouverture puis toutes les 6 heures.</p>
    </div>
    <div class="card"><div class="eyebrow">Apparence</div>
      <div class="popts">${[["system", "Auto", "comme le téléphone"], ["light", "Clair", "jour"], ["dark", "Sombre", "nuit"]].map(([id, l, s]) => `<button data-theme-set="${id}" aria-pressed="${theme === id}">${l}<small>${s}</small></button>`).join("")}</div>
    </div>
    <p class="muted" style="font-size:12.5px;text-align:center">Lawhi ${APP_VERSION} · récitations : mp3quran.net et everyayah.com · texte et traduction : alquran.cloud</p>
  </div>`;
  $("#upBtn").onclick = () => checkUpdate(true);
  $("#autoUp").onchange = (e) => { store.set("autoUpdate", e.target.checked); if (e.target.checked) maybeAutoInstall(); };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.id === "gearBtn") openSettings();
  if (t.dataset.act === "closeSettings") closeSheet("#settingsSheet");
  if (t.dataset.themeSet) {
    const v = t.dataset.themeSet; if (v === "system") { try { localStorage.removeItem("lawhi:theme"); } catch {} } else store.set("theme", v);
    applyTheme(); renderSettings();
  }
});

// ---------- Démarrage ----------
(async function startUpdates() {
  const from = store.get("justUpdatedFrom", null);
  if (from && from !== APP_VERSION) setTimeout(() => toast(`Lawhi est passée à la version ${APP_VERSION}.`), 600);
  store.set("justUpdatedFrom", null);
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  try {
    if (navigator.serviceWorker.controller) store.set("hadController", true);
    swReg = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
    if (swReg.waiting) checkUpdate();
  } catch {}
  setTimeout(() => checkUpdate(), 30000);
  setInterval(() => checkUpdate(), 6 * 3600000);
})();
