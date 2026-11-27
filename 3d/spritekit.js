// =====================================================================
//  SpriteKit — personagens, monstros e efeitos com a arte pixelada do
//  RPG Kravenox, desenhados como "billboards" no mundo 3D (estilo Ragnarok).
//  Os sprites vêm de window.SPR (sprites.js, gerado por scripts/build-sprites.js).
// =====================================================================
'use strict';
const SpriteKit = (() => {
  const IMG = {}, TEX = {};
  let ready = false;
  const actors = new Set(), fxs = [];
  const PX = 1.85 / 36;                       // metros por pixel dos heróis e NPCs (28x36 → 1,85 m)
  const light = new THREE.Color(1, 1, 1);     // escurece os sprites nas regiões sombrias

  function load() {
    const S = window.SPR || {};
    return Promise.all(Object.keys(S).map(n => new Promise(res => {
      const im = new Image();
      im.onload = () => { IMG[n] = im; res(); }; im.onerror = () => res();
      im.src = 'data:image/png;base64,' + S[n];
    }))).then(() => { ready = Object.keys(IMG).length > 0; return ready; });
  }
  function scale2x(c) {
    const w = c.width, h = c.height, si = c.getContext('2d').getImageData(0, 0, w, h), sd = new Uint32Array(si.data.buffer);
    const o = document.createElement('canvas'); o.width = w * 2; o.height = h * 2; const oc = o.getContext('2d'), oi = oc.createImageData(w * 2, h * 2), od = new Uint32Array(oi.data.buffer), W2 = w * 2;
    const px = (x, y) => sd[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const P = px(x, y), A = px(x, y - 1), B = px(x + 1, y), C = px(x - 1, y), D = px(x, y + 1);
      const e0 = C === A && C !== D && A !== B ? A : P, e1 = A === B && A !== C && B !== D ? B : P, e2 = D === C && D !== B && C !== A ? C : P, e3 = B === D && B !== A && D !== C ? D : P;
      const i = y * 2 * W2 + x * 2; od[i] = e0; od[i + 1] = e1; od[i + W2] = e2; od[i + W2 + 1] = e3;
    }
    oc.putImageData(oi, 0, 0); return o;
  }
  function escala4(im) { try { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return scale2x(scale2x(c)); } catch (e) { return im; } }
  function tex(n) {
    if (TEX[n]) return TEX[n];
    const im = IMG[n]; if (!im) return null;
    // 🔎 qualidade (pedido do Rone): o desenho pequeno (~32 px) é ampliado 4x com Scale2x duas vezes — as bordas em
    // escadinha viram curvas limpas, sem borrar — e o mipmap evita o "chiado" quando o personagem fica pequeno na tela
    const src = (im.width || 0) <= 160 && (im.height || 0) <= 160 ? escala4(im) : im;
    const t = new THREE.Texture(src);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
    t.userData = { w: im.width, h: im.height };   // o tamanho no mundo continua o do desenho original
    return (TEX[n] = t);
  }
  const has = n => !!IMG[n];
  // registra um desenho feito em canvas (ex.: animais do Sítio) como sprite
  function addCanvas(n, c) { IMG[n] = c; delete TEX[n]; }


  // =====================================================================
  //  😊 Heróis com rosto, passo de verdade e golpe (pedido do Rone: "melhorar a carinha, ver expressões, o andar
  //  ainda mais quando atacam"). O desenho original do RPG continua o mesmo; em cima dele, já ampliado 4x, o jogo
  //  redesenha os olhos e a boca com o dobro de detalhe e monta quadros novos: andar em 4 tempos (um pé de cada vez,
  //  a barra da roupa balançando) e golpe em 2 tempos (pega impulso e avança o corpo), no lugar de esticar a imagem.
  // =====================================================================
  const ROSTO = {        // cores dos olhos e da boca de cada heroína (para achar o rosto em cada quadro)
    s_erya: { olho: [[154, 154, 164], [255, 255, 255]], iris: [118, 124, 150], luz: [236, 240, 255], boca: [176, 96, 96] },
    s_lyra: { olho: [[58, 36, 16], [208, 144, 40], [255, 255, 255]], iris: [208, 144, 40], luz: [255, 250, 220], boca: [176, 96, 96] },
    s_seraphyne: { olho: [[36, 16, 74], [154, 96, 255]], iris: [120, 70, 220], luz: [230, 210, 255], boca: [138, 90, 106] },
    s_mae: { olho: [[74, 58, 32], [255, 224, 160]], iris: [120, 90, 50], luz: [255, 236, 200], boca: [176, 112, 96] },
  };
  const COM_POSE = n => !!ROSTO[n] || n === 'k' || n === 't';   // só os heróis jogáveis (os NPCs continuam leves)
  // olhos desenhados pixel a pixel (8 de largura, no tamanho 4x). O desenho é o do olho da ESQUERDA da tela; o da direita
  // é espelhado. L = contorno, I = íris, P = pupila, W = brilho, H = reflexo de baixo. As 3 primeiras linhas ficam acima do olho.
  const OLHO = {
    normal: ['........', '........', '........', '.LLLLLL.', 'LWWIIIIL', 'LWWIPPIL', 'LIIPPPIL', 'LIIPPPHL', 'LIHIIIIL', '.LIIIIL.', '..LLLL..'],
    brava: ['LL......', '.LLL....', '...LLLL.', 'L.....LL', 'LLLLLLLL', 'LIIPPPIL', 'LWIPPPIL', 'LIIIIHIL', '.LLLLLL.', '........', '........'],
    dor: ['........', '........', '........', 'LL......', '.LLL....', '...LLL..', '.....LLL', '...LLL..', '.LLL....', 'LL......', '........'],
    feliz: ['........', '........', '........', '........', '........', '..LLLL..', '.LIIIIL.', 'LL....LL', 'L......L', '........', '........'],
    fechado: ['........', '........', '........', '........', '........', '........', '........', 'LLLLLLLL', '.LL..LL.', '........', '........'],
  };
  const BOCA = {         // centrada na boca original
    normal: ['.MM.'],
    brava: ['.LLLL.', 'LRRRRL', 'LRTTRL', '.LLLL.'],
    dor: ['L.L.L.', '.L.L.L'],
    feliz: ['L....L', '.LLLL.'],
  };
  const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const mesma = (d, i, c) => Math.abs(d[i] - c[0]) < 3 && Math.abs(d[i + 1] - c[1]) < 3 && Math.abs(d[i + 2] - c[2]) < 3 && d[i + 3] > 128;
  const _rosto = {};
  // acha os olhos (grupos de pixels com as cores dos olhos) e a boca num quadro de 28x36
  function acharRosto(nome, spec) {
    if (_rosto[nome] !== undefined) return _rosto[nome];
    const im = IMG[nome]; if (!im) return (_rosto[nome] = null);
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const W = im.width, H = im.height, d = x.getImageData(0, 0, W, H).data, marca = new Uint8Array(W * H), olhos = [];
    const ehOlho = (px, py) => { const i = (py * W + px) * 4; return spec.olho.some(cc => mesma(d, i, cc)); };
    for (let y = 6; y < 22; y++) for (let xx = 0; xx < W; xx++) if (!marca[y * W + xx] && ehOlho(xx, y)) {
      const g = { x0: xx, x1: xx, y0: y, y1: y }, pilha = [[xx, y]]; marca[y * W + xx] = 1;
      while (pilha.length) { const [px, py] = pilha.pop(); g.x0 = Math.min(g.x0, px); g.x1 = Math.max(g.x1, px); g.y0 = Math.min(g.y0, py); g.y1 = Math.max(g.y1, py);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 6 || nx >= W || ny >= 22 || marca[ny * W + nx] || !ehOlho(nx, ny)) continue; marca[ny * W + nx] = 1; pilha.push([nx, ny]); } }
      // pele para apagar o olho antigo: o pixel logo abaixo do olho (a bochecha)
      const ib = (Math.min(H - 1, g.y1 + 1) * W + ((g.x0 + g.x1) >> 1)) * 4; g.pele = [d[ib], d[ib + 1], d[ib + 2]];
      olhos.push(g);
    }
    let boca = null;
    for (let y = 8; y < 23 && !boca; y++) for (let xx = 0; xx < W; xx++) if (mesma(d, (y * W + xx) * 4, spec.boca)) { const il = (y * W + xx - 1) * 4; boca = { x: xx, y, pele: [d[il], d[il + 1], d[il + 2]] }; break; }
    return (_rosto[nome] = olhos.length && olhos.length <= 2 ? { olhos: olhos.sort((a, b) => a.x0 - b.x0), boca } : null);
  }
  // pele lisa: as manchas de sombra do desenho pequeno viravam borrões ao ampliar. Repinta a pele do rosto com a cor
  // clara, uma sombra suave só na borda (junto do capuz/cabelo) e um rubor nas bochechas.
  const PELE = [[251, 230, 216], [239, 208, 189], [201, 154, 134], [246, 234, 236], [226, 210, 214], [180, 160, 168]];
  function lisa(cx, R, spec) {
    const xs = R.olhos.flatMap(g => [g.x0, g.x1]), ys = R.olhos.flatMap(g => [g.y0, g.y1]);
    const X0 = Math.max(0, Math.min(...xs) - 10) * 4, X1 = Math.min(cx.canvas.width / 4, Math.max(...xs) + 11) * 4, Y0 = (Math.min(...ys) - 6) * 4, Y1 = (Math.max(...ys) + 5) * 4;
    const w = X1 - X0, h = Y1 - Y0; if (w <= 0 || h <= 0) return;
    const id = cx.getImageData(X0, Y0, w, h), d = id.data, m = new Uint8Array(w * h);
    const pele = spec.pele || PELE;
    for (let i = 0; i < w * h; i++) if (pele.some(c => mesma(d, i * 4, c))) m[i] = 1;
    const base = R.olhos[0].pele[0] > 240 ? R.olhos[0].pele : pele[0], meio = pele.find(c => c !== base && c[0] < base[0] && c[0] > base[0] - 30) || pele[1];
    R.base = base; const cy = (Math.max(...ys) + 1.5) * 4 - Y0;   // altura das bochechas
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!m[i]) continue;
      let borda = false; for (let r = 1; r <= 2 && !borda; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, -r], [0, r]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || !m[ny * w + nx]) { borda = true; break; } }
      let c = borda ? meio : base;
      for (const g of R.olhos) { const bx = (g.x0 + g.x1 + 1) * 2 - X0, dd = ((x - bx) / 5) ** 2 + ((y - cy - 3) / 2.5) ** 2; if (dd < 1) c = c.map((v, k) => v + ([246, 170, 165][k] - v) * 0.45 * (1 - dd)); }
      d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; }
    cx.putImageData(id, X0, Y0);
  }
  function pintarRosto(cx, nome, base, dir, expr) {
    const spec = ROSTO[base]; if (!spec || dir === 'up' || expr === 'nada') return;
    const R = acharRosto(nome, spec); if (!R) return;
    const L = [40, 22, 30], P = spec.iris.map(v => v * 0.35), I = spec.iris, Wc = spec.luz, H = spec.iris.map(v => Math.min(255, v * 1.35));
    const cor = { L, P, I, W: Wc, H, R: [150, 40, 50], T: [230, 120, 120], M: spec.boca.map(v => v * 0.85) };
    const pix = (x, y, c) => { cx.fillStyle = rgb(c); cx.fillRect(x, y, 1, 1); };
    const T = OLHO[expr] || OLHO.normal;
    lisa(cx, R, spec);
    R.olhos.forEach((g, k) => {
      const X0 = g.x0 * 4, Y0 = g.y0 * 4, Wd = (g.x1 - g.x0 + 1) * 4, Ht = (g.y1 - g.y0 + 1) * 4;
      cx.fillStyle = rgb(R.base || g.pele); cx.fillRect(X0 - 1, Y0 - 1, Wd + 2, Ht + 2);              // apaga o olho antigo
      // de frente: o olho da direita é espelhado; de lado: o rosto olha para o lado do desenho
      const esp = R.olhos.length === 2 ? k === 1 : dir === 'left';
      const ox = Math.round(X0 + Wd / 2 - 4), oy = Math.round(Y0 + Ht - 8 - 1);         // olho de 8 de altura alinhado embaixo
      T.forEach((lin, ly) => { for (let lx = 0; lx < 8; lx++) { const ch = lin[esp ? 7 - lx : lx]; if (ch !== '.') pix(ox + lx, oy + ly - 3, cor[ch]); } });
    });
    // 👤 de lado (pedido do Rone: "de lado estão estranhos"): o olho vai para perto da frente do rosto, com nariz e boca de perfil
    if (R.olhos.length === 1 && (dir === 'left' || dir === 'right')) {
      const g = R.olhos[0], s = dir === 'left' ? -1 : 1, ey = (g.y1 + 1) * 4 - 2, base0 = R.base || g.pele;
      // a borda da frente do rosto na altura do olho (último pixel de pele para o lado que ele olha)
      const W4 = cx.canvas.width, linha = cx.getImageData(0, ey, W4, 1).data, pele = spec.pele || PELE, ehPele = i => pele.some(c => mesma(linha, i * 4, c)) || mesma(linha, i * 4, base0);
      let fx = Math.round((g.x0 + g.x1 + 1) * 2); while (fx + s >= 0 && fx + s < W4 && ehPele(fx + s)) fx += s;
      // apaga o olho que foi desenhado no meio e redesenha encostado na frente (4 px de folga)
      const ox0 = g.x0 * 4, Wd = (g.x1 - g.x0 + 1) * 4; cx.fillStyle = rgb(base0); cx.fillRect(ox0 - 1, g.y0 * 4 - 12, Wd + 2, (g.y1 - g.y0 + 1) * 4 + 14);
      const T2 = OLHO[expr] || OLHO.normal, ox = s < 0 ? fx + 5 : fx - 12, oy = ey - 9;
      T2.forEach((lin, ly) => { for (let lx = 0; lx < 7; lx++) { const ch = lin[s < 0 ? 7 - lx : lx + 1]; if (ch !== '.') pix(ox + lx, oy + ly - 3, cor[ch]); } });
      // nariz: um degrauzinho de pele saindo da borda, com a ponta escura; boca curta perto da frente
      const nz = ey + 6; cx.fillStyle = rgb(base0); cx.fillRect(s < 0 ? fx - 2 : fx + 1, nz, 2, 4); pix(s < 0 ? fx - 3 : fx + 3, nz + 2, [200, 140, 120]); pix(s < 0 ? fx - 3 : fx + 3, nz + 3, [200, 140, 120]);
      const bm = BOCA[expr] && expr !== 'normal' ? expr : 'normal', by2 = ey + 14, bx2 = s < 0 ? fx + 2 : fx - 6;
      if (bm === 'brava' || bm === 'dor') { for (let k = 0; k < 4; k++) pix(bx2 + k, by2 + (k % 2), L); } else if (bm === 'feliz') { pix(bx2, by2, L); for (let k = 1; k < 4; k++) pix(bx2 + k, by2 + 1, L); } else { for (let k = 0; k < 4; k++) pix(bx2 + k, by2, cor.M); }
      return;
    }
    const B = BOCA[expr] || (expr === 'fechado' ? BOCA.normal : null);
    if (B && R.boca && R.olhos.length === 2) {                               // de lado a boca fica na borda: mantém a do desenho
      const bx = R.boca.x * 4 + 2, by = R.boca.y * 4 + 2, bw = B[0].length;
      cx.fillStyle = rgb(R.base || R.boca.pele); cx.fillRect(R.boca.x * 4 - 1, R.boca.y * 4 - 1, 6, 6);
      B.forEach((lin, ly) => { for (let lx = 0; lx < bw; lx++) if (lin[lx] !== '.') pix(bx - (bw >> 1) + lx, by - 1 + ly, cor[lin[lx]]); });
    }
  }
  // quadro novo: pose = 'p' (parado) | 'w0'..'w3' (andar) | 'a0' (impulso) | 'a1' (golpe)
  const POSE = {
    frente: { p: {}, w0: { by: 1, pe: [0, -3], hem: 2 }, w1: { by: -2 }, w2: { by: 1, pe: [-3, 0], hem: -2 }, w3: { by: -2 }, a0: { by: -3 }, a1: { by: 2, dx: [-3, 3] } },
    lado: { p: {}, w0: { by: 1, dx: [3, -3], sh: 1, hem: -1 }, w1: { by: -2, dx: [1, -1], pe: [0, -2], sh: 1 }, w2: { by: 1, dx: [3, -3], sh: 1, hem: 1 }, w3: { by: -2, dx: [1, -1], pe: [-2, 0], sh: 1 },
            a0: { bx: -2, sh: -3, by: -1 }, a1: { bx: 3, sh: 6, by: 1, dx: [4, -2] } },
  };
  const QTEX = {};
  function quadro(base, dir, pose, expr) {
    const key = `${base}|${dir}|${pose}|${expr}`; if (QTEX[key]) return QTEX[key];
    const nome = `${base}_${dir}_0`, im = IMG[nome]; if (!im) return null;
    const W = im.width, H = im.height, src = escala4(im), W4 = W * 4, H4 = H * 4;
    const cf = document.createElement('canvas'); cf.width = W4; cf.height = H4; const fx = cf.getContext('2d'); fx.drawImage(src, 0, 0);
    pintarRosto(fx, nome, base, dir, expr);
    // pés: as 2 últimas linhas com desenho; o meio dos pés divide esquerdo e direito
    const c0 = document.createElement('canvas'); c0.width = W; c0.height = H; const x0 = c0.getContext('2d'); x0.drawImage(im, 0, 0);
    const d = x0.getImageData(0, 0, W, H).data; let yb = H - 1; while (yb > 0 && ![...Array(W).keys()].some(i => d[(yb * W + i) * 4 + 3] > 128)) yb--;
    let sx = 0, n = 0; for (let i = 0; i < W; i++) if (d[(yb * W + i) * 4 + 3] > 128) { sx += i; n++; }
    const meio = Math.round((n ? sx / n : W / 2) * 4), pe4 = (yb - 1) * 4, hem4 = pe4 - 12;
    const lado = dir === 'left' || dir === 'right', s = dir === 'left' ? -1 : 1;
    const Q = (lado ? POSE.lado : POSE.frente)[pose] || {};
    const out = document.createElement('canvas'); out.width = W4; out.height = H4; const o = out.getContext('2d');
    // pés primeiro (o pé levantado some um pouco debaixo da roupa)
    const dxp = Q.dx || [0, 0], dyp = Q.pe || [0, 0];
    // de lado, o pé "da frente" é o do lado para onde o desenho olha
    const ordem = lado && s < 0 ? [1, 0] : [0, 1];
    const metade = [[0, meio], [meio, W4 - meio]];
    for (const k of [0, 1]) { const [mx, mw] = metade[k], j = ordem[k], ddx = lado ? (k === 1 ? dxp[0] : dxp[1]) * s : dxp[j];
      const fy = pe4 - 6; o.drawImage(cf, mx, fy, mw, H4 - fy, mx + ddx, fy + dyp[j], mw, H4 - fy); }   // começa por baixo da roupa: o corpo subindo não abre buraco
    // corpo, linha por linha (inclinação para frente/trás e a barra da roupa balançando)
    const by = Q.by || 0, bx = (Q.bx || 0) * s, sh = (Q.sh || 0) * s, hem = (Q.hem || 0) * (lado ? s : 1);
    for (let y = 0; y < pe4; y++) {
      const dx = Math.round(bx + sh * (1 - y / pe4) + (y >= hem4 ? hem * (y - hem4) / 12 : 0));
      o.drawImage(cf, 0, y, W4, 1, dx, y + by, W4, 1);
    }
    const t = new THREE.Texture(out);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    t.encoding = THREE.sRGBEncoding; t.needsUpdate = true; t.userData = { w: W, h: H };
    return (QTEX[key] = t);
  }
  // expressão do momento: golpe = brava; levou dano ou caiu = dor; dormindo = olhos fechados; piscar de vez em quando;
  // parado um tempo = sorrisinho
  function expressao(a, st, dt) {
    if (st.dead || st.flash) return 'dor';
    if ((st.atk || 0) > 0.05) { a.parado = 0; return 'brava'; }
    if (st.sleeping) return 'fechado';
    if (st.feliz) return 'feliz';
    a.parado = st.moving ? 0 : (a.parado || 0) + dt;
    if ((a.pisca = (a.pisca ?? 2 + Math.random() * 3) - dt) < 0) { if (a.pisca < -0.13) a.pisca = 2.5 + Math.random() * 3; return 'fechado'; }
    if (a.parado > 4 && (a.parado % 12) < 1.6) return 'feliz';
    return 'normal';
  }

  const shadowGeo = new THREE.CircleGeometry(1, 20); shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
  const _w = new THREE.Vector3();
  const norm = a => ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

  // set: { kind: 'dir', base: 's_lyra' } (4 direções × 2 quadros)
  //      { kind: 'hero', base: 'k' }      (Kravenox/Thornox: + 4 quadros de andar de lado e fúria)
  //      { kind: 'one', img: 'e_eco' }    (inimigo de um quadro só; espelha conforme o lado)
  // opt: { h (altura em metros, para 'one'), px (escala), shadow, float, faceRight }
  const _OURO = new THREE.Color(), _FURIA = new THREE.Color();
  function actor(set, opt = {}) {
    const root = new THREE.Group();
    const mat = new THREE.SpriteMaterial({ map: null, alphaTest: 0.5, transparent: false, fog: true, toneMapped: false });
    const spr = new THREE.Sprite(mat); spr.center.set(0.5, 0);
    root.add(spr);
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.y = 0.03; sh.renderOrder = -1;
    if (opt.shadow !== false) root.add(sh);
    const a = { root, spr, mat, set, opt, t: Math.random() * 10, dir: 'down', fade: 1, tint: new THREE.Color(1, 1, 1) };
    const first = set.kind === 'one' ? set.img : set.base + '_down_0';
    const ft = tex(first);
    let px = opt.px || PX;
    if (set.kind === 'one' && ft) px = (opt.h || 1.8) / ft.userData.h;
    a.px = px;
    a.h = ft ? ft.userData.h * px : 1.8;
    sh.scale.setScalar(ft ? Math.max(0.35, ft.userData.w * px * 0.38) : 0.5);
    if (opt.shadowScale) sh.scale.multiplyScalar(opt.shadowScale);
    a.shadow = sh;
    a.update = (dt, st = {}) => update(a, dt, st);
    a.dispose = () => { actors.delete(a); mat.dispose(); };
    actors.add(a);
    update(a, 0, {});
    return a;
  }

  function pick(a, st) {
    const S = a.set;
    if (S.kind === 'one') return S.img;
    const d = a.dir;
    // fúria: o desenho com aura é só de frente; andando ou de costas usa o desenho da direção certa (com tom vermelho)
    if (st.fury && has(S.base + '_furia') && !st.moving && d === 'down') return S.base + '_furia';
    if (COM_POSE(S.base) && has(`${S.base}_${d}_0`)) {                         // herói jogável: quadros novos
      const atk = st.atk || 0;
      if (atk > 0.05 && !st.dead) return { q: [S.base, d, atk > 0.62 ? 'a0' : 'a1'] };
      if (S.kind === 'hero' && st.moving && (d === 'left' || d === 'right')) return `${S.base}_${d}_w${Math.floor(a.t * 9) % 4}`;
      return { q: [S.base, d, st.moving ? 'w' + (Math.floor(a.t * 10) % 4) : 'p'] };
    }
    if (S.kind === 'hero' && st.moving && (d === 'left' || d === 'right')) return `${S.base}_${d}_w${Math.floor(a.t * 9) % 4}`;
    const f = st.moving ? Math.floor(a.t * 8.5) % 2 : 0;                 // passo mais rápido (6 parecia arrastar)
    return `${S.base}_${d}_${f}`;
  }

  function update(a, dt, st) {
    a.t += dt;
    // direção em relação à câmera
    a.root.getWorldPosition(_w);
    let screenRight = false;
    if (typeof camera !== 'undefined') {
      const A = Math.atan2(camera.position.x - _w.x, camera.position.z - _w.z);
      const rel = norm((st.face ?? 0) - A);
      // direção com folga (pedido do Rone: "vira de lado toda errada"): perto da divisa entre duas direções o desenho ficava
      // trocando sem parar; agora só troca quando a virada passa da divisa com sobra
      const alvo = Math.abs(rel) < Math.PI / 4 ? 'down' : Math.abs(rel) > Math.PI * 3 / 4 ? 'up' : rel > 0 ? 'right' : 'left';
      if (alvo !== a.dir) { const C = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 }, longe = Math.abs(norm(rel - C[a.dir]));
        if (longe > Math.PI / 4 + 0.18 || !(a.dir in C)) a.dir = alvo; }
      screenRight = rel > 0.15 && rel < Math.PI - 0.15;
    }
    const n = pick(a, st), ex = expressao(a, st, dt), novo = typeof n === 'object';
    const t = (novo ? quadro(n.q[0], n.q[1], n.q[2], ex) : tex(n)) || a.mat.map;
    if (t && a.mat.map !== t) { a.mat.map = t; a.mat.needsUpdate = true; }
    if (!t) return;
    const w = t.userData.w * a.px, h = t.userData.h * a.px;
    let sx = w, sy = h;
    if (a.set.kind === 'one' && (a.opt.faceRight ? !screenRight : screenRight)) sx = -w;
    // golpe: estica e avança um pouco; andar: balanço; flutuar
    const atk = st.atk || 0;
    const lunge = Math.sin(Math.min(1, atk) * Math.PI);
    if (!novo) { sx *= 1 + lunge * 0.12; sy *= 1 - lunge * 0.05; }              // os heróis já têm a pose do golpe (esticar deformava)
    let y = 0;
    if (a.opt.float) y += 0.35 + Math.sin(a.t * 2.4) * 0.18;
    else if (st.moving && a.set.kind === 'one') { const fq = st.freq || 9, am = Math.min(st.amp ?? 0.05, 0.06), ph = Math.sin(a.t * fq); y += Math.abs(ph) * am * a.h; sy *= 1 - Math.abs(ph) * am * 0.4; a.mat.rotation = ph * 0.035; }   // passinho com balanço (era um pulo de 14% da altura: "pulando muito Atari")
    else if (st.moving && novo) { a.mat.rotation = 0; }                           // o passo já sobe e desce no próprio quadro
    else if (st.moving) { const ph = Math.sin(a.t * 17); y += Math.abs(ph) * 0.035 * a.h; sy *= 1 - Math.abs(ph) * 0.025; a.mat.rotation = 0; }   // sem inclinar (parecia torto)   // personagem: sobe e desce a cada passo (antes deslizava)   // pulinhos de quem anda (desenho de um quadro só)
    else if (!st.moving) { sy *= 1 + Math.sin(a.t * 2.2) * 0.012; if (!st.dead) a.mat.rotation *= 0.8; }          // respiração
    if (st.sleeping) sy *= 0.92 + Math.sin(a.t * 0.8) * 0.02;
    if (st.sit) sy *= 0.78;
    if (st.jump) y += st.jump;
    a.spr.scale.set(sx, sy, 1);
    // morte: deita e some
    if (st.dead) { a.mat.rotation = lerpA(a.mat.rotation, Math.PI / 2 * (sx < 0 ? -1 : 1), dt * 8); }
    else a.mat.rotation = lerpA(a.mat.rotation, st.moving && a.set.kind === 'one' && !a.opt.float ? Math.sin(a.t * (st.freq || 9)) * 0.03 : 0, dt * 10);   // gingado bem leve (era até 7,5° de cada lado e deixava os bichos tortos)
    a.spr.center.set(0.5, st.dead ? 0.15 : 0);
    a.spr.position.y = y;
    if (st.gy !== undefined) a.shadow.position.y = st.gy + 0.03;
    a.shadow.visible = !st.dead && a.opt.shadow !== false && !(st.jump > 1);   // montado: a sombra é a da montaria
    // cor: luz da região, golpe recebido, sono
    a.tint.copy(light);
    if (st.sleeping) a.tint.multiplyScalar(0.35);
    if (st.dourado) a.tint.lerp(_OURO.setRGB(1.3, 1.1, 0.6), st.dourado > 1 ? 0.5 : 0.25);   // Irmandade Eterna: corpo dourado
    if (st.fury && a.mat.map !== tex(a.set.base + '_furia')) a.tint.lerp(_FURIA.setRGB(1.4, 0.45, 0.45), 0.45);
    if (st.flash) a.tint.setRGB(1, 0.35, 0.35);
    if (st.beam) a.tint.lerp(new THREE.Color(1, 0.4, 0.4), Math.min(1, st.beam));
    a.mat.color.copy(a.tint);
    const op = st.fade ?? 1;
    a.mat.transparent = op < 1; a.mat.opacity = op;
    // silhueta dourada por cima (funciona até com roupa preta): mesma imagem, pintada de ouro e somada à luz
    const brilho = st.dourado ? 0xffb428 : st.traje;                 // dourado da Irmandade ou a cor do traje de classe
    if (brilho && !st.dead) {
      if (!a.ouro) { const m = new THREE.SpriteMaterial({ color: 0xffb428, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
        m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = diffuse;'); };
        a.ouro = new THREE.Sprite(m); a.ouro.renderOrder = 2; a.root.add(a.ouro); }
      a.ouro.visible = true; if (a.ouroCor !== brilho) { a.ouroCor = brilho; a.ouro.material.color.setHex(brilho); } a.ouro.material.map = a.mat.map; a.ouro.center.copy(a.spr.center); a.ouro.scale.copy(a.spr.scale); a.ouro.position.copy(a.spr.position); a.ouro.material.rotation = a.mat.rotation;
      a.ouro.material.opacity = (st.dourado > 1 ? 0.36 : st.dourado ? 0.15 : st.trajeK || 0.22) * (0.75 + Math.sin(a.t * 3) * 0.25) * op;
    } else if (a.ouro) a.ouro.visible = false;
  }
  const lerpA = (c, t, k) => c + (t - c) * Math.min(1, k);

  // ---------------- efeitos de sprite (garra, espinhos, raio, explosão, orbe)
  // o: { x, y, z, h (altura), life, rise, flip, from/to (raio entre dois pontos), color }
  function fx(name, o) {
    const t = tex(name); if (!t) return null;
    const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: true, toneMapped: false });
    if (o.color !== undefined) m.color.set(o.color);
    const s = new THREE.Sprite(m); s.renderOrder = 5;
    const h = o.h || 2, w = h * t.userData.w / t.userData.h;
    s.scale.set(o.flip ? -w : w, h, 1);
    if (o.bottom) s.center.set(0.5, 0);
    s.position.set(o.x, o.y, o.z); scene.add(s);
    const f = { s, m, life: o.life || 0.45, max: o.life || 0.45, rise: o.rise || 0, w, h, grow: o.grow || 0, beam: o.from ? { from: o.from.clone(), to: o.to.clone() } : null };
    if (f.beam) placeBeam(f);
    fxs.push(f);
    return f;
  }
  function placeBeam(f) {
    const { from, to } = f.beam;
    f.s.position.copy(from).add(to).multiplyScalar(0.5);
    const a = from.clone().project(camera), b = to.clone().project(camera);
    const ang = Math.atan2((b.y - a.y) * (typeof VH !== 'undefined' ? VH : innerHeight), (b.x - a.x) * (typeof VW !== 'undefined' ? VW : innerWidth));
    f.m.rotation = ang;
    const len = from.distanceTo(to);
    f.s.scale.set(len, f.h, 1);
  }
  function tick(dt) {
    for (const f of fxs) {
      f.life -= dt;
      const k = Math.max(0, f.life / f.max);
      f.m.opacity = Math.min(1, k * 2.2);
      f.s.position.y += f.rise * dt;
      if (f.grow) f.s.scale.multiplyScalar(1 + f.grow * dt);
      if (f.beam) placeBeam(f);
    }
    for (let i = fxs.length - 1; i >= 0; i--) if (fxs[i].life <= 0) { scene.remove(fxs[i].s); fxs[i].m.dispose(); fxs.splice(i, 1); }
  }

  return { quadro,
    load, actor, fx, tick, tex, has, light, addCanvas,
    get ready() { return ready; },
    setLight(v) { light.setScalar(v); },
  };
})();
