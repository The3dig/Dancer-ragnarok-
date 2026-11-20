// =====================================================================
//  Controle (Xbox, PlayStation e outros, por Bluetooth ou cabo) — 20/11
//  Usa a Gamepad API do navegador (funciona no iPhone, Android e PC).
//  Analógico esquerdo anda, o direito gira a câmera.
//  A ataca · B esquiva · X pula · Y fala/usa
//  LB RB LT RT e as setas = atalhos 1 a 8 da barra
//  View (⧉) = mapa · Menu (☰) = mochila · L3 = sentar · R3 = mirar o monstro mais perto
//  Com uma janela de conversa aberta: setas escolhem, A confirma, B fecha.
// =====================================================================
'use strict';
const Controle = (() => {
  const ZONA = 0.22;                                   // zona morta dos analógicos
  let ant = [], ligado = false, sel = 0, avisou = false;
  const st = { x: 0, y: 0 };
  const eixo = v => Math.abs(v) < ZONA ? 0 : (v - Math.sign(v) * ZONA) / (1 - ZONA);
  function pad() {
    const ps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of ps) if (p && p.connected) return p;
    return null;
  }
  // botões do diálogo (conversa com NPC, lojas, confirmações)
  function botoesDialogo() { const d = document.getElementById('dialog'); return d && !d.classList.contains('hidden') ? [...d.querySelectorAll('button')].filter(b => b.offsetParent) : []; }
  function marcar(bs) { bs.forEach((b, i) => { b.style.outline = i === sel ? '3px solid #ffcf40' : ''; b.style.outlineOffset = i === sel ? '2px' : ''; }); if (bs[sel]) bs[sel].scrollIntoView({ block: 'nearest' }); }
  const ATALHOS = { 4: 0, 5: 1, 6: 2, 7: 3, 12: 4, 15: 5, 13: 6, 14: 7 };   // LB RB LT RT ↑ → ↓ ←
  function apertou(i) {
    if (dialogOpen) {
      const bs = botoesDialogo(); if (!bs.length) return;
      if (i === 12 || i === 14) sel = (sel - 1 + bs.length) % bs.length;
      if (i === 13 || i === 15) sel = (sel + 1) % bs.length;
      if (i === 0 && bs[sel]) { const b = bs[sel]; sel = 0; b.click(); setTimeout(() => marcar(botoesDialogo()), 60); return; }
      if (i === 1) { sel = 0; if (typeof fecharJanelas === 'function') fecharJanelas(null); else closeDialog(); return; }
      marcar(bs); return;
    }
    if (i === 1 && typeof fecharJanelas === 'function' && document.querySelector('#invwin:not(.hidden), #statwin:not(.hidden), #skillwin:not(.hidden), #bestwin:not(.hidden)')) { fecharJanelas(null); return; }
    if (i === 0) attack();
    if (i === 1) doDash();
    if (i === 2) doJump();
    if (i === 3) { if (nearNpc) talk(nearNpc); else if (nearUse) nearUse.fn(); }
    if (i in ATALHOS) barUse(ensureBar()[ATALHOS[i]]);
    if (i === 8) { fecharJanelas('bigmap'); BigMap.open ? BigMap.hide && BigMap.hide() : BigMap.show(); }
    if (i === 9) { const aberta = document.querySelector('#invwin:not(.hidden)'); fecharJanelas(aberta ? null : 'invwin'); if (!aberta && typeof Vida !== 'undefined') Vida.bag(); }
    if (i === 10) { P.sit = !P.sit; log(P.sit ? 'Você se sentou para descansar.' : 'Você se levantou.', 'sys'); }
    if (i === 11) { const m = nearestMob(18, false); if (m) { P.caca = m; if (AUTO.on) autoStop(''); log(`🎯 Alvo: <b>${m.d.name}</b>`, 'sys'); } }
  }
  function update(dt) {
    const p = pad();
    if (!p) { st.x = st.y = 0; if (ligado) { ligado = false; log('🎮 Controle desconectado.', 'sys'); } return; }
    if (!ligado) { ligado = true; ant = []; if (!avisou) { avisou = true; log(`🎮 <b>Controle conectado!</b> Analógico esquerdo anda, direito gira a câmera. <b>A</b> ataca, <b>B</b> esquiva, <b>X</b> pula, <b>Y</b> fala. <b>LB RB LT RT</b> e as <b>setas</b> usam a barra de atalhos. <b>☰</b> mochila, <b>⧉</b> mapa.`, 'gold'); } else log('🎮 Controle conectado.', 'sys'); }
    const ax = p.axes || [];
    st.x = dialogOpen ? 0 : eixo(ax[0] || 0); st.y = dialogOpen ? 0 : eixo(ax[1] || 0);
    if (st.x || st.y) { if (typeof AUTO !== 'undefined' && AUTO.on) autoStop(''); P.caca = null; }
    const rx = eixo(ax[2] || 0), ry = eixo(ax[3] || 0);
    if (!dialogOpen && (rx || ry)) { camS.yaw -= rx * dt * 2.6; camS.pitch = Math.max(0.08, Math.min(1.25, camS.pitch + ry * dt * 1.4)); }
    const bt = p.buttons || [];
    for (let i = 0; i < bt.length; i++) {
      const on = !!(bt[i] && (bt[i].pressed || bt[i].value > 0.5));
      if (on && !ant[i]) apertou(i);
      ant[i] = on;
    }
    if (!dialogOpen && bt[0] && bt[0].pressed) attack();          // segurar A continua atacando
  }
  addEventListener('gamepadconnected', () => { /* o update avisa no próximo quadro */ });
  return { update, get x() { return st.x; }, get y() { return st.y; }, get ligado() { return ligado; } };
})();
