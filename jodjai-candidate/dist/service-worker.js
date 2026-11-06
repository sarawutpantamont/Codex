const CACHE_NAME='jodjai-shell-rev02-3';
const ASSETS=['./index.html','./style.css','./style-rev023.css','./app.js','./app-rev023.js','./core.js','./backup.js','./manifest.json','./icon-192x192.png','./icon-512x512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  // Never cache a response redirected to another origin. A failed install keeps the prior worker.
  await cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload',redirect:'error'})));
  // Existing windows may save and verify a backup before activating this worker.
})()));
self.addEventListener('message',event=>{if(event.data?.type==='APPLY_UPDATE')event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  // App shell caches contain no expense records. Retain the previous shell as a fallback.
  const keys=(await caches.keys()).filter(key=>key.startsWith('jodjai-shell-')&&key!==CACHE_NAME);
  for(const key of keys.slice(0,-1))await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      // Stay on the current origin even when the hosting provider redirects network navigation.
      const cache=await caches.open(CACHE_NAME);const shell=await cache.match('./index.html');
      return shell||fetch(new Request(event.request,{redirect:'error'}));
    })());return;
  }
  url.search='';
  if(ASSETS.some(path=>new URL(path,self.registration.scope).href===url.href))event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    return (await cache.match(url.href))||fetch(new Request(event.request,{redirect:'error'}));
  })());
});
