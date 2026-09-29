// Owns offline behaviour for the installed app (web and the Android wrapper).
//
// Deliberately small. It caches only an offline page and the icons, and
// answers a failed page load with that offline page. It never caches pages,
// API responses or recordings: every screen here is user-specific, and a
// cached audit or queue shown as current would be wrong in the worst way.

const CACHE = "edusarthi-shell-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Old versions of the shell cache are dropped when a new worker takes over.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Page loads only. Everything else goes to the network untouched.
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});
