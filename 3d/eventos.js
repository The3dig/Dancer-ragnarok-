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
  const INI = 30, DUR = 20;                                               // minutos
  const hash = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };
  const TIPOS = ['dourada', 'invasao', 'estrelas', 'mercador'];
  const CIDADES = () => [{ c: VIL, z: 'solmira', n: 'Vila de Solmira' }, { c: OAS, z: 'kharum', n: 'Oásis de Kharum' }, { c: CIT, z: 'cidadela', n: 'Cidadela do Cisma' }];
  const hora = () => Math.floor(Date.now() / 3600e3);
  function agora() {
    const h = hora(), min = (Date.now() % 3600e3) / 60e3, tipo = TIPOS[hash(h) % TIPOS.length], cid = CIDADES()[hash(h * 7 + 1) % 3];
    return { h, tipo, cid, ativo: min >= INI && min < INI + DUR, falta: (INI + DUR - min) * 60, comecaEm: (INI - min) * 60 };
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
  function estrelas(dt) {
    if ((estT -= dt) > 0 || inTower(P.z) || P.dead) return; estT = 7;
    const a = Math.random() * TAU, r = 4 + Math.random() * 10, x = P.x + Math.sin(a) * r, z = P.z + Math.cos(a) * r; if (blocked(x, z)) return;
    const [id, n] = PREMIOS[Math.floor(Math.random() * PREMIOS.length)];
    drops.push(makeDrop(id, id === 'zeny' ? 100 * Math.max(1, P.lv) : n, x, z));
    burst(new THREE.Vector3(x, groundY(x, z) + 6, z), 0xfff0a0, 24, 3, 1); ring(x, z, 1.4, 0xffe060, 0.6);
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
  const DESC = e => ({ dourada: '+50% de XP e de drop em todo o Reino!', invasao: `monstros atacam a <b>${e.cid.n}</b>! Defenda a praça: eles soltam fragmentos.`, estrelas: 'estrelas caem perto de você em qualquer mapa aberto: pegue-as!', mercador: `o <b>Mercador Orlo</b> está na praça de <b>${e.cid.n}</b> vendendo raridades.` })[e.tipo];
  function update(dt) {
    if (!running) return;
    const e = agora();
    if (!e.ativo && e.comecaEm > 0 && e.comecaEm < 120 && avisou !== e.h) { avisou = e.h; log(`⚡ Em <b>2 minutos</b>: ${NOMES[e.tipo]} — ${DESC(e)}`, 'gold'); }
    if (e.ativo && ultimo !== e.h) { ultimo = e.h; banner(NOMES[e.tipo].toUpperCase()); Audio8.sfx('level'); log(`⚡ <b>Evento:</b> ${NOMES[e.tipo]} por ${DUR} minutos — ${DESC(e)}`, 'gold'); }
    if (!e.ativo) { if (orlo) tirarOrlo(); if (ultimo === e.h && e.falta < 0) { ultimo = -e.h; log(`⚡ ${NOMES[e.tipo]} acabou. O próximo evento é às :${INI} da próxima hora.`, 'sys'); for (const m of mobs.filter(m => m.invasor)) { m.dead = true; scene.remove(m.model.g); m.lab.remove(); } mobs = mobs.filter(m => !m.invasor); } return; }
    if (e.tipo === 'invasao') invasao(e, dt);
    else if (e.tipo === 'estrelas') estrelas(dt);
    else if (e.tipo === 'mercador') montarOrlo(e);
  }
  // para o 🏰 e o ❓: o que está acontecendo e o próximo
  function resumo() { const e = agora(); return e.ativo ? `${NOMES[e.tipo]} agora (faltam ${mmss(e.falta)})` : `próximo evento às :${INI}${e.comecaEm > 0 ? ` (em ${mmss(e.comecaEm)})` : ' da próxima hora'}`; }
  return { update, mult, nearest, resumo, agora };
})();
