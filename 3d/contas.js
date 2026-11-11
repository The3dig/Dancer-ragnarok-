// =====================================================================
//  Abertura (sobrevoo do mundo + título) e escolha de personagem
//  em 3 vagas. Cada vaga tem o próprio progresso e o próprio Sítio.
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
    <button class="in-go">Toque para entrar</button>`);
  const slots = el('div', 'slots', 'hidden');
  document.body.appendChild(intro); document.body.appendChild(slots);
  $('title').classList.add('hidden');
  window.INTRO = true;

  function portrait(cls) { const C = CLASSES[cls]; return C && window.SPR && SPR[C.portrait] ? `<img src="data:image/png;base64,${SPR[C.portrait]}">` : '<span class="sl-plus">?</span>'; }
  function renderSlots() {
    let h = `<div class="sl-wrap"><h2>Escolha o seu personagem</h2><div class="sl-row">`;
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
  function showSlots() {
    Audio8.init(); Audio8.play('title');
    intro.classList.add('hidden'); $('title').classList.add('hidden'); slots.classList.remove('hidden');
    window.INTRO = true; renderSlots();
  }
  function useSlot(i) { slot = i; SAVE_KEY = key(i); if (typeof Vida !== 'undefined' && Vida.useSlot) Vida.useSlot(i); }
  const whenReady = fn => $('btn-new').disabled ? setTimeout(() => whenReady(fn), 300) : fn();
  setInterval(() => { const b = intro.querySelector('.in-go'); if (b) b.textContent = $('btn-new').disabled ? $('btn-new').textContent : 'Toque para entrar'; }, 300);
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
  intro.addEventListener('click', () => { Audio8.init(); Audio8.sfx('click'); showSlots(); });
  slots.addEventListener('click', e => {
    const t = e.target.closest('[data-p],[data-d],[data-n],.sl-back'); if (!t) return;
    Audio8.sfx('click');
    if (t.classList.contains('sl-back')) { slots.classList.add('hidden'); intro.classList.remove('hidden'); return; }
    if (t.dataset.p) return play(+t.dataset.p);
    if (t.dataset.n) return create(+t.dataset.n);
    if (t.dataset.d) {
      const i = +t.dataset.d;
      if (delArmed !== i) { delArmed = i; clearTimeout(delT); delT = setTimeout(() => { delArmed = -1; renderSlots(); }, 4000); return renderSlots(); }
      try { localStorage.removeItem(key(i)); localStorage.removeItem('reino-vida-v1-' + i); } catch (e) { }
      delArmed = -1; renderSlots();
    }
  });
  // trocar de personagem durante o jogo: salva e volta à escolha
  function trocar() { save(); location.reload(); }
  return { trocar, get slot() { return slot; } };
})();
