const CACHE_NAME = "EPC-cache-v1";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./game.js",
  "./manifest.json",
  "./img/icon-192.png",
  "./img/enemy.png",
  "./img/enemy_fly.png",
  "./img/player.png",
  "./img/player2.png",
  "./img/player3.png",
  "./img/fondo.png",
  "./img/icon-512.png",
  "./img/fondo.png",
  "./audio/music.wav",
  "./audio/coin.wav",
  "./audio/lose.wav"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => k !== CACHE_NAME && caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
