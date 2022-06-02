//const assets = [
//    "/",
//    "/index.html",
//    "/favicon.ico",
//    "/js/app.js",
////    "/analyze",
////    "/assets/styles/examples.css",
////    "/assets/styles/cm-chessboard.css",
////    "icons/",
//    "/manifest.json"
//];
//
//
//const BLOGGER_ASSETS = "chess-assets";
//self.addEventListener("install", (installEvt) => {
//  installEvt.waitUntil(
//    caches
//      .open(BLOGGER_ASSETS)
//      .then((cache) => {
//        cache.addAll(assets);
//      })
//      .then(self.skipWaiting())
//      .catch((e) => {
//        console.log(e);
//      })
//  );
//});
//
//
//
//self.addEventListener("activate", function (evt) {
//  evt.waitUntil(
//    caches
//      .keys()
//      .then((keysList) => {
//        return Promise.all(
//          keysList.map((key) => {
//            if (key === BLOGGER_ASSETS) {
//              console.log(`Removed old cache from ${key}`);
//              return caches.delete(key);
//            }
//          })
//        );
//      })
//      .then(() => self.clients.claim())
//  );
//});
//
//
//
//self.addEventListener("fetch", function (evt) {
//  evt.respondWith(
//    fetch(evt.request).catch(() => {
//      return caches.open(BLOGGER_ASSETS).then((cache) => {
//        return cache.match(evt.request);
//      });
//    })
//  );
//})


const addResourcesToCache = async (resources) => {
  const cache = await caches.open('v1');
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  const cache = await caches.open('v1');
  await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  // First try to get the resource from the cache
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }

  // Next try to use the preloaded response, if it's there
  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
    console.info('using preload response', preloadResponse);
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }

  // Next try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request);
    // response may be used only once
    // we need to save clone to put one copy in cache
    // and serve second one
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    // when even the fallback response is not available,
    // there is nothing we can do, but we must always
    // return a Response object
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    // Enable navigation preloads!
    await self.registration.navigationPreload.enable();
  }
};

self.addEventListener('activate', (event) => {
  event.waitUntil(enableNavigationPreload());
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    addResourcesToCache([
      '/',
      '/index.html',
      'manifest.json',
      '/js/app.js',
//      '/chess.serviceWorker.js',
      '/favicon.ico',
      '/assets/styles/examples.css'
//      '/assets/styles/examples.css.map',
//      '/manifest.json'
    ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    cacheFirst({
      request: event.request,
      preloadResponsePromise: event.preloadResponse,
      fallbackUrl: '/icons/chess-board.png',
    })
  );
});
