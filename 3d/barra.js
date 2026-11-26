// =====================================================================
//  ☰ Barra de cima mais curta (pedido do Rone: ela batia no quadro do jogador e no mapa).
//  Ficam à mostra só os botões mais usados; os outros vão para o painel ☰ Mais.
//  Os botões continuam existindo (só ficam escondidos), então tudo que já funcionava neles continua.
//  Tocar no quadro do personagem (vida, SP) abre os 📊 Atributos.
// =====================================================================
'use strict';
const Barra = (() => {
  const GAVETA = ['btn-tela', 'btn-auto', 'btn-stat', 'btn-best', 'btn-sit', 'btn-music', 'btn-recordes', 'btn-shop', 'btn-guild', 'btn-help', 'btn-vr', 'btn-moveis'];
  let painel = null;
  const nome = b => (b.title || '').replace(/\s*\([^)]*\)\s*$/, '');
  function arrumar() {
    const m = $('menu'); if (!m) return;
    let mais = $('btn-mais');
    if (!mais) { mais = document.createElement('button'); mais.id = 'btn-mais'; mais.title = 'Mais opções'; mais.textContent = '☰'; mais.onclick = e => { e.stopPropagation(); Audio8.sfx('click'); abrir(); }; m.appendChild(mais); }
    if (m.lastElementChild !== mais) m.appendChild(mais);                        // sempre o último da barra
    let aviso = false;
    for (const id of GAVETA) { const b = $(id); if (!b) continue; b.classList.add('na-gaveta'); if (b.classList.contains('badge') || b.classList.contains('alert')) aviso = true; }
    mais.classList.toggle('badge', aviso);
    if (painel && !painel.classList.contains('hidden')) montar();
  }
  function montar() {
    const bs = GAVETA.map(id => $(id)).filter(Boolean);
    painel.innerHTML = `<div class="wt">☰ Mais<span class="x" data-x>×</span></div><div class="gv-grade">${bs.map(b => `<button data-id="${b.id}" class="${b.classList.contains('badge') || b.classList.contains('alert') ? 'tem' : ''}${b.classList.contains('on') ? ' on' : ''}"><span>${b.textContent}</span><small>${nome(b)}</small></button>`).join('')}</div>`;
  }
  function abrir() {
    if (!painel) {
      painel = document.createElement('div'); painel.id = 'gaveta'; painel.className = 'win hidden'; $('hud').appendChild(painel);
      painel.addEventListener('click', e => { if (e.target.closest('[data-x]')) { fechar(); return; } const t = e.target.closest('[data-id]'); if (!t) return; fechar(); const b = $(t.dataset.id); if (b) b.click(); });
      document.addEventListener('pointerdown', e => { if (painel && !painel.classList.contains('hidden') && !painel.contains(e.target) && e.target.id !== 'btn-mais') fechar(); });
    }
    if (!painel.classList.contains('hidden')) { fechar(); return; }
    montar(); painel.classList.remove('hidden');
  }
  function fechar() { if (painel) painel.classList.add('hidden'); }
  // 🔍 Tamanho da tela (pedido do Rone: no Mac fica tudo pequeno, no celular do Balhulk tudo encavalado):
  // automático pelo tamanho da tela, ou a pessoa escolhe. Aumenta/diminui só os botões e janelas, não o mundo.
  const ESCALAS = [['auto', 'Automático'], [0.8, 'Pequeno'], [1, 'Normal'], [1.25, 'Grande'], [1.5, 'Bem grande']];
  const lerEsc = () => { try { const v = localStorage.getItem('ui-escala'); return v === null || v === 'auto' ? 'auto' : +v; } catch (e) { return 'auto'; } };
  function escalaAuto() { const m = Math.min(innerWidth, innerHeight); return m < 360 ? 0.82 : m < 420 ? 0.92 : m < 600 ? 1 : m < 800 ? 1.2 : 1.35; }
  function aplicarEscala() {
    const v = lerEsc(), z = v === 'auto' ? escalaAuto() : v;
    document.documentElement.style.setProperty('--ui', z);
    for (const id of ['hud', 'alvo-hud', 'btn-sair-dg']) { const el = document.getElementById(id); if (el) el.style.zoom = z; }   // o diálogo fica dentro do HUD (já aumenta junto)
  }
  function escolherEscala() {
    const v = lerEsc();
    dialog('🔍 Tamanho da tela', `Deixa os botões, ícones e janelas maiores ou menores.<br><small>No <b>Automático</b> o jogo escolhe pelo tamanho da sua tela (agora: ${Math.round(escalaAuto() * 100)}%).</small>`,
      [...ESCALAS.map(([k, n]) => ({ label: `${v === k ? '✅' : '▫️'} ${n}${k === 'auto' ? '' : ` (${Math.round(k * 100)}%)`}`, fn: () => { try { localStorage.setItem('ui-escala', String(k)); } catch (e) { } aplicarEscala(); escolherEscala(); return true; } })), { label: 'Fechar' }]);
  }
  function init() {
    { const m = $('menu'); if (m && !$('btn-tela')) { const b = document.createElement('button'); b.id = 'btn-tela'; b.title = 'Tamanho da tela'; b.textContent = '🔍'; b.onclick = e => { e.stopPropagation(); Audio8.sfx('click'); escolherEscala(); }; m.appendChild(b); } }
    aplicarEscala(); addEventListener('resize', aplicarEscala); setInterval(aplicarEscala, 3000);
    arrumar(); setInterval(arrumar, 1500);
    const st = $('status'); if (st && !st.dataset.ficha) { st.dataset.ficha = 1; st.title = 'Toque para ver os atributos'; st.style.cursor = 'pointer'; st.addEventListener('click', e => { if (e.target.closest('button')) return; const b = $('btn-stat'); if (b) b.click(); }); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  return { arrumar, abrir, fechar };
})();
