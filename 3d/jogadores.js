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
  // 📢 "me sigam": quem chama manda uma ordem na presença; o companheiro de grupo começa a seguir sozinho (mexer o joystick cancela)
  let ordem = null; const ordVistas = new Map();
  function pres() { const o = { ...(typeof presAura === 'function' ? presAura() : {}) }; if (emo && Date.now() - emo.at < 6000) o.emo = emo; if (ordem && Date.now() - ordem.at < 8000) o.ord = ordem; return o; }
  function chamarSeguir(peers) { ordem = { to: peers, at: Date.now() }; Audio8.sfx('buff'); log(`📢 Você chamou ${peers.length > 1 ? 'o grupo' : '<b>' + esc((achar(peers[0]) || {}).n || '') + '</b>'} para seguir você.`, 'sys'); }
  setInterval(() => {
    if (typeof running === 'undefined' || !running || typeof Net === 'undefined' || !Net.peers || !P.grupo) return;
    for (const r of Net.peers()) { const o = r.s && r.s.ord; if (!o || ordVistas.get(r.peer) === o.at || Date.now() - o.at > 8000) continue; ordVistas.set(r.peer, o.at);
      if (r.s.gp !== P.grupo || !Array.isArray(o.to) || !o.to.includes(Net.me)) continue;
      const fe = fechado(r); if (fe) { naoDa(r, fe); continue; }
      seguindo = r.peer; banner(`📢 SEGUINDO ${String(r.n).toUpperCase()}`); log(`📢 <b>${esc(r.n)}</b> chamou você: agora você está <b>seguindo</b>. Mexa o personagem para parar.`, 'gold'); Audio8.sfx('buff'); }
  }, 700);
  function menu(peer) {
    const r = achar(peer); if (!r) return; const s = r.s || {}, d = Math.round(Math.hypot(r.x - P.x, r.z - P.z));
    const meuGrupo = P.grupo && s.gp === P.grupo, minhaG = typeof Guilda !== 'undefined' && Guilda.minha();
    const opts = [
      { label: '👤 Ver perfil', fn: () => { perfil(peer); return true; } },
      { label: seguindo === peer ? '⏹️ Parar de seguir' : '🚶 Seguir', fn: () => { if (seguindo === peer) parar('🚶 Você parou de seguir.'); else if (fechado(r)) naoDa(r, fechado(r)); else { seguindo = peer; log(`🚶 Seguindo <b>${esc(r.n)}</b>. Mexa o personagem para parar.`, 'sys'); } } },
      ...(meuGrupo ? [{ label: '📢 Fazer ele me seguir', fn: () => { chamarSeguir([peer]); } }] : []),
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
    if (['torre', 'topo', 'abismo', 'abfundo'].includes(z)) return null;   // Torre e Abismo não são masmorra: quem segue entra junto (puxar)
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
      const fe = fechado(r); if (fe) { parar(''); naoDa(r, fe); return; }
      if (inTower(r.z) !== inTower(P.z) || (inTower(r.z) && andar(r) !== andar(P))) return;          // Torre/Abismo: o "puxar" abaixo leva você junto
      // parado perto dele: não fica indo e voltando (só volta a andar quando ele se afasta de verdade)
      if (d > 4.5 || (typeof AUTO !== 'undefined' && AUTO.on && d > 2.6)) { P.qGo = { x: r.x, z: r.z, name: r.n, seguir: true }; if (typeof autoStart === 'function' && !(typeof AUTO !== 'undefined' && AUTO.on)) autoStart(true); }
    }
  }, 300);
  // 🗼 Torre e Abismo não são masmorra (pedido do Rone): quando quem você segue (ou alguém do grupo que estava do seu lado)
  // entra, você entra junto, no mesmo andar; lá dentro, quem você segue troca de andar e você vai junto
  const andar = o => { if (!inTower(o.z)) return null; const f = floorAt(o.x, o.z); return f && !f.casa && !f.mina ? f.i : null; };
  const fora = new Map(); let puxT = 0;
  setInterval(() => {
    if (typeof running === 'undefined' || !running || typeof Net === 'undefined' || !Net.peers || P.dead || typeof Tower === 'undefined' || Date.now() < puxT) return;
    for (const r of Net.peers()) {
      if (!r.n || typeof r.x !== 'number') continue;
      if (!inTower(r.z)) { fora.set(r.peer, { x: r.x, z: r.z, t: Date.now() }); continue; }
      const fl = andar(r); if (fl == null) continue;
      const sigo = seguindo === r.peer, grupo = P.grupo && r.s && r.s.gp === P.grupo, f = fora.get(r.peer);
      if (!inTower(P.z)) {
        const junto = f && Date.now() - f.t < 5000 && Math.hypot(f.x - P.x, f.z - P.z) < (sigo ? 60 : 20);
        if ((sigo || grupo) && junto) { fora.delete(r.peer); puxT = Date.now() + 3000; if (typeof autoStop === 'function') autoStop(''); Tower.enter(fl); log(`🗼 Você entrou junto com <b>${esc(r.n)}</b>.`, 'gold'); return; }
      } else if (sigo && andar(P) !== fl && andar(P) != null) { puxT = Date.now() + 3000; Tower.enter(fl, fl < andar(P)); log(`🗼 Você foi junto com <b>${esc(r.n)}</b> para o outro andar.`, 'sys'); return; }
    }
  }, 500);
  // ✨ Aura dos Irmãos (pedido do Rone): quem tem as 8 peças da Irmandade Eterna vestidas E o Valtrion ganha um círculo
  // dourado girando no chão, que todo mundo vê
  const temAura = () => { if (!P.equip || !(P.inv && P.inv.valtrion > 0)) return false; let n = 0; for (const sl in P.equip) { const I = ITEMS[P.equip[sl]]; if (I && I.set === 'amigos') n++; } return n >= 8; };
  const auraTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.translate(128, 128);
    const rg = g.createRadialGradient(0, 0, 40, 0, 0, 128); rg.addColorStop(0, 'rgba(255,220,120,0)'); rg.addColorStop(0.7, 'rgba(255,200,80,.35)'); rg.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = rg; g.fillRect(-128, -128, 256, 256);
    g.strokeStyle = 'rgba(255,236,170,.95)'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 112, 0, 7); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 92, 0, 7); g.stroke();
    g.fillStyle = 'rgba(255,236,170,.95)'; g.font = 'bold 18px Georgia'; g.textAlign = 'center'; for (let i = 0; i < 8; i++) { g.save(); g.rotate(i / 8 * Math.PI * 2); g.fillText('✦', 0, -97); g.restore(); }
    g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.lineTo(Math.cos(a) * 70, Math.sin(a) * 70); } g.closePath(); g.lineWidth = 2; g.stroke();
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
  function novaAura() {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: auraTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    m.renderOrder = 2; m.onBeforeRender = () => { m.rotation.y += 0.012; m.material.opacity = 0.75 + Math.sin(performance.now() / 400) * 0.25; }; return m;
  }
  let minhaAura = null; const auras = new Map();
  setInterval(() => {
    if (typeof running === 'undefined' || !running || typeof THREE === 'undefined') return;
    const eu = temAura();
    if (eu && !minhaAura) { minhaAura = novaAura(); scene.add(minhaAura); minhaAura.onAfterRender = () => {}; const f = minhaAura.onBeforeRender; minhaAura.onBeforeRender = (...x) => { f(...x); minhaAura.position.set(P.x, (typeof pisoY === 'function' ? pisoY(P.x, P.z) : P.y) + 0.04, P.z); }; if (!P.auraVista) { P.auraVista = 1; banner('✨ AURA DOS IRMÃOS'); log('✨ Você vestiu a <b>Irmandade Eterna completa</b> e tem o <b>Valtrion</b>: ganhou a <b>Aura dos Irmãos</b>, que todo mundo vê no chão embaixo de você!', 'gold'); } }
    if (!eu && minhaAura) { scene.remove(minhaAura); minhaAura = null; }
    if (typeof Net === 'undefined' || !Net.peers) return;
    const vivos = new Set();
    for (const r of Net.peers()) { if (!r.g || !(r.s && r.s.aura)) continue; vivos.add(r.peer); if (!auras.has(r.peer)) { const m = novaAura(); m.position.y = 0.04; r.g.add(m); auras.set(r.peer, { m, g: r.g }); } }
    for (const [p, o] of auras) if (!vivos.has(p)) { o.g.remove(o.m); auras.delete(p); }
  }, 600);
  const presAura = () => temAura() ? { aura: 1 } : {};
  // tocar no nome do jogador abre o menu
  document.addEventListener('pointerdown', e => { const l = e.target.closest && e.target.closest('.plabel[data-peer]'); if (!l) return; e.preventDefault(); e.stopPropagation(); Audio8.sfx('click'); menu(l.dataset.peer); }, true);
  return { menu, pres, fechado, naoDa, chamarSeguir, get seguindo() { return seguindo; } };
})();
