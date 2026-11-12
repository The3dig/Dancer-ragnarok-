// =====================================================================
//  Efeitos 3D das habilidades. Cada habilidade ganha um "elemento" pelo
//  nome/ícone (luz, sombra, sangue, veneno, raio, terra, vento, cristal,
//  flecha, dança, físico) e cada elemento tem o próprio visual para cada
//  tipo de golpe: corte, explosão em volta, área no alvo, projétil,
//  dreno, investida, buff e cura. Tudo em brilho aditivo, peças 3D
//  (pilares, espinhos, pedras, arcos de corte) e partículas suaves.
// =====================================================================
'use strict';
const VFX = (() => {
  const live = [];                 // efeitos em andamento
  let parts = 0;                   // partículas vivas (limite para não pesar)
  const PMAX = TOUCH ? 260 : 600;
  const ADD = THREE.AdditiveBlending;

  // ---------------- texturas desenhadas
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); return t; };
  const T = {
    glow: tex(64, 64, (g, w) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); }),
    spark: tex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.12, 'rgba(255,255,255,.9)'); r.addColorStop(0.3, 'rgba(255,255,255,.15)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(30, 2, 4, 60); g.fillRect(2, 30, 60, 4); }),
    wave: tex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.62, 'rgba(255,255,255,0)'); r.addColorStop(0.82, 'rgba(255,255,255,1)'); r.addColorStop(0.9, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }),
    beam: tex(16, 128, (g) => { const l = g.createLinearGradient(0, 0, 0, 128); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.35, 'rgba(255,255,255,.7)'); l.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = l; g.fillRect(0, 0, 16, 128); for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.3})`; g.fillRect(Math.random() * 16, Math.random() * 128, 1.5, 10 + Math.random() * 30); } }),
    slash: tex(256, 32, (g) => { const l = g.createLinearGradient(0, 0, 256, 0); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.7, 'rgba(255,255,255,.55)'); l.addColorStop(0.97, 'rgba(255,255,255,1)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, 256, 32); g.globalCompositeOperation = 'destination-in'; const v = g.createLinearGradient(0, 0, 0, 32); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.55, 'rgba(0,0,0,1)'); v.addColorStop(0.8, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(0, 0, 256, 32); }),
    rune: tex(256, 256, (g) => {
      g.translate(128, 128); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 4;
      g.beginPath(); g.arc(0, 0, 120, 0, 6.29); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 104, 0, 6.29); g.stroke(); g.beginPath(); g.arc(0, 0, 60, 0, 6.29); g.stroke();
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; g.beginPath(); g.moveTo(Math.cos(a) * 104, Math.sin(a) * 104); g.lineTo(Math.cos(a + 2.094) * 104, Math.sin(a + 2.094) * 104); g.stroke(); }
      g.font = 'bold 15px serif'; g.textAlign = 'center'; const R = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒ';
      for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; g.save(); g.rotate(a); g.fillText(R[i], 0, -108); g.restore(); }
    }),
    swirl: tex(128, 128, (g) => { g.translate(64, 64); for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); for (let t = 0; t < 1; t += 0.02) { const r = t * 62, a = t * 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 7; g.stroke(); } const r = g.createRadialGradient(0, 0, 0, 0, 0, 64); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.3, 'rgba(255,255,255,.4)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(-64, -64, 128, 128); }),
    smoke: tex(64, 64, (g) => { for (let i = 0; i < 9; i++) { const x = 18 + Math.random() * 28, y = 18 + Math.random() * 28, r = g.createRadialGradient(x, y, 0, x, y, 20); r.addColorStop(0, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); } }),
    plus: tex(64, 64, (g) => { g.shadowColor = '#fff'; g.shadowBlur = 10; g.fillStyle = '#fff'; g.fillRect(26, 10, 12, 44); g.fillRect(10, 26, 44, 12); }),
    note: tex(64, 64, (g) => { g.fillStyle = '#fff'; g.font = 'bold 50px serif'; g.textAlign = 'center'; g.fillText('♫', 32, 50); }),
    feather: tex(32, 96, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(16, 48, 9, 44, 0, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(16, 4); g.lineTo(16, 92); g.stroke(); }),
  };
  T.beam.wrapT = THREE.RepeatWrapping;

  // ---------------- geometrias reutilizadas
  const G = {
    plane: (() => { const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); return g; })(),
    vplane: new THREE.PlaneGeometry(1, 1),
    pillar: new THREE.CylinderGeometry(1, 1, 1, 24, 1, true).translate(0, 0.5, 0),
    cone: new THREE.ConeGeometry(0.32, 1, 6).translate(0, 0.5, 0),
    shard: new THREE.OctahedronGeometry(0.28, 0),
    rock: new THREE.DodecahedronGeometry(0.5, 0),
    arrow: new THREE.BoxGeometry(0.05, 0.05, 1.0),
    seg: new THREE.CylinderGeometry(0.05, 0.05, 1, 5, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5),
    tornado: new THREE.CylinderGeometry(1.6, 0.35, 1, 20, 1, true).translate(0, 0.5, 0),
  };
  // arco de corte em 3D (u ao longo do arco: a ponta brilha, a cauda some)
  function arcGeo(r1, r2, span) {
    const segs = 24, pos = [], uv = [], idx = [];
    for (let i = 0; i <= segs; i++) { const u = i / segs, a = -span / 2 + span * u; for (const [r, v] of [[r1, 0], [r2, 1]]) { pos.push(Math.sin(a) * r, 0, Math.cos(a) * r); uv.push(u, v); } }
    for (let i = 0; i < segs; i++) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
  }
  const ARC = arcGeo(0.9, 2.3, Math.PI * 1.1), ARC_BIG = arcGeo(1.2, 3.4, Math.PI * 1.3);

  const mat = (map, color, o = {}) => new THREE.MeshBasicMaterial({ map, color, transparent: true, blending: ADD, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false, ...o });
  const smat = (map, color, o = {}) => new THREE.SpriteMaterial({ map, color, transparent: true, blending: ADD, depthWrite: false, toneMapped: false, fog: false, ...o });
  const add = (obj, life, upd, done) => { scene.add(obj); live.push({ obj, t: 0, life, upd, done }); return obj; };
  const C = c => new THREE.Color(c);

  // ---------------- peças básicas
  function particle(pos, color, o = {}) {
    if (parts >= PMAX) return;
    parts++;
    const s = new THREE.Sprite(smat(o.map || T.glow, color, { opacity: o.op ?? 1 }));
    s.position.copy(pos); const sz = o.size ?? 0.35; s.scale.setScalar(sz);
    const v = o.v || new THREE.Vector3(rand(-1, 1), rand(0.5, 2), rand(-1, 1)).multiplyScalar(o.speed ?? 2);
    const gr = o.g ?? 0, drag = o.drag ?? 1.5, grow = o.grow ?? 0, spin = o.spin ? rand(-4, 4) : 0;
    add(s, o.life ?? rand(0.4, 0.8), (k, dt) => {
      v.y -= gr * dt; v.multiplyScalar(Math.max(0, 1 - drag * dt)); s.position.addScaledVector(v, dt);
      s.scale.setScalar(sz * (1 + grow * k) * (o.shrink ? 1 - k * 0.8 : 1)); s.material.opacity = (o.op ?? 1) * (1 - k) * (k < 0.1 ? k * 10 : 1);
      if (spin) s.material.rotation += spin * dt;
    }, () => { parts--; });
  }
  function puff(pos, color, n, o = {}) { for (let i = 0; i < n; i++) particle(pos, color, o); }
  function flash(pos, color, size = 2.5, life = 0.25) {
    const s = new THREE.Sprite(smat(T.glow, color)); s.position.copy(pos); s.scale.setScalar(size * 0.4);
    add(s, life, k => { s.scale.setScalar(size * (0.4 + k * 0.8)); s.material.opacity = 1 - k; });
    const c = new THREE.Sprite(smat(T.spark, 0xffffff)); c.position.copy(pos); c.scale.setScalar(size * 0.6); c.material.rotation = rand(0, 3);
    add(c, life * 0.8, k => { c.scale.setScalar(size * (0.6 + k * 0.4)); c.material.opacity = 1 - k; });
  }
  function wave(x, z, r, color, life = 0.5, y) {
    const m = new THREE.Mesh(G.plane, mat(T.wave, color)); m.position.set(x, (y ?? groundY(x, z)) + 0.12, z);
    add(m, life, k => { const s = r * 2 * (0.15 + Math.sqrt(k) * 0.85); m.scale.set(s, 1, s); m.material.opacity = 1 - k * k; });
  }
  function rune(x, z, r, color, life = 1, follow) {
    const m = new THREE.Mesh(G.plane, mat(T.rune, color)); m.position.set(x, groundY(x, z) + 0.08, z);
    add(m, life, (k, dt) => { if (follow) m.position.set(P.x, P.y + 0.08, P.z); m.rotation.y += dt * 1.2; const s = r * 2 * Math.min(1, k * 5); m.scale.set(s, 1, s); m.material.opacity = Math.min(1, (1 - k) * 3); });
  }
  function pillar(x, z, r, h, color, life = 0.7, follow, op = 1) {
    const m = new THREE.Mesh(G.pillar, mat(T.beam, color)); m.position.set(x, groundY(x, z), z);
    add(m, life, (k, dt) => { if (follow) m.position.set(P.x, P.y, P.z); const w = r * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) * 0.9); m.scale.set(w, h, w); m.material.map.offset.y -= dt * 2; m.material.opacity = op * (1 - k); });
  }
  function spikes(x, z, n, r, color, kind, life = 0.9, h = 1.6) {
    const M = kind === 'rocha' ? PM('rocha_clara.jpg', [1, 1], new THREE.Color(1.5, 1.4, 1.25)) : new THREE.MeshPhongMaterial({ color, emissive: C(color).multiplyScalar(0.45), shininess: 80, transparent: true, opacity: 0.92 });
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), d = n === 1 ? 0 : rand(0.4, r), sx = x + Math.cos(a) * d, sz = z + Math.sin(a) * d, hh = h * rand(0.6, 1.2);
      const m = new THREE.Mesh(G.cone, M); m.position.set(sx, groundY(sx, sz) - 0.1, sz); m.rotation.set(rand(-0.35, 0.35), rand(0, TAU), rand(-0.35, 0.35)); m.castShadow = false;
      const delay = rand(0, 0.12);
      const e2 = add(m, life, k => { const e = Math.max(0, k - delay / life); const g = e < 0.15 ? e / 0.15 : e > 0.7 ? 1 - (e - 0.7) / 0.3 : 1; m.scale.set(1 + hh * 0.3, Math.max(0.001, hh * g), 1 + hh * 0.3); });
      live[live.length - 1].keepMat = true; if (i === n - 1) live[live.length - 1].done = () => M.dispose();
    }
    puff(new THREE.Vector3(x, groundY(x, z) + 0.3, z), kind === 'rocha' ? 0x8a7a68 : color, 8, { map: T.smoke, size: 1.2, grow: 1.5, speed: 2, op: 0.5 });
  }
  // raio em zigue-zague (de cima ou entre dois pontos)
  function bolt(from, to, color, life = 0.35, width = 1) {
    const g = new THREE.Group(), pts = [from.clone()], n = 7;
    for (let i = 1; i < n; i++) { const p = from.clone().lerp(to, i / n); p.x += rand(-0.6, 0.6); p.y += rand(-0.4, 0.4); p.z += rand(-0.6, 0.6); pts.push(p); }
    pts.push(to.clone());
    const mm = mat(null, color), core = mat(null, 0xffffff);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = a.distanceTo(b);
      for (const [m, w] of [[mm, 2.6 * width], [core, 1 * width]]) { const s = new THREE.Mesh(G.seg, m); s.position.copy(a); s.lookAt(b); s.scale.set(w, w, len); g.add(s); }
    }
    add(g, life, k => { mm.opacity = (1 - k) * (Math.random() < 0.3 ? 0.4 : 1); core.opacity = 1 - k; }, () => { mm.dispose(); core.dispose(); });
    flash(to, color, 2.4, 0.3);
  }
  // corte: arco colorido varrendo na frente do personagem, com um núcleo branco
  function arc(color, big, tilt = rand(-0.5, 0.5), dir = 1) {
    const geo = big ? ARC_BIG : ARC, g = new THREE.Group();
    const m = new THREE.Mesh(geo, mat(T.slash, color)), w = new THREE.Mesh(geo, mat(T.slash, 0xffffff)); g.add(m); g.add(w);
    g.position.set(P.x, P.y + 1.05, P.z); g.rotation.set(0, P.face, tilt);
    add(g, 0.26, k => {
      g.position.set(P.x, P.y + 1.05, P.z);
      const s = 1 + k * 0.25, ry = (-0.9 + k * 1.8) * dir, op = k < 0.2 ? 1 : 1 - (k - 0.2) / 0.8;
      m.rotation.y = ry; m.scale.set(s * dir, s, s); m.material.opacity = op;
      w.rotation.y = ry; w.scale.set(s * 0.96 * dir, s, s * 0.96); w.material.opacity = op * 0.7;
    }, () => { m.material.dispose(); w.material.dispose(); });
  }
  const ZV = new THREE.Vector3(0, 0, 1);
  function projectile(from, tgt, color, style, onHit, speed = 22) {
    const g = new THREE.Group(); g.position.copy(from);
    let body = null;
    if (style === 'flecha') { body = new THREE.Mesh(G.arrow, new THREE.MeshBasicMaterial({ color: 0xe8dcc0 })); g.add(body); }
    else if (style === 'cristal') { body = new THREE.Mesh(G.shard, new THREE.MeshPhongMaterial({ color, emissive: C(color).multiplyScalar(0.6), shininess: 100 })); g.add(body); }
    else if (style === 'sombra') { body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0x08000c })); g.add(body); }
    const halo = new THREE.Sprite(smat(T.glow, color)); halo.scale.setScalar(style === 'flecha' ? 0.5 : style === 'sombra' ? 1.3 : 1.0); g.add(halo);
    if (style !== 'flecha') { const c = new THREE.Sprite(smat(T.spark, 0xffffff)); c.scale.setScalar(0.6); g.add(c); }
    let done = false, trailT = 0;
    const tp = new THREE.Vector3(), dir = new THREE.Vector3();
    add(g, 3, (k, dt) => {
      if (done) return;
      if (!tgt || tgt.dead) { done = true; return; }
      tp.set(tgt.x, groundY(tgt.x, tgt.z) + Math.min(tgt.model.h * 0.5, 3), tgt.z);
      dir.subVectors(tp, g.position); const d = dir.length();
      if (d < 0.6) { done = true; onHit && onHit(tgt); impact(tp, color, style); return; }
      dir.multiplyScalar(1 / d); g.position.addScaledVector(dir, Math.min(d, speed * dt));
      if (body) { if (style === 'flecha') body.quaternion.setFromUnitVectors(ZV, dir); else { body.rotation.x += dt * 9; body.rotation.y += dt * 7; } }
      halo.material.rotation += dt * 6;
      if ((trailT -= dt) <= 0) { trailT = 0.025; particle(g.position, color, { size: style === 'flecha' ? 0.18 : 0.42, speed: 0.3, life: 0.35, shrink: true, op: 0.8 }); if (style === 'sombra') particle(g.position, 0x6a20a0, { map: T.smoke, size: 0.7, speed: 0.6, life: 0.5, op: 0.6 }); }
    }, () => { g.traverse(o => { if (o.material) o.material.dispose(); }); });
    live[live.length - 1].alive = () => !done;
  }
  function impact(p, color, style) {
    flash(p, color, style === 'flecha' ? 1.2 : 2.2, 0.25);
    puff(p, color, style === 'flecha' ? 4 : 10, { map: T.spark, size: 0.3, speed: 5, g: 6, life: 0.45, spin: true });
  }

  // ---------------- elemento de cada habilidade
  const RX = [
    ['luz', /sagrad|luz|fé|bênç|divin|santu|julgam|dourad|aurora|radiant|prisma|purific|promessa|muralha|auren|✝|☀|🌟|✨|💛|🔆|🌅/i],
    ['sangue', /sangu|drenar|absorver|vorazes|fúria|massacre|🩸|😡/i],
    ['veneno', /venen|praga|pútrid|☠|☣|🦠|areia nos olhos/i],
    ['raio', /elétric|trovej|sobrecarga|raio(?! sagrado| da essência)|bigorna|⚡|🌩|🔋|🗼/i],
    ['terra', /pedra|avalanche|esmag|terremoto|🪨|🗿|bruta|pesado|martelada atordoante/i],
    ['vento', /brisa|redemoinho|giratório|tempestade de lâminas|espíritos|🌀|🍃|🌪|🪶/i],
    ['cristal', /memória|lembrança|cristal|espelho|prisão|💙|🦋|🪞|🔷/i],
    ['flecha', /flecha|tiro|🏹|➹|falcão|setas/i],
    ['danca', /encantador|finale|dança|chicote/i],
    ['espinho', /espinho/i],
    ['sombra', /sombr|abismo|vazio|eclipse|pacto|maldiç|esfera|fome|portal|apagar|essência|entre|escolha|possibilidades|voltem|🌑|🔮|🕳|⚫|🟣|🌘|⛓/i],
    ['vida', /cura|abraço|eco da vida|💖|🤍|💗|🙏/i],
  ];
  const cache = {};
  function elem(s) {
    if (cache[s.id + s.name]) return cache[s.id + s.name];
    const t = s.name + ' ' + (s.icon || '') + ' ' + (s.desc || '');
    let e = 'fisico';
    for (const src of [s.name, s.icon || '', t]) { for (const [k, rx] of RX) if (rx.test(src)) { e = k; break; } if (e !== 'fisico') break; }
    return (cache[s.id + s.name] = e);
  }
  const at = (m, up = 0.5) => new THREE.Vector3(m.x, groundY(m.x, m.z) + Math.min(m.model.h * up, 3.2), m.z);
  const me = (up = 1) => new THREE.Vector3(P.x, P.y + up, P.z);

  // ---------------- por tipo de habilidade
  function strike(s, tgt) {
    const e = elem(s), c = s.color, p = at(tgt);
    const n = Math.min(3, s.hits || 1);
    for (let i = 0; i < n; i++) setTimeout(() => arc(c, s.mult >= 2.5, i % 2 ? 0.6 : -0.5, i % 2 ? -1 : 1), i * 90);
    setTimeout(() => {
      flash(p, c, 2.6);
      if (e === 'raio') bolt(p.clone().add(new THREE.Vector3(rand(-1, 1), 9, rand(-1, 1))), p, 0xbfe4ff, 0.35);
      else if (e === 'luz') { pillar(tgt.x, tgt.z, 0.9, 6, 0xffe8a0, 0.5); wave(tgt.x, tgt.z, 2.2, 0xffd060, 0.4); }
      else if (e === 'terra') { spikes(tgt.x, tgt.z, 5, 1.6, 0xb0a090, 'rocha', 0.8, 1.2); wave(tgt.x, tgt.z, 2.6, 0xc0a070, 0.4); }
      else if (e === 'sombra' || e === 'sangue') puff(p, e === 'sangue' ? 0xc01020 : 0x7a30c0, 14, { map: T.spark, size: 0.35, speed: 6, g: 4, life: 0.5, spin: true });
      else puff(p, c, 10, { map: T.spark, size: 0.3, speed: 6, g: 5, life: 0.45, spin: true });
      if (s.plunder || s.steal) puff(p, 0xffcf40, 8, { map: T.spark, size: 0.25, speed: 4, g: 7 });
    }, 70);
  }
  function nova(s) {
    const e = elem(s), c = s.color, r = s.r || 4, x = P.x, z = P.z;
    wave(x, z, r, c, 0.55); setTimeout(() => wave(x, z, r * 0.7, 0xffffff, 0.4), 80);
    flash(me(1), c, 3, 0.3);
    if (e === 'vento' || /redemoinho|giratório|tempestade/i.test(s.name)) {
      const m = new THREE.Mesh(G.tornado, mat(T.beam, c)); m.position.set(x, groundY(x, z), z);
      add(m, 0.8, (k, dt) => { m.position.set(P.x, P.y, P.z); m.rotation.y += dt * 14; const w = r * 0.45 * Math.min(1, k * 4); m.scale.set(w, 3.2 * Math.min(1, k * 3), w); m.material.opacity = (1 - k) * 0.42; m.material.map.offset.y -= dt * 3; });
      for (let i = 0; i < 3; i++) setTimeout(() => arc(c, true, rand(-0.3, 0.3), i % 2 ? 1 : -1), i * 80);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; particle(new THREE.Vector3(x + Math.cos(a) * r * 0.6, groundY(x, z) + 0.4, z + Math.sin(a) * r * 0.6), c, { v: new THREE.Vector3(-Math.sin(a) * 6, 3, Math.cos(a) * 6), size: 0.35, life: 0.6, drag: 1 }); }
    } else if (e === 'luz') {
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, px = x + Math.cos(a) * r * 0.7, pz = z + Math.sin(a) * r * 0.7; setTimeout(() => pillar(px, pz, 0.55, 7, 0xffe8a0, 0.6), i * 40); }
      rune(x, z, r * 0.8, 0xffd870, 0.9);
    } else if (e === 'terra' || /bigorna/i.test(s.name)) {
      spikes(x, z, 12, r, 0xb0a090, 'rocha', 1.0, 1.6);
      if (/bigorna/i.test(s.name)) for (let i = 0; i < 6; i++) setTimeout(() => meteor(x + rand(-r, r) * 0.7, z + rand(-r, r) * 0.7, 0x808890, 0.6), i * 70);
    } else if (e === 'sangue' || e === 'espinho') {
      spikes(x, z, 14, r, e === 'sangue' ? 0x8a0a14 : 0x2a1020, 'cristal', 0.9, 1.9);
    } else if (e === 'cristal') {
      spikes(x, z, 12, r, 0x8ad8ff, 'cristal', 1.1, 1.7);
    } else if (e === 'sombra') {
      dome(x, z, r, 0x6a20b0);
    } else if (e === 'danca') {
      for (let i = 0; i < 10; i++) particle(me(1.6), [0xff4fa3, 0xffcf40, 0x4fd1ff][i % 3], { map: T.note, size: 0.6, speed: 3.5, g: -1, life: 1.0, op: 1 });
      for (let i = 0; i < 2; i++) setTimeout(() => arc(c, true, rand(-0.3, 0.3), i ? -1 : 1), i * 100);
    } else if (e === 'raio') {
      for (let i = 0; i < 5; i++) setTimeout(() => { const a = rand(0, TAU), d = rand(1, r), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, gy = groundY(px, pz); bolt(new THREE.Vector3(px + rand(-1, 1), gy + 9, pz), new THREE.Vector3(px, gy + 0.2, pz), 0xbfe4ff, 0.3); }, i * 70);
    } else if (e === 'vida') {
      heal(s, true);
    } else {
      puff(new THREE.Vector3(x, groundY(x, z) + 0.3, z), 0xb8a890, 14, { map: T.smoke, size: 1.4, grow: 1.6, speed: 5, drag: 3, op: 0.45 });
      for (let i = 0; i < 2; i++) setTimeout(() => arc(c, true, rand(-0.3, 0.3), i ? -1 : 1), i * 90);
    }
  }
  function dome(x, z, r, color) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, TAU, 0, Math.PI / 2), mat(T.swirl, color)); m.position.set(x, groundY(x, z), z);
    add(m, 0.7, (k, dt) => { const s = r * Math.sqrt(k); m.scale.set(s, s * 0.8, s); m.rotation.y += dt * 4; m.material.opacity = (1 - k) * 0.9; }, () => m.geometry.dispose());
    puff(new THREE.Vector3(x, groundY(x, z) + 0.5, z), 0x3a0a5a, 12, { map: T.smoke, size: 1.4, grow: 1.5, speed: 4, op: 0.5 });
  }
  function meteor(x, z, color, size = 1) {
    const gy = groundY(x, z), m = new THREE.Mesh(G.rock, PM('rocha_clara.jpg', [1, 1], color)); m.scale.setScalar(size);
    const sx = x + rand(-3, 3), sy = gy + 12, sz = z + rand(-3, 3); m.position.set(sx, sy, sz);
    add(m, 0.45, (k, dt) => { m.position.set(sx + (x - sx) * k, sy + (gy + 0.3 - sy) * k * k, sz + (z - sz) * k); m.rotation.x += dt * 8; m.rotation.z += dt * 6; if (Math.random() < 0.6) particle(m.position, 0xffa050, { size: 0.5, speed: 0.4, life: 0.3 }); },
      () => { m.material.dispose(); wave(x, z, 2.2 * size, 0xd0a070, 0.4); puff(new THREE.Vector3(x, gy + 0.3, z), 0x9a8a78, 8, { map: T.smoke, size: 1.2, grow: 1.5, speed: 4, op: 0.5 }); flash(new THREE.Vector3(x, gy + 0.5, z), 0xffb060, 2, 0.2); });
  }
  function blast(s, tgt) {
    const e = elem(s), c = s.color, r = s.r || 3, x = tgt.x, z = tgt.z, gy = groundY(x, z), p = new THREE.Vector3(x, gy + 0.6, z);
    rune(x, z, r, c, 0.9);
    if (e === 'luz') { setTimeout(() => { pillar(x, z, r * 0.6, 14, 0xffe8a0, 0.8); pillar(x, z, r * 0.3, 14, 0xffffff, 0.6); wave(x, z, r * 1.2, 0xffd060, 0.6); flash(p, 0xffe8a0, 4, 0.35); }, 120); }
    else if (e === 'sombra') {
      const m = new THREE.Mesh(G.plane, mat(T.swirl, c)); m.position.set(x, gy + 0.2, z);
      add(m, 0.9, (k, dt) => { m.rotation.y -= dt * 9; const s2 = r * 2.2 * (k < 0.6 ? k / 0.6 : 1 - (k - 0.6) / 0.4 * 0.9); m.scale.set(s2, 1, s2); m.material.opacity = 1 - k * 0.6; });
      for (let i = 0; i < 18; i++) { const a = rand(0, TAU), d = r * 1.2; particle(new THREE.Vector3(x + Math.cos(a) * d, gy + rand(0.2, 2), z + Math.sin(a) * d), 0x9a50ff, { v: new THREE.Vector3(-Math.cos(a) * d * 1.6, 0, -Math.sin(a) * d * 1.6), drag: 0, life: 0.6, size: 0.3 }); }
      setTimeout(() => { flash(p, 0xb070ff, 3.5, 0.3); puff(p, 0x2a0040, 10, { map: T.smoke, size: 1.4, grow: 1.6, speed: 5, op: 0.6 }); }, 550);
    }
    else if (e === 'raio') for (let i = 0; i < 6; i++) setTimeout(() => { const px = x + rand(-r, r) * 0.6, pz = z + rand(-r, r) * 0.6, g2 = groundY(px, pz); bolt(new THREE.Vector3(px, g2 + 12, pz), new THREE.Vector3(px, g2 + 0.2, pz), 0xbfe4ff, 0.3, 1.3); }, i * 60);
    else if (e === 'terra') for (let i = 0; i < 5; i++) setTimeout(() => meteor(x + rand(-r, r) * 0.6, z + rand(-r, r) * 0.6, 0xa09080, rand(0.8, 1.4)), i * 90);
    else if (e === 'flecha') for (let i = 0; i < 18; i++) setTimeout(() => { const px = x + rand(-r, r), pz = z + rand(-r, r), g2 = groundY(px, pz); const a = new THREE.Mesh(G.arrow, new THREE.MeshBasicMaterial({ color: 0xe8dcc0 })); a.position.set(px - 2, g2 + 9, pz - 1); a.lookAt(px, g2, pz); const from = a.position.clone();
        add(a, 0.3, k => { a.position.lerpVectors(from, new THREE.Vector3(px, g2 + 0.3, pz), k); }, () => { a.material.dispose(); puff(new THREE.Vector3(px, g2 + 0.2, pz), 0xc8b090, 3, { map: T.smoke, size: 0.6, speed: 2, op: 0.4 }); }); }, i * 40);
    else if (e === 'veneno') { for (let i = 0; i < 16; i++) particle(new THREE.Vector3(x + rand(-r, r) * 0.6, gy + 0.5, z + rand(-r, r) * 0.6), 0x60e040, { map: T.smoke, size: 1.6, grow: 1.2, speed: 0.8, g: -0.6, life: rand(1.2, 1.8), op: 0.55 }); flash(p, 0x80ff60, 2.5, 0.3); }
    else if (e === 'cristal') { spikes(x, z, 9, r, 0x8ad8ff, 'cristal', 1.0, 2.2); flash(p, 0xbfe8ff, 3, 0.3); }
    else if (e === 'espinho' || e === 'sangue') spikes(x, z, 10, r, e === 'sangue' ? 0x8a0a14 : 0x1a0a1a, 'cristal', 0.9, 2.4);
    else { setTimeout(() => { flash(p, c, 3.5, 0.35); wave(x, z, r * 1.2, c, 0.5); puff(p, c, 16, { map: T.spark, size: 0.35, speed: 7, g: 6, life: 0.6, spin: true }); }, 100); }
    if (e !== 'luz' && e !== 'sombra') setTimeout(() => wave(x, z, r, 0xffffff, 0.35), 160);
  }
  const styleOf = s => { const e = elem(s); return e === 'flecha' ? 'flecha' : e === 'cristal' ? 'cristal' : e === 'sombra' ? 'sombra' : e; };
  function shoot(s, from, tgt, onHit) {
    const e = elem(s);
    if (e === 'raio') { bolt(from, at(tgt), 0xbfe4ff, 0.3); onHit && onHit(tgt); return; }
    projectile(from, tgt, s.color, styleOf(s), onHit, e === 'flecha' ? 34 : 22);
  }
  function drain(s, tgt) {
    const from = at(tgt), col = elem(s) === 'sombra' ? 0x9a50ff : 0xd01828;
    for (let i = 0; i < 14; i++) setTimeout(() => {
      const st = from.clone().add(new THREE.Vector3(rand(-0.5, 0.5), rand(-0.3, 0.6), rand(-0.5, 0.5)));
      const sp = new THREE.Sprite(smat(T.glow, col)); sp.position.copy(st); sp.scale.setScalar(0.4);
      const ph = rand(0, TAU);
      add(sp, 0.55, k => { const to = me(1.1); sp.position.lerpVectors(st, to, k * k); sp.position.x += Math.sin(k * 9 + ph) * 0.4 * (1 - k); sp.position.y += Math.cos(k * 9 + ph) * 0.4 * (1 - k); sp.material.opacity = 1 - k * 0.5; });
    }, i * 30);
    setTimeout(() => flash(me(1.1), col, 2, 0.3), 450);
  }
  function dash(s, x0, z0) {
    const c = s.color, x1 = P.x, z1 = P.z, d = Math.hypot(x1 - x0, z1 - z0), steps = Math.max(2, Math.round(d / 0.8));
    for (let i = 0; i <= steps; i++) { const k = i / steps, px = x0 + (x1 - x0) * k, pz = z0 + (z1 - z0) * k; particle(new THREE.Vector3(px, groundY(px, pz) + 1, pz), c, { size: 1.2, speed: 0.2, life: 0.35 + k * 0.2, op: 0.5 }); puff(new THREE.Vector3(px, groundY(px, pz) + 0.2, pz), 0xb8a890, 1, { map: T.smoke, size: 0.8, speed: 1, op: 0.35 }); }
    arc(c, true, 0, 1); flash(me(1), c, 2.4, 0.25);
  }
  function buff(s) {
    const e = elem(s), c = s.color;
    rune(P.x, P.z, 1.8, c, 1.2, true); pillar(P.x, P.z, 0.9, 3.5, c, 0.9, true, 0.35);
    const ic = e === 'vento' ? T.feather : e === 'danca' ? T.note : T.spark;
    for (let i = 0; i < 18; i++) { const a = rand(0, TAU); particle(new THREE.Vector3(P.x + Math.cos(a) * 1.1, P.y + rand(0, 0.6), P.z + Math.sin(a) * 1.1), c, { map: ic, size: e === 'vento' ? 0.35 : 0.3, v: new THREE.Vector3(0, rand(2, 4), 0), drag: 0.8, life: rand(0.7, 1.1), spin: true }); }
    if (e === 'sangue') puff(me(1), 0xa00010, 10, { map: T.smoke, size: 1.2, grow: 1.4, speed: 2, op: 0.5 });
    if (e === 'terra' || /pele de pedra|escudo|barreira|muralha|promessa/i.test(s.name)) { const sh = new THREE.Mesh(new THREE.SphereGeometry(1.3, 20, 14), mat(T.wave, c)); add(sh, 0.9, k => { sh.position.set(P.x, P.y + 1, P.z); const q = 0.6 + k * 0.6; sh.scale.set(q, q * 1.15, q); sh.material.opacity = 1 - k; }, () => sh.geometry.dispose()); }
  }
  function heal(s, area) {
    const c = elem(s) === 'luz' ? 0xffe8a0 : 0x7dffb0;
    pillar(P.x, P.z, 0.9, 5, c, 1.0, true, 0.45); rune(P.x, P.z, area ? (s.r || 3) : 1.6, c, 1.1, true);
    for (let i = 0; i < 12; i++) particle(new THREE.Vector3(P.x + rand(-1, 1), P.y + rand(0, 1), P.z + rand(-1, 1)), c, { map: T.plus, size: 0.35, v: new THREE.Vector3(0, rand(1.5, 3), 0), drag: 0.5, life: rand(0.8, 1.2) });
  }
  function summon(s) { rune(P.x + Math.sin(P.face) * 1.5, P.z + Math.cos(P.face) * 1.5, 1.6, 0x7a30c0, 1.2); puff(me(0.5), 0x2a0a3a, 12, { map: T.smoke, size: 1.4, grow: 1.4, speed: 2, op: 0.55 }); }

  function update(dt) {
    for (let i = live.length - 1; i >= 0; i--) {
      const f = live[i]; f.t += dt; const k = Math.min(1, f.t / f.life);
      f.upd && f.upd(k, dt);
      const over = f.alive ? !f.alive() || f.t >= f.life : f.t >= f.life;
      if (over) { scene.remove(f.obj); if (f.obj.material && f.obj.material.dispose && !f.keepMat) f.obj.material.dispose(); f.done && f.done(); live.splice(i, 1); }
    }
  }
  // ataque básico à distância: flecha (arqueiros) ou orbe de magia com rastro
  function basic(c, from, tgt, onHit) { projectile(from, tgt, c.proj || 0xffffff, c.magic ? 'orbe' : 'flecha', onHit, c.magic ? 24 : 34); }
  // prepara todos os tipos de efeito uma vez (o iPhone engasga na 1ª vez que monta cada um)
  function warm() {
    const g = new THREE.Group(); g.position.set(P.x, P.y - 40, P.z);
    const parts2 = [
      new THREE.Sprite(smat(T.glow, 0xffffff)), new THREE.Sprite(smat(T.spark, 0xffffff)), new THREE.Sprite(smat(T.smoke, 0xffffff)), new THREE.Sprite(smat(T.plus, 0xffffff)), new THREE.Sprite(smat(T.note, 0xffffff)), new THREE.Sprite(smat(T.feather, 0xffffff)),
      new THREE.Mesh(G.plane, mat(T.wave, 0xffffff)), new THREE.Mesh(G.plane, mat(T.rune, 0xffffff)), new THREE.Mesh(G.plane, mat(T.swirl, 0xffffff)), new THREE.Mesh(G.pillar, mat(T.beam, 0xffffff)), new THREE.Mesh(G.tornado, mat(T.beam, 0xffffff)),
      new THREE.Mesh(ARC, mat(T.slash, 0xffffff)), new THREE.Mesh(G.seg, mat(null, 0xffffff)), new THREE.Mesh(G.cone, new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x333333, shininess: 80, transparent: true, opacity: 0.92 })),
      new THREE.Mesh(G.rock, PM('rocha_clara.jpg', [1, 1], 0xffffff)), new THREE.Mesh(G.arrow, new THREE.MeshBasicMaterial({ color: 0xe8dcc0 })), new THREE.Mesh(G.shard, new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x333333, shininess: 100 })),
    ];
    parts2.forEach(o => g.add(o)); scene.add(g);
    try { renderer.compile(scene, camera); } catch (e) { }
    scene.remove(g);
  }
  return { particle, T, warm, basic, projectile, strike, nova, blast, shoot, drain, dash, buff, heal, summon, arc, flash, wave, update, elem };
})();
