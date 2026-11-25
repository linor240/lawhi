// Service worker Lawhi.
// Chaque version a son propre cache : la nouvelle version se télécharge en arrière-plan,
// puis attend que l'utilisateur (ou la mise à jour automatique) l'installe.
const VERSION = "1.3.1";
const SHELL = "lawhi-shell-" + VERSION, DATA = "lawhi-data-v1", AUDIO = "lawhi-audio-v1";
const FILES = ["./", "index.html", "app.js", "surahs.js", "content.js", "prayer.js", "prayer-view.js", "update.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))));
  // Première installation : pas d'ancienne version à remplacer, on active tout de suite.
  if (!self.registration.active) self.skipWaiting();
});
self.addEventListener("message", (e) => { if (e.data === "installer") self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith("lawhi-") && ![SHELL, DATA, AUDIO].includes(k)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.origin === location.origin) {
    if (u.pathname.endsWith("/version.json")) return; // toujours le réseau
    // Fichiers de l'appli : ceux de la version installée (cache), le réseau en secours.
    e.respondWith(caches.open(SHELL).then((c) => c.match(e.request, { ignoreSearch: true })
      .then((hit) => hit || fetch(e.request).catch(() => c.match("index.html")))));
  } else if (u.host === "api.alquran.cloud" || u.host === "fonts.googleapis.com" || u.host === "fonts.gstatic.com") {
    e.respondWith(caches.open(DATA).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok || r.type === "opaque") c.put(e.request, r.clone());
      return r;
    }))));
  }
});
