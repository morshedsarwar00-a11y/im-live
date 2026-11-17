/* Im Live — home-screen app service worker.
   First-screen assets are precached at install so a repeat open is
   instant; every other asset is cached the first time it is shown.
   Page loads are network-first so an installed app always picks up
   the newest build instead of serving a stale cached page forever.
   API requests are never cached and never intercepted. */
var CACHE = "imlive-v1";
var CORE = [
  "./",
  "assets/img-355493f5d698ccfe.png",
  "assets/img-0bb1c9423b4485c1.webp",
  "assets/img-c72c2267d9d0729b.webp",
  "assets/img-9771eec931d15355.webp",
  "assets/img-1cba6e432e74110a.png"
];
self.addEventListener("message", function(e){
  if(e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(CORE); })
      .then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  /* Never cache or serve API traffic. */
  if(url.pathname.indexOf("/api/") !== -1) return;
  /* Page loads: network-first, with the cached copy as the offline
     fallback — and the fresh page is stored so the fallback is real. */
  if(e.request.mode === "navigate"){
    e.respondWith(
      fetch(e.request).then(function(res){
        if(res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){ return caches.match(e.request); })
    );
    return;
  }
  /* Everything else: cache-first; assets are stored the first time
     they are actually shown, so repeat views stay instant. */
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(res){
        if(res.ok && url.pathname.indexOf("/assets/") !== -1){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
