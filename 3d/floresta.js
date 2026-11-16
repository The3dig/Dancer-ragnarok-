// =====================================================================
//  Floresta Morta e Templo da Primeira Raiz — livro I, caps. 4 e 5.
//  "As árvores eram enormes e sem folhas; cristais escuros cobriam os
//  troncos e as raízes atravessavam o solo como ossos expostos. Quando
//  Kravenox entrou, o vento se calou." Na floresta: Lira (a pequena
//  criatura que morreu há muito tempo, com um cristal negro no peito),
//  larvas maiores, de membros alongados, e o Guardião Branco da Ordem
//  da Essência. Ao norte, numa encosta, a parede com os dois espinhos
//  ("Somente os que carregam a ruptura podem entrar"), o túnel de raízes
//  petrificadas com cristais que guardam vozes, e a sala redonda com a
//  estátua dos irmãos: "ANTES DE HAVER DOIS, HOUVE UM."
//  Mapa a leste de Valdora (x > 250, z < -300), níveis 40 a 55.
// =====================================================================
'use strict';
const Floresta = (() => {
  const B = { x0: 300, z0: -880, w: 300, h: 240 };
  const CLAR = FCLAR, GUARD = FGUARD, WALL = FWALL, HALL = FHALL, HR = 15;
  const TUN = { x: WALL.x, z0: HALL.z + HR - 1, z1: WALL.z + 1, w: 2.4 };        // túnel: da parede até a sala
  const ROAD = [[FGATE.x, FGATE.z], [CLAR.x, CLAR.z], [410, -772], [GUARD.x, GUARD.z], [508, -792], [WALL.x, WALL.z + 3]];
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  function dRoad(x, z) { let d = 1e9; for (let i = 0; i < ROAD.length - 1; i++) d = Math.min(d, segD(x, z, ROAD[i][0], ROAD[i][1], ROAD[i + 1][0], ROAD[i + 1][1])); return d; }
  const MONTE = -814;                                                           // a encosta começa aqui (ao norte)
  const naSala = (x, z) => Math.hypot(x - HALL.x, z - HALL.z) < HR;
  const noTunel = (x, z) => Math.abs(x - TUN.x) < TUN.w && z <= TUN.z1 && z >= TUN.z0;

  // ---------------------------------------------------------------- relevo
  function h(x, z) {
    let b = Math.sin(x * 0.04) * Math.cos(z * 0.05) * 2.2 + Math.sin(x * 0.11 + z * 0.07) * 0.9 + 0.6;
    b *= smooth(3, 9, dRoad(x, z));
    b = lerp(b, 0.5, 1 - smooth(12, 20, Math.hypot(x - CLAR.x, z - CLAR.z)));
    b = lerp(b, 0.4, 1 - smooth(14, 22, Math.hypot(x - GUARD.x, z - GUARD.z)));
    // a encosta ao norte (vira paredão); o túnel e a sala ficam no nível do chão
    if (z < MONTE + 6) { const k = smooth(MONTE + 6, MONTE - 10, z); b += k * 16 + k * Math.sin(x * 0.3) * 1.5; }
    if (naSala(x, z) || noTunel(x, z)) b = 0.3;
    const e = Math.max(B.x0 + 8 - x, x - (B.x0 + B.w - 8), B.z0 + 8 - z, z - (B.z0 + B.h - 8), 0);
    return b + e * 1.6;
  }
  function out(x, z, r = 0.45) {
    if (x < B.x0 + 4 + r || x > B.x0 + B.w - 4 - r || z < B.z0 + 4 + r || z > B.z0 + B.h - 4 - r) return true;
    if (z < MONTE) {                                                            // dentro da montanha só o túnel e a sala
      if (Math.hypot(x - HALL.x, z - HALL.z) < HR - r - 0.3) return false;
      if (Math.abs(x - TUN.x) < TUN.w - r && z >= TUN.z0 - 2 && z <= TUN.z1 + 2) return false;
      return true;
    }
    return false;
  }
  function zona(x, z) {
    if (z < MONTE + 2 && (naSala(x, z) || noTunel(x, z) || Math.abs(x - WALL.x) < 8)) return 'templo';
    if (Math.hypot(x - CLAR.x, z - CLAR.z) < 16) return 'clareira';
    return 'floresta';
  }
  // cor e mistura de texturas: chão cinzento de cinza e folhas mortas, trilha de terra, pedra no templo
  function mix(x, z, y) {
    const n = Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.03 + Math.sin(x * 0.23 + z * 0.19) * 0.04;
    const t = [0.36 + n, 0.35 + n, 0.37 + n], w = [0.8, 0, 0, 0.15];               // terra cinzenta, quase nada de grama
    if (dRoad(x, z) < 3) { w[0] = 1; t[0] = 0.5; t[1] = 0.44; t[2] = 0.4; }
    const dc = Math.hypot(x - CLAR.x, z - CLAR.z); if (dc < 14) { w[0] = 0.45; t[0] = 0.4; t[1] = 0.46; t[2] = 0.4; }   // a clareira ainda tem um pouco de verde
    if (Math.hypot(x - GUARD.x, z - GUARD.z) < 16) { w[2] = 0.6; t[0] = t[1] = t[2] = 0.58 + n; }
    if (z < MONTE + 4) w[3] = Math.min(1, (MONTE + 4 - z) / 8);
    if (naSala(x, z) || noTunel(x, z)) { w[2] = 1; w[3] = 0; t[0] = 0.5; t[1] = 0.47; t[2] = 0.52; }
    const raiz = Math.abs(Math.sin(x * 0.29 + Math.sin(z * 0.19) * 2.2) + Math.cos(z * 0.31 + Math.sin(x * 0.15)));
    if (raiz < 0.07 && z > MONTE) { t[0] = 0.66; t[1] = 0.62; t[2] = 0.54; }  // veios claros: raízes como ossos
    return { t, w };
  }

  // ---------------------------------------------------------------- tudo do mapa vai num grupo (só aparece aqui dentro)
  const G = new THREE.Group(); G.visible = false; scene.add(G);
  const ARQ = new THREE.Group(); G.add(ARQ);
  const fogo = [], runas = [];                                     // peças paradas: viram poucas malhas no fim
  const ctex = (w, hh, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; draw(c.getContext('2d'), w, hh); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const GLOW = ctex(64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const brilho = (x, y, z, cor, s, op = 0.5) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op, toneMapped: false })); m.position.set(x, y, z); m.scale.setScalar(s); G.add(m); return m; };
  const casca = new THREE.MeshLambertMaterial({ color: 0x4a4038, emissive: 0x100c10 }), osso = new THREE.MeshLambertMaterial({ color: 0xa89e88 });
  const cristalM = new THREE.MeshLambertMaterial({ color: 0x2a1840, emissive: 0x3a1460, emissiveIntensity: 0.9, flatShading: true });
  const pedraM = PM('pedra.jpg', [1, 1], 0x9890a0), pedraE = PM('pedra.jpg', [1, 1], 0x6a6474), brancoM = PM('pedra.jpg', [1, 1], 0xe8e6f0);
  // junta várias peças numa geometria só (posição e normal)
  function juntar(lista) {
    const gs = lista.map(([geo, m4]) => { const g = (geo.index ? geo.toNonIndexed() : geo.clone()); g.applyMatrix4(m4); return g; });
    const n = gs.reduce((t, g) => t + g.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    let i = 0; for (const g of gs) { pos.set(g.attributes.position.array, i * 3); nor.set(g.attributes.normal.array, i * 3); i += g.attributes.position.count; g.dispose(); }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.computeBoundingSphere(); return out;
  }
  const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));

  // ---------------------------------------------------------------- chão
  (function terreno() {
    const geo = new THREE.PlaneGeometry(B.w, B.h, TOUCH ? 150 : 240, TOUCH ? 120 : 192); geo.rotateX(-Math.PI / 2); geo.translate(B.x0 + B.w / 2, 0, B.z0 + B.h / 2);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), wts = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), y = h(x, z); pos.setY(i, y); const m = mix(x, z, y); col.set(m.t, i * 3); wts.set(m.w, i * 4); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aW', new THREE.BufferAttribute(wts, 4)); geo.computeVertexNormals();
    const t = new THREE.Mesh(geo, window.TERRAIN_MAT || new THREE.MeshLambertMaterial({ vertexColors: true })); t.receiveShadow = true; G.add(t);
  })();

  // ---------------------------------------------------------------- árvores colossais, mortas, com cristais e raízes de osso
  (function arvores() {
    // uma árvore: tronco que afina, galhos tortos subindo, sem nenhuma folha
    const partes = [], raizes = [], crist = [];
    const tronco = new THREE.LatheGeometry([[1.5, 0], [1.1, 0.8], [0.85, 3], [0.7, 7], [0.5, 11], [0.32, 14], [0.12, 16]].map(([r, y]) => new THREE.Vector2(r, y)), 9);
    partes.push([tronco, new THREE.Matrix4()]);
    const galho = (y, a, incl, L, r) => { const g = new THREE.CylinderGeometry(r * 0.35, r, L, 6); g.translate(0, L / 2, 0); partes.push([g, M4(0, y, 0, 0, a, incl)]); return { y, a, incl, L }; };
    const gs = [galho(7, 0.3, 0.9, 6, 0.32), galho(9, 2.4, 0.8, 5.5, 0.28), galho(11, 4.3, 0.95, 5, 0.24), galho(12.5, 1.4, 0.6, 4, 0.18), galho(13.5, 3.5, 0.7, 3.5, 0.15), galho(5, 5.4, 1.15, 4, 0.26)];
    for (const gg of gs) {                                                       // galhinhos nas pontas
      const e = new THREE.Euler(0, gg.a, gg.incl), d = new THREE.Vector3(0, gg.L, 0).applyEuler(e);
      for (const s of [-0.6, 0.7]) { const g = new THREE.CylinderGeometry(0.03, 0.09, 2.2, 5); g.translate(0, 1.1, 0); partes.push([g, M4(d.x * 0.85, gg.y + d.y * 0.85, d.z * 0.85, 0, gg.a + s, gg.incl * 0.6 + s * 0.4)]); }
    }
    for (let k = 0; k < 6; k++) {                                                // raízes saindo do chão como ossos
      const a = k / 6 * TAU + 0.3, pts = [];
      for (let i = 0; i <= 6; i++) { const t = i / 6, r = 1 + t * 3.4; pts.push(new THREE.Vector3(Math.sin(a) * r, 0.9 * Math.sin(t * Math.PI) * (1 - t * 0.5) + 0.1 - t * 0.35, Math.cos(a) * r)); }
      raizes.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.2 - 0.03 * (k % 3), 6), new THREE.Matrix4()]);
    }
    const cr = new THREE.OctahedronGeometry(0.5, 0); cr.scale(0.6, 1.8, 0.6);
    [[0.95, 2.2, 0.2], [0.8, 4.5, 2.6], [0.75, 6, 4.4], [1.0, 1.4, 5.2]].forEach(([r, y, a], k) => { for (let j = 0; j < 3; j++) crist.push([cr, M4(Math.sin(a + j * 0.25) * r, y + j * 0.3, Math.cos(a + j * 0.25) * r, (j - 1) * 0.5, a, (j - 1) * 0.4, 0.7 + j * 0.25)]); });
    const geoT = juntar(partes), geoR = juntar(raizes), geoC = juntar(crist);
    const lista = [];
    for (let i = 0; i < 6000 && lista.length < (TOUCH ? 140 : 210); i++) {
      const x = rand(B.x0 + 10, B.x0 + B.w - 10), z = rand(MONTE + 6, B.z0 + B.h - 10);
      if (dRoad(x, z) < 5 || Math.hypot(x - CLAR.x, z - CLAR.z) < 18 || Math.hypot(x - GUARD.x, z - GUARD.z) < 19 || Math.hypot(x - FGATE.x, z - FGATE.z) < 12 || Math.hypot(x - FGATE_V.x, z - FGATE_V.z) < 12 || Math.abs(x - WALL.x) < 14 && z < WALL.z + 12 || lista.some(o => Math.hypot(o.x - x, o.z - z) < 6.5)) continue;
      lista.push({ x, z, s: rand(1.0, 1.7), r: rand(0, TAU), c: Math.random() < 0.6 });
    }
    const mk = (geo, mat, l) => { const im = new THREE.InstancedMesh(geo, mat, l.length); im.castShadow = !TOUCH; im.frustumCulled = false; l.forEach((o, i) => im.setMatrixAt(i, M4(o.x, h(o.x, o.z) - 0.3, o.z, rand(-0.05, 0.05), o.r, rand(-0.05, 0.05), o.s))); G.add(im); return im; };
    mk(geoT, casca, lista); mk(geoR, osso, lista); mk(geoC, cristalM, lista.filter(o => o.c));
    lista.forEach(o => addOb(o.x, o.z, 1.3 * o.s));
    // ossos e raízes soltas pelo chão
    const solt = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-3, 0, 0), new THREE.Vector3(-1, 0.5, 0.6), new THREE.Vector3(1, 0.3, -0.4), new THREE.Vector3(3, 0, 0.2)]), 10, 0.1, 5);
    const ls = []; for (let i = 0; i < 200 && ls.length < 50; i++) { const x = rand(B.x0 + 10, B.x0 + B.w - 10), z = rand(MONTE + 6, B.z0 + B.h - 10); if (dRoad(x, z) > 4 && Math.hypot(x - CLAR.x, z - CLAR.z) > 16) ls.push({ x, z, s: rand(0.7, 1.4), r: rand(0, TAU) }); }
    mk(solt, osso, ls);
  })();

  // ---------------------------------------------------------------- Clareira de Lira: o único lugar onde o vento ainda passa
  (function clareira() {
    const y = h(CLAR.x, CLAR.z);
    for (let k = 0; k < 9; k++) {                                                // pedras de pé em roda
      const a = k / 9 * TAU, r = 12, x = CLAR.x + Math.sin(a) * r, z = CLAR.z + Math.cos(a) * r;
      if (Math.abs(Math.atan2(Math.sin(a - 1.57), Math.cos(a - 1.57))) < 0.4 || Math.abs(Math.atan2(Math.sin(a + 1.57), Math.cos(a + 1.57))) < 0.4) continue;   // deixa a trilha livre
      const p = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), pedraE); p.scale.set(0.8, 2.2, 0.6); p.position.set(x, h(x, z) + 1.4, z); p.rotation.set(rand(-0.1, 0.1), a, rand(-0.1, 0.1)); ARQ.add(p); addOb(x, z, 0.9);
    }
    // fogo-fátuo: chama fria azulada (Lira está morta; o fogo também)
    const fx = CLAR.x, fz = CLAR.z + 3;
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), pedraE); s.position.set(fx + Math.cos(a) * 0.8, y + 0.15, fz + Math.sin(a) * 0.8); ARQ.add(s); }
    fogo.push(brilho(fx, y + 0.8, fz, 0x9ad8ff, 2.4, 0.8), brilho(fx, y + 1.2, fz, 0xe8f4ff, 1.1, 0.9)); addOb(fx, fz, 0.9);
    const luz = new THREE.PointLight(0x9ad8ff, 1.3, 26); luz.position.set(fx, y + 2, fz); G.add(luz);
    // troncos para sentar e a árvore de Lira (morta, com uma fita amarrada)
    for (const [dx, dz, r] of [[-3, 5, 0.4], [3.4, 5.6, -0.5], [0, 7, 1.57]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 2.4, 8).rotateZ(Math.PI / 2), casca); t.position.set(fx + dx, y + 0.35, fz + dz - 3); t.rotation.y = r; ARQ.add(t); }
    const fita = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 1.4), new THREE.MeshLambertMaterial({ color: 0xc03040, side: THREE.DoubleSide })); fita.position.set(CLAR.x - 6.6, y + 3.3, CLAR.z - 5.4); fita.rotation.z = 0.2; G.add(fita);
    const arv = new THREE.Mesh(new THREE.LatheGeometry([[0.8, 0], [0.5, 1], [0.4, 4], [0.15, 7]].map(([r, yy]) => new THREE.Vector2(r, yy)), 8), casca); arv.position.set(CLAR.x - 7, y - 0.2, CLAR.z - 6); ARQ.add(arv); addOb(CLAR.x - 7, CLAR.z - 6, 0.9);
  })();

  // ---------------------------------------------------------------- clareira do Guardião Branco: pilares quebrados da Ordem da Essência
  (function ordem() {
    const y = h(GUARD.x, GUARD.z);
    const RUNA = ctex(256, 256, g => { g.translate(128, 128); g.strokeStyle = 'rgba(122,216,255,.9)'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 118, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 92, 0, TAU); g.stroke();
      g.font = 'bold 22px serif'; g.fillStyle = 'rgba(122,216,255,.9)'; for (let k = 0; k < 16; k++) { g.save(); g.rotate(k / 16 * TAU); g.fillText('ᚱᛟᚾᛁᚨᛖᛞᛊᚦᛏᛒᛚᛗᛜᛟᛞ'[k], -7, -98); g.restore(); } });
    const rm = new THREE.Mesh(new THREE.CircleGeometry(12, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: RUNA, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); rm.position.set(GUARD.x, y + 0.08, GUARD.z); G.add(rm); runas.push(rm);
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU + 0.2, x = GUARD.x + Math.sin(a) * 14, z = GUARD.z + Math.cos(a) * 14, alt = [6, 2.5, 4.5, 1.8, 6, 3.2, 1.2, 5][k];
      const col = new THREE.Mesh(new THREE.LatheGeometry([[0.9, 0], [0.9, 0.4], [0.62, 0.6], [0.55, alt - 0.3], [0.7, alt]].map(([r, yy]) => new THREE.Vector2(r, yy)), 12), brancoM); col.position.set(x, h(x, z) - 0.1, z); col.rotation.z = rand(-0.06, 0.06); ARQ.add(col); addOb(x, z, 0.9);
      if (alt < 3) { const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3, 12).rotateZ(Math.PI / 2), brancoM); c2.position.set(x + Math.cos(a) * 2, h(x, z) + 0.5, z - Math.sin(a) * 2); c2.rotation.y = a; ARQ.add(c2); }
    }
  })();

  // ---------------------------------------------------------------- Templo da Primeira Raiz
  const vozes = [];
  (function templo() {
    // a parede da encosta com os dois espinhos (um claro e um escuro) e a inscrição
    const y0 = 0.3, WW = 26, WH = 14, PW = 2.7, PH = 6.2;                       // parede 26 x 14 m, passagem 5,4 x 6,2 m
    const F = ctex(512, 276, g => {
      g.fillStyle = '#5a5464'; g.fillRect(0, 0, 512, 276);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${30 + Math.random() * 40},${28 + Math.random() * 30},${40 + Math.random() * 40},.25)`; g.fillRect(Math.random() * 512, Math.random() * 276, 3, 3); }
      const esp = (x, cor, s) => { g.save(); g.translate(x, 160); g.scale(s, 1); g.fillStyle = cor; g.beginPath(); g.moveTo(-16, 100); g.quadraticCurveTo(-28, 0, 0, -105); g.quadraticCurveTo(24, 0, 16, 100); g.closePath(); g.fill(); g.restore(); };
      g.shadowColor = '#ffd890'; g.shadowBlur = 18; esp(150, '#e8d8a8', 1); g.shadowColor = '#000'; esp(362, '#141018', -1);
      g.shadowBlur = 0; g.fillStyle = '#e8dcc8'; g.font = 'italic 21px Georgia'; g.textAlign = 'center'; g.fillText('Somente os que carregam a ruptura podem entrar.', 256, 34);
      // o vão da passagem fica transparente
      const px = PW / WW * 512, py = PH / WH * 276; g.clearRect(256 - px, 276 - py, px * 2, py);
    });
    const blocoP = (w, hh, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, 2.4), pedraE); m.position.set(WALL.x + x, y0 + y, WALL.z - 2.4); ARQ.add(m); };
    blocoP(WW / 2 - PW, WH, -(PW + (WW / 2 - PW) / 2), WH / 2); blocoP(WW / 2 - PW, WH, PW + (WW / 2 - PW) / 2, WH / 2); blocoP(PW * 2, WH - PH, 0, PH + (WH - PH) / 2);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshLambertMaterial({ map: F, transparent: true, alphaTest: 0.5 })); face.position.set(WALL.x, y0 + WH / 2, WALL.z - 1.18); G.add(face);
    for (let x = -WW / 2 + 0.8; x <= WW / 2 - 0.8; x += 1.6) if (Math.abs(x) > PW + 0.4) addOb(WALL.x + x, WALL.z - 1.6, 0.9);
    // túnel: raízes petrificadas formando arcos, chão de raízes, cristais dourados, vermelhos e negros nas paredes
    const L = TUN.z1 - TUN.z0;
    const pedraT = PM('pedra.jpg', [8, 2], 0x6a6474); for (const o of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6, L + 2), pedraT); w.position.set(TUN.x + o * (TUN.w + 0.6), y0 + 3, (TUN.z0 + TUN.z1) / 2); ARQ.add(w); }
    const petra = new THREE.MeshLambertMaterial({ color: 0x6a5e50 });
    for (let z = TUN.z1 - 1; z > TUN.z0; z -= 2.2) {
      const pts = [new THREE.Vector3(-TUN.w, 0, 0), new THREE.Vector3(-TUN.w + 0.3, 3.5, 0.2), new THREE.Vector3(0, 5.2, -0.1), new THREE.Vector3(TUN.w - 0.3, 3.5, 0.2), new THREE.Vector3(TUN.w, 0, 0)];
      const a = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.22, 6), petra); a.position.set(TUN.x, y0, z); ARQ.add(a);
    }
    const CORES = [[0xffc860, 0x6a4a10], [0xff4a40, 0x5a1010], [0x2a1838, 0x1a0820]];
    const cm = CORES.map(([c, e]) => new THREE.MeshLambertMaterial({ color: c, emissive: e, emissiveIntensity: 1.2, flatShading: true }));
    const FRASES = ['— Não...', '— Não deixe que ele descubra.', '— A Fonte não pode ser aberta.', '— Ele voltou.', '— Antes de haver dois...'];
    for (let k = 0; k < 26; k++) {
      const o = k % 2 ? 1 : -1, z = TUN.z1 - 1 - k * (L - 2) / 26, yy = y0 + rand(0.8, 4.5), c = new THREE.Mesh(new THREE.OctahedronGeometry(rand(0.12, 0.26), 0), cm[k % 3]);
      c.position.set(TUN.x + o * (TUN.w - 0.05), yy, z); c.scale.y = 1.6; ARQ.add(c);
      if (k % 2 === 0) brilho(c.position.x - o * 0.2, yy, z, [0xffc860, 0xff4a40, 0x9a6aff][k % 3], 0.9, 0.5);
      if (k % 5 === 0) vozes.push({ x: TUN.x, z, txt: FRASES[(k / 5) % FRASES.length], dita: false });
    }
    // a sala redonda: paredão de pedra, chão de lajes e a estátua dos dois irmãos com o mesmo rosto
    const sala = new THREE.Mesh(new THREE.CylinderGeometry(HR + 0.8, HR + 1.4, 16, 32, 1, true), pedraE.clone()); sala.material.side = THREE.BackSide; sala.position.set(HALL.x, y0 + 7.5, HALL.z); G.add(sala);
    const anel = new THREE.Mesh(new THREE.RingGeometry(HR - 0.5, HR + 1, 40).rotateX(-Math.PI / 2), pedraE); anel.position.set(HALL.x, y0 + 15.4, HALL.z); G.add(anel);
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, x = HALL.x + Math.sin(a) * (HR - 0.4), z = HALL.z + Math.cos(a) * (HR - 0.4);
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.3) continue;      // a entrada do túnel (ao sul)
      const r = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.4, 5, 0.3), new THREE.Vector3(0.2, 10, -0.2), new THREE.Vector3(0, 15, 0.5)]), 12, 0.4, 6), petra); r.position.set(x, y0, z); ARQ.add(r);
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), cm[k % 3]); c.position.set(x - Math.sin(a) * 0.4, y0 + 3 + (k % 3), z - Math.cos(a) * 0.4); c.scale.y = 1.7; ARQ.add(c); brilho(c.position.x, c.position.y, c.position.z, [0xffc860, 0xff4a40, 0x9a6aff][k % 3], 1.4, 0.55);
    }
    const sy = y0; const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3, 1.2, 16), pedraM); base.position.set(HALL.x, sy + 0.6, HALL.z); ARQ.add(base); addOb(HALL.x, HALL.z, 2.6);
    const irmao = lado => {                                                       // os dois de costas um para o outro, iguais
      const g = new THREE.Group(); g.position.set(HALL.x + lado * 0.5, sy + 1.2, HALL.z); g.rotation.y = lado > 0 ? Math.PI / 2 : -Math.PI / 2; ARQ.add(g);
      const corpo = new THREE.Mesh(new THREE.LatheGeometry([[0.9, 0], [0.7, 1.2], [0.5, 2.4], [0.62, 3], [0.3, 3.3], [0, 3.35]].map(([r, y]) => new THREE.Vector2(r, y)), 14), brancoM); g.add(corpo);
      const cab = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), brancoM); cab.position.y = 3.6; g.add(cab);
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 1.6, 8), brancoM); br.position.set(0.55, 2.4, 0.35); br.rotation.x = -0.9; g.add(br);
      const esp = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.6, 6), lado > 0 ? new THREE.MeshLambertMaterial({ color: 0xe8d8a8, emissive: 0x3a2a08 }) : new THREE.MeshLambertMaterial({ color: 0x1a1220, emissive: 0x200828 })); esp.position.set(0.55, 3.2, 1.1); esp.rotation.x = -0.9 + Math.PI / 2; g.add(esp);
    };
    irmao(1); irmao(-1);
    const ins = ctex(512, 96, g => { g.fillStyle = 'rgba(24,20,32,.0)'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#e8dcc8'; g.font = 'bold 34px Georgia'; g.textAlign = 'center'; g.shadowColor = '#ffd890'; g.shadowBlur = 10; g.fillText('ANTES DE HAVER DOIS,', 256, 40); g.fillText('HOUVE UM.', 256, 82); });
    const ip = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.86), new THREE.MeshBasicMaterial({ map: ins, transparent: true, toneMapped: false })); ip.position.set(HALL.x, sy + 0.62, HALL.z + 3.02); G.add(ip);
    const luz = new THREE.PointLight(0xffd8a0, 1.4, 34); luz.position.set(HALL.x, sy + 9, HALL.z); G.add(luz);
    const lt = new THREE.PointLight(0xff8a50, 0.9, 20); lt.position.set(TUN.x, sy + 4, (TUN.z0 + TUN.z1) / 2); G.add(lt);
  })();

  // ---------------------------------------------------------------- passagem de volta para Valdora (arco igual ao das outras passagens)
  if (typeof Valdora !== 'undefined' && Valdora.arch) Valdora.arch(G, FGATE.x - 1, FGATE.z, -Math.PI / 2, '← Valdora', h(FGATE.x - 1, FGATE.z));

  // ---------------------------------------------------------------- horizonte: montanhas escuras e névoa baixa entre as árvores
  (function horizonte() {
    const P2 = [], C = [], I = [], cx = B.x0 + B.w / 2, cz = B.z0 + B.h / 2;
    const n = 120; for (let i = 0; i <= n; i++) {
      const a = i / n * TAU, x = cx + Math.cos(a) * (B.w / 2 + 70), z = cz + Math.sin(a) * (B.h / 2 + 70), hh = 30 + 30 * (0.5 + 0.5 * Math.sin(a * 6 + 1.3) * Math.cos(a * 2.7)) + (Math.sin(a) < -0.3 ? 30 : 0);
      P2.push(x, -5, z, x, hh, z); C.push(0.12, 0.11, 0.14, 0.2, 0.19, 0.24);
      if (i < n) { const b = i * 2; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setIndex(I);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false })); m.frustumCulled = false; G.add(m);
  })();
  // esporos parados no ar (a floresta "prendia a respiração")
  const esporos = (() => {
    const N = TOUCH ? 70 : 140, pos = new Float32Array(N * 3), sd = [];
    for (let i = 0; i < N; i++) sd.push([rand(-24, 24), rand(0.5, 9), rand(-24, 24), rand(0, 9)]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xb89aff, size: 0.12, transparent: true, opacity: 0.6, depthWrite: false })); pts.frustumCulled = false; G.add(pts);
    return { pts, pos, sd, N };
  })();
  fundir(ARQ);

  // ---------------------------------------------------------------- mapas (minimapa e mapa grande)
  const map = { x0: B.x0, z0: B.z0, w: B.w, h: B.h, places: [[CLAR, 'Clareira de Lira'], [GUARD, 'Pilares da Ordem'], [{ x: WALL.x, z: WALL.z + 2 }, 'Templo da Primeira Raiz'], [{ x: FGATE.x + 4, z: FGATE.z }, '← Valdora']], cities: [{ c: CLAR, z: 'clareira', n: 'Clareira de Lira', R: 16 }] };
  function paint(W, H) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), img = x.createImageData(W, H), col = new THREE.Color();
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const wx = B.x0 + (i + 0.5) / W * B.w, wz = B.z0 + (j + 0.5) / H * B.h, y = h(wx, wz), m = mix(wx, wz, y);
      col.setRGB(m.t[0] * 0.5, m.t[1] * 0.5, m.t[2] * 0.52); const l = 0.8 + Math.min(0.6, y * 0.03);
      if (m.w[0] > 0.9) col.setRGB(0.42, 0.34, 0.28); if (m.w[3] > 0.5) col.setRGB(0.22, 0.2, 0.24); if (m.w[2] > 0.9) col.setRGB(0.4, 0.38, 0.44);
      const o = (j * W + i) * 4; img.data[o] = Math.min(255, col.r * 255 * l); img.data[o + 1] = Math.min(255, col.g * 255 * l); img.data[o + 2] = Math.min(255, col.b * 255 * l); img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const k = W / B.w; x.fillStyle = '#7ad8ff'; x.beginPath(); x.arc((GUARD.x - B.x0) * k, (GUARD.z - B.z0) * k, Math.max(1.5, 4 * k), 0, TAU); x.fill();
    x.fillStyle = '#ffd890'; x.beginPath(); x.arc((HALL.x - B.x0) * k, (HALL.z - B.z0) * k, Math.max(1.5, 4 * k), 0, TAU); x.fill();
    return c;
  }
  let painted = false;
  map.pintar = () => ensureMaps();
  function ensureMaps() { if (painted) return; painted = true; map.mm = paint(180, 144); map.base = paint(B.w, B.h); }

  // ---------------------------------------------------------------- atravessar as passagens (Valdora ↔ Floresta)
  function blackout() { const f = document.getElementById('tfade'); if (!f) return; f.style.transition = 'none'; f.style.opacity = 1; void f.offsetWidth; f.style.transition = 'opacity .7s'; requestAnimationFrame(() => requestAnimationFrame(() => { f.style.opacity = 0; })); }
  function go(to) {
    const t = to === 'floresta' ? { x: FGATE.x + 17, z: FGATE.z, face: Math.PI / 2 } : { x: VGATE_VF.x - 17, z: VGATE_VF.z, face: -Math.PI / 2 };
    P.x = t.x; P.z = t.z; P.y = groundY(P.x, P.z); P.vy = 0; P.face = t.face; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.yaw = P.face + Math.PI; camS.dist = Math.min(camS.dist, 12); camS.cur = 6;
    if (typeof AUTO !== 'undefined') { AUTO.cx = P.x; AUTO.cz = P.z; AUTO.chk = 0; AUTO.tgT = 0; }
    blackout(); Audio8.sfx('warp');
    if (to === 'floresta') { if (!P.florestaSeen) { P.florestaSeen = 1; log('🌲 <i>"Quando Kravenox entrou, o vento se calou. Nenhum pássaro, nenhum inseto, nenhum animal. A floresta prendia a respiração."</i> Siga a trilha até a <b>Clareira de Lira</b>.', 'gold'); } }
    else log('Você voltou às <b>Terras de Valdora</b>.', 'sys');
  }
  let dentro = false, armada = true, cool = 0;
  function update(dt) {
    cool -= dt;
    const v = inFlo(P.x, P.z); if (v !== dentro) { dentro = v; G.visible = v; if (v) ensureMaps(); }
    const dV = Math.hypot(P.x - VGATE_VF.x, P.z - VGATE_VF.z), dF = Math.hypot(P.x - FGATE.x, P.z - FGATE.z);
    if (!armada && (v ? dF : dV) > 7) armada = true;
    if (!P.dead && cool <= 0 && armada) {
      if (!v && inVal(P.z) && dV < 3.4) { if (P.lv < 38) { if (dV < 2) { if (typeof autoStop === 'function') autoStop(''); log('🌲 Uma força fria te empurra de volta. <b>A Floresta Morta é para o nível 40</b> (a partir do 38).', 'bad'); P.x -= 3; } } else { cool = 1.5; armada = false; go('floresta'); return; } }
      if (v && dF < 3.4) { cool = 1.5; armada = false; go('valdora'); return; }
    }
    if (!v) return;
    for (const f of fogo) f.material.opacity = 0.7 + Math.sin(time * 5 + f.position.x) * 0.15;
    for (const r of runas) r.material.opacity = 0.4 + Math.sin(time * 1.5) * 0.15;
    // as vozes dos cristais do túnel
    for (const vz of vozes) { const d = Math.hypot(P.x - vz.x, P.z - vz.z); if (!vz.dita && d < 2.2) { vz.dita = true; log(`<i style="color:#e8d8ff">${vz.txt}</i>`, 'sys'); } else if (vz.dita && d > 12) vz.dita = false; }
    const E = esporos; for (let i = 0; i < E.N; i++) { const s = E.sd[i]; E.pos[i * 3] = P.x + s[0] + Math.sin(time * 0.2 + i) * 0.4; E.pos[i * 3 + 1] = P.y + s[1] + Math.sin(time * 0.3 + s[3]) * 0.3; E.pos[i * 3 + 2] = P.z + s[2]; }
    E.pts.geometry.attributes.position.needsUpdate = true;
  }
  return { h, out, zona, update, map, G, get dentro() { return dentro; } };
})();
