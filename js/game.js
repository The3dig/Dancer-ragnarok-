// =====================================================================
//  Lógica principal do jogo
// =====================================================================
const cv = document.getElementById('cv');
const g = cv.getContext('2d');
let VW = 0, VH = 0;
function resize() { VW = cv.width = innerWidth; VH = cv.height = innerHeight; }
addEventListener('resize', resize); resize();

const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- jogadora
const SKILLS = [
  { key: 'q', id: 'whirl',  name: 'Chicote Giratório', lv: 1,  sp: 8,  cd: 1.2, icon: '🌀', desc: 'Gira a fita de seda causando 150% de dano em área.' },
  { key: 'w', id: 'charm',  name: 'Passo Encantador',  lv: 3,  sp: 14, cd: 6,   icon: '💫', desc: 'Um passo hipnótico que atordoa inimigos próximos por 3s.' },
  { key: 'e', id: 'breeze', name: 'Dança da Brisa',    lv: 5,  sp: 20, cd: 25,  icon: '🍃', desc: 'Por 25s: +50% velocidade de ataque e +30% de movimento.' },
  { key: 'r', id: 'moon',   name: 'Canção da Lua',     lv: 8,  sp: 28, cd: 15,  icon: '🌙', desc: 'Cura 35% do HP e regenera por 6s.' },
  { key: 't', id: 'finale', name: 'Grande Finale',     lv: 12, sp: 45, cd: 12,  icon: '✨', desc: 'Apresentação final: 350% de dano em grande área.' },
];

const P = {
  name: 'Lyra', lv: 1, xp: 0, zeny: 50, statPts: 3,
  str: 3, agi: 3, vit: 3, int: 3,
  hp: 1, sp: 1, inv: { red: 5, blue: 1 },
  x: 0, y: 0, dir: 1, path: [], walking: false,
  target: null, npcTarget: null, atkCd: 0, attackAnim: 0, dance: 0,
  sit: false, dead: false, deadT: 0, regenT: 0, cds: {}, buffs: {},
  map: 'solmira', homeTown: 'solmira', hurtT: 0,
};
const stats = {
  atk: () => 8 + P.str * 2 + P.lv + Math.floor(P.agi / 3),
  matk: () => 6 + P.int * 3 + P.lv,
  def: () => Math.floor(P.vit * 0.6),
  maxHp: () => 90 + P.vit * 14 + P.lv * 12,
  maxSp: () => 30 + P.int * 7 + P.lv * 3,
  aspd: () => Math.max(0.28, 1.15 - P.agi * 0.018) / (P.buffs.breeze ? 1.5 : 1),
  speed: () => 135 * (P.buffs.breeze ? 1.3 : 1),
  flee: () => Math.min(0.55, 0.03 + P.agi * 0.012),
  crit: () => Math.min(0.5, 0.04 + P.agi * 0.004 + P.str * 0.002),
};
const xpNeed = lv => Math.floor(30 + 22 * Math.pow(lv, 1.75));

// ---------------------------------------------------------------- estado do mundo
let map = null, mobs = [], npcs = [], drops = [], floaters = [], parts = [], respawnQ = [];
let tall = [];
const cam = { x: 0, y: 0 };
let time = 0, running = false, mobId = 0;
const keys = {};

// ---------------------------------------------------------------- chão pré-renderizado
function bake(m) {
  if (m.ground) return;
  const c = document.createElement('canvas');
  c.width = m.w * TILE; c.height = m.h * TILE;
  const x = c.getContext('2d');
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++)
    drawTile(x, m.grid[ty][tx], tx * TILE, ty * TILE, tx, ty, m.base);
  // bordas de água
  x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 2;
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    if (m.grid[ty][tx] !== 'w') continue;
    const X = tx * TILE, Y = ty * TILE;
    const n = (i, j) => (m.grid[j] && m.grid[j][i]) || 'w';
    if (n(tx, ty - 1) !== 'w' && n(tx, ty - 1) !== 'b') { x.beginPath(); x.moveTo(X, Y + 1); x.lineTo(X + TILE, Y + 1); x.stroke(); }
    if (n(tx, ty + 1) !== 'w' && n(tx, ty + 1) !== 'b') { x.beginPath(); x.moveTo(X, Y + TILE - 1); x.lineTo(X + TILE, Y + TILE - 1); x.stroke(); }
  }
  for (const d of m.decor) drawDecor(x, d);
  m.ground = c;
  m.tall = [];
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    const ch = m.grid[ty][tx];
    if (TALL.has(ch)) m.tall.push({ kind: 'tall', ch, v: Math.floor(hash(tx, ty, 9) * 2), x: tx * TILE + 16, y: tx * 0 + ty * TILE + 28 });
  }
  for (const h of m.houses) m.tall.push({ kind: 'house', h, x: h.x * TILE, y: (h.y + h.h) * TILE });
  m.waterTiles = [];
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) if (m.grid[ty][tx] === 'w') m.waterTiles.push([tx, ty]);
}

// ---------------------------------------------------------------- colisão / caminho
const walkT = (tx, ty) => tx >= 0 && ty >= 0 && tx < map.w && ty < map.h && !map.blocked[ty][tx];
const walkPx = (x, y) => walkT(Math.floor(x / TILE), Math.floor(y / TILE));
function canStand(x, y, r = 8) {
  return walkPx(x - r, y - r / 2) && walkPx(x + r, y - r / 2) && walkPx(x - r, y + r / 2) && walkPx(x + r, y + r / 2);
}

function findPath(sx, sy, ex, ey) {
  if (!walkT(ex, ey)) {
    let best = null, bd = 1e9;
    for (let r = 1; r <= 3 && !best; r++)
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        if (walkT(ex + i, ey + j)) { const d = Math.hypot(i, j); if (d < bd) { bd = d; best = [ex + i, ey + j]; } }
      }
    if (!best) return null;
    [ex, ey] = best;
  }
  const W = map.w, key = (x, y) => y * W + x;
  const open = [], gS = new Map(), from = new Map(), closed = new Set();
  const h = (x, y) => Math.hypot(x - ex, y - ey);
  const push = n => { open.push(n); let i = open.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (open[p].f <= open[i].f) break; [open[p], open[i]] = [open[i], open[p]]; i = p; } };
  const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let s = i; if (l < open.length && open[l].f < open[s].f) s = l; if (r < open.length && open[r].f < open[s].f) s = r; if (s === i) break; [open[s], open[i]] = [open[i], open[s]]; i = s; } } return top; };
  gS.set(key(sx, sy), 0); push({ x: sx, y: sy, f: h(sx, sy) });
  let n = 0;
  while (open.length && n++ < 6000) {
    const c = pop(); const ck = key(c.x, c.y);
    if (closed.has(ck)) continue; closed.add(ck);
    if (c.x === ex && c.y === ey) {
      const path = []; let k = ck;
      while (k !== key(sx, sy)) { path.unshift([k % W, Math.floor(k / W)]); k = from.get(k); }
      return path;
    }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = c.x + dx, ny = c.y + dy;
      if (!walkT(nx, ny)) continue;
      if (dx && dy && (!walkT(c.x + dx, c.y) || !walkT(c.x, c.y + dy))) continue;
      const nk = key(nx, ny), ng = gS.get(ck) + (dx && dy ? 1.414 : 1);
      if (ng < (gS.get(nk) ?? 1e9)) { gS.set(nk, ng); from.set(nk, ck); push({ x: nx, y: ny, f: ng + h(nx, ny) }); }
    }
  }
  return null;
}
function goTo(px, py) {
  const p = findPath(Math.floor(P.x / TILE), Math.floor(P.y / TILE), Math.floor(px / TILE), Math.floor(py / TILE));
  P.path = p ? p.map(([x, y]) => ({ x: x * TILE + 16, y: y * TILE + 16 })) : [];
  if (P.path.length) { const l = P.path[P.path.length - 1]; if (walkPx(px, py)) { l.x = px; l.y = py; } }
  if (P.sit) P.sit = false;
}

// ---------------------------------------------------------------- mapas
function loadMap(id, tx, ty) {
  map = MAPS[id]; bake(map);
  P.map = id;
  if (map.town) P.homeTown = id;
  P.x = (tx ?? map.spawn.x) * TILE + 16; P.y = (ty ?? map.spawn.y) * TILE + 16;
  P.path = []; P.target = null; P.npcTarget = null;
  mobs = []; drops = []; parts = []; respawnQ = [];
  npcs = map.npcs.map(n => ({ ...n, x: n.x * TILE + 16, y: n.y * TILE + 24 }));
  for (const s of map.mobs) for (let i = 0; i < s.n; i++) spawnMob(s.type, s.at);
  tall = map.tall;
  Audio8.play(map.music);
  showBanner(map.name);
  log(`Você chegou em <b>${map.name}</b>.`, 'sys');
  updateCam(true);
  save();
}
function spawnMob(type, at) {
  const d = MOBS[type];
  let x, y, tries = 0;
  do {
    if (at) { x = at.x * TILE + 16; y = at.y * TILE + 16; break; }
    x = rand(3, map.w - 3) * TILE; y = rand(3, map.h - 3) * TILE; tries++;
  } while ((!canStand(x, y, 10) || Math.hypot(x - P.x, y - P.y) < 250 || map.grid[Math.floor(y / TILE)][Math.floor(x / TILE)] === 'p') && tries < 200);
  mobs.push({
    id: ++mobId, type, d, x, y, hp: d.hp, maxHp: d.hp, sx: x, sy: y, seed: Math.random() * 10,
    state: 'idle', timer: rand(0, 3), tx: x, ty: y, stun: 0, atkCd: 1, hitFlash: 0, dir: 1, moving: false, at,
  });
}

// ---------------------------------------------------------------- UI helpers
function log(html, cls = '') {
  const el = document.createElement('div'); el.className = 'line ' + cls; el.innerHTML = html;
  const c = $('chat'); c.appendChild(el);
  while (c.children.length > 60) c.removeChild(c.firstChild);
  c.scrollTop = c.scrollHeight;
}
let bannerT = null;
function showBanner(txt) {
  const b = $('banner'); b.textContent = txt; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
function floater(x, y, txt, color, big) { floaters.push({ x: x + rand(-6, 6), y, txt, color, big, t: 0 }); }
function burst(x, y, color, n = 12, speed = 120, life = 0.6, kind = 'dot') {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(speed * 0.3, speed);
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - 30, life, max: life, color, kind, size: rand(2, 4) });
  }
}
function ring(x, y, r, color, life = 0.5) { parts.push({ x, y, kind: 'ring', r, color, life, max: life }); }
function notes(x, y, n = 3) {
  for (let i = 0; i < n; i++) parts.push({ x: x + rand(-14, 14), y: y - rand(30, 50), vx: rand(-15, 15), vy: rand(-50, -30), life: 1.2, max: 1.2, kind: 'note', color: ['#ff4fa3', '#ffcf40', '#4fd1ff', '#b48cff'][irand(0, 3)], ch: ['♪', '♫', '♬'][irand(0, 2)] });
}

// ---------------------------------------------------------------- combate
function dmgMob(m, base, crit, label) {
  if (m.dead) return;
  let dmg = Math.max(1, Math.round(base * rand(0.88, 1.12) - m.d.def));
  if (crit) dmg = Math.round(dmg * 1.8);
  m.hp -= dmg; m.hitFlash = 0.12;
  m.state = 'chase';
  floater(m.x, m.y - (m.d.boss ? 90 : 30), (crit ? '✦ ' : '') + dmg, crit ? '#ffcf40' : '#fff', crit || !!label);
  Audio8.sfx(crit ? 'crit' : 'hit');
  burst(m.x, m.y - 12, crit ? '#ffcf40' : '#fff', crit ? 10 : 5, 90, 0.35);
  if (m.hp <= 0) killMob(m);
}
function killMob(m) {
  m.dead = true;
  mobs = mobs.filter(o => o !== m);
  if (P.target === m) P.target = null;
  burst(m.x, m.y - 12, m.d.boss ? '#ffcf40' : '#ffe0f0', m.d.boss ? 60 : 16, m.d.boss ? 260 : 130, 0.8);
  Audio8.sfx(m.d.boss ? 'boom' : 'die');
  const z = irand(...m.d.zeny);
  drops.push({ id: 'zeny', n: z, x: m.x + rand(-10, 10), y: m.y + rand(-6, 6), t: 0 });
  for (const [it, ch] of m.d.drops) if (Math.random() < ch) drops.push({ id: it, n: 1, x: m.x + rand(-18, 18), y: m.y + rand(-10, 10), t: 0 });
  // penalidade de xp se o monstro for muito mais fraco
  const diff = P.lv - m.d.lv;
  const mult = diff > 8 ? 0.3 : diff > 5 ? 0.6 : 1;
  gainXp(Math.round(m.d.xp * mult));
  log(`Você derrotou <b>${m.d.name}</b>! +${Math.round(m.d.xp * mult)} XP`, 'xp');
  if (m.d.boss) log('🏆 <b>O Guardião das Areias caiu!</b> Que apresentação!', 'gold');
  respawnQ.push({ type: m.type, at: m.at, t: m.d.respawn });
}
function gainXp(n) {
  P.xp += n;
  while (P.xp >= xpNeed(P.lv) && P.lv < 60) {
    P.xp -= xpNeed(P.lv); P.lv++;
    P.statPts += 3 + Math.floor(P.lv / 5);
    P.hp = stats.maxHp(); P.sp = stats.maxSp();
    Audio8.sfx('level');
    for (let i = 0; i < 4; i++) setTimeout(() => ring(P.x, P.y - 20, 60 + i * 20, '#ffcf40', 0.7), i * 120);
    burst(P.x, P.y - 30, '#ffcf40', 40, 200, 1);
    floater(P.x, P.y - 70, 'LEVEL UP!', '#ffcf40', true);
    log(`✨ <b>Nível ${P.lv}!</b> Você ganhou pontos de atributo (tecla A).`, 'gold');
    const sk = SKILLS.find(s => s.lv === P.lv);
    if (sk) log(`Nova habilidade aprendida: <b>${sk.icon} ${sk.name}</b> [${sk.key.toUpperCase()}]`, 'gold');
    buildHotbar();
  }
}
function hurtPlayer(m) {
  if (P.dead) return;
  if (Math.random() < stats.flee()) { floater(P.x, P.y - 50, 'Miss', '#8fd3ff'); Audio8.sfx('miss'); return; }
  const dmg = Math.max(1, Math.round(m.d.atk * rand(0.85, 1.15) - stats.def()));
  P.hp -= dmg; P.hurtT = 0.15;
  if (P.sit) P.sit = false;
  floater(P.x, P.y - 50, dmg, '#ff5a5a');
  Audio8.sfx('hurt');
  if (P.hp <= 0) {
    P.hp = 0; P.dead = true; P.deadT = 3; P.path = []; P.target = null;
    log('💔 Você desmaiou... voltando para a cidade.', 'bad');
  }
}

function useSkill(i) {
  const s = SKILLS[i];
  if (!s || P.dead) return;
  if (P.lv < s.lv) { log(`${s.name} requer nível ${s.lv}.`, 'bad'); return; }
  if ((P.cds[s.id] || 0) > 0) return;
  if (P.sp < s.sp) { log('SP insuficiente!', 'bad'); return; }
  P.sp -= s.sp; P.cds[s.id] = s.cd; P.sit = false; P.dance = 1;
  notes(P.x, P.y, 4);
  const near = r => mobs.filter(m => dist(m, P) < r);
  switch (s.id) {
    case 'whirl':
      Audio8.sfx('whip');
      ring(P.x, P.y - 10, 95, '#ff4fa3', 0.4); ring(P.x, P.y - 10, 70, '#ffcf40', 0.3);
      near(100).forEach(m => dmgMob(m, stats.atk() * 1.5, Math.random() < stats.crit(), 1));
      break;
    case 'charm':
      Audio8.sfx('skill');
      ring(P.x, P.y - 10, 150, '#b48cff', 0.7);
      near(150).forEach(m => { m.stun = 3; dmgMob(m, stats.matk() * 0.8, false, 1); burst(m.x, m.y - 30, '#b48cff', 6, 50, 0.6); });
      break;
    case 'breeze':
      Audio8.sfx('buff');
      P.buffs.breeze = 25; burst(P.x, P.y - 20, '#7dff9a', 30, 150, 0.9);
      log('🍃 Dança da Brisa: você se sente leve como o vento!', 'gold');
      break;
    case 'moon': {
      Audio8.sfx('heal');
      const h = Math.round(stats.maxHp() * 0.35);
      P.hp = Math.min(stats.maxHp(), P.hp + h); P.buffs.moon = 6;
      floater(P.x, P.y - 60, '+' + h, '#7dff9a', true);
      ring(P.x, P.y - 10, 60, '#cfe8ff', 0.8); burst(P.x, P.y - 20, '#cfe8ff', 25, 80, 1.2);
      break;
    }
    case 'finale':
      Audio8.sfx('boom'); Audio8.sfx('buff');
      for (let k = 0; k < 4; k++) setTimeout(() => ring(P.x, P.y - 10, 60 + k * 45, ['#ff4fa3', '#ffcf40', '#4fd1ff', '#b48cff'][k], 0.6), k * 90);
      burst(P.x, P.y - 20, '#ffcf40', 50, 260, 1);
      notes(P.x, P.y, 10);
      near(200).forEach(m => dmgMob(m, stats.atk() * 1.8 + stats.matk() * 1.7, Math.random() < stats.crit(), 1));
      break;
  }
}
function usePotion(id) {
  if (P.dead || !P.inv[id]) { if (!P.inv[id]) log(`Sem ${ITEMS[id].name}.`, 'bad'); return; }
  P.inv[id]--;
  Audio8.sfx('heal');
  if (id === 'red') { P.hp = Math.min(stats.maxHp(), P.hp + 60); floater(P.x, P.y - 60, '+60', '#7dff9a'); burst(P.x, P.y - 20, '#ff7070', 10, 60, 0.6); }
  else { P.sp = Math.min(stats.maxSp(), P.sp + 40); floater(P.x, P.y - 60, '+40 SP', '#6fb3ff'); burst(P.x, P.y - 20, '#6fb3ff', 10, 60, 0.6); }
  buildHotbar();
}

// ---------------------------------------------------------------- atualização
function update(dt) {
  time += dt;
  updatePlayer(dt);
  for (const m of mobs) updateMob(m, dt);
  for (const r of respawnQ) r.t -= dt;
  respawnQ = respawnQ.filter(r => { if (r.t <= 0) { spawnMob(r.type, r.at); return false; } return true; });
  for (const f of floaters) { f.t += dt; f.y -= dt * 40; }
  floaters = floaters.filter(f => f.t < 1.1);
  for (const p of parts) {
    p.life -= dt;
    if (p.kind !== 'ring') { p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 'dot') p.vy += 160 * dt; }
  }
  parts = parts.filter(p => p.life > 0);
  // brilho na água e chafariz
  if (map.waterTiles.length && Math.random() < 0.3) {
    const [tx, ty] = map.waterTiles[irand(0, map.waterTiles.length - 1)];
    parts.push({ x: tx * TILE + rand(4, 28), y: ty * TILE + rand(4, 28), vx: 0, vy: -4, life: 0.6, max: 0.6, kind: 'spark', color: '#fff' });
  }
  for (const d of map.decor) if (d.kind === 'fountain' && Math.random() < 0.6) {
    const cx = (d.x + d.w / 2) * TILE, cy = (d.y + d.h / 2) * TILE - 30;
    parts.push({ x: cx, y: cy, vx: rand(-40, 40), vy: rand(-90, -50), life: 0.8, max: 0.8, kind: 'dot', color: '#bfe6ff', size: 2 });
  }
  for (const d of drops) d.t += dt;
  updateCam(false);
}

function updatePlayer(dt) {
  if (P.dead) {
    P.deadT -= dt;
    if (P.deadT <= 0) {
      P.dead = false; P.hp = Math.round(stats.maxHp() * 0.5); P.sp = Math.round(stats.maxSp() * 0.5);
      P.xp = Math.max(0, P.xp - Math.floor(xpNeed(P.lv) * 0.03));
      loadMap(P.homeTown);
    }
    return;
  }
  for (const k in P.cds) P.cds[k] = Math.max(0, P.cds[k] - dt);
  for (const k in P.buffs) { P.buffs[k] -= dt; if (P.buffs[k] <= 0) { delete P.buffs[k]; if (k === 'breeze') log('A Dança da Brisa terminou.', 'sys'); } }
  P.atkCd -= dt; P.attackAnim = Math.max(0, P.attackAnim - dt * 4); P.dance = Math.max(0, P.dance - dt * 1.6);
  P.hurtT = Math.max(0, P.hurtT - dt);

  // regeneração
  P.regenT += dt;
  const regenEvery = P.sit ? 1 : 3;
  if (P.regenT >= regenEvery) {
    P.regenT = 0;
    P.hp = Math.min(stats.maxHp(), P.hp + Math.max(1, Math.floor(stats.maxHp() * 0.02 + P.vit * 0.3)));
    P.sp = Math.min(stats.maxSp(), P.sp + Math.max(1, Math.floor(stats.maxSp() * 0.03 + P.int * 0.2)));
  }
  if (P.buffs.moon) P.hp = Math.min(stats.maxHp(), P.hp + stats.maxHp() * 0.03 * dt);
  if (P.buffs.breeze && Math.random() < 0.3) parts.push({ x: P.x + rand(-12, 12), y: P.y - rand(0, 40), vx: -P.dir * 30, vy: -10, life: 0.6, max: 0.6, kind: 'leaf', color: '#7dff9a' });

  // teclado
  let kx = (keys.arrowright ? 1 : 0) - (keys.arrowleft ? 1 : 0);
  let ky = (keys.arrowdown ? 1 : 0) - (keys.arrowup ? 1 : 0);
  const sp = stats.speed();
  P.walking = false;
  if (kx || ky) {
    P.path = []; P.target = null; P.npcTarget = null; P.sit = false;
    const l = Math.hypot(kx, ky); kx /= l; ky /= l;
    moveP(kx * sp * dt, ky * sp * dt);
  } else {
    // seguir alvo
    if (P.target) {
      const m = P.target;
      if (m.dead || !mobs.includes(m)) P.target = null;
      else {
        const d = dist(m, P);
        if (d > 64) {
          if (!P.path.length || (P.repath -= dt) <= 0) { goTo(m.x, m.y); P.repath = 0.35; }
        } else {
          P.path = []; P.dir = m.x < P.x ? -1 : 1;
          if (P.atkCd <= 0) {
            P.atkCd = stats.aspd(); P.attackAnim = 1;
            Audio8.sfx('whip');
            dmgMob(m, stats.atk(), Math.random() < stats.crit());
          }
        }
      }
    }
    if (P.npcTarget) {
      const n = P.npcTarget;
      if (dist(n, P) < 56) { P.path = []; P.npcTarget = null; talk(n); }
    }
    if (P.path.length) {
      const nx = P.path[0];
      const dx = nx.x - P.x, dy = nx.y - P.y, d = Math.hypot(dx, dy);
      const step = sp * dt;
      if (d <= step) { P.x = nx.x; P.y = nx.y; P.path.shift(); }
      else { P.x += dx / d * step; P.y += dy / d * step; }
      if (Math.abs(dx) > 1) P.dir = dx < 0 ? -1 : 1;
      P.walking = true;
    }
  }
  // segurar o clique para andar
  if (pointer.down && pointer.free && (pointer.rep -= dt) <= 0) { pointer.rep = 0.2; goTo(pointer.wx, pointer.wy); }

  // coletar itens
  for (const d of drops) {
    if (d.t > 0.4 && Math.hypot(d.x - P.x, d.y - P.y) < 26) {
      d.taken = true;
      if (d.id === 'zeny') { P.zeny += d.n; Audio8.sfx('coin'); floater(d.x, d.y - 20, `+${d.n}z`, '#ffcf40'); }
      else { P.inv[d.id] = (P.inv[d.id] || 0) + d.n; Audio8.sfx('pick'); log(`Você pegou <b>${ITEMS[d.id].name}</b>.`, 'item'); buildHotbar(); }
    }
  }
  drops = drops.filter(d => !d.taken);

  // portais
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (const p of map.portals) {
    if (tx >= p.x && tx < p.x + p.w && ty >= p.y && ty < p.y + p.h) { Audio8.sfx('warp'); loadMap(p.to, p.tx, p.ty); return; }
  }
}
function moveP(dx, dy) {
  if (canStand(P.x + dx, P.y)) P.x += dx;
  if (canStand(P.x, P.y + dy)) P.y += dy;
  if (dx) P.dir = dx < 0 ? -1 : 1;
  P.walking = true;
}

function updateMob(m, dt) {
  m.hitFlash = Math.max(0, m.hitFlash - dt);
  m.atkCd -= dt; m.moving = false;
  if (m.stun > 0) { m.stun -= dt; return; }
  const dP = dist(m, P);
  if (m.state !== 'chase' && m.d.aggro && dP < m.d.aggro && !P.dead) m.state = 'chase';
  const reach = m.d.boss ? 60 : 30;
  if (m.state === 'chase') {
    if (P.dead || Math.hypot(m.x - m.sx, m.y - m.sy) > 520) { m.state = 'return'; m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.2); return; }
    if (dP > reach) stepMob(m, P.x, P.y, m.d.speed * 1.25, dt);
    else if (m.atkCd <= 0) {
      m.atkCd = m.d.boss ? 1.4 : 1.6;
      hurtPlayer(m);
      if (m.d.boss && Math.random() < 0.3) {
        ring(m.x, m.y - 10, 120, '#e0a050', 0.6); Audio8.sfx('boom');
        if (dP < 120) hurtPlayer(m);
      }
    }
  } else if (m.state === 'return') {
    if (Math.hypot(m.x - m.sx, m.y - m.sy) < 20) m.state = 'idle';
    else stepMob(m, m.sx, m.sy, m.d.speed * 1.5, dt);
  } else {
    m.timer -= dt;
    if (m.timer <= 0) {
      m.timer = rand(2, 5);
      const a = rand(0, TAU), r = rand(20, 90);
      m.tx = m.sx + Math.cos(a) * r; m.ty = m.sy + Math.sin(a) * r;
    }
    if (Math.hypot(m.tx - m.x, m.ty - m.y) > 4) stepMob(m, m.tx, m.ty, m.d.speed * 0.5, dt);
  }
}
function stepMob(m, tx, ty, sp, dt) {
  const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
  if (d < 1) return;
  const vx = dx / d * sp * dt, vy = dy / d * sp * dt;
  const r = m.d.boss ? 14 : 8;
  let moved = false;
  if (canStand(m.x + vx, m.y, r)) { m.x += vx; moved = true; }
  if (canStand(m.x, m.y + vy, r)) { m.y += vy; moved = true; }
  if (!moved) { m.tx = m.x; m.ty = m.y; m.timer = 0; }
  if (Math.abs(dx) > 2) m.dir = dx < 0 ? -1 : 1;
  m.moving = moved;
}

function updateCam(snap) {
  const mw = map.w * TILE, mh = map.h * TILE;
  const tx = mw < VW ? (mw - VW) / 2 : clamp(P.x - VW / 2, 0, mw - VW);
  const ty = mh < VH ? (mh - VH) / 2 : clamp(P.y - 20 - VH / 2, 0, mh - VH);
  if (snap) { cam.x = tx; cam.y = ty; } else { cam.x += (tx - cam.x) * 0.15; cam.y += (ty - cam.y) * 0.15; }
}

// ---------------------------------------------------------------- render
function render() {
  g.fillStyle = '#10141c'; g.fillRect(0, 0, VW, VH);
  g.save();
  g.translate(-Math.round(cam.x), -Math.round(cam.y));
  g.drawImage(map.ground, 0, 0);

  // portais
  for (const p of map.portals) {
    const cx = (p.x + p.w / 2) * TILE + (p.x === 0 ? 10 : -10), cy = (p.y + p.h / 2) * TILE;
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = `hsla(${(time * 80 + i * 40) % 360},90%,70%,${0.6 - i * 0.15})`; g.lineWidth = 3;
      g.beginPath(); g.ellipse(cx, cy, 18 + i * 7 + Math.sin(time * 3 + i) * 3, 40 + i * 10, 0, time * 2 + i, time * 2 + i + 4.5); g.stroke();
    }
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 40);
    gr.addColorStop(0, 'rgba(180,220,255,.55)'); gr.addColorStop(1, 'rgba(180,220,255,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, 28, 60, 0, 0, TAU); g.fill();
  }

  // marcador de destino
  if (P.path.length && !P.target) {
    const l = P.path[P.path.length - 1];
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2;
    const s = 6 + Math.sin(time * 8) * 2;
    g.beginPath(); g.ellipse(l.x, l.y, s * 1.6, s * 0.8, 0, 0, TAU); g.stroke();
  }

  for (const d of drops) drawItemIcon(g, d.x, d.y, d.id, d.t);

  // lista ordenada por Y
  const L = [];
  const vx0 = cam.x - 120, vx1 = cam.x + VW + 120, vy0 = cam.y - 60, vy1 = cam.y + VH + 160;
  for (const o of tall) {
    const ox = o.kind === 'house' ? o.x + o.h.w * TILE / 2 : o.x;
    if (ox > vx0 - 200 && ox < vx1 + 200 && o.y > vy0 && o.y < vy1 + 100) L.push(o);
  }
  for (const m of mobs) if (m.x > vx0 && m.x < vx1 && m.y > vy0 && m.y < vy1) L.push({ kind: 'mob', m, y: m.y });
  for (const n of npcs) L.push({ kind: 'npc', n, y: n.y });
  L.push({ kind: 'player', y: P.y });
  L.sort((a, b) => a.y - b.y);
  for (const o of L) {
    if (o.kind === 'tall') { const s = tallSprite(o.ch, o.v); g.drawImage(s, o.x - 32, o.y - 80); }
    else if (o.kind === 'house') drawHouse(g, o.h, time);
    else if (o.kind === 'mob') {
      const m = o.m;
      if (P.target === m) { g.strokeStyle = '#ff5a5a'; g.lineWidth = 2; g.beginPath(); g.ellipse(m.x, m.y, m.d.boss ? 40 : 16, m.d.boss ? 14 : 6, 0, 0, TAU); g.stroke(); }
      drawMob(g, m, time);
      if (m.stun > 0) for (let i = 0; i < 3; i++) g.fillText && (g.font = '12px sans-serif', g.fillStyle = '#ffcf40', g.fillText('★', m.x - 6 + Math.cos(time * 5 + i * 2) * 12, m.y - (m.d.boss ? 100 : 36) + Math.sin(time * 5 + i * 2) * 4));
    }
    else if (o.kind === 'npc') drawNPC(g, o.n.x, o.n.y, o.n.look, time);
    else {
      if (P.hurtT > 0) g.globalAlpha = 0.6;
      drawDancer(g, P.x, P.y + 8, { t: time, dir: P.dir, walk: P.walking, dance: P.dance, attack: P.attackAnim, sit: P.sit, dead: P.dead });
      g.globalAlpha = 1;
    }
  }

  // partículas
  for (const p of parts) {
    const a = Math.max(0, p.life / p.max);
    if (p.kind === 'ring') {
      const k = 1 - a;
      g.strokeStyle = p.color; g.globalAlpha = a; g.lineWidth = 3;
      g.beginPath(); g.ellipse(p.x, p.y, p.r * (0.3 + k * 0.7), p.r * 0.45 * (0.3 + k * 0.7), 0, 0, TAU); g.stroke();
    } else if (p.kind === 'note') {
      g.globalAlpha = a; g.fillStyle = p.color; g.font = 'bold 16px serif'; g.fillText(p.ch, p.x, p.y);
    } else if (p.kind === 'spark') {
      g.globalAlpha = a; g.fillStyle = p.color; g.fillRect(p.x - 1, p.y - 1, 2, 2);
    } else if (p.kind === 'leaf') {
      g.globalAlpha = a; ell(g, p.x, p.y, 3, 1.5, p.color);
    } else {
      g.globalAlpha = a; g.fillStyle = p.color; g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
  g.globalAlpha = 1;

  // nomes e barras
  g.textAlign = 'center';
  for (const m of mobs) {
    if (m.hp < m.maxHp || P.target === m || hoverMob === m) {
      const by = m.y + 8, w = m.d.boss ? 70 : 34;
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(m.x - w / 2 - 1, by - 1, w + 2, 6);
      g.fillStyle = m.hp / m.maxHp > 0.3 ? '#4cd964' : '#ff3b30'; g.fillRect(m.x - w / 2, by, w * m.hp / m.maxHp, 4);
    }
    if (P.target === m || hoverMob === m || m.d.boss) {
      g.font = 'bold 11px Verdana'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.8)';
      const t = `${m.d.name} (Lv ${m.d.lv})`;
      g.strokeText(t, m.x, m.y + 26); g.fillStyle = m.d.boss ? '#ffcf40' : '#ffd0d0'; g.fillText(t, m.x, m.y + 26);
    }
  }
  g.font = 'bold 11px Verdana';
  for (const n of npcs) {
    g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.8)';
    g.strokeText(n.name, n.x, n.y + 16); g.fillStyle = '#9fe0ff'; g.fillText(n.name, n.x, n.y + 16);
    const bob = Math.sin(time * 3) * 3;
    g.fillStyle = '#ffcf40'; g.font = 'bold 16px Verdana'; g.strokeText('!', n.x, n.y - 54 + bob); g.fillText('!', n.x, n.y - 54 + bob); g.font = 'bold 11px Verdana';
  }
  g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.8)';
  g.strokeText(P.name, P.x, P.y + 26); g.fillStyle = '#fff'; g.fillText(P.name, P.x, P.y + 26);
  // mini barras da jogadora
  const pw = 40;
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(P.x - pw / 2 - 1, P.y + 30, pw + 2, 8);
  g.fillStyle = '#4cd964'; g.fillRect(P.x - pw / 2, P.y + 31, pw * P.hp / stats.maxHp(), 3);
  g.fillStyle = '#3a8bff'; g.fillRect(P.x - pw / 2, P.y + 34, pw * P.sp / stats.maxSp(), 3);

  for (const f of floaters) {
    const a = 1 - f.t / 1.1;
    g.globalAlpha = a; g.font = `bold ${f.big ? 20 : 15}px Verdana`;
    g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(f.txt, f.x, f.y);
    g.fillStyle = f.color; g.fillText(f.txt, f.x, f.y);
  }
  g.globalAlpha = 1; g.textAlign = 'left';
  g.restore();

  if (map.tint) { g.fillStyle = map.tint; g.fillRect(0, 0, VW, VH); }
  if (P.dead) {
    g.fillStyle = 'rgba(40,0,20,.45)'; g.fillRect(0, 0, VW, VH);
    g.fillStyle = '#fff'; g.font = 'bold 28px Verdana'; g.textAlign = 'center';
    g.fillText('Você desmaiou...', VW / 2, VH / 2); g.textAlign = 'left';
  }
  updateHUD();
}

// ---------------------------------------------------------------- HUD
function updateHUD() {
  const mh = stats.maxHp(), ms = stats.maxSp(), need = xpNeed(P.lv);
  $('st-name').textContent = P.name;
  $('st-lv').textContent = `Dançarina · Nv ${P.lv}`;
  $('hpbar').style.width = (P.hp / mh * 100) + '%';
  $('spbar').style.width = (P.sp / ms * 100) + '%';
  $('xpbar').style.width = (P.xp / need * 100) + '%';
  $('hptxt').textContent = `${Math.ceil(P.hp)} / ${mh}`;
  $('sptxt').textContent = `${Math.floor(P.sp)} / ${ms}`;
  $('xptxt').textContent = `${(P.xp / need * 100).toFixed(1)}%`;
  $('zeny').textContent = P.zeny.toLocaleString('pt-BR');
  $('btn-stat').classList.toggle('alert', P.statPts > 0);
  document.querySelectorAll('.slot[data-skill]').forEach(el => {
    const s = SKILLS[+el.dataset.skill];
    const cd = P.cds[s.id] || 0;
    el.querySelector('.cd').style.height = (cd / s.cd * 100) + '%';
    el.classList.toggle('locked', P.lv < s.lv);
    el.classList.toggle('nosp', P.sp < s.sp);
  });
  let b = '';
  if (P.buffs.breeze) b += `<span>🍃 ${Math.ceil(P.buffs.breeze)}s</span>`;
  if (P.buffs.moon) b += `<span>🌙 ${Math.ceil(P.buffs.moon)}s</span>`;
  if (P.sit) b += '<span>🧘 Descansando</span>';
  $('buffs').innerHTML = b;
  if (!$('statwin').classList.contains('hidden')) renderStats(false);
}
function buildHotbar() {
  const hb = $('hotbar'); hb.innerHTML = '';
  SKILLS.forEach((s, i) => {
    const el = document.createElement('div'); el.className = 'slot'; el.dataset.skill = i;
    el.title = `${s.name} (Nv ${s.lv}, ${s.sp} SP)\n${s.desc}`;
    el.innerHTML = `<span class="ic">${s.icon}</span><span class="k">${s.key.toUpperCase()}</span><span class="cost">${P.lv < s.lv ? 'Nv' + s.lv : s.sp}</span><div class="cd"></div>`;
    el.onclick = () => useSkill(i);
    hb.appendChild(el);
  });
  [['red', '1', '🧪'], ['blue', '2', '💧']].forEach(([id, k, ic]) => {
    const el = document.createElement('div'); el.className = 'slot pot ' + id;
    el.title = `${ITEMS[id].name}: ${ITEMS[id].desc}`;
    el.innerHTML = `<span class="ic">${ic}</span><span class="k">${k}</span><span class="cost">x${P.inv[id] || 0}</span>`;
    el.onclick = () => usePotion(id);
    hb.appendChild(el);
  });
}
function renderStats(full = true) {
  const w = $('statwin');
  const row = (k, label, info) => `<div class="srow"><span class="sl">${label}</span><b>${P[k]}</b><button data-st="${k}" ${P.statPts ? '' : 'disabled'}>+</button><span class="si">${info}</span></div>`;
  const html = `<div class="wt">Atributos <span class="x" data-close>×</span></div>
    ${row('str', 'FOR', 'Dano físico')}${row('agi', 'AGI', 'Vel. ataque, esquiva')}
    ${row('vit', 'VIT', 'HP e defesa')}${row('int', 'INT', 'SP e dano mágico')}
    <div class="pts">Pontos disponíveis: <b>${P.statPts}</b></div>
    <div class="derived">ATQ <b>${stats.atk()}</b> · MATQ <b>${stats.matk()}</b> · DEF <b>${stats.def()}</b><br>
    Ataques/s <b>${(1 / stats.aspd()).toFixed(2)}</b> · Esquiva <b>${Math.round(stats.flee() * 100)}%</b> · Crítico <b>${Math.round(stats.crit() * 100)}%</b></div>`;
  if (w.dataset.h !== html) { w.innerHTML = html; w.dataset.h = html; }
}
$('statwin').addEventListener('click', e => {
  const k = e.target.dataset.st;
  if (k && P.statPts > 0) { P[k]++; P.statPts--; Audio8.sfx('click'); renderStats(); buildHotbar(); }
  if (e.target.dataset.close !== undefined) toggleStats();
});
function toggleStats() { $('statwin').classList.toggle('hidden'); renderStats(); }

// ---------------------------------------------------------------- diálogos
function dialog(title, text, opts) {
  const d = $('dialog');
  d.innerHTML = `<div class="wt">${title}</div><div class="dtext">${text}</div><div class="dopts"></div>`;
  const o = d.querySelector('.dopts');
  (opts || [{ label: 'Fechar' }]).forEach(op => {
    const b = document.createElement('button'); b.textContent = op.label;
    b.onclick = () => { Audio8.sfx('click'); const keep = op.fn && op.fn(); if (!keep) closeDialog(); };
    o.appendChild(b);
  });
  d.classList.remove('hidden');
}
function closeDialog() { $('dialog').classList.add('hidden'); }

function talk(n) {
  P.dir = n.x < P.x ? -1 : 1;
  const nm = `💬 ${n.name}`;
  switch (n.id) {
    case 'healer':
      dialog(nm, 'Que a luz guie seus passos, dançarina. Deixe-me cuidar de você.', [
        { label: '✚ Curar (grátis)', fn: () => { P.hp = stats.maxHp(); P.sp = stats.maxSp(); Audio8.sfx('heal'); burst(P.x, P.y - 20, '#cfe8ff', 25, 90, 1); log(`${n.name} restaurou seu HP e SP.`, 'item'); } },
        { label: 'Até logo' }]);
      break;
    case 'shop': {
      const shop = () => {
        dialog(nm, `Bem-vinda! Tenho o melhor estoque da região.<br><small>Seu zeny: <b>${P.zeny}z</b> · 🧪 ${P.inv.red} · 💧 ${P.inv.blue}</small>`, [
          { label: `🧪 Poção Vermelha — ${ITEMS.red.price}z`, fn: () => { buy('red', 1); shop(); return true; } },
          { label: `🧪×10 — ${ITEMS.red.price * 10}z`, fn: () => { buy('red', 10); shop(); return true; } },
          { label: `💧 Poção Azul — ${ITEMS.blue.price}z`, fn: () => { buy('blue', 1); shop(); return true; } },
          { label: 'Sair' }]);
      };
      shop(); break;
    }
    case 'master':
      dialog(nm, `Ah, minha aluna favorita! Lembre-se: uma dançarina luta com <b>ritmo</b>.<br><br>
        ${SKILLS.map(s => `${s.icon} <b>${s.name}</b> [${s.key.toUpperCase()}] — Nv ${s.lv}<br><small>${s.desc}</small>`).join('<br>')}<br><br>
        Dica: aperte <b>X</b> para sentar e recuperar HP/SP mais rápido.`);
      break;
    case 'caravan': {
      const dest = P.map === 'solmira' ? 'kharum' : 'solmira';
      const cost = 150;
      dialog(nm, `A caravana parte para <b>${MAPS[dest].name}</b>. A viagem custa <b>${cost}z</b>.<br><small>Você tem ${P.zeny}z.</small>`, [
        { label: `🐪 Viajar (${cost}z)`, fn: () => { if (P.zeny < cost) { log('Zeny insuficiente para a caravana.', 'bad'); return; } P.zeny -= cost; Audio8.sfx('warp'); loadMap(dest); } },
        { label: 'Talvez depois' }]);
      break;
    }
    case 'guard':
      dialog(nm, 'Os Campos Dourados ficam a leste. Os Pompons são inofensivos, mas cuidado com os <b>Zunzuns</b> — eles atacam quem chega perto!<br><br>Mais além ficam as <b>Areias Rubras</b>... dizem que um guardião de pedra desperta lá.');
      break;
    case 'farmer':
      dialog(nm, 'Esses Fungolinos estão comendo minha plantação! Se você der uma lição neles, eu agradeço.<br><small>Siga a estrada para o leste para chegar ao deserto.</small>');
      break;
    case 'elder':
      dialog(nm, 'Há muito tempo, as dançarinas de Kharum acalmavam as tempestades de areia com seus passos.<br><br>O <b>Guardião das Areias</b> nas ruínas a nordeste só se curva diante de uma apresentação perfeita. Volte quando estiver acima do nível 15, criança.');
      break;
  }
}
function buy(id, n) {
  const c = ITEMS[id].price * n;
  if (P.zeny < c) { log('Zeny insuficiente!', 'bad'); Audio8.sfx('miss'); return; }
  P.zeny -= c; P.inv[id] = (P.inv[id] || 0) + n; Audio8.sfx('coin');
  log(`Comprou ${n}x <b>${ITEMS[id].name}</b>.`, 'item'); buildHotbar();
}

// ---------------------------------------------------------------- entrada
const pointer = { down: false, free: false, wx: 0, wy: 0, rep: 0 };
let hoverMob = null;
function worldAt(e) { return { x: e.clientX + cam.x, y: e.clientY + cam.y }; }
function pickMob(w) {
  let best = null, bd = 1e9;
  for (const m of mobs) {
    const cy = m.y - (m.d.boss ? 50 : m.type === 'zunzum' ? 28 : 12);
    const d = Math.hypot(w.x - m.x, w.y - cy);
    const r = m.d.boss ? 50 : 24;
    if (d < r && d < bd) { bd = d; best = m; }
  }
  return best;
}
cv.addEventListener('pointerdown', e => {
  if (!running || P.dead) return;
  Audio8.init();
  const w = worldAt(e);
  pointer.down = true; pointer.free = false; pointer.wx = w.x; pointer.wy = w.y; pointer.rep = 0.25;
  const m = pickMob(w);
  if (m) { P.target = m; P.npcTarget = null; P.sit = false; return; }
  const n = npcs.find(n => Math.hypot(w.x - n.x, w.y - (n.y - 20)) < 26);
  if (n) { P.target = null; P.npcTarget = n; goTo(n.x, n.y + 10); return; }
  P.target = null; P.npcTarget = null; pointer.free = true;
  goTo(w.x, w.y);
});
cv.addEventListener('pointermove', e => {
  const w = worldAt(e); pointer.wx = w.x; pointer.wy = w.y;
  hoverMob = running ? pickMob(w) : null;
  const overNpc = running && npcs.some(n => Math.hypot(w.x - n.x, w.y - (n.y - 20)) < 26);
  cv.style.cursor = hoverMob ? 'crosshair' : overNpc ? 'help' : 'pointer';
});
addEventListener('pointerup', () => { pointer.down = false; });

addEventListener('keydown', e => {
  if (!running || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k.startsWith('arrow')) e.preventDefault();
  const si = SKILLS.findIndex(s => s.key === k);
  if (si >= 0) useSkill(si);
  if (k === '1') usePotion('red');
  if (k === '2') usePotion('blue');
  if (k === 'a') toggleStats();
  if (k === 'x') toggleSit();
  if (k === 'm') toggleMusic();
  if (k === 'h') showHelp();
  if (k === 'escape') { closeDialog(); $('statwin').classList.add('hidden'); P.target = null; }
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function toggleSit() {
  if (P.dead) return;
  P.sit = !P.sit; P.path = []; P.target = null;
  log(P.sit ? 'Você se sentou para descansar.' : 'Você se levantou.', 'sys');
}
function toggleMusic() { const on = Audio8.toggleMusic(); $('btn-music').textContent = on ? '🎵' : '🔇'; }
function showHelp() {
  dialog('📜 Como jogar', `
  <b>Clique no chão</b> para andar (segure para continuar andando) · <b>Setas</b> também movem.<br>
  <b>Clique num monstro</b> para atacá-lo com sua fita de seda.<br>
  <b>Clique num NPC</b> (com <span style="color:#ffcf40">!</span>) para conversar.<br><br>
  <b>Q W E R T</b> — habilidades de dança<br>
  <b>1</b> Poção Vermelha · <b>2</b> Poção Azul<br>
  <b>A</b> atributos · <b>X</b> sentar · <b>M</b> música · <b>Esc</b> fechar<br><br>
  Siga a estrada a leste: Solmira → Campos Dourados → Areias Rubras → Oásis de Kharum.<br>
  O jogo salva automaticamente.`);
}
$('btn-stat').onclick = toggleStats;
$('btn-music').onclick = toggleMusic;
$('btn-sit').onclick = toggleSit;
$('btn-help').onclick = showHelp;

// ---------------------------------------------------------------- salvar
const SAVE_KEY = 'dancarina-save-v1';
function save() {
  if (!running) return;
  const { name, lv, xp, zeny, statPts, str, agi, vit, int, hp, sp, inv, map: m, homeTown } = P;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ name, lv, xp, zeny, statPts, str, agi, vit, int, hp, sp, inv, map: m, homeTown, x: P.x, y: P.y })); } catch (e) { }
}
function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
setInterval(save, 8000);
addEventListener('beforeunload', save);

// ---------------------------------------------------------------- início
function start(fromSave) {
  Audio8.init();
  $('title').classList.add('hidden');
  running = true;
  buildHotbar();
  if (fromSave) {
    const s = loadSave();
    Object.assign(P, s, { inv: { red: 0, blue: 0, ...s.inv } });
    loadMap(s.map, Math.floor(s.x / TILE), Math.floor(s.y / TILE));
    log(`Bem-vinda de volta, <b>${P.name}</b>!`, 'gold');
  } else {
    P.name = ($('name-in').value.trim() || 'Lyra').slice(0, 16);
    P.hp = stats.maxHp(); P.sp = stats.maxSp();
    loadMap('solmira');
    log(`Bem-vinda a Solmira, <b>${P.name}</b>! Aperte <b>H</b> para ver os controles.`, 'gold');
    log('Fale com a <b>Mestra Odete</b> para aprender sobre suas danças.', 'sys');
  }
  buildHotbar();
}
// confirmação dentro do jogo (confirm() não funciona em todo lugar, ex.: páginas do Claude)
let newArmed = false;
function armNew() {
  if (newArmed) return true;
  newArmed = true; $('btn-new').textContent = '⚠️ Toque de novo: apaga o progresso';
  setTimeout(() => { newArmed = false; $('btn-new').textContent = '✨ Novo Jogo'; }, 4000);
  return false;
}
$('btn-new').onclick = () => {
  if (loadSave() && !armNew()) return;
  start(false);
};
$('btn-cont').onclick = () => start(true);
if (!loadSave()) $('btn-cont').style.display = 'none';
$('name-in').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-new').click(); });

// prévia animada na tela de título
const tc = $('title-cv'), tg = tc.getContext('2d');
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (running) { update(dt); render(); }
  else {
    time += dt;
    tg.clearRect(0, 0, tc.width, tc.height);
    tg.save(); tg.scale(2.4, 2.4);
    const d = (time % 3) / 3;
    drawDancer(tg, 50, 64, { t: time, dir: 1, walk: false, dance: d < 0.5 ? d * 2 : 0, attack: 0 });
    tg.restore();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
