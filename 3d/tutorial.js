// =====================================================================
//  🎓 Tutorial dos primeiros níveis (ideia do Rone: para quem chega, como o
//  filho dele). Uma caixinha em cima mostra o passo e o botão certo brilha.
//  Só aparece até o nível 10 e dá para pular. No fim, um presente.
// =====================================================================
'use strict';
const Tutorial = (() => {
  const T = () => (P.tutorial = P.tutorial || { passo: 0 });
  let el = null, x0 = null, z0 = null, aberto = {};
  const clicou = id => { const b = $(id); if (b && !b.dataset.tut) { b.dataset.tut = 1; b.addEventListener('click', () => { aberto[id] = true; }); } return aberto[id]; };
  const PASSOS = [
    { txt: () => TOUCH ? 'Use o <b>analógico</b> (círculo rosa, embaixo à esquerda) para andar.' : 'Use <b>W A S D</b> (ou as setas) para andar.', ok: () => x0 !== null && Math.hypot(P.x - x0, P.z - z0) > 6 },
    { txt: () => `Chegue perto de um monstro e toque em <b>⚔️ atacar</b>${TOUCH ? '' : ' (ou clique nele)'}. Derrote 1.`, alvo: 't-atk', ok: () => (P.kills || 0) > T().kills0 },
    { txt: () => 'Abra a <b>🎒 mochila</b>: ali ficam os itens. Toque numa peça para equipar.', alvo: 'btn-bag', ok: () => clicou('btn-bag') },
    { txt: () => 'À direita está o quadro de <b>📜 Missões</b>. Toque numa missão e o herói <b>anda sozinho</b> até ela.', alvo: 'quest', ok: () => typeof AUTO !== 'undefined' && AUTO.on },
    { txt: () => 'Abra <b>📊 Atributos</b> e distribua seus pontos (força, vida, agilidade...).', alvo: 'btn-stat', ok: () => clicou('btn-stat') },
    { txt: () => 'Abra <b>📅 Tarefas</b>: 3 por dia, com prêmio. Vale entrar todo dia!', alvo: 'btn-tarefas', ok: () => clicou('btn-tarefas') },
    { txt: () => 'Abra <b>🏰 Masmorras</b>: todas as masmorras do Reino, e o botão <b>Ir até lá</b>.', alvo: 'btn-masmorras', ok: () => clicou('btn-masmorras') },
    { txt: () => 'Abra <b>👥 Grupo</b>: chame amigos para caçar juntos e dividir XP e itens.', alvo: 'btn-grupo', ok: () => clicou('btn-grupo') },
    { txt: () => `Agora é com você: chegue ao <b>nível 10</b> fazendo as missões. (Você está no ${P.lv}.)`, ok: () => P.lv >= 10 },
  ];
  function montar() {
    if (el) return;
    el = document.createElement('div'); el.id = 'tutorial';
    el.innerHTML = '<div class="tt"></div><button class="tx" title="Pular tutorial">Pular</button>';
    el.querySelector('.tx').onclick = e => { e.stopPropagation(); pular(); };
    document.body.appendChild(el);
  }
  function brilhar(id) { document.querySelectorAll('.tut-brilho').forEach(b => b.classList.remove('tut-brilho')); if (id && $(id)) $(id).classList.add('tut-brilho'); }
  function pular() { T().fim = true; if (el) el.style.display = 'none'; brilhar(null); log('🎓 Tutorial pulado. Se precisar, o ❓ explica tudo.', 'sys'); try { save(); } catch (e) { } }
  function terminar() {
    const t = T(); t.fim = true; if (el) el.style.display = 'none'; brilhar(null);
    P.inv.red = (P.inv.red || 0) + 20; P.inv.blue = (P.inv.blue || 0) + 10; P.zeny += 3000; if (typeof buildHotbar === 'function') buildHotbar();
    banner('🎓 TUTORIAL COMPLETO!'); Audio8.sfx('level'); log('🎓 <b>Tutorial completo!</b> Presente: 20 🧪 poções vermelhas, 10 💧 azuis e 3.000 cr. Boa jornada!', 'gold'); try { save(); } catch (e) { }
  }
  function update() {
    if (!running || !P) return;
    const t = T();
    if (t.fim) return;
    if (P.lv > 10 && !t.passo) { t.fim = true; return; }                  // quem já é veterano não vê
    if (t.kills0 === undefined) t.kills0 = P.kills || 0;
    if (x0 === null) { x0 = P.x; z0 = P.z; }
    const S = PASSOS[t.passo]; if (!S) return terminar();
    montar(); el.style.display = 'flex';
    const html = `🎓 <b>Passo ${t.passo + 1} de ${PASSOS.length}</b> · ${S.txt()}`;
    const tt = el.querySelector('.tt'); if (tt.dataset.h !== html) { tt.innerHTML = html; tt.dataset.h = html; brilhar(S.alvo); }
    if (S.ok()) { t.passo++; t.kills0 = P.kills || 0; x0 = P.x; z0 = P.z; aberto = {}; Audio8.sfx('coin'); try { save(); } catch (e) { } }
  }
  setInterval(update, 500);
  return { pular };
})();
