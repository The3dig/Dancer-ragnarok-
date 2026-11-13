// =====================================================================
//  Reino Quebrado — Cidadela do Cisma e a Torre do Cisma (30 andares + topo)
//  Inimigos do universo Kravenox: Larvas da Essência, Vermes de Dentes,
//  Sentinelas Esféricas e Sentinelas do Vazio. No topo dorme Kravenox.
// =====================================================================
'use strict';
const Tower = (() => {
  const STONE = 0x2a2430, STONE_D = 0x1a1620, PURPLE = 0x9a4dff, RED = 0xff2a2a;
  const glow = c => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 1 });
  const lam = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });

  // ---------------- Cidadela do Cisma
  [[CIT.x - 16, CIT.z - 8, 0.6], [CIT.x - 18, CIT.z + 14, 0.2], [CIT.x + 16, CIT.z + 14, -0.3], [CIT.x + 18, CIT.z - 6, -0.6], [CIT.x - 2, CIT.z + 20, 0]].forEach(([x, z, rot]) => {
    const g = new THREE.Group(); g.position.set(x, groundY(x, z), z); g.rotation.y = Math.atan2(CIT.x - x, CIT.z - z) + rot * 0; scene.add(g);
    const st = PM('pedra.jpg', [2.6, 2.0], 0x9890a4), st2 = PM('pedra.jpg', [0.5, 2], 0x8a8296);
    mesh(new THREE.BoxGeometry(5.5, 4.0, 5), st, 0, 2.0, 0, g);
    [-1, 1].forEach(a => [-1, 1].forEach(b => mesh(new THREE.BoxGeometry(0.7, 3.4, 0.9), st2, a * 2.85, 1.7, b * 2.3, g)));   // contrafortes
    mesh(new THREE.BoxGeometry(5.9, 0.35, 5.4), st2, 0, 4.1, 0, g);                                  // cornija
    const roof = mesh(new THREE.ConeGeometry(4.3, 5.2, 4), PM('telha.jpg', [5, 3], 0xb8a2a8), 0, 6.7, 0, g); roof.rotation.y = Math.PI / 4;
    mesh(new THREE.BoxGeometry(0.8, 3.2, 0.8), st2, 1.4, 7.2, -1.2, g);                               // chaminé
    mesh(new THREE.ConeGeometry(0.18, 1.4, 6), lam(0x2a2430), 0, 9.9, 0, g);
    mesh(new THREE.BoxGeometry(1.2, 2.2, 0.14), PM('madeira.jpg', [0.5, 1], 0x5a4038), 0, 1.1, 2.53, g);
    const winM = new THREE.MeshBasicMaterial({ color: 0x9a4a24 });
    [-1.7, 1.7].forEach(wx => { mesh(new THREE.BoxGeometry(0.6, 1.1, 0.1), winM, wx, 2.5, 2.53, g, false); const ar = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 10, 1, false, 0, Math.PI), winM, wx, 3.05, 2.53, g, false); ar.rotation.set(Math.PI / 2, 0, Math.PI / 2); });
    addOb(x, z, 3.6);
  });
  // cristais roxos e tochas pela cidade
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * TAU, r = 25 + (i % 3) * 3, x = CIT.x + Math.cos(a) * r, z = CIT.z + Math.sin(a) * r;
    if (Math.hypot(x - TOWER.x, z - TOWER.z) < 14 || Math.abs(z) < 4) continue;
    const c = mesh(new THREE.OctahedronGeometry(0.9), new THREE.MeshLambertMaterial({ color: 0x3a2050, emissive: 0x5a1a8a, emissiveIntensity: 0.55, flatShading: true }), x, groundY(x, z) + 1.3, z); c.scale.y = 2.2; c.rotation.y = a;
    addOb(x, z, 0.8);
  }

  // ---------------- Torre do Cisma (exterior)
  const ext = new THREE.Group(); ext.position.set(TOWER.x, groundY(TOWER.x, TOWER.z), TOWER.z); scene.add(ext);
  let ty = 0;
  for (let i = 0; i < 11; i++) {                                // 30 andares: a torre por fora ficou bem mais alta
    const r0 = 9.5 - i * 0.5, r1 = r0 - 0.45, h = 8.5;
    mesh(new THREE.CylinderGeometry(r1, r0, h, 20), PM('pedra.jpg', [8, 3.5], i % 2 ? 0x7a7088 : 0x625a70), 0, ty + h / 2, 0, ext);
    for (let k = 0; k < 8 && i % 2 === 0; k++) { const a = k / 8 * TAU + i * 0.2; if (i === 0 && Math.abs(Math.sin(a)) < 0.3 && Math.cos(a) > 0) continue; const b = mesh(new THREE.BoxGeometry(1.1, h * 0.9, 1.4), PM('pedra.jpg', [0.5, 3], 0x6a6278), Math.sin(a) * (r0 - 0.1), ty + h * 0.45, Math.cos(a) * (r0 - 0.1), ext); b.rotation.y = a; }
    mesh(new THREE.CylinderGeometry(r1 + 0.6, r1 + 0.6, 0.7, 20), PM('pedra.jpg', [8, 0.3], 0x585068), 0, ty + h, 0, ext);
    for (let k = 0; k < 4; k++) {                               // janelas vermelhas
      const a = k / 4 * TAU + i * 0.3, wr = (r0 + r1) / 2;
      const w = mesh(new THREE.BoxGeometry(0.9, 1.8, 0.2), glow(RED), Math.sin(a) * wr, ty + h * 0.55, Math.cos(a) * wr, ext, false); w.rotation.y = a;
    }
    ty += h;
  }
  // coroa de espinhos no topo (como a cabeça do Kravenox)
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * TAU, sp = mesh(new THREE.ConeGeometry(0.7, 5, 6), lam(0x120e16), Math.sin(a) * 4.6, ty + 2, Math.cos(a) * 4.6, ext);
    sp.rotation.x = Math.cos(a) * 0.35; sp.rotation.z = -Math.sin(a) * 0.35;
  }
  const beacon = mesh(new THREE.OctahedronGeometry(1.6), glow(RED), 0, ty + 4, 0, ext, false);
  // porta com portal (de frente para a cidade)
  const doorZ = TOWER.z + 9.6, doorX = TOWER.x;
  // entrada: arco de pedra com portal girando, degraus, braseiros e placa
  const stoneD = PM('pedra.jpg', [1, 3], 0x8a8098), dz = 10.2;
  mesh(new THREE.BoxGeometry(1.2, 7, 1.6), stoneD, -2.6, 3.5, dz, ext); mesh(new THREE.BoxGeometry(1.2, 7, 1.6), stoneD, 2.6, 3.5, dz, ext);   // colunas
  mesh(new THREE.BoxGeometry(6.6, 1.3, 1.8), stoneD, 0, 7.3, dz, ext);                                                                       // verga
  mesh(new THREE.ConeGeometry(0.8, 1.6, 4), stoneD, 0, 8.7, dz, ext);
  for (let k = 0; k < 3; k++) mesh(new THREE.BoxGeometry(6.2 - k * 0.6, 0.3, 1.2), stoneD, 0, 0.15 + k * 0.3, dz + 2.4 - k * 0.9, ext);   // degraus
  const swirlTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.translate(64, 64);
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 64); r.addColorStop(0, 'rgba(255,220,255,1)'); r.addColorStop(0.35, 'rgba(176,80,255,.9)'); r.addColorStop(1, 'rgba(60,0,110,.0)'); g.fillStyle = r; g.fillRect(-64, -64, 128, 128);
    for (let k = 0; k < 5; k++) { g.rotate(TAU / 5); g.beginPath(); for (let t = 0; t < 1; t += 0.02) g.lineTo(Math.cos(t * 5) * t * 60, Math.sin(t * 5) * t * 60); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 4; g.stroke(); }
    return new THREE.CanvasTexture(c); })();
  const portalM = new THREE.MeshBasicMaterial({ map: swirlTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const doorGlow = mesh(new THREE.CircleGeometry(1.75, 32), portalM, 0, 3.3, dz + 0.3, ext, false); doorGlow.scale.y = 1.6;
  const doorBack = mesh(new THREE.PlaneGeometry(4, 6.4), new THREE.MeshBasicMaterial({ color: 0x0a0010 }), 0, 3.2, dz - 0.3, ext, false);
  const fires = [];
  for (const sx of [-4.2, 4.2]) {                                                    // braseiros
    mesh(new THREE.CylinderGeometry(0.5, 0.3, 1.4, 8), stoneD, sx, 0.7, dz + 1.6, ext);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: swirlTex, color: 0xff8030, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); f.position.set(sx, 1.9, dz + 1.6); f.scale.set(1.4, 2, 1); ext.add(f); fires.push(f);
  }
  const sign = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d'); g.fillStyle = 'rgba(16,8,24,.75)'; g.fillRect(0, 0, 512, 96); g.strokeStyle = '#b070ff'; g.lineWidth = 4; g.strokeRect(2, 2, 508, 92);
    g.fillStyle = '#f2d8ff'; g.font = 'bold 44px Georgia'; g.textAlign = 'center'; g.fillText('Entrada da Torre', 256, 64);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); sp.scale.set(5, 0.95, 1); sp.position.set(0, 9.4, dz + 1); ext.add(sp); return sp; })();
  addOb(TOWER.x, TOWER.z, 9.6); addOb(TOWER.x - 2.6, TOWER.z + dz, 0.9); addOb(TOWER.x + 2.6, TOWER.z + dz, 0.9);
  const DOOR = { x: doorX, z: TOWER.z + dz + 1.2 };

  // ---------------- andares (fora do mapa, em z ≈ 420)
  const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const RUNE = ctex(256, 256, g => { g.translate(128, 128); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 120, 0, 6.29); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 100, 0, 6.29); g.stroke(); g.beginPath(); g.arc(0, 0, 46, 0, 6.29); g.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; g.beginPath(); g.moveTo(Math.cos(a) * 46, Math.sin(a) * 46); g.lineTo(Math.cos(a + 2.36) * 100, Math.sin(a + 2.36) * 100); g.stroke(); }
    g.font = 'bold 16px serif'; g.textAlign = 'center'; const R = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗ'; for (let i = 0; i < 20; i++) { g.save(); g.rotate(i / 20 * 6.283); g.fillText(R[i], 0, -105); g.restore(); } });
  const SWIRL = ctex(128, 128, g => { g.translate(64, 64); const r = g.createRadialGradient(0, 0, 0, 0, 0, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(-64, -64, 128, 128);
    for (let k = 0; k < 5; k++) { g.rotate(6.283 / 5); g.beginPath(); for (let t = 0; t < 1; t += 0.02) g.lineTo(Math.cos(t * 5) * t * 60, Math.sin(t * 5) * t * 60); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 5; g.stroke(); } });
  const FIRE = ctex(64, 128, g => { const r = g.createRadialGradient(32, 92, 2, 32, 80, 50); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.25, 'rgba(255,180,60,.95)'); r.addColorStop(0.6, 'rgba(255,70,20,.5)'); r.addColorStop(1, 'rgba(120,0,0,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(62, 70, 32, 124); g.quadraticCurveTo(2, 70, 32, 4); g.fill(); });
  const WINDOW = ctex(64, 128, g => { g.fillStyle = '#000'; g.fillRect(0, 0, 64, 128); const l = g.createLinearGradient(0, 0, 0, 128); l.addColorStop(0, '#ff6a40'); l.addColorStop(1, '#6a0010'); g.fillStyle = l; g.beginPath(); g.moveTo(8, 124); g.lineTo(8, 40); g.arc(32, 40, 24, Math.PI, 0); g.lineTo(56, 124); g.fill(); g.fillStyle = '#1a0a0a'; g.fillRect(30, 16, 4, 108); g.fillRect(8, 70, 48, 4); });
  const BANNER = ctex(64, 160, g => { g.fillStyle = '#4a0a14'; g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 0); g.lineTo(64, 140); g.lineTo(32, 160); g.lineTo(0, 140); g.fill(); g.fillStyle = '#b08a3a'; g.fillRect(0, 0, 64, 6); g.fillStyle = '#120608';
    g.beginPath(); g.arc(32, 66, 14, 0, 6.29); g.fill(); for (let k = 0; k < 7; k++) { const a = -Math.PI + k / 6 * Math.PI; g.beginPath(); g.moveTo(32 + Math.cos(a - 0.15) * 12, 66 + Math.sin(a - 0.15) * 12); g.lineTo(32 + Math.cos(a) * 28, 66 + Math.sin(a) * 28); g.lineTo(32 + Math.cos(a + 0.15) * 12, 66 + Math.sin(a + 0.15) * 12); g.fill(); }
    g.fillStyle = '#ff3a3a'; g.fillRect(26, 62, 4, 3); g.fillRect(34, 62, 4, 3); });
  const add_ = (map, color, o = {}) => new THREE.MeshBasicMaterial({ map, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, ...o });
  const FX = [];                                          // peças animadas do andar atual (runas, fogo, barreira, brasas)
  // três "alas" com cor própria: 1–10 roxa (Essência), 11–20 brasa (Cisma), 21–30 gelo do Vazio; o topo é vermelho
  const THEMES = [
    { wall: [1.45, 1.38, 1.6], rune: PURPLE, rune2: 0xc890ff, fire: [0xffffff, 0xc080ff], glow: [0x9a4dff, 0xff7a30], crys: [0x8a40ff, 0x4a10a0], ember: [0xb070ff, 0xff5a3a] },
    { wall: [1.5, 1.15, 1.05], rune: 0xff5a20, rune2: 0xffb060, fire: [0xffffff, 0xffa040], glow: [0xff5a20, 0xffa040], crys: [0xff4020, 0x801000], ember: [0xff7a30, 0xffd060] },
    { wall: [1.1, 1.3, 1.6], rune: 0x40c0ff, rune2: 0xa0e8ff, fire: [0xa0e0ff, 0xffffff], glow: [0x40a0ff, 0x80e0ff], crys: [0x60d0ff, 0x104080], ember: [0x80e0ff, 0xd0f0ff] },
  ];
  const TH = {};
  function theme(f) {
    const t = f.i === TOP ? 0 : Math.min(2, Math.floor(f.i / 10));
    if (TH[t]) return TH[t];
    const d = THEMES[t], C3 = (a, k = 1) => new THREE.Color(a[0] * k, a[1] * k, a[2] * k);
    return (TH[t] = { ...d,
      floorM: PM('calcada.jpg', [7, 7], C3(d.wall, 1.02)), wallM: PM('pedra.jpg', [1.4, 2.4], C3(d.wall)), wallM2: PM('pedra.jpg', [1.4, 2.4], C3(d.wall, 0.86)),
      colM: PM('pedra.jpg', [1, 3], C3(d.wall, 1.1)), trimM: PM('pedra.jpg', [3, 0.3], C3(d.wall, 0.7)), stepM: PM('pedra.jpg', [2, 0.2], C3(d.wall, 0.75)), corrM: PM('pedra.jpg', [5, 4], C3(d.wall, 0.8)),
      sideM: PM('pedra.jpg', [8, 0.4], 0x4a4458), topM: PM('calcada.jpg', [9, 9], 0x6a5a62),
      winM: new THREE.MeshBasicMaterial({ map: WINDOW, toneMapped: false, color: t === 1 ? 0xffd0a0 : t === 2 ? 0xa0d0ff : 0xffffff }),
      banM: new THREE.MeshLambertMaterial({ map: BANNER, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
      crM: new THREE.MeshPhongMaterial({ color: d.crys[0], emissive: d.crys[1], shininess: 90 }), darkM: new THREE.MeshBasicMaterial({ color: 0x000000 }), spikeM: lam(0x120e16) });
  }
  const opened = {};                                     // escadarias abertas (andar limpo)
  let built = null;                                      // andar construído agora (só um por vez: o celular agradece)
  function unbuild() {
    if (!built) return;
    scene.remove(built.g);
    built.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.isSprite && o.material) o.material.dispose(); });
    built.own.forEach(m => m.dispose()); FX.length = 0; built = null;
  }
  // escadaria (dir = -1 sobe ao norte, +1 desce ao sul), em coordenadas do andar
  function stairway(f, g, T, fx, dir) {
    const z0 = dir < 0 ? -f.r + 0.5 : f.r - 0.5, up = dir < 0 ? 1 : -1, N = 20, stepL = STAIR_L / N, own = fx.own;
    for (let k = 0; k < N; k++) {
      const top = (k + 0.5) / N * STAIR_H * up, bot = Math.min(top, 0) - 1.2;
      const st = mesh(new THREE.BoxGeometry(STAIR_W * 2 + 0.2, top - bot, stepL + 0.02), T.stepM, 0, (top + bot) / 2, z0 + dir * (k + 0.5) * stepL, g); st.castShadow = false; st.receiveShadow = true;
    }
    const zm = z0 + dir * STAIR_L / 2, yb = Math.min(0, STAIR_H * up) - 2, yt = Math.max(0, STAIR_H * up) + 10;
    for (const sx of [-1, 1]) {
      mesh(new THREE.BoxGeometry(1, yt - yb, STAIR_L + 1.5), T.corrM, sx * (STAIR_W + 0.6), (yt + yb) / 2, zm, g, false);
      for (let k = 1; k < 4; k++) {                                                 // tochas nas paredes da escadaria
        const tz = z0 + dir * k * STAIR_L / 4, ty = k / 4 * STAIR_H * up + 2.6;
        const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: T.fire[k % 2] })); fl.position.set(sx * (STAIR_W + 0.05), ty, tz); fl.scale.set(0.6, 1.1, 1); g.add(fl); fx.fires.push(fl);
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: SWIRL, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35, color: T.glow[k % 2] })); gl.position.set(sx * (STAIR_W - 0.2), ty, tz); gl.scale.setScalar(2.6); g.add(gl); fx.fires.push(gl);
      }
    }
    // arco e passagem escura no fim (continua subindo/descendo)
    const ze = z0 + dir * (STAIR_L + 0.4), ye = STAIR_H * up;
    for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.45, 0.55, 6.5, 10), T.colM, sx * (STAIR_W + 0.1), ye + 3.25, ze, g);
    const arc = mesh(new THREE.TorusGeometry(STAIR_W + 0.1, 0.4, 8, 20, Math.PI), T.colM, 0, ye + 6.4, ze, g); arc.rotation.y = 0;
    const dark = mesh(new THREE.PlaneGeometry(STAIR_W * 2 + 0.4, 9), T.darkM, 0, ye + 4, ze + dir * 0.3, g, false); dark.rotation.y = dir < 0 ? 0 : Math.PI;
  }
  function buildFloor(f) {
    if (built && built.f === f) return;
    unbuild();
    const T = theme(f), own = [];
    const g = new THREE.Group(); g.position.set(f.x, f.y, f.z); scene.add(g);
    const top = f.i === TOP, fx = { f, runes: [], fires: [], embers: [], own, barrier: null }; FX[0] = fx;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(f.r + 1, f.r + 1, 1.2, 48), [T.sideM, top ? T.topM : T.floorM, T.floorM]); disc.position.y = -0.6; disc.receiveShadow = true; g.add(disc);
    const am = (c, op) => { const m = add_(RUNE, c, { opacity: op }); own.push(m); return m; };
    const rn = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), am(top ? RED : T.rune, 0.75)); rn.scale.setScalar(f.r * 1.05); rn.position.y = 0.03; g.add(rn); fx.runes.push(rn);
    const rn2 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), am(top ? 0xff8a40 : T.rune2, 0.35)); rn2.scale.setScalar(f.r * 0.5); rn2.position.y = 0.04; g.add(rn2); fx.runes.push(rn2);
    // paredes altas de pedra, colunas, janelas acesas, ameias, tochas e estandartes
    const wallH = top ? 1.6 : 8, n = top ? 28 : 20;
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU, ca = Math.cos(a), sa = Math.sin(a), R = f.r + 0.6, x = sa * R, z = ca * R;
      if (Math.abs(x) < STAIR_W + 1.6 && (!top || z > 0)) continue;                   // vãos das escadarias (norte e sul)
      const b = mesh(new THREE.BoxGeometry(top ? 2 : 3.9 * (f.r / 17), wallH, 1.2), top ? T.wallM : (k % 2 ? T.wallM : T.wallM2), x, wallH / 2, z, g); b.rotation.y = a;
      if (top) continue;
      const a2 = a + Math.PI / n, cx = Math.sin(a2) * (R - 0.4), cz = Math.cos(a2) * (R - 0.4);
      if (Math.abs(cx) < STAIR_W + 1) continue;
      mesh(new THREE.CylinderGeometry(0.55, 0.65, wallH + 0.6, 10), T.colM, cx, (wallH + 0.6) / 2, cz, g);
      mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), T.trimM, cx, 0.25, cz, g); mesh(new THREE.BoxGeometry(1.4, 0.45, 1.4), T.trimM, cx, wallH + 0.4, cz, g);
      if (k % 2 === 0) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), T.winM); w.position.set(sa * (R - 0.62), 4.6, ca * (R - 0.62)); w.rotation.y = a + Math.PI; g.add(w); }
      else if (k % 4 === 1) { const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.4), T.banM); bn.position.set(sa * (R - 0.64), 4.7, ca * (R - 0.64)); bn.rotation.y = a + Math.PI; g.add(bn); }
      if (k % 3 === 0) {
        const tx = Math.sin(a2) * (R - 1.05), tz = Math.cos(a2) * (R - 1.05);
        mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.7, 6), T.spikeM, tx, 3.2, tz, g, false);
        const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: T.fire[k % 2] })); fl.position.set(tx, 3.95, tz); fl.scale.set(0.8, 1.4, 1); g.add(fl); fx.fires.push(fl);
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: SWIRL, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35, color: T.glow[k % 2] })); gl.position.set(tx, 3.9, tz); gl.scale.setScalar(3.4); g.add(gl); fx.fires.push(gl);
      }
    }
    if (top) for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU + 0.2, sp = mesh(new THREE.ConeGeometry(1.2, 9, 6), T.spikeM, Math.sin(a) * (f.r + 1), 4, Math.cos(a) * (f.r + 1), g);
      sp.rotation.x = Math.cos(a) * 0.25; sp.rotation.z = -Math.sin(a) * 0.25;
    }
    // pilares internos com cristais da ala
    if (!top) for (let k = 0; k < 4; k++) {
      const a = k / 4 * TAU + Math.PI / 4, x = Math.sin(a) * f.r * 0.62, z = Math.cos(a) * f.r * 0.62;
      mesh(new THREE.CylinderGeometry(0.85, 1.0, 7, 12), T.colM, x, 3.5, z, g);
      mesh(new THREE.BoxGeometry(2.3, 0.6, 2.3), T.trimM, x, 0.3, z, g); mesh(new THREE.BoxGeometry(2.1, 0.5, 2.1), T.trimM, x, 7.1, z, g);
      for (let j = 0; j < 3; j++) { const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.35 + j * 0.12, 0), T.crM); const ang = a + j * 2.1; cr.position.set(x + Math.sin(ang) * 1.2, 0.35 + j * 0.15, z + Math.cos(ang) * 1.2); cr.scale.y = 2.2; cr.rotation.set(rand(-0.4, 0.4), ang, rand(-0.4, 0.4)); g.add(cr); }
      if (!f.obs) addOb(f.x + x, f.z + z, 1.15);
    }
    f.obs = true;
    for (let k = 0; k < (top ? 26 : 14); k++) { const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: SWIRL, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: T.ember[k % 3 ? 0 : 1] })); e.scale.setScalar(rand(0.15, 0.3)); e.userData = { a: rand(0, TAU), r: rand(2, f.r - 1), y: rand(0, 8), v: rand(0.4, 1) }; g.add(e); fx.embers.push(e); }
    // escadarias: a do norte sobe (selada por uma barreira até o andar ficar limpo), a do sul desce
    if (!top) {
      stairway(f, g, T, fx, -1);
      const bm = add_(SWIRL, 0xff3a3a, { opacity: 0.6 }); own.push(bm);
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(STAIR_W * 2 + 0.4, 6), bm); bar.position.set(0, 3, -f.r + 0.6); g.add(bar); fx.barrier = bar;
    }
    stairway(f, g, T, fx, 1);
    // número do andar na parede da escadaria
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x2 = c.getContext('2d'); x2.fillStyle = 'rgba(16,8,24,.8)'; x2.fillRect(0, 0, 256, 96); x2.strokeStyle = '#' + new THREE.Color(T.rune).getHexString(); x2.lineWidth = 5; x2.strokeRect(3, 3, 250, 90);
    x2.fillStyle = '#f2e0ff'; x2.font = 'bold 50px Georgia'; x2.textAlign = 'center'; x2.fillText(top ? 'TOPO' : `${f.i + 1}º`, 128, 66);
    const tx = new THREE.CanvasTexture(c), sm = new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false }); own.push(tx);
    const sign = new THREE.Sprite(sm); sign.scale.set(3, 1.1, 1); sign.position.set(0, 8.6, top ? f.r - 1 : -f.r + 0.2); g.add(sign);
    built = { f, g, own };
  }
  function animFloor(dt) {
    const fx = FX[0]; if (!fx) return;
    fx.runes.forEach((r, k) => { r.rotation.y += dt * (k % 2 ? -0.6 : 0.35); });
    fx.fires.forEach((s2, k) => { if (k % 2 === 0) s2.scale.set(0.75 + Math.sin(time * 13 + k) * 0.08, 1.35 + Math.sin(time * 9 + k * 2) * 0.18, 1); else s2.material.opacity = 0.3 + Math.sin(time * 7 + k) * 0.08; });
    for (const e of fx.embers) { const u = e.userData; u.y += u.v * dt; u.a += dt * 0.2; if (u.y > 9) u.y = 0; e.position.set(Math.sin(u.a) * u.r, u.y, Math.cos(u.a) * u.r); e.material.opacity = Math.min(1, u.y) * (1 - u.y / 9); }
    if (fx.barrier) { fx.barrier.visible = !opened[fx.f.i]; fx.barrier.material.rotation = time; fx.barrier.material.opacity = 0.45 + Math.sin(time * 4) * 0.15; }
  }

  // Kravenox adormecido no topo (quando não é o horário do evento)
  const roof = FLOORS[TOP];
  const sleeper = new THREE.Group(); scene.add(sleeper);
  let sleeperR = null;
  function buildSleeper() {
    const r = { g: sleeper, mats: [] };
    if (typeof SpriteKit !== 'undefined' && SpriteKit.ready) {
      const a = SpriteKit.actor({ kind: 'hero', base: 'k' }, { px: 18 / 34 }); sleeper.add(a.root);
      r.anim = (m, t) => { const dt = Math.min(0.1, r.lt ? t - r.lt : 0); r.lt = t; a.update(dt, { face: Math.PI, sleeping: true }); };
      sleeper.position.set(roof.x, roof.y, roof.z - 6); sleeperR = r; return;
    }
    kravenoxModel(r, c => { const m = new THREE.MeshLambertMaterial({ color: c }); r.mats.push(m); return m; });
    sleeper.position.set(roof.x, roof.y, roof.z - 6); sleeper.rotation.y = 0;
    sleeperR = r;
  }

  // ---------------- monstros dos andares
  // nível sobe do 18 (1º andar) ao 58 (30º); a cada 5 andares um Guardião; no 10º, 20º e 30º um chefe de verdade
  const lvOf = i => 18 + Math.round(i * 40 / 29);
  function waveOf(i) {
    const pool = i < 4 ? ['larva', 'verme'] : i < 10 ? ['larva', 'verme', 'esfera'] : i < 20 ? ['verme', 'esfera', 'sentinela', 'larva'] : ['sentinela', 'esfera', 'sentinela', 'verme'];
    const n = Math.min(12, 6 + Math.floor(i / 3));
    return Array.from({ length: n }, (_, k) => pool[(k * 7 + i) % pool.length]);
  }
  const GUARD = { 4: 'Guardião do Portão', 9: 'Carcereiro do Cisma', 14: 'Guardião das Brasas', 19: 'Arauto do Soberano', 24: 'Guardião do Gelo Vazio', 29: 'Mão de Kravenox' };
  const RESPAWN = 90;                          // segundos até o andar se encher de novo
  let cur = -1, clearedAt = {}, leaveT = 0, lastCount = -1;
  function clearFloorMobs() {
    for (const m of mobs.filter(m => m.towerFloor !== undefined)) { m.dead = true; scene.remove(m.model.g); m.lab.remove(); }
    mobs = mobs.filter(m => m.towerFloor === undefined);
  }
  function scaleMob(m, L, k) {
    const d0 = m.d, kf = L / d0.lv;
    m.d = { ...d0, lv: L, hp: Math.round(d0.hp * Math.pow(kf, 1.7) * 1.4 * k), atk: Math.round(d0.atk * kf * 1.2 * Math.sqrt(k)), def: Math.round(d0.def * kf), xp: Math.round(d0.xp * kf * 1.8 * k), zeny: [Math.round(d0.zeny[0] * kf * k), Math.round(d0.zeny[1] * kf * 1.3 * k)], aggro: Math.max(d0.aggro, 18) };
    m.hp = m.maxHp = m.d.hp; const sm = m.lab.querySelector('small'); if (sm) sm.textContent = 'Nv ' + L;
  }
  function spawnFloor(i) {
    if (i >= TOP || (clearedAt[i] && time - clearedAt[i] < RESPAWN)) return;
    const f = FLOORS[i], list = waveOf(i);
    list.forEach((type, k) => {
      const a = (k / list.length) * TAU + i, r = f.r * (0.3 + (k % 3) * 0.17);
      const m = spawnMob(type, null, { x: f.x + Math.sin(a) * r, z: f.z + Math.cos(a) * r - 2 });
      m.towerFloor = i; m.noRespawn = true; scaleMob(m, lvOf(i), 1);
    });
    if (GUARD[i]) {                                                       // Guardião do andar (pula e esmaga como os chefes de campo)
      const big = i % 10 === 9;
      const m = spawnMob('guardiao', null, { x: f.x, z: f.z - f.r * 0.45 });
      m.towerFloor = i; m.noRespawn = true; m.towerGuard = true; scaleMob(m, lvOf(i) + 3, big ? 1.6 : 0.9);
      m.d.name = GUARD[i]; m.d.mini = true; m.d.respawn = 1e9; m.hp = m.maxHp = m.d.hp = Math.round(14000 * Math.pow(m.d.lv / 22, 1.5) * (big ? 1.5 : 0.8));
      m.d.drops = [...m.d.drops, ['essencia', 1], ...(big ? [['arma_cisma', 0.25], ['manto_cisma', 0.2], ['coroa_espinhos', 0.2], ['garras_cisma', 0.2], ['passos_cisma', 0.2], ['anel_kravenox', 0.12], ['marca', 0.1]] : [['arm_negra', 0.2], ['couraca_sentinela', 0.2], ['arma_essencia', 0.2]])];
      const sp = m.lab.querySelector('span'); if (sp) sp.innerHTML = `${GUARD[i]} <small>Nv ${m.d.lv}</small>`;
      m.model.g.scale.multiplyScalar(big ? 1.5 : 1.2);
    }
    clearedAt[i] = 0;
  }
  const fade = (() => { const d = document.createElement('div'); d.id = 'tfade'; document.body.appendChild(d); return d; })();
  function blackout() { fade.style.transition = 'none'; fade.style.opacity = 1; void fade.offsetWidth; fade.style.transition = 'opacity .6s'; requestAnimationFrame(() => requestAnimationFrame(() => { fade.style.opacity = 0; })); }
  // ponto de retorno: depois de vencer o chefe do 10º/20º andar, a entrada deixa começar do 11º/21º
  function enterFromDoor() {
    const cp = P.towerCp || 0;
    if (!cp) { enter(0); return; }
    const opts = [{ label: '🗼 1º andar', fn: () => enter(0) }];
    for (const c of [10, 20]) if (cp >= c) opts.push({ label: `🗼 ${c + 1}º andar (ponto de retorno)`, fn: () => enter(c) });
    opts.push({ label: 'Agora não', fn: () => { } });
    dialog('🗼 Torre do Cisma', 'Por onde você quer começar a subida?', opts);
  }
  function enter(i, fromAbove) {
    clearFloorMobs();
    if (i < 0) {                                                       // sai da torre
      cur = -1; unbuild(); P.x = DOOR.x; P.z = DOOR.z + 1.5; P.y = groundY(P.x, P.z); P.face = 0; camS.yaw = Math.PI; blackout();
      log('Você saiu da Torre do Cisma.', 'sys'); return;
    }
    cur = i; const f = FLOORS[i]; buildFloor(f);
    if (fromAbove) { P.x = f.x; P.z = f.z - f.r - STAIR_L + 3; P.face = 0; }            // desceu: chega no alto da escadaria norte
    else { P.x = f.x; P.z = f.z + f.r + STAIR_L - 3.5; P.face = Math.PI; }               // subiu: chega na escadaria sul
    P.y = groundY(P.x, P.z); camS.yaw = P.face + Math.PI; camS.x = P.x; camS.z = P.z; camS.y = P.y;
    if (i === TOP) { camS.dist = Math.max(camS.dist, 24); camS.pitch = Math.max(camS.pitch, 0.32); }
    blackout();
    if (i === 10 || i === 20) if ((P.towerCp || 0) < i) { P.towerCp = i; log(`📍 <b>Ponto de retorno</b> liberado: a entrada da Torre agora deixa começar no <b>${i + 1}º andar</b>.`, 'gold'); }
    if (i > (P.towerBest || 0)) P.towerBest = i;
    banner(i === TOP ? 'TOPO DA TORRE' : `${i + 1}º ANDAR`);
    spawnFloor(i);
    if (i === TOP) log(Kvx.active ? '☠ <b>Kravenox está acordado!</b> Derrube o Soberano!' : '💤 Kravenox dorme aqui em cima... Ele desperta todo <b>sábado às 20h</b>.', Kvx.active ? 'bad' : 'gold');
    else log(`🗼 Torre do Cisma — <b>${i + 1}º andar</b> (monstros nível ${lvOf(i)}).${GUARD[i] ? ` ☠ <b>${GUARD[i]}</b> guarda a escadaria!` : ''} Derrote todos para abrir a escadaria ao norte.`, GUARD[i] ? 'bad' : 'sys');
    lastCount = -1;
  }
  function corridor(f, x, z, r) {
    if (f.casa || Math.abs(x - f.x) > STAIR_W - r) return false;
    if (z < f.z) return f.i < TOP && !!opened[f.i] && z > f.z - f.r - STAIR_L - 1;
    return z < f.z + f.r + STAIR_L + 1;
  }

  function update(dt) {
    beacon.rotation.y += dt; beacon.position.y = ty + 4 + Math.sin(time * 2) * 0.4;
    doorGlow.rotation.z -= 0.03; doorGlow.material.opacity = 0.8 + Math.sin(time * 3) * 0.2; for (const f of fires) { f.material.rotation += 0.05; f.scale.set(1.3 + Math.sin(time * 9 + f.position.x) * 0.15, 1.9 + Math.sin(time * 7) * 0.2, 1); }
    if (!sleeperR && typeof kravenoxModel === 'function' && (typeof SpriteKit === 'undefined' || SpriteKit.ready || running)) buildSleeper();
    sleeper.visible = !Kvx.active && cur === TOP;
    if (sleeperR && sleeper.visible) sleeperR.anim({ moving: false, roar: 0, enraged: false, sleeping: true }, time);
    leaveT -= dt;
    if (P.dead || leaveT > 0) return;
    if (!inTower(P.z) && Math.hypot(P.x - DOOR.x, P.z - DOOR.z) < 3.2) { leaveT = 2.5; P.z = DOOR.z + 3.6; enterFromDoor(); return; }
    if (!inTower(P.z)) { if (cur !== -1) { cur = -1; clearFloorMobs(); unbuild(); } return; }
    const f = floorAt(P.x, P.z); if (!f || f.casa) return;
    if (f.i !== cur) { cur = f.i; buildFloor(f); }                  // asa de mosca / volta de outro jeito
    animFloor(dt);
    // escadaria norte: abre quando o andar está limpo e fica aberta
    const left = mobs.filter(m => m.towerFloor === cur).length;
    if (cur < TOP) {
      if (left === 0 && !clearedAt[cur]) clearedAt[cur] = time;
      if (left === 0 && clearedAt[cur] && time - clearedAt[cur] > RESPAWN && Math.hypot(P.x - f.x, P.z - f.z) < f.r) { spawnFloor(cur); log('👁️ Mais criaturas da Essência surgiram neste andar.', 'bad'); }
      if (left === 0 && !opened[cur]) { opened[cur] = true; Audio8.sfx('level'); log(`✨ Andar limpo! A escadaria para o <b>${cur + 1 === TOP ? 'topo' : (cur + 2) + 'º andar'}</b> se abriu ao norte.`, 'gold'); }
      if (!opened[cur] && P.z < f.z - f.r + 3 && Math.abs(P.x - f.x) < STAIR_W + 1 && left !== lastCount) { lastCount = left; log(`A escadaria está selada. Faltam <b>${left}</b> inimigos neste andar.`, 'bad'); }
      if (P.z < f.z - f.r - STAIR_L + 1.2) { leaveT = 1; enter(cur + 1, false); return; }
    }
    if (P.z > f.z + f.r + STAIR_L - 1.2) { leaveT = 1; enter(cur - 1, true); }
  }
  function minimap(g) {
    const W = g.canvas.width, H = g.canvas.height, x0 = W / 2 - 42, bw = 84 / (TOP + 1);
    g.fillStyle = '#1a1020'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.fillStyle = '#f2c86a'; g.font = 'bold 12px Georgia';
    g.fillText('Torre do Cisma', W / 2, H / 2 - 26);
    for (let i = 0; i <= TOP; i++) { const c = i === TOP ? '#ff3a3a' : ['#9a4dff', '#ff7a30', '#40c0ff'][Math.floor(i / 10)]; g.globalAlpha = i === cur ? 1 : i < cur ? 0.6 : 0.25; g.fillStyle = c; const h = 6 + i * 0.8; g.fillRect(x0 + i * bw, H / 2 + 12 - h, Math.max(1, bw - 0.6), h); }
    g.globalAlpha = 1; g.fillStyle = '#ece6f6'; g.font = 'bold 13px sans-serif';
    g.fillText(cur === TOP ? 'Topo' : `${cur + 1}º andar`, W / 2, H / 2 + 28);
    g.fillStyle = '#b8a8d0'; g.font = '11px sans-serif'; if (cur < TOP) g.fillText(`monstros Nv ${lvOf(Math.max(0, cur))}`, W / 2, H / 2 + 41);
    g.textAlign = 'left';
  }
  return { update, minimap, enter, corridor, lvOf, get floor() { return cur; }, door: DOOR, roof };
})();

// ---------------------------------------------------------------- modelos dos inimigos do Reino Quebrado
function towerMobModel(type, r, mt) {
  const g = r.g, b = new THREE.Group(); g.add(b);
  const glowM = c => { const m = new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 1 }); return m; };
  if (type === 'larva') {
    const segs = [];
    for (let i = 0; i < 6; i++) { const s = mesh(new THREE.SphereGeometry(0.55 - i * 0.05, 12, 10), mt(i % 2 ? 0x5a4a66 : 0x4a3c56), 0, 0.55, -i * 0.55, b); s.scale.set(1.1, 0.9, 1); segs.push(s); }
    const head = mesh(new THREE.SphereGeometry(0.62, 14, 12), mt(0x5a4a66), 0, 0.7, 0.45, b);
    [-0.25, 0.25].forEach(x => mesh(new THREE.SphereGeometry(0.11, 8, 6), glowM(0xb060ff), x, 0.95, 0.98, b));
    mesh(new THREE.SphereGeometry(0.3, 10, 8), mt(0x1a0a14), 0, 0.5, 1.0, b).scale.set(1.2, 0.9, 0.5);
    for (let k = 0; k < 6; k++) { const t = mesh(new THREE.ConeGeometry(0.04, 0.16, 4), mt(0xe8e0d0), -0.2 + k * 0.08, 0.66, 1.08, b); t.rotation.x = Math.PI; }
    for (let i = 1; i < 5; i++) [-1, 1].forEach(sd => { const l = mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.5), mt(0x3a2c46), sd * 0.5, 0.25, -i * 0.55, b); l.rotation.z = sd * 0.6; });
    r.anim = (m, t) => { segs.forEach((s, i) => { s.position.y = 0.55 + Math.sin(t * 6 + i) * (m.moving ? 0.08 : 0.03); s.position.x = Math.sin(t * 3 + i * 0.7) * 0.08; }); head.rotation.x = -(m.swing || 0) * 0.6; };
    r.h = 1.4;
  } else if (type === 'verme') {
    const segs = [];
    for (let i = 0; i < 7; i++) segs.push(mesh(new THREE.SphereGeometry(0.42 - i * 0.03, 12, 10), mt(i % 2 ? 0x5a7a3a : 0x4a6a2e), 0, 0.4 + i * 0.32, -i * 0.12, b));
    const head = new THREE.Group(); head.position.set(0, 2.5, 0.1); b.add(head);
    mesh(new THREE.SphereGeometry(0.5, 14, 12), mt(0x5a7a3a), 0, 0, 0, head);
    mesh(new THREE.SphereGeometry(0.36, 12, 10), mt(0x3a0a10), 0, 0, 0.3, head).scale.set(1, 1, 0.5);
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, t = mesh(new THREE.ConeGeometry(0.05, 0.22, 4), mt(0xf0e8d8), Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.42, head); t.rotation.x = Math.PI / 2; t.rotation.z = a; }
    r.anim = (m, t) => { segs.forEach((s, i) => s.position.x = Math.sin(t * 3 + i * 0.6) * 0.12 * i / 3); head.position.x = Math.sin(t * 3 + 4) * 0.4; head.rotation.x = 0.3 - (m.swing || 0) * 0.9; };
    r.h = 3.1;
  } else if (type === 'esfera') {
    const body = mesh(new THREE.SphereGeometry(0.6, 16, 14), mt(0x1c1822), 0, 1.1, 0, b);
    mesh(new THREE.TorusGeometry(0.6, 0.05, 6, 24), mt(0x3a3046), 0, 1.1, 0, b).rotation.x = Math.PI / 2;
    const eye = mesh(new THREE.SphereGeometry(0.2, 12, 10), glowM(0xb060ff), 0, 1.15, 0.5, b);
    const legs = [];
    for (let k = 0; k < 3; k++) { const p = new THREE.Group(); p.position.set(Math.sin(k / 3 * TAU) * 0.45, 0.8, Math.cos(k / 3 * TAU) * 0.45); p.rotation.y = k / 3 * TAU; b.add(p);
      const l = mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.9), mt(0x2a2430), 0, -0.35, 0.2, p); l.rotation.x = 0.5;
      const c = mesh(new THREE.ConeGeometry(0.08, 0.3, 4), mt(0x8a8090), 0, -0.75, 0.45, p); c.rotation.x = 1.2; legs.push(p); }
    r.anim = (m, t) => { body.position.y = 1.1 + Math.sin(t * 5) * 0.05; legs.forEach((p, i) => p.rotation.x = m.moving ? Math.sin(t * 12 + i * 2) * 0.4 : 0); eye.scale.setScalar(1 + (m.swing || 0) * 0.5); };
    r.h = 1.8;
  } else if (type === 'sentinela') {
    if (ModelKit.ready) {
      const inst = ModelKit.instance('hooded_adventurer', 2.25);
      inst.mats.forEach(m => { m.color.set(m.name === 'Metal' || m.name === 'Metal_Dark' ? 0x2a2632 : 0x15121a); });
      b.add(inst.root);
      const head = inst.attach('Head');
      [-0.05, 0.05].forEach(x => mesh(new THREE.SphereGeometry(0.03, 8, 6), glowM(0xb060ff), x, 0.12, 0.12, head));
      r.mats = inst.mats.filter(m => m.emissive);
      r.inst = inst; r.def = { die: 'Death' };
      inst.play('Idle_Sword');
      let lt = 0, ls = 0;
      r.anim = (m, t) => {
        const dt = Math.min(0.1, lt ? t - lt : 0); lt = t; const sw = m.swing || 0;
        if (sw > 0.9 && ls <= 0.9) inst.play('Sword_Slash', { once: true, restart: true, speed: 1.4 });
        else if (sw <= 0.05) inst.play(m.moving ? 'Walk' : 'Idle_Sword');
        ls = sw; inst.update(dt);
      };
    } else {
      mesh(new THREE.BoxGeometry(0.9, 1.6, 0.6), mt(0x15121a), 0, 1.4, 0, b);
      mesh(new THREE.SphereGeometry(0.3, 10, 8), mt(0x15121a), 0, 2.45, 0, b);
      r.anim = () => { };
    }
    r.h = 2.6;
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return r;
}
