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

  // ---------------- lojinhas de enfeite (pedido do Rone: "lojinhas que nem são pra gente", com a cidade acordando
  // como no começo de um desenho clássico: cada um no seu ofício, gente comprando e se cumprimentando).
  // Ficam na frente das casas novas; o jogador não compra nelas. Criadas para o jogo.
  const LOJAS = [
    { g: -150, nome: 'Padaria', em: '🥖', cor: ['#c8863a', '#f2e0b8'], vend: 's_mascate', fala: ['Pão quentinho, saindo do forno!', 'Broa de milho fresquinha!', 'Bolo de fubá, só hoje!'] },
    { g: -115, nome: 'Livraria', em: '📚', cor: ['#5a6a8a', '#e8e0c8'], vend: 's_leitor', fala: ['Chegou um livro novo de Auren!', 'Histórias do Reino, quem quer?', 'Ler faz bem, viu?'] },
    { g: -28, nome: 'Peixaria', em: '🐟', cor: ['#3a7a9a', '#e8f0f2'], vend: 's_aldeao', fala: ['Peixe fresco do rio!', 'Olha a sardinha!', 'Pescado hoje cedinho!'] },
    { g: 28, nome: 'Floricultura', em: '💐', cor: ['#c05a7a', '#f6e4ea'], vend: 's_ancia', fala: ['Flores para a moça bonita!', 'Rosas do Sítio, cheirosas!', 'Um buquê alegra a casa!'] },
    { g: 65, nome: 'Alfaiate', em: '🧵', cor: ['#7a4a8a', '#ece0f0'], vend: 's_senhora', fala: ['Costuro capa sob medida!', 'Tecido bom, preço justo!', 'Remendo na hora!'] },
    { g: 115, nome: 'Quitanda', em: '🍎', cor: ['#5a8a3a', '#eef2d8'], vend: 's_aldea', fala: ['Maçã docinha, freguesa!', 'Abóbora, cenoura e couve!', 'Fruta madura é aqui!'] },
  ];
  const listra = (a, b) => { const c = document.createElement('canvas'); c.width = 64; c.height = 8; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * 8, 0, 8, 8); } const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t; };
  const placaLoja = (L) => { const c = document.createElement('canvas'); c.width = 160; c.height = 48; const x = c.getContext('2d');
    x.fillStyle = '#5a3a22'; x.fillRect(0, 0, 160, 48); x.strokeStyle = '#c8962a'; x.lineWidth = 4; x.strokeRect(3, 3, 154, 42);
    x.font = '26px sans-serif'; x.textBaseline = 'middle'; x.fillText(L.em, 10, 25); x.fillStyle = '#f2d890'; x.font = 'bold 19px Georgia, serif'; x.fillText(L.nome, 44, 26); return new THREE.CanvasTexture(c); };
  const mercG = new THREE.Group(); scene.add(mercG);
  const bolinha = (cor, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshLambertMaterial({ color: cor })); m.position.set(x, y, z); m.scale.set(sx, sy, sz); mercG.add(m); return m; };
  const caixa = (cor, x, y, z, w, h, d, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: cor })); m.position.set(x, y, z); m.rotation.y = ry; mercG.add(m); return m; };
  for (const L of LOJAS) {
    const a = L.g * Math.PI / 180, ux = Math.cos(a), uz = Math.sin(a), tx = -uz, tz = ux;        // u: da fonte para a loja; t: ao longo do balcão
    const em = (r, t) => [VIL.x + ux * r + tx * t, VIL.z + uz * r + tz * t];
    const ry = Math.atan2(-ux, -uz);                                                              // virado para a praça
    const [bx, bz] = em(31.6, 0), y0 = gy(bx, bz);
    // balcão, toldo listrado em dois postes e a placa
    add(new THREE.BoxGeometry(2.8, 0.95, 0.75), PMc('madeira.jpg', [1, 0.5], 0x8a6040), bx, y0 + 0.48, bz, ry);
    add(new THREE.BoxGeometry(3, 0.1, 0.9), PMc('madeira.jpg', [1, 0.3], 0xa07850), bx, y0 + 1.0, bz, ry, false);
    for (const t of [-1.5, 1.5]) { const [px, pz] = em(31.1, t); add(new THREE.CylinderGeometry(0.06, 0.07, 2.7, 6), madeira, px, y0 + 1.35, pz, 0, false); }
    const toldo = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), new THREE.MeshLambertMaterial({ map: listra(L.cor[0], L.cor[1]), side: THREE.DoubleSide }));
    const [ax, az] = em(32.1, 0); toldo.position.set(ax, y0 + 2.75, az); toldo.rotation.order = 'YXZ'; toldo.rotation.y = ry; toldo.rotation.x = -Math.PI / 2 + 0.35; cid.add(toldo);
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.48), new THREE.MeshLambertMaterial({ map: placaLoja(L), side: THREE.DoubleSide }));
    const [sx, sz] = em(30.95, 0); placa.position.set(sx, y0 + 3.25, sz); placa.rotation.y = ry; cid.add(placa);
    addOb(bx, bz, 1.3);
    // a mercadoria em cima do balcão
    const yb = y0 + 1.08, P3 = (t, dr = 0) => em(31.6 + dr, t);
    if (L.nome === 'Padaria') { for (let k = 0; k < 5; k++) { const [x, z] = P3(-1 + k * 0.5); bolinha(k % 2 ? 0xc8863a : 0xb06a28, x, yb + 0.1, z, 0.22, 0.12, 0.14); } { const [x, z] = P3(0, 0.2); const bg = caixa(0xd8a050, x, yb + 0.05, z, 1.6, 0.08, 0.1, ry); bg.rotation.z = 0.25; } }
    if (L.nome === 'Livraria') for (let k = 0; k < 4; k++) for (let h = 0; h < 3 - (k % 2); h++) { const [x, z] = P3(-1.05 + k * 0.7); caixa([0x8a2a2a, 0x2a4a7a, 0x3a6a3a, 0x7a5a2a][(k + h) % 4], x, yb + 0.06 + h * 0.13, z, 0.5, 0.12, 0.36, ry + (h - 1) * 0.15); }
    if (L.nome === 'Peixaria') { const [x, z] = P3(0); caixa(0xeef4f6, x, yb + 0.06, z, 2.4, 0.1, 0.6, ry); for (let k = 0; k < 6; k++) { const [x2, z2] = P3(-1 + k * 0.4); const f = bolinha(0x8aa8b8, x2, yb + 0.16, z2, 0.07, 0.07, 0.22); f.rotation.y = ry + 0.4; } }
    if (L.nome === 'Floricultura') for (let k = 0; k < 5; k++) { const [x, z] = P3(-1 + k * 0.5); const v = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.22, 8), new THREE.MeshLambertMaterial({ color: 0xb8643a })); v.position.set(x, yb + 0.11, z); mercG.add(v); for (let f = 0; f < 3; f++) bolinha([0xe85a6a, 0xf2c040, 0xb070e0, 0xf6f6f6, 0xff8a40][(k + f) % 5], x + (f - 1) * 0.07, yb + 0.33 + (f % 2) * 0.06, z, 0.08, 0.08, 0.08); }
    if (L.nome === 'Alfaiate') for (let k = 0; k < 4; k++) { const [x, z] = P3(-0.9 + k * 0.6); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.55, 10), new THREE.MeshLambertMaterial({ color: [0x9a3a5a, 0x3a5a9a, 0xd8c070, 0x4a8a6a][k] })); r.position.set(x, yb + 0.11, z); r.rotation.z = Math.PI / 2; r.rotation.y = ry; mercG.add(r); }
    if (L.nome === 'Quitanda') for (let k = 0; k < 3; k++) { const [x, z] = P3(-0.9 + k * 0.9); caixa(0x9a7048, x, yb + 0.1, z, 0.7, 0.2, 0.45, ry); for (let f = 0; f < 6; f++) bolinha([0xc83a2a, 0xf09a30, 0x6aa83a][k], x + ((f % 3) - 1) * 0.16 * Math.cos(-ry), yb + 0.26, z + ((f % 3) - 1) * 0.16 * Math.sin(-ry) + (f > 2 ? 0.1 : -0.06), 0.08, 0.08, 0.08); }
    L.vendedor = em(32.7, 0); L.fregues = em(29.8, 0); L.ry = ry;
  }
  fundir(mercG); decor(mercG, 30);

  // ---------------- balões de fala (vendedores anunciando e moradores se cumprimentando)
  const baloes = [];
  function falar(alvo, txt) {
    if (baloes.length >= 4 || baloes.some(b => b.alvo === alvo)) return;
    const el = document.createElement('div'); el.className = 'bubble fala-vila'; el.textContent = txt; document.getElementById('labels').appendChild(el);
    baloes.push({ el, alvo, t: 3.6 });
  }
  function tickBaloes(dt) {
    for (let i = baloes.length - 1; i >= 0; i--) { const b = baloes[i]; b.t -= dt;
      const sp = toScreen(b.alvo.x, groundY(b.alvo.x, b.alvo.z) + 2.5, b.alvo.z);
      if (b.t <= 0) { b.el.remove(); baloes.splice(i, 1); continue; }
      b.el.style.display = sp.vis && !(typeof dialogOpen !== 'undefined' && dialogOpen) ? '' : 'none';   // com janela aberta, os balões somem b.el.style.opacity = Math.min(1, b.t * 2);
      b.el.style.transform = `translate(${sp.x | 0}px,${sp.y | 0}px) translate(-50%,-100%)`; }
  }
  const OI = ['Bom dia!', 'Bom dia, vizinha!', 'Olá!', 'Que dia lindo!', 'Como vai a família?', 'Bom dia, seu Doran!', 'Viu o Kravenox no sábado?'];
  const COMPRA = ['Dois pães, por favor!', 'Quanto custa?', 'Vou levar este!', 'Me vê um quilo?', 'Está fresquinho?', 'Embrulha para presente?'];

  // ================= 🏰 A capital (pedido do Rone: "aumenta a cidade pra valer, tipo Prontera no Rag; é a nossa capital,
  // tem que ser grande"). Muralha em volta de tudo (CAPITAL, em game3d.js), Avenida Real até o Castelo ao norte,
  // avenida até a Catedral ao sul, bairros de casas, praça de mercado e parque. Criado para o jogo.
  const capG = new THREE.Group(); scene.add(capG);
  const addC = (geo, mat, x, y, z, ry = 0, sombra = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = sombra; m.receiveShadow = true; capG.add(m); return m; };
  const muroM = PMc('pedra.jpg', [2, 1.4], 0xbcb09c), claro = PMc('pedra.jpg', [2, 2], 0xe0d8c8), ardosia = new THREE.MeshLambertMaterial({ color: 0x4a5a78 });
  const X0 = CAPITAL.x0, X1 = CAPITAL.x1, Z0 = CAPITAL.z0, Z1 = CAPITAL.z1;
  // ---- muralha (com ameias) e torres
  function trechoMuro(xa, za, xb, zb) {
    const L = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.ceil(L / 3)), ry = Math.atan2(xb - xa, zb - za);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = xa + (xb - xa) * t, z = za + (zb - za) * t, y = gy(x, z);
      addC(new THREE.BoxGeometry(1.5, 4.8, L / n + 0.05), muroM, x, y + 1.9, z, ry);
      addC(new THREE.BoxGeometry(1.7, 0.75, 0.9), pedraE, x, y + 4.6, z, ry, false); }
    for (let d = 0; d <= L; d += 1.5) addOb(xa + (xb - xa) * d / L, za + (zb - za) * d / L, 1.0);
  }
  function torreGrande(x, z, r = 2.8, h = 9) {
    const y = gy(x, z) - 0.4;
    addC(new THREE.CylinderGeometry(r, r + 0.3, h, 14), PMc('pedra.jpg', [4, 3], 0xc8bca8), x, y + h / 2, z);
    addC(new THREE.CylinderGeometry(r + 0.35, r + 0.35, 0.5, 14), pedraE, x, y + h + 0.2, z);
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; addC(new THREE.BoxGeometry(0.6, 0.8, 0.6), pedraE, x + Math.cos(a) * (r + 0.1), y + h + 0.8, z + Math.sin(a) * (r + 0.1), -a, false); }
    addC(new THREE.ConeGeometry(r + 0.6, r * 1.3, 14), telha, x, y + h + 1.2 + r * 0.65, z);
    addOb(x, z, r + 0.4);
  }
  trechoMuro(X0, Z0, X1, Z0); trechoMuro(X0, Z1, X1, Z1);
  for (const x of [X0, X1]) { trechoMuro(x, Z0, x, VIL.z - 15.5); trechoMuro(x, VIL.z + 15.5, x, Z1); }
  for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) torreGrande(x, z, 3.2, 11);
  for (const [x, z] of [[X0, -48], [X1, -48], [X0, 48], [X1, 48], [VIL.x - 19, Z0], [VIL.x + 19, Z0], [VIL.x - 19, Z1], [VIL.x + 19, Z1]]) torreGrande(x, z);

  // ---- avenidas de pedra com lampiões e canteiros com árvore
  const calcA = PMc('calcada.jpg', [1, 1], 0xd8ccb8); calcA.polygonOffset = true; calcA.polygonOffsetFactor = -2;
  function chaoPedra(xa, xb, za, zb) {
    const w = xb - xa, d = zb - za, geo = new THREE.PlaneGeometry(w, d, Math.ceil(w / 2), Math.ceil(d / 2)); geo.rotateX(-Math.PI / 2);
    const q = geo.attributes.position, uv = geo.attributes.uv, cx = (xa + xb) / 2, cz = (za + zb) / 2;
    for (let i = 0; i < q.count; i++) { const wx = cx + q.getX(i), wz = cz + q.getZ(i); q.setY(i, gy(wx, wz) + 0.05); uv.setXY(i, wx / 3, wz / 3); }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, calcA); m.position.set(cx, 0, cz); m.receiveShadow = true; capG.add(m);
  }
  const copa = new THREE.MeshLambertMaterial({ color: 0x4a7a34, flatShading: true });
  function arvoreCanteiro(x, z) { const y = gy(x, z);
    addC(new THREE.BoxGeometry(1.3, 0.4, 1.3), pedraE, x, y + 0.2, z, 0, false);
    addC(new THREE.CylinderGeometry(0.12, 0.16, 1.8, 6), madeira, x, y + 1.2, z);
    addC(new THREE.IcosahedronGeometry(1.05, 0), copa, x, y + 2.6, z); addOb(x, z, 0.8); }
  function lampiao(x, z, lado) { const y = gy(x, z);
    addC(new THREE.CylinderGeometry(0.09, 0.13, 3.4, 8), ferro, x, y + 1.7, z, 0, false);
    addC(new THREE.BoxGeometry(0.7, 0.08, 0.08), ferro, x + lado * 0.3, y + 3.35, z, 0, false);
    addC(new THREE.BoxGeometry(0.28, 0.38, 0.28), luz, x + lado * 0.6, y + 3.05, z, 0, false); addOb(x, z, 0.3); }
  for (const s of [-1, 1]) {
    chaoPedra(VIL.x - 4, VIL.x + 4, s < 0 ? -62 : 17, s < 0 ? -17 : 62);
    for (let z = 22; z <= 56; z += 8) { lampiao(VIL.x - 5, s * z, 1); lampiao(VIL.x + 5, s * z, -1); }
    for (let z = 26; z <= 54; z += 14) { arvoreCanteiro(VIL.x - 6.6, s * z); arvoreCanteiro(VIL.x + 6.6, s * z); }
  }
  chaoPedra(VIL.x - 15, VIL.x + 15, -64, -57);          // praça do castelo
  chaoPedra(VIL.x - 13, VIL.x + 13, 56, 62);            // adro da catedral

  // ---- Castelo de Solmira (norte)
  { const cx = VIL.x, y = gy(cx, -72), stone = PMc('pedra.jpg', [3, 2], 0xd8d0c0);
    addC(new THREE.BoxGeometry(18, 11, 11), stone, cx, y + 5.5, -74);                                        // corpo principal
    for (let k = -8; k <= 8; k += 2) addC(new THREE.BoxGeometry(1, 1, 1), stone, cx + k, y + 11.5, -68.6, 0, false);   // ameias
    addC(new THREE.BoxGeometry(8, 8, 4), stone, cx, y + 4, -66.6);                                         // portão
    addC(new THREE.BoxGeometry(3.2, 4.6, 0.2), new THREE.MeshLambertMaterial({ color: 0x2a1c12 }), cx, y + 2.3, -64.5, 0, false);
    for (let k = -3; k <= 3; k++) addC(new THREE.BoxGeometry(0.12, 4.2, 0.12), ferro, cx + k * 0.45, y + 2.4, -64.35, 0, false);   // grade levadiça
    for (const k of [-3, -1, 1, 3]) addC(new THREE.BoxGeometry(1, 1, 1), stone, cx + k, y + 8.5, -64.9, 0, false);
    for (const s of [-1, 1]) { const ban = addC(new THREE.PlaneGeometry(1.4, 4), new THREE.MeshLambertMaterial({ color: 0x9a2a2a, side: THREE.DoubleSide }), cx + s * 2.9, y + 5, -64.45, 0, false);
      addC(new THREE.PlaneGeometry(0.3, 4), new THREE.MeshLambertMaterial({ color: 0xd8a83a, side: THREE.DoubleSide }), cx + s * 2.9, y + 5, -64.4, 0, false); }
    for (const [dx, dz] of [[-10, -68], [10, -68], [-10, -80], [10, -80]]) {                              // 4 torres redondas
      addC(new THREE.CylinderGeometry(2.4, 2.6, 15, 14), stone, cx + dx, y + 7.5, dz);
      addC(new THREE.ConeGeometry(3, 6, 14), ardosia, cx + dx, y + 18, dz);
      addC(new THREE.CylinderGeometry(0.04, 0.04, 2), ferro, cx + dx, y + 22, dz, 0, false);
      addC(new THREE.PlaneGeometry(1, 0.6), new THREE.MeshLambertMaterial({ color: 0x9a2a2a, side: THREE.DoubleSide }), cx + dx + 0.5, y + 22.6, dz, 0, false); }
    addC(new THREE.BoxGeometry(7, 20, 7), stone, cx, y + 10, -76);                                          // torre central
    const tp = addC(new THREE.ConeGeometry(5.6, 7, 4), ardosia, cx, y + 23.5, -76); tp.rotation.y = Math.PI / 4;
    for (const [px, py, pz, ry] of [[-6, 6, -68.45, 0], [-3, 6, -68.45, 0], [3, 6, -68.45, 0], [6, 6, -68.45, 0], [0, 14, -72.45, 0], [-2, 14, -72.45, 0], [2, 14, -72.45, 0]])
      addC(new THREE.PlaneGeometry(0.8, 1.4), VIDRO, cx + px, y + py, pz, ry, false);
    for (let x = -117; x <= -93; x += 3) for (let z = -81; z <= -65; z += 3) addOb(x, z, 2.2);
  }

  // ---- Catedral (sul), de frente para a praça
  { const cx = VIL.x, y = gy(cx, 72), stone = PMc('pedra.jpg', [3, 2], 0xe4dccc);
    addC(new THREE.BoxGeometry(11, 9, 19), stone, cx, y + 4.5, 72.5);
    const tri = new THREE.Shape(); tri.moveTo(-6.2, 0); tri.lineTo(6.2, 0); tri.lineTo(0, 5); tri.closePath();
    const tg = new THREE.ExtrudeGeometry(tri, { depth: 19.6, bevelEnabled: false }); tg.translate(0, 0, -9.8);
    addC(tg, ardosia, cx, y + 9, 72.5);
    for (const s of [-1, 1]) { addC(new THREE.BoxGeometry(3.8, 16, 3.8), stone, cx + s * 4.6, y + 8, 63.2);
      addC(new THREE.ConeGeometry(2.6, 7, 4), ardosia, cx + s * 4.6, y + 19.5, 63.2).rotation.y = Math.PI / 4;
      addC(new THREE.PlaneGeometry(0.9, 2.2), VIDRO, cx + s * 4.6, y + 12, 61.28, 0, false); }
    const vitral = (() => { const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); const cores = ['#c83a3a', '#3a6ac8', '#e8c040', '#4aa85a', '#a04ac8', '#e87a30'];
      for (let k = 0; k < 12; k++) { x.fillStyle = cores[k % 6]; x.beginPath(); x.moveTo(48, 48); x.arc(48, 48, 46, k / 12 * TAU, (k + 1) / 12 * TAU); x.fill(); }
      x.strokeStyle = '#2a1c12'; x.lineWidth = 4; for (let k = 0; k < 12; k++) { x.beginPath(); x.moveTo(48, 48); x.lineTo(48 + Math.cos(k / 12 * TAU) * 46, 48 + Math.sin(k / 12 * TAU) * 46); x.stroke(); }
      x.beginPath(); x.arc(48, 48, 46, 0, 7); x.stroke(); x.beginPath(); x.arc(48, 48, 14, 0, 7); x.fillStyle = '#f2e8c0'; x.fill(); x.stroke(); return new THREE.CanvasTexture(c); })();
    addC(new THREE.CircleGeometry(2.1, 24), new THREE.MeshBasicMaterial({ map: vitral, toneMapped: false }), cx, y + 6.6, 62.94, Math.PI, false);
    const porta = new THREE.Shape(); porta.moveTo(-1.3, 0); porta.lineTo(-1.3, 2.6); porta.absarc(0, 2.6, 1.3, Math.PI, 0, true); porta.lineTo(1.3, 0); porta.closePath();
    addC(new THREE.ShapeGeometry(porta, 12), PMc('madeira.jpg', [0.6, 1], 0x5a3a22), cx, y + 0.02, 62.94, Math.PI, false);
    for (const s of [-1, 1]) for (let z = 66; z <= 80; z += 4.5) addC(new THREE.PlaneGeometry(0.9, 3), VIDRO, cx + s * 5.53, y + 4.6, z, s * Math.PI / 2, false);
    for (let x = -110; x <= -100; x += 2.5) for (let z = 62; z <= 82; z += 2.5) addOb(x, z, 1.6);
    for (const s of [-1, 1]) addOb(cx + s * 4.6, 63.2, 2.6);
  }

  // ---- bairros de casas (de frente para a avenida)
  const bairro = new THREE.Group(); scene.add(bairro);
  const CORES = ['#7a5546', '#5a5e64', '#6e5a44', '#4e545a', '#7a5a40', '#5e5048', '#585e5e', '#6a4a3a', '#56606a'];
  const CASAS_CAP = [];
  let ci = 0;
  for (const z of [-47, -58, -69, -79, 47, 58, 69]) for (const x of [-133, -124, -86, -77]) {
    if (z > 60 && x < -110) continue;                                    // ali fica a praça do mercado
    if (z === 69 && x === -77) continue;                                 // e ali o parque
    CASAS_CAP.push([x, z]); bairro.attach(house(x, z, x < VIL.x ? Math.PI / 2 : -Math.PI / 2, 5.2, 4.6, CORES[ci++ % CORES.length], 'wood'));
  }
  fundir(bairro); decor(bairro, 45);
  // praça do mercado (sudoeste) e parque com lago (sudeste)
  const merc = new THREE.Group(); scene.add(merc);
  for (const [x, z, r] of [[-136, 67, Math.PI / 2], [-136, 74, Math.PI / 2], [-128, 79, Math.PI], [-121, 79, Math.PI], [-121, 67, -Math.PI / 2]]) merc.attach(house(x, z, r, 3.2, 2.4, null, 'tent'));
  fundir(merc); decor(merc, 30);
  chaoPedra(-139, -117, 63, 82);
  { const y = gy(-80, 77), agua = new THREE.Mesh(new THREE.CircleGeometry(4.2, 24).rotateX(-Math.PI / 2), typeof waterMat !== 'undefined' ? waterMat : new THREE.MeshLambertMaterial({ color: 0x4a8ab8 }));
    agua.position.set(-80, y + 0.08, 77); capG.add(agua);
    addC(new THREE.TorusGeometry(4.3, 0.3, 6, 28).rotateX(Math.PI / 2), pedraE, -80, y + 0.15, 77, 0, false); addOb(-80, 77, 4.4);
    for (const [x, z] of [[-91, 73], [-90, 81], [-72, 72], [-71, 81], [-86, 70]]) arvoreCanteiro(x, z); }

  // ---- guardas nos portões e no castelo (ficam parados, de vigia)
  const GUARDAS = [[X0 + 2.2, -4], [X0 + 2.2, 4], [X1 - 2.2, -4], [X1 - 2.2, 4], [VIL.x - 3, -62], [VIL.x + 3, -62]].map(([x, z]) => ({ x, z, face: z < -50 ? 0 : x < VIL.x ? -Math.PI / 2 : Math.PI / 2 }));
  fundir(capG); decor(capG, 70);

  // ---------------- moradores andando pela cidade (pedido do Rone: "muitas pessoas andando")
  // Cada um vai de ponto em ponto (volta da praça, rua de pedra e a porta das casas), só por caminho livre,
  // e para um pouco em cada lugar. Cada jogador vê os seus (não passam pelo servidor). Criados para o jogo.
  const NOS = [];
  const livre = (x, z) => !blocked(x, z, 0.4);
  for (let k = 0; k < 18; k++) { const [x, z] = P2(19.5, k * 20); NOS.push({ x, z }); }                  // volta da praça
  for (const lado of [1, -1]) for (const d of [23, 29, 35]) for (const zz of [-1.6, 1.6]) NOS.push({ x: VIL.x + lado * d, z: VIL.z + zz });   // rua
  const CASAS = [[-125, -22], [-84, -24], [-127, 22], [-84, 22], [-135, -6], ...[[36, -150], [36, -115], [37, -28], [37, 28], [36, 65], [36, 115], [36, 150]].map(([r, g]) => P2(r, g))];
  const ehLoja = (hx, hz) => LOJAS.some(L => { const [lx, lz] = P2(36, L.g); return Math.hypot(lx - hx, lz - hz) < 3; });
  for (const [hx, hz] of CASAS) { if (ehLoja(hx, hz)) continue; const d = Math.hypot(VIL.x - hx, VIL.z - hz), k = 4.6 / d; NOS.push({ x: hx + (VIL.x - hx) * k, z: hz + (VIL.z - hz) * k, porta: true }); }   // na frente da porta
  for (const L of LOJAS) NOS.push({ x: L.fregues[0], z: L.fregues[1], loja: L });                     // no balcão das lojinhas
  // a capital: avenidas, praças do castelo e da catedral, ruas dos bairros, mercado, parque e a porta das casas novas
  for (const sg of [-1, 1]) { for (const z of [24, 32, 40, 48, 56]) for (const dx of [-2, 2]) NOS.push({ x: VIL.x + dx, z: sg * z });
    for (const z of [44, 52, 63, 74]) for (const x of [-118, -129, -92, -81]) NOS.push({ x, z: sg * z }); }
  for (const dx of [-12, -6, 6, 12]) { NOS.push({ x: VIL.x + dx, z: -60 }); NOS.push({ x: VIL.x + dx, z: 59 }); }
  for (const [x, z] of [[-128, 70], [-130, 76], [-126, 65], [-86, 66], [-74, 76], [-86, 82]]) NOS.push({ x, z });
  for (const [hx, hz] of CASAS_CAP) NOS.push({ x: hx + (hx < VIL.x ? 3.9 : -3.9), z: hz, porta: true });
  const caminhoLivre = (a, b) => { const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / 0.6); for (let i = 1; i <= n; i++) if (!livre(a.x + (b.x - a.x) * i / n, a.z + (b.z - a.z) * i / n)) return false; return true; };
  const ROSTOS = ['s_aldea', 's_aldeao', 's_senhora', 's_mascate', 's_menina', 's_menino', 's_ancia', 's_refugiada', 's_leitor'];
  let moradores = null;
  function criar() {
    const nos = NOS.filter(n => livre(n.x, n.z));
    // ligações: cada ponto conhece os pontos perto (até 15 m) que dá para alcançar em linha reta
    for (const n of nos) n.viz = nos.filter(o => o !== n && Math.hypot(o.x - n.x, o.z - n.z) < 15 && caminhoLivre(n, o));
    const usaveis = nos.filter(n => n.viz.length);
    moradores = Array.from({ length: 30 }, (_, i) => {
      const base = ROSTOS[i % ROSTOS.length], crianca = /menin/.test(base), no = usaveis[(i * 7) % usaveis.length];
      const g = new THREE.Group(); scene.add(g);
      const act = SpriteKit.actor({ kind: 'dir', base }); g.add(act.root);
      return { g, act, x: no.x, z: no.z, no, alvo: null, para: Math.random() * 4, face: Math.random() * TAU, vel: crianca ? 2.3 : 1.2 + Math.random() * 0.5 };
    });    for (const G of GUARDAS) { G.g = new THREE.Group(); scene.add(G.g); G.act = SpriteKit.actor({ kind: 'dir', base: 's_aldeao' }); G.g.add(G.act.root); G.g.position.set(G.x, groundY(G.x, G.z), G.z); }
    for (const L of LOJAS) { const g = new THREE.Group(); scene.add(g); const act = SpriteKit.actor({ kind: 'dir', base: L.vend }); g.add(act.root);
      L.v = { g, act, x: L.vendedor[0], z: L.vendedor[1], cd: 3 + Math.random() * 10 }; g.position.set(L.v.x, groundY(L.v.x, L.v.z), L.v.z); }
  }
  function update(dt) {
    const perto = Math.hypot(P.x - VIL.x, P.z - VIL.z) < 110 && !inTower(P.z);
    if (moradores) for (const m of moradores) m.g.visible = perto;
    if (!perto) return;
    if (!moradores) { if (typeof SpriteKit === 'undefined' || !SpriteKit.ready) return; criar(); }
    for (const m of moradores) {
      let anda = false;
      if (m.para > 0) m.para -= dt;
      else {
        if (!m.alvo) { const v = m.no.viz, lj = v.filter(n => n.loja); m.alvo = lj.length && Math.random() < 0.45 ? lj[Math.floor(Math.random() * lj.length)] : v[Math.floor(Math.random() * v.length)]; }   // gostam de passar nas lojinhas
        const dx = m.alvo.x - m.x, dz = m.alvo.z - m.z, d = Math.hypot(dx, dz), passo = m.vel * dt;
        if (d <= passo) { m.x = m.alvo.x; m.z = m.alvo.z; m.no = m.alvo; m.alvo = null; m.para = m.no.loja ? 5 + Math.random() * 5 : m.no.porta ? 2 + Math.random() * 5 : Math.random() < 0.4 ? 1 + Math.random() * 3 : 0;
          if (m.no.loja) { m.face = m.no.loja.ry + Math.PI; if (Math.random() < 0.6) falar(m, COMPRA[Math.floor(Math.random() * COMPRA.length)]); } }
        else { m.x += dx / d * passo; m.z += dz / d * passo; m.face = Math.atan2(dx, dz); anda = true; }
      }
      if (anda && Math.random() < dt * 0.25) { const o = moradores.find(o => o !== m && Math.hypot(o.x - m.x, o.z - m.z) < 2.5); if (o) falar(m, OI[Math.floor(Math.random() * OI.length)]); }   // cruzou com alguém: cumprimenta
      // parado perto de você: olha para você
      const pd = Math.hypot(P.x - m.x, P.z - m.z);
      m.g.position.set(m.x, groundY(m.x, m.z), m.z);
      m.act.update(dt, { face: !anda && pd < 4 ? Math.atan2(P.x - m.x, P.z - m.z) : m.face, moving: anda });
    }
  }
  function updateVila(dt) {
    update(dt);
    const perto = Math.hypot(P.x - VIL.x, P.z - VIL.z) < 110 && !inTower(P.z);
    for (const L of LOJAS) if (L.v) { L.v.g.visible = perto;
      if (!perto) continue;
      const pd = Math.hypot(P.x - L.v.x, P.z - L.v.z);
      L.v.act.update(dt, { face: pd < 5 ? Math.atan2(P.x - L.v.x, P.z - L.v.z) : L.ry, moving: false });
      L.v.cd -= dt; if (L.v.cd <= 0) { L.v.cd = 9 + Math.random() * 12; if (pd < 28) falar(L.v, L.fala[Math.floor(Math.random() * L.fala.length)]); } }   // o vendedor anuncia
    for (const G of GUARDAS) if (G.act) { G.g.visible = perto; if (perto) G.act.update(dt, { face: Math.hypot(P.x - G.x, P.z - G.z) < 4 ? Math.atan2(P.x - G.x, P.z - G.z) : G.face, moving: false }); }   // guardas de vigia
    if (!perto) { for (const b of baloes) b.el.remove(); baloes.length = 0; } else tickBaloes(dt);
  }
  return { update: updateVila, moradores: () => moradores || [] };
})();
