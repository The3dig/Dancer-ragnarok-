// =====================================================================
//  Loja de Visuais (🛍️): só aparência, nenhum bônus em combate.
//  Auras, rastros ao andar, mascotes que seguem você, cor do nome e
//  títulos. Comprados com coroas; ficam na conta da vaga do personagem.
// =====================================================================
'use strict';
const Cos = (() => {
  // [nome, ícone, preço, extra]
  const CAT = {
    aura: { n: 'Auras', ic: '✨', items: {
      dourada: ['Aura Dourada', '🌟', 3000, { c: [0xffd060, 0xfff0b0] }],
      sombria: ['Aura do Cisma', '🌑', 5000, { c: [0x8a40ff, 0x3a0a6a] }],
      gelo: ['Aura de Gelo', '❄️', 5000, { c: [0x9ad8ff, 0xffffff] }],
      fogo: ['Aura de Brasa', '🔥', 6000, { c: [0xff7a30, 0xffd060] }],
      sangue: ['Aura Rubra', '🩸', 8000, { c: [0xc01020, 0xff5a5a] }],
    } },
    rastro: { n: 'Rastros', ic: '👣', items: {
      petalas: ['Pétalas', '🌸', 2000, { c: [0xf08ac8, 0xffc0e0], smoke: true }],
      faiscas: ['Faíscas', '⚡', 3000, { c: [0xbfe4ff, 0xffffff], spark: true }],
      brasas: ['Brasas', '🔥', 3500, { c: [0xff7a30, 0xffb040], spark: true }],
      sombras: ['Fumaça Sombria', '🌫️', 4000, { c: [0x5a2a8a, 0x2a0a3a], smoke: true }],
      estrelas: ['Poeira de Estrelas', '⭐', 5000, { c: [0xffe8a0, 0x9ad8ff], spark: true }],
    } },
    pet: { n: 'Mascotes', ic: '🐾', items: {
      larvinha: ['Larvinha', '🐛', 5000, { img: 'e_larva', h: 0.6 }],
      eco: ['Ecozinho', '👻', 6000, { img: 'e_eco', h: 0.75, float: true }],
      raizinha: ['Raizinha', '🌱', 6000, { img: 'e_raizRast', h: 0.7 }],
      fragmento: ['Fragmentinho', '💠', 9000, { img: 'e_fragmento', h: 0.7, float: true }],
      sombrinha: ['Sombrinha', '🌑', 12000, { img: 'e_sombra', h: 0.8, float: true }],
    } },
    cor: { n: 'Cor do nome', ic: '🎨', items: {
      ouro: ['Nome Dourado', '🟡', 1500, { css: '#ffcf40' }],
      ceu: ['Nome Celeste', '🔵', 1500, { css: '#7ac8ff' }],
      jade: ['Nome Jade', '🟢', 1500, { css: '#7dffb0' }],
      ametista: ['Nome Ametista', '🟣', 2000, { css: '#c890ff' }],
      rosa: ['Nome Rosa', '🌸', 2000, { css: '#ff9ad0' }],
    } },
    titulo: { n: 'Títulos', ic: '🏷️', items: {
      andarilho: ['« Andarilho do Reino »', '🥾', 1000, {}],
      sitiante: ['« Senhor do Sítio »', '🌾', 1500, {}],
      cacador: ['« Caçador de Larvas »', '🐛', 2000, {}],
      lenda: ['« Lenda de Solmira »', '🏛️', 4000, {}],
      sombra: ['« Filho do Cisma »', '🌑', 6000, {}],
    } },
  };
  const S = () => (P.cos = P.cos || { own: {}, eq: {} });
  const key = (c, k) => c + ':' + k;

  // ---------------- janela da loja
  let tab = 'aura';
  function win() {
    let w = $('coswin');
    if (!w) {
      w = document.createElement('div'); w.id = 'coswin'; w.className = 'win hidden'; $('hud').appendChild(w);
      w.addEventListener('click', e => {
        const t = e.target.closest('[data-a]'); if (!t) return; Audio8.sfx('click');
        const [a, v] = [t.dataset.a, t.dataset.v];
        if (a === 'x') return w.classList.add('hidden');
        if (a === 'tab') tab = v;
        if (a === 'buy') buy(tab, v);
        if (a === 'eq') { S().eq[tab] = S().eq[tab] === v ? null : v; apply(); save(); }
        render();
      });
    }
    return w;
  }
  function render() {
    const c = CAT[tab], st = S();
    const cards = Object.entries(c.items).map(([k, [nome, ic, preco, ex]]) => {
      const own = st.own[key(tab, k)], on = st.eq[tab] === k;
      const prev = tab === 'cor' ? `<b style="color:${ex.css}">${P.name}</b>` : tab === 'titulo' ? `<small>${nome}</small>` : `<span class="cs-ic">${ic}</span>`;
      return `<div class="cs-card${on ? ' on' : ''}"><div class="cs-prev">${prev}</div><b>${tab === 'titulo' ? '' : nome}</b>
        ${own ? `<button data-a="eq" data-v="${k}">${on ? '✅ Usando' : 'Usar'}</button>` : `<button data-a="buy" data-v="${k}" ${P.zeny < preco ? 'class="off"' : ''}>💰 ${preco.toLocaleString('pt-BR')} cr</button>`}</div>`;
    }).join('');
    win().innerHTML = `<div class="wt">🛍️ Loja de Visuais <small>· ${P.zeny.toLocaleString('pt-BR')} cr</small><span class="x" data-a="x">×</span></div>
      <div class="cs-tabs">${Object.entries(CAT).map(([k, v]) => `<div class="cs-tab${tab === k ? ' on' : ''}" data-a="tab" data-v="${k}">${v.ic} ${v.n}</div>`).join('')}</div>
      <div class="cs-grid">${cards}</div>
      <div class="cs-note">Só aparência: nada aqui dá vantagem em combate. Toque em "Usar" de novo para tirar.</div>`;
  }
  function open() {
    if (dialogOpen) closeDialog(); ['invwin', 'statwin', 'skillwin', 'bestwin'].forEach(id => $(id) && $(id).classList.add('hidden'));
    render(); win().classList.remove('hidden');
  }
  function buy(c, k) {
    const [nome, , preco] = CAT[c].items[k], st = S();
    if (st.own[key(c, k)]) return;
    if (P.zeny < preco) { log('Coroas insuficientes!', 'bad'); Audio8.sfx('miss'); return; }
    P.zeny -= preco; st.own[key(c, k)] = 1; st.eq[c] = k; Audio8.sfx('level'); apply(); save();
    log(`🛍️ Comprou <b>${nome}</b>!`, 'gold');
  }

  // ---------------- aparência no mundo
  let pet = null, petKey = '', acc = 0, tAcc = 0;
  const pal = (c, k) => { const v = CAT[c] && CAT[c].items[k]; return v ? v[3] : null; };
  function apply() {
    const st = S(), cor = pal('cor', st.eq.cor), tit = st.eq.titulo ? CAT.titulo.items[st.eq.titulo][0] : '';
    const t = P.title ? `« ${P.title} »` : tit;
    $('pname').innerHTML = `<span data-c="${cor ? cor.css : ''}" style="${cor ? 'color:' + cor.css : ''}">${P.name}</span>${t ? `<small>${t}</small>` : ''}`;
    $('pname').dataset.h = '';
  }
  function update(dt) {
    if (!running || typeof VFX === 'undefined') return;
    const st = S();
    // mascote
    const pk = st.eq.pet || '';
    if (pk !== petKey) {
      if (pet) { scene.remove(pet.g); pet = null; }
      petKey = pk;
      const d = pal('pet', pk);
      if (d && typeof SpriteKit !== 'undefined' && SpriteKit.ready) {
        const g = new THREE.Group(), a = SpriteKit.actor({ kind: 'one', img: d.img }, { h: d.h, float: d.float });
        g.add(a.root); scene.add(g); pet = { g, a, x: P.x - 1, z: P.z - 1, d, face: 0 };
      }
    }
    if (pet) {
      const tx = P.x - Math.sin(P.face) * 1.5 + Math.cos(P.face) * 0.8, tz = P.z - Math.cos(P.face) * 1.5 - Math.sin(P.face) * 0.8;
      const dx = tx - pet.x, dz = tz - pet.z, dd = Math.hypot(dx, dz), mv = dd > 0.3;
      if (dd > 25) { pet.x = tx; pet.z = tz; }
      else if (mv) { const k = Math.min(1, dt * 3.5); pet.x += dx * k; pet.z += dz * k; pet.face = Math.atan2(dx, dz); }
      pet.g.position.set(pet.x, (inTower(P.z) ? P.y : groundY(pet.x, pet.z)) + (pet.d.float ? 0.4 + Math.sin(time * 3) * 0.15 : 0), pet.z);
      pet.a.update(dt, { face: pet.face, moving: mv });
      pet.g.visible = !P.dead;
    }
    if (P.dead) return;
    // aura em volta dos pés
    const au = pal('aura', st.eq.aura);
    if (au && (acc += dt) > (TOUCH ? 0.09 : 0.05)) {
      acc = 0; const a = rand(0, TAU), r = rand(0.5, 0.9);
      VFX.particle(new THREE.Vector3(P.x + Math.cos(a) * r, P.y + 0.1, P.z + Math.sin(a) * r), au.c[irand(0, 1)], { size: rand(0.18, 0.3), v: new THREE.Vector3(0, rand(0.8, 1.6), 0), drag: 0.5, life: rand(0.7, 1.1), op: 0.85 });
    }
    // rastro ao andar
    const ra = pal('rastro', st.eq.rastro);
    if (ra && P.moving && (tAcc += dt) > (TOUCH ? 0.07 : 0.04)) {
      tAcc = 0;
      VFX.particle(new THREE.Vector3(P.x + rand(-0.2, 0.2), P.y + 0.15, P.z + rand(-0.2, 0.2)), ra.c[irand(0, 1)], { map: ra.smoke ? VFX.T.smoke : ra.spark ? VFX.T.spark : VFX.T.glow, size: ra.smoke ? 0.6 : 0.25, speed: 0.4, life: rand(0.5, 0.9), grow: ra.smoke ? 1 : 0, spin: true, op: 0.8 });
    }
  }
  // para os outros jogadores (presença): só cor do nome e título
  function pres() { const st = S(), cor = pal('cor', st.eq.cor); return { cn: cor ? cor.css : null, ct: st.eq.titulo ? CAT.titulo.items[st.eq.titulo][0] : null }; }
  function init() {
    if (!$('btn-shop')) { const b = document.createElement('button'); b.id = 'btn-shop'; b.title = 'Loja de Visuais'; b.textContent = '🛍️'; b.onclick = open; $('menu').insertBefore(b, $('btn-help')); }
    apply();
  }
  return { init, open, update, apply, pres };
})();
