// =====================================================================
//  O Verme Colossal: o chefe do Fundo do Abismo do Cisma (o contrário da
//  Torre: lá em cima dorme o Kravenox; aqui embaixo, o Verme).
//  - Acorda de 15 em 15 dias, no domingo às 20h, e fica 2 horas acordado.
//  - O Fundo tem 8 buracos. Ele sai de um, ataca e mergulha; a terra treme
//    (círculo vermelho) no buraco por onde vai sair de novo. Debaixo da terra
//    ele é imune: corra até o próximo buraco.
//  - A vida é a mesma para todos (o dano de cada um vai na presença, igual
//    ao Kravenox). Só ganha o prêmio quem causou pelo menos MIN_DANO.
// =====================================================================
'use strict';
const Verme = (() => {
  const REF = new Date(2026, 10, 22, 20, 0, 0).getTime();   // primeiro despertar: domingo, 22/11/2026, 20h
  const CICLO = 14 * 864e5, JANELA = 2 * 3600e3, MIN_DANO = 3000, VIDA = 900000;
  const forced = () => /verme/i.test(location.hash);
  const ciclo = (t = Date.now()) => Math.floor((t - REF) / CICLO);
  const inicio = c => REF + c * CICLO;
  const acordado = (t = Date.now()) => forced() || (t >= REF && t - inicio(ciclo(t)) < JANELA);
  function proximo(t = Date.now()) { let c = ciclo(t); if (t >= inicio(c)) c++; return inicio(c < 0 ? 0 : c); }
  const cicloId = () => forced() ? 'teste' : String(ciclo());
  const fmtData = ms => new Date(ms).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  const fundo = () => FL(AB_FUNDO);
  const naArena = () => inTower(P.z) && Tower.floor === AB_FUNDO;

  // ---------------- os 8 buracos do Fundo
  const BUR = [{ x: 0, z: 0 }, ...Array.from({ length: 7 }, (_, k) => ({ x: Math.sin(k / 7 * TAU) * 17, z: Math.cos(k / 7 * TAU) * 17 }))];
  let buracos = null;
  function construirBuracos() {
    const F = fundo(), g = new THREE.Group(); g.position.set(F.x, F.y + 0.05, F.z); scene.add(g);
    const preto = new THREE.MeshBasicMaterial({ color: 0x050203 }), rocha = new THREE.MeshLambertMaterial({ color: 0x2a1a16, flatShading: true });
    for (const b of BUR) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(3.3, 28).rotateX(-Math.PI / 2), preto); d.position.set(b.x, 0.02, b.z); g.add(d);
      const t = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.6, 6, 22).rotateX(Math.PI / 2), rocha); t.position.set(b.x, 0.1, b.z); t.scale.y = 0.6; g.add(t);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + b.x, p = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.5, 1.1), 0), rocha); p.position.set(b.x + Math.sin(a) * 4.3, 0.3, b.z + Math.cos(a) * 4.3); p.rotation.set(rand(0, 3), rand(0, 3), 0); g.add(p); }
    }
    buracos = g;
  }

  // ---------------- o desenho: um verme enorme saindo da terra (anéis, placas, boca redonda cheia de dentes)
  function modelo(r, mt) {
    const g = r.g, b = new THREE.Group(); g.add(b); r.b = b;
    const glow = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
    const segs = [], N = 12;
    for (let i = 0; i < N; i++) {
      const rr = 2.1 - i * 0.06, s = new THREE.Group(); s.position.y = i * 1.25; b.add(s); segs.push(s);
      mesh(new THREE.SphereGeometry(rr, 16, 12), mt(i % 2 ? 0x5a2a22 : 0x4a201a), 0, 0, 0, s).scale.set(1, 0.75, 1);
      mesh(new THREE.TorusGeometry(rr * 0.98, 0.16, 6, 22), mt(0x2a120e), 0, 0, 0, s).rotation.x = Math.PI / 2;
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + i, sp = mesh(new THREE.ConeGeometry(0.22, 0.9, 5), mt(0xd8c8a8), Math.sin(a) * rr, 0.2, Math.cos(a) * rr, s); sp.rotation.x = Math.cos(a) * 1.3; sp.rotation.z = -Math.sin(a) * 1.3; }
    }
    const head = new THREE.Group(); head.position.y = N * 1.25 + 0.6; b.add(head); r.head = head;
    mesh(new THREE.SphereGeometry(2.3, 18, 14), mt(0x5a2a22), 0, 0, 0, head).scale.set(1, 0.9, 1);
    const boca = new THREE.Group(); boca.position.set(0, 0.2, 1.8); head.add(boca);
    mesh(new THREE.CircleGeometry(1.5, 24), glow(0xff3010), 0, 0, 0.12, boca);
    mesh(new THREE.TorusGeometry(1.6, 0.35, 8, 24), mt(0x3a100c), 0, 0, 0, boca);
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, d = mesh(new THREE.ConeGeometry(0.16, 0.8, 5), mt(0xf0e6d0), Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0.25, boca); d.rotation.z = a + Math.PI / 2; d.rotation.x = 0.4; }
    for (const [x, y] of [[-1.2, 1.3], [1.2, 1.3], [-0.6, 1.8], [0.6, 1.8]]) mesh(new THREE.SphereGeometry(0.2, 8, 6), glow(0xffd040), x, y, 1.6, head);
    for (const sd of [-1, 1]) { const mand = mesh(new THREE.ConeGeometry(0.35, 2.6, 6), mt(0x2a120e), sd * 1.9, -0.6, 1.6, head); mand.rotation.x = 1.4; mand.rotation.z = sd * 0.5; }
    r.anim = (m, t) => {
      const sobe = m.sobe ?? 1; b.position.y = -(N * 1.25 + 4) * (1 - sobe);
      segs.forEach((s, i) => { s.position.x = Math.sin(t * 1.6 + i * 0.45) * i * 0.07; s.position.z = Math.cos(t * 1.2 + i * 0.4) * i * 0.04; });
      head.position.x = Math.sin(t * 1.6 + N * 0.45) * N * 0.07; head.rotation.x = 0.35 + (m.swing || 0) * 0.8;
    };
    r.h = N * 1.25 + 3; g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return r;
  }

  // ---------------- círculos de aviso (a terra treme, o ácido cai)
  const circGeo = new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), anelGeo = new THREE.RingGeometry(0.94, 1, 40).rotateX(-Math.PI / 2);
  let avisos = [];
  function aviso(x, z, r, t, mult, cor = 0xff3010) {
    const y = groundY(x, z) + 0.12;
    const fill = new THREE.Mesh(circGeo, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.12, depthWrite: false })); fill.position.set(x, y, z); fill.scale.set(0.01, 1, 0.01);
    const edge = new THREE.Mesh(anelGeo, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9, depthWrite: false })); edge.position.set(x, y + 0.01, z); edge.scale.set(r, 1, r);
    scene.add(fill, edge); avisos.push({ x, z, r, t, max: t, mult, fill, edge });
  }
  function tickAvisos(dt) {
    for (const a of avisos) {
      a.t -= dt; const k = 1 - a.t / a.max; a.fill.scale.set(a.r * k, 1, a.r * k); a.fill.material.opacity = 0.12 + k * 0.35;
      if (a.t <= 0) {
        a.fim = true; scene.remove(a.fill, a.edge);
        burst(new THREE.Vector3(a.x, groundY(a.x, a.z) + 0.5, a.z), 0xff6020, 24, a.r * 1.4, 0.8); ring(a.x, a.z, a.r, 0xff6020, 0.5);
        if (naArena()) Audio8.sfx('boom');
        if (boss && naArena() && Math.hypot(P.x - a.x, P.z - a.z) < a.r) hurtPlayer(boss, a.mult);
      }
    }
    avisos = avisos.filter(a => !a.fim);
  }
  function limparAvisos() { for (const a of avisos) scene.remove(a.fill, a.edge); avisos = []; }

  // ---------------- a IA: sai, ataca, mergulha, a terra treme, sai em outro buraco
  let boss = null, checkT = 0, ultimoAviso = '';
  function alvoPerto(m) { let best = null, bd = 1e9; const lista = [{ x: P.x, z: P.z, eu: true }, ...((typeof Net !== 'undefined' && Net.peers) ? Net.peers().filter(r => inTower(r.z) && Math.hypot(r.x - fundo().x, r.z - fundo().z) < 45) : [])]; for (const o of lista) { const d = Math.hypot(o.x - m.x, o.z - m.z); if (d < bd) { bd = d; best = o; } } return best; }
  function ai(m, dt) {
    const F = fundo(); m.atkCd = 9;                                      // nada do ataque comum: só os golpes daqui
    m.est = m.est || 'sobe'; m.estT = (m.estT ?? 1.4) - dt;
    const furioso = m.hp < m.maxHp * 0.4;
    if (m.est === 'sobe') { m.invul = true; m.sobe = Math.min(1, (m.sobe || 0) + dt / 1.2); if (m.estT <= 0) { m.est = 'luta'; m.estT = furioso ? 7 : 9; m.golpeT = 1; m.invul = false; m.sobe = 1; } }
    else if (m.est === 'luta') {
      const a = alvoPerto(m); if (a) m.face = Math.atan2(a.x - m.x, a.z - m.z);
      if ((m.golpeT -= dt) <= 0 && a) {
        m.golpeT = furioso ? 1.6 : 2.3; m.swing = 1;
        const tipo = Math.random();
        if (tipo < 0.45) { const d = Math.min(9, Math.hypot(a.x - m.x, a.z - m.z)); aviso(m.x + Math.sin(m.face) * d, m.z + Math.cos(m.face) * d, 6, 1.3, 2.4); }        // mordida
        else if (tipo < 0.8) { for (let k = 0; k < (furioso ? 5 : 3); k++) aviso(a.x + rand(-5, 5), a.z + rand(-5, 5), 3.6, 1.6 + k * 0.15, 1.4, 0x60ff30); }   // cuspe de ácido
        else aviso(m.x, m.z, 11, 1.8, 2.0);                                                                                                   // tremor em volta do buraco
      }
      if (m.estT <= 0) { m.est = 'desce'; m.estT = 1; m.invul = true; if (naArena()) log('🐛 O Verme mergulhou! Olhe a terra tremendo: ele vai sair <b>no círculo vermelho</b>.', 'sys'); }
    } else if (m.est === 'desce') { m.sobe = Math.max(0, (m.sobe || 1) - dt / 0.9); if (m.estT <= 0) {
        const a = alvoPerto(m), opc = BUR.map(b => ({ x: F.x + b.x, z: F.z + b.z })).filter(b => Math.hypot(b.x - m.x, b.z - m.z) > 4);
        const prox = a && Math.random() < 0.6 ? opc.sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z))[0] : opc[irand(0, opc.length - 1)];
        m.prox = prox; m.est = 'viaja'; m.estT = furioso ? 1.4 : 1.9; aviso(prox.x, prox.z, 7, m.estT, 2.6);
      } }
    else if (m.est === 'viaja') { m.sobe = 0; if (m.estT <= 0) { m.x = m.tx = m.prox.x; m.z = m.tz = m.prox.z; m.est = 'sobe'; m.estT = 1.2; if (naArena()) { Audio8.sfx('boom'); burst(new THREE.Vector3(m.x, groundY(m.x, m.z) + 1, m.z), 0x8a5a3a, 40, 6, 1); } } }
    m.moving = false;
  }

  // ---------------- vida compartilhada
  function addDmg(d) { const w = cicloId(); if (!P.vermeDmg || P.vermeDmg.w !== w) P.vermeDmg = { w, d: 0 }; P.vermeDmg.d += d; }
  const meuDano = () => P.vermeDmg && P.vermeDmg.w === cicloId() ? P.vermeDmg.d : 0;
  function danoOutros() { let t = 0; if (typeof Net === 'undefined' || !Net.peers) return 0; for (const r of Net.peers()) { const v = r.s && r.s.vd; if (v && v.w === cicloId() && typeof v.d === 'number') t += Math.max(0, Math.min(5e6, v.d)); } return t; }
  const pres = () => ({ vd: P.vermeDmg && P.vermeDmg.w === cicloId() ? P.vermeDmg : null });
  const mortoNesteCiclo = () => P.vermeCiclo === cicloId() || (VIDA - meuDano() - danoOutros() <= 0);

  function acordar() {
    const F = fundo(), b0 = BUR[irand(1, BUR.length - 1)];
    boss = spawnMob('vermeColosso', null, { x: F.x + b0.x, z: F.z + b0.z });
    boss.noRespawn = true; boss.hp = boss.maxHp = VIDA; boss.est = 'viaja'; boss.estT = 2.5; boss.prox = { x: boss.x, z: boss.z }; boss.sobe = 0; boss.invul = true;
    aviso(boss.x, boss.z, 7, 2.5, 2.6);
    banner('🐛 O VERME COLOSSAL ACORDOU 🐛'); Audio8.sfx('boom'); setTimeout(() => Audio8.sfx('boom'), 350);
    log('🐛 <b style="color:#ff7a40">O VERME COLOSSAL ACORDOU</b> no Fundo do Abismo! Ele sai de um buraco, ataca e mergulha: corra até o <b>círculo vermelho</b>, onde a terra treme.', 'bad');
  }
  function sumir() { if (boss) { mobs = mobs.filter(o => o !== boss); scene.remove(boss.model.g); boss.lab.remove(); } boss = null; limparAvisos(); }
  function onKill(m) {
    boss = null; limparAvisos();
    if (meuDano() < MIN_DANO && !forced()) { banner('🐛 O VERME COLOSSAL CAIU'); log(`🐛 O Verme Colossal caiu, mas você não lutou o bastante para o prêmio (pelo menos ${MIN_DANO.toLocaleString('pt-BR')} de dano).`, 'sys'); P.vermeCiclo = cicloId(); return; }
    P.vermeCiclo = cicloId(); P.vermeKills = (P.vermeKills || 0) + 1;
    banner('🏆 O VERME COLOSSAL FOI DERROTADO! 🏆'); Audio8.sfx('level');
    const MIT = ['lamina_verme', 'anel_ninho', 'couraca_verme'], id = MIT[irand(0, MIT.length - 1)];
    P.inv[id] = (P.inv[id] || 0) + 1; P.inv.quitina_colossal = (P.inv.quitina_colossal || 0) + 3; P.inv.presa_verme = (P.inv.presa_verme || 0) + 10; P.zeny += 50000;
    P.title = 'Matador do Verme'; $('pname').innerHTML = `${P.name}<small>« ${P.title} »</small>`;
    log(`🏆 <b>O VERME COLOSSAL FOI DERROTADO!</b> Você recebeu <b>${ITEMS[id].ic} ${ITEMS[id].name}</b>, 3 Quitinas Colossais, 10 Presas do Abismo e <b>50.000 cr</b>. Título: « Matador do Verme ». Vitórias: ${P.vermeKills}.`, 'gold');
    log(`🐛 Ele volta a acordar em 15 dias: <b>${fmtData(proximo())}, às 20h</b>.`, 'sys');
    for (let i = 0; i < 16; i++) drops.push(makeDrop('zeny', irand(800, 1600), m.x + rand(-7, 7), m.z + rand(-7, 7)));
    for (let i = 0; i < 6; i++) setTimeout(() => ring(m.x, m.z, 4 + i * 3, [0xffcf40, 0xff6020][i % 2], 0.8), i * 200);
    save();
  }
  function msgFundo() {
    if (acordado() && !mortoNesteCiclo()) return '🐛 <b>O Verme Colossal está acordado!</b> Ele sai de um dos 8 buracos, ataca e mergulha. Debaixo da terra ele é imune: corra até o círculo vermelho.';
    return `💤 O Verme Colossal dorme sob o Fundo. Ele acorda <b>de 15 em 15 dias, no domingo às 20h</b> (fica 2 horas acordado). Próximo: <b>${fmtData(proximo())}, às 20h</b>.`;
  }
  function update(dt) {
    const aqui = naArena();
    if (aqui && !buracos) construirBuracos();
    if (buracos) buracos.visible = aqui;
    if ((checkT -= dt) <= 0) {
      checkT = 1;
      const deve = aqui && acordado() && !mortoNesteCiclo();
      if (deve && !boss) acordar();
      if (!deve && boss && !boss.dead) { const venceram = mortoNesteCiclo(); sumir(); if (aqui && venceram) log('🏆 Outro grupo derrubou o Verme Colossal neste ciclo.', 'sys'); else if (aqui) log('🌑 O Verme Colossal voltou a dormir. Só daqui a 15 dias.', 'sys'); }
      const txt = acordado() && !mortoNesteCiclo() ? 'acordado' : '';
      if (txt !== ultimoAviso) { ultimoAviso = txt; if (txt && !aqui) log('🐛 <b>O Verme Colossal acordou</b> no Fundo do Abismo do Cisma (pela Cratera, perto de Solmira)! Fica acordado até as 22h.', 'gold'); }
    }
    if (boss && boss.dead) boss = null;
    if (boss) {
      boss.hp = Math.min(boss.maxHp, VIDA - meuDano() - danoOutros());
      if (boss.hp <= 0 && !boss.dead) { boss.hp = 0; killMob(boss, meuDano() >= MIN_DANO || forced() ? {} : { semPremio: true }); if (meuDano() < MIN_DANO && !forced()) onKill(boss); }
    }
    tickAvisos(dt);
  }
  return { modelo, ai, update, addDmg, onKill, pres, msgFundo, acordado, proximo, get ativo() { return !!boss; } };
})();
