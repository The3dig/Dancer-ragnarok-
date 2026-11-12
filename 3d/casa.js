// =====================================================================
//  Sua Casa no Sítio: só sua. Entre pela porta da casa do Sítio.
//  Lá dentro fica o baú (o que está nele nunca cai quando você morre)
//  e a bancada de reformas, onde você compra móveis com o tempo.
// =====================================================================
'use strict';
const Casa = (() => {
  const C = CASA, H = 7.6;                                 // meia-largura da sala
  const OUT_DOOR = { x: FARM.x - 13.6, z: FARM.z - 1 };    // porta da casa do Sítio, por fora
  const IN_DOOR = { x: C.x, z: C.z + H - 1.2 };            // saída, por dentro
  const S = () => (P.casa = P.casa || { mov: {}, bau: {} });
  const it = id => ITEMS[id] || { name: id, ic: '❔' };

  // ---------------- móveis: [nome, ícone, preço, materiais, onde]
  const MOVEIS = {
    tapete: ['Tapete de Lã', '🟥', 200, { la: 4 }],
    cama: ['Cama de Madeira', '🛏️', 400, { raiz: 6, la: 2 }],
    mesa: ['Mesa e Bancos', '🪑', 300, { raiz: 8 }],
    estante: ['Estante de Livros', '📚', 600, { raiz: 6, po_eco: 4 }],
    lareira: ['Lareira de Pedra', '🔥', 900, { cristal: 4, lasca: 2 }],
    plantas: ['Vasos de Flor-da-Fonte', '🌸', 250, { flor: 3 }],
    trofeu: ['Troféu da Torre', '🏆', 2500, { essencia: 1, lasca: 4 }],
    estandarte: ['Estandarte do Soberano', '🚩', 1500, { fio: 6 }],
  };
  const madeira = PM('madeira.jpg', [1, 1], new THREE.Color(1.35, 1.15, 0.95));
  const madeiraE = PM('madeira.jpg', [1, 1], new THREE.Color(0.85, 0.68, 0.52));
  const pedra = PM('pedra.jpg', [1, 1], new THREE.Color(1.3, 1.25, 1.35));
  const g = new THREE.Group(); g.position.set(C.x, C.y, C.z); scene.add(g);
  const box = (w, h, d, m, x, y, z, par = g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; par.add(o); return o; };
  // piso de tábuas, paredes rebocadas com vigas, janelas com luz do dia
  box(H * 2 + 1, 0.4, H * 2 + 1, PM('madeira.jpg', [6, 6], new THREE.Color(1.25, 1.05, 0.85)), 0, -0.2, 0);
  const reboco = PM('reboco.jpg', [3, 1.2], new THREE.Color(1.45, 1.35, 1.2));
  for (const [x, z, w, d] of [[0, -H, H * 2 + 1, 0.5], [-H, 0, 0.5, H * 2 + 1], [H, 0, 0.5, H * 2 + 1]]) box(w, 3.6, d, reboco, x, 1.8, z);
  for (const sx of [-1, 1]) box(H - 1.4, 3.6, 0.5, reboco, sx * (H / 2 + 0.85), 1.8, H);        // parede da frente com a porta no meio
  box(2.2, 0.8, 0.5, reboco, 0, 3.2, H);
  for (let k = -3; k <= 3; k++) { box(0.25, 3.6, 0.3, madeiraE, k * 2.2, 1.8, -H + 0.35); box(0.3, 3.6, 0.25, madeiraE, -H + 0.35, 1.8, k * 2.2); box(0.3, 3.6, 0.25, madeiraE, H - 0.35, 1.8, k * 2.2); }
  for (const [x, z, ry] of [[-H + 0.3, -3, Math.PI / 2], [H - 0.3, -3, -Math.PI / 2], [-3, -H + 0.3, 0], [3, -H + 0.3, 0]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ color: 0xbfe0ff, toneMapped: false })); w.position.set(x, 2.1, z); w.rotation.y = ry; g.add(w);
    const fr = box(1.6, 0.15, 0.2, madeiraE, x, 2.85, z); fr.rotation.y = ry;
  }
  const doorM = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.55, toneMapped: false }); const dg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.8), doorM); dg.position.set(0, 1.4, H - 0.1); g.add(dg);
  const luz = new THREE.PointLight(0xffd8a0, 1.2, 22); luz.position.set(0, 3, 0); g.add(luz);
  // baú (sempre existe)
  const bau = new THREE.Group(); bau.position.set(-H + 1.6, 0, -H + 1.4); g.add(bau);
  box(1.6, 0.8, 1, madeira, 0, 0.4, 0, bau); const tampa = box(1.65, 0.3, 1.05, madeira, 0, 0.95, 0, bau);
  const ferro = new THREE.MeshPhongMaterial({ color: 0x6a6a72, shininess: 60 }); for (const x of [-0.6, 0.6]) box(0.12, 1.15, 1.08, ferro, x, 0.58, 0, bau);
  box(0.25, 0.25, 0.08, new THREE.MeshPhongMaterial({ color: 0xe8b828, emissive: 0x3a2400, shininess: 100 }), 0, 0.75, 0.55, bau);
  const BAU = { x: C.x - H + 1.6, z: C.z - H + 1.4 };
  // bancada de reformas
  const banc = new THREE.Group(); banc.position.set(H - 1.4, 0, H - 2.4); g.add(banc);
  box(1.8, 0.15, 0.9, madeira, 0, 0.9, 0, banc); for (const [x, z] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) box(0.12, 0.9, 0.12, madeiraE, x, 0.45, z, banc);
  box(0.6, 0.2, 0.4, madeiraE, -0.4, 1.05, 0, banc); box(0.1, 0.5, 0.1, ferro, 0.4, 1.2, 0, banc);
  const BANC = { x: C.x + H - 1.4, z: C.z + H - 2.4 };
  addOb(BAU.x, BAU.z, 1.0); addOb(BANC.x, BANC.z, 1.0);

  // ---------------- móveis que aparecem quando comprados
  const objs = {};
  const BUILD = {
    tapete: p => { const t = new THREE.Mesh(new THREE.PlaneGeometry(6, 4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x8a2a2a })); t.position.y = 0.02; p.add(t); const b2 = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xb08a3a })); b2.position.y = 0.025; p.add(b2); const c2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 3).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x6a1a1e })); c2.position.y = 0.03; p.add(c2); },
    cama: p => { p.position.set(H - 1.6, 0, -H + 2); box(2, 0.5, 3.2, madeira, 0, 0.35, 0, p); box(1.8, 0.25, 3, new THREE.MeshLambertMaterial({ color: 0xe8e0d0 }), 0, 0.7, 0, p); box(1.8, 0.3, 1.6, new THREE.MeshLambertMaterial({ color: 0x3a5a8a }), 0, 0.75, 0.6, p); box(1.2, 0.25, 0.6, new THREE.MeshLambertMaterial({ color: 0xf4f0e8 }), 0, 0.88, -1.1, p); box(2.1, 1.3, 0.2, madeiraE, 0, 0.75, -1.6, p); addOb(C.x + H - 1.6, C.z - H + 2, 1.5); },
    mesa: p => { p.position.set(-2.5, 0, 1.5); box(2.4, 0.15, 1.4, madeira, 0, 1.0, 0, p); for (const [x, z] of [[-1, -0.55], [1, -0.55], [-1, 0.55], [1, 0.55]]) box(0.14, 1, 0.14, madeiraE, x, 0.5, z, p); for (const z of [-1.1, 1.1]) box(2, 0.12, 0.45, madeiraE, 0, 0.55, z, p); const pao = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshLambertMaterial({ color: 0xc08a40 })); pao.scale.set(1.4, 0.7, 1); pao.position.set(0.4, 1.15, 0); p.add(pao); addOb(C.x - 2.5, C.z + 1.5, 1.3); },
    estante: p => { p.position.set(1.5, 0, -H + 0.7); box(2.6, 3, 0.6, madeiraE, 0, 1.5, 0, p); const cores = [0x8a2a2a, 0x2a4a8a, 0x3a6a2a, 0x8a6a2a, 0x5a2a6a]; for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) box(0.22, 0.6 + (k % 3) * 0.08, 0.4, new THREE.MeshLambertMaterial({ color: cores[(k + r) % 5] }), -1.1 + k * 0.27, 0.55 + r * 0.95, 0.05, p); addOb(C.x + 1.5, C.z - H + 0.7, 1.4); },
    lareira: p => { p.position.set(-H + 0.9, 0, 2.5); p.rotation.y = Math.PI / 2; box(3, 2.4, 1, pedra, 0, 1.2, 0, p); box(3.4, 0.3, 1.3, pedra, 0, 2.5, 0, p); box(1.6, 1.3, 0.4, new THREE.MeshBasicMaterial({ color: 0x1a0a04 }), 0, 0.75, 0.35, p); box(1.4, 0.2, 2, pedra, 0, 3.6, -0.3, p);
      const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); f.position.set(0, 0.9, 0.6); f.scale.set(1.1, 1.3, 1); p.add(f); p.userData.fire = f; const l = new THREE.PointLight(0xff8a40, 1.4, 12); l.position.set(0, 1, 1.2); p.add(l); p.userData.light = l; addOb(C.x - H + 0.9, C.z + 2.5, 1.6); },
    plantas: p => { for (const [x, z] of [[-H + 0.9, -H + 3.2], [H - 0.9, 2.5], [-1.5, H - 0.9]]) { const v = new THREE.Group(); v.position.set(x, 0, z); p.add(v); box(0.5, 0.5, 0.5, PM('terra.jpg', [1, 1], 0xa06040), 0, 0.25, 0, v); for (let k = 0; k < 5; k++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshLambertMaterial({ color: k % 2 ? 0xf08ac8 : 0x5a9a3a })); fl.position.set(Math.sin(k * 1.3) * 0.18, 0.65 + k * 0.08, Math.cos(k * 1.3) * 0.18); v.add(fl); } } },
    trofeu: p => { p.position.set(3.2, 0, -H + 0.9); box(1, 1.1, 0.8, pedra, 0, 0.55, 0, p); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.15, 0.6, 12), new THREE.MeshPhongMaterial({ color: 0xe8b828, emissive: 0x4a3000, shininess: 120 })); t.position.y = 1.45; p.add(t); const e = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshPhongMaterial({ color: 0x8a40ff, emissive: 0x4a10a0 })); e.position.y = 1.95; p.add(e); p.userData.spin = e; addOb(C.x + 3.2, C.z - H + 0.9, 0.7); },
    estandarte: p => { p.position.set(-4, 0, -H + 0.32); const c = document.createElement('canvas'); c.width = 64; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#4a0a14'; x.beginPath(); x.moveTo(0, 0); x.lineTo(64, 0); x.lineTo(64, 140); x.lineTo(32, 160); x.lineTo(0, 140); x.fill(); x.fillStyle = '#b08a3a'; x.fillRect(0, 0, 64, 6); x.fillStyle = '#120608'; x.beginPath(); x.arc(32, 66, 16, 0, 6.3); x.fill(); x.fillStyle = '#ff3a3a'; x.fillRect(25, 62, 5, 3); x.fillRect(35, 62, 5, 3);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.position.y = 2; p.add(m); },
  };
  let _fire = null;
  function fireTex() { if (_fire) return _fire; const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d'), r = x.createRadialGradient(32, 92, 2, 32, 80, 50); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.3, 'rgba(255,170,60,.95)'); r.addColorStop(0.7, 'rgba(255,60,20,.4)'); r.addColorStop(1, 'rgba(120,0,0,0)'); x.fillStyle = r; x.beginPath(); x.moveTo(32, 4); x.quadraticCurveTo(62, 70, 32, 124); x.quadraticCurveTo(2, 70, 32, 4); x.fill(); return (_fire = new THREE.CanvasTexture(c)); }
  function furnish() {
    for (const k of Object.keys(MOVEIS)) {
      if (!S().mov[k] || objs[k]) continue;
      const p = new THREE.Group(); g.add(p); BUILD[k](p); objs[k] = p;
    }
  }
  // porta da casa do Sítio (por fora): soleira acesa
  const sole = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.5, toneMapped: false })); sole.position.set(OUT_DOOR.x + 0.5, groundY(OUT_DOOR.x, OUT_DOOR.z) + 0.05, OUT_DOOR.z); scene.add(sole);

  // ---------------- baú
  // janela do baú: o que está guardado (esquerda) e a sua mochila (direita); toque num item para escolher quanto mover
  let bsel = null;
  function bauWin() {
    let w = $('bauwin');
    if (!w) {
      w = document.createElement('div'); w.id = 'bauwin'; w.className = 'win hidden'; $('hud').appendChild(w);
      w.addEventListener('click', e => {
        const t = e.target.closest('[data-a]'); if (!t) return; Audio8.sfx('click');
        const a = t.dataset.a, v = t.dataset.v, b = S().bau;
        if (a === 'x') { w.classList.add('hidden'); tampa.rotation.x = 0; tampa.position.set(0, 0.95, 0); return; }
        if (a === 'sel') bsel = bsel === v ? null : v;
        const mv = (from, to, id, n) => { n = Math.min(n, from[id] || 0); if (n <= 0) return; from[id] -= n; to[id] = (to[id] || 0) + n; Audio8.sfx('pick'); };
        if (bsel) { const [side, id] = bsel.split(':');
          if (a === 'one') side === 'b' ? mv(b, P.inv, id, 1) : mv(P.inv, b, id, 1);
          if (a === 'ten') side === 'b' ? mv(b, P.inv, id, 10) : mv(P.inv, b, id, 10);
          if (a === 'all') side === 'b' ? mv(b, P.inv, id, b[id]) : mv(P.inv, b, id, P.inv[id]);
          if ((side === 'b' ? b[id] : P.inv[id]) <= 0) bsel = null; }
        if (a === 'loot') { for (const id of Object.keys(P.inv)) if (P.inv[id] > 0 && ITEMS[id] && LOOT_KINDS.includes(ITEMS[id].kind)) mv(P.inv, b, id, P.inv[id]); bsel = null; }
        buildHotbar(); save(); renderBau();
      });
    }
    return w;
  }
  function renderBau() {
    const b = S().bau;
    const cell = (side, id, n) => `<div class="icell${bsel === side + ':' + id ? ' sel' : ''}${ITEMS[id] && ITEMS[id].kind === 'equip' ? ' eq r' + ITEMS[id].rar : ''}" data-a="sel" data-v="${side}:${id}" title="${it(id).name}"><span>${it(id).ic}</span><b>${n}</b></div>`;
    const bi = Object.keys(b).filter(id => b[id] > 0 && ITEMS[id]), mi = Object.keys(P.inv).filter(id => P.inv[id] > 0 && ITEMS[id]);
    let det = '<small>Toque num item para escolher quanto mover.</small>';
    if (bsel) { const [side, id] = bsel.split(':'), n = side === 'b' ? b[id] : P.inv[id], verb = side === 'b' ? 'Pegar' : 'Guardar';
      det = `<b>${it(id).ic} ${it(id).name}</b> ×${n}<div class="ibtn"><button data-a="one">${verb} 1</button>${n > 10 ? `<button data-a="ten">${verb} 10</button>` : ''}<button data-a="all">${verb} tudo</button></div>`; }
    bauWin().innerHTML = `<div class="wt">📦 Baú da Casa<span class="x" data-a="x">×</span></div>
      <div class="bau-b"><div class="bau-c"><h4>📦 No baú (${bi.length})</h4><div class="igrid">${bi.map(id => cell('b', id, b[id])).join('') || '<i class="empty">Vazio.</i>'}</div></div>
      <div class="bau-c"><h4>🎒 Na mochila (${mi.length})</h4><div class="igrid">${mi.map(id => cell('m', id, P.inv[id])).join('') || '<i class="empty">Vazia.</i>'}</div></div></div>
      <div class="idet">${det}</div><div class="ibtn foot"><button data-a="loot">⬇️ Guardar toda a pilhagem</button></div>
      <div class="bau-n">O que está no baú não cai quando você morre.</div>`;
  }
  function bauMenu() { bsel = null; renderBau(); bauWin().classList.remove('hidden'); tampa.rotation.x = -1.1; tampa.position.set(0, 1.25, -0.35); Audio8.sfx('pick'); }
  // ---------------- reformas
  function reformas() {
    const opts = Object.entries(MOVEIS).map(([k, [nome, ic, preco, need]]) => {
      if (S().mov[k]) return { label: `✅ ${ic} ${nome} — já está na casa`, fn: () => { reformas(); return true; } };
      const txt = Object.entries(need).map(([id, n]) => `${n} ${it(id).ic}`).join(' + ');
      const ok = P.zeny >= preco && Object.entries(need).every(([id, n]) => (P.inv[id] || 0) >= n);
      return { label: `${ok ? '🔨' : '▫️'} ${ic} ${nome} — ${preco} cr + ${txt}`, fn: () => {
        if (!ok) { const falta = Object.entries(need).filter(([id, n]) => (P.inv[id] || 0) < n).map(([id, n]) => `${n - (P.inv[id] || 0)} ${it(id).name}`); log(falta.length ? `Falta: ${falta.join(', ')}.` : 'Coroas insuficientes!', 'bad'); Audio8.sfx('miss'); reformas(); return true; }
        P.zeny -= preco; for (const [id, n] of Object.entries(need)) P.inv[id] -= n;
        S().mov[k] = 1; furnish(); Audio8.sfx('anvil'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xffd060, 24, 3, 0.7);
        log(`🏠 <b>${nome}</b> foi colocado na sua casa!`, 'gold'); save(); reformas(); return true; } };
    });
    opts.push({ label: 'Fechar' });
    const n = Object.keys(S().mov).length;
    dialog('🔨 Reformas da Casa', `Mobilie a casa aos poucos com coroas e o que você junta nas caçadas e no Sítio.<br><small>Móveis: ${n}/${Object.keys(MOVEIS).length} · Coroas: <b>${P.zeny} cr</b></small>`, opts);
  }
  // ---------------- entrar / sair
  let leaveT = 0;
  function entrar() {
    furnish();
    P.x = IN_DOOR.x; P.z = IN_DOOR.z - 1.5; P.y = C.y; P.face = Math.PI; camS.yaw = 0; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.dist = Math.min(camS.dist, 10);
    Audio8.sfx('warp'); banner('🏠 Sua Casa'); leaveT = 1;
    if (!P.casaSeen) { P.casaSeen = 1; log('🏠 Esta é a sua casa. O <b>baú</b> (canto esquerdo) guarda itens que não caem quando você morre; a <b>bancada</b> (direita) vende móveis.', 'gold'); }
  }
  function sair() { P.x = OUT_DOOR.x + 2.4; P.z = OUT_DOOR.z; P.y = groundY(P.x, P.z); P.face = Math.PI / 2; camS.yaw = -Math.PI / 2; Audio8.sfx('warp'); leaveT = 1; }
  function update(dt) {
    leaveT -= dt; sole.material.opacity = 0.35 + Math.sin(time * 3) * 0.15;
    if (objs.lareira) { const f = objs.lareira.userData.fire; f.scale.set(1.05 + Math.sin(time * 13) * 0.08, 1.25 + Math.sin(time * 9) * 0.15, 1); objs.lareira.userData.light.intensity = 1.2 + Math.sin(time * 11) * 0.25; }
    if (objs.trofeu) objs.trofeu.userData.spin.rotation.y += dt * 1.5;
    if (P.dead || leaveT > 0) return;
    if (!inTower(P.z) && Math.hypot(P.x - OUT_DOOR.x, P.z - OUT_DOOR.z) < 1.6) entrar();
    else if (zoneOf(P.x, P.z) === 'casa' && Math.hypot(P.x - IN_DOOR.x, P.z - IN_DOOR.z) < 1.3) sair();
  }
  function nearest() {
    if (zoneOf(P.x, P.z) !== 'casa') return null;
    if (Math.hypot(P.x - BAU.x, P.z - BAU.z) < 2.6) return { label: '📦 Abrir o baú', fn: () => bauMenu() };
    if (Math.hypot(P.x - BANC.x, P.z - BANC.z) < 2.6) return { label: '🔨 Reformas da casa', fn: () => reformas() };
    return null;
  }
  return { update, nearest, entrar, sair, furnish, door: OUT_DOOR };
})();
