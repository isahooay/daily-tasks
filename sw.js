/* 每日工作清單 service worker｜作者：帥｜GROK 輔助｜製作日期 2026-11-14 19:49｜修改日期 2026-11-20 07:39 */
'use strict';
const CACHE = 'daily-tasks-20261114-1949-fix8';
const APP = './GROK-每日工作清單-20261114-1949.html';
const FILES = [APP, './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
/* fix7：Firebase SDK（固定版本 13.3.0）可以快取，讓離線時也開得起來；載不到也不影響安裝 */
const SDK_PREFIX = 'https://www.gstatic.com/firebasejs/13.3.0/';
const SDK = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map((f) => SDK_PREFIX + f);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(FILES).then(() => Promise.all(SDK.map((u) => c.add(new Request(u, { mode: 'cors' })).catch(() => null)))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('daily-tasks-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.url.startsWith(SDK_PREFIX)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)).catch(() => {}); }
      return r;
    }).catch(() => Response.error())));
    return;
  }
  /* 其他外部網址（firestore.googleapis.com、identitytoolkit、securetoken、firebaseapp.com 登入頁等）一律不攔截、不快取 */
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === 'navigate' ? caches.match(APP) : Response.error()));
    })
  );
});
