const CACHE_NAME = "unlar-connect-v2";
const STATIC_ASSETS = [
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first strategy for API calls, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome extensions and non-http requests
  if (!url.protocol.startsWith("http")) return;

  // Skip cross-origin requests. Supabase, Google OAuth, and CDN requests
  // must stay fully browser-controlled so auth redirects cannot hang.
  if (url.origin !== self.location.origin) return;

  // Skip Next.js build assets to avoid serving stale compiled files.
  if (url.pathname.startsWith("/_next/")) return;

  // Let HTML navigations go straight to Next.js. This avoids stale dashboard
  // shells and noisy rejected fetches during local development.
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    return;
  }

  // Network-first for API calls and server actions
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/dashboard/") ||
    request.headers.get("accept")?.includes("text/x-component")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
            );
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || Response.error();
        })
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version, fetch update in background
        event.waitUntil(
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                return caches.open(CACHE_NAME).then((cache) => {
                  return cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => undefined)
        );
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
            );
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || Response.error();
        });
    })
  );
});
