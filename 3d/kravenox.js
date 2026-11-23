// =====================================================================
//  KRAVENOX — chefe mundial semanal
//  Desperta todo sábado às 20h e fica acordado 6 horas, até as 2h de domingo (horário do aparelho).
//  Se ninguém derrubar até lá, ele volta a dormir e só acorda no sábado seguinte.
//  Para testar a qualquer hora: abra o jogo com #kravenox no fim do link.
// =====================================================================
'use strict';

// ---------------------------------------------------------------- visual
function kravenoxModel(r, mt) {
  // Criatura de espinhos do desenho original: corpo negro, cabeça redonda com coroa de
  // espinhos, olhos vermelhos, sorriso de dentes pontudos, barriga em placas e garras.
  const S = 4;                                                    // gigante: ~15 m (com 6 a câmera de perto só pegava os pés)
  const g = r.g, b = new THREE.Group(); b.scale.setScalar(S); g.add(b); r.b = b;
  const glowM = (c, i = 1.4) => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: i });
  // cores um pouco mais claras e um brilho próprio arroxeado: antes era quase preto e virava só uma sombra na arena escura
  const black = mt(0x2a2232), black2 = mt(0x382c42), plate = mt(0x4a3c52), claw = mt(0x6a5a74), tooth = mt(0xf0eae0), mouthM = mt(0x6a0a10);
  [[black, 0x120814], [black2, 0x1a0a1c], [plate, 0x24101e], [mouthM, 0x5a0008]].forEach(([m, e]) => { m.userData.em = e; m.emissive.setHex(e); });
  const luz = new THREE.PointLight(0xff3040, 2.2, 40, 1.6); luz.position.set(0, 2.2 * S, 3.5 * S); g.add(luz); r.luz = luz;   // luz vermelha na frente dele
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xff0a0a, toneMapped: false }), auraM = new THREE.MeshBasicMaterial({ color: 0xff1a1a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
  r.eyeM = eyeM;
  const add = (geo, m, x, y, z, p = b) => mesh(geo, m, x, y, z, p);
  // pernas curtas e grossas com 3 garras
  r.legs = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.42, 0.75, 0); b.add(p);
    add(new THREE.CapsuleGeometry(0.3, 0.45, 6, 12), black, 0, -0.35, 0, p);
    const foot = add(new THREE.SphereGeometry(0.34, 14, 10), black2, 0, -0.68, 0.12, p); foot.scale.set(1, 0.5, 1.35);
    for (let k = -1; k <= 1; k++) { const c = add(new THREE.ConeGeometry(0.07, 0.24, 6), claw, k * 0.15, -0.72, 0.52, p); c.rotation.x = Math.PI / 2; }
    return p;
  });
  // corpo e barriga em placas
  const torso = add(new THREE.SphereGeometry(0.85, 24, 18), black, 0, 1.45, 0); torso.scale.set(1, 1.05, 0.85);
  for (let row = 0; row < 3; row++) for (const col of [-1, 1]) {
    const pl = add(new THREE.BoxGeometry(0.42, 0.26, 0.12), plate, col * 0.23, 1.72 - row * 0.3, 0.66 - Math.abs(row - 1) * 0.04);
    pl.rotation.x = (row - 1) * 0.25;
  }
  // braços com garras
  r.arms = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.78, 1.85, 0.05); p.rotation.z = s * 0.35; b.add(p);
    add(new THREE.CapsuleGeometry(0.22, 0.6, 6, 12), black, 0, -0.42, 0, p);
    add(new THREE.SphereGeometry(0.26, 12, 10), black2, 0, -0.85, 0.05, p);
    for (let k = -1; k <= 1; k++) { const c = add(new THREE.ConeGeometry(0.06, 0.3, 6), claw, k * 0.11, -1.08, 0.12, p); c.rotation.x = Math.PI - 0.4; }
    for (let k = 0; k < 3; k++) { const sp = add(new THREE.ConeGeometry(0.07, 0.28, 6), black2, s * 0.2, -0.15 - k * 0.22, -0.08, p); sp.rotation.z = -s * 1.3; }
    return p;
  });
  // espinhos das costas e cauda
  for (let k = 0; k < 6; k++) { const sp = add(new THREE.ConeGeometry(0.13 - k * 0.01, 0.55 - k * 0.04, 6), black2, 0, 2.05 - k * 0.22, -0.55 - k * 0.12); sp.rotation.x = -0.9 - k * 0.1; }
  r.tail = [];
  for (let k = 0; k < 6; k++) {
    const t = add(new THREE.SphereGeometry(0.3 - k * 0.04, 12, 10), black, 0, 0.75 - k * 0.07, -0.85 - k * 0.32); r.tail.push(t);
    const sp = add(new THREE.ConeGeometry(0.07, 0.25, 6), black2, 0, 0.3 - k * 0.03, 0, t); sp.rotation.x = -0.4;
  }
  // cabeça redonda e grande com coroa de espinhos
  const head = new THREE.Group(); head.position.set(0, 2.75, 0.05); b.add(head); r.head = head;
  const hs = add(new THREE.SphereGeometry(0.95, 28, 22), black, 0, 0, 0, head); hs.scale.set(1.08, 0.95, 0.95);
  for (let k = 0; k < 13; k++) {                                    // coroa: raios em volta do rosto
    const a = -Math.PI * 0.1 + k / 12 * Math.PI * 1.2;
    const sp = add(new THREE.ConeGeometry(0.15, 0.6, 6), black2, Math.cos(a) * 0.98, Math.sin(a) * 0.9 + 0.05, -0.2, head);
    sp.rotation.z = a - Math.PI / 2;
  }
  for (let k = 0; k < 5; k++) { const sp = add(new THREE.ConeGeometry(0.14, 0.55, 6), black2, 0, 0.75 - k * 0.12, -0.45 - k * 0.12, head); sp.rotation.x = -0.6 - k * 0.2; }
  // olhos vermelhos bravos (inclinados) e sobrancelhas
  [-1, 1].forEach(s => {
    const e = add(new THREE.SphereGeometry(0.2, 16, 12), eyeM, s * 0.36, 0.12, 0.8, head); e.scale.set(1.25, 0.7, 0.45); e.rotation.z = s * 0.35;
    const br = add(new THREE.BoxGeometry(0.45, 0.1, 0.18), black2, s * 0.36, 0.33, 0.8, head); br.rotation.z = s * 0.45;
  });
  // sorriso largo de dentes pontudos
  const mouth = new THREE.Group(); mouth.position.set(0, -0.32, 0.78); head.add(mouth); r.mouth = mouth;
  const m1 = add(new THREE.BoxGeometry(1.1, 0.22, 0.12), mouthM, 0, 0, 0, mouth);
  for (let k = 0; k < 9; k++) {
    const x = -0.48 + k * 0.12, curve = -Math.abs(x) * 0.12;
    const t1 = add(new THREE.ConeGeometry(0.045, 0.13, 4), tooth, x, 0.08 + curve, 0.06, mouth); t1.rotation.x = Math.PI;
    const t2 = add(new THREE.ConeGeometry(0.045, 0.12, 4), tooth, x + 0.06, -0.08 + curve, 0.06, mouth);
  }
  m1.scale.y = 1;
  // aura do Modo Fúria
  r.aura = [];
  for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, f = add(new THREE.ConeGeometry(0.45, 2.6 + (k % 3) * 0.6, 8, 1, true), auraM, Math.cos(a) * 1.25, 1.6 + (k % 2) * 0.6, Math.sin(a) * 1.1); r.aura.push(f); }
  r.auraM = auraM;
  r.anim = (m, t) => {
    const enr = m.enraged ? 1.5 : 1, sleep = !!m.sleeping;
    const breath = Math.sin(t * (sleep ? 0.8 : 2) * enr);
    torso.scale.set(1 + breath * 0.02, 1.05 + breath * 0.02, 0.85);
    head.position.y = 2.75 + breath * 0.03 - (sleep ? 0.35 : 0);
    head.rotation.x = sleep ? 0.45 : -(m.roar || 0) * 0.35 - (m.beam || 0) * 0.15;
    mouth.scale.y = 1 + (m.roar || 0) * 2.2 + (m.beam || 0) * 1.5;
    eyeM.color.setRGB(sleep ? 0.08 : 1, sleep ? 0 : (m.beam || 0) * 0.4, sleep ? 0 : (m.beam || 0) * 0.2);
    const sw = m.swing || 0;
    r.arms[0].rotation.x = sleep ? 0.6 : -sw * 2.2 + Math.sin(t * 1.5) * 0.08;
    r.arms[1].rotation.x = sleep ? 0.6 : (m.pound > 0 ? -2.6 * Math.sin(m.pound * Math.PI) : Math.sin(t * 1.5 + 1) * 0.08);
    r.legs.forEach((l, i) => l.rotation.x = m.moving ? Math.sin(t * 4 + i * Math.PI) * 0.45 : 0);
    r.tail.forEach((s, i) => s.position.x = Math.sin(t * 1.6 + i * 0.6) * (0.05 + i * 0.05));
    b.position.y = (m.pound > 0 ? Math.sin(m.pound * Math.PI) * 9 : 0) - (sleep ? 2.4 : 0);
    b.rotation.x = sleep ? 0.25 : 0;
    auraM.opacity = m.enraged ? 0.45 + Math.sin(t * 9) * 0.15 : 0;
    r.aura.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 8 + i) * 0.3; });
  };
  r.h = 3.9 * S;
  return r;
}

// ---------------------------------------------------------------- evento semanal
const Kvx = (() => {
  const DAY = 6, START = 20, HORAS = 6;            // sábado 20h → domingo 2h (passa da meia-noite)
  const ALLY_NAMES = ['Bruna Ferro', 'Tião do Arco', 'Zéfiro', 'Nanda Lumen', 'Grum Pedrabarba', 'Selvyn', 'Morgana Cinza', 'Duda Faísca', 'Otávio Brasa', 'Lia Sereno'];
  const AR = () => FLOORS[TOP];                                   // topo da Torre do Cisma
  const naArena = () => inTower(P.z) && Tower.floor === TOP && Math.hypot(P.x - AR().x, P.z - AR().z) < 40;   // golpes, sons e avisos só valem para quem está lá em cima
  let boss = null, allies = [], teles = [], active = false, forced = false, checkT = 0, phaseT = 0, lastMsg = '';
  const forcedByLink = () => /kravenox/i.test(location.hash);

  // id da semana = data do sábado daquela semana
  function weekId(d = new Date()) {
    const s = new Date(d); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() + ((DAY - s.getDay() + 7) % 7) - (d.getDay() === DAY ? 0 : 7));
    return `${s.getFullYear()}-${s.getMonth() + 1}-${s.getDate()}`;
  }
  // último sábado às 20h que já passou (pode ser ontem, se agora for madrugada de domingo)
  function ultimoInicio(d = new Date()) { const s = new Date(d); s.setHours(START, 0, 0, 0); s.setDate(s.getDate() - ((s.getDay() - DAY + 7) % 7)); if (s > d) s.setDate(s.getDate() - 7); return s; }
  function windowNow(d = new Date()) { return d - ultimoInicio(d) < HORAS * 3600e3; }
  function nextStart(d = new Date()) { const s = ultimoInicio(d); s.setDate(s.getDate() + 7); return s; }
  function endTime(d = new Date()) { return new Date(ultimoInicio(d).getTime() + HORAS * 3600e3); }
  const fmt = ms => { const s = Math.max(0, Math.floor(ms / 1000)), dd = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return dd ? `${dd}d ${h}h ${m}min` : h ? `${h}h ${m}min` : `${m}min ${ss}s`; };
  // horário oficial e quem já derrubou nesta semana: vêm do servidor (todo mundo vê igual)
  let srv = null, srvT = 0, mortoPor = '';
  async function sincronizar() {
    if (typeof Nuvem === 'undefined' || !Nuvem.logado) return;
    try { const r = await Nuvem.api('GET', '/conta/kvx'); r.dif = r.agora - Date.now(); srv = r; } catch (e) { }
  }
  const agoraSrv = () => srv ? Date.now() + srv.dif : Date.now();
  const semanaAtual = () => forced ? 'teste' : srv ? srv.semana : weekId();
  const acordadoAgora = () => srv ? agoraSrv() >= srv.inicio && agoraSrv() < srv.fim : windowNow();
  const fimAgora = () => srv ? srv.fim - srv.dif : endTime().getTime();
  const proximoAgora = () => srv ? (agoraSrv() < srv.inicio ? srv.inicio : srv.proximo) - srv.dif : nextStart().getTime();
  const mortoNoServidor = () => !forced && srv && srv.morto;
  const killedThisWeek = () => P.kvxWeek === semanaAtual() || !!mortoNoServidor();
  const MIN_DANO = 15000;                                       // só ganha o prêmio quem lutou de verdade
  // ---------------- Escudo do Cisma: o Kravenox foi feito para MUITA gente junta.
  // Quanto menos jogadores na arena, menos dano ele sente (sozinho, só 5%). Com 8 ou mais, o escudo cai.
  const ESCUDO = [0.05, 0.05, 0.14, 0.27, 0.42, 0.58, 0.74, 0.88, 1];
  let naArenaN = 1, arenaT = 0;
  function contarArena() { const A = AR(); naArenaN = 1 + (typeof Net !== 'undefined' && Net.perto ? Net.perto(A.x, A.z, 42) : 0); }
  function escudo() { return ESCUDO[Math.min(ESCUDO.length - 1, naArenaN)]; }

  function init() {
    forced = forcedByLink();
    addEventListener('hashchange', () => { forced = forcedByLink(); checkT = 0; });
    const el = document.createElement('div'); el.id = 'kvx'; el.className = 'win'; $('hud').appendChild(el);
    const bar = document.createElement('div'); bar.id = 'kvxbar'; bar.className = 'hidden';
    bar.innerHTML = '<div class="kn">☠ KRAVENOX <small>Nv 90 · Chefe Mundial</small></div><div class="kt"><b></b><em></em></div><div class="kesc"></div>'; $('hud').appendChild(bar);
    if (P.title) $('pname').innerHTML = `${P.name}<small>« ${P.title} »</small>`;
    checkT = 0;
  }

  function wake() {
    if (boss) return;
    boss = spawnMob('kravenox', null, { x: AR().x, z: AR().z - 6 });
    boss.sx = AR().x; boss.sz = AR().z - 6; boss.face = 0; boss.state = 'idle'; boss.specT = 5; boss.addT = 20; boss.meleeT = 2;
    active = true;
    const jaEstava = srv && agoraSrv() - srv.inicio > 90e3;               // quem entra depois das 20h: aviso grande de que ele ESTÁ acordado
    banner(jaEstava ? '☠ KRAVENOX ESTÁ ACORDADO ☠' : '☠ KRAVENOX DESPERTOU ☠');
    if (!naArena()) typeof Anuncio !== 'undefined' && Anuncio.mostrar({ ic: '☠️', cor: 'sangue', tag: 'CHEFE DO MUNDO', titulo: jaEstava ? 'O Kravenox está acordado!' : 'O Kravenox despertou!', sub: 'No topo da Torre do Cisma. Todos os aventureiros estão subindo!', som: 'boom', seg: 9 });
    Audio8.sfx('boom'); setTimeout(() => Audio8.sfx('boom'), 300);
    if (naArena()) { tremer(2.2); flashTela('rgba(200,0,0,.6)', 2); for (let i = 0; i < 8; i++) setTimeout(() => { if (boss) { ring(boss.x, boss.z, 4 + i * 4, i % 2 ? 0xff2a2a : 0x6a0a20, 0.9); burst(new THREE.Vector3(boss.x, groundY(boss.x, boss.z) + 4, boss.z), 0xff2020, 20, 8, 1); } }, i * 160); }
    log('☠ <b style="color:#ff6060">KRAVENOX DESPERTOU</b> no topo da Torre do Cisma! Todos os aventureiros estão subindo!', 'bad');
    log('📍 Ele está no <b>topo da Torre do Cisma</b>, na Cidadela do Cisma (extremo leste). Suba os 30 andares!', 'gold');
    // sem bots: o jogo é todo on-line e quem luta são os jogadores de verdade
    // (os 6 aventureiros de antes batiam nele no aparelho de cada um e o dano contava como se fosse do jogador)
  }
  function limparServos() { for (const o of mobs.filter(o => o.servoKvx)) { o.dead = true; scene.remove(o.model.g); o.lab.remove(); } mobs = mobs.filter(o => !o.servoKvx); }
  function sleep(msg) {
    limparServos();
    if (boss && !boss.dead) { mobs = mobs.filter(o => o !== boss); scene.remove(boss.model.g); boss.lab.remove(); }
    boss = null; active = false;
    allies.forEach(a => scene.remove(a.g)); allies = [];
    teles.forEach(t => { scene.remove(t.fill); scene.remove(t.edge); }); teles = [];
    if (msg) log(msg, 'sys');
  }

  // ---------------- aliados
  function spawnAllies() {
    const races = Object.keys(RACES);
    const names = ALLY_NAMES.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < 6; i++) {
      const hero = HEROES[irand(0, HEROES.length - 1)];
      const look = { race: 'humano', cls: hero, gender: CLASSES[hero].gender, hair: 0, skin: 0 };
      const g = new THREE.Group(); scene.add(g);
      const L2 = buildAvatar(g, look);
      if (L2.ribbon) L2.ribbon = false;
      const a = AR(), ang = rand(0, TAU), rr0 = rand(20, 27);
      const al = { g, L: L2, look, name: names[i], x: a.x + Math.cos(ang) * rr0, z: a.z + Math.sin(ang) * rr0, hp: 600, maxHp: 600, cd: rand(0, 1.5), down: 0, face: 0, atk: 0, moving: false, slot: ang };
      if (blocked(al.x, al.z)) { al.x = AR().x + 6; al.z = AR().z + 22; }
      const lab = document.createElement('div'); lab.className = 'alabel'; lab.innerHTML = `${al.name}<small>${className(look.cls, look.gender)}</small><i><b></b></i>`;
      $('labels').appendChild(lab); al.lab = lab;
      allies.push(al);
    }
    log('⚔️ Aventureiros chegaram para a batalha: ' + allies.map(a => `<b>${a.name}</b>`).join(', ') + '.', 'item');
  }
  function updateAllies(dt) {
    for (const al of allies) {
      const C = CLASSES[al.look.cls];
      al.cd -= dt; al.atk = Math.max(0, al.atk - dt * 3);
      if (al.down > 0) {
        al.down -= dt;
        if (al.L.sprite) { al.g.position.set(al.x, groundY(al.x, al.z), al.z); al.L.sprite.update(dt, { dead: true, face: al.face }); } else if (al.L.model) { al.L.inst.play('Death', { once: true }); al.L.inst.update(dt); } else { al.g.rotation.z = Math.PI / 2; al.g.position.y = groundY(al.x, al.z) + 0.3; }
        if (al.down <= 0) { al.hp = al.maxHp * 0.6; al.g.rotation.z = 0; floater(al.x, groundY(al.x, al.z) + 2.2, al.z, 'De pé!', 'heal'); }
        continue;
      }
      al.moving = false;
      if (boss && !boss.dead) {
        const want = Math.min(C.range, 9) + (C.ranged ? 0 : 3.2);
        const tx = boss.x + Math.cos(al.slot) * want, tz = boss.z + Math.sin(al.slot) * want;
        const d = Math.hypot(tx - al.x, tz - al.z);
        if (d > 0.6) {
          const sp = 6 * dt, nx = al.x + (tx - al.x) / d * Math.min(sp, d), nz = al.z + (tz - al.z) / d * Math.min(sp, d);
          if (!blocked(nx, al.z)) al.x = nx; if (!blocked(al.x, nz)) al.z = nz;
          al.moving = true;
        }
        al.face = Math.atan2(boss.x - al.x, boss.z - al.z);
        const db = Math.hypot(boss.x - al.x, boss.z - al.z);
        if (al.cd <= 0 && db < want + 3) {
          al.cd = rand(1.0, 1.5); al.atk = 1;
          const dmg = 45 + P.lv * 3, crit = Math.random() < 0.1;
          if (C.ranged) {
            const from = new THREE.Vector3(); (al.L.orb || al.L.handR).getWorldPosition(from);
            shoot(from, boss, C.proj, false, m => dmgMob(m, dmg, crit, C.magic, C.proj));
          } else { dmgMob(boss, dmg, crit, false, C.colors.accent); }
          if (['sacerdote', 'lyra', 'thornox', 'erya'].includes(al.look.cls) && Math.random() < 0.3) { healP(stats.maxHp() * 0.08); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xcfe8ff, 10, 2, 0.6); }
        }
      }
      if (al.L.sprite) {
        al.g.position.set(al.x, groundY(al.x, al.z), al.z); al.g.rotation.y = al.face;
        al.L.sprite.update(dt, { face: al.face, moving: al.moving, atk: al.atk, dead: al.down > 0 });
        continue;
      }
      if (al.L.model) {
        const st = al.atk > 0.9 ? (C.ranged ? 'Gun_Shoot' : 'Sword_Slash') : al.atk > 0 ? al.L.inst.curName : al.moving ? 'Run' : (C.ranged ? 'Idle' : 'Idle_Sword');
        al.L.inst.play(st, { once: al.atk > 0, restart: al.atk > 0.97, speed: 1.4 }); al.L.inst.update(dt); updateFollow(al.L);
        al.g.position.set(al.x, groundY(al.x, al.z), al.z); al.g.rotation.y = al.face;
        continue;
      }
      // animação simples
      const t = time, sw = al.moving ? Math.sin(t * 12) : 0;
      al.L.legL.rotation.x = sw * 0.8; al.L.legR.rotation.x = -sw * 0.8;
      al.L.armR.rotation.set(al.atk > 0 ? -2.4 + (1 - al.atk) * 2.4 : -sw * 0.7, 0, 0.15);
      al.L.armL.rotation.set(sw * 0.7, 0, -0.15);
      al.g.position.set(al.x, groundY(al.x, al.z), al.z); al.g.rotation.y = al.face;
    }
  }
  function hurtAlly(al, amount) {
    if (al.down > 0) return;
    al.hp -= amount; floater(al.x, groundY(al.x, al.z) + 2.2, al.z, Math.round(amount), 'hurt');
    if (al.hp <= 0) { al.down = 10; log(`${al.name} caiu! Vai levantar em 10s.`, 'bad'); }
  }

  // ---------------- ataques telegrafados
  const circGeo = new THREE.CircleGeometry(1, 40); circGeo.rotateX(-Math.PI / 2);
  const edgeGeo = new THREE.RingGeometry(0.95, 1, 48); edgeGeo.rotateX(-Math.PI / 2);
  function telegraph(x, z, r, delay, mult, color = 0xff2020) {
    const fill = new THREE.Mesh(circGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1, depthWrite: false }));
    const edge = new THREE.Mesh(edgeGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
    const y = groundY(x, z) + 0.12;
    fill.position.set(x, y, z); edge.position.set(x, y + 0.01, z); edge.scale.set(r, 1, r); fill.scale.set(0.01, 1, 0.01);
    scene.add(fill, edge);
    teles.push({ x, z, r, t: delay, max: delay, mult, fill, edge });
  }
  // faixa (Raio da Essência)
  function teleLine(x0, z0, a, len, w, delay, mult) {
    const geo = new THREE.PlaneGeometry(w, len); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, len / 2);
    const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.15, depthWrite: false }));
    fill.position.set(x0, groundY(x0, z0) + 0.15, z0); fill.rotation.y = a; scene.add(fill);
    const edge = new THREE.Object3D();
    teles.push({ line: true, x: x0, z: z0, a, len, w, t: delay, max: delay, mult, fill, edge });
  }
  function inLine(tl, x, z) { const dx = x - tl.x, dz = z - tl.z, lz = dx * Math.sin(tl.a) + dz * Math.cos(tl.a), lx = dx * Math.cos(tl.a) - dz * Math.sin(tl.a); return lz > 0 && lz < tl.len && Math.abs(lx) < tl.w / 2; }
  function beamFx(tl) {
    if (typeof SpriteKit !== 'undefined' && SpriteKit.ready) {
      const y = groundY(tl.x, tl.z), from = new THREE.Vector3(tl.x + Math.sin(tl.a) * 2, y + 12, tl.z + Math.cos(tl.a) * 2);
      const to = new THREE.Vector3(tl.x + Math.sin(tl.a) * tl.len, y + 1, tl.z + Math.cos(tl.a) * tl.len);
      SpriteKit.fx('fx_raio', { from, to, h: 5, life: 0.7 });
      SpriteKit.fx('fx_explosao', { x: to.x, y: to.y + 1, z: to.z, h: 6, life: 0.6, grow: 1.5 });
      return;
    }
    const geo = new THREE.CylinderGeometry(1.2, 1.2, tl.len, 12, 1, true); geo.rotateX(Math.PI / 2); geo.translate(0, 0, tl.len / 2);
    const b = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    b.position.set(tl.x, groundY(tl.x, tl.z) + 9, tl.z); b.rotation.y = tl.a; scene.add(b);
    fx.push({ m: b, life: 0.6, max: 0.6, kind: 'note', v: new THREE.Vector3(0, 0, 0) });
    for (let k = 0; k < 10; k++) burst(new THREE.Vector3(tl.x + Math.sin(tl.a) * k * tl.len / 10, groundY(tl.x, tl.z) + 1, tl.z + Math.cos(tl.a) * k * tl.len / 10), 0xff3030, 4, 3, 0.6);
  }
  function spikeRing(x, z, r) {
    if (typeof SpriteKit !== 'undefined' && SpriteKit.ready) {
      const n = Math.max(6, Math.round(r * 1.4));
      for (let k = 0; k < n; k++) { const a = k / n * TAU, rr = r * (0.25 + Math.random() * 0.75), px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr;
        SpriteKit.fx(k % 2 ? 'fx_espinhos' : 'fx_espinhos2', { x: px, y: groundY(px, pz), z: pz, h: 3 + Math.random() * 3, bottom: true, life: 1.1 }); }
      return;
    }
    const n = Math.max(5, Math.round(r * 1.6)), y = groundY(x, z);
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU, rr = r * (0.3 + Math.random() * 0.7);
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.5 + Math.random() * 0.5, 3 + Math.random() * 4, 6), new THREE.MeshLambertMaterial({ color: 0x1a0a10, emissive: 0xc01010, emissiveIntensity: 0.8, transparent: true }));
      sp.position.set(x + Math.cos(a) * rr, y + 1.5, z + Math.sin(a) * rr); scene.add(sp);
      fx.push({ m: sp, life: 1.2, max: 1.2, kind: 'note', v: new THREE.Vector3(0, -0.4, 0) });
    }
    burst(new THREE.Vector3(x, y + 1, z), 0xff2a2a, 30, r, 0.8);
  }
  function clawFx(m) {
    if (typeof SpriteKit !== 'undefined' && SpriteKit.ready) { const fx_ = Math.sin(m.face), fz = Math.cos(m.face); SpriteKit.fx(Math.random() < 0.5 ? 'fx_garra1' : 'fx_garra2', { x: m.x + fx_ * 9, y: groundY(m.x, m.z) + 5, z: m.z + fz * 9, h: 12, life: 0.4, flip: Math.random() < 0.5 }); return; }
    const geo = new THREE.RingGeometry(5, 11, 32, 1, -Math.PI * 0.4, Math.PI * 0.8); geo.rotateX(-Math.PI / 2);
    const c = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    c.position.set(m.x, groundY(m.x, m.z) + 3, m.z); c.rotation.y = m.face - Math.PI / 2; scene.add(c);
    fx.push({ m: c, life: 0.35, max: 0.35, kind: 'note', v: new THREE.Vector3(0, 0, 0) });
  }
  function updateTeles(dt) {
    for (const tl of teles) {
      tl.t -= dt; const k = 1 - tl.t / tl.max;
      if (tl.line) tl.fill.material.opacity = 0.15 + k * 0.45; else { tl.fill.scale.set(tl.r * k, 1, tl.r * k); tl.fill.material.opacity = 0.15 + k * 0.35; }
      if (tl.t <= 0) {
        tl.done = true; scene.remove(tl.fill); scene.remove(tl.edge);
        if (naArena()) Audio8.sfx('boom'); if (!tl.line) ring(tl.x, tl.z, tl.r, 0xff5030, 0.5);
        burst(new THREE.Vector3(tl.x, groundY(tl.x, tl.z) + 0.5, tl.z), 0xff4020, 26, tl.r * 1.5, 0.8);
        const hit = (x, z) => tl.line ? inLine(tl, x, z) : Math.hypot(x - tl.x, z - tl.z) < tl.r;
        if (tl.line) beamFx(tl);
        if (boss && tl.mult > 0 && naArena() && hit(P.x, P.z)) hurtPlayer(boss, tl.mult);
        allies.forEach(al => { if (hit(al.x, al.z)) hurtAlly(al, 70 * tl.mult); });
      }
    }
    teles = teles.filter(t => !t.done);
  }

  // ---------------- IA do chefe: 4 fases, o maior espetáculo da semana
  // Fase 1 (100–70%): garra, Raio da Essência, Esmagamento, espinhos.
  // Fase 2 (70%): O Despertar do Abismo — chama 2 Generais do Cisma e servos; Chuva de Meteoros.
  // Fase 3 (40%): Fúria do Soberano — mais rápido, raio triplo, Eclipse (só a luz salva) e Correntes do Cisma.
  // Fase 4 (15%): Último Suspiro — chama os Ecos do Soberano e a chuva não para.
  const SERVOS = ['guardaOssos', 'sombraVale', 'sentinelaSubmersa', 'ecoCidade', 'larvaAbismo', 'damaSemOlhos'];
  const FASES = [null, null, { f: 0.7, nome: 'O DESPERTAR DO ABISMO', txt: '🌋 <b>Fase 2 — O Despertar do Abismo!</b> Kravenox rasga o chão e chama os <b>Generais do Cisma</b>. Cuidado com a <b>Chuva de Meteoros</b>!' },
    { f: 0.4, nome: 'A FÚRIA DO SOBERANO', txt: '🔥 <b>Fase 3 — A Fúria do Soberano!</b> Ele ficou mais rápido. Quando vier o <b>Eclipse</b>, corra para dentro de um círculo de luz dourada!' },
    { f: 0.15, nome: 'O ÚLTIMO SUSPIRO', txt: '☠ <b>Fase 4 — O Último Suspiro!</b> Os <b>Ecos do Soberano</b> se levantam. Falta pouco: TODOS JUNTOS!' }];
  function tremer(k) { if (naArena() && typeof TREMOR !== 'undefined') TREMOR = Math.max(TREMOR, k); }
  // servos, generais e ecos: monstros fortes do fim do jogo, presos no topo da Torre
  function invocarKvx(tipo, n, lv, chefe, nome) {
    const vivos = mobs.filter(o => o.servoKvx && !o.dead).length; n = Math.min(n, Math.max(chefe ? 1 : 0, 14 - vivos));   // no máximo 14 servos juntos (celular)
    const a0 = rand(0, TAU), A = AR();
    for (let i = 0; i < n; i++) {
      const a = a0 + i / n * TAU, r = chefe ? 14 : rand(8, 20); let x = A.x + Math.sin(a) * r, z = A.z + Math.cos(a) * r; if (blocked(x, z)) { x = A.x; z = A.z + 4; }
      const t = tipo || SERVOS[irand(0, SERVOS.length - 1)], c = spawnMob(t, null, { x, z }), d0 = c.d, kf = lv / d0.lv;
      c.d = { ...d0, lv, hp: chefe ? (nome === 'Eco do Soberano' ? 250000 : 350000) : Math.round(d0.hp * Math.pow(kf, 1.5) * 4), atk: Math.round(d0.atk * kf * (chefe ? 2.2 : 1.6)), perfura: 0.5, def: Math.round(d0.def * kf), xp: Math.round(d0.xp * kf * (chefe ? 3 : 0.6)), aggro: 40, respawn: 1e9,
        drops: chefe ? [['essencia', 1], ['red', 1], ['blue', 1], ['minerio', 1], ['tempera', 1], ['selo_forja', 0.25], ['frag_cisma', 1], ['frag_cisma', 1], ['nucleo_abismo', 1], ['lagrima_soberano', 0.2]] : [['red', 0.2], ['frag_cisma', 0.15]] };
      if (chefe) { c.d.name = nome; c.d.mini = true; c.model.g.scale.multiplyScalar(1.5); }
      c.hp = c.maxHp = c.d.hp; c.state = 'chase'; c.noRespawn = true; c.towerFloor = TOP; c.servoKvx = true; c.sx = A.x; c.sz = A.z;
      const sp = c.lab.querySelector('span'); if (sp) sp.innerHTML = `${c.d.name} <small>Nv ${lv}</small>`;
      if (naArena()) { burst(new THREE.Vector3(x, groundY(x, z) + 1, z), 0xb01020, 24, 4, 0.8); ring(x, z, 3, 0xff2a2a, 0.6); }
    }
  }
  // meteoro: uma rocha em brasa cai do céu, com brilho e rastro de fogo, sobre o círculo laranja.
  // (antes era uma bola laranja lisa: perto da câmera virava um disco chapado cobrindo a tela)
  const metGeo = new THREE.IcosahedronGeometry(0.85, 1);
  const metMat = new THREE.MeshLambertMaterial({ color: 0x2a1a14, emissive: 0xff4a10, emissiveIntensity: 0.28, flatShading: true });   // pedra escura com brasa (antes brilhava tanto que virava um hexágono laranja chapado)
  const caudaGeo = new THREE.ConeGeometry(0.75, 7, 10, 1, true); caudaGeo.translate(0, 3.5, 0);
  const caudaMat = new THREE.MeshBasicMaterial({ color: 0xff7a20, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const brilhoMat = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(0.35, 'rgba(255,140,40,.8)'); gr.addColorStop(1, 'rgba(255,60,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); return new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  })();
  function meteoro(x, z, delay) {
    telegraph(x, z, 4.2, delay, 1.6, 0xff6a10);
    if (!naArena()) return;
    const g = new THREE.Group(), rocha = new THREE.Mesh(metGeo, metMat), brilho = new THREE.Sprite(brilhoMat), cauda = new THREE.Mesh(caudaGeo, caudaMat), y0 = groundY(x, z);
    brilho.scale.setScalar(2.4); g.add(cauda, brilho, rocha); scene.add(g);
    const dx = rand(-5, 5), dz = rand(-5, 5);                            // cai quase de pé, de um lado qualquer (não passa na frente da câmera)
    cauda.rotation.set(Math.atan2(dz, 45), 0, -Math.atan2(dx, 45));          // a cauda de fogo aponta para trás do caminho
    const t0 = time; let rastro = 0;
    const cai = () => {
      const k = Math.min(1, (time - t0) / delay);
      g.position.set(x + dx * (1 - k), y0 + 45 * (1 - k * k) + 0.6, z + dz * (1 - k));
      rocha.rotation.x += 0.15; rocha.rotation.y += 0.11;
      g.visible = g.position.distanceTo(camera.position) > 7;          // perto demais da câmera: some (nada de disco na tela)
      if (k < 1 && boss) {
        if ((rastro = (rastro + 1) % 2) === 0) burst(g.position.clone(), rastro ? 0xffb040 : 0xff5a10, 2, 0.8, 0.35);
        requestAnimationFrame(cai);
      } else {
        scene.remove(g);
        if (boss) { if (typeof SpriteKit !== 'undefined' && SpriteKit.ready) SpriteKit.fx('fx_explosao', { x, y: y0 + 1, z, h: 7, life: 0.6, grow: 1.6 }); ring(x, z, 4.2, 0xff7a20, 0.5); burst(new THREE.Vector3(x, y0 + 0.6, z), 0x2a1a14, 10, 3, 0.7); }
        tremer(0.25);
      }
    };
    requestAnimationFrame(cai);
  }
  // Eclipse: o topo escurece; só quem está dentro de um dos círculos de luz não leva o golpe
  function eclipse(m) {
    const A = AR(), seguros = [0, 1, 2].map(k => { const a = rand(0, TAU) + k * TAU / 3, r = rand(8, 22); return { x: A.x + Math.sin(a) * r, z: A.z + Math.cos(a) * r, r: 4.5 }; });
    for (const sg of seguros) telegraph(sg.x, sg.z, sg.r, 3.2, 0, 0xffd860);
    if (naArena()) { log('🌑 <b>ECLIPSE!</b> Corra para um <b>círculo de luz dourada</b>!', 'bad'); banner('🌑 ECLIPSE 🌑'); flashTela('rgba(10,0,20,.55)', 3.4); }
    setTimeout(() => {
      if (!boss) return;
      if (naArena()) { Audio8.sfx('boom'); tremer(0.8); flashTela('rgba(255,40,40,.45)', 0.5); if (!seguros.some(sg => Math.hypot(P.x - sg.x, P.z - sg.z) < sg.r)) hurtPlayer(m, 2.6); }
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; spikeRing(A.x + Math.sin(a) * 18, A.z + Math.cos(a) * 18, 4); }
    }, 3200);
  }
  // Correntes do Cisma: puxa quem está perto para junto dele e explode em seguida
  function correntes(m) {
    if (naArena() && !P.dead && Math.hypot(P.x - m.x, P.z - m.z) < 30) {
      log('⛓️ <b>Correntes do Cisma!</b> Ele te puxou: use a esquiva e saia do círculo!', 'bad');
      const x0 = P.x, z0 = P.z, t0 = time, alvo = { x: m.x + Math.sin(m.face) * 6, z: m.z + Math.cos(m.face) * 6 };
      const puxa = () => { const k = Math.min(1, (time - t0) / 0.6), nx = x0 + (alvo.x - x0) * k, nz = z0 + (alvo.z - z0) * k; if (!blocked(nx, nz)) { P.x = nx; P.z = nz; } if (k < 1 && boss) requestAnimationFrame(puxa); };
      requestAnimationFrame(puxa); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0x8a1020, 20, 3, 0.6);
    }
    m.pound = 1.5; telegraph(m.x, m.z, 11, 1.7, 1.8, 0xb01060);
    setTimeout(() => { if (boss) { spikeRing(m.x, m.z, 11); tremer(0.6); } }, 1650);
  }
  // escurece ou avermelha a tela por um tempo (só para quem está na arena)
  function flashTela(cor, seg) {
    let el = document.getElementById('kvxflash'); if (!el) { el = document.createElement('div'); el.id = 'kvxflash'; document.body.appendChild(el); }
    el.style.transition = 'none'; el.style.background = cor; el.style.opacity = 1; void el.offsetWidth; el.style.transition = `opacity ${seg}s ease-in`; el.style.opacity = 0;
  }
  function mudarFase(m, f) {
    m.fase = f; const F = FASES[f];
    if (naArena()) { banner(`☠ ${F.nome} ☠`); log(F.txt, 'bad'); Audio8.sfx('boom'); setTimeout(() => Audio8.sfx('boom'), 250); tremer(1.4); flashTela('rgba(200,20,20,.5)', 1.2); for (let i = 0; i < 6; i++) setTimeout(() => { if (boss) ring(m.x, m.z, 5 + i * 5, 0xff2a2a, 0.8); }, i * 120); }
    m.specT = 4; m.roar = 1.5;
    if (f === 2) { invocarKvx('guardiao', 2, 88, true, 'General do Cisma'); invocarKvx(null, 5, 82); }
    if (f === 3) { m.enraged = true; invocarKvx('guardiao', 1, 90, true, 'General do Cisma'); invocarKvx(null, 5, 84); }
    if (f === 4) { invocarKvx('guardiao', 3, 90, true, 'Eco do Soberano'); invocarKvx(null, 4, 86); }
  }
  function ai(m, dt) {
    m.roar = Math.max(0, (m.roar || 0) - dt);
    const fr = m.hp / m.maxHp; m.fase = m.fase || 1;
    for (let f = m.fase + 1; f <= 4; f++) if (fr < FASES[f].f) { mudarFase(m, f); break; }
    const fase = m.fase, enr = fase >= 4 ? 1.8 : fase >= 3 ? 1.5 : fase >= 2 ? 1.2 : 1;
    // alvo: o jogador mais perto dentro da arena
    const cands = [];
    if (!P.dead && Math.hypot(P.x - AR().x, P.z - AR().z) < 36) cands.push({ x: P.x, z: P.z, p: true });
    allies.forEach(al => { if (al.down <= 0 && Math.hypot(al.x - AR().x, al.z - AR().z) < 36) cands.push({ x: al.x, z: al.z, al }); });
    if (!cands.length) {
      if (Math.hypot(m.x - m.sx, m.z - m.sz) > 1) stepMob(m, m.sx, m.sz, m.d.speed, dt);
      return;
    }
    cands.sort((a, b) => Math.hypot(a.x - m.x, a.z - m.z) - Math.hypot(b.x - m.x, b.z - m.z));
    const tg = cands[0]; m.focus = tg;
    const d = Math.hypot(tg.x - m.x, tg.z - m.z);
    m.pound = Math.max(0, (m.pound || 0) - dt / 1.3); m.beam = Math.max(0, (m.beam || 0) - dt);
    if (m.stun > 0) { m.stun -= dt * 3; return; }                    // gigante quase não é atordoado
    if (m.pound > 0 || m.beam > 0) return;                           // parado durante os golpes grandes
    if (d > 11) stepMob(m, tg.x, tg.z, m.d.speed * enr, dt);
    else m.face = Math.atan2(tg.x - m.x, tg.z - m.z);
    const fx = Math.sin(m.face), fz = Math.cos(m.face);
    // Garra: meia-lua vermelha à frente (na fúria, duas seguidas)
    m.meleeT -= dt * enr;
    if (m.meleeT <= 0 && d < 16) {
      m.meleeT = 3; m.swing = 1;
      telegraph(m.x + fx * 9, m.z + fz * 9, 7.5, 0.7, 1.2, 0xff2a2a);
      setTimeout(() => { if (boss) { clawFx(m); if (naArena()) Audio8.sfx('crit'); tremer(0.2); } }, 650);
      if (fase >= 3) setTimeout(() => { if (!boss) return; const f2 = Math.sin(m.face), z2 = Math.cos(m.face); telegraph(m.x + f2 * 9, m.z + z2 * 9, 8.5, 0.6, 1.3, 0xff2a2a); setTimeout(() => { if (boss) clawFx(m); }, 560); }, 900);
    }
    // golpes especiais: a lista cresce a cada fase
    m.specT -= dt * enr;
    if (m.specT <= 0) {
      const lista = ['raio', 'esmaga', 'espinhos'].concat(fase >= 2 ? ['meteoros'] : [], fase >= 3 ? ['eclipse', 'correntes'] : []);
      m.spec = ((m.spec || 0) + 1) % lista.length; const g = lista[m.spec];
      m.specT = fase >= 3 ? 5.5 : 7;
      if (g === 'raio') {                                              // Raio da Essência (na fúria: três raios em leque)
        const a = Math.atan2(tg.x - m.x, tg.z - m.z); m.face = a; m.beam = 1.6;
        teleLine(m.x, m.z, a, 46, 6, 1.5, 2.0);
        if (fase >= 3) { teleLine(m.x, m.z, a + 0.55, 46, 5, 1.7, 1.8); teleLine(m.x, m.z, a - 0.55, 46, 5, 1.7, 1.8); }
        if (naArena()) log(`🔴 Kravenox carrega o <b>Raio da Essência</b>${fase >= 3 ? ' TRIPLO' : ''}! Saia da faixa vermelha!`, 'bad');
        setTimeout(() => tremer(0.5), 1500);
      } else if (g === 'esmaga') {                                     // Esmagamento
        m.pound = 1; telegraph(m.x, m.z, 15, 1.3, 1.6, 0xff2a2a);
        setTimeout(() => { if (boss) { spikeRing(m.x, m.z, 15); tremer(0.9); } }, 1250);
        if (naArena()) log('⬇️ Kravenox salta para o <b>Esmagamento</b>! Use a esquiva!', 'bad');
      } else if (g === 'espinhos') {                                   // espinhos brotando sob os alvos
        const pts = cands.map(c => ({ x: c.x, z: c.z })).slice(0, 6);
        pts.forEach((p, i) => setTimeout(() => { if (boss) { telegraph(p.x, p.z, 3.4, 1.1, 1.3, 0xff2a2a); setTimeout(() => spikeRing(p.x, p.z, 3.4), 1050); } }, i * 120));
        if (fase >= 2) telegraph(m.x, m.z, 9, 1.1, 1.5);
      } else if (g === 'meteoros') {                                   // Chuva de Meteoros de Essência
        const A = AR(), n = fase >= 4 ? 18 : 12;
        for (let k = 0; k < n; k++) { const a = rand(0, TAU), r = rand(0, 30); setTimeout(() => { if (boss) meteoro(k < 3 && !P.dead ? P.x + rand(-3, 3) : A.x + Math.sin(a) * r, k < 3 && !P.dead ? P.z + rand(-3, 3) : A.z + Math.cos(a) * r, 1.6); }, k * 180); }
        if (naArena()) { log('☄️ <b>Chuva de Meteoros!</b> Fuja dos círculos laranja!', 'bad'); flashTela('rgba(255,120,20,.25)', 1.5); }
      } else if (g === 'eclipse') eclipse(m);
      else if (g === 'correntes') correntes(m);
    }
    // a cada pouco, mais servos (fase 1: larvas; depois, monstros do fim do jogo)
    m.addT -= dt;
    if (m.addT <= 0 && fr < 0.9) {
      m.addT = fase >= 3 ? 20 : 26;
      const vivos = mobs.filter(o => o.servoKvx && !o.dead).length;
      if (vivos < 12) { if (fase === 1) invocarKvx('larva', 4, 75); else invocarKvx(null, fase >= 4 ? 5 : 4, 80 + fase * 2); }
      if (naArena()) log(fase === 1 ? '🐛 Kravenox chamou <b>Larvas da Essência</b>!' : '👾 Kravenox chamou <b>servos do Abismo</b>!', 'bad');
    }
    // na última fase, uma chuva de meteoros leve o tempo todo
    if (fase >= 4) { m.chuvaT = (m.chuvaT || 0) - dt; if (m.chuvaT <= 0) { m.chuvaT = 1.4; const A = AR(), a = rand(0, TAU), r = rand(0, 30); meteoro(A.x + Math.sin(a) * r, A.z + Math.cos(a) * r, 1.5); } }
  }

  function curWeek() { return semanaAtual() + '-v2'; }                // -v2: zera o dano que os bots deram por você
  function addDmg(d) { const w = curWeek(); if (!P.kvxDmg || P.kvxDmg.w !== w) P.kvxDmg = { w, d: 0 }; P.kvxDmg.d += d; }
  function sharedHp(m) {
    const w = curWeek(), mine = P.kvxDmg && P.kvxDmg.w === w ? P.kvxDmg.d : 0;
    return m.maxHp - mine - Net.kvxOthers(w);
  }
  // caiu, mas você não lutou o bastante: sem prêmio
  function caiuSemVoce(por) {
    boss = null; active = false; limparServos();
    banner('☠ KRAVENOX FOI DERROTADO ☠');
    log(`🏆 <b>Kravenox foi derrotado${por ? ' por ' + por : ''}!</b> Você não lutou o bastante para ganhar o prêmio (é preciso causar pelo menos ${MIN_DANO.toLocaleString('pt-BR')} de dano). Ele volta no próximo sábado, às 20h.`, 'sys');
    allies.forEach(al => { scene.remove(al.g); al.lab.remove(); }); allies = [];
    teles.forEach(t => { scene.remove(t.fill); scene.remove(t.edge); }); teles = [];
    panel();
  }
  function onKill(m) {
    boss = null; active = false; setTimeout(limparServos, 1500);
    if (naArena()) { tremer(2); flashTela('rgba(255,220,120,.6)', 2.5); }
    P.kvxWeek = semanaAtual(); P.kvxKills = (P.kvxKills || 0) + 1;
    if (!forced && typeof Nuvem !== 'undefined') Nuvem.api('POST', '/conta/kvx/morto', { semana: P.kvxWeek, nome: P.name }).then(r => { srv = { ...srv, ...r, dif: r.agora - Date.now() }; }).catch(() => { });
    P.title = 'Matador de Kravenox';
    $('pname').innerHTML = `${P.name}<small>« ${P.title} »</small>`;
    banner('🏆 KRAVENOX FOI DERROTADO! 🏆');
    if (Net.count > 1) log(`🤝 Vitória em grupo com ${Net.count - 1} amigo(s)!`, 'gold');
    log(`🏆 <b>KRAVENOX FOI DERROTADO!</b> Você recebeu o título <b>« Matador de Kravenox »</b>. Vitórias: ${P.kvxKills}.`, 'gold');
    log('Ele volta no próximo sábado, às 20h (fica acordado até as 2h).', 'sys');
    // prêmio à altura do pior do jogo: um Mítico garantido (às vezes dois), coroas, Essência e poções
    const MIT = ['arma_soberano', 'coroa_soberano', 'manto_soberano', 'olho_kravenox'].sort(() => Math.random() - 0.5), got = MIT.slice(0, Math.random() < 0.3 ? 3 : 2);   // o chefe mais difícil do jogo: 2 Míticos garantidos (às vezes 3)
    for (const id of got) { P.inv[id] = (P.inv[id] || 0) + 1; log(`🔴 <b style="color:#ff4a4a">MÍTICO!</b> Você recebeu <b>${ITEMS[id].ic} ${ITEMS[id].name}</b>!`, 'gold'); }
    // materiais do Despertar ★: a Lágrima do Soberano só cai dele (por isso todo sábado vale a pena)
    const lag = 3 + (Math.random() < 0.5 ? 2 : 0);
    P.inv.lagrima_soberano = (P.inv.lagrima_soberano || 0) + lag; P.inv.frag_cisma = (P.inv.frag_cisma || 0) + 25; P.inv.nucleo_abismo = (P.inv.nucleo_abismo || 0) + 10; P.inv.selo_forja = (P.inv.selo_forja || 0) + 3;
    log(`🩸 <b>${lag} Lágrimas do Soberano</b>, 25 🔺 Fragmentos do Cisma, 10 🌑 Núcleos do Abismo e 3 🔰 Selos da Forja (para o ✨ Despertar com o Doran).`, 'gold');
    P.inv.essencia = (P.inv.essencia || 0) + 15; P.inv.red += 60; P.inv.blue += 40; P.zeny += 100000; P.inv.fragmento_dourado = (P.inv.fragmento_dourado || 0) + 5;
    log('💰 Tesouro do Soberano: <b>100.000 cr</b>, 15 Essências, 5 Fragmentos Dourados, 60 poções vermelhas e 40 azuis.', 'gold'); buildHotbar();
    for (let i = 0; i < 8; i++) setTimeout(() => { ring(m.x, m.z, 4 + i * 2, [0xffcf40, 0xff4fa3, 0x4fd1ff][i % 3], 0.8); Audio8.sfx(i % 2 ? 'level' : 'coin'); }, i * 200);
    for (let i = 0; i < 20; i++) drops.push(makeDrop('zeny', irand(600, 1200), m.x + rand(-6, 6), m.z + rand(-6, 6)));
    teles.forEach(t => { scene.remove(t.fill); scene.remove(t.edge); }); teles = [];
    allies.forEach(al => floater(al.x, groundY(al.x, al.z) + 2.4, al.z, 'Vitória!', 'lvl'));
    setTimeout(() => { allies.forEach(al => { scene.remove(al.g); al.lab.remove(); }); allies = []; }, 12000);
    save(); panel();
  }

  // ---------------- laço
  function update(dt) {
    checkT -= dt; srvT -= dt;
    if (srvT <= 0) { srvT = acordadoAgora() || (srv && proximoAgora() - Date.now() < 120e3) ? 20 : 120; sincronizar(); }
    if (checkT <= 0) {
      checkT = 1;
      if (boss && !boss.dead && mortoNoServidor() && P.kvxWeek !== semanaAtual()) {        // outro grupo derrubou: ele some para todos
        mobs = mobs.filter(o => o !== boss); scene.remove(boss.model.g); boss.lab.remove(); caiuSemVoce(srv.morto.por);
      }
      const should = (forced || acordadoAgora()) && !killedThisWeek();
      if (should && !boss) wake();
      if (!should && boss && !forced) sleep('🌑 Deu 2h da manhã: Kravenox voltou a dormir. Só no próximo sábado, às 20h.');
      panel();
    }
    if (boss && boss.dead) boss = null;
    if (boss) {
      arenaT -= dt; if (arenaT <= 0) { arenaT = 1; contarArena(); }
      boss.hp = Math.min(boss.maxHp, sharedHp(boss));
      if (boss.hp <= 0 && !boss.dead) {
        boss.hp = 0; const meu = P.kvxDmg && P.kvxDmg.w === curWeek() ? P.kvxDmg.d : 0;
        if (meu >= MIN_DANO || forced) killMob(boss);                                   // lutou: prêmio
        else { const b = boss; killMob(b, { semPremio: true }); caiuSemVoce(''); }      // só estava por perto: sem prêmio
      }
    }
    updateAllies(dt); updateTeles(dt);
    // rótulos dos aliados
    for (const al of allies) {
      const s = toScreen(al.x, groundY(al.x, al.z) + 2.3, al.z);
      const near = Math.hypot(al.x - P.x, al.z - P.z) < 30;
      al.lab.style.display = s.vis && near ? 'block' : 'none';
      al.lab.style.transform = `translate(${s.x | 0}px,${s.y | 0}px) translate(-50%,-100%)`;
      al.lab.querySelector('b').style.width = (Math.max(0, al.hp) / al.maxHp * 100) + '%';
    }
    // barra grande do chefe
    const bar = $('kvxbar');
    if (boss && Math.hypot(P.x - boss.x, P.z - boss.z) < 60) {
      bar.classList.remove('hidden');
      bar.querySelector('b').style.width = (boss.hp / boss.maxHp * 100) + '%';
      bar.querySelector('em').textContent = `${Math.max(0, Math.ceil(boss.hp)).toLocaleString('pt-BR')} / ${boss.maxHp.toLocaleString('pt-BR')}`;
      bar.classList.toggle('enraged', !!boss.enraged);
      const esc = escudo(), ke = bar.querySelector('.kesc');
      const txt = esc >= 1 ? `⚔️ ${naArenaN} na arena: o Escudo do Cisma caiu!` : `🛡️ Escudo: só <b>${Math.round(esc * 100)}%</b> do dano entra · ${naArenaN} na arena (8 quebram)`;
      if (ke.dataset.t !== txt) { ke.dataset.t = txt; ke.innerHTML = txt; }
    } else bar.classList.add('hidden');
  }
  function panel() {
    const el = $('kvx'); if (!el) return;
    let body;
    if (boss) {
      const left = forced ? 'modo teste' : `termina em ${fmt(fimAgora() - Date.now())}`;
      const onRoof = inTower(P.z) && Tower.floor === TOP;
      body = `<b class="live">● ACORDADO</b> · ${left}<br>${onRoof ? 'Derrube o Soberano!' : '📍 Topo da Torre do Cisma'}`;
    } else if (killedThisWeek()) body = `✅ Derrotado esta semana${mortoNoServidor() ? ` por <b>${srv.morto.por}</b>` : ''}!<br>Próximo despertar em <b>${fmt(proximoAgora() - Date.now())}</b>`;
    else body = `Sábado, 20h às 2h (Brasília)<br>Faltam <b>${fmt(proximoAgora() - Date.now())}</b>`;
    const html = `<div class="wt">☠ Kravenox</div><div class="wb">${body}</div>`;
    if (html !== lastMsg) { el.innerHTML = html; lastMsg = html; }
    el.classList.toggle('live', !!boss);
  }
  function minimap(g, sx, sz) {
    const x = (TOWER.x + WX) * sx, y = (TOWER.z + WZ) * sz;
    const pulse = boss ? 3 + Math.sin(time * 6) * 2 : 0;
    g.fillStyle = boss ? '#ff2020' : 'rgba(60,10,50,.85)';
    g.beginPath(); g.arc(x, y, 5 + pulse, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillText('☠', x, y + 3); g.textAlign = 'left';
  }
  return { init, update, ai, onKill, minimap, addDmg, escudo, meteoro, weekId, windowNow, nextStart, get active() { return !!boss; } };
})();
