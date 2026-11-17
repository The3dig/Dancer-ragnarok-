// =====================================================================
//  Mascotes (ideia do Ludi, no jeito do Ragnarok)
//  - Todo monstro do jogo pode virar mascote. Cada um deixa cair a sua
//    própria ISCA DE CAPTURA (bem rara). Use a isca perto de um monstro
//    daquele tipo: quanto menos vida ele tiver, maior a chance.
//  - Cada mascote dá um atributo. Você escolhe UM para andar com você
//    (o bônus só vale para o que está junto).
//  - Os outros ficam no Quintal dos Mascotes, no seu Sítio.
// =====================================================================
'use strict';
const Mascotes = (() => {
  const FORA = ['kravenox', 'vermeColosso'];                                     // os chefes do mundo não viram mascote
  const tipos = () => Object.keys(MOBDEF).filter(t => !t.startsWith('alfa_') && !FORA.includes(t));
  const KEYS = ['pow', 'def', 'hp', 'sp', 'crit', 'spd'];
  const NOME = { pow: 'Dano', def: 'Defesa', hp: 'HP', sp: 'SP', crit: 'Crítico', spd: 'Velocidade' };
  const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  // o atributo de cada mascote (sempre o mesmo para o mesmo monstro) e o tamanho do bônus pelo nível dele
  function bonusDe(t) {
    const D = MOBDEF[t]; if (!D) return null;
    const k = KEYS[hash(t) % KEYS.length], lv = D.lv || 1, f = D.boss ? 2 : 1;
    const v = { pow: 1 + lv * 0.15, def: 1 + lv * 0.12, hp: 10 + lv * 4, sp: 5 + lv * 2, crit: 0.005 + lv * 0.0003, spd: 0.01 + lv * 0.0004 }[k] * f;
    return { k, v: ['crit', 'spd'].includes(k) ? Math.round(v * 1000) / 1000 : Math.round(v) };
  }
  const txtBonus = b => b ? `${NOME[b.k]} +${['crit', 'spd'].includes(b.k) ? (b.v * 100).toFixed(1).replace('.0', '') + '%' : b.v}` : '';
  const S = () => (P.pets = P.pets || {});

  // ---------------- iscas: um item por monstro, que cai dele mesmo
  for (const t of tipos()) {
    const D = MOBDEF[t];
    ITEMS['isca_' + t] = { name: `Isca de ${D.name}`, ic: '🪤', kind: 'isca', use: 'isca', price: 0, sell: 50 + (D.lv || 1) * 20, desc: `Use perto de um(a) ${D.name} para tentar capturar. Quanto menos vida ele tiver, maior a chance.` };
    D.drops.push(['isca_' + t, D.boss || D.mini ? 0.08 : D.field ? 0.05 : 0.01]);
  }

  // ---------------- capturar
  let capturando = null;
  function capturar(id) {
    const t = id.slice(5), D = MOBDEF[t]; if (!D || !(P.inv[id] > 0)) return;
    if (S()[t]) { log(`🐾 Você já tem o mascote <b>${D.name}</b>. Guarde a isca para um amigo (pode trocar).`, 'sys'); return; }
    if (capturando) return;
    let m = null, bd = 7;
    for (const o of mobs) if (o.type === t && !o.dead && !o.invul) { const d = Math.hypot(o.x - P.x, o.z - P.z); if (d < bd) { bd = d; m = o; } }
    if (!m) { log(`🪤 Chegue perto de um(a) <b>${D.name}</b> (até 7 m) para usar a isca.`, 'bad'); return; }
    P.inv[id]--; Audio8.sfx('skill');
    const vida = Math.max(0, m.hp / m.maxHp), chance = Math.min(0.95, (D.boss || D.mini ? 0.04 : 0.12) + (D.boss || D.mini ? 0.3 : 0.6) * (1 - vida));
    capturando = { m, t, chance, at: time };
    log(`🪤 Você jogou a isca no(a) <b>${D.name}</b>... (chance ${Math.round(chance * 100)}%: quanto menos vida ele tiver, maior)`, 'sys');
    for (let i = 0; i < 3; i++) setTimeout(() => ring(m.x, m.z, 1.5 + i, 0xffd060, 0.5), i * 250);
  }
  function terminarCaptura() {
    const { m, t, chance } = capturando; capturando = null; const D = MOBDEF[t];
    if (m.dead) { log('🪤 Ele morreu antes da isca fazer efeito.', 'bad'); return; }
    if (Math.random() >= chance) { log(`🪤 O(a) <b>${D.name}</b> escapou da isca! Tente com ele mais fraco.`, 'bad'); Audio8.sfx('miss'); m.state = 'chase'; return; }
    S()[t] = { at: Date.now() };
    m.capturado = true;
    if (m.nid && typeof Net !== 'undefined' && Net.connected) Net.send({ t: 'd', id: m.nid, v: 1e6 });   // some do mundo para todos (sem prêmio)
    killMob(m, { semPremio: true });
    banner('🐾 MASCOTE CAPTURADO! 🐾'); Audio8.sfx('level'); burst(new THREE.Vector3(m.x, groundY(m.x, m.z) + 1, m.z), 0xffd060, 40, 4, 1);
    log(`🐾 Você capturou <b>${D.name}</b>! Mascote: <b>${txtBonus(bonusDe(t))}</b>. Ele foi para o <b>Quintal dos Mascotes</b> no seu Sítio${!P.petAtivo ? ' e já está andando com você' : ''}.`, 'gold');
    if (!P.petAtivo) escolher(t, true);
    if (typeof save === 'function') save();
  }

  // ---------------- bônus do mascote que está junto
  function bonus(k) { const b = P.petAtivo && S()[P.petAtivo] ? bonusDe(P.petAtivo) : null; return b && b.k === k ? b.v : 0; }

  // ---------------- o mascote que anda com você (o próprio monstro, pequeno)
  let seg = null;
  function montarSeg() {
    if (seg) { scene.remove(seg.g); seg = null; }
    const t = P.petAtivo; if (!t || !S()[t] || !MOBDEF[t]) return;
    try {
      const r = mobModel(t), esc = Math.min(0.55, 1.1 / Math.max(1, (r.h || 1.5))), g = new THREE.Group(); g.add(r.g); r.g.scale.multiplyScalar(MOBDEF[t].boss ? esc * 0.6 : esc); scene.add(g);
      seg = { g, r, t, x: P.x - 1.5, z: P.z - 1.5, face: 0, fake: { type: t, d: MOBDEF[t], seed: 1, swing: 0, moving: false, face: 0, hp: 1, maxHp: 1, model: r, state: 'idle', x: 0, z: 0 } };
    } catch (e) { seg = null; }
  }
  function escolher(t, quieto) {
    P.petAtivo = t; montarSeg();
    if (!quieto) { const D = MOBDEF[t]; log(`🐾 <b>${D.name}</b> agora anda com você: <b>${txtBonus(bonusDe(t))}</b>.`, 'gold'); }
    if (typeof updateHUD === 'function') try { updateHUD(); } catch (e) { }
  }
  function guardarTodos() { P.petAtivo = null; montarSeg(); log('🐾 Todos os mascotes ficaram no quintal.', 'sys'); }

  // ---------------- o Quintal dos Mascotes (no Sítio: só você vê)
  const Q = { x0: FARM.x + 8, x1: FARM.x + 19, z0: FARM.z + 5, z1: FARM.z + 15 };
  const PLACA = { x: Q.x0 - 0.6, z: Q.z0 - 1.2 };
  let quintal = null, moradores = [];
  function montarQuintal() {
    const g = new THREE.Group(); scene.add(g); quintal = g;
    const madeira = new THREE.MeshLambertMaterial({ color: 0x8a6238 }), y = (x, z) => groundY(x, z);
    const poste = (x, z) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.2, 6), madeira); p.position.set(x, y(x, z) + 0.6, z); g.add(p); };
    const trave = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, L), madeira); b.position.set((x0 + x1) / 2, y((x0 + x1) / 2, (z0 + z1) / 2) + 0.75, (z0 + z1) / 2); b.rotation.y = Math.atan2(x1 - x0, z1 - z0); g.add(b); };
    const lado = (x0, z0, x1, z1, porteira) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 2);
      for (let i = 0; i <= n; i++) { const k = i / n; if (porteira && k > 0.4 && k < 0.6) continue; poste(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k); }
      if (porteira) { trave(x0, z0, x0 + (x1 - x0) * 0.4, z0 + (z1 - z0) * 0.4); trave(x0 + (x1 - x0) * 0.6, z0 + (z1 - z0) * 0.6, x1, z1); } else trave(x0, z0, x1, z1); };
    lado(Q.x0, Q.z0, Q.x1, Q.z0, true); lado(Q.x1, Q.z0, Q.x1, Q.z1); lado(Q.x1, Q.z1, Q.x0, Q.z1); lado(Q.x0, Q.z1, Q.x0, Q.z0);
    // placa
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d'); x.fillStyle = '#6a4a2a'; x.fillRect(0, 0, 256, 96); x.strokeStyle = '#3a2410'; x.lineWidth = 6; x.strokeRect(3, 3, 250, 90);
    x.fillStyle = '#ffe9a8'; x.font = 'bold 30px Georgia'; x.textAlign = 'center'; x.fillText('🐾 Quintal dos', 128, 42); x.fillText('Mascotes', 128, 80);
    const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding;
    const pl = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx })); pl.position.set(PLACA.x, y(PLACA.x, PLACA.z) + 1.6, PLACA.z); pl.scale.set(1.9, 0.72, 1); g.add(pl);   // placa que se lê de qualquer lado
    poste(PLACA.x - 0.7, PLACA.z); poste(PLACA.x + 0.7, PLACA.z);
    // casinhas e cocho
    for (const [hx, hz] of [[Q.x1 - 1.8, Q.z1 - 1.8], [Q.x0 + 1.8, Q.z1 - 1.8]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 1.2), madeira); b.position.set(hx, y(hx, hz) + 0.5, hz); g.add(b);
      const tl = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.8, 4), new THREE.MeshLambertMaterial({ color: 0xa0402a })); tl.position.set(hx, y(hx, hz) + 1.4, hz); tl.rotation.y = Math.PI / 4; g.add(tl); }
  }
  function montarMoradores() {
    for (const o of moradores) scene.remove(o.g); moradores = [];
    const lista = Object.keys(S()).filter(t => t !== P.petAtivo && MOBDEF[t]).slice(0, 14);
    for (const t of lista) {
      try {
        const r = mobModel(t), esc = Math.min(0.6, 1.2 / Math.max(1, (r.h || 1.5))); r.g.scale.multiplyScalar(MOBDEF[t].boss ? esc * 0.6 : esc);
        const g = new THREE.Group(); g.add(r.g); scene.add(g);
        const o = { g, r, t, x: rand(Q.x0 + 1.5, Q.x1 - 1.5), z: rand(Q.z0 + 1.5, Q.z1 - 1.5), tx: 0, tz: 0, wait: rand(0, 3), face: rand(0, TAU), fake: { type: t, d: MOBDEF[t], seed: rand(0, 9), swing: 0, moving: false, face: 0, hp: 1, maxHp: 1, model: r, state: 'idle' } };
        o.tx = o.x; o.tz = o.z; moradores.push(o);
      } catch (e) { }
    }
  }
  function mexer(o, dt, alvoX, alvoZ, longe) {
    const dx = alvoX - o.x, dz = alvoZ - o.z, d = Math.hypot(dx, dz), anda = d > (longe || 0.4);
    if (anda) { const v = Math.min(d, dt * (d > 6 ? 9 : 3.2)); o.x += dx / d * v; o.z += dz / d * v; o.face = Math.atan2(dx, dz); }
    o.g.position.set(o.x, groundY(o.x, o.z), o.z); o.g.rotation.y = o.face;
    o.fake.moving = anda; o.fake.face = o.face; o.fake.x = o.x; o.fake.z = o.z;
    try { if (o.r.anim) o.r.anim(o.fake, time); if (o.r.spr) o.r.spr.update(dt, { face: o.face, moving: anda }); if (o.r.inst) o.r.inst.update(dt); } catch (e) { }
  }

  // ---------------- escolher no quintal
  function painel() {
    const meus = Object.keys(S()).filter(t => MOBDEF[t]);
    const opts = meus.map(t => ({ label: `${P.petAtivo === t ? '✅' : '🐾'} ${MOBDEF[t].name} — ${txtBonus(bonusDe(t))}${P.petAtivo === t ? ' (com você)' : ''}`, fn: () => { escolher(t); montarMoradores(); } }));
    if (P.petAtivo) opts.push({ label: '🏡 Deixar todos no quintal', fn: () => { guardarTodos(); montarMoradores(); } });
    opts.push({ label: 'Fechar' });
    dialog('🐾 Quintal dos Mascotes', `${meus.length ? `Você tem <b>${meus.length}</b> mascote(s). Escolha <b>um</b> para andar com você: o bônus só vale para o que está junto.` : 'Você ainda não tem mascotes.'}<br><small>Todo monstro do jogo vira mascote. Cada um deixa cair a sua <b>🪤 Isca</b> (rara). Use a isca (mochila → Usáveis) perto de um monstro daquele tipo: quanto menos vida ele tiver, maior a chance. Chefes são bem mais difíceis.</small>`, opts);
  }
  function nearest() { return running && !inTower(P.z) && Math.hypot(P.x - PLACA.x, P.z - PLACA.z) < 3 ? { label: 'Quintal dos Mascotes', fn: painel } : null; }

  let iniciado = false;
  function update(dt) {
    if (!running) return;
    if (!iniciado) { iniciado = true; montarQuintal(); montarSeg(); montarMoradores(); }
    const chave = Object.keys(S()).join() + '|' + P.petAtivo; if (chave !== update.chave) { update.chave = chave; montarMoradores(); }
    if (capturando && time - capturando.at > 1.2) terminarCaptura();
    const noSitio = !inTower(P.z) && Math.hypot(P.x - FARM.x, P.z - FARM.z) < 60;
    if (quintal) quintal.visible = noSitio;
    for (const o of moradores) {
      o.g.visible = noSitio; if (!noSitio) continue;
      if ((o.wait -= dt) <= 0 && Math.hypot(o.tx - o.x, o.tz - o.z) < 0.5) { o.tx = rand(Q.x0 + 1.2, Q.x1 - 1.2); o.tz = rand(Q.z0 + 1.2, Q.z1 - 1.2); o.wait = rand(2, 5); }
      mexer(o, dt, o.tx, o.tz);
    }
    if (seg) {
      if (seg.t !== P.petAtivo) montarSeg();
      if (seg) {
        const tx = P.x - Math.sin(P.face) * 1.8 + Math.cos(P.face) * 0.9, tz = P.z - Math.cos(P.face) * 1.8 - Math.sin(P.face) * 0.9;
        if (Math.hypot(tx - seg.x, tz - seg.z) > 25) { seg.x = tx; seg.z = tz; }
        mexer(seg, dt, tx, tz, 0.6); seg.g.visible = !P.dead;
        if (inTower(P.z)) seg.g.position.y = P.y;
      }
    } else if (P.petAtivo && S()[P.petAtivo]) montarSeg();
  }
  return { capturar, bonus, update, nearest, painel, bonusDe, txtBonus };
})();
