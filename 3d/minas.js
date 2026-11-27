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
// ---------------- níveis de dificuldade das masmorras (compartilhado: Mina, Cripta e Templo)
// lv = nível mínimo do personagem; mob = nível dos monstros; saque = multiplicador dos drops e do baú
const DIFS = [
  { n: 1, lv: 20, mob: 20, saque: 1, nome: 'Aprendiz' },
  { n: 2, lv: 50, mob: 50, saque: 1.6, nome: 'Veterano' },
  { n: 3, lv: 80, mob: 80, saque: 2.4, nome: 'Mestre' },
  { n: 4, lv: 110, mob: 110, saque: 3.4, nome: 'Lendário' },
  { n: 5, lv: 150, mob: 150, saque: 4.8, nome: 'Impossível' },
];
function escolherNivel(titulo, fn) {
  dialog(`${titulo} · escolha o nível`, 'Quanto mais alto o nível, mais fortes os monstros e <b>maior o saque</b>. O 🏆 recorde mostra em que nível você fez (nível mais alto fica na frente).', [
    ...DIFS.map(d => ({ label: `${P.lv >= d.lv ? '⚔️' : '🔒'} Nível ${d.n} · ${d.nome} — Nv ${d.lv}+ · saque ×${d.saque}`, fn: () => { if (P.lv < d.lv) { log(`🔒 O nível ${d.n} é para o nível ${d.lv} em diante.`, 'bad'); Audio8.sfx('miss'); return true; } fn(d.n); } })),
    { label: 'Cancelar' }]);
}
function criarMasmorra(C) {
  const M = C.lugar, R = M.r, ONDAS = C.ondas, TEMPO = C.tempo;
  const ENTRADA = { x: M.x, z: M.z + R - 6.5 };                        // chegada: bem longe do arco da saída (antes caía em cima dele e já saía)
  let run = null, leaveT = 0, saidaArmada = false;                   // o arco só leva para fora depois que você se afastou dele

  // ---------------- a caverna (paredes, chão, teto e o arco de luz da saída); o resto vem do tema
  const g = new THREE.Group(); g.position.set(M.x, M.y, M.z); scene.add(g);
  const cor = C.corPedra || new THREE.Color(0.55, 0.45, 0.4);
  const rocha = PM(C.texChao || 'pedra.jpg', [8, 8], C.corChao || cor), rochaP = PM('pedra.jpg', [10, 2], cor.clone().multiplyScalar(0.9), { side: THREE.BackSide });
  const chao = new THREE.Mesh(new THREE.CircleGeometry(R + 1, 48).rotateX(-Math.PI / 2), rocha); chao.receiveShadow = true; g.add(chao);
  const parede = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.5, R + 3, 9, 32, 1, true), rochaP); parede.position.y = 4.5; g.add(parede); if (C.semParede) parede.visible = false;   // o tema faz a própria parede
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
  // ---------------- 5 níveis de dificuldade (pedido do Rone): o nível dos monstros é o do nível escolhido,
  // e o saque cresce junto. Vale para a Mina e a Cripta (e o Templo tem os mesmos níveis).
  const nivel = () => run && run.dif ? DIFS[run.dif - 1].mob : Math.max(10, Math.min(100, P.lv));
  // grupo de n pessoas: vida x(1 + 0,8 por pessoa a mais) e x1,3; ataque x1,35; chefe ainda x1,5; XP e saque multiplicados
  const fatorVida = n => n > 1 ? (1 + 0.8 * (n - 1)) * 1.3 : 1;
  function multNivel(l) { const k = run && run.dif ? DIFS[run.dif - 1].saque : 1; if (k <= 1) return l; const out = []; for (const [id, ch] of l) { let c = ch * k; while (c >= 1) { out.push([id, 1]); c -= 1; } if (c > 0.01) out.push([id, c]); } return out; }
  function multDrops(l, n) { if (n <= 1) return l; const k = 1.6 * n, out = []; for (const [id, ch] of l) { let c = ch * k; while (c >= 1) { out.push([id, 1]); c -= 1; } if (c > 0.01) out.push([id, c]); } return out; }
  function escalar(m, L, chefe, n = 1) {
    const d0 = m.d, kf = L / d0.lv, xp = typeof Tower !== 'undefined' && Tower.xpCampo ? Tower.xpCampo(L) : d0.xp;
    m.d = { ...d0, lv: L, hp: Math.round(d0.hp * Math.pow(kf, 1.6) * (chefe ? 14 : 1) * fatorVida(n) * (chefe && n > 1 ? 1.5 : 1)), atk: Math.round(d0.atk * kf * (chefe ? 1.4 : 1) * (n > 1 ? 1.35 : 1)), def: Math.round(d0.def * kf), xp: Math.round(xp * (chefe ? 6 : 0.7) * (n > 1 ? 1.3 * n : 1)),
      zeny: [Math.round(d0.zeny[0] * kf), Math.round(d0.zeny[1] * kf)], aggro: 30, respawn: 1e9, drops: multNivel(multDrops(C.drops(chefe), n)) };
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
    const p = o.id.split(':'); if (p[1] !== C.zona || !(run && run.grupo && o.id.startsWith(run.grupo.id + ':'))) return null;   // só os da corrida em que estou
    const m = spawnMob(o.type, null, { x: o.x, z: o.z }); escalar(m, +p[4], p[6] === '1', +p[5]);
    m.nid = o.id; m.dg = p.slice(0, 4).join(':'); m.dono = o.dono; m.nx = o.x; m.nz = o.z; m.hp = Math.min(m.maxHp, o.hp ?? m.maxHp);
    return m;
  }

  // ---------------- entrar e sair
  // corrida do grupo que um companheiro começou (lida da presença dele)
  // 🌍 qualquer corrida aberta nesta masmorra (de qualquer jogador, com grupo ou sem: "o mundo é o mesmo", pedido do Rone)
  function corridaDoGrupo() {
    if (typeof Net === 'undefined' || !Net.connected || !Net.peers) return null;
    for (const r of Net.peers()) { const g = r.s && r.s.dg; if (!g || g.z !== C.zona || g.acabou || !(g.fim > Date.now() + 15000)) continue; const gp = String(g.id).split(':')[2] || '';
      if (gp.startsWith('*') || (P.grupo && gp === P.grupo)) return { ...g, nome: r.n }; }
    return null;
  }
  // limite por semana (a semana vira na segunda-feira): cada entrada conta, sozinho ou em grupo
  const semana = () => Math.floor((Date.now() / 864e5 + 3) / 7);
  function usadas() { const s = P.dgSemana; return s && s.w === semana() ? (s[C.zona] || 0) : 0; }
  const restam = () => C.limite ? Math.max(0, C.limite - usadas()) : 99;
  function gastar() { if (!P.dgSemana || P.dgSemana.w !== semana()) P.dgSemana = { w: semana() }; P.dgSemana[C.zona] = (P.dgSemana[C.zona] || 0) + 1; try { save(); } catch (e) { } }
  function entrar(modo, dif, aceito) {
    // escolhe o nível de dificuldade (quem entra na corrida do grupo usa o nível que o companheiro escolheu)
    const doGrupo = corridaDoGrupo();
    if (doGrupo) dif = doGrupo.dif || 1;
    if (!dif) { setTimeout(() => escolherNivel(C.icone + ' ' + C.nome, k => entrar(modo, k)), 40); return; }
    if (P.lv < DIFS[dif - 1].lv) { log(doGrupo ? `${C.icone} <b>${doGrupo.nome}</b> está lá dentro no <b>nível ${dif}</b>, que é para o nível ${DIFS[dif - 1].lv} em diante. Espere a corrida acabar (todos veem os mesmos monstros).` : `${C.icone} O <b>nível ${dif}</b> da ${C.nome} é para o nível ${DIFS[dif - 1].lv} em diante.`, 'bad'); Audio8.sfx('miss'); return; }
    if (C.minLv && P.lv < C.minLv) { log(`${C.icone} A <b>${C.nome}</b> é para o nível ${C.minLv} em diante.`, 'bad'); Audio8.sfx('miss'); return; }
    if (!restam()) { log(`${C.icone} Você já entrou <b>${C.limite} vezes</b> na <b>${C.nome}</b> esta semana. Ela abre de novo na <b>segunda-feira</b>.`, 'bad'); Audio8.sfx('miss'); return; }
    let grupo = null;
    const outra = doGrupo;
    if (outra) grupo = { id: outra.id, n: outra.n, host: false, fimMs: outra.fim, de: outra.nome };   // entra na corrida que já está lá dentro
    else if (modo !== 'grupo' && typeof Net !== 'undefined' && Net.connected) grupo = { id: `dg:${C.zona}:*${String(Net.me || 'x').slice(0, 8)}:${Date.now().toString(36)}`, n: 1, host: true, fimMs: Date.now() + TEMPO * 1000, aberta: true };
    else if (modo === 'grupo') {
      {
        const M_ = typeof Grupo !== 'undefined' ? Grupo.membros() : [];
        if (!P.grupo || !M_.length || !Net.connected) { log(`${C.icone} Para ir em grupo, monte um grupo no 👥 (2 a 6 pessoas, todos on-line).`, 'bad'); Audio8.sfx('miss'); return; }
        if (!aceito && Grupo.pedirMasmorra) { Grupo.pedirMasmorra({ z: C.zona, nome: C.nome, dif, comecar: () => entrar(modo, dif, true) }); return; }   // todos do grupo precisam aceitar
        grupo = { id: `dg:${C.zona}:*${P.grupo}:${Date.now().toString(36)}`, n: Math.min(6, M_.length + 1), host: true, fimMs: Date.now() + TEMPO * 1000 };
      }
    }
    if (typeof autoStop === 'function') autoStop('');
    limpar();
    P.x = ENTRADA.x; P.z = ENTRADA.z; P.y = M.y; P.face = Math.PI; camS.yaw = 0; camS.x = P.x; camS.z = P.z; camS.y = P.y; camS.dist = Math.min(camS.dist || 9, 11);
    P.protT = time + 3; Audio8.sfx('warp'); leaveT = 1.5; saidaArmada = false;
    if (typeof Ranking !== 'undefined') Ranking.comecar(C.zona, dif);
    gastar(); if (C.limite) log(`${C.icone} Entradas na ${C.nome} esta semana: <b>${usadas()} de ${C.limite}</b>.`, 'sys');
    run = { onda: -1, fim: time + (grupo ? (grupo.fimMs - Date.now()) / 1000 : TEMPO), espera: 3, chefe: false, acabou: false, grupo, dif };
    banner(`${C.icone} ${C.nome.toUpperCase()} · NÍVEL ${dif}${grupo ? ' · EM GRUPO' : ''}`); log(C.msgEntrar(TEMPO, ONDAS.length), 'gold');
    if (grupo && !grupo.host && typeof Net !== 'undefined') Net.send({ t: 'dgver', pref: grupo.id + ':' });   // pede os monstros que já estão lá dentro
    if (grupo && !grupo.aberta) log(grupo.host ? `👥 <b>Corrida em grupo (${grupo.n} pessoas):</b> monstros mais fortes e em maior número, saque bem maior. Seus companheiros entram falando com o mesmo NPC.` : `🌍 Você entrou na corrida de <b>${grupo.de}</b>: todos aqui dentro veem e enfrentam os mesmos monstros.`, 'gold');
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
  function pres() { const G = run && run.grupo; return G && G.host ? { id: G.id, z: C.zona, n: G.n, dif: run.dif, fim: Math.round(Date.now() + (run.fim - time) * 1000), onda: run.onda, chefe: run.chefe, acabou: run.acabou } : null; }
  const api = { update, minimap, entrar, sair, criarRemoto, pres, corridaDoGrupo, restam, limite: C.limite, saida: C.saida, get correndo() { return !!(run && !run.acabou); } };
  MASMORRAS[C.zona] = api;
  return api;
}

// presença: a corrida em grupo que eu comecei (uma de cada vez)
function dgPres() { for (const k in MASMORRAS) { const p = typeof MASMORRAS[k].pres === 'function' ? MASMORRAS[k].pres() : null; if (p) return { dg: p }; } return { dg: null }; }   // (se quebrar aqui, a presença inteira para de ir)
// monstro "dg:..." que chegou do servidor: só cria se for do meu grupo e da masmorra certa
function dgCriar(o) { const z = String(o.id).split(':')[1]; if (z === 'torre') return typeof Tower !== 'undefined' ? Tower.criarRemoto(o) : null; return MASMORRAS[z] ? MASMORRAS[z].criarRemoto(o) : null; }

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
  texChao: 'terra.jpg', corChao: new THREE.Color(0.62, 0.52, 0.42), corTeto: 0x0c0907, semParede: true,
  tema(g, R, box, M) {
    // Mina de verdade (pedido do Rone: "precisa de um ambiente de mina"): parede de rocha bruta e irregular,
    // estalactites, pedras soltas, escoras de madeira com lampiões, veios de minério presos na rocha,
    // carrinho cheio de minério nos trilhos, barris, caixotes, picareta e poeira no ar. Criado para o jogo.
    const madeira = PM('madeira.jpg', [1, 1], new THREE.Color(0.62, 0.45, 0.32)), ferro = new THREE.MeshPhongMaterial({ color: 0x4a4a50, shininess: 50 });
    const pedraM = new THREE.MeshLambertMaterial({ map: photo('rocha_clara.jpg', [14, 3]), color: 0xb08a68, vertexColors: true, side: THREE.BackSide, emissive: 0x7a5434, emissiveIntensity: 0.35, emissiveMap: photo('rocha_clara.jpg', [14, 3]) });   // a rocha tem um pouco de luz própria quente: os lampiões não alcançam a parede (rocha.jpg é quase preta)   // (sem flatShading: por dentro ficava preto)
    const pedraF = new THREE.MeshLambertMaterial({ map: photo('rocha_clara.jpg', [1, 1]), color: 0xa08060, flatShading: true, emissive: 0x6a4a30, emissiveIntensity: 0.3, emissiveMap: photo('rocha_clara.jpg', [1, 1]) });
    // o raio da parede em cada ângulo e altura (sempre fora de onde o personagem anda: R - 1)
    const raioP = (a, y) => R + 0.55 + Math.sin(a * 7 + 1.3) * 0.35 + Math.sin(a * 13 + y * 0.9) * 0.25 + Math.sin(a * 3 - y * 0.5) * 0.4 + Math.max(0, y - 6) * 0.25;
    // parede: cilindro com cada ponto empurrado para dentro ou para fora, e manchas de cor
    const pg = new THREE.CylinderGeometry(1, 1, 10, 64, 10, true), pp = pg.attributes.position, cores = [];
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i), y = pp.getY(i) + 5, z = pp.getZ(i), a = Math.atan2(x, z), r = raioP(a, y);
      pp.setXYZ(i, Math.sin(a) * r, y, Math.cos(a) * r);
      const t = 0.55 + 0.25 * Math.sin(a * 11 + y * 1.7) * Math.sin(y * 2.3 + a * 5) + 0.12 * Math.sin(a * 29);
      cores.push(t * 1.05, t * 0.92, t * 0.8);
    }
    pg.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3)); pg.computeVertexNormals();
    const paredeR = new THREE.Mesh(pg, pedraM); paredeR.receiveShadow = true; g.add(paredeR);
    // pedras soltas no pé da parede e estalactites no teto (uma peça só para cada, para não pesar)
    const pedraG = new THREE.IcosahedronGeometry(1, 1); { const q = pedraG.attributes.position; for (let i = 0; i < q.count; i++) { const k = 0.75 + Math.abs(Math.sin(q.getX(i) * 4.1 + q.getY(i) * 3.3 + q.getZ(i) * 5.7)) * 0.4; q.setXYZ(i, q.getX(i) * k, q.getY(i) * k, q.getZ(i) * k); } pedraG.computeVertexNormals(); }
    const dm = new THREE.Object3D(), cor = new THREE.Color();
    const pedras = new THREE.InstancedMesh(pedraG, pedraF, 46);
    for (let k = 0; k < 46; k++) {
      const a = k / 46 * TAU + Math.sin(k * 7.3) * 0.06, s = 0.5 + Math.abs(Math.sin(k * 3.7)) * 1.1, r = raioP(a, 0.5) - 0.2;
      dm.position.set(Math.sin(a) * r, s * 0.25, Math.cos(a) * r); dm.scale.set(s * 1.2, s * 0.75, s); dm.rotation.set(k, k * 2.1, k * 0.7); dm.updateMatrix(); pedras.setMatrixAt(k, dm.matrix);
      const t = 0.5 + Math.abs(Math.sin(k * 5.1)) * 0.3; pedras.setColorAt(k, cor.setRGB(t * 1.05, t * 0.92, t * 0.8));
    }
    pedras.castShadow = pedras.receiveShadow = true; g.add(pedras);
    const estal = new THREE.InstancedMesh(new THREE.ConeGeometry(0.35, 1, 6).rotateX(Math.PI), new THREE.MeshLambertMaterial({ color: 0x6a5848, flatShading: true, emissive: 0x1c130c }), 40);
    for (let k = 0; k < 40; k++) {
      const a = k * 2.39996, r = 3 + (k * 0.618 % 1) * (R - 3), h = 0.8 + Math.abs(Math.sin(k * 4.3)) * 1.8;
      dm.position.set(Math.sin(a) * r, 9 - h / 2, Math.cos(a) * r); dm.scale.set(0.7 + (k % 3) * 0.3, h, 0.7 + (k % 3) * 0.3); dm.rotation.set(0, k, 0); dm.updateMatrix(); estal.setMatrixAt(k, dm.matrix);
    }
    g.add(estal);
    // trilhos da carroça (dormentes escuros)
    for (const sx of [-0.7, 0.7]) box(0.12, 0.08, R * 1.6, ferro, sx, 0.05, 0);
    for (let k = -9; k <= 9; k++) box(1.9, 0.08, 0.3, madeira, 0, 0.02, k * 2);
    // escoras: dois esteios encostados na rocha e uma viga por cima, cada uma com um lampião pendurado
    const vidroM = new THREE.MeshBasicMaterial({ color: 0xffb050, toneMapped: false }), lamp = [];
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU + TAU / 16, r = R - 0.6, rot = a + Math.PI / 2;
      for (const d of [-0.16, 0.16]) box(0.4, 6, 0.4, madeira, Math.sin(a + d) * r, 3, Math.cos(a + d) * r, -a);
      box(0.45, 0.45, 2 * r * Math.sin(0.16) + 0.8, madeira, Math.sin(a) * r, 6.1, Math.cos(a) * r, rot);
      const l = new THREE.Group(); l.position.set(Math.sin(a) * (r - 0.5), 5.2, Math.cos(a) * (r - 0.5));
      const fio = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7), ferro); fio.position.y = 0.55; l.add(fio);
      const cx = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.26), new THREE.MeshLambertMaterial({ color: 0x2a2420, wireframe: true })); l.add(cx);
      const vd = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.2), vidroM); l.add(vd);
      const tp = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.14, 4), ferro); tp.position.y = 0.24; tp.rotation.y = Math.PI / 4; l.add(tp);
      g.add(l); lamp.push(l);
    }
    // veios de minério: grupinhos de cristais saindo da rocha (laranja = Minério Rúnico, azul = Pedra de Têmpera)
    // desenhados em pixel art, como os personagens (pedido do Rone: os octaedros de cor pura ficaram "horríveis")
    const cristais = [];
    const PAL = { L: ['#3a2010', '#8a4a1c', '#c07a34', '#e8b468', '#fff0c8'], A: ['#18222c', '#36546a', '#6688a2', '#a6c4d6', '#eef6fa'] };
    function texCristal(tipo, semente) {
      const N = 24, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), [cont, esc, med, cla, bri] = PAL[tipo];
      // 3 lascas de cristal saindo do pé (cada uma: lado de sombra, lado claro e um fio de brilho)
      const lascas = [[12, 3, 3.2, -0.5], [7, 9, 2.6, -2.5], [17, 8, 2.6, 2.2]].map(([px, topo, l, inc], i) => [px + ((semente + i) % 3) - 1, topo + ((semente * 3 + i) % 3), l, inc]);
      for (const [px, topo, l, inc] of lascas) {
        const base = 21, pts = [[px - l + inc * 0.3, base], [px - l + inc, topo + 3], [px + inc, topo], [px + l + inc, topo + 3], [px + l + inc * 0.3, base]];
        x.fillStyle = med; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.fill();
        x.fillStyle = esc; x.beginPath(); x.moveTo(pts[0][0], base); x.lineTo(pts[1][0], pts[1][1]); x.lineTo(pts[2][0], pts[2][1]); x.lineTo(px + inc * 0.3, base); x.fill();
        x.fillStyle = cla; x.fillRect(Math.round(px + inc * 0.6 + 1), topo + 4, 1, Math.max(2, base - topo - 8));
        x.fillStyle = bri; x.fillRect(Math.round(px + inc), topo + 1, 1, 2);
      }
      // pixel duro (sem borda borrada) e contorno escuro de 1 pixel, como nos desenhos do jogo
      const im = x.getImageData(0, 0, N, N), d = im.data, cheio = i => d[i * 4 + 3] > 0;
      for (let i = 0; i < N * N; i++) d[i * 4 + 3] = d[i * 4 + 3] > 110 ? 255 : 0;
      const borda = [], [r, g2, b2] = [1, 3, 5].map(k => parseInt(cont.slice(k, k + 2), 16));
      for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) { const i = yy * N + xx; if (cheio(i)) continue;
        if ((xx > 0 && cheio(i - 1)) || (xx < N - 1 && cheio(i + 1)) || (yy > 0 && cheio(i - N)) || (yy < N - 1 && cheio(i + N))) borda.push(i); }
      for (const i of borda) { d[i * 4] = r; d[i * 4 + 1] = g2; d[i * 4 + 2] = b2; d[i * 4 + 3] = 255; }
      x.putImageData(im, 0, 0);
      const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.encoding = THREE.sRGBEncoding; return t;
    }
    const matCrist = ['L', 'A'].map(tp => [0, 1, 2].map(sm => { const t = texCristal(tp, sm); return new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35, side: THREE.DoubleSide }); }));
    // minério solto (carrinho e monte): pedra com tom de cobre ou de aço, sem brilho de neon
    const matL = new THREE.MeshLambertMaterial({ color: 0xb8783a, flatShading: true, emissive: 0x2a1608 }), matA = new THREE.MeshLambertMaterial({ color: 0x6a8aa8, flatShading: true, emissive: 0x0c1620 });
    for (let v = 0; v < 14; v++) {
      const a = v / 14 * TAU + 0.21 + Math.sin(v * 2.7) * 0.08; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.35) continue;   // não tampa a saída
      const y0 = 0.9 + (v * 0.37 % 1) * 3.4, rw = raioP(a, y0);
      const veio = new THREE.Group(); veio.position.set(Math.sin(a) * (rw - 0.15), y0, Math.cos(a) * (rw - 0.15)); veio.rotation.y = a + Math.PI; g.add(veio);
      const base = new THREE.Mesh(pedraG, pedraF); base.scale.set(0.85, 0.6, 0.4); base.position.z = -0.1; veio.add(base);   // o minério sai de um caroço de rocha (sozinho parecia flutuar)
      const c = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), matCrist[v % 2 ? 1 : 0][v % 3]); c.position.set(0, 0.25, 0.32); veio.add(c);
      cristais.push(veio);
    }
    // carrinho de mina cheio de minério nos trilhos (no lugar do caixote de antes)
    const cz = -R + 6, carro = new THREE.Group(); carro.position.set(0, 0, cz); g.add(carro);
    const caixa = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.78, 0.85, 4, 1, true), new THREE.MeshPhongMaterial({ color: 0x5a3e2a, side: THREE.DoubleSide, flatShading: true }));
    caixa.rotation.y = Math.PI / 4; caixa.scale.set(1, 1, 1.35); caixa.position.y = 0.75; caixa.castShadow = true; carro.add(caixa);
    const fundo = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 1.5), ferro); fundo.position.y = 0.34; carro.add(fundo);
    for (const [x, z] of [[-0.62, -0.5], [0.62, -0.5], [-0.62, 0.5], [0.62, 0.5]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 12).rotateZ(Math.PI / 2), ferro); w.position.set(x, 0.22, z); carro.add(w); }
    for (let k = 0; k < 9; k++) { const o = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + (k % 3) * 0.06), k % 3 ? pedraF : k % 2 ? matA : matL); o.position.set(Math.sin(k * 2.4) * 0.45, 1.05 + (k % 2) * 0.1, Math.cos(k * 2.4) * 0.55); carro.add(o); }
    addOb(M.x, M.z + cz, 1.1);
    // barris, caixotes, monte de minério e a picareta encostada (perto da parede, longe da saída)
    const barril = new THREE.MeshLambertMaterial({ map: photo('madeira.jpg', [1, 2]), color: 0x9a7050 });
    const coisa = (a, fn) => { const r = R - 2.2, x = Math.sin(a) * r, z = Math.cos(a) * r; fn(x, z); addOb(M.x + x, M.z + z, 0.8); };
    coisa(1.2, (x, z) => { for (const [dx, dz] of [[0, 0], [0.75, 0.3]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.95, 12), barril); b.position.set(x + dx, 0.48, z + dz); b.castShadow = true; g.add(b); } });
    coisa(2.3, (x, z) => { box(0.9, 0.8, 0.9, madeira, x, 0.4, z, 0.3); box(0.7, 0.6, 0.7, madeira, x + 0.1, 1.1, z, 0.9); });
    coisa(-1.4, (x, z) => { for (let k = 0; k < 7; k++) { const o = new THREE.Mesh(pedraG, k % 3 ? pedraF : matL); const s = 0.25 + (k % 3) * 0.1; o.scale.setScalar(s); o.position.set(x + Math.sin(k * 2.2) * 0.45, s * 0.7 + (k > 4 ? 0.35 : 0), z + Math.cos(k * 2.2) * 0.45); g.add(o); }
      const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5), madeira); cabo.position.set(x + 0.9, 0.7, z); cabo.rotation.z = 0.35; g.add(cabo);
      const pa = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.1), ferro); pa.position.set(x + 1.15, 1.4, z); pa.rotation.z = 0.35 - 0.15; g.add(pa); });
    coisa(-2.4, (x, z) => { box(0.9, 0.8, 0.9, madeira, x, 0.4, z, -0.4); for (const dx of [-0.3, 0.3]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12), barril); b.position.set(x + dx, 0.4, z + 0.85); g.add(b); } });
    // poeira no ar, bem devagar
    const NP = 160, pos = new Float32Array(NP * 3);
    for (let i = 0; i < NP; i++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * (R - 1); pos[i * 3] = Math.sin(a) * r; pos[i * 3 + 1] = Math.random() * 7; pos[i * 3 + 2] = Math.cos(a) * r; }
    const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const poeira = new THREE.Points(pgeo, new THREE.PointsMaterial({ size: 0.09, map: pontoTex(), color: 0xffd8a0, transparent: true, opacity: 0.45, depthWrite: false })); g.add(poeira);
    // luzes: quentes como os lampiões, e tremem um pouco
    const luzes = [[0, 5, 0, 1.3], [0, 4, R - 6, 1.2], [0, 4, -R + 8, 1.2], [R * 0.55, 4.5, -2, 0.8], [-R * 0.55, 4.5, -2, 0.8]].map(([x, y, z, i], k) => { const l = new THREE.PointLight(k ? 0xffa850 : 0xffc890, i, 30); l.position.set(x, y, z); l.userData.i = i; g.add(l); return l; });
    let t = 0;
    return { update: dt => {
      t += dt;
      luzes.forEach((l, k) => { l.intensity = l.userData.i * (0.9 + Math.sin(t * 7 + k * 2) * 0.05 + Math.sin(t * 13.3 + k) * 0.04); });
      lamp.forEach((l, k) => { l.rotation.z = Math.sin(t * 1.3 + k) * 0.05; });
      vidroM.color.setHSL(0.09, 1, 0.6 + Math.sin(t * 9) * 0.04);
      const q = pgeo.attributes.position; for (let i = 0; i < NP; i++) { let y = q.getY(i) + dt * 0.08; if (y > 7) y = 0; q.setY(i, y); q.setX(i, q.getX(i) + Math.sin(t * 0.5 + i) * dt * 0.05); } q.needsUpdate = true;
    } };
  },
});
