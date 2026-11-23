// =====================================================================
//  Rio das Memórias — livro I, cap. 11 ("O Sétimo Sino") e o começo do 12.
//  Os irmãos caem da Cidade Submersa num lago subterrâneo: "A água brilhava.
//  Sob a superfície havia milhares de pequenas luzes ... eram memórias:
//  rostos, batalhas, cidades, milhares de anos de história guardados ali."
//  Na margem, "uma porta enorme, diferente de todas as outras. Não tinha
//  fechadura, apenas uma marca no centro: três espinhos." Do outro lado,
//  "um céu branco. No centro dele, uma árvore imensa: raízes que atravessavam
//  o mundo, tronco de cristal e, no lugar das folhas, milhares de olhos."
//  O Guardião Branco (cap. 11) guarda o caminho até a Fonte.
//  Níveis 86 a 110. Chega-se caindo de O Fundo (Cidade Submersa).
//  Criado para o jogo: a Margem das Memórias (acampamento), as Galerias
//  Afogadas, os moradores e os monstros (nomes do jogo, baseados no livro).
// =====================================================================
'use strict';
const Memorias = (() => {
  const B = { x0: 1420, z0: -880, w: 300, h: 240 }, LARG = 2.2;
  const ILHAS = MILHAS, PONTES = MPONTES.map(([a, b]) => ({ A: ILHAS[a], B: ILHAS[b] }));
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const ilhaDe = (x, z, r = 0) => ILHAS.findIndex(i => Math.hypot(x - i.x, z - i.z) < i.r - r);
  const naPonte = (x, z, r = 0) => PONTES.some(p => segD(x, z, p.A.x, p.A.z, p.B.x, p.B.z) < LARG - r);
  function h(x, z) { return ilhaDe(x, z) >= 0 || naPonte(x, z) ? 0.3 : -2; }
  function out(x, z, r = 0.45) { return ilhaDe(x, z, r + 0.3) < 0 && !naPonte(x, z, r); }
  const ZN = ['margem', 'rio', 'rio', 'galerias', 'porta'];
  function zona(x, z) { const i = ilhaDe(x, z); return i >= 0 ? ZN[i] : 'rio'; }
  MEM_H = h; MEM_OUT = out; MEM_ZONA = zona;

  const G = new THREE.Group(); G.visible = false; scene.add(G);
  const ARQ = new THREE.Group(); G.add(ARQ);
  const ctex = (w, hh, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; draw(c.getContext('2d'), w, hh); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const GLOW = ctex(64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const brilho = (x, y, z, cor, s, op = 0.5) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op, toneMapped: false })); m.position.set(x, y, z); m.scale.setScalar(s); G.add(m); return m; };
  const pedra = PM('pedra.jpg', [2, 2], 0x5a6a74), laje = PM('pedra.jpg', [6, 6], 0x6a7a82), rocha = new THREE.MeshLambertMaterial({ color: 0x1a242a, flatShading: true });
  const cristalM = new THREE.MeshLambertMaterial({ color: 0x8ae8ff, emissive: 0x1a6a8a, emissiveIntensity: 1, flatShading: true });

  // ---------------------------------------------------------------- o lago: água escura que brilha por dentro
  const AGUA_T = ctex(512, 512, (g, w) => {
    g.fillStyle = '#04141c'; g.fillRect(0, 0, w, w);
    for (let k = 0; k < 900; k++) { const x = Math.random() * w, y = Math.random() * w, r = Math.random() * 2.2 + 0.4; g.fillStyle = `rgba(${150 + Math.random() * 100 | 0},${210 + Math.random() * 45 | 0},255,${Math.random() * 0.6 + 0.2})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  });
  AGUA_T.wrapS = AGUA_T.wrapT = THREE.RepeatWrapping; AGUA_T.repeat.set(6, 5);
  const agua = new THREE.Mesh(new THREE.PlaneGeometry(B.w + 80, B.h + 80).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: AGUA_T, color: 0x7ab8c8, toneMapped: false }));
  agua.position.set(B.x0 + B.w / 2, -0.35, B.z0 + B.h / 2); G.add(agua);
  // as memórias sob a água: rostos e luzes que passam devagar (livro: "rostos, batalhas, cidades")
  const ROSTO = ctex(64, 64, g => { g.strokeStyle = 'rgba(200,240,255,.9)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(32, 32, 16, 21, 0, 0, 7); g.stroke(); g.beginPath(); g.arc(25, 28, 2.5, 0, 7); g.arc(39, 28, 2.5, 0, 7); g.fillStyle = 'rgba(200,240,255,.9)'; g.fill(); g.beginPath(); g.arc(32, 40, 6, 0.2, Math.PI - 0.2); g.stroke(); });
  const lembr = [];
  for (let k = 0; k < 70; k++) {
    const x = B.x0 + Math.random() * B.w, z = B.z0 + Math.random() * B.h; if (ilhaDe(x, z, -3) >= 0) continue;
    const rosto = k % 5 === 0, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: rosto ? ROSTO : GLOW, color: rosto ? 0xbfefff : [0x9af0ff, 0xffe6a0, 0xc8a8ff][k % 3], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5, toneMapped: false }));
    m.position.set(x, -0.25, z); m.scale.setScalar(rosto ? 2.2 : rand(0.6, 1.4)); m.userData = { x, z, v: rand(0.2, 0.6), a: rand(0, 6) }; G.add(m); lembr.push(m);
  }

  // ---------------------------------------------------------------- margens de pedra (as "ilhas"), passarelas e a caverna
  ILHAS.forEach((I, k) => {
    const topo = new THREE.Mesh(new THREE.CircleGeometry(I.r, 40).rotateX(-Math.PI / 2), laje); topo.position.set(I.x, 0.3, I.z); topo.receiveShadow = true; G.add(topo);
    const borda = new THREE.Mesh(new THREE.CylinderGeometry(I.r + 0.4, I.r + 1.4, 2.6, 36, 1, true), rocha); borda.position.set(I.x, -1, I.z); G.add(borda);
    for (let j = 0; j < 9; j++) {                                                     // pedras e cristais azuis pela beira
      const a = j / 9 * TAU + k, rr = I.r - rand(1, 2.5), x = I.x + Math.sin(a) * rr, z = I.z + Math.cos(a) * rr;
      if (PONTES.some(p => segD(x, z, p.A.x, p.A.z, p.B.x, p.B.z) < 4.5)) continue;
      if (j % 3 === 0) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(rand(0.5, 1.1), 0), cristalM); c.scale.y = rand(1.8, 3); c.position.set(x, 1, z); c.rotation.set(rand(-0.3, 0.3), rand(0, 3), rand(-0.3, 0.3)); ARQ.add(c); brilho(x, 1.2, z, 0x8ae8ff, 3, 0.35); addOb(x, z, 0.9); }
      else { const e = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.6, 1.3), 0), rocha); e.position.set(x, 0.4, z); e.rotation.set(rand(0, 3), rand(0, 3), 0); ARQ.add(e); addOb(x, z, 1); }
    }
  });
  for (const p of PONTES) {                                                           // passarelas de pedra sobre a água
    const dx = p.B.x - p.A.x, dz = p.B.z - p.A.z, L = Math.hypot(dx, dz), n = Math.ceil(L / 1.6);
    for (let i = 0; i <= n; i++) { const t = i / n, x = p.A.x + dx * t, z = p.A.z + dz * t; if (ilhaDe(x, z, 1) >= 0) continue; const s = new THREE.Mesh(new THREE.CylinderGeometry(LARG + 0.2, LARG + 0.5, 0.7, 10), pedra); s.position.set(x, -0.05, z); s.rotation.y = rand(0, 3); ARQ.add(s); }
  }
  // estalactites penduradas no teto da caverna e colunas que descem até a água
  { const geo = new THREE.ConeGeometry(1, 1, 6), im = new THREE.InstancedMesh(geo, rocha, 120), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let k = 0; k < 120; k++) { const x = B.x0 + Math.random() * B.w, z = B.z0 + Math.random() * B.h, L = rand(4, 16), r = rand(0.6, 2.2); q.setFromEuler(new THREE.Euler(Math.PI, rand(0, 3), 0)); m4.compose(new THREE.Vector3(x, 34 - L / 2, z), q, new THREE.Vector3(r, L, r)); im.setMatrixAt(k, m4); }
    G.add(im); }
  const teto = new THREE.Mesh(new THREE.PlaneGeometry(B.w + 120, B.h + 120).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x0a1014 })); teto.position.set(B.x0 + B.w / 2, 34, B.z0 + B.h / 2); G.add(teto);

  // ---------------------------------------------------------------- a Margem das Memórias (acampamento): barracas, fogueira, lanternas
  const M0 = ILHAS[0], lanternas = [];
  { const lona = new THREE.MeshLambertMaterial({ color: 0x3a5a6a, side: THREE.DoubleSide }), mad = PM('madeira.jpg', [1, 1], 0x8a6a4a);
    for (const [dx, dz, ry] of [[-7, -6, 0.4], [7, -6, -0.4], [-8, 6, 2.6]]) { const b = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3, 4, 1, true), lona); b.position.set(M0.x + dx, 1.8, M0.z + dz); b.rotation.y = ry; ARQ.add(b); addOb(M0.x + dx, M0.z + dz, 2.4); }
    const fog = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.3, 10), rocha); fog.position.set(M0.x, 0.45, M0.z - 1); ARQ.add(fog); addOb(M0.x, M0.z - 1, 1.1); brilho(M0.x, 1.2, M0.z - 1, 0xffa050, 4, 0.8);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, x = M0.x + Math.sin(a) * 12, z = M0.z + Math.cos(a) * 12; const pau = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.4, 6), mad); pau.position.set(x, 1.5, z); ARQ.add(pau); lanternas.push(brilho(x, 2.8, z, 0x9af0ff, 1.4, 0.8)); }
    const l = new THREE.PointLight(0xffb070, 1.3, 26); l.position.set(M0.x, 4, M0.z); G.add(l); }

  // ---------------------------------------------------------------- a Porta dos Três Espinhos (livro): enorme, sem fechadura, uma marca no centro
  const PT = ILHAS[4], porta = new THREE.Group(); porta.position.set(PT.x + PT.r - 3, 0.3, PT.z); porta.rotation.y = -Math.PI / 2; G.add(porta);
  { const ped = PM('pedra.jpg', [1, 3], 0x8a9aa4), escura = new THREE.MeshLambertMaterial({ color: 0x0c1418 });
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.6, 13, 1.6), ped); c.position.set(s * 4.4, 6.5, 0); porta.add(c); }
    const verga = new THREE.Mesh(new THREE.BoxGeometry(10.6, 1.6, 1.8), ped); verga.position.y = 13.4; porta.add(verga);
    const folha = new THREE.Mesh(new THREE.BoxGeometry(7.2, 12, 0.6), escura); folha.position.set(0, 6, 0); porta.add(folha);
    const ESP = ctex(256, 256, g => { g.translate(128, 128); g.strokeStyle = '#ffe9a8'; g.lineWidth = 7; g.shadowColor = '#ffd060'; g.shadowBlur = 18; g.beginPath(); g.arc(0, 0, 100, 0, 7); g.stroke();
      for (let k = 0; k < 3; k++) { g.save(); g.rotate(k / 3 * TAU); g.beginPath(); g.moveTo(-14, 30); g.lineTo(0, -88); g.lineTo(14, 30); g.closePath(); g.fillStyle = '#ffe9a8'; g.fill(); g.restore(); } });
    const marca = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.MeshBasicMaterial({ map: ESP, transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false })); marca.position.set(0, 7, -0.32); marca.rotation.y = Math.PI; porta.add(marca); porta.userData.marca = marca;
    // pela fresta, a luz do céu branco do outro lado
    const fresta = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 11.6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); fresta.position.set(0, 6, -0.34); fresta.rotation.y = Math.PI; porta.add(fresta);
    const ceu = brilho(PT.x + PT.r + 2, 7, PT.z, 0xffffff, 26, 0.55);
    addOb(porta.position.x, PT.z - 2, 1.6); addOb(porta.position.x, PT.z + 2, 1.6); addOb(porta.position.x, PT.z, 1.6);
    const l = new THREE.PointLight(0xfff4d0, 1.4, 34); l.position.set(PT.x + 4, 8, PT.z); G.add(l); }
  const PORTA_PT = { x: porta.position.x - 3, z: PT.z };

  // luzes frias da caverna
  for (const I of ILHAS.slice(1)) { const l = new THREE.PointLight(0x6ad8ff, 0.9, 34); l.position.set(I.x, 7, I.z); G.add(l); }
  if (typeof fundir === 'function') fundir(ARQ);

  // ---------------------------------------------------------------- passagens: a queda em O Fundo e a luz de volta
  const SWIRL = ctex(128, 128, g => { g.translate(64, 64); for (let k = 0; k < 5; k++) { g.rotate(TAU / 5); g.beginPath(); for (let t = 0; t < 1; t += 0.02) g.lineTo(Math.cos(t * 5) * t * 60, Math.sin(t * 5) * t * 60); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 5; g.stroke(); } });
  const queda = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: SWIRL, color: 0x5ad8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  queda.position.set(MGATE_C.x, 0.65, MGATE_C.z); if (typeof Cidade !== 'undefined' && Cidade.G) Cidade.G.add(queda); else scene.add(queda);
  const subida = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x9af0ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  subida.position.set(MGATE.x, 15, MGATE.z); G.add(subida); brilho(MGATE.x, 1, MGATE.z, 0x9af0ff, 4, 0.7);

  // ---------------------------------------------------------------- mapas
  const map = { x0: B.x0, z0: B.z0, w: B.w, h: B.h, places: ILHAS.map(I => [I, I.n]).concat([[{ x: MGATE.x, z: MGATE.z + 4 }, '⬆ Cidade']]), cities: [{ c: ILHAS[0], z: 'margem', n: 'Margem das Memórias', R: 16 }] };
  function paint(W, H) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), img = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const wx = B.x0 + (i + 0.5) / W * B.w, wz = B.z0 + (j + 0.5) / H * B.h, o = (j * W + i) * 4, il = ilhaDe(wx, wz), pt = naPonte(wx, wz);
      let r = 6, g = 26, b = 36; if (il >= 0) { r = 96; g = 112; b = 120; } else if (pt) { r = 80; g = 92; b = 100; } else if ((i * 7 + j * 13) % 61 === 0) { r = 160; g = 230; b = 255; }
      img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); return c;
  }
  let painted = false;
  map.pintar = () => ensureMaps();
  function ensureMaps() { if (painted) return; painted = true; map.mm = paint(180, 144); map.base = paint(B.w, B.h); }

  // ---------------------------------------------------------------- atravessar
  function blackout() { const f = document.getElementById('tfade'); if (!f) return; f.style.transition = 'none'; f.style.opacity = 1; void f.offsetWidth; f.style.transition = 'opacity 1.2s'; requestAnimationFrame(() => requestAnimationFrame(() => { f.style.opacity = 0; })); }
  function go(to) {
    const t = to === 'memorias' ? { x: MGATE.x + 8, z: MGATE.z, face: Math.PI / 2 } : { x: MGATE_C.x - 6, z: MGATE_C.z, face: -Math.PI / 2 };
    P.x = t.x; P.z = t.z; P.y = groundY(P.x, P.z); P.vy = 0; P.face = t.face; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.yaw = P.face + Math.PI; camS.dist = Math.min(camS.dist, 12); camS.cur = 6;
    if (typeof AUTO !== 'undefined') { AUTO.cx = P.x; AUTO.cz = P.z; AUTO.chk = 0; AUTO.tgT = 0; }
    blackout(); Audio8.sfx('warp');
    if (to === 'memorias') { if (!P.memSeen) { P.memSeen = 1; log('💧 Você saltou — e dessa vez não havia abismo, mas água. <i>"A água brilhava. Sob a superfície havia milhares de pequenas luzes ... eram memórias: rostos, batalhas, cidades, milhares de anos de história guardados ali."</i> <b>Este é o Rio das Memórias.</b>', 'gold'); } else log('💧 Você voltou ao <b>Rio das Memórias</b>.', 'sys'); }
    else log('A luz te puxa para cima: você voltou para <b>O Fundo</b>, na Cidade Submersa.', 'sys');
  }
  let dentro = false, armada = true, cool = 0;
  const inMemX = (x, z) => inMem(x, z);
  function update(dt) {
    cool -= dt;
    const v = inMemX(P.x, P.z); if (v !== dentro) { dentro = v; G.visible = v; if (v) ensureMaps(); }
    queda.rotation.y += dt * 1.4;
    const dQ = Math.hypot(P.x - MGATE_C.x, P.z - MGATE_C.z), dS = Math.hypot(P.x - MGATE.x, P.z - MGATE.z);
    if (!armada && (v ? dS : dQ) > 6) armada = true;
    if (!P.dead && cool <= 0 && armada) {
      if (!v && inCidade(P.x, P.z) && dQ < 2.4) { if (P.lv < 84) { if (typeof autoStop === 'function') autoStop(''); log('💧 A água te devolve para O Fundo. <b>O Rio das Memórias é para o nível 86</b> (a partir do 84).', 'bad'); P.x -= 3; cool = 1.5; } else { cool = 1.5; armada = false; go('memorias'); return; } }
      if (v && dS < 2.6) { cool = 1.5; armada = false; go('cidade'); return; }
    }
    if (!v) return;
    for (const m of lembr) { const u = m.userData; u.a += dt * u.v * 0.2; m.position.x = u.x + Math.sin(u.a) * 3; m.position.z = u.z + Math.cos(u.a * 0.7) * 3; m.material.opacity = 0.3 + Math.sin(time * u.v * 2 + u.x) * 0.2; }
    for (const l of lanternas) l.material.opacity = 0.6 + Math.sin(time * 4 + l.position.x) * 0.2;
    if (porta.userData.marca) porta.userData.marca.material.opacity = 0.7 + Math.sin(time * 1.6) * 0.3;
    AGUA_T.offset.x = (time * 0.004) % 1; AGUA_T.offset.y = (time * 0.006) % 1;
  }
  // a porta: fechada; só os três irmãos abrem (livro). Falar perto dela mostra a passagem do livro.
  function nearest() {
    if (!dentro || Math.hypot(P.x - PORTA_PT.x, P.z - PORTA_PT.z) > 4) return null;
    return { label: '🚪 Tocar na Porta dos Três Espinhos', fn: () => dialog('🚪 A Porta dos Três Espinhos', '<i>"Não tinha fechadura, apenas uma marca no centro: três espinhos."</i><br>Você pousa a mão na marca. Ela brilha, mas a porta não abre.<br><br><i>"Falta alguém."</i> Só os três irmãos juntos abrem esta porta. Pela fresta, uma luz branca, e o silêncio de mil olhos olhando para você.', [{ label: 'Afastar a mão' }]) };
  }
  return { update, nearest, map, G, get dentro() { return dentro; } };
})();
