// =====================================================================
//  🐦 Montarias. A primeira (e por enquanto única) é VALTRION, a Ave de Guerra Celeste,
//  prêmio secreto da aventura do Balhulk (ideia do Rone: o Balhulk era cavaleiro de crítico
//  no Ragnarok e montava um peco peco; aqui é uma criatura nossa, original, em homenagem).
//  Modelo 3D feito por código: corpo de penas azul-noite com borda dourada, armadura de peito,
//  crista de cristal, olhos que brilham, asas que abrem na corrida, cauda de plumas de luz,
//  pernas de corredora com garras douradas e sela de cavaleiro com estandarte.
//  Montado: +25% de velocidade. Montado não ataca: ao atacar ou usar habilidade, desce sozinho.
//  Não entra nas masmorras, na Arena nem na Guerra. Os outros jogadores veem a montaria.
// =====================================================================
'use strict';
const Montaria = (() => {
  const ID = 'valtrion', SELA = 2.02, VEL = 1.25;
  if (typeof ITEMS !== 'undefined') ITEMS[ID] = { name: 'Valtrion, a Ave de Guerra', ic: '🐦', kind: 'montaria', use: 'montaria', sell: 0, price: 0, desc: 'Montaria: +25% de velocidade. Montado não dá para lutar.' };
  const BLOQ = ['minas', 'cripta', 'eco', 'arena', 'forte'];

  // ---------------- materiais e peças (compartilhados por todas as Valtrion na tela)
  const M = {};
  function mats() {
    if (M.pena) return M;
    M.pena = new THREE.MeshLambertMaterial({ color: 0x24408e, side: THREE.DoubleSide });
    M.penaClara = new THREE.MeshLambertMaterial({ color: 0x3f68c8, side: THREE.DoubleSide });
    M.penaBorda = new THREE.MeshLambertMaterial({ color: 0xe8b84a, emissive: 0x3a2400, side: THREE.DoubleSide });
    M.corpo = new THREE.MeshLambertMaterial({ color: 0x2b4a9e });
    M.barriga = new THREE.MeshLambertMaterial({ color: 0xdfe6f8 });
    M.ouro = new THREE.MeshPhongMaterial({ color: 0xd9a63a, specular: 0xfff0c0, shininess: 90, emissive: 0x2a1800 });
    M.ouroEsc = new THREE.MeshPhongMaterial({ color: 0x8a6420, specular: 0xffe0a0, shininess: 60 });
    M.aco = new THREE.MeshPhongMaterial({ color: 0x9aa8c0, specular: 0xffffff, shininess: 110 });
    M.cristal = new THREE.MeshPhongMaterial({ color: 0x8ae8ff, emissive: 0x2a9ac0, specular: 0xffffff, shininess: 140, transparent: true, opacity: 0.92 });
    M.olho = new THREE.MeshBasicMaterial({ color: 0xffe27a, toneMapped: false });
    M.bico = new THREE.MeshPhongMaterial({ color: 0xf0c050, specular: 0xffffff, shininess: 70, emissive: 0x2a1a00 });
    M.perna = new THREE.MeshLambertMaterial({ color: 0x4a4058 });
    M.garra = new THREE.MeshPhongMaterial({ color: 0xffd870, emissive: 0x3a2a00, shininess: 100 });
    M.couro = new THREE.MeshLambertMaterial({ color: 0x6a2a1a });
    M.tecido = new THREE.MeshLambertMaterial({ color: 0xa8182a, side: THREE.DoubleSide });
    M.pluma = new THREE.MeshBasicMaterial({ color: 0x9ae0ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    M.plumaOuro = new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    M.halo = new THREE.SpriteMaterial({ map: glowTex(), color: 0x9ae0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    M.sombra = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
    // estandarte: o brasão do cavaleiro (escudo com espada) desenhado
    const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#a8182a'; g.fillRect(0, 0, 64, 128); g.fillStyle = '#7a0e1c'; g.fillRect(0, 0, 6, 128); g.fillRect(58, 0, 6, 128);
    g.fillStyle = '#e8b84a'; g.beginPath(); g.moveTo(32, 30); g.lineTo(50, 38); g.lineTo(48, 62); g.lineTo(32, 76); g.lineTo(16, 62); g.lineTo(14, 38); g.closePath(); g.fill();
    g.fillStyle = '#1b2a5a'; g.fillRect(30, 36, 4, 34); g.fillRect(22, 46, 20, 4); g.fillStyle = '#8ae8ff'; g.beginPath(); g.arc(32, 41, 3, 0, 6.3); g.fill();
    g.fillStyle = '#a8182a'; g.beginPath(); g.moveTo(0, 110); g.lineTo(32, 128); g.lineTo(64, 110); g.lineTo(64, 128); g.lineTo(0, 128); g.fill();
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    M.estandarte = new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 });
    return M;
  }
  function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
  const G = {};
  function geos() {
    if (G.pena) return G;
    // pena: folha com ponta (ShapeGeometry) — uma versão maior atrás faz a borda dourada
    const folha = (w, l) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(w, l * 0.35, w * 0.25, l * 0.92); s.lineTo(0, l); s.lineTo(-w * 0.25, l * 0.92); s.quadraticCurveTo(-w, l * 0.35, 0, 0); return new THREE.ShapeGeometry(s, 6); };
    G.pena = folha(0.16, 0.9); G.penaBorda = folha(0.2, 1.0); G.penaCurta = folha(0.14, 0.5); G.penaCurtaB = folha(0.17, 0.56);
    G.pluma = folha(0.22, 1.8); G.plumaB = folha(0.12, 1.5);
    G.esfera = new THREE.SphereGeometry(1, 20, 14);
    G.cil = new THREE.CylinderGeometry(1, 1, 1, 12);
    G.cone = new THREE.ConeGeometry(1, 1, 10);
    G.cristal = new THREE.OctahedronGeometry(1, 0);
    G.anel = new THREE.TorusGeometry(1, 0.18, 8, 20);
    G.disco = new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2);
    G.caixa = new THREE.BoxGeometry(1, 1, 1);
    G.estandarte = new THREE.PlaneGeometry(0.42, 0.84);
    return G;
  }
  const mesh = (geo, mat, par, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); par.add(m); return m; };
  // pena com borda dourada (a borda fica um tiquinho atrás)
  function pena(par, curta, mat) { const g = new THREE.Group(); mesh(curta ? G.penaCurtaB : G.penaBorda, M.penaBorda, g, 0, -0.03, -0.004); mesh(curta ? G.penaCurta : G.pena, mat || M.pena, g); par.add(g); return g; }

  // ---------------- a ave (modelo)
  function asaGeo() {
    if (G.asa) return G.asa;
    // silhueta da asa (x = para trás, y = para cima), com as pontas das penas recortadas
    const s = new THREE.Shape(); s.moveTo(0, 0.1); s.quadraticCurveTo(0.6, 0.34, 1.45, 0.16);
    [[1.38, -0.22], [1.2, -0.08], [1.08, -0.46], [0.88, -0.26], [0.76, -0.58], [0.56, -0.36], [0.42, -0.6], [0.22, -0.36], [0.06, -0.42]].forEach(([x, y]) => s.lineTo(x, y));
    s.quadraticCurveTo(-0.08, -0.2, 0, 0.1);
    const ext = o => new THREE.ExtrudeGeometry(s, { depth: o, bevelEnabled: false, curveSegments: 8 });
    G.asa = ext(0.04); G.asaBorda = ext(0.02); return G.asa;
  }
  function pluma(par, comp, mat, borda) {
    // pluma visível de todos os lados: dois planos cruzados
    const g = new THREE.Group(); par.add(g);
    for (const r of [0, Math.PI / 2]) { const m = new THREE.Mesh(G.pluma, mat); m.scale.set(1, comp / 1.8, 1); m.rotation.y = r; g.add(m); if (borda) { const b = new THREE.Mesh(G.plumaB, borda); b.scale.set(1.5, comp / 1.5 * 0.9, 1); b.rotation.y = r; b.position.y = 0.02; g.add(b); } }
    return g;
  }
  function criar() {
    mats(); geos(); asaGeo();
    const raiz = new THREE.Group(), corpo = new THREE.Group(); raiz.add(corpo);
    const o = { raiz, corpo, fase: 0, t: Math.random() * 10, abre: 0, piscaT: 2 };
    mesh(G.disco, M.sombra, raiz, 0, 0.03, 0, 1.2, 1, 1.7);
    // tronco alongado, mais alto no peito; costas azuis, barriga prateada
    corpo.position.y = 1.35;
    const tronco = mesh(G.esfera, M.corpo, corpo, 0, 0, 0, 0.6, 0.56, 1.0); tronco.rotation.x = -0.18;
    mesh(G.esfera, M.barriga, corpo, 0, -0.2, 0.15, 0.5, 0.38, 0.8).rotation.x = -0.18;
    mesh(G.esfera, M.penaClara, corpo, 0, 0.18, -0.2, 0.5, 0.36, 0.78);                          // dorso mais claro
    // armadura de peito em três placas e joia
    for (let i = 0; i < 3; i++) { const pl = mesh(G.esfera, i === 1 ? M.ouroEsc : M.ouro, corpo, 0, 0.18 - i * 0.2, 0.62 - i * 0.06, 0.42 - i * 0.05, 0.16, 0.3); pl.rotation.x = 0.45; }
    mesh(G.cristal, M.cristal, corpo, 0, 0.2, 0.92, 0.1, 0.17, 0.07);
    for (const s of [-1, 1]) { const ep = mesh(G.esfera, M.ouro, corpo, 0.46 * s, 0.24, 0.42, 0.2, 0.13, 0.24); ep.rotation.z = -0.5 * s; mesh(G.cone, M.ouro, corpo, 0.56 * s, 0.34, 0.42, 0.05, 0.16, 0.05).rotation.z = -0.9 * s; }
    // penas do flanco em escamas
    for (let i = 0; i < 12; i++) { const s = i % 2 ? -1 : 1, k = Math.floor(i / 2), p = pena(corpo, true, k % 2 ? M.penaClara : M.pena); p.position.set(0.5 * s, 0.05 - (k % 3) * 0.12, 0.35 - k * 0.17); p.rotation.set(-1.75, 0.28 * s, 0.2 * s); }
    // sela de cavaleiro
    const sela = new THREE.Group(); sela.position.set(0, 0.55, -0.12); corpo.add(sela);
    mesh(G.caixa, M.tecido, sela, 0, -0.06, -0.02, 0.98, 0.04, 0.86).rotation.x = -0.1;
    mesh(G.caixa, M.ouro, sela, 0, -0.08, -0.02, 1.02, 0.02, 0.9).rotation.x = -0.1;
    for (const s of [-1, 1]) mesh(G.caixa, M.tecido, sela, 0.5 * s, -0.32, -0.02, 0.04, 0.5, 0.7);        // manta caindo dos lados
    mesh(G.cil, M.couro, sela, 0, 0.03, 0, 0.32, 0.1, 0.36).rotation.x = Math.PI / 2;
    mesh(G.anel, M.ouro, sela, 0, 0.12, 0.3, 0.15, 0.15, 0.3);
    mesh(G.cil, M.couro, sela, 0, 0.1, -0.3, 0.3, 0.18, 0.06);
    for (const s of [-1, 1]) { mesh(G.cil, M.couro, sela, 0.52 * s, -0.42, 0.06, 0.018, 0.55, 0.018); mesh(G.anel, M.ouro, sela, 0.52 * s, -0.72, 0.06, 0.08, 0.08, 0.08).rotation.y = Math.PI / 2; }
    const mastro = mesh(G.cil, M.ouroEsc, sela, -0.36, 0.7, -0.46, 0.025, 1.6, 0.025); mastro.rotation.x = -0.12;
    o.bandeira = mesh(G.estandarte, M.estandarte, sela, -0.36, 1.08, -0.68); o.bandeira.rotation.y = Math.PI / 2;
    mesh(G.cristal, M.cristal, sela, -0.36, 1.52, -0.56, 0.06, 0.11, 0.06);
    // asas de verdade (dobradas dos lados; abrem na corrida)
    o.asas = [-1, 1].map(s => {
      const a = new THREE.Group(); a.position.set(0.55 * s, 0.32, 0.38); corpo.add(a);
      const w = new THREE.Group(); w.rotation.y = Math.PI / 2; a.add(w);
      const m1 = new THREE.Mesh(G.asa, M.pena); m1.position.z = -0.02 * s; w.add(m1);
      const m2 = new THREE.Mesh(G.asaBorda, M.penaBorda); m2.scale.set(1.04, 1.06, 1); m2.position.set(-0.01, -0.02, -0.035 * s); w.add(m2);
      a.userData.s = s; return a;
    });
    // pescoço longo em S (5 gomos finos) e cabeça com elmo e crista
    o.pesc = []; let par = corpo, py = 0.32, pz = 0.78;
    const curva = [0.55, -0.2, -0.25, -0.18, -0.1];
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group(); g.position.set(0, py, pz); g.userData.r0 = curva[i]; par.add(g);
      mesh(G.esfera, M.corpo, g, 0, 0.14, 0, 0.17 - i * 0.008, 0.22, 0.17 - i * 0.008);
      mesh(G.esfera, M.barriga, g, 0, 0.12, 0.07, 0.11, 0.18, 0.11);
      if (i === 0) mesh(G.anel, M.ouro, g, 0, 0.04, 0, 0.19, 0.19, 0.28).rotation.x = Math.PI / 2;    // colar dourado
      o.pesc.push(g); par = g; py = 0.24; pz = 0;
    }
    const cab = new THREE.Group(); cab.position.set(0, 0.3, 0.05); par.add(cab); o.cab = cab;
    mesh(G.esfera, M.corpo, cab, 0, 0, 0, 0.24, 0.22, 0.3);
    mesh(G.esfera, M.barriga, cab, 0, -0.07, 0.08, 0.18, 0.13, 0.22);
    const elmo = mesh(G.esfera, M.ouro, cab, 0, 0.08, 0.02, 0.26, 0.15, 0.3); elmo.rotation.x = -0.1;
    mesh(G.cone, M.ouro, cab, 0, 0.12, 0.3, 0.05, 0.22, 0.04).rotation.x = Math.PI / 2 + 0.3;       // ponta do elmo sobre o bico
    const bico = mesh(G.cone, M.bico, cab, 0, -0.03, 0.42, 0.1, 0.38, 0.085); bico.rotation.x = Math.PI / 2 + 0.12;
    mesh(G.cone, M.bico, cab, 0, -0.1, 0.34, 0.065, 0.22, 0.05).rotation.x = Math.PI / 2 + 0.45;
    o.olhos = [-1, 1].map(s => mesh(G.esfera, M.olho, cab, 0.17 * s, 0.03, 0.17, 0.05, 0.04, 0.035));
    // crista: penacho de luz para trás + três cristais
    o.crista = new THREE.Group(); o.crista.position.set(0, 0.16, -0.08); cab.add(o.crista);
    [[0, 0.2, -0.02, 0.06, 0.3, -0.7], [-0.08, 0.14, -0.08, 0.045, 0.22, -0.95], [0.08, 0.14, -0.08, 0.045, 0.22, -0.95]].forEach(([x, y, z, w, h, r]) => { const c = mesh(G.cristal, M.cristal, o.crista, x, y, z, w, h, w); c.rotation.x = r; c.rotation.z = x * 2.5; });
    o.penacho = [0, 1, 2].map(i => { const g = pluma(o.crista, 1.0 - i * 0.15, i === 0 ? M.plumaOuro : M.pluma); g.position.set((i - 1) * 0.06, 0.1, -0.05); g.rotation.set(-1.9 + i * 0.12, 0, (i - 1) * 0.25); return g; });
    o.halo = new THREE.Sprite(M.halo); o.halo.position.set(0, 0.42, -0.2); o.halo.scale.setScalar(0.8); cab.add(o.halo);
    // cauda: leque de 7 plumas longas de luz, com penas de base de borda dourada
    o.cauda = []; const cauda = new THREE.Group(); cauda.position.set(0, 0.22, -0.92); corpo.add(cauda);
    for (let i = 0; i < 7; i++) {
      const a = (i - 3) * 0.24, g1 = new THREE.Group(); cauda.add(g1);
      const base = pena(g1, false, M.pena); base.scale.set(1.3, 0.9, 1); base.rotation.y = Math.PI / 2;
      const g2 = new THREE.Group(); g2.position.y = 0.8; g1.add(g2);
      pluma(g2, 2.1 - Math.abs(i - 3) * 0.25, i === 3 ? M.plumaOuro : M.pluma, i % 2 ? null : M.plumaOuro);
      o.cauda.push({ g1, g2, a, i });
    }
    // pernas de corredora, bem à mostra
    o.pernas = [-1, 1].map(s => {
      const quadril = new THREE.Group(); quadril.position.set(0.3 * s, -0.28, -0.08); corpo.add(quadril);
      mesh(G.esfera, M.penaClara, quadril, 0, -0.18, 0.04, 0.2, 0.32, 0.24);
      const p1 = pena(quadril, true, M.pena); p1.position.set(0.12 * s, -0.12, -0.12); p1.rotation.set(-2.5, 0, 0.25 * s);
      const joelho = new THREE.Group(); joelho.position.set(0, -0.46, 0.06); quadril.add(joelho);
      mesh(G.cil, M.perna, joelho, 0, -0.3, 0, 0.06, 0.6, 0.06);
      mesh(G.cil, M.ouro, joelho, 0, -0.2, 0.025, 0.08, 0.34, 0.075);
      mesh(G.esfera, M.ouro, joelho, 0, 0, 0, 0.095, 0.095, 0.095);
      mesh(G.cone, M.ouro, joelho, 0, 0.03, 0.08, 0.035, 0.14, 0.03).rotation.x = Math.PI / 2;        // espora do joelho
      const pe = new THREE.Group(); pe.position.set(0, -0.6, 0); joelho.add(pe);
      mesh(G.esfera, M.perna, pe, 0, 0, 0.02, 0.085, 0.055, 0.1);
      for (const a of [-0.5, 0, 0.5]) { const d = new THREE.Group(); d.rotation.y = a; pe.add(d); mesh(G.cil, M.perna, d, 0, -0.03, 0.13, 0.028, 0.24, 0.028).rotation.x = Math.PI / 2; const g = mesh(G.cone, M.garra, d, 0, -0.05, 0.28, 0.034, 0.12, 0.034); g.rotation.x = Math.PI / 2 + 0.6; }
      mesh(G.cone, M.garra, pe, 0, -0.02, -0.12, 0.03, 0.1, 0.03).rotation.x = -Math.PI / 2 - 0.5;
      return { quadril, joelho, pe, s };
    });
    raiz.traverse(m => { if (m.isMesh && m.material !== M.sombra && !m.material.blending) m.castShadow = true; });
    raiz.scale.setScalar(1.08);
    return o;
  }

  // ---------------- animação (parada, andando, correndo)
  const P_TRAIL = new THREE.Vector3();
  function animar(o, dt, mov, vel) {
    o.t += dt; const t = o.t;
    const corre = mov ? Math.min(1, vel / 6) : 0;
    o.fase += dt * (mov ? 7 + vel * 1.1 : 0);
    const f = o.fase;
    // corpo: balanço da corrida ou respiração
    o.corpo.position.y = 1.45 + (mov ? Math.abs(Math.sin(f)) * 0.14 * corre - 0.04 : Math.sin(t * 2) * 0.025);
    o.corpo.rotation.x = mov ? 0.12 * corre + Math.sin(f * 2) * 0.03 : Math.sin(t * 1.3) * 0.02;
    o.corpo.rotation.z = mov ? Math.sin(f) * 0.05 : 0;
    // pernas: passada de ave (coxa vai e vem, joelho dobra na volta)
    for (const p of o.pernas) {
      const ph = f + (p.s > 0 ? 0 : Math.PI);
      if (mov) { p.quadril.rotation.x = Math.sin(ph) * 0.85 * corre; p.joelho.rotation.x = Math.max(0, -Math.cos(ph)) * 1.3 * corre - 0.15; p.pe.rotation.x = -p.quadril.rotation.x * 0.6 - p.joelho.rotation.x * 0.4; }
      else { p.quadril.rotation.x *= 0.85; p.joelho.rotation.x = p.joelho.rotation.x * 0.85 - 0.02; p.pe.rotation.x *= 0.85; }
    }
    // pescoço e cabeça: na corrida estica para a frente; parada, olha em volta e balança
    const olha = Math.sin(t * 0.45) * 0.5 + Math.sin(t * 1.7) * 0.1;
    o.pesc.forEach((g, i) => { g.rotation.x = g.userData.r0 + (mov ? 0.12 * corre * (i === 0 ? 1.5 : 0.3) + Math.sin(f * 2 + i) * 0.03 : Math.sin(t * 2 + i * 0.6) * 0.03); g.rotation.y = mov ? 0 : olha * 0.18; });
    o.cab.rotation.x = mov ? -0.1 - 0.2 * corre : Math.sin(t * 2.2) * 0.06 + 0.1; o.cab.rotation.y = mov ? 0 : olha * 0.3;
    // piscar
    o.piscaT -= dt; const pisca = o.piscaT < 0.12; if (o.piscaT < 0) o.piscaT = 2 + Math.random() * 4;
    for (const e of o.olhos) e.scale.y = pisca ? 0.008 : 0.045;
    // asas: abrem com a velocidade (e batem de leve), parada às vezes ajeita as penas
    o.abre += ((mov ? corre : 0) - o.abre) * Math.min(1, dt * 4);
    const ajeita = !mov && Math.sin(t * 0.9) > 0.97 ? Math.sin(t * 30) * 0.15 : 0;
    for (const a of o.asas) { const s2 = a.userData.s; a.rotation.z = -s2 * (o.abre * 1.1 + ajeita + Math.sin(f * 2.2) * 0.25 * o.abre); a.rotation.x = -o.abre * 0.2; }
    // cauda de luz: ondula; na corrida fica mais reta (esvoaçando)
    for (const c of o.cauda) { const elev = (mov ? 0.25 - corre * 0.2 : 0.55) + Math.sin(t * 1.6 + c.i * 0.5) * 0.05; c.g1.rotation.set(-(Math.PI / 2 - elev), 0, c.a * (mov ? 0.8 : 1.1) + Math.sin(t * 1.8 + c.i * 0.7) * 0.05); c.g2.rotation.x = Math.sin(t * 2.6 + c.i) * 0.12 - (mov ? Math.sin(f * 2 + c.i) * 0.2 : 0); }
    for (const [i, g] of o.penacho.entries()) g.rotation.x = -1.9 + i * 0.12 + Math.sin(t * 3 + i) * 0.08 - (mov ? 0.25 * corre : 0);
    // crista e estandarte
    o.halo.material.opacity = 0.55 + Math.sin(t * 3) * 0.25; o.halo.scale.setScalar(0.8 + Math.sin(t * 2.3) * 0.12);
    o.bandeira.rotation.y = Math.PI / 2 + Math.sin(t * 3 + f) * (0.12 + corre * 0.25);
    // rastro: penas douradas e brilho nos passos (só quando corre e só para quem está perto)
    if (mov && typeof VFX !== 'undefined' && Math.random() < dt * 9 * corre) {
      o.raiz.updateMatrixWorld(); P_TRAIL.set(0, 1.4, -1.6).applyMatrix4(o.raiz.matrixWorld);
      VFX.particle(P_TRAIL.clone(), Math.random() < 0.5 ? 0x9ae0ff : 0xffd060, { map: VFX.T.feather, size: 0.35, speed: 0.8, g: 1.5, life: 0.9, spin: true });
    }
    if (mov && typeof VFX !== 'undefined') {
      const passo = Math.floor(f / Math.PI); if (passo !== o.passo) { o.passo = passo; const p = o.pernas[passo % 2]; p.pe.updateMatrixWorld(); p.pe.getWorldPosition(P_TRAIL); VFX.wave(P_TRAIL.x, P_TRAIL.z, 0.45, 0xffd060, 0.45); }
    }
  }

  // ---------------- o seu personagem
  let minha = null, avisoT = 0;
  const tem = () => !!(P.inv && P.inv[ID] > 0);
  const podeAqui = () => { const z = typeof zoneOf === 'function' ? zoneOf(P.x, P.z) : ''; return !BLOQ.includes(z) && !(typeof inTower === 'function' && inTower(P.z) && !['torre', 'topo', 'abismo', 'abfundo'].includes(z)); };
  function subir() {
    if (!tem() || P.dead) return;
    if (!podeAqui()) { log('🐦 A Valtrion não entra aqui (masmorras, Arena e Guerra).', 'bad'); Audio8.sfx('miss'); return; }
    P.montado = true; P.sit = false; Audio8.sfx('buff');
    if (typeof VFX !== 'undefined') { VFX.flash(new THREE.Vector3(P.x, P.y + 1.4, P.z), 0x9ae0ff, 4, 0.4); VFX.wave(P.x, P.z, 2.6, 0xffd060, 0.6); for (let i = 0; i < 16; i++) VFX.particle(new THREE.Vector3(P.x, P.y + 1.2, P.z), i % 2 ? 0x9ae0ff : 0xffd060, { map: VFX.T.feather, size: 0.4, speed: 4, g: 2, life: 1, spin: true }); }
    if (!P.montouVez) { P.montouVez = 1; log('🐦 Você montou na <b>Valtrion</b>! <b>+25% de velocidade</b>. Montado não dá para lutar: ao atacar, você desce sozinho.', 'gold'); }
  }
  function descer(msg) { if (!P.montado) return; P.montado = false; Audio8.sfx('click'); if (msg) log(msg, 'sys'); }
  function alternar() { if (P.montado) descer(); else subir(); }
  function update(dt) {
    if (P.montado && (!tem() || P.dead || !podeAqui())) descer(P.dead ? null : '🐦 Você desceu da Valtrion (ela não entra aqui).');
    if (P.montado) {
      if (!minha) { minha = criar(); scene.add(minha.raiz); }
      minha.raiz.visible = true; minha.raiz.position.set(P.x, P.y, P.z); minha.raiz.rotation.y = P.face;
      animar(minha, dt, P.moving, P.moving ? stats.speed() : 0);
    } else if (minha) minha.raiz.visible = false;
  }
  const mult = () => (P.montado ? VEL : 1);
  const pres = () => (P.montado ? { mt: ID } : {});
  // ---------------- os outros jogadores (net.js chama a cada quadro)
  function remoto(r, s, mov, dt) {
    if (s.mt && s.st !== 'd') {
      if (!r.mont) { r.mont = criar(); r.g.add(r.mont.raiz); }
      r.mont.raiz.visible = true; const v = mov ? (r.vel = Math.hypot(r.tx - r.x, r.tz - r.z) / Math.max(dt, 0.016)) : 0; animar(r.mont, dt, mov, Math.min(9, v || 6));
      return true;
    }
    if (r.mont) r.mont.raiz.visible = false;
    return false;
  }
  return { ID, SELA, criar, animar, subir, descer, alternar, update, mult, pres, remoto, tem, podeAqui };
})();
