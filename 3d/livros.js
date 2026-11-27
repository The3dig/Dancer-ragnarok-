// =====================================================================
//  📚 Os dois livros de verdade nas bibliotecas (pedido do Rone, 27/11): "Reino Quebrado" (I) e
//  "Reino Quebrado II — O Reino da Escolha". Ficam num púlpito na biblioteca do castelo da guilda e
//  na Biblioteca Arcana da casa. Tocando: capa, sumário e a AMOSTRA (os primeiros capítulos; o resto
//  fica fora do jogo porque o site é aberto e os livros ainda não foram publicados). Texto: livros-txt.js.
// =====================================================================
'use strict';
const Livros = (() => {
  const CORES = [{ capa: '#6a1420', borda: '#d9a63a', tinta: '#ffd98a' }, { capa: '#142a5a', borda: '#c8d4f0', tinta: '#e8eeff' }];
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  // ---------------- capa desenhada (canvas)
  const CAPA = {};
  function capaTex(k) {
    if (CAPA[k]) return CAPA[k];
    const B = LIVROS_TXT[k], C = CORES[k], c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 256, 384); g.addColorStop(0, C.capa); g.addColorStop(1, '#0a0608'); x.fillStyle = g; x.fillRect(0, 0, 256, 384);
    for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; x.fillRect(Math.random() * 256, Math.random() * 384, 2, 2); }   // couro
    x.strokeStyle = C.borda; x.lineWidth = 6; x.strokeRect(12, 12, 232, 360); x.lineWidth = 2; x.strokeRect(22, 22, 212, 340);
    x.fillStyle = C.tinta; x.textAlign = 'center';
    x.font = 'bold 30px Georgia, serif'; x.fillText('REINO', 128, 92); x.fillText('QUEBRADO', 128, 128);
    if (k) { x.font = 'bold 42px Georgia, serif'; x.fillText('II', 128, 176); }
    // três espinhos (o símbolo da história)
    x.save(); x.translate(128, k ? 236 : 210); x.fillStyle = C.borda; for (const a of [-0.5, 0, 0.5]) { x.save(); x.rotate(a); x.beginPath(); x.moveTo(0, -46); x.lineTo(9, 10); x.lineTo(-9, 10); x.closePath(); x.fill(); x.restore(); } x.restore();
    x.fillStyle = C.tinta; x.font = 'italic 17px Georgia, serif'; x.fillText(B.sub, 128, k ? 300 : 290);
    x.font = '14px Georgia, serif'; x.fillText('Rone Ignacio da Silva', 128, 346);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return (CAPA[k] = t);
  }
  // ---------------- o púlpito: pé de madeira torneado, tampo inclinado e os dois livros com a capa para cima
  function pulpito(par, x, z, ry = 0, esc2 = 1) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(esc2); par.add(g);
    const mad = new THREE.MeshLambertMaterial({ color: 0x6a4024 }), ouro = new THREE.MeshPhongMaterial({ color: 0xd9a63a, shininess: 80 });
    const pe = new THREE.Mesh(new THREE.LatheGeometry([[0.3, 0], [0.32, 0.06], [0.12, 0.14], [0.09, 0.5], [0.13, 0.62], [0.08, 0.75], [0.1, 0.95], [0.2, 1.0]].map(([r, y]) => new THREE.Vector2(r, y)), 14), mad); g.add(pe);
    const tampo = new THREE.Group(); tampo.position.set(0, 1.05, 0); tampo.rotation.x = 0.5;   /* inclinado para quem lê */ g.add(tampo);
    const tb = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.8), mad); tampo.add(tb);
    const ap = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.06), ouro); ap.position.set(0, 0.05, 0.38); tampo.add(ap);   // apoio dos livros
    LIVROS_TXT.forEach((B, k) => {
      const lombo = new THREE.MeshLambertMaterial({ color: CORES[k].capa }), folhas = new THREE.MeshLambertMaterial({ color: 0xf0e6cc });
      const tc = capaTex(k).clone(); tc.center.set(0.5, 0.5); tc.needsUpdate = true;
      const capa = new THREE.MeshLambertMaterial({ map: tc });
      const liv = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.66), [folhas, lombo, capa, lombo, folhas, folhas]); liv.position.set(k ? 0.28 : -0.28, 0.07, 0); liv.rotation.y = k ? -0.06 : 0.05; tampo.add(liv);
    });
    const luz = new THREE.PointLight(0xffd8a0, 0.6, 5); luz.position.set(0, 2.2, 0.6); g.add(luz);
    return g;
  }
  // ---------------- onde estão (para o "tocar para ler")
  const PONTOS = [];
  function ponto(x, z, ativo) { PONTOS.push({ x, z, ativo }); }
  function nearest() {
    for (const p of PONTOS) if ((!p.ativo || p.ativo()) && Math.hypot(P.x - p.x, P.z - p.z) < 2.4) return { label: '📚 Ler os livros do Reino Quebrado', fn: () => estante() };
    return null;
  }
  // ---------------- leitura
  function estante() {
    dialog('📚 Os livros do Reino Quebrado', `<div class="lv-dois">${LIVROS_TXT.map((B, k) => `<div class="lv-capa" onclick="Livros.abrir(${k})"><img src="${capaTex(k).image.toDataURL()}"><b>${esc(B.titulo)}</b><small>${esc(B.sub)}</small></div>`).join('')}</div><small>A história deste mundo, escrita por Rone Ignacio da Silva. Aqui ficam os primeiros capítulos de cada livro.</small>`,
      [...LIVROS_TXT.map((B, k) => ({ label: `📖 ${B.titulo} — ${B.sub}`, fn: () => { abrir(k); return true; } })), { label: 'Fechar' }]);
  }
  function abrir(k) {
    const B = LIVROS_TXT[k]; if (!B) return; Audio8.sfx('click');
    const tem = new Set(B.caps.map(c => c.t));
    dialog(`📖 ${B.titulo}`, `<div class="lv-topo"><img src="${capaTex(k).image.toDataURL()}"><div><b>${esc(B.titulo)}</b><br><i>${esc(B.sub)}</i><br><small>Rone Ignacio da Silva</small></div></div><b>Sumário</b><ol class="lv-sum">${B.sumario.map(t => `<li class="${tem.has(t) ? 'tem' : ''}">${esc(t)}${tem.has(t) ? '' : ' <small>🔒</small>'}</li>`).join('')}</ol><small>Os capítulos com 🔒 não estão no jogo: só os primeiros, como amostra.</small>`,
      [...B.caps.map((c, i) => ({ label: `📜 ${c.t}`, fn: () => { ler(k, i); return true; } })), { label: '← Os dois livros', fn: () => { estante(); return true; } }, { label: 'Fechar' }]);
  }
  function ler(k, i) {
    const B = LIVROS_TXT[k], c = B && B.caps[i]; if (!c) return; Audio8.sfx('click');
    dialog(`📜 ${c.t}`, `<div class="lv-txt">${c.p.map(p => `<p>${esc(p)}</p>`).join('')}</div><small class="lv-cr">${esc(B.titulo)} · © 2026 Rone Ignacio da Silva. Todos os direitos reservados.</small>`,
      [...(B.caps[i + 1] ? [{ label: `Próximo: ${B.caps[i + 1].t} →`, fn: () => { ler(k, i + 1); return true; } }] : []), ...(i > 0 ? [{ label: `← ${B.caps[i - 1].t}`, fn: () => { ler(k, i - 1); return true; } }] : []), { label: '📖 Sumário', fn: () => { abrir(k); return true; } }, { label: 'Fechar' }]);
    const d = document.querySelector('#dialog .dtext'); if (d) d.scrollTop = 0; const dl = document.getElementById('dialog'); if (dl) dl.scrollTop = 0;
  }
  return { pulpito, ponto, nearest, abrir, ler, estante };
})();
