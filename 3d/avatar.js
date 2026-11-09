// =====================================================================
//  Gerador de personagens 3D (raça + corpo + classe)
// =====================================================================
'use strict';

function gear(ctx) {
  const { look, C, head, body, L, T, GLOW, metal, wood, trim, accent, cloth, hair } = ctx;
  const add = (geo, mat, x, y, z, parent) => mesh(geo, mat, x, y, z, parent);
  // ---------------- chapéus
  switch (C.hat) {
    case 'flower':
      for (let k = 0; k < 5; k++) add(new THREE.SphereGeometry(0.03, 6, 4), T(0xfff4a8), -0.12 + Math.cos(k * TAU / 5) * 0.035, 0.15 + Math.sin(k * TAU / 5) * 0.035, 0.05, head);
      add(new THREE.SphereGeometry(0.022, 6, 4), accent, -0.12, 0.15, 0.06, head); break;
    case 'feather': {
      add(new THREE.TorusGeometry(0.185, 0.02, 4, 18), trim, 0, 0.06, 0, head).rotation.x = Math.PI / 2;
      const f = add(new THREE.ConeGeometry(0.03, 0.3, 5), T(0xe84a3a), 0.15, 0.18, -0.05, head); f.rotation.z = -0.5; break;
    }
    case 'helm':
      add(new THREE.SphereGeometry(0.2, 12, 8, 0, TAU, 0, Math.PI / 2), metal, 0, 0.02, 0, head);
      add(new THREE.BoxGeometry(0.03, 0.12, 0.3), accent, 0, 0.21, -0.02, head);
      add(new THREE.BoxGeometry(0.02, 0.07, 0.02), metal, 0, 0.03, 0.19, head); break;
    case 'circlet':
      add(new THREE.TorusGeometry(0.18, 0.018, 4, 18), trim, 0, 0.07, 0, head).rotation.x = Math.PI / 2;
      add(new THREE.OctahedronGeometry(0.035), GLOW(C.colors.accent), 0, 0.08, 0.18, head); break;
    case 'mitre': {
      const m = add(new THREE.ConeGeometry(0.15, 0.36, 4), T(0xffffff), 0, 0.28, 0, head); m.rotation.y = Math.PI / 4;
      add(new THREE.BoxGeometry(0.03, 0.18, 0.02), trim, 0, 0.27, 0.11, head); break;
    }
    case 'hood':
      add(new THREE.SphereGeometry(0.215, 14, 10, 0, TAU, 0, Math.PI * 0.62), cloth, 0, 0.02, -0.03, head);
      add(new THREE.ConeGeometry(0.1, 0.25, 8), cloth, 0, 0.0, -0.2, head).rotation.x = -1.9; break;
    case 'bandana':
      add(new THREE.TorusGeometry(0.18, 0.035, 5, 18), trim, 0, 0.08, 0, head).rotation.x = Math.PI / 2 - 0.2;
      add(new THREE.ConeGeometry(0.04, 0.18, 4), trim, 0, 0.06, -0.22, head).rotation.x = -2.2; break;
    case 'wizard': {
      add(new THREE.CylinderGeometry(0.34, 0.34, 0.025, 20), cloth, 0, 0.1, 0, head);
      const c = add(new THREE.ConeGeometry(0.18, 0.5, 12), cloth, 0, 0.36, -0.02, head); c.rotation.x = -0.25;
      add(new THREE.TorusGeometry(0.17, 0.025, 4, 16), trim, 0, 0.14, 0, head).rotation.x = Math.PI / 2; break;
    }
    case 'goggles':
      add(new THREE.TorusGeometry(0.18, 0.025, 4, 18), T(0x5a3a1a), 0, 0.09, 0, head).rotation.x = Math.PI / 2;
      [-0.07, 0.07].forEach(x => add(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10), GLOW(C.colors.accent), x, 0.12, 0.15, head).rotation.x = Math.PI / 2 - 0.4); break;
  }

  // ---------------- armas
  L.ribbon = C.weapon === 'ribbon';
  const inR = new THREE.Group(); L.handR.add(inR);
  const inL = new THREE.Group(); L.handL.add(inL);
  switch (C.weapon) {
    case 'bow': {
      const bow = add(new THREE.TorusGeometry(0.42, 0.022, 6, 20, Math.PI), wood, 0, 0, 0, inL);
      bow.rotation.set(0, Math.PI / 2, 0);
      add(new THREE.CylinderGeometry(0.004, 0.004, 0.84, 3), T(0xffffff), 0, 0, 0, inL);
      const q = add(new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8), T(0x6b4423), 0.12, 1.15, -0.2, body); q.rotation.z = 0.4;
      break;
    }
    case 'sword': {
      const g = new THREE.Group(); g.rotation.x = Math.PI / 2; inR.add(g);
      add(new THREE.BoxGeometry(0.06, 0.95, 0.02), metal, 0, 0.55, 0, g);
      add(new THREE.BoxGeometry(0.24, 0.04, 0.05), T(C.colors.accent), 0, 0.07, 0, g);
      add(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 6), T(0x4a3020), 0, -0.03, 0, g);
      break;
    }
    case 'mace': {
      const g = new THREE.Group(); g.rotation.x = Math.PI / 2; inR.add(g);
      add(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6), wood, 0, 0.25, 0, g);
      add(new THREE.DodecahedronGeometry(0.1), T(C.colors.trim), 0, 0.58, 0, g);
      const sh = add(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 16), T(C.colors.accent), 0.05, 0.1, 0, inL); sh.rotation.z = Math.PI / 2;
      add(new THREE.TorusGeometry(0.26, 0.02, 4, 18), T(C.colors.trim), 0.08, 0.1, 0, inL).rotation.y = Math.PI / 2;
      add(new THREE.BoxGeometry(0.02, 0.3, 0.06), T(C.colors.trim), 0.09, 0.1, 0, inL);
      break;
    }
    case 'staff': {
      const g = new THREE.Group(); g.rotation.x = Math.PI / 2; inR.add(g);
      add(new THREE.CylinderGeometry(0.025, 0.03, 1.6, 6), look.cls === 'necromante' ? T(0x3a3028) : wood, 0, 0.3, 0, g);
      if (C.totem) {
        add(new THREE.SphereGeometry(0.09, 10, 8), T(0xe8dcc0), 0, 1.15, 0, g);
        [-1, 1].forEach(sd => { const h = add(new THREE.ConeGeometry(0.025, 0.16, 5), T(0xe8dcc0), sd * 0.09, 1.2, 0, g); h.rotation.z = -sd * 1.1; });
        for (let k = 0; k < 3; k++) { const f = add(new THREE.ConeGeometry(0.03, 0.22, 4), T([0xd03a2a, 0xffcf40, 0x3a8ad0][k]), -0.06 + k * 0.06, 0.98, 0.04, g); f.rotation.x = Math.PI; }
        L.orb = add(new THREE.SphereGeometry(0.03, 6, 5), GLOW(C.staffColor), 0, 1.16, 0.08, g);
      } else if (C.skull) {
        add(new THREE.SphereGeometry(0.11, 10, 8), T(0xe8e4d0), 0, 1.15, 0, g);
        [-0.04, 0.04].forEach(x => add(new THREE.SphereGeometry(0.025, 6, 4), GLOW(C.staffColor), x, 1.16, 0.09, g));
      } else {
        add(new THREE.TorusGeometry(0.1, 0.015, 4, 12), T(C.colors.trim), 0, 1.15, 0, g);
        L.orb = add(new THREE.SphereGeometry(0.075, 12, 10), GLOW(C.staffColor), 0, 1.15, 0, g);
      }
      break;
    }
    case 'daggers':
      [inR, inL].forEach(h => { const g = new THREE.Group(); g.rotation.x = Math.PI / 2; h.add(g); add(new THREE.BoxGeometry(0.04, 0.38, 0.015), metal, 0, 0.22, 0, g); add(new THREE.BoxGeometry(0.12, 0.03, 0.04), T(C.colors.trim), 0, 0.03, 0, g); });
      break;
    case 'club': {
      const g = new THREE.Group(); g.rotation.x = Math.PI / 2; inR.add(g);
      add(new THREE.CylinderGeometry(0.055, 0.028, 0.55, 8), wood, 0, 0.25, 0, g);
      for (let i = 0; i < 4; i++) { const s = add(new THREE.ConeGeometry(0.025, 0.08, 4), metal, Math.cos(i * 1.57) * 0.055, 0.45, Math.sin(i * 1.57) * 0.055, g); s.rotation.z = -Math.cos(i * 1.57) * 1.4; s.rotation.x = Math.sin(i * 1.57) * 1.4; }
      add(new THREE.TorusGeometry(0.06, 0.02, 4, 8), metal, 0, 0, 0, inL);
      break;
    }
    case 'axe': {
      const g = new THREE.Group(); g.rotation.x = Math.PI / 2; inR.add(g);
      add(new THREE.CylinderGeometry(0.025, 0.03, 0.7, 6), wood, 0, 0.28, 0, g);
      const blade = add(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 12, 1, false, 0, Math.PI), metal, 0.02, 0.58, 0, g); blade.rotation.z = Math.PI / 2;
      break;
    }
    case 'greataxe': {
      const g = new THREE.Group(); g.rotation.x = Math.PI / 2; inR.add(g);
      add(new THREE.CylinderGeometry(0.035, 0.04, 1.3, 6), wood, 0, 0.45, 0, g);
      [-1, 1].forEach(sd => { const bl = add(new THREE.CylinderGeometry(0.24, 0.24, 0.035, 14, 1, false, 0, Math.PI), metal, sd * 0.03, 0.98, 0, g); bl.rotation.z = sd * Math.PI / 2; });
      add(new THREE.ConeGeometry(0.04, 0.2, 6), metal, 0, 1.2, 0, g);
      break;
    }
    case 'fists':
      [inR, inL].forEach(h => { add(new THREE.SphereGeometry(0.075, 10, 8), T(C.colors.cloth), 0, 0.02, 0, h); add(new THREE.TorusGeometry(0.07, 0.02, 6, 12), T(C.colors.accent), 0, 0.02, 0, h).rotation.x = Math.PI / 2; });
      break;
    case 'hammer': {
      const g = new THREE.Group(); g.rotation.x = Math.PI / 2; inR.add(g);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), wood, 0, 0.3, 0, g);
      add(new THREE.BoxGeometry(0.34, 0.18, 0.18), T(0x5a6470), 0, 0.68, 0, g);
      L.orb = add(new THREE.BoxGeometry(0.36, 0.05, 0.19), GLOW(C.colors.accent), 0, 0.68, 0, g);
      break;
    }
  }
}

function buildAvatar(root, look) {
  const C0 = CLASSES[look.cls];
  if (C0 && C0.sprite && typeof SpriteKit !== 'undefined' && SpriteKit.ready) return buildSpriteAvatar(root, look);
  if (ModelKit.ready) return buildModelAvatar(root, look);
  while (root.children.length) root.remove(root.children[0]);
  const race = RACES[look.race] || RACES.humano;
  const C = CLASSES[look.cls] || CLASSES.dancarina;
  const fem = look.gender !== 'm';
  const T = c => new THREE.MeshToonMaterial({ color: c, gradientMap: TOON_GRAD });
  const TD = c => new THREE.MeshToonMaterial({ color: c, side: THREE.DoubleSide, gradientMap: TOON_GRAD });
  const GLOW = c => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.7 });
  if (!window.SKIN_GRAD) { const t = new THREE.DataTexture(new Uint8Array([165, 195, 220, 240, 255]), 5, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; window.SKIN_GRAD = t; }
  const skin = new THREE.MeshToonMaterial({ color: race.skins[look.skin % race.skins.length], gradientMap: SKIN_GRAD });
  const hairC = HAIR_COLORS[look.hair % HAIR_COLORS.length];
  const hair = T(hairC), hairD = T(new THREE.Color(hairC).multiplyScalar(0.75).getHex());
  const cloth = T(C.colors.cloth), clothD = T(new THREE.Color(C.colors.cloth).multiplyScalar(0.7).getHex());
  const trim = T(C.colors.trim), accent = T(C.colors.accent);
  const metal = T(0xb8bcc8), dark = T(0x2a2226), wood = T(0x7a5230);
  const add = (geo, mat, x, y, z, parent) => mesh(geo, mat, x, y, z, parent);
  const L = { cls: look.cls };

  const body = new THREE.Group(); root.add(body); L.body = body;
  const [sx, sy, sz] = race.scale;
  const width = fem ? 1 : 1.12;
  body.scale.set(sx * width, sy, sz * width);

  // ---------------- pernas
  const legMat = C.outfit === 'dress' ? skin : C.outfit === 'armor' ? clothD : C.outfit === 'robe' ? clothD : cloth;
  const limb = (len, rad, mat, parent, x, y, z) => {
    const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p);
    add(new THREE.CapsuleGeometry(rad, Math.max(0.01, len - rad * 2), 4, 12), mat, 0, -len / 2, 0, p); return p;
  };
  L.legL = limb(0.82, 0.07, legMat, body, -0.1, 0.86, 0);
  L.legR = limb(0.82, 0.07, legMat, body, 0.1, 0.86, 0);
  const bootMat = C.outfit === 'armor' ? metal : C.outfit === 'dress' ? clothD : T(0x4a3020);
  [L.legL, L.legR].forEach(l => {
    add(new THREE.BoxGeometry(0.15, C.outfit === 'dress' ? 0.08 : 0.26, 0.26), bootMat, 0, C.outfit === 'dress' ? -0.84 : -0.75, 0.03, l);
    if (C.outfit === 'dress') add(new THREE.TorusGeometry(0.075, 0.015, 4, 10), trim, 0, -0.72, 0, l).rotation.x = Math.PI / 2;
  });

  // ---------------- tronco
  if (C.outfit === 'dress') {
    L.skirt = add(new THREE.ConeGeometry(0.42, 0.5, 12, 1, true), TD(C.colors.cloth), 0, 0.78, 0, body);
    add(new THREE.TorusGeometry(0.42, 0.02, 4, 16), trim, 0, -0.25, 0, L.skirt).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 12), trim, 0, 1.0, 0, body);
    add(new THREE.CylinderGeometry(0.15, 0.16, 0.14, 12), skin, 0, 1.09, 0, body);
    add(new THREE.CylinderGeometry(0.19, 0.16, 0.22, 12), cloth, 0, 1.26, 0, body);
    add(new THREE.SphereGeometry(0.035, 6, 5), accent, 0, 1.0, 0.17, body);
  } else if (C.outfit === 'robe') {
    L.skirt = add(new THREE.ConeGeometry(0.44, 0.92, 14, 1, true), TD(C.colors.cloth), 0, 0.5, 0, body);
    add(new THREE.TorusGeometry(0.44, 0.025, 4, 18), trim, 0, -0.46, 0, L.skirt).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 12), cloth, 0, 1.16, 0, body);
    add(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 12), trim, 0, 0.98, 0, body);
    add(new THREE.BoxGeometry(0.08, 0.5, 0.02), trim, 0, 1.1, 0.2, body);
  } else if (C.outfit === 'armor') {
    L.skirt = add(new THREE.ConeGeometry(0.3, 0.3, 8, 1, true), TD(C.colors.cloth), 0, 0.85, 0, body);
    add(new THREE.CylinderGeometry(0.23, 0.19, 0.48, 10), metal, 0, 1.15, 0, body);
    add(new THREE.BoxGeometry(0.3, 0.3, 0.06), cloth, 0, 1.2, 0.19, body);
    add(new THREE.BoxGeometry(0.06, 0.18, 0.065), trim, 0, 1.2, 0.2, body);
    add(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 10), T(0x5a3a1a), 0, 0.95, 0, body);
    [-0.27, 0.27].forEach(x => { const p = add(new THREE.SphereGeometry(0.12, 10, 8, 0, TAU, 0, Math.PI / 2), metal, x, 1.36, 0, body); p.scale.set(1, 0.8, 1); });
  } else { // couro
    add(new THREE.CylinderGeometry(0.19, 0.17, 0.46, 10), cloth, 0, 1.15, 0, body);
    add(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 10), T(0x5a3a1a), 0, 0.95, 0, body);
    add(new THREE.BoxGeometry(0.06, 0.06, 0.04), trim, 0, 0.95, 0.18, body);
    add(new THREE.BoxGeometry(0.3, 0.08, 0.2), trim, 0, 1.33, 0.02, body);
    if (fem) { L.skirt = add(new THREE.ConeGeometry(0.28, 0.24, 10, 1, true), TD(C.colors.cloth), 0, 0.84, 0, body); }
  }
  // capa
  if (['paladino', 'necromante', 'assassino', 'mago_negro'].includes(look.cls)) {
    const cape = add(new THREE.PlaneGeometry(0.48, 1.0, 1, 4), TD(look.cls === 'paladino' ? C.colors.accent : C.colors.trim), 0, 0.88, -0.2, body);
    cape.rotation.x = 0.12; L.cape = cape;
  }

  // ---------------- braços
  const armMat = C.outfit === 'dress' ? skin : C.outfit === 'armor' ? metal : cloth;
  L.armL = limb(0.5, 0.055, armMat, body, -0.25, 1.33, 0);
  L.armR = limb(0.5, 0.055, armMat, body, 0.25, 1.33, 0);
  [L.armL, L.armR].forEach(a => add(new THREE.SphereGeometry(0.055, 8, 6), skin, 0, -0.52, 0, a));
  if (C.outfit === 'robe') [L.armL, L.armR].forEach(a => add(new THREE.ConeGeometry(0.11, 0.22, 8, 1, true), TD(C.colors.cloth), 0, -0.42, 0, a));
  L.handR = new THREE.Object3D(); L.handR.position.y = -0.54; L.armR.add(L.handR);
  L.handL = new THREE.Object3D(); L.handL.position.y = -0.54; L.armL.add(L.handL);
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8), skin, 0, 1.42, 0, body);

  // ---------------- cabeça
  L.head = new THREE.Group(); L.head.position.y = 1.58; body.add(L.head);
  const head = L.head;
  head.scale.set(1 / (sx * width), 1 / sy, 1 / (sz * width));   // cabeça não deforma com a raça
  head.scale.multiplyScalar(race.beard ? 1.12 : 1);
  add(new THREE.SphereGeometry(0.17, 28, 20), skin, 0, 0, 0, head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.1715, 32, 16, Math.PI / 2 - 0.95, 1.9, 0.95, 1.15),
    new THREE.MeshToonMaterial({ map: faceTexture(look, fem), transparent: true, gradientMap: TOON_GRAD, depthWrite: false }));
  face.rotation.y = 0; head.add(face);
  add(new THREE.SphereGeometry(0.185, 24, 16, 0, TAU, 0, Math.PI * 0.55), hair, 0, 0.02, -0.015, head);
  // franja e volume
  for (let i = 0; i < 5; i++) { const b = add(new THREE.SphereGeometry(0.06, 10, 8), hair, -0.11 + i * 0.055, 0.11 - Math.abs(i - 2) * 0.012, 0.13 - Math.abs(i - 2) * 0.015, head); b.scale.set(0.9, 1.25, 0.55); b.rotation.z = (i - 2) * 0.25; }
  if (fem) [-1, 1].forEach(sd => { const lk = add(new THREE.SphereGeometry(0.05, 10, 8), hair, sd * 0.15, -0.09, 0.05, head); lk.scale.set(0.7, 2.4, 0.8); });
  if (fem) {
    add(new THREE.SphereGeometry(0.19, 12, 8, Math.PI * 0.1, Math.PI * 0.8, Math.PI * 0.35, Math.PI * 0.45), hair, 0, 0, -0.02, head).rotation.y = Math.PI;
    if (look.cls === 'dancarina' || look.cls === 'arqueira') {
      add(new THREE.SphereGeometry(0.08, 8, 6), hairD, 0, 0.14, -0.14, head);
      L.tail = new THREE.Group(); L.tail.position.set(0, 0.12, -0.18); head.add(L.tail);
      [[0.075, 0, -0.08], [0.065, -0.12, -0.14], [0.05, -0.25, -0.17], [0.035, -0.36, -0.18]].forEach(([r, y, z]) => add(new THREE.SphereGeometry(r, 8, 6), hair, 0, y, z, L.tail));
    } else {
      const back = add(new THREE.CylinderGeometry(0.17, 0.12, 0.42, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8), TD(hairC), 0, -0.16, -0.02, head);
      back.rotation.y = Math.PI;
    }
    if (race.beard) [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.045 - i * 0.008, 6, 5), hair, s * 0.16, -0.08 - i * 0.07, -0.02, head); });
  } else {
    for (let i = 0; i < 7; i++) { const sp = add(new THREE.ConeGeometry(0.055, 0.15, 6), hair, -0.13 + i * 0.043, 0.16 - Math.abs(i - 3) * 0.012, 0.02 - Math.abs(i - 3) * 0.025, head); sp.rotation.set(-0.8, 0, (i - 3) * -0.18); }
    [-1, 1].forEach(sd => { const bk = add(new THREE.SphereGeometry(0.06, 10, 8), hair, sd * 0.15, -0.04, -0.04, head); bk.scale.set(0.6, 1.4, 1); });
  }
  if (race.beard && !fem) {
    const b = add(new THREE.ConeGeometry(0.13, 0.32, 8), hair, 0, -0.18, 0.08, head); b.rotation.x = Math.PI + 0.25;
    add(new THREE.BoxGeometry(0.16, 0.035, 0.04), hair, 0, -0.06, 0.16, head);
  }
  if (race.ears) [-1, 1].forEach(s => { const e = add(new THREE.ConeGeometry(0.035, 0.2, 5), skin, s * 0.18, 0.02, -0.02, head); e.rotation.z = -s * 1.2; e.rotation.x = -0.3; });

  gear({ look, C, head, body, L, T, GLOW, metal, wood, trim, accent, cloth, hair });
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  head.traverse(o => { if (o.isMesh) o.receiveShadow = false; });
  addOutline(root);
  return L;
}

const _faceCache = {};
function faceTexture(look, fem) {
  const eye = { humano: '#4a7ad0', anao: '#7a4a22', elfo: '#2fa86a', elfo_negro: '#e03040' }[look.race] || '#4a7ad0';
  const key = eye + fem;
  if (_faceCache[key]) return _faceCache[key];
  const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d');
  // a área do rosto: olhos no meio, boca embaixo
  const cx = 128, ey = 76, dx = 40;
  g.save(); g.translate(cx, ey); g.scale(1.3, 1.3); g.translate(-cx, -ey);
  for (const sd of [-1, 1]) {
    const x = cx + sd * dx;
    // branco do olho
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey, 15, fem ? 17 : 13, 0, 0, Math.PI * 2); g.fill();
    // íris em degradê
    const gr = g.createLinearGradient(x, ey - 14, x, ey + 14); gr.addColorStop(0, '#1a1020'); gr.addColorStop(0.45, eye); gr.addColorStop(1, '#ffffff');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, ey + 1, 10.5, fem ? 14 : 11, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#120a18'; g.beginPath(); g.ellipse(x, ey + 2, 5, fem ? 7 : 5.5, 0, 0, Math.PI * 2); g.fill();
    // brilhos
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 4, ey - 5, 3.6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(x + 4, ey + 6, 1.8, 0, Math.PI * 2); g.fill();
    // cílios / pálpebra superior
    g.strokeStyle = '#1a1020'; g.lineWidth = fem ? 4.5 : 3.5; g.lineCap = 'round';
    g.beginPath(); g.ellipse(x, ey + 2, 16, fem ? 18 : 14, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    if (fem) { g.beginPath(); g.moveTo(x + sd * 15, ey - 9); g.lineTo(x + sd * 21, ey - 13); g.stroke(); }
    // sobrancelha
    g.lineWidth = fem ? 3 : 4.5; g.beginPath(); g.moveTo(x - sd * 11, ey - (fem ? 26 : 22)); g.quadraticCurveTo(x, ey - (fem ? 31 : 27), x + sd * 13, ey - (fem ? 25 : 20)); g.stroke();
    // bochechas
    if (fem) { g.fillStyle = 'rgba(255,120,130,.35)'; g.beginPath(); g.ellipse(x + sd * 8, ey + 27, 11, 5, 0, 0, Math.PI * 2); g.fill(); }
  }
  // nariz e boca
  g.strokeStyle = 'rgba(150,80,70,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + 1, ey + 20); g.lineTo(cx - 2, ey + 27); g.stroke();
  g.strokeStyle = '#8a3a40'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 10, ey + 41); g.quadraticCurveTo(cx, ey + (fem ? 48 : 45), cx + 10, ey + 41); g.stroke();
  g.restore();
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  return (_faceCache[key] = t);
}

// ---------------------------------------------------------------- personagem com modelo 3D animado
const MODEL_TINT = {
  adventurer: { cloth: ['Green'], trim: ['LightGreen'], clothD: ['Brown2'], hair: ['Hair', 'Eyebrows'], hide: { Backpack: c => !['arqueira', 'ferreira', 'arruaceiro'].includes(c) } },
  hooded_adventurer: { cloth: ['DarkBrown'], trim: ['LightBrown'], clothD: ['Brown'], hair: [], hide: { Sword: (c, C) => C.weapon !== 'sword' } },
};
function buildModelAvatar(root, look) {
  while (root.children.length) root.remove(root.children[0]);
  const race = RACES[look.race] || RACES.humano;
  const C = CLASSES[look.cls] || CLASSES.dancarina;
  const fem = look.gender !== 'm';
  const model = fem ? 'hooded_adventurer' : 'adventurer';
  const orc = model === 'orc_brute';
  const [sx, sy, sz] = race.scale;
  const inst = ModelKit.instance(model, 1.72 * sy);
  inst.obj.scale.x *= sx * (fem ? 1 : 1.05); inst.obj.scale.z *= sz * (fem ? 1 : 1.05);
  root.add(inst.root);
  const T = c => new THREE.MeshToonMaterial({ color: c, gradientMap: TOON_GRAD });
  const GLOW = c => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.7 });
  const tint = MODEL_TINT[model] || { cloth: [], trim: [], clothD: [], hair: [], hide: {} };
  const skinC = race.skins[look.skin % race.skins.length], hairC = HAIR_COLORS[look.hair % HAIR_COLORS.length];
  inst.tint('Skin', skinC);
  if (orc) { inst.tint('Orc_Main', skinC); inst.tint('Orc_Secondary', C.colors.cloth); inst.tint('Belt', C.colors.trim); inst.tint('Orc_Hair', hairC); const w = inst.obj.getObjectByName('Orc_Weapon'); if (w) w.visible = false; }
  tint.hair.forEach(n => inst.tint(n, hairC));
  tint.cloth.forEach(n => inst.tint(n, C.colors.cloth));
  tint.trim.forEach(n => inst.tint(n, C.colors.trim));
  tint.clothD.forEach(n => inst.tint(n, new THREE.Color(C.colors.cloth).multiplyScalar(0.6)));
  for (const [mn, fn] of Object.entries(tint.hide)) { const m = inst.obj.getObjectByName(mn) || inst.mesh(mn); if (m) m.visible = !fn(look.cls, C); }
  // pontos de encaixe nos ossos
  const headA = inst.attach('Head'), handA = inst.attach(orc ? 'LowerArmR' : 'WristR'), handLA = inst.attach(orc ? 'LowerArmL' : 'WristL'), chestA = inst.attach(orc ? 'Neck' : 'Chest');
  const head = new THREE.Group(); head.position.set(0, 0.12 * sy, 0.01); head.scale.setScalar(0.66); headA.add(head);
  const handR = new THREE.Group(); handR.position.set(0, orc ? -0.42 : -0.06, 0.02); handR.rotation.x = -1.25; handA.add(handR);
  const handL = new THREE.Group(); handL.position.set(0, orc ? -0.42 : -0.06, 0.02); handLA.add(handL);
  // cajados e arcos ficam sempre em pé (acompanham só a posição da mão)
  const upright = C.weapon === 'staff' || C.weapon === 'bow';
  const followR = new THREE.Group(), followL = new THREE.Group();
  if (upright) { followR.rotation.x = -Math.PI / 2; inst.root.add(followR); inst.root.add(followL); }
  const body = new THREE.Group(); body.position.set(0, orc ? -1.55 : -1.12, -0.03); chestA.add(body);     // mesmo referencial do boneco antigo (pés em y=0)
  const L = { cls: look.cls, model: true, inst, body: inst.root, head, handR: upright ? followR : handR, handL: upright ? followL : handL, ribbon: false };
  if (upright) L.follow = [[followR, handR], [followL, handL]];
  const metal = T(0xb8bcc8), wood = T(0x7a5230), trim = T(C.colors.trim), accent = T(C.colors.accent), cloth = T(C.colors.cloth), hair = T(hairC);
  const skin = T(skinC);
  // orelhas de elfo e barba de anão
  if (race.ears || race.orc) [-1, 1].forEach(s => { const e = mesh(new THREE.ConeGeometry(0.035, race.orc ? 0.14 : 0.22, 6), skin, s * 0.17, 0.0, -0.03, head); e.rotation.z = -s * 1.25; e.rotation.x = -0.3; });
  if (race.tusks) [-1, 1].forEach(s => { const t = mesh(new THREE.ConeGeometry(0.028, 0.12, 6), T(0xf0e8d0), s * 0.07, -0.13, 0.15, head); t.rotation.z = s * 0.25; });
  if (race.beard && !fem) { const b = mesh(new THREE.ConeGeometry(0.14, 0.36, 10), hair, 0, -0.2, 0.1, head); b.rotation.x = Math.PI + 0.3; }
  // capa
  if (['paladino', 'necromante', 'assassino', 'mago_negro', 'mago_luz', 'sacerdote'].includes(look.cls)) {
    const cape = mesh(new THREE.PlaneGeometry(0.46, 0.95, 1, 4), new THREE.MeshToonMaterial({ color: look.cls === 'paladino' ? C.colors.accent : C.colors.cloth, side: THREE.DoubleSide, gradientMap: TOON_GRAD }), 0, 0.9, -0.17, body);
    cape.rotation.x = 0.1; L.cape = cape;
  }
  gear({ look, C, head, body, L, T, GLOW, metal, wood, trim, accent, cloth, hair });
  inst.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  inst.play(C.weapon === 'ribbon' || C.ranged ? 'Idle' : 'Idle_Sword');
  return L;
}

// cajados e arcos: copia a posição da mão para o grupo em pé
const _fv = new THREE.Vector3();
function updateFollow(L) {
  if (!L || !L.follow) return;
  for (const [g, hand] of L.follow) { hand.getWorldPosition(_fv); g.parent.worldToLocal(_fv); g.position.copy(_fv); }
}

// herói do livro: sprite do RPG voltado para a câmera (estilo Ragnarok)
function buildSpriteAvatar(root, look) {
  while (root.children.length) root.remove(root.children[0]);
  const C = CLASSES[look.cls];
  const a = SpriteKit.actor(C.sprite);
  root.add(a.root);
  const handR = new THREE.Object3D(); handR.position.set(0.25, a.h * 0.6, 0.35); root.add(handR);
  const head = new THREE.Object3D(); head.position.y = a.h * 0.85; root.add(head);
  return { cls: look.cls, sprite: a, body: a.root, head, handR, handL: handR, ribbon: false };
}
