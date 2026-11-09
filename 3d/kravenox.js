// =====================================================================
//  KRAVENOX — chefe mundial semanal
//  Desperta todo sábado, das 20h às 22h (horário do aparelho), na Fenda de Kravenox.
//  Para testar a qualquer hora: abra o jogo com #kravenox no fim do link.
// =====================================================================
'use strict';

// ---------------------------------------------------------------- visual
function kravenoxModel(r, mt) {
  const g = r.g, b = new THREE.Group(); g.add(b); r.b = b;
  const glowM = c => { const m = new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 1 }); return m; };
  const hide = mt(0x2a1838), hideD = mt(0x170c22), bone = mt(0xd8cfc0), red = glowM(0xff2a2a);
  r.redMats = [red];
  // patas traseiras
  r.legs = [];
  [[-1.3, -0.6], [1.3, -0.6], [-1.2, 1.4], [1.2, 1.4]].forEach(([x, z], i) => {
    const p = new THREE.Group(); p.position.set(x, 2.4, z); b.add(p);
    mesh(new THREE.CylinderGeometry(0.45, 0.3, 2.4, 7), i < 2 ? hide : hideD, 0, -1.2, 0, p);
    for (let k = -1; k <= 1; k++) { const c = mesh(new THREE.ConeGeometry(0.12, 0.5, 5), bone, k * 0.22, -2.35, 0.35, p); c.rotation.x = Math.PI / 2; }
    r.legs.push(p);
  });
  // corpo
  const torso = mesh(new THREE.SphereGeometry(1.9, 14, 10), hide, 0, 3.6, 0.2, b); torso.scale.set(1.05, 0.95, 1.5);
  mesh(new THREE.SphereGeometry(1.5, 12, 8), hideD, 0, 3.2, -1.6, b).scale.set(1, 0.8, 1.1);
  // espinhos nas costas
  for (let i = 0; i < 7; i++) { const sp = mesh(new THREE.ConeGeometry(0.28 - i * 0.02, 1.4 - i * 0.1, 5), bone, 0, 5.2 - i * 0.12, 1.6 - i * 0.65, b); sp.rotation.x = -0.4; }
  // runas brilhantes no peito
  r.core = mesh(new THREE.OctahedronGeometry(0.45), red, 0, 3.7, 2.7, b);
  // asas
  r.wings = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 1.3, 5, 0); b.add(p);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(s * 6.5, 2.5); shape.lineTo(s * 5.8, 0.4); shape.lineTo(s * 4.6, 1.2); shape.lineTo(s * 4, -0.8); shape.lineTo(s * 2.6, 0.2); shape.lineTo(s * 1.8, -1.6); shape.lineTo(0, -0.6);
    const w = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshLambertMaterial({ color: 0x3a1430, side: THREE.DoubleSide, emissive: 0x200008 }));
    w.castShadow = true; p.add(w); r.mats.push(w.material);
    const arm = mesh(new THREE.CylinderGeometry(0.1, 0.06, 6.9, 5), bone, s * 3.2, 1.25, 0, p); arm.rotation.z = -s * 1.2;
    return p;
  });
  // pescoço e cabeça
  const neck = mesh(new THREE.CylinderGeometry(0.7, 1.0, 2.2, 8), hide, 0, 5.2, 2.5, b); neck.rotation.x = 0.7;
  const head = new THREE.Group(); head.position.set(0, 6.2, 3.6); b.add(head); r.head = head;
  mesh(new THREE.BoxGeometry(1.5, 1.1, 1.8), hide, 0, 0, 0, head);
  mesh(new THREE.BoxGeometry(1.2, 0.55, 1.3), hideD, 0, -0.35, 1.2, head);
  r.jaw = mesh(new THREE.BoxGeometry(1.1, 0.3, 1.5), hideD, 0, -0.75, 0.9, head);
  for (let k = -2; k <= 2; k++) { const t = mesh(new THREE.ConeGeometry(0.07, 0.3, 4), bone, k * 0.2, -0.55, 1.75, head); t.rotation.x = Math.PI; }
  [-0.38, 0.38].forEach(x => mesh(new THREE.BoxGeometry(0.32, 0.14, 0.1), red, x, 0.15, 0.92, head));
  [-1, 1].forEach(s => {
    const h1 = mesh(new THREE.ConeGeometry(0.22, 1.8, 6), bone, s * 0.6, 0.9, -0.5, head); h1.rotation.set(-0.7, 0, -s * 0.45);
    const h2 = mesh(new THREE.ConeGeometry(0.12, 0.9, 5), bone, s * 0.85, 0.2, -0.2, head); h2.rotation.set(-0.3, 0, -s * 1.2);
  });
  // coroa flutuante de cristais
  r.crown = new THREE.Group(); r.crown.position.set(0, 8.2, 3.3); b.add(r.crown);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; const c = mesh(new THREE.OctahedronGeometry(0.28), red, Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9, r.crown); c.scale.y = 1.8; }
  // cauda
  r.tail = [];
  for (let i = 0; i < 9; i++) r.tail.push(mesh(new THREE.SphereGeometry(0.7 - i * 0.065, 8, 6), i % 2 ? hide : hideD, 0, 2.9 - i * 0.12, -2.8 - i * 0.8, b));
  mesh(new THREE.ConeGeometry(0.3, 1.2, 5), bone, 0, 1.9, -10.2, b).rotation.x = -Math.PI / 2;
  r.anim = (m, t) => {
    const enr = m.enraged ? 1.6 : 1;
    r.wings[0].rotation.z = Math.sin(t * 2.2 * enr) * 0.3 - 0.1; r.wings[1].rotation.z = -Math.sin(t * 2.2 * enr) * 0.3 + 0.1;
    r.crown.rotation.y = t * 1.5 * enr; r.crown.position.y = 8.2 + Math.sin(t * 2) * 0.2;
    r.core.rotation.y = t * 3; r.core.scale.setScalar(1 + Math.sin(t * 6) * 0.15);
    r.jaw.position.y = -0.75 - Math.max(0, m.roar || 0) * 0.4;
    r.head.rotation.x = -(m.roar || 0) * 0.5;
    r.tail.forEach((s, i) => s.position.x = Math.sin(t * 2 + i * 0.6) * (0.2 + i * 0.12));
    r.legs.forEach((l, i) => l.rotation.x = m.moving ? Math.sin(t * 5 + i * Math.PI) * 0.35 : 0);
    b.position.y = Math.sin(t * 1.5) * 0.1;
    red.emissiveIntensity = m.enraged ? 1.4 + Math.sin(t * 10) * 0.5 : 1;
  };
  r.h = 9.5;
  return r;
}

// ---------------------------------------------------------------- evento semanal
const Kvx = (() => {
  const DAY = 6, START = 20, END = 22;            // sábado, 20h–22h
  const ALLY_NAMES = ['Bruna Ferro', 'Tião do Arco', 'Zéfiro', 'Nanda Lumen', 'Grum Pedrabarba', 'Selvyn', 'Morgana Cinza', 'Duda Faísca', 'Otávio Brasa', 'Lia Sereno'];
  let boss = null, allies = [], teles = [], active = false, forced = false, checkT = 0, phaseT = 0, lastMsg = '';
  const forcedByLink = () => /kravenox/i.test(location.hash);

  // id da semana = data do sábado daquela semana
  function weekId(d = new Date()) {
    const s = new Date(d); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() + ((DAY - s.getDay() + 7) % 7) - (d.getDay() === DAY ? 0 : 7));
    return `${s.getFullYear()}-${s.getMonth() + 1}-${s.getDate()}`;
  }
  function windowNow(d = new Date()) { return d.getDay() === DAY && d.getHours() >= START && d.getHours() < END; }
  function nextStart(d = new Date()) {
    const n = new Date(d); n.setHours(START, 0, 0, 0);
    let add = (DAY - n.getDay() + 7) % 7;
    if (add === 0 && d.getHours() >= START) add = 7;
    n.setDate(n.getDate() + add); return n;
  }
  function endTime(d = new Date()) { const e = new Date(d); e.setHours(END, 0, 0, 0); return e; }
  const fmt = ms => { const s = Math.max(0, Math.floor(ms / 1000)), dd = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return dd ? `${dd}d ${h}h ${m}min` : h ? `${h}h ${m}min` : `${m}min ${ss}s`; };
  const killedThisWeek = () => P.kvxWeek === (forced ? 'teste' : weekId());

  function init() {
    forced = forcedByLink();
    addEventListener('hashchange', () => { forced = forcedByLink(); checkT = 0; });
    const el = document.createElement('div'); el.id = 'kvx'; el.className = 'win'; $('hud').appendChild(el);
    const bar = document.createElement('div'); bar.id = 'kvxbar'; bar.className = 'hidden';
    bar.innerHTML = '<div class="kn">☠ KRAVENOX <small>Nv 40 · Chefe Mundial</small></div><div class="kt"><b></b><em></em></div>'; $('hud').appendChild(bar);
    if (P.title) $('pname').innerHTML = `${P.name}<small>« ${P.title} »</small>`;
    checkT = 0;
  }

  function wake() {
    if (boss) return;
    boss = spawnMob('kravenox', null, LAIR);
    boss.sx = LAIR.x; boss.sz = LAIR.z; boss.state = 'idle'; boss.specT = 5; boss.addT = 20; boss.meleeT = 2;
    active = true;
    banner('☠ KRAVENOX DESPERTOU ☠');
    Audio8.sfx('boom'); setTimeout(() => Audio8.sfx('boom'), 300);
    log('☠ <b style="color:#ff6060">KRAVENOX DESPERTOU</b> na Fenda de Kravenox! Todos os aventureiros estão indo para lá!', 'bad');
    log('📍 A fenda fica ao sul dos Campos Dourados (caveira vermelha no minimapa).', 'gold');
    spawnAllies();
  }
  function sleep(msg) {
    if (boss && !boss.dead) { mobs = mobs.filter(o => o !== boss); scene.remove(boss.model.g); boss.lab.remove(); }
    boss = null; active = false;
    allies.forEach(a => scene.remove(a.g)); allies = [];
    teles.forEach(t => { scene.remove(t.fill); scene.remove(t.edge); }); teles = [];
    if (msg) log(msg, 'sys');
  }

  // ---------------- aliados
  function spawnAllies() {
    const races = Object.keys(RACES), clss = Object.keys(CLASSES);
    const names = ALLY_NAMES.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < 6; i++) {
      const look = { race: races[irand(0, races.length - 1)], cls: clss[irand(0, clss.length - 1)], gender: Math.random() < 0.5 ? 'f' : 'm', hair: irand(0, 7), skin: irand(0, 2) };
      const g = new THREE.Group(); scene.add(g);
      const L2 = buildAvatar(g, look);
      if (L2.ribbon) L2.ribbon = false;
      const a = LAIR, ang = rand(0, TAU), rr0 = rand(28, 34);
      const al = { g, L: L2, look, name: names[i], x: a.x + Math.cos(ang) * rr0, z: a.z + Math.sin(ang) * rr0, hp: 600, maxHp: 600, cd: rand(0, 1.5), down: 0, face: 0, atk: 0, moving: false, slot: ang };
      if (blocked(al.x, al.z)) { al.x = LAIR.x + 10; al.z = LAIR.z + 26; }
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
        al.down -= dt; al.g.rotation.z = Math.PI / 2; al.g.position.y = groundY(al.x, al.z) + 0.3;
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
          if (al.look.cls === 'sacerdote' && Math.random() < 0.3) { healP(stats.maxHp() * 0.08); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xcfe8ff, 10, 2, 0.6); }
        }
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
  function updateTeles(dt) {
    for (const tl of teles) {
      tl.t -= dt; const k = 1 - tl.t / tl.max;
      tl.fill.scale.set(tl.r * k, 1, tl.r * k); tl.fill.material.opacity = 0.15 + k * 0.35;
      if (tl.t <= 0) {
        tl.done = true; scene.remove(tl.fill); scene.remove(tl.edge);
        Audio8.sfx('boom'); ring(tl.x, tl.z, tl.r, 0xff5030, 0.5);
        burst(new THREE.Vector3(tl.x, groundY(tl.x, tl.z) + 0.5, tl.z), 0xff4020, 26, tl.r * 1.5, 0.8);
        if (boss && Math.hypot(P.x - tl.x, P.z - tl.z) < tl.r) hurtPlayer(boss, tl.mult);
        allies.forEach(al => { if (Math.hypot(al.x - tl.x, al.z - tl.z) < tl.r) hurtAlly(al, 70 * tl.mult); });
      }
    }
    teles = teles.filter(t => !t.done);
  }

  // ---------------- IA do chefe
  function ai(m, dt) {
    m.roar = Math.max(0, (m.roar || 0) - dt);
    if (!m.enraged && m.hp < m.maxHp * 0.5) {
      m.enraged = true; banner('KRAVENOX SE ENFURECE!'); Audio8.sfx('boom');
      log('🔥 <b>Kravenox se enfurece!</b> Ele ficou mais rápido e agressivo.', 'bad');
    }
    const enr = m.enraged ? 1.4 : 1;
    // alvo: jogador ou aliado mais próximo dentro da arena
    const cands = [];
    if (!P.dead && Math.hypot(P.x - LAIR.x, P.z - LAIR.z) < 30) cands.push({ x: P.x, z: P.z, p: true });
    allies.forEach(al => { if (al.down <= 0 && Math.hypot(al.x - LAIR.x, al.z - LAIR.z) < 30) cands.push({ x: al.x, z: al.z, al }); });
    if (!cands.length) {
      if (Math.hypot(m.x - LAIR.x, m.z - LAIR.z) > 1) stepMob(m, LAIR.x, LAIR.z, m.d.speed, dt);
      m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.01 * dt);
      return;
    }
    cands.sort((a, b) => Math.hypot(a.x - m.x, a.z - m.z) - Math.hypot(b.x - m.x, b.z - m.z));
    const tg = Math.random() < 0.002 ? cands[irand(0, cands.length - 1)] : (m.focus && cands.includes(m.focus) ? m.focus : cands[0]);
    m.focus = tg;
    const d = Math.hypot(tg.x - m.x, tg.z - m.z);
    if (m.stun > 0) { m.stun -= dt * 2; return; }                // chefe resiste ao atordoamento
    if (d > 5.5) stepMob(m, tg.x, tg.z, m.d.speed * enr, dt);
    else m.face = Math.atan2(tg.x - m.x, tg.z - m.z);
    // mordida / garra
    m.meleeT -= dt * enr;
    if (m.meleeT <= 0 && d < 7) {
      m.meleeT = 2.2; m.roar = 0.4; Audio8.sfx('hurt');
      if (tg.p) hurtPlayer(m, 1); else hurtAlly(tg.al, 90);
    }
    // golpes especiais
    m.specT -= dt * enr;
    if (m.specT <= 0) {
      m.specT = 6; m.spec = ((m.spec || 0) + 1) % 3;
      if (m.spec === 1) {
        m.roar = 1.4; telegraph(m.x, m.z, 10, 1.6, 1.7);
        log('☠ Kravenox ruge! <b>Saia do círculo vermelho!</b>', 'bad');
      } else if (m.spec === 2) {
        const pts = [{ x: P.x, z: P.z }, ...allies.filter(a => a.down <= 0).map(a => ({ x: a.x, z: a.z }))].slice(0, 6);
        pts.forEach((p, i) => setTimeout(() => boss && telegraph(p.x + rand(-1, 1), p.z + rand(-1, 1), 3.2, 1.4, 1.3, 0xff6a00), i * 150));
        log(`☄️ Meteoros sombrios! <b>Use a esquiva (${TOUCH ? 'botão 💨' : 'Shift'}).</b>`, 'bad');
      } else {
        for (let i = 0; i < 3; i++) { const a = rand(0, TAU); telegraph(m.x + Math.cos(a) * rand(4, 9), m.z + Math.sin(a) * rand(4, 9), 3.5, 1.2, 1.2, 0xb020ff); }
        if (m.enraged) telegraph(m.x, m.z, 6, 1.2, 1.4);
      }
    }
    // crias
    m.addT -= dt;
    if (m.addT <= 0 && m.hp < m.maxHp * 0.75) {
      m.addT = 28;
      for (let i = 0; i < 3; i++) { const c = spawnMob('besouro', null, { x: m.x + rand(-6, 6), z: m.z + rand(-6, 6) }); c.state = 'chase'; c.at = null; c.area = [m.x - 10, m.x + 10, m.z - 10, m.z + 10]; c.noRespawn = true; }
      log('🪲 Kravenox invocou suas crias!', 'bad');
    }
  }

  function onKill(m) {
    boss = null; active = false;
    P.kvxWeek = forced ? 'teste' : weekId(); P.kvxKills = (P.kvxKills || 0) + 1;
    P.title = 'Matador de Kravenox';
    $('pname').innerHTML = `${P.name}<small>« ${P.title} »</small>`;
    banner('🏆 KRAVENOX FOI DERROTADO! 🏆');
    log(`🏆 <b>KRAVENOX FOI DERROTADO!</b> Você recebeu o título <b>« Matador de Kravenox »</b>. Vitórias: ${P.kvxKills}.`, 'gold');
    log('Ele volta no próximo sábado, às 20h.', 'sys');
    P.inv.red += 15; P.inv.blue += 8; buildHotbar();
    for (let i = 0; i < 8; i++) setTimeout(() => { ring(m.x, m.z, 4 + i * 2, [0xffcf40, 0xff4fa3, 0x4fd1ff][i % 3], 0.8); Audio8.sfx(i % 2 ? 'level' : 'coin'); }, i * 200);
    for (let i = 0; i < 10; i++) drops.push(makeDrop('zeny', irand(150, 300), m.x + rand(-4, 4), m.z + rand(-4, 4)));
    teles.forEach(t => { scene.remove(t.fill); scene.remove(t.edge); }); teles = [];
    allies.forEach(al => floater(al.x, groundY(al.x, al.z) + 2.4, al.z, 'Vitória!', 'lvl'));
    setTimeout(() => { allies.forEach(al => { scene.remove(al.g); al.lab.remove(); }); allies = []; }, 12000);
    save(); panel();
  }

  // ---------------- laço
  function update(dt) {
    checkT -= dt;
    if (checkT <= 0) {
      checkT = 1;
      const should = (forced || windowNow()) && !killedThisWeek();
      if (should && !boss) wake();
      if (!should && boss && !forced) sleep('🌑 O tempo acabou. Kravenox voltou para as profundezas... volte no próximo sábado, às 20h.');
      panel();
    }
    if (boss && boss.dead) boss = null;
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
    } else bar.classList.add('hidden');
  }
  function panel() {
    const el = $('kvx'); if (!el) return;
    let body;
    if (boss) {
      const left = forced ? 'modo teste' : `termina em ${fmt(endTime() - new Date())}`;
      const dist = Math.round(Math.hypot(P.x - LAIR.x, P.z - LAIR.z));
      body = `<b class="live">● ACORDADO</b> · ${left}<br>${dist > 25 ? `📍 Fenda de Kravenox a ${dist} m (caveira no minimapa)` : 'Você está na fenda. Lute!'}`;
    } else if (killedThisWeek()) body = `✅ Derrotado esta semana!<br>Próximo despertar em <b>${fmt(nextStart() - new Date())}</b>`;
    else body = `Desperta todo <b>sábado às 20h</b><br>Faltam <b>${fmt(nextStart() - new Date())}</b>`;
    const html = `<div class="wt">☠ Kravenox</div><div class="wb">${body}</div>`;
    if (html !== lastMsg) { el.innerHTML = html; lastMsg = html; }
    el.classList.toggle('live', !!boss);
  }
  function minimap(g, sx, sz) {
    const x = (LAIR.x + WX) * sx, y = (LAIR.z + WZ) * sz;
    const pulse = boss ? 3 + Math.sin(time * 6) * 2 : 0;
    g.fillStyle = boss ? '#ff2020' : 'rgba(60,10,50,.85)';
    g.beginPath(); g.arc(x, y, 5 + pulse, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillText('☠', x, y + 3); g.textAlign = 'left';
  }
  return { init, update, ai, onKill, minimap, weekId, windowNow, nextStart, get active() { return !!boss; } };
})();
