// =====================================================================
//  🤖 Caça automática (pedido do Rone: quem trabalha não tem tempo de ficar caçando).
//  Você vai até o mapa, abre 🤖, escolhe os bichos, as habilidades e quando tomar poção,
//  e o personagem caça sozinho em volta do ponto onde você começou.
//  Para quando: você mexe o personagem, morre, acaba a poção com a vida baixa, ou toca em Parar.
//  Reaproveita o "clicou no monstro: vai até ele e ataca até cair" (P.caca) do game3d.js.
// =====================================================================
'use strict';
const AutoCaca = (() => {
  const RAIO = 30;                                                        // caça até 30 m do ponto onde começou
  let on = false, centro = null, potT = 0, skT = 0, mortes0 = 0, t0 = 0, win = null;
  const cfg = () => { const c = (P.autoCfg = P.autoCfg || { bichos: [], skills: [], hp: 50, sp: 30, parar: 20 }); if (!c.raio) c.raio = RAIO; return c; };
  const curas = () => ativas().filter(({ s }) => s.type === 'heal');   // 💚 pedido do Rone: curar sozinho quando estiver morrendo
  const ativas = () => SKILLS.map((s, i) => ({ s, i })).filter(({ s }) => s.type !== 'passiva' && (P.skillLv[s.id] || 0) > 0 && (typeof tierOk !== 'function' || tierOk(s)));
  // a melhor poção que você pode usar agora (a maior liberada para o seu nível)
  function pocao(tipo) {
    const l = tipo === 'hp' ? ['red_x', 'red_g', 'red_m', 'red'] : ['blue_x', 'blue_g', 'blue_m', 'blue'];
    return l.find(id => ITEMS[id] && P.inv[id] > 0 && !(ITEMS[id].lvMin && P.lv < ITEMS[id].lvMin));
  }
  const pertoTipos = () => {
    const c = {};
    for (const m of mobs) if (!m.dead && !m.isPeer && !m.d.world && Math.hypot(m.x - P.x, m.z - P.z) < Math.max(45, (P.autoCfg && P.autoCfg.raio) || 0)) { c[m.type] = c[m.type] || { n: 0, d: m.d }; c[m.type].n++; }
    return c;
  };

  // ---------------- janela de configuração
  function abrir() {
    if (!win) {
      win = document.createElement('div'); win.id = 'autowin'; win.className = 'win hidden'; $('hud').appendChild(win);
      win.addEventListener('click', e => {
        const t = e.target.closest('[data-a]'); if (!t) return; Audio8.sfx('click'); const C = cfg(), a = t.dataset.a, v = t.dataset.v;
        if (a === 'x') { win.classList.add('hidden'); return; }
        if (a === 'bicho') { const k = C.bichos.indexOf(v); if (k >= 0) C.bichos.splice(k, 1); else C.bichos.push(v); }
        if (a === 'skill') { const k = C.skills.indexOf(v); if (k >= 0) C.skills.splice(k, 1); else C.skills.push(v); }
        if (a === 'hp' || a === 'sp' || a === 'parar' || a === 'cura') C[a] = Math.max(0, Math.min(90, (C[a] ?? 50) + (+v)));
        if (a === 'raio') C.raio = Math.max(10, Math.min(200, C.raio + (+v)));
        if (a === 'todos') C.bichos = Object.keys(pertoTipos());
        if (a === 'ir') { win.classList.add('hidden'); comecar(); return; }
        if (a === 'parar_ja') { parar('🤖 Caça automática parada.'); }
        render();
      });
    }
    if (dialogOpen) closeDialog();
    render(); win.classList.remove('hidden');
  }
  function render() {
    const C = cfg(), perto = pertoTipos(); if (!on) C.bichos = C.bichos.filter(t => perto[t]);   // só os bichos daqui (nada de bicho de outro mapa)
    const tipos = [...new Set([...Object.keys(perto), ...C.bichos.filter(t => MOBDEF[t])])].sort((a, b) => MOBDEF[a].lv - MOBDEF[b].lv);
    const sk = ativas(), hpP = pocao('hp'), spP = pocao('sp');
    const btn = (a, v, txt, on2) => `<button data-a="${a}" data-v="${v}" class="${on2 ? 'on' : ''}">${txt}</button>`;
    win.innerHTML = `<div class="wt">🤖 Caça automática<span class="x" data-a="x">×</span></div><div class="au-b">
      ${on ? `<div class="au-st">▶️ Caçando… <b>${P.kills - mortes0}</b> abatidos em ${Math.floor((Date.now() - t0) / 60000)} min ${btn('parar_ja', '', '⏹ Parar', false)}</div>` : ''}
      <h4>1. Quais bichos <small>(os que estão por perto)</small> ${tipos.length ? btn('todos', '', 'todos', false) : ''}</h4>
      <div class="au-l">${tipos.length ? tipos.map(t => btn('bicho', t, `${MOBDEF[t].name} <small>Nv ${MOBDEF[t].lv}${perto[t] ? ' · ' + perto[t].n : ''}</small>`, C.bichos.includes(t))).join('') : '<small>Nenhum bicho por perto. Vá até o mapa de caça e abra de novo.</small>'}</div>
      <h4>2. Habilidades que ele usa <small>(as marcadas, sempre que puder)</small></h4>
      <div class="au-l">${sk.length ? sk.map(({ s }) => btn('skill', s.id, `${s.icon} ${s.name}`, C.skills.includes(s.id))).join('') : '<small>Nenhuma habilidade aprendida ainda.</small>'}</div>
      <h4>3. Poções</h4>
      <div class="au-p">❤️ Tomar poção de vida abaixo de ${btn('hp', -10, '−', false)} <b>${C.hp}%</b> ${btn('hp', 10, '+', false)} <small>${hpP ? `usa ${ITEMS[hpP].ic} ${ITEMS[hpP].name} (${P.inv[hpP]})` : '⚠️ sem poção de vida!'}</small></div>
      <div class="au-p">💧 Tomar poção de SP abaixo de ${btn('sp', -10, '−', false)} <b>${C.sp}%</b> ${btn('sp', 10, '+', false)} <small>${spP ? `usa ${ITEMS[spP].ic} ${ITEMS[spP].name} (${P.inv[spP]})` : 'sem poção de SP'}</small></div>
      <div class="au-p">💚 Usar <b>habilidade de cura</b> abaixo de ${btn('cura', -10, '−', false)} <b>${C.cura ?? 50}%</b> ${btn('cura', 10, '+', false)} <small>${curas().length ? curas().map(({ s }) => s.icon + ' ' + s.name).join(', ') : 'você ainda não tem habilidade de cura'}${(C.cura ?? 50) === 0 ? ' · desligado' : ''}</small></div>
      <div class="au-p">🛑 Parar se a vida ficar abaixo de ${btn('parar', -5, '−', false)} <b>${C.parar}%</b> ${btn('parar', 5, '+', false)} <small>sem poção de vida</small></div>
      <h4>4. Até onde ele vai</h4>
      <div class="au-p">📏 Caçar até ${btn('raio', -10, '−', false)} <b>${C.raio} m</b> ${btn('raio', 10, '+', false)} de onde você começar <small>(perto: fica no lugar · longe: anda pelo mapa)</small></div>
      <p class="au-dica"><small>Ele caça até ${C.raio} m de onde você começar e se defende de quem atacar. Mexa o personagem para parar. A cura de habilidade (se marcada) é usada quando a vida cai.</small></p>
      ${on ? '' : btn('ir', '', '▶️ Começar a caçar aqui', false)}</div>`;
  }

  // ---------------- caçando
  function comecar() {
    const C = cfg();
    if (P.dead) return;
    { const perto = pertoTipos(); C.bichos = C.bichos.filter(t => perto[t]); }
    if (!C.bichos.length) { log('🤖 Escolha pelo menos um bicho para caçar.', 'bad'); Audio8.sfx('miss'); abrir(); return; }
    const z = zoneOf(P.x, P.z); if (ZONES[z] && ZONES[z].town) { log('🤖 Na cidade não tem o que caçar: vá até um mapa de caça.', 'bad'); Audio8.sfx('miss'); return; }
    if (typeof autoStop === 'function' && typeof AUTO !== 'undefined' && AUTO.on) autoStop('');
    on = true; centro = { x: P.x, z: P.z }; mortes0 = P.kills || 0; t0 = Date.now(); P.caca = null;
    log(`🤖 <b>Caça automática</b> ligada: ${C.bichos.map(t => MOBDEF[t].name).join(', ')}. Mexa o personagem para parar.`, 'gold'); marcar();
  }
  function parar(msg) {
    if (!on) return; on = false; P.caca = null; centro = null; marcar();
    // parou: zera a escolha dos bichos e esquece o ponto de caça (pedido do Rone: a Ludi foi para a Floresta e o
    // personagem saiu andando atrás dos bichos do deserto, da caçada anterior, e travou no caminho)
    cfg().bichos = []; if (P.qGo && P.qGo.name === 'o ponto de caça') P.qGo = null;
    if (msg) log(`${msg} <small>(${(P.kills || 0) - mortes0} abatidos)</small>`, 'sys');
    if (win && !win.classList.contains('hidden')) render();
  }
  function marcar() { for (const id of ['btn-auto', 't-auto']) { const b = $(id); if (b) b.classList.toggle('on', on); } }
  const mexeu = () => (typeof joy !== 'undefined' && (joy.x || joy.y)) || keys.w || keys.a || keys.s || keys.d || keys.arrowup || keys.arrowdown || (typeof Controle !== 'undefined' && (Controle.x || Controle.y));
  function alvo() {
    const C = cfg();
    // quem está me atacando vem primeiro (mesmo que não seja da lista)
    let best = null, bd = 1e9;
    for (const m of mobs) {
      if (typeof naCidadeXZ === 'function' && naCidadeXZ(m.x, m.z) && !m.invasor) continue;
      if (m.state !== 'chase' && m.z > -300 && P.z > -300 && typeof riverX === 'function' && !inTower(m.z) && Math.sign(m.x - riverX(m.z)) !== Math.sign(P.x - riverX(P.z))) continue;   // do outro lado do rio: não escolhe (ia até a margem e ficava parado)   // dentro da cidade não dá para bater: ficava parado do lado da Raiz na Vila de Solmira
      if (m.state !== 'chase' && typeof CAPITAL !== 'undefined' && !inTower(m.z) && !inTower(P.z)) { const den = (x, z) => x > CAPITAL.x0 && x < CAPITAL.x1 && z > CAPITAL.z0 && z < CAPITAL.z1; if (den(m.x, m.z) !== den(P.x, P.z)) continue; }   // do outro lado do muro de Solmira: não escolhe (ficava empurrando o muro)
      if (m.dead || m.isPeer || m.d.world || (m.inalcancavel && time - m.inalcancavel < 30 && !(m.state === 'chase' && Math.hypot(m.x - P.x, m.z - P.z) < 4))) continue;   // não deu para chegar: tenta outro por 30 s
      const dP = Math.hypot(m.x - P.x, m.z - P.z), dC = Math.hypot(m.x - centro.x, m.z - centro.z);
      const ameaca = m.state === 'chase' && dP < 6, quero = C.bichos.includes(m.type) && dC < C.raio;
      if (!ameaca && !quero) continue;
      const sc = dP - (ameaca ? 100 : 0); if (sc < bd) { bd = sc; best = m; }
    }
    return best;
  }
  function tick() {
    if (!on || !running) return;
    if (P.dead) { parar('🤖 Você caiu. Caça automática parada.'); return; }
    if (mexeu()) { parar('🤖 Você assumiu o controle.'); return; }
    if (dialogOpen) return;
    const C = cfg(), hp = P.hp / stats.maxHp() * 100, sp = P.sp / stats.maxSp() * 100;
    // poções (no máximo uma a cada 0,8 s)
    if (time - potT > 0.8) {
      if (hp < C.hp) { const id = pocao('hp'); if (id) { usePotion(id); potT = time; } else if (hp < C.parar) { parar('🤖 Acabaram as poções de vida e a vida está baixa: caça parada.'); return; } }
      else if (sp < C.sp) { const id = pocao('sp'); if (id) { usePotion(id); potT = time; } }
    }
    // cura de habilidade quando a vida cai (mesmo sem alvo e mesmo sem estar marcada na lista)
    if ((C.cura ?? 50) > 0 && hp < (C.cura ?? 50) && time - (tick.curaT || 0) > 0.6) {
      for (const { s, i } of curas()) { if ((P.cds[s.id] || 0) > 0) continue; const sc = typeof scaleSkill === 'function' ? scaleSkill(s, P.skillLv[s.id]) : s; if (P.sp < (sc.sp || 0)) continue; tick.curaT = time; useSkill(i); break; }
    }
    // alvo
    if (!P.caca || P.caca.dead || !mobs.includes(P.caca)) P.caca = alvo();
    if (!P.caca) { const d = Math.hypot(P.x - centro.x, P.z - centro.z); if (d > 4) P.qGo = { x: centro.x, z: centro.z, name: 'o ponto de caça' }; return; }
    // habilidades marcadas: buff quando não está ativo, cura quando a vida cai, ataque quando o alvo está perto
    if (time - skT > 0.35) {
      skT = time; const m = P.caca, dist = Math.hypot(m.x - P.x, m.z - P.z);
      for (const { s, i } of ativas()) {
        if (!C.skills.includes(s.id) || (P.cds[s.id] || 0) > 0) continue;
        const sc = typeof scaleSkill === 'function' ? scaleSkill(s, P.skillLv[s.id]) : s; if (P.sp < (sc.sp || 0)) continue;
        if (s.type === 'buff' && P.buffs[s.id]) continue;
        if (s.type === 'heal' && hp > 60) continue;
        const alc = s.type === 'strike' ? CLS().range + 0.8 : s.type === 'nova' ? (s.r || 4) : Math.max(CLS().range, 10);
        if (!['buff', 'heal'].includes(s.type) && dist > alc) continue;
        useSkill(i); break;
      }
    }
  }
  setInterval(tick, 100);
  // botão 🤖 na barra de cima
  function botao() { const m = $('menu'); if (!m || $('btn-auto')) return; const b = document.createElement('button'); b.id = 'btn-auto'; b.title = 'Caça automática'; b.textContent = '🤖'; b.onclick = () => { Audio8.sfx('click'); abrir(); }; m.insertBefore(b, $('btn-grupo') || $('btn-help')); }
  // botão redondo "AUTO" ao lado do ataque (celular); no PC fica no ☰ Mais
  function botaoToque() {
    const tb = $('touch'); if (!tb || $('t-auto')) return;                // fica ao lado do joystick (no canto direito encavalava no quadro de missões)
    const b = document.createElement('button'); b.id = 't-auto'; b.innerHTML = '<span>AUTO</span>'; b.title = 'Caça automática';
    const ir = e => { e.preventDefault(); Audio8.sfx('click'); if (on) parar('🤖 Caça automática parada.'); else abrir(); };
    b.addEventListener('pointerdown', ir); tb.appendChild(b); marcar();
  }
  setInterval(() => { botao(); botaoToque(); }, 2000); botao(); botaoToque();
  return { abrir, comecar, parar, _tick: tick, get on() { return on; } };
})();
