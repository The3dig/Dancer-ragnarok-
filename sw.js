// Service worker: guarda os arquivos do jogo no aparelho (abre rápido e gasta menos internet).
const CACHE = 'dancarina-v73';
const FILES = [
  './', './index.html', './2d.html', './manifest.webmanifest', './css/style.css',
  './js/compat.js', './js/audio.js', './js/maps.js', './js/sprites.js', './js/game.js',
  './3d/index.html', './3d/style3d.css', './3d/classes.js', './3d/avatar.js', './3d/modelos3d.js', './3d/game3d.js', './3d/kravenox.js', './3d/net.js', './3d/partilha.js', './3d/nuvem.js', './3d/avisos.js', './3d/tower.js', './3d/valdora.js', './3d/props.js', './3d/props/dead_tree_trunk_02.js', './3d/props/rock_07.js', './3d/props/rock_09.js', './3d/props/rock_moss_set_01.js', './3d/props/stone_fire_pit.js', './3d/props/tree_stump_01.js', './3d/props/wine_barrel_01.js', './3d/props/wooden_barrels_01.js', './3d/props/wooden_bucket_01.js', './3d/props/wooden_crate_01.js', './3d/props/wooden_lantern_01.js', './3d/vida.js', './3d/casa.js', './3d/cosmeticos.js', './3d/pvp.js', './3d/evolucao.js', './3d/chefes.js', './3d/efeitos.js', './3d/quests.js', './3d/contas.js', './3d/modelkit.js', './3d/sprites.js', './3d/spritekit.js', './3d/lib/gltf-loader.js', './3d/lib/three.min.js',
  './3d/models/adventurer.js', './3d/models/bee.js', './3d/models/crab.js', './3d/models/hooded_adventurer.js', './3d/models/mushroom_imp.js', './3d/models/orc_brute.js', './3d/models/raptor.js', './3d/models/skeleton.js', './3d/models/slime_pink.js', './3d/models/worker.js',
  './musica/title.mp4', './musica/vila.mp4', './musica/floresta.mp4', './musica/vale.mp4', './musica/abismo.mp4', './musica/cidade.mp4', './musica/fortaleza.mp4', './musica/masmorra.mp4', './musica/chefe.mp4',
  './3d/tex/areia.jpg', './3d/tex/calcada.jpg', './3d/tex/capim.png', './3d/tex/capim_seco.png', './3d/tex/casca.jpg', './3d/tex/folhas.png', './3d/tex/grama.jpg', './3d/tex/madeira.jpg', './3d/tex/musgo.jpg', './3d/tex/palha.jpg', './3d/tex/palmeira.png', './3d/tex/pedra.jpg', './3d/tex/pinheiro.png', './3d/tex/pinheiro_silhueta.png', './3d/tex/reboco.jpg', './3d/tex/rocha.jpg', './3d/tex/rocha_clara.jpg', './3d/tex/telha.jpg', './3d/tex/terra.jpg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png',
];
// Mídia pesada (músicas, texturas, modelos 3D, ícones) quase nunca muda: fica num cache próprio,
// que NÃO é apagado a cada versão e é usado direto, sem ir à internet. Poupa a internet móvel.
const MIDIA = CACHE.replace(/-v\d+$/, '') + '-midia-v1';   // trocou textura/modelo/ícone? suba este número
const EH_MIDIA = u => /\/(3d\/tex|3d\/models|3d\/props|icons)\//.test(u);
const EH_MUSICA = u => /\/musica\//.test(u);      // música: fica com o navegador (o iPhone toca melhor assim e não baixa de novo a cada versão)
self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(c => c.addAll(FILES.filter(f => !EH_MIDIA(f) && !EH_MUSICA(f)))),
    caches.open(MIDIA).then(async c => { for (const f of FILES.filter(EH_MIDIA)) if (!(await c.match(f))) await c.add(f).catch(() => { }); }),
  ]).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== MIDIA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || EH_MUSICA(e.request.url)) return;
  if (EH_MIDIA(e.request.url) && !/\.md$/.test(e.request.url)) {                        // mídia: do aparelho primeiro
    e.respondWith(caches.open(MIDIA).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  // código do jogo: rede primeiro (pega atualizações), cache se estiver sem internet
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
