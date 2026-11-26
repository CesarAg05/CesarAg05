// Service worker: guarda o app no aparelho para funcionar sem internet.
// Ao mudar qualquer arquivo do site, aumente VERSAO para os usuários receberem a atualização.
const VERSAO = 'v1';
const CACHE = 'ferramentas-mei-' + VERSAO;
const ARQUIVOS = [
  './', 'index.html', 'preco.html', 'recibo.html', 'privacidade.html', 'style.css',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  'icons/apple-touch-icon.png', 'js/pwa.js', 'js/preco.js', 'js/preco-logica.js',
  'js/recibo.js', 'js/extenso.js'
];

{
  self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
  });

  self.addEventListener('activate', (e) => {
    e.waitUntil(
      caches.keys()
        .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
        .then(() => self.clients.claim())
    );
  });

  // Páginas: tenta a internet primeiro (conteúdo novo) e usa a cópia guardada se estiver offline.
  // Demais arquivos: usa a cópia guardada e busca na internet só se faltar.
  self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
    if (req.mode === 'navigate') {
      e.respondWith(
        fetch(req)
          .then((res) => {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
            return res;
          })
          .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
      );
      return;
    }
    e.respondWith(caches.match(req).then((r) => r || fetch(req)));
  });
}
