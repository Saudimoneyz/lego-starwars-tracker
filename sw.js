const CACHE = 'lswtss-images-v1';

// Cache images on first request, serve from cache on every subsequent request
self.addEventListener('fetch', e => {
  if (e.request.destination === 'image') {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
        })
      )
    );
  }
});
