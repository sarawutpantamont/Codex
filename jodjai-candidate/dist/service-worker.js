const CACHE_NAME = 'jodjai-shell-rev02-2';
const ASSETS = ['./', './index.html', './style.css', './app.js', './core.js', './manifest.json', './icon-192x192.png', './icon-512x512.png'];
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE_NAME);
  // Revalidate every asset, even when the browser HTTP cache contains the old release.
  await cache.addAll(ASSETS.map(path => new Request(new URL(path, self.registration.scope), {cache: 'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) {
    if (key.startsWith('jodjai-shell-') && key !== CACHE_NAME) await caches.delete(key);
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match('./index.html')) || Response.error();
    }));
    return;
  }
  if (ASSETS.some(path => new URL(path, self.registration.scope).href === url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(event.request)) || fetch(event.request);
    })());
  }
});
