/**
 * EduReach Service Worker
 * Strict Cache-First Strategy for Offline-First Architecture
 * Optimized for 1GB RAM devices
 */

const CACHE_VERSION = 'edureach-v1.1.0';
const CACHE_NAME = `edureach-shell-${CACHE_VERSION}`;

// App Shell - Critical resources that MUST be cached
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/js/app.js',
  '/assets/js/db.js',
  '/assets/js/router.js',
  '/assets/js/charts.js',  // ← ADD THIS LINE
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// Runtime cache configuration
const RUNTIME_CACHE = 'edureach-runtime';
const MAX_RUNTIME_ENTRIES = 50; // Memory constraint for 1GB devices

/**
 * Install Event - Cache App Shell
 * Runs when service worker is first installed
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        // Use addAll for atomic caching - all or nothing
        return cache.addAll(SHELL_ASSETS);
      })
      .then(() => {
        console.log('[SW] App shell cached successfully');
        // Force this service worker to become active immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache app shell:', error);
        throw error;
      })
  );
});

/**
 * Activate Event - Clean up old caches
 * Runs when service worker becomes active
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete all caches except current version
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Keep current shell cache and runtime cache
              return cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all clients immediately
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Activation failed:', error);
      })
  );
});

/**
 * Fetch Event - Cache-First Strategy
 * This is the critical offline-first logic
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests (CDN, external APIs)
  if (url.origin !== location.origin) {
    return;
  }
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    cacheFirstStrategy(request)
  );
});

/**
 * Cache-First Strategy Implementation
 * 1. Check cache first
 * 2. If found, return cached response
 * 3. If not found, fetch from network
 * 4. Cache the network response for future use
 */
async function cacheFirstStrategy(request) {
  try {
    // Step 1: Try to get response from cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }
    
    console.log('[SW] Cache miss, fetching:', request.url);
    
    // Step 2: Fetch from network
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      // Clone the response (can only be consumed once)
      const responseToCache = networkResponse.clone();
      
      // Step 3: Add to runtime cache (non-blocking)
      caches.open(RUNTIME_CACHE)
        .then((cache) => {
          cache.put(request, responseToCache);
          // Enforce cache size limit for memory management
          limitCacheSize(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
        })
        .catch((error) => {
          console.warn('[SW] Failed to cache runtime asset:', error);
        });
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Fetch failed, returning offline page:', error);
    
    // Fallback to offline page if available
    const offlineFallback = await caches.match('/index.html');
    if (offlineFallback) {
      return offlineFallback;
    }
    
    // Last resort: return error response
    return new Response('Offline - No cached content available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Memory Management - Limit cache size
 * Critical for 1GB RAM devices
 */
async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    // Remove oldest entries if limit exceeded
    if (keys.length > maxItems) {
      const itemsToDelete = keys.length - maxItems;
      console.log(`[SW] Trimming ${itemsToDelete} items from ${cacheName}`);
      
      // Delete oldest entries (FIFO)
      for (let i = 0; i < itemsToDelete; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (error) {
    console.error('[SW] Failed to limit cache size:', error);
  }
}

/**
 * Background Sync (Optional Enhancement)
 * Uncomment when Member 2 implements sync logic
 */
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'sync-data') {
//     event.waitUntil(syncData());
//   }
// });

/**
 * Push Notifications (Optional Enhancement)
 * Uncomment when notification feature is needed
 */
// self.addEventListener('push', (event) => {
//   const data = event.data.json();
//   self.registration.showNotification(data.title, {
//     body: data.body,
//     icon: '/assets/icons/icon-192x192.png'
//   });
// });