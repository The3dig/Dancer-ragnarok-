// Service worker: guarda os arquivos do jogo para funcionar offline.
const CACHE = 'dancarina-v13';
const FILES = [
  './', './index.html', './2d.html', './manifest.webmanifest', './css/style.css',
  './js/compat.js', './js/audio.js', './js/maps.js', './js/sprites.js', './js/game.js',
  './3d/index.html', './3d/style3d.css', './3d/classes.js', './3d/avatar.js', './3d/game3d.js', './3d/kravenox.js', './3d/net.js', './3d/tower.js', './3d/modelkit.js', './3d/sprites.js', './3d/spritekit.js', './3d/lib/gltf-loader.js', './3d/lib/three.min.js',
  './3d/models/adventurer.js', './3d/models/bee.js', './3d/models/crab.js', './3d/models/hooded_adventurer.js', './3d/models/mushroom_imp.js', './3d/models/orc_brute.js', './3d/models/raptor.js', './3d/models/skeleton.js', './3d/models/slime_pink.js', './3d/models/worker.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// rede primeiro (pega atualizações), cache se estiver offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
