// =====================================================================
//  Reino Quebrado — Cidadela do Cisma e a Torre do Cisma (6 andares)
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
  for (let i = 0; i < 6; i++) {
    const r0 = 9.5 - i * 0.9, r1 = r0 - 0.6, h = 9;
    mesh(new THREE.CylinderGeometry(r1, r0, h, 20), PM('pedra.jpg', [8, 3.5], i % 2 ? 0x7a7088 : 0x625a70), 0, ty + h / 2, 0, ext);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + i * 0.2; if (i === 0 && Math.abs(Math.sin(a)) < 0.3 && Math.cos(a) > 0) continue; const b = mesh(new THREE.BoxGeometry(1.1, h * 0.9, 1.4), PM('pedra.jpg', [0.5, 3], 0x6a6278), Math.sin(a) * (r0 - 0.1), ty + h * 0.45, Math.cos(a) * (r0 - 0.1), ext); b.rotation.y = a; }
    mesh(new THREE.CylinderGeometry(r1 + 0.6, r1 + 0.6, 0.7, 20), PM('pedra.jpg', [8, 0.3], 0x585068), 0, ty + h, 0, ext);
    for (let k = 0; k < 6; k++) {                               // janelas vermelhas
      const a = k / 6 * TAU + i * 0.3, wr = (r0 + r1) / 2;
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
  const FX = [];                                          // peças animadas por andar (runas, fogo, portais, brasas)
  const stairs = [], downs = [];
  const C3 = (r, g, b) => new THREE.Color(r, g, b), floorM = PM('calcada.jpg', [7, 7], C3(1.5, 1.42, 1.65)), wallM = PM('pedra.jpg', [1.4, 2.4], C3(1.45, 1.38, 1.6)), wallM2 = PM('pedra.jpg', [1.4, 2.4], C3(1.25, 1.18, 1.4)), colM = PM('pedra.jpg', [1, 3], C3(1.6, 1.52, 1.75)), trimM = PM('pedra.jpg', [3, 0.3], C3(1.0, 0.95, 1.12));
  for (const f of FLOORS) {
    const g = new THREE.Group(); g.position.set(f.x, f.y, f.z); scene.add(g); f.g = g;
    const top = f.i === 5, fx = { f, runes: [], fires: [], embers: [] }; FX[f.i] = fx;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(f.r + 1, f.r + 1, 1.2, 48), [PM('pedra.jpg', [8, 0.4], 0x4a4458), top ? PM('calcada.jpg', [9, 9], 0x6a5a62) : floorM, floorM]); disc.position.y = -0.6; disc.receiveShadow = true; g.add(disc);
    // círculo de runas no centro, girando
    const rn = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), add_(RUNE, top ? RED : PURPLE, { opacity: 0.75 })); rn.scale.setScalar(f.r * 1.05); rn.position.y = 0.03; g.add(rn); fx.runes.push(rn);
    const rn2 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), add_(RUNE, top ? 0xff8a40 : 0xc890ff, { opacity: 0.35 })); rn2.scale.setScalar(f.r * 0.5); rn2.position.y = 0.04; g.add(rn2); fx.runes.push(rn2);
    // paredes altas de pedra, colunas góticas, janelas acesas, ameias, tochas e estandartes
    const wallH = top ? 1.6 : 7;
    const n = top ? 28 : 18;
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU, ca = Math.cos(a), sa = Math.sin(a), R = f.r + 0.6, x = sa * R, z = ca * R;
      if (!top && Math.abs(z - f.r) < 3 && Math.abs(x) < 3) continue;                 // vão da chegada
      const b = mesh(new THREE.BoxGeometry(top ? 2 : 3.9, wallH, 1.2), top ? wallM : (k % 2 ? wallM : wallM2), x, wallH / 2, z, g); b.rotation.y = a;
      if (top) continue;
      const a2 = a + Math.PI / n, cx = Math.sin(a2) * (R - 0.4), cz = Math.cos(a2) * (R - 0.4);       // coluna entre blocos
      mesh(new THREE.CylinderGeometry(0.55, 0.65, wallH + 0.6, 10), colM, cx, (wallH + 0.6) / 2, cz, g);
      mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), trimM, cx, 0.25, cz, g); mesh(new THREE.BoxGeometry(1.4, 0.45, 1.4), trimM, cx, wallH + 0.4, cz, g);
      for (const o of [-1, 1]) { const m2 = mesh(new THREE.BoxGeometry(0.9, 0.9, 1.0), wallM2, x + Math.cos(a) * o * 1.2, wallH + 0.45, z - Math.sin(a) * o * 1.2, g); m2.rotation.y = a; }   // ameias
      if (k % 2 === 0) {                                                                 // janela em arco, acesa
        const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), new THREE.MeshBasicMaterial({ map: WINDOW, toneMapped: false })); w.position.set(sa * (R - 0.62), 4.2, ca * (R - 0.62)); w.rotation.y = a + Math.PI; g.add(w);
      } else if (k % 4 === 1) {                                                          // estandarte do Soberano
        const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.4), new THREE.MeshLambertMaterial({ map: BANNER, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); bn.position.set(sa * (R - 0.64), 4.3, ca * (R - 0.64)); bn.rotation.y = a + Math.PI; g.add(bn);
      }
      if (k % 3 === 0) {                                                                 // tocha com fogo
        const tx = Math.sin(a2) * (R - 1.05), tz = Math.cos(a2) * (R - 1.05);
        mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.7, 6), lam(0x2a2026), tx, 3.2, tz, g, false);
        const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: k % 2 ? 0xc080ff : 0xffffff })); fl.position.set(tx, 3.95, tz); fl.scale.set(0.8, 1.4, 1); g.add(fl); fx.fires.push(fl);
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: SWIRL, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35, color: k % 2 ? 0x9a4dff : 0xff7a30 })); gl.position.set(tx, 3.9, tz); gl.scale.setScalar(3.4); g.add(gl); fx.fires.push(gl);
      }
    }
    if (top) for (let k = 0; k < 8; k++) {                                            // espinhos gigantes no topo
      const a = k / 8 * TAU + 0.2, sp = mesh(new THREE.ConeGeometry(1.2, 9, 6), lam(0x120e16), Math.sin(a) * (f.r + 1), 4, Math.cos(a) * (f.r + 1), g);
      sp.rotation.x = Math.cos(a) * 0.25; sp.rotation.z = -Math.sin(a) * 0.25;
    }
    // pilares internos com base, capitel e cristais roxos da Essência
    if (!top) for (let k = 0; k < 4; k++) {
      const a = k / 4 * TAU + Math.PI / 4, x = Math.sin(a) * f.r * 0.62, z = Math.cos(a) * f.r * 0.62;
      mesh(new THREE.CylinderGeometry(0.85, 1.0, 6, 12), colM, x, 3, z, g);
      mesh(new THREE.BoxGeometry(2.3, 0.6, 2.3), trimM, x, 0.3, z, g); mesh(new THREE.BoxGeometry(2.1, 0.5, 2.1), trimM, x, 6.1, z, g);
      for (let j = 0; j < 3; j++) { const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.35 + j * 0.12, 0), new THREE.MeshPhongMaterial({ color: 0x8a40ff, emissive: 0x4a10a0, shininess: 90 })); const ang = a + j * 2.1; cr.position.set(x + Math.sin(ang) * 1.2, 0.35 + j * 0.15, z + Math.cos(ang) * 1.2); cr.scale.y = 2.2; cr.rotation.set(rand(-0.4, 0.4), ang, rand(-0.4, 0.4)); g.add(cr); }
      addOb(f.x + x, f.z + z, 1.15);
    }
    // brasas da Essência subindo pelo salão
    for (let k = 0; k < (top ? 26 : 16); k++) { const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: SWIRL, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: k % 3 ? 0xb070ff : 0xff5a3a })); e.scale.setScalar(rand(0.15, 0.3)); e.userData = { a: rand(0, TAU), r: rand(2, f.r - 1), y: rand(0, 8), v: rand(0.4, 1) }; g.add(e); fx.embers.push(e); }
    // escada para cima: degraus de pedra, arco e portal em espiral
    if (!top) {
      const sg = new THREE.Group(); sg.position.set(0, 0, -f.r + 3); g.add(sg);
      for (let k = 0; k < 6; k++) mesh(new THREE.BoxGeometry(4, 0.4, 1), PM('pedra.jpg', [2, 0.2], 0x8a8298), 0, 0.2 + k * 0.4, 1.8 - k * 0.6, sg);
      for (const sx of [-2.2, 2.2]) mesh(new THREE.CylinderGeometry(0.4, 0.5, 5.4, 10), colM, sx, 2.7, -1.6, sg);
      mesh(new THREE.TorusGeometry(2.2, 0.35, 8, 20, Math.PI), colM, 0, 5.2, -1.6, sg);
      const pm = add_(SWIRL, 0x555060, { opacity: 0.5 });
      const portal = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), pm); portal.position.set(0, 3.0, -1.55); portal.scale.y = 1.35; sg.add(portal); fx.runes.push(portal);
      stairs[f.i] = { f, x: f.x, z: f.z - f.r + 2.2, mat: pm, open: false };
    }
    // saída (descer): círculo de runas azul
    const dm = add_(RUNE, 0x4fd1ff, { opacity: 0.6 });
    const dp = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2).rotateX(-Math.PI / 2), dm); dp.position.set(0, 0.06, f.r - 2.2); g.add(dp); fx.runes.push(dp);
    downs[f.i] = { f, x: f.x, z: f.z + f.r - 2.2, mesh: dp };
  }
  function animFloor(i, dt) {
    const fx = FX[i]; if (!fx) return;
    fx.runes.forEach((r, k) => { r.rotation[r.geometry.type === 'CircleGeometry' ? 'z' : 'y'] += dt * (k % 2 ? -0.6 : 0.35) * (r.geometry.type === 'CircleGeometry' ? 4 : 1); });
    fx.fires.forEach((s2, k) => { if (k % 2 === 0) s2.scale.set(0.75 + Math.sin(time * 13 + k) * 0.08, 1.35 + Math.sin(time * 9 + k * 2) * 0.18, 1); else s2.material.opacity = 0.3 + Math.sin(time * 7 + k) * 0.08; });
    for (const e of fx.embers) { const u = e.userData; u.y += u.v * dt; u.a += dt * 0.2; if (u.y > 9) u.y = 0; e.position.set(Math.sin(u.a) * u.r, u.y, Math.cos(u.a) * u.r); e.material.opacity = Math.min(1, u.y) * (1 - u.y / 9); }
  }

  // Kravenox adormecido no topo (quando não é o horário do evento)
  const roof = FLOORS[5];
  const sleeper = new THREE.Group(); scene.add(sleeper);
  let sleeperR = null;
  function buildSleeper() {
    const r = { g: sleeper, mats: [] };
    if (typeof SpriteKit !== 'undefined' && SpriteKit.ready) {         // o sprite do próprio Kravenox, gigante e adormecido
      const a = SpriteKit.actor({ kind: 'hero', base: 'k' }, { px: 18 / 34 }); sleeper.add(a.root);
      r.anim = (m, t) => { const dt = Math.min(0.1, r.lt ? t - r.lt : 0); r.lt = t; a.update(dt, { face: Math.PI, sleeping: true }); };
      sleeper.position.set(roof.x, roof.y, roof.z - 6); sleeperR = r; return;
    }
    kravenoxModel(r, c => { const m = new THREE.MeshLambertMaterial({ color: c }); r.mats.push(m); return m; });
    sleeper.position.set(roof.x, roof.y, roof.z - 6); sleeper.rotation.y = 0;
    sleeperR = r;
  }

  // ---------------- monstros dos andares
  const WAVES = [
    [['larva', 5]],
    [['larva', 3], ['verme', 3]],
    [['sentinela', 3], ['esfera', 3]],
    [['sentinela', 3], ['verme', 2], ['larva', 3]],
    [['sentinela', 5], ['esfera', 2]],
  ];
  const FLOOR_LV = [18, 21, 24, 27, 30];      // nível dos monstros em cada andar (a Torre é o fim do jogo)
  const RESPAWN = 60;                          // segundos até o andar se encher de novo
  let cur = -1, clearedAt = {}, leaveT = 0, lastCount = -1;
  function clearFloorMobs() {
    for (const m of mobs.filter(m => m.towerFloor !== undefined)) { m.dead = true; scene.remove(m.model.g); m.lab.remove(); }
    mobs = mobs.filter(m => m.towerFloor === undefined);
  }
  function spawnFloor(i) {
    if (i >= 5 || (clearedAt[i] && time - clearedAt[i] < RESPAWN)) return;
    const f = FLOORS[i]; let k = 0;
    for (const [type, n] of WAVES[i]) for (let j = 0; j < n; j++) {
      const a = (k++ / 6) * TAU + i, r = f.r * (0.25 + (k % 2) * 0.2);
      const m = spawnMob(type, null, { x: f.x + Math.sin(a) * r, z: f.z + Math.cos(a) * r - 2 });
      m.towerFloor = i; m.noRespawn = true;
      const d0 = m.d, L = FLOOR_LV[i], kf = L / d0.lv;           // fica mais forte conforme o andar
      m.d = { ...d0, lv: L, hp: Math.round(d0.hp * kf * kf * 1.4), atk: Math.round(d0.atk * kf * 1.3), def: Math.round(d0.def * kf), xp: Math.round(d0.xp * kf * 1.8), zeny: [Math.round(d0.zeny[0] * kf), Math.round(d0.zeny[1] * kf * 1.3)], aggro: Math.max(d0.aggro, 18) };
      m.hp = m.maxHp = m.d.hp; const sm = m.lab.querySelector('small'); if (sm) sm.textContent = 'Nv ' + L;
    }
    clearedAt[i] = 0;
  }
  function enter(i, fromAbove) {
    clearFloorMobs();
    if (i < 0) {                                                       // sai da torre
      cur = -1; P.x = DOOR.x; P.z = DOOR.z + 1.5; P.y = groundY(P.x, P.z); P.face = 0; camS.yaw = Math.PI;
      Audio8.sfx('warp'); log('Você saiu da Torre do Cisma.', 'sys'); return;
    }
    cur = i; const f = FLOORS[i]; if (stairs[i]) stairs[i].cleared = false;
    if (fromAbove && stairs[i]) { P.x = stairs[i].x; P.z = stairs[i].z + 3; P.face = 0; }
    else { P.x = f.x; P.z = f.z + f.r - 4; P.face = Math.PI; }
    P.y = f.y; camS.yaw = P.face + Math.PI; camS.x = P.x; camS.z = P.z; camS.y = P.y;
    if (i === 5) { camS.dist = Math.max(camS.dist, 24); camS.pitch = Math.max(camS.pitch, 0.32); }
    Audio8.sfx('warp');
    banner(i === 5 ? 'TOPO DA TORRE' : `${i + 1}º ANDAR`);
    spawnFloor(i);
    if (i === 5) log(Kvx.active ? '☠ <b>Kravenox está acordado!</b> Derrube o Soberano!' : '💤 Kravenox dorme aqui em cima... Ele desperta todo <b>sábado às 20h</b>.', i === 5 && Kvx.active ? 'bad' : 'gold');
    else log(`🗼 Torre do Cisma — <b>${i + 1}º andar</b>. Derrote todos para liberar a escada.`, 'sys');
    lastCount = -1;
  }

  function update(dt) {
    beacon.rotation.y += dt; beacon.position.y = ty + 4 + Math.sin(time * 2) * 0.4;
    doorGlow.rotation.z -= 0.03; doorGlow.material.opacity = 0.8 + Math.sin(time * 3) * 0.2; for (const f of fires) { f.material.rotation += 0.05; f.scale.set(1.3 + Math.sin(time * 9 + f.position.x) * 0.15, 1.9 + Math.sin(time * 7) * 0.2, 1); }
    if (!sleeperR && typeof kravenoxModel === 'function' && (typeof SpriteKit === 'undefined' || SpriteKit.ready || running)) buildSleeper();
    sleeper.visible = !Kvx.active;
    if (sleeperR && sleeper.visible) {                                  // respiração lenta, olhos apagados
      sleeperR.anim({ moving: false, roar: 0, enraged: false, sleeping: true }, time);
    }
    leaveT -= dt;
    if (P.dead || leaveT > 0) return;
    // entrar pela porta
    if (!inTower(P.z) && Math.hypot(P.x - DOOR.x, P.z - DOOR.z) < 3.2) { leaveT = 1; enter(0); return; }
    if (!inTower(P.z)) { if (cur !== -1) { cur = -1; clearFloorMobs(); } return; }
    if (cur >= 0) animFloor(cur, dt);
    const f = floorAt(P.x, P.z); if (!f || f.casa) return;
    if (f.i !== cur) { cur = f.i; }
    // escada: abre quando o andar está limpo
    const left = mobs.filter(m => m.towerFloor === cur).length;
    const st = stairs[cur];
    if (st) {
      if (left === 0 && !st.cleared) st.cleared = true;
      const open = left === 0 || st.cleared;                       // depois de limpo, a escada fica aberta
      if (left === 0 && !clearedAt[cur]) clearedAt[cur] = time;
      if (left === 0 && clearedAt[cur] && time - clearedAt[cur] > RESPAWN) { spawnFloor(cur); log('👁️ Mais criaturas da Essência surgiram neste andar.', 'bad'); }
      if (open && !st.open) { st.open = true; Audio8.sfx('level'); log(`✨ Andar limpo! A escada para o <b>${cur + 2 === 6 ? 'topo' : (cur + 2) + 'º andar'}</b> foi liberada.`, 'gold'); }
      if (!open) st.open = false;
      st.mat.color.set(open ? 0xff3a3a : 0x555060); st.mat.opacity = open ? 0.6 + Math.sin(time * 4) * 0.2 : 0.4;
      if (Math.hypot(P.x - st.x, P.z - st.z) < 2.4) {
        if (open) { leaveT = 1; enter(cur + 1, false); return; }
        else if (left !== lastCount) { lastCount = left; log(`A escada está selada. Faltam <b>${left}</b> inimigos neste andar.`, 'bad'); }
      }
    }
    // descer
    const dn = downs[cur];
    dn.mesh.material.opacity = 0.35 + Math.sin(time * 3) * 0.15;
    if (Math.hypot(P.x - dn.x, P.z - dn.z) < 1.4) { leaveT = 1.2; enter(cur - 1, true); }
  }
  function minimap(g) {
    const W = g.canvas.width, H = g.canvas.height;
    g.fillStyle = '#1a1020'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.fillStyle = '#f2c86a'; g.font = 'bold 16px Georgia';
    g.fillText('Torre do Cisma', W / 2, H / 2 - 22);
    for (let i = 0; i < 6; i++) { g.fillStyle = i === cur ? '#ff3a3a' : i < cur ? '#7a5a8a' : '#3a2e44'; g.fillRect(W / 2 - 30 + i * 10, H / 2 - 6, 8, 20 - (i === cur ? 0 : 6)); }
    g.fillStyle = '#ece6f6'; g.font = 'bold 13px sans-serif';
    g.fillText(cur === 5 ? 'Topo' : `${cur + 1}º andar`, W / 2, H / 2 + 34);
    g.textAlign = 'left';
  }
  return { update, minimap, enter, get floor() { return cur; }, door: DOOR, roof };
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
