// =====================================================================
//  🏰 Castelo da Guilda e as Brincadeiras das 20h (ideia do Rone, inspirada no Ragnarok Origin).
//  - No painel 🛡️ Guilda → "Entrar no castelo": vai para o saguão do castelo. Cada guilda só vê os
//    próprios membros lá dentro (os estandartes têm o emblema e a sigla da sua guilda).
//  - De segunda a sexta, das 20h às 20h30, acontece uma brincadeira no saguão (sábado e domingo às
//    20h já tem o Kravenox e o Verme):
//      seg e qui: ⚔️ Caçada no Saguão (monstros saem das paredes; cada um vale ponto)
//      ter e sex: ✊ Jokenpô com o Bobo da Corte (ganhe partidas seguidas)
//      qua:       🎁 Baús Escondidos (baús pelo saguão; cuidado, alguns são mímicos!)
//    Os pontos dão prêmios e também viram XP para a guilda.
// =====================================================================
'use strict';
const Castelo = (() => {
  const C = CASTELO, R = C.r, INI = 20 * 60, DUR = 30;               // 20:00 às 20:30 (minutos do dia)
  ZONES.castelo = { name: 'Castelo da Guilda', music: 'fortaleza' };
  const TIPOS = { 1: 'monstros', 2: 'jokenpo', 3: 'baus', 4: 'monstros', 5: 'jokenpo' };
  const NOME = { monstros: '⚔️ Caçada no Saguão', jokenpo: '✊ Jokenpô com o Bobo da Corte', baus: '🎁 Baús Escondidos' };
  const DESC = { monstros: 'monstros saem das paredes do saguão: cada um derrotado vale 1 ponto', jokenpo: 'desafie o Bobo da Corte no jokenpô: cada vitória vale 1 ponto, 3 seguidas valem bônus', baus: '12 baús escondidos pelo saguão: abra (alguns são mímicos e mordem!)' };
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  let forcado = null;   // só para teste: Castelo._forcar('baus')
  function agora() { if (forcado) return { tipo: forcado, ativo: true, falta: 0, resta: 30, dia: new Date().toLocaleDateString('pt-BR') }; const d = new Date(), min = d.getHours() * 60 + d.getMinutes(), tipo = TIPOS[d.getDay()] || null; return { tipo, ativo: !!tipo && min >= INI && min < INI + DUR, falta: (INI - min), resta: INI + DUR - min, dia: d.toLocaleDateString('pt-BR') }; }
  const E = () => { const a = agora(); if (!P.gEv || P.gEv.dia !== a.dia) P.gEv = { dia: a.dia, pts: 0, prem: 0, jk: 0, seq: 0, baus: [] }; return P.gEv; };
  const dentro = () => inTower(P.z) && zoneOf(P.x, P.z) === 'castelo';

  // ---------------- o castelo (vários cômodos; pedido do Rone: maior, com salas e gente andando,
  // e com mais acabamento: pedra com rejunte, madeira, tapetes e tapeçarias desenhados, vitrais, lustres)
  // Planta (x para o leste, z para o sul; o centro do castelo é o meio do saguão):
  //   Biblioteca (norte, atrás do trono) · Arsenal (oeste) · SAGUÃO · Banquete (leste) · Vestíbulo (sul, com a saída)
  const g = new THREE.Group(); g.position.set(C.x, 0, C.z); g.visible = false; scene.add(g);
  const SALAS = { saguao: [-11, 11, -9, 9], vest: [-6, 6, 9, 19], arsenal: [-25, -11, -7, 7], banquete: [11, 25, -7, 7], biblio: [-8, 8, -22, -9] };
  const PORTAS = [['x', -11, 0, 3.2], ['x', 11, 0, 3.2], ['z', 9, 0, 3.6], ['z', -9, 5.5, 2.8]];   // eixo, posição, centro, largura (a da biblioteca fica ao lado do trono)
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const L = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o }), PH = (c, e = 0, sh = 60) => new THREE.MeshPhongMaterial({ color: c, emissive: e, shininess: sh });
  const ouro = PH(0xd9a63a, 0x2a1800, 90), ferro = PH(0x4a4a52, 0, 50);
  const madeira = c => PM('madeira.jpg', [1, 1], new THREE.Color(c));
  const piso = PM('pedra.jpg', [10, 10], new THREE.Color(0.78, 0.74, 0.7)), pisoV = PM('pedra.jpg', [5, 5], new THREE.Color(0.7, 0.66, 0.62));
  const paredeM = PM('pedra.jpg', [6, 2], new THREE.Color(0.72, 0.66, 0.6)), rodape = madeira(0x5a3a24);
  const box = (w, h, d, mat, x, y, z, par = g, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; par.add(o); return o; };
  const cil = (rt, rb, h, mat, x, y, z, seg = 14, par = g) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); o.position.set(x, y, z); o.castShadow = true; par.add(o); return o; };
  const ob = (x, z, r) => addOb(C.x + x, C.z + z, r);
  // tapetes com borda e desenho (canvas), nada de cor lisa
  const tapeteT = (base, borda, motivo) => tex(256, 512, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); x.strokeStyle = borda; x.lineWidth = 14; x.strokeRect(10, 10, w - 20, h - 20); x.lineWidth = 3; x.strokeRect(28, 28, w - 56, h - 56);
    x.fillStyle = motivo; for (let y = 70; y < h - 60; y += 70) { x.beginPath(); x.moveTo(w / 2, y - 22); x.lineTo(w / 2 + 26, y); x.lineTo(w / 2, y + 22); x.lineTo(w / 2 - 26, y); x.fill(); } for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  const tapete = (w, d, x, z, t, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), L(0xffffff, { map: t })); m.position.set(x, 0.03, z); m.rotation.y = ry; g.add(m); return m; };
  // paredes: blocos de pedra com rodapé de madeira e cornija; deixam vão nas portas e ficam transparentes se taparem a câmera
  const paredes = [];
  function parede(x0, z0, x1, z1) {
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, H = 6;
    const mat = paredeM.clone(); mat.map = paredeM.map.clone(); mat.map.repeat.set(len / 4, 1.6); mat.map.needsUpdate = true; mat.transparent = true;
    const w = box(0.6, H, len, mat, cx, H / 2, cz, g, ang); paredes.push(w);
    box(0.72, 0.5, len, rodape, cx, 0.25, cz, g, ang); box(0.8, 0.35, len, PM('pedra.jpg', [len / 3, 1], new THREE.Color(0.55, 0.5, 0.46)), cx, H - 0.1, cz, g, ang);
    for (let t = 0; t <= len; t += 0.8) ob(x0 + (x1 - x0) * t / len, z0 + (z1 - z0) * t / len, 0.55);
  }
  // contorno de uma sala com os vãos das portas
  function sala([x0, x1, z0, z1]) {
    const lados = [['z', z0, x0, x1], ['z', z1, x0, x1], ['x', x0, z0, z1], ['x', x1, z0, z1]];
    for (const [eixo, pos, a, b2] of lados) {
      const vaos = PORTAS.filter(p => p[0] === eixo && Math.abs(p[1] - pos) < 0.01 && p[2] > a && p[2] < b2).map(p => [p[2] - p[3] / 2, p[2] + p[3] / 2]).sort((u, v) => u[0] - v[0]);
      let ini = a; for (const [v0, v1] of vaos) { if (v0 > ini) eixo === 'z' ? parede(ini, pos, v0, pos) : parede(pos, ini, pos, v0); ini = v1; }
      if (b2 > ini) eixo === 'z' ? parede(ini, pos, b2, pos) : parede(pos, ini, pos, b2);
    }
  }
  const feitas = new Set(); const paredeUnica = (k, fn) => { if (!feitas.has(k)) { feitas.add(k); fn(); } };
  // pisos e tetos de cada sala
  for (const [k, [x0, x1, z0, z1]] of Object.entries(SALAS)) {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, pm = k === 'saguao' ? piso : pisoV.clone(); if (pm !== piso) { pm.map = pisoV.map.clone(); pm.map.repeat.set(w / 3, d / 3); pm.map.needsUpdate = true; }
    const ch = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), pm); ch.position.set(cx, 0.01, cz); ch.receiveShadow = true; g.add(ch);
    const te = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(Math.PI / 2), L(0x2a2018)); te.position.set(cx, 6, cz); g.add(te);
    for (let t = x0 + 2; t < x1; t += 3) box(0.35, 0.4, d, madeira(0x4a2a14), t, 5.8, cz);                 // vigas do teto
  }
  // paredes (cada parede compartilhada só uma vez)
  sala([-11, 11, -9, 9]);
  for (const [k, r] of Object.entries(SALAS)) if (k !== 'saguao') {
    const [x0, x1, z0, z1] = r;
    for (const [eixo, pos, a, b2] of [['z', z0, x0, x1], ['z', z1, x0, x1], ['x', x0, z0, z1], ['x', x1, z0, z1]]) {
      const encostada = (eixo === 'x' && Math.abs(Math.abs(pos) - 11) < 0.01 && z0 >= -9 && z1 <= 9) || (eixo === 'z' && ((Math.abs(pos - 9) < 0.01 && k === 'vest') || (Math.abs(pos + 9) < 0.01 && k === 'biblio')));
      if (encostada) continue;                                              // essa já é a parede do saguão
      const vaos = PORTAS.filter(p => p[0] === eixo && Math.abs(p[1] - pos) < 0.01).map(p => [p[2] - p[3] / 2, p[2] + p[3] / 2]);
      let ini = a; for (const [v0, v1] of vaos.sort((u, v) => u[0] - v[0])) { if (v0 > ini && v0 < b2) eixo === 'z' ? parede(ini, pos, v0, pos) : parede(pos, ini, pos, v0); ini = Math.max(ini, v1); }
      if (b2 > ini) eixo === 'z' ? parede(ini, pos, b2, pos) : parede(pos, ini, pos, b2);
    }
  }
  // arcos de pedra nas portas
  for (const [eixo, pos, c, larg] of PORTAS) { const a = new THREE.Mesh(new THREE.TorusGeometry(larg / 2 + 0.2, 0.32, 8, 20, Math.PI), PM('pedra.jpg', [2, 1], new THREE.Color(0.6, 0.55, 0.5))); if (eixo === 'x') { a.position.set(pos, 3.6, c); a.rotation.y = Math.PI / 2; } else a.position.set(c, 3.6, pos); g.add(a); }
  // ----- SAGUÃO: colunas, tapete até o trono, trono, mesa de guerra, lustres, vitrais e tapeçarias
  for (const x of [-7.5, 7.5]) for (const z of [-5, 0, 5]) { cil(0.55, 0.62, 5.6, PM('pedra.jpg', [1, 3], new THREE.Color(0.75, 0.7, 0.65)), x, 2.8, z); box(1.4, 0.4, 1.4, PM('pedra.jpg', [1, 1], new THREE.Color(0.55, 0.5, 0.46)), x, 0.2, z); box(1.4, 0.4, 1.4, PM('pedra.jpg', [1, 1], new THREE.Color(0.55, 0.5, 0.46)), x, 5.6, z); const an = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 8, 20).rotateX(Math.PI / 2), ouro); an.position.set(x, 1.1, z); g.add(an); ob(x, z, 0.8); }
  tapete(3.2, 26, 0, 3, tapeteT('#7a0e1c', '#d9a63a', '#b8862a'));
  box(7, 0.3, 3.4, PM('pedra.jpg', [2, 1], new THREE.Color(0.6, 0.55, 0.5)), 0, 0.15, -7.2); box(5, 0.3, 2.4, PM('pedra.jpg', [2, 1], new THREE.Color(0.66, 0.6, 0.55)), 0, 0.45, -7.4);
  { const tr = new THREE.Group(); tr.position.set(0, 0.6, -7.7); g.add(tr); box(1.7, 0.6, 1.3, ouro, 0, 0.3, 0, tr); box(1.4, 0.2, 1.1, L(0x7a0e1c), 0, 0.68, 0.05, tr); box(1.7, 2.8, 0.25, ouro, 0, 1.9, -0.55, tr); box(1.3, 2.2, 0.05, L(0x7a0e1c), 0, 1.9, -0.41, tr); for (const s2 of [-1, 1]) { box(0.22, 0.55, 1.2, ouro, 0.82 * s2, 0.95, 0, tr); const p = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), ouro); p.position.set(0.82 * s2, 3.4, -0.55); tr.add(p); } ob(0, -7.6, 1.4); }
  { const mesa = new THREE.Group(); mesa.position.set(0, 0, 1); g.add(mesa); cil(2.4, 2.4, 0.18, madeira(0x9a6a40), 0, 1.0, 0, 28, mesa); cil(0.5, 0.75, 1, madeira(0x6a4a2a), 0, 0.5, 0, 10, mesa);
    const mapaT = tex(256, 256, (x, w) => { x.fillStyle = '#d8c8a0'; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill(); x.strokeStyle = '#6a4a2a'; x.lineWidth = 3; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(40 + k * 30, 60); x.quadraticCurveTo(128, 30 + k * 30, 210, 90 + k * 18); x.stroke(); } x.fillStyle = '#a8182a'; for (let k = 0; k < 7; k++) { x.beginPath(); x.arc(60 + Math.random() * 140, 60 + Math.random() * 140, 6, 0, 7); x.fill(); } });
    const mp = new THREE.Mesh(new THREE.CircleGeometry(2.1, 28).rotateX(-Math.PI / 2), L(0xffffff, { map: mapaT })); mp.position.y = 1.1; mesa.add(mp);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, c2 = new THREE.Group(); c2.position.set(Math.cos(a) * 3, 0, Math.sin(a) * 3); c2.rotation.y = -a + Math.PI / 2; mesa.add(c2); box(0.7, 0.1, 0.7, madeira(0x5a3a24), 0, 0.6, 0, c2); box(0.7, 1, 0.1, madeira(0x5a3a24), 0, 1.1, -0.32, c2); for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) box(0.08, 0.6, 0.08, madeira(0x4a2a14), dx, 0.3, dz, c2); }
    ob(0, 1, 3.3); }
  // lustres (com velas que brilham)
  const velas = [];
  function lustre(x, z, r = 1.1) { const l = new THREE.Group(); l.position.set(x, 5.3, z); g.add(l); box(0.05, 0.6, 0.05, ferro, 0, 0.35, 0, l); const an = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 8, 28).rotateX(Math.PI / 2), ferro); l.add(an); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; box(0.09, 0.3, 0.09, L(0xf0e6d0), Math.cos(a) * r, 0.18, Math.sin(a) * r, l); const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilhoT, color: 0xffc060, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); f.position.set(Math.cos(a) * r, 0.45, Math.sin(a) * r); f.scale.setScalar(0.35); l.add(f); velas.push(f); } }
  const brilhoT = tex(64, 64, (x) => { const r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,250,220,1)'); r.addColorStop(0.3, 'rgba(255,190,90,.7)'); r.addColorStop(1, 'rgba(255,120,0,0)'); x.fillStyle = r; x.fillRect(0, 0, 64, 64); });
  lustre(0, -3); lustre(0, 5);
  // vitrais (luz colorida) nas paredes do saguão
  const vitralT = tex(128, 256, (x, w, h) => { const cs = ['#d03040', '#3060d0', '#e0b030', '#30a060', '#8040c0']; x.fillStyle = '#1a1208'; x.fillRect(0, 0, w, h); for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 4; xx++) { x.fillStyle = cs[(xx + yy * 3) % 5]; x.fillRect(6 + xx * 30, 6 + yy * 31, 26, 27); } x.globalCompositeOperation = 'destination-in'; x.beginPath(); x.moveTo(0, h); x.lineTo(0, 50); x.quadraticCurveTo(w / 2, -20, w, 50); x.lineTo(w, h); x.fill(); });
  for (const [x, z, ry] of [[-10.65, -5, Math.PI / 2], [10.65, -5, -Math.PI / 2], [-10.65, 5, Math.PI / 2], [10.65, 5, -Math.PI / 2]]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), new THREE.MeshBasicMaterial({ map: vitralT, transparent: true, toneMapped: false, side: THREE.DoubleSide })); v.position.set(x, 3.4, z); v.rotation.y = ry; g.add(v); }
  // tapeçarias (contam a história do Reino) e estandartes da guilda
  const tapecaria = (cor, seed) => tex(128, 256, (x, w, h) => { x.fillStyle = cor; x.fillRect(0, 0, w, h); x.strokeStyle = '#d9a63a'; x.lineWidth = 6; x.strokeRect(5, 5, w - 10, h - 10); x.fillStyle = '#f0d8a0'; x.beginPath(); x.arc(w / 2, 70, 26, 0, 7); x.fill(); x.fillStyle = '#2a1a10'; x.fillRect(w / 2 - 4, 110, 8, 90); x.beginPath(); x.moveTo(w / 2 - 30, 140); x.lineTo(w / 2 + 30, 140); x.lineWidth = 6; x.strokeStyle = '#2a1a10'; x.stroke(); for (let k = 0; k < 6; k++) { x.fillStyle = '#d9a63a'; x.fillRect(12 + k * 18, h - 22, 10, 14); } });
  for (const [x, z, ry, c] of [[-10.65, 0, Math.PI / 2, '#2a3a6a'], [10.65, 0, -Math.PI / 2, '#3a5a2a']]) { const t = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.4), L(0xffffff, { map: tapecaria(c), side: THREE.DoubleSide })); t.position.set(x, 3.2, z); t.rotation.y = ry; g.add(t); }
  const bandMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 }); let bandKey = '';
  for (const [x, z] of [[-4, -8.65], [4, -8.65]]) { const b2 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.6), bandMat); b2.position.set(x, 3.6, z); g.add(b2); box(2.2, 0.08, 0.08, ouro, x, 5.45, z + 0.05); }
  function estandarte() {
    const G = typeof Guilda !== 'undefined' ? Guilda.info() : null, k = G ? G.emblema + G.sigla : '';
    if (k === bandKey) return; bandKey = k;
    const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#7a0e1c'; x.beginPath(); x.moveTo(0, 0); x.lineTo(128, 0); x.lineTo(128, 220); x.lineTo(64, 256); x.lineTo(0, 220); x.fill();
    x.fillStyle = '#d9a63a'; x.fillRect(0, 0, 128, 12); x.fillRect(8, 12, 6, 205); x.fillRect(114, 12, 6, 205);
    x.font = '64px serif'; x.textAlign = 'center'; x.fillText(G ? G.emblema : '🛡️', 64, 110); x.fillStyle = '#ffe080'; x.font = 'bold 34px Georgia'; x.fillText(G ? G.sigla : '', 64, 170);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; if (bandMat.map) bandMat.map.dispose(); bandMat.map = t; bandMat.needsUpdate = true;
  }
  // tochas nas paredes (fogo de sprite)
  const fogoT = tex(64, 64, (x) => { const r = x.createRadialGradient(32, 40, 2, 32, 36, 30); r.addColorStop(0, 'rgba(255,250,200,1)'); r.addColorStop(0.35, 'rgba(255,170,60,.9)'); r.addColorStop(1, 'rgba(255,60,0,0)'); x.fillStyle = r; x.fillRect(0, 0, 64, 64); });
  g.userData.fogos = [];
  function tocha(x, z, ry) { const t = new THREE.Group(); t.position.set(x, 2.6, z); t.rotation.y = ry; g.add(t); box(0.12, 0.5, 0.12, ferro, 0, 0, 0.15, t); box(0.3, 0.12, 0.3, ferro, 0, 0.3, 0.2, t); const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogoT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); f.position.set(0, 0.65, 0.2); f.scale.set(0.6, 0.9, 1); t.add(f); g.userData.fogos.push(f); }
  for (const z of [-7, 7]) { tocha(-10.6, z, Math.PI / 2); tocha(10.6, z, -Math.PI / 2); }
  for (const [x, z, ry] of [[-24.6, -4, Math.PI / 2], [-24.6, 4, Math.PI / 2], [24.6, -4, -Math.PI / 2], [24.6, 4, -Math.PI / 2], [-5.6, 14, Math.PI / 2], [5.6, 14, -Math.PI / 2], [-7.6, -16, Math.PI / 2], [7.6, -16, -Math.PI / 2]]) tocha(x, z, ry);
  // ----- ARSENAL (oeste): armaduras, suportes de lanças e espadas, escudos na parede, barris
  for (const z of [-5, -1.6, 1.6, 5]) { const a = new THREE.Group(); a.position.set(-23.6, 0, z); a.rotation.y = Math.PI / 2; g.add(a); box(0.9, 0.15, 0.9, madeira(0x4a2a14), 0, 0.08, 0, a); box(0.1, 1.2, 0.1, ferro, 0, 0.7, 0, a); const tm = PH(0x9aa8c0, 0, 90); cil(0.42, 0.34, 0.9, tm, 0, 1.6, 0, 12, a); for (const s2 of [-1, 1]) { const o2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), tm); o2.position.set(0.48 * s2, 1.95, 0); a.add(o2); } const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), tm); e2.position.y = 2.35; a.add(e2); box(0.36, 0.06, 0.1, L(0x1a1a1a), 0, 2.33, 0.26, a); ob(-23.6, z, 0.6); }
  for (const x of [-20, -16]) { const r2 = new THREE.Group(); r2.position.set(x, 0, -6.4); g.add(r2); box(2.6, 0.12, 0.4, madeira(0x5a3a24), 0, 1.4, 0, r2); box(2.6, 0.12, 0.4, madeira(0x5a3a24), 0, 0.4, 0, r2); for (let k = 0; k < 5; k++) { cil(0.03, 0.03, 2.6, madeira(0x6a4a2a), -1 + k * 0.5, 1.4, 0.05, 6, r2); const p = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 6), PH(0xdfe6f0, 0, 100)); p.position.set(-1 + k * 0.5, 2.85, 0.05); r2.add(p); } ob(x, -6.4, 1.3); }
  for (const [x, z] of [[-18, 6.6], [-14, 6.6]]) { for (let k = 0; k < 3; k++) { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 16), PH([0xa8182a, 0x24408e, 0xd9a63a][k], 0, 40)); sh.rotation.x = Math.PI / 2; sh.position.set(x - 0.9 + k * 0.9, 3, z + 0.02); g.add(sh); const bo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), ouro); bo.position.set(x - 0.9 + k * 0.9, 3, z - 0.06); g.add(bo); } }
  for (const [x, z] of [[-13, -5.6], [-13.8, -4.6]]) { const br = cil(0.45, 0.45, 1, madeira(0x6a3a1a), x, 0.5, z); ob(x, z, 0.5); }
  tapete(8, 4, -18, 0, tapeteT('#24408e', '#d9a63a', '#8aa8e0'), Math.PI / 2);
  // ----- BANQUETE (leste): mesa comprida com toalha, cadeiras, pratos e velas, lareira, barris
  { const m2 = new THREE.Group(); m2.position.set(18, 0, 0); g.add(m2); box(9, 0.14, 2, madeira(0x7a4a2a), 0, 1.0, 0, m2); box(9.1, 0.04, 1.4, L(0xf0e8d8), 0, 1.09, 0, m2); for (const x of [-4, 4]) for (const z of [-0.8, 0.8]) box(0.14, 1, 0.14, madeira(0x5a3a24), x, 0.5, z, m2);
    for (let k = 0; k < 6; k++) for (const s2 of [-1, 1]) { const c2 = new THREE.Group(); c2.position.set(-3.6 + k * 1.45, 0, 1.4 * s2); c2.rotation.y = s2 > 0 ? Math.PI : 0; m2.add(c2); box(0.6, 0.08, 0.6, madeira(0x5a3a24), 0, 0.6, 0, c2); box(0.6, 1, 0.08, madeira(0x5a3a24), 0, 1.1, -0.28, c2); for (const [dx, dz] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) box(0.07, 0.6, 0.07, madeira(0x4a2a14), dx, 0.3, dz, c2); const pr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.04, 14), L(0xe8e8e8)); pr.position.set(-3.6 + k * 1.45, 1.13, 0.45 * s2); m2.add(pr); const cc = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), L([0xd08a3a, 0xc04030, 0x70a040][k % 3])); cc.position.set(-3.6 + k * 1.45, 1.2, 0.45 * s2); m2.add(cc); }
    for (const x of [-2.5, 0, 2.5]) { box(0.1, 0.35, 0.1, L(0xf0e6d0), x, 1.3, 0, m2); const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilhoT, color: 0xffc060, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); f.position.set(x, 1.6, 0); f.scale.setScalar(0.35); m2.add(f); velas.push(f); }
    for (let t = -4; t <= 4; t += 0.8) ob(18 + t, 0, 1.5); }
  { const lr = new THREE.Group(); lr.position.set(24.2, 0, 0); lr.rotation.y = -Math.PI / 2; g.add(lr); box(3.2, 2.6, 1, PM('pedra.jpg', [2, 2], new THREE.Color(0.5, 0.45, 0.4)), 0, 1.3, 0, lr); box(1.7, 1.4, 0.3, L(0x140804), 0, 0.8, 0.4, lr); const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogoT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); f.position.set(0, 0.9, 0.6); f.scale.set(1.3, 1.4, 1); lr.add(f); g.userData.fogos.push(f); box(3.6, 0.3, 1.3, PM('pedra.jpg', [2, 1], new THREE.Color(0.6, 0.55, 0.5)), 0, 2.7, 0, lr); ob(24.2, 0, 1.2); }
  for (const [x, z] of [[13, -6], [14, -6], [13.5, -5.1]]) { cil(0.42, 0.42, 0.9, madeira(0x6a3a1a), x, 0.45, z); ob(x, z, 0.45); }
  lustre(18, 0, 1.4);
  // ----- BIBLIOTECA (norte): estantes, mesa de estudo, globo, velas
  const cores = [0x8a2a2a, 0x2a4a8a, 0x3a6a2a, 0x8a6a2a, 0x5a2a6a, 0x2a6a6a];
  function estante(x, z, ry) { const e2 = new THREE.Group(); e2.position.set(x, 0, z); e2.rotation.y = ry; g.add(e2); box(3, 3.6, 0.6, madeira(0x4a2a14), 0, 1.8, 0, e2); for (let r2 = 0; r2 < 4; r2++) { box(2.8, 0.06, 0.5, madeira(0x5a3a24), 0, 0.4 + r2 * 0.85, 0.05, e2); for (let k = 0; k < 11; k++) box(0.2, 0.55 + (k % 3) * 0.08, 0.38, L(cores[(k + r2 * 2) % 6]), -1.2 + k * 0.24, 0.72 + r2 * 0.85, 0.06, e2); } }
  for (const x of [-5, -1.5, 2]) { estante(x, -21.4, 0); ob(x, -21.4, 1.4); }
  estante(-7.4, -16, Math.PI / 2); ob(-7.4, -16, 1.3); estante(7.4, -13, -Math.PI / 2); ob(7.4, -13, 1.3);
  { const mt = new THREE.Group(); mt.position.set(-1, 0, -15.5); g.add(mt); box(3, 0.12, 1.5, madeira(0x6a4a2a), 0, 1, 0, mt); for (const [dx, dz] of [[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.6], [1.3, 0.6]]) box(0.12, 1, 0.12, madeira(0x4a2a14), dx, 0.5, dz, mt); box(0.8, 0.06, 0.6, L(0xf0e6c8), -0.5, 1.09, 0, mt); box(0.1, 0.3, 0.1, L(0xf0e6d0), 0.9, 1.21, 0, mt); const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilhoT, color: 0xffc060, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); f.position.set(0.9, 1.5, 0); f.scale.setScalar(0.35); mt.add(f); velas.push(f); ob(-1, -15.5, 1.6); }
  { cil(0.1, 0.1, 1, madeira(0x5a3a24), 4.5, 0.5, -18); const gl = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), PH(0x2a6aa8, 0x0a1a2a)); gl.position.set(4.5, 1.5, -18); g.add(gl); g.userData.globo = gl; ob(4.5, -18, 0.6); }
  tapete(6, 4, 0, -16, tapeteT('#3a2a4a', '#d9a63a', '#8a6ab8'));
  lustre(0, -15.5, 1);
  // ----- VESTÍBULO (sul): bancos, armaduras de guarda, o quadro das brincadeiras e o portal de saída
  for (const x of [-4.6, 4.6]) { box(0.6, 0.5, 3, madeira(0x5a3a24), x, 0.25, 13.5); ob(x, 13, 0.6); ob(x, 14.5, 0.6); }
  tapete(3, 9, 0, 14, tapeteT('#7a0e1c', '#d9a63a', '#b8862a'));
  const SAIDA_IN = { x: C.x, z: C.z + 18.2 };
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.8), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.55, toneMapped: false, side: THREE.DoubleSide })); portal.position.set(0, 1.9, 18.75); g.add(portal);
  const QUADRO = { x: C.x - 4.6, z: C.z + 10.4 };
  const quadroMat = new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide });
  { const q = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), quadroMat); q.position.set(-4.6, 1.9, 9.65); g.add(q); box(2.8, 2, 0.12, madeira(0x6a4a2a), -4.6, 1.9, 9.55); }
  let quadroKey = '';
  function quadro() {
    const a = agora(), k = a.tipo + a.ativo + new Date().getDay(); if (k === quadroKey) return; quadroKey = k;
    const c = document.createElement('canvas'); c.width = 512; c.height = 352; const x = c.getContext('2d'); x.fillStyle = '#2a2018'; x.fillRect(0, 0, 512, 352); x.strokeStyle = '#d9a63a'; x.lineWidth = 8; x.strokeRect(4, 4, 504, 344);
    x.fillStyle = '#ffd860'; x.font = 'bold 30px Georgia'; x.textAlign = 'center'; x.fillText('Brincadeiras das 20h', 256, 46); x.font = '22px Georgia'; x.textAlign = 'left';
    const hoje = new Date().getDay();
    [1, 2, 3, 4, 5].forEach((d, i) => { x.fillStyle = d === hoje ? '#7dff6a' : '#f0e2c0'; x.fillText(`${DIAS[d].padEnd(8)} ${NOME[TIPOS[d]]}`, 26, 92 + i * 40); });
    x.fillStyle = '#b0a080'; x.font = '18px Georgia'; x.fillText('sábado e domingo às 20h: Kravenox e Verme', 26, 316);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; if (quadroMat.map) quadroMat.map.dispose(); quadroMat.map = t; quadroMat.needsUpdate = true;
  }
  // luzes (só acesas com você lá dentro: o castelo inteiro some quando você sai)
  for (const [x, z, c, i] of [[0, 0, 0xffd8a0, 1.2], [-18, 0, 0xc8d8ff, 0.9], [18, 0, 0xffb070, 1.1], [0, -15.5, 0xffe0b0, 1], [0, 14, 0xffd8a0, 0.9]]) { const l = new THREE.PointLight(c, i, 30); l.position.set(x, 5, z); g.add(l); }
  // pontos de onde saem os monstros da Caçada e onde ficam os baús (atrás dos móveis, em todas as salas)
  const SPAWNS = [[-9, -7], [9, -7], [-9, 7], [9, 7], [-20, 0], [20, -5], [0, -12], [0, 16]];
  const ESCONDERIJOS = [[-22.5, -6], [-23.5, 6], [-12.5, 5.5], [-16, 6], [13, 5.8], [22, -6], [23, 5.5], [15.5, -5.8], [-6.8, -20.5], [6.5, -21], [6.6, -10], [-6.8, -11], [-5.6, 17.5], [5.6, 17.5], [-10.2, -8.2], [10.2, 8.2]];
  // ----- gente que anda pelo castelo
  const NPCS_C = [
    { base: 's_aldeao', nome: 'Guarda Bertoldo', fala: 'Ronda no saguão, como sempre. Ninguém entra sem ser da guilda!', pts: [[-9, 8], [-9, -6], [9, -6], [9, 8]], vel: 1.4, ic: '🛡️' },
    { base: 's_estranho', nome: 'Guarda Odair', fala: 'O arsenal está em ordem. Lança afiada, escudo polido.', pts: [[-13, 0], [-21, -3], [-21, 3], [-13, 2]], vel: 1.2, ic: '⚔️' },
    { base: 's_senhora', nome: 'Criada Matilde', fala: 'Ai, essa poeira não acaba! Toda noite alguém derruba coisa no banquete.', pts: [[13, -4], [22, -4], [22, 4], [13, 4], [4, 6], [-4, 6]], vel: 1, ic: '🧹' },
    { base: 's_mascate', nome: 'Cozinheiro Godofredo', fala: 'Hoje tem javali assado! Se a guilda vencer a guerra, tem dobrado.', pts: [[20, -5.5], [23, 4], [16, 5]], vel: 0.9, ic: '🍗' },
    { base: 's_bibliotecario', nome: 'Bibliotecário Anselmo', fala: 'Silêncio, por favor. Os livros desta biblioteca contam a história de cada guilda do Reino.', pts: [[-4, -19], [3, -19], [5, -14], [-4, -13]], vel: 0.7, ic: '📚' },
  ].map(n => ({ ...n, g: new THREE.Group(), act: null, i: 0, x: n.pts[0][0], z: n.pts[0][1], para: 0, face: 0 }));
  for (const n of NPCS_C) { n.g.position.set(C.x + n.x, 0, C.z + n.z); n.g.visible = false; scene.add(n.g); }
  // o Bobo da Corte (jokenpô), perto do trono
  const bobo = { g: new THREE.Group(), act: null, x: C.x - 3.5, z: C.z - 5.5 }; bobo.g.position.set(bobo.x, 0, bobo.z); scene.add(bobo.g); bobo.g.visible = false; addOb(bobo.x, bobo.z, 0.6);
  // paredes que tapam a câmera ficam quase transparentes
  const _ray = new THREE.Ray(), _cam = new THREE.Vector3(), _alvo = new THREE.Vector3(), _bx = new THREE.Box3(), _hit = new THREE.Vector3();
  function paredesNaFrente() {
    if (typeof camera === 'undefined') return; camera.getWorldPosition(_cam); _alvo.set(P.x, P.y + 1.2, P.z);
    const dist = _cam.distanceTo(_alvo); _ray.origin.copy(_cam); _ray.direction.subVectors(_alvo, _cam).normalize();
    for (const w of paredes) { _bx.setFromObject(w); const hit = _ray.intersectBox(_bx, _hit); const tapa = hit && _cam.distanceTo(_hit) < dist - 0.3; const alvo = tapa ? 0.18 : 1; w.material.opacity += (alvo - w.material.opacity) * 0.25; w.material.depthWrite = w.material.opacity > 0.9; }
  }
  // ---------------- entrar e sair
  function entrar() {
    if (typeof Guilda === 'undefined' || !Guilda.minha()) { log('🏰 Só quem é de uma guilda entra no castelo.', 'bad'); Audio8.sfx('miss'); return; }
    if (inTower(P.z) && !dentro()) { log('🏰 Saia da masmorra (ou da Torre, ou da casa) antes de ir para o castelo.', 'bad'); Audio8.sfx('miss'); return; }
    if (P.dead) return;
    if (!dentro()) P.castVolta = { x: P.x, z: P.z };
    if (typeof autoStop === 'function') autoStop(''); if (P.montado && typeof Montaria !== 'undefined') Montaria.descer();
    P.x = SAIDA_IN.x; P.z = SAIDA_IN.z - 3; P.y = 0; P.face = Math.PI; P.vy = 0; camS.yaw = 0; camS.x = P.x; camS.z = P.z; camS.y = 0;
    Audio8.sfx('warp'); banner('🏰 CASTELO DA GUILDA'); armada = false;
    const a = agora(); log(`🏰 <b>Castelo da guilda.</b> ${a.ativo ? `Agora: <b>${NOME[a.tipo]}</b> (${DESC[a.tipo]})!` : a.tipo ? `Hoje às 20h: <b>${NOME[a.tipo]}</b>.` : 'Hoje não tem brincadeira (às 20h é dia de chefe).'} Saia pelo portal ao sul.`, 'gold');
  }
  let armada = false;
  function sair() {
    limpar(); const v = P.castVolta || { x: VIL.x, z: VIL.z + 4 }; const q = typeof pontoLivre === 'function' ? pontoLivre(v.x, v.z) : v;
    P.x = q.x; P.z = q.z; P.y = groundY(P.x, P.z); P.vy = 0; camS.x = P.x; camS.z = P.z; Audio8.sfx('warp'); log('🏰 Você saiu do castelo.', 'sys');
  }

  // ---------------- brincadeiras
  const vivos = () => mobs.filter(o => o.castelo && !o.dead);
  function limpar() { for (const o of mobs.filter(o => o.castelo)) { o.dead = true; scene.remove(o.model.g); o.lab.remove(); } mobs = mobs.filter(o => !o.castelo); for (const b of baus) scene.remove(b.g); baus = []; }
  const BASE = () => Object.keys(MOBDEF).filter(t => { const d = MOBDEF[t]; return !d.boss && !d.mini && !d.world && !d.alfa && !d.field && d.drops; });
  let ondaT = 0;
  function caçada(dt) {
    if ((ondaT -= dt) > 0 || vivos().length >= 8) return; ondaT = 6;
    const L = Math.max(5, Math.min(120, P.lv)), tipos = BASE().sort((a, b) => Math.abs(MOBDEF[a].lv - L) - Math.abs(MOBDEF[b].lv - L)).slice(0, 3);
    for (let k = 0; k < 3; k++) {
      const pt = SPAWNS[Math.floor(Math.random() * SPAWNS.length)], x = C.x + pt[0] + rand(-1, 1), z = C.z + pt[1] + rand(-1, 1); if (blocked(x, z)) continue;
      const o = spawnMob(tipos[k % tipos.length], null, { x, z }), d0 = o.d, kf = L / d0.lv;
      o.d = { ...d0, lv: L, hp: Math.round(d0.hp * Math.pow(kf, 1.5)), atk: Math.round(d0.atk * kf * 0.8), def: Math.round(d0.def * kf), xp: Math.round(d0.xp * kf), aggro: 30, respawn: 1e9, drops: [['frag_carta', 0.05]] };
      o.d.name = 'Invasor do Castelo'; o.hp = o.maxHp = o.d.hp; o.noRespawn = true; o.castelo = true; o.towerFloor = 'castelo'; o.state = 'chase';
      const sp = o.lab.querySelector('span'); if (sp) sp.innerHTML = `🏰 ${d0.name} <small>Nv ${L}</small>`;
    }
  }
  function onKill(mob) { if (!mob.castelo) return; ponto(1, '⚔️'); if (mob.mimico) log('🎁 Você derrotou o mímico!', 'sys'); }
  // prêmios por pontos: a cada 5 pontos um prêmio (até 6 prêmios por noite)
  const PREMIOS = [{ frag_carta: 3 }, { frag_cisma: 2 }, { frag_carta: 5, red_m: 3 }, { nucleo_abismo: 1 }, { frag_carta: 8, frag_cisma: 4 }, { selo_forja: 1, frag_carta: 10 }];
  function ponto(n, ic) {
    const e = E(); e.pts += n; floater(P.x, P.y + 2.4, P.z, `+${n} ${ic}`, 'zeny');
    if (typeof Guilda !== 'undefined' && Guilda.contribuir) Guilda.contribuir(2000 * n);                 // a guilda também ganha
    while (e.prem < PREMIOS.length && e.pts >= (e.prem + 1) * 5) {
      const p = PREMIOS[e.prem++], cr = 3000 * Math.max(1, Math.round(P.lv / 10)); P.zeny += cr;
      for (const [id, q] of Object.entries(p)) P.inv[id] = (P.inv[id] || 0) + q;
      Audio8.sfx('level'); banner(`🏰 PRÊMIO ${e.prem}`); log(`🏰 <b>${e.pts} pontos</b> na brincadeira da guilda: ${cr.toLocaleString('pt-BR')} cr, ${Object.entries(p).map(([id, q]) => `${q}× ${ITEMS[id] ? ITEMS[id].ic + ' ' + ITEMS[id].name : id}`).join(', ')}.`, 'gold');
    }
    try { save(); } catch (er) { }
  }
  // jokenpô com o Bobo
  const JK = [['pedra', '✊'], ['papel', '✋'], ['tesoura', '✌️']], MAX_JK = 20;
  function jokenpo() {
    const e = E(), a = agora();
    if (!a.ativo || a.tipo !== 'jokenpo') { dialog('🃏 Bobo da Corte Pipo', `Hihi! Eu só jogo jokenpô nas noites de <b>terça e sexta, às 20h</b>. Volte na hora da brincadeira!`, [{ label: 'Até lá' }]); return; }
    if (e.jk >= MAX_JK) { dialog('🃏 Bobo da Corte Pipo', `Chega por hoje, você já jogou ${MAX_JK} vezes! Hihi. Pontos: <b>${e.pts}</b>.`, [{ label: 'Tchau' }]); return; }
    dialog('🃏 Bobo da Corte Pipo', `Pedra, papel ou tesoura? Cada vitória vale <b>1 ponto</b>; <b>3 seguidas</b> valem +2 de bônus.<br><small>Partidas hoje: ${e.jk}/${MAX_JK} · vitórias seguidas: ${e.seq} · pontos: ${e.pts}</small>`,
      [...JK.map(([n, ic], i) => ({ label: `${ic} ${n[0].toUpperCase() + n.slice(1)}`, fn: () => { jogar(i); return true; } })), { label: 'Parar' }]);
  }
  function jogar(i) {
    const e = E(), b = Math.floor(Math.random() * 3), r = (i - b + 3) % 3; e.jk++;
    let t = `Você: ${JK[i][1]} · Pipo: ${JK[b][1]} → `;
    if (r === 0) { t += '<b>empate</b>!'; Audio8.sfx('click'); }
    else if (r === 1) { e.seq++; t += '<b>você ganhou!</b>'; ponto(1, '✊'); if (e.seq % 3 === 0) { t += ' <b>3 seguidas: +2!</b>'; ponto(2, '🔥'); } }
    else { e.seq = 0; t += 'o <b>Pipo ganhou</b>. Hihi!'; Audio8.sfx('miss'); }
    log('🃏 ' + t, 'sys'); try { save(); } catch (er) { }
    setTimeout(jokenpo, 30);
  }
  // baús escondidos
  let baus = [];
  function espalharBaus() {
    const e = E(); if (baus.length) return;
    const madeira = PM('madeira.jpg', [1, 1], new THREE.Color(1.1, 0.85, 0.6)), aro = new THREE.MeshPhongMaterial({ color: 0xd9a63a, emissive: 0x2a1800 });
    const ordem = [...ESCONDERIJOS.keys()].sort(() => Math.random() - 0.5).slice(0, 12);    // 12 dos 16 esconderijos, sorteados
    for (const k of ordem) {
      if (e.baus.includes(k)) continue;
      const a = Math.random() * Math.PI * 2, x = C.x + ESCONDERIJOS[k][0], z = C.z + ESCONDERIJOS[k][1];
      const bg = new THREE.Group(); bg.position.set(x, 0, z); bg.rotation.y = a; scene.add(bg);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), madeira); c1.position.y = 0.25; bg.add(c1); const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.2, 0.62), madeira); c2.position.y = 0.6; bg.add(c2); const fe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), aro); fe.position.set(0, 0.5, 0.32); bg.add(fe);
      baus.push({ k, g: bg, x, z, mimico: Math.random() < 0.18 });
    }
  }
  function abrirBau(b) {
    const e = E(); e.baus.push(b.k); scene.remove(b.g); baus = baus.filter(o => o !== b);
    if (b.mimico) {
      const L = Math.max(5, Math.min(120, P.lv)), t = BASE().sort((a, c) => Math.abs(MOBDEF[a].lv - L) - Math.abs(MOBDEF[c].lv - L))[0], o = spawnMob(t, null, { x: b.x, z: b.z }), kf = L / o.d.lv;
      o.d = { ...o.d, lv: L, hp: Math.round(o.d.hp * Math.pow(kf, 1.5) * 2), atk: Math.round(o.d.atk * kf), xp: Math.round(o.d.xp * kf * 2), aggro: 30, respawn: 1e9, name: 'Mímico' }; o.hp = o.maxHp = o.d.hp; o.castelo = true; o.mimico = true; o.noRespawn = true; o.state = 'chase';
      Audio8.sfx('boom'); log('🎁 Era um <b>mímico</b>! Derrote-o para ganhar o ponto.', 'bad'); return;
    }
    Audio8.sfx('coin'); burst(new THREE.Vector3(b.x, 0.8, b.z), 0xffd060, 20, 3, 0.8); ponto(2, '🎁');
  }
  // ---------------- laço
  let avisou = '';
  function update(dt) {
    const den = dentro(); g.visible = den; bobo.g.visible = den; for (const n of NPCS_C) n.g.visible = den;
    const a = agora(), e = typeof Guilda !== 'undefined' && Guilda.minha();
    // avisos para a guilda (em qualquer lugar do mapa)
    if (e && a.tipo && running) { const k = a.dia + (a.ativo ? 'on' : a.falta <= 5 && a.falta > 0 ? 'pre' : ''); if (k !== avisou && (a.ativo || (a.falta <= 5 && a.falta > 0))) { avisou = k; typeof Anuncio !== 'undefined' && Anuncio.mostrar({ ic: '🏰', cor: a.ativo ? 'verde' : 'ouro', tag: a.ativo ? 'BRINCADEIRA DA GUILDA · ATÉ 20H30' : 'EM ' + a.falta + ' MINUTOS · GUILDA', titulo: NOME[a.tipo], sub: DESC[a.tipo], botao: 'Ir ao castelo', acao: () => entrar(), seg: 10 }); log(a.ativo ? `🏰 <b>Brincadeira da guilda começou: ${NOME[a.tipo]}!</b> ${DESC[a.tipo]}. Entre pelo 🛡️ Guilda → Castelo (até 20h30).` : `🏰 Em ${a.falta} min, no castelo da guilda: <b>${NOME[a.tipo]}</b>.`, 'gold'); Audio8.sfx('buff'); } }
    if (!den) { if (baus.length || vivos().length) limpar(); return; }
    estandarte(); quadro(); paredesNaFrente();
    for (const v of velas) v.material.opacity = 0.75 + Math.sin(time * 9 + v.position.x * 3) * 0.2;
    if (g.userData.globo) g.userData.globo.rotation.y += dt * 0.3;
    // gente andando pelo castelo (param um pouco em cada ponto e olham para você quando passa perto)
    for (const n of NPCS_C) {
      if (!n.act && typeof SpriteKit !== 'undefined' && SpriteKit.ready) { n.act = SpriteKit.actor({ kind: 'dir', base: n.base }); n.g.add(n.act.root); }
      if (!n.act) continue;
      const perto = Math.hypot(P.x - (C.x + n.x), P.z - (C.z + n.z)) < 2.4;
      let anda = false;
      if (n.para > 0) n.para -= dt;
      else if (!perto) { const [tx, tz] = n.pts[n.i], dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz); if (d < 0.2) { n.i = (n.i + 1) % n.pts.length; n.para = rand(1, 3.5); } else { n.x += dx / d * Math.min(d, n.vel * dt); n.z += dz / d * Math.min(d, n.vel * dt); n.face = Math.atan2(dx, dz); anda = true; } }
      n.g.position.set(C.x + n.x, 0, C.z + n.z);
      n.act.update(dt, { face: perto ? Math.atan2(P.x - (C.x + n.x), P.z - (C.z + n.z)) : n.face, moving: anda });
    }
    for (const f of g.userData.fogos) f.scale.set(1.1 + Math.sin(time * 11 + f.position.x) * 0.1, 1.5 + Math.sin(time * 8 + f.position.z) * 0.15, 1);
    portal.material.opacity = 0.4 + Math.sin(time * 2.5) * 0.15;
    if (!bobo.act && typeof SpriteKit !== 'undefined' && SpriteKit.ready) { bobo.act = SpriteKit.actor({ kind: 'dir', base: 's_menino' }); bobo.g.add(bobo.act.root); const ch = typeof iconeSprite === 'function' ? iconeSprite('🃏') : null; if (ch) { ch.position.y = 2.4; bobo.g.add(ch); } }
    if (bobo.act) bobo.act.update(dt, { face: Math.atan2(P.x - bobo.x, P.z - bobo.z), moving: false });
    if (a.ativo && a.tipo === 'monstros') caçada(dt);
    if (a.ativo && a.tipo === 'baus') espalharBaus(); else if (baus.length) { for (const b of baus) scene.remove(b.g); baus = []; }
    if (!a.ativo && vivos().length) for (const o of vivos()) { o.dead = true; scene.remove(o.model.g); o.lab.remove(); }
    // portal de saída
    const d = Math.hypot(P.x - SAIDA_IN.x, P.z - SAIDA_IN.z); if (d > 3) armada = true; if (armada && d < 1.4 && !P.dead) sair();
  }
  function nearest() {
    if (!dentro()) return null;
    if (Math.hypot(P.x - bobo.x, P.z - bobo.z) < 2.6) return { label: '🃏 Jogar jokenpô com o Bobo', fn: () => jokenpo() };
    for (const n of NPCS_C) if (Math.hypot(P.x - (C.x + n.x), P.z - (C.z + n.z)) < 2.4) return { label: `💬 Falar com ${n.nome}`, fn: () => dialog(`${n.ic} ${n.nome}`, n.fala, [{ label: 'Até mais' }]) };
    for (const b of baus) if (Math.hypot(P.x - b.x, P.z - b.z) < 2) return { label: '🎁 Abrir o baú', fn: () => abrirBau(b) };
    if (Math.hypot(P.x - QUADRO.x, P.z - QUADRO.z) < 2.6) return { label: '📜 Brincadeiras das 20h', fn: () => info(true) };
    return null;
  }
  function info(dlg) {
    const a = agora(), e = E();
    const txt = `${a.ativo ? `🟢 <b>Agora: ${NOME[a.tipo]}</b> (até 20h30)<br><small>${DESC[a.tipo]}.</small>` : a.tipo ? `Hoje às 20h: <b>${NOME[a.tipo]}</b><br><small>${DESC[a.tipo]}.</small>` : 'Hoje não tem brincadeira: às 20h de sábado e domingo acordam o Kravenox e o Verme.'}<br><br><b>Seus pontos hoje: ${e.pts}</b> · prêmios: ${e.prem}/${PREMIOS.length} <small>(a cada 5 pontos)</small><br><small>${[1, 2, 3, 4, 5].map(d => `${DIAS[d]}: ${NOME[TIPOS[d]]}`).join(' · ')}</small>`;
    if (dlg) dialog('🏰 Brincadeiras da Guilda', txt, [{ label: 'Fechar' }]);
    return txt;
  }
  if (typeof MASMORRAS !== 'undefined') MASMORRAS.castelo = { update: () => { }, minimap: (mg) => { const W = mg.canvas.width, H = mg.canvas.height; mg.fillStyle = '#2a2014'; mg.fillRect(0, 0, W, H); mg.textAlign = 'center'; mg.fillStyle = '#ffd860'; mg.font = 'bold 13px Georgia'; mg.fillText('🏰 Castelo', W / 2, H / 2 - 6); mg.fillStyle = '#f0e2c0'; mg.font = 'bold 11px sans-serif'; mg.fillText(`pontos hoje: ${E().pts}`, W / 2, H / 2 + 12); mg.textAlign = 'left'; }, pres: () => null, saida: { x: VIL.x, z: VIL.z + 4 } };
  return { entrar, sair, update, nearest, onKill, info, agora, NOME, _forcar: t => { forcado = t; } };
})();
