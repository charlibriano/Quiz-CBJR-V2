// Quiz CBJR — Service Worker
// Estratégia: Network Only (sem cache offline)
// Apenas registra o SW para habilitar instalação como PWA

const VERSION = 'cbjr-sw-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Instalado:', VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado:', VERSION);
  event.waitUntil(clients.claim());
});

// Network Only — passa tudo direto para a rede
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
