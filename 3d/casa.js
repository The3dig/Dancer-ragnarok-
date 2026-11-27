// =====================================================================
//  Sua Casa no Sítio: só sua. Entre pela porta da casa do Sítio.
//  Lá dentro fica o baú (o que está nele nunca cai quando você morre)
//  e a bancada de reformas, onde você compra móveis com o tempo.
// =====================================================================
'use strict';
// 🏠 teto e paredes até o teto (pedido do Rone: "coloca teto e arruma a casa"; antes as paredes paravam em 3,6 m
// e aparecia o céu roxo em cima). Faixa de parede de "base" até ALT_CASA, cornija de madeira na emenda, forro de
// tábuas virado para baixo (visto de cima some), três vigas e um lustre de velas. A câmera não passa do teto (game3d).
const ALT_CASA = 6.2;
function tetoCasa(g, H, base, parede, cor) {
  const W = H * 2 + 1, alt = ALT_CASA - base, ym = base + alt / 2;
  const caixa = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.receiveShadow = true; g.add(o); return o; };
  for (const [x, z, w, d] of [[0, -H, W, 0.5], [0, H, W, 0.5], [-H, 0, 0.5, W], [H, 0, 0.5, W]]) caixa(w, alt, d, parede, x, ym, z);
  const mad = PM('madeira.jpg', [2, 1], new THREE.Color(cor || 0x9a6a44));
  for (const [x, z, w, d] of [[0, -H + 0.32, W, 0.25], [0, H - 0.32, W, 0.25], [-H + 0.32, 0, 0.25, W], [H - 0.32, 0, 0.25, W]]) { caixa(w, 0.22, d, mad, x, ALT_CASA - 0.85, z); caixa(w, 0.3, d, mad, x, ALT_CASA - 0.15, z); }   // a faixa de baixo fica acima do arco das portas (antes cortava o arco)
  const forro = new THREE.Mesh(new THREE.PlaneGeometry(W, W), PM('madeira.jpg', [5, 5], new THREE.Color(cor || 0x9a6a44).multiplyScalar(1.15)));
  forro.rotation.x = Math.PI / 2; forro.position.y = ALT_CASA; g.add(forro);
  for (const z of [-H / 2, 0, H / 2]) caixa(W, 0.35, 0.4, mad, 0, ALT_CASA - 0.2, z);
  // lustre: aro de ferro com velas acesas, pendurado por uma corrente
  const ferro = new THREE.MeshLambertMaterial({ color: 0x2a2420 }), vela = new THREE.MeshLambertMaterial({ color: 0xf4ecd8 }), chama = new THREE.MeshBasicMaterial({ color: 0xffc860, toneMapped: false });
  const lu = new THREE.Group(); lu.position.y = ALT_CASA - 1.5; g.add(lu);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 6, 24), ferro); aro.rotation.x = Math.PI / 2; lu.add(aro);
  const cor2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), ferro); cor2.position.y = 0.75; lu.add(cor2);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, x = Math.cos(a) * 0.7, z = Math.sin(a) * 0.7;
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 6), vela); v.position.set(x, 0.12, z); lu.add(v);
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), chama); c.scale.y = 1.8; c.position.set(x, 0.28, z); lu.add(c);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.75, 3), ferro); r.position.set(x / 2, 0.35, z / 2); r.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); lu.add(r); }
  return lu;
}
const Casa = (() => {
  const C = CASA, H = 7.6;                                 // meia-largura da sala
  const OUT_DOOR = { x: FARM.x - 13.6, z: FARM.z - 1 };
  let portaArmada = true;    // porta da casa do Sítio, por fora
  const IN_DOOR = { x: C.x, z: C.z + H - 1.2 };            // saída, por dentro
  const S = () => (P.casa = P.casa || { mov: {}, bau: {} });
  const it = id => ITEMS[id] || { name: id, ic: '❔' };

  // ---------------- móveis: [nome, ícone, preço, materiais, onde]
  const MOVEIS = {
    tapete: ['Tapete de Lã', '🟥', 200, { la: 4 }],
    cama: ['Cama de Madeira', '🛏️', 400, { raiz: 6, la: 2 }],
    mesa: ['Mesa e Bancos', '🪑', 300, { raiz: 8 }],
    estante: ['Estante de Livros', '📚', 600, { raiz: 6, po_eco: 4 }],
    lareira: ['Lareira de Pedra', '🔥', 900, { cristal: 4, lasca: 2 }],
    plantas: ['Vasos de Flor-da-Fonte', '🌸', 250, { flor: 3 }],
    trofeu: ['Troféu da Torre', '🏆', 2500, { essencia: 1, lasca: 4 }],
    estandarte: ['Estandarte do Soberano', '🚩', 1500, { fio: 6 }],
  };
  const madeira = PM('madeira.jpg', [1, 1], new THREE.Color(1.35, 1.15, 0.95));
  const madeiraE = PM('madeira.jpg', [1, 1], new THREE.Color(0.85, 0.68, 0.52));
  const pedra = PM('pedra.jpg', [1, 1], new THREE.Color(1.3, 1.25, 1.35));
  const g = new THREE.Group(); g.position.set(C.x, C.y, C.z); scene.add(g);
  const box = (w, h, d, m, x, y, z, par = g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; par.add(o); return o; };
  // piso de tábuas, paredes rebocadas com vigas, janelas com luz do dia
  box(H * 2 + 1, 0.4, H * 2 + 1, PM('madeira.jpg', [6, 6], new THREE.Color(1.25, 1.05, 0.85)), 0, -0.2, 0);
  const reboco = PM('reboco.jpg', [3, 1.2], new THREE.Color(1.45, 1.35, 1.2));
  for (const [x, z, w, d] of [[0, -H, H * 2 + 1, 0.5], [-H, 0, 0.5, H * 2 + 1], [H, 0, 0.5, H * 2 + 1]]) box(w, 3.6, d, reboco, x, 1.8, z);
  for (const sx of [-1, 1]) box(H - 1.4, 3.6, 0.5, reboco, sx * (H / 2 + 0.85), 1.8, H);        // parede da frente com a porta no meio
  box(2.2, 0.8, 0.5, reboco, 0, 3.2, H);
  for (let k = -3; k <= 3; k++) { box(0.25, 3.6, 0.3, madeiraE, k * 2.2, 1.8, -H + 0.35); if (k !== 0) box(0.3, 3.6, 0.25, madeiraE, -H + 0.35, 1.8, k * 2.2);   /* na parede oeste a viga do meio cortava a porta do Quarto Real */ box(0.3, 3.6, 0.25, madeiraE, H - 0.35, 1.8, k * 2.2); }
  // janelas centralizadas no vão entre duas vigas (vigas a cada 2,2; o meio do vão fica em ±3,3), com moldura inteira e peitoril
  const JAN = [[-H + 0.26, -3.3, Math.PI / 2], [H - 0.26, -3.3, -Math.PI / 2], [-3.3, -H + 0.26, 0], [3.3, -H + 0.26, 0]];
  for (const [x, z, ry] of JAN) {
    const j = new THREE.Group(); j.position.set(x, 0, z); j.rotation.y = ry; g.add(j);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.3), new THREE.MeshBasicMaterial({ color: 0xbfe0ff, toneMapped: false })); w.position.set(0, 2.1, 0); w.userData.janela = true; j.add(w);
    box(1.44, 0.12, 0.12, madeiraE, 0, 2.81, 0.05, j); box(0.12, 1.54, 0.12, madeiraE, -0.66, 2.1, 0.05, j); box(0.12, 1.54, 0.12, madeiraE, 0.66, 2.1, 0.05, j);
    box(0.06, 1.3, 0.05, madeiraE, 0, 2.1, 0.03, j); box(1.2, 0.06, 0.05, madeiraE, 0, 2.1, 0.03, j);      // cruz da vidraça
    box(1.6, 0.1, 0.26, madeiraE, 0, 1.4, 0.1, j);                                                        // peitoril
  }
  const doorM = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.55, toneMapped: false }); const dg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.8), doorM); dg.position.set(0, 1.4, H - 0.1); g.add(dg);
  tetoCasa(g, H, 3.6, reboco, 0xb07a4a);
  const luz = new THREE.PointLight(0xffd8a0, 1.6, 26); luz.position.set(0, 4.4, 0); g.add(luz);
  // ---------------- acabamento (pedido do Rone: "deixa ela linda, ainda mais com os cômodos novos"). Só nas paredes e
  // no que se vê lá fora, para não brigar com os móveis que se compram. Criado para o jogo.
  { const tx = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
    // paisagem do Sítio vista de dentro: céu, morros, árvores e o sol
    const paisagem = tx(256, 160, (x, w, h) => { const cg = x.createLinearGradient(0, 0, 0, h); cg.addColorStop(0, '#7ab8e8'); cg.addColorStop(0.6, '#cfe6f2'); cg.addColorStop(1, '#f2e8c8'); x.fillStyle = cg; x.fillRect(0, 0, w, h);
      x.fillStyle = '#fff6c0'; x.beginPath(); x.arc(200, 40, 16, 0, 7); x.fill();
      for (const [y0, cor, amp] of [[100, '#7aa86a', 14], [118, '#5a8a4a', 10], [138, '#4a7a3a', 6]]) { x.fillStyle = cor; x.beginPath(); x.moveTo(0, h); for (let i = 0; i <= w; i += 8) x.lineTo(i, y0 - Math.sin(i * 0.03 + y0) * amp); x.lineTo(w, h); x.fill(); }
      for (let i = 0; i < 9; i++) { const ax = 12 + i * 29, ay = 112 + (i % 3) * 6; x.fillStyle = '#3a5a2a'; x.beginPath(); x.arc(ax, ay, 9, 0, 7); x.fill(); x.fillStyle = '#5a3a20'; x.fillRect(ax - 1, ay + 6, 3, 8); }
      x.fillStyle = 'rgba(255,255,255,.8)'; for (const [cx, cy] of [[50, 30], [120, 22]]) { x.beginPath(); x.arc(cx, cy, 10, 0, 7); x.arc(cx + 12, cy + 3, 8, 0, 7); x.arc(cx - 11, cy + 4, 7, 0, 7); x.fill(); } });
    const pM = new THREE.MeshBasicMaterial({ map: paisagem, toneMapped: false });
    g.traverse(o => { const q = o.isMesh && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters; if (q && o.userData.janela) o.material = pM; });   // as janelas mostram a paisagem
    const porta = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.5), pM); porta.position.set(0, 2.2, H + 3); porta.rotation.y = Math.PI; g.add(porta);   // e a porta também
    // cortinas presas no alto de cada janela
    const pano = PM('reboco.jpg', [0.5, 1], new THREE.Color(0.75, 0.25, 0.3));
    for (const [x, z, ry] of JAN) {
      const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c);
      box(1.9, 0.05, 0.05, PM('madeira.jpg', [1, 1], new THREE.Color(0.9, 0.7, 0.3)), 0, 3.0, 0.18, c);   // varão
      for (const sd of [-1, 1]) { box(0.24, 1.75, 0.06, pano, sd * 0.8, 2.1, 0.2, c); box(0.1, 0.1, 0.1, PM('madeira.jpg', [1, 1], new THREE.Color(0.9, 0.7, 0.3)), sd * 0.8, 1.55, 0.25, c); } }
    // rodapé e sanca de madeira escura em volta
    for (const [x, z, w, d] of [[0, -H + 0.27, H * 2, 0.06], [-H + 0.27, 0, 0.06, H * 2], [H - 0.27, 0, 0.06, H * 2]]) { box(w || 0.06, 0.28, d || 0.06, madeiraE, x, 0.14, z); box(w || 0.06, 0.22, d || 0.06, madeiraE, x, 3.45, z); }
    for (const sx of [-1, 1]) { box(H - 1.4, 0.28, 0.06, madeiraE, sx * (H / 2 + 0.85), 0.14, H - 0.27); box(H - 1.4, 0.22, 0.06, madeiraE, sx * (H / 2 + 0.85), 3.45, H - 0.27); }
    // arandelas acesas nas paredes
    const chama = new THREE.MeshBasicMaterial({ color: 0xffc060, toneMapped: false }), latao = new THREE.MeshPhongMaterial({ color: 0xb88a3a, shininess: 80 });
    for (const [x, z, ry] of [[-H + 0.3, 3.3, Math.PI / 2], [H - 0.3, 1.6, -Math.PI / 2], [-1.2, -H + 0.3, 0], [-2.2, H - 0.3, Math.PI], [2.2, H - 0.3, Math.PI]]) {
      const a = new THREE.Group(); a.position.set(x, 0, z); a.rotation.y = ry; g.add(a);
      box(0.18, 0.3, 0.06, latao, 0, 2.55, 0.03, a); box(0.06, 0.06, 0.25, latao, 0, 2.6, 0.15, a);
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.22, 8), new THREE.MeshLambertMaterial({ color: 0xf2ead8 })); v.position.set(0, 2.75, 0.28); a.add(v);
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), chama); f.position.set(0, 2.9, 0.28); f.scale.y = 1.6; a.add(f); }
    // dois quadros na parede da porta (nenhum móvel encosta ali)
    const quadroT = (fundo, f) => tx(96, 72, (x, w, h) => { x.fillStyle = fundo; x.fillRect(0, 0, w, h); f(x, w, h); });
    const Q = [quadroT('#8ac0e0', (x) => { x.fillStyle = '#4a7a3a'; x.beginPath(); x.moveTo(0, 72); x.lineTo(30, 30); x.lineTo(55, 55); x.lineTo(75, 25); x.lineTo(96, 72); x.fill(); x.fillStyle = '#f6f0e0'; x.beginPath(); x.moveTo(30, 30); x.lineTo(24, 38); x.lineTo(36, 38); x.fill(); x.fillStyle = '#ffe080'; x.beginPath(); x.arc(78, 14, 7, 0, 7); x.fill(); }),
               quadroT('#3a2a3a', (x) => { x.fillStyle = '#d8a8c8'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(48 + Math.cos(i) * 14, 36 + Math.sin(i) * 14, 9, 0, 7); x.fill(); } x.fillStyle = '#ffd860'; x.beginPath(); x.arc(48, 36, 8, 0, 7); x.fill(); x.fillStyle = '#4a7a3a'; x.fillRect(46, 50, 4, 22); })];
    for (const [i, xq] of [[0, -4.3], [1, 4.3]]) { const fr = box(1.5, 1.15, 0.08, PM('madeira.jpg', [1, 1], new THREE.Color(0.7, 0.5, 0.25)), xq, 2.0, H - 0.3);
      const q = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.95), new THREE.MeshLambertMaterial({ map: Q[i] })); q.position.set(xq, 2.0, H - 0.35); q.rotation.y = Math.PI; g.add(q); }
    // capacho na entrada
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: tx(64, 32, (x, w, h) => { x.fillStyle = '#8a6a3a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#5a3a1a'; x.lineWidth = 3; x.strokeRect(3, 3, w - 6, h - 6); x.fillStyle = '#f2d890'; x.font = 'bold 14px Georgia'; x.textAlign = 'center'; x.fillText('LAR', 32, 22); }) }));
    cap.position.set(0, 0.025, H - 1.0); g.add(cap); }
  // baú (sempre existe)
  const bau = new THREE.Group(); bau.position.set(-H + 1.6, 0, -H + 1.4); g.add(bau);
  box(1.6, 0.8, 1, madeira, 0, 0.4, 0, bau); const tampa = box(1.65, 0.3, 1.05, madeira, 0, 0.95, 0, bau);
  const ferro = new THREE.MeshPhongMaterial({ color: 0x6a6a72, shininess: 60 }); for (const x of [-0.6, 0.6]) box(0.12, 1.15, 1.08, ferro, x, 0.58, 0, bau);
  box(0.25, 0.25, 0.08, new THREE.MeshPhongMaterial({ color: 0xe8b828, emissive: 0x3a2400, shininess: 100 }), 0, 0.75, 0.55, bau);
  const BAU = { x: C.x - H + 1.6, z: C.z - H + 1.4 };
  // bancada de reformas
  const banc = new THREE.Group(); banc.position.set(H - 1.4, 0, H - 2.4); g.add(banc);
  box(1.8, 0.15, 0.9, madeira, 0, 0.9, 0, banc); for (const [x, z] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) box(0.12, 0.9, 0.12, madeiraE, x, 0.45, z, banc);
  box(0.6, 0.2, 0.4, madeiraE, -0.4, 1.05, 0, banc); box(0.1, 0.5, 0.1, ferro, 0.4, 1.2, 0, banc);
  const BANC = { x: C.x + H - 1.4, z: C.z + H - 2.4 };
  addOb(BAU.x, BAU.z, 1.0); addOb(BANC.x, BANC.z, 1.0);

  // ---------------- móveis que aparecem quando comprados
  const objs = {};
  const BUILD = {
    tapete: p => { const t = new THREE.Mesh(new THREE.PlaneGeometry(6, 4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x8a2a2a })); t.position.y = 0.02; p.add(t); const b2 = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xb08a3a })); b2.position.y = 0.025; p.add(b2); const c2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 3).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x6a1a1e })); c2.position.y = 0.03; p.add(c2); },
    cama: p => { p.position.set(H - 1.6, 0, -H + 2); box(2, 0.5, 3.2, madeira, 0, 0.35, 0, p); box(1.8, 0.25, 3, new THREE.MeshLambertMaterial({ color: 0xe8e0d0 }), 0, 0.7, 0, p); box(1.8, 0.3, 1.6, new THREE.MeshLambertMaterial({ color: 0x3a5a8a }), 0, 0.75, 0.6, p); box(1.2, 0.25, 0.6, new THREE.MeshLambertMaterial({ color: 0xf4f0e8 }), 0, 0.88, -1.1, p); box(2.1, 1.3, 0.2, madeiraE, 0, 0.75, -1.6, p); addOb(C.x + H - 1.6, C.z - H + 2, 1.5); },
    mesa: p => { p.position.set(-2.5, 0, 1.5); box(2.4, 0.15, 1.4, madeira, 0, 1.0, 0, p); for (const [x, z] of [[-1, -0.55], [1, -0.55], [-1, 0.55], [1, 0.55]]) box(0.14, 1, 0.14, madeiraE, x, 0.5, z, p); for (const z of [-1.1, 1.1]) box(2, 0.12, 0.45, madeiraE, 0, 0.55, z, p); const pao = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshLambertMaterial({ color: 0xc08a40 })); pao.scale.set(1.4, 0.7, 1); pao.position.set(0.4, 1.15, 0); p.add(pao); addOb(C.x - 2.5, C.z + 1.5, 1.3); },
    estante: p => { p.position.set(1.5, 0, -H + 0.7); box(2.6, 3, 0.6, madeiraE, 0, 1.5, 0, p); const cores = [0x8a2a2a, 0x2a4a8a, 0x3a6a2a, 0x8a6a2a, 0x5a2a6a]; for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) box(0.22, 0.6 + (k % 3) * 0.08, 0.4, new THREE.MeshLambertMaterial({ color: cores[(k + r) % 5] }), -1.1 + k * 0.27, 0.55 + r * 0.95, 0.05, p); addOb(C.x + 1.5, C.z - H + 0.7, 1.4); },
    lareira: p => { p.position.set(-H + 0.9, 0, 2.5); p.rotation.y = Math.PI / 2; box(3, 2.4, 1, pedra, 0, 1.2, 0, p); box(3.4, 0.3, 1.3, pedra, 0, 2.5, 0, p); box(1.6, 1.3, 0.4, new THREE.MeshBasicMaterial({ color: 0x1a0a04 }), 0, 0.75, 0.35, p); box(1.4, 0.2, 2, pedra, 0, 3.6, -0.3, p);
      const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); f.position.set(0, 0.9, 0.6); f.scale.set(1.1, 1.3, 1); p.add(f); p.userData.fire = f; const l = new THREE.PointLight(0xff8a40, 1.4, 12); l.position.set(0, 1, 1.2); p.add(l); p.userData.light = l; addOb(C.x - H + 0.9, C.z + 2.5, 1.6); },
    plantas: p => { for (const [x, z] of [[-H + 0.9, -H + 3.2], [H - 0.9, 2.5], [-1.5, H - 0.9]]) { const v = new THREE.Group(); v.position.set(x, 0, z); p.add(v); box(0.5, 0.5, 0.5, PM('terra.jpg', [1, 1], 0xa06040), 0, 0.25, 0, v); for (let k = 0; k < 5; k++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshLambertMaterial({ color: k % 2 ? 0xf08ac8 : 0x5a9a3a })); fl.position.set(Math.sin(k * 1.3) * 0.18, 0.65 + k * 0.08, Math.cos(k * 1.3) * 0.18); v.add(fl); } } },
    trofeu: p => { p.position.set(3.2, 0, -H + 0.9); box(1, 1.1, 0.8, pedra, 0, 0.55, 0, p); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.15, 0.6, 12), new THREE.MeshPhongMaterial({ color: 0xe8b828, emissive: 0x4a3000, shininess: 120 })); t.position.y = 1.45; p.add(t); const e = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshPhongMaterial({ color: 0x8a40ff, emissive: 0x4a10a0 })); e.position.y = 1.95; p.add(e); p.userData.spin = e; addOb(C.x + 3.2, C.z - H + 0.9, 0.7); },
    estandarte: p => { p.position.set(-4, 0, -H + 0.32); const c = document.createElement('canvas'); c.width = 64; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#4a0a14'; x.beginPath(); x.moveTo(0, 0); x.lineTo(64, 0); x.lineTo(64, 140); x.lineTo(32, 160); x.lineTo(0, 140); x.fill(); x.fillStyle = '#b08a3a'; x.fillRect(0, 0, 64, 6); x.fillStyle = '#120608'; x.beginPath(); x.arc(32, 66, 16, 0, 6.3); x.fill(); x.fillStyle = '#ff3a3a'; x.fillRect(25, 62, 5, 3); x.fillRect(35, 62, 5, 3);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.position.y = 2; p.add(m); },
  };
  let _fire = null;
  function fireTex() { if (_fire) return _fire; const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d'), r = x.createRadialGradient(32, 92, 2, 32, 80, 50); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.3, 'rgba(255,170,60,.95)'); r.addColorStop(0.7, 'rgba(255,60,20,.4)'); r.addColorStop(1, 'rgba(120,0,0,0)'); x.fillStyle = r; x.beginPath(); x.moveTo(32, 4); x.quadraticCurveTo(62, 70, 32, 124); x.quadraticCurveTo(2, 70, 32, 4); x.fill(); return (_fire = new THREE.CanvasTexture(c)); }
  // 🎁 os móveis de parede vão para um lugar SORTEADO quando você compra (pedido do Rone: arrumar é difícil, e assim
  // é surpresa onde vai estar). Para mudar, fale com a Governanta Clara: ela troca o móvel de lugar.
  const SLOT = { b0: { w: 'b', v: -3.2 }, b1: { w: 'b', v: 0.6 }, b2: { w: 'b', v: 4.4 }, l1: { w: 'l', v: 3.4 }, r0: { w: 'r', v: -4.2 }, r1: { w: 'r', v: -0.2 } };   // a parede oeste perto do meio fica livre: é a porta dos cômodos
  const FUNDO = { cama: 1.8, estante: 0.4, lareira: 0.6, trofeu: 0.5, estandarte: 0.12 };      // quanto o móvel sai da parede
  const LEGADO = { estante: 'b1', trofeu: 'b2', estandarte: 'b0', lareira: 'l1', cama: 'r0' };   // quem já tinha fica onde estava
  const posOf = () => (S().pos = S().pos || {});
  const livres = (menos) => Object.keys(SLOT).filter(sl => !Object.entries(posOf()).some(([k, v]) => v === sl && k !== menos && S().mov[k]));
  function sortear(k) { const l = livres(k); return l.length ? l[Math.floor(Math.random() * l.length)] : null; }
  const obsDe = {};
  function obPor(x, z, r) { const o = { x, z, r }; for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) { const kk = i + ',' + j; if (!OB.has(kk)) OB.set(kk, []); OB.get(kk).push(o); } return o; }
  function obTirar(o) { for (const l of OB.values()) { const i = l.indexOf(o); if (i >= 0) l.splice(i, 1); } }
  function furnish() {
    for (const k of Object.keys(MOVEIS)) {
      if (!S().mov[k] || objs[k]) continue;
      const p = new THREE.Group(); g.add(p);
      if (!FUNDO[k]) { BUILD[k](p); objs[k] = p; continue; }                                  // tapete, mesa e vasos ficam onde estão
      const pos = posOf(); if (!pos[k] || !SLOT[pos[k]] || !livres(k).includes(pos[k])) pos[k] = (LEGADO[k] && livres(k).includes(LEGADO[k])) ? LEGADO[k] : sortear(k);
      const raios = [], orig = addOb; addOb = (x, z, r) => raios.push(r); try { BUILD[k](p); } finally { addOb = orig; }   // o desenho do móvel não marca o lugar antigo
      const sl = SLOT[pos[k]], d = FUNDO[k];
      if (sl.w === 'b') { p.position.set(sl.v, 0, -H + d); p.rotation.y = 0; } else if (sl.w === 'l') { p.position.set(-H + d, 0, sl.v); p.rotation.y = Math.PI / 2; } else { p.position.set(H - d, 0, sl.v); p.rotation.y = -Math.PI / 2; }
      const r = Math.max(0.5, ...raios), wx = C.x + p.position.x, wz = C.z + p.position.z, fx = Math.sin(p.rotation.y), fz = Math.cos(p.rotation.y);
      obsDe[k] = k === 'cama' ? [obPor(wx + fx * 0.8, wz + fz * 0.8, 1.1), obPor(wx - fx * 0.8, wz - fz * 0.8, 1.1)] : FUNDO[k] > 0.2 ? [obPor(wx, wz, Math.min(r, 1.4))] : [];
      objs[k] = p;
    }
  }
  // a Clara muda um móvel de lugar (vai para o próximo lugar livre)
  function mudar(k) {
    const l = livres(k).filter(sl => sl !== posOf()[k]); if (!l.length) { log('Não tem outro lugar livre para esse móvel.', 'bad'); return false; }
    const atual = Object.keys(SLOT).indexOf(posOf()[k]), ord = Object.keys(SLOT), prox = [...ord.slice(atual + 1), ...ord.slice(0, atual + 1)].find(sl => l.includes(sl));
    posOf()[k] = prox; if (objs[k]) { g.remove(objs[k]); delete objs[k]; } for (const o of obsDe[k] || []) obTirar(o); delete obsDe[k];
    furnish(); Audio8.sfx('pick'); save(); return true;
  }
  function menuMudar(voltar) {
    const tem = Object.keys(FUNDO).filter(k => S().mov[k]);
    if (!tem.length) return dialog('🧹 Governanta Clara', 'Ainda não tem móvel para mudar de lugar. Compre na <b>bancada de reformas</b> e eu coloco onde eu achar melhor! 😉', [{ label: 'Voltar', fn: () => { if (voltar) voltar(); return true; } }]);
    dialog('🧹 Mudar os móveis de lugar', 'Escolha o móvel: cada toque leva ele para <b>outro lugar livre</b> da sala.', [...tem.map(k => ({ label: `${MOVEIS[k][1]} ${MOVEIS[k][0]}`, fn: () => { mudar(k); menuMudar(voltar); return true; } })), { label: '← Voltar', fn: () => { if (voltar) voltar(); return true; } }]);
  }
  // porta da casa do Sítio (por fora): soleira acesa
  const sole = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.5, toneMapped: false })); sole.position.set(OUT_DOOR.x + 0.5, groundY(OUT_DOOR.x, OUT_DOOR.z) + 0.05, OUT_DOOR.z); scene.add(sole);

  // ---------------- baú (pedido do Rone: com as opções da mochila)
  // abas por tipo, ícones desenhados, detalhes do item, guardar/pegar 1, 10, escolher a quantidade ou tudo,
  // e guardar/pegar TUDO da aba de uma vez. Os dois lados (baú e mochila) usam a mesma aba.
  const ABAS = [
    ['tudo', '📦', 'Tudo', () => true],
    ['equip', '⚔️', 'Equip.', I => I.kind === 'equip'],
    ['mat', '🪨', 'Material', I => I.kind === 'mat'],
    ['carta', '🃏', 'Cartas', I => I.kind === 'carta'],
    ['uso', '🧪', 'Usáveis', I => !!(I.use || I.heal || I.spH)],
    ['sitio', '🌾', 'Sítio', I => ['semente', 'colheita', 'racao', 'comida'].includes(I.kind)],
  ];
  let bsel = null, aba = 'tudo', qtd = 1;
  const filtro = () => ABAS.find(t => t[0] === aba)[3];
  const ordem = (a, b) => { const A = ITEMS[a], B = ITEMS[b], k = I => ({ equip: 0, carta: 1, mat: 3 })[I.kind] ?? 2; return k(A) - k(B) || (B.rar || 0) - (A.rar || 0) || A.name.localeCompare(B.name); };
  const ico = id => typeof Icones !== 'undefined' ? Icones.html(id) : `<span>${it(id).ic}</span>`;
  const preso = id => { const I = ITEMS[id]; return I && (I.preso || I.kind === 'montaria'); };    // peças presas e montaria ficam com você
  function bauWin() {
    let w = $('bauwin');
    if (!w) {
      w = document.createElement('div'); w.id = 'bauwin'; w.className = 'win hidden'; $('hud').appendChild(w);
      w.addEventListener('click', e => {
        const t = e.target.closest('[data-a]'); if (!t) return; Audio8.sfx('click');
        const a = t.dataset.a, v = t.dataset.v, b = S().bau;
        if (a === 'x') { w.classList.add('hidden'); tampa.rotation.x = 0; tampa.position.set(0, 0.95, 0); return; }
        if (a === 'aba') { aba = v; bsel = null; }
        if (a === 'sel') { bsel = bsel === v ? null : v; qtd = 1; }
        if (a === 'q') { const [side, id] = (bsel || ':').split(':'), max = side === 'b' ? b[id] || 0 : P.inv[id] || 0; qtd = Math.max(1, Math.min(max, qtd + (+v))); renderBau(); return; }
        const mv = (from, to, id, n) => { n = Math.min(n, from[id] || 0); if (n <= 0) return 0; from[id] -= n; to[id] = (to[id] || 0) + n; return n; };
        if (bsel && ['one', 'ten', 'qtd', 'all'].includes(a)) { const [side, id] = bsel.split(':'), from = side === 'b' ? b : P.inv, to = side === 'b' ? P.inv : b;
          if (side === 'm' && preso(id)) { log(`🔒 <b>${it(id).name}</b> fica sempre com você.`, 'bad'); Audio8.sfx('miss'); return; }
          const n = a === 'one' ? 1 : a === 'ten' ? 10 : a === 'qtd' ? qtd : from[id]; if (mv(from, to, id, n)) Audio8.sfx('pick');
          if ((from[id] || 0) <= 0) bsel = null; else qtd = Math.min(qtd, from[id]); }
        if (a === 'guardaraba' || a === 'pegaraba') { const f = filtro(), from = a === 'guardaraba' ? P.inv : b, to = a === 'guardaraba' ? b : P.inv; let n = 0;
          for (const id of Object.keys(from)) if (from[id] > 0 && ITEMS[id] && f(ITEMS[id], id) && !(a === 'guardaraba' && preso(id))) n += mv(from, to, id, from[id]);
          if (n) { Audio8.sfx('pick'); log(`📦 ${a === 'guardaraba' ? 'Guardou' : 'Pegou'} <b>${n.toLocaleString('pt-BR')}</b> itens da aba ${ABAS.find(t => t[0] === aba)[2]}.`, 'sys'); } bsel = null; }
        if (a === 'loot') { let n = 0; for (const id of Object.keys(P.inv)) if (P.inv[id] > 0 && ITEMS[id] && LOOT_KINDS.includes(ITEMS[id].kind) && !preso(id)) n += mv(P.inv, b, id, P.inv[id]); if (n) log(`📦 Guardou <b>${n.toLocaleString('pt-BR')}</b> itens da pilhagem.`, 'sys'); bsel = null; }
        buildHotbar(); save(); renderBau();
      });
    }
    return w;
  }
  function detalhe(id) {
    const I = it(id);
    if (I.kind === 'equip') { const R = typeof Vida !== 'undefined' && Vida.RARITY ? Vida.RARITY[I.rar] : null; return `${R ? `<span style="color:${R.c}">${R.n}</span> · ` : ''}${(Vida.SLOTS && Vida.SLOTS[I.slot]) || I.slot || ''}`; }
    return { carta: 'Carta de monstro', mat: 'Material', semente: 'Semente', colheita: 'Colheita do Sítio', comida: 'Comida', racao: 'Ração', montaria: 'Montaria' }[I.kind] || (I.use ? 'Usável' : '');
  }
  function renderBau() {
    const b = S().bau, f = filtro();
    const cell = (side, id, n) => `<div class="icell${bsel === side + ':' + id ? ' sel' : ''}${ITEMS[id].kind === 'equip' ? ' eq r' + ITEMS[id].rar : ''}" data-a="sel" data-v="${side}:${id}" title="${it(id).name}">${ico(id)}<b>${n > 999 ? Math.floor(n / 1000) + 'k' : n}</b></div>`;
    const bi = Object.keys(b).filter(id => b[id] > 0 && ITEMS[id] && f(ITEMS[id], id)).sort(ordem), mi = Object.keys(P.inv).filter(id => P.inv[id] > 0 && ITEMS[id] && f(ITEMS[id], id)).sort(ordem);
    const todosB = Object.keys(b).filter(id => b[id] > 0 && ITEMS[id]), todosM = Object.keys(P.inv).filter(id => P.inv[id] > 0 && ITEMS[id]);
    const abas = `<div class="itabs">${ABAS.map(([k, ic, nm, ff]) => { const n = new Set([...todosB, ...todosM].filter(id => ff(ITEMS[id], id))).size; return `<div class="itab${aba === k ? ' on' : ''}" data-a="aba" data-v="${k}"><span>${ic}</span><small>${nm}</small>${k !== 'tudo' && n ? `<b>${n}</b>` : ''}</div>`; }).join('')}</div>`;
    let det = '<small>Toque num item (no baú ou na mochila) para guardar ou pegar.</small>';
    if (bsel) { const [side, id] = bsel.split(':'), n = side === 'b' ? b[id] || 0 : P.inv[id] || 0, verb = side === 'b' ? 'Pegar' : 'Guardar';
      det = `<div class="bau-det">${ico(id)}<div><b>${it(id).name}</b> <small>×${n.toLocaleString('pt-BR')} ${side === 'b' ? 'no baú' : 'na mochila'}</small><br><small>${detalhe(id)}</small></div></div>
        <div class="ibtn"><button data-a="one">${verb} 1</button>${n > 10 ? `<button data-a="ten">${verb} 10</button>` : ''}${n > 2 ? `<span class="bau-q"><button data-a="q" data-v="-10">−10</button><button data-a="q" data-v="-1">−</button><b>${qtd}</b><button data-a="q" data-v="1">+</button><button data-a="q" data-v="10">+10</button></span><button data-a="qtd">${verb} ${qtd}</button>` : ''}<button data-a="all">${verb} tudo</button></div>`; }
    const nomeAba = ABAS.find(t => t[0] === aba)[2];
    bauWin().innerHTML = `<div class="wt">📦 Baú da Casa<span class="x" data-a="x">×</span></div>${abas}
      <div class="bau-b"><div class="bau-c"><h4>📦 No baú (${bi.length})</h4><div class="igrid">${bi.map(id => cell('b', id, b[id])).join('') || '<i class="empty">Nada aqui.</i>'}</div></div>
      <div class="bau-c"><h4>🎒 Na mochila (${mi.length})</h4><div class="igrid">${mi.map(id => cell('m', id, P.inv[id])).join('') || '<i class="empty">Nada aqui.</i>'}</div></div></div>
      <div class="idet">${det}</div>
      <div class="ibtn foot"><button data-a="guardaraba">⬇️ Guardar tudo${aba === 'tudo' ? '' : ' de ' + nomeAba}</button><button data-a="pegaraba">⬆️ Pegar tudo${aba === 'tudo' ? '' : ' de ' + nomeAba}</button><button data-a="loot">⬇️ Guardar a pilhagem</button></div>
      <div class="bau-n">O que está no baú não cai quando você morre. Peças presas e a montaria ficam sempre com você.</div>`;
  }
  function bauMenu() { bsel = null; renderBau(); bauWin().classList.remove('hidden'); tampa.rotation.x = -1.1; tampa.position.set(0, 1.25, -0.35); Audio8.sfx('pick'); }
  // ---------------- reformas
  function reformas() {
    const opts = Object.entries(MOVEIS).map(([k, [nome, ic, preco, need]]) => {
      if (S().mov[k]) return { label: `✅ ${ic} ${nome} — já está na casa`, fn: () => { reformas(); return true; } };
      const txt = Object.entries(need).map(([id, n]) => `${n} ${it(id).ic}`).join(' + ');
      const CM = typeof Comodos !== 'undefined' && Comodos.qtd;                          // 📦 conta a mochila e o baú da casa
      const tem = id => CM ? Comodos.qtd(id) : (P.inv[id] || 0);
      const ok = P.zeny >= preco && Object.entries(need).every(([id, n]) => tem(id) >= n);
      const falta = CM && Comodos.faltaTxt ? Comodos.faltaTxt(preco, need) : '';
      return { label: `${ok ? '🔨' : '🔒'} ${ic} ${nome} — ${preco} cr + ${txt}${falta && !ok ? ` · ${falta}` : ''}`, fn: () => {
        if (!ok && CM && Comodos.matTxt) { dialog(`${ic} ${nome}`, `Para fazer precisa:<br>${P.zeny >= preco ? '✅' : '❌'} <b>💰 Coroas</b>: tem <b>${P.zeny.toLocaleString('pt-BR')}</b> de ${preco.toLocaleString('pt-BR')}<br>${Comodos.matTxt(need)}<br><small>A mochila e o baú da casa contam juntos.</small>`, [{ label: '← Voltar', fn: () => { reformas(); return true; } }]); return true; }
        if (!ok) { const falta = Object.entries(need).filter(([id, n]) => tem(id) < n).map(([id, n]) => `${n - tem(id)} ${it(id).name}`); log(falta.length ? `Falta: ${falta.join(', ')}.` : 'Coroas insuficientes!', 'bad'); Audio8.sfx('miss'); reformas(); return true; }
        P.zeny -= preco; if (CM) Comodos.tirarMat(need); else for (const [id, n] of Object.entries(need)) P.inv[id] -= n;
        S().mov[k] = 1; if (FUNDO[k]) posOf()[k] = sortear(k); furnish(); if (typeof Comodos !== 'undefined') Comodos.completos(); Audio8.sfx('anvil'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xffd060, 24, 3, 0.7);
        log(`🏠 <b>${nome}</b> chegou! ${FUNDO[k] ? 'A Governanta Clara escolheu onde colocar: vá ver! (ela muda de lugar se você pedir)' : 'Já está na sua casa.'}`, 'gold'); save(); reformas(); return true; } };
    });
    if (typeof Comodos !== 'undefined' && Comodos.optPref) { opts.push(Comodos.optPref(reformas)); opts.push({ label: '📖 Livro dos Móveis', fn: () => { Comodos.livro(); return true; } }); }
    opts.push({ label: 'Fechar' });
    const n = Object.keys(S().mov).length;
    dialog('🔨 Reformas da Casa', `Mobilie a casa aos poucos com coroas e o que você junta nas caçadas e no Sítio.<br><small>Móveis: ${n}/${Object.keys(MOVEIS).length} · Coroas: <b>${P.zeny} cr</b></small>`, opts);
  }
  // 📖 fazer um móvel da sala direto pelo Livro dos Móveis (vai para o lugar dele na casa na hora)
  function fazer(k) {
    const M0 = MOVEIS[k]; if (!M0 || S().mov[k]) return false; const [nome, , preco, need] = M0;
    const CM = typeof Comodos !== 'undefined' && Comodos.qtd, tem = id => CM ? Comodos.qtd(id) : (P.inv[id] || 0);
    if (P.zeny < preco || !Object.entries(need).every(([id, n]) => tem(id) >= n)) return false;
    P.zeny -= preco; if (CM) Comodos.tirarMat(need); else for (const [id, n] of Object.entries(need)) P.inv[id] -= n;
    S().mov[k] = 1; if (FUNDO[k]) posOf()[k] = sortear(k); furnish(); if (typeof Comodos !== 'undefined') Comodos.completos(); Audio8.sfx('anvil');
    log(`🏠 <b>${nome}</b> chegou e já está no lugar dele na sala da casa!`, 'gold'); try { save(); } catch (e) { } return true;
  }
  // ---------------- entrar / sair
  let leaveT = 0;
  function entrar() {
    furnish();
    P.x = IN_DOOR.x; P.z = IN_DOOR.z - 1.5; P.y = C.y; P.face = Math.PI; camS.yaw = 0; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.dist = Math.min(camS.dist, 10);
    Audio8.sfx('warp'); banner('🏠 Sua Casa'); leaveT = 1;
    if (!P.casaSeen) { P.casaSeen = 1; log('🏠 Esta é a sua casa. O <b>baú</b> (canto esquerdo) guarda itens que não caem quando você morre; a <b>bancada</b> (direita) vende móveis.', 'gold'); }
  }
  function sair() { portaArmada = false; P.x = OUT_DOOR.x + 2.6; P.z = OUT_DOOR.z; P.y = groundY(P.x, P.z); P.face = Math.PI / 2; camS.yaw = -Math.PI / 2; Audio8.sfx('warp'); leaveT = 1; }
  function update(dt) {
    g.visible = inTower(P.z) && zoneOf(P.x, P.z) === 'casa' && Math.hypot(P.x - C.x, P.z - C.z) < 14;   // nos cômodos novos a sala some            // fora da casa ela some (as luzes dela pesavam no mapa todo)
    leaveT -= dt; sole.material.opacity = 0.35 + Math.sin(time * 3) * 0.15;
    if (objs.lareira) { const f = objs.lareira.userData.fire; f.scale.set(1.05 + Math.sin(time * 13) * 0.08, 1.25 + Math.sin(time * 9) * 0.15, 1); objs.lareira.userData.light.intensity = 1.2 + Math.sin(time * 11) * 0.25; }
    if (objs.trofeu) objs.trofeu.userData.spin.rotation.y += dt * 1.5;
    if (P.dead || leaveT > 0) return;
    const dPorta = Math.hypot(P.x - OUT_DOOR.x, P.z - OUT_DOOR.z);
    if (!inTower(P.z) && !portaArmada && dPorta > 3) portaArmada = true;            // só entra de novo depois de se afastar da porta
    if (!inTower(P.z) && portaArmada && dPorta < 1.6) { portaArmada = false; entrar(); }
    else if (zoneOf(P.x, P.z) === 'casa' && Math.hypot(P.x - IN_DOOR.x, P.z - IN_DOOR.z) < 1.3) sair();
  }
  function nearest() {
    if (zoneOf(P.x, P.z) !== 'casa') return null;
    if (Math.hypot(P.x - BAU.x, P.z - BAU.z) < 2.6) return { label: '📦 Abrir o baú', fn: () => bauMenu() };
    if (Math.hypot(P.x - BANC.x, P.z - BANC.z) < 2.6) return { label: '🔨 Reformas da casa', fn: () => reformas() };
    return null;
  }
  return { update, nearest, entrar, sair, furnish, menuMudar, fazer, door: OUT_DOOR, MOVEIS, BUILD };
})();
