const CACHE = "traveltank300-static-v32";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/places/forest.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Next.js navigation, RSC, server actions and build assets must always come
  // directly from Next.js. Caching these responses can mix old and new router
  // payloads and trigger "Router action dispatched before initialization".
  if (
    request.mode === "navigate" ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Router-State-Tree") ||
    request.headers.has("Next-Action")
  ) {
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/places/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname);

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});
