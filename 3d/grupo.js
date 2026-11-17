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
  // anti-leech (como o Ragnarok): só divide com quem tem nível parecido.
  // até 10 níveis de diferença: parte inteira; de 10 a 20: vai caindo; mais de 20: nada da caçada do outro
  const peso = (a, b) => { const g = Math.abs((a || 1) - (b || 1)); return g <= 10 ? 1 : g >= 20 ? 0 : (20 - g) / 10; };
  const pertoDe = (m, ref) => membros().filter(r => r.s.st !== 'd' && Math.hypot(r.x - m.x, r.z - m.z) < PERTO && peso(ref, r.s.lv) > 0);
  // quem mata sorteia cada item entre quem é do grupo, está perto e tem nível parecido (inclusive ele mesmo)
  function sortear(m) {
    if (!gp() || !online()) return null;
    const lista = [null, ...pertoDe(m, P.lv)];
    return lista.length > 1 ? lista[Math.floor(Math.random() * lista.length)] : null;
  }
  // XP dividido igual (com +10% por companheiro): 2 no grupo = 55% para cada; 4 = 32,5%; 8 = 21%
  function quantosPerto(m, ref = P.lv) { if (!gp() || !online()) return 1; return 1 + pertoDe(m, ref).length; }
  function parteXp(m, ref = P.lv) { const n = quantosPerto(m, ref); return n > 1 ? (1 + 0.1 * (n - 1)) / n : 1; }
  // do lado de quem NÃO matou: a parte dele, já com o desconto de diferença de nível (0 = leech: não ganha)
  function parteDoMatador(m, peer) {
    const k = Net.peers().find(r => r.peer === peer); if (!k) return { parte: 0 };
    const w = peso(P.lv, k.s.lv); if (w <= 0) return { parte: 0, lvK: k.s.lv };
    const n = 1 + pertoDe(m, k.s.lv).length;                           // eu + os do grupo perto (o matador entra aqui)
    return { parte: (n > 1 ? (1 + 0.1 * (n - 1)) / n : 1) * w, n, w };
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
    dialog('👥 Grupo', `${lista}<br><br><small>No grupo, quando um de vocês mata um monstro e o outro está perto (até ${PERTO} m), <b>o XP é dividido</b> (com bônus de 10% por companheiro; só com quem tem nível parecido: até 10 níveis de diferença, parte inteira; mais de 20, nada) e o monstro <b>conta nas missões, desafios e aventuras dos amigos dos dois</b>. Os <b>itens são sorteados</b> entre quem está perto.</small>${fora.length ? '' : '<br><br><i>Não tem mais ninguém on-line agora para chamar.</i>'}`, opts);
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
    const bv = $('t-voz'); if (bv) bv.style.display = nomes ? '' : 'none';
  }
  // os companheiros no quadro de Missões
  function html() {
    const M = membros(); if (!M.length) return '';
    return `<div class="qi" data-grupo="1"><b style="color:#7dff6a">👥 Grupo</b><br>` + M.map(r => { const hp = Math.max(0, Math.min(100, r.s.hp ?? 100)); return `${r.n} <span style="display:inline-block;width:46px;height:6px;background:#3a2030;border-radius:3px;vertical-align:middle"><span style="display:block;width:${hp}%;height:6px;background:${hp > 40 ? '#5ae07a' : '#ff5a5a'};border-radius:3px"></span></span> <small>${perto(r) ? 'perto' : Math.round(Math.hypot(r.x - P.x, r.z - P.z)) + ' m'}</small>`; }).join('<br>') + '</div>';
  }
  // ---------------- rádio do grupo: segure 🎤, fale e solte (até 10 s); chega só para o grupo
  let mic = null, rec = null, pedacos = [], recIni = 0, recTimer = null, vozN = 0;
  const VOZES = new Map();
  const mimeOk = () => typeof MediaRecorder === 'undefined' ? null : ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  async function gravar() {
    if (rec || !online() || !membros().length) { if (!membros().length) log('🎤 O rádio fala com o seu grupo: chame alguém no 👥 primeiro.', 'sys'); return; }
    if (mimeOk() === null || !navigator.mediaDevices) { log('🎤 Este navegador não grava áudio.', 'bad'); return; }
    try { mic = mic && mic.active ? mic : await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { log('🎤 Sem permissão para usar o microfone. Libere nas configurações do navegador.', 'bad'); return; }
    const t = mimeOk(); pedacos = [];
    try { rec = new MediaRecorder(mic, { ...(t ? { mimeType: t } : {}), audioBitsPerSecond: 24000 }); } catch (e) { rec = new MediaRecorder(mic); }
    rec.ondataavailable = e => { if (e.data && e.data.size) pedacos.push(e.data); };
    rec.onstop = mandar;
    rec.start(); recIni = Date.now(); $('t-voz') && $('t-voz').classList.add('rec');
    let av = $('vozaviso'); if (!av) { av = document.createElement('div'); av.id = 'vozaviso'; $('hud').appendChild(av); } av.style.display = ''; av.textContent = '🎙️ Gravando... solte para mandar ao grupo';
    recTimer = setTimeout(parar, 10000);
  }
  function parar() { clearTimeout(recTimer); if (rec && rec.state === 'recording') rec.stop(); $('t-voz') && $('t-voz').classList.remove('rec'); const av = $('vozaviso'); if (av) av.style.display = 'none'; }
  function mandar() {
    const r = rec; rec = null; const seg = (Date.now() - recIni) / 1000;
    if (seg < 0.5 || !pedacos.length) return;
    const blob = new Blob(pedacos, { type: r && r.mimeType || pedacos[0].type || 'audio/webm' }), fr = new FileReader();
    fr.onload = () => {
      const a = String(fr.result).split(',')[1] || ''; if (a.length > 150000) { log('🎤 Recado muito longo. Fale um pouco menos.', 'bad'); return; }
      Net.send({ t: 'voz', para: membros().map(x => x.peer), n: P.name, a, mime: blob.type, seg: Math.round(seg) });
      guardar(blob, P.name, Math.round(seg), true);
    };
    fr.readAsDataURL(blob);
  }
  function guardar(blob, nome, seg, eu) {
    const id = 'v' + (++vozN), url = URL.createObjectURL(blob); VOZES.set(id, url); if (VOZES.size > 20) { const [k, u] = VOZES.entries().next().value; URL.revokeObjectURL(u); VOZES.delete(k); }
    chatMsg(`👥 <b>[Grupo] ${esc(nome)}</b>: <a class="vozlink" data-v="${id}">🎤 recado de voz (${seg || 1} s) ▶</a>`, 'grupo', eu);
    return url;
  }
  function tocar(id) { const u = VOZES.get(id); if (!u) return; const au = new window.Audio(u); au.play().catch(() => log('🎤 Toque no ▶ do recado no chat para ouvir.', 'sys')); }
  function recebeu(m) {
    if (!m || !m.a || !doGrupo(m.de)) return;
    try {
      const bin = atob(m.a), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const url = guardar(new Blob([u8], { type: m.mime || 'audio/webm' }), m.n || '?', m.seg);
      const au = new window.Audio(url); au.play().catch(() => log('🎤 Chegou recado de voz: toque no ▶ no chat para ouvir.', 'sys'));
    } catch (e) { }
  }
  function init() {
    if (typeof Net !== 'undefined' && Net.on) Net.on('voz', recebeu);
    if (!$('t-voz') && $('tbtns')) {
      const b = document.createElement('button'); b.id = 't-voz'; b.title = 'Rádio do grupo: segure e fale'; b.textContent = '🎤'; b.style.display = 'none'; $('tbtns').appendChild(b);
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); gravar(); });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, e => { e.preventDefault(); parar(); });
    }
    if ($('chat-hist')) $('chat-hist').addEventListener('click', e => { const a = e.target.closest('.vozlink'); if (a) tocar(a.dataset.v); });

    if (!$('btn-grupo')) { const b = document.createElement('button'); b.id = 'btn-grupo'; b.title = 'Grupo'; b.textContent = '👥'; b.onclick = painel; $('menu').insertBefore(b, $('btn-help')); }
  }
  return { init, update, pres, painel, html, membros, doGrupo, convidar, sair, sortear, enviar, parteXp, quantosPerto, parteDoMatador, peso, PERTO };
})();
