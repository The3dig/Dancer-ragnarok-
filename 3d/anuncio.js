// =====================================================================
//  📣 Anúncio grande na tela (pedido do Rone): quando começa um evento (ou falta pouco),
//  desce no meio da tela uma faixa grande com ícone, título e explicação, e às vezes um
//  botão "Ir agora". Some sozinho depois de alguns segundos (ou com um toque).
//  Também avisa 5 minutos antes do Kravenox (sábado 20h), do Verme (domingo 20h) e da
//  Guerra de Guildas (domingo 18h).
// =====================================================================
'use strict';
const Anuncio = (() => {
  const fila = []; let el = null, ativo = false, tHide = null;
  function mostrar(o) { fila.push(o); if (!ativo) proximo(); }
  function proximo() {
    const o = fila.shift(); if (!o) { ativo = false; return; } ativo = true;
    if (!el) { el = document.createElement('div'); el.id = 'anuncio'; document.body.appendChild(el); el.addEventListener('pointerdown', e => { const b = e.target.closest('[data-ir]'); if (b && el._acao) { e.stopPropagation(); el._acao(); } fechar(); }); }
    el.className = 'an-' + (o.cor || 'ouro'); el._acao = o.acao || null;
    el.innerHTML = `<div class="an-ic">${o.ic || '📣'}</div><div class="an-tx"><small>${o.tag || 'EVENTO'}</small><b>${o.titulo}</b><span>${o.sub || ''}</span></div>${o.acao ? `<button data-ir>${o.botao || 'Ir agora'}</button>` : ''}`;
    // logo abaixo da barra de cima, seja qual for o tamanho da tela (com top fixo encavalava na barra; pedido da Lady Ingrid)
    try { const m = document.getElementById('menu'), hud = document.getElementById('hud'); if (m && hud && !hud.classList.contains('hidden')) {
      const r = m.getBoundingClientRect(), z = parseFloat(hud.style.zoom || '1') || 1, sonda = document.getElementById('enc-sonda'), w = sonda ? sonda.getBoundingClientRect().width : 0;
      const k = z !== 1 && w > 0 && Math.abs(w - 100) < Math.abs(w - 100 * z) ? z : 1;   // Safari mede sem o zoom do HUD
      el.style.top = Math.round(Math.max(8, r.bottom * k + 10)) + 'px'; } } catch (e) { }
    el.classList.add('on'); try { Audio8.sfx(o.som || 'level'); } catch (e) { }
    clearTimeout(tHide); tHide = setTimeout(fechar, (o.seg || 7) * 1000);
  }
  function fechar() { if (!el) return; el.classList.remove('on'); clearTimeout(tHide); setTimeout(proximo, 450); }
  // avisos de 5 minutos antes dos chefes e da guerra (horário do aparelho)
  const ditos = new Set();
  setInterval(() => {
    if (typeof running === 'undefined' || !running) return;
    const d = new Date(), dia = d.getDay(), min = d.getHours() * 60 + d.getMinutes(), k = d.toDateString();
    const aviso = (id, cond, o) => { if (cond && !ditos.has(k + id)) { ditos.add(k + id); mostrar(o); } };
    aviso('kvx5', dia === 6 && min >= 19 * 60 + 55 && min < 20 * 60, { ic: '☠️', cor: 'sangue', tag: 'EM 5 MINUTOS', titulo: 'O Kravenox vai acordar', sub: 'Às 20h, no topo da Torre do Cisma. Junte o máximo de gente: sozinho ninguém derruba!', som: 'boom' });
    aviso('verme5', dia === 0 && min >= 19 * 60 + 55 && min < 20 * 60, { ic: '🐛', cor: 'sangue', tag: 'EM 5 MINUTOS', titulo: 'O Verme Colossal vai acordar', sub: 'Às 20h, no Fundo do Abismo do Cisma. Leve poções e amigos!', som: 'boom' });
    aviso('guerra5', dia === 0 && min >= 17 * 60 + 55 && min < 18 * 60, { ic: '🏰', cor: 'azul', tag: 'EM 5 MINUTOS', titulo: 'Guerra de Guildas', sub: 'Às 18h a Fortaleza abre. Fale com o Comandante Varek, em Solmira.' });
  }, 5000);
  // 📣 anúncio para o jogo INTEIRO (pedido do Rone: "Ludivicki pegou a carta!"): vai na presença de quem conseguiu
  // e aparece grande na tela de todos que estão on-line
  let meu = null; const vistos = new Map();
  function global(o) { meu = { ...o, at: Date.now() }; mostrar(o); }
  const pres = () => meu && Date.now() - meu.at < 90000 ? { anun: meu } : {};
  setInterval(() => {
    if (typeof running === 'undefined' || !running || typeof Net === 'undefined' || !Net.peers) return;
    for (const r of Net.peers()) { const a = r.s && r.s.anun; if (!a || !a.at || vistos.get(r.peer) === a.at) continue; vistos.set(r.peer, a.at);
      if (Date.now() - a.at < 90000) mostrar({ ic: String(a.ic || '📣').slice(0, 4), cor: ['ouro', 'sangue', 'azul', 'verde'].includes(a.cor) ? a.cor : 'ouro', tag: String(a.tag || '').slice(0, 40), titulo: String(a.titulo || '').slice(0, 80), sub: String(a.sub || '').slice(0, 160), som: 'level' }); }
  }, 1500);
  return { mostrar, fechar, global, pres };
})();
