// =====================================================================
//  Guildas: criar, convidar, organizar (líder 👑, oficiais ⭐, membros),
//  aviso da guilda, chat só da guilda e a sigla em cima do nome.
//  VANTAGENS: a guilda tem nível (1 a 10). 10% do XP de monstro dos membros
//  vai para ela (sem tirar nada de ninguém) e cada nível dá bônus a todos.
//  Aura de grupo: cada membro perto dá +10% de XP (até +30%).
//  Chamado: viajar até um membro online (500 cr).
//  Ficam guardadas no servidor (servidor/ → Contas). Quem é da mesma
//  guilda nunca se ataca; na Torre do Cisma o PvP é livre para os outros.
// =====================================================================
'use strict';
const Guilda = (() => {
  const EMBLEMAS = ['🛡️', '⚔️', '🐉', '🦅', '🐺', '💀', '🔥', '🌙', '⭐', '👑', '🌹', '🕷️', '🦇', '🗡️', '🏹', '🔱'];
  const CARGO = { lider: '👑 Líder', oficial: '⭐ Oficial', membro: 'Membro' };
  let st = { guilda: null, cargo: null, convites: [] }, aberta = false, pollT = 0, msg = '', avisados = new Set(), pendente = 0, chamadoT = 0;
  // XP para chegar a cada nível (o nível 1 vem ao fundar)
  const XPN = [0, 50e3, 150e3, 400e3, 900e3, 2e6, 4e6, 7e6, 12e6, 20e6];
  const nivelDe = xp => XPN.filter(v => xp >= v).length;
  const nivel = () => st.guilda ? nivelDe((st.guilda.xp || 0) + pendente) : 0;
  const VANTAGENS = [
    [1, '👥 Aura de grupo: cada membro perto (até 30 m) dá <b>+10% de XP</b>, até +30%'],
    [1, '🧭 Chamado: viajar até um membro online (500 cr)'],
    [1, '📈 <b>+1% de XP e +1% de coroas</b> por nível da guilda'],
    [2, '🏷️ <b>5% de desconto</b> nas lojas'],
    [3, '❤️ <b>+5% de vida máxima</b>'],
    [5, '⚔️ <b>+5% de dano</b>'],
    [7, '🎁 <b>+10% de chance de item</b>'],
    [10, '👑 Vida e dano: <b>+10%</b> (no lugar dos +5%)'],
  ];
  // membros da guilda perto (mesmo mapa)
  function perto() {
    if (!minha() || typeof Net === 'undefined' || !Net.peers) return 0;
    let n = 0;
    for (const r of Net.peers()) if (r.s && r.s.gid === minha() && r.s.st !== 'd' && inVal(r.z) === inVal(P.z) && inTower(r.z) === inTower(P.z) && Math.hypot(r.x - P.x, r.z - P.z) < 30) n++;
    return Math.min(3, n);
  }
  let bCache = null, bT = 0;
  function bonus() {
    const agora = Date.now(); if (bCache && agora - bT < 500) return bCache; bT = agora;
    const nv = nivel(), aura = perto();
    return (bCache = { nv, aura, xp: nv * 0.01 + aura * 0.1, cr: nv * 0.01, desc: nv >= 2 ? 0.05 : 0, hp: nv >= 10 ? 0.1 : nv >= 3 ? 0.05 : 0, dano: nv >= 10 ? 0.1 : nv >= 5 ? 0.05 : 0, drop: nv >= 7 ? 0.1 : 0 });
  }
  // 10% do XP de monstro vai para a guilda (mandado junto com a atualização)
  function contribuir(xp) { if (minha() && xp > 0) pendente += Math.round(xp * 0.1); }
  function hud() { const b = bonus(); return b.aura ? `<span title="Aura da guilda">🛡️ +${b.aura * 10}% XP</span>` : ''; }
  const esc = t => String(t || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const vaga = () => typeof Contas !== 'undefined' ? Contas.slot : 0;
  const q = () => `?vaga=${vaga()}&nome=${encodeURIComponent(P.name || '')}`;
  async function atualizar() {
    if (pendente > 0 && minha()) { const v = pendente; pendente = 0; try { await Nuvem.api('POST', '/conta/guilda/xp', { vaga: vaga(), nome: P.name, v }); } catch (e) { pendente += v; } }
    const nvAntes = nivel();
    try {
      st = await Nuvem.api('GET', '/conta/guilda' + q());
      for (const c of st.convites || []) if (!avisados.has(c.id)) { avisados.add(c.id); log(`📨 <b>${esc(c.de)}</b> convidou você para a guilda <b>${esc(c.emblema)} [${esc(c.sigla)}] ${esc(c.nome)}</b>. Abra 🛡️ Guilda para responder.`, 'gold'); Audio8.sfx('buff'); }
    } catch (e) { }
    marcar(); if (aberta) render();
    if (st.guilda && nvAntes && nivel() > nvAntes) { banner(`🛡️ GUILDA NÍVEL ${nivel()}!`); log(`🛡️ A guilda <b>${esc(st.guilda.nome)}</b> subiu para o <b>nível ${nivel()}</b>! Veja as vantagens novas em 🛡️ Guilda.`, 'gold'); Audio8.sfx('level'); }
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
      const nv = nivel(), xp = (g.xp || 0) + pendente, a0 = XPN[nv - 1] || 0, a1 = XPN[nv], b = bonus();
      h += `<div class="gw-nivel"><b>Nível ${nv}</b>${a1 ? `<i><s style="width:${Math.min(100, (xp - a0) / (a1 - a0) * 100)}%"></s></i><small>${Math.floor(xp).toLocaleString('pt-BR')} / ${a1.toLocaleString('pt-BR')} XP</small>` : '<small>nível máximo!</small>'}</div>
        <div class="gw-sec">🎁 Vantagens <small>(10% do XP de monstro dos membros vai para a guilda, sem tirar nada de vocês)</small></div>
        <div class="gw-vant">${VANTAGENS.map(([n, t]) => `<div class="${nv >= n ? 'on' : 'off'}">${nv >= n ? '✅' : '🔒 Nv ' + n} ${t}</div>`).join('')}</div>
        <div class="gw-agora">Agora: <b>+${Math.round(b.xp * 100)}% XP</b>${b.aura ? ` (${b.aura} membro(s) perto)` : ''} · +${Math.round(b.cr * 100)}% coroas${b.desc ? ' · 5% de desconto' : ''}${b.hp ? ` · +${b.hp * 100}% vida` : ''}${b.dano ? ` · +${b.dano * 100}% dano` : ''}${b.drop ? ' · +10% itens' : ''}</div>`;
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
        if (!sou && ol) bt += `<button data-a="ir" data-v="${esc(mb.nome)}" class="sec">🧭 Ir até (500 cr)</button>`;
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
    if (a === 'ir') return chamado(v);
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
  // Chamado da guilda: viaja até um membro online
  function chamado(nome) {
    const r = (Net.peers ? Net.peers() : []).find(o => String(o.n || '').toLowerCase() === nome && o.s && o.s.gid === minha());
    const nao = t => { msg = '⚠️ ' + t; Audio8.sfx('miss'); render(); };
    if (!r) return nao('Esse membro não está online agora.');
    if (inTower(r.z) || inTower(P.z)) return nao('O Chamado não funciona para dentro ou para fora da Torre (nem da casa).');
    if (P.dead || r.s.st === 'd') return nao('Não dá agora.');
    if (Date.now() < chamadoT) return nao(`Espere ${Math.ceil((chamadoT - Date.now()) / 1000)} s para usar o Chamado de novo.`);
    if (P.zeny < 500) return nao('O Chamado custa 500 cr.');
    let x = r.x + 1.5, z = r.z + 1.5; if (blocked(x, z)) { x = r.x; z = r.z; }
    P.zeny -= 500; chamadoT = Date.now() + 60000; P.x = x; P.z = z; P.y = groundY(x, z); P.vy = 0; camS.x = P.x; camS.z = P.z;
    Audio8.sfx('warp'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0x8affb0, 30, 4, 0.9); log(`🧭 Chamado da guilda: você foi até <b>${esc(r.n)}</b>.`, 'gold');
    if (typeof autoStop === 'function') autoStop(''); abrir(false);
  }
  function update(dt) { if ((pollT -= dt) > 0) return; pollT = 30; atualizar(); }      // convites e mudanças: a cada 30 s
  return { init, update, pres, aliado, minha, abrir, bonus, contribuir, hud, get sigla() { return st.guilda ? st.guilda.sigla : null; } };
})();
