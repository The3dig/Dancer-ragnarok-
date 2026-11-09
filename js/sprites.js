// =====================================================================
//  Arte procedural — tudo desenhado em código (personagens originais)
// =====================================================================
const TAU = Math.PI * 2;
function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function shade(hex, amt) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(v => v + v).join('');
  const n = parseInt(c, 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function ell(g, x, y, rx, ry, fill) { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); }
function circ(g, x, y, r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }

// ---------------------------------------------------------------- chão
function drawTile(g, ch, X, Y, tx, ty, base) {
  const h1 = hash(tx, ty), h2 = hash(tx, ty, 1), h3 = hash(tx, ty, 2);
  const T = TILE;
  const under = { T: base, P: base, C: base, R: base, B: 'g', x: 'g' }[ch];
  if (under) { drawTile(g, under, X, Y, tx, ty, base); }
  switch (ch) {
    case 'g': case 'f': {
      g.fillStyle = `hsl(${100 + h1 * 12},${42 + h2 * 8}%,${42 + h3 * 6}%)`; g.fillRect(X, Y, T, T);
      g.strokeStyle = 'rgba(30,80,20,.35)'; g.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const px = X + hash(tx, ty, 10 + i) * T, py = Y + hash(tx, ty, 20 + i) * T;
        g.beginPath(); g.moveTo(px, py); g.lineTo(px - 1, py - 4); g.moveTo(px, py); g.lineTo(px + 2, py - 3); g.stroke();
      }
      if (ch === 'f') {
        const cols = ['#fff', '#ffd84a', '#ff7eb6', '#b48cff', '#ff6b5b'];
        for (let i = 0; i < 3; i++) {
          const px = X + 4 + hash(tx, ty, 30 + i) * (T - 8), py = Y + 4 + hash(tx, ty, 40 + i) * (T - 8);
          const c = cols[Math.floor(hash(tx, ty, 50 + i) * cols.length)];
          for (let k = 0; k < 4; k++) circ(g, px + Math.cos(k * TAU / 4) * 2, py + Math.sin(k * TAU / 4) * 2, 1.6, c);
          circ(g, px, py, 1.2, '#ffcc00');
        }
      }
      break;
    }
    case 'p': {
      g.fillStyle = `hsl(33,${38 + h1 * 6}%,${50 + h2 * 5}%)`; g.fillRect(X, Y, T, T);
      for (let i = 0; i < 5; i++) circ(g, X + hash(tx, ty, 60 + i) * T, Y + hash(tx, ty, 70 + i) * T, 1.3, 'rgba(90,60,30,.35)');
      break;
    }
    case 'c': {
      g.fillStyle = '#8f8a82'; g.fillRect(X, Y, T, T);
      const off = (ty % 2) * 8;
      for (let j = 0; j < 2; j++) for (let i = -1; i < 2; i++) {
        const sx = X + i * 16 + (j ? off : 0) + 1, sy = Y + j * 16 + 1;
        const l = 62 + hash(tx * 3 + i, ty * 3 + j) * 12;
        g.fillStyle = `hsl(35,8%,${l}%)`;
        g.beginPath(); g.roundRect(Math.max(X, sx), sy, Math.min(14, X + T - Math.max(X, sx)), 14, 3); g.fill();
      }
      break;
    }
    case 'k': {
      g.fillStyle = `hsl(36,${48 + h1 * 6}%,${70 + h2 * 4}%)`; g.fillRect(X, Y, T, T);
      g.strokeStyle = 'rgba(140,100,50,.35)'; g.strokeRect(X + .5, Y + .5, T - 1, T - 1);
      if (h3 < 0.2) { g.strokeStyle = 'rgba(180,80,40,.35)'; g.strokeRect(X + 8.5, Y + 8.5, 15, 15); }
      break;
    }
    case 'w': {
      g.fillStyle = `hsl(205,${62 + h1 * 6}%,${48 + h2 * 4}%)`; g.fillRect(X, Y, T, T);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        const px = X + 4 + hash(tx, ty, 80 + i) * 18, py = Y + 6 + i * 13 + h3 * 4;
        g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + 4, py - 3, px + 8, py); g.stroke();
      }
      break;
    }
    case 'b': {
      g.fillStyle = '#3d86c6'; g.fillRect(X, Y, T, T);
      g.fillStyle = '#8b5a2b'; g.fillRect(X, Y, T, T);
      g.strokeStyle = '#5e3a17'; g.lineWidth = 1;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(X + i * 8 + .5, Y); g.lineTo(X + i * 8 + .5, Y + T); g.stroke(); }
      break;
    }
    case 'h': {
      g.fillStyle = `hsl(45,${70 + h1 * 10}%,${52 + h2 * 6}%)`; g.fillRect(X, Y, T, T);
      g.strokeStyle = 'rgba(150,100,10,.6)'; g.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const px = X + 2 + i * 4.3 + hash(tx, ty, 90 + i) * 2, py = Y + T - 2;
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + 1, py - 18 - hash(tx, ty, 95 + i) * 8); g.stroke();
        ell(g, px + 1, py - 20 - hash(tx, ty, 95 + i) * 8, 1.4, 3, '#e6b422');
      }
      break;
    }
    case 's': case 'd': {
      const L = ch === 's' ? 74 : 66;
      g.fillStyle = `hsl(${32 + h1 * 6},${55 + h2 * 8}%,${L + h3 * 4}%)`; g.fillRect(X, Y, T, T);
      g.strokeStyle = 'rgba(150,90,40,.22)'; g.lineWidth = 1;
      const py = Y + 8 + h1 * 16;
      g.beginPath(); g.moveTo(X, py); g.quadraticCurveTo(X + 16, py - 4, X + T, py); g.stroke();
      break;
    }
    case 'R': {
      ell(g, X + 16, Y + 26, 14, 5, 'rgba(0,0,0,.25)');
      g.fillStyle = '#8a7f74';
      g.beginPath(); g.moveTo(X + 3, Y + 26); g.lineTo(X + 7, Y + 10); g.lineTo(X + 18, Y + 5); g.lineTo(X + 28, Y + 12); g.lineTo(X + 30, Y + 26); g.closePath(); g.fill();
      g.fillStyle = '#a89c90';
      g.beginPath(); g.moveTo(X + 8, Y + 11); g.lineTo(X + 18, Y + 6); g.lineTo(X + 22, Y + 14); g.lineTo(X + 10, Y + 18); g.closePath(); g.fill();
      break;
    }
    case 'B': {
      ell(g, X + 16, Y + 26, 13, 5, 'rgba(0,0,0,.25)');
      circ(g, X + 10, Y + 18, 9, '#2f6b2a'); circ(g, X + 22, Y + 18, 9, '#2f6b2a'); circ(g, X + 16, Y + 12, 10, '#3d8a35');
      circ(g, X + 13, Y + 10, 3, '#5aa84a');
      if (h1 < 0.5) { circ(g, X + 9, Y + 16, 2, '#e74c3c'); circ(g, X + 21, Y + 13, 2, '#e74c3c'); }
      break;
    }
    case 'x': {
      g.fillStyle = '#7a5230';
      g.fillRect(X, Y + 14, T, 3); g.fillRect(X, Y + 22, T, 3);
      g.fillRect(X + 3, Y + 8, 4, 20); g.fillRect(X + 19, Y + 8, 4, 20);
      break;
    }
  }
}

function drawDecor(g, d) {
  const X = d.x * TILE, Y = d.y * TILE, W = d.w * TILE, H = d.h * TILE;
  if (d.kind === 'fountain') {
    const cx = X + W / 2, cy = Y + H / 2;
    ell(g, cx, cy + 6, W / 2, H / 2 - 4, 'rgba(0,0,0,.25)');
    ell(g, cx, cy, W / 2 - 2, H / 2 - 8, '#b9b3a8');
    ell(g, cx, cy - 3, W / 2 - 8, H / 2 - 14, '#4a9ae0');
    ell(g, cx, cy - 3, W / 2 - 14, H / 2 - 22, '#6ab8f0');
    g.fillStyle = '#c9c3b8'; g.fillRect(cx - 6, cy - 28, 12, 26);
    ell(g, cx, cy - 28, 16, 6, '#d6d0c5');
    ell(g, cx, cy - 29, 12, 4, '#6ab8f0');
  } else if (d.kind === 'ruins') {
    for (let i = 0; i < 5; i++) {
      const px = X + i * (W / 5) + 10, hh = 30 + hash(i, 3) * 40;
      g.fillStyle = '#b07a4a'; g.fillRect(px, Y + H - hh, 18, hh);
      g.fillStyle = '#c9925a'; g.fillRect(px, Y + H - hh, 6, hh);
      g.fillStyle = '#8a5a32'; g.fillRect(px - 3, Y + H - hh - 6, 24, 6);
    }
  }
}

// ---------------------------------------------------------------- objetos altos
const spriteCache = {};
function tallSprite(ch, variant) {
  const key = ch + variant;
  if (spriteCache[key]) return spriteCache[key];
  const c = document.createElement('canvas'); c.width = 64; c.height = 88;
  const g = c.getContext('2d');
  const bx = 32, by = 80;
  if (ch === 'T') {
    const hue = 100 + variant * 15;
    ell(g, bx, by, 18, 6, 'rgba(0,0,0,.28)');
    g.fillStyle = '#6b4423'; g.fillRect(bx - 4, by - 26, 8, 26);
    const blob = [[0, -40, 20], [-12, -32, 14], [12, -32, 14], [-8, -52, 13], [9, -50, 13], [0, -60, 11]];
    for (const [x, y, r] of blob) circ(g, bx + x, by + y, r, `hsl(${hue},45%,28%)`);
    for (const [x, y, r] of blob) circ(g, bx + x - 2, by + y - 2, r - 3, `hsl(${hue},50%,36%)`);
    for (const [x, y, r] of blob.slice(3)) circ(g, bx + x - 4, by + y - 4, r - 7, `hsl(${hue},55%,46%)`);
  } else if (ch === 'P') {
    ell(g, bx, by, 14, 5, 'rgba(0,0,0,.28)');
    g.strokeStyle = '#8b6b3d'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + 6 - variant * 4, by - 30, bx + 2, by - 58); g.stroke();
    g.strokeStyle = '#6b4f2a'; g.lineWidth = 1;
    for (let i = 1; i < 9; i++) { const y = by - i * 6.5; g.beginPath(); g.moveTo(bx - 3, y); g.lineTo(bx + 5, y - 1); g.stroke(); }
    const tx = bx + 2, ty = by - 60;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.55;
      g.strokeStyle = i % 2 ? '#2e8b3a' : '#3fae4a'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(tx, ty);
      g.quadraticCurveTo(tx + Math.cos(a) * 18, ty + Math.sin(a) * 18 - 6, tx + Math.cos(a) * 28, ty + Math.sin(a) * 28 + 14);
      g.stroke();
    }
    circ(g, tx - 3, ty + 4, 3, '#7a4a1a'); circ(g, tx + 3, ty + 5, 3, '#7a4a1a');
  } else if (ch === 'C') {
    ell(g, bx, by, 10, 4, 'rgba(0,0,0,.28)');
    g.fillStyle = '#3f8f4a';
    g.beginPath(); g.roundRect(bx - 6, by - 40, 12, 40, 6); g.fill();
    g.beginPath(); g.roundRect(bx - 17, by - 30, 7, 16, 4); g.fill(); g.fillRect(bx - 14, by - 18, 9, 5);
    g.beginPath(); g.roundRect(bx + 10, by - 34, 7, 18, 4); g.fill(); g.fillRect(bx + 5, by - 20, 9, 5);
    g.strokeStyle = '#2f6f3a'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(bx - 2, by - 38); g.lineTo(bx - 2, by - 2); g.moveTo(bx + 2, by - 38); g.lineTo(bx + 2, by - 2); g.stroke();
    if (variant === 1) circ(g, bx, by - 41, 3, '#ff5fa2');
  }
  spriteCache[key] = c;
  return c;
}

function drawHouse(g, h, t) {
  const X = h.x * TILE, Y = h.y * TILE, W = h.w * TILE, H = h.h * TILE;
  const front = 44;
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X + 4, Y + H - 4, W, 8);
  if (h.style === 'tent') {
    g.fillStyle = '#6b4a2a'; g.fillRect(X + 2, Y + 8, 4, H - 8); g.fillRect(X + W - 6, Y + 8, 4, H - 8);
    g.fillStyle = '#d9c39a'; g.fillRect(X + 6, Y + H - 22, W - 12, 18);
    // mercadorias
    for (let i = 0; i < 5; i++) circ(g, X + 14 + i * 16, Y + H - 24, 6, ['#e74c3c', '#f1c40f', '#27ae60', '#e67e22', '#9b59b6'][i]);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? '#f5f0e0' : h.roof;
      g.beginPath();
      g.moveTo(X - 4 + i * (W + 8) / 6, Y + 12); g.lineTo(X - 4 + (i + 1) * (W + 8) / 6, Y + 12);
      g.lineTo(X - 4 + (i + 1) * (W + 8) / 6, Y - 14); g.lineTo(X - 4 + i * (W + 8) / 6, Y - 14); g.fill();
    }
    g.fillStyle = h.roof;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(X - 4 + (i + .5) * (W + 8) / 6, Y + 12, (W + 8) / 12, 0, Math.PI); g.fill(); }
    return;
  }
  if (h.style === 'sand') {
    g.fillStyle = shade(h.roof, -25); g.fillRect(X, Y + H - front, W, front);
    g.fillStyle = h.roof; g.fillRect(X, Y - 12, W, H - front + 12);
    g.fillStyle = shade(h.roof, 15); g.fillRect(X, Y - 12, W, 5);
    g.fillStyle = shade(h.roof, -50);
    for (let i = 0; i < W / 16; i++) g.fillRect(X + i * 16 + 4, Y + H - front - 2, 8, 4);
    if (h.dome) {
      const cx = X + W / 2, cy = Y + (H - front) / 2;
      g.fillStyle = h.dome; g.beginPath(); g.arc(cx, cy, 18, Math.PI, 0); g.fill();
      g.fillRect(cx - 18, cy, 36, 6);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(cx - 5, cy - 8, 5, 0, TAU); g.fill();
      g.fillStyle = '#f5c518'; g.fillRect(cx - 1, cy - 26, 2, 9); circ(g, cx, cy - 27, 3, '#f5c518');
    }
    // porta arqueada e janelas
    const dx = X + W / 2 - 10;
    g.fillStyle = '#5a3a1a'; g.beginPath(); g.moveTo(dx, Y + H); g.lineTo(dx, Y + H - 20); g.arc(dx + 10, Y + H - 20, 10, Math.PI, 0); g.lineTo(dx + 20, Y + H); g.fill();
    g.fillStyle = '#2a3a5a';
    [X + 14, X + W - 26].forEach(wx => { g.beginPath(); g.moveTo(wx, Y + H - 14); g.lineTo(wx, Y + H - 26); g.arc(wx + 6, Y + H - 26, 6, Math.PI, 0); g.lineTo(wx + 12, Y + H - 14); g.fill(); });
    return;
  }
  // madeira (Solmira) e celeiro
  const wall = h.style === 'barn' ? '#b5523a' : '#f0e2c4';
  g.fillStyle = wall; g.fillRect(X, Y + H - front, W, front);
  g.fillStyle = shade(wall.startsWith('#') ? wall : '#f0e2c4', -30);
  g.fillRect(X, Y + H - front, 4, front); g.fillRect(X + W - 4, Y + H - front, 4, front);
  if (h.style !== 'barn') { g.fillRect(X, Y + H - front, W, 3); }
  // telhado
  const rTop = Y - 22, rBot = Y + H - front + 6;
  g.fillStyle = shade(h.roof, -30);
  g.beginPath(); g.moveTo(X - 6, rBot); g.lineTo(X + 8, rTop); g.lineTo(X + W - 8, rTop); g.lineTo(X + W + 6, rBot); g.fill();
  g.fillStyle = h.roof;
  g.beginPath(); g.moveTo(X - 2, rBot - 5); g.lineTo(X + 10, rTop + 4); g.lineTo(X + W - 10, rTop + 4); g.lineTo(X + W + 2, rBot - 5); g.fill();
  g.strokeStyle = shade(h.roof, -45); g.lineWidth = 1;
  for (let y = rTop + 12; y < rBot - 4; y += 9) { g.beginPath(); g.moveTo(X + 2, y); g.lineTo(X + W - 2, y); g.stroke(); }
  // chaminé
  if (h.style !== 'barn') {
    g.fillStyle = '#8a6a5a'; g.fillRect(X + W - 30, rTop - 10, 12, 18);
    const s = (t * 0.6 + h.x) % 1;
    circ(g, X + W - 24 + Math.sin(t * 2 + h.x) * 3, rTop - 16 - s * 20, 4 + s * 5, `rgba(220,220,220,${0.5 - s * 0.5})`);
  }
  // porta e janelas
  g.fillStyle = h.style === 'barn' ? '#5a2a1a' : '#7a4a22';
  const dw = h.style === 'barn' ? 30 : 16;
  g.fillRect(X + W / 2 - dw / 2, Y + H - 26, dw, 26);
  if (h.style === 'barn') { g.strokeStyle = '#f0e2c4'; g.lineWidth = 2; g.beginPath(); g.moveTo(X + W / 2 - 15, Y + H - 26); g.lineTo(X + W / 2 + 15, Y + H); g.moveTo(X + W / 2 + 15, Y + H - 26); g.lineTo(X + W / 2 - 15, Y + H); g.stroke(); }
  else {
    circ(g, X + W / 2 + 4, Y + H - 13, 1.5, '#e0c060');
    g.fillStyle = '#7fb6e0';
    [X + 12, X + W - 28].forEach(wx => { g.fillRect(wx, Y + H - 32, 16, 13); });
    g.strokeStyle = '#7a4a22'; g.lineWidth = 2;
    [X + 12, X + W - 28].forEach(wx => { g.strokeRect(wx, Y + H - 32, 16, 13); g.beginPath(); g.moveTo(wx + 8, Y + H - 32); g.lineTo(wx + 8, Y + H - 19); g.stroke(); });
    g.fillStyle = '#e05a7a';
    [X + 12, X + W - 28].forEach(wx => { for (let i = 0; i < 4; i++) circ(g, wx + 2 + i * 4, Y + H - 18, 2, i % 2 ? '#e05a7a' : '#f5c518'); });
  }
}

// ---------------------------------------------------------------- dançarina (personagem original)
//  Cabelo coral, roupa azul-turquesa com detalhes dourados e fita de seda magenta.
function drawDancer(g, x, y, o) {
  const t = o.t;
  g.save(); g.translate(x, y);
  ell(g, 0, 0, 13, 5, 'rgba(0,0,0,.3)');
  if (o.dead) { g.rotate(-Math.PI / 2); g.translate(8, -4); }
  let sx = o.dir < 0 ? -1 : 1;
  if (o.dance > 0) sx *= Math.cos(o.dance * TAU * 2) || 0.01;
  const bob = o.sit ? 10 : (o.walk ? Math.abs(Math.sin(t * 11)) * 2 : Math.sin(t * 2.5) * 0.7);
  const jump = o.dance > 0 ? Math.sin(o.dance * Math.PI) * 10 : 0;
  g.translate(0, -bob - jump + (o.sit ? 0 : 0));
  g.scale(sx, 1);
  const skin = '#ffd9be', hair = '#ff7b6b', hairD = '#d9534f', cloth = '#1fb5a8', clothD = '#13887e', gold = '#ffcf40', silk = '#ff4fa3';
  const sw = o.walk ? Math.sin(t * 11) : 0;

  // fita de seda (atrás)
  g.strokeStyle = silk; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath();
  const ribbonAmp = o.dance > 0 ? 10 : 4;
  for (let i = 0; i <= 14; i++) {
    const px = -4 - i * 2.4, py = -24 + Math.sin(t * 5 + i * 0.6) * ribbonAmp * (i / 14) + i * 0.8;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.stroke();

  // rabo de cavalo (atrás)
  g.fillStyle = hairD;
  g.beginPath(); g.moveTo(-4, -42);
  g.quadraticCurveTo(-16 - sw * 2, -34 + Math.sin(t * 3) * 2, -12 - Math.sin(t * 4) * 2, -18);
  g.quadraticCurveTo(-10, -30, -2, -38); g.fill();

  if (!o.sit) {
    // pernas
    g.fillStyle = skin;
    g.save(); g.translate(-3, -14); g.rotate(sw * 0.4); g.fillRect(-2, 0, 4, 14); g.restore();
    g.save(); g.translate(3, -14); g.rotate(-sw * 0.4); g.fillRect(-2, 0, 4, 14); g.restore();
    g.fillStyle = gold;
    g.save(); g.translate(-3, -14); g.rotate(sw * 0.4); g.fillRect(-2.5, 10, 5, 2); g.fillStyle = clothD; g.fillRect(-2.5, 13, 6, 2.5); g.restore();
    g.save(); g.translate(3, -14); g.rotate(-sw * 0.4); g.fillStyle = gold; g.fillRect(-2.5, 10, 5, 2); g.fillStyle = clothD; g.fillRect(-2.5, 13, 6, 2.5); g.restore();
  } else {
    g.fillStyle = skin; g.fillRect(-2, -14, 12, 4); g.fillRect(-4, -12, 12, 4);
  }
  // saia esvoaçante
  const flare = o.dance > 0 ? 6 : (o.walk ? 2 : 0);
  g.fillStyle = cloth;
  g.beginPath(); g.moveTo(-5, -22);
  g.lineTo(-10 - flare + Math.sin(t * 6) * 1, -10); g.quadraticCurveTo(0, -8 + Math.sin(t * 8), 10 + flare + Math.sin(t * 6 + 1), -10);
  g.lineTo(5, -22); g.fill();
  g.fillStyle = clothD;
  g.beginPath(); g.moveTo(-2, -22); g.lineTo(-5 - flare / 2, -9); g.lineTo(1, -9); g.fill();
  g.strokeStyle = gold; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(-10 - flare, -10); g.quadraticCurveTo(0, -8, 10 + flare, -10); g.stroke();
  // cinto
  g.fillStyle = gold; g.fillRect(-5.5, -23, 11, 2.5);
  circ(g, 0, -21.5, 1.6, silk);
  // barriga + top
  g.fillStyle = skin; g.fillRect(-4.5, -26, 9, 3.5);
  g.fillStyle = cloth;
  g.beginPath(); g.roundRect(-5.5, -32, 11, 6.5, 2); g.fill();
  g.fillStyle = gold; g.fillRect(-5.5, -26.5, 11, 1.2);
  // braços
  const armUp = o.dance > 0 || o.attack > 0;
  g.strokeStyle = skin; g.lineWidth = 3;
  if (armUp) {
    const a = o.attack > 0 ? (1 - o.attack) * 2.2 - 1.2 : Math.sin(t * 12);
    g.beginPath(); g.moveTo(4, -30); g.lineTo(10 + Math.cos(a) * 3, -36 + Math.sin(a) * 6); g.stroke();
    g.beginPath(); g.moveTo(-4, -30); g.lineTo(-9, -40 + Math.sin(t * 12 + 1) * 3); g.stroke();
    // chicote / fita no ataque
    if (o.attack > 0) {
      g.strokeStyle = silk; g.lineWidth = 2;
      g.beginPath(); g.moveTo(11, -36);
      const reach = 18 + (1 - o.attack) * 22;
      g.quadraticCurveTo(reach * 0.6, -48 + o.attack * 20, reach, -20 + o.attack * 6); g.stroke();
    }
  } else {
    g.beginPath(); g.moveTo(4.5, -30); g.lineTo(6 + sw * 1.5, -21); g.stroke();
    g.beginPath(); g.moveTo(-4.5, -30); g.lineTo(-6 - sw * 1.5, -21); g.stroke();
  }
  g.fillStyle = gold; g.fillRect(5, -25, 2.5, 2); g.fillRect(-7.5, -25, 2.5, 2);
  // cabeça
  g.fillStyle = skin; g.fillRect(-1.5, -35, 3, 3);
  circ(g, 0, -40, 7, skin);
  // cabelo
  g.fillStyle = hair;
  g.beginPath(); g.arc(-0.5, -41.5, 7.6, Math.PI * 0.95, Math.PI * 2.1); g.fill();
  g.beginPath(); g.moveTo(-7.5, -42); g.quadraticCurveTo(-8.5, -36, -6, -33); g.lineTo(-4, -40); g.fill();
  g.beginPath(); g.moveTo(1, -47); g.quadraticCurveTo(7, -45, 7.5, -40); g.lineTo(3, -42); g.fill();
  circ(g, -6, -46, 3.3, hairD);
  // flor no cabelo
  for (let k = 0; k < 5; k++) circ(g, -6 + Math.cos(k * TAU / 5) * 2.2, -47 + Math.sin(k * TAU / 5) * 2.2, 1.6, '#fff4a8');
  circ(g, -6, -47, 1.2, silk);
  // rosto
  if (!o.dead) {
    circ(g, 3.5, -40, 1.3, '#3a2a4a');
    g.fillStyle = '#fff'; g.fillRect(3.6, -41, 0.8, 0.8);
    circ(g, 4.6, -37, 1.4, 'rgba(255,120,120,.4)');
    g.strokeStyle = '#a0505a'; g.lineWidth = 0.8;
    g.beginPath(); g.arc(4.6, -36.8, 1.2, 0.2, Math.PI - 0.6); g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------- NPCs
function drawNPC(g, x, y, look, t) {
  g.save(); g.translate(x, y);
  ell(g, 0, 0, 12, 5, 'rgba(0,0,0,.3)');
  const b = Math.sin(t * 2 + x) * 0.6;
  g.translate(0, -b);
  g.fillStyle = shade(look.cloth, -40); g.fillRect(-4, -12, 3, 12); g.fillRect(1, -12, 3, 12);
  g.fillStyle = look.cloth;
  g.beginPath(); g.moveTo(-7, -10); g.lineTo(-6, -30); g.lineTo(6, -30); g.lineTo(7, -10); g.fill();
  g.fillStyle = look.trim; g.fillRect(-7, -12, 14, 2); g.fillRect(-1, -30, 2, 18);
  g.fillStyle = '#f3cfae'; circ(g, 0, -37, 7, '#f3cfae');
  g.fillStyle = look.hair;
  g.beginPath(); g.arc(0, -38.5, 7.4, Math.PI, 0); g.fill();
  circ(g, -2.5, -37, 1.1, '#222'); circ(g, 2.5, -37, 1.1, '#222');
  switch (look.hat) {
    case 'veil': g.fillStyle = look.trim; g.beginPath(); g.moveTo(-9, -28); g.quadraticCurveTo(-10, -48, 0, -47); g.quadraticCurveTo(10, -48, 9, -28); g.lineTo(6, -36); g.quadraticCurveTo(0, -46, -6, -36); g.fill(); break;
    case 'cap': g.fillStyle = look.trim; g.beginPath(); g.arc(0, -42, 7, Math.PI, 0); g.fill(); g.fillRect(-1, -44, 10, 2.5); break;
    case 'helm': g.fillStyle = '#aab'; g.beginPath(); g.arc(0, -40, 8, Math.PI, 0); g.fill(); g.fillStyle = '#d33'; g.fillRect(-1, -54, 2, 8); break;
    case 'flower': for (let k = 0; k < 5; k++) circ(g, 5 + Math.cos(k * TAU / 5) * 2.4, -44 + Math.sin(k * TAU / 5) * 2.4, 1.8, '#ff8ac0'); circ(g, 5, -44, 1.3, '#ffd700'); break;
    case 'straw': ell(g, 0, -43, 13, 3.5, '#e8c766'); g.fillStyle = '#e8c766'; g.beginPath(); g.arc(0, -44, 7, Math.PI, 0); g.fill(); g.fillStyle = '#c0392b'; g.fillRect(-7, -45, 14, 2); break;
    case 'turban': ell(g, 0, -44, 9, 6, look.trim); circ(g, 0, -46, 2, '#c0392b'); break;
  }
  g.restore();
}

// ---------------------------------------------------------------- monstros originais
function drawMob(g, m, t) {
  const x = m.x, y = m.y;
  g.save(); g.translate(x, y);
  const flash = m.hitFlash > 0;
  const fl = m.dir < 0 ? -1 : 1;
  switch (m.type) {
    case 'pompom': {
      const sq = Math.abs(Math.sin(t * 6 + m.seed));
      ell(g, 0, 0, 12, 4, 'rgba(0,0,0,.3)');
      g.translate(0, -sq * 6);
      const c = flash ? '#fff' : '#ff9ec7';
      for (let i = 0; i < 10; i++) circ(g, Math.cos(i * TAU / 10) * 9, -11 + Math.sin(i * TAU / 10) * (8 - sq), 5, shade('#ff9ec7', -20));
      ell(g, 0, -11, 11, 10 - sq * 1.5, c);
      ell(g, -3, -15, 4, 3, 'rgba(255,255,255,.6)');
      circ(g, -3 * fl + 1, -11, 1.6, '#333'); circ(g, 4 * fl, -11, 1.6, '#333');
      circ(g, 0.5 * fl, -7.5, 1.4, '#d0507a');
      g.fillStyle = '#7ad36a'; g.beginPath(); g.ellipse(2, -22, 3, 6, 0.5, 0, TAU); g.fill();
      break;
    }
    case 'zunzum': {
      ell(g, 0, 0, 8, 3, 'rgba(0,0,0,.25)');
      const hov = 20 + Math.sin(t * 5 + m.seed) * 4;
      g.translate(0, -hov); g.scale(fl, 1);
      const wing = Math.abs(Math.sin(t * 40)) * 6 + 3;
      ell(g, -2, -8, 5, wing, 'rgba(220,240,255,.7)'); ell(g, 3, -8, 5, wing, 'rgba(220,240,255,.6)');
      ell(g, 0, 0, 10, 7, flash ? '#fff' : '#f4c430');
      g.fillStyle = '#2a2a2a'; g.fillRect(-4, -6, 3, 12); g.fillRect(2, -6, 3, 12);
      g.fillStyle = '#2a2a2a'; g.beginPath(); g.moveTo(-10, 0); g.lineTo(-15, 2); g.lineTo(-10, 3); g.fill();
      circ(g, 8, -2, 4.5, flash ? '#fff' : '#f4c430'); circ(g, 9.5, -3, 1.4, '#000');
      break;
    }
    case 'fungolino': {
      const w = Math.sin(t * 8 + m.seed) * (m.moving ? 2 : 0);
      ell(g, 0, 0, 12, 4, 'rgba(0,0,0,.3)');
      g.fillStyle = '#f2e6d0'; g.fillRect(-3 + w, -4, 3, 4); g.fillRect(1 - w, -4, 3, 4);
      g.fillStyle = flash ? '#fff' : '#f7ecd8'; g.beginPath(); g.roundRect(-7, -16, 14, 13, 5); g.fill();
      circ(g, -2.5 * fl + 1, -10, 1.5, '#333'); circ(g, 3 * fl, -10, 1.5, '#333');
      const cap = flash ? '#fff' : '#d64545';
      g.fillStyle = cap; g.beginPath(); g.ellipse(0, -16, 15, 11, 0, Math.PI, 0); g.fill();
      ell(g, 0, -16, 15, 3, shade('#d64545', -30));
      circ(g, -6, -22, 2.5, '#fff'); circ(g, 4, -24, 3, '#fff'); circ(g, 9, -19, 2, '#fff');
      break;
    }
    case 'besouro': {
      ell(g, 0, 0, 15, 5, 'rgba(0,0,0,.3)');
      g.scale(fl, 1);
      g.strokeStyle = '#3a1010'; g.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        const l = Math.sin(t * 14 + i * 2) * (m.moving ? 3 : 0);
        g.beginPath(); g.moveTo(i * 5, -6); g.lineTo(i * 6 + l, 0); g.stroke();
      }
      ell(g, 0, -9, 14, 9, flash ? '#fff' : '#b0182a');
      ell(g, -2, -12, 8, 4, 'rgba(255,180,180,.5)');
      g.strokeStyle = '#5a0a12'; g.lineWidth = 1; g.beginPath(); g.moveTo(-14, -9); g.lineTo(12, -9); g.stroke();
      ell(g, 13, -8, 6, 5, '#2a0a0a');
      g.strokeStyle = '#2a0a0a'; g.lineWidth = 2; g.beginPath(); g.moveTo(16, -10); g.quadraticCurveTo(24, -18, 20, -22); g.stroke();
      circ(g, 15, -9, 1.2, '#ffd23f');
      break;
    }
    case 'serpe': {
      ell(g, 0, 0, 16, 5, 'rgba(0,0,0,.3)');
      g.scale(fl, 1);
      const c = flash ? '#fff' : '#d4a052';
      for (let i = 6; i >= 0; i--) {
        const px = -14 + i * 3.5, py = -4 - Math.sin(t * 5 + i * 0.8 + m.seed) * 2;
        circ(g, px, py, 5 - i * 0.2, i % 2 ? c : shade('#d4a052', -35));
      }
      const hx = 10, hy = -18 + Math.sin(t * 3) * 3;
      g.strokeStyle = c; g.lineWidth = 7; g.beginPath(); g.moveTo(8, -5); g.quadraticCurveTo(14, -10, hx, hy); g.stroke();
      ell(g, hx + 3, hy, 7, 5, c);
      circ(g, hx + 5, hy - 2, 1.4, '#c00');
      if (Math.sin(t * 4) > 0.3) { g.strokeStyle = '#e33'; g.lineWidth = 1; g.beginPath(); g.moveTo(hx + 9, hy + 1); g.lineTo(hx + 14, hy); g.lineTo(hx + 16, hy - 2); g.stroke(); }
      break;
    }
    case 'guardiao': {
      ell(g, 0, 0, 34, 10, 'rgba(0,0,0,.35)');
      const b = Math.sin(t * 2) * 2;
      g.translate(0, -b);
      const c = flash ? '#fff' : '#c08a52', d = shade('#c08a52', -40);
      g.fillStyle = d; g.fillRect(-18, -22, 12, 22); g.fillRect(6, -22, 12, 22);
      g.fillStyle = c; g.beginPath(); g.roundRect(-26, -64, 52, 44, 8); g.fill();
      g.fillStyle = d; g.fillRect(-26, -40, 52, 4);
      g.fillStyle = c; g.beginPath(); g.roundRect(-40, -62 + Math.sin(t * 2) * 3, 14, 34, 6); g.fill();
      g.beginPath(); g.roundRect(26, -62 - Math.sin(t * 2) * 3, 14, 34, 6); g.fill();
      g.beginPath(); g.roundRect(-14, -86, 28, 24, 6); g.fill();
      const glow = 0.6 + Math.sin(t * 6) * 0.4;
      circ(g, -6, -75, 3.5, `rgba(80,220,255,${glow})`); circ(g, 6, -75, 3.5, `rgba(80,220,255,${glow})`);
      g.fillStyle = `rgba(80,220,255,${glow * 0.8})`; g.beginPath();
      g.moveTo(0, -56); g.lineTo(6, -48); g.lineTo(0, -40); g.lineTo(-6, -48); g.fill();
      g.fillStyle = '#e8c070'; g.fillRect(-16, -92, 32, 6);
      break;
    }
  }
  g.restore();
}

function drawItemIcon(g, x, y, id, t) {
  const b = Math.sin(t * 4) * 2;
  ell(g, x, y + 2, 6, 2, 'rgba(0,0,0,.3)');
  if (id === 'zeny') { circ(g, x, y - 5 - b, 5, '#f5c518'); circ(g, x - 1, y - 6 - b, 2, '#fff2a0'); return; }
  const c = id === 'red' ? '#e8312f' : '#2f7ae8';
  g.fillStyle = '#ddd'; g.fillRect(x - 2, y - 15 - b, 4, 4);
  circ(g, x, y - 7 - b, 6, c);
  circ(g, x - 2, y - 9 - b, 2, 'rgba(255,255,255,.6)');
}
