
self.addEventListener('install', (event) => {
    // Força o novo SW a entrar em ação imediatamente
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Tenta limpar caches antigos
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        })
    );
    // Assume o controle de todas as abas imediatamente
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Estratégia "Network Only" - ignora completamente o cache
    // Isso resolve o problema de telas brancas em desenvolvimento
    event.respondWith(fetch(event.request));
});
