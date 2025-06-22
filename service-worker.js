self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('kangjoon-cache-v1').then(cache => {
        return cache.addAll([
          '/',
          '/index.html',
          '/style.css',
          '/src/script.js',
          '/src/firebase.js',
          '/manifest.json',
          '/icon-192.png',
          '/icon-512.png'
        ])
      })
    )
  })
  
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request)
      })
    )
  })
  
  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting()
    }
  })