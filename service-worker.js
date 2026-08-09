const STATIC_CACHE = "ponte6-static-v79";
const RUNTIME_CACHE = "ponte6-runtime-v1";
const RUNTIME_LIMIT = 50;

const APP_SHELL = [
  "./",
  "./index.html",
  "./menu.html",
  "./ordina.html",
  "./ordina-rapido.html",
  "./contatti.html",
  "./offline.html",
  "./privacy.html",
  "./css/styles.css",
  "./js/main.js?v=78",
  "./js/site-config.js",
  "./js/site.js",
  "./js/order.js",
  "./js/menu-data.js",
  "./manifest.json",
  "./favicon.ico",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/fonts/dm-sans-latin.woff2",
  "./assets/fonts/italiana-latin.woff2",
  "./assets/home/logo.png",
  "./assets/home/sala.webp",
  "./assets/home/sala-640.webp",
  "./assets/home/esterno.webp",
  "./assets/home/esterno-640.webp",
  "./assets/home/pasta-fresca.webp",
  "./assets/home/pasta-fresca-640.webp",
  "./assets/home/tartare.webp",
  "./assets/home/tartare-640.webp",
  "./assets/home/tortelli.webp",
  "./assets/home/tortelli-640.webp",
  "./assets/home/pizza.webp",
  "./assets/home/pizza-640.webp",
  "./assets/home/bancone.webp",
  "./assets/home/bancone-640.webp"
];

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map(key => cache.delete(key)));
}

async function cacheResponse(cacheName, request, response) {
  if (!response || !response.ok || response.type === "opaque") return response;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  if (cacheName === RUNTIME_CACHE) await trimCache(cacheName, RUNTIME_LIMIT);
  return response;
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  const currentCaches = new Set([STATIC_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key.startsWith("ponte6-") && !currentCaches.has(key))
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => cacheResponse(RUNTIME_CACHE, request, response))
        .catch(async () => (await caches.match(request)) || caches.match("./offline.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => cacheResponse(RUNTIME_CACHE, request, response));
    })
  );
});
