// =====================================================================
//  Abertura (sobrevoo do mundo + título), login (usuário e senha) e
//  escolha de personagem em 3 vagas. O jogo é todo on-line: as vagas ficam
//  no servidor (nuvem.js); cada vaga tem o próprio progresso e o próprio Sítio.
// =====================================================================
'use strict';
const Contas = (() => {
  const N = 3, key = i => 'reino-slot-' + i;
  let slot = 0, delArmed = -1, delT = 0;

  // o personagem que já existia (save antigo) vai para a vaga 1
  try {
    if (!localStorage.getItem(key(0)) && localStorage.getItem('lyra3d-save-v1')) localStorage.setItem(key(0), localStorage.getItem('lyra3d-save-v1'));
    if (!localStorage.getItem('reino-vida-v1-0') && localStorage.getItem('reino-vida-v1')) localStorage.setItem('reino-vida-v1-0', localStorage.getItem('reino-vida-v1'));
  } catch (e) { }

  const read = i => { try { return JSON.parse(localStorage.getItem(key(i))); } catch (e) { return null; } };
  const el = (tag, id, cls, html) => { const e = document.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };

  const intro = el('div', 'intro', '', `
    <div class="in-logo"><div class="in-small">Crônicas do</div><h1>Reino Quebrado</h1><div class="in-on">ONLINE</div></div>
    <p class="in-quote">“Antes do Cisma, o Reino era um só. A Fonte guardava a memória de todos.”</p>
    <button class="in-go">Toque para entrar</button><small class="in-snd">🔊 com som</small>`);
  const slots = el('div', 'slots', 'hidden');
  document.body.appendChild(intro); document.body.appendChild(slots);
  $('title').classList.add('hidden');
  window.INTRO = true;

  function portrait(cls) { const C = CLASSES[cls]; return C && window.SPR && SPR[C.portrait] ? `<img src="data:image/png;base64,${SPR[C.portrait]}">` : '<span class="sl-plus">?</span>'; }
  function renderSlots() {
    let h = `<div class="sl-wrap"><h2>Escolha o seu personagem</h2><div class="sl-conta">👤 <b>${esc(Nuvem.usuario || '')}</b> · <a href="#" data-sair>Sair da conta</a></div>${aviso ? `<div class="sl-aviso">${aviso}</div>` : ''}<div class="sl-row">`;
    for (let i = 0; i < N; i++) {
      const s = read(i);
      if (s && s.name) {
        const tier = typeof TIERS !== 'undefined' && TIERS[s.cls] ? TIERS[s.cls][s.tier || 0] : (CLASSES[s.cls] ? className(s.cls, s.gender) : '');
        h += `<div class="sl-card">${portrait(s.cls)}<b>${s.name}</b><small>${tier} · Nv ${s.lv || 1}</small>
          <button class="sl-play" data-p="${i}">▶ Jogar</button><button class="sl-del" data-d="${i}">${delArmed === i ? 'Toque de novo para apagar' : 'Apagar'}</button></div>`;
      } else h += `<div class="sl-card empty" data-n="${i}"><span class="sl-plus">+</span><b>Vaga ${i + 1}</b><small>Criar personagem</small></div>`;
    }
    h += `</div><button class="sl-back">← Voltar</button></div>`;
    slots.innerHTML = h;
  }
  const esc = t => String(t || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  let aviso = '';
  // ---------------- login
  function showLogin(msg) {
    Audio8.init(); Audio8.play('title');
    intro.classList.add('hidden'); $('title').classList.add('hidden'); slots.classList.remove('hidden'); window.INTRO = true;
    slots.innerHTML = `<div class="sl-wrap lg"><h2>Entrar no Reino</h2>
      <p class="lg-sub">O Reino Quebrado é todo on-line: sua conta guarda os personagens, e você entra de qualquer aparelho.<br>📶 <b>Usa internet o tempo todo:</b> no 4G/5G gasta dados do seu plano.</p>
      <form class="lg-form" autocomplete="on"><input name="u" placeholder="Usuário" maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" value="${esc(Nuvem.usuario || '')}">
      <input name="s" type="password" placeholder="Senha" maxlength="64" autocomplete="current-password">
      <div class="lg-err">${msg ? esc(msg) : ''}</div>
      <div class="lg-bt"><button type="submit" class="sl-play">▶ Entrar</button><button type="button" class="lg-novo">✨ Criar conta</button></div></form>
      <small class="lg-dica">Usuário: 3 a 20 letras ou números, sem espaço. Senha: pelo menos 4 caracteres. Anote a sua senha!</small>
      <button class="sl-back">← Voltar</button></div>`;
    const f = slots.querySelector('form'), err = slots.querySelector('.lg-err');
    const ir = async criar => {
      const u = f.u.value.trim(), s2 = f.s.value;
      if (!u || !s2) { err.textContent = 'Escreva usuário e senha.'; Audio8.sfx('miss'); return; }
      err.textContent = criar ? '⏳ Criando a conta…' : '⏳ Entrando…';
      try { await Nuvem.entrar(u, s2, criar); Audio8.sfx('level'); carregar(); }
      catch (e) { err.textContent = e.message; Audio8.sfx('miss'); }
    };
    f.addEventListener('submit', e => { e.preventDefault(); ir(false); });
    slots.querySelector('.lg-novo').addEventListener('click', () => ir(true));
  }
  function semConexao(msg) {
    intro.classList.add('hidden'); slots.classList.remove('hidden');
    slots.innerHTML = `<div class="sl-wrap lg"><h2>🌐 Sem conexão</h2><p class="lg-sub">${esc(msg)}</p><p class="lg-sub">O Reino Quebrado é todo on-line: precisa de internet para jogar.</p><button class="sl-play lg-tenta">🔄 Tentar de novo</button></div>`;
    slots.querySelector('.lg-tenta').onclick = () => { Audio8.sfx('click'); carregar(); };
  }
  async function carregar() {
    intro.classList.add('hidden'); slots.classList.remove('hidden');
    slots.innerHTML = `<div class="sl-wrap lg"><h2>⏳ Abrindo a sua conta…</h2></div>`;
    try {
      const r = await Nuvem.baixar();
      aviso = r.subiu ? `📲 ${r.subiu} personagem(ns) deste aparelho foram guardados na sua conta.` : '';
      if (typeof Avisos !== 'undefined') Avisos.seTiverNovo(showSlots); else showSlots();     // novidades e aviso de internet
    } catch (e) {
      if (e.status === 401) showLogin('Entre de novo com usuário e senha.');
      else semConexao(e.message);
    }
  }
  function showSlots() {
    Audio8.init(); Audio8.play('title');
    intro.classList.add('hidden'); $('title').classList.add('hidden'); slots.classList.remove('hidden');
    window.INTRO = true; renderSlots();
  }
  function useSlot(i) { slot = i; SAVE_KEY = key(i); if (typeof Vida !== 'undefined' && Vida.useSlot) Vida.useSlot(i); }
  const whenReady = fn => $('btn-new').disabled ? setTimeout(() => whenReady(fn), 300) : fn();
  setInterval(() => { const b = intro.querySelector('.in-go'); if (b) b.textContent = $('btn-new').disabled ? $('btn-new').textContent : '🔊 Toque para entrar'; }, 300);
  function play(i) {
    if ($('btn-new').disabled) return whenReady(() => play(i));
    useSlot(i); slots.classList.add('hidden'); window.INTRO = false;
    start(true);
  }
  function create(i) {
    useSlot(i); slots.classList.add('hidden'); window.INTRO = false;
    $('name-in').value = ''; $('title').classList.remove('hidden');
    if (!$('btn-voltar')) { const b = el('button', 'btn-voltar', '', '← Voltar'); b.onclick = () => { Audio8.sfx('click'); showSlots(); }; $('btn-new').parentNode.appendChild(b); }
  }
  intro.addEventListener('click', () => { Audio8.init(); Audio8.sfx('click'); if (Nuvem.logado) carregar(); else showLogin(); });
  slots.addEventListener('click', e => {
    if (e.target.closest('[data-sair]')) { e.preventDefault(); Audio8.sfx('click'); Nuvem.sair(); return; }
    const t = e.target.closest('[data-p],[data-d],[data-n],.sl-back'); if (!t) return;
    Audio8.sfx('click');
    if (t.classList.contains('sl-back')) { slots.classList.add('hidden'); intro.classList.remove('hidden'); return; }
    if (t.dataset.p) return play(+t.dataset.p);
    if (t.dataset.n) return create(+t.dataset.n);
    if (t.dataset.d) {
      const i = +t.dataset.d;
      if (delArmed !== i) { delArmed = i; clearTimeout(delT); delT = setTimeout(() => { delArmed = -1; renderSlots(); }, 4000); return renderSlots(); }
      delArmed = -1;
      Nuvem.apagar(i).then(() => { try { localStorage.removeItem(key(i)); localStorage.removeItem('reino-vida-v1-' + i); } catch (e) { } aviso = ''; renderSlots(); })
        .catch(er => { aviso = '⚠️ Não deu para apagar: ' + esc(er.message); renderSlots(); });
    }
  });
  // trocar de personagem durante o jogo: salva e volta à escolha
  function trocar() { save(); Nuvem.enviar(slot, true).finally(() => location.reload()); }
  return { trocar, get slot() { return slot; } };
})();
