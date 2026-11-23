// =====================================================================
//  ⚡ Eventos surpresa (ideia do Rone: o mundo não ficar sempre igual).
//  Toda hora cheia, dos 30 aos 50 minutos, acontece um evento sorteado pela
//  hora (todo mundo vê o mesmo ao mesmo tempo):
//   🌟 Hora Dourada   — +50% de XP e de drop em todo o Reino
//   ⚔️ Invasão        — monstros atacam uma cidade; quem defende ganha fragmentos
//   ✨ Chuva de Estrelas — estrelas caem perto de você; cada uma é um prêmio
//   🧳 Mercador Raro  — o Mercador Orlo vende o que é difícil de achar, numa cidade
// =====================================================================
'use strict';
const Eventos = (() => {
  const INI = 30, DUR = 20, DURT = { estrelas: 5 };                                               // minutos
  const hash = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };
  const TIPOS = ['dourada', 'invasao', 'estrelas', 'mercador'];
  const CIDADES = () => [{ c: VIL, z: 'solmira', n: 'Vila de Solmira' }, { c: OAS, z: 'kharum', n: 'Oásis de Kharum' }, { c: CIT, z: 'cidadela', n: 'Cidadela do Cisma' }];
  const hora = () => Math.floor(Date.now() / 3600e3);
  function agora() {
    const h = hora(), min = (Date.now() % 3600e3) / 60e3, tipo = TIPOS[hash(h) % TIPOS.length], cid = CIDADES()[hash(h * 7 + 1) % 3];
    const dur = DURT[tipo] || DUR;                                        // a chuva de estrelas é curta: 5 min (pedido do Rone: 20 era muito)
    return { h, tipo, cid, dur, ativo: min >= INI && min < INI + dur, falta: (INI + dur - min) * 60, comecaEm: (INI - min) * 60 };
  }
  let ultimo = null, avisou = null, invT = 0, estT = 0, orlo = null, comprou = {};
  const mmss = s => `${Math.floor(s / 60)} min`;
  function mult(k) { const e = agora(); return e.ativo && e.tipo === 'dourada' && (k === 'xp' || k === 'drop') ? 1.5 : 1; }

  // ---------------- invasão: monstros do seu nível em volta da praça
  function invasao(e, dt) {
    if ((invT -= dt) > 0) return; invT = 15;
    if (zoneOf(P.x, P.z) !== e.cid.z || inTower(P.z)) return;
    const vivos = mobs.filter(m => m.invasor && !m.dead).length; if (vivos >= 10) return;
    const L = Math.max(5, Math.min(100, P.lv)), tipos = Object.keys(MOBDEF).filter(t => { const d = MOBDEF[t]; return !d.boss && !d.mini && !d.alfa && !d.field && !d.world && d.drops; }).sort((a, b) => Math.abs(MOBDEF[a].lv - L) - Math.abs(MOBDEF[b].lv - L)).slice(0, 3);
    for (let k = 0; k < 4; k++) {
      const a = Math.random() * TAU, x = e.cid.c.x + Math.sin(a) * 16, z = e.cid.c.z + Math.cos(a) * 16; if (blocked(x, z)) continue;
      const m = spawnMob(tipos[k % tipos.length], null, { x, z }), d0 = m.d, kf = L / d0.lv;
      m.d = { ...d0, lv: L, hp: Math.round(d0.hp * Math.pow(kf, 1.6) * 1.5), atk: Math.round(d0.atk * kf * 1.1), def: Math.round(d0.def * kf), xp: Math.round(d0.xp * kf * 2), aggro: 30, respawn: 1e9,
        drops: [...(d0.drops || []), ['frag_cisma', 0.12], ['frag_carta', 0.2], ['red', 0.3]] };
      m.d.name = 'Invasor: ' + d0.name; m.hp = m.maxHp = m.d.hp; m.noRespawn = true; m.invasor = true; m.state = 'chase';
      const sp = m.lab.querySelector('span'); if (sp) sp.innerHTML = `⚔️ ${d0.name} <small>Nv ${L}</small>`;
    }
  }
  // ---------------- chuva de estrelas: a cada pouco uma estrela cai perto de você
  const PREMIOS = [['zeny', 0], ['zeny', 0], ['frag_carta', 1], ['frag_cisma', 1], ['red', 3], ['blue', 2]];
  // só para quem está jogando: fora das cidades (lá ficava todo mundo parado ganhando prêmio), andando
  // no último meio minuto, e no máximo 15 estrelas por evento
  let mexeuT = -99, ux = 0, uz = 0, estH = null, estN = 0, golpeT = 0;
  const MAX_EST = 15;
  // estrela de 5 pontas desenhada (brilho por fora, miolo branco)
  const TEX_EST = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.translate(64, 64);
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 64); r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(0.3, 'rgba(255,255,255,.25)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(-64, -64, 128, 128);
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, d = i % 2 ? 15 : 40; g.lineTo(Math.cos(a) * d, Math.sin(a) * d); } g.closePath(); g.shadowColor = '#fff'; g.shadowBlur = 12; g.fillStyle = '#fff'; g.fill();
    return new THREE.CanvasTexture(c); })();
  const RARA = { cor: 0x9ad8ff, premios: [['nucleo_abismo', 1, 40], ['frag_carta', 4, 30], ['selo_forja', 1, 22], ['lagrima_soberano', 1, 8]] };
  // uma estrela cai do céu (com rastro) até (x, z); ao bater no chão chama aoCair
  function cairEstrela(x, z, cor, tam, aoCair) {
    const gy = groundY(x, z), sx = x + rand(-9, 9), sy = gy + 26, sz = z + rand(-9, 9), dur = 1.1;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX_EST, color: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    sp.scale.setScalar(1.6 * tam); sp.position.set(sx, sy, sz); scene.add(sp); let t = 0, tr = 0;
    // sombra/aviso no chão de onde vai cair
    const alvo = new THREE.Mesh(new THREE.RingGeometry(0.6 * tam, 0.9 * tam, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false })); alvo.position.set(x, gy + 0.06, z); scene.add(alvo);
    const passo = () => {
      if (!running) return;
      t += 1 / 60; const k = Math.min(1, t / dur), e = k * k;
      sp.position.set(sx + (x - sx) * e, sy + (gy + 0.6 - sy) * e, sz + (z - sz) * e); sp.material.rotation += 0.15; alvo.material.opacity = 0.3 + k * 0.5; alvo.scale.setScalar(1.4 - k * 0.6);
      if ((tr -= 1) <= 0 && typeof VFX !== 'undefined') { tr = 1; VFX.particle(sp.position.clone(), cor, { map: VFX.T.spark, size: 0.7 * tam, speed: 0.4, life: 0.5, shrink: true }); if (Math.random() < 0.5) VFX.particle(sp.position.clone(), 0xffffff, { size: 0.35, speed: 1.2, life: 0.4 }); }
      if (k < 1) { requestAnimationFrame(passo); return; }
      scene.remove(sp); sp.material.dispose(); scene.remove(alvo); alvo.geometry.dispose(); alvo.material.dispose();
      const p = new THREE.Vector3(x, gy + 0.6, z);
      if (typeof VFX !== 'undefined') { VFX.flash(p, cor, 3.5 * tam, 0.35); VFX.wave(x, z, 2.2 * tam, cor, 0.6); for (let i = 0; i < 14; i++) VFX.particle(p, i % 2 ? cor : 0xffffff, { map: VFX.T.spark, size: 0.4, speed: 6, g: 9, life: 0.7, spin: true }); }
      else { burst(p, cor, 24, 3, 1); ring(x, z, 1.4, cor, 0.6); }
      Audio8.sfx('coin'); aoCair && aoCair(x, z);
    };
    requestAnimationFrame(passo);
  }
  function estrelas(dt, e) {
    if (Math.hypot(P.x - ux, P.z - uz) > 1.5) { ux = P.x; uz = P.z; mexeuT = time; }
    if (estH !== e.h) { estH = e.h; estN = 0; }
    if (inTower(P.z) || P.dead) return;
    const zn = zoneOf(P.x, P.z), caca = !((ZONES[zn] && ZONES[zn].town) || zn === 'sitio' || zn === 'casa') && time - mexeuT <= 30;
    // ☄️ estrela que cai em cima de um monstro perto de você (dano grande, conta como seu)
    if (caca && (golpeT -= dt) <= 0) {
      golpeT = 5;
      const m = mobs.filter(m => !m.dead && !m.isPeer && !m.d.world && Math.hypot(m.x - P.x, m.z - P.z) < 16).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
      if (m) cairEstrela(m.x, m.z, 0xffd860, 1.3, () => { if (m.dead || P.dead) return; const base = Math.max(stats.atk(), stats.matk()) * 4; for (const o of mobs.filter(o => !o.dead && !o.isPeer && !o.d.world && Math.hypot(o.x - m.x, o.z - m.z) < 3)) dmgMob(o, base, false, true, 0xffd860); });
    }
    if ((estT -= dt) > 0) return; estT = 7;
    if (!caca || estN >= MAX_EST) return;
    const a = Math.random() * TAU, r = 4 + Math.random() * 10, x = P.x + Math.sin(a) * r, z = P.z + Math.cos(a) * r; if (blocked(x, z)) return;
    estN++;
    // 🌠 1 em 8 é uma estrela rara: maior, azul, com prêmio bom
    if (Math.random() < 1 / 8) {
      let s = Math.random() * 100, pr = RARA.premios[0]; for (const q of RARA.premios) { if (s < q[2]) { pr = q; break; } s -= q[2]; }
      log('🌠 Uma <b>estrela rara</b> está caindo perto de você!', 'gold');
      cairEstrela(x, z, RARA.cor, 2, () => { drops.push(makeDrop(pr[0], pr[1], x, z)); if (typeof VFX !== 'undefined') VFX.pillar(x, z, 0.8, 9, RARA.cor, 1.2); });
      return;
    }
    const [id, n] = PREMIOS[Math.floor(Math.random() * PREMIOS.length)];
    cairEstrela(x, z, 0xfff0a0, 1, () => drops.push(makeDrop(id, id === 'zeny' ? 100 * Math.max(1, P.lv) : n, x, z)));
  }
  // ---------------- mercador raro: o Mercador Orlo na praça de uma cidade
  const LOJA = [
    ['selo_forja', 1, 8000, 3], ['frag_cisma', 5, 15000, 4], ['nucleo_abismo', 2, 30000, 3], ['frag_carta', 10, 20000, 4], ['lagrima_soberano', 1, 250000, 1], ['essencia', 3, 12000, 3],
  ];
  function montarOrlo(e) {
    if (orlo && orlo.h === e.h) return;
    tirarOrlo();
    const x = e.cid.c.x + 7, z = e.cid.c.z + 7, g = new THREE.Group(); g.position.set(x, groundY(x, z), z); scene.add(g);
    if (typeof SpriteKit !== 'undefined' && SpriteKit.ready) { const a = SpriteKit.actor({ kind: 'dir', base: 's_mascate' }); g.add(a.root); }
    const tenda = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.4, 6, 1, true), new THREE.MeshLambertMaterial({ color: 0xc08030, side: THREE.DoubleSide })); tenda.position.y = 2.6; g.add(tenda);
    const ic = iconeSprite('🧳'); ic.position.y = 3.6; g.add(ic);
    orlo = { h: e.h, g, x, z }; comprou = {};
  }
  function tirarOrlo() { if (orlo) { scene.remove(orlo.g); orlo = null; } }
  function loja() {
    const opts = LOJA.map(([id, n, preco, lim]) => { const ja = comprou[id] || 0; return { label: `${ITEMS[id].ic} ${n}× ${ITEMS[id].name} — ${preco.toLocaleString('pt-BR')} cr${ja >= lim ? ' · esgotado' : ` · ${lim - ja} restam`}`, fn: () => {
      if (ja >= lim) { log('🧳 Esse acabou. Volte no próximo Mercador Raro.', 'bad'); return true; }
      if (P.zeny < preco) { log('Coroas insuficientes!', 'bad'); Audio8.sfx('miss'); return true; }
      P.zeny -= preco; P.inv[id] = (P.inv[id] || 0) + n; comprou[id] = ja + 1; Audio8.sfx('coin'); log(`🧳 Você comprou <b>${n}× ${ITEMS[id].ic} ${ITEMS[id].name}</b> do Mercador Orlo.`, 'gold'); try { save(); } catch (er) { } loja(); return true; } }; });
    opts.push({ label: 'Até mais' });
    dialog('🧳 Mercador Orlo', `Eu só passo por aqui de vez em quando, e não fico muito... Tenho coisas que não se acham por aí. <small>Coroas: <b>${P.zeny.toLocaleString('pt-BR')} cr</b></small>`, opts);
  }
  function nearest() { return orlo && running && !inTower(P.z) && Math.hypot(P.x - orlo.x, P.z - orlo.z) < 3 ? { label: '🧳 Falar com o Mercador Orlo', fn: loja } : null; }

  const NOMES = { dourada: '🌟 Hora Dourada', invasao: '⚔️ Invasão', estrelas: '✨ Chuva de Estrelas', mercador: '🧳 Mercador Raro' };
  const DESC = e => ({ dourada: '+50% de XP e de drop em todo o Reino!', invasao: `monstros atacam a <b>${e.cid.n}</b>! Defenda a praça: eles soltam fragmentos.`, estrelas: 'estrelas caem perto de quem está caçando fora das cidades (até 15 por pessoa), algumas raras 🌠, e outras caem nos monstros: pegue-as!', mercador: `o <b>Mercador Orlo</b> está na praça de <b>${e.cid.n}</b> vendendo raridades.` })[e.tipo];
  // 🥁 música de batalha na cidade invadida (pedido do Rone: a música calma da vila não combinava com o caos)
  let musInv = '';
  function musicaInvasao(e) {
    const zn = zoneOf(P.x, P.z), quer = e.ativo && e.tipo === 'invasao' && zn === e.cid.z && !inTower(P.z), k = (quer ? 'guerra' : 'zona') + zn;
    if (k === musInv) return; const antes = musInv; musInv = k;
    if (quer) Audio8.play('guerra'); else if (antes.startsWith('guerra') && ZONES[zn]) Audio8.play(ZONES[zn].music);
  }
  function update(dt) {
    if (!running) return;
    const e = agora();
    try { musicaInvasao(e); } catch (er) { }
    if (!e.ativo && e.comecaEm > 0 && e.comecaEm < 120 && avisou !== e.h) { avisou = e.h; typeof Anuncio !== 'undefined' && Anuncio.mostrar({ ic: '⚡', tag: 'EM 2 MINUTOS', titulo: NOMES[e.tipo], sub: DESC(e).replace(/<[^>]+>/g, '') }); log(`⚡ Em <b>2 minutos</b>: ${NOMES[e.tipo]} — ${DESC(e)}`, 'gold'); }
    if (e.ativo && ultimo !== e.h) { ultimo = e.h; typeof Anuncio !== 'undefined' && Anuncio.mostrar({ ic: '⚡', tag: `EVENTO SURPRESA · ${e.dur} MIN`, titulo: NOMES[e.tipo], sub: DESC(e).replace(/<[^>]+>/g, ''), cor: 'verde' }); Audio8.sfx('level'); log(`⚡ <b>Evento:</b> ${NOMES[e.tipo]} por ${DUR} minutos — ${DESC(e)}`, 'gold'); }
    if (!e.ativo) { if (orlo) tirarOrlo(); if (ultimo === e.h && e.falta < 0) { ultimo = -e.h; log(`⚡ ${NOMES[e.tipo]} acabou. O próximo evento é às :${INI} da próxima hora.`, 'sys'); for (const m of mobs.filter(m => m.invasor)) { m.dead = true; scene.remove(m.model.g); m.lab.remove(); } mobs = mobs.filter(m => !m.invasor); } return; }
    if (e.tipo === 'invasao') invasao(e, dt);
    else if (e.tipo === 'estrelas') estrelas(dt, e);
    else if (e.tipo === 'mercador') montarOrlo(e);
  }
  // para o 🏰 e o ❓: o que está acontecendo e o próximo
  function resumo() { const e = agora(); return e.ativo ? `${NOMES[e.tipo]} agora (faltam ${mmss(e.falta)})` : `próximo evento às :${INI}${e.comecaEm > 0 ? ` (em ${mmss(e.comecaEm)})` : ' da próxima hora'}`; }
  return { update, mult, nearest, resumo, agora, _estrelas: estrelas, _cair: cairEstrela };
})();
