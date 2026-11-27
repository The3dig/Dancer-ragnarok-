// =====================================================================
//  Cartas Arcanas (ideia do Rone; criadas para o jogo, não estão no livro).
//  - Nenhum monstro do mundo solta: só existem na Cripta das Cartas.
//  - Na Cripta caem 🧩 Fragmentos Arcanos (sempre) e, muito raramente, a carta pronta.
//  - A Cartomante Zaíra (Vila de Solmira) monta cartas de MONSTRO com os fragmentos (as Arcanas não:
//    essas só caem na Cripta) e quebra as cartas que você não quer, devolvendo fragmentos.
// =====================================================================
'use strict';
const Cartas = (() => {
  // [id, nome, arte, espaço, atributos, fragmentos para montar]
  const ARCANAS = [
    ['arcana_eclipse', 'Lâmina do Eclipse', '🌘', 'arma', { pow: 60, crit: 0.1 }, 160],
    ['arcana_olho', 'Olho que Tudo Vê', '👁️', 'capacete', { def: 28, hp: 520, crit: 0.06 }, 130],
    ['arcana_vazio', 'Pele do Vazio', '🌑', 'armadura', { def: 45, hp: 900 }, 140],
    ['arcana_maos', 'Mãos do Ferreiro Antigo', '🔨', 'luvas', { pow: 36, crit: 0.08 }, 130],
    ['arcana_vento', 'Passo do Vento Rubro', '🌪️', 'botas', { spd: 0.15, def: 16, hp: 250 }, 120],
    ['arcana_pacto', 'Pacto de Sangue', '🩸', 'anel', { pow: 42, hp: 420 }, 150],
    ['arcana_estrela', 'Estrela Errante', '⭐', 'anel', { crit: 0.1, sp: 260 }, 150],
    ['arcana_essencia', 'Coração da Essência', '💠', 'colar', { hp: 700, sp: 300, pow: 22 }, 150],
  ];
  for (const [id, nome, arte, cslot, mods] of ARCANAS)
    ITEMS[id] = { name: `Carta Arcana: ${nome}`, ic: '🃏', kind: 'carta', mods, cslot, arte, arcana: true, sell: 2500, price: 0 };
  ITEMS.frag_carta = { name: 'Fragmento Arcano', ic: '🧩', kind: 'mat', sell: 60, price: 0 };
  
  // ---------------- a Cripta das Cartas (o mesmo molde da Mina da Forja)
  const Cripta = criarMasmorra({
    zona: 'cripta', lugar: CRIPTA, nome: 'Cripta das Cartas', icone: '🃏', tempo: 8 * 60, ondas: [10, 12, 14], minLv: 20, limite: 2,   // 2 por semana
    saida: { x: VIL.x - 10.5, z: VIL.z + 5 },                            // na frente da tenda da Cartomante, em Solmira
    chefeNome: 'Guardião das Cartas', chefeCurto: 'Guardião', txtOnda: 'saíram das cartas espalhadas',
    corPedra: new THREE.Color(0.42, 0.36, 0.55), corTeto: 0x120a1c, corSaida: 0xd8b8ff, corMapa: '#160e22', corTitulo: '#c89aff',
    moldura: new THREE.MeshLambertMaterial({ color: 0x3a2850 }),
    drops: chefe => {
      const arc = ARCANAS.map(a => [a[0], chefe ? 0.006 : 0.0003]);           // a carta pronta: muito rara (o chefe, ~5% no total)
      return chefe ? [...Array.from({ length: 10 }, () => ['frag_carta', 1]), ['frag_carta', 0.6], ['frag_carta', 0.6], ['frag_carta', 0.6], ...arc, ['red', 1], ['blue', 1]]
        : [['frag_carta', 0.4], ['frag_carta', 0.15], ...arc, ['red', 0.12], ['blue', 0.1]];
    },
    msgEntrar: (t, n) => `🃏 <b>Cripta das Cartas:</b> você tem <b>${t / 60} minutos</b> para vencer ${n} ondas e o Guardião das Cartas antes que a cripta se feche. Os monstros soltam 🧩 <b>Fragmentos Arcanos</b> (a Cartomante Zaíra monta cartas de monstro com eles) e, muito raramente, uma <b>Carta Arcana</b>, que só existe aqui.`,
    msgChefe: '☠ O <b>Guardião das Cartas</b> se levantou! Ele guarda muitos 🧩 fragmentos e, às vezes, uma <b>Carta Arcana</b>.',
    msgLimpa: '✨ <b>Cripta limpa!</b> Pegue os fragmentos do chão e saia pelo arco de luz. Para voltar, fale com a Cartomante Zaíra.',
    msgDesabou: '🌑 <b>A cripta se fechou!</b> Você escapou com o que já tinha pegado. Fale com a Cartomante Zaíra para entrar de novo.',
    tema(g, R, box, M) {
      // colunas de pedra roxa, velas e cartas gigantes flutuando e girando
      const pedra = new THREE.MeshLambertMaterial({ color: 0x4a3a60 });
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2; box(0.9, 8, 0.9, pedra, Math.sin(a) * (R - 1), 4, Math.cos(a) * (R - 1)); }
      // cartas gigantes de verdade (pedido do Rone: "tira o desenho pixel art feio e troca por objeto de verdade"):
      // placas com espessura e borda dourada, frente pintada em alta resolução (moldura e naipe) e verso decorado
      const pintar = (f) => { const c = document.createElement('canvas'); c.width = 256; c.height = 384; f(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; };
      const NAIPE = [['✦', '#6a3aa8'], ['☾', '#2a4a9a'], ['❀', '#a83a6a'], ['♛', '#9a6a10']];
      const frente = NAIPE.map(([sim, cor]) => pintar(x => {
        const gr = x.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, '#fbf1da'); gr.addColorStop(1, '#e6d2a8'); x.fillStyle = gr; x.fillRect(0, 0, 256, 384);
        x.strokeStyle = '#b8862a'; x.lineWidth = 10; x.strokeRect(12, 12, 232, 360); x.strokeStyle = cor; x.lineWidth = 3; x.strokeRect(26, 26, 204, 332);
        for (const [cx, cy] of [[26, 26], [230, 26], [26, 358], [230, 358]]) { x.fillStyle = '#b8862a'; x.beginPath(); x.arc(cx, cy, 9, 0, 7); x.fill(); }
        const rg = x.createRadialGradient(128, 192, 10, 128, 192, 95); rg.addColorStop(0, 'rgba(255,255,255,.9)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.fillRect(30, 90, 196, 200);
        x.fillStyle = cor; x.font = 'bold 150px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(sim, 128, 200);
        x.font = 'bold 44px serif'; x.fillText(sim, 52, 62); x.save(); x.translate(204, 322); x.rotate(Math.PI); x.fillText(sim, 0, 0); x.restore(); }));
      const verso = pintar(x => {
        x.fillStyle = '#2a1840'; x.fillRect(0, 0, 256, 384); x.strokeStyle = '#d8a840'; x.lineWidth = 10; x.strokeRect(12, 12, 232, 360);
        x.strokeStyle = 'rgba(216,168,64,.55)'; x.lineWidth = 2; for (let k = -384; k < 384; k += 22) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 384, 384); x.moveTo(k + 384, 0); x.lineTo(k, 384); x.stroke(); }
        x.fillStyle = '#2a1840'; x.beginPath(); x.arc(128, 192, 58, 0, 7); x.fill(); x.strokeStyle = '#d8a840'; x.lineWidth = 5; x.stroke();
        x.fillStyle = '#e8c060'; x.font = 'bold 70px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('👁', 128, 196); });
      const borda = new THREE.MeshPhongMaterial({ color: 0xd8a840, specular: 0xfff0c0, shininess: 90, emissive: 0x3a2400 });
      const matV = new THREE.MeshLambertMaterial({ map: verso, emissive: 0xffffff, emissiveMap: verso, emissiveIntensity: 0.35 });
      const matF = frente.map(t => new THREE.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.45 }));
      const geoC = new THREE.BoxGeometry(1.1, 1.65, 0.06), cartas = [];
      for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, r = R - 3 - (k % 3) * 2.5; if (Math.cos(a) * r > R - 9) continue; /* nenhuma perto da porta (tampava a câmera) */
        const c = new THREE.Mesh(geoC, [borda, borda, borda, borda, matF[k % 4], matV]); c.position.set(Math.sin(a) * r, 2.2 + (k % 4) * 1.3, Math.cos(a) * r); c.rotation.z = Math.sin(k) * 0.15; c.userData.f = k; c.castShadow = true; g.add(c); cartas.push(c); }
      // velas de cera em castiçais de ferro (eram caixinhas) e sarcófagos de pedra junto das paredes
      const chama = new THREE.MeshBasicMaterial({ color: 0xffc060, toneMapped: false }), cera = new THREE.MeshLambertMaterial({ color: 0xeee0d0 }), ferroC = new THREE.MeshPhongMaterial({ color: 0x2a2630, shininess: 40 });
      const geoVela = new THREE.CylinderGeometry(0.07, 0.08, 0.5, 10), geoChama = new THREE.ConeGeometry(0.05, 0.16, 8), geoPe = new THREE.CylinderGeometry(0.04, 0.2, 0.9, 8), geoPrato = new THREE.CylinderGeometry(0.2, 0.16, 0.06, 12);
      for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + 0.1, x = Math.sin(a) * (R - 2.2), z = Math.cos(a) * (R - 2.2);
        const pe = new THREE.Mesh(geoPe, ferroC); pe.position.set(x, 0.45, z); g.add(pe); const pr = new THREE.Mesh(geoPrato, ferroC); pr.position.set(x, 0.92, z); g.add(pr);
        const v = new THREE.Mesh(geoVela, cera); v.position.set(x, 1.2, z); g.add(v); const f = new THREE.Mesh(geoChama, chama); f.position.set(x, 1.53, z); g.add(f); }
      const pedraS = new THREE.MeshLambertMaterial({ color: 0x5a4c6e }), pedraT = new THREE.MeshLambertMaterial({ color: 0x6e5e84 });
      for (const a of [1.1, 2.3, 3.9, 5.1]) { const r = R - 4.2, sg = new THREE.Group(); sg.position.set(Math.sin(a) * r, 0, Math.cos(a) * r); sg.rotation.y = a; g.add(sg);
        const bs = (w, h, d, m, y) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.y = y; o.castShadow = o.receiveShadow = true; sg.add(o); };
        bs(1.3, 0.9, 2.5, pedraS, 0.45); bs(1.45, 0.22, 2.65, pedraT, 1.0); bs(0.9, 0.12, 1.9, pedraS, 1.17);
        const cruz = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.14), borda); cruz.position.set(0, 1.25, -0.4); sg.add(cruz); const cz = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.8), borda); cz.position.set(0, 1.25, -0.25); sg.add(cz);
        addOb(M.x + sg.position.x, M.z + sg.position.z, 1.4); }
      [[0, 5, 0], [0, 4, R - 6], [0, 4, -R + 8]].forEach(([x, y, z], i) => { const l = new THREE.PointLight(i ? 0xb080ff : 0xffd0a0, 1.3, 30); l.position.set(x, y, z); g.add(l); });
      return { update: dt => { for (const c of cartas) { c.rotation.y += dt * (0.5 + (c.userData.f % 3) * 0.2); c.position.y += Math.sin(time * 1.5 + c.userData.f) * dt * 0.3; } } };
    },
  });

  // ---------------- a tenda da Cartomante (a oeste da praça de Solmira): pano roxo, faixas douradas, cartas na entrada
  {
    const tx = VIL.x - 19, tz = VIL.z + 5, g = new THREE.Group(); g.position.set(tx, groundY(tx, tz), tz); g.rotation.y = Math.PI / 2; scene.add(g);   // a entrada olha para a praça
    const pano = new THREE.MeshLambertMaterial({ color: 0x5a2a8a, side: THREE.DoubleSide }), ouro = new THREE.MeshLambertMaterial({ color: 0xd8a840 }), madeira = new THREE.MeshLambertMaterial({ color: 0x5a3a24 });
    const teto = new THREE.Mesh(new THREE.ConeGeometry(3.6, 3.2, 8, 1, true), pano); teto.position.y = 4.1; g.add(teto);
    const parede = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 2.5, 8, 1, true, 0.55, TAU - 1.1), pano); parede.position.y = 1.25; parede.rotation.y = -0.45 + Math.PI; g.add(parede);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.12, 6, 32), ouro); aro.rotation.x = Math.PI / 2; aro.position.y = 2.5; g.add(aro);   // aro dourado na beira do telhado
    const bola = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), ouro); bola.position.y = 5.75; g.add(bola);
    const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6.4), madeira); mastro.position.y = 3.2; g.add(mastro);
    const bandeira = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), new THREE.MeshLambertMaterial({ color: 0xd8a840, side: THREE.DoubleSide })); bandeira.position.set(0.55, 6.1, 0); g.add(bandeira);
    // placa com a carta na entrada
    const c = document.createElement('canvas'); c.width = 128; c.height = 176; const x = c.getContext('2d');
    x.fillStyle = '#f0e2c0'; x.fillRect(0, 0, 128, 176); x.strokeStyle = '#8a5ac8'; x.lineWidth = 10; x.strokeRect(5, 5, 118, 166); x.fillStyle = '#6a3aa8'; x.font = 'bold 76px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('✦', 64, 80);
    x.font = 'bold 18px Georgia'; x.fillText('CARTAS', 64, 150);
    const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false })); placa.position.set(2.2, 2.0, 3.0); placa.rotation.y = 0.5; g.add(placa);
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.12), madeira); poste.position.set(2.2, 0.7, 3.0); g.add(poste);
    addOb(tx, tz, 3.4);
  }
  // ---------------- a Cartomante Zaíra
  // - MONTA cartas de monstro que já existem (as Cartas Arcanas não: essas só caem na Cripta), por muitos e muitos fragmentos;
  //   a carta montada sai Simples, Forte, Invocada ou Suprema, sorteada como no drop.
  // - QUEBRA cartas que você não quer: cada uma vira fragmentos (mais quanto mais rara).
  const SLOT_NOME = { arma: 'Arma', capacete: 'Capacete', armadura: 'Armadura', luvas: 'Luvas', botas: 'Botas', anel: 'Anel', colar: 'Colar' };
  const modTxt = m => Object.entries(m).map(([k, v]) => ({ pow: 'Dano', def: 'Defesa', hp: 'HP', sp: 'SP', crit: 'Crítico', spd: 'Velocidade' }[k] + ' +' + (['crit', 'spd'].includes(k) ? Math.round(v * 100) + '%' : v))).join(' · ');
  const deMonstro = () => Object.keys(ITEMS).filter(id => { const I = ITEMS[id]; return I.kind === 'carta' && !I.arcana && !I.tier && I.mob && MOBDEF[I.mob] && !/^alfa_/.test(I.mob); });
  // preço para montar: caro de verdade (de ~300 a milhares de 🧩); carta de chefe custa 3x
  const precoMontar = id => { const D = MOBDEF[ITEMS[id].mob]; return Math.round((300 + (D.lv || 1) * 8) * (D.boss || D.mini || D.world ? 3 : 1) / 10) * 10; };
  // o que rende quebrar: Simples 4 · Forte 12 · Invocada 35 · Suprema 100 · Arcana 150 (carta de chefe rende o dobro)
  const rendeQuebrar = id => { const I = ITEMS[id]; if (I.arcana) return 150; const D = MOBDEF[I.mob] || {}; return [4, 4, 12, 35, 100][I.tier || 1] * (D.boss || D.mini || D.world ? 2 : 1); };
  const frag = () => P.inv.frag_carta || 0;
  function npc(eu) {
    dialog('💬 Cartomante Zaíra', `${eu ? `Ah, <b>${eu}</b>... ` : ''}Toda carta tem um pedaço de alma. Traga os 🧩 <b>Fragmentos Arcanos</b> da <b>Cripta das Cartas</b> e eu monto a carta do monstro que você quiser. Carta que não serve, eu quebro e devolvo os fragmentos.<br><small>As <b>Cartas Arcanas</b> eu não sei fazer: só a Cripta dá, e muito raramente. Você tem <b>${frag()} 🧩</b>.</small>`, [
      { label: '🃏 Montar carta de monstro', fn: () => { montar(); return true; } },
      { label: '💔 Quebrar cartas (viram 🧩 fragmentos)', fn: () => { quebrar(); return true; } },
      { label: '🏆 Ranking da Cripta', fn: () => { Ranking.mostrar('cripta', () => npc(eu)); return true; } },
      { label: `🏛️ Cripta das Cartas: sozinho (5 níveis, do Nv 20 ao 150) · restam ${Cripta.restam()} de ${Cripta.limite} esta semana`, fn: () => { Cripta.entrar(); } },
      { label: Cripta.corridaDoGrupo() ? `👥 Entrar na Cripta com o seu grupo (${Cripta.corridaDoGrupo().nome} já começou)` : '👥 Cripta das Cartas em grupo (2 a 6: mais difícil, saque bem maior)', fn: () => { Cripta.entrar('grupo'); } },
      { label: 'Até mais' }]);
  }
  function montar(slot) {
    const todas = deMonstro();
    if (!slot) {
      const opts = Object.keys(SLOT_NOME).map(sl => ({ label: `${SLOT_NOME[sl]} (${todas.filter(id => ITEMS[id].cslot === sl).length} cartas)`, fn: () => { montar(sl); return true; } }));
      opts.push({ label: '← Voltar', fn: () => { npc(); return true; } });
      return dialog('🃏 Montar carta de monstro', `Para qual peça é a carta? Cada carta pede <b>muitos</b> fragmentos (carta de chefe, o triplo). Ela sai <b>Simples</b>, e às vezes <b>Forte, Invocada ou Suprema</b>.<br><small>Você tem <b>${frag()} 🧩</b>.</small>`, opts);
    }
    const lista = todas.filter(id => ITEMS[id].cslot === slot).sort((a, b) => precoMontar(a) - precoMontar(b));
    const opts = lista.map(id => { const n = precoMontar(id); return { label: `${ITEMS[id].name} — ${modTxt(ITEMS[id].mods)} · ${n.toLocaleString('pt-BR')} 🧩${frag() >= n ? '' : ' 🔒'}`, fn: () => {
      if (frag() < n) { log(`Faltam <b>${(n - frag()).toLocaleString('pt-BR')} 🧩 Fragmentos Arcanos</b> para a <b>${ITEMS[id].name}</b>. Eles caem na Cripta das Cartas.`, 'bad'); Audio8.sfx('miss'); montar(slot); return true; }
      P.inv.frag_carta -= n; const saiu = typeof Vida !== 'undefined' && Vida.tierCarta ? Vida.tierCarta(id) : id; P.inv[saiu] = (P.inv[saiu] || 0) + 1;
      Audio8.sfx('level'); burst(new THREE.Vector3(P.x, P.y + 1.4, P.z), 0xb080ff, 36, 3, 1); if (saiu !== id) banner(`🃏 ${ITEMS[saiu].name}!`);
      log(`🃏 A Cartomante Zaíra montou a <b style="color:#c89aff">${ITEMS[saiu].name}</b> (${modTxt(ITEMS[saiu].mods)}). Encaixe pela mochila: toque na peça que você está usando.`, 'gold');
      try { save(); } catch (e) { } montar(slot); return true; } }; });
    opts.push({ label: '← Outras peças', fn: () => { montar(); return true; } });
    dialog(`🃏 Cartas para ${SLOT_NOME[slot]}`, `Você tem <b>${frag()} 🧩</b>.`, opts);
  }
  function quebrar() {
    const minhas = Object.keys(P.inv).filter(id => P.inv[id] > 0 && ITEMS[id] && ITEMS[id].kind === 'carta').sort((a, b) => rendeQuebrar(a) - rendeQuebrar(b));
    const opts = minhas.map(id => ({ label: `💔 ${ITEMS[id].name} ×${P.inv[id]} → +${rendeQuebrar(id)} 🧩 cada`, fn: () => {
      P.inv[id]--; const n = rendeQuebrar(id); P.inv.frag_carta = frag() + n; Audio8.sfx('hit');
      log(`💔 A Zaíra quebrou a <b>${ITEMS[id].name}</b>: <b>+${n} 🧩</b> (você tem ${frag()}).`, 'item'); try { save(); } catch (e) { } quebrar(); return true; } }));
    const simples = minhas.filter(id => !ITEMS[id].tier && !ITEMS[id].arcana), qs = simples.reduce((t, id) => t + P.inv[id], 0);
    if (qs > 1) opts.unshift({ label: `💔 Quebrar TODAS as Simples (${qs} cartas → +${simples.reduce((t, id) => t + P.inv[id] * rendeQuebrar(id), 0)} 🧩)`, fn: () => {
      let n = 0; for (const id of simples) { n += P.inv[id] * rendeQuebrar(id); P.inv[id] = 0; } P.inv.frag_carta = frag() + n; Audio8.sfx('anvil');
      log(`💔 A Zaíra quebrou ${qs} cartas Simples: <b>+${n} 🧩</b> (você tem ${frag()}).`, 'item'); try { save(); } catch (e) { } quebrar(); return true; } });
    if (!minhas.length) opts.push({ label: 'Você não tem cartas na mochila.', fn: () => { quebrar(); return true; } });
    opts.push({ label: '← Voltar', fn: () => { npc(); return true; } });
    dialog('💔 Quebrar cartas', `Cada carta vira 🧩 fragmentos: <b>Simples 4 · Forte 12 · Invocada 35 · Suprema 100 · Arcana 150</b> (carta de chefe rende o dobro). Cartas encaixadas não aparecem aqui.<br><small>Você tem <b>${frag()} 🧩</b>.</small>`, opts);
  }
  return { npc, montar, quebrar, Cripta, ARCANAS, precoMontar, rendeQuebrar };
})();
