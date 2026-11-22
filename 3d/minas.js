// =====================================================================
//  Masmorras "escape" (criadas para o jogo, não estão no livro): uma caverna
//  fora do mapa, 3 ondas de monstros do seu nível e um chefe no fim, contra o
//  relógio. O mesmo molde serve para:
//  - Mina da Forja (Ferreiro Doran): 🔶 Minério Rúnico, 🔷 Pedra de Têmpera e o 🔰 Selo da Forja;
//  - Cripta das Cartas (Cartomante Zaíra, cartas.js): 🧩 Fragmentos Arcanos e, raramente, uma Carta Arcana.
// =====================================================================
'use strict';
function criarMasmorra(C) {
  const M = C.lugar, R = M.r, ONDAS = C.ondas, TEMPO = C.tempo;
  const ENTRADA = { x: M.x, z: M.z + R - 3 };                          // chegada (e saída) dentro da caverna
  let run = null, leaveT = 0;

  // ---------------- a caverna (paredes, chão, teto e o arco de luz da saída); o resto vem do tema
  const g = new THREE.Group(); g.position.set(M.x, M.y, M.z); scene.add(g);
  const cor = C.corPedra || new THREE.Color(0.55, 0.45, 0.4);
  const rocha = PM('pedra.jpg', [8, 8], cor), rochaP = PM('pedra.jpg', [10, 2], cor.clone().multiplyScalar(0.9), { side: THREE.BackSide });
  const chao = new THREE.Mesh(new THREE.CircleGeometry(R + 1, 48).rotateX(-Math.PI / 2), rocha); chao.receiveShadow = true; g.add(chao);
  const parede = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.5, R + 3, 9, 32, 1, true), rochaP); parede.position.y = 4.5; g.add(parede);
  const teto = new THREE.Mesh(new THREE.CircleGeometry(R + 3, 32).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ color: C.corTeto || 0x1a1412 })); teto.position.y = 9; g.add(teto);
  const box = (w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const tema = C.tema(g, R, box, M) || {};
  const moldura = C.moldura || PM('madeira.jpg', [1, 1], new THREE.Color(0.8, 0.6, 0.45));
  box(0.4, 3.4, 0.4, moldura, -1.4, 1.7, R - 0.8); box(0.4, 3.4, 0.4, moldura, 1.4, 1.7, R - 0.8); box(3.4, 0.4, 0.5, moldura, 0, 3.4, R - 0.8);
  const luzSaida = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshBasicMaterial({ color: C.corSaida || 0xfff0c0, transparent: true, opacity: 0.6, toneMapped: false, side: THREE.DoubleSide }));
  luzSaida.position.set(0, 1.6, R - 0.9); g.add(luzSaida);
  const SAIDA_IN = { x: M.x, z: M.z + R - 1.4 };

  // ---------------- monstros: do seu nível, das espécies dos mapas perto desse nível
  const BASE = () => Object.keys(MOBDEF).filter(t => { const d = MOBDEF[t]; return !d.boss && !d.mini && !d.world && !d.alfa && !d.field && d.drops && t !== 'fungolino'; });
  function escolher(L) { return BASE().map(t => [t, Math.abs(MOBDEF[t].lv - L)]).sort((a, b) => a[1] - b[1]).slice(0, 4).map(x => x[0]); }
  const nivel = () => Math.max(10, Math.min(100, P.lv));
  function escalar(m, L, chefe) {
    const d0 = m.d, kf = L / d0.lv, xp = typeof Tower !== 'undefined' && Tower.xpCampo ? Tower.xpCampo(L) : d0.xp;
    m.d = { ...d0, lv: L, hp: Math.round(d0.hp * Math.pow(kf, 1.6) * (chefe ? 14 : 1)), atk: Math.round(d0.atk * kf * (chefe ? 1.4 : 1)), def: Math.round(d0.def * kf), xp: Math.round(xp * (chefe ? 6 : 0.7)),
      zeny: [Math.round(d0.zeny[0] * kf), Math.round(d0.zeny[1] * kf)], aggro: 30, respawn: 1e9, drops: C.drops(chefe) };
    if (chefe) { m.d.name = C.chefeNome; m.d.mini = true; }
    m.hp = m.maxHp = m.d.hp; m.towerFloor = C.zona; m.noRespawn = true; m.masm = C.zona;
    const sp = m.lab.querySelector('span'); if (sp) sp.innerHTML = `${m.d.name} <small>Nv ${L}</small>`;
  }
  function onda(i) {
    const L = nivel(), tipos = escolher(L), n = ONDAS[i];
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU + i, r = R * (0.35 + (k % 3) * 0.18);
      escalar(spawnMob(tipos[k % tipos.length], null, { x: M.x + Math.sin(a) * r, z: M.z + Math.cos(a) * r * 0.85 - 2 }), L, false);
    }
    banner(`ONDA ${i + 1} DE ${ONDAS.length}`);
    log(`${C.icone} <b>Onda ${i + 1} de ${ONDAS.length}:</b> ${n} criaturas ${C.txtOnda || 'saíram das rachaduras'}.`, 'bad');
  }
  function chefe() {
    const L = nivel() + 3, m = spawnMob(escolher(L)[0], null, { x: M.x, z: M.z - 6 });
    escalar(m, L, true); m.model.g.scale.multiplyScalar(1.6);
    banner(C.chefeNome.toUpperCase()); Audio8.sfx('boom'); log(C.msgChefe, 'bad');
  }
  const vivos = () => mobs.filter(m => m.masm === C.zona && !m.dead);
  function limpar() { for (const m of mobs.filter(m => m.masm === C.zona)) { m.dead = true; scene.remove(m.model.g); m.lab.remove(); } mobs = mobs.filter(m => m.masm !== C.zona); }

  // ---------------- entrar e sair
  function entrar() {
    if (C.minLv && P.lv < C.minLv) { log(`${C.icone} A <b>${C.nome}</b> é para o nível ${C.minLv} em diante.`, 'bad'); Audio8.sfx('miss'); return; }
    if (typeof autoStop === 'function') autoStop('');
    limpar();
    P.x = ENTRADA.x; P.z = ENTRADA.z; P.y = M.y; P.face = Math.PI; camS.yaw = 0; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.dist = Math.min(camS.dist || 9, 11);
    P.protT = time + 3; Audio8.sfx('warp'); leaveT = 1.5;
    run = { onda: -1, fim: time + TEMPO, espera: 3, chefe: false, acabou: false };
    banner(`${C.icone} ${C.nome.toUpperCase()}`); log(C.msgEntrar(TEMPO, ONDAS.length), 'gold');
    hud(true);
  }
  function sair(msg) {
    limpar(); run = null; hud(false);
    P.x = C.saida.x; P.z = C.saida.z; P.y = groundY(P.x, P.z); P.face = 0; camS.yaw = Math.PI; Audio8.sfx('warp'); leaveT = 1.5;
    if (msg) log(msg, 'sys');
  }
  const hudEl = (() => { const d = document.createElement('div'); d.id = C.zona + '-hud'; d.className = 'masm-hud hidden'; document.body.appendChild(d); return d; })();
  function hud(on) { hudEl.classList.toggle('hidden', !on); }
  const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function update(dt) {
    leaveT -= dt;
    if (tema.update) tema.update(dt);
    luzSaida.material.opacity = 0.45 + Math.sin(time * 2) * 0.15;
    const dentro = inTower(P.z) && zoneOf(P.x, P.z) === C.zona;
    if (!dentro) { if (run) { limpar(); run = null; hud(false); } return; }
    if (!run) run = { onda: ONDAS.length, fim: time + 1, espera: 0, chefe: true, acabou: true };   // voltou de outro jeito (asa, morte): só a saída
    const falta = run.fim - time, v = vivos().length;
    hudEl.innerHTML = run.acabou ? `${C.icone} ${C.nome}: limpa · saia pelo arco de luz` : `${C.icone} ${run.chefe ? C.chefeCurto : 'Onda ' + Math.max(1, run.onda + 1) + '/' + ONDAS.length} · 👾 ${v} · <b class="${falta < 60 ? 'pouco' : ''}">⏳ ${mmss(falta)}</b>`;
    if (!run.acabou && falta <= 0 && !P.dead) { Audio8.sfx('boom'); sair(C.msgDesabou); return; }
    if (!run.acabou && !P.dead && v === 0 && (run.espera -= dt) <= 0) {
      if (run.chefe) { run.acabou = true; Audio8.sfx('level'); banner(`${C.nome.toUpperCase()}: LIMPA!`); log(C.msgLimpa, 'gold'); }
      else if (run.onda + 1 < ONDAS.length) { run.onda++; onda(run.onda); run.espera = 2.5; }
      else { run.chefe = true; chefe(); run.espera = 2.5; }
    }
    if (leaveT <= 0 && !P.dead && Math.hypot(P.x - SAIDA_IN.x, P.z - SAIDA_IN.z) < 1.6) sair(run.acabou ? `${C.icone} Você saiu da ${C.nome}.` : `${C.icone} Você saiu da ${C.nome} antes do fim (os monstros que sobraram ficaram lá).`);
  }
  function minimap(mg) {
    const W = mg.canvas.width, H = mg.canvas.height; mg.fillStyle = C.corMapa || '#1c1410'; mg.fillRect(0, 0, W, H);
    mg.textAlign = 'center'; mg.fillStyle = C.corTitulo || '#ffb060'; mg.font = 'bold 13px Georgia'; mg.fillText(`${C.icone} ${C.nome}`, W / 2, H / 2 - 18);
    mg.fillStyle = '#e6d8c8'; mg.font = 'bold 12px sans-serif';
    if (run && !run.acabou) mg.fillText(`⏳ ${mmss(run.fim - time)}`, W / 2, H / 2 + 4);
    mg.font = '11px sans-serif'; mg.fillStyle = '#c8b8a8'; mg.fillText(run && run.acabou ? 'limpa' : run && run.chefe ? C.chefeCurto : run ? `onda ${Math.max(1, run.onda + 1)} de ${ONDAS.length}` : '', W / 2, H / 2 + 22); mg.textAlign = 'left';
  }
  const api = { update, minimap, entrar, sair, saida: C.saida, get correndo() { return !!(run && !run.acabou); } };
  MASMORRAS[C.zona] = api;
  return api;
}

// ---------------- Mina da Forja (Ferreiro Doran): materiais do refino
const Minas = criarMasmorra({
  zona: 'minas', lugar: MINA, nome: 'Mina da Forja', icone: '⛏️', tempo: 8 * 60, ondas: [10, 12, 14],
  saida: { x: VIL.x - 15, z: VIL.z - 4 },                              // ao lado da forja do Doran, em Solmira
  chefeNome: 'Capataz da Mina', chefeCurto: 'Capataz',
  drops: chefe => chefe ? [['minerio', 1], ['minerio', 1], ['minerio', 1], ['minerio', 0.6], ['tempera', 1], ['tempera', 1], ['tempera', 1], ['tempera', 0.6], ['selo_forja', 0.3], ['red', 1]]
    : [['minerio', 0.45], ['tempera', 0.45], ['red', 0.15], ['blue', 0.1]],
  msgEntrar: (t, n) => `⛏️ <b>Mina da Forja:</b> você tem <b>${t / 60} minutos</b> para vencer ${n} ondas e o Capataz antes que a mina desabe. Os monstros soltam 🔶 <b>Minério Rúnico</b> e 🔷 <b>Pedra de Têmpera</b>. Pegue tudo do chão!`,
  msgChefe: '☠ O <b>Capataz da Mina</b> acordou! Ele carrega muito minério e, às vezes, o 🔰 <b>Selo da Forja Eterna</b>.',
  msgLimpa: '✨ <b>Mina limpa!</b> Pegue o que caiu e saia pelo arco de luz. Para descer de novo, fale com o Doran.',
  msgDesabou: '💥 <b>A mina desabou!</b> Você escapou a tempo, com o que já tinha pegado. Fale com o Doran para descer de novo.',
  tema(g, R, box, M) {
    // trilhos da carroça, vigas de madeira, cristais de minério brilhando nas paredes
    const madeira = PM('madeira.jpg', [1, 1], new THREE.Color(0.8, 0.6, 0.45)), ferro = new THREE.MeshPhongMaterial({ color: 0x55555c, shininess: 40 });
    for (const sx of [-0.7, 0.7]) box(0.12, 0.08, R * 1.6, ferro, sx, 0.05, 0);
    for (let k = -9; k <= 9; k++) box(1.9, 0.08, 0.3, madeira, 0, 0.02, k * 2);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2; box(0.5, 8, 0.5, madeira, Math.sin(a) * (R - 0.6), 4, Math.cos(a) * (R - 0.6)); }
    const cristais = [];
    for (let k = 0; k < 22; k++) {
      const a = k / 22 * TAU + (k % 3) * 0.13, r = R - 0.8 - (k % 2) * 0.6, arma = k % 2 === 0;
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.5 + (k % 3) * 0.25), new THREE.MeshBasicMaterial({ color: arma ? 0xffa040 : 0x50b0ff, toneMapped: false }));
      c.position.set(Math.sin(a) * r, 0.6 + (k % 4) * 1.6, Math.cos(a) * r); c.scale.y = 1.8; c.rotation.z = (k % 5 - 2) * 0.3; g.add(c); cristais.push(c);
    }
    box(1.8, 1, 1.2, madeira, 0, 0.7, -R + 6); box(1.5, 0.3, 1, new THREE.MeshLambertMaterial({ color: 0xc07030 }), 0, 1.25, -R + 6);
    addOb(M.x, M.z - R + 6, 1.1);
    [[0, 5, 0], [0, 4, R - 6], [0, 4, -R + 8]].forEach(([x, y, z], i) => { const l = new THREE.PointLight(i ? 0xffb060 : 0xffd0a0, 1.3, 30); l.position.set(x, y, z); g.add(l); });
    return { update: dt => { for (const c of cristais) c.rotation.y += dt * 0.4; } };
  },
});
