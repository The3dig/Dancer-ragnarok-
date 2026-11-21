// Setas para encolher os quadros da tela (o de mensagens, à esquerda, e o de missões, à direita).
// Tocou na seta: o quadro some e fica só a seta; tocou de novo: ele volta. O jogo lembra a escolha.
const Encolher = (() => {
  const QUADROS = [{ id: 'chat', lado: 'esq', nome: 'mensagens' }, { id: 'quest', lado: 'dir', nome: 'missões' }];
  const chave = id => 'encolher-' + id;
  const ler = id => { try { return localStorage.getItem(chave(id)) === '1'; } catch (e) { return false; } };
  const gravar = (id, v) => { try { localStorage.setItem(chave(id), v ? '1' : '0'); } catch (e) { } };
  const pos = {};
  function seta(q, fechado) { return q.lado === 'esq' ? (fechado ? '▶' : '◀') : (fechado ? '◀' : '▶'); }
  function aplicar(q) {
    const fechado = ler(q.id), b = q.btn;
    document.body.classList.toggle('enc-' + q.id, fechado);
    b.textContent = seta(q, fechado); b.title = (fechado ? 'Mostrar ' : 'Esconder ') + q.nome;
    b.classList.toggle('fechado', fechado);
    posicionar(q);
  }
  // com mochila, diário, conversa ou outra janela aberta as setas somem (antes ficavam por cima da janela)
  function janelaAberta() {
    if (typeof dialogOpen !== 'undefined' && dialogOpen) return true;
    if (typeof BigMap !== 'undefined' && BigMap.open) return true;
    if (document.getElementById('avisos') || document.querySelector('#forja:not(.hidden)')) return true;
    const ids = typeof JANELAS !== 'undefined' ? JANELAS : [];
    return ids.some(id => { if (id === 'dialog' || id === 'bigmap' || id === 'kvx' || id === 'avisos') return false; const el = document.getElementById(id); return el && !el.classList.contains('hidden'); });
  }
  // a seta fica colada no canto de cima do quadro (do lado de fora do jogo); com ele escondido, fica onde ele estava
  function posicionar(q) {
    const el = document.getElementById(q.id), b = q.btn; if (!el) return;
    const hud = document.getElementById('hud'), some = !hud || hud.classList.contains('hidden') || janelaAberta();
    const medir = !ler(q.id) || !pos[q.id];                         // escondido desde o começo: mostra um instante só para medir
    if (medir) {
      if (ler(q.id)) document.body.classList.remove('enc-' + q.id);
      const r = el.getBoundingClientRect(), vis = r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
      if (ler(q.id)) document.body.classList.add('enc-' + q.id);
      if (!vis) { b.style.display = 'none'; return; }
      pos[q.id] = { top: r.top, l: r.left, r: r.right };
    }
    const p = pos[q.id]; if (!p || some) { b.style.display = 'none'; return; }
    b.style.display = ''; b.style.top = Math.max(0, p.top) + 'px';
    const f = ler(q.id);
    b.style.left = (q.lado === 'esq' ? (f ? p.l : p.r - 22) : (f ? p.r - 22 : p.l - 25)) + 'px';
  }
  function iniciar() {
    for (const q of QUADROS) {
      const b = document.createElement('button'); b.className = 'enc-seta enc-' + q.lado; b.type = 'button'; q.btn = b;
      b.addEventListener('click', e => { e.stopPropagation(); gravar(q.id, !ler(q.id)); if (typeof Audio8 !== 'undefined') Audio8.sfx('click'); aplicar(q); });
      document.body.appendChild(b); aplicar(q);
    }
    setInterval(() => { for (const q of QUADROS) posicionar(q); }, 150);
    addEventListener('resize', () => { for (const q of QUADROS) posicionar(q); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  return { aplicar: () => QUADROS.forEach(aplicar) };
})();
