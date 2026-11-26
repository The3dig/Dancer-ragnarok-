// =====================================================================
//  Cidade Submersa — livro I, caps. 9 e 10.
//  "Uma cidade suspensa no vazio, de torres quebradas, pontes que
//  atravessavam o nada e cristais enormes presos às construções por
//  raízes." "Nós é que não estamos mais no Reino." "Entre um lugar e
//  outro." É "o lugar onde o Reino guarda aquilo que não consegue
//  destruir". "Não havia chão, mas a cada passo seus pés encontravam uma
//  superfície invisível." No fundo: Lyra, a irmã esquecida, coberta de
//  raízes negras, com o cristal que um dia uniu os três irmãos.
//  Chega-se caindo do fim da Ponte dos Mortos. Níveis 70 a 86.
//  O Refúgio Suspenso (a primeira ilha) foi criado para o jogo.
// =====================================================================
'use strict';
const Cidade = (() => {
  const B = { x0: 1050, z0: -880, w: 300, h: 240 }, LARG = 1.9;
  const ILHAS = CILHAS, PONTES = CPONTES.map(([a, b, t]) => ({ A: ILHAS[a], B: ILHAS[b], inv: t === 'invisivel' }));
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const ilhaDe = (x, z, r = 0) => ILHAS.findIndex(i => Math.hypot(x - i.x, z - i.z) < i.r - r);
  const naPonte = (x, z, r = 0) => PONTES.some(p => segD(x, z, p.A.x, p.A.z, p.B.x, p.B.z) < LARG - r);
  function h(x, z) { return ilhaDe(x, z) >= 0 || naPonte(x, z) ? 0.3 : -60; }
  function out(x, z, r = 0.45) { return ilhaDe(x, z, r + 0.3) < 0 && !naPonte(x, z, r); }
  function zona(x, z) { const i = ilhaDe(x, z); return i === 0 ? 'refugio' : i === 4 ? 'fundo' : 'cidade'; }
  CID_H = h; CID_OUT = out; CID_ZONA = zona;

  const G = new THREE.Group(); G.visible = false; scene.add(G);
  const ARQ = new THREE.Group(); G.add(ARQ);
  const ctex = (w, hh, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; draw(c.getContext('2d'), w, hh); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const GLOW = ctex(64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const brilho = (x, y, z, cor, s, op = 0.5, fog = true) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op, toneMapped: false, fog })); m.position.set(x, y, z); m.scale.setScalar(s); G.add(m); return m; };
  const pedra = PM('pedra.jpg', [2, 2], 0x7a7488), pedraE = PM('pedra.jpg', [1, 2], 0x4e4a5c), laje = PM('pedra.jpg', [6, 6], 0x8a8498), rocha = new THREE.MeshLambertMaterial({ color: 0x2a2432, flatShading: true });
  const raizM = new THREE.MeshLambertMaterial({ color: 0x140c14, emissive: 0x1a0610 });
  const cristais = [new THREE.MeshLambertMaterial({ color: 0x8a4aff, emissive: 0x4a10a0, emissiveIntensity: 1, flatShading: true }), new THREE.MeshLambertMaterial({ color: 0xffc860, emissive: 0x6a4010, emissiveIntensity: 1, flatShading: true })];
  // bloco de pedra com quinas chanfradas (nada de caixa reta)
  const bloco = (w, hh, d, bv = 0.12) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2 + bv, -hh / 2 + bv); sh.lineTo(w / 2 - bv, -hh / 2 + bv); sh.lineTo(w / 2 - bv, hh / 2 - bv); sh.lineTo(-w / 2 + bv, hh / 2 - bv); const g = new THREE.ExtrudeGeometry(sh, { depth: d - bv * 2, bevelEnabled: true, bevelSize: bv, bevelThickness: bv, bevelSegments: 2 }); g.translate(0, 0, -(d - bv * 2) / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3); return g; };

  // ---------------------------------------------------------------- as ilhas: laje em cima, rocha pontuda embaixo, raízes penduradas
  ILHAS.forEach((I, k) => {
    const topo = new THREE.Mesh(new THREE.CircleGeometry(I.r, 40).rotateX(-Math.PI / 2), laje); topo.position.set(I.x, 0.3, I.z); topo.receiveShadow = true; G.add(topo);
    const pts = [[I.r, 0.3], [I.r * 1.02, -0.4], [I.r * 0.9, -2.5], [I.r * 0.6, -I.r * 0.6], [I.r * 0.25, -I.r * 1.2], [0.5, -I.r * 1.6]].map(([r, y]) => new THREE.Vector2(r, y));
    const base = new THREE.LatheGeometry(pts, 18), ps = base.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < ps.count; i++) { v.fromBufferAttribute(ps, i); if (v.y < -0.5) { const n = 1 + Math.sin(v.x * 0.9 + k) * Math.cos(v.z * 0.8) * 0.18; v.x *= n; v.z *= n; ps.setXYZ(i, v.x, v.y, v.z); } }
    base.computeVertexNormals(); const b = new THREE.Mesh(base, rocha); b.position.set(I.x, 0, I.z); G.add(b);
    for (let j = 0; j < 7; j++) { const a = j / 7 * TAU + k, rr = I.r * rand(0.4, 0.9), x0 = Math.sin(a) * rr, z0 = Math.cos(a) * rr, L = rand(6, 16);
      const curva = [new THREE.Vector3(x0, -1, z0), new THREE.Vector3(x0 * 1.1, -L * 0.4, z0 * 1.1 + 0.5), new THREE.Vector3(x0 * 0.9 + 0.8, -L, z0 * 0.95)];
      const r = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curva), 10, rand(0.12, 0.3), 5), raizM); r.position.set(I.x, 0, I.z); ARQ.add(r); }
  });

  // ---------------------------------------------------------------- torres quebradas, arcos e muros pela beira das ilhas
  ILHAS.forEach((I, k) => {
    const n = k === 0 ? 3 : 6;
    for (let j = 0; j < n; j++) {
      const a = j / n * TAU + k * 0.7 + 0.3, rr = I.r - 2.6, x = I.x + Math.sin(a) * rr, z = I.z + Math.cos(a) * rr;
      if (PONTES.some(p => segD(x, z, p.A.x, p.A.z, p.B.x, p.B.z) < 5)) continue;          // não fecha a saída das pontes
      if (j % 2 === 0) {                                                                       // torre rachada, cortada torta
        const alt = rand(6, 16), t = new THREE.Mesh(new THREE.LatheGeometry([[2, 0], [1.9, 0.6], [1.6, 0.8], [1.5, alt * 0.85], [1.8, alt * 0.88], [1.8, alt]].map(([r, y]) => new THREE.Vector2(r, y)), 12, 0, TAU * rand(0.7, 1)), pedra);
        t.material = pedra; t.position.set(x, 0.3, z); t.rotation.set(rand(-0.1, 0.1), rand(0, 6), rand(-0.12, 0.12)); ARQ.add(t); addOb(x, z, 2.1);
        for (let q = 0; q < 4; q++) { const e = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.4, 0.9), 0), pedraE); e.position.set(x + rand(-3, 3), 0.5, z + rand(-3, 3)); e.rotation.set(rand(0, 3), rand(0, 3), 0); ARQ.add(e); }
      } else {                                                                                 // arco quebrado
        const g = new THREE.Group(); g.position.set(x, 0.3, z); g.rotation.y = a + Math.PI / 2; ARQ.add(g);
        for (const o of [-1.6, 1.6]) { const c = new THREE.Mesh(bloco(0.9, 5.4, 0.9), pedra); c.position.set(o, 2.7, 0); g.add(c); }
        const arco = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.4, 8, 16, Math.PI * rand(0.55, 1)), pedra); arco.position.y = 5.3; g.add(arco);
        addOb(x + Math.cos(a) * 1.6, z - Math.sin(a) * 1.6, 0.7); addOb(x - Math.cos(a) * 1.6, z + Math.sin(a) * 1.6, 0.7);
      }
    }
  });

  // ---------------------------------------------------------------- cristais enormes presos por raízes (muitos no Jardim de Cristais)
  const brilhosCristal = [];
  ILHAS.forEach((I, k) => {
    const n = k === 3 ? 9 : k === 0 ? 1 : 3;
    for (let j = 0; j < n; j++) {
      const a = j / n * TAU + k, rr = k === 3 ? rand(5, I.r - 4) : I.r - 5, x = I.x + Math.sin(a) * rr, z = I.z + Math.cos(a) * rr;
      if (PONTES.some(p => segD(x, z, p.A.x, p.A.z, p.B.x, p.B.z) < 4)) continue;
      const s = rand(1.2, 2.4), m = cristais[j % 2], c = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), m); c.scale.set(s * 0.8, s * 2.6, s * 0.8); c.position.set(x, 0.3 + s * 2.2, z); c.rotation.set(rand(-0.3, 0.3), rand(0, 6), rand(-0.3, 0.3)); ARQ.add(c);
      for (let q = 0; q < 3; q++) { const aa = q / 3 * TAU, pts = [new THREE.Vector3(Math.cos(aa) * s * 1.5, 0, Math.sin(aa) * s * 1.5), new THREE.Vector3(Math.cos(aa + 1) * s * 0.9, s * 2, Math.sin(aa + 1) * s * 0.9), new THREE.Vector3(Math.cos(aa + 2) * s * 0.5, s * 4, Math.sin(aa + 2) * s * 0.5)];
        const r = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.14, 5), raizM); r.position.set(x, 0.3, z); ARQ.add(r); }
      brilhosCristal.push(brilho(x, 0.3 + s * 2.2, z, j % 2 ? 0xffc860 : 0x9a5aff, s * 4, 0.35)); addOb(x, z, s);
    }
  });

  // ---------------------------------------------------------------- as pontes que atravessam o nada (e o caminho invisível)
  const degraus = [];
  for (const p of PONTES) {
    const dx = p.B.x - p.A.x, dz = p.B.z - p.A.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, ry = Math.atan2(dx, dz);
    const t0 = (p.A.r - 1) / L, t1 = 1 - (p.B.r - 1) / L;
    for (let t = t0; t < t1; t += 1.6 / L) {
      const x = p.A.x + dx * t, z = p.A.z + dz * t;
      if (p.inv) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.75, 6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd880, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); d.position.set(x + rand(-0.3, 0.3), 0.32, z + rand(-0.3, 0.3)); G.add(d); degraus.push(d); continue; }
      const s = new THREE.Mesh(bloco(LARG * 2, 0.5, 1.5, 0.08), pedra); s.position.set(x, 0.05, z); s.rotation.y = ry; s.rotation.z = rand(-0.02, 0.02); ARQ.add(s);
    }
    if (!p.inv) for (let t = t0; t < t1; t += 4 / L) for (const o of [-1, 1]) {   // corrimão quebrado
      const x = p.A.x + dx * t + uz * o * (LARG - 0.1), z = p.A.z + dz * t - ux * o * (LARG - 0.1); if (Math.random() < 0.3) continue;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, rand(0.6, 1.3), 6), pedraE); c.position.set(x, 0.7, z); ARQ.add(c); }
  }

  // ---------------------------------------------------------------- o vazio: estrelas, névoa roxa, pedras flutuando e uma luz dourada lá no fundo
  (function vazio() {
    const N = 900, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = rand(0, TAU), e = rand(-1, 1), r = 380; pos.set([B.x0 + B.w / 2 + Math.cos(a) * Math.sqrt(1 - e * e) * r, e * r * 0.6, B.z0 + B.h / 2 + Math.sin(a) * Math.sqrt(1 - e * e) * r], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const st = new THREE.Points(g, new THREE.PointsMaterial({ map: pontoTex(), alphaTest: 0.02, color: 0xd8c8ff, size: 1.6, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.85 })); st.frustumCulled = false; G.add(st);
    for (let i = 0; i < 14; i++) brilho(B.x0 + rand(-150, B.w + 150), rand(-80, 40), B.z0 + rand(-150, B.h + 150), [0x5a2a9a, 0x2a1a6a, 0x8a2a6a][i % 3], rand(90, 180), 0.18, false);
    brilho(B.x0 + B.w / 2, -220, B.z0 + B.h / 2, 0xffc860, 260, 0.35, false);                        // a Fonte? lá embaixo, uma luz que pulsa
  })();
  const pedras = (() => {
    const L = []; for (let i = 0; i < 60; i++) { const x = rand(B.x0 - 40, B.x0 + B.w + 40), z = rand(B.z0 - 40, B.z0 + B.h + 40); if (ilhaDe(x, z) >= 0 || naPonte(x, z, -6)) continue; L.push({ x, z, y: rand(-25, 18), s: rand(0.6, 3.2), r: rand(0, 6), v: rand(0.1, 0.4) }); }
    const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), rocha, L.length); im.frustumCulled = false; G.add(im); return { im, L };
  })();
  // torres distantes, flutuando de cabeça para baixo (silhuetas)
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, x = B.x0 + B.w / 2 + Math.cos(a) * 220, z = B.z0 + B.h / 2 + Math.sin(a) * 180, alt = rand(20, 40);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(3, 5, alt, 8), new THREE.MeshBasicMaterial({ color: 0x140e20, fog: false })); t.position.set(x, rand(-30, 30), z); t.rotation.z = rand(-2.6, 2.6); G.add(t); }

  // ---------------------------------------------------------------- o Refúgio Suspenso: lanternas e uma fogueira azul
  const lanternas = [];
  (function refugio() {
    const I = ILHAS[0];
    for (let j = 0; j < 8; j++) { const a = j / 8 * TAU, x = I.x + Math.sin(a) * (I.r - 1.2), z = I.z + Math.cos(a) * (I.r - 1.2);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6), pedraE); p.position.set(x, 1.4, z); ARQ.add(p); lanternas.push(brilho(x, 2.6, z, 0x9ad8ff, 1.6, 0.8)); }
    lanternas.push(brilho(I.x, 1.2, I.z, 0x6ab8ff, 3.2, 0.8)); addOb(I.x, I.z, 0.9);
    const luz = new THREE.PointLight(0x9ac8ff, 1.3, 30); luz.position.set(I.x, 4, I.z); G.add(luz);
    const l4 = new THREE.PointLight(0xffc860, 1.2, 30); l4.position.set(ILHAS[4].x, 5, ILHAS[4].z); G.add(l4);
    const l3 = new THREE.PointLight(0xb070ff, 1.0, 34); l3.position.set(ILHAS[3].x, 6, ILHAS[3].z); G.add(l3);
  })();

  // ---------------------------------------------------------------- passagens: a queda no fim da Ponte dos Mortos e a luz de volta
  const SWIRL = ctex(128, 128, g => { g.translate(64, 64); for (let k = 0; k < 5; k++) { g.rotate(TAU / 5); g.beginPath(); for (let t = 0; t < 1; t += 0.02) g.lineTo(Math.cos(t * 5) * t * 60, Math.sin(t * 5) * t * 60); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 5; g.stroke(); } });
  const queda = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: SWIRL, color: 0x9a5aff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  queda.position.set(VGATE_C.x, 0.65, VGATE_C.z); if (typeof Vale !== 'undefined' && Vale.G) Vale.G.add(queda); else scene.add(queda);
  const subida = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  subida.position.set(CGATE.x, 15, CGATE.z); G.add(subida); brilho(CGATE.x, 1, CGATE.z, 0xffe8b0, 4, 0.7);
  fundir(ARQ);

  // ---------------------------------------------------------------- mapas
  const map = { x0: B.x0, z0: B.z0, w: B.w, h: B.h, places: ILHAS.map(I => [I, I.n]).concat([[{ x: CGATE.x, z: CGATE.z + 4 }, '⬆ Vale']]), cities: [{ c: ILHAS[0], z: 'refugio', n: 'Refúgio Suspenso', R: 16 }] };
  function paint(W, H) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), img = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const wx = B.x0 + (i + 0.5) / W * B.w, wz = B.z0 + (j + 0.5) / H * B.h, o = (j * W + i) * 4, il = ilhaDe(wx, wz), pt = PONTES.find(p => segD(wx, wz, p.A.x, p.A.z, p.B.x, p.B.z) < LARG);
      let r = 14, g = 8, b = 26; if (il >= 0) { r = 110; g = 104; b = 124; } else if (pt) { if (pt.inv) { r = 120; g = 100; b = 50; } else { r = 96; g = 90; b = 108; } } else if ((i * 7 + j * 13) % 97 === 0) { r = g = b = 200; }
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
    const t = to === 'cidade' ? { x: CGATE.x + 9, z: CGATE.z, face: Math.PI / 2 } : { x: VGATE_C.x, z: VGATE_C.z + 9, face: 0 };
    P.x = t.x; P.z = t.z; P.y = groundY(P.x, P.z); P.vy = 0; P.face = t.face; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.yaw = P.face + Math.PI; camS.dist = Math.min(camS.dist, 12); camS.cur = 6;
    if (typeof AUTO !== 'undefined') { AUTO.cx = P.x; AUTO.cz = P.z; AUTO.chk = 0; AUTO.tgT = 0; }
    blackout(); Audio8.sfx('warp');
    if (to === 'cidade') { if (!P.cidadeSeen) { P.cidadeSeen = 1; log('🌌 A queda não terminava. Então a luz revelou uma forma colossal: <i>"uma cidade suspensa no vazio, de torres quebradas, pontes que atravessavam o nada e cristais enormes presos às construções por raízes."</i> <b>Nós é que não estamos mais no Reino.</b>', 'gold'); } }
    else log('A luz te puxa para cima: você voltou à <b>Ponte dos Mortos</b>.', 'sys');
  }
  let dentro = false, armada = true, cool = 0;
  function update(dt) {
    cool -= dt;
    const v = inCidade(P.x, P.z); if (v !== dentro) { dentro = v; G.visible = v; if (v) ensureMaps(); }
    queda.rotation.y += dt * 1.4;
    const dQ = Math.hypot(P.x - VGATE_C.x, P.z - VGATE_C.z), dS = Math.hypot(P.x - CGATE.x, P.z - CGATE.z);
    if (!armada && (v ? dS : dQ) > 6) armada = true;
    if (!P.dead && cool <= 0 && armada) {
      if (!v && inVale(P.x, P.z) && dQ < 2.4) { if (P.lv < 68) { if (typeof autoStop === 'function') autoStop(''); log('🌌 O abismo te devolve para a ponte. <b>A Cidade Submersa é para o nível 70</b> (a partir do 68).', 'bad'); P.z += 3; cool = 1.5; } else { cool = 1.5; armada = false; go('cidade'); return; } }
      if (v && dS < 2.6) { cool = 1.5; armada = false; go('vale'); return; }
    }
    if (!v) return;
    for (const d of degraus) { const dd = Math.hypot(P.x - d.position.x, P.z - d.position.z); d.material.opacity = Math.max(0, Math.min(0.85, (7 - dd) / 4)); }   // o caminho invisível aparece sob os pés
    for (const l of lanternas) l.material.opacity = 0.6 + Math.sin(time * 4 + l.position.x) * 0.2;
    for (const b of brilhosCristal) b.material.opacity = 0.28 + Math.sin(time * 1.5 + b.position.z) * 0.1;
    const m4 = new THREE.Matrix4(); pedras.L.forEach((o, i) => { m4.compose(new THREE.Vector3(o.x, o.y + Math.sin(time * o.v + o.r) * 1.2, o.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(time * o.v * 0.3, o.r + time * o.v * 0.2, 0)), new THREE.Vector3(o.s, o.s, o.s)); pedras.im.setMatrixAt(i, m4); }); pedras.im.instanceMatrix.needsUpdate = true;
  }
  return { update, map, G, get dentro() { return dentro; } };
})();
