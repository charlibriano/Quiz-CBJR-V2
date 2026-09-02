// Quiz CBJR — Service Worker
// Estratégia: sem cache. Existe apenas para habilitar a instalação como PWA.
//
// Por que não há handler de 'fetch' aqui:
// a versão anterior tinha um que apenas repassava a requisição
// (event.respondWith(fetch(event.request))). Isso não fazia nada de útil e
// tinha dois efeitos ruins num site cheio de MP3: obrigava toda requisição a
// passar pela thread do service worker, e quebrava requisições parciais
// (Range) que o navegador usa para pular posição dentro de um áudio.
// Sem handler, o navegador trata tudo nativamente — mais rápido e correto.
// Os navegadores atuais não exigem handler de fetch para considerar o site
// instalável, então o PWA continua funcionando.

const VERSION = 'cbjr-sw-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
