/* i Court Forms — "Install app" (add to home screen) and "new version" notice.
   Android / desktop Chrome & Edge: a real Install button (beforeinstallprompt).
   iPhone / iPad Safari: short steps (Share → Add to Home Screen).
   Hidden when the app is already running installed. */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const t = (k, v) => (CF.i18n ? CF.i18n.t(k, v) : k);
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let prompt = null, installed = false;

  function update() {
    const can = !installed && !standalone() && (prompt || ios);
    document.querySelectorAll('[data-install]').forEach(el => { el.hidden = !can; });
    document.querySelectorAll('[data-install-btn]').forEach(b => { b.hidden = !prompt; });
    document.querySelectorAll('[data-install-ios]').forEach(p => { p.hidden = !!prompt || !ios; });
  }

  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); prompt = e; update(); });
  window.addEventListener('appinstalled', () => { prompt = null; installed = true; update(); if (CF.toast) CF.toast(t('installed')); });
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-install-btn]'); if (!b || !prompt) return;
    e.preventDefault();
    const p = prompt; prompt = null;
    try { p.prompt(); await p.userChoice; } catch (err) { console.warn(err); }
    update();
  });

  // A new version was installed by the service worker → offer a refresh
  if ('serviceWorker' in navigator) {
    let had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (had) { const bar = document.getElementById('updateBar'); if (bar) bar.hidden = false; }
      had = true;
    });
  }
  document.addEventListener('click', e => { if (e.target.closest('#btnReload')) location.reload(); });

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', update) : update();
  CF.install = { update, get available() { return !!prompt; } };
})();
