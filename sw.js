const CACHE = 'naroda-v5';

const URLS = [
  './',
  './index.html',
  './src/styles.css',
  './src/fonts.css',
  './src/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/logo_original.png',
  './fonts/Inter.woff2',
  './fonts/PlayfairDisplay.woff2',
  './fonts/PlayfairDisplay-Italic.woff2',
  './data/pt/questions.json',
  './data/pt/about.json',
  './data/pt/ui.json',
  './data/en/questions.json',
  './data/en/about.json',
  './data/en/ui.json',
  './data/es/questions.json',
  './data/es/about.json',
  './data/es/ui.json',
  './privacidade.html',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        return cached || caches.match('./index.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    }).catch(function () {
      return caches.match('./index.html');
    })
  );
});
