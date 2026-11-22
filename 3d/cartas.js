// =====================================================================
//  Cartas Arcanas (ideia do Rone; criadas para o jogo, não estão no livro).
//  - Nenhum monstro do mundo solta: só existem na Cripta das Cartas.
//  - Na Cripta caem 🧩 Fragmentos Arcanos (sempre) e, muito raramente, a carta pronta.
//  - A Cartomante Zaíra (Vila de Solmira) junta os fragmentos e monta a carta que você escolher.
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
  const custo = id => (ARCANAS.find(a => a[0] === id) || [])[5] || 150;

  // ---------------- a Cripta das Cartas (o mesmo molde da Mina da Forja)
  const Cripta = criarMasmorra({
    zona: 'cripta', lugar: CRIPTA, nome: 'Cripta das Cartas', icone: '🃏', tempo: 8 * 60, ondas: [10, 12, 14], minLv: 30,
    saida: { x: VIL.x - 9, z: VIL.z + 15 },                              // na frente da Cartomante, em Solmira
    chefeNome: 'Guardião das Cartas', chefeCurto: 'Guardião', txtOnda: 'saíram das cartas espalhadas',
    corPedra: new THREE.Color(0.42, 0.36, 0.55), corTeto: 0x120a1c, corSaida: 0xd8b8ff, corMapa: '#160e22', corTitulo: '#c89aff',
    moldura: new THREE.MeshLambertMaterial({ color: 0x3a2850 }),
    drops: chefe => {
      const arc = ARCANAS.map(a => [a[0], chefe ? 0.006 : 0.0003]);           // a carta pronta: muito rara (o chefe, ~5% no total)
      return chefe ? [...Array.from({ length: 10 }, () => ['frag_carta', 1]), ['frag_carta', 0.6], ['frag_carta', 0.6], ['frag_carta', 0.6], ...arc, ['red', 1], ['blue', 1]]
        : [['frag_carta', 0.4], ['frag_carta', 0.15], ...arc, ['red', 0.12], ['blue', 0.1]];
    },
    msgEntrar: (t, n) => `🃏 <b>Cripta das Cartas:</b> você tem <b>${t / 60} minutos</b> para vencer ${n} ondas e o Guardião das Cartas antes que a cripta se feche. Os monstros soltam 🧩 <b>Fragmentos Arcanos</b> (a Cartomante Zaíra monta cartas com eles) e, muito raramente, uma <b>Carta Arcana</b> pronta.`,
    msgChefe: '☠ O <b>Guardião das Cartas</b> se levantou! Ele guarda muitos 🧩 fragmentos e, às vezes, uma <b>Carta Arcana</b>.',
    msgLimpa: '✨ <b>Cripta limpa!</b> Pegue os fragmentos do chão e saia pelo arco de luz. Para voltar, fale com a Cartomante Zaíra.',
    msgDesabou: '🌑 <b>A cripta se fechou!</b> Você escapou com o que já tinha pegado. Fale com a Cartomante Zaíra para entrar de novo.',
    tema(g, R, box, M) {
      // colunas de pedra roxa, velas e cartas gigantes flutuando e girando
      const pedra = new THREE.MeshLambertMaterial({ color: 0x4a3a60 });
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2; box(0.9, 8, 0.9, pedra, Math.sin(a) * (R - 1), 4, Math.cos(a) * (R - 1)); }
      const tex = (() => {
        const c = document.createElement('canvas'); c.width = 64; c.height = 96; const x = c.getContext('2d');
        x.fillStyle = '#f0e2c0'; x.fillRect(0, 0, 64, 96); x.strokeStyle = '#8a5ac8'; x.lineWidth = 6; x.strokeRect(4, 4, 56, 88);
        x.fillStyle = '#6a3aa8'; x.font = 'bold 40px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('✦', 32, 50);
        const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
      })();
      const matC = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false });
      const geoC = new THREE.PlaneGeometry(1.1, 1.65), cartas = [];
      for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, r = R - 3 - (k % 3) * 2.5; if (Math.cos(a) * r > R - 9) continue; /* nenhuma perto da porta (tampava a câmera) */ const c = new THREE.Mesh(geoC, matC); c.position.set(Math.sin(a) * r, 2.2 + (k % 4) * 1.3, Math.cos(a) * r); c.userData.f = k; g.add(c); cartas.push(c); }
      const chama = new THREE.MeshBasicMaterial({ color: 0xffc060, toneMapped: false }), cera = new THREE.MeshLambertMaterial({ color: 0xeee0d0 });
      for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + 0.1, x = Math.sin(a) * (R - 2.2), z = Math.cos(a) * (R - 2.2); box(0.18, 0.7, 0.18, cera, x, 0.35, z); const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), chama); f.position.set(x, 0.8, z); g.add(f); }
      [[0, 5, 0], [0, 4, R - 6], [0, 4, -R + 8]].forEach(([x, y, z], i) => { const l = new THREE.PointLight(i ? 0xb080ff : 0xffd0a0, 1.3, 30); l.position.set(x, y, z); g.add(l); });
      return { update: dt => { for (const c of cartas) { c.rotation.y += dt * (0.5 + (c.userData.f % 3) * 0.2); c.position.y += Math.sin(time * 1.5 + c.userData.f) * dt * 0.3; } } };
    },
  });

  // ---------------- a Cartomante Zaíra: monta a carta com os fragmentos e manda você para a Cripta
  const SLOT_NOME = { arma: 'Arma', capacete: 'Capacete', armadura: 'Armadura', luvas: 'Luvas', botas: 'Botas', anel: 'Anel', colar: 'Colar' };
  const modTxt = m => Object.entries(m).map(([k, v]) => ({ pow: 'Dano', def: 'Defesa', hp: 'HP', sp: 'SP', crit: 'Crítico', spd: 'Velocidade' }[k] + ' +' + (['crit', 'spd'].includes(k) ? Math.round(v * 100) + '%' : v))).join(' · ');
  function npc(eu) {
    const f = P.inv.frag_carta || 0;
    dialog('💬 Cartomante Zaíra', `${eu ? `Ah, <b>${eu}</b>... ` : ''}As cartas que eu guardo não caem de bicho nenhum lá fora. Os pedaços delas estão espalhados na <b>Cripta das Cartas</b>. Traga os 🧩 <b>Fragmentos Arcanos</b> e eu monto a carta para você.<br><small>Você tem <b>${f} 🧩</b>.</small>`, [
      { label: '🃏 Montar uma Carta Arcana', fn: () => { montar(); return true; } },
      { label: '🏛️ Entrar na Cripta das Cartas (nível 30+)', fn: () => { Cripta.entrar(); } },
      { label: 'Até mais' }]);
  }
  function montar() {
    const f = P.inv.frag_carta || 0;
    const opts = ARCANAS.map(([id, nome, arte, cslot, mods, n]) => ({
      label: `${arte} ${nome} (${SLOT_NOME[cslot]}) — ${modTxt(mods)} · ${n} 🧩${f >= n ? '' : ' 🔒'}`,
      fn: () => {
        if ((P.inv.frag_carta || 0) < n) { log(`Faltam <b>${n - (P.inv.frag_carta || 0)} 🧩 Fragmentos Arcanos</b> para a <b>${ITEMS[id].name}</b>. Eles caem na Cripta das Cartas.`, 'bad'); Audio8.sfx('miss'); montar(); return true; }
        P.inv.frag_carta -= n; P.inv[id] = (P.inv[id] || 0) + 1; Audio8.sfx('level'); burst(new THREE.Vector3(P.x, P.y + 1.4, P.z), 0xb080ff, 36, 3, 1);
        banner(`🃏 ${nome}`); log(`🃏 A Cartomante Zaíra montou a <b style="color:#c89aff">${ITEMS[id].name}</b>! Encaixe pela mochila (toque na peça de ${SLOT_NOME[cslot].toLowerCase()} que você está usando).`, 'gold');
        try { save(); } catch (e) { } montar(); return true;
      } }));
    opts.push({ label: '← Voltar', fn: () => { npc(); return true; } });
    dialog('🃏 Montar Carta Arcana', `Escolha a carta. Cada uma pede um tanto de 🧩 fragmentos. <small>Você tem <b>${f} 🧩</b>.</small>`, opts);
  }
  return { npc, montar, Cripta, ARCANAS, custo };
})();
