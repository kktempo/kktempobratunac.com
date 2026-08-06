const CACHE_NAME = "kk-tempo-v1";

const FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./manifest.json"
];

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)

        .then(cache => cache.addAll(FILES))

    );

});

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)

        .then(response => response || fetch(event.request))

    );

});