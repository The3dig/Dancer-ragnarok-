// =====================================================================
//  PvP no estilo Lineage 2 (só no link com multiplayer).
//  - Bater em outro jogador deixa o seu nome ROSA (combate) por 60 s.
//  - Matar quem estava com nome BRANCO deixa você VERMELHO (PK) por 5 min;
//    o vermelho vai clareando até sumir. Todo mundo recebe o aviso na tela.
//  - Matar quem está rosa ou vermelho não tem penalidade.
//  - PK que morre ainda vermelho DERRUBA TODOS OS ITENS (mochila e
//    equipamento) numa sacola que qualquer jogador pode pegar.
//  - Cidades, Sítio e casa são zonas seguras: ninguém ataca ninguém.
//  Como a sala só tem presença (cada um publica o próprio estado), o golpe
//  vai como "hit" no estado de quem bate e quem apanha aplica o dano.
// =====================================================================
'use strict';
const PvP = (() => {
  const PINK = 60e3, RED = 5 * 60e3;
  const now = () => Date.now();
  const F = () => (P.flag = P.flag || { pink: 0, red: 0 });
  const safe = (x, z) => { const zn = zoneOf(x, z); return (ZONES[zn] && ZONES[zn].town) || zn === 'sitio' || zn === 'casa'; };
  const state = () => F().red > now() ? 'r' : F().pink > now() ? 'p' : 'w';
  // cor do nome: vermelho forte no começo, clareando com o tempo; rosa no combate
  function color(fl, left) {
    if (fl === 'r') { const k = Math.max(0, Math.min(1, left / RED)); const g = Math.round(60 + (1 - k) * 110); return `rgb(255,${g},${g})`; }
    if (fl === 'p') return '#ff8ad8';
    return null;
  }
  let hits = [], seq = 0, killedBy = null, bags = [], given = null, take = null;
  const seen = new Map();                       // último hit aplicado de cada atacante
  const proxies = new Map();

  // ---------------- alvos: jogadores remotos viram "monstros falsos" para mirar
  function proxy(r) {
    let p = proxies.get(r.peer);
    if (!p) { p = { isPeer: true, peer: r.peer, model: { h: 1.8 }, d: { name: '', lv: 1, def: 0, rad: 0 }, dead: false, hp: 1, maxHp: 1, stun: 0 }; proxies.set(r.peer, p); }
    p.x = r.x; p.z = r.z; p.d.name = r.n; p.d.lv = r.s.lv || 1; p.dead = r.s.st === 'd'; p.fl = r.s.fl || 'w';
    return p;
  }
  function targets(range) {
    if (typeof Net === 'undefined' || !Net.peers || safe(P.x, P.z) || P.dead) return [];
    const out = [];
    for (const r of Net.peers()) {
      if (!r.s || r.s.st === 'd' || typeof r.x !== 'number' || safe(r.x, r.z)) continue;
      const fl = r.s.fl || 'w';
      if (fl === 'w' && !P.pvpOn) continue;                       // branco só com o modo PvP ligado
      if (Math.hypot(r.x - P.x, r.z - P.z) > range) continue;
      out.push(proxy(r));
    }
    return out;
  }
  // golpe num jogador: manda o dano bruto; quem apanha desconta a própria defesa
  function hit(t, dmg, crit) {
    if (safe(P.x, P.z) || safe(t.x, t.z)) return 0;
    dmg = Math.max(1, Math.round(dmg * (crit ? 1.8 : 1) * rand(0.9, 1.1)));
    hits.push({ to: t.peer, d: dmg, n: ++seq }); if (hits.length > 8) hits.shift();
    F().pink = Math.max(F().pink, now() + PINK);
    floater(t.x, P.y + 2.2, t.z, dmg, crit ? 'crit' : '');
    Audio8.sfx(crit ? 'crit' : 'hit');
    return dmg;
  }

  // ---------------- o que chega dos outros
  const announced = new Map();
  function update(dt) {
    if (typeof Net === 'undefined' || !Net.peers) return;
    const bt = $('btn-pvp'); if (bt) bt.style.display = Net.connected ? '' : 'none';   // sozinho (link do GitHub) não há PvP
    const me = Net.me;
    for (const r of Net.peers()) {
      const s = r.s || {};
      // golpes em mim
      for (const h of (s.hits || [])) {
        if (h.to !== me || (seen.get(r.peer) || 0) >= h.n) continue;
        seen.set(r.peer, h.n);
        if (P.dead || safe(P.x, P.z)) continue;
        const dmg = Math.max(1, Math.round(h.d - stats.def() * 0.6));
        P.hp -= dmg; P.hurtT = 0.2; P.sit = false;
        floater(P.x, P.y + 2, P.z, dmg, 'hurt'); Audio8.sfx('ouch'); hurtFlash(dmg / stats.maxHp()); breakCast();
        if (P.hp <= 0) { P.hp = 0; P.dead = true; P.deadT = 3; P.combo = 0; diedTo(r, s); }
      }
      // alguém me matou? então eu venci: se a vítima era branca, viro PK
      const kb = s.kb;
      if (kb && kb.by === me && (seen.get('kb:' + r.peer) || 0) < kb.n) {
        seen.set('kb:' + r.peer, kb.n);
        if (kb.fl === 'w') {
          F().red = now() + RED; F().pink = 0; P.pkCount = (P.pkCount || 0) + 1;
          banner('☠️ VOCÊ VIROU PK!'); Audio8.sfx('boom');
          log(`☠️ Você matou <b>${r.n}</b>, que não estava em combate. Seu nome ficou <b style="color:#ff4040">vermelho por 5 minutos</b>. Se morrer assim, derruba <b>todos os itens</b>.`, 'bad');
        } else log(`⚔️ Você derrotou <b>${r.n}</b> em combate (sem penalidade).`, 'gold');
      }
      // aviso de PK no território
      const pkUntil = s.fl === 'r' ? (s.pk || 0) : 0;
      if (pkUntil && announced.get(r.peer) !== pkUntil) {
        announced.set(r.peer, pkUntil);
        const zn = ZONES[zoneOf(r.x, r.z)]; const where = zn ? zn.name : 'no Reino';
        banner(`☠️ Temos um PK em ${where}!`);
        log(`☠️ <b style="color:#ff4040">${r.n}</b> virou PK em <b>${where}</b>. Matar um PK não dá penalidade.`, 'bad');
        Audio8.sfx('boom');
      }
      // sacolas de PK que outros derrubaram
      if (take && take.peer === r.peer && s.given && s.given.id === take.id && s.given.to === me) {
        for (const [id, n] of Object.entries(take.items)) if (ITEMS[id]) P.inv[id] = (P.inv[id] || 0) + n;
        log(`🎒 Você pegou a sacola de <b>${r.n}</b>!`, 'gold'); Audio8.sfx('level'); buildHotbar(); take = null;
      }
      // alguém quer pegar a minha sacola: a primeira pedida leva
      if (s.take && bags.some(b => b.id === s.take.id) && (!given || given.id !== s.take.id)) {
        given = { id: s.take.id, to: r.peer }; bags = bags.filter(b => b.id !== s.take.id); drawBags();
      }
    }
    // pegar sacola de PK no chão (minha ou de outro)
    if (!P.dead) {
      for (const b of bags) if (Math.hypot(b.x - P.x, b.z - P.z) < 2) {
        for (const [id, n] of Object.entries(b.items)) if (ITEMS[id]) P.inv[id] = (P.inv[id] || 0) + n;
        bags = bags.filter(o => o !== b); drawBags(); buildHotbar(); log('🎒 Você recuperou a sua sacola.', 'gold'); break;
      }
      if (!take) for (const r of Net.peers()) for (const b of ((r.s && r.s.bags) || [])) if (Math.hypot(b.x - P.x, b.z - P.z) < 2) { take = { peer: r.peer, id: b.id, items: b.items }; break; }
    }
    drawRemoteBags();
    // meu nome
    const fl = state(), c = color(fl, F().red - now());
    const pn = $('pname').querySelector('span');
    if (pn) pn.style.color = c || pn.dataset.c || '';
  }
  function diedTo(r, s) {
    killedBy = { by: r.peer, n: ++seq, fl: state() };
    log(`💀 Você foi derrotado por <b>${r.n}</b>.`, 'bad');
    if (state() === 'r') {                                         // PK morto: derruba tudo
      const items = {};
      for (const id of Object.keys(P.inv)) if (P.inv[id] > 0 && ITEMS[id]) { items[id] = P.inv[id]; P.inv[id] = 0; }
      for (const sl of Object.keys(P.equip || {})) { const id = P.equip[sl]; if (id) { items[id] = (items[id] || 0) + 1; P.equip[sl] = null; } }
      F().red = 0; F().pink = 0;
      if (Object.keys(items).length) { bags.push({ id: 'b' + now(), x: +P.x.toFixed(1), z: +P.z.toFixed(1), items }); while (bags.length > 2) bags.shift(); drawBags(); }
      banner('☠️ Você morreu como PK e derrubou tudo!'); log('☠️ Morreu ainda vermelho: <b>todos os seus itens</b> caíram numa sacola que qualquer um pode pegar!', 'bad');
      buildHotbar(); P.pvpDeath = true;
    } else P.pvpDeath = true;
  }
  // ---------------- sacolas de PK (visíveis para todos)
  let bagObjs = [], remoteBagObjs = new Map();
  const sackM = () => PM('palha.jpg', [2, 2], new THREE.Color(1.1, 0.5, 0.5));
  function sackAt(x, z) {
    const g = new THREE.Group(); g.position.set(x, groundY(x, z), z);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), sackM()); s.scale.set(1, 0.85, 1); s.position.y = 0.5; g.add(s);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 7, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false })); beam.position.y = 3.5; g.add(beam);
    scene.add(g); return g;
  }
  function drawBags() { bagObjs.forEach(o => scene.remove(o)); bagObjs = bags.map(b => sackAt(b.x, b.z)); }
  function drawRemoteBags() {
    if (typeof Net === 'undefined') return;
    const want = new Set();
    for (const r of Net.peers()) for (const b of ((r.s && r.s.bags) || [])) { const k = r.peer + b.id; want.add(k); if (!remoteBagObjs.has(k)) remoteBagObjs.set(k, sackAt(b.x, b.z)); }
    for (const [k, o] of remoteBagObjs) if (!want.has(k)) { scene.remove(o); remoteBagObjs.delete(k); }
  }
  // ---------------- o que eu publico
  function pres() {
    const fl = state();
    return { fl, pk: fl === 'r' ? F().red : 0, hits: hits.length ? hits : null, kb: killedBy, bags: bags.length ? bags : null, given, take: take ? { id: take.id } : null };
  }
  // ---------------- botão do modo PvP
  function init() {
    if ($('btn-pvp')) return;
    const b = document.createElement('button'); b.id = 'btn-pvp'; b.title = 'Modo PvP'; b.textContent = '🗡️';
    b.onclick = () => { P.pvpOn = !P.pvpOn; b.classList.toggle('on', P.pvpOn); Audio8.sfx('click'); log(P.pvpOn ? '🗡️ <b>Modo PvP ligado</b>: seus ataques podem acertar jogadores fora das cidades. Matar quem não está em combate deixa você <b style="color:#ff4040">vermelho (PK)</b>.' : '🗡️ Modo PvP desligado: você só ataca jogadores rosa ou vermelhos.', P.pvpOn ? 'bad' : 'sys'); };
    $('menu').insertBefore(b, $('btn-help')); b.classList.toggle('on', !!P.pvpOn);
  }
  return { init, update, targets, hit, pres, state, color, get connected() { return typeof Net !== 'undefined' && Net.connected; } };
})();
