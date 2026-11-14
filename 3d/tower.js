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

  // ---------------- Cidadela do Cisma: casas góticas (térreo de pedra, andar de enxaimel, telhado de duas águas, janelas acesas)
  const citTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const JANELA = citTex(64, 96, g => {                                                    // janela em arco, vidro aceso em cruz
    g.fillStyle = '#2a1a14'; g.fillRect(0, 0, 64, 96);
    const l = g.createLinearGradient(0, 10, 0, 92); l.addColorStop(0, '#ffe7a0'); l.addColorStop(1, '#ff9a3a'); g.fillStyle = l;
    g.beginPath(); g.moveTo(8, 90); g.lineTo(8, 34); g.arc(32, 34, 24, Math.PI, 0); g.lineTo(56, 90); g.fill();
    g.fillStyle = '#2a1a14'; g.fillRect(30, 8, 4, 84); g.fillRect(8, 52, 48, 4); g.strokeStyle = '#2a1a14'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 93);
  });
  const PORTA = citTex(64, 128, g => {
    g.fillStyle = '#3a2418'; g.fillRect(0, 0, 64, 128);
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#5a3a24' : '#4a2e1c'; g.fillRect(4 + i * 14.5, 20, 13, 106); }
    g.fillStyle = '#1a0e08'; g.fillRect(0, 50, 64, 5); g.fillRect(0, 96, 64, 5); g.fillStyle = '#c8a050'; g.beginPath(); g.arc(50, 76, 3.5, 0, 6.3); g.fill();
    g.fillStyle = '#20140c'; g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 0); g.lineTo(64, 22); g.arc(32, 32, 32, 0, Math.PI, true); g.lineTo(0, 0); g.fill();
  });
  const pedraC = PM('pedra.jpg', [2.2, 1.4], 0xd8d0e0), pedraE = PM('pedra.jpg', [1, 1], 0xb0a6bc), reboco = PM('reboco.jpg', [1.6, 1.2], 0xeee2cc), viga = PM('madeira.jpg', [0.3, 2], 0x4a3020);
  const janM = new THREE.MeshBasicMaterial({ map: JANELA, toneMapped: false }), portaM = new THREE.MeshLambertMaterial({ map: PORTA });
  const TELHAS = [0x6a4a8a, 0x8a3a4a, 0x4a5a7a, 0x5a3a6a, 0x7a4a3a].map(c => PM('telha.jpg', [3, 3], c));
  const luzM = new THREE.SpriteMaterial({ map: citTex(64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,220,150,1)'); r.addColorStop(0.3, 'rgba(255,170,80,.5)'); r.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  // telhado de duas águas: prisma triangular (cumeeira ao longo de z)
  function telhado(W, D, H, mt) { const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(0, H); sh.closePath(); const geo = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false }); geo.translate(0, 0, -D / 2); return new THREE.Mesh(geo, mt); }
  function casaCisma(x, z, k) {
    const g = new THREE.Group(); g.position.set(x, groundY(x, z), z); g.rotation.y = Math.atan2(CIT.x - x, CIT.z - z); scene.add(g);
    const W = 5.6 + (k % 2) * 0.8, D = 5.2 + (k % 3) * 0.5, H1 = 3.0, H2 = 2.6, RH = 3.4 + (k % 2) * 0.8;
    const box = (w, h, d, mt, px, py, pz, sh = true) => mesh(new THREE.BoxGeometry(w, h, d), mt, px, py, pz, g, sh);
    box(W, H1, D, pedraC, 0, H1 / 2, 0);                                                    // térreo de pedra clara
    box(W + 0.3, 0.3, D + 0.3, pedraE, 0, 0.15, 0, false);                                  // rodapé
    box(W + 0.5, H2, D + 0.5, reboco, 0, H1 + H2 / 2, 0);                                   // andar de cima (um pouco maior: "balanço")
    box(W + 0.7, 0.28, D + 0.7, viga, 0, H1 + 0.05, 0, false);                              // viga do piso
    box(W + 0.7, 0.24, D + 0.7, viga, 0, H1 + H2, 0, false);                                // viga do topo
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.24, H2, 0.24, viga, sx * (W / 2 + 0.26), H1 + H2 / 2, sz * (D / 2 + 0.26), false);   // cantos
    for (const f of [1, -1]) {                                                              // enxaimel na frente e atrás: montantes e mãos-francesas
      for (const vx of [-W / 6, W / 6]) box(0.18, H2, 0.12, viga, vx, H1 + H2 / 2, f * (D / 2 + 0.27), false);
      for (const dx of [-1, 1]) { const b = box(0.16, H2 * 1.1, 0.12, viga, dx * W * 0.36, H1 + H2 / 2, f * (D / 2 + 0.28), false); b.rotation.z = dx * 0.6; }
    }
    const tl = telhado(W + 1.4, D + 1.4, RH, TELHAS[k % TELHAS.length]); tl.position.y = H1 + H2 + 0.1; tl.castShadow = true; g.add(tl);
    for (const f of [1, -1]) { const ff = new THREE.Mesh(new THREE.ShapeGeometry((() => { const sh = new THREE.Shape(); sh.moveTo(-(W + 0.5) / 2, 0); sh.lineTo((W + 0.5) / 2, 0); sh.lineTo(0, RH * 0.92); sh.closePath(); return sh; })()), reboco); ff.position.set(0, H1 + H2 + 0.1, f * (D / 2 + 0.26)); if (f < 0) ff.rotation.y = Math.PI; g.add(ff);
      const jg = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), janM); jg.position.set(0, H1 + H2 + 1.0, f * (D / 2 + 0.28)); if (f < 0) jg.rotation.y = Math.PI; g.add(jg); }   // janelinha do sótão
    // janelas acesas nos quatro lados
    const jan = (px, py, pz, ry, w = 0.85, h = 1.25) => { const j = new THREE.Mesh(new THREE.PlaneGeometry(w, h), janM); j.position.set(px, py, pz); j.rotation.y = ry; g.add(j); };
    for (const f of [1, -1]) { jan(-W / 3, H1 + H2 * 0.5, f * (D / 2 + 0.27), f > 0 ? 0 : Math.PI); jan(W / 3, H1 + H2 * 0.5, f * (D / 2 + 0.27), f > 0 ? 0 : Math.PI); }
    for (const f of [1, -1]) { jan(f * (W / 2 + 0.27), H1 + H2 * 0.5, 0, f * Math.PI / 2); jan(f * (W / 2 + 0.02), H1 * 0.55, -D / 4, f * Math.PI / 2, 0.75, 1.1); }
    jan(-W / 3, H1 * 0.55, -(D / 2 + 0.02), Math.PI, 0.75, 1.1); jan(W / 3, H1 * 0.55, -(D / 2 + 0.02), Math.PI, 0.75, 1.1);
    jan(W / 3, H1 * 0.55, D / 2 + 0.02, 0, 0.75, 1.1);
    // porta em arco com moldura de pedra, degrau e lanterna
    const pt = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.4), portaM); pt.position.set(-W / 6, 1.2, D / 2 + 0.03); g.add(pt);
    box(1.7, 0.25, 0.3, pedraE, -W / 6, 2.5, D / 2 + 0.1, false); box(0.22, 2.4, 0.3, pedraE, -W / 6 - 0.76, 1.2, D / 2 + 0.1, false); box(0.22, 2.4, 0.3, pedraE, -W / 6 + 0.76, 1.2, D / 2 + 0.1, false);
    box(1.8, 0.2, 0.7, pedraE, -W / 6, 0.1, D / 2 + 0.4, false);
    box(0.08, 0.5, 0.08, viga, -W / 6 + 1.1, 2.3, D / 2 + 0.25, false);
    const lan = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), new THREE.MeshBasicMaterial({ color: 0xffc070, toneMapped: false })); lan.position.set(-W / 6 + 1.1, 1.98, D / 2 + 0.3); g.add(lan);
    const lt = new THREE.Sprite(luzM); lt.position.set(-W / 6 + 1.1, 1.98, D / 2 + 0.32); lt.scale.setScalar(0.85); g.add(lt);
    // chaminé
    box(0.8, RH + 1.2, 0.8, pedraE, W / 4, H1 + H2 + RH / 2 + 0.3, -D / 5);
    box(1.0, 0.2, 1.0, pedraE, W / 4, H1 + H2 + RH + 0.95, -D / 5, false);
    addOb(x, z, Math.max(W, D) / 2 + 0.6);
  }
  [[CIT.x - 16, CIT.z - 8], [CIT.x - 18, CIT.z + 14], [CIT.x + 16, CIT.z + 14], [CIT.x + 18, CIT.z - 6], [CIT.x - 2, CIT.z + 20]].forEach(([x, z], k) => casaCisma(x, z, k));
  // cristais da Essência pela cidade: aglomerados de pontas de seis lados saindo de uma pedra (nada de losango liso)
  const CRISTAL = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.32, 0), new THREE.Vector2(0.34, 1.6), new THREE.Vector2(0.26, 1.9), new THREE.Vector2(0, 2.4)], 6);
  const crisM = new THREE.MeshPhongMaterial({ color: 0x9a5aff, emissive: 0x4a1490, specular: 0xffe0ff, shininess: 90, flatShading: true, transparent: true, opacity: 0.92 });
  const rochaG = new THREE.IcosahedronGeometry(1, 1); { const ps = rochaG.attributes.position; for (let i = 0; i < ps.count; i++) { const k = 0.8 + 0.35 * Math.sin(ps.getX(i) * 5.1 + ps.getZ(i) * 3.3) * Math.cos(ps.getY(i) * 4.2); ps.setXYZ(i, ps.getX(i) * k, ps.getY(i) * k * 0.6, ps.getZ(i) * k); } rochaG.computeVertexNormals(); }
  const rochaM = PM('rocha.jpg', [1, 1], 0x6a6272);
  const brilhoC = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,.8)'); r.addColorStop(0.35, 'rgba(255,255,255,.25)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * TAU, r = 25 + (i % 3) * 3, x = CIT.x + Math.cos(a) * r, z = CIT.z + Math.sin(a) * r;
    if (Math.hypot(x - TOWER.x, z - TOWER.z) < 14 || Math.abs(z) < 4) continue;
    const g = new THREE.Group(); g.position.set(x, groundY(x, z), z); g.rotation.y = a * 3.7; scene.add(g);
    const rc = new THREE.Mesh(rochaG, rochaM); rc.scale.set(1.3, 1, 1.1); rc.position.y = 0.2; rc.castShadow = true; g.add(rc);
    const n = 4 + (i % 3);
    for (let k = 0; k < n; k++) {
      const c = new THREE.Mesh(CRISTAL, crisM), ang = k / n * TAU + i, inc = k === 0 ? 0.08 : 0.35 + (k % 2) * 0.25, esc = k === 0 ? 1.25 : 0.55 + ((k * 37 + i) % 5) * 0.12;
      c.position.set(Math.sin(ang) * (k ? 0.45 : 0), 0.35, Math.cos(ang) * (k ? 0.45 : 0)); c.rotation.set(Math.cos(ang) * inc, ang, -Math.sin(ang) * inc); c.scale.setScalar(esc); c.castShadow = true; g.add(c);
    }
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilhoC, color: 0xa060ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 })); gl.position.y = 1.4; gl.scale.setScalar(4); g.add(gl);
    addOb(x, z, 1.0);
  }

  // ---------------- Torre do Cisma (exterior): peça única lisa e afinando (perfil torneado), cornijas arredondadas,
  // contrafortes, janelas em ogiva acesas e coroa de espinhos curvos — nada de caixas
  const ext = new THREE.Group(); ext.position.set(TOWER.x, groundY(TOWER.x, TOWER.z), TOWER.z); scene.add(ext);
  const etex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const ALT = 96, NIV = 6;                                       // altura da torre e quantos "anéis" de cornija
  const raio = y => 10.2 - 5.2 * Math.pow(y / ALT, 0.85);        // afina para o alto
  const perfil = [new THREE.Vector2(0, -1), new THREE.Vector2(11.4, -1), new THREE.Vector2(11.4, 0.6), new THREE.Vector2(10.9, 1.1), new THREE.Vector2(10.9, 2.2), new THREE.Vector2(raio(2.6), 2.6)];
  for (let n = 1; n <= NIV; n++) {                               // cada anel: o fuste sobe e faz uma cornija arredondada
    const y = n * ALT / NIV, r = raio(y);
    perfil.push(new THREE.Vector2(r, y - 1.2), new THREE.Vector2(r + 0.55, y - 0.9), new THREE.Vector2(r + 0.75, y - 0.45), new THREE.Vector2(r + 0.55, y), new THREE.Vector2(r - 0.05, y + 0.25));
  }
  perfil.push(new THREE.Vector2(raio(ALT) + 0.9, ALT + 0.5), new THREE.Vector2(raio(ALT) + 0.9, ALT + 1.6), new THREE.Vector2(0, ALT + 1.6));
  const corpo = new THREE.Mesh(new THREE.LatheGeometry(perfil, 40), PM('pedra.jpg', [10, 26], 0xb4accb, { emissive: 0x141020 })); corpo.castShadow = true; corpo.receiveShadow = true; ext.add(corpo);
  let ty = ALT + 1.6;
  // contrafortes: lâminas de pedra inclinadas com bordas arredondadas
  const lamina = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(4.2, 0); s.quadraticCurveTo(2.2, 6, 0.4, 16); s.lineTo(0, 16); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 1.0, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.18, bevelSegments: 3, curveSegments: 10 }); })();
  lamina.translate(0, 0, -0.5);
  const pedraCtf = PM('pedra.jpg', [0.4, 1.6], 0xa49cb8, { emissive: 0x141020 });
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * TAU + TAU / 16; if (Math.cos(a) > 0.85) continue;                    // deixa a frente livre para o portal
    const b = new THREE.Mesh(lamina, pedraCtf); b.position.set(Math.sin(a) * 9.4, 0, Math.cos(a) * 9.4); b.rotation.y = a - Math.PI / 2; b.castShadow = true; ext.add(b);
    addOb(TOWER.x + Math.sin(a) * 11.5, TOWER.z + Math.cos(a) * 11.5, 1.4);
  }
  // janelas em ogiva com vitral aceso (planos encostados no fuste)
  const VITRAL = etex(64, 128, g => {
    g.fillStyle = '#1a0e10'; g.fillRect(0, 0, 64, 128);
    const arco = () => { g.beginPath(); g.moveTo(8, 126); g.lineTo(8, 50); g.quadraticCurveTo(8, 14, 32, 4); g.quadraticCurveTo(56, 14, 56, 50); g.lineTo(56, 126); g.closePath(); };
    const l = g.createLinearGradient(0, 0, 0, 128); l.addColorStop(0, '#ffb070'); l.addColorStop(0.5, '#ff5a3a'); l.addColorStop(1, '#7a1020'); g.fillStyle = l; arco(); g.fill();
    g.strokeStyle = '#1a0e10'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 8); g.lineTo(32, 126); g.moveTo(8, 70); g.lineTo(56, 70); g.moveTo(8, 100); g.lineTo(56, 100); g.stroke();
    g.beginPath(); g.arc(32, 38, 9, 0, TAU); g.stroke(); g.lineWidth = 4; arco(); g.stroke();
  });
  const vitM = new THREE.MeshBasicMaterial({ map: VITRAL, toneMapped: false, transparent: true, alphaTest: 0.1 });
  for (let n = 0; n < NIV; n++) for (let k = 0; k < 4; k++) {
    const y = (n + 0.5) * ALT / NIV + (n === 0 ? 3 : 0), a = k / 4 * TAU + (n % 2) * TAU / 8 + 0.3, r = raio(y) + 0.06;
    if (n === 0 && Math.cos(a) > 0.6) continue;
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.2), vitM); w.position.set(Math.sin(a) * r, y, Math.cos(a) * r); w.rotation.y = a; ext.add(w);
  }
  // coroa de espinhos curvos no topo (como a cabeça do Kravenox)
  const espM = new THREE.MeshLambertMaterial({ color: 0x1a141e });
  const espinho = new THREE.LatheGeometry([new THREE.Vector2(0.75, 0), new THREE.Vector2(0.6, 2), new THREE.Vector2(0.35, 4.5), new THREE.Vector2(0.12, 6.4), new THREE.Vector2(0, 7.2)], 12);
  for (let k = 0; k < 14; k++) {
    const a = k / 14 * TAU, r0 = raio(ALT) + 0.4, sp = new THREE.Mesh(espinho, espM);
    sp.position.set(Math.sin(a) * r0, ty - 0.4, Math.cos(a) * r0); sp.rotation.set(Math.cos(a) * 0.42, 0, -Math.sin(a) * 0.42); sp.scale.setScalar(k % 2 ? 0.75 : 1.05); sp.castShadow = true; ext.add(sp);
  }
  const beacon = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshLambertMaterial({ color: RED, emissive: RED, emissiveIntensity: 1, flatShading: true })); beacon.position.y = ty + 4; ext.add(beacon);
  const BRILHO_E = etex(64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,.95)'); r.addColorStop(0.3, 'rgba(255,255,255,.4)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const bGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: BRILHO_E, color: 0xff3030, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); bGlow.scale.setScalar(9); beacon.add(bGlow);

  // ---------------- entrada: portal gótico (arco pontudo de pedra esculpida), portas abertas, névoa na passagem
  const dz = 10.6, pedraP = PM('pedra.jpg', [0.6, 0.6], 0xe4dcef, { emissive: 0x2a2236 }), pedraP2 = PM('pedra.jpg', [0.6, 0.6], 0xc4bcd2, { emissive: 0x1e1828 });   // pedra clara com leve brilho: aparece à noite
  const ogiva = (w, h, s = new THREE.Shape()) => { s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w * 0.62); s.quadraticCurveTo(-w / 2, h - w * 0.1, 0, h); s.quadraticCurveTo(w / 2, h - w * 0.1, w / 2, h - w * 0.62); s.lineTo(w / 2, 0); s.closePath(); return s; };
  const moldura = (wo, ho, wi, hi, prof, mt, z) => {
    const s = ogiva(wo, ho), p = ogiva(wi, hi);
    s.holes.push(new THREE.Path(p.getPoints(24)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 4, curveSegments: 24 });
    const m = new THREE.Mesh(geo, mt); m.position.set(0, 0, z); m.castShadow = true; m.receiveShadow = true; ext.add(m); return m;
  };
  moldura(8.6, 11.2, 5.0, 8.2, 1.4, pedraP2, dz - 1.3);                       // arco de fora
  moldura(6.2, 9.4, 4.6, 7.7, 0.6, pedraP, dz + 0.05);                         // arquivolta (segunda camada, mais clara)
  // colunas torneadas (base, fuste e capitel) dos dois lados
  const coluna = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.62, 0), new THREE.Vector2(0.62, 0.3), new THREE.Vector2(0.48, 0.5), new THREE.Vector2(0.38, 0.75), new THREE.Vector2(0.34, 6.2), new THREE.Vector2(0.42, 6.45), new THREE.Vector2(0.62, 6.8), new THREE.Vector2(0.62, 7.05), new THREE.Vector2(0, 7.05)], 20);
  for (const sx of [-1, 1]) for (const dd of [0, 0.9]) { const c = new THREE.Mesh(coluna, pedraP); c.position.set(sx * (3.0 + dd), 0, dz + 0.6 - dd * 0.4); c.castShadow = true; ext.add(c); }
  // passagem: fundo escuro e névoa roxa que se mexe (no formato do arco)
  const formaPorta = ogiva(4.6, 7.7);
  const fundo = new THREE.Mesh(new THREE.ShapeGeometry(formaPorta, 24), new THREE.MeshBasicMaterial({ color: 0x07020c })); fundo.position.set(0, 0, dz - 0.9); ext.add(fundo);
  const NEVOA = etex(128, 128, g => { const im = g.createImageData(128, 128); for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const v = 0.5 + 0.25 * Math.sin(x * 0.098 + Math.sin(y * 0.07) * 2) + 0.25 * Math.sin(y * 0.11 + Math.cos(x * 0.05) * 3); const o = (y * 128 + x) * 4; im.data[o] = 150 + v * 90; im.data[o + 1] = 60 + v * 60; im.data[o + 2] = 255; im.data[o + 3] = 70 + v * 150; } g.putImageData(im, 0, 0); });
  NEVOA.wrapS = NEVOA.wrapT = THREE.RepeatWrapping;
  const nevoaGeo = new THREE.ShapeGeometry(formaPorta, 24); { const pos = nevoaGeo.attributes.position, uv = nevoaGeo.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 4.6, pos.getY(i) / 7.7); }
  const portalM = new THREE.MeshBasicMaterial({ map: NEVOA, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.85, side: THREE.DoubleSide });
  const doorGlow = new THREE.Mesh(nevoaGeo, portalM); doorGlow.position.set(0, 0, dz - 0.6); ext.add(doorGlow);
  const faisca = new THREE.SpriteMaterial({ map: BRILHO_E, color: 0xc890ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const faiscas = []; for (let k = 0; k < 14; k++) { const sp = new THREE.Sprite(faisca); sp.scale.setScalar(0.25); sp.userData = { x: rand(-1.8, 1.8), t: rand(0, 1), v: rand(0.15, 0.35) }; ext.add(sp); faiscas.push(sp); }
  // portas de madeira pesadas, abertas para dentro, com ferragens e cravos
  const portaG = new THREE.ExtrudeGeometry(ogiva(2.25, 7.5), { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 16 }); portaG.translate(1.12, 0, 0);
  const madeira = PM('madeira.jpg', [0.6, 1.2], 0x9a7254, { emissive: 0x1a0e08 }), ferro = new THREE.MeshLambertMaterial({ color: 0x2a2630 });
  for (const sx of [-1, 1]) {
    const pg = new THREE.Group(); pg.position.set(sx * 2.25, 0.05, dz - 0.75); pg.rotation.y = sx > 0 ? Math.PI + 1.15 : -1.15; ext.add(pg);
    const fol = new THREE.Mesh(portaG, madeira); fol.castShadow = true; pg.add(fol);
    for (const y of [1.2, 3.6, 6.0]) { const fb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.1, 6), ferro); fb.rotation.z = Math.PI / 2; fb.position.set(1.12, y, 0.28); pg.add(fb);
      for (const xx of [0.35, 1.12, 1.9]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), ferro); c.position.set(xx, y, 0.33); pg.add(c); } }
  }
  // degraus em meia-lua
  for (let k = 0; k < 3; k++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(5.6 - k * 0.9, 5.7 - k * 0.9, 0.32, 40, 1, false, -Math.PI / 2, Math.PI), pedraP2); d.position.set(0, 0.16 + k * 0.32, dz + 0.2); d.receiveShadow = true; ext.add(d); }
  // braseiros de pedra torneada com fogo
  const FOGO = etex(64, 128, g => { const r = g.createRadialGradient(32, 92, 2, 32, 80, 50); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.25, 'rgba(255,180,60,.95)'); r.addColorStop(0.6, 'rgba(255,70,20,.5)'); r.addColorStop(1, 'rgba(120,0,0,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(62, 70, 32, 124); g.quadraticCurveTo(2, 70, 32, 4); g.fill(); });
  const braseiro = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.55, 0), new THREE.Vector2(0.5, 0.15), new THREE.Vector2(0.22, 0.4), new THREE.Vector2(0.2, 1.1), new THREE.Vector2(0.35, 1.25), new THREE.Vector2(0.75, 1.45), new THREE.Vector2(0.85, 1.75), new THREE.Vector2(0.7, 1.8), new THREE.Vector2(0.3, 1.55), new THREE.Vector2(0, 1.55)], 18);
  const fires = [];
  for (const sx of [-5.6, 5.6]) {
    const b = new THREE.Mesh(braseiro, pedraP2); b.position.set(sx, 0, dz + 1.6); b.castShadow = true; ext.add(b); addOb(TOWER.x + sx, TOWER.z + dz + 1.6, 0.8);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: FOGO, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); f.position.set(sx, 2.5, dz + 1.6); f.scale.set(1.1, 1.9, 1); ext.add(f); fires.push(f);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: BRILHO_E, color: 0xff7a30, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.45 })); gl.position.set(sx, 2.2, dz + 1.6); gl.scale.setScalar(4); ext.add(gl);
  }
  // nome gravado na pedra, em cima do arco
  const placa = etex(512, 96, g => { g.fillStyle = '#8a8298'; g.fillRect(0, 0, 512, 96); g.strokeStyle = '#5a5266'; g.lineWidth = 6; g.strokeRect(4, 4, 504, 88); g.font = 'bold 50px Georgia'; g.textAlign = 'center'; g.fillStyle = '#3a3442'; g.fillText('TORRE DO CISMA', 256, 66); g.fillStyle = 'rgba(255,240,255,.35)'; g.fillText('TORRE DO CISMA', 255, 64); });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.98), new THREE.MeshLambertMaterial({ map: placa })); pl.position.set(0, 12.0, dz - 0.4); ext.add(pl);
  addOb(TOWER.x, TOWER.z, 10.4); for (const sx of [-1, 1]) addOb(TOWER.x + sx * 3.4, TOWER.z + dz + 0.4, 1.0);
  const DOOR = { x: TOWER.x, z: TOWER.z + dz + 1.2 };

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
  const BRILHO = ctex(64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(0.25, 'rgba(255,255,255,.45)'); r.addColorStop(0.6, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
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
    built.g.traverse(o => { if (o.geometry && o.geometry !== CAIXA) o.geometry.dispose(); if (o.isSprite && o.material) o.material.dispose(); });
    built.own.forEach(m => m.dispose()); FX.length = 0; built = null;
  }
  // várias cópias da mesma peça num desenho só (degraus, paredes, colunas, corrimão): o celular agradece
  function inst(geo, mat, lista, g, sombra = true) {
    if (!lista.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, lista.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    lista.forEach((o, i) => { p.set(o.x, o.y, o.z); q.setFromEuler(e.set(0, o.ry || 0, 0)); s.set(o.sx || 1, o.sy || 1, o.sz || 1); m4.compose(p, q, s); im.setMatrixAt(i, m4); });
    im.castShadow = sombra && !TOUCH; im.receiveShadow = true; im.frustumCulled = false; g.add(im); return im;
  }
  const CAIXA = new THREE.BoxGeometry(1, 1, 1);
  // escadaria lateral, colada na parede: 'sobe' (até +7 m, porta do andar de cima) ou 'desce' (por um vão no chão, até -7 m)
  function escadaria(f, g, T, fx, tipo, own) {
    const a0 = tipo === 'sobe' ? RAMPA.sobe : RAMPA.desce, N = 28, H = STAIR_H * (tipo === 'sobe' ? 1 : -1);
    const rin = f.r - RAMPA.larg - 0.3, rout = f.r + 0.3, W = rout - rin, rc = (rin + rout) / 2, tl = rc * RAMPA.volta / N + 0.06;
    const deg = [];
    for (let k = 0; k < N; k++) {
      const th = a0 + (k + 0.5) / N * RAMPA.volta, topo = (k + 0.5) / N * H, base = tipo === 'sobe' ? -0.1 : -STAIR_H - 1.5;
      deg.push({ x: Math.sin(th) * rc, y: (topo + base) / 2, z: Math.cos(th) * rc, ry: th, sx: tl, sy: topo - base, sz: W });
    }
    inst(CAIXA, T.stepM, deg, g);
    // corrimão na beira de dentro (deixa a entrada livre) — os postes de colisão ficam mais juntos que os desenhados
    const postes = [], arco = rin * RAMPA.volta;
    for (let d = 0.12 * arco; d <= arco; d += 1.1) {
      const p = d / arco, th = a0 + p * RAMPA.volta, x = Math.sin(th) * (rin - 0.15), z = Math.cos(th) * (rin - 0.15);
      if (!f.obs) addOb(f.x + x, f.z + z, 0.55);
      if (Math.round(d / 1.1) % 2 === 0) postes.push({ x, y: (tipo === 'sobe' ? p * H : 0) + 0.55, z, sx: 0.22, sy: 1.1, sz: 0.22 });
    }
    inst(CAIXA, T.trimM, postes, g, false);
    if (tipo === 'desce') {                                                    // o vão no chão: parede curva de dentro e a parede do fim
      const pw = new THREE.Mesh(new THREE.CylinderGeometry(rin, rin, STAIR_H + 2, 24, 1, true, a0, RAMPA.volta), T.corrM.clone()); pw.material.side = THREE.DoubleSide; own.push(pw.material);
      pw.position.y = -(STAIR_H + 2) / 2; g.add(pw);
      const thf = a0 + RAMPA.volta, fim = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.6, STAIR_H + 2), pw.material); fim.position.set(Math.sin(thf) * rc, -(STAIR_H + 2) / 2, Math.cos(thf) * rc); fim.rotation.y = thf - Math.PI / 2; g.add(fim);
    }
    // arco e passagem escura no fim (continua subindo/descendo)
    const the = a0 + RAMPA.volta * 0.985, ye = H, tx = Math.cos(the), tz = -Math.sin(the);
    const cx = Math.sin(the) * (f.r - 0.1), cz = Math.cos(the) * (f.r - 0.1);
    for (const o of [-1, 1]) inst(CAIXA, T.colM, [{ x: cx + tx * o * (W / 2 + 0.2), y: ye + 3.4, z: cz + tz * o * (W / 2 + 0.2), ry: the, sx: 0.8, sy: 6.8, sz: 0.8 }], g);
    inst(CAIXA, T.colM, [{ x: cx, y: ye + 7, z: cz, ry: the + Math.PI / 2, sx: W + 1.4, sy: 0.7, sz: 0.9 }], g);
    const dk = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.4, 6.6), T.darkM); dk.position.set(Math.sin(the) * (f.r + 0.15), ye + 3.3, Math.cos(the) * (f.r + 0.15)); dk.rotation.y = the + Math.PI; g.add(dk);
    for (const o of [-1, 1]) {                                                 // tochas no arco
      const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: T.fire[0] }));
      fl.position.set(cx + tx * o * (W / 2 + 0.2) - Math.sin(the) * 0.6, ye + 4.6, cz + tz * o * (W / 2 + 0.2) - Math.cos(the) * 0.6); fl.scale.set(0.6, 1.1, 1); g.add(fl); fx.fires.push(fl);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: BRILHO, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.3, color: T.glow[0] })); gl.position.copy(fl.position); gl.scale.setScalar(1.8); g.add(gl); fx.fires.push(gl);
    }
    // placa: o que tem do outro lado
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x2 = c.getContext('2d'); x2.fillStyle = 'rgba(16,8,24,.85)'; x2.fillRect(0, 0, 256, 64); x2.strokeStyle = '#f2c86a'; x2.lineWidth = 3; x2.strokeRect(2, 2, 252, 60);
    x2.fillStyle = '#f2e0ff'; x2.font = 'bold 32px Georgia'; x2.textAlign = 'center';
    x2.fillText(tipo === 'sobe' ? (f.i + 1 === TOP ? '↑ TOPO' : `↑ ${f.i + 2}º andar`) : (f.i === 0 ? '↓ Saída' : `↓ ${f.i}º andar`), 128, 44);
    const txp = new THREE.CanvasTexture(c); own.push(txp); const pl = new THREE.Sprite(new THREE.SpriteMaterial({ map: txp, transparent: true, depthWrite: false })); own.push(pl.material);
    const pp = pontoRampa(f, tipo, 0.02); pl.position.set(pp.x - f.x, 3.2, pp.z - f.z); pl.scale.set(2.6, 0.65, 1); g.add(pl);
  }
  function buildFloor(f) {
    if (built && built.f === f) return;
    unbuild();
    const T = theme(f), own = [];
    const g = new THREE.Group(); g.position.set(f.x, f.y, f.z); scene.add(g);
    const top = f.i === TOP, fx = { f, runes: [], fires: [], embers: [], own, barrier: null }; FX[0] = fx;
    // chão: miolo inteiro + faixa da beira com o vão da escadaria que desce
    const rin = f.r - RAMPA.larg - 0.3;
    const miolo = new THREE.Mesh(new THREE.CylinderGeometry(rin, rin, 1.2, 64), [T.sideM, top ? T.topM : T.floorM, T.floorM]); miolo.position.y = -0.6; miolo.receiveShadow = true; g.add(miolo);
    const faixa = new THREE.Mesh(new THREE.RingGeometry(rin, f.r + 1, 72, 1, RAMPA.desce + RAMPA.volta - Math.PI / 2, TAU - RAMPA.volta).rotateX(-Math.PI / 2), top ? T.topM : T.floorM); faixa.receiveShadow = true; g.add(faixa);
    const am = (c, op) => { const m = add_(RUNE, c, { opacity: op }); own.push(m); return m; };
    const rn = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), am(top ? RED : T.rune, 0.75)); rn.scale.setScalar(rin * 1.6); rn.position.y = 0.03; g.add(rn); fx.runes.push(rn);
    const rn2 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), am(top ? 0xff8a40 : T.rune2, 0.35)); rn2.scale.setScalar(rin * 0.7); rn2.position.y = 0.04; g.add(rn2); fx.runes.push(rn2);
    // paredes altas (descem até o fundo do vão), colunas, janelas acesas, estandartes e tochas
    const n = top ? 40 : 36, R = f.r + 0.6, hT = top ? 2.4 : 12, yB = top ? -0.5 : -STAIR_H - 2, paredes = [[], []], cols = [], capit = [];
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU, sa = Math.sin(a), ca = Math.cos(a);
      paredes[k % 2].push({ x: sa * R, y: (hT + yB) / 2, z: ca * R, ry: a, sx: TAU * R / n + 0.15, sy: hT - yB, sz: 1.2 });
      if (top) continue;
      const a2 = a + Math.PI / n, cx = Math.sin(a2) * (R - 0.45), cz = Math.cos(a2) * (R - 0.45);
      if (k % 2 === 0) { cols.push({ x: cx, y: (hT + 0.6 + yB) / 2, z: cz, sx: 1, sy: hT + 0.6 - yB, sz: 1 }); capit.push({ x: cx, y: hT + 0.4, z: cz, sx: 1.5, sy: 0.45, sz: 1.5 }); }
      if (k % 3 === 0) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), T.winM); w.position.set(sa * (R - 0.62), 9, ca * (R - 0.62)); w.rotation.y = a + Math.PI; g.add(w); }
      else if (k % 6 === 1) { const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.4), T.banM); bn.position.set(sa * (R - 0.64), 9.2, ca * (R - 0.64)); bn.rotation.y = a + Math.PI; g.add(bn); }
      if (k % 4 === 0) {
        const tx = Math.sin(a2) * (R - 1.05), tz = Math.cos(a2) * (R - 1.05), ty = 4.2 + stairRise(f, f.x + tx, f.z + tz);
        const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: T.fire[k % 2] })); fl.position.set(tx, ty, tz); fl.scale.set(0.8, 1.4, 1); g.add(fl); fx.fires.push(fl);
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: BRILHO, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.3, color: T.glow[k % 2] })); gl.position.set(tx, ty - 0.1, tz); gl.scale.setScalar(2.2); g.add(gl); fx.fires.push(gl);
      }
    }
    inst(CAIXA, T.wallM, paredes[0], g); inst(CAIXA, T.wallM2, paredes[1], g);
    inst(new THREE.CylinderGeometry(0.55, 0.65, 1, 10), T.colM, cols, g); inst(CAIXA, T.trimM, capit, g, false);
    if (top) for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU + 0.2, sp = mesh(new THREE.ConeGeometry(1.2, 9, 6), T.spikeM, Math.sin(a) * (f.r + 1), 4, Math.cos(a) * (f.r + 1), g);
      sp.rotation.x = Math.cos(a) * 0.25; sp.rotation.z = -Math.sin(a) * 0.25;
    }
    // pilares do salão com cristais da ala
    if (!top) {
      const pil = [], bases = [], cris = [];
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * TAU + Math.PI / 6, x = Math.sin(a) * rin * 0.62, z = Math.cos(a) * rin * 0.62;
        pil.push({ x, y: 4, z, sx: 1, sy: 8, sz: 1 }); bases.push({ x, y: 0.3, z, sx: 2.3, sy: 0.6, sz: 2.3 }, { x, y: 8.1, z, sx: 2.1, sy: 0.5, sz: 2.1 });
        for (let j = 0; j < 3; j++) { const ang = a + j * 2.1; cris.push({ x: x + Math.sin(ang) * 1.2, y: 0.5 + j * 0.15, z: z + Math.cos(ang) * 1.2, ry: ang, sx: 0.4 + j * 0.12, sy: 0.9 + j * 0.25, sz: 0.4 + j * 0.12 }); }
        if (!f.obs) addOb(f.x + x, f.z + z, 1.15);
      }
      inst(new THREE.CylinderGeometry(0.85, 1.0, 1, 12), T.colM, pil, g); inst(CAIXA, T.trimM, bases, g, false); inst(new THREE.OctahedronGeometry(1, 0), T.crM, cris, g, false);
    }
    for (let k = 0; k < (top ? 22 : 14); k++) { const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: BRILHO, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: T.ember[k % 3 ? 0 : 1] })); e.scale.setScalar(rand(0.15, 0.3)); e.userData = { a: rand(0, TAU), r: rand(2, rin - 1), y: rand(0, 8), v: rand(0.4, 1) }; g.add(e); fx.embers.push(e); }
    // escadarias laterais: a que sobe fica selada (barreira vermelha) até o andar ficar limpo
    if (!top) {
      escadaria(f, g, T, fx, 'sobe', own);
      const bm = add_(SWIRL, 0xff3a3a, { opacity: 0.6 }); own.push(bm);
      const pb = pontoRampa(f, 'sobe', 0.1), bar = new THREE.Mesh(new THREE.PlaneGeometry(RAMPA.larg + 0.8, 5), bm);
      bar.position.set(pb.x - f.x, 2.5 + 0.1 * STAIR_H, pb.z - f.z); bar.rotation.y = pb.th + Math.PI / 2; g.add(bar); fx.barrier = bar;
    }
    escadaria(f, g, T, fx, 'desce', own);
    f.obs = true;
    // número do andar no alto da parede
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x2 = c.getContext('2d'); x2.fillStyle = 'rgba(16,8,24,.8)'; x2.fillRect(0, 0, 256, 96); x2.strokeStyle = '#' + new THREE.Color(T.rune).getHexString(); x2.lineWidth = 5; x2.strokeRect(3, 3, 250, 90);
    x2.fillStyle = '#f2e0ff'; x2.font = 'bold 50px Georgia'; x2.textAlign = 'center'; x2.fillText(top ? 'TOPO' : `${f.i + 1}º`, 128, 66);
    const tx = new THREE.CanvasTexture(c), sm = new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false }); own.push(tx);
    const sign = new THREE.Sprite(sm); sign.scale.set(3.4, 1.25, 1); sign.position.set(0, top ? 5 : 12.5, top ? f.r - 1 : -f.r + 0.5); g.add(sign);
    built = { f, g, own };
    try { renderer.compile(scene, camera); } catch (e) { }                   // prepara tudo agora, com a tela ainda escura (sem travão depois)
  }
  function animFloor(dt) {
    const fx = FX[0]; if (!fx) return;
    fx.runes.forEach((r, k) => { r.rotation.y += dt * (k % 2 ? -0.6 : 0.35); });
    fx.fires.forEach((s2, k) => { if (k % 2 === 0) s2.scale.set(0.75 + Math.sin(time * 13 + k) * 0.08, 1.35 + Math.sin(time * 9 + k * 2) * 0.18, 1); else s2.material.opacity = 0.24 + Math.sin(time * 7 + k) * 0.05; });
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
    const n = Math.min(18, 10 + Math.floor(i / 2));
    return Array.from({ length: n }, (_, k) => pool[(k * 7 + i) % pool.length]);
  }
  const GUARD = { 4: 'Guardião do Portão', 9: 'Carcereiro do Cisma', 14: 'Guardião das Brasas', 19: 'Arauto do Soberano', 24: 'Guardião do Gelo Vazio', 29: 'Mão de Kravenox' };
  const RESPAWN = 90;                          // segundos até o andar se encher de novo
  let cur = -1, clearedAt = {}, leaveT = 0, lastCount = -1, portaArmada = true;
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
      const rin = f.r - RAMPA.larg - 0.3, a = (k / list.length) * TAU + i * 0.7, r = rin * (0.25 + (k % 3) * 0.22);
      const m = spawnMob(type, null, { x: f.x + Math.sin(a) * r, z: f.z + Math.cos(a) * r });
      m.towerFloor = i; m.noRespawn = true; scaleMob(m, lvOf(i), 1);
    });
    if (GUARD[i]) {                                                       // Guardião do andar (pula e esmaga como os chefes de campo)
      const big = i % 10 === 9;
      const pg = pontoRampa(f, 'sobe', 0), m = spawnMob('guardiao', null, { x: f.x + (pg.x - f.x) * 0.55, z: f.z + (pg.z - f.z) * 0.55 });   // guarda a escadaria que sobe
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
    const cp = P.towerCp || 0, sac = (P.graves || []).filter(gv => gv.andar != null).pop();
    if (!cp && !sac) { enter(0); return; }
    const opts = [{ label: '🗼 1º andar', fn: () => enter(0) }];
    if (sac) opts.unshift({ label: `🎒 Voltar até a sua sacola (${sac.andar === TOP ? 'topo' : sac.andar + 1 + 'º andar'})`, fn: () => { enter(sac.andar); log('🎒 Sua sacola está neste andar, onde você caiu. Cuidado: os monstros voltaram.', 'gold'); } });
    for (const c of [10, 20]) if (cp >= c) opts.push({ label: `🗼 ${c + 1}º andar (ponto de retorno)`, fn: () => enter(c) });
    opts.push({ label: 'Agora não', fn: () => { } });
    dialog('🗼 Torre do Cisma', 'Por onde você quer começar a subida?', opts);
  }
  function enter(i, fromAbove) {
    clearFloorMobs();
    if (i < 0) {                                                       // sai da torre
      cur = -1; unbuild(); P.x = DOOR.x; P.z = DOOR.z + 6; P.y = groundY(P.x, P.z); P.face = 0; camS.yaw = Math.PI; portaArmada = false; blackout();   // sai bem à frente do portal
      log('Você saiu da Torre do Cisma.', 'sys'); return;
    }
    cur = i; const f = FLOORS[i]; buildFloor(f);
    if (fromAbove) opened[i] = true;                                    // quem desce já passou por aqui: a escadaria fica aberta
    // subiu: chega no começo da escadaria que desce (no chão do andar novo); desceu: chega no alto da que sobe
    const pc = fromAbove ? pontoRampa(f, 'sobe', 0.9) : pontoRampa(f, 'desce', 0.06);
    P.x = pc.x; P.z = pc.z; P.face = Math.atan2(f.x - P.x, f.z - P.z);
    P.y = groundY(P.x, P.z); camS.yaw = P.face + Math.PI; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.cur = 3; camS.pitch = Math.max(camS.pitch, 0.42);
    P.protT = time + 3;                                                 // 3 s sem apanhar ao chegar (dá para se situar)
    if (i === TOP) { camS.dist = Math.max(camS.dist, 24); camS.pitch = Math.max(camS.pitch, 0.32); }
    blackout();
    if (i === 10 || i === 20) if ((P.towerCp || 0) < i) { P.towerCp = i; log(`📍 <b>Ponto de retorno</b> liberado: a entrada da Torre agora deixa começar no <b>${i + 1}º andar</b>.`, 'gold'); }
    if (i > (P.towerBest || 0)) P.towerBest = i;
    banner(i === TOP ? 'TOPO DA TORRE' : `${i + 1}º ANDAR`);
    if (i === 0 && !fromAbove) log('⚔️ <b>A Torre é zona de guerra:</b> aqui o PvP é livre e qualquer jogador pode atacar você, menos quem é da sua guilda. Matar aqui não deixa o nome vermelho.', 'bad');
    spawnFloor(i);
    if (i === TOP) log(Kvx.active ? '☠ <b>Kravenox está acordado!</b> Derrube o Soberano!' : '💤 Kravenox dorme aqui em cima... Ele desperta todo <b>sábado às 20h</b> e fica acordado <b>6 horas</b> (até as 2h de domingo).', Kvx.active ? 'bad' : 'gold');
    else log(`🗼 Torre do Cisma — <b>${i + 1}º andar</b> (monstros nível ${lvOf(i)}).${GUARD[i] ? ` ☠ <b>${GUARD[i]}</b> guarda a escadaria!` : ''} Derrote todos para abrir a escadaria que sobe pela paredee.`, GUARD[i] ? 'bad' : 'sys');
    lastCount = -1;
  }
  function selada(f, x, z) { if (f.casa || f.i >= TOP || opened[f.i]) return false; const r = rampa(f, x, z); return !!r && r.tipo === 'sobe' && r.p < 0.16; }
  function corridor() { return false; }

  function update(dt) {
    beacon.rotation.y += dt; beacon.position.y = ty + 4 + Math.sin(time * 2) * 0.4;
    NEVOA.offset.set(time * 0.03, time * 0.08); doorGlow.material.opacity = 0.7 + Math.sin(time * 2) * 0.15;     // névoa da passagem se mexendo devagar
    for (const f of fires) f.scale.set(1.1 + Math.sin(time * 11 + f.position.x) * 0.08, 1.9 + Math.sin(time * 8 + f.position.x) * 0.2, 1);
    for (const sp of faiscas) { const u = sp.userData; u.t = (u.t + u.v * 0.016) % 1; sp.position.set(u.x + Math.sin(u.t * 9 + u.x) * 0.25, 0.3 + u.t * 7.2, dz - 0.4); sp.material.opacity = Math.sin(u.t * Math.PI); }
    if (!sleeperR && typeof kravenoxModel === 'function' && (typeof SpriteKit === 'undefined' || SpriteKit.ready || running)) buildSleeper();
    sleeper.visible = !Kvx.active && cur === TOP;
    if (sleeperR && sleeper.visible) sleeperR.anim({ moving: false, roar: 0, enraged: false, sleeping: true }, time);
    leaveT -= dt;
    if (P.dead || leaveT > 0) return;
    // o portal só funciona de novo depois que a pessoa se afasta dele (senão quem acabou de sair entra sozinho)
    const dPorta = Math.hypot(P.x - DOOR.x, P.z - DOOR.z);
    if (!inTower(P.z) && !portaArmada && dPorta > 5) portaArmada = true;
    if (!inTower(P.z) && portaArmada && dPorta < 3.2) { leaveT = 2.5; portaArmada = false; P.z = DOOR.z + 4; enterFromDoor(); return; }
    if (!inTower(P.z)) { if (cur !== -1) { cur = -1; clearFloorMobs(); unbuild(); } return; }
    const f = floorAt(P.x, P.z); if (!f || f.casa) return;
    if (f.i !== cur) { cur = f.i; buildFloor(f); }                  // asa de mosca / volta de outro jeito
    animFloor(dt);
    // escadaria norte: abre quando o andar está limpo e fica aberta
    const left = mobs.filter(m => m.towerFloor === cur).length;
    if (cur < TOP) {
      if (left === 0 && !clearedAt[cur]) clearedAt[cur] = time;
      if (left === 0 && clearedAt[cur] && time - clearedAt[cur] > RESPAWN && Math.hypot(P.x - f.x, P.z - f.z) < f.r) { spawnFloor(cur); log('👁️ Mais criaturas da Essência surgiram neste andar.', 'bad'); }
      if (left === 0 && !opened[cur]) { opened[cur] = true; Audio8.sfx('level'); log(`✨ Andar limpo! A escadaria para o <b>${cur + 1 === TOP ? 'topo' : (cur + 2) + 'º andar'}</b> se abriu (a que sobe pela parede).`, 'gold'); }
      const pe = pontoRampa(f, 'sobe', 0.08);
      if (!opened[cur] && Math.hypot(P.x - pe.x, P.z - pe.z) < 4 && left !== lastCount) { lastCount = left; log(`A escadaria está selada. Faltam <b>${left}</b> inimigos neste andar.`, 'bad'); }
    }
    const rp = rampa(f, P.x, P.z);                                       // chegou no fim de uma escadaria: troca de andar
    if (rp && rp.p > 0.97) { leaveT = 1; enter(rp.tipo === 'sobe' ? cur + 1 : cur - 1, rp.tipo === 'desce'); }
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
  return { update, minimap, enter, corridor, selada, lvOf, get floor() { return cur; }, door: DOOR, roof };
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
