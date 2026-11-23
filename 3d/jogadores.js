// =====================================================================
//  👤 Menu do jogador (pedido do Rone): toque no NOME de outro jogador (ou clique nele no PC)
//  e aparecem as opções: ver perfil, seguir, trocar, mandar emoji, chamar para o grupo,
//  convidar para a guilda e ir até ele. O emoji aparece em cima da cabeça para todos verem.
// =====================================================================
'use strict';
const Jogadores = (() => {
  const EMOJIS = ['👋', '😂', '❤️', '👍', '🙏', '😮', '😢', '😡', '🎉', '🔥', '💤', '⚔️'];
  let emo = null, seguindo = null, segT = 0;
  const esc = t => String(t || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const achar = peer => (typeof Net !== 'undefined' && Net.peers ? Net.peers() : []).find(r => r.peer === peer);
  const classe = s => { try { const c = CLASSES[s.look && s.look.cls]; return c ? (c.name[s.look.gender] || c.name.f) : '?'; } catch (e) { return '?'; } };
  function pres() { return emo && Date.now() - emo.at < 6000 ? { emo } : {}; }
  function menu(peer) {
    const r = achar(peer); if (!r) return; const s = r.s || {}, d = Math.round(Math.hypot(r.x - P.x, r.z - P.z));
    const meuGrupo = P.grupo && s.gp === P.grupo, minhaG = typeof Guilda !== 'undefined' && Guilda.minha();
    const opts = [
      { label: '👤 Ver perfil', fn: () => { perfil(peer); return true; } },
      { label: seguindo === peer ? '⏹️ Parar de seguir' : '🚶 Seguir', fn: () => { if (seguindo === peer) parar('🚶 Você parou de seguir.'); else if (fechado(r)) naoDa(r, fechado(r)); else { seguindo = peer; log(`🚶 Seguindo <b>${esc(r.n)}</b>. Mexa o personagem para parar.`, 'sys'); } } },
      { label: '🤝 Trocar itens', fn: () => { if (typeof Vida !== 'undefined' && Vida.trocarCom) Vida.trocarCom(peer); return true; } },
      { label: '😀 Mandar emoji', fn: () => { emojis(peer); return true; } },
      ...(!meuGrupo && typeof Grupo !== 'undefined' ? [{ label: '👥 Chamar para o grupo', fn: () => { Grupo.convidar(r); } }] : []),
      ...(minhaG && !s.gid && typeof Guilda !== 'undefined' && Guilda.podeConvidar() ? [{ label: '🛡️ Convidar para a guilda', fn: () => { Guilda.convidarNome(r.n); } }] : []),
      { label: '🧭 Ir até', fn: () => { if (fechado(r)) { naoDa(r, fechado(r)); return; } P.qGo = { x: r.x, z: r.z, name: r.n }; if (typeof autoStart === 'function') autoStart(); } },
      { label: 'Fechar' }];
    dialog(`👤 ${esc(r.n)}`, `Nv <b>${s.lv || '?'}</b> · ${esc(classe(s))}${s.gt ? ` · <b>[${esc(s.gt)}]</b>` : ''}${s.title ? `<br><small>« ${esc(s.title)} »</small>` : ''}<br><small>${d} m daqui · ❤️ ${s.hp ?? '?'}%${meuGrupo ? ' · 👥 do seu grupo' : ''}</small>`, opts);
  }
  // 🚫 lugares que não dá para seguir (Torre, Abismo, masmorras, casa, castelo, arena: ficam "fora do mapa")
  function fechado(r) {
    const NOMES = { reino: 'no Reino de Solmira', valdora: 'em Valdora', floresta: 'na Floresta Morta', vale: 'no Vale dos Mortos', cidade: 'na Cidade', praia: 'na Praia' };
    if (!inTower(r.z) && !inTower(P.z)) { const a = mapaDe(P.x, P.z), b = mapaDe(r.x, r.z); return a === b ? null : `em outro mapa (${NOMES[b] || b})`; }
    if (!inTower(r.z)) return `em outro mapa (${NOMES[mapaDe(r.x, r.z)] || 'lá fora'})`;
    if (inTower(P.z) && Math.hypot(r.x - P.x, r.z - P.z) < 40 && zoneOf(r.x, r.z) === zoneOf(P.x, P.z)) return null;   // estão no mesmo lugar: dá para seguir
    const z = zoneOf(r.x, r.z);
    return z === 'abismo' || z === 'abfundo' ? 'no Abismo' : z === 'casa' ? 'dentro de uma casa' : z === 'castelo' ? 'no castelo da guilda' : z === 'torre' || z === 'topo' ? 'na Torre do Cisma' : 'numa masmorra';
  }
  function naoDa(r, lugar) { const t = `🚫 <b>${esc(r.n)}</b> está ${lugar}: esse mapa não dá para seguir.`; P.qGo = null; if (typeof autoStop === 'function') autoStop(''); log(t, 'bad'); Audio8.sfx('miss'); if (typeof banner === 'function') banner('🚫 ESSE MAPA NÃO DÁ PARA SEGUIR'); }
  function perfil(peer) {
    const r = achar(peer); if (!r) return; const s = r.s || {};
    const linhas = [`⭐ Nível <b>${s.lv || '?'}</b>`, `⚔️ Classe: <b>${esc(classe(s))}</b>`, s.gt ? `🛡️ Guilda: <b>[${esc(s.gt)}]</b>` : '🛡️ Sem guilda', s.title ? `🏅 Título: <b>« ${esc(s.title)} »</b>` : '', P.grupo && s.gp === P.grupo ? '👥 Está no seu grupo' : '', s.mt ? '🐦 Montado na Valtrion!' : ''].filter(Boolean);
    dialog(`👤 Perfil de ${esc(r.n)}`, linhas.join('<br>'), [{ label: '← Voltar', fn: () => { menu(peer); return true; } }, { label: 'Fechar' }]);
  }
  function emojis(peer) {
    const r = achar(peer); if (!r) return;
    dialog(`😀 Emoji para ${esc(r.n)}`, 'Ele aparece em cima da sua cabeça (todo mundo perto vê) e chega para a pessoa.', [
      ...EMOJIS.map(e => ({ label: e, fn: () => { emo = { e, to: peer, at: Date.now() }; floater(P.x, P.y + 2.8, P.z, e, 'emo'); Audio8.sfx('click'); } })), { label: '← Voltar', fn: () => { menu(peer); return true; } }]);
    const o = document.querySelector('#dialog .dopts'); if (o) o.classList.add('emo-grade');
  }
  function parar(msg) { if (!seguindo) return; seguindo = null; P.qGo = null; if (typeof autoStop === 'function' && typeof AUTO !== 'undefined' && AUTO.on) autoStop(''); if (msg) log(msg, 'sys'); }
  // emojis que os outros mandaram (aparecem em cima deles) e seguir alguém
  const vistos = new Map();
  setInterval(() => {
    if (typeof running === 'undefined' || !running || typeof Net === 'undefined' || !Net.peers) return;
    for (const r of Net.peers()) { const e = r.s && r.s.emo; if (!e || vistos.get(r.peer) === e.at) continue; vistos.set(r.peer, e.at); if (Date.now() - e.at > 6000) continue;
      if (Math.hypot(r.x - P.x, r.z - P.z) < 45) floater(r.x, (r.s.y || 0) + 2.8, r.z, e.e, 'emo');
      if (e.to === Net.me) { log(`😀 <b>${esc(r.n)}</b> mandou ${esc(e.e)} para você!`, 'gold'); Audio8.sfx('buff'); } }
    if (seguindo) {
      const r = achar(seguindo), mexeu = (typeof joy !== 'undefined' && (joy.x || joy.y)) || keys.w || keys.a || keys.s || keys.d;
      if (!r || mexeu || P.dead) { parar(r ? '🚶 Você parou de seguir.' : '🚶 A pessoa saiu: você parou de seguir.'); return; }
      const d = Math.hypot(r.x - P.x, r.z - P.z);
      // entrou na Torre, numa masmorra ou em casa: leva até a entrada e para de seguir (lá dentro é outro lugar)
      const fe = fechado(r); if (fe || inTower(r.z) !== inTower(P.z)) { parar(''); if (fe) naoDa(r, fe); else log('🚶 Você parou de seguir.', 'sys'); return; }
      // longe ou em outro mapa: o andar sozinho passa pelas passagens entre os mapas até chegar perto
      if (d > 2.6) { P.qGo = { x: r.x, z: r.z, name: r.n, seguir: true }; if (typeof autoStart === 'function' && !(typeof AUTO !== 'undefined' && AUTO.on)) autoStart(true); }
    }
  }, 300);
  // tocar no nome do jogador abre o menu
  document.addEventListener('pointerdown', e => { const l = e.target.closest && e.target.closest('.plabel[data-peer]'); if (!l) return; e.preventDefault(); e.stopPropagation(); Audio8.sfx('click'); menu(l.dataset.peer); }, true);
  return { menu, pres, fechado, naoDa, get seguindo() { return seguindo; } };
})();
