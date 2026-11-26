/* Minimal PWA service worker: offline shell + runtime cache for images.
   Push notifications are added in build phase 5. */
const SHELL = "fc-shell-v1";
const IMG = "fc-img-v1";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(["/", "/used-cars", "/saved"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => ![SHELL, IMG].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  if (req.destination === "image") {
    e.respondWith(caches.open(IMG).then(async (c) => (await c.match(req)) || fetch(req).then((r) => (c.put(req, r.clone()), r))));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(async () => (await caches.match(req)) || caches.match("/")));
  }
});
