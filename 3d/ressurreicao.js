// =====================================================================
//  🕊️ Ressuscitar (pedido do Rone): quem cai perto de outros jogadores espera um pouco por ajuda
//  (até 20 s, com botão para voltar logo para a cidade). As classes de suporte têm a habilidade
//  Ressuscitar (4 níveis: 25%, 50%, 75% e 100% da vida) e qualquer um pode usar a 🪶 Pena da Fênix
//  (igual ao nível 1). O pedido vai pela "presença" (o caído vê e levanta). Criado para o jogo.
// =====================================================================
'use strict';
const Res = (() => {
  ITEMS.pena_fenix = { name: 'Pena da Fênix', ic: '🪶', kind: 'uso', use: 'res', price: 2500, sell: 400, desc: 'Levanta um amigo caído perto de você (até 10 m) com 25% da vida.' };
  let envio = null, recebidoAt = 0, hud = null;
  const peersPerto = r => (typeof Net !== 'undefined' && Net.peers ? Net.peers() : []).filter(o => Math.hypot(o.x - P.x, o.z - P.z) < r && inTower(o.z) === inTower(P.z));
  // quanto tempo fica caído esperando ajuda: com gente por perto, até 20 s; sozinho, 3 s (como antes)
  function espera() { const t = peersPerto(40).length ? 20 : 3; if (t > 3) mostrar(); return t; }
  function usar(pct, nome) {
    const caidos = peersPerto(10).filter(o => o.s && o.s.st === 'd');
    if (!caidos.length) { log('🕊️ Nenhum amigo caído perto de você (até 10 m).', 'bad'); Audio8.sfx('miss'); return false; }
    const r = caidos.sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
    envio = { to: r.peer, pct: Math.round(pct * 100) / 100, at: Date.now(), n: nome };
    log(`🕊️ Você usou <b>${nome}</b> em <b>${r.n}</b>: volta com ${Math.round(pct * 100)}% da vida.`, 'gold'); Audio8.sfx('heal');
    if (typeof falaMagia === 'function') falaMagia(P.x, P.y + 2.9, P.z, '🕊️ ' + nome);
    burst(new THREE.Vector3(r.x, (r.s.y || 0) + 1, r.z), 0xfff6c0, 40, 3, 1.2); ring(r.x, r.z, 2.5, 0xfff0a0, 1);
    return true;
  }
  const pres = () => (envio && Date.now() - envio.at < 10000 ? { res: envio } : {});
  // o painel de quem caiu: contagem e botão para voltar para a cidade
  function mostrar() {
    if (!hud) { hud = document.createElement('div'); hud.id = 'morto-hud'; document.body.appendChild(hud);
      hud.addEventListener('pointerdown', e => { if (e.target.closest('[data-volta]')) { e.stopPropagation(); P.deadT = 0; Audio8.sfx('click'); } }); }
    hud.classList.remove('hidden');
  }
  setInterval(() => {
    if (typeof running === 'undefined' || !running) return;
    if (hud) { if (!P.dead) hud.classList.add('hidden');
      if (P.dead && !hud.classList.contains('hidden')) hud.innerHTML = `💀 <b>Você caiu!</b> Um amigo pode te levantar com <b>Ressuscitar</b> ou 🪶 <b>Pena da Fênix</b>.<br><small>Voltando para a cidade em ${Math.ceil(P.deadT)} s</small> <button data-volta>🏙️ Voltar agora</button>`; }
    if (!P.dead || typeof Net === 'undefined' || !Net.peers) return;
    for (const r of Net.peers()) {
      const e = r.s && r.s.res; if (!e || e.to !== Net.me || e.at <= recebidoAt || Date.now() - e.at > 10000 || Math.hypot(r.x - P.x, r.z - P.z) > 15) continue;
      recebidoAt = e.at; P.dead = false; P.deadT = 0; P.hp = Math.max(1, Math.round(stats.maxHp() * e.pct)); P.sp = Math.max(P.sp, Math.round(stats.maxSp() * 0.2));
      if (hud) hud.classList.add('hidden');
      log(`🕊️ <b>${r.n}</b> te levantou com <b>${e.n}</b>! Você voltou com ${Math.round(e.pct * 100)}% da vida.`, 'gold'); Audio8.sfx('level'); banner('🕊️ VOCÊ FOI LEVANTADO!');
      burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xfff6c0, 50, 3, 1.3); break;
    }
  }, 300);
  return { espera, usar, pres };
})();
