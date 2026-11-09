// =====================================================================
//  Reino Quebrado — Cidadela do Cisma e a Torre do Cisma (6 andares)
//  Inimigos do universo Kravenox: Larvas da Essência, Vermes de Dentes,
//  Sentinelas Esféricas e Sentinelas do Vazio. No topo dorme Kravenox.
// =====================================================================
'use strict';
const Tower = (() => {
  const STONE = 0x2a2430, STONE_D = 0x1a1620, PURPLE = 0x9a4dff, RED = 0xff2a2a;
  const glow = c => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 1 });
  const lam = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });

  // ---------------- Cidadela do Cisma
  [[CIT.x - 16, CIT.z - 8, 0.6], [CIT.x - 18, CIT.z + 14, 0.2], [CIT.x + 16, CIT.z + 14, -0.3], [CIT.x + 18, CIT.z - 6, -0.6], [CIT.x - 2, CIT.z + 20, 0]].forEach(([x, z, rot]) => {
    const g = new THREE.Group(); g.position.set(x, groundY(x, z), z); g.rotation.y = Math.atan2(CIT.x - x, CIT.z - z) + rot * 0; scene.add(g);
    mesh(new THREE.BoxGeometry(5.5, 3.4, 5), lam(0x3a3442), 0, 1.7, 0, g);
    const roof = mesh(new THREE.ConeGeometry(4.6, 3.2, 4), lam(0x5a1a24), 0, 5, 0, g); roof.rotation.y = Math.PI / 4;
    mesh(new THREE.BoxGeometry(1.1, 1.9, 0.12), lam(0x1a1018), 0, 0.95, 2.53, g);
    [-1.6, 1.6].forEach(wx => mesh(new THREE.BoxGeometry(0.7, 0.8, 0.1), glow(0xff5a3a), wx, 2.2, 2.53, g, false));
    addOb(x, z, 3.6);
  });
  // cristais roxos e tochas pela cidade
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * TAU, r = 25 + (i % 3) * 3, x = CIT.x + Math.cos(a) * r, z = CIT.z + Math.sin(a) * r;
    if (Math.hypot(x - TOWER.x, z - TOWER.z) < 14 || Math.abs(z) < 4) continue;
    const c = mesh(new THREE.OctahedronGeometry(0.9), glow(PURPLE), x, groundY(x, z) + 1.3, z); c.scale.y = 2.2; c.rotation.y = a;
    addOb(x, z, 0.8);
  }

  // ---------------- Torre do Cisma (exterior)
  const ext = new THREE.Group(); ext.position.set(TOWER.x, groundY(TOWER.x, TOWER.z), TOWER.z); scene.add(ext);
  let ty = 0;
  for (let i = 0; i < 6; i++) {
    const r0 = 9.5 - i * 0.9, r1 = r0 - 0.6, h = 9;
    mesh(new THREE.CylinderGeometry(r1, r0, h, 12), lam(i % 2 ? STONE : STONE_D), 0, ty + h / 2, 0, ext);
    mesh(new THREE.CylinderGeometry(r1 + 0.5, r1 + 0.5, 0.6, 12), lam(0x3a3040), 0, ty + h, 0, ext);
    for (let k = 0; k < 6; k++) {                               // janelas vermelhas
      const a = k / 6 * TAU + i * 0.3, wr = (r0 + r1) / 2;
      const w = mesh(new THREE.BoxGeometry(0.9, 1.8, 0.2), glow(RED), Math.sin(a) * wr, ty + h * 0.55, Math.cos(a) * wr, ext, false); w.rotation.y = a;
    }
    ty += h;
  }
  // coroa de espinhos no topo (como a cabeça do Kravenox)
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * TAU, sp = mesh(new THREE.ConeGeometry(0.7, 5, 6), lam(0x120e16), Math.sin(a) * 4.6, ty + 2, Math.cos(a) * 4.6, ext);
    sp.rotation.x = Math.cos(a) * 0.35; sp.rotation.z = -Math.sin(a) * 0.35;
  }
  const beacon = mesh(new THREE.OctahedronGeometry(1.6), glow(RED), 0, ty + 4, 0, ext, false);
  // porta com portal (de frente para a cidade)
  const doorZ = TOWER.z + 9.6, doorX = TOWER.x;
  mesh(new THREE.BoxGeometry(4, 5.5, 1), lam(0x120e16), 0, 2.75, 9.3, ext);
  const doorGlow = mesh(new THREE.PlaneGeometry(3, 4.6), new THREE.MeshBasicMaterial({ color: 0xb050ff, transparent: true, opacity: 0.75 }), 0, 2.4, 9.85, ext, false);
  addOb(TOWER.x, TOWER.z, 9.6);
  const DOOR = { x: doorX, z: doorZ + 1.4 };

  // ---------------- andares (fora do mapa, em z ≈ 420)
  const stairs = [], downs = [];
  for (const f of FLOORS) {
    const g = new THREE.Group(); g.position.set(f.x, f.y, f.z); scene.add(g); f.g = g;
    const top = f.i === 5;
    const floorMat = new THREE.MeshLambertMaterial({ color: top ? 0x2a2026 : 0x2c2834 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(f.r + 1, f.r + 1, 1.2, 40), floorMat); disc.position.y = -0.6; disc.receiveShadow = true; g.add(disc);
    // desenho do piso: anel e veios
    const ring = new THREE.Mesh(new THREE.RingGeometry(f.r * 0.45, f.r * 0.48, 48), glow(top ? RED : PURPLE)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
    // paredes / ameias
    const wallH = top ? 1.6 : 4.5;
    const n = top ? 28 : 18;
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU, x = Math.sin(a) * (f.r + 0.4), z = Math.cos(a) * (f.r + 0.4);
      if (!top && Math.abs(z - f.r) < 3 && Math.abs(x) < 3) continue;                 // vão da chegada
      const b = mesh(new THREE.BoxGeometry(top ? 2 : 3.6, wallH, 1.2), lam(k % 2 ? STONE : STONE_D), x, wallH / 2, z, g); b.rotation.y = a;
      if (!top && k % 3 === 0) {                                                       // tochas
        const t = mesh(new THREE.BoxGeometry(0.3, 0.6, 0.3), glow(k % 2 ? PURPLE : RED), x * 0.93, 2.8, z * 0.93, g, false);
      }
    }
    if (top) for (let k = 0; k < 8; k++) {                                            // espinhos gigantes no topo
      const a = k / 8 * TAU + 0.2, sp = mesh(new THREE.ConeGeometry(1.2, 9, 6), lam(0x120e16), Math.sin(a) * (f.r + 1), 4, Math.cos(a) * (f.r + 1), g);
      sp.rotation.x = Math.cos(a) * 0.25; sp.rotation.z = -Math.sin(a) * 0.25;
    }
    // pilares internos (obstáculos)
    if (!top) for (let k = 0; k < 4; k++) {
      const a = k / 4 * TAU + Math.PI / 4, x = Math.sin(a) * f.r * 0.62, z = Math.cos(a) * f.r * 0.62;
      mesh(new THREE.CylinderGeometry(0.9, 1.1, 4.5, 10), lam(STONE_D), x, 2.25, z, g);
      addOb(f.x + x, f.z + z, 1.1);
    }
    // escada para cima (fundo da sala) e portal de descida (chegada)
    if (!top) {
      const sg = new THREE.Group(); sg.position.set(0, 0, -f.r + 3); g.add(sg);
      for (let k = 0; k < 6; k++) mesh(new THREE.BoxGeometry(4, 0.4, 1), lam(0x3a3442), 0, 0.2 + k * 0.4, 1.8 - k * 0.6, sg);
      const arch = mesh(new THREE.TorusGeometry(1.8, 0.25, 6, 18, Math.PI), lam(0x120e16), 0, 2.4, -1.6, sg);
      const pm = new THREE.MeshBasicMaterial({ color: 0x555060, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      const portal = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24, 0, Math.PI), pm); portal.position.set(0, 2.4, -1.6); sg.add(portal);
      stairs[f.i] = { f, x: f.x, z: f.z - f.r + 2.2, mat: pm, open: false };
    }
    const dm = new THREE.MeshBasicMaterial({ color: 0x4fd1ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const dp = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.4, 24), dm); dp.rotation.x = -Math.PI / 2; dp.position.set(0, 0.05, f.r - 2.2); g.add(dp);
    downs[f.i] = { f, x: f.x, z: f.z + f.r - 2.2, mesh: dp };
  }

  // Kravenox adormecido no topo (quando não é o horário do evento)
  const roof = FLOORS[5];
  const sleeper = new THREE.Group(); scene.add(sleeper);
  let sleeperR = null;
  function buildSleeper() {
    const r = { g: sleeper, mats: [] };
    if (typeof SpriteKit !== 'undefined' && SpriteKit.ready) {         // o sprite do próprio Kravenox, gigante e adormecido
      const a = SpriteKit.actor({ kind: 'hero', base: 'k' }, { px: 18 / 34 }); sleeper.add(a.root);
      r.anim = (m, t) => { const dt = Math.min(0.1, r.lt ? t - r.lt : 0); r.lt = t; a.update(dt, { face: Math.PI, sleeping: true }); };
      sleeper.position.set(roof.x, roof.y, roof.z - 6); sleeperR = r; return;
    }
    kravenoxModel(r, c => { const m = new THREE.MeshLambertMaterial({ color: c }); r.mats.push(m); return m; });
    sleeper.position.set(roof.x, roof.y, roof.z - 6); sleeper.rotation.y = 0;
    sleeperR = r;
  }

  // ---------------- monstros dos andares
  const WAVES = [
    [['larva', 4]],
    [['larva', 3], ['verme', 2]],
    [['sentinela', 2], ['esfera', 2]],
    [['sentinela', 2], ['verme', 2], ['larva', 2]],
    [['sentinela', 4], ['esfera', 1]],
  ];
  let cur = -1, clearedAt = {}, leaveT = 0, lastCount = -1;
  function clearFloorMobs() {
    for (const m of mobs.filter(m => m.towerFloor !== undefined)) { m.dead = true; scene.remove(m.model.g); m.lab.remove(); }
    mobs = mobs.filter(m => m.towerFloor === undefined);
  }
  function spawnFloor(i) {
    if (i >= 5 || (clearedAt[i] && time - clearedAt[i] < 300)) return;
    const f = FLOORS[i]; let k = 0;
    for (const [type, n] of WAVES[i]) for (let j = 0; j < n; j++) {
      const a = (k++ / 6) * TAU + i, r = f.r * (0.25 + (k % 2) * 0.2);
      const m = spawnMob(type, null, { x: f.x + Math.sin(a) * r, z: f.z + Math.cos(a) * r - 2 });
      m.towerFloor = i; m.noRespawn = true;
    }
  }
  function enter(i, fromAbove) {
    clearFloorMobs();
    if (i < 0) {                                                       // sai da torre
      cur = -1; P.x = DOOR.x; P.z = DOOR.z + 1.5; P.y = groundY(P.x, P.z); P.face = 0; camS.yaw = Math.PI;
      Audio8.sfx('warp'); log('Você saiu da Torre do Cisma.', 'sys'); return;
    }
    cur = i; const f = FLOORS[i];
    if (fromAbove && stairs[i]) { P.x = stairs[i].x; P.z = stairs[i].z + 3; P.face = 0; }
    else { P.x = f.x; P.z = f.z + f.r - 4; P.face = Math.PI; }
    P.y = f.y; camS.yaw = P.face + Math.PI; camS.x = P.x; camS.z = P.z; camS.y = P.y;
    if (i === 5) { camS.dist = Math.max(camS.dist, 24); camS.pitch = Math.max(camS.pitch, 0.32); }
    Audio8.sfx('warp');
    banner(i === 5 ? 'TOPO DA TORRE' : `${i + 1}º ANDAR`);
    spawnFloor(i);
    if (i === 5) log(Kvx.active ? '☠ <b>Kravenox está acordado!</b> Derrube o Soberano!' : '💤 Kravenox dorme aqui em cima... Ele desperta todo <b>sábado às 20h</b>.', i === 5 && Kvx.active ? 'bad' : 'gold');
    else log(`🗼 Torre do Cisma — <b>${i + 1}º andar</b>. Derrote todos para liberar a escada.`, 'sys');
    lastCount = -1;
  }

  function update(dt) {
    beacon.rotation.y += dt; beacon.position.y = ty + 4 + Math.sin(time * 2) * 0.4;
    doorGlow.material.opacity = 0.55 + Math.sin(time * 3) * 0.2;
    if (!sleeperR && typeof kravenoxModel === 'function' && (typeof SpriteKit === 'undefined' || SpriteKit.ready || running)) buildSleeper();
    sleeper.visible = !Kvx.active;
    if (sleeperR && sleeper.visible) {                                  // respiração lenta, olhos apagados
      sleeperR.anim({ moving: false, roar: 0, enraged: false, sleeping: true }, time);
    }
    leaveT -= dt;
    if (P.dead || leaveT > 0) return;
    // entrar pela porta
    if (!inTower(P.z) && Math.hypot(P.x - DOOR.x, P.z - DOOR.z) < 2.2) { leaveT = 1; enter(0); return; }
    if (!inTower(P.z)) { if (cur !== -1) { cur = -1; clearFloorMobs(); } return; }
    const f = floorAt(P.x, P.z); if (!f) return;
    if (f.i !== cur) { cur = f.i; }
    // escada: abre quando o andar está limpo
    const left = mobs.filter(m => m.towerFloor === cur).length;
    const st = stairs[cur];
    if (st) {
      const open = left === 0;
      if (open && !st.open) { st.open = true; clearedAt[cur] = time; Audio8.sfx('level'); log(`✨ Andar limpo! A escada para o <b>${cur + 2 === 6 ? 'topo' : (cur + 2) + 'º andar'}</b> foi liberada.`, 'gold'); }
      if (!open) st.open = false;
      st.mat.color.set(open ? 0xff3a3a : 0x555060); st.mat.opacity = open ? 0.6 + Math.sin(time * 4) * 0.2 : 0.4;
      if (Math.hypot(P.x - st.x, P.z - st.z) < 2.4) {
        if (open) { leaveT = 1; enter(cur + 1, false); return; }
        else if (left !== lastCount) { lastCount = left; log(`A escada está selada. Faltam <b>${left}</b> inimigos neste andar.`, 'bad'); }
      }
    }
    // descer
    const dn = downs[cur];
    dn.mesh.material.opacity = 0.35 + Math.sin(time * 3) * 0.15;
    if (Math.hypot(P.x - dn.x, P.z - dn.z) < 1.4) { leaveT = 1.2; enter(cur - 1, true); }
  }
  function minimap(g) {
    const W = g.canvas.width, H = g.canvas.height;
    g.fillStyle = '#1a1020'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.fillStyle = '#f2c86a'; g.font = 'bold 16px Georgia';
    g.fillText('Torre do Cisma', W / 2, H / 2 - 22);
    for (let i = 0; i < 6; i++) { g.fillStyle = i === cur ? '#ff3a3a' : i < cur ? '#7a5a8a' : '#3a2e44'; g.fillRect(W / 2 - 30 + i * 10, H / 2 - 6, 8, 20 - (i === cur ? 0 : 6)); }
    g.fillStyle = '#ece6f6'; g.font = 'bold 13px sans-serif';
    g.fillText(cur === 5 ? 'Topo' : `${cur + 1}º andar`, W / 2, H / 2 + 34);
    g.textAlign = 'left';
  }
  return { update, minimap, enter, get floor() { return cur; }, door: DOOR, roof };
})();

// ---------------------------------------------------------------- modelos dos inimigos do Reino Quebrado
function towerMobModel(type, r, mt) {
  const g = r.g, b = new THREE.Group(); g.add(b);
  const glowM = c => { const m = new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 1 }); return m; };
  if (type === 'larva') {
    const segs = [];
    for (let i = 0; i < 6; i++) { const s = mesh(new THREE.SphereGeometry(0.55 - i * 0.05, 12, 10), mt(i % 2 ? 0x5a4a66 : 0x4a3c56), 0, 0.55, -i * 0.55, b); s.scale.set(1.1, 0.9, 1); segs.push(s); }
    const head = mesh(new THREE.SphereGeometry(0.62, 14, 12), mt(0x5a4a66), 0, 0.7, 0.45, b);
    [-0.25, 0.25].forEach(x => mesh(new THREE.SphereGeometry(0.11, 8, 6), glowM(0xb060ff), x, 0.95, 0.98, b));
    mesh(new THREE.SphereGeometry(0.3, 10, 8), mt(0x1a0a14), 0, 0.5, 1.0, b).scale.set(1.2, 0.9, 0.5);
    for (let k = 0; k < 6; k++) { const t = mesh(new THREE.ConeGeometry(0.04, 0.16, 4), mt(0xe8e0d0), -0.2 + k * 0.08, 0.66, 1.08, b); t.rotation.x = Math.PI; }
    for (let i = 1; i < 5; i++) [-1, 1].forEach(sd => { const l = mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.5), mt(0x3a2c46), sd * 0.5, 0.25, -i * 0.55, b); l.rotation.z = sd * 0.6; });
    r.anim = (m, t) => { segs.forEach((s, i) => { s.position.y = 0.55 + Math.sin(t * 6 + i) * (m.moving ? 0.08 : 0.03); s.position.x = Math.sin(t * 3 + i * 0.7) * 0.08; }); head.rotation.x = -(m.swing || 0) * 0.6; };
    r.h = 1.4;
  } else if (type === 'verme') {
    const segs = [];
    for (let i = 0; i < 7; i++) segs.push(mesh(new THREE.SphereGeometry(0.42 - i * 0.03, 12, 10), mt(i % 2 ? 0x5a7a3a : 0x4a6a2e), 0, 0.4 + i * 0.32, -i * 0.12, b));
    const head = new THREE.Group(); head.position.set(0, 2.5, 0.1); b.add(head);
    mesh(new THREE.SphereGeometry(0.5, 14, 12), mt(0x5a7a3a), 0, 0, 0, head);
    mesh(new THREE.SphereGeometry(0.36, 12, 10), mt(0x3a0a10), 0, 0, 0.3, head).scale.set(1, 1, 0.5);
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, t = mesh(new THREE.ConeGeometry(0.05, 0.22, 4), mt(0xf0e8d8), Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.42, head); t.rotation.x = Math.PI / 2; t.rotation.z = a; }
    r.anim = (m, t) => { segs.forEach((s, i) => s.position.x = Math.sin(t * 3 + i * 0.6) * 0.12 * i / 3); head.position.x = Math.sin(t * 3 + 4) * 0.4; head.rotation.x = 0.3 - (m.swing || 0) * 0.9; };
    r.h = 3.1;
  } else if (type === 'esfera') {
    const body = mesh(new THREE.SphereGeometry(0.6, 16, 14), mt(0x1c1822), 0, 1.1, 0, b);
    mesh(new THREE.TorusGeometry(0.6, 0.05, 6, 24), mt(0x3a3046), 0, 1.1, 0, b).rotation.x = Math.PI / 2;
    const eye = mesh(new THREE.SphereGeometry(0.2, 12, 10), glowM(0xb060ff), 0, 1.15, 0.5, b);
    const legs = [];
    for (let k = 0; k < 3; k++) { const p = new THREE.Group(); p.position.set(Math.sin(k / 3 * TAU) * 0.45, 0.8, Math.cos(k / 3 * TAU) * 0.45); p.rotation.y = k / 3 * TAU; b.add(p);
      const l = mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.9), mt(0x2a2430), 0, -0.35, 0.2, p); l.rotation.x = 0.5;
      const c = mesh(new THREE.ConeGeometry(0.08, 0.3, 4), mt(0x8a8090), 0, -0.75, 0.45, p); c.rotation.x = 1.2; legs.push(p); }
    r.anim = (m, t) => { body.position.y = 1.1 + Math.sin(t * 5) * 0.05; legs.forEach((p, i) => p.rotation.x = m.moving ? Math.sin(t * 12 + i * 2) * 0.4 : 0); eye.scale.setScalar(1 + (m.swing || 0) * 0.5); };
    r.h = 1.8;
  } else if (type === 'sentinela') {
    if (ModelKit.ready) {
      const inst = ModelKit.instance('hooded_adventurer', 2.25);
      inst.mats.forEach(m => { m.color.set(m.name === 'Metal' || m.name === 'Metal_Dark' ? 0x2a2632 : 0x15121a); });
      b.add(inst.root);
      const head = inst.attach('Head');
      [-0.05, 0.05].forEach(x => mesh(new THREE.SphereGeometry(0.03, 8, 6), glowM(0xb060ff), x, 0.12, 0.12, head));
      r.mats = inst.mats.filter(m => m.emissive);
      r.inst = inst; r.def = { die: 'Death' };
      inst.play('Idle_Sword');
      let lt = 0, ls = 0;
      r.anim = (m, t) => {
        const dt = Math.min(0.1, lt ? t - lt : 0); lt = t; const sw = m.swing || 0;
        if (sw > 0.9 && ls <= 0.9) inst.play('Sword_Slash', { once: true, restart: true, speed: 1.4 });
        else if (sw <= 0.05) inst.play(m.moving ? 'Walk' : 'Idle_Sword');
        ls = sw; inst.update(dt);
      };
    } else {
      mesh(new THREE.BoxGeometry(0.9, 1.6, 0.6), mt(0x15121a), 0, 1.4, 0, b);
      mesh(new THREE.SphereGeometry(0.3, 10, 8), mt(0x15121a), 0, 2.45, 0, b);
      r.anim = () => { };
    }
    r.h = 2.6;
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return r;
}
