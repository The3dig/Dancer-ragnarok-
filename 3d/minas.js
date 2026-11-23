// =====================================================================
//  Masmorras "escape" (criadas para o jogo, não estão no livro): uma caverna
//  fora do mapa, 3 ondas de monstros do seu nível e um chefe no fim, contra o
//  relógio. Dá para ir SOZINHO ou EM GRUPO (até 6): no grupo os monstros são
//  os mesmos para todos (o servidor divide a vida, como nos mapas abertos), são
//  mais fortes e mais numerosos, e o saque é bem maior. O mesmo molde serve para:
//  - Mina da Forja (Ferreiro Doran): 🔶 Minério Rúnico, 🔷 Pedra de Têmpera e o 🔰 Selo da Forja;
//  - Cripta das Cartas (Cartomante Zaíra, cartas.js): 🧩 Fragmentos Arcanos e, raramente, uma Carta Arcana.
// =====================================================================
'use strict';
function criarMasmorra(C) {
  const M = C.lugar, R = M.r, ONDAS = C.ondas, TEMPO = C.tempo;
  const ENTRADA = { x: M.x, z: M.z + R - 6.5 };                        // chegada: bem longe do arco da saída (antes caía em cima dele e já saía)
  let run = null, leaveT = 0, saidaArmada = false;                   // o arco só leva para fora depois que você se afastou dele

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
  // grupo de n pessoas: vida x(1 + 0,8 por pessoa a mais) e x1,3; ataque x1,35; chefe ainda x1,5; XP e saque multiplicados
  const fatorVida = n => n > 1 ? (1 + 0.8 * (n - 1)) * 1.3 : 1;
  function multDrops(l, n) { if (n <= 1) return l; const k = 1.6 * n, out = []; for (const [id, ch] of l) { let c = ch * k; while (c >= 1) { out.push([id, 1]); c -= 1; } if (c > 0.01) out.push([id, c]); } return out; }
  function escalar(m, L, chefe, n = 1) {
    const d0 = m.d, kf = L / d0.lv, xp = typeof Tower !== 'undefined' && Tower.xpCampo ? Tower.xpCampo(L) : d0.xp;
    m.d = { ...d0, lv: L, hp: Math.round(d0.hp * Math.pow(kf, 1.6) * (chefe ? 14 : 1) * fatorVida(n) * (chefe && n > 1 ? 1.5 : 1)), atk: Math.round(d0.atk * kf * (chefe ? 1.4 : 1) * (n > 1 ? 1.35 : 1)), def: Math.round(d0.def * kf), xp: Math.round(xp * (chefe ? 6 : 0.7) * (n > 1 ? 1.3 * n : 1)),
      zeny: [Math.round(d0.zeny[0] * kf), Math.round(d0.zeny[1] * kf)], aggro: 30, respawn: 1e9, drops: multDrops(C.drops(chefe), n) };
    if (chefe) { m.d.name = C.chefeNome; m.d.mini = true; m.model.g.scale.multiplyScalar(1.6); }
    m.hp = m.maxHp = m.d.hp; m.towerFloor = C.zona; m.noRespawn = true; m.masm = C.zona;
    const sp = m.lab.querySelector('span'); if (sp) sp.innerHTML = `${m.d.name} <small>Nv ${L}</small>`;
  }
  // grupo: os monstros nascem no jogo de quem começou e vão para o servidor com um nome que diz tudo:
  // dg:<zona>:<grupo>:<corrida>:<nível>:<tamanho do grupo>:<chefe 0/1>:<onda>:<número>
  const novoDg = (tipo, x, z, L, chefeF, i, k) => {
    const G = run.grupo, id = `${G.id}:${L}:${G.n}:${chefeF ? 1 : 0}:${i}:${k}`, m = spawnMob(tipo, null, { x, z });
    escalar(m, L, chefeF, G.n); m.nid = id; m.dg = G.id; m.dono = Net.me; m.nx = m.x; m.nz = m.z; return m;
  };
  const semear = l => { for (let i = 0; i < l.length; i += 100) Net.send({ t: 'semente+', l: l.slice(i, i + 100).map(m => ({ id: m.nid, type: m.type, max: m.maxHp, hp: m.hp, resp: 3600, x: +m.x.toFixed(2), z: +m.z.toFixed(2) })) }); };
  function onda(i) {
    const L = nivel(), tipos = escolher(L), G = run.grupo, n = G ? Math.round(ONDAS[i] * (1 + 0.15 * (G.n - 1))) : ONDAS[i], novos = [];
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU + i, r = R * (0.35 + (k % 3) * 0.18), x = M.x + Math.sin(a) * r, z = M.z + Math.cos(a) * r * 0.85 - 2;
      if (G) novos.push(novoDg(tipos[k % tipos.length], x, z, L, false, i, k)); else escalar(spawnMob(tipos[k % tipos.length], null, { x, z }), L, false);
    }
    if (G) semear(novos);
    banner(`ONDA ${i + 1} DE ${ONDAS.length}`);
    log(`${C.icone} <b>Onda ${i + 1} de ${ONDAS.length}:</b> ${n} criaturas ${C.txtOnda || 'saíram das rachaduras'}.`, 'bad');
  }
  function chefe() {
    const L = nivel() + 3;
    if (run.grupo) semear([novoDg(escolher(L)[0], M.x, M.z - 6, L, true, 9, 0)]);
    else escalar(spawnMob(escolher(L)[0], null, { x: M.x, z: M.z - 6 }), L, true);
    banner(C.chefeNome.toUpperCase()); Audio8.sfx('boom'); log(C.msgChefe, 'bad');
  }
  const vivos = () => mobs.filter(m => m.masm === C.zona && !m.dead);
  function limpar() { for (const m of mobs.filter(m => m.masm === C.zona)) { m.dead = true; scene.remove(m.model.g); m.lab.remove(); } mobs = mobs.filter(m => m.masm !== C.zona); }
  // monstro do grupo que nasceu no jogo de outro companheiro (chega pelo servidor)
  function criarRemoto(o) {
    const p = o.id.split(':'); if (p[1] !== C.zona || p[2] !== P.grupo) return null;
    const m = spawnMob(o.type, null, { x: o.x, z: o.z }); escalar(m, +p[4], p[6] === '1', +p[5]);
    m.nid = o.id; m.dg = p.slice(0, 4).join(':'); m.dono = o.dono; m.nx = o.x; m.nz = o.z; m.hp = Math.min(m.maxHp, o.hp ?? m.maxHp);
    return m;
  }

  // ---------------- entrar e sair
  // corrida do grupo que um companheiro começou (lida da presença dele)
  function corridaDoGrupo() {
    if (!P.grupo || typeof Grupo === 'undefined') return null;
    for (const r of Grupo.membros()) { const g = r.s && r.s.dg; if (g && g.z === C.zona && !g.acabou && g.fim > Date.now() && g.id.split(':')[2] === P.grupo) return { ...g, nome: r.n }; }
    return null;
  }
  // limite por semana (a semana vira na segunda-feira): cada entrada conta, sozinho ou em grupo
  const semana = () => Math.floor((Date.now() / 864e5 + 3) / 7);
  function usadas() { const s = P.dgSemana; return s && s.w === semana() ? (s[C.zona] || 0) : 0; }
  const restam = () => C.limite ? Math.max(0, C.limite - usadas()) : 99;
  function gastar() { if (!P.dgSemana || P.dgSemana.w !== semana()) P.dgSemana = { w: semana() }; P.dgSemana[C.zona] = (P.dgSemana[C.zona] || 0) + 1; try { save(); } catch (e) { } }
  function entrar(modo) {
    if (C.minLv && P.lv < C.minLv) { log(`${C.icone} A <b>${C.nome}</b> é para o nível ${C.minLv} em diante.`, 'bad'); Audio8.sfx('miss'); return; }
    if (!restam()) { log(`${C.icone} Você já entrou <b>${C.limite} vezes</b> na <b>${C.nome}</b> esta semana. Ela abre de novo na <b>segunda-feira</b>.`, 'bad'); Audio8.sfx('miss'); return; }
    let grupo = null;
    if (modo === 'grupo') {
      const outra = corridaDoGrupo();
      if (outra) grupo = { id: outra.id, n: outra.n, host: false, fimMs: outra.fim, de: outra.nome };
      else {
        const M_ = typeof Grupo !== 'undefined' ? Grupo.membros() : [];
        if (!P.grupo || !M_.length || !Net.connected) { log(`${C.icone} Para ir em grupo, monte um grupo no 👥 (2 a 6 pessoas, todos on-line).`, 'bad'); Audio8.sfx('miss'); return; }
        grupo = { id: `dg:${C.zona}:${P.grupo}:${Date.now().toString(36)}`, n: Math.min(6, M_.length + 1), host: true, fimMs: Date.now() + TEMPO * 1000 };
      }
    }
    if (typeof autoStop === 'function') autoStop('');
    limpar();
    P.x = ENTRADA.x; P.z = ENTRADA.z; P.y = M.y; P.face = Math.PI; camS.yaw = 0; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.dist = Math.min(camS.dist || 9, 11);
    P.protT = time + 3; Audio8.sfx('warp'); leaveT = 1.5; saidaArmada = false;
    if (typeof Ranking !== 'undefined') Ranking.comecar(C.zona);
    gastar(); if (C.limite) log(`${C.icone} Entradas na ${C.nome} esta semana: <b>${usadas()} de ${C.limite}</b>.`, 'sys');
    run = { onda: -1, fim: time + (grupo ? (grupo.fimMs - Date.now()) / 1000 : TEMPO), espera: 3, chefe: false, acabou: false, grupo };
    banner(`${C.icone} ${C.nome.toUpperCase()}${grupo ? ' · EM GRUPO' : ''}`); log(C.msgEntrar(TEMPO, ONDAS.length), 'gold');
    if (grupo) log(grupo.host ? `👥 <b>Corrida em grupo (${grupo.n} pessoas):</b> monstros mais fortes e em maior número, saque bem maior. Seus companheiros entram falando com o mesmo NPC.` : `👥 Você entrou na corrida do grupo de <b>${grupo.de}</b>.`, 'gold');
    hud(true);
  }
  function fimGrupo() { if (run && run.grupo && run.grupo.host && Net.connected) Net.send({ t: 'dgfim', pref: run.grupo.id + ':' }); }
  function sair(msg) {
    if (typeof Ranking !== 'undefined') Ranking.cancelar(C.zona);
    fimGrupo(); limpar(); run = null; hud(false);
    { const q = pontoLivre(C.saida.x, C.saida.z); P.x = q.x; P.z = q.z; } P.y = groundY(P.x, P.z); P.face = 0; camS.yaw = Math.PI; Audio8.sfx('warp'); leaveT = 1.5;
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
    g.visible = dentro;                                                 // fora dela a caverna some: as luzes dela pesavam no mapa todo (o jogo travava)
    if (!dentro) { if (run) { fimGrupo(); limpar(); run = null; hud(false); } return; }
    if (!run) run = { onda: ONDAS.length, fim: time + 1, espera: 0, chefe: true, acabou: true };   // voltou de outro jeito (asa, morte): só a saída
    const G = run.grupo;
    if (G && !G.host) {                                                // companheiro: segue o relógio e as ondas de quem começou
      const h = corridaDoGrupo();
      if (h && h.id === G.id) { run.onda = h.onda; run.chefe = h.chefe; run.fim = time + (h.fim - Date.now()) / 1000; G.vistoT = time; }
      else if (time - (G.vistoT || time) > 8 || (!h && !G.vistoT)) { if (run.chefe && vivos().length === 0 && typeof Ranking !== 'undefined') Ranking.terminar(C.zona); run.acabou = true; G.host = null; log('👥 A corrida do grupo acabou (quem começou saiu ou a masmorra foi limpa). Saia pelo arco de luz.', 'sys'); }
    }
    const falta = run.fim - time, v = vivos().length;
    // com a barra de vida de um chefe na tela, o painel desce para baixo dela (antes ficava por cima do HP do chefe)
    const bb = document.getElementById('bossbar'), bv = bb && !bb.classList.contains('hidden') ? bb.getBoundingClientRect() : null;
    hudEl.style.top = bv && bv.height ? (bv.bottom + 6) + 'px' : '';
    hudEl.innerHTML = run.acabou ? `${C.icone} ${C.nome}: limpa · saia pelo arco de luz` : `${C.icone} ${run.chefe ? C.chefeCurto : 'Onda ' + Math.max(1, run.onda + 1) + '/' + ONDAS.length} · 👾 ${v} · <b class="${falta < 60 ? 'pouco' : ''}">⏳ ${mmss(falta)}</b>`;
    if (!run.acabou && falta <= 0 && !P.dead) { Audio8.sfx('boom'); sair(C.msgDesabou); return; }
    if (G && !G.host) { /* as ondas vêm do jogo de quem começou */ }
    else if (!run.acabou && !P.dead && v === 0 && (run.espera -= dt) <= 0) {
      if (run.chefe) { run.acabou = true; fimGrupo(); if (typeof Ranking !== 'undefined') Ranking.terminar(C.zona); Audio8.sfx('level'); banner(`${C.nome.toUpperCase()}: LIMPA!`); log(C.msgLimpa, 'gold'); }
      else if (run.onda + 1 < ONDAS.length) { run.onda++; onda(run.onda); run.espera = 2.5; }
      else { run.chefe = true; chefe(); run.espera = 2.5; }
    }
    const dSaida = Math.hypot(P.x - SAIDA_IN.x, P.z - SAIDA_IN.z); if (dSaida > 4) saidaArmada = true;
    if (leaveT <= 0 && saidaArmada && !P.dead && dSaida < 1.6) sair(run.acabou ? `${C.icone} Você saiu da ${C.nome}.` : `${C.icone} Você saiu da ${C.nome} antes do fim (os monstros que sobraram ficaram lá).`);
  }
  function minimap(mg) {
    const W = mg.canvas.width, H = mg.canvas.height; mg.fillStyle = C.corMapa || '#1c1410'; mg.fillRect(0, 0, W, H);
    mg.textAlign = 'center'; mg.fillStyle = C.corTitulo || '#ffb060'; mg.font = 'bold 13px Georgia'; mg.fillText(`${C.icone} ${C.nome}`, W / 2, H / 2 - 18);
    mg.fillStyle = '#e6d8c8'; mg.font = 'bold 12px sans-serif';
    if (run && !run.acabou) mg.fillText(`⏳ ${mmss(run.fim - time)}`, W / 2, H / 2 + 4);
    mg.font = '11px sans-serif'; mg.fillStyle = '#c8b8a8'; mg.fillText(run && run.acabou ? 'limpa' : run && run.chefe ? C.chefeCurto : run ? `onda ${Math.max(1, run.onda + 1)} de ${ONDAS.length}` : '', W / 2, H / 2 + 22); mg.textAlign = 'left';
  }
  // o que vai na presença de quem começou a corrida em grupo (os companheiros leem)
  function pres() { const G = run && run.grupo; return G && G.host ? { id: G.id, z: C.zona, n: G.n, fim: Math.round(Date.now() + (run.fim - time) * 1000), onda: run.onda, chefe: run.chefe, acabou: run.acabou } : null; }
  const api = { update, minimap, entrar, sair, criarRemoto, pres, corridaDoGrupo, restam, limite: C.limite, saida: C.saida, get correndo() { return !!(run && !run.acabou); } };
  MASMORRAS[C.zona] = api;
  return api;
}

// presença: a corrida em grupo que eu comecei (uma de cada vez)
function dgPres() { for (const k in MASMORRAS) { const p = typeof MASMORRAS[k].pres === 'function' ? MASMORRAS[k].pres() : null; if (p) return { dg: p }; } return { dg: null }; }   // (se quebrar aqui, a presença inteira para de ir)
// monstro "dg:..." que chegou do servidor: só cria se for do meu grupo e da masmorra certa
function dgCriar(o) { const z = String(o.id).split(':')[1]; return MASMORRAS[z] ? MASMORRAS[z].criarRemoto(o) : null; }

// ---------------- Mina da Forja (Ferreiro Doran): materiais do refino
const Minas = criarMasmorra({
  zona: 'minas', lugar: MINA, nome: 'Mina da Forja', icone: '⛏️', tempo: 8 * 60, ondas: [10, 12, 14], limite: 5,   // 5 por semana
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
