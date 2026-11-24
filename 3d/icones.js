// =====================================================================
//  🎨 Ícones desenhados dos equipamentos (pedido do Rone: os emojis pareciam infantis, "de Atari").
//  Cada peça ganha um desenho de verdade feito em canvas: a forma vem do tipo (espada, arco, cajado,
//  garras, lança, elmo, capuz, coroa, armadura, manto, luvas, botas, anel, colar) e as cores vêm do
//  material do nome (névoa, cristal, sombra, ouro, raiz, couro, osso, cinzas, primordial...).
//  Metal com degradê, contorno escuro, brilho, gema e um halo na cor da raridade.
// =====================================================================
'use strict';
const Icones = (() => {
  const cache = {}, S = 128;
  const TEMAS = [
    [/primordial/, { a: '#7affe4', b: '#0f6a5c', t: '#e8fff8', g: '#3dffd2', glow: '#3dffd2' }],
    [/névoa|neblina|nevoa/, { a: '#c8d4e4', b: '#4a5a72', t: '#e8eef8', g: '#9ad0ff', mist: true }],
    [/soberano|coroa|imperial|eterna|sagrad|dourad|real\b/, { a: '#ffe08a', b: '#8a5a10', t: '#fff6d0', g: '#ff4060' }],
    [/cristal|estelar|miragem|lembran|fonte/, { a: '#bff2ff', b: '#2a7aa8', t: '#ffffff', g: '#7ae0ff' }],
    [/cinza|brasa|fogo|chamusc/, { a: '#ff9a5a', b: '#5a1a0a', t: '#ffd090', g: '#ff5020' }],
    [/sombra|vazio|negr|noturn|cisma|abiss|abismo|oculta/, { a: '#8a6ab8', b: '#1a1028', t: '#c8a8ff', g: '#b26bff' }],
    [/raiz|floresta|madeira|petrific/, { a: '#9aba6a', b: '#3a2a14', t: '#d8e8a0', g: '#7dff6a' }],
    [/osso|morto|quitina|verme|dente|presa|bocarra|ninho/, { a: '#f0e6c8', b: '#6a5a40', t: '#fffaf0', g: '#ff6040' }],
    [/areia|duna|turbante|sandál/, { a: '#f0d090', b: '#8a6030', t: '#fff0c8', g: '#ff9a40' }],
    [/couro|viajante|gibão|capuz de couro/, { a: '#c08a5a', b: '#4a2a14', t: '#e8c090', g: '#ffd060' }],
    [/./, { a: '#d8e0ec', b: '#3a4458', t: '#ffffff', g: '#ffd060' }],
  ];
  const tema = n => TEMAS.find(([rx]) => rx.test(n))[1];
  function forma(I) {
    const n = I.name.toLowerCase(), s = I.slot;
    if (s === 'arma') return /arco/.test(n) ? 'arco' : /cajado|bastão/.test(n) ? 'cajado' : /garra/.test(n) ? 'garras' : /lança/.test(n) ? 'lanca' : /presa|dente|espinho/.test(n) ? 'presa' : 'espada';
    if (s === 'capacete') return /capuz/.test(n) ? 'capuz' : /coroa/.test(n) ? 'coroa' : /turbante/.test(n) ? 'turbante' : 'elmo';
    if (s === 'armadura') return /manto|capa/.test(n) ? 'manto' : 'peitoral';
    if (s === 'luvas') return /garra/.test(n) ? 'garras' : 'luva';
    if (s === 'botas') return 'bota';
    if (s === 'anel') return 'anel';
    if (s === 'colar') return 'colar';
    return 'espada';
  }
  // ---------------- pincéis
  let g;
  const grad = (c, x0, y0, x1, y1) => { const l = g.createLinearGradient(x0, y0, x1, y1); l.addColorStop(0, c.a); l.addColorStop(1, c.b); return l; };
  function pintar(c, path, x0 = 20, y0 = 20, x1 = 108, y1 = 108, borda = 3.5) {
    g.beginPath(); path(); g.fillStyle = grad(c, x0, y0, x1, y1); g.fill();
    g.lineJoin = 'round'; g.lineWidth = borda; g.strokeStyle = 'rgba(14,8,4,.92)'; g.stroke();
  }
  function brilho(path, a = 0.55) { g.save(); g.beginPath(); path(); g.lineWidth = 2; g.strokeStyle = `rgba(255,255,255,${a})`; g.stroke(); g.restore(); }
  function gema(x, y, r, cor) {
    const rg = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.35, cor); rg.addColorStop(1, 'rgba(0,0,0,.6)');
    g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fillStyle = rg; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(14,8,4,.9)'; g.stroke();
    g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, 6.3); g.fillStyle = 'rgba(255,255,255,.85)'; g.fill();
  }
  const ouro = { a: '#ffe7a0', b: '#7a4a08' }, couro = { a: '#a0704a', b: '#3a2010' }, madeira = { a: '#b08050', b: '#4a2a10' };
  // ---------------- formas
  const F = {
    espada(c) {
      g.save(); g.translate(64, 64); g.rotate(-Math.PI / 4); g.translate(-64, -64);
      pintar(c, () => { g.moveTo(64, 8); g.lineTo(73, 22); g.lineTo(72, 84); g.lineTo(56, 84); g.lineTo(55, 22); g.closePath(); }, 50, 10, 78, 84);
      brilho(() => { g.moveTo(64, 14); g.lineTo(64, 80); }, 0.7);
      pintar(ouro, () => { g.moveTo(40, 84); g.quadraticCurveTo(64, 78, 88, 84); g.lineTo(88, 92); g.quadraticCurveTo(64, 88, 40, 92); g.closePath(); });
      pintar(couro, () => { g.rect(59, 92, 10, 20); });
      for (let y = 95; y < 112; y += 5) { g.beginPath(); g.moveTo(59, y); g.lineTo(69, y + 3); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.5; g.stroke(); }
      gema(64, 117, 6, c.g); gema(64, 87, 4.5, c.g);
      g.restore();
    },
    presa(c) {
      g.save(); g.translate(64, 64); g.rotate(-Math.PI / 4); g.translate(-64, -64);
      pintar(c, () => { g.moveTo(60, 6); g.quadraticCurveTo(86, 40, 74, 86); g.lineTo(56, 86); g.quadraticCurveTo(64, 46, 60, 6); g.closePath(); });
      brilho(() => { g.moveTo(63, 14); g.quadraticCurveTo(76, 44, 68, 80); });
      pintar(ouro, () => { g.rect(44, 86, 40, 7); }); pintar(couro, () => { g.rect(59, 93, 10, 20); }); gema(64, 118, 6, c.g);
      g.restore();
    },
    lanca(c) {
      g.save(); g.translate(64, 64); g.rotate(-Math.PI / 4); g.translate(-64, -64);
      pintar(madeira, () => { g.rect(60, 36, 8, 88); });
      pintar(c, () => { g.moveTo(64, 2); g.lineTo(76, 26); g.lineTo(64, 40); g.lineTo(52, 26); g.closePath(); });
      brilho(() => { g.moveTo(64, 6); g.lineTo(64, 36); });
      pintar(ouro, () => { g.rect(56, 38, 16, 7); }); gema(64, 26, 4, c.g);
      g.restore();
    },
    cajado(c) {
      g.save(); g.translate(64, 64); g.rotate(-Math.PI / 5); g.translate(-64, -64);
      pintar(madeira, () => { g.moveTo(60, 40); g.lineTo(68, 40); g.lineTo(66, 124); g.lineTo(62, 124); g.closePath(); });
      pintar(c, () => { g.moveTo(64, 36); g.bezierCurveTo(40, 30, 40, 4, 56, 4); g.bezierCurveTo(50, 14, 54, 26, 64, 28); g.bezierCurveTo(74, 26, 78, 14, 72, 4); g.bezierCurveTo(88, 4, 88, 30, 64, 36); g.closePath(); });
      const rg = g.createRadialGradient(64, 18, 2, 64, 18, 18); rg.addColorStop(0, '#fff'); rg.addColorStop(0.4, c.g); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.beginPath(); g.arc(64, 18, 18, 0, 6.3); g.fill();
      gema(64, 18, 8, c.g); pintar(ouro, () => { g.rect(58, 40, 12, 6); });
      g.restore();
    },
    arco(c) {
      pintar(c, () => { g.moveTo(34, 10); g.quadraticCurveTo(118, 64, 34, 118); g.lineTo(42, 118); g.quadraticCurveTo(108, 64, 42, 10); g.closePath(); });
      g.beginPath(); g.moveTo(38, 12); g.lineTo(38, 116); g.strokeStyle = '#f0e8d0'; g.lineWidth = 1.6; g.stroke();
      pintar(couro, () => { g.rect(68, 54, 9, 20); }); gema(88, 64, 4, c.g);
      g.save(); g.translate(70, 64); g.rotate(-0.15); pintar({ a: '#d8c8a0', b: '#6a5a40' }, () => { g.rect(-34, -1.5, 60, 3); }); pintar(c, () => { g.moveTo(26, -6); g.lineTo(36, 0); g.lineTo(26, 6); g.closePath(); }); g.restore();
    },
    garras(c) {
      pintar(couro, () => { g.moveTo(30, 84); g.lineTo(96, 84); g.lineTo(92, 118); g.lineTo(34, 118); g.closePath(); });
      for (const [x, dx] of [[42, -10], [64, 0], [86, 10]]) { pintar(c, () => { g.moveTo(x - 7, 86); g.quadraticCurveTo(x - 4 + dx, 40, x + dx * 1.6, 8); g.quadraticCurveTo(x + 10 + dx, 46, x + 7, 86); g.closePath(); }); brilho(() => { g.moveTo(x - 1, 80); g.quadraticCurveTo(x + dx * 0.6, 44, x + dx * 1.5, 14); }, 0.5); }
      pintar(ouro, () => { g.rect(30, 82, 66, 8); }); gema(64, 102, 6, c.g);
    },
    elmo(c) {
      pintar(c, () => { g.moveTo(24, 92); g.bezierCurveTo(20, 30, 108, 30, 104, 92); g.lineTo(96, 112); g.lineTo(72, 112); g.lineTo(72, 82); g.lineTo(56, 82); g.lineTo(56, 112); g.lineTo(32, 112); g.closePath(); });
      g.fillStyle = 'rgba(10,6,4,.85)'; g.fillRect(40, 70, 48, 8);
      pintar(ouro, () => { g.moveTo(60, 22); g.lineTo(68, 22); g.lineTo(68, 76); g.lineTo(60, 76); g.closePath(); });
      pintar({ a: '#ff6a6a', b: '#7a0a14' }, () => { g.moveTo(62, 24); g.bezierCurveTo(70, 2, 100, 0, 112, 14); g.bezierCurveTo(96, 12, 80, 18, 68, 30); g.closePath(); });
      brilho(() => { g.moveTo(34, 76); g.bezierCurveTo(34, 46, 50, 36, 60, 34); }); gema(64, 52, 5, c.g);
    },
    capuz(c) {
      pintar(c, () => { g.moveTo(64, 8); g.bezierCurveTo(108, 20, 116, 70, 106, 118); g.lineTo(22, 118); g.bezierCurveTo(12, 70, 20, 20, 64, 8); g.closePath(); });
      g.beginPath(); g.ellipse(64, 74, 26, 32, 0, 0, 6.3); g.fillStyle = 'rgba(8,4,10,.92)'; g.fill();
      g.fillStyle = c.g; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(54, 74, 4, 2.5, 0, 0, 6.3); g.ellipse(74, 74, 4, 2.5, 0, 0, 6.3); g.fill(); g.globalAlpha = 1;
      brilho(() => { g.moveTo(30, 100); g.bezierCurveTo(26, 50, 40, 24, 64, 14); });
    },
    coroa(c) {
      pintar(c, () => { g.moveTo(18, 100); g.lineTo(14, 40); g.lineTo(38, 66); g.lineTo(50, 28); g.lineTo(64, 60); g.lineTo(78, 28); g.lineTo(90, 66); g.lineTo(114, 40); g.lineTo(110, 100); g.closePath(); });
      pintar(c, () => { g.rect(18, 96, 92, 16); });
      for (const x of [14, 50, 78, 114]) gema(x, x === 14 || x === 114 ? 40 : 28, 5, c.g);
      gema(64, 104, 6, c.g); gema(36, 104, 4, '#7ae0ff'); gema(92, 104, 4, '#7ae0ff');
      brilho(() => { g.moveTo(22, 98); g.lineTo(20, 52); });
    },
    turbante(c) {
      pintar(c, () => { g.moveTo(16, 92); g.bezierCurveTo(10, 30, 118, 30, 112, 92); g.bezierCurveTo(90, 104, 38, 104, 16, 92); g.closePath(); });
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(20, 80 - i * 14); g.bezierCurveTo(50, 64 - i * 14, 80, 90 - i * 14, 110, 70 - i * 14); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.stroke(); }
      gema(64, 56, 9, c.g); pintar({ a: '#ffffff', b: '#c8c8d8' }, () => { g.moveTo(64, 46); g.bezierCurveTo(70, 20, 90, 10, 96, 6); g.bezierCurveTo(86, 22, 78, 34, 70, 50); g.closePath(); });
    },
    peitoral(c) {
      pintar(c, () => { g.moveTo(36, 20); g.lineTo(54, 30); g.lineTo(74, 30); g.lineTo(92, 20); g.lineTo(110, 34); g.lineTo(100, 60); g.lineTo(96, 112); g.lineTo(32, 112); g.lineTo(28, 60); g.lineTo(18, 34); g.closePath(); });
      pintar(ouro, () => { g.moveTo(18, 34); g.lineTo(36, 20); g.lineTo(44, 44); g.lineTo(26, 56); g.closePath(); }); pintar(ouro, () => { g.moveTo(110, 34); g.lineTo(92, 20); g.lineTo(84, 44); g.lineTo(102, 56); g.closePath(); });
      g.beginPath(); g.moveTo(64, 34); g.lineTo(64, 108); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.stroke();
      for (const y of [76, 94]) { g.beginPath(); g.moveTo(34, y); g.quadraticCurveTo(64, y + 8, 94, y); g.strokeStyle = 'rgba(0,0,0,.3)'; g.stroke(); }
      gema(64, 56, 8, c.g); brilho(() => { g.moveTo(36, 62); g.lineTo(40, 104); });
    },
    manto(c) {
      // manto/capa: tecido caindo em ondas, gola alta e broche
      pintar(c, () => { g.moveTo(40, 18); g.bezierCurveTo(52, 26, 76, 26, 88, 18); g.bezierCurveTo(100, 50, 110, 86, 116, 116); g.bezierCurveTo(104, 108, 96, 120, 86, 112); g.bezierCurveTo(76, 120, 66, 108, 56, 116); g.bezierCurveTo(46, 108, 34, 120, 24, 112); g.bezierCurveTo(16, 116, 14, 112, 12, 116); g.bezierCurveTo(18, 86, 28, 50, 40, 18); g.closePath(); }, 30, 10, 100, 120);
      for (const x of [42, 64, 86]) { g.beginPath(); g.moveTo(x, 30); g.bezierCurveTo(x - 6, 60, x + 6, 84, x - 2, 112); g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(x + 4, 32); g.bezierCurveTo(x - 2, 60, x + 10, 84, x + 2, 110); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; g.stroke(); }
      pintar({ a: c.t, b: c.b }, () => { g.moveTo(34, 14); g.bezierCurveTo(50, 30, 78, 30, 94, 14); g.lineTo(90, 26); g.bezierCurveTo(76, 38, 52, 38, 38, 26); g.closePath(); });
      gema(64, 32, 7, c.g);
      if (c.mist) for (let i = 0; i < 7; i++) { const x = 18 + Math.random() * 92, y = 60 + Math.random() * 56, r = 10 + Math.random() * 12, rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(235,245,255,.5)'); rg.addColorStop(1, 'rgba(235,245,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); }
    },
    luva(c) {
      pintar(c, () => { g.moveTo(34, 118); g.lineTo(36, 70); g.lineTo(30, 46); g.quadraticCurveTo(28, 36, 36, 36); g.lineTo(44, 58); g.lineTo(44, 22); g.quadraticCurveTo(50, 14, 56, 22); g.lineTo(58, 54); g.lineTo(60, 14); g.quadraticCurveTo(67, 8, 72, 16); g.lineTo(72, 54); g.lineTo(76, 22); g.quadraticCurveTo(82, 16, 86, 24); g.lineTo(86, 60); g.lineTo(92, 40); g.quadraticCurveTo(100, 38, 98, 50); g.lineTo(90, 84); g.lineTo(92, 118); g.closePath(); });
      pintar(ouro, () => { g.rect(32, 96, 62, 10); }); gema(62, 78, 6, c.g);
      brilho(() => { g.moveTo(48, 28); g.lineTo(48, 58); });
    },
    bota(c) {
      pintar(c, () => { g.moveTo(40, 10); g.lineTo(82, 10); g.lineTo(80, 74); g.bezierCurveTo(98, 80, 118, 86, 116, 110); g.lineTo(28, 110); g.lineTo(32, 74); g.closePath(); });
      pintar({ a: '#4a3a2a', b: '#1a1208' }, () => { g.rect(26, 108, 92, 10); });
      pintar(ouro, () => { g.rect(36, 10, 50, 10); }); pintar(ouro, () => { g.rect(34, 60, 48, 7); });
      gema(58, 40, 5, c.g); brilho(() => { g.moveTo(44, 24); g.lineTo(42, 70); });
    },
    anel(c) {
      g.beginPath(); g.ellipse(64, 76, 40, 30, 0, 0, 6.3); g.lineWidth = 16; g.strokeStyle = 'rgba(14,8,4,.92)'; g.stroke();
      g.beginPath(); g.ellipse(64, 76, 40, 30, 0, 0, 6.3); g.lineWidth = 10; g.strokeStyle = grad(c, 24, 50, 104, 110); g.stroke();
      g.beginPath(); g.ellipse(64, 76, 40, 30, 0, Math.PI * 1.05, Math.PI * 1.6); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.7)'; g.stroke();
      pintar(ouro, () => { g.moveTo(46, 50); g.lineTo(82, 50); g.lineTo(76, 34); g.lineTo(52, 34); g.closePath(); });
      gema(64, 30, 14, c.g);
    },
    colar(c) {
      g.beginPath(); g.moveTo(22, 14); g.bezierCurveTo(24, 70, 104, 70, 106, 14); g.lineWidth = 5; g.strokeStyle = 'rgba(14,8,4,.9)'; g.stroke();
      g.beginPath(); g.moveTo(22, 14); g.bezierCurveTo(24, 70, 104, 70, 106, 14); g.lineWidth = 2.5; g.setLineDash([4, 3]); g.strokeStyle = c.a; g.stroke(); g.setLineDash([]);
      pintar(c, () => { g.moveTo(64, 56); g.lineTo(90, 80); g.lineTo(64, 122); g.lineTo(38, 80); g.closePath(); });
      pintar(ouro, () => { g.moveTo(64, 50); g.lineTo(72, 58); g.lineTo(64, 64); g.lineTo(56, 58); g.closePath(); });
      gema(64, 86, 13, c.g); brilho(() => { g.moveTo(46, 80); g.lineTo(64, 62); });
    },
  };
  const RCOR = ['#9a9a9a', '#5ad07a', '#4a9aff', '#b46bff', '#ffb640', '#3dffd2'];
  function equip(id) {
    if (cache[id]) return cache[id];
    const I = ITEMS[id]; if (!I || I.kind !== 'equip') return null;
    const c = document.createElement('canvas'); c.width = c.height = S; g = c.getContext('2d');
    // halo da raridade atrás
    const rc = RCOR[I.rar || 0] || '#9a9a9a', rg = g.createRadialGradient(64, 64, 8, 64, 64, 64); rg.addColorStop(0, rc + '55'); rg.addColorStop(1, rc + '00'); g.fillStyle = rg; g.fillRect(0, 0, S, S);
    const t = tema(I.name.toLowerCase());
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 6; g.shadowOffsetY = 3;
    try { (F[forma(I)] || F.espada)(t); } catch (e) { }
    g.restore();
    if (t.glow) { g.globalCompositeOperation = 'lighter'; const q = g.createRadialGradient(64, 64, 0, 64, 64, 60); q.addColorStop(0, t.glow + '30'); q.addColorStop(1, t.glow + '00'); g.fillStyle = q; g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'source-over'; }
    return (cache[id] = c.toDataURL('image/png'));
  }
  // HTML do ícone: o desenho para equipamento, o emoji para o resto
  // 🃏 cartas (pedido do Rone): no ícone aparece a carta de verdade, moldura pela raridade e o desenho do monstro dela
  function cartaTipo(I) { if (I.arcana) return 'arcana'; if (I.arte && !I.mob) return 'lenda'; const D = I.mob && MOBDEF[I.mob]; return D && (D.boss || D.world) ? 'ouro' : D && (D.mini || D.field || D.alfa) ? 'bronze' : 'prata'; }
  function mobPng(t) { const k = typeof SPR_MOBS !== 'undefined' && SPR_MOBS[t] && SPR_MOBS[t].img; const b = k && typeof SPR !== 'undefined' && SPR[k] ? SPR[k] : t === 'kravenox' && typeof SPR !== 'undefined' && SPR.k_down_0 ? SPR.k_down_0 : null; return b ? 'data:image/png;base64,' + b : null; }
  function carta(id, cls = '') {
    const I = ITEMS[id]; if (!I || I.kind !== 'carta') return null;
    const png = I.mob ? mobPng(I.mob) : null, pic = png ? `<img src="${png}" alt="">` : `<i>${I.arte || (I.mob && typeof iconeMob === 'function' ? iconeMob(I.mob) : '🃏')}</i>`;
    return `<span class="ico-carta c-${cartaTipo(I)} ${cls}"><span class="icc-pic">${pic}</span><span class="icc-gema"></span></span>`;
  }
  function html(id, cls = '') { const c = carta(id, cls); if (c) return c; const u = equip(id); return u ? `<img class="ico-eq ${cls}" src="${u}" alt="">` : `<span>${ITEMS[id] ? ITEMS[id].ic : '?'}</span>`; }
  return { equip, html, carta, cartaTipo, mobPng };
})();
