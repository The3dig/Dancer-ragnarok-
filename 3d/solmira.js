// =====================================================================
//  🏘️ Solmira vira uma mini cidade (pedido do Rone). Criado para o jogo, não está no livro.
//  Tudo fica de 17 a 40 m da fonte, longe dos NPCs da praça (que ficam até 16 m) e sem
//  bloquear a estrada (que corta a vila de leste a oeste, em z = 0):
//  - segundo anel de casas (entre as 7 que já existiam);
//  - torre do sino ao norte;
//  - portões de pedra com torrinhas e a placa "SOLMIRA" nas entradas leste e oeste;
//  - rua de pedra da praça até os portões, com postes de lampião;
//  - barracas de feira dos dois lados da rua.
// =====================================================================
'use strict';
const Solmira = (() => {
  const cid = new THREE.Group(); scene.add(cid);
  const pedra = PMc('pedra.jpg', [1, 2], 0xc8bca8), pedraE = PMc('pedra.jpg', [1, 1], 0x9a9080), madeira = PMc('madeira.jpg', [0.3, 1], 0x5a4030);
  const telha = PMc('telha.jpg', [1.5, 1.5], 0xa85a44), ferro = new THREE.MeshLambertMaterial({ color: 0x2c2a2a });
  const luz = new THREE.MeshBasicMaterial({ color: 0xffc070, toneMapped: false });   // lampião aceso, sem luz de verdade (não pesa)
  const add = (geo, mat, x, y, z, ry = 0, sombra = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = sombra; m.receiveShadow = true; cid.add(m); return m; };
  const gy = (x, z) => groundY(x, z);
  const P2 = (r, graus) => { const a = graus * Math.PI / 180; return [VIL.x + Math.cos(a) * r, VIL.z + Math.sin(a) * r]; };

  // ---------------- segundo anel de casas (de frente para a fonte)
  const casas = new THREE.Group(); scene.add(casas);
  [[36, -150, '#6a5a4a'], [36, -115, '#5e5650'], [37, -28, '#7a5a44'], [37, 28, '#56606a'], [36, 65, '#7a4e40'], [36, 115, '#5a5e54'], [36, 150, '#6e5a48']]
    .forEach(([r, g, c], i) => { const [x, z] = P2(r, g); casas.attach(house(x, z, Math.atan2(VIL.x - x, VIL.z - z), i % 2 ? 6 : 5.5, i % 3 ? 5 : 4.6, c, 'wood')); });
  fundir(casas); decor(casas, 30);

  // ---------------- torre do sino (ao norte)
  { const [x, z] = P2(37, -68), y0 = gy(x, z), ry = Math.atan2(VIL.x - x, VIL.z - z);
    const t = new THREE.Group(); t.position.set(x, y0, z); t.rotation.y = ry; cid.add(t);
    const peca = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; t.add(m); return m; };
    peca(new THREE.BoxGeometry(4.4, 0.6, 4.4), pedraE, 0, 0.3, 0);
    peca(new THREE.BoxGeometry(3.6, 9, 3.6), PMc('pedra.jpg', [1.5, 4], 0xc8bca8), 0, 4.8, 0);
    peca(new THREE.BoxGeometry(4, 0.35, 4), pedraE, 0, 9.4, 0);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) peca(new THREE.BoxGeometry(0.55, 2.6, 0.55), pedra, a * 1.6, 10.9, b * 1.6);   // os quatro pilares do campanário
    peca(new THREE.BoxGeometry(4, 0.35, 4), pedraE, 0, 12.35, 0);
    const telhado = peca(new THREE.ConeGeometry(3.1, 3.6, 4), telha, 0, 14.3, 0); telhado.rotation.y = Math.PI / 4;
    peca(new THREE.CylinderGeometry(0.05, 0.05, 1.4), ferro, 0, 16.6, 0);
    peca(new THREE.LatheGeometry([[0, 0.9], [0.25, 0.88], [0.4, 0.6], [0.48, 0.2], [0.62, 0], [0.55, -0.05]].map(([a, b]) => new THREE.Vector2(a, b)), 16), new THREE.MeshPhongMaterial({ color: 0xc8962a, shininess: 80, side: THREE.DoubleSide }), 0, 10.4, 0);
    // relógio na frente (virado para a praça) e porta em arco
    const rel = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.fillStyle = '#f2e6c8'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#4a3a2a'; g.stroke();
      g.fillStyle = '#4a3a2a'; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.fillRect(64 + Math.sin(a) * 48 - 3, 64 - Math.cos(a) * 48 - 3, 6, 6); }
      g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 30); g.moveTo(64, 64); g.lineTo(88, 72); g.stroke(); return new THREE.CanvasTexture(c); })();
    const rm = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), new THREE.MeshLambertMaterial({ map: rel })); rm.position.set(0, 7.6, 1.82); t.add(rm);
    const porta = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-0.7, 0); s.lineTo(-0.7, 1.6); s.absarc(0, 1.6, 0.7, Math.PI, 0, true); s.lineTo(0.7, 0); s.closePath(); return s; })(), 12), PMc('madeira.jpg', [0.6, 1], 0x6a4a30));
    porta.position.set(0, 0.6, 1.82); t.add(porta);
    addOb(x, z, 2.6); }

  // ---------------- portões leste e oeste, com torrinhas, muro curto e a placa
  const placaTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#5a3a22'; g.fillRect(0, 0, 256, 64); g.strokeStyle = '#c8962a'; g.lineWidth = 5; g.strokeRect(4, 4, 248, 56);
    g.fillStyle = '#f2d890'; g.font = 'bold 34px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SOLMIRA', 128, 34); return new THREE.CanvasTexture(c); })();
  const panos = [0x8a2a2a, 0x2a4a7a].map(c => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
  function torrinha(x, z) {
    const y = gy(x, z) - 0.6;
    add(new THREE.CylinderGeometry(1.45, 1.6, 7.6, 12), PMc('pedra.jpg', [3, 3], 0xc8bca8), x, y + 3.8, z);
    add(new THREE.CylinderGeometry(1.75, 1.75, 0.5, 12), pedraE, x, y + 7.8, z);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; add(new THREE.BoxGeometry(0.5, 0.7, 0.5), pedraE, x + Math.cos(a) * 1.5, y + 8.4, z + Math.sin(a) * 1.5, -a); }
    add(new THREE.ConeGeometry(1.9, 2.8, 12), telha, x, y + 9.9, z);
    addOb(x, z, 1.7);
  }
  function portao(lado) {
    const x = VIL.x + lado * 38, zs = [VIL.z - 6.5, VIL.z + 6.5];
    zs.forEach(z => torrinha(x, z));
    const yb = Math.max(gy(x, zs[0]), gy(x, zs[1]));
    add(new THREE.BoxGeometry(1.1, 0.8, 13), madeira, x, yb + 5.6, VIL.z);                       // viga do portão
    add(new THREE.BoxGeometry(0.9, 0.5, 11.5), pedraE, x, yb + 6.2, VIL.z);
    for (const f of [1, -1]) {                                                                   // uma placa para cada lado (de um lado só, por dentro lia "ARIMLOS")
      const placa = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshLambertMaterial({ map: placaTex }));
      placa.position.set(x + f * 0.58, yb + 4.85, VIL.z); placa.rotation.y = f > 0 ? Math.PI / 2 : -Math.PI / 2; cid.add(placa); }
    add(new THREE.BoxGeometry(1.05, 1.1, 4.2), madeira, x, yb + 4.85, VIL.z, 0, false);
    for (const [i, z] of zs.entries()) {                                                         // estandartes pendurados nas torrinhas
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.6), panos[i]); p.position.set(x - lado * 1.62, gy(x, z) + 4.4, z); p.rotation.y = lado > 0 ? Math.PI / 2 : -Math.PI / 2; cid.add(p);
      // muro curto saindo de cada torrinha para longe da estrada
      const s = Math.sign(z - VIL.z);
      for (let k = 0; k < 4; k++) { const zz = z + s * (2.4 + k * 2), yy = gy(x, zz);
        add(new THREE.BoxGeometry(1.1, 3.4, 2.05), PMc('pedra.jpg', [1, 1.6], 0xbcb09c), x, yy + 1.2, zz);
        add(new THREE.BoxGeometry(1.2, 0.6, 0.8), pedraE, x, yy + 3.2, zz - 0.5); addOb(x, zz, 1.1); }
    }
  }
  portao(1); portao(-1);

  // ---------------- rua de pedra da praça até os portões (acompanha o chão)
  const calc = PMc('calcada.jpg', [1, 1], 0xd8ccb8); calc.polygonOffset = true; calc.polygonOffsetFactor = -2;
  for (const lado of [1, -1]) {
    const x0 = VIL.x + lado * 17, x1 = VIL.x + lado * 40, L = Math.abs(x1 - x0), geo = new THREE.PlaneGeometry(L, 6.4, 46, 4); geo.rotateX(-Math.PI / 2);
    const q = geo.attributes.position, uv = geo.attributes.uv, cx = (x0 + x1) / 2;
    for (let i = 0; i < q.count; i++) { const wx = cx + q.getX(i), wz = VIL.z + q.getZ(i); q.setY(i, gy(wx, wz) + 0.04); uv.setXY(i, (wx) / 3, wz / 3); }
    geo.computeVertexNormals();
    const rua = new THREE.Mesh(geo, calc); rua.position.set(cx, 0, 0); rua.receiveShadow = true; cid.add(rua);
    // meio-fio de pedra dos dois lados
    for (const zz of [-3.3, 3.3]) for (let k = 0; k < 11; k++) { const xx = x0 + lado * (1 + k * 2.1); add(new THREE.BoxGeometry(2, 0.18, 0.3), pedraE, xx, gy(xx, VIL.z + zz) + 0.09, VIL.z + zz, 0, false); }
  }

  // ---------------- postes de lampião ao longo da rua (lampião aceso, sem luz de verdade para não pesar)
  const lampioes = [];
  for (const lado of [1, -1]) for (const d of [20, 27, 34]) for (const zz of [-4.1, 4.1]) {
    if (lado < 0 && d === 20 && zz > 0) continue;                                              // ali fica a tenda da Cartomante Zaíra
    const x = VIL.x + lado * d, z = VIL.z + zz, y = gy(x, z);
    add(new THREE.CylinderGeometry(0.09, 0.13, 3.4, 8), ferro, x, y + 1.7, z, 0, false);
    add(new THREE.BoxGeometry(0.08, 0.08, 0.7), ferro, x, y + 3.35, z - Math.sign(zz) * 0.3, 0, false);
    const l = add(new THREE.BoxGeometry(0.28, 0.38, 0.28), luz, x, y + 3.05, z - Math.sign(zz) * 0.6, 0, false); lampioes.push(l);
    add(new THREE.ConeGeometry(0.26, 0.2, 4), ferro, x, y + 3.33, z - Math.sign(zz) * 0.6, Math.PI / 4, false);
    addOb(x, z, 0.3);
  }

  // ---------------- barracas de feira dos dois lados da rua (de frente para ela)
  const feira = new THREE.Group(); scene.add(feira);
  // do lado sul a oeste ficam mais para fora, longe da tenda da Cartomante Zaíra
  [[21, -1], [27, -1], [21, 1], [27, 1], [-22, -1], [-27, 1], [-32.5, 1]].forEach(([dx, s]) => {
    const x = VIL.x + dx, z = VIL.z + s * 7.8; feira.attach(house(x, z, s < 0 ? 0 : Math.PI, 3.2, 2.4, null, 'tent'));
  });
  fundir(feira); decor(feira, 30);

  // ---------------- canteiros de flores na frente das casas novas e bancos na rua
  const flor = [0xe85a6a, 0xf2c040, 0xb070e0, 0xf0f0f0].map(c => new THREE.MeshLambertMaterial({ color: c })), folha = new THREE.MeshLambertMaterial({ color: 0x4a7a3a });
  [[-150], [-115], [-28], [28], [65], [115], [150]].forEach(([g], i) => {
    const [x, z] = P2(31.2, g + (i % 2 ? 7 : -7)), y = gy(x, z), a = Math.atan2(VIL.x - x, VIL.z - z);
    add(new THREE.BoxGeometry(1.8, 0.45, 0.7), pedraE, x, y + 0.22, z, a, false);
    add(new THREE.BoxGeometry(1.6, 0.12, 0.55), new THREE.MeshLambertMaterial({ color: 0x4a3426 }), x, y + 0.46, z, a, false);
    for (let k = 0; k < 6; k++) { const ox = (k - 2.5) * 0.27, b = add(new THREE.SphereGeometry(0.14, 6, 4), k % 2 ? folha : flor[(k + i) % 4], x + Math.cos(-a) * ox, y + 0.62, z + Math.sin(-a) * ox, 0, false); }
    addOb(x, z, 1);
  });
  for (const lado of [1, -1]) for (const zz of [-4.3, 4.3]) {
    const x = VIL.x + lado * 30.5, z = VIL.z + zz, y = gy(x, z);
    add(new THREE.BoxGeometry(1.8, 0.1, 0.5), madeira, x, y + 0.48, z, 0, false);
    add(new THREE.BoxGeometry(1.8, 0.45, 0.08), madeira, x, y + 0.75, z + Math.sign(zz) * 0.24, 0, false);
    for (const dx of [-0.75, 0.75]) add(new THREE.BoxGeometry(0.1, 0.45, 0.45), ferro, x + dx, y + 0.22, z, 0, false);
  }

  fundir(cid); decor(cid, 40);

  // ---------------- moradores andando pela cidade (pedido do Rone: "muitas pessoas andando")
  // Cada um vai de ponto em ponto (volta da praça, rua de pedra e a porta das casas), só por caminho livre,
  // e para um pouco em cada lugar. Cada jogador vê os seus (não passam pelo servidor). Criados para o jogo.
  const NOS = [];
  const livre = (x, z) => !blocked(x, z, 0.4);
  for (let k = 0; k < 18; k++) { const [x, z] = P2(19.5, k * 20); NOS.push({ x, z }); }                  // volta da praça
  for (const lado of [1, -1]) for (const d of [23, 29, 35]) for (const zz of [-1.6, 1.6]) NOS.push({ x: VIL.x + lado * d, z: VIL.z + zz });   // rua
  const CASAS = [[-125, -22], [-105, -30], [-84, -24], [-127, 22], [-104, 30], [-84, 22], [-135, -6], ...[[36, -150], [36, -115], [37, -28], [37, 28], [36, 65], [36, 115], [36, 150]].map(([r, g]) => P2(r, g))];
  for (const [hx, hz] of CASAS) { const d = Math.hypot(VIL.x - hx, VIL.z - hz), k = 4.6 / d; NOS.push({ x: hx + (VIL.x - hx) * k, z: hz + (VIL.z - hz) * k, porta: true }); }   // na frente da porta
  const caminhoLivre = (a, b) => { const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / 0.6); for (let i = 1; i <= n; i++) if (!livre(a.x + (b.x - a.x) * i / n, a.z + (b.z - a.z) * i / n)) return false; return true; };
  const ROSTOS = ['s_aldea', 's_aldeao', 's_senhora', 's_mascate', 's_menina', 's_menino', 's_ancia', 's_refugiada', 's_leitor'];
  let moradores = null;
  function criar() {
    const nos = NOS.filter(n => livre(n.x, n.z));
    // ligações: cada ponto conhece os pontos perto (até 15 m) que dá para alcançar em linha reta
    for (const n of nos) n.viz = nos.filter(o => o !== n && Math.hypot(o.x - n.x, o.z - n.z) < 15 && caminhoLivre(n, o));
    const usaveis = nos.filter(n => n.viz.length);
    moradores = Array.from({ length: 16 }, (_, i) => {
      const base = ROSTOS[i % ROSTOS.length], crianca = /menin/.test(base), no = usaveis[(i * 7) % usaveis.length];
      const g = new THREE.Group(); scene.add(g);
      const act = SpriteKit.actor({ kind: 'dir', base }); g.add(act.root);
      return { g, act, x: no.x, z: no.z, no, alvo: null, para: Math.random() * 4, face: Math.random() * TAU, vel: crianca ? 2.3 : 1.2 + Math.random() * 0.5 };
    });
  }
  function update(dt) {
    const perto = Math.hypot(P.x - VIL.x, P.z - VIL.z) < 85 && !inTower(P.z);
    if (moradores) for (const m of moradores) m.g.visible = perto;
    if (!perto) return;
    if (!moradores) { if (typeof SpriteKit === 'undefined' || !SpriteKit.ready) return; criar(); }
    for (const m of moradores) {
      let anda = false;
      if (m.para > 0) m.para -= dt;
      else {
        if (!m.alvo) { const v = m.no.viz; m.alvo = v[Math.floor(Math.random() * v.length)]; }
        const dx = m.alvo.x - m.x, dz = m.alvo.z - m.z, d = Math.hypot(dx, dz), passo = m.vel * dt;
        if (d <= passo) { m.x = m.alvo.x; m.z = m.alvo.z; m.no = m.alvo; m.alvo = null; m.para = m.no.porta ? 2 + Math.random() * 5 : Math.random() < 0.4 ? 1 + Math.random() * 3 : 0; }
        else { m.x += dx / d * passo; m.z += dz / d * passo; m.face = Math.atan2(dx, dz); anda = true; }
      }
      // parado perto de você: olha para você
      const pd = Math.hypot(P.x - m.x, P.z - m.z);
      m.g.position.set(m.x, groundY(m.x, m.z), m.z);
      m.act.update(dt, { face: !anda && pd < 4 ? Math.atan2(P.x - m.x, P.z - m.z) : m.face, moving: anda });
    }
  }
  return { update, moradores: () => moradores || [] };
})();
