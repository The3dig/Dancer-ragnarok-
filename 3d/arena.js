// =====================================================================
//  ⚔️ Arena de Solmira (ideia do Rone): PvP livre num coliseu de areia,
//  sem penalidade nenhuma (morrer não tira XP nem itens). Cada vitória conta
//  para o 🏆 ranking da TEMPORADA (um mês). O Mestre Brakus fica em Solmira.
//  Quem é da mesma guilda não se ataca (como em todo o jogo).
// =====================================================================
'use strict';
const Arena = (() => {
  const A = ARENA, R = A.r;
  const SAIDA = { x: VIL.x + 12, z: VIL.z - 9 };                            // em Solmira, uns passos ao lado do Mestre Brakus (em cima dele, o jogador ficava preso)
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
  function sair(msg) { const q = pontoLivre(SAIDA.x, SAIDA.z); P.x = q.x; P.z = q.z; P.y = groundY(P.x, P.z); P.face = 0; Audio8.sfx('warp'); if (msg) log(msg, 'sys'); }
  // venceu alguém na arena: +1 vitória na temporada (e vai para o servidor)
  async function vitoria(nome) {
    const s = S(); s.v++; Audio8.sfx('level'); log(`🏆 Vitória na Arena sobre <b>${nome}</b>! Temporada: <b>${s.v}</b> vitória${s.v === 1 ? '' : 's'}.`, 'gold');
    try { save(); } catch (e) { }
    if (typeof Nuvem !== 'undefined' && Nuvem.logado) try { await Nuvem.api('POST', '/conta/ranking/' + s.t, { nome: P.name, vaga: typeof Contas !== 'undefined' ? Contas.slot : 0, tempo: 999999, dano: s.v }); } catch (e) { }
  }
  // morreu na arena: sem perder nada, volta na porta com a vida cheia
  function morreu() { const s = S(); s.d++; P.voltaArena = true; log('⚔️ Você caiu na Arena. Sem penalidade: volta na porta, com a vida cheia.', 'sys'); Audio8.sfx('die'); }
  function volta() { P.voltaArena = false; P.hp = stats.maxHp(); P.sp = stats.maxSp(); return pontoLivre(SAIDA.x, SAIDA.z); }
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
  // o portão da arena em Solmira (atrás do Mestre Brakus): portal de coliseu com colunas, arco,
  // espadas cruzadas, braseiros acesos, estandartes e uma luz dourada dentro do arco
  let fogos = [], portalLuz = null;
  {
    const ex = VIL.x + 18.5, ez = VIL.z - 9, y = groundY(ex, ez), gg = new THREE.Group(); gg.position.set(ex, y, ez); gg.rotation.y = -Math.PI / 2; scene.add(gg);
    const pedra = PM('pedra.jpg', [1, 2], new THREE.Color(0.86, 0.78, 0.66)), pedraEsc = PM('pedra.jpg', [1, 1], new THREE.Color(0.55, 0.48, 0.4));
    const ouro = new THREE.MeshPhongMaterial({ color: 0xd9a63a, specular: 0xfff0c0, shininess: 80, emissive: 0x2a1800 }), ferro = new THREE.MeshPhongMaterial({ color: 0x5a5a66, specular: 0xaaaaaa, shininess: 60 });
    const m = (geo, mat, x, yy, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, yy, z); o.rotation.set(rx, ry, rz); o.castShadow = true; gg.add(o); return o; };
    // degraus
    m(new THREE.BoxGeometry(6.4, 0.18, 2.2), pedraEsc, 0, 0.09, 0.2); m(new THREE.BoxGeometry(5.4, 0.18, 1.6), pedra, 0, 0.27, 0.1);
    // duas colunas com base, anéis dourados e capitel
    for (const x of [-2.1, 2.1]) {
      m(new THREE.BoxGeometry(1.0, 0.4, 1.0), pedraEsc, x, 0.56, 0);
      m(new THREE.CylinderGeometry(0.36, 0.42, 3.6, 16), pedra, x, 2.56, 0);
      for (const yy of [1.2, 3.9]) m(new THREE.TorusGeometry(0.4, 0.05, 8, 20), ouro, x, yy, 0, Math.PI / 2);
      m(new THREE.BoxGeometry(1.0, 0.36, 1.0), pedraEsc, x, 4.5, 0);
    }
    // arco de pedra em semicírculo com pedra-chave dourada e o lintel
    m(new THREE.TorusGeometry(2.1, 0.3, 10, 28, Math.PI), pedra, 0, 4.68, 0);
    m(new THREE.BoxGeometry(0.5, 0.7, 0.7), ouro, 0, 6.8, 0);
    m(new THREE.BoxGeometry(5.6, 0.34, 1.1), pedraEsc, 0, 4.86, 0);
    // escudo com duas espadas cruzadas em cima do arco
    m(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 6), new THREE.MeshPhongMaterial({ color: 0xa8182a, shininess: 30 }), 0, 7.4, 0.15, Math.PI / 2);
    for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(0, 7.4, 0.3); g.rotation.z = 0.75 * s; gg.add(g); const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.7, 0.04), new THREE.MeshPhongMaterial({ color: 0xdfe6f0, specular: 0xffffff, shininess: 120 })); g.add(l); const c = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.08), ouro); c.position.y = -0.62; g.add(c); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6), ferro); p.position.y = -0.82; g.add(p); }
    // grade levantada (ferro) dentro do arco e a luz do portal
    for (let i = -3; i <= 3; i++) m(new THREE.BoxGeometry(0.06, 1.0, 0.06), ferro, i * 0.5, 4.3, -0.25);
    m(new THREE.BoxGeometry(3.6, 0.08, 0.08), ferro, 0, 3.82, -0.25);
    portalLuz = m(new THREE.PlaneGeometry(3.4, 3.7), new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), 0, 2.2, -0.3);
    // estandartes vermelhos e azuis pendurados nas colunas
    const band = (x, cor) => { const c = document.createElement('canvas'); c.width = 64; c.height = 160; const g = c.getContext('2d'); g.fillStyle = cor; g.fillRect(0, 0, 64, 160); g.fillStyle = '#e8b84a'; g.fillRect(0, 0, 64, 8); g.font = 'bold 34px serif'; g.textAlign = 'center'; g.fillText('⚔', 32, 70); g.fillStyle = cor; g.beginPath(); g.moveTo(0, 160); g.lineTo(32, 136); g.lineTo(64, 160); g.fill(); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
      m(new THREE.PlaneGeometry(0.8, 2.0), new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide, transparent: true }), x, 3.0, 0.45); };
    band(-2.1, '#a8182a'); band(2.1, '#24408e');
    // placa ARENA sobre o lintel
    { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#3a2a18'; g.fillRect(0, 0, 256, 64); g.strokeStyle = '#d9a63a'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 58); g.fillStyle = '#ffd860'; g.font = 'bold 38px Georgia'; g.textAlign = 'center'; g.fillText('ARENA', 128, 46); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
      m(new THREE.PlaneGeometry(2.0, 0.5), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, side: THREE.DoubleSide }), 0, 4.86, 0.57); }
    // dois braseiros acesos (fogo de sprite, sem luz pontual: não pesa no celular)
    const fogoTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 40, 2, 32, 36, 30); r.addColorStop(0, 'rgba(255,250,200,1)'); r.addColorStop(0.35, 'rgba(255,170,60,.9)'); r.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    for (const x of [-3.3, 3.3]) {
      m(new THREE.CylinderGeometry(0.12, 0.2, 1.3, 8), ferro, x, 0.95, 0.7);
      m(new THREE.CylinderGeometry(0.42, 0.26, 0.32, 12), ferro, x, 1.72, 0.7);
      m(new THREE.TorusGeometry(0.42, 0.05, 6, 16), ouro, x, 1.88, 0.7, Math.PI / 2);
      for (let k = 0; k < 3; k++) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogoTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); f.position.set(x, 2.15 + k * 0.15, 0.7); f.scale.set(0.9 - k * 0.2, 1.2 - k * 0.25, 1); gg.add(f); fogos.push({ f, k, s: Math.random() * 10 }); }
    }
    addOb(ex, ez - 2.1, 0.7); addOb(ex, ez + 2.1, 0.7); addOb(ex + 0.7, ez - 3.3, 0.4); addOb(ex + 0.7, ez + 3.3, 0.4);
  }
  // o fogo dos braseiros e a luz do portal se mexem (só quando alguém está perto de Solmira)
  setInterval(() => { if (!running || Math.hypot(P.x - (VIL.x + 18.5), P.z - (VIL.z - 9)) > 70) return; const t = performance.now() / 1000;
    for (const o of fogos) { const k = 1 + Math.sin(t * 9 + o.s + o.k) * 0.12; o.f.scale.set((0.9 - o.k * 0.2) * k, (1.2 - o.k * 0.25) * (2 - k), 1); o.f.material.opacity = 0.75 + Math.sin(t * 13 + o.s) * 0.2; }
    if (portalLuz) portalLuz.material.opacity = 0.18 + Math.sin(t * 2) * 0.08; }, 60);
  const api = { update, minimap, pres: () => null, saida: SAIDA, entrar, sair, vitoria, morreu, volta, npc, ranking, temporada };
  MASMORRAS.arena = api;
  return api;
})();
