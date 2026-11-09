// =====================================================================
//  Mapas originais: Vila de Solmira, Campos Dourados,
//  Areias Rubras e Oásis de Kharum
// =====================================================================
const TILE = 32;

function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Tiles:  g grama · f flores · p terra · c paralelepípedo · w água · b ponte
//         h trigo · s areia · d duna · k piso de arenito
//  bloqueantes: T árvore · P palmeira · C cacto · R rocha · B arbusto · x cerca
const BLOCKING = new Set(['T', 'P', 'C', 'R', 'B', 'x', 'w']);
const TALL = new Set(['T', 'P', 'C']);

function makeGrid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function rect(G, x, y, w, h, ch) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++)
    if (G[j] && G[j][i] !== undefined) G[j][i] = ch;
}
function border(G, ch, thick, keep) {
  const H = G.length, W = G[0].length;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x < thick || y < thick || x >= W - thick || y >= H - thick) {
      if (!keep || !keep(x, y)) G[y][x] = ch;
    }
  }
}

// ------------------------------------------------------------------
function buildSolmira() {
  const W = 48, H = 36, r = rng(11);
  const G = makeGrid(W, H, 'g');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (r() < 0.07) G[y][x] = 'f';
  rect(G, 2, 17, W - 2, 2, 'c');          // rua leste-oeste
  rect(G, 23, 3, 2, 30, 'c');             // rua norte-sul
  rect(G, 17, 12, 14, 12, 'c');           // praça
  rect(G, 37, 12, 7, 3, 'w');             // laguinho
  rect(G, 3, 30, 10, 1, 'x'); rect(G, 3, 31, 10, 3, 'f');   // jardim cercado
  border(G, 'T', 2, (x, y) => x >= W - 2 && y >= 16 && y <= 19);
  [[14, 30], [35, 30], [42, 31], [8, 14], [15, 3], [31, 3]].forEach(([x, y]) => G[y][x] = 'T');
  [[19, 11], [28, 11], [19, 24], [28, 24]].forEach(([x, y]) => G[y][x] = 'B');
  return {
    id: 'solmira', name: 'Vila de Solmira', music: 'solmira', town: true, base: 'g',
    tint: null, w: W, h: H, grid: G,
    houses: [
      { x: 5, y: 7, w: 6, h: 4, style: 'wood', roof: '#c0504d' },
      { x: 13, y: 6, w: 5, h: 4, style: 'wood', roof: '#4f81bd' },
      { x: 30, y: 6, w: 7, h: 4, style: 'wood', roof: '#7a9a3a' },
      { x: 39, y: 7, w: 5, h: 4, style: 'wood', roof: '#8064a2' },
      { x: 5, y: 24, w: 6, h: 4, style: 'wood', roof: '#d4883a' },
      { x: 13, y: 25, w: 5, h: 4, style: 'wood', roof: '#4bacc6' },
      { x: 30, y: 25, w: 6, h: 4, style: 'wood', roof: '#c0504d' },
      { x: 39, y: 24, w: 5, h: 4, style: 'wood', roof: '#5a7a9a' },
    ],
    decor: [{ kind: 'fountain', x: 22, y: 15, w: 4, h: 4 }],
    portals: [{ x: W - 1, y: 16, w: 1, h: 4, to: 'campos', tx: 2, ty: 21 }],
    npcs: [
      { id: 'healer', name: 'Irmã Celina', x: 20, y: 14, look: { hair: '#f2e6c9', cloth: '#ffffff', trim: '#d9534f', hat: 'veil' } },
      { id: 'shop', name: 'Mercador Bento', x: 28, y: 14, look: { hair: '#5a3a1a', cloth: '#7a5a2a', trim: '#e0c060', hat: 'cap' } },
      { id: 'master', name: 'Mestra Odete', x: 20, y: 21, look: { hair: '#2b2b5a', cloth: '#9b4dca', trim: '#ffd700', hat: 'flower' } },
      { id: 'caravan', name: 'Condutora Nila', x: 28, y: 21, look: { hair: '#c86b2a', cloth: '#3a7a5a', trim: '#f0e0b0', hat: 'cap' } },
      { id: 'guard', name: 'Guarda Tobias', x: 44, y: 15, look: { hair: '#333', cloth: '#6a6f7a', trim: '#c0c0c0', hat: 'helm' } },
    ],
    spawn: { x: 22, y: 22 }, mobs: []
  };
}

function buildCampos() {
  const W = 60, H = 44, r = rng(23);
  const G = makeGrid(W, H, 'g');
  // trigais
  [[8, 6, 7, 4], [44, 7, 8, 5], [10, 31, 9, 5], [46, 30, 7, 6], [26, 8, 6, 4]].forEach(a => rect(G, ...a, 'h'));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (G[y][x] !== 'g') continue;
    const v = r();
    if (v < 0.05) G[y][x] = 'T';
    else if (v < 0.07) G[y][x] = 'B';
    else if (v < 0.15) G[y][x] = 'f';
  }
  rect(G, 0, 20, W, 4, 'p');              // estrada
  // rio sinuoso
  for (let y = 0; y < H; y++) {
    const cx = 38 + Math.round(Math.sin(y * 0.25) * 2);
    for (let x = cx - 1; x <= cx + 1; x++) G[y][x] = (y >= 20 && y <= 23) ? 'b' : 'w';
  }
  // limpa ao redor das saídas
  rect(G, 0, 18, 4, 8, 'g'); rect(G, W - 4, 18, 4, 8, 'g'); rect(G, 0, 20, W, 4, 'p');
  for (let y = 20; y <= 23; y++) { const cx = 38 + Math.round(Math.sin(y * 0.25) * 2); for (let x = cx - 1; x <= cx + 1; x++) G[y][x] = 'b'; }
  border(G, 'T', 2, (x, y) => y >= 20 && y <= 23);
  return {
    id: 'campos', name: 'Campos Dourados', music: 'campos', base: 'g', w: W, h: H, grid: G,
    houses: [{ x: 18, y: 13, w: 4, h: 3, style: 'barn', roof: '#9a3b2a' }], decor: [],
    portals: [
      { x: 0, y: 20, w: 1, h: 4, to: 'solmira', tx: 45, ty: 17 },
      { x: W - 1, y: 20, w: 1, h: 4, to: 'areias', tx: 2, ty: 21 },
    ],
    npcs: [{ id: 'farmer', name: 'Fazendeiro Joca', x: 20, y: 17, look: { hair: '#8a5a2a', cloth: '#4a6aaa', trim: '#e8d080', hat: 'straw' } }],
    spawn: { x: 3, y: 21 },
    mobs: [{ type: 'pompom', n: 14 }, { type: 'zunzum', n: 8 }, { type: 'fungolino', n: 7 }]
  };
}

function buildAreias() {
  const W = 60, H = 44, r = rng(37);
  const G = makeGrid(W, H, 's');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = Math.sin(x * 0.21) + Math.cos(y * 0.27 + x * 0.05);
    if (n > 1.1) G[y][x] = 'd';
    const v = r();
    if (v < 0.035) G[y][x] = 'R';
    else if (v < 0.06) G[y][x] = 'C';
  }
  rect(G, 0, 20, W, 4, 'p');
  // pequeno oásis
  for (let y = 5; y < 13; y++) for (let x = 12; x < 22; x++) {
    const dx = (x - 16.5) / 4, dy = (y - 8.5) / 3;
    if (dx * dx + dy * dy < 1) G[y][x] = 'w';
    else if (dx * dx + dy * dy < 1.6) G[y][x] = r() < 0.4 ? 'P' : 'g';
  }
  rect(G, 0, 18, 4, 8, 's'); rect(G, W - 4, 18, 4, 8, 's'); rect(G, 0, 20, W, 4, 'p');
  rect(G, 44, 4, 12, 10, 'd');          // arena do Guardião
  border(G, 'R', 2, (x, y) => y >= 20 && y <= 23);
  return {
    id: 'areias', name: 'Areias Rubras', music: 'areias', base: 's', tint: 'rgba(255,90,30,0.07)',
    w: W, h: H, grid: G, houses: [], decor: [{ kind: 'ruins', x: 46, y: 5, w: 8, h: 2 }],
    portals: [
      { x: 0, y: 20, w: 1, h: 4, to: 'campos', tx: 57, ty: 21 },
      { x: W - 1, y: 20, w: 1, h: 4, to: 'kharum', tx: 2, ty: 16 },
    ],
    npcs: [], spawn: { x: 3, y: 21 },
    mobs: [{ type: 'besouro', n: 12 }, { type: 'serpe', n: 9 }, { type: 'guardiao', n: 1, at: { x: 50, y: 9 } }]
  };
}

function buildKharum() {
  const W = 44, H = 34, r = rng(51);
  const G = makeGrid(W, H, 's');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (r() < 0.1) G[y][x] = 'd';
  rect(G, 0, 15, 14, 4, 'k');
  rect(G, 12, 14, 23, 8, 'k');
  rect(G, 22, 21, 3, 10, 'k');
  for (let y = 4; y < 14; y++) for (let x = 15; x < 30; x++) {
    const dx = (x - 22) / 5.5, dy = (y - 8.5) / 3.6;
    const d = dx * dx + dy * dy;
    if (d < 1) G[y][x] = 'w';
    else if (d < 1.45) G[y][x] = 'g';
  }
  [[15, 6], [29, 7], [16, 12], [28, 12], [21, 4], [24, 4]].forEach(([x, y]) => G[y][x] = 'P');
  border(G, 'P', 2, (x, y) => x < 2 && y >= 15 && y <= 18);
  return {
    id: 'kharum', name: 'Oásis de Kharum', music: 'kharum', town: true, base: 's', tint: 'rgba(255,170,60,0.06)',
    w: W, h: H, grid: G,
    houses: [
      { x: 4, y: 5, w: 6, h: 4, style: 'sand', roof: '#e8d2a6', dome: '#3a8ac0' },
      { x: 32, y: 4, w: 7, h: 4, style: 'sand', roof: '#e2c896', dome: '#c0503a' },
      { x: 4, y: 24, w: 6, h: 4, style: 'sand', roof: '#e8d2a6', dome: '#3aa080' },
      { x: 31, y: 25, w: 7, h: 4, style: 'sand', roof: '#e2c896', dome: '#d4a020' },
      { x: 13, y: 25, w: 5, h: 4, style: 'sand', roof: '#e8d2a6' },
      { x: 27, y: 20, w: 3, h: 2, style: 'tent', roof: '#c0392b' },
      { x: 31, y: 20, w: 3, h: 2, style: 'tent', roof: '#2980b9' },
      { x: 35, y: 20, w: 3, h: 2, style: 'tent', roof: '#8e44ad' },
    ],
    decor: [],
    portals: [{ x: 0, y: 15, w: 1, h: 4, to: 'areias', tx: 57, ty: 21 }],
    npcs: [
      { id: 'healer', name: 'Curandeira Samira', x: 15, y: 16, look: { hair: '#1a1a1a', cloth: '#f4f0e6', trim: '#2a9d8f', hat: 'veil' } },
      { id: 'shop', name: 'Mercador Farid', x: 32, y: 18, look: { hair: '#2a1a0a', cloth: '#b5651d', trim: '#f4d03f', hat: 'turban' } },
      { id: 'caravan', name: 'Condutor Rashid', x: 25, y: 19, look: { hair: '#2a1a0a', cloth: '#5d6d7e', trim: '#f0e0b0', hat: 'turban' } },
      { id: 'elder', name: 'Anciã Zahra', x: 21, y: 15, look: { hair: '#e0e0e0', cloth: '#6c3483', trim: '#f5b041', hat: 'veil' } },
    ],
    spawn: { x: 6, y: 16 }, mobs: []
  };
}

const MAPS = {
  solmira: buildSolmira(),
  campos: buildCampos(),
  areias: buildAreias(),
  kharum: buildKharum(),
};

// grade de colisão (tiles + casas + decoração)
for (const m of Object.values(MAPS)) {
  m.blocked = makeGrid(m.w, m.h, false);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) m.blocked[y][x] = BLOCKING.has(m.grid[y][x]);
  for (const h of m.houses) rectB(m, h.x, h.y, h.w, h.h);
  for (const d of m.decor) if (d.kind === 'fountain') rectB(m, d.x, d.y, d.w, d.h);
  for (const n of m.npcs) m.blocked[n.y][n.x] = false;
}
function rectB(m, x, y, w, h) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m.blocked[j]) m.blocked[j][i] = true;
}

// ------------------------------------------------------------------
//  Monstros originais
// ------------------------------------------------------------------
const MOBS = {
  pompom:    { name: 'Pompom',     lv: 1,  hp: 40,   atk: 5,  def: 0,  xp: 9,   zeny: [2, 6],   speed: 45, aggro: 0,   respawn: 8,  drops: [['red', 0.18]] },
  zunzum:    { name: 'Zunzum',     lv: 3,  hp: 60,   atk: 8,  def: 1,  xp: 16,  zeny: [4, 10],  speed: 75, aggro: 110, respawn: 10, drops: [['red', 0.2], ['blue', 0.05]] },
  fungolino: { name: 'Fungolino',  lv: 5,  hp: 110,  atk: 12, def: 3,  xp: 30,  zeny: [6, 15],  speed: 40, aggro: 0,   respawn: 12, drops: [['red', 0.25], ['blue', 0.08]] },
  besouro:   { name: 'Besouro Rubi', lv: 9, hp: 200, atk: 19, def: 6,  xp: 60,  zeny: [12, 28], speed: 60, aggro: 130, respawn: 12, drops: [['red', 0.3], ['blue', 0.1]] },
  serpe:     { name: 'Serpe de Areia', lv: 12, hp: 300, atk: 26, def: 8, xp: 95, zeny: [18, 40], speed: 70, aggro: 150, respawn: 14, drops: [['red', 0.3], ['blue', 0.15]] },
  guardiao:  { name: 'Guardião das Areias', lv: 18, hp: 2400, atk: 42, def: 15, xp: 900, zeny: [300, 500], speed: 50, aggro: 200, respawn: 90, boss: true, drops: [['blue', 1], ['red', 1], ['red', 1]] },
};

const ITEMS = {
  red:  { name: 'Poção Vermelha', price: 25, desc: 'Recupera 60 de HP' },
  blue: { name: 'Poção Azul',     price: 90, desc: 'Recupera 40 de SP' },
};
