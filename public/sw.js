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

// Fetch: cache-first strategy for static assets, network-only for all dynamic routes and pages
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

  // Define static assets paths that are safe to cache-first.
  // These are unchanging files like icons, logo, manifest, fonts, and favicons.
  const isStaticAsset =
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/logo.svg" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/favicon.png";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version, fetch update in background to refresh cache
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

        // Not in cache, fetch from network and cache
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
          .catch(() => Response.error());
      })
    );
    return;
  }

  // For EVERYTHING else (page routes, server actions, API routes, RSC components, etc.):
  // Bypassing the service worker completely. Let the browser handle these via network-only.
  return;
});
