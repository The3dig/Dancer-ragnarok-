// =====================================================================
//  Monstros compartilhados (o jogo é todo on-line).
//  Todos veem e batem nos MESMOS monstros dos campos, das areias e de Valdora.
//  - O servidor guarda a vida de cada monstro, recebe o dano de todos e diz
//    quem matou. XP: cada um ganha pela parte do dano que deu; o item e as
//    coroas caem para quem deu o último golpe.
//  - Quem está mais perto "controla" o monstro: a IA roda no jogo dele e a
//    posição vai para o servidor. Nos outros jogos o monstro só anda até a
//    posição que chega. Se outro jogador ficar bem mais perto, o controle passa.
//  - Quando um monstro renasce, o servidor pede para quem o controla escolher
//    o lugar (o servidor não conhece o relevo do mapa).
//  Torre, Alfas, chefes de campo e Kravenox continuam como antes.
// =====================================================================
'use strict';
const Partilha = (() => {
  const porId = () => { const o = new Map(); for (const m of mobs) if (m.nid) o.set(m.nid, m); return o; };
  const mortos = new Map();          // id -> tipo (para renascer)
  const me = () => Net.me;
  const meu = m => !!m.dono && m.dono === me();
  let envT = 0;

  function tirar(m) { m.dead = true; mobs = mobs.filter(o => o !== m); scene.remove(m.model.g); m.lab.remove(); }
  function spawnDe(id) { const si = parseInt(id, 10), s = SPAWNS[si]; return s || null; }
  function criar(o) {
    const s = spawnDe(o.id); if (!s || !MOBDEF[o.type]) return null;
    const m = spawnMob(o.type, s.area, { x: o.x, z: o.z });
    m.nid = o.id; m.area = s.area; m.at = s.at; m.sx = o.x; m.sz = o.z;
    if (s.at) { m.sx = s.at.x; m.sz = s.at.z; }
    m.nx = o.x; m.nz = o.z; m.dono = o.dono; m.maxHp = Math.max(m.maxHp, o.max || 1); m.hp = o.hp ?? m.maxHp;
    return m;
  }
  // lista completa do servidor: acerta os monstros deste jogo com a do mundo
  function aplicar(lista) {
    const loc = porId(), vistos = new Set();
    for (const o of lista) {
      vistos.add(o.id);
      let m = loc.get(o.id);
      if (!o.vivo) { if (m) tirar(m); mortos.set(o.id, o.type); continue; }
      mortos.delete(o.id);
      if (!m) m = criar(o); if (!m) continue;
      m.x = m.nx = o.x; m.z = m.nz = o.z; m.dono = o.dono; m.hp = Math.min(m.maxHp, o.hp ?? m.hp);
    }
    for (const [id, m] of loc) if (!vistos.has(id)) tirar(m);
  }
  function semente() {
    const l = mobs.filter(m => m.nid).map(m => ({ id: m.nid, type: m.type, max: m.maxHp, hp: m.hp, resp: m.d.respawn, x: +m.x.toFixed(2), z: +m.z.toFixed(2), vivo: true }));
    Net.send({ t: 'semente', l });
  }
  // ---------------- mensagens do servidor
  function init() {
    Net.on('semente?', semente);
    Net.on('todos', m => { if (m.mobs) aplicar(m.mobs); });
    Net.on('mundo', m => aplicar(m.mobs || []));
    Net.on('mundo1', m => { const o = m.mob, loc = porId().get(o.id); mortos.delete(o.id); if (loc) { loc.dono = o.dono; loc.hp = o.hp; return; } criar(o); });
    Net.on('m', m => {
      const loc = porId();
      for (const [id, x, z, f, st] of m.l) {
        const mb = loc.get(id); if (!mb || meu(mb)) continue;
        mb.nx = x; mb.nz = z; mb.face = f; mb.netSt = st | 0;
        if (Math.hypot(mb.x - x, mb.z - z) > 25) { mb.x = x; mb.z = z; }          // longe demais: pula direto
      }
    });
    Net.on('hp', m => { const mb = porId().get(m.id); if (mb) { mb.hp = Math.max(m.hp, 1); if (m.by && m.by !== me()) mb.flash = 0.08; } });
    Net.on('morre', m => {
      const mb = porId().get(m.id); mortos.set(m.id, mb ? mb.type : mortos.get(m.id));
      if (!mb) return;
      const total = Object.values(m.dano || {}).reduce((a, b) => a + b, 0) || 1, parte = Math.min(1, ((m.dano || {})[me()] || 0) / total);
      if (m.by === me()) killMob(mb, { parte: Math.max(parte, 0.5) });       // último golpe: itens, coroas e pelo menos metade do XP
      else if (parte > 0.02) killMob(mb, { ajuda: parte });
      else killMob(mb, { semPremio: true });
    });
    Net.on('dono', m => { const loc = porId(); for (const [id, peer] of m.l) { const mb = loc.get(id); if (mb) { mb.dono = peer; if (peer === me()) { mb.state = 'idle'; mb.tx = mb.x; mb.tz = mb.z; } } } });
    Net.on('nasce', m => {                                                            // eu controlo: escolho onde ele renasce
      const type = mortos.get(m.id), s = spawnDe(m.id); if (!type || !s || porId().get(m.id)) return;
      const mb = spawnMob(type, s.area, s.at); mb.nid = m.id; mb.dono = me(); mb.nx = mb.x; mb.nz = mb.z;
      Net.send({ t: 'nasceu', id: m.id, x: +mb.x.toFixed(2), z: +mb.z.toFixed(2) });
    });
    Net.on('caiu', () => { });
  }
  // ---------------- o que eu mando
  function dano(m, v) { Net.send({ t: 'd', id: m.nid, v: Math.round(v) }); }
  function cura(m) { if (meu(m)) Net.send({ t: 'cura', id: m.nid, hp: Math.round(m.hp) }); }
  function update(dt) {
    if (!Net.connected || !Net.me) return;
    if ((envT -= dt) > 0) return; envT = 0.2;                                         // 5x por segundo
    const l = [];
    for (const m of mobs) {
      if (!m.nid || !meu(m)) continue;
      const st = (m.moving ? 1 : 0) | ((m.swing || 0) > 0.5 ? 2 : 0) | (m.stun > 0 ? 4 : 0);
      const k = m.x.toFixed(1) + ',' + m.z.toFixed(1) + ',' + st + ',' + m.face.toFixed(1);
      if (m.envK === k) continue; m.envK = k;
      l.push([m.nid, +m.x.toFixed(2), +m.z.toFixed(2), +m.face.toFixed(2), st]);
    }
    if (l.length) Net.send({ t: 'm', l });
  }
  // monstro de outro jogo: anda suave até a posição que chegou
  function mover(m, dt) {
    if (m.nx == null) return;
    const dx = m.nx - m.x, dz = m.nz - m.z, d = Math.hypot(dx, dz), k = Math.min(1, dt * 7);
    m.x += dx * k; m.z += dz * k; m.moving = d > 0.05 || ((m.netSt || 0) & 1) === 1;
    if (((m.netSt || 0) & 2) && (m.swing || 0) < 0.2) m.swing = 1;
    m.stun = ((m.netSt || 0) & 4) ? 0.1 : 0;
  }
  return { init, update, dano, cura, mover, meu };
})();
