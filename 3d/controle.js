// =====================================================================
//  Controle (Xbox, PlayStation e outros, por Bluetooth ou cabo) — 20/11
//  Usa a Gamepad API do navegador (funciona no iPhone, Android, PC e TV).
//
//  NO JOGO
//   analógico esquerdo anda · direito gira a câmera
//   A  fala com NPC / quadro / baú quando está perto; senão ataca (segure)
//   B  esquiva · X pula · Y ataca
//   LB RB LT RT e as setas = atalhos 1 a 8 da barra
//   ☰ (Menu) = MODO CURSOR (mexer em qualquer botão da tela) · ⧉ (Exibir) = mapa
//   L3 = sentar · R3 = mirar o monstro mais perto
//
//  MODO CURSOR (abre sozinho em telas, janelas e conversas, e com o ☰ no jogo)
//   analógico ou setas = vai para o botão mais perto naquela direção
//   A = aperta · B = volta/fecha · analógico direito = rola a lista
//   ☰ de novo = volta a jogar
// =====================================================================
'use strict';
const Controle = (() => {
  const ZONA = 0.25;
  let ant = [], ligado = false, avisou = false, cursorManual = false, foco = null, moveT = 0, moveDir = null, caixa = null;
  const st = { x: 0, y: 0 };
  const eixo = v => Math.abs(v) < ZONA ? 0 : (v - Math.sign(v) * ZONA) / (1 - ZONA);
  function pad() { const ps = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of ps) if (p && p.connected) return p; return null; }
  const jogando = () => typeof running !== 'undefined' && running;

  // ---------------------------------------------------------------- o que dá para apertar na tela
  const SEL = 'button, a[href], input, select, textarea, [onclick], [role=button], [data-a], [data-b], [data-st], [data-learn], [data-pin], [data-reset], [data-share], [data-x], [data-n], [data-v], .icell, .itab, .eslot, .rail-btn, .sl-row';
  function visivel(el) {
    if (el.disabled || el.closest('[disabled]')) return false;
    const r = el.getBoundingClientRect(); if (r.width < 6 || r.height < 6 || r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return false;
    const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const h = document.elementFromPoint(cx, cy); if (!h) return false;
    return h === el || el.contains(h) || h.contains(el) && h.closest(SEL) === el;   // não está tampado por outra janela
  }
  function alvos() {
    const set = new Set();
    for (const el of document.querySelectorAll(SEL)) set.add(el);
    for (const el of document.querySelectorAll('div, span, li, img, b, small, p, td, label')) {      // coisas com cursor de mão (painel de missões, cartões…)
      const cs = getComputedStyle(el); if (cs.cursor !== 'pointer') continue;
      const pai = el.parentElement; if (pai && getComputedStyle(pai).cursor === 'pointer') continue;
      set.add(el);
    }
    let lst = [...set].filter(el => el !== caixa && !el.closest('#ctl-cursor') && visivel(el));
    lst = lst.filter(el => !lst.some(o => o !== el && el.contains(o)));                              // fica com o mais específico
    return lst;
  }
  const centro = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; };
  function desenhar() {
    if (!caixa) { caixa = document.createElement('div'); caixa.id = 'ctl-cursor'; caixa.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;border:3px solid #ffcf40;border-radius:10px;box-shadow:0 0 0 3px rgba(0,0,0,.55),0 0 18px #ffcf40;transition:all .09s ease-out;display:none'; document.body.appendChild(caixa); }
    if (!foco || !document.contains(foco) || !visivel(foco)) { caixa.style.display = 'none'; return; }
    const r = foco.getBoundingClientRect();
    Object.assign(caixa.style, { display: 'block', left: (r.left - 4) + 'px', top: (r.top - 4) + 'px', width: (r.width + 8) + 'px', height: (r.height + 8) + 'px' });
  }
  function escolherInicial() {
    const l = alvos(); if (!l.length) { foco = null; return; }
    // prefere o botão principal de uma conversa/janela aberta; senão o mais perto do meio da tela
    const d = document.getElementById('dialog');
    const naJanela = d && !d.classList.contains('hidden') ? l.filter(e => d.contains(e)) : [];
    if (naJanela.length) { foco = naJanela[0]; return; }
    const meio = { x: innerWidth / 2, y: innerHeight / 2 };
    foco = l.reduce((a, b) => { const ca = centro(a), cb = centro(b); return Math.hypot(cb.x - meio.x, cb.y - meio.y) < Math.hypot(ca.x - meio.x, ca.y - meio.y) ? b : a; });
  }
  function mover(dx, dy) {
    const l = alvos(); if (!l.length) { foco = null; return; }
    if (!foco || !l.includes(foco)) { escolherInicial(); return; }
    const c = centro(foco); let melhor = null, mv = Infinity;
    for (const el of l) {
      if (el === foco) continue;
      const o = centro(el), vx = o.x - c.x, vy = o.y - c.y, ao = vx * dx + vy * dy;   // avanço na direção
      if (ao <= 4) continue;
      const lado = Math.abs(vx * dy - vy * dx), v = ao + lado * 2.2;                     // de lado conta mais caro
      if (v < mv) { mv = v; melhor = el; }
    }
    if (melhor) { foco = melhor; try { foco.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { } if (typeof Audio8 !== 'undefined') Audio8.sfx('click'); }
  }
  function apertar(el) {
    if (!el) return;
    const c = centro(el), o = { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y, pointerId: 77, pointerType: 'touch', isPrimary: true, button: 0 };
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) { el.focus(); if (el.type === 'checkbox' || el.type === 'radio') el.click(); return; }
    const pd = new PointerEvent('pointerdown', o); el.dispatchEvent(pd);
    el.dispatchEvent(new PointerEvent('pointerup', o));
    if (!pd.defaultPrevented) el.click();                    // botões do jogo que já agem no toque não recebem clique dobrado
    setTimeout(() => { if (!foco || !document.contains(foco) || !visivel(foco)) escolherInicial(); desenhar(); }, 120);
  }
  function rolar(dy) {
    let e = foco; while (e && e !== document.body) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2) { e.scrollTop += dy; return; } e = e.parentElement; }
  }

  // ---------------------------------------------------------------- quando o cursor fica ligado sozinho
  const JAN = ['#dialog', '#invwin', '#statwin', '#skillwin', '#bestwin', '#avisos', '#coswin', '#guildwin', '#bauwin'];
  function janelaAberta() {
    if (typeof dialogOpen !== 'undefined' && dialogOpen) return true;
    for (const s of JAN) { const e = document.querySelector(s); if (e && !e.classList.contains('hidden') && e.style.display !== 'none' && e.offsetParent !== null) return true; }
    if (typeof BigMap !== 'undefined' && BigMap.open) return true;
    // telas por cima de tudo (Mais jogos, Presença, Jornada…): algo fixo cobrindo o meio da tela
    const h = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    if (h && h !== caixa) { let e = h; while (e && e !== document.body) { const cs = getComputedStyle(e); if (cs.position === 'fixed' && +cs.zIndex >= 50 && e.id !== 'game' && e.tagName !== 'CANVAS') { const r = e.getBoundingClientRect(); if (r.width > innerWidth * 0.4 && r.height > innerHeight * 0.4) return true; } e = e.parentElement; } }
    return false;
  }
  function quemAberto() { const l = []; for (const s of JAN) { const e = document.querySelector(s); if (e && !e.classList.contains('hidden') && e.style.display !== 'none' && e.offsetParent !== null) l.push(s); } const h = document.elementFromPoint(innerWidth / 2, innerHeight / 2); l.push('meio:' + (h && (h.id || h.className || h.tagName))); return l; }
  const modoCursor = () => !jogando() || cursorManual || janelaAberta();

  function fecharAlgo() {
    if (typeof dialogOpen !== 'undefined' && dialogOpen) { if (typeof fecharJanelas === 'function') fecharJanelas(null); else closeDialog(); return true; }
    if (typeof BigMap !== 'undefined' && BigMap.open) { BigMap.hide(); return true; }
    if (janelaAberta()) {
      // procura um "x" / fechar visível
      const x = alvos().find(e => /^(×|✕|x|X|Fechar|Sair|Depois|Voltar|← Voltar)$/.test((e.textContent || '').trim()) || e.matches('[data-close],[data-x],.x,.bm-x,[data-a="close"]'));
      if (x) { apertar(x); return true; }
      if (typeof fecharJanelas === 'function') { fecharJanelas(null); return true; }
    }
    return false;
  }

  // ---------------------------------------------------------------- botões
  const ATALHOS = { 4: 0, 5: 1, 6: 2, 7: 3, 12: 4, 15: 5, 13: 6, 14: 7 };   // LB RB LT RT ↑ → ↓ ←
  const DIR = { 12: [0, -1], 13: [0, 1], 14: [-1, 0], 15: [1, 0] };
  function apertou(i) {
    if (modoCursor()) {
      if (i in DIR) { mover(...DIR[i]); return; }
      if (i === 0) { if (!foco || !visivel(foco)) escolherInicial(); apertar(foco); return; }
      if (i === 1) { if (!fecharAlgo()) cursorManual = false; return; }
      if (i === 9 && jogando()) { cursorManual = false; fecharAlgo(); return; }
      if (i === 8 && jogando() && typeof BigMap !== 'undefined') { BigMap.open ? BigMap.hide() : (fecharJanelas('bigmap'), BigMap.show()); return; }
      return;
    }
    if (i === 0) { if (nearNpc) talk(nearNpc); else if (nearUse) nearUse.fn(); else attack(); return; }
    if (i === 1) doDash();
    if (i === 2) doJump();
    if (i === 3) attack();
    if (i in ATALHOS) barUse(ensureBar()[ATALHOS[i]]);
    if (i === 8 && typeof BigMap !== 'undefined') { fecharJanelas('bigmap'); BigMap.show(); }
    if (i === 9) { cursorManual = true; foco = null; escolherInicial(); log('🎮 <b>Modo cursor:</b> analógico escolhe o botão, <b>A</b> aperta, <b>B</b> ou <b>☰</b> volta a jogar.', 'sys'); }
    if (i === 10) { P.sit = !P.sit; log(P.sit ? 'Você se sentou para descansar.' : 'Você se levantou.', 'sys'); }
    if (i === 11) { const m = nearestMob(18, false); if (m) { P.caca = m; if (AUTO.on) autoStop(''); log(`🎯 Alvo: <b>${m.d.name}</b>`, 'sys'); } }
  }

  let estavaCursor = false;
  function update(dt) {
    const p = pad();
    if (!p) { st.x = st.y = 0; if (caixa) caixa.style.display = 'none'; if (ligado) { ligado = false; if (jogando()) log('🎮 Controle desconectado.', 'sys'); } return; }
    if (!ligado) { ligado = true; ant = []; if (jogando()) { if (!avisou) { avisou = true; log('🎮 <b>Controle conectado!</b> <b>A</b> fala com quem está perto ou ataca · <b>B</b> esquiva · <b>X</b> pula · <b>LB RB LT RT</b> e <b>setas</b> = atalhos · <b>☰</b> = cursor para usar qualquer botão da tela · <b>⧉</b> mapa. Lista completa na ajuda ❓.', 'gold'); } else log('🎮 Controle conectado.', 'sys'); } }
    const ax = p.axes || [], bt = p.buttons || [];
    const cur = modoCursor();
    if (cur !== estavaCursor) { estavaCursor = cur; if (cur) { foco = null; escolherInicial(); } }
    // botões (só na hora que aperta)
    for (let i = 0; i < bt.length; i++) { const on = !!(bt[i] && (bt[i].pressed || bt[i].value > 0.5)); if (on && !ant[i]) apertou(i); ant[i] = on; }
    const lx = eixo(ax[0] || 0), ly = eixo(ax[1] || 0), rx = eixo(ax[2] || 0), ry = eixo(ax[3] || 0);
    if (modoCursor()) {
      st.x = st.y = 0;
      // analógico esquerdo anda pelos botões (com repetição se segurar)
      const d = Math.hypot(lx, ly) > 0.5 ? (Math.abs(lx) > Math.abs(ly) ? [Math.sign(lx), 0] : [0, Math.sign(ly)]) : null;
      if (d) { const k = d.join(); if (k !== moveDir) { moveDir = k; moveT = 0.32; mover(...d); } else if ((moveT -= dt) <= 0) { moveT = 0.12; mover(...d); } } else moveDir = null;
      if (ry) rolar(ry * dt * 900);
      if (!foco || !document.contains(foco)) escolherInicial();
      desenhar();
      return;
    }
    if (caixa) caixa.style.display = 'none';
    st.x = lx; st.y = ly;
    if (st.x || st.y) { if (typeof AUTO !== 'undefined' && AUTO.on) autoStop(''); P.caca = null; }
    if (rx || ry) { camS.yaw -= rx * dt * 2.6; camS.pitch = Math.max(0.08, Math.min(1.25, camS.pitch + ry * dt * 1.4)); }
    if ((bt[3] && bt[3].pressed) || (bt[0] && bt[0].pressed && !nearNpc && !nearUse)) attack();   // segurar ataca sem parar
  }
  return { update, get x() { return st.x; }, get y() { return st.y; }, get ligado() { return ligado; }, get cursor() { return modoCursor(); }, quemAberto, get manual() { return cursorManual; } };
})();
