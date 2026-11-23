// =====================================================================
//  ⚔️ Arena de Solmira (ideia do Rone): PvP livre num coliseu de areia,
//  sem penalidade nenhuma (morrer não tira XP nem itens). Cada vitória conta
//  para o 🏆 ranking da TEMPORADA (um mês). O Mestre Brakus fica em Solmira.
//  Quem é da mesma guilda não se ataca (como em todo o jogo).
// =====================================================================
'use strict';
const Arena = (() => {
  const A = ARENA, R = A.r;
  const SAIDA = { x: VIL.x + 15, z: VIL.z - 9 };                            // em Solmira, na frente do Mestre Brakus
  const temporada = () => { const d = new Date(); return 'arena' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0'); };
  const nomeTemporada = () => new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const S = () => { const t = temporada(); if (!P.arena || P.arena.t !== t) P.arena = { t, v: 0, d: 0 }; return P.arena; };

  // ---------------- o coliseu (só aparece com você dentro)
  const g = new THREE.Group(); g.position.set(A.x, 0, A.z); g.visible = false; scene.add(g);
  const areia = PM('pedra.jpg', [6, 6], new THREE.Color(0.85, 0.72, 0.5)), muro = PM('pedra.jpg', [12, 2], new THREE.Color(0.6, 0.52, 0.44), { side: THREE.BackSide });
  const chao = new THREE.Mesh(new THREE.CircleGeometry(R + 1, 48).rotateX(-Math.PI / 2), areia); chao.receiveShadow = true; g.add(chao);
  const parede = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.5, R + 0.5, 4, 40, 1, true), muro); parede.position.y = 2; g.add(parede);
  const arqui = new THREE.Mesh(new THREE.CylinderGeometry(R + 7, R + 1, 7, 40, 1, true), PM('pedra.jpg', [16, 3], new THREE.Color(0.5, 0.44, 0.38), { side: THREE.BackSide })); arqui.position.y = 7.5; g.add(arqui);   // a arquibancada
  const cores = [0xc03030, 0x3060c0, 0xd8a840, 0x40a060];
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, b = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.6), new THREE.MeshLambertMaterial({ color: cores[k % 4], side: THREE.DoubleSide })); b.position.set(Math.sin(a) * (R + 0.3), 3.2, Math.cos(a) * (R + 0.3)); b.rotation.y = a + Math.PI; g.add(b); }
  const centro = new THREE.Mesh(new THREE.RingGeometry(3.5, 4, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd8a840, toneMapped: false })); centro.position.y = 0.03; g.add(centro);
  const luz = new THREE.PointLight(0xffe0b0, 1.2, 60); luz.position.set(0, 10, 0); g.add(luz);
  // saída: portão ao sul
  const portao = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.4), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.6, toneMapped: false, side: THREE.DoubleSide })); portao.position.set(0, 1.7, R - 0.6); g.add(portao);
  const SAIDA_IN = { x: A.x, z: A.z + R - 1.2 };
  let armada = false, dentroAntes = false;

  function entrar() {
    if (P.lv < 15) { log('⚔️ A Arena é para o nível 15 em diante.', 'bad'); Audio8.sfx('miss'); return; }
    if (typeof autoStop === 'function') autoStop('');
    const a = Math.random() * TAU; P.x = A.x + Math.sin(a) * (R - 6); P.z = A.z + Math.cos(a) * (R - 6); P.y = 0; P.face = Math.atan2(A.x - P.x, A.z - P.z);
    camS.x = P.x; camS.z = P.z; P.protT = time + 3; armada = false; Audio8.sfx('warp');
    banner('⚔️ ARENA DE SOLMIRA'); log(`⚔️ <b>Arena:</b> PvP livre e <b>sem penalidade</b> (morrer não tira XP nem itens). Cada vitória conta para o 🏆 ranking de <b>${nomeTemporada()}</b>. Saia pelo portão de luz.`, 'gold');
  }
  function sair(msg) { P.x = SAIDA.x; P.z = SAIDA.z; P.y = groundY(P.x, P.z); P.face = 0; Audio8.sfx('warp'); if (msg) log(msg, 'sys'); }
  // venceu alguém na arena: +1 vitória na temporada (e vai para o servidor)
  async function vitoria(nome) {
    const s = S(); s.v++; Audio8.sfx('level'); log(`🏆 Vitória na Arena sobre <b>${nome}</b>! Temporada: <b>${s.v}</b> vitória${s.v === 1 ? '' : 's'}.`, 'gold');
    try { save(); } catch (e) { }
    if (typeof Nuvem !== 'undefined' && Nuvem.logado) try { await Nuvem.api('POST', '/conta/ranking/' + s.t, { nome: P.name, vaga: typeof Contas !== 'undefined' ? Contas.slot : 0, tempo: 999999, dano: s.v }); } catch (e) { }
  }
  // morreu na arena: sem perder nada, volta na porta com a vida cheia
  function morreu() { const s = S(); s.d++; P.voltaArena = true; log('⚔️ Você caiu na Arena. Sem penalidade: volta na porta, com a vida cheia.', 'sys'); Audio8.sfx('die'); }
  function volta() { P.voltaArena = false; P.hp = stats.maxHp(); P.sp = stats.maxSp(); return SAIDA; }
  async function ranking(voltar) {
    let r = null; try { r = await Nuvem.api('GET', '/conta/ranking/' + temporada()); } catch (e) { }
    const l = r && r.dano && r.dano.length ? r.dano.map((o, i) => `${['🥇', '🥈', '🥉'][i] || `<b>${i + 1}º</b>`} ${o.nome} — <b>${o.dano}</b> vitória${o.dano === 1 ? '' : 's'}`).join('<br>') : '<small>Ninguém venceu ainda nesta temporada. Seja o primeiro!</small>';
    const s = S();
    dialog(`🏆 Arena: temporada de ${nomeTemporada()}`, `${l}<br><br><small>Você: <b>${s.v}</b> vitórias e ${s.d} quedas nesta temporada. A temporada vira no dia 1º de cada mês.</small>`, [...(voltar ? [{ label: '← Voltar', fn: () => { voltar(); return true; } }] : []), { label: 'Fechar' }]);
  }
  function npc(eu) {
    const s = S();
    dialog('💬 Mestre Brakus', `${eu ? `<b>${eu}</b>! ` : ''}Na minha arena ninguém perde nada além do orgulho. Entre, lute com quem estiver lá e cada vitória vai para o placar da temporada. No fim do mês, o primeiro do placar fica na história.<br><small>Nível 15+. Você: <b>${s.v}</b> vitórias nesta temporada.</small>`, [
      { label: '⚔️ Entrar na Arena', fn: () => { entrar(); } },
      { label: '🏆 Placar da temporada', fn: () => { ranking(() => npc(eu)); return true; } },
      { label: 'Até mais' }]);
  }
  function update(dt) {
    const dentro = inTower(P.z) && zoneOf(P.x, P.z) === 'arena'; g.visible = dentro;
    if (!dentro) { dentroAntes = false; return; }
    if (!dentroAntes) { dentroAntes = true; armada = false; }
    centro.rotation.z += dt * 0.2; portao.material.opacity = 0.45 + Math.sin(time * 2) * 0.15;
    const d = Math.hypot(P.x - SAIDA_IN.x, P.z - SAIDA_IN.z); if (d > 4) armada = true;
    if (armada && d < 1.6 && !P.dead) sair('⚔️ Você saiu da Arena.');
  }
  function minimap(mg) {
    const W = mg.canvas.width, H = mg.canvas.height; mg.fillStyle = '#2a2014'; mg.fillRect(0, 0, W, H); mg.textAlign = 'center';
    mg.fillStyle = '#ffd860'; mg.font = 'bold 13px Georgia'; mg.fillText('⚔️ Arena', W / 2, H / 2 - 10);
    mg.fillStyle = '#f0e2c0'; mg.font = 'bold 11px sans-serif'; mg.fillText(`🏆 ${S().v} vitórias`, W / 2, H / 2 + 10); mg.textAlign = 'left';
  }
  // o portão da arena em Solmira (atrás do Mestre Brakus)
  {
    const ex = VIL.x + 18.5, ez = VIL.z - 9, y = groundY(ex, ez), gg = new THREE.Group(); gg.position.set(ex, y, ez); gg.rotation.y = -Math.PI / 2; scene.add(gg);
    const pm = PM('pedra.jpg', [1, 2], new THREE.Color(0.75, 0.66, 0.55));
    const b = (w, h, d, x, yy, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pm); o.position.set(x, yy, z); o.castShadow = true; gg.add(o); };
    b(0.8, 3.4, 0.8, -1.7, 1.7, 0); b(0.8, 3.4, 0.8, 1.7, 1.7, 0); b(4.3, 0.7, 0.9, 0, 3.7, 0);
    for (const [x, c] of [[-1.7, 0xc03030], [1.7, 0x3060c0]]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.4), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide })); f.position.set(x, 2.4, 0.45); gg.add(f); }
    addOb(ex, ez - 1.7, 0.6); addOb(ex, ez + 1.7, 0.6);
  }
  const api = { update, minimap, pres: () => null, saida: SAIDA, entrar, sair, vitoria, morreu, volta, npc, ranking, temporada };
  MASMORRAS.arena = api;
  return api;
})();
