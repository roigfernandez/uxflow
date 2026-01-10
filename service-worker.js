// FlowForge Service Worker
// Version 1.0.0

const CACHE_VERSION = 'flowforge-v1.0.0';
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/ux-flow-generator.html',
    '/app.js',
    '/styles.css',
    '/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(ASSETS_CACHE)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('[SW] Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName.startsWith('flowforge-') && 
                                   cacheName !== ASSETS_CACHE &&
                                   cacheName !== DATA_CACHE &&
                                   cacheName !== RUNTIME_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip external requests
    if (url.origin !== location.origin) {
        return;
    }

    // Handle different types of requests
    if (request.url.includes('/api/')) {
        // API requests - Network first, cache fallback
        event.respondWith(networkFirstStrategy(request));
    } else if (request.destination === 'document' || 
               request.url.endsWith('.html') ||
               request.url.endsWith('.js') ||
               request.url.endsWith('.css')) {
        // Core assets - Cache first, network fallback
        event.respondWith(cacheFirstStrategy(request));
    } else {
        // Other requests - Network first
        event.respondWith(networkFirstStrategy(request));
    }
});

// Cache first strategy
async function cacheFirstStrategy(request) {
    try {
        const cache = await caches.open(ASSETS_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            console.log('[SW] Serving from cache:', request.url);
            // Return cached version and update in background
            updateCache(request, cache);
            return cached;
        }
        
        // Not in cache, fetch from network
        console.log('[SW] Fetching from network:', request.url);
        const response = await fetch(request);
        
        if (response.ok) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[SW] Cache first strategy failed:', error);
        return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });
    }
}

// Network first strategy
async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        // Return offline page or error
        return new Response('Offline - Network unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });
    }
}

// Update cache in background
async function updateCache(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
            console.log('[SW] Cache updated:', request.url);
        }
    } catch (error) {
        // Silently fail - we're already serving from cache
    }
}

// Background sync for data
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    try {
        // Get pending sync data from IndexedDB
        const db = await openDB();
        const tx = db.transaction('sync-queue', 'readonly');
        const store = tx.objectStore('sync-queue');
        const queue = await store.getAll();
        
        console.log('[SW] Syncing', queue.length, 'items');
        
        // Process each queued item
        for (const item of queue) {
            try {
                await fetch(item.url, {
                    method: item.method,
                    headers: item.headers,
                    body: item.body
                });
                
                // Remove from queue on success
                const deleteTx = db.transaction('sync-queue', 'readwrite');
                await deleteTx.objectStore('sync-queue').delete(item.id);
            } catch (error) {
                console.error('[SW] Failed to sync item:', item.id, error);
            }
        }
        
        console.log('[SW] Sync complete');
        
        // Notify clients
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                count: queue.length
            });
        });
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Helper to open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('flowforge-sync', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('sync-queue')) {
                db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Message handler
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(RUNTIME_CACHE)
                .then((cache) => cache.addAll(event.data.urls))
        );
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys()
                .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                })
        );
    }
});

// Push notification handler (future feature)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'Nueva actualización disponible',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: data.actions || []
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'FlowForge', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

console.log('[SW] Service Worker loaded');
