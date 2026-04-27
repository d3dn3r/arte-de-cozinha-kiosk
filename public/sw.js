/* Museum Flipbook — Service Worker
 * Strategy: cache-first for all same-origin GET requests.
 *
 * On install the app shell + critical visual assets are eagerly
 * precached.  Page images are precached in the background (soft-fail
 * per image so a missing file never blocks install).
 */

const CACHE_VERSION = 2;
const CACHE = `museum-flipbook-v${CACHE_VERSION}`;

// Hard-fail: if any of these are missing the app won't work
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pages.json',
  '/assets/background.jpg',
];

// ── Install ───────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(install());
});

async function install() {
  const cache = await caches.open(CACHE);

  // App shell — hard-fail if unavailable
  await cache.addAll(SHELL);

  // Page images — soft-fail per image (275 files, large total)
  try {
    const { pages = [] } = await fetch('/pages.json').then(r => r.json());
    await Promise.allSettled(
      pages.map(({ src }) =>
        fetch(src)
          .then(r => r.ok && cache.put(src, r))
          .catch(() => {})
      )
    );
  } catch (err) {
    console.warn('[SW] Could not precache page images:', err);
  }

  // Optional assets — soft-fail
  await Promise.allSettled(
    [
      '/assets/audio/flip.mp3',
      '/assets/icons/icon-192.png',
      '/assets/icons/icon-512.png',
      '/assets/icons/icon-maskable-512.png',
    ].map(url =>
      fetch(url)
        .then(r => r.ok && cache.put(url, r))
        .catch(() => {})
    )
  );
}

// ── Activate ──────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k.startsWith('museum-flipbook-') && k !== CACHE)
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503 });
  }
}
