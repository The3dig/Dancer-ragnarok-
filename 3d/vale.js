// =====================================================================
//  Vale dos Mortos e Ponte dos Mortos — livro I, cap. 8.
//  "Desceram para um vale coberto de névoa. Não havia árvores nem pedras,
//  apenas milhares de pequenos montes espalhados pelo terreno. Túmulos."
//  A névoa sobe até a cintura, mãos pálidas saem da terra, vozes chamam
//  (o vale se alimenta de lembranças), uma mulher de vestido branco e sem
//  olhos diz "Você prometeu voltar". No céu, uma faixa escura atravessa o
//  horizonte como uma cicatriz. Ao norte, a Ponte dos Mortos, feita de
//  ossos, sobre o abismo — e nela, o Primeiro Guardião.
//  Mapa a leste da Floresta Morta (x > 650, z < -300), níveis 55 a 72.
//  A Vigília do Vale (o acampamento) foi criada para o jogo.
// =====================================================================
'use strict';
const Vale = (() => {
  const B = { x0: 700, z0: -880, w: 300, h: 240 };
  const CAMP = VIGIL, PX = 900, BORDA = -834, PLAT = { x: VGUARD.x, z: VGUARD.z + 1, r: 7 };
  const ROAD = [[VALE_GATE.x, VALE_GATE.z], [CAMP.x, CAMP.z], [790, -760], [840, -790], [880, -812], [PX, BORDA + 2]];
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  function dRoad(x, z) { let d = 1e9; for (let i = 0; i < ROAD.length - 1; i++) d = Math.min(d, segD(x, z, ROAD[i][0], ROAD[i][1], ROAD[i + 1][0], ROAD[i + 1][1])); return d; }
  const naPonte = (x, z) => z < BORDA + 1 && Math.abs(x - PX) < 1.9;
  const naPlat = (x, z) => Math.hypot(x - PLAT.x, z - PLAT.z) < PLAT.r;

  // ---------------------------------------------------------------- relevo: vale em tigela, abismo ao norte
  function h(x, z) {
    if (z < BORDA) return naPonte(x, z) || naPlat(x, z) ? 0.6 : -32;
    let b = Math.sin(x * 0.045) * Math.cos(z * 0.05) * 1.6 + Math.sin(x * 0.13 + z * 0.09) * 0.4 + 0.4;
    b *= smooth(3, 8, dRoad(x, z));
    b = lerp(b, 0.4, 1 - smooth(14, 22, Math.hypot(x - CAMP.x, z - CAMP.z)));
    b += 6 * smooth(30, 0, Math.min(x - B.x0, B.x0 + B.w - x, z - B.z0, B.z0 + B.h - z) - 10) * (z > BORDA + 6 ? 1 : 0);   // morros nas bordas
    b = lerp(b, 0.5, 1 - smooth(2, 8, z - BORDA));                                          // a beira do abismo é plana
    const e = Math.max(B.x0 + 8 - x, x - (B.x0 + B.w - 8), z - (B.z0 + B.h - 8), 0);
    return b + e * 1.6;
  }
  function out(x, z, r = 0.45) {
    if (x < B.x0 + 4 + r || x > B.x0 + B.w - 4 - r || z < B.z0 + 4 + r || z > B.z0 + B.h - 4 - r) return true;
    if (z < BORDA + r) { if (naPlat(x, z) && Math.hypot(x - PLAT.x, z - PLAT.z) < PLAT.r - r) return false; return !(Math.abs(x - PX) < 1.9 - r); }
    return false;
  }
  function zona(x, z) { if (Math.hypot(x - CAMP.x, z - CAMP.z) < 16) return 'vigilia'; if (z < BORDA + 4) return 'ponte'; return 'vale'; }
  VALE_H = h; VALE_OUT = out; VALE_ZONA = zona;

  function mix(x, z, y) {
    const n = Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.03 + Math.sin(x * 0.21 + z * 0.17) * 0.03;
    const t = [0.42 + n, 0.4 + n, 0.38 + n], w = [0.75, 0, 0, 0.1];
    if (dRoad(x, z) < 2.6) { w[0] = 1; t[0] = 0.5; t[1] = 0.44; t[2] = 0.38; }
    if (Math.hypot(x - CAMP.x, z - CAMP.z) < 13) { w[0] = 0.5; t[0] = 0.46; t[1] = 0.48; t[2] = 0.42; }
    if (z < BORDA + 3) { w[3] = 1; t[0] = t[1] = t[2] = 0.34; }
    return { t, w };
  }

  const G = new THREE.Group(); G.visible = false; scene.add(G);
  const ARQ = new THREE.Group(); G.add(ARQ);
  const ctex = (w, hh, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; draw(c.getContext('2d'), w, hh); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const GLOW = ctex(64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const brilho = (x, y, z, cor, s, op = 0.5) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op, toneMapped: false })); m.position.set(x, y, z); m.scale.setScalar(s); G.add(m); return m; };
  const osso = new THREE.MeshLambertMaterial({ color: 0xd8ceb4 }), terraM = new THREE.MeshLambertMaterial({ color: 0x3e3630 }), madeira = PM('madeira.jpg', [0.4, 1], 0x5a4a3a);
  const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

  // chão
  (function terreno() {
    const geo = new THREE.PlaneGeometry(B.w, B.h, TOUCH ? 150 : 220, TOUCH ? 120 : 176); geo.rotateX(-Math.PI / 2); geo.translate(B.x0 + B.w / 2, 0, B.z0 + B.h / 2);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), wts = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), y = h(x, z); pos.setY(i, y); const m = mix(x, z, y); col.set(m.t, i * 3); wts.set(m.w, i * 4); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aW', new THREE.BufferAttribute(wts, 4)); geo.computeVertexNormals();
    const t = new THREE.Mesh(geo, window.TERRAIN_MAT || new THREE.MeshLambertMaterial({ vertexColors: true })); t.receiveShadow = true; G.add(t);
    const fundo = new THREE.Mesh(new THREE.PlaneGeometry(400, 120).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x050307 })); fundo.position.set(B.x0 + B.w / 2, -30, B.z0 - 10); G.add(fundo);   // o fundo do abismo
  })();

  // ---------------------------------------------------------------- túmulos: milhares de montinhos, alguns com estaca de madeira
  (function tumulos() {
    const L = [];
    for (let i = 0; i < 6000 && L.length < (TOUCH ? 420 : 700); i++) {
      const x = rand(B.x0 + 30, B.x0 + B.w - 12), z = rand(BORDA + 8, B.z0 + B.h - 12);
      if (dRoad(x, z) < 3.5 || Math.hypot(x - CAMP.x, z - CAMP.z) < 20 || L.some(o => Math.abs(o.x - x) < 2.2 && Math.abs(o.z - z) < 2.2)) continue;
      L.push({ x, z, r: rand(-0.3, 0.3) + (Math.random() < 0.5 ? 0 : Math.PI / 2), s: rand(0.8, 1.2) });
    }
    const monte = new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); monte.scale(0.9, 0.6, 1.6);
    const im = new THREE.InstancedMesh(monte, terraM, L.length); im.frustumCulled = false; im.receiveShadow = true;
    L.forEach((o, i) => im.setMatrixAt(i, M4(o.x, h(o.x, o.z) - 0.05, o.z, 0, o.r, 0, o.s))); G.add(im);
    const estacas = L.filter((_, i) => i % 5 === 0), est = new THREE.CylinderGeometry(0.05, 0.07, 1.1, 5); est.translate(0, 0.5, 0);
    const im2 = new THREE.InstancedMesh(est, madeira, estacas.length); im2.frustumCulled = false;
    estacas.forEach((o, i) => im2.setMatrixAt(i, M4(o.x + Math.sin(o.r) * 1.2, h(o.x, o.z), o.z + Math.cos(o.r) * 1.2, rand(-0.2, 0.2), 0, rand(-0.2, 0.2)))); G.add(im2);
  })();

  // ---------------------------------------------------------------- névoa até a cintura (camadas que andam devagar)
  const NEVOA = ctex(256, 256, g => { for (let i = 0; i < 70; i++) { const x = Math.random() * 256, y = Math.random() * 256, r = 20 + Math.random() * 45, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(225,228,236,.5)'); gr.addColorStop(1, 'rgba(225,228,236,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    for (const [ox, oy] of [[256, 0], [-256, 0], [0, 256], [0, -256]]) { const g2 = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); g2.addColorStop(0, 'rgba(225,228,236,.5)'); g2.addColorStop(1, 'rgba(225,228,236,0)'); g.fillStyle = g2; g.fillRect(0, 0, 256, 256); } } });
  NEVOA.wrapS = NEVOA.wrapT = THREE.RepeatWrapping; NEVOA.repeat.set(5, 4);
  const camadas = [0.35, 0.8, 1.25].map((y, k) => { const t = NEVOA.clone(); t.needsUpdate = true; t.repeat.set(5 - k, 4 - k);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(B.w - 20, B.h - 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.28 - k * 0.07, depthWrite: false, color: 0xa8acb6 }));
    m.position.set(B.x0 + B.w / 2 + 10, y, B.z0 + B.h / 2 + 15); m.renderOrder = 3; G.add(m); return { m, t, v: 0.004 + k * 0.003 }; });
  // névoa no abismo, embaixo da ponte
  const abismo = Array.from({ length: 10 }, (_, i) => brilho(PX + rand(-60, 60), rand(-14, -4), rand(B.z0 + 2, BORDA - 4), 0x9a8aa8, rand(30, 50), 0.2));

  // ---------------------------------------------------------------- a cicatriz no céu: faixa escura atravessando o horizonte
  const cicatriz = (() => {
    const T = ctex(512, 64, g => { const r = g.createLinearGradient(0, 0, 0, 64); r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(0.4, 'rgba(40,8,16,.9)'); r.addColorStop(0.5, 'rgba(150,20,40,.95)'); r.addColorStop(0.6, 'rgba(40,8,16,.9)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 512, 64); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(900, 40), new THREE.MeshBasicMaterial({ map: T, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    m.position.set(B.x0 + B.w / 2, 70, B.z0 - 260); m.rotation.z = 0.12; G.add(m); return m;
  })();
  (function montanhas() {
    const P2 = [], C = [], I = [], cx = B.x0 + B.w / 2, cz = B.z0 + B.h / 2, n = 120;
    for (let i = 0; i <= n; i++) { const a = i / n * TAU, x = cx + Math.cos(a) * (B.w / 2 + 80), z = cz + Math.sin(a) * (B.h / 2 + 80), hh = 26 + 26 * (0.5 + 0.5 * Math.sin(a * 5 + 0.7) * Math.cos(a * 2.3));
      P2.push(x, -40, z, x, hh, z); C.push(0.1, 0.09, 0.11, 0.24, 0.22, 0.26); if (i < n) { const b = i * 2; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setIndex(I);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false })); m.frustumCulled = false; G.add(m);
  })();

  // ---------------------------------------------------------------- a Ponte dos Mortos: ossos em vez de pedra
  (function ponte() {
    const L = BORDA - (PLAT.z + PLAT.r - 1), zc = (BORDA + PLAT.z + PLAT.r - 1) / 2;
    for (let z = BORDA; z > PLAT.z + PLAT.r - 1.5; z -= 0.55) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 3.2, 3, 6), osso); b.rotation.z = Math.PI / 2; b.rotation.y = rand(-0.06, 0.06); b.position.set(PX, 0.45, z); ARQ.add(b); }   // tábuas de osso
    for (const o of [-1, 1]) { const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, L, 3, 6), osso); c.rotation.x = Math.PI / 2; c.position.set(PX + o * 1.85, 1.3, zc); ARQ.add(c); }   // corrimão
    for (let z = BORDA - 1; z > PLAT.z + PLAT.r; z -= 2.4) for (const o of [-1, 1]) {           // costelas em arco dos dois lados
      const pts = [new THREE.Vector3(0, -2.6, 0), new THREE.Vector3(o * 0.7, -0.8, 0), new THREE.Vector3(o * 0.4, 1.2, 0), new THREE.Vector3(0, 2.2, 0)];
      const r = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.09, 5), osso); r.position.set(PX + o * 1.8, 0.4, z); ARQ.add(r);
    }
    for (let z = BORDA - 2; z > PLAT.z + PLAT.r; z -= 5) { const v = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), osso); v.scale.set(1.3, 0.6, 0.9); v.position.set(PX, -0.4, z); ARQ.add(v); }   // vértebras embaixo
    // a plataforma do fim, cercada de ossos grandes e um crânio colossal
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(PLAT.r, PLAT.r - 1, 1.2, 24), osso); pl.position.set(PLAT.x, 0, PLAT.z); ARQ.add(pl);
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; if (Math.abs(Math.sin(a)) < 0.3 && Math.cos(a) > 0) continue; const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 3 + (k % 3), 3, 6), osso); b.position.set(PLAT.x + Math.sin(a) * (PLAT.r - 0.3), 1.6, PLAT.z + Math.cos(a) * (PLAT.r - 0.3)); b.rotation.set(Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25); ARQ.add(b); }
    const cr = new THREE.Mesh(new THREE.SphereGeometry(3.4, 16, 12), osso); cr.scale.set(1, 0.9, 1.1); cr.position.set(PLAT.x, 2.5, PLAT.z - PLAT.r - 2.5); ARQ.add(cr);
    for (const o of [-1, 1]) { const ol = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), new THREE.MeshBasicMaterial({ color: 0x0a0608 })); ol.position.set(PLAT.x + o * 1.2, 3.0, PLAT.z - PLAT.r + 0.4); G.add(ol); brilho(PLAT.x + o * 1.2, 3.0, PLAT.z - PLAT.r + 0.6, 0xffd040, 1.6, 0.6); }
    brilho(PLAT.x, 3, PLAT.z, 0xffe0a0, 6, 0.25);
  })();

  // ---------------------------------------------------------------- a Vigília do Vale: paliçada, tendas, lanternas e o sino
  const lanternas = [], sino = {};
  (function vigilia() {
    const y0 = h(CAMP.x, CAMP.z);
    for (let k = 0; k < 40; k++) { const a = k / 40 * TAU; if (Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))) < 0.25 || Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.25) continue;   // portões a oeste e a leste
      const x = CAMP.x + Math.sin(a) * 15, z = CAMP.z + Math.cos(a) * 15, e = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.6 + (k % 3) * 0.3, 6), madeira); e.position.set(x, h(x, z) + 1.2, z); ARQ.add(e);
      const p = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.4, 6), madeira); p.position.set(x, h(x, z) + 2.7 + (k % 3) * 0.15, z); ARQ.add(p); addOb(x, z, 0.5); }
    const lona = [0x6a6258, 0x58544e, 0x7a6a5a];
    [[-7, -8, 0.3], [8, -9, -0.5], [-9, 6, 2.4]].forEach(([dx, dz, r], i) => {
      const x = CAMP.x + dx, z = CAMP.z + dz, tg = new THREE.Group(); tg.position.set(x, h(x, z), z); tg.rotation.y = r; ARQ.add(tg);
      const t = new THREE.Mesh(new THREE.LatheGeometry([[2.6, 0], [2.4, 0.5], [1.8, 1.4], [1.0, 2.4], [0.2, 3.1], [0.05, 3.2]].map(([a, b]) => new THREE.Vector2(a, b)), 12, 0.4, TAU - 0.8), new THREE.MeshLambertMaterial({ color: lona[i], side: THREE.DoubleSide })); tg.add(t);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.8, 6), madeira); m.position.y = 1.9; tg.add(m); addOb(x, z, 2.2); });
    for (const [dx, dz] of [[-12, 0], [12, 0], [0, -12], [0, 11], [-8, 10], [9, 9]]) { const x = CAMP.x + dx, z = CAMP.z + dz;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 6), madeira); p.position.set(x, h(x, z) + 1.2, z); ARQ.add(p);
      lanternas.push(brilho(x, h(x, z) + 2.5, z, 0xffc070, 1.8, 0.8)); }
    // o sino (os sete sinos do livro tocam nas montanhas; aqui a Vigília tem o seu)
    const sx = CAMP.x + 2, sz = CAMP.z + 1, sy = h(sx, sz);
    for (const o of [-1.2, 1.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.6, 6), madeira); p.position.set(sx + o, sy + 1.8, sz); ARQ.add(p); }
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.8, 6).rotateZ(Math.PI / 2), madeira); tr.position.set(sx, sy + 3.5, sz); ARQ.add(tr);
    const b = new THREE.Mesh(new THREE.LatheGeometry([[0.05, 0], [0.35, -0.1], [0.5, -0.6], [0.7, -1.1], [0.75, -1.2]].map(([a, c]) => new THREE.Vector2(a, c)), 16), new THREE.MeshPhongMaterial({ color: 0x8a6a2a, shininess: 60, side: THREE.DoubleSide }));
    b.position.set(sx, sy + 3.4, sz); G.add(b); sino.m = b; addOb(sx, sz, 1.4);
    const luz = new THREE.PointLight(0xffb060, 1.2, 30); luz.position.set(CAMP.x, y0 + 4, CAMP.z); G.add(luz);
  })();

  // passagens (Floresta Morta ↔ Vale)
  if (typeof Valdora !== 'undefined' && Valdora.arch) {
    Valdora.arch(G, VALE_GATE.x - 1, VALE_GATE.z, -Math.PI / 2, '← Floresta Morta', h(VALE_GATE.x - 1, VALE_GATE.z));
    if (typeof Floresta !== 'undefined' && Floresta.G) Valdora.arch(Floresta.G, FGATE_V.x + 1, FGATE_V.z, Math.PI / 2, 'Vale dos Mortos →', groundY(FGATE_V.x + 1, FGATE_V.z));
  }
  fundir(ARQ);

  // ---------------------------------------------------------------- mapas
  const map = { x0: B.x0, z0: B.z0, w: B.w, h: B.h, places: [[CAMP, 'Vigília do Vale'], [{ x: 850, z: -760 }, 'Túmulos'], [{ x: PX, z: BORDA - 6 }, 'Ponte dos Mortos'], [{ x: VALE_GATE.x + 4, z: VALE_GATE.z }, '← Floresta']], cities: [{ c: CAMP, z: 'vigilia', n: 'Vigília do Vale', R: 16 }] };
  function paint(W, H) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), img = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const wx = B.x0 + (i + 0.5) / W * B.w, wz = B.z0 + (j + 0.5) / H * B.h, o = (j * W + i) * 4; let r, g, b;
      if (wz < BORDA) { if (naPonte(wx, wz) || naPlat(wx, wz)) { r = 216; g = 206; b = 180; } else { r = 12; g = 8; b = 14; } }
      else if (dRoad(wx, wz) < 2.6) { r = 120; g = 104; b = 88; } else { const v = 70 + Math.sin(wx * 0.9) * Math.cos(wz * 0.8) * 8; r = v; g = v - 4; b = v; }
      img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); return c;
  }
  let painted = false;
  map.pintar = () => ensureMaps();
  function ensureMaps() { if (painted) return; painted = true; map.mm = paint(180, 144); map.base = paint(B.w, B.h); }

  // ---------------------------------------------------------------- atravessar (Floresta ↔ Vale)
  function blackout() { const f = document.getElementById('tfade'); if (!f) return; f.style.transition = 'none'; f.style.opacity = 1; void f.offsetWidth; f.style.transition = 'opacity .7s'; requestAnimationFrame(() => requestAnimationFrame(() => { f.style.opacity = 0; })); }
  function go(to) {
    const t = to === 'vale' ? { x: VALE_GATE.x + 15, z: VALE_GATE.z, face: Math.PI / 2 } : { x: FGATE_V.x - 15, z: FGATE_V.z, face: -Math.PI / 2 };
    P.x = t.x; P.z = t.z; P.y = groundY(P.x, P.z); P.vy = 0; P.face = t.face; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.yaw = P.face + Math.PI; camS.dist = Math.min(camS.dist, 12); camS.cur = 6;
    if (typeof AUTO !== 'undefined') { AUTO.cx = P.x; AUTO.cz = P.z; AUTO.chk = 0; AUTO.tgT = 0; }
    blackout(); Audio8.sfx('warp');
    if (to === 'vale') { if (!P.valeSeen) { P.valeSeen = 1; log('🌫️ <i>"Desceram para um vale coberto de névoa. Não havia árvores nem pedras, apenas milhares de pequenos montes espalhados pelo terreno. Túmulos."</i> <b>Não responda às vozes.</b>', 'gold'); } }
    else log('Você voltou à <b>Floresta Morta</b>.', 'sys');
  }
  let dentro = false, armada = true, cool = 0, sinoT = 20;
  function update(dt) {
    cool -= dt;
    const v = inVale(P.x, P.z); if (v !== dentro) { dentro = v; G.visible = v; if (v) ensureMaps(); }
    const dF = Math.hypot(P.x - FGATE_V.x, P.z - FGATE_V.z), dV = Math.hypot(P.x - VALE_GATE.x, P.z - VALE_GATE.z);
    if (!armada && (v ? dV : dF) > 7) armada = true;
    if (!P.dead && cool <= 0 && armada) {
      if (!v && inFlo(P.x, P.z) && dF < 3.4) { if (P.lv < 53) { if (dF < 2) { if (typeof autoStop === 'function') autoStop(''); log('🌫️ A névoa te empurra de volta. <b>O Vale dos Mortos é para o nível 55</b> (a partir do 53).', 'bad'); P.x -= 3; } } else { cool = 1.5; armada = false; go('vale'); return; } }
      if (v && dV < 3.4) { cool = 1.5; armada = false; go('floresta'); return; }
    }
    if (!v) return;
    for (const c of camadas) { c.t.offset.x += dt * c.v; c.t.offset.y += dt * c.v * 0.6; }
    for (const l of lanternas) l.material.opacity = 0.65 + Math.sin(time * 6 + l.position.x) * 0.15;
    for (const a of abismo) a.position.x += Math.sin(time * 0.2 + a.position.z) * dt * 0.8;
    cicatriz.material.opacity = 0.75 + Math.sin(time * 0.5) * 0.2;
    if (sino.m) { sino.m.rotation.z = Math.sin(time * 1.2) * 0.04; if ((sinoT -= dt) <= 0) { sinoT = rand(40, 90); sino.t = 2; if (Math.hypot(P.x - CAMP.x, P.z - CAMP.z) < 60) log('🔔 <i>Ao longe, um sino tocou. Uma vez. Depois outra.</i>', 'sys'); } if (sino.t > 0) { sino.t -= dt; sino.m.rotation.z = Math.sin(time * 9) * 0.3 * sino.t / 2; } }
  }
  return { update, map, G, get dentro() { return dentro; } };
})();
