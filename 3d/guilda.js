// =====================================================================
//  Guildas: criar, convidar, organizar (líder 👑, oficiais ⭐, membros),
//  aviso da guilda, chat só da guilda e a sigla em cima do nome.
//  Ficam guardadas no servidor (servidor/ → Contas). Quem é da mesma
//  guilda nunca se ataca; na Torre do Cisma o PvP é livre para os outros.
// =====================================================================
'use strict';
const Guilda = (() => {
  const EMBLEMAS = ['🛡️', '⚔️', '🐉', '🦅', '🐺', '💀', '🔥', '🌙', '⭐', '👑', '🌹', '🕷️', '🦇', '🗡️', '🏹', '🔱'];
  const CARGO = { lider: '👑 Líder', oficial: '⭐ Oficial', membro: 'Membro' };
  let st = { guilda: null, cargo: null, convites: [] }, aberta = false, pollT = 0, msg = '', avisados = new Set();
  const esc = t => String(t || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const vaga = () => typeof Contas !== 'undefined' ? Contas.slot : 0;
  const q = () => `?vaga=${vaga()}&nome=${encodeURIComponent(P.name || '')}`;
  async function atualizar() {
    try {
      st = await Nuvem.api('GET', '/conta/guilda' + q());
      for (const c of st.convites || []) if (!avisados.has(c.id)) { avisados.add(c.id); log(`📨 <b>${esc(c.de)}</b> convidou você para a guilda <b>${esc(c.emblema)} [${esc(c.sigla)}] ${esc(c.nome)}</b>. Abra 🛡️ Guilda para responder.`, 'gold'); Audio8.sfx('buff'); }
    } catch (e) { }
    marcar(); if (aberta) render();
  }
  async function acao(nome, corpo = {}) {
    try { await Nuvem.api('POST', '/conta/guilda/' + nome, { vaga: vaga(), nome: P.name, ...corpo }); msg = ''; Audio8.sfx('click'); await atualizar(); return true; }
    catch (e) { msg = '⚠️ ' + e.message; Audio8.sfx('miss'); render(); return false; }
  }
  // ---------------- o que vai na presença (os outros veem a sigla e sabem quem é aliado)
  function pres() { const g = st.guilda; return g ? { gid: g.id, gt: g.sigla } : {}; }
  const minha = () => st.guilda ? st.guilda.id : null;
  const aliado = s => !!(s && s.gid && minha() && s.gid === minha());
  // ---------------- botão e painel
  function init() {
    if (!$('btn-guild')) {
      const b = document.createElement('button'); b.id = 'btn-guild'; b.title = 'Guilda'; b.textContent = '🛡️';
      b.onclick = () => { Audio8.sfx('click'); abrir(!aberta); };
      $('menu').insertBefore(b, $('btn-help'));
    }
    if (!$('guildwin')) { const w = document.createElement('div'); w.id = 'guildwin'; w.className = 'win hidden'; $('hud').appendChild(w); w.addEventListener('click', clique); w.addEventListener('submit', e => { e.preventDefault(); enviarForm(e.target); }); }
    atualizar();
  }
  function marcar() { const b = $('btn-guild'); if (b) b.classList.toggle('alert', !!(st.convites && st.convites.length)); }
  function abrir(on) { aberta = on; $('guildwin').classList.toggle('hidden', !on); if (on) { render(); atualizar(); } }
  const online = () => new Set((typeof Net !== 'undefined' && Net.peers ? Net.peers() : []).map(r => String(r.n || '').toLowerCase()));
  function render() {
    const w = $('guildwin'); if (!w) return;
    const g = st.guilda, eu = st.cargo, on = online();
    let h = `<div class="wt">🛡️ Guilda<button class="x" data-a="fechar">×</button></div><div class="gw-b">`;
    if (msg) h += `<div class="gw-msg">${esc(msg)}</div>`;
    if (!g) {
      if ((st.convites || []).length) h += `<div class="gw-sec">📨 Convites</div>` + st.convites.map(c => `<div class="gw-row"><span>${esc(c.emblema)} <b>[${esc(c.sigla)}] ${esc(c.nome)}</b> <small>de ${esc(c.de)}</small></span><span><button data-a="aceitar" data-v="${c.id}">Entrar</button><button data-a="recusar" data-v="${c.id}" class="sec">Recusar</button></span></div>`).join('');
      h += `<div class="gw-sec">✨ Criar uma guilda <small>(custa 10.000 cr)</small></div>
        <form class="gw-form" data-f="criar"><input name="gnome" maxlength="20" placeholder="Nome da guilda"><input name="sigla" maxlength="4" placeholder="Sigla (ex.: KVX)" style="text-transform:uppercase">
        <div class="gw-emb">${EMBLEMAS.map((e, i) => `<label><input type="radio" name="emblema" value="${e}" ${i ? '' : 'checked'}><span>${e}</span></label>`).join('')}</div>
        <button type="submit">🛡️ Criar guilda</button></form>
        <p class="gw-dica">Na guilda, ninguém ataca ninguém. Na <b>Torre do Cisma</b> o PvP é livre para quem não é da sua guilda.</p>`;
    } else {
      const lider = eu === 'lider', chefe = eu === 'lider' || eu === 'oficial';
      h += `<div class="gw-topo"><span class="gw-e">${esc(g.emblema)}</span><div><b>[${esc(g.sigla)}] ${esc(g.nome)}</b><small>${g.membros.length} membro(s) · você é ${CARGO[eu] || eu}</small></div></div>`;
      h += `<div class="gw-sec">📌 Aviso da guilda</div>${chefe ? `<form class="gw-form gw-in" data-f="aviso"><input name="texto" maxlength="200" value="${esc(g.aviso)}" placeholder="Escreva um recado para todos"><button type="submit">Salvar</button></form>` : `<div class="gw-aviso">${esc(g.aviso) || '<i>sem aviso</i>'}</div>`}`;
      h += `<div class="gw-sec">💬 Mensagem só para a guilda</div><form class="gw-form gw-in" data-f="chat"><input name="texto" maxlength="80" placeholder="Só os membros veem"><button type="submit">Enviar</button></form>`;
      if (chefe) {
        const perto = (typeof Net !== 'undefined' && Net.peers ? Net.peers() : []).filter(r => r.n && !(r.s && r.s.gid));
        h += `<div class="gw-sec">➕ Convidar</div><form class="gw-form gw-in" data-f="convidar"><input name="alvo" maxlength="16" placeholder="Nome do personagem"><button type="submit">Convidar</button></form>`;
        if (perto.length) h += `<div class="gw-perto">${perto.slice(0, 8).map(r => `<button data-a="convidar" data-v="${esc(r.n)}">+ ${esc(r.n)}</button>`).join('')}</div>`;
      }
      h += `<div class="gw-sec">👥 Membros</div>` + g.membros.map(mb => {
        const sou = mb.nome === String(P.name || '').toLowerCase(), ol = sou || on.has(mb.nome);
        let bt = '';
        if (!sou && lider) bt += mb.cargo === 'membro' ? `<button data-a="cargo" data-v="${esc(mb.nome)}" data-c="oficial">⭐ Promover</button>` : `<button data-a="cargo" data-v="${esc(mb.nome)}" data-c="membro" class="sec">Rebaixar</button>`;
        if (!sou && lider) bt += `<button data-a="cargo" data-v="${esc(mb.nome)}" data-c="lider" class="sec">👑 Passar liderança</button>`;
        if (!sou && (lider || (eu === 'oficial' && mb.cargo === 'membro'))) bt += `<button data-a="expulsar" data-v="${esc(mb.nome)}" class="perigo">Expulsar</button>`;
        return `<div class="gw-row"><span><i class="gw-on${ol ? ' sim' : ''}"></i><b>${esc(mb.exibe || mb.nome)}</b> <small>${CARGO[mb.cargo]}</small></span><span>${bt}</span></div>`;
      }).join('');
      h += `<div class="gw-fim"><button data-a="sair" class="perigo">🚪 Sair da guilda</button>${lider ? '<button data-a="desfazer" class="perigo">💥 Desfazer a guilda</button>' : ''}</div>`;
    }
    h += '</div>';
    if (w.dataset.h !== h) { w.innerHTML = h; w.dataset.h = h; }
  }
  let armado = '';
  async function clique(e) {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, v = b.dataset.v;
    if (a === 'fechar') return abrir(false);
    if (a === 'aceitar' || a === 'recusar') return acao(a, { guilda: +v });
    if (a === 'convidar') { if (await acao('convidar', { alvo: v })) { log(`📨 Convite enviado para <b>${esc(v)}</b>.`, 'sys'); } return; }
    if (a === 'cargo') return acao('cargo', { alvo: v, cargo: b.dataset.c });
    if (['expulsar', 'sair', 'desfazer'].includes(a)) {                      // pede um 2º toque para confirmar
      const k = a + (v || ''); if (armado !== k) { armado = k; msg = a === 'expulsar' ? `Toque de novo em Expulsar para tirar ${v}.` : a === 'sair' ? 'Toque de novo para sair da guilda.' : 'Toque de novo para DESFAZER a guilda (todos saem).'; render(); setTimeout(() => { if (armado === k) { armado = ''; msg = ''; render(); } }, 4000); return; }
      armado = ''; await acao(a, { alvo: v }); if (a !== 'expulsar') log(a === 'sair' ? '🚪 Você saiu da guilda.' : '💥 A guilda foi desfeita.', 'sys');
    }
  }
  async function enviarForm(f) {
    const tipo = f.dataset.f, d = Object.fromEntries(new FormData(f).entries());
    if (tipo === 'criar') {
      if (P.zeny < 10000) { msg = '⚠️ Criar uma guilda custa 10.000 cr.'; Audio8.sfx('miss'); return render(); }
      if (await acao('criar', { gnome: d.gnome, sigla: d.sigla, emblema: d.emblema })) { P.zeny -= 10000; save(); log(`🛡️ Você fundou a guilda <b>${esc(d.emblema)} [${esc(String(d.sigla).toUpperCase())}] ${esc(d.gnome)}</b>!`, 'gold'); Audio8.sfx('level'); }
    }
    if (tipo === 'aviso') { if (await acao('aviso', { texto: d.texto })) log('📌 Aviso da guilda salvo.', 'sys'); }
    if (tipo === 'convidar') { if (await acao('convidar', { alvo: d.alvo })) log(`📨 Convite enviado para <b>${esc(d.alvo)}</b>.`, 'sys'); }
    if (tipo === 'chat') { const t = String(d.texto || '').trim().slice(0, 80); if (!t || !minha()) return; P.say = { t, at: Date.now(), g: minha() }; log(`🛡️ <b>[Guilda] ${esc(P.name)}</b>: ${esc(t)}`, 'guild'); f.reset(); }
  }
  function update(dt) { if ((pollT -= dt) > 0) return; pollT = 30; atualizar(); }      // convites e mudanças: a cada 30 s
  return { init, update, pres, aliado, minha, abrir, get sigla() { return st.guilda ? st.guilda.sigla : null; } };
})();
