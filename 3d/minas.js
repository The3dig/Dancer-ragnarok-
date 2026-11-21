// =====================================================================
//  Mina da Forja: a caverna dos materiais de refino (criada para o jogo,
//  não está no livro). O Ferreiro Doran manda você descer.
//  É uma corrida contra o tempo, no estilo "escape": 3 ondas de monstros
//  do seu nível e o Capataz da Mina no fim, antes que a mina desabe.
//  Lá caem 🔶 Minério Rúnico (armas, anéis e colar), 🔷 Pedra de Têmpera
//  (capacete, armadura, luvas e botas) e, do Capataz, o 🔰 Selo da Forja
//  Eterna, que impede a peça de quebrar no refino acima do +10.
// =====================================================================
'use strict';
const Minas = (() => {
  const M = MINA, R = M.r;
  const SAIDA = { x: VIL.x - 15, z: VIL.z - 4 };                     // ao lado da forja do Doran, em Solmira
  const ENTRADA = { x: M.x, z: M.z + R - 3 };                          // chegada (e saída) dentro da mina
  const TEMPO = 8 * 60, ONDAS = [10, 12, 14];
  let run = null, leaveT = 0;

  // ---------------- a caverna
  const g = new THREE.Group(); g.position.set(M.x, M.y, M.z); scene.add(g);
  const rocha = PM('pedra.jpg', [8, 8], new THREE.Color(0.55, 0.45, 0.4)), rochaP = PM('pedra.jpg', [10, 2], new THREE.Color(0.5, 0.42, 0.38), { side: THREE.BackSide });
  const chao = new THREE.Mesh(new THREE.CircleGeometry(R + 1, 48).rotateX(-Math.PI / 2), rocha); chao.receiveShadow = true; g.add(chao);
  const parede = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.5, R + 3, 9, 32, 1, true), rochaP); parede.position.y = 4.5; g.add(parede);
  const teto = new THREE.Mesh(new THREE.CircleGeometry(R + 3, 32).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x1a1412 })); teto.position.y = 9; g.add(teto);
  // trilhos da carroça, vigas de madeira, cristais de minério brilhando nas paredes
  const madeira = PM('madeira.jpg', [1, 1], new THREE.Color(0.8, 0.6, 0.45)), ferro = new THREE.MeshPhongMaterial({ color: 0x55555c, shininess: 40 });
  const box = (w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  for (const sx of [-0.7, 0.7]) box(0.12, 0.08, R * 1.6, ferro, sx, 0.05, 0);
  for (let k = -9; k <= 9; k++) box(1.9, 0.08, 0.3, madeira, 0, 0.02, k * 2);
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2, x = Math.sin(a) * (R - 0.6), z = Math.cos(a) * (R - 0.6); box(0.5, 8, 0.5, madeira, x, 4, z); }
  const cristais = [];
  for (let k = 0; k < 22; k++) {
    const a = k / 22 * TAU + (k % 3) * 0.13, r = R - 0.8 - (k % 2) * 0.6, arma = k % 2 === 0;
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.5 + (k % 3) * 0.25), new THREE.MeshBasicMaterial({ color: arma ? 0xffa040 : 0x50b0ff, toneMapped: false }));
    c.position.set(Math.sin(a) * r, 0.6 + (k % 4) * 1.6, Math.cos(a) * r); c.scale.y = 1.8; c.rotation.z = (k % 5 - 2) * 0.3; g.add(c); cristais.push(c);
  }
  const carroca = box(1.8, 1, 1.2, madeira, 0, 0.7, -R + 6); box(1.5, 0.3, 1, new THREE.MeshLambertMaterial({ color: 0xc07030 }), 0, 1.25, -R + 6);
  addOb(M.x, M.z - R + 6, 1.1);
  const luzes = [[0, 5, 0], [0, 4, R - 6], [0, 4, -R + 8]].map(([x, y, z], i) => { const l = new THREE.PointLight(i ? 0xffb060 : 0xffd0a0, 1.3, 30); l.position.set(x, y, z); g.add(l); return l; });
  // a saída: um arco de madeira com luz do dia
  box(0.4, 3.4, 0.4, madeira, -1.4, 1.7, R - 0.8); box(0.4, 3.4, 0.4, madeira, 1.4, 1.7, R - 0.8); box(3.4, 0.4, 0.5, madeira, 0, 3.4, R - 0.8);
  const luzSaida = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.6, toneMapped: false, side: THREE.DoubleSide }));
  luzSaida.position.set(0, 1.6, R - 0.9); g.add(luzSaida);
  const SAIDA_IN = { x: M.x, z: M.z + R - 1.4 };

  // ---------------- monstros: do seu nível, das espécies dos mapas perto desse nível
  const BASE = () => Object.keys(MOBDEF).filter(t => { const d = MOBDEF[t]; return !d.boss && !d.mini && !d.world && !d.alfa && !d.field && d.drops && t !== 'fungolino'; });
  function escolher(L) {
    const l = BASE().map(t => [t, Math.abs(MOBDEF[t].lv - L)]).sort((a, b) => a[1] - b[1]);
    return l.slice(0, 4).map(x => x[0]);
  }
  const nivel = () => Math.max(10, Math.min(100, P.lv));
  function escalar(m, L, chefe) {
    const d0 = m.d, kf = L / d0.lv, xp = typeof Tower !== 'undefined' && Tower.xpCampo ? Tower.xpCampo(L) : d0.xp;
    m.d = { ...d0, lv: L, hp: Math.round(d0.hp * Math.pow(kf, 1.6) * (chefe ? 14 : 1)), atk: Math.round(d0.atk * kf * (chefe ? 1.4 : 1)), def: Math.round(d0.def * kf), xp: Math.round(xp * (chefe ? 6 : 0.7)),
      zeny: [Math.round(d0.zeny[0] * kf), Math.round(d0.zeny[1] * kf)], aggro: 30, respawn: 1e9,
      // os materiais de refino: cada monstro solta um ou outro; o Capataz solta vários e às vezes o Selo
      drops: chefe ? [['minerio', 1], ['minerio', 1], ['minerio', 1], ['minerio', 0.6], ['tempera', 1], ['tempera', 1], ['tempera', 1], ['tempera', 0.6], ['selo_forja', 0.3], ['red', 1]]
        : [['minerio', 0.45], ['tempera', 0.45], ['red', 0.15], ['blue', 0.1]] };
    if (chefe) { m.d.name = 'Capataz da Mina'; m.d.mini = true; }
    m.hp = m.maxHp = m.d.hp; m.towerFloor = 'mina'; m.noRespawn = true; m.mina = true;
    const sp = m.lab.querySelector('span'); if (sp) sp.innerHTML = `${m.d.name} <small>Nv ${L}</small>`;
  }
  function onda(i) {
    const L = nivel(), tipos = escolher(L), n = ONDAS[i];
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU + i, r = R * (0.35 + (k % 3) * 0.18);
      const m = spawnMob(tipos[k % tipos.length], null, { x: M.x + Math.sin(a) * r, z: M.z + Math.cos(a) * r * 0.85 - 2 });
      escalar(m, L, false);
    }
    banner(`ONDA ${i + 1} DE ${ONDAS.length}`);
    log(`⛏️ <b>Onda ${i + 1} de ${ONDAS.length}:</b> ${n} criaturas saíram das rachaduras.`, 'bad');
  }
  function chefe() {
    const L = nivel() + 3, t = escolher(L)[0], m = spawnMob(t, null, { x: M.x, z: M.z - 6 });
    escalar(m, L, true); m.model.g.scale.multiplyScalar(1.6);
    banner('O CAPATAZ DA MINA'); Audio8.sfx('boom');
    log('☠ O <b>Capataz da Mina</b> acordou! Ele carrega muito minério e, às vezes, o 🔰 <b>Selo da Forja Eterna</b>.', 'bad');
  }
  const vivos = () => mobs.filter(m => m.mina && !m.dead);
  function limpar() { for (const m of mobs.filter(m => m.mina)) { m.dead = true; scene.remove(m.model.g); m.lab.remove(); } mobs = mobs.filter(m => !m.mina); }

  // ---------------- entrar e sair
  function entrar() {
    if (typeof autoStop === 'function') autoStop('');
    limpar();
    P.x = ENTRADA.x; P.z = ENTRADA.z; P.y = M.y; P.face = Math.PI; camS.yaw = 0; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.dist = Math.min(camS.dist || 9, 11);
    P.protT = time + 3; Audio8.sfx('warp'); leaveT = 1.5;
    run = { onda: -1, fim: time + TEMPO, espera: 3, chefe: false, acabou: false };
    banner('⛏️ MINA DA FORJA');
    log(`⛏️ <b>Mina da Forja:</b> você tem <b>${TEMPO / 60} minutos</b> para vencer ${ONDAS.length} ondas e o Capataz antes que a mina desabe. Os monstros soltam 🔶 <b>Minério Rúnico</b> e 🔷 <b>Pedra de Têmpera</b>. Pegue tudo do chão!`, 'gold');
    hud(true);
  }
  function sair(msg) {
    limpar(); run = null; hud(false);
    P.x = SAIDA.x; P.z = SAIDA.z; P.y = groundY(P.x, P.z); P.face = 0; camS.yaw = Math.PI; Audio8.sfx('warp'); leaveT = 1.5;
    if (msg) log(msg, 'sys');
  }
  // relógio da corrida
  const hudEl = (() => { const d = document.createElement('div'); d.id = 'mina-hud'; d.className = 'hidden'; document.body.appendChild(d); return d; })();
  function hud(on) { hudEl.classList.toggle('hidden', !on); }
  function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function update(dt) {
    leaveT -= dt;
    for (const c of cristais) c.rotation.y += dt * 0.4;
    luzSaida.material.opacity = 0.45 + Math.sin(time * 2) * 0.15;
    const dentro = inTower(P.z) && zoneOf(P.x, P.z) === 'minas';
    if (!dentro) { if (run) { limpar(); run = null; hud(false); } return; }
    if (!run) run = { onda: ONDAS.length, fim: time + 1, espera: 0, chefe: true, acabou: true };   // voltou de outro jeito (asa, morte): só a saída
    // relógio
    const falta = run.fim - time, v = vivos().length;
    hudEl.innerHTML = run.acabou ? '⛏️ Mina limpa · saia pelo arco de luz' : `⛏️ ${run.chefe ? 'Capataz' : 'Onda ' + Math.max(1, run.onda + 1) + '/' + ONDAS.length} · 👾 ${v} · <b class="${falta < 60 ? 'pouco' : ''}">⏳ ${mmss(falta)}</b>`;
    if (!run.acabou && falta <= 0 && !P.dead) { Audio8.sfx('boom'); sair('💥 <b>A mina desabou!</b> Você escapou a tempo, com o que já tinha pegado. Fale com o Doran para descer de novo.'); return; }
    if (!run.acabou && !P.dead) {
      if (v === 0) {
        if ((run.espera -= dt) <= 0) {
          if (run.chefe) { run.acabou = true; Audio8.sfx('level'); banner('MINA LIMPA!'); log('✨ <b>Mina limpa!</b> Pegue o que caiu e saia pelo arco de luz. Para descer de novo, fale com o Doran.', 'gold'); }
          else if (run.onda + 1 < ONDAS.length) { run.onda++; onda(run.onda); run.espera = 2.5; }
          else { run.chefe = true; chefe(); run.espera = 2.5; }
        }
      }
    }
    // saída: o arco de luz (só depois de se afastar dele)
    if (leaveT <= 0 && !P.dead && Math.hypot(P.x - SAIDA_IN.x, P.z - SAIDA_IN.z) < 1.6) sair(run.acabou ? '⛏️ Você saiu da Mina da Forja.' : '⛏️ Você saiu da Mina da Forja antes do fim (os monstros que sobraram ficaram lá).');
  }
  function minimap(mg) {
    const W = mg.canvas.width, H = mg.canvas.height; mg.fillStyle = '#1c1410'; mg.fillRect(0, 0, W, H);
    mg.textAlign = 'center'; mg.fillStyle = '#ffb060'; mg.font = 'bold 13px Georgia'; mg.fillText('⛏️ Mina da Forja', W / 2, H / 2 - 18);
    mg.fillStyle = '#e6d8c8'; mg.font = 'bold 12px sans-serif';
    if (run && !run.acabou) mg.fillText(`⏳ ${mmss(run.fim - time)}`, W / 2, H / 2 + 4);
    mg.font = '11px sans-serif'; mg.fillStyle = '#c8b8a8'; mg.fillText(run && run.acabou ? 'limpa' : run && run.chefe ? 'Capataz' : run ? `onda ${Math.max(1, run.onda + 1)} de ${ONDAS.length}` : '', W / 2, H / 2 + 22); mg.textAlign = 'left';
  }
  return { update, minimap, entrar, sair, saida: SAIDA, get correndo() { return !!(run && !run.acabou); } };
})();
