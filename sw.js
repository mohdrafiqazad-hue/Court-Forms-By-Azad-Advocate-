// Service worker: caches the whole app so it runs fully offline after the first visit.
// Bump VERSION whenever any file changes, so users get the update.
const VERSION = 'icf-v13';
const FILES = [
  './', './index.html', './css/app.css',
  './js/config.js', './js/i18n.js', './js/store.js', './js/install.js', './js/engine.js', './js/casetypes.js', './js/flow.js', './js/activity.js', './js/activity-view.js', './js/team.js', './js/gate.js', './js/app.js', './forms/common.js', './forms/nakal.js', './forms/talbana.js', './forms/listdocs.js', './forms/address.js', './forms/bail.js',
  './lib/fonts/noto-serif-gurmukhi-400.woff2', './lib/fonts/noto-serif-gurmukhi-700.woff2', './lib/fonts/noto-serif-devanagari-400.woff2', './lib/fonts/noto-serif-devanagari-700.woff2',
  './lib/fonts/noto-sans-400.woff2', './lib/fonts/noto-sans-700.woff2', './lib/fonts/noto-sans-gurmukhi-400.woff2', './lib/fonts/noto-sans-gurmukhi-700.woff2', './lib/fonts/noto-sans-devanagari-400.woff2', './lib/fonts/noto-sans-devanagari-700.woff2',
  './lib/jspdf.umd.min.js', './lib/docx.min.js',
  './lib/firebase-app-compat.js', './lib/firebase-auth-compat.js', './lib/firebase-firestore-compat.js',
  './terms.html', './privacy.html',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/logo-512.png', './icons/apple-touch-icon.png', './icons/favicon-48.png',
];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, so a new version never caches stale files
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/__/')) return; // Firebase sign-in & APIs: always network
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
