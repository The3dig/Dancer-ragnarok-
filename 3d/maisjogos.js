// =====================================================================
//  Mais jogos: os outros jogos do universo Kravenox (igual à tela
//  "MAIS JOGOS" do jogo casual Quadros do Cisma). Todos grátis.
// =====================================================================
'use strict';
const MaisJogos = (() => {
  const BASE = 'https://the3dig.github.io/kravenox-jogar/';
  const JOGOS = [
    { n: 'Reino Quebrado Online', d: 'O MMO em 3D: escolha um herói do livro e explore o reino.', url: BASE + 'mmo/', ic: BASE + 'rpg/icon-192.png', aqui: true },
    { n: 'Quadros do Cisma', d: 'O jogo casual: ande pelo anel de quadros, compre poderes e sobreviva às 15 ondas.', url: BASE + 'quadros/', ic: BASE + 'quadros/index.icon.png' },
    { n: 'Reino Quebrado (RPG)', d: 'O RPG da história do livro, capítulo a capítulo.', url: BASE + 'rpg/', ic: BASE + 'rpg/icon-192.png' },
    { n: 'Kravenox Plataforma', d: 'Jogo de plataforma em 3D: corra, pule e lute pelas fases.', url: BASE + 'plataforma/', ic: BASE + 'plataforma/icon-192.png' },
    { n: 'Cratera do Cisma', d: 'O primeiro jogo do Kravenox, na Cratera do Cisma.', url: BASE, ic: BASE + 'index.icon.png' },
  ];
  let box = null;
  function montar() {
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(8,5,14,.88);display:flex;align-items:center;justify-content:center;padding:12px;font-family:Nunito,sans-serif';
    const cartoes = JOGOS.map((j, i) => `
      <div style="display:flex;gap:12px;align-items:center;background:#1e1630;border:1px solid rgba(247,226,168,.35);border-radius:12px;padding:10px">
        <img src="${j.ic}" alt="" style="width:56px;height:56px;border-radius:12px;object-fit:cover;background:#2a2040;flex:none" onerror="this.style.visibility='hidden'">
        <div style="flex:1;min-width:0"><b style="color:#f7e2a8;font-size:16px">${j.n}</b>${j.aqui ? ' <small style="color:#ff9ad0">(você está aqui)</small>' : ''}<br><span style="color:#d8d0e8;font-size:13px">${j.d}</span></div>
        ${j.aqui ? `<button data-share="${i}" style="${BTN}">📤 Mandar</button>` : `<a href="${j.url}" target="_blank" rel="noopener" style="${BTN};text-decoration:none">▶ Jogar</a>`}
      </div>`).join('');
    box.innerHTML = `<div style="width:min(620px,100%);max-height:100%;overflow:auto;background:#140e20;border:2px solid #c8a050;border-radius:16px;padding:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><b style="font-family:Cinzel,serif;color:#f7e2a8;font-size:20px">🎮 MAIS JOGOS</b><button data-x style="${BTN}">✕</button></div>
      <p style="color:#c8bce0;margin:0 0 10px;font-size:14px">Outros jogos do universo Kravenox. Todos grátis.</p>
      <div style="display:flex;flex-direction:column;gap:8px">${cartoes}</div></div>`;
    box.addEventListener('click', e => {
      if (e.target === box || e.target.closest('[data-x]')) { fechar(); return; }
      const s = e.target.closest('[data-share]'); if (s) compartilhar(JOGOS[+s.dataset.share]);
    });
    document.body.appendChild(box);
  }
  const BTN = 'background:#3a2a5a;color:#fff;border:1px solid #c8a050;border-radius:10px;padding:8px 12px;font:800 14px Nunito,sans-serif;white-space:nowrap;cursor:pointer';
  async function compartilhar(j) {
    const txt = `Vem jogar ${j.n} comigo! ${j.url}`;
    try { if (navigator.share) { await navigator.share({ title: j.n, text: `Vem jogar ${j.n} comigo!`, url: j.url }); return; } } catch (e) { return; }
    try { await navigator.clipboard.writeText(txt); alert('Link copiado! Agora é só colar para o seu amigo.'); } catch (e) { prompt('Copie o link:', j.url); }
  }
  function mostrar() { if (!box) montar(); box.style.display = 'flex'; if (typeof Audio8 !== 'undefined') Audio8.sfx('click'); }
  function fechar() { if (box) box.style.display = 'none'; }
  return { mostrar, fechar, JOGOS };
})();
