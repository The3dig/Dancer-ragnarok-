// =====================================================================
//  Grupo (party), no jeito do Ragnarok: chame quem está on-line para
//  caçar junto. Até 8 no grupo.
//  - Quando alguém do grupo mata um monstro e você está perto (até 45 m),
//    você também ganha XP e o monstro conta nas suas missões, desafios
//    e aventuras dos amigos. Cada item que cai é sorteado entre quem está perto.
//  - Os companheiros aparecem no quadro de Missões (vida e distância) e
//    em verde no minimapa.
//  O convite vai pela presença (igual à troca): sem mudar o servidor.
// =====================================================================
'use strict';
const Grupo = (() => {
  const MAX = 8, PERTO = 45;
  let convite = null, vistos = new Set(), nomesAntes = null, chkT = 0, envios = [];
  const gp = () => P.grupo || null;
  const online = () => typeof Net !== 'undefined' && Net.connected && Net.me;
  function membros() { if (!gp() || !online()) return []; return Net.peers().filter(r => r.n && r.s.gp === gp()); }
  function doGrupo(peer) { return !!gp() && online() && Net.peers().some(r => r.peer === peer && r.s.gp === gp()); }
  const esc = t => String(t || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])).slice(0, 40);
  const perto = r => Math.hypot(r.x - P.x, r.z - P.z) < PERTO;
  // vai na presença: o meu grupo e o convite que estou mandando
  function pres() { const t = Date.now(); envios = envios.filter(e => t - e.at < 20000); return { gp: gp(), gc: convite && t < convite.ate ? { to: convite.to, gp: convite.gp, id: convite.id } : null, gi: envios.length ? envios.slice(-12).map(({ to, id, n, k, de }) => ({ to, id, n, k, de })) : null }; }
  // ---------------- divisão dos itens da caçada (como o "dividir itens" do Ragnarok)
  // quem mata sorteia cada item entre quem é do grupo e está perto do monstro (inclusive ele mesmo)
  function sortear(m) {
    if (!gp() || !online()) return null;
    const lista = [null, ...membros().filter(r => r.s.st !== 'd' && Math.hypot(r.x - m.x, r.z - m.z) < PERTO)];
    return lista.length > 1 ? lista[Math.floor(Math.random() * lista.length)] : null;
  }
  function enviar(r, id, n, de) {
    envios.push({ to: r.peer, id, n, de, k: Math.random().toString(36).slice(2, 9), at: Date.now() });
    const I = ITEMS[id]; if (I) log(`👥 ${I.ic} <b>${I.name}</b> foi para <b>${r.n}</b> (sorteio do grupo).`, 'sys');
  }

  function convidar(r) {
    if (!P.grupo) P.grupo = 'g' + Math.random().toString(36).slice(2, 9);
    if (membros().length + 1 >= MAX) { log(`👥 O grupo já tem ${MAX} pessoas.`, 'bad'); return; }
    convite = { to: r.peer, gp: P.grupo, id: Math.random().toString(36).slice(2, 8), ate: Date.now() + 60000 };
    log(`📨 Convite para o grupo enviado para <b>${r.n}</b>. Espere ele aceitar.`, 'sys'); Audio8.sfx('click');
  }
  function sair() {
    if (!P.grupo) return; P.grupo = null; convite = null; nomesAntes = null;
    log('👥 Você saiu do grupo.', 'sys'); if (typeof save === 'function') save();
  }
  function painel() {
    if (!online()) { dialog('👥 Grupo', 'O grupo funciona com os amigos on-line no mesmo mundo (precisa de internet).'); return; }
    const M = membros(), fora = Net.peers().filter(r => r.n && (!gp() || r.s.gp !== gp()));
    const lista = M.length ? M.map(r => `👤 <b>${r.n}</b> Nv ${r.s.lv || '?'} · ❤️ ${r.s.hp ?? '?'}% · ${perto(r) ? '<span style="color:#7dff6a">perto</span>' : Math.round(Math.hypot(r.x - P.x, r.z - P.z)) + ' m'}`).join('<br>') : '<i>Ninguém no grupo ainda.</i>';
    const opts = [];
    for (const r of fora.slice(0, 10)) opts.push({ label: `➕ Chamar ${r.n} (Nv ${r.s.lv || '?'})`, fn: () => { convidar(r); } });
    for (const r of M) opts.push({ label: `🧭 Ir até ${r.n}`, fn: () => { P.qGo = { x: r.x, z: r.z, name: r.n }; log(`🧭 Indo até <b>${r.n}</b>.`, 'sys'); if (typeof autoStart === 'function') autoStart(); } });
    if (gp()) opts.push({ label: '🚪 Sair do grupo', fn: () => { sair(); } });
    opts.push({ label: 'Fechar' });
    dialog('👥 Grupo', `${lista}<br><br><small>No grupo, quando um de vocês mata um monstro e o outro está perto (até ${PERTO} m), <b>os dois ganham XP</b> e o monstro <b>conta nas missões, desafios e aventuras dos amigos dos dois</b>. Os <b>itens são sorteados</b> entre quem está perto.</small>${fora.length ? '' : '<br><br><i>Não tem mais ninguém on-line agora para chamar.</i>'}`, opts);
  }
  // convites recebidos e quem entrou/saiu do grupo
  function update(dt) {
    if ((chkT -= dt) > 0 || !online()) return; chkT = 0.5;
    // itens que o grupo mandou para mim (cada um uma vez só, mesmo se o jogo recarregar)
    P.grRec = P.grRec || [];
    for (const r of Net.peers()) for (const g of (r.s.gi || [])) {
      if (!g || g.to !== Net.me || P.grRec.includes(g.k) || !ITEMS[g.id]) continue;
      P.grRec.push(g.k); if (P.grRec.length > 80) P.grRec.shift();
      const n = Math.max(1, Math.min(5, g.n | 0)); P.inv[g.id] = (P.inv[g.id] || 0) + n; const I = ITEMS[g.id];
      log(`👥 Você ganhou <b>${I.ic} ${I.name}</b>${n > 1 ? ' ×' + n : ''} no sorteio do grupo (${esc(r.n)} derrotou ${esc(g.de || 'um monstro')}).`, 'item'); Audio8.sfx('coin');
      if (g.id === 'red' || g.id === 'blue') buildHotbar();
    }
    for (const r of Net.peers()) {
      const c = r.s.gc; if (!c || c.to !== Net.me || vistos.has(c.id)) continue; vistos.add(c.id);
      if (P.grupo === c.gp) continue;
      Audio8.sfx('buff'); log(`👥 <b>${r.n}</b> te chamou para o grupo!`, 'gold');
      dialog('👥 Convite para o grupo', `<b>${r.n}</b> (Nv ${r.s.lv || '?'}) te chamou para caçar junto.<br><small>No grupo, quem está perto ganha XP e conta o monstro nas missões quando o outro mata.</small>`, [
        { label: '✅ Entrar no grupo', fn: () => { P.grupo = c.gp; nomesAntes = null; log(`👥 Você entrou no grupo de <b>${r.n}</b>!`, 'gold'); if (typeof save === 'function') save(); } },
        { label: 'Recusar' }]);
    }
    if (convite && Date.now() > convite.ate) convite = null;
    const nomes = membros().map(r => r.n).sort().join('|');
    if (nomesAntes !== null && nomes !== nomesAntes) {
      const a = new Set(nomesAntes ? nomesAntes.split('|') : []), b = new Set(nomes ? nomes.split('|') : []);
      for (const n of b) if (!a.has(n)) { log(`👥 <b>${n}</b> entrou no grupo.`, 'gold'); if (convite) convite = null; }
      for (const n of a) if (!b.has(n)) log(`👥 <b>${n}</b> saiu do grupo (ou ficou off-line).`, 'sys');
    }
    nomesAntes = nomes;
  }
  // os companheiros no quadro de Missões
  function html() {
    const M = membros(); if (!M.length) return '';
    return `<div class="qi" data-grupo="1"><b style="color:#7dff6a">👥 Grupo</b><br>` + M.map(r => { const hp = Math.max(0, Math.min(100, r.s.hp ?? 100)); return `${r.n} <span style="display:inline-block;width:46px;height:6px;background:#3a2030;border-radius:3px;vertical-align:middle"><span style="display:block;width:${hp}%;height:6px;background:${hp > 40 ? '#5ae07a' : '#ff5a5a'};border-radius:3px"></span></span> <small>${perto(r) ? 'perto' : Math.round(Math.hypot(r.x - P.x, r.z - P.z)) + ' m'}</small>`; }).join('<br>') + '</div>';
  }
  function init() {
    if (!$('btn-grupo')) { const b = document.createElement('button'); b.id = 'btn-grupo'; b.title = 'Grupo'; b.textContent = '👥'; b.onclick = painel; $('menu').insertBefore(b, $('btn-help')); }
  }
  return { init, update, pres, painel, html, membros, doGrupo, convidar, sair, sortear, enviar, PERTO };
})();
