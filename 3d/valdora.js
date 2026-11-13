// =====================================================================
//  Valdora — mapa novo ao norte do Reino (livro I, caps. 14 e 15).
//  "A estrada até Valdora estava destruída: casas queimadas, carroças
//  abandonadas, corpos cobertos por panos, trechos inteiros tomados por
//  raízes negras." Do alto da colina, a cidade: muralhas destruídas,
//  torres queimando, criaturas nas ruas e, no centro, três espinhos
//  desenhados com sangue. Na praça, a estátua do pai com a espada.
//  Fica fora do mapa do Reino (z < -300) e se chega pela Passagem do
//  Norte, nas Areias Rubras, como os mapas ligados do Ragnarok.
//  Só o mapa onde o jogador está é desenhado (o celular agradece).
// =====================================================================
'use strict';
const Valdora = (() => {
  const B = { x0: -150, z0: -860, w: 300, h: 220 };
  const CAMP = VCAMP, HILL = VHILL, CITY = VCITY, CR = 36;
  const ROAD = [[VGATE_V.x, VGATE_V.z], [-110, -672], [-80, -697], [-45, -720], [HILL.x, HILL.z], [22, -752], [55, -775], [CITY.x, CITY.z]];
  const GATE_A = Math.atan2(55 - CITY.x, -775 - CITY.z);              // ângulo do portão da cidade (visto do centro)
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  function dRoad(x, z) { let d = 1e9; for (let i = 0; i < ROAD.length - 1; i++) d = Math.min(d, segD(x, z, ROAD[i][0], ROAD[i][1], ROAD[i + 1][0], ROAD[i + 1][1])); return d; }

  // ---------------------------------------------------------------- relevo
  function h(x, z) {
    let b = Math.sin(x * 0.045) * Math.cos(z * 0.052) * 2.4 + Math.sin(x * 0.12 + z * 0.08) * 0.8 + Math.cos(z * 0.15 - x * 0.05) * 0.4 + 0.6;
    b *= smooth(3, 10, dRoad(x, z));
    const dh = Math.hypot(x - HILL.x, z - HILL.z); b += 7 * Math.exp(-(dh * dh) / 400);           // a colina de onde se vê a cidade
    const dc = Math.hypot(x - CITY.x, z - CITY.z); b = lerp(b, 1.0, 1 - smooth(CR + 2, CR + 14, dc));
    const dk = Math.hypot(x - CAMP.x, z - CAMP.z); b = lerp(b, 0.6, 1 - smooth(14, 24, dk));
    const e = Math.max(B.x0 + 8 - x, x - (B.x0 + B.w - 8), B.z0 + 8 - z, (z - (B.z0 + B.h - 8)) * smooth(4, 12, Math.abs(x - VGATE_V.x)), 0);
    return b + e * 1.6;
  }
  const out = (x, z, r = 0.45) => x < B.x0 + 4 + r || x > B.x0 + B.w - 4 - r || z < B.z0 + 4 + r || z > B.z0 + B.h - 2 - r;

  // cor e mistura de texturas do chão: cinza queimado, terra na estrada, calçada na cidade, rocha na colina
  function mix(x, z, y) {
    const n = Math.sin(x * 0.9) * Math.cos(z * 0.7) * 0.03 + Math.sin(x * 0.31 + z * 0.17) * 0.04;
    const t = [0.56 + n, 0.5 + n, 0.5 + n], w = [0.55, 0, 0, 0];
    const rd = dRoad(x, z), dc = Math.hypot(x - CITY.x, z - CITY.z), dh = Math.hypot(x - HILL.x, z - HILL.z);
    if (rd < 3.6) { w[0] = 1; t[0] = 0.62; t[1] = 0.54; t[2] = 0.48; }
    if (dc < CR - 1) { w[2] = 1; const k = ((Math.floor(x * 0.8) + Math.floor(z * 0.8)) & 1) * 0.04; t[0] = t[1] = t[2] = 0.55 + k + n; }
    if (dh < 18) w[3] = Math.max(w[3], 0.6 * (1 - dh / 18));
    const root = Math.abs(Math.sin(x * 0.33 + Math.sin(z * 0.21) * 2.4) + Math.cos(z * 0.29 + Math.sin(x * 0.17)));
    if (root < 0.06 && dc > CR && Math.sin(x * 0.05) * Math.cos(z * 0.06) > 0.2) { t[0] = 0.25; t[1] = 0.18; t[2] = 0.22; }                          // veios de raiz negra no chão
    const dk = Math.hypot(x - CAMP.x, z - CAMP.z); if (dk < 14) { w[0] = Math.max(w[0], 0.5); t[0] = 0.7; t[1] = 0.62; t[2] = 0.52; }
    return { t, w };
  }

  // ---------------------------------------------------------------- tudo do mapa vai num grupo (some quando você está no Reino)
  const G = new THREE.Group(); G.visible = false; scene.add(G);
  const ctex = (w, hh, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; draw(c.getContext('2d'), w, hh); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const FIRE = ctex(64, 128, g => { const r = g.createRadialGradient(32, 92, 2, 32, 80, 50); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.25, 'rgba(255,180,60,.95)'); r.addColorStop(0.6, 'rgba(255,70,20,.5)'); r.addColorStop(1, 'rgba(120,0,0,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(62, 70, 32, 124); g.quadraticCurveTo(2, 70, 32, 4); g.fill(); });
  const SMOKE = ctex(64, 64, g => { for (let i = 0; i < 10; i++) { const x = 16 + Math.random() * 32, y = 16 + Math.random() * 32, r = g.createRadialGradient(x, y, 0, x, y, 22); r.addColorStop(0, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); } });
  const GLOW = ctex(64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const add = (o, x, y, z) => { o.position.set(x, y, z); G.add(o); return o; };
  const box = (w, hh, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; G.add(o); return o; };
  const fires = [], smokes = [];
  function fire(x, y, z, s = 1, col = 0xffffff) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: col })); f.scale.set(1.2 * s, 2.2 * s, 1); add(f, x, y + 1.0 * s, z);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.4, color: 0xff6a20 })); gl.scale.setScalar(5 * s); add(gl, x, y + 0.8 * s, z);
    fires.push({ f, gl, s, ph: Math.random() * 9 });
  }
  // coluna de fumaça: alguns sprites que sobem, crescem e somem (perto e no horizonte)
  function smoke(x, y, z, s = 1, n = 5) { for (let i = 0; i < n; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, transparent: true, depthWrite: false, color: 0x2a2224, opacity: 0, fog: s < 3 })); add(m, x, y, z); smokes.push({ m, x, y, z, s, k: i / n }); } }

  // ---------------------------------------------------------------- chão
  (function terrain() {
    const geo = new THREE.PlaneGeometry(B.w, B.h, TOUCH ? 150 : 240, TOUCH ? 110 : 176); geo.rotateX(-Math.PI / 2); geo.translate(B.x0 + B.w / 2, 0, B.z0 + B.h / 2);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), wts = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), y = h(x, z); pos.setY(i, y); const m = mix(x, z, y); col.set(m.t, i * 3); wts.set(m.w, i * 4); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aW', new THREE.BufferAttribute(wts, 4)); geo.computeVertexNormals();
    const t = new THREE.Mesh(geo, window.TERRAIN_MAT || new THREE.MeshLambertMaterial({ vertexColors: true })); t.receiveShadow = true; G.add(t);
  })();

  // ---------------------------------------------------------------- materiais
  const charM = PM('reboco.jpg', [1.5, 1.2], 0x4a3a34), charM2 = PM('madeira.jpg', [1, 1], 0x2a1e1a), roofM = PM('telha.jpg', [2, 1.5], 0x5a3a34);
  const stoneM = PM('pedra.jpg', [2, 1.6], 0x8a8090), stoneD = PM('pedra.jpg', [1, 2], 0x6a6070), woodM = PM('madeira.jpg', [1, 1], 0x6a5038);
  const rootM = new THREE.MeshLambertMaterial({ color: 0x140c10, emissive: 0x2a0408, emissiveIntensity: 0.6 });
  const clothM = new THREE.MeshLambertMaterial({ color: 0xb8ae9a });
  const emberM = new THREE.MeshBasicMaterial({ color: 0xff6a20, toneMapped: false });

  // casa queimada: paredes escuras, telhado afundado, brasas na janela
  function burned(x, z, ry, s = 1) {
    const g = new THREE.Group(); g.position.set(x, h(x, z), z); g.rotation.y = ry; G.add(g);
    const W = 5.5 * s, D = 4.6 * s, H = 3.4 * s;
    const wall = (w, hh, d, px, pz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), charM); o.position.set(px, hh / 2, pz); o.castShadow = o.receiveShadow = true; g.add(o); };
    wall(W, H, 0.4, 0, -D / 2); wall(0.4, H * 0.8, D, -W / 2, 0); wall(0.4, H, D, W / 2, 0); wall(W * 0.45, H * 0.6, 0.4, -W * 0.27, D / 2);
    const r = new THREE.Mesh(new THREE.BoxGeometry(W * 1.05, 0.3, D * 0.7), roofM); r.position.set(0.3, H * 0.75, -0.4); r.rotation.z = 0.35; r.rotation.x = -0.2; r.castShadow = true; g.add(r);
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, D * 1.1, 6), charM2); b.rotation.x = Math.PI / 2 + rand(-0.3, 0.3); b.rotation.z = rand(-0.5, 0.5); b.position.set(-W / 3 + k * W / 3, H * rand(0.5, 1), 0); g.add(b); }
    const e = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), emberM); e.position.set(W / 2 + 0.22, H * 0.5, 0); e.rotation.y = Math.PI / 2; g.add(e);
    g.updateMatrixWorld();
    if (Math.random() < 0.6) { const p = new THREE.Vector3(rand(-1, 1), H * 0.6, rand(-1, 1)).applyMatrix4(g.matrixWorld); fire(p.x, p.y, p.z, 0.8 * s); }
    addOb(x, z, 2.9 * s);
  }
  // carroça abandonada (tombada) com rodas
  function cart(x, z, ry) {
    const g = new THREE.Group(); g.position.set(x, h(x, z), z); g.rotation.set(0, ry, rand(-0.25, 0.25)); G.add(g);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1.5), woodM); bed.position.y = 0.9; bed.castShadow = true; g.add(bed);
    for (const sx of [-1, 1]) { const sd = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 0.12), woodM); sd.position.set(0, 1.3, sx * 0.7); g.add(sd); }
    for (const [wx, wz] of [[-0.8, 0.85], [0.8, 0.85], [-0.8, -0.85]]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 6, 14), charM2); w.position.set(wx, 0.5, wz); g.add(w); }
    const br = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 6, 14), charM2); br.rotation.x = Math.PI / 2; br.position.set(0.9, 0.08, -1.4); g.add(br);   // roda solta
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 5), woodM); sh.rotation.z = Math.PI / 2; sh.position.set(2.2, 0.5, 0); g.add(sh);
    addOb(x, z, 1.6);
  }
  // os mortos da estrada, cobertos por panos
  function covered(x, z, ry) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.2, 4, 8), clothM); m.rotation.set(Math.PI / 2, 0, ry); m.scale.set(1, 1, 0.55); m.position.set(x, h(x, z) + 0.18, z); m.castShadow = true; G.add(m); }
  // raízes negras: tubos retorcidos rente ao chão, alguns atravessando a estrada
  function roots(x, z, n = 4, len = 9) {
    for (let k = 0; k < n; k++) {
      const a = rand(0, TAU), pts = [];
      for (let i = 0; i <= 6; i++) { const t = i / 6, px = x + Math.cos(a) * t * len + Math.sin(t * 7 + k) * 0.9, pz = z + Math.sin(a) * t * len + Math.cos(t * 6 + k) * 0.9; pts.push(new THREE.Vector3(px, h(px, pz) + 0.15 + Math.sin(t * 9) * 0.25, pz)); }
      const tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, rand(0.18, 0.35), 6), rootM); tb.castShadow = true; G.add(tb);
    }
    const knot = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), rootM); knot.scale.y = 0.6; knot.position.set(x, h(x, z) + 0.3, z); G.add(knot); addOb(x, z, 1.0);
  }

  // ---------------------------------------------------------------- estrada destruída
  [[-96, -684, 0.6], [-70, -712, -0.3], [-30, -716, 1.2], [5, -756, 0.2], [30, -738, -0.8], [-62, -682, 2.1]].forEach(([x, z, r]) => burned(x, z, r));
  [[-92, -697, 0.8], [-52, -711, 2.4], [28, -758, 1.1]].forEach(([x, z, r]) => cart(x, z, r));
  [[-86, -690, 0.4], [-84, -692, 0.7], [-40, -722, 2.0], [16, -749, 1.0]].forEach(([x, z, r]) => covered(x, z, r));
  [[-100, -676], [-74, -700], [-58, -716], [-34, -724], [10, -744], [40, -764], [-120, -720], [-20, -690], [60, -700], [100, -720], [-90, -780], [-40, -800], [120, -680]].forEach(([x, z]) => roots(x, z, 4, rand(7, 12)));

  // ---------------------------------------------------------------- árvores mortas que voltaram a crescer com folhas escuras
  (function trees() {
    const list = [];
    for (let i = 0; i < 2000 && list.length < (TOUCH ? 90 : 140); i++) {
      const x = rand(B.x0 + 8, B.x0 + B.w - 8), z = rand(B.z0 + 8, B.z0 + B.h - 10);
      if (dRoad(x, z) < 6 || Math.hypot(x - CITY.x, z - CITY.z) < CR + 8 || Math.hypot(x - CAMP.x, z - CAMP.z) < 22 || Math.hypot(x - HILL.x, z - HILL.z) < 9) continue;
      list.push({ x, z, s: rand(0.8, 1.4), r: rand(0, TAU) });
    }
    const trunkG = new THREE.CylinderGeometry(0.12, 0.38, 5, 6); trunkG.translate(0, 2.5, 0);
    const crownG = new THREE.IcosahedronGeometry(1.5, 0); crownG.scale(1, 0.8, 1); crownG.translate(0, 5, 0);
    const mk = (geo, m) => { const im = new THREE.InstancedMesh(geo, m, list.length); im.castShadow = !TOUCH; im.frustumCulled = false; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
      list.forEach((o, i) => { p.set(o.x, h(o.x, o.z) - 0.2, o.z); q.setFromEuler(new THREE.Euler(rand(-0.15, 0.15), o.r, rand(-0.15, 0.15))); s.setScalar(o.s); m4.compose(p, q, s); im.setMatrixAt(i, m4); }); G.add(im); };
    mk(trunkG, new THREE.MeshLambertMaterial({ color: 0x1e1614 }));
    mk(crownG, new THREE.MeshLambertMaterial({ color: 0x241a2a, flatShading: true }));
    list.forEach(o => addOb(o.x, o.z, 0.6 * o.s));
  })();

  // ---------------------------------------------------------------- Valdora: muralhas destruídas, torres queimando, praça com a estátua
  (function city() {
    const N = 36, breaches = [GATE_A + 1.6, GATE_A + 3.1, GATE_A - 2.2];
    for (let k = 0; k < N; k++) {
      const a = k / N * TAU, da = d => Math.abs(Math.atan2(Math.sin(a - d), Math.cos(a - d)));
      if (da(GATE_A) < 0.2) continue;                                              // portão aberto
      const x = CITY.x + Math.sin(a) * CR, z = CITY.z + Math.cos(a) * CR;
      if (breaches.some(b => da(b) < 0.16)) {                                     // brechas: só escombros
        for (let j = 0; j < 5; j++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.5, 1.2), 0), stoneD); r.position.set(x + rand(-2.5, 2.5), h(x, z) + 0.3, z + rand(-2.5, 2.5)); r.rotation.set(rand(0, 3), rand(0, 3), 0); r.castShadow = true; G.add(r); }
        continue;
      }
      const hh = rand(3.5, 7.5), seg = box(6.6, hh, 2, stoneM, x, h(x, z) + hh / 2 - 0.4, z, a);
      for (const o of [-1, 1]) addOb(x + Math.cos(a) * o * 1.7, z - Math.sin(a) * o * 1.7, 1.6);
      if (k % 9 === 4) {                                                           // torre da muralha, queimando
        const tx = CITY.x + Math.sin(a) * (CR + 1), tz = CITY.z + Math.cos(a) * (CR + 1), th = rand(9, 13);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.1, th, 12), stoneD); t.position.set(tx, h(tx, tz) + th / 2 - 0.3, tz); t.castShadow = true; G.add(t);
        fire(tx, h(tx, tz) + th, tz, 2.2); smoke(tx, h(tx, tz) + th + 2, tz, 1.6, 6); addOb(tx, tz, 3.2);
      }
    }
    // portão: dois pilares e a verga caída
    const gx = CITY.x + Math.sin(GATE_A) * CR, gz = CITY.z + Math.cos(GATE_A) * CR, ca = Math.cos(GATE_A), sa = Math.sin(GATE_A);
    for (const o of [-1, 1]) { const px = gx + ca * o * 4, pz = gz - sa * o * 4; box(2, 9, 2, stoneD, px, h(px, pz) + 4.2, pz, GATE_A); addOb(px, pz, 1.3); }
    const lint = box(9, 1.2, 1.6, stoneD, gx + ca * 2, h(gx, gz) + 0.6, gz - sa * 2 + 1, GATE_A + 0.3); lint.rotation.z = 0.25;
    // casas queimadas dentro da cidade (deixa livres a rua do portão e a praça)
    for (let k = 0; k < 14; k++) {
      const a = k / 14 * TAU + 0.1, r = k % 2 ? 22 : 28, x = CITY.x + Math.sin(a) * r, z = CITY.z + Math.cos(a) * r;
      if (Math.abs(Math.atan2(Math.sin(a - GATE_A), Math.cos(a - GATE_A))) < 0.35) continue;
      burned(x, z, a + Math.PI, 1.1);
    }
    // torre central com o símbolo dos três irmãos (círculo dividido em três)
    const tx = CITY.x, tz = CITY.z - 15;
    const ct = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 20, 14), stoneM); ct.position.set(tx, h(tx, tz) + 10, tz); ct.castShadow = true; G.add(ct); addOb(tx, tz, 4.4);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(4.4, 5, 14), roofM); cap.position.set(tx, h(tx, tz) + 22.5, tz); cap.rotation.z = 0.2; G.add(cap);
    fire(tx + 2, h(tx, tz) + 20, tz + 2, 2.6); smoke(tx, h(tx, tz) + 24, tz, 2, 7);
    const emb = ctex(256, 256, g => { g.translate(128, 128); g.shadowColor = '#ff3030'; g.shadowBlur = 24; g.strokeStyle = '#ff5050'; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, 96, 0, TAU); g.stroke(); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU - Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 96, Math.sin(a) * 96); g.stroke(); } });
    const es = new THREE.Sprite(new THREE.SpriteMaterial({ map: emb, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); es.scale.setScalar(7); add(es, tx, h(tx, tz) + 16, tz + 4.5);
    // os três espinhos desenhados com sangue no meio da praça
    const blood = ctex(512, 512, g => {
      g.translate(256, 256); g.fillStyle = 'rgba(120,8,12,.9)';
      for (let i = 0; i < 3; i++) { g.save(); g.rotate(i / 3 * TAU); g.beginPath(); g.moveTo(-34, 30); g.quadraticCurveTo(-60, -120, 0, -240); g.quadraticCurveTo(40, -110, 34, 30); g.closePath(); g.fill(); g.restore(); }
      g.beginPath(); g.arc(0, 0, 60, 0, TAU); g.fill();
      for (let i = 0; i < 70; i++) { g.globalAlpha = rand(0.3, 0.9); g.beginPath(); g.arc(rand(-230, 230), rand(-230, 230), rand(2, 9), 0, TAU); g.fill(); }
    });
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(22, 22).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: blood, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    bm.position.set(CITY.x, h(CITY.x, CITY.z) + 0.06, CITY.z); G.add(bm);
    // a estátua do pai, com a espada erguida (posta há pouco tempo, diz Lyra)
    const sx = CITY.x, sz = CITY.z, sy = h(sx, sz), stM = PM('pedra.jpg', [1, 1], 0xb0a8b8);
    box(3.2, 1.6, 3.2, stoneD, sx, sy + 0.8, sz); box(2.4, 0.5, 2.4, stM, sx, sy + 1.85, sz);
    const st = new THREE.Group(); st.position.set(sx, sy + 2.1, sz); st.rotation.y = GATE_A; G.add(st);
    const part = (geo, x, y, z, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, stM); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.castShadow = true; st.add(m); return m; };
    part(new THREE.CylinderGeometry(0.55, 0.75, 2.6, 10), 0, 1.3, 0); part(new THREE.SphereGeometry(0.45, 12, 10), 0, 3.0, 0);
    part(new THREE.CylinderGeometry(0.18, 0.16, 1.6, 8), 0.7, 3.0, 0, 0, 0.35); part(new THREE.CylinderGeometry(0.18, 0.16, 1.3, 8), -0.7, 2.0, 0, 0, -0.3);
    part(new THREE.BoxGeometry(0.16, 3.2, 0.5), 1.1, 5.0, 0, 0, 0.2); part(new THREE.BoxGeometry(1.0, 0.18, 0.3), 0.95, 3.6, 0, 0, 0.2);
    addOb(sx, sz, 2.2);
  })();

  // ---------------------------------------------------------------- acampamento dos refugiados
  (function camp() {
    const tentM = [0x8a7a5a, 0x6a5a48, 0x7a4a3a, 0x5a6a5a].map(c => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    [[-12, -8, 0.4], [12, -9, -0.6], [-14, 8, 2.6], [14, 10, 3.6]].forEach(([dx, dz, r], i) => {
      const x = CAMP.x + dx, z = CAMP.z + dz, t = new THREE.Mesh(new THREE.ConeGeometry(3, 3.4, 4, 1, true), tentM[i]); t.position.set(x, h(x, z) + 1.7, z); t.rotation.y = r; t.castShadow = true; G.add(t); addOb(x, z, 2.4);
    });
    const fx = CAMP.x, fz = CAMP.z + 2;
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), stoneD); s.position.set(fx + Math.cos(a) * 0.9, h(fx, fz) + 0.15, fz + Math.sin(a) * 0.9); G.add(s); }
    fire(fx, h(fx, fz) - 0.2, fz, 0.9); addOb(fx, fz, 1.0);
    [[-5, 12], [6, -12], [9, -10]].forEach(([dx, dz]) => { const x = CAMP.x + dx, z = CAMP.z + dz; box(1, 1, 1, woodM, x, h(x, z) + 0.5, z, rand(0, 3)); addOb(x, z, 0.8); });
  })();

  // ---------------------------------------------------------------- Passagem do Norte (nos dois mapas): arco de pedra com névoa negra
  const SWIRL = ctex(128, 128, g => { g.translate(64, 64); const r = g.createRadialGradient(0, 0, 0, 0, 0, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(-64, -64, 128, 128); for (let k = 0; k < 5; k++) { g.rotate(TAU / 5); g.beginPath(); for (let t = 0; t < 1; t += 0.02) g.lineTo(Math.cos(t * 5) * t * 60, Math.sin(t * 5) * t * 60); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 4; g.stroke(); } });
  const swirls = [];
  function arch(parent, x, z, ry, label, y) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
    const sm = PM('pedra.jpg', [1, 3], 0x8a8098);
    for (const sx of [-3, 3]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, 8, 1.6), sm); p.position.set(sx, 4, 0); p.castShadow = true; g.add(p); }
    const l = new THREE.Mesh(new THREE.BoxGeometry(8, 1.4, 1.8), sm); l.position.y = 8.4; g.add(l);
    const sw = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), new THREE.MeshBasicMaterial({ map: SWIRL, color: 0x9a6aff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); sw.scale.y = 1.4; sw.position.y = 3.8; g.add(sw); swirls.push(sw);
    const dk = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 7.6), new THREE.MeshBasicMaterial({ color: 0x08040c })); dk.position.set(0, 3.8, -0.25); g.add(dk);
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x2 = c.getContext('2d'); x2.fillStyle = 'rgba(16,8,24,.8)'; x2.fillRect(0, 0, 512, 96); x2.strokeStyle = '#b070ff'; x2.lineWidth = 4; x2.strokeRect(2, 2, 508, 92); x2.fillStyle = '#f2d8ff'; x2.font = 'bold 40px Georgia'; x2.textAlign = 'center'; x2.fillText(label, 256, 62);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); sp.scale.set(6, 1.1, 1); sp.position.y = 10.2; g.add(sp);
    addOb(x + Math.cos(ry) * 3, z - Math.sin(ry) * 3, 1.0); addOb(x - Math.cos(ry) * 3, z + Math.sin(ry) * 3, 1.0);
  }
  arch(scene, VGATE_R.x, VGATE_R.z - 1, Math.PI, 'Estrada de Valdora ↑', groundY(VGATE_R.x, VGATE_R.z - 1));
  arch(G, VGATE_V.x, VGATE_V.z + 1, 0, 'Reino Quebrado ↓', h(VGATE_V.x, VGATE_V.z + 1));

  // ---------------------------------------------------------------- horizonte: montanhas, fumaça ao longe e o Gigante do Vazio
  (function horizon() {
    const P2 = [], C = [], I = [], cx = 0, cz = B.z0 + B.h / 2;
    const ring = (rx, rz, n, hb, hv, seed) => { const b = P2.length / 3; for (let i = 0; i <= n; i++) { const a = i / n * TAU, x = cx + Math.cos(a) * rx, z = cz + Math.sin(a) * rz, hh = hb + hv * (0.5 + 0.5 * Math.sin(a * 7 + seed) * Math.cos(a * 3.3 + seed * 2)) + hv * 0.45 * Math.abs(Math.sin(a * 17 + seed)); P2.push(x, -20, z, x, hh, z); C.push(0.55, 0.55, 0.6, 1, 1, 1); if (i < n) { const k = b + i * 2; I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } } };
    ring(B.w / 2 + 60, B.h / 2 + 60, 140, 22, 40, 2.1);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setIndex(I);
    const m = new THREE.Mesh(geo, mountains.material); m.frustumCulled = false; G.add(m);
    for (let i = 0; i < 9; i++) { const a = rand(-0.4, Math.PI + 0.4) + Math.PI, r = rand(170, 230); smoke(cx + Math.cos(a) * r, 10, cz + Math.sin(a) * r * 0.8, 9, 5); }
    // "seu corpo ocupava metade do horizonte": uma silhueta enorme ao norte, nas nuvens
    const gm = new THREE.MeshBasicMaterial({ color: 0x2a2026, fog: false, transparent: true, opacity: 0.8, depthWrite: false });
    const giant = new THREE.Group(); giant.position.set(30, -40, B.z0 - 210); G.add(giant);
    const gp = (geo, x, y, z, sx = 1, sy = 1) => { const o = new THREE.Mesh(geo, gm); o.position.set(x, y, z); o.scale.set(sx, sy, 1); o.renderOrder = -1; giant.add(o); };
    gp(new THREE.CylinderGeometry(38, 60, 170, 12), 0, 85, 0); gp(new THREE.SphereGeometry(42, 16, 12), 0, 180, 0, 1.2, 0.8);
    gp(new THREE.SphereGeometry(28, 14, 10), 0, 230, 0); gp(new THREE.CylinderGeometry(12, 16, 150, 8), -70, 120, 10); gp(new THREE.CylinderGeometry(12, 16, 150, 8), 72, 130, 10);
    const eyeM = new THREE.SpriteMaterial({ map: GLOW, color: 0xff2a2a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
    for (const ex of [-9, 9]) { const e = new THREE.Sprite(eyeM); e.scale.setScalar(12); e.position.set(ex, 232, 26); giant.add(e); }
    giant.userData.eye = eyeM; G.userData.giant = giant;
  })();

  // ---------------------------------------------------------------- cinzas caindo em volta do jogador
  const ash = (() => {
    const N = TOUCH ? 90 : 180, pos = new Float32Array(N * 3), sd = [];
    for (let i = 0; i < N; i++) sd.push([rand(-22, 22), rand(0, 14), rand(-22, 22), rand(0.4, 1.1)]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xb8a8a0, size: 0.14, transparent: true, opacity: 0.7, depthWrite: false })); pts.frustumCulled = false; G.add(pts);
    return { pts, pos, sd, N };
  })();

  // ---------------------------------------------------------------- mapas (minimapa e mapa grande)
  const map = { x0: B.x0, z0: B.z0, w: B.w, h: B.h, places: [[CAMP, 'Acampamento'], [HILL, 'Colina'], [CITY, 'Ruínas de Valdora'], [{ x: VGATE_V.x, z: VGATE_V.z - 4 }, '↓ Reino']], cities: [{ c: CAMP, z: 'acampamento', n: 'Acampamento de Valdora', R: 22 }] };
  function paint(W, H) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), img = x.createImageData(W, H), col = new THREE.Color();
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const wx = B.x0 + (i + 0.5) / W * B.w, wz = B.z0 + (j + 0.5) / H * B.h, y = h(wx, wz), m = mix(wx, wz, y);
      col.setRGB(m.t[0] * 0.55, m.t[1] * 0.5, m.t[2] * 0.5); const l = 0.85 + Math.min(0.5, y * 0.05);
      if (m.w[0] > 0.9) col.setRGB(0.45, 0.36, 0.28); if (m.w[2] > 0.9) col.setRGB(0.42, 0.4, 0.44);
      const o = (j * W + i) * 4; img.data[o] = Math.min(255, col.r * 255 * l); img.data[o + 1] = Math.min(255, col.g * 255 * l); img.data[o + 2] = Math.min(255, col.b * 255 * l); img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    // muralha e símbolo
    const k = W / B.w; x.strokeStyle = 'rgba(30,24,30,.9)'; x.lineWidth = Math.max(1, 2 * k); x.beginPath(); x.arc((CITY.x - B.x0) * k, (CITY.z - B.z0) * k, CR * k, 0, TAU); x.stroke();
    x.fillStyle = '#a01018'; x.beginPath(); x.arc((CITY.x - B.x0) * k, (CITY.z - B.z0) * k, Math.max(1.5, 5 * k), 0, TAU); x.fill();
    return c;
  }
  let painted = false;
  function ensureMaps() { if (painted) return; painted = true; map.mm = paint(180, 132); map.base = paint(B.w, B.h); }

  // ---------------------------------------------------------------- atravessar a passagem
  const fade = () => document.getElementById('tfade');
  function blackout() { const f = fade(); if (!f) return; f.style.transition = 'none'; f.style.opacity = 1; void f.offsetWidth; f.style.transition = 'opacity .7s'; requestAnimationFrame(() => requestAnimationFrame(() => { f.style.opacity = 0; })); }
  function go(to) {
    const t = to === 'valdora' ? { x: VGATE_V.x, z: VGATE_V.z - 17, face: Math.PI } : { x: VGATE_R.x, z: VGATE_R.z + 17, face: 0 };
    P.x = t.x; P.z = t.z; P.y = groundY(P.x, P.z); P.vy = 0; P.face = t.face; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.yaw = P.face + Math.PI; camS.dist = Math.min(camS.dist, 12); camS.cur = 6;
    if (typeof AUTO !== 'undefined') { AUTO.cx = P.x; AUTO.cz = P.z; AUTO.chk = 0; AUTO.tgT = 0; }
    blackout(); Audio8.sfx('warp');
    if (to === 'valdora') { if (!P.valdoraSeen) { P.valdoraSeen = 1; log('🌫️ Do outro lado da passagem, o frio. <i>"Não o frio do ar, e sim da ausência de vida."</i> Colunas de fumaça sobem no horizonte. Siga a estrada até <b>Valdora</b>.', 'gold'); } }
    else log('Você voltou ao <b>Reino Quebrado</b> pelas Areias Rubras.', 'sys');
  }
  let inside = false, hideList = null, cool = 0, armada = true;
  function setInside(v) {
    inside = v; G.visible = v;
    if (!hideList) hideList = scene.children.filter(o => o.isInstancedMesh || o.isPoints);   // vegetação e vaga-lumes do Reino
    for (const o of hideList) o.visible = !v;
    if (v) ensureMaps();
  }

  function update(dt) {
    cool -= dt;
    const v = inVal(P.z); if (v !== inside) setInside(v);
    for (const s of swirls) { s.rotation.z -= dt * 1.2; s.material.opacity = 0.75 + Math.sin(time * 3) * 0.2; }
    // a passagem só funciona de novo depois que a pessoa se afasta dela
    const dR = Math.hypot(P.x - VGATE_R.x, P.z - VGATE_R.z), dV = Math.hypot(P.x - VGATE_V.x, P.z - VGATE_V.z);
    if (!armada && (v ? dV : dR) > 7) armada = true;
    if (!P.dead && cool <= 0 && armada) {
      if (!v && !inTower(P.z) && dR < 3.4) { cool = 1.5; armada = false; go('valdora'); return; }
      if (v && dV < 3.4) { cool = 1.5; armada = false; go('reino'); return; }
    }
    if (!v) return;
    for (const f of fires) { const k = time * 9 + f.ph; f.f.scale.set(1.2 * f.s * (1 + Math.sin(k) * 0.08), 2.2 * f.s * (1 + Math.sin(k * 1.3) * 0.12), 1); f.gl.material.opacity = 0.32 + Math.sin(k * 0.7) * 0.08; }
    for (const s of smokes) { s.k = (s.k + dt * (s.s > 3 ? 0.03 : 0.12)) % 1; const k = s.k; s.m.position.set(s.x + Math.sin(k * 5 + s.x) * s.s, s.y + k * 14 * s.s, s.z); s.m.scale.setScalar((1.5 + k * 4) * s.s); s.m.material.opacity = Math.sin(k * Math.PI) * (s.s > 3 ? 0.35 : 0.55); }
    const gi = G.userData.giant; if (gi) { gi.position.x = 30 + Math.sin(time * 0.05) * 12; gi.userData.eye.opacity = 0.7 + Math.sin(time * 0.8) * 0.3; }
    const A = ash; for (let i = 0; i < A.N; i++) { const s = A.sd[i]; s[1] -= dt * s[3]; if (s[1] < 0) s[1] = 14; A.pos[i * 3] = P.x + s[0] + Math.sin(time * 0.5 + i) * 0.6; A.pos[i * 3 + 1] = P.y + s[1]; A.pos[i * 3 + 2] = P.z + s[2]; }
    A.pts.geometry.attributes.position.needsUpdate = true;
  }
  return { h, out, update, map, dRoad, get inside() { return inside; } };
})();
