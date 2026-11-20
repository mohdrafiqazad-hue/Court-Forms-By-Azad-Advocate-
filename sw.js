// Service worker: caches the whole app so it runs fully offline after the first visit.
// Bump VERSION whenever any file changes, so users get the update.
const VERSION = 'court-forms-v1';
const FILES = [
  './', './index.html', './css/app.css',
  './js/engine.js', './js/app.js', './forms/nakal.js',
  './lib/jspdf.umd.min.js', './lib/docx.min.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
