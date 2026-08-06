const CACHE = 'sennoric-chat-v3'
const PRECACHE = [
  '/chat',
  '/assets/logo-512.png',
  '/assets/favicon-32.png',
  '/assets/apple-touch-icon.png',
  '/assets/logo-spiral.svg',
  '/assets/logo-spiral-wordmark.svg',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(PRECACHE.map(url => c.add(url))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
