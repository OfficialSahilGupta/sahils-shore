// ============================================================================
// Sahil's Shore: Service Worker (Shell Pre-caching, Offline Fallback & Push)
// ============================================================================

const CACHE_VERSION = "shore-v1.0.0";
const SHELL_CACHE = `shore-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `shore-runtime-${CACHE_VERSION}`;

// Pre-cached core assets for instant shell load and offline functionality
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/favicon.svg",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

// Install: Pre-cache app shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== SHELL_CACHE && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests and internal Supabase / API requests for service worker caching
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // 1. Navigation requests (HTML pages): Network-First, with cache fallback and offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the successful page response
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          // If network failed, try cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          // If not in cache, return dedicated Shore offline page
          const offlinePage = await caches.match("/offline.html");
          return (
            offlinePage ||
            new Response(
              "<h1>Sahil's Shore is offline</h1><p>Your changes are queued and will sync when reconnected.</p>",
              { headers: { "Content-Type": "text/html" } }
            )
          );
        })
    );
    return;
  }

  // 2. Static Assets (CSS, JS, Fonts, Icons, Images): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".woff2");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Default fallback: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Push notification clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Background sync event
self.addEventListener("sync", (event) => {
  if (event.tag === "shore-offline-sync") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SHORE_SYNC_TRIGGER" });
        });
      })
    );
  }
});
