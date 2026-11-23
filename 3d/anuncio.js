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
  return { mostrar, fechar };
})();
