const CACHE_NAME = 'fitness-tracker-cache-v2'; // MODIFICATION: Incremented cache version
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'edit-workouts.html',
  'progress-analytics.html',
  'style.css',
  'edit-workouts-style.css',
  'progress-analytics-style.css',
  'images/Rosecurve.png',
  'images/eagle.png'
];

// Install event: cache the core application files.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Activate event: clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: MODIFIED to use stale-while-revalidate strategy.
self.addEventListener('fetch', event => {
  // Let the browser handle non-GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // Let Firebase and other external services handle their own network requests.
  const externalUrls = ['firestore.googleapis.com', 'google.com/app/apikey', 'gstatic.com/firebasejs', 'cdn.jsdelivr.net'];
  if (externalUrls.some(url => event.request.url.includes(url))) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        // Fetch from the network in the background.
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If the fetch is successful, update the cache.
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            console.error('Fetch failed; returning offline page instead.', err);
            // Optionally, return a fallback offline page if network fails and not in cache
        });

        // Return the cached response immediately if it exists, otherwise wait for the network.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
