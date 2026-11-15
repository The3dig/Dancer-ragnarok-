// =====================================================================
//  Praia de Cômodo — lugar tranquilo, criado para o jogo (não está no livro).
//  Pedido do Rone: um amigo dele nasceu lá. Sem monstros: areia, mar,
//  vila de pescadores, píer com pesca, barcos, palmeiras e um farol.
//  Mapa a oeste (x < -250, z < -300). Passagem no oeste do Reino, perto
//  da Vila de Solmira; a viagem rápida também leva até aqui.
// =====================================================================
'use strict';
const Praia = (() => {
  const B = { x0: -600, z0: -880, w: 300, h: 240 };
  const VILA = PVILA, FAROL = PFAROL, PZ = PPIER.z;
  const SHORE = z => -522 + Math.sin(z * 0.035) * 6 + Math.sin(z * 0.011) * 4;      // linha da água (a oeste é mar)
  const P0 = SHORE(PZ), PIER = { x0: P0 - 32, x1: P0 + 4, z: PZ, w: 1.7 };
  const noPier = (x, z) => x > PIER.x0 && x < PIER.x1 && Math.abs(z - PIER.z) < PIER.w;
  const PESCA = { x: PIER.x0 + 2.5, z: PIER.z };

  // ---------------------------------------------------------------- relevo
  function h(x, z) {
    if (noPier(x, z)) return 1.35;
    const d = x - SHORE(z);
    let y;
    if (d < 0) y = -1.4 + Math.max(-5, d * 0.07);                                // mar
    else if (d < 42) y = 0.15 + d * 0.022 + Math.sin(z * 0.3 + x * 0.1) * 0.15 * smooth(5, 20, d);   // areia com dunas baixas
    else y = 1.1 + Math.sin(x * 0.05) * Math.cos(z * 0.06) * 1.4 * smooth(42, 70, d);
    y = lerp(y, 1.1, (1 - smooth(26, 36, Math.hypot(x - VILA.x, z - VILA.z))) * smooth(30, 42, d));
    const df = Math.hypot(x - FAROL.x, z - FAROL.z); if (df < 14) y = Math.max(y, 3.2 * (1 - smooth(6, 14, df)) + y * smooth(6, 14, df));   // rochas do farol
    const e = Math.max(x - (B.x0 + B.w - 8), B.z0 + 8 - z, z - (B.z0 + B.h - 8), 0);
    return y + e * 1.6;
  }
  function out(x, z, r = 0.45) {
    if (x < B.x0 + 4 + r || x > B.x0 + B.w - 4 - r || z < B.z0 + 4 + r || z > B.z0 + B.h - 4 - r) return true;
    if (noPier(x, z)) return Math.abs(z - PIER.z) > PIER.w - r || x < PIER.x0 + r;
    return x - SHORE(z) < 1.2 + r;                                              // ninguém entra no mar
  }
  const zona = () => 'praia';
  PRAIA_H = h; PRAIA_OUT = out; PRAIA_ZONA = zona;                              // o jogo já pode perguntar o relevo daqui

  function mix(x, z, y) {
    const n = Math.sin(x * 0.8) * Math.cos(z * 0.7) * 0.03 + Math.sin(x * 0.23 + z * 0.19) * 0.03;
    const d = x - SHORE(z), t = [0.95 + n, 0.93 + n, 0.86 + n], w = [0, 0, 0, 0];
    w[1] = 1 - smooth(34, 46, d);                                               // areia até o começo da vila
    if (d < 3) { t[0] = 0.78; t[1] = 0.74; t[2] = 0.68; }                          // areia molhada
    if (Math.hypot(x - VILA.x, z - VILA.z) < 16) { w[2] = Math.max(w[2], 1 - smooth(13, 16, Math.hypot(x - VILA.x, z - VILA.z))); }   // pracinha
    if (Math.hypot(x - FAROL.x, z - FAROL.z) < 10) { w[3] = 1; w[1] = 0; }
    return { t, w };
  }

  // ---------------------------------------------------------------- tudo do mapa vai num grupo
  const G = new THREE.Group(); G.visible = false; scene.add(G);
  const ARQ = new THREE.Group(); G.add(ARQ);
  const ctex = (w, hh, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; draw(c.getContext('2d'), w, hh); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const madeira = PM('madeira.jpg', [1, 0.3], 0xb09070), madeiraE = PM('madeira.jpg', [0.4, 1], 0x6a5038), pedra = PM('pedra.jpg', [1, 1], 0x9a948c);

  // chão
  (function terreno() {
    const geo = new THREE.PlaneGeometry(B.w, B.h, TOUCH ? 150 : 220, TOUCH ? 120 : 176); geo.rotateX(-Math.PI / 2); geo.translate(B.x0 + B.w / 2, 0, B.z0 + B.h / 2);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), wts = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), y = h(x, z); pos.setY(i, y); const m = mix(x, z, y); col.set(m.t, i * 3); wts.set(m.w, i * 4); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aW', new THREE.BufferAttribute(wts, 4)); geo.computeVertexNormals();
    const t = new THREE.Mesh(geo, window.TERRAIN_MAT || new THREE.MeshLambertMaterial({ vertexColors: true })); t.receiveShadow = true; G.add(t);
  })();

  // mar até o horizonte, com a espuma das ondas na beira
  const mar = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), waterMat.clone());
  mar.material.color.setHex(0x2a7a9a); mar.material.opacity = 0.9; mar.position.set(B.x0 - 300, -0.35, B.z0 + B.h / 2); G.add(mar);
  const ESPUMA = ctex(64, 256, g => { const r = g.createLinearGradient(0, 0, 64, 0); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.55, 'rgba(255,255,255,.85)'); r.addColorStop(0.7, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 256); });
  const espumas = [];
  for (const k of [0, 1]) {                                                       // duas linhas de onda que vão e vêm
    const N = 80, pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) { const z = B.z0 + i / N * B.h, x = SHORE(z); pos.push(x - 3, 0, z, x + 1.2, 0, z); uv.push(0, i / 4, 1, i / 4); if (i < N) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: ESPUMA, transparent: true, depthWrite: false, opacity: 0.8 })); m.position.y = -0.25; m.renderOrder = 2; G.add(m); espumas.push({ m, ph: k * Math.PI });
  }

  // ---------------------------------------------------------------- vila de pescadores
  (function vila() {
    const casas = [[-14, -12, 0.3, '#2a7aa0'], [14, -13, -0.2, '#c0503a'], [-18, 6, 1.4, '#e8e0d0'], [17, 9, -1.5, '#2a7aa0'], [-4, -22, 0.1, '#c0503a'], [8, 22, 3.1, '#e8a040'], [-10, 20, 2.9, '#2a7aa0'], [24, -3, -1.57, '#c0503a']];
    const casasG = new THREE.Group(); G.add(casasG);
    for (const [dx, dz, r, cor] of casas) { const g = house(VILA.x + dx, VILA.z + dz, r, 5.5, 4.6, cor, 'wood'); scene.remove(g); casasG.add(g); }
    fundir(casasG);
    // poço da pracinha e redes secando
    const po = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.9, 16, 1, true), pedra); po.position.set(VILA.x, h(VILA.x, VILA.z) + 0.45, VILA.z); ARQ.add(po); addOb(VILA.x, VILA.z, 1.3);
    const REDE = ctex(128, 64, g => { g.strokeStyle = 'rgba(70,60,40,.9)'; g.lineWidth = 1.5; for (let i = 0; i <= 128; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i - 20, 64); g.stroke(); g.beginPath(); g.moveTo(i - 20, 0); g.lineTo(i, 64); g.stroke(); } });
    const rm = new THREE.MeshLambertMaterial({ map: REDE, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    for (const [x, z, r] of [[VILA.x - 30, VILA.z - 14, 0.3], [VILA.x - 33, VILA.z + 10, -0.2], [VILA.x - 46, VILA.z - 30, 0.9]]) {
      for (const o of [-1.6, 1.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.4, 6), madeiraE); p.position.set(x + Math.cos(r) * o, h(x, z) + 1.2, z - Math.sin(r) * o); ARQ.add(p); }
      const n = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6, 6, 2), rm); n.position.set(x, h(x, z) + 1.4, z); n.rotation.y = r; const ps = n.geometry.attributes.position; for (let i = 0; i < ps.count; i++) ps.setY(i, ps.getY(i) - Math.cos(ps.getX(i) / 3.2 * Math.PI) * 0.25); G.add(n);
      addOb(x, z, 1.4);
    }
    // barracas de peixe na pracinha
    for (const [dx, dz, r] of [[-8, 9, 0.6], [9, -6, -2.4]]) {
      const x = VILA.x + dx, z = VILA.z + dz, y = h(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = r; ARQ.add(g);
      const bal = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 1.1), madeira); bal.position.y = 0.45; g.add(bal);
      for (const o of [-1.2, 1.2]) for (const q of [-0.5, 0.5]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), madeiraE); p.position.set(o, 1.2, q); g.add(p); }
      const toldo = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.5), new THREE.MeshLambertMaterial({ color: 0x3a8ab0, side: THREE.DoubleSide })); toldo.position.set(0, 2.4, 0); toldo.rotation.x = -Math.PI / 2 + 0.2; g.add(toldo);
      for (let k = 0; k < 5; k++) { const pe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshLambertMaterial({ color: [0x9ab0c0, 0xc06a4a, 0xb0b8c0][k % 3] })); pe.scale.set(2.2, 0.6, 0.8); pe.position.set(-0.9 + k * 0.45, 0.98, 0.1); g.add(pe); }
      addOb(x, z, 1.5);
    }
  })();

  // ---------------------------------------------------------------- palmeiras (as do Oásis), mais altas e tortas pelo vento do mar
  (function palmeiras() {
    const lista = [];
    for (let i = 0; i < 800 && lista.length < 46; i++) {
      const z = rand(B.z0 + 10, B.z0 + B.h - 10), x = SHORE(z) + rand(6, 70);
      if (Math.abs(z - PZ) < 6 || Math.hypot(x - VILA.x, z - VILA.z) < 30 || Math.hypot(x - FAROL.x, z - FAROL.z) < 14 || lista.some(o => Math.hypot(o.x - x, o.z - z) < 7)) continue;
      lista.push({ x, z, s: rand(1.1, 1.6), lean: rand(0.15, 0.4), r: rand(-0.6, 0.6) });
    }
    const casca = PM('casca.jpg', [1, 3], 0xb0a088);
    for (const p of lista) {
      const g = new THREE.Group(); g.position.set(p.x, h(p.x, p.z), p.z); g.scale.setScalar(p.s); g.rotation.y = Math.PI / 2 + p.r; G.add(g);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 4.6, 8), casca); tr.position.y = 2.25; tr.rotation.z = p.lean; g.add(tr);
      const top = new THREE.Mesh(PALM_G, palmMat); top.position.set(-Math.sin(p.lean) * 4.5, 4.45, 0); g.add(top);
      addOb(p.x, p.z, 0.5);
    }
  })();

  // ---------------------------------------------------------------- píer, barcos e fogueira
  (function pier() {
    const y = 1.35, L = PIER.x1 - PIER.x0;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(L, 0.18, PIER.w * 2), PM('madeira.jpg', [8, 1], 0xa08060)); deck.position.set((PIER.x0 + PIER.x1) / 2, y - 0.09, PIER.z); ARQ.add(deck);
    for (let x = PIER.x0 + 0.5; x < PIER.x1; x += 3) for (const o of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 4, 7), madeiraE); p.position.set(x, y - 1.6, PIER.z + o * (PIER.w - 0.1)); ARQ.add(p); }
    for (const o of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, L, 6).rotateZ(Math.PI / 2), madeiraE); c.position.set((PIER.x0 + PIER.x1) / 2, y + 0.9, PIER.z + o * (PIER.w - 0.1)); ARQ.add(c);
      for (let x = PIER.x0 + 0.5; x < PIER.x1; x += 3) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), madeiraE); p.position.set(x, y + 0.45, PIER.z + o * (PIER.w - 0.1)); ARQ.add(p); } }
    // banquinho e balde de iscas na ponta (onde se pesca)
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 10), madeira); b.position.set(PESCA.x + 0.8, y + 0.42, PESCA.z + 0.9); ARQ.add(b);
    const balde = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 10), PM('madeira.jpg', [0.4, 0.4], 0x7a5a3a)); balde.position.set(PESCA.x + 0.2, y + 0.2, PESCA.z - 1.0); ARQ.add(balde);
  })();
  const barcos = [];
  function barco(x, z, r, cor, flutua) {
    const g = new THREE.Group(); g.position.set(x, flutua ? -0.3 : h(x, z) + 0.05, z); g.rotation.set(0, r, flutua ? 0 : 0.15); (flutua ? G : ARQ).add(g);
    const casco = new THREE.LatheGeometry([[0, -0.1], [0.7, 0], [0.95, 0.35], [1.0, 0.6]].map(([a, b]) => new THREE.Vector2(a, b)), 16, 0, Math.PI);
    casco.rotateZ(Math.PI / 2); casco.scale(1, 1, 2.6);
    const m = new THREE.Mesh(casco, new THREE.MeshLambertMaterial({ color: cor, side: THREE.DoubleSide })); m.rotation.x = Math.PI; m.position.y = 0.6; g.add(m);
    const banco = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.35), madeira); banco.position.set(0, 0.45, 0); g.add(banco);
    const remo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 5), madeiraE); remo.position.set(0.5, 0.6, 0.3); remo.rotation.set(0.2, 0, 1.2); g.add(remo);
    if (flutua) barcos.push({ g, ph: Math.random() * 6 }); else addOb(x, z, 1.4);
  }
  barco(SHORE(PZ - 14) + 8, PZ - 14, 0.4, 0x2a6a9a); barco(SHORE(PZ + 16) + 7, PZ + 16, -0.3, 0xc0503a); barco(SHORE(PZ + 40) + 9, PZ + 40, 1.2, 0xe8e0d0);
  barco(PIER.x0 + 9, PIER.z + 4.2, 0.1, 0x3a8a6a, true); barco(PIER.x0 + 16, PIER.z - 4.4, -0.2, 0xd08a30, true);
  // fogueira do luau na areia
  const fogo = (() => { const x = SHORE(PZ + 26) + 14, z = PZ + 26, y = h(x, z);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), pedra); s.position.set(x + Math.cos(a) * 0.9, y + 0.12, z + Math.sin(a) * 0.9); ARQ.add(s); }
    for (const [dx, dz, r] of [[-2.6, 0, 1.57], [2.6, 0.3, 1.4], [0, 2.7, 0]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 2.2, 8).rotateZ(Math.PI / 2), madeiraE); t.position.set(x + dx, y + 0.3, z + dz); t.rotation.y = r; ARQ.add(t); }
    const F = ctex(64, 128, g => { const r = g.createRadialGradient(32, 92, 2, 32, 80, 50); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.3, 'rgba(255,170,60,.95)'); r.addColorStop(0.7, 'rgba(255,60,20,.4)'); r.addColorStop(1, 'rgba(120,0,0,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(62, 70, 32, 124); g.quadraticCurveTo(2, 70, 32, 4); g.fill(); });
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: F, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); f.position.set(x, y + 0.8, z); f.scale.set(1.2, 1.9, 1); G.add(f);
    const l = new THREE.PointLight(0xff9a50, 1.1, 16); l.position.set(x, y + 1.5, z); G.add(l); addOb(x, z, 1.0); return f; })();

  // ---------------------------------------------------------------- o farol nas pedras (a luz gira à noite)
  const farol = (() => {
    const y = h(FAROL.x, FAROL.z);
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, r = rand(4, 9), x = FAROL.x + Math.cos(a) * r, z = FAROL.z + Math.sin(a) * r; const p = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(1.2, 2.4), 0), pedra); p.position.set(x, h(x, z) - 0.4, z); p.rotation.set(rand(0, 3), rand(0, 3), 0); ARQ.add(p); }
    const LIST = ctex(16, 128, g => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#c03030' : '#f4f0e8'; g.fillRect(0, i * 16, 16, 16); } });
    const torre = new THREE.Mesh(new THREE.LatheGeometry([[2.4, 0], [2.2, 0.6], [1.6, 13], [1.9, 13.3], [1.9, 13.7], [0, 13.7]].map(([r, yy]) => new THREE.Vector2(r, yy)), 20), new THREE.MeshLambertMaterial({ map: LIST })); torre.position.set(FAROL.x, y - 0.3, FAROL.z); G.add(torre);
    const vidro = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.8, 12), new THREE.MeshBasicMaterial({ color: 0xfff0b0, toneMapped: false })); vidro.position.set(FAROL.x, y + 14.4, FAROL.z); G.add(vidro);
    const teto = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 12), new THREE.MeshLambertMaterial({ color: 0xc03030 })); teto.position.set(FAROL.x, y + 16, FAROL.z); G.add(teto);
    const feixe = new THREE.Mesh(new THREE.ConeGeometry(3.5, 40, 16, 1, true).rotateZ(Math.PI / 2).translate(20, 0, 0), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    const pivo = new THREE.Group(); pivo.position.set(FAROL.x, y + 14.4, FAROL.z); pivo.add(feixe); G.add(pivo);
    addOb(FAROL.x, FAROL.z, 2.6); return { pivo, feixe };
  })();

  // ---------------------------------------------------------------- gaivotas
  const GAIV = ctex(64, 32, g => { g.strokeStyle = '#f4f4f4'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(4, 12); g.quadraticCurveTo(18, 2, 32, 16); g.quadraticCurveTo(46, 2, 60, 12); g.stroke(); });
  const gaivotas = Array.from({ length: 7 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GAIV, transparent: true, depthWrite: false })); s.scale.set(1.3, 0.65, 1); G.add(s); return { s, r: rand(14, 30), ph: rand(0, TAU), v: rand(0.15, 0.3), y: rand(9, 16), cx: SHORE(VILA.z) + rand(-20, 20), cz: VILA.z + rand(-50, 50) }; });

  // ---------------------------------------------------------------- passagem de volta para o Reino (e a do Reino para cá)
  if (typeof Valdora !== 'undefined' && Valdora.arch) {
    Valdora.arch(G, PGATE.x + 1, PGATE.z, Math.PI / 2, 'Reino Quebrado →', h(PGATE.x + 1, PGATE.z));
    Valdora.arch(scene, RGATE_P.x - 1, RGATE_P.z, -Math.PI / 2, '← Praia de Cômodo', groundY(RGATE_P.x - 1, RGATE_P.z));
  }
  fundir(ARQ);

  // ---------------------------------------------------------------- mapas
  const map = { x0: B.x0, z0: B.z0, w: B.w, h: B.h, places: [[VILA, 'Vila de Cômodo'], [{ x: PESCA.x, z: PESCA.z }, 'Píer (pesca)'], [FAROL, 'Farol'], [{ x: PGATE.x - 4, z: PGATE.z }, 'Reino →']], cities: [{ c: VILA, z: 'praia', n: 'Praia de Cômodo', R: 30 }] };
  function paint(W, H) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), img = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const wx = B.x0 + (i + 0.5) / W * B.w, wz = B.z0 + (j + 0.5) / H * B.h, d = wx - SHORE(wz), o = (j * W + i) * 4;
      let r, g, b;
      if (noPier(wx, wz)) { r = 140; g = 104; b = 70; } else if (d < 0) { r = 40; g = 110 + Math.max(-40, d) | 0; b = 150; } else if (d < 40) { r = 226; g = 206; b = 150; } else { r = 96; g = 140; b = 70; }
      img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); return c;
  }
  let painted = false;
  function ensureMaps() { if (painted) return; painted = true; map.mm = paint(180, 144); map.base = paint(B.w, B.h); }

  // ---------------------------------------------------------------- pesca no píer (como no Ragnarok: fica parado, a vara balança e vem o peixe)
  const PEIXES = [['sardinha', 34], ['tainha', 24], ['robalo', 16], ['polvo', 9], ['lagosta', 5], ['concha_rara', 3], ['garrafa', 2], ['perola', 1]];
  const NOVOS = {
    sardinha: ['Sardinha', '🐟', 8, 'comida', { heal: 0.06 }], tainha: ['Tainha', '🐟', 15, 'comida', { heal: 0.1 }], robalo: ['Robalo', '🐠', 30, 'comida', { heal: 0.15 }],
    polvo: ['Polvo', '🐙', 60, 'comida', { heal: 0.2 }], lagosta: ['Lagosta', '🦞', 150, 'comida', { heal: 0.35 }],
    concha_rara: ['Concha Rara', '🐚', 800, 'mat'], perola: ['Pérola de Cômodo', '⚪', 2500, 'mat'], garrafa: ['Garrafa com Mensagem', '🍾', 1, 'mat', { use: 'garrafa' }],
  };
  for (const [id, [name, ic, sell, kind, ex]] of Object.entries(NOVOS)) ITEMS[id] = { name, ic, sell, price: sell * 2, kind, ...(ex || {}) };
  let pescando = null;
  const S = () => (P.pesca = P.pesca || { n: 0 });
  function pescar() {
    if (pescando || P.dead) return;
    pescando = { t: rand(3, 6), x: P.x, z: P.z }; P.face = -Math.PI / 2; Audio8.sfx('click');
    log('🎣 Você joga a linha no mar… fique parado.', 'sys');
  }
  function fisgou() {
    let r = Math.random() * PEIXES.reduce((t, p) => t + p[1], 0), id = PEIXES[0][0];
    for (const [pid, w] of PEIXES) { if ((r -= w) <= 0) { id = pid; break; } }
    P.inv[id] = (P.inv[id] || 0) + 1; const s = S(); s.n++;
    Audio8.sfx(id === 'perola' ? 'level' : 'pick'); floater(P.x, P.y + 2.4, P.z, ITEMS[id].ic, 'heal');
    log(`🎣 Você pescou <b>${ITEMS[id].ic} ${ITEMS[id].name}</b>!${id === 'perola' ? ' Que sorte!' : ''} <small>(${s.n} peixes no total)</small>`, id === 'perola' || id === 'lagosta' ? 'gold' : 'item');
    if (s.n === 100 && typeof Cos !== 'undefined' && Cos.ganhar) { Cos.ganhar('titulo', 'comodo'); banner('🎣 FILHO DE CÔMODO'); log('🎣 Cem peixes! O Zé do Mar te dá o título <b>« Filho de Cômodo »</b>.', 'gold'); }
    if (typeof save === 'function') save();
  }
  if (typeof Cos !== 'undefined' && Cos.exclusivo) Cos.exclusivo('titulo', 'comodo', '« Filho de Cômodo »', '🎣', { desafio: 'Pesque 100 peixes no píer da Praia de Cômodo' });
  // a garrafa: abre e sai uma mensagem (e às vezes umas coroas)
  const MSGS = ['"Quem achar esta garrafa: o mar de Cômodo devolve tudo, cedo ou tarde."', '"Saudades da praia. Volto no verão."', '"Se você está lendo isto, olhe o pôr do sol do farol."', '"Aqui nasceu gente boa. Cuide bem deste lugar."'];
  function abrirGarrafa() { if (!(P.inv.garrafa > 0)) return; P.inv.garrafa--; const cr = Math.random() < 0.5 ? irand(100, 600) : 0; P.zeny += cr; dialog('🍾 Garrafa com Mensagem', `${MSGS[irand(0, MSGS.length - 1)]}${cr ? `<br><br>Dentro, enrolado no papel: <b>${cr} cr</b>.` : ''}`); }
  function nearest() {
    if (!inPraia(P.x, P.z)) return null;
    if (Math.hypot(P.x - PESCA.x, P.z - PESCA.z) < 3.2) return { label: pescando ? '🎣 Pescando…' : '🎣 Pescar', fn: pescar };
    return null;
  }
  function talk(n) {
    const eu = P.name;
    if (n.id === 'pescador') dialog(`💬 ${n.name}`, `Ô, <b>${eu}</b>! Aqui em Cômodo ninguém tem pressa. Vai lá na ponta do píer e joga a linha: sardinha, tainha, robalo, polvo… e, com sorte, uma <b>Pérola de Cômodo</b>.<br><small>Peixe cura (é só comer pela mochila ou pôr na barra). Quem pescar <b>100 peixes</b> ganha o título « Filho de Cômodo ». Você já pescou <b>${S().n}</b>.</small>`);
    else dialog(`💬 ${n.name}`, `Esse farol nunca apagou, <b>${eu}</b>. Nem no dia do Cisma. Daqui de cima dá para ver o mar inteiro… e às vezes umas garrafas boiando com mensagens de quem foi embora.<br><small>Se pescar uma, abra pela mochila.</small>`);
  }

  // ---------------------------------------------------------------- atravessar as passagens (Reino ↔ Praia)
  function blackout() { const f = document.getElementById('tfade'); if (!f) return; f.style.transition = 'none'; f.style.opacity = 1; void f.offsetWidth; f.style.transition = 'opacity .7s'; requestAnimationFrame(() => requestAnimationFrame(() => { f.style.opacity = 0; })); }
  function go(to) {
    const t = to === 'praia' ? { x: PGATE.x - 15, z: PGATE.z, face: -Math.PI / 2 } : { x: RGATE_P.x + 12, z: RGATE_P.z, face: Math.PI / 2 };
    P.x = t.x; P.z = t.z; P.y = groundY(P.x, P.z); P.vy = 0; P.face = t.face; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.yaw = P.face + Math.PI; camS.dist = Math.min(camS.dist, 12); camS.cur = 6;
    if (typeof AUTO !== 'undefined') { AUTO.cx = P.x; AUTO.cz = P.z; AUTO.chk = 0; AUTO.tgT = 0; }
    blackout(); Audio8.sfx('warp');
    if (to === 'praia') { P.warps = P.warps || {}; P.warps.praia = 1; if (!P.praiaSeen) { P.praiaSeen = 1; log('🏖️ O cheiro do mar chega antes da vista: <b>Praia de Cômodo</b>. Aqui não tem monstro. Descanse, pesque no píer e veja o pôr do sol do farol.', 'gold'); } }
    else log('Você voltou ao <b>Reino Quebrado</b>.', 'sys');
  }
  let dentro = false, armada = true, cool = 0;
  function update(dt) {
    cool -= dt;
    const v = inPraia(P.x, P.z); if (v !== dentro) { dentro = v; G.visible = v; if (v) ensureMaps(); }
    const dR = Math.hypot(P.x - RGATE_P.x, P.z - RGATE_P.z), dP = Math.hypot(P.x - PGATE.x, P.z - PGATE.z);
    if (!armada && (v ? dP : dR) > 7) armada = true;
    if (!P.dead && cool <= 0 && armada) {
      if (!v && !inVal(P.z) && !inTower(P.z) && dR < 3.4) { cool = 1.5; armada = false; go('praia'); return; }
      if (v && dP < 3.4) { cool = 1.5; armada = false; go('reino'); return; }
    }
    if (pescando) {
      if ((P.moving && Math.hypot(P.x - pescando.x, P.z - pescando.z) > 1.5) || P.dead) { pescando = null; log('A linha soltou: você saiu do lugar.', 'sys'); }
      else if ((pescando.t -= dt) <= 0) { pescando = null; fisgou(); }
    }
    if (!v) return;
    const t = time;
    for (const e of espumas) { const k = Math.sin(t * 0.6 + e.ph); e.m.position.x = k * 1.6 - 0.8; e.m.material.opacity = 0.45 + 0.4 * Math.max(0, k); }
    for (const b of barcos) { b.g.position.y = -0.3 + Math.sin(t * 1.3 + b.ph) * 0.12; b.g.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.06; }
    farol.pivo.rotation.y = t * 0.6; farol.feixe.material.opacity = 0.05 + 0.18 * (LASTDAY ? LASTDAY.night : 0.3);
    fogo.scale.set(1.2 * (1 + Math.sin(t * 9) * 0.08), 1.9 * (1 + Math.sin(t * 11) * 0.1), 1);
    for (const g of gaivotas) { g.ph += dt * g.v; g.s.position.set(g.cx + Math.cos(g.ph) * g.r, g.y + Math.sin(g.ph * 3) * 0.6, g.cz + Math.sin(g.ph) * g.r); }
  }
  return { update, map, nearest, talk, abrirGarrafa, get dentro() { return dentro; } };
})();
