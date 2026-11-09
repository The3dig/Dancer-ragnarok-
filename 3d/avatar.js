// =====================================================================
//  Gerador de personagens 3D (raça + corpo + classe)
// =====================================================================
'use strict';

function buildAvatar(root, look) {
  while (root.children.length) root.remove(root.children[0]);
  const race = RACES[look.race] || RACES.humano;
  const C = CLASSES[look.cls] || CLASSES.dancarina;
  const fem = look.gender !== 'm';
  const T = c => new THREE.MeshToonMaterial({ color: c });
  const TD = c => new THREE.MeshToonMaterial({ color: c, side: THREE.DoubleSide });
  const GLOW = c => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.7 });
  const skin = T(race.skins[look.skin % race.skins.length]);
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
    add(new THREE.CylinderGeometry(rad, rad * 0.85, len, 8), mat, 0, -len / 2, 0, p); return p;
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
  add(new THREE.SphereGeometry(0.17, 16, 12), skin, 0, 0, 0, head);
  add(new THREE.SphereGeometry(0.185, 16, 12, 0, TAU, 0, Math.PI * 0.55), hair, 0, 0.02, -0.015, head);
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
    for (let i = 0; i < 5; i++) { const sp = add(new THREE.ConeGeometry(0.05, 0.12, 5), hair, -0.1 + i * 0.05, 0.17, 0.06 - Math.abs(i - 2) * 0.02, head); sp.rotation.x = -0.6; }
  }
  if (race.beard && !fem) {
    const b = add(new THREE.ConeGeometry(0.13, 0.32, 8), hair, 0, -0.18, 0.08, head); b.rotation.x = Math.PI + 0.25;
    add(new THREE.BoxGeometry(0.16, 0.035, 0.04), hair, 0, -0.06, 0.16, head);
  }
  if (race.ears) [-1, 1].forEach(s => { const e = add(new THREE.ConeGeometry(0.035, 0.2, 5), skin, s * 0.18, 0.02, -0.02, head); e.rotation.z = -s * 1.2; e.rotation.x = -0.3; });
  [-0.06, 0.06].forEach(x => add(new THREE.SphereGeometry(0.025, 6, 5), T(look.race === 'elfo_negro' ? 0xff5050 : 0x3a2a4a), x, 0, 0.155, head));
  if (fem) [-0.09, 0.09].forEach(x => add(new THREE.SphereGeometry(0.025, 6, 4), T(0xffa0a0), x, -0.05, 0.14, head));

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
      add(new THREE.BoxGeometry(0.04, 0.12, 0.03), metal, 0, -0.02, 0.19, head); break;
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
      const bow = add(new THREE.TorusGeometry(0.5, 0.025, 6, 20, Math.PI), wood, 0, 0, 0, inL);
      bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
      add(new THREE.CylinderGeometry(0.004, 0.004, 1.0, 3), T(0xffffff), 0, 0, 0, inL);
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
      if (C.skull) {
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
      add(new THREE.CylinderGeometry(0.07, 0.035, 0.7, 7), wood, 0, 0.32, 0, g);
      for (let i = 0; i < 4; i++) { const s = add(new THREE.ConeGeometry(0.025, 0.08, 4), metal, Math.cos(i * 1.57) * 0.07, 0.55, Math.sin(i * 1.57) * 0.07, g); s.rotation.z = -Math.cos(i * 1.57) * 1.4; s.rotation.x = Math.sin(i * 1.57) * 1.4; }
      add(new THREE.TorusGeometry(0.06, 0.02, 4, 8), metal, 0, 0, 0, inL);
      break;
    }
    case 'hammer': {
      const g = new THREE.Group(); g.rotation.x = Math.PI / 2; inR.add(g);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), wood, 0, 0.3, 0, g);
      add(new THREE.BoxGeometry(0.34, 0.18, 0.18), T(0x5a6470), 0, 0.68, 0, g);
      L.orb = add(new THREE.BoxGeometry(0.36, 0.05, 0.19), GLOW(C.colors.accent), 0, 0.68, 0, g);
      break;
    }
  }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return L;
}
