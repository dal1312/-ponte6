const CACHE_NAME = "ponte6-v10";
const APP_SHELL = [
  "./",
  "./index.html",
  "./menu.html",
  "./ordina.html",
  "./ordina-rapido.html",
  "./contatti.html",
  "./offline.html",
  "./css/styles.css",
  "./js/main.js",
  "./js/menu-data.js",
  "./js/beverage-data.js",
  "./manifest.json",
  "./assets/home/logo.png",
  "./assets/home/sala.jpg",
  "./assets/home/esterno.jpg",
  "./assets/home/pasta-fresca.jpg",
  "./assets/home/tartare.jpg",
  "./assets/home/tortelli.jpg",
  "./assets/home/pizza.jpg",
  "./assets/home/bancone.jpg"
];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then(response => {
    const copy=response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request,copy)); return response;
  }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === "navigate" ? caches.match("./offline.html") : Response.error()))));
});
