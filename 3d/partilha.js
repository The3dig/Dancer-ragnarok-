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
  const dgMortos = new Set();                                        // chefes que o servidor diz que já caíram (castelo)

  function tirar(m) { m.dead = true; mobs = mobs.filter(o => o !== m); scene.remove(m.model.g); m.lab.remove(); }
  function spawnDe(id) { const si = parseInt(id, 10), s = SPAWNS[si]; return s || null; }
  function criar(o) {
    if (String(o.id).startsWith('dg:')) return MOBDEF[o.type] && typeof dgCriar === 'function' ? dgCriar(o) : null;   // masmorra em grupo
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
    // monstros que o servidor ainda não conhece (lugar novo, versão nova): manda para ele em vez de apagar
    const novos = [];
    for (const [id, m] of loc) if (!vistos.has(id)) { if (m.dg) continue; if (m.dono === undefined || m.dono === null) { m.dono = me(); novos.push(m); } else tirar(m); }
    for (let i = 0; i < novos.length; i += 150) Net.send({ t: 'semente+', l: novos.slice(i, i + 150).map(m => ({ id: m.nid, type: m.type, max: m.maxHp, hp: m.hp, resp: m.d.respawn, x: +m.x.toFixed(2), z: +m.z.toFixed(2) })) });
  }
  function semente() {
    if (!mobs.some(m => m.nid)) { setTimeout(semente, 800); return; }          // os monstros ainda não nasceram neste jogo: espera
    const l = mobs.filter(m => m.nid).map(m => ({ id: m.nid, type: m.type, max: m.maxHp, hp: m.hp, resp: m.d.respawn, x: +m.x.toFixed(2), z: +m.z.toFixed(2), vivo: true }));
    // em partes: a lista inteira passa do tamanho máximo de mensagem do servidor (24 KB) e era jogada fora
    for (let i = 0; i < l.length; i += 150) Net.send({ t: i ? 'semente+' : 'semente', l: l.slice(i, i + 150) });
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
    Net.on('hp', m => { const mb = porId().get(m.id); if (mb) { mb.hp = Math.max(m.hp, 1); if (m.hp > 1) mb.morrendo = 0; if (m.by && m.by !== me()) mb.flash = 0.08; } });
    Net.on('morre', m => {
      if (String(m.id).startsWith('dg:forte:') && typeof Guerra !== 'undefined') Guerra.coracaoCaiu(m);   // 🏰 o Coração da Fortaleza caiu
      const mb = porId().get(m.id); mortos.set(m.id, mb ? mb.type : mortos.get(m.id));
      if (!mb) return;
      mb.danoPor = m.dano || {};                                        // quem bateu (o castelo sorteia a carta do Campeão entre eles)
      const total = Object.values(m.dano || {}).reduce((a, b) => a + b, 0) || 1, parte = Math.min(1, ((m.dano || {})[me()] || 0) / total);
      const gq = m.by !== me() && typeof Grupo !== 'undefined' && Grupo.doGrupo(m.by) && !P.dead && Math.hypot(mb.x - P.x, mb.z - P.z) < Grupo.PERTO ? Grupo.parteDoMatador(mb, m.by) : null;
      const grupo = gq && gq.parte > 0;
      if (m.by === me()) killMob(mb, { parte: Math.max(parte, 0.5) });       // último golpe: itens, coroas e pelo menos metade do XP
      else if (grupo) killMob(mb, { ajuda: gq.parte, grupo: true, n: gq.n, w: gq.w });   // companheiro de grupo perto: a parte dele do XP e conta nas missões
      else if (gq && gq.leech) killMob(mb, { leech: true, lvK: gq.lvK, de: (Net.peers().find(r => r.peer === m.by) || {}).n });   // 🍼 carona: companheiro bem mais forte matou perto
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
    // resposta do "dgver": os monstros que já estavam na Torre/masmorra quando cheguei
    Net.on('dgl', m => { const loc = porId(); for (const o of m.l || []) if (o.vivo === false) dgMortos.add(o.id); else if (!loc.get(o.id)) { const mb = criar(o); if (mb) { mb.dono = o.dono; mb.hp = Math.min(mb.maxHp, o.hp ?? mb.maxHp); } } });
    Net.on('dgfim', m => { for (const mb of mobs.filter(x => x.nid && x.nid.startsWith(m.pref))) tirar(mb); });   // a corrida em grupo acabou
    Net.on('some', m => { const mb = porId().get(m.id); if (mb) { mortos.set(m.id, mb.type); tirar(mb); } });   // o servidor diz que ele já tinha morrido
  }
  // ---------------- o que eu mando
  function dano(m, v) { Net.send({ t: 'd', id: m.nid, v: Math.round(v) }); }
  function cura(m) { if (meu(m)) Net.send({ t: 'cura', id: m.nid, hp: Math.round(m.hp) }); }
  function update(dt) {
    if (!Net.connected || !Net.me) return;
    if ((envT -= dt) > 0) return; envT = Net.economia() ? 0.4 : 0.2;                   // 5x por segundo (Economia de dados: 2,5x)
    const l = [];
    for (const m of mobs) {
      if (!m.nid || !meu(m)) continue;
      const st = (m.moving ? 1 : 0) | ((m.swing || 0) > 0.5 ? 2 : 0) | (m.stun > 0 ? 4 : 0) | (m.evade ? 8 : 0);   // 8 = chefe voltando para casa (imune)
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
    m.stun = ((m.netSt || 0) & 4) ? 0.1 : 0; m.evade = ((m.netSt || 0) & 8) === 8;
  }
  return { dgMortos, init, update, dano, cura, mover, meu };
})();
