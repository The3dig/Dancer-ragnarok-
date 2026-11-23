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
  // ---------------- masmorra em grupo com aceite (pedido do Rone): quem chama vira o líder; cada um do grupo
  // responde; todos aceitaram → o líder entra e o grupo entra junto; alguém recusou ou não respondeu → ninguém entra
  let pedido = null, resposta = null, pedidosVistos = new Set(), aguardando = null, pedT = 0;
  function pedirMasmorra(o) {
    const M = membros(); if (!M.length) { o.comecar(); return; }
    pedido = { id: Math.random().toString(36).slice(2, 8), z: o.z, nome: o.nome, dif: o.dif || 1, comecar: o.comecar, ate: Date.now() + 30000, quem: M.map(r => ({ peer: r.peer, n: r.n })) };
    Audio8.sfx('click'); log(`👥 Pedido enviado ao grupo: <b>${esc(o.nome)}</b> nível ${pedido.dif}. Esperando todos aceitarem (30 s)...`, 'sys'); pedT = 0; telaPedido();
  }
  const respDe = r => { const g = r && r.s && r.s.gr; return g && pedido && g.id === pedido.id ? g.ok : null; };
  function telaPedido() {
    if (!pedido) return;
    const vivos = Net.peers(), linhas = pedido.quem.map(q => { const r = vivos.find(v => v.peer === q.peer); const ok = respDe(r); return `${ok === true ? '✅' : ok === false ? '❌' : r ? '⏳' : '📴'} <b>${esc(q.n)}</b>${ok === true ? ' aceitou' : ok === false ? ' recusou' : r ? ' ainda não respondeu' : ' saiu do jogo'}`; }).join('<br>');
    const h = linhas + `<br><br><small>Tempo: ${Math.max(0, Math.ceil((pedido.ate - Date.now()) / 1000))} s</small>`;
    if (pedT && dialogOpen && $('dialog').dataset.ped === h) return;
    dialog(`👥 ${esc(pedido.nome)} · nível ${pedido.dif}`, `Só entra se <b>todo o grupo aceitar</b>.<br><br>${h}`, [{ label: 'Cancelar o pedido', fn: () => { log('👥 Você cancelou o pedido.', 'sys'); pedido = null; } }]);
    $('dialog').dataset.ped = h; pedT = 1;
  }
  function checarPedido() {
    if (pedido) {
      const vivos = Net.peers(), rs = pedido.quem.map(q => { const r = vivos.find(v => v.peer === q.peer); return r ? respDe(r) : false; });
      const recusou = pedido.quem.filter((q, i) => rs[i] === false);
      if (recusou.length) { const nomes = recusou.map(q => q.n).join(', '); closeDialog(); log(`👥 <b>${esc(nomes)}</b> não ${recusou.length > 1 ? 'aceitaram' : 'aceitou'}. Ninguém entra.`, 'bad'); Audio8.sfx('miss'); pedido = null; pedT = 0; }
      else if (rs.every(x => x === true)) { const c = pedido.comecar; pedido = null; pedT = 0; closeDialog(); log('👥 Todos aceitaram! Entrando...', 'gold'); c(); }
      else if (Date.now() > pedido.ate) { closeDialog(); log('👥 Nem todos responderam a tempo. Ninguém entra.', 'bad'); Audio8.sfx('miss'); pedido = null; pedT = 0; }
      else if (dialogOpen && $('dialog').dataset.ped) telaPedido();
    }
    // pedidos que chegaram para mim
    for (const r of Net.peers()) {
      const g = r.s && r.s.gd; if (!g || !gp() || g.gp !== gp() || pedidosVistos.has(g.id)) continue; pedidosVistos.add(g.id);
      Audio8.sfx('buff');
      const responder = ok => { resposta = { id: g.id, ok, ate: Date.now() + 40000 }; if (ok) { aguardando = { z: g.z, dif: g.dif, ate: Date.now() + 45000 }; log(`👥 Você aceitou. Quando todos aceitarem, você entra junto com <b>${esc(r.n)}</b>.`, 'gold'); } else log('👥 Você recusou o pedido.', 'sys'); };
      dialog('👥 Masmorra em grupo', `<b>${esc(r.n)}</b> quer entrar em <b>${esc(g.nome)}</b> (nível ${g.dif}) com o grupo.<br><small>Só entram se todos aceitarem. Se você aceitar, entra sozinho junto quando o último aceitar.</small>`, [
        { label: '✅ Aceitar', fn: () => responder(true) }, { label: '❌ Recusar', fn: () => responder(false) }]);
    }
    // aceitei: entro assim que a corrida do líder aparecer
    if (aguardando) {
      const D = typeof MASMORRAS !== 'undefined' && MASMORRAS[aguardando.z];
      if (Date.now() > aguardando.ate) aguardando = null;
      else if (D && D.corridaDoGrupo && D.corridaDoGrupo() && D.entrar) { const a = aguardando; aguardando = null; if (dialogOpen) closeDialog(); D.entrar('grupo', a.dif, true); }
    }
  }
  let convite = null, vistos = new Set(), nomesAntes = null, chkT = 0, envios = [], apoios = [], apoioVisto = new Set();
  const gp = () => P.grupo || null;
  const online = () => typeof Net !== 'undefined' && Net.connected && Net.me;
  function membros() { if (!gp() || !online()) return []; return Net.peers().filter(r => r.n && r.s.gp === gp()); }
  function doGrupo(peer) { return !!gp() && online() && Net.peers().some(r => r.peer === peer && r.s.gp === gp()); }
  const esc = t => String(t || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])).slice(0, 40);
  const perto = r => Math.hypot(r.x - P.x, r.z - P.z) < PERTO;
  // vai na presença: o meu grupo e o convite que estou mandando
  function pres() { const t = Date.now(); envios = envios.filter(e => t - e.at < 20000); return { gd: pedido && t < pedido.ate ? { id: pedido.id, z: pedido.z, nome: pedido.nome, dif: pedido.dif, gp: gp() } : null, gr: resposta && t < resposta.ate ? { id: resposta.id, ok: resposta.ok } : null, gp: gp(), gc: convite && t < convite.ate ? { to: convite.to, gp: convite.gp, id: convite.id } : null, gi: envios.length ? envios.slice(-12).map(({ to, id, n, k, de }) => ({ to, id, n, k, de })) : null, ga: (apoios = apoios.filter(a => t - a.at < 6000)).length ? apoios.map(({ at, ...a }) => a) : null }; }
  // ---------------- divisão dos itens da caçada (como o "dividir itens" do Ragnarok)
  // quem mata sorteia cada item entre quem é do grupo e está perto do monstro (inclusive ele mesmo)
  // anti-leech (como o Ragnarok): só divide com quem tem nível parecido.
  // até 10 níveis de diferença: parte inteira; de 10 a 20: vai caindo; mais de 20: nada da caçada do outro
  const peso = (a, b) => { const g = Math.abs((a || 1) - (b || 1)); return g <= 10 ? 1 : g >= 20 ? 0 : (20 - g) / 10; };
  const pertoDe = (m, ref) => membros().filter(r => r.s.st !== 'd' && Math.hypot(r.x - m.x, r.z - m.z) < PERTO && peso(ref, r.s.lv) > 0);
  // quem mata sorteia cada item entre quem é do grupo, está perto e tem nível parecido (inclusive ele mesmo)
  // ---------------- suporte: cura e proteção valem para o grupo perto (até 15 m)
  // (Lyra, Thornox, Erya, Mãe e as outras curas/proteções; o Modo Fúria e buffs com lado ruim ficam só para quem usou)
  function apoio(s) {
    if (!gp() || !online() || !membros().length) return;
    const ok = s.type === 'heal' || (s.type === 'buff' && !s.fury && !Object.values(s.mods || {}).some(v => v < 0) && !(s.mods && s.mods.poison));
    if (!ok) return;
    apoios.push({ k: Math.random().toString(36).slice(2, 8), id: s.id, nome: s.name, ic: s.icon, t: s.type, pct: s.pct || s.heal || 0, dur: s.dur || 0, mods: s.mods || null, at: Date.now() });
    if (!P.apoioAviso) { P.apoioAviso = 1; log(`👥 <b>${s.name}</b> também vale para quem é do seu grupo e está perto (até 15 m).`, 'sys'); }
  }
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
  // ---------------- painel do grupo (janela própria, pedido do Rone: o antigo era só uma lista)
  let win = null, aberto = false, regras = false;
  function painel() {
    if (!online()) { dialog('👥 Grupo', 'O grupo funciona com os amigos on-line no mesmo mundo (precisa de internet).'); return; }
    if (aberto && win && !win.classList.contains('hidden')) { fechar(); return; }
    if (dialogOpen) closeDialog();
    if (!win) {
      win = document.createElement('div'); win.id = 'grupowin'; win.className = 'win hidden'; $('hud').appendChild(win);
      win.addEventListener('click', e => {
        const t = e.target.closest('[data-a]'); if (!t) return; Audio8.sfx('click');
        const a = t.dataset.a, v = t.dataset.v, r = Net.peers().find(x => x.peer === v);
        if (a === 'x') { fechar(); return; }
        if (a === 'chamar' && r) convidar(r);
        if (a === 'ir' && r) { P.qGo = { x: r.x, z: r.z, name: r.n }; log(`🧭 Indo até <b>${esc(r.n)}</b>.`, 'sys'); if (typeof autoStart === 'function') autoStart(); fechar(); return; }
        if (a === 'sair') sair();
        if (a === 'regras') regras = !regras;
        desenhar();
      });
    }
    aberto = true; win.classList.remove('hidden'); desenhar();
  }
  function fechar() { aberto = false; if (win) win.classList.add('hidden'); }
  const corV = hp => hp > 60 ? '#5ae07a' : hp > 30 ? '#ffd060' : '#ff5a5a';
  function desenhar() {
    if (!win || !aberto) return;
    const M = membros(), fora = Net.peers().filter(r => r.n && (!gp() || r.s.gp !== gp())).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z));
    const cls = r => { try { const c = CLASSES[r.s.look && r.s.look.cls]; return c ? (c.name[r.s.look.gender] || c.name.f) : ''; } catch (e) { return ''; } };
    const card = (nome, lv, classe, hp, dist, botoes, eu) => `<div class="gr-card${eu ? ' eu' : ''}"><div class="gr-av">${esc(nome).slice(0, 1).toUpperCase()}</div><div class="gr-info"><div><b>${esc(nome)}</b>${eu ? ' <small>(você)</small>' : ''} <span class="gr-lv">Nv ${lv || '?'}</span></div><small>${esc(classe)}${dist}</small><div class="gr-hp"><i style="width:${hp}%;background:${corV(hp)}"></i></div></div><div class="gr-bt">${botoes}</div></div>`;
    const meuHp = Math.round(P.hp / stats.maxHp() * 100);
    const eu = card(P.name, P.lv, className(P.cls, P.gender), meuHp, '', '', true);
    const lista = M.map(r => { const hp = Math.max(0, Math.min(100, r.s.hp ?? 100)), d = Math.round(Math.hypot(r.x - P.x, r.z - P.z));
      return card(r.n, r.s.lv, cls(r), r.s.st === 'd' ? 0 : hp, ` · ${r.s.st === 'd' ? '💀 caído' : perto(r) ? '<span class="gr-perto">perto</span>' : d + ' m'}`, `<button data-a="ir" data-v="${r.peer}" title="Ir até">🧭</button>`); }).join('');
    const chamar = fora.slice(0, 12).map(r => `<div class="gr-fora"><span><b>${esc(r.n)}</b> <small>Nv ${r.s.lv || '?'} · ${esc(cls(r))}${r.s.gp ? ' · já tem grupo' : ''}</small></span><button data-a="chamar" data-v="${r.peer}">➕ Chamar</button></div>`).join('');
    const h = `<div class="wt">👥 Grupo <small>${gp() ? `${M.length + 1} de ${MAX}` : 'sem grupo'}</small><span class="x" data-a="x">×</span></div><div class="gr-b">
      <div class="gr-sec">⚔️ Companheiros</div>${eu}${lista || '<div class="gr-vazio">Ninguém no grupo ainda. Chame alguém aqui embaixo!</div>'}
      <div class="gr-sec">📨 Chamar para o grupo</div>${chamar || '<div class="gr-vazio">Não tem mais ninguém on-line agora.</div>'}
      <div class="gr-sec gr-reg" data-a="regras">📜 Como funciona o grupo ${regras ? '▲' : '▼'}</div>${regras ? `<div class="gr-txt">Quando um de vocês mata um monstro e o outro está perto (até ${PERTO} m), <b>o XP é dividido</b> com +10% por companheiro (só com nível parecido: até 10 níveis de diferença, parte inteira; mais de 20, nada). O monstro conta nas <b>missões, desafios e aventuras</b> de todos, e os <b>itens são sorteados</b> entre quem está perto. Curas e proteções valem para o grupo perto (15 m). Nas masmorras em grupo, <b>todos precisam aceitar</b> para entrar.</div>` : ''}
      ${gp() ? '<div class="gr-fim"><button data-a="sair" class="perigo">🚪 Sair do grupo</button></div>' : ''}</div>`;
    if (win.dataset.h !== h) { win.innerHTML = h; win.dataset.h = h; }
  }
  // convites recebidos e quem entrou/saiu do grupo
  function update(dt) {
    if ((chkT -= dt) > 0 || !online()) return; chkT = 0.5;
    checarPedido(); if (aberto) desenhar();
    // cura e proteção que um companheiro de grupo jogou perto de mim
    for (const r of Net.peers()) {
      if (r.s.gp !== gp() || !gp() || Math.hypot(r.x - P.x, r.z - P.z) > 15 || P.dead) continue;
      for (const a of (r.s.ga || [])) {
        if (!a || apoioVisto.has(a.k)) continue; apoioVisto.add(a.k); if (apoioVisto.size > 200) apoioVisto = new Set([...apoioVisto].slice(-100));
        if (a.t === 'heal' && a.pct > 0) { const v = Math.round(stats.maxHp() * Math.min(0.6, a.pct)); P.hp = Math.min(stats.maxHp(), P.hp + v); floater(P.x, P.y + 2.4, P.z, '+' + v, 'heal'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0x8affb0, 16, 2, 0.6); }
        if (a.t === 'buff' && a.mods && typeof addBuff === 'function') { addBuff(a.id + '_g', Math.min(60, a.dur || 20), a.mods, a.ic); if (a.pct) P.hp = Math.min(stats.maxHp(), P.hp + stats.maxHp() * Math.min(0.3, a.pct)); }
        log(`👥 ${esc(r.n)} usou <b>${esc(a.ic)} ${esc(a.nome)}</b> em você.`, 'sys');
      }
    }
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
    if (window.top !== window) { log('🎤 Aqui dentro desta página o microfone não funciona. Abra o jogo direto no navegador (Safari ou Chrome) para usar o rádio.', 'bad'); return; }
    try { mic = mic && mic.active ? mic : await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e1) {
      // alguns celulares recusam o pedido com ajustes de áudio: tenta o pedido simples
      try { if (e1 && e1.name === 'NotAllowedError') throw e1; mic = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (e) {
        const ios = /iPhone|iPad|iPod/.test(navigator.userAgent), app = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
        const msg = e && e.name === 'NotFoundError' ? 'Não achei nenhum microfone neste aparelho.'
          : e && e.name === 'NotReadableError' ? 'O microfone está sendo usado por outro app (ligação, gravador...). Feche o outro app e tente de novo.'
          : ios ? (app ? 'O iPhone bloqueou o microfone para o jogo. Vá em <b>Ajustes → Safari → Microfone</b> e escolha <b>Perguntar</b> ou <b>Permitir</b>, feche o jogo e abra de novo.' : 'O Safari bloqueou o microfone para o jogo. Toque em <b>aA</b> na barra de endereço → <b>Ajustes do Site</b> → <b>Microfone</b> → <b>Permitir</b>, e tente de novo.')
          : 'O navegador bloqueou o microfone para o jogo. Toque no cadeado ao lado do endereço do site → <b>Permissões</b> → <b>Microfone</b> → <b>Permitir</b>, e tente de novo.';
        log('🎤 ' + msg, 'bad'); return;
      }
    }
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
    // 🎤 rádio do grupo DESLIGADO (decisão do Rone: a turma usa o Discord; o código fica guardado se quiser voltar)
    if (false && !$('t-voz') && $('tbtns')) {
      const b = document.createElement('button'); b.id = 't-voz'; b.title = 'Rádio do grupo: segure e fale'; b.textContent = '🎤'; b.style.display = 'none'; $('tbtns').appendChild(b);
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); gravar(); });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, e => { e.preventDefault(); parar(); });
    }
    if ($('chat-hist')) $('chat-hist').addEventListener('click', e => { const a = e.target.closest('.vozlink'); if (a) tocar(a.dataset.v); });

    if (!$('btn-grupo')) { const b = document.createElement('button'); b.id = 'btn-grupo'; b.title = 'Grupo'; b.textContent = '👥'; b.onclick = painel; $('menu').insertBefore(b, $('btn-help')); }
  }
  return { pedirMasmorra, init, update, pres, painel, html, membros, doGrupo, convidar, sair, sortear, enviar, parteXp, quantosPerto, parteDoMatador, peso, apoio, PERTO };
})();
