// =====================================================================
//  LYRA: RITMO PERDIDO — spin-off 3D de "Dançarina: A Fita de Seda"
//  Combate rítmico: golpes no tempo da música causam mais dano.
// =====================================================================
'use strict';
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = mulberry(2024);
const rr = (a, b) => a + R() * (b - a);

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.id = 'cv3';
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const SKY_GREEN = new THREE.Color(0x9fd4ff), SKY_DESERT = new THREE.Color(0xf3d6a8);
scene.background = SKY_GREEN.clone();
scene.fog = new THREE.Fog(SKY_GREEN.clone(), 55, 160);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
const hemi = new THREE.HemisphereLight(0xdff0ff, 0x6a7a4a, 0.8); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 0.85);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 140 });
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

const matCache = {};
const M = (c, o) => { const k = c + JSON.stringify(o || {}); return matCache[k] || (matCache[k] = new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...o })); };
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  (parent || scene).add(m); return m;
}

// ---------------------------------------------------------------- mundo
const WX = 150, WZ = 90;
const VIL = { x: -105, z: 0 }, OAS = { x: 120, z: 55 }, RUIN = { x: 128, z: -52 };
const riverX = z => 20 + Math.sin(z * 0.08) * 4;
const WHEAT = [[-42, -42, 20, 14], [-22, 22, 18, 12], [30, -38, 13, 10], [-48, 30, 12, 10]];
function dRoad(x, z) {
  let d = Math.abs(z);
  if (x < -140 || x > 142) d = 99;
  const bd = Math.abs(x - 115) + (z < 0 ? -z : z > 40 ? z - 40 : 0);
  return Math.min(d, bd);
}
function zoneOf(x, z) {
  if (x < -62) return 'solmira';
  if (Math.hypot(x - OAS.x, z - OAS.z) < 34) return 'kharum';
  if (x >= 48) return 'areias';
  return 'campos';
}
function height(x, z) {
  let h = Math.sin(x * 0.05) * Math.cos(z * 0.06) * 1.6 + Math.sin(x * 0.13 + z * 0.09) * 0.6;
  const des = smooth(42, 58, x);
  h += des * (Math.sin(x * 0.07 + z * 0.035) * 1.6 + Math.cos(z * 0.11) * 0.7);
  let f = smooth(3, 10, dRoad(x, z));
  f *= smooth(36, 50, Math.hypot(x - VIL.x, z - VIL.z));
  f *= smooth(26, 36, Math.hypot(x - OAS.x, z - OAS.z));
  f *= smooth(14, 22, Math.hypot(x - RUIN.x, z - RUIN.z));
  h *= f;
  const rd = Math.abs(x - riverX(z));
  if (rd < 10) { h = lerp(Math.max(h, 0.3), h, smooth(6, 10, rd)); h -= 2.4 * (1 - smooth(2.6, 4.6, rd)); }
  const od = Math.hypot(x - OAS.x, z - OAS.z);
  if (od < 12) h -= 2.2 * (1 - smooth(6, 9, od));
  if (Math.abs(x) > WX - 6 || Math.abs(z) > WZ - 6) h += (Math.max(Math.abs(x) - WX + 6, Math.abs(z) - WZ + 6, 0)) * 1.2;
  return h;
}
const onBridge = (x, z) => Math.abs(z) < 2.6 && Math.abs(x - riverX(z)) < 6;
const groundY = (x, z) => onBridge(x, z) ? Math.max(0.35, height(x, z)) : height(x, z);
const nearWater = (x, z) => Math.abs(x - riverX(z)) < 5 || Math.hypot(x - OAS.x, z - OAS.z) < 9.5;
const isWater = (x, z) => !onBridge(x, z) && nearWater(x, z) && height(x, z) < -0.45;

function groundColor(x, z, y, c) {
  const n = Math.sin(x * 0.9) * Math.cos(z * 0.7) * 0.03 + Math.sin(x * 0.31 + z * 0.17) * 0.03;
  const des = smooth(44, 56, x) * smooth(22, 30, Math.hypot(x - OAS.x, z - OAS.z));
  c.setHSL(0.27 + n, 0.5, 0.36 + n * 1.5);
  if (des > 0) { const s = new THREE.Color().setHSL(0.09 + n * 0.3, 0.55, 0.64 + n * 1.5); c.lerp(s, des); }
  for (const [wx, wz, ww, wd] of WHEAT) if (x > wx && x < wx + ww && z > wz && z < wz + wd) c.setHSL(0.12, 0.6, 0.42 + n);
  const rd = dRoad(x, z);
  if (rd < 3.4) c.setHSL(0.08, 0.36, 0.46 + n);
  const vd = Math.hypot(x - VIL.x, z - VIL.z);
  if (vd < 17) { const k = (Math.floor(x * 1.2) + Math.floor(z * 1.2)) & 1; c.setHSL(0.08, 0.07, 0.47 + k * 0.05 + n); }
  const od = Math.hypot(x - OAS.x, z - OAS.z);
  if (od < 17 && od > 7) c.setHSL(0.11, 0.45, 0.72 + n);
  if (od >= 7 && od < 10.5) c.setHSL(0.28, 0.5, 0.4 + n);
  if (y < -0.3 && !onBridge(x, z) && nearWater(x, z)) c.setHSL(0.1, 0.35, 0.42);
  const ruin = Math.hypot(x - RUIN.x, z - RUIN.z);
  if (ruin < 13) c.setHSL(0.06, 0.4, 0.55 + n);
  return c;
}

// terreno
(function buildTerrain() {
  const geo = new THREE.PlaneGeometry(WX * 2, WZ * 2, 240, 144);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = height(x, z);
    pos.setY(i, y);
    groundColor(x, z, y, c); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const t = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  t.receiveShadow = true; scene.add(t);
})();

// água
const waterMat = new THREE.MeshLambertMaterial({ color: 0x3f94e0, transparent: true, opacity: 0.82 });
{
  const rg = new THREE.PlaneGeometry(18, WZ * 2, 1, 90); rg.rotateX(-Math.PI / 2);
  const p = rg.attributes.position;
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + riverX(p.getZ(i)));
  const r = new THREE.Mesh(rg, waterMat); r.position.y = -0.6; scene.add(r);
  const pg = new THREE.CircleGeometry(9.5, 32); pg.rotateX(-Math.PI / 2);
  const pond = new THREE.Mesh(pg, waterMat); pond.position.set(OAS.x, -0.55, OAS.z); scene.add(pond);
}
// ponte
{
  const bx = riverX(0);
  const deck = mesh(new THREE.BoxGeometry(12, 0.3, 5), M(0x8b5a2b), bx, 0.2, 0);
  for (let i = -5; i <= 5; i += 1.2) mesh(new THREE.BoxGeometry(0.15, 0.32, 5.02), M(0x6b4423), bx + i, 0.21, 0);
  [-2.5, 2.5].forEach(z => { mesh(new THREE.BoxGeometry(12, 0.15, 0.15), M(0x6b4423), bx, 1.1, z); for (let i = -6; i <= 6; i += 2) mesh(new THREE.BoxGeometry(0.2, 1, 0.2), M(0x6b4423), bx + i, 0.6, z); });
}

// ---------------------------------------------------------------- obstáculos (grade espacial)
const OB = new Map(), CELL = 8;
function addOb(x, z, r) {
  const o = { x, z, r };
  for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++)
    for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) {
      const k = i + ',' + j; if (!OB.has(k)) OB.set(k, []); OB.get(k).push(o);
    }
}
function blocked(x, z, r = 0.45) {
  if (Math.abs(x) > WX - 4 || Math.abs(z) > WZ - 4) return true;
  if (isWater(x, z)) return true;
  const l = OB.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL));
  if (l) for (const o of l) if (Math.hypot(x - o.x, z - o.z) < o.r + r) return true;
  return false;
}
function freeSpot(x, z, minRoad = 5) {
  return !blocked(x, z, 1.2) && dRoad(x, z) > minRoad && Math.abs(x - riverX(z)) > 7;
}

// ---------------------------------------------------------------- vegetação (instanced)
function instanced(geo, mat, list, setup) {
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  im.castShadow = true; im.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  list.forEach((o, i) => { setup(o, p, q, s, c); m4.compose(p, q, s); im.setMatrixAt(i, m4); im.setColorAt(i, c); });
  scene.add(im); return im;
}
const trees = [], rocks = [], cacti = [], palms = [];
// anel de árvores da vila
for (let a = 0; a < TAU; a += 0.09) {
  const x = VIL.x + Math.cos(a) * rr(44, 50), z = VIL.z + Math.sin(a) * rr(44, 50);
  if (Math.abs(z) < 7 || x < -WX + 3) continue;
  trees.push({ x, z, s: rr(1, 1.5) });
}
for (let i = 0; i < 2200 && trees.length < 340; i++) {
  const x = rr(-WX + 5, 46), z = rr(-WZ + 5, WZ - 5);
  if (Math.hypot(x - VIL.x, z - VIL.z) < 52 && x < -55) continue;
  if (WHEAT.some(([wx, wz, ww, wd]) => x > wx - 2 && x < wx + ww + 2 && z > wz - 2 && z < wz + wd + 2)) continue;
  if (!freeSpot(x, z, 6)) continue;
  trees.push({ x, z, s: rr(0.8, 1.4) });
}
trees.forEach(t => addOb(t.x, t.z, 0.7));
for (let i = 0; i < 1500 && cacti.length < 70; i++) {
  const x = rr(56, WX - 5), z = rr(-WZ + 5, WZ - 5);
  if (Math.hypot(x - OAS.x, z - OAS.z) < 36 || Math.hypot(x - RUIN.x, z - RUIN.z) < 18 || !freeSpot(x, z)) continue;
  cacti.push({ x, z, s: rr(0.8, 1.3), r: rr(0, TAU) }); addOb(x, z, 0.5);
}
for (let i = 0; i < 1500 && rocks.length < 90; i++) {
  const x = rr(-60, WX - 5), z = rr(-WZ + 5, WZ - 5);
  if (Math.hypot(x - OAS.x, z - OAS.z) < 34 || !freeSpot(x, z)) continue;
  const s = rr(0.5, x > 50 ? 1.8 : 1); rocks.push({ x, z, s }); addOb(x, z, s * 0.8);
}
for (let a = 0; a < TAU; a += TAU / 14) palms.push({ x: OAS.x + Math.cos(a) * 11.5, z: OAS.z + Math.sin(a) * 11.5, s: rr(0.9, 1.2), lean: rr(-0.2, 0.2) });
for (let i = 0; i < 12; i++) { const x = rr(60, 140), z = rr(-80, 80); if (freeSpot(x, z) && Math.hypot(x - OAS.x, z - OAS.z) > 36) palms.push({ x, z, s: rr(0.9, 1.2), lean: rr(-0.25, 0.25) }); }
palms.forEach(p => addOb(p.x, p.z, 0.5));

instanced(new THREE.CylinderGeometry(0.18, 0.28, 2, 6), M(0x7a4f2a), trees, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + o.s, o.z); s.setScalar(o.s); c.set(0xffffff); });
instanced(new THREE.IcosahedronGeometry(1.5, 0), new THREE.MeshLambertMaterial({ flatShading: true }), trees, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + 2.6 * o.s, o.z); s.set(o.s, o.s * 1.15, o.s); q.setFromEuler(new THREE.Euler(0, o.x, 0)); c.setHSL(0.27 + Math.sin(o.x * 3) * 0.04, 0.55, 0.32 + Math.cos(o.z) * 0.05); });
instanced(new THREE.IcosahedronGeometry(1.0, 0), new THREE.MeshLambertMaterial({ flatShading: true }), trees, (o, p, q, s, c) => { p.set(o.x + 0.3, height(o.x, o.z) + 3.8 * o.s, o.z - 0.2); s.setScalar(o.s); c.setHSL(0.26, 0.55, 0.42); });
instanced(new THREE.DodecahedronGeometry(0.8, 0), new THREE.MeshLambertMaterial({ flatShading: true }), rocks, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + o.s * 0.3, o.z); s.set(o.s * 1.2, o.s * 0.8, o.s); q.setFromEuler(new THREE.Euler(o.x, o.z, 0)); c.setHSL(0.08, 0.12, o.x > 50 ? 0.5 : 0.45); });
instanced(new THREE.CylinderGeometry(0.32, 0.36, 2.6, 8), new THREE.MeshLambertMaterial({ flatShading: true }), cacti, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + 1.3 * o.s, o.z); s.setScalar(o.s); c.set(0x3f8f4a); });
instanced(new THREE.CylinderGeometry(0.2, 0.22, 1.1, 6), new THREE.MeshLambertMaterial({ flatShading: true }), cacti, (o, p, q, s, c) => { p.set(o.x + Math.cos(o.r) * 0.55 * o.s, height(o.x, o.z) + 1.6 * o.s, o.z + Math.sin(o.r) * 0.55 * o.s); s.setScalar(o.s); c.set(0x3f8f4a); });
// trigo
{
  const stalks = [];
  for (const [wx, wz, ww, wd] of WHEAT) for (let x = wx; x < wx + ww; x += 0.7) for (let z = wz; z < wz + wd; z += 0.7) stalks.push({ x: x + rr(0, 0.5), z: z + rr(0, 0.5), h: rr(0.8, 1.2) });
  window.wheat = instanced(new THREE.ConeGeometry(0.12, 1.2, 4), new THREE.MeshLambertMaterial({ flatShading: true }), stalks, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + 0.6 * o.h, o.z); s.set(1, o.h, 1); c.setHSL(0.12 + rr(-0.01, 0.02), 0.75, 0.55); });
}
// palmeiras
for (const p of palms) {
  const g = new THREE.Group(); g.position.set(p.x, height(p.x, p.z), p.z); g.scale.setScalar(p.s); scene.add(g);
  const trunk = mesh(new THREE.CylinderGeometry(0.16, 0.25, 4.5, 6), M(0x9b7a4a), 0, 2.25, 0, g); trunk.rotation.z = p.lean;
  const top = new THREE.Group(); top.position.set(-Math.sin(p.lean) * 4.5, 4.4, 0); g.add(top);
  for (let i = 0; i < 7; i++) {
    const leaf = mesh(new THREE.ConeGeometry(0.45, 2.8, 3), M(i % 2 ? 0x2e8b3a : 0x3fae4a), 0, 0, 0, top);
    leaf.rotation.set(Math.PI / 2 + 0.6, 0, 0); leaf.position.set(0, -0.2, 1.2);
    const pivot = new THREE.Group(); pivot.rotation.y = i * TAU / 7; pivot.add(leaf); top.add(pivot);
  }
  mesh(new THREE.SphereGeometry(0.2, 6, 5), M(0x7a4a1a), 0.2, -0.3, 0.1, top);
}

// ---------------------------------------------------------------- construções
const smokes = [];
function house(x, z, rot, w, d, roofC, style) {
  const g = new THREE.Group(); g.position.set(x, groundY(x, z), z); g.rotation.y = rot; scene.add(g);
  if (style === 'sand') {
    mesh(new THREE.BoxGeometry(w, 3.2, d), M(0xe2c896), 0, 1.6, 0, g);
    mesh(new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3), M(0xcfb07a), 0, 3.3, 0, g);
    if (roofC) mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.32, 16, 8, 0, TAU, 0, Math.PI / 2), M(roofC), 0, 3.4, 0, g);
    const door = mesh(new THREE.BoxGeometry(1.1, 1.8, 0.1), M(0x5a3a1a), 0, 0.9, d / 2 + 0.03, g, false);
    [-w / 2 + 1, w / 2 - 1].forEach(wx => mesh(new THREE.BoxGeometry(0.6, 0.8, 0.1), M(0x2a3a5a), wx, 2, d / 2 + 0.03, g, false));
  } else if (style === 'tent') {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4), M(0x6b4a2a), a * w / 2, 1.2, b * d / 2, g));
    const roof = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.3, 1.2, 4), M(roofC), 0, 2.9, 0, g); roof.rotation.y = Math.PI / 4;
    mesh(new THREE.BoxGeometry(w - 0.4, 0.8, 1), M(0xd9c39a), 0, 0.4, d / 2 - 0.6, g);
    ['#e74c3c', '#f1c40f', '#27ae60', '#e67e22'].forEach((c, i) => mesh(new THREE.SphereGeometry(0.2, 6, 5), M(c), -w / 2 + 0.8 + i * (w - 1.6) / 3, 0.95, d / 2 - 0.6, g));
  } else {
    mesh(new THREE.BoxGeometry(w, 2.6, d), M(0xf0e2c4), 0, 1.3, 0, g);
    [-1, 1].forEach(a => mesh(new THREE.BoxGeometry(0.25, 2.6, 0.25), M(0x8a6a4a), a * w / 2, 1.3, d / 2, g));
    const roof = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.6, 2.2, 4), M(roofC), 0, 3.7, 0, g); roof.rotation.y = Math.PI / 4;
    mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), M(0x8a6a5a), w / 4, 4.2, -d / 5, g);
    smokes.push(new THREE.Vector3(x, 0, z).add(new THREE.Vector3(w / 4, 5, -d / 5).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot)).setY(groundY(x, z) + 5.1));
    mesh(new THREE.BoxGeometry(1, 1.8, 0.1), M(0x7a4a22), 0, 0.9, d / 2 + 0.03, g, false);
    [-w / 2 + 1, w / 2 - 1].forEach(wx => { mesh(new THREE.BoxGeometry(0.9, 0.8, 0.1), M(0x7fb6e0), wx, 1.6, d / 2 + 0.03, g, false); mesh(new THREE.BoxGeometry(1, 0.2, 0.3), M(0xe05a7a), wx, 1.1, d / 2 + 0.1, g, false); });
  }
  addOb(x, z, Math.max(w, d) / 2 + 0.3);
  return g;
}
// Vila de Solmira
[[-125, -22, '#c0504d'], [-105, -30, '#4f81bd'], [-84, -24, '#7a9a3a'], [-127, 22, '#8064a2'], [-104, 30, '#d4883a'], [-84, 22, '#4bacc6'], [-135, -6, '#5a7a9a']]
  .forEach(([x, z, c]) => house(x, z, Math.atan2(VIL.x - x, VIL.z - z), 5, 4.5, c, 'wood'));
// chafariz
const fountain = new THREE.Group(); fountain.position.set(VIL.x, 0, VIL.z); scene.add(fountain);
mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.7, 24), M(0xb9b3a8), 0, 0.35, 0, fountain);
mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.1, 24), waterMat, 0, 0.66, 0, fountain, false);
mesh(new THREE.CylinderGeometry(0.4, 0.5, 2.2, 10), M(0xc9c3b8), 0, 1.4, 0, fountain);
mesh(new THREE.CylinderGeometry(1.2, 0.8, 0.35, 16), M(0xd6d0c5), 0, 2.5, 0, fountain);
addOb(VIL.x, VIL.z, 3.4);
// Oásis de Kharum
[[100, 48, '#3a8ac0'], [118, 77, '#c0503a'], [141, 64, '#3aa080'], [142, 42, '#d4a020'], [100, 68, null]]
  .forEach(([x, z, c]) => house(x, z, Math.atan2(OAS.x - x, OAS.z - z), 6, 5, c, 'sand'));
[[106, 32, '#c0392b'], [124, 31, '#2980b9'], [131, 34, '#8e44ad']].forEach(([x, z, c]) => house(x, z, 0, 3.2, 2.4, c, 'tent'));
// ruínas do Guardião
for (let i = 0; i < 9; i++) {
  const a = i * TAU / 9, x = RUIN.x + Math.cos(a) * 12, z = RUIN.z + Math.sin(a) * 12, h = rr(2, 6);
  mesh(new THREE.CylinderGeometry(0.7, 0.8, h, 8), M(0xb07a4a), x, height(x, z) + h / 2, z);
  if (h > 4) mesh(new THREE.BoxGeometry(2, 0.5, 2), M(0x8a5a32), x, height(x, z) + h + 0.25, z);
  addOb(x, z, 0.9);
}
// nuvens
const clouds = [];
for (let i = 0; i < 18; i++) {
  const g = new THREE.Group(); g.position.set(rr(-WX, WX), rr(28, 40), rr(-WZ, WZ)); scene.add(g);
  for (let k = 0; k < 4; k++) mesh(new THREE.IcosahedronGeometry(rr(2, 4), 1), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), k * 2.5 - 4, rr(-0.5, 0.5), rr(-1, 1), g, false);
  clouds.push(g);
}

// ---------------------------------------------------------------- materiais de personagem
const toon = c => new THREE.MeshToonMaterial({ color: c });
const SKIN = toon(0xffd9be), HAIR = toon(0xff7b6b), HAIR_D = toon(0xd9534f), CLOTH = toon(0x1fb5a8), CLOTH_D = toon(0x13887e), GOLD = toon(0xffcf40), SILK = 0xff4fa3, EYE = toon(0x3a2a4a);

// ---------------------------------------------------------------- Lyra (modelo 3D)
function limb(len, rad, mat, parent, x, y, z) {
  const pivot = new THREE.Group(); pivot.position.set(x, y, z); parent.add(pivot);
  mesh(new THREE.CylinderGeometry(rad, rad * 0.85, len, 8), mat, 0, -len / 2, 0, pivot);
  return pivot;
}
const lyra = new THREE.Group(); scene.add(lyra);
const body = new THREE.Group(); lyra.add(body);
const L = {};
L.legL = limb(0.82, 0.065, SKIN, body, -0.1, 0.86, 0); L.legR = limb(0.82, 0.065, SKIN, body, 0.1, 0.86, 0);
[L.legL, L.legR].forEach(l => { mesh(new THREE.BoxGeometry(0.13, 0.08, 0.24), CLOTH_D, 0, -0.84, 0.04, l); mesh(new THREE.TorusGeometry(0.07, 0.015, 4, 10), GOLD, 0, -0.72, 0, l).rotation.x = Math.PI / 2; });
L.skirt = mesh(new THREE.ConeGeometry(0.42, 0.5, 12, 1, true), new THREE.MeshToonMaterial({ color: 0x1fb5a8, side: THREE.DoubleSide }), 0, 0.78, 0, body);
mesh(new THREE.TorusGeometry(0.42, 0.02, 4, 16), GOLD, 0, 0.53, 0, L.skirt).rotation.x = Math.PI / 2;
L.skirt.children[0].position.y = -0.25;
mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 12), GOLD, 0, 1.0, 0, body);
mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.14, 12), SKIN, 0, 1.09, 0, body);
mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.22, 12), CLOTH, 0, 1.26, 0, body);
mesh(new THREE.SphereGeometry(0.035, 6, 5), toon(SILK), 0, 1.0, 0.17, body);
L.armL = limb(0.5, 0.05, SKIN, body, -0.24, 1.33, 0); L.armR = limb(0.5, 0.05, SKIN, body, 0.24, 1.33, 0);
[L.armL, L.armR].forEach(a => mesh(new THREE.TorusGeometry(0.055, 0.015, 4, 10), GOLD, 0, -0.32, 0, a).rotation.x = Math.PI / 2);
L.handR = new THREE.Object3D(); L.handR.position.y = -0.52; L.armR.add(L.handR);
mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8), SKIN, 0, 1.4, 0, body);
L.head = new THREE.Group(); L.head.position.y = 1.56; body.add(L.head);
mesh(new THREE.SphereGeometry(0.17, 16, 12), SKIN, 0, 0, 0, L.head);
const hairCap = mesh(new THREE.SphereGeometry(0.185, 16, 12, 0, TAU, 0, Math.PI * 0.55), HAIR, 0, 0.02, -0.015, L.head);
mesh(new THREE.SphereGeometry(0.19, 12, 8, Math.PI * 0.1, Math.PI * 0.8, Math.PI * 0.35, Math.PI * 0.45), HAIR, 0, 0, -0.02, L.head).rotation.y = Math.PI;
mesh(new THREE.SphereGeometry(0.08, 8, 6), HAIR_D, 0, 0.14, -0.14, L.head);
L.tail = new THREE.Group(); L.tail.position.set(0, 0.12, -0.18); L.head.add(L.tail);
[[0.075, 0, -0.08], [0.065, -0.12, -0.14], [0.05, -0.25, -0.17], [0.035, -0.36, -0.18]].forEach(([r, y, z]) => mesh(new THREE.SphereGeometry(r, 8, 6), HAIR, 0, y, z, L.tail));
for (let k = 0; k < 5; k++) mesh(new THREE.SphereGeometry(0.03, 6, 4), toon(0xfff4a8), -0.12 + Math.cos(k * TAU / 5) * 0.035, 0.15 + Math.sin(k * TAU / 5) * 0.035, 0.05, L.head, false);
mesh(new THREE.SphereGeometry(0.022, 6, 4), toon(SILK), -0.12, 0.15, 0.06, L.head, false);
[-0.06, 0.06].forEach(x => mesh(new THREE.SphereGeometry(0.025, 6, 5), EYE, x, 0.0, 0.155, L.head, false));
[-0.09, 0.09].forEach(x => mesh(new THREE.SphereGeometry(0.025, 6, 5), toon(0xffa0a0), x, -0.05, 0.14, L.head, false));
lyra.traverse(o => { if (o.isMesh) o.castShadow = true; });

// fita de seda (rastro físico)
const RIB_N = 26, ribPts = Array.from({ length: RIB_N }, () => new THREE.Vector3());
const ribGeo = new THREE.BufferGeometry();
ribGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RIB_N * 2 * 3), 3));
{ const idx = []; for (let i = 0; i < RIB_N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } ribGeo.setIndex(idx); }
const ribbon = new THREE.Mesh(ribGeo, new THREE.MeshBasicMaterial({ color: SILK, side: THREE.DoubleSide }));
ribbon.frustumCulled = false; scene.add(ribbon);
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _s = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
function updateRibbon(dt) {
  L.handR.getWorldPosition(ribPts[0]);
  const seg = P.dance > 0 ? 0.11 : 0.085;
  for (let i = 1; i < RIB_N; i++) {
    const p = ribPts[i];
    p.y -= (P.dance > 0 ? 0.3 : 1.6) * dt;
    p.x += Math.sin(time * 6 + i * 0.5) * 0.01; p.z += Math.cos(time * 5 + i * 0.4) * 0.01;
    _d.subVectors(p, ribPts[i - 1]);
    const l = _d.length() || 1;
    p.copy(ribPts[i - 1]).addScaledVector(_d, seg / l);
    const gy = groundY(p.x, p.z) + 0.03; if (p.y < gy) p.y = gy;
  }
  const arr = ribGeo.attributes.position.array;
  for (let i = 0; i < RIB_N; i++) {
    const a = ribPts[Math.max(0, i - 1)], b = ribPts[Math.min(RIB_N - 1, i + 1)];
    _d.subVectors(b, a); _s.crossVectors(_d, UP); if (_s.lengthSq() < 1e-6) _s.set(1, 0, 0); _s.normalize();
    const w = 0.055 * (1 - i / RIB_N * 0.5);
    const p = ribPts[i];
    arr.set([p.x + _s.x * w, p.y + w * 0.6, p.z + _s.z * w, p.x - _s.x * w, p.y - w * 0.6, p.z - _s.z * w], i * 6);
  }
  ribGeo.attributes.position.needsUpdate = true;
  ribGeo.computeBoundingSphere();
}

// ---------------------------------------------------------------- monstros (os mesmos do jogo 2D)
const MOBDEF = {
  pompom:    { name: 'Pompom', lv: 1, hp: 40, atk: 5, def: 0, xp: 9, zeny: [2, 6], speed: 1.6, aggro: 0, respawn: 8, drops: [['red', 0.18]] },
  zunzum:    { name: 'Zunzum', lv: 3, hp: 60, atk: 8, def: 1, xp: 16, zeny: [4, 10], speed: 2.8, aggro: 7, respawn: 10, drops: [['red', 0.2], ['blue', 0.05]] },
  fungolino: { name: 'Fungolino', lv: 5, hp: 110, atk: 12, def: 3, xp: 30, zeny: [6, 15], speed: 1.4, aggro: 0, respawn: 12, drops: [['red', 0.25], ['blue', 0.08]] },
  besouro:   { name: 'Besouro Rubi', lv: 9, hp: 200, atk: 19, def: 6, xp: 60, zeny: [12, 28], speed: 2.2, aggro: 8, respawn: 12, drops: [['red', 0.3], ['blue', 0.1]] },
  serpe:     { name: 'Serpe de Areia', lv: 12, hp: 300, atk: 26, def: 8, xp: 95, zeny: [18, 40], speed: 2.6, aggro: 9, respawn: 14, drops: [['red', 0.3], ['blue', 0.15]] },
  guardiao:  { name: 'Guardião das Areias', lv: 18, hp: 2400, atk: 42, def: 15, xp: 900, zeny: [300, 500], speed: 2.0, aggro: 14, respawn: 90, boss: true, drops: [['blue', 1], ['red', 1], ['red', 1]] },
};
const ITEMS = { red: { name: 'Poção Vermelha', price: 25 }, blue: { name: 'Poção Azul', price: 90 } };

function mobModel(type) {
  const g = new THREE.Group(), mats = [];
  const mt = c => { const m = new THREE.MeshLambertMaterial({ color: c }); mats.push(m); return m; };
  const ms = c => { const m = new THREE.MeshToonMaterial({ color: c }); mats.push(m); return m; };
  const r = { g, mats };
  switch (type) {
    case 'pompom': {
      const b = new THREE.Group(); g.add(b); r.b = b;
      mesh(new THREE.SphereGeometry(0.5, 18, 14), ms(0xff9ec7), 0, 0, 0, b);
      for (let i = 0; i < 10; i++) { const a = i * TAU / 10; mesh(new THREE.SphereGeometry(0.16, 8, 6), ms(0xf07aa8), Math.cos(a) * 0.45, -0.1, Math.sin(a) * 0.45, b); }
      [-0.16, 0.16].forEach(x => mesh(new THREE.SphereGeometry(0.06, 8, 6), ms(0x222222), x, 0.08, 0.45, b));
      mesh(new THREE.SphereGeometry(0.05, 6, 5), ms(0xd0507a), 0, -0.04, 0.48, b);
      const leaf = mesh(new THREE.SphereGeometry(0.12, 8, 6), ms(0x7ad36a), 0.05, 0.56, 0, b); leaf.scale.set(0.6, 1.6, 0.6); leaf.rotation.z = -0.5;
      r.anim = (m, t) => { const k = Math.abs(Math.sin(t * 6 + m.seed)); b.position.y = 0.5 + k * 0.45; const sq = 1 - k; b.scale.set(1 + sq * 0.15, 1 - sq * 0.15, 1 + sq * 0.15); };
      r.h = 1.3; break;
    }
    case 'zunzum': {
      const b = new THREE.Group(); g.add(b);
      const bd = mesh(new THREE.SphereGeometry(0.32, 14, 10), ms(0xf4c430), 0, 0, 0, b); bd.scale.set(1, 0.95, 1.4);
      [-0.12, 0.1].forEach(z => { const s = mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 16), ms(0x2a2a2a), 0, 0, z, b); });
      mesh(new THREE.SphereGeometry(0.22, 12, 8), ms(0xf4c430), 0, 0.05, 0.48, b);
      [-0.09, 0.09].forEach(x => mesh(new THREE.SphereGeometry(0.05, 6, 5), ms(0x111111), x, 0.1, 0.66, b));
      const st = mesh(new THREE.ConeGeometry(0.06, 0.25, 6), ms(0x222222), 0, 0, -0.55, b); st.rotation.x = -Math.PI / 2;
      const wm = new THREE.MeshLambertMaterial({ color: 0xe0f0ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
      const w1 = new THREE.Group(), w2 = new THREE.Group(); w1.position.set(-0.1, 0.25, 0); w2.position.set(0.1, 0.25, 0); b.add(w1, w2);
      mesh(new THREE.CircleGeometry(0.3, 10), wm, -0.3, 0, 0, w1, false).rotation.x = -Math.PI / 2;
      mesh(new THREE.CircleGeometry(0.3, 10), wm, 0.3, 0, 0, w2, false).rotation.x = -Math.PI / 2;
      r.anim = (m, t) => { b.position.y = 1.3 + Math.sin(t * 4 + m.seed) * 0.2; w1.rotation.z = Math.sin(t * 50) * 0.6; w2.rotation.z = -Math.sin(t * 50) * 0.6; };
      r.h = 2; break;
    }
    case 'fungolino': {
      const b = new THREE.Group(); g.add(b);
      mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.55, 12), ms(0xf7ecd8), 0, 0.32, 0, b);
      [-0.1, 0.1].forEach(x => mesh(new THREE.SphereGeometry(0.045, 6, 5), ms(0x333333), x, 0.4, 0.29, b));
      const cap = mesh(new THREE.SphereGeometry(0.62, 16, 8, 0, TAU, 0, Math.PI / 2), ms(0xd64545), 0, 0.55, 0, b); cap.scale.y = 0.75;
      [[0.2, 0.9, 0.3], [-0.3, 0.8, 0.2], [0, 0.95, -0.25], [0.35, 0.7, -0.25], [-0.2, 0.75, -0.4]].forEach(([x, y, z]) => mesh(new THREE.SphereGeometry(0.08, 6, 5), ms(0xffffff), x, y, z, b));
      [-0.12, 0.12].forEach(x => mesh(new THREE.SphereGeometry(0.1, 6, 5), ms(0xe8dcc8), x, 0.05, 0, b));
      r.anim = (m, t) => { b.rotation.z = m.moving ? Math.sin(t * 9) * 0.15 : 0; b.position.y = m.moving ? Math.abs(Math.sin(t * 9)) * 0.08 : 0; };
      r.h = 1.4; break;
    }
    case 'besouro': {
      const b = new THREE.Group(); g.add(b); b.scale.setScalar(1.1);
      const sh = mesh(new THREE.SphereGeometry(0.6, 16, 10, 0, TAU, 0, Math.PI / 2), mt(0xb0182a), 0, 0.25, 0, b); sh.scale.set(1, 0.9, 1.25);
      mesh(new THREE.BoxGeometry(0.02, 0.55, 1.4), mt(0x5a0a12), 0, 0.5, 0, b);
      mesh(new THREE.SphereGeometry(0.28, 10, 8), mt(0x2a0a0a), 0, 0.3, 0.75, b);
      const horn = mesh(new THREE.ConeGeometry(0.07, 0.5, 6), mt(0x2a0a0a), 0, 0.55, 0.95, b); horn.rotation.x = 0.6;
      [-0.12, 0.12].forEach(x => mesh(new THREE.SphereGeometry(0.04, 6, 5), mt(0xffd23f), x, 0.38, 0.98, b));
      r.legs = [];
      for (let i = 0; i < 6; i++) { const s = i < 3 ? -1 : 1, z = (i % 3 - 1) * 0.4; const l = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5), mt(0x3a1010), s * 0.6, 0.15, z, b); l.rotation.z = s * 0.9; r.legs.push(l); }
      r.anim = (m, t) => { r.legs.forEach((l, i) => l.rotation.x = m.moving ? Math.sin(t * 16 + i * 2) * 0.5 : 0); };
      r.h = 1.4; break;
    }
    case 'serpe': {
      const segs = [];
      for (let i = 0; i < 8; i++) segs.push(mesh(new THREE.SphereGeometry(0.28 - i * 0.02, 10, 8), mt(i % 2 ? 0xd4a052 : 0x9a6a30), 0, 0.25, -i * 0.38, g));
      const head = new THREE.Group(); g.add(head);
      const hd = mesh(new THREE.SphereGeometry(0.3, 12, 8), mt(0xd4a052), 0, 0, 0, head); hd.scale.set(1, 0.8, 1.3);
      [-0.13, 0.13].forEach(x => mesh(new THREE.SphereGeometry(0.05, 6, 5), mt(0xcc0000), x, 0.1, 0.28, head));
      const neck = mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.9, 8), mt(0xd4a052), 0, 0.55, 0.15, g); neck.rotation.x = 0.4;
      r.anim = (m, t) => { segs.forEach((s, i) => s.position.x = Math.sin(t * 5 + i * 0.8 + m.seed) * 0.18); head.position.set(Math.sin(t * 2) * 0.08, 1.0 + Math.sin(t * 3) * 0.08, 0.35); };
      r.h = 1.8; break;
    }
    case 'guardiao': {
      const b = new THREE.Group(); g.add(b); b.scale.setScalar(2.4);
      const c = 0xc08a52, d = 0x8a5a32;
      r.lg = [-0.3, 0.3].map(x => mesh(new THREE.BoxGeometry(0.4, 0.8, 0.45), mt(d), x, 0.4, 0, b));
      mesh(new THREE.BoxGeometry(1.2, 1.0, 0.8), mt(c), 0, 1.3, 0, b);
      mesh(new THREE.BoxGeometry(1.22, 0.1, 0.82), mt(d), 0, 1.05, 0, b);
      const core = mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshLambertMaterial({ color: 0x50dcff, emissive: 0x2090c0 }), 0, 1.35, 0.42, b);
      r.ar = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * 0.78, 1.65, 0); b.add(p); mesh(new THREE.BoxGeometry(0.35, 1.1, 0.4), mt(c), 0, -0.5, 0, p); return p; });
      mesh(new THREE.BoxGeometry(0.6, 0.5, 0.55), mt(c), 0, 2.05, 0, b);
      const eyeM = new THREE.MeshLambertMaterial({ color: 0x50dcff, emissive: 0x30b0e0 });
      [-0.13, 0.13].forEach(x => mesh(new THREE.BoxGeometry(0.1, 0.07, 0.05), eyeM, x, 2.1, 0.28, b));
      mesh(new THREE.BoxGeometry(0.7, 0.12, 0.65), mt(0xe8c070), 0, 2.36, 0, b);
      r.anim = (m, t) => { r.ar[0].rotation.x = Math.sin(t * 2) * 0.3 - (m.swing || 0) * 2; r.ar[1].rotation.x = -Math.sin(t * 2) * 0.3 - (m.swing || 0) * 2; core.rotation.y = t * 2; r.lg[0].rotation.x = m.moving ? Math.sin(t * 5) * 0.4 : 0; r.lg[1].rotation.x = m.moving ? -Math.sin(t * 5) * 0.4 : 0; };
      r.h = 6.5; break;
    }
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return r;
}

// ---------------------------------------------------------------- NPCs
const NPCS = [
  { id: 'master', name: 'Mestra Odete', x: VIL.x + 6, z: VIL.z + 6, look: [0x9b4dca, 0x2b2b5a, 'flower'] },
  { id: 'healer', name: 'Irmã Celina', x: VIL.x - 6, z: VIL.z - 6, look: [0xffffff, 0xf2e6c9, 'veil'] },
  { id: 'shop', name: 'Mercador Bento', x: VIL.x + 6, z: VIL.z - 6, look: [0x7a5a2a, 0x5a3a1a, 'cap'] },
  { id: 'guard', name: 'Guarda Tobias', x: VIL.x + 40, z: VIL.z - 5, look: [0x6a6f7a, 0x333333, 'helm'] },
  { id: 'healer', name: 'Curandeira Samira', x: OAS.x - 10, z: OAS.z - 18, look: [0xf4f0e6, 0x1a1a1a, 'veil'] },
  { id: 'shop', name: 'Mercador Farid', x: OAS.x + 4, z: OAS.z - 21, look: [0xb5651d, 0x2a1a0a, 'turban'] },
  { id: 'elder', name: 'Anciã Zahra', x: OAS.x + 14, z: OAS.z - 14, look: [0x6c3483, 0xe0e0e0, 'veil'] },
];
function bangSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.font = 'bold 54px Verdana'; x.textAlign = 'center'; x.lineWidth = 6; x.strokeStyle = '#000'; x.strokeText('!', 32, 52); x.fillStyle = '#ffcf40'; x.fillText('!', 32, 52);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.setScalar(0.6); return s;
}
for (const n of NPCS) {
  const [cloth, hair, hat] = n.look;
  const g = new THREE.Group(); g.position.set(n.x, groundY(n.x, n.z), n.z); scene.add(g);
  g.rotation.y = Math.atan2(VIL.x - n.x, VIL.z - n.z) + (n.x > 0 ? Math.PI : 0);
  mesh(new THREE.CylinderGeometry(0.2, 0.36, 1.2, 10), toon(cloth), 0, 0.6, 0, g);
  mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.25, 10), toon(cloth), 0, 1.3, 0, g);
  mesh(new THREE.SphereGeometry(0.17, 12, 10), SKIN, 0, 1.58, 0, g);
  mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, TAU, 0, Math.PI / 2), toon(hair), 0, 1.6, -0.01, g);
  [-0.06, 0.06].forEach(x => mesh(new THREE.SphereGeometry(0.022, 6, 4), EYE, x, 1.58, 0.155, g, false));
  if (hat === 'veil') mesh(new THREE.ConeGeometry(0.28, 0.7, 10, 1, true), new THREE.MeshToonMaterial({ color: n.x > 0 ? 0x2a9d8f : 0xd9534f, side: THREE.DoubleSide }), 0, 1.5, -0.03, g);
  if (hat === 'cap') mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.12, 10), toon(0xe0c060), 0, 1.74, 0, g);
  if (hat === 'helm') mesh(new THREE.SphereGeometry(0.2, 10, 8, 0, TAU, 0, Math.PI / 2), toon(0xaaaabb), 0, 1.62, 0, g);
  if (hat === 'turban') mesh(new THREE.TorusGeometry(0.15, 0.08, 8, 14), toon(0xf4d03f), 0, 1.72, 0, g).rotation.x = Math.PI / 2;
  if (hat === 'flower') for (let k = 0; k < 5; k++) mesh(new THREE.SphereGeometry(0.035, 6, 4), toon(0xff8ac0), 0.12 + Math.cos(k * TAU / 5) * 0.04, 1.72 + Math.sin(k * TAU / 5) * 0.04, 0.05, g, false);
  const bang = bangSprite(); bang.position.y = 2.3; g.add(bang); n.bang = bang; n.g = g;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  addOb(n.x, n.z, 0.45);
}

// ---------------------------------------------------------------- jogadora
const SKILLS = [
  { key: '1', id: 'whirl', name: 'Chicote Giratório', lv: 1, sp: 8, cd: 1.2, icon: '🌀', desc: 'Gira a fita causando 150% de dano ao redor.' },
  { key: '2', id: 'charm', name: 'Passo Encantador', lv: 3, sp: 14, cd: 6, icon: '💫', desc: 'Atordoa inimigos próximos por 3s.' },
  { key: '3', id: 'breeze', name: 'Dança da Brisa', lv: 5, sp: 20, cd: 25, icon: '🍃', desc: '25s: +50% vel. de ataque, +30% movimento.' },
  { key: '4', id: 'moon', name: 'Canção da Lua', lv: 8, sp: 28, cd: 15, icon: '🌙', desc: 'Cura 35% do HP e regenera por 6s.' },
  { key: '5', id: 'finale', name: 'Grande Finale', lv: 12, sp: 45, cd: 12, icon: '✨', desc: '350% de dano em grande área.' },
];
const P = {
  name: 'Lyra', lv: 1, xp: 0, zeny: 60, statPts: 3, str: 3, agi: 3, vit: 3, int: 3,
  hp: 1, sp: 1, inv: { red: 5, blue: 1 }, x: VIL.x, z: VIL.z + 10, y: 0, vy: 0, face: Math.PI,
  atkCd: 0, attackAnim: 0, dance: 0, sit: false, dead: false, deadT: 0, regenT: 0, cds: {}, buffs: {},
  combo: 0, comboT: 0, best: 0, dashT: 0, dashCd: 0, home: 'solmira', quest: 0, qcount: 0, hurtT: 0,
};
const stats = {
  atk: () => 8 + P.str * 2 + P.lv + Math.floor(P.agi / 3),
  matk: () => 6 + P.int * 3 + P.lv,
  def: () => Math.floor(P.vit * 0.6),
  maxHp: () => 90 + P.vit * 14 + P.lv * 12,
  maxSp: () => 30 + P.int * 7 + P.lv * 3,
  aspd: () => Math.max(0.22, 0.7 - P.agi * 0.012) / (P.buffs.breeze ? 1.5 : 1),
  speed: () => 6.2 * (P.buffs.breeze ? 1.3 : 1),
  flee: () => Math.min(0.55, 0.03 + P.agi * 0.012),
  crit: () => Math.min(0.5, 0.04 + P.agi * 0.004 + P.str * 0.002),
};
const xpNeed = lv => Math.floor(30 + 22 * Math.pow(lv, 1.75));

const QUESTS = [
  { mob: 'pompom', n: 5, txt: 'Derrote 5 Pompons nos Campos Dourados', xp: 60, zeny: 80, red: 3 },
  { mob: 'zunzum', n: 5, txt: 'Derrote 5 Zunzuns', xp: 120, zeny: 120, red: 4 },
  { mob: 'fungolino', n: 5, txt: 'Derrote 5 Fungolinos', xp: 220, zeny: 160, blue: 2 },
  { mob: 'besouro', n: 6, txt: 'Derrote 6 Besouros Rubi nas Areias Rubras', xp: 500, zeny: 300, red: 5 },
  { mob: 'serpe', n: 5, txt: 'Derrote 5 Serpes de Areia', xp: 900, zeny: 400, blue: 3 },
  { mob: 'guardiao', n: 1, txt: 'Derrote o Guardião das Areias nas ruínas', xp: 2500, zeny: 1500, blue: 5 },
];

// ---------------------------------------------------------------- estado
let mobs = [], drops = [], fx = [], floaters = [], respawnQ = [];
let time = 0, running = false, zone = null, nearNpc = null, dialogOpen = false;
const keys = {};
const camS = { yaw: Math.PI, pitch: 0.42, dist: 9, x: 0, y: 0, z: 0 };

const SPAWNS = [
  { type: 'pompom', n: 16, area: [-58, 14, -84, 84] }, { type: 'zunzum', n: 9, area: [-58, 14, -84, 84] },
  { type: 'fungolino', n: 9, area: [-40, 45, -84, 84] },
  { type: 'besouro', n: 14, area: [55, 145, -84, 84] }, { type: 'serpe', n: 10, area: [62, 145, -84, 84] },
  { type: 'guardiao', n: 1, at: RUIN },
];
function spawnMob(type, area, at) {
  const d = MOBDEF[type]; let x, z, t = 0;
  if (at) { x = at.x; z = at.z; }
  else do { x = rand(area[0], area[1]); z = rand(area[2], area[3]); t++; }
  while (t < 300 && (blocked(x, z, 1) || dRoad(x, z) < 4 || Math.hypot(x - P.x, z - P.z) < 18 || Math.hypot(x - OAS.x, z - OAS.z) < 34 || (type !== 'guardiao' && Math.hypot(x - RUIN.x, z - RUIN.z) < 16)));
  const model = mobModel(type);
  model.g.position.set(x, groundY(x, z), z); scene.add(model.g);
  const lab = document.createElement('div'); lab.className = 'mlabel' + (d.boss ? ' boss' : '');
  lab.innerHTML = `<span>${d.name} <small>Nv ${d.lv}</small></span><i><b></b></i>`; $('labels').appendChild(lab);
  const m = { type, d, x, z, sx: x, sz: z, hp: d.hp, maxHp: d.hp, seed: rand(0, 10), state: 'idle', timer: rand(0, 3), tx: x, tz: z, stun: 0, atkCd: 1, flash: 0, face: rand(0, TAU), moving: false, model, lab, area, at };
  mobs.push(m); return m;
}

// ---------------------------------------------------------------- efeitos
const fxGeo = { dot: new THREE.OctahedronGeometry(0.07), ring: new THREE.RingGeometry(0.92, 1, 48) };
fxGeo.ring.rotateX(-Math.PI / 2);
function burst(pos, color, n = 12, speed = 4, life = 0.7) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(fxGeo.dot, new THREE.MeshBasicMaterial({ color, transparent: true }));
    m.position.copy(pos); scene.add(m);
    const a = rand(0, TAU), e = rand(-0.3, 1.2), s = rand(speed * 0.3, speed);
    fx.push({ m, v: new THREE.Vector3(Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 2, Math.sin(a) * Math.cos(e) * s), life, max: life, kind: 'dot' });
  }
}
function ring(x, z, r, color, life = 0.5, y) {
  const m = new THREE.Mesh(fxGeo.ring, new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  m.position.set(x, (y ?? groundY(x, z)) + 0.15, z); scene.add(m);
  fx.push({ m, life, max: life, kind: 'ring', r });
}
function slash(color) {
  const geo = new THREE.RingGeometry(1.0, 2.6, 24, 1, -Math.PI * 0.45, Math.PI * 0.9);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.8 }));
  m.position.set(P.x, P.y + 1.0, P.z); m.rotation.y = P.face - Math.PI / 2; scene.add(m);
  fx.push({ m, life: 0.22, max: 0.22, kind: 'slash', own: geo });
}
const noteTex = ['♪', '♫', '♬'].map((ch, i) => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.font = 'bold 50px serif'; x.textAlign = 'center'; x.fillStyle = ['#ff4fa3', '#ffcf40', '#4fd1ff'][i]; x.fillText(ch, 32, 50);
  return new THREE.CanvasTexture(c);
});
function notes(n = 3) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex[irand(0, 2)], transparent: true, depthWrite: false }));
    s.scale.setScalar(0.5); s.position.set(P.x + rand(-0.8, 0.8), P.y + rand(1.6, 2.2), P.z + rand(-0.8, 0.8)); scene.add(s);
    fx.push({ m: s, v: new THREE.Vector3(rand(-0.5, 0.5), rand(1, 1.6), rand(-0.5, 0.5)), life: 1.3, max: 1.3, kind: 'note' });
  }
}
function updateFx(dt) {
  for (const f of fx) {
    f.life -= dt; const a = Math.max(0, f.life / f.max);
    if (f.kind === 'dot') { f.v.y -= 9 * dt; f.m.position.addScaledVector(f.v, dt); f.m.material.opacity = a; f.m.rotation.x += dt * 8; }
    else if (f.kind === 'note') { f.m.position.addScaledVector(f.v, dt); f.m.material.opacity = a; }
    else if (f.kind === 'ring') { const s = f.r * (0.2 + (1 - a) * 0.8); f.m.scale.set(s, 1, s); f.m.material.opacity = a; }
    else if (f.kind === 'slash') { f.m.material.opacity = a * 0.85; f.m.position.set(P.x, P.y + 1.0, P.z); }
    if (f.life <= 0) { scene.remove(f.m); f.m.material.dispose(); if (f.own) f.own.dispose(); }
  }
  fx = fx.filter(f => f.life > 0);
}
const _p = new THREE.Vector3();
function toScreen(x, y, z) {
  _p.set(x, y, z).project(camera);
  return { x: (_p.x + 1) / 2 * innerWidth, y: (1 - _p.y) / 2 * innerHeight, vis: _p.z < 1 && Math.abs(_p.x) < 1.2 && Math.abs(_p.y) < 1.2 };
}
function floater(x, y, z, txt, cls) {
  const el = document.createElement('div'); el.className = 'dmg ' + (cls || ''); el.textContent = txt;
  $('labels').appendChild(el); floaters.push({ el, x: x + rand(-0.3, 0.3), y, z, t: 0 });
}

// ---------------------------------------------------------------- UI helpers
function log(html, cls = '') {
  const el = document.createElement('div'); el.className = 'line ' + cls; el.innerHTML = html;
  const c = $('chat'); c.appendChild(el); while (c.children.length > 60) c.removeChild(c.firstChild); c.scrollTop = c.scrollHeight;
}
function banner(txt) { const b = $('banner'); b.textContent = txt; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
function judge(txt, cls) { const j = $('judge'); j.textContent = txt; j.className = cls; void j.offsetWidth; j.classList.add('pop'); }

// ---------------------------------------------------------------- ritmo
function rhythm() {
  const b = Audio8.beat();
  if (!b || !Audio8.musicOn) return { k: 1, grade: null };
  if (b.offset < 0.085) return { k: 1.6, grade: 'perfect' };
  if (b.offset < 0.15) return { k: 1.2, grade: 'good' };
  return { k: 1, grade: 'miss' };
}
function applyRhythm(r) {
  if (r.grade === 'perfect') { P.combo++; P.comboT = 3; judge('PERFEITO!', 'perfect'); ring(P.x, P.z, 1.6, 0xffcf40, 0.35); }
  else if (r.grade === 'good') { P.comboT = 3; judge('BOM', 'good'); }
  else if (r.grade === 'miss') { if (P.combo >= 3) log(`Combo de ${P.combo} perdido!`, 'bad'); P.combo = 0; judge('fora do ritmo', 'miss'); }
  P.best = Math.max(P.best, P.combo);
  return r.k * (1 + Math.min(1, P.combo * 0.05));
}

// ---------------------------------------------------------------- combate
function dmgMob(m, base, crit) {
  if (m.dead) return;
  let dmg = Math.max(1, Math.round(base * rand(0.9, 1.1) - m.d.def));
  if (crit) dmg = Math.round(dmg * 1.8);
  m.hp -= dmg; m.flash = 0.12; m.state = 'chase'; m.lastHit = time;
  floater(m.x, groundY(m.x, m.z) + m.model.h, m.z, dmg, crit ? 'crit' : '');
  Audio8.sfx(crit ? 'crit' : 'hit');
  _p.set(m.x, groundY(m.x, m.z) + m.model.h * 0.5, m.z);
  burst(_p.clone(), crit ? 0xffcf40 : 0xffffff, crit ? 10 : 5, 3, 0.4);
  if (m.hp <= 0) killMob(m);
}
function killMob(m) {
  m.dead = true; mobs = mobs.filter(o => o !== m);
  burst(new THREE.Vector3(m.x, groundY(m.x, m.z) + 0.6, m.z), m.d.boss ? 0xffcf40 : 0xffe0f0, m.d.boss ? 70 : 18, m.d.boss ? 9 : 4, 0.9);
  Audio8.sfx(m.d.boss ? 'boom' : 'die');
  scene.remove(m.model.g); m.lab.remove();
  drops.push(makeDrop('zeny', irand(...m.d.zeny), m.x, m.z));
  for (const [it, ch] of m.d.drops) if (Math.random() < ch) drops.push(makeDrop(it, 1, m.x + rand(-1, 1), m.z + rand(-1, 1)));
  const diff = P.lv - m.d.lv, mult = diff > 8 ? 0.3 : diff > 5 ? 0.6 : 1;
  const xp = Math.round(m.d.xp * mult);
  log(`Você derrotou <b>${m.d.name}</b>! +${xp} XP`, 'xp');
  gainXp(xp);
  const q = QUESTS[P.quest];
  if (q && q.mob === m.type && P.qcount < q.n) { P.qcount++; if (P.qcount === q.n) log(`📜 Missão concluída! Volte à <b>Mestra Odete</b>.`, 'gold'); }
  if (m.d.boss) log('🏆 <b>O Guardião das Areias caiu!</b> O ritmo do deserto foi restaurado!', 'gold');
  respawnQ.push({ type: m.type, area: m.area, at: m.at, t: m.d.respawn });
}
const dropGeo = { zeny: new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12), red: new THREE.SphereGeometry(0.16, 10, 8), blue: new THREE.SphereGeometry(0.16, 10, 8) };
const dropMat = { zeny: new THREE.MeshLambertMaterial({ color: 0xf5c518, emissive: 0x604000 }), red: new THREE.MeshLambertMaterial({ color: 0xe8312f, emissive: 0x400000 }), blue: new THREE.MeshLambertMaterial({ color: 0x2f7ae8, emissive: 0x001840 }) };
function makeDrop(id, n, x, z) {
  const m = new THREE.Mesh(dropGeo[id], dropMat[id]); m.castShadow = true;
  if (id === 'zeny') m.rotation.x = Math.PI / 2;
  m.position.set(x, groundY(x, z) + 0.4, z); scene.add(m);
  return { id, n, x, z, m, t: 0 };
}
function gainXp(n) {
  P.xp += n;
  while (P.xp >= xpNeed(P.lv) && P.lv < 60) {
    P.xp -= xpNeed(P.lv); P.lv++;
    P.statPts += 3 + Math.floor(P.lv / 5);
    P.hp = stats.maxHp(); P.sp = stats.maxSp();
    Audio8.sfx('level');
    for (let i = 0; i < 4; i++) setTimeout(() => ring(P.x, P.z, 2 + i, 0xffcf40, 0.7), i * 120);
    burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xffcf40, 40, 6, 1.1);
    floater(P.x, P.y + 2.6, P.z, 'LEVEL UP!', 'lvl');
    log(`✨ <b>Nível ${P.lv}!</b> Você ganhou pontos de atributo (tecla C).`, 'gold');
    const sk = SKILLS.find(s => s.lv === P.lv);
    if (sk) log(`Nova dança: <b>${sk.icon} ${sk.name}</b> [${sk.key}]`, 'gold');
    buildHotbar();
  }
}
function hurtPlayer(m, mult = 1) {
  if (P.dead || P.dashT > 0) return;
  if (Math.random() < stats.flee()) { floater(P.x, P.y + 2, P.z, 'Miss', 'miss'); Audio8.sfx('miss'); return; }
  const dmg = Math.max(1, Math.round(m.d.atk * mult * rand(0.85, 1.15) - stats.def()));
  P.hp -= dmg; P.hurtT = 0.2; P.sit = false;
  floater(P.x, P.y + 2, P.z, dmg, 'hurt'); Audio8.sfx('hurt');
  if (P.hp <= 0) { P.hp = 0; P.dead = true; P.deadT = 3; P.combo = 0; log('💔 Você desmaiou... voltando para a cidade.', 'bad'); }
}
function nearestMob(r, cone = true) {
  let best = null, bs = 1e9;
  for (const m of mobs) {
    const dx = m.x - P.x, dz = m.z - P.z, d = Math.hypot(dx, dz);
    if (d > r + (m.d.boss ? 1.6 : 0)) continue;
    let ang = Math.abs(((Math.atan2(dx, dz) - P.face + Math.PI) % TAU + TAU) % TAU - Math.PI);
    const score = d + (cone ? ang * 1.5 : 0);
    if (score < bs) { bs = score; best = m; }
  }
  return best;
}
function attack() {
  if (P.dead || dialogOpen || P.atkCd > 0) return;
  P.atkCd = stats.aspd(); P.attackAnim = 1; P.sit = false;
  const k = applyRhythm(rhythm());
  const m = nearestMob(3.4);
  if (m) P.face = Math.atan2(m.x - P.x, m.z - P.z);
  slash(k > 1.3 ? 0xffcf40 : SILK);
  Audio8.sfx('whip');
  if (m) {
    const d = Math.hypot(m.x - P.x, m.z - P.z);
    if (d < 3.4 + (m.d.boss ? 1.6 : 0)) dmgMob(m, stats.atk() * k, Math.random() < stats.crit());
  }
}
function useSkill(i) {
  const s = SKILLS[i];
  if (!s || P.dead || dialogOpen) return;
  if (P.lv < s.lv) { log(`${s.name} requer nível ${s.lv}.`, 'bad'); return; }
  if ((P.cds[s.id] || 0) > 0) return;
  if (P.sp < s.sp) { log('SP insuficiente!', 'bad'); return; }
  P.sp -= s.sp; P.cds[s.id] = s.cd; P.sit = false; P.dance = 1;
  const k = applyRhythm(rhythm());
  notes(4);
  const near = r => mobs.filter(m => Math.hypot(m.x - P.x, m.z - P.z) < r + (m.d.boss ? 1.6 : 0));
  const c = new THREE.Vector3(P.x, P.y + 1, P.z);
  switch (s.id) {
    case 'whirl': Audio8.sfx('whip'); ring(P.x, P.z, 4, SILK, 0.4); ring(P.x, P.z, 3, 0xffcf40, 0.3);
      near(4).forEach(m => dmgMob(m, stats.atk() * 1.5 * k, Math.random() < stats.crit())); break;
    case 'charm': Audio8.sfx('skill'); ring(P.x, P.z, 6, 0xb48cff, 0.7);
      near(6).forEach(m => { m.stun = 3; dmgMob(m, stats.matk() * 0.8 * k, false); }); break;
    case 'breeze': Audio8.sfx('buff'); P.buffs.breeze = 25; burst(c, 0x7dff9a, 30, 5, 0.9); log('🍃 Dança da Brisa: você está leve como o vento!', 'gold'); break;
    case 'moon': { Audio8.sfx('heal'); const h = Math.round(stats.maxHp() * 0.35 * k); P.hp = Math.min(stats.maxHp(), P.hp + h); P.buffs.moon = 6;
      floater(P.x, P.y + 2.4, P.z, '+' + h, 'heal'); ring(P.x, P.z, 2.5, 0xcfe8ff, 0.8); burst(c, 0xcfe8ff, 25, 3, 1.2); break; }
    case 'finale': Audio8.sfx('boom'); Audio8.sfx('buff');
      [SILK, 0xffcf40, 0x4fd1ff, 0xb48cff].forEach((cl, j) => setTimeout(() => ring(P.x, P.z, 3 + j * 2, cl, 0.6), j * 90));
      burst(c, 0xffcf40, 50, 8, 1.1); notes(8);
      near(8).forEach(m => dmgMob(m, (stats.atk() * 1.8 + stats.matk() * 1.7) * k, Math.random() < stats.crit())); break;
  }
}
function usePotion(id) {
  if (P.dead) return;
  if (!P.inv[id]) { log(`Sem ${ITEMS[id].name}.`, 'bad'); return; }
  P.inv[id]--; Audio8.sfx('heal');
  if (id === 'red') { P.hp = Math.min(stats.maxHp(), P.hp + 60); floater(P.x, P.y + 2.4, P.z, '+60', 'heal'); }
  else { P.sp = Math.min(stats.maxSp(), P.sp + 40); floater(P.x, P.y + 2.4, P.z, '+40 SP', 'sp'); }
  buildHotbar();
}

// ---------------------------------------------------------------- atualização
const ZONES = {
  solmira: { name: 'Vila de Solmira', music: 'solmira', town: true },
  campos: { name: 'Campos Dourados', music: 'campos' },
  areias: { name: 'Areias Rubras', music: 'areias' },
  kharum: { name: 'Oásis de Kharum', music: 'kharum', town: true },
};
function update(dt) {
  time += dt;
  updatePlayer(dt);
  for (const m of mobs) updateMob(m, dt);
  for (const r of respawnQ) r.t -= dt;
  respawnQ = respawnQ.filter(r => { if (r.t <= 0) { spawnMob(r.type, r.area, r.at); return false; } return true; });
  for (const d of drops) { d.t += dt; d.m.rotation.y += dt * 3; d.m.position.y = groundY(d.x, d.z) + 0.4 + Math.sin(d.t * 4) * 0.1; }
  updateFx(dt);
  for (const c of clouds) { c.position.x += dt * 1.2; if (c.position.x > WX + 20) c.position.x = -WX - 20; }
  if (Math.random() < dt * 30) { // água do chafariz
    const m = new THREE.Mesh(fxGeo.dot, new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true }));
    m.position.set(VIL.x, 2.7, VIL.z); scene.add(m);
    fx.push({ m, v: new THREE.Vector3(rand(-1.5, 1.5), rand(2, 3.5), rand(-1.5, 1.5)), life: 0.75, max: 0.75, kind: 'dot' });
  }
  if (Math.random() < dt * 2 && smokes.length) {
    const s = smokes[irand(0, smokes.length - 1)];
    if (Math.hypot(s.x - P.x, s.z - P.z) < 60) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.5 }));
      m.position.copy(s); scene.add(m);
      fx.push({ m, v: new THREE.Vector3(rand(-0.2, 0.2), 0.8, rand(-0.2, 0.2)), life: 2.5, max: 2.5, kind: 'note', own: m.geometry });
    }
  }
  for (const n of NPCS) n.bang.position.y = 2.3 + Math.sin(time * 3) * 0.1;
  const z = zoneOf(P.x, P.z);
  if (z !== zone) {
    zone = z; Audio8.play(ZONES[z].music); banner(ZONES[z].name);
    log(`Você entrou em <b>${ZONES[z].name}</b>.`, 'sys');
    if (ZONES[z].town) P.home = z;
  }
  if (P.combo && (P.comboT -= dt) <= 0) { if (P.combo >= 3) log(`Combo final: ${P.combo}`, 'sys'); P.combo = 0; }
  const des = smooth(40, 70, P.x);
  scene.background.copy(SKY_GREEN).lerp(SKY_DESERT, des); scene.fog.color.copy(scene.background);
}

function updatePlayer(dt) {
  if (P.dead) {
    P.deadT -= dt;
    if (P.deadT <= 0) {
      P.dead = false; P.hp = Math.round(stats.maxHp() * 0.5); P.sp = Math.round(stats.maxSp() * 0.5);
      P.xp = Math.max(0, P.xp - Math.floor(xpNeed(P.lv) * 0.03));
      const h = P.home === 'kharum' ? { x: OAS.x - 4, z: OAS.z - 22 } : { x: VIL.x, z: VIL.z + 10 };
      P.x = h.x; P.z = h.z; P.y = groundY(P.x, P.z);
    }
    return;
  }
  for (const k in P.cds) P.cds[k] = Math.max(0, P.cds[k] - dt);
  for (const k in P.buffs) { P.buffs[k] -= dt; if (P.buffs[k] <= 0) { delete P.buffs[k]; if (k === 'breeze') log('A Dança da Brisa terminou.', 'sys'); } }
  P.atkCd -= dt; P.attackAnim = Math.max(0, P.attackAnim - dt * 4); P.dance = Math.max(0, P.dance - dt * 1.5);
  P.hurtT = Math.max(0, P.hurtT - dt); P.dashCd -= dt;

  P.regenT += dt;
  if (P.regenT >= (P.sit ? 1 : 3)) {
    P.regenT = 0;
    P.hp = Math.min(stats.maxHp(), P.hp + Math.max(1, Math.floor(stats.maxHp() * 0.02 + P.vit * 0.3)));
    P.sp = Math.min(stats.maxSp(), P.sp + Math.max(1, Math.floor(stats.maxSp() * 0.03 + P.int * 0.2)));
  }
  if (P.buffs.moon) P.hp = Math.min(stats.maxHp(), P.hp + stats.maxHp() * 0.03 * dt);

  let ix = 0, iz = 0;
  if (!dialogOpen) {
    if (keys.w || keys.arrowup) iz += 1; if (keys.s || keys.arrowdown) iz -= 1;
    if (keys.a) ix += 1; if (keys.d) ix -= 1;
    if (keys.arrowleft) camS.yaw += dt * 2.2; if (keys.arrowright) camS.yaw -= dt * 2.2;
  }
  P.moving = false;
  let vx = 0, vz = 0;
  if (ix || iz) {
    P.sit = false;
    const l = Math.hypot(ix, iz); ix /= l; iz /= l;
    const fx_ = Math.sin(camS.yaw + Math.PI), fz = Math.cos(camS.yaw + Math.PI);
    vx = fx_ * iz + fz * ix; vz = fz * iz - fx_ * ix;
    const tf = Math.atan2(vx, vz);
    let df = ((tf - P.face + Math.PI) % TAU + TAU) % TAU - Math.PI;
    if (P.attackAnim <= 0.3) P.face += df * Math.min(1, dt * 14);
    const sp = stats.speed() * (P.attackAnim > 0.5 ? 0.5 : 1);
    vx *= sp; vz *= sp; P.moving = true;
  }
  if (P.dashT > 0) { P.dashT -= dt; vx = Math.sin(P.face) * 17; vz = Math.cos(P.face) * 17; if (Math.random() < 0.6) burst(new THREE.Vector3(P.x, P.y + 0.3, P.z), 0xffffff, 1, 1, 0.3); }
  const nx = P.x + vx * dt, nz = P.z + vz * dt;
  if (!blocked(nx, P.z)) P.x = nx;
  if (!blocked(P.x, nz)) P.z = nz;
  const gy = groundY(P.x, P.z);
  P.vy -= 20 * dt; P.y += P.vy * dt;
  if (P.y <= gy) { P.y = gy; P.vy = 0; P.onGround = true; } else P.onGround = P.y - gy < 0.05;
  if (P.buffs.breeze && Math.random() < 0.3) burst(new THREE.Vector3(P.x, P.y + rand(0.3, 1.5), P.z), 0x7dff9a, 1, 0.8, 0.5);

  for (const d of drops) if (d.t > 0.4 && Math.hypot(d.x - P.x, d.z - P.z) < 1.3) {
    d.taken = true; scene.remove(d.m);
    if (d.id === 'zeny') { P.zeny += d.n; Audio8.sfx('coin'); floater(d.x, P.y + 1.5, d.z, `+${d.n}z`, 'zeny'); }
    else { P.inv[d.id] = (P.inv[d.id] || 0) + d.n; Audio8.sfx('pick'); log(`Você pegou <b>${ITEMS[d.id].name}</b>.`, 'item'); buildHotbar(); }
  }
  drops = drops.filter(d => !d.taken);

  nearNpc = null;
  for (const n of NPCS) if (Math.hypot(n.x - P.x, n.z - P.z) < 3) nearNpc = n;
  const pr = $('prompt');
  if (nearNpc && !dialogOpen) { pr.innerHTML = `<b>[F]</b> Falar com ${nearNpc.name}`; pr.classList.remove('hidden'); }
  else pr.classList.add('hidden');
}

function updateMob(m, dt) {
  m.flash = Math.max(0, m.flash - dt); m.atkCd -= dt; m.moving = false; m.swing = Math.max(0, (m.swing || 0) - dt * 2);
  if (m.stun > 0) m.stun -= dt;
  else {
    const dP = Math.hypot(m.x - P.x, m.z - P.z);
    if (m.state !== 'chase' && m.d.aggro && dP < m.d.aggro && !P.dead) m.state = 'chase';
    const reach = m.d.boss ? 4.2 : 1.6;
    if (m.state === 'chase') {
      if (P.dead || Math.hypot(m.x - m.sx, m.z - m.sz) > 32) { m.state = 'return'; m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.25); }
      else if (dP > reach) stepMob(m, P.x, P.z, m.d.speed * 1.3, dt);
      else {
        m.face = Math.atan2(P.x - m.x, P.z - m.z);
        if (m.atkCd <= 0) {
          m.atkCd = m.d.boss ? 1.5 : 1.6; m.swing = 1;
          hurtPlayer(m);
          if (m.d.boss && Math.random() < 0.35) { ring(m.x, m.z, 7, 0xe0a050, 0.6); Audio8.sfx('boom'); if (dP < 7) hurtPlayer(m, 0.7); }
        }
      }
    } else if (m.state === 'return') {
      if (Math.hypot(m.x - m.sx, m.z - m.sz) < 1) m.state = 'idle';
      else stepMob(m, m.sx, m.sz, m.d.speed * 1.6, dt);
    } else {
      m.timer -= dt;
      if (m.timer <= 0) { m.timer = rand(2, 5); const a = rand(0, TAU), r = rand(1, 5); m.tx = m.sx + Math.cos(a) * r; m.tz = m.sz + Math.sin(a) * r; }
      if (Math.hypot(m.tx - m.x, m.tz - m.z) > 0.2) stepMob(m, m.tx, m.tz, m.d.speed * 0.5, dt);
    }
  }
  const g = m.model.g;
  g.position.set(m.x, groundY(m.x, m.z), m.z);
  let df = ((m.face - g.rotation.y + Math.PI) % TAU + TAU) % TAU - Math.PI;
  g.rotation.y += df * Math.min(1, dt * 8);
  if (m.stun <= 0) m.model.anim(m, time); else g.rotation.z = Math.sin(time * 8) * 0.1;
  if (m.stun <= 0) g.rotation.z = 0;
  const em = m.flash > 0 ? 0xffffff : 0x000000;
  for (const mt of m.model.mats) mt.emissive.setHex(em);
}
function stepMob(m, tx, tz, sp, dt) {
  const dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz);
  if (d < 0.01) return;
  const vx = dx / d * sp * dt, vz = dz / d * sp * dt, r = m.d.boss ? 1.2 : 0.5;
  let moved = false;
  if (!blocked(m.x + vx, m.z, r)) { m.x += vx; moved = true; }
  if (!blocked(m.x, m.z + vz, r)) { m.z += vz; moved = true; }
  if (!moved) { m.tx = m.x; m.tz = m.z; m.timer = 0; }
  m.face = Math.atan2(dx, dz); m.moving = moved;
}

// ---------------------------------------------------------------- animação da Lyra
function animateLyra(dt) {
  lyra.position.set(P.x, P.y, P.z);
  lyra.rotation.y = P.face + (P.dance > 0 ? (1 - P.dance) * TAU * 2 : 0);
  const t = time, run = P.moving && P.onGround;
  const sw = run ? Math.sin(t * 13) : 0;
  body.position.y = P.dead ? 0 : (P.sit ? -0.45 : (run ? Math.abs(Math.sin(t * 13)) * 0.06 : Math.sin(t * 2.5) * 0.015)) + (P.dance > 0 ? Math.sin(P.dance * Math.PI) * 0.5 : 0);
  body.rotation.x = P.dead ? -Math.PI / 2 : (run ? 0.12 : 0);
  if (P.dead) body.position.y = 0.2;
  L.legL.rotation.x = P.sit ? -1.5 : sw * 0.8; L.legR.rotation.x = P.sit ? -1.5 : -sw * 0.8;
  if (!P.onGround && !P.sit) { L.legL.rotation.x = -0.6; L.legR.rotation.x = 0.3; }
  L.skirt.scale.set(1 + (P.dance > 0 ? 0.35 : run ? 0.08 : 0), 1, 1 + (P.dance > 0 ? 0.35 : run ? 0.08 : 0));
  L.skirt.rotation.y = Math.sin(t * 3) * 0.1;
  if (P.attackAnim > 0) {
    const a = 1 - P.attackAnim;
    L.armR.rotation.set(-2.6 + a * 3.4, 0, 0.3 - a * 0.9); L.armL.rotation.set(0.3, 0, -0.4);
  } else if (P.dance > 0) {
    L.armR.rotation.set(0, 0, 2.6 + Math.sin(t * 14) * 0.3); L.armL.rotation.set(0, 0, -2.6 - Math.sin(t * 14) * 0.3);
  } else {
    L.armR.rotation.set(-sw * 0.8, 0, 0.18 + Math.sin(t * 2) * 0.03); L.armL.rotation.set(sw * 0.8, 0, -0.18 - Math.sin(t * 2) * 0.03);
  }
  L.tail.rotation.x = 0.2 + (run ? 0.5 : 0) + Math.sin(t * (run ? 13 : 2.5)) * 0.15;
  L.tail.rotation.z = Math.sin(t * 2) * 0.15;
  L.head.rotation.y = P.sit ? 0 : Math.sin(t * 0.7) * 0.15;
  lyra.visible = !(P.hurtT > 0 && Math.floor(time * 30) % 2);
  updateRibbon(dt);
}

// ---------------------------------------------------------------- câmera
function updateCamera(dt) {
  camS.pitch = clamp(camS.pitch, 0.08, 1.25); camS.dist = clamp(camS.dist, 4, 18);
  const tx = P.x, ty = P.y + 1.3, tz = P.z;
  camS.x = lerp(camS.x, tx, Math.min(1, dt * 10)); camS.y = lerp(camS.y, ty, Math.min(1, dt * 10)); camS.z = lerp(camS.z, tz, Math.min(1, dt * 10));
  const cx = camS.x + Math.sin(camS.yaw) * Math.cos(camS.pitch) * camS.dist;
  const cz = camS.z + Math.cos(camS.yaw) * Math.cos(camS.pitch) * camS.dist;
  let cy = camS.y + Math.sin(camS.pitch) * camS.dist;
  cy = Math.max(cy, height(cx, cz) + 0.6);
  camera.position.set(cx, cy, cz);
  camera.lookAt(camS.x, camS.y, camS.z);
  sun.position.set(P.x + 30, P.y + 50, P.z + 18); sun.target.position.set(P.x, P.y, P.z);
}

// ---------------------------------------------------------------- HUD
function updateLabels() {
  for (const m of mobs) {
    const d = Math.hypot(m.x - P.x, m.z - P.z);
    const show = d < (m.d.boss ? 45 : 22) && (m.hp < m.maxHp || d < 9 || m.d.boss);
    if (!show) { m.lab.style.display = 'none'; continue; }
    const s = toScreen(m.x, groundY(m.x, m.z) + m.model.h + 0.3, m.z);
    if (!s.vis) { m.lab.style.display = 'none'; continue; }
    m.lab.style.display = 'block';
    m.lab.style.transform = `translate(${s.x | 0}px,${s.y | 0}px) translate(-50%,-100%)`;
    m.lab.querySelector('b').style.width = (m.hp / m.maxHp * 100) + '%';
    m.lab.classList.toggle('stun', m.stun > 0);
  }
  for (const f of floaters) {
    f.t += 1 / 60; const s = toScreen(f.x, f.y + f.t * 1.2, f.z);
    f.el.style.transform = `translate(${s.x | 0}px,${s.y | 0}px) translate(-50%,-50%)`;
    f.el.style.opacity = s.vis ? 1 - f.t : 0;
    if (f.t > 1) f.el.remove();
  }
  floaters = floaters.filter(f => f.t <= 1);
  const ps = toScreen(P.x, P.y + 2.2, P.z);
  $('pname').style.transform = `translate(${ps.x | 0}px,${ps.y | 0}px) translate(-50%,-100%)`;
}
function updateHUD() {
  const mh = stats.maxHp(), ms = stats.maxSp(), need = xpNeed(P.lv);
  $('st-name').textContent = P.name;
  $('st-lv').textContent = `Dançarina · Nv ${P.lv}`;
  $('hpbar').style.width = (P.hp / mh * 100) + '%'; $('spbar').style.width = (P.sp / ms * 100) + '%'; $('xpbar').style.width = (P.xp / need * 100) + '%';
  $('hptxt').textContent = `${Math.ceil(P.hp)} / ${mh}`; $('sptxt').textContent = `${Math.floor(P.sp)} / ${ms}`; $('xptxt').textContent = `${(P.xp / need * 100).toFixed(1)}%`;
  $('zeny').textContent = P.zeny.toLocaleString('pt-BR');
  $('btn-stat').classList.toggle('alert', P.statPts > 0);
  document.querySelectorAll('.slot[data-skill]').forEach(el => {
    const s = SKILLS[+el.dataset.skill];
    el.querySelector('.cd').style.height = ((P.cds[s.id] || 0) / s.cd * 100) + '%';
    el.classList.toggle('locked', P.lv < s.lv); el.classList.toggle('nosp', P.sp < s.sp);
  });
  let b = '';
  if (P.buffs.breeze) b += `<span>🍃 ${Math.ceil(P.buffs.breeze)}s</span>`;
  if (P.buffs.moon) b += `<span>🌙 ${Math.ceil(P.buffs.moon)}s</span>`;
  if (P.sit) b += '<span>🧘 Descansando</span>';
  $('buffs').innerHTML = b;
  $('combo').innerHTML = P.combo >= 2 ? `<b>${P.combo}</b> COMBO<small>+${Math.min(100, P.combo * 5)}% dano</small>` : '';
  const q = QUESTS[P.quest];
  $('quest').innerHTML = q ? `<div class="wt">📜 Missão</div><div class="wb">${q.txt}<br><b>${Math.min(P.qcount, q.n)} / ${q.n}</b>${P.qcount >= q.n ? ' — fale com a Mestra Odete' : ''}</div>`
    : `<div class="wt">📜 Missões</div><div class="wb">Todas concluídas! Melhor combo: <b>${P.best}</b></div>`;
  if (!$('statwin').classList.contains('hidden')) renderStats();
}
// indicador de ritmo
const bc = $('beatcv'), bg = bc.getContext('2d');
function drawBeat() {
  const W = bc.width, H = bc.height, cx = W / 2;
  bg.clearRect(0, 0, W, H);
  const b = Audio8.beat();
  bg.fillStyle = 'rgba(20,26,40,.55)'; bg.beginPath(); bg.roundRect(0, 0, W, H, 10); bg.fill();
  if (!b || !Audio8.musicOn) { bg.fillStyle = '#aab'; bg.font = '11px Verdana'; bg.textAlign = 'center'; bg.fillText('ligue a música (M) para o ritmo', cx, H / 2 + 4); return; }
  const span = W / 2 - 14;
  for (let k = 0; k < 4; k++) {
    const until = (1 - b.phase) + k;
    const off = until / 3 * span;
    if (off > span) continue;
    const a = 1 - off / span;
    for (const s of [-1, 1]) {
      bg.fillStyle = `rgba(255,${k ? 120 : 207},${k ? 180 : 64},${0.3 + a * 0.7})`;
      bg.beginPath(); bg.roundRect(cx + s * off - 3, H / 2 - 10, 6, 20, 3); bg.fill();
    }
  }
  const pulse = Math.max(0, 1 - b.phase * 4);
  bg.strokeStyle = `rgba(255,207,64,${0.5 + pulse * 0.5})`; bg.lineWidth = 3;
  bg.beginPath(); bg.arc(cx, H / 2, 13 + pulse * 5, 0, TAU); bg.stroke();
  bg.fillStyle = `rgba(255,79,163,${0.4 + pulse * 0.6})`; bg.beginPath(); bg.arc(cx, H / 2, 7, 0, TAU); bg.fill();
}
// minimapa
const mm = $('minimap'), mg = mm.getContext('2d');
const mmBase = document.createElement('canvas'); mmBase.width = mm.width; mmBase.height = mm.height;
{
  const x = mmBase.getContext('2d'), c = new THREE.Color();
  for (let j = 0; j < mm.height; j++) for (let i = 0; i < mm.width; i++) {
    const wx = (i / mm.width) * WX * 2 - WX, wz = (j / mm.height) * WZ * 2 - WZ;
    const y = height(wx, wz);
    groundColor(wx, wz, y, c); if (isWater(wx, wz)) c.set(0x3f94e0);
    x.fillStyle = '#' + c.getHexString(); x.fillRect(i, j, 1, 1);
  }
}
function drawMinimap() {
  const sx = mm.width / (WX * 2), sz = mm.height / (WZ * 2);
  mg.drawImage(mmBase, 0, 0);
  for (const m of mobs) { mg.fillStyle = m.d.boss ? '#ff3030' : '#ff8080'; mg.fillRect((m.x + WX) * sx - 1, (m.z + WZ) * sz - 1, m.d.boss ? 4 : 2, m.d.boss ? 4 : 2); }
  for (const n of NPCS) { mg.fillStyle = '#ffcf40'; mg.fillRect((n.x + WX) * sx - 1.5, (n.z + WZ) * sz - 1.5, 3, 3); }
  const px = (P.x + WX) * sx, pz = (P.z + WZ) * sz;
  mg.save(); mg.translate(px, pz); mg.rotate(-P.face + Math.PI);
  mg.fillStyle = '#fff'; mg.strokeStyle = '#ff4fa3'; mg.lineWidth = 1.5;
  mg.beginPath(); mg.moveTo(0, -6); mg.lineTo(4, 4); mg.lineTo(-4, 4); mg.closePath(); mg.fill(); mg.stroke();
  mg.restore();
}
function buildHotbar() {
  const hb = $('hotbar'); hb.innerHTML = '';
  SKILLS.forEach((s, i) => {
    const el = document.createElement('div'); el.className = 'slot'; el.dataset.skill = i;
    el.title = `${s.name} (Nv ${s.lv}, ${s.sp} SP)\n${s.desc}`;
    el.innerHTML = `<span class="ic">${s.icon}</span><span class="k">${s.key}</span><span class="cost">${P.lv < s.lv ? 'Nv' + s.lv : s.sp}</span><div class="cd"></div>`;
    el.onclick = () => useSkill(i); hb.appendChild(el);
  });
  [['red', 'Q', '🧪'], ['blue', 'E', '💧']].forEach(([id, k, ic]) => {
    const el = document.createElement('div'); el.className = 'slot pot ' + id; el.title = ITEMS[id].name;
    el.innerHTML = `<span class="ic">${ic}</span><span class="k">${k}</span><span class="cost">x${P.inv[id] || 0}</span>`;
    el.onclick = () => usePotion(id); hb.appendChild(el);
  });
}
function renderStats() {
  const w = $('statwin');
  const row = (k, l, i) => `<div class="srow"><span class="sl">${l}</span><b>${P[k]}</b><button data-st="${k}" ${P.statPts ? '' : 'disabled'}>+</button><span class="si">${i}</span></div>`;
  const html = `<div class="wt">Atributos <span class="x" data-close>×</span></div>
    ${row('str', 'FOR', 'Dano físico')}${row('agi', 'AGI', 'Vel. ataque, esquiva')}${row('vit', 'VIT', 'HP e defesa')}${row('int', 'INT', 'SP e dano mágico')}
    <div class="pts">Pontos disponíveis: <b>${P.statPts}</b></div>
    <div class="derived">ATQ <b>${stats.atk()}</b> · MATQ <b>${stats.matk()}</b> · DEF <b>${stats.def()}</b><br>
    Ataques/s <b>${(1 / stats.aspd()).toFixed(2)}</b> · Esquiva <b>${Math.round(stats.flee() * 100)}%</b> · Crítico <b>${Math.round(stats.crit() * 100)}%</b></div>`;
  if (w.dataset.h !== html) { w.innerHTML = html; w.dataset.h = html; }
}
$('statwin').addEventListener('click', e => {
  const k = e.target.dataset.st;
  if (k && P.statPts > 0) { P[k]++; P.statPts--; Audio8.sfx('click'); renderStats(); }
  if (e.target.dataset.close !== undefined) toggleStats();
});
function toggleStats() { $('statwin').classList.toggle('hidden'); renderStats(); }

// ---------------------------------------------------------------- diálogos
function dialog(title, text, opts) {
  const d = $('dialog');
  d.innerHTML = `<div class="wt">${title}</div><div class="dtext">${text}</div><div class="dopts"></div>`;
  const o = d.querySelector('.dopts');
  (opts || [{ label: 'Fechar' }]).forEach(op => {
    const b = document.createElement('button'); b.textContent = op.label;
    b.onclick = () => { Audio8.sfx('click'); const keep = op.fn && op.fn(); if (!keep) closeDialog(); };
    o.appendChild(b);
  });
  d.classList.remove('hidden'); dialogOpen = true;
  for (const k in keys) keys[k] = false;
}
function closeDialog() { $('dialog').classList.add('hidden'); dialogOpen = false; }
function talk(n) {
  P.face = Math.atan2(n.x - P.x, n.z - P.z);
  const nm = `💬 ${n.name}`;
  switch (n.id) {
    case 'healer':
      dialog(nm, 'Que a luz guie seus passos, dançarina. Deixe-me cuidar de você.', [
        { label: '✚ Curar (grátis)', fn: () => { P.hp = stats.maxHp(); P.sp = stats.maxSp(); Audio8.sfx('heal'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xcfe8ff, 25, 3, 1); log(`${n.name} restaurou seu HP e SP.`, 'item'); } },
        { label: 'Até logo' }]); break;
    case 'shop': {
      const shop = () => dialog(nm, `Bem-vinda! Poções fresquinhas.<br><small>Zeny: <b>${P.zeny}z</b> · 🧪 ${P.inv.red} · 💧 ${P.inv.blue}</small>`, [
        { label: `🧪 Poção Vermelha — 25z`, fn: () => { buy('red', 1); shop(); return true; } },
        { label: `🧪×10 — 250z`, fn: () => { buy('red', 10); shop(); return true; } },
        { label: `💧 Poção Azul — 90z`, fn: () => { buy('blue', 1); shop(); return true; } },
        { label: 'Sair' }]);
      shop(); break;
    }
    case 'master': {
      const q = QUESTS[P.quest];
      if (!q) { dialog(nm, `Você restaurou o ritmo do mundo, ${P.name}! Estou tão orgulhosa.<br>Seu melhor combo foi <b>${P.best}</b>. Consegue superar?`); break; }
      if (P.qcount >= q.n) {
        dialog(nm, `Maravilhoso! Seus passos estão cada vez mais precisos.<br><br>Recompensa: <b>${q.xp} XP</b>, <b>${q.zeny}z</b>${q.red ? `, ${q.red}× Poção Vermelha` : ''}${q.blue ? `, ${q.blue}× Poção Azul` : ''}.`, [
          { label: '🎁 Receber recompensa', fn: () => {
            P.zeny += q.zeny; P.inv.red += q.red || 0; P.inv.blue += q.blue || 0; Audio8.sfx('coin'); gainXp(q.xp);
            P.quest++; P.qcount = 0; buildHotbar(); save();
            const nq = QUESTS[P.quest]; if (nq) log(`📜 Nova missão: <b>${nq.txt}</b>`, 'gold');
          } }]);
      } else if (P.quest === 0 && P.qcount === 0) {
        dialog(nm, `${P.name}, algo terrível aconteceu: a <b>melodia do mundo saiu do compasso</b>, e os monstros ficaram agitados.<br><br>
          Só uma dançarina pode trazer o ritmo de volta. <b>Golpeie no tempo da música</b> — veja o marcador de ritmo embaixo da tela. Golpes perfeitos causam muito mais dano e aumentam seu combo!<br><br>
          Primeira lição: <b>${q.txt}</b>.`, [{ label: 'Estou pronta!' }]);
      } else dialog(nm, `Continue praticando: <b>${q.txt}</b> (${P.qcount}/${q.n}).<br><small>Dica: aperte <b>X</b> para sentar e recuperar HP/SP mais rápido.</small>`);
      break;
    }
    case 'guard': dialog(nm, 'Os Campos Dourados começam aqui, a leste. Cuidado com os <b>Zunzuns</b>: eles atacam quem chega perto!<br>Seguindo a estrada você chega às <b>Areias Rubras</b> e ao <b>Oásis de Kharum</b>.'); break;
    case 'elder': dialog(nm, 'Dizem que o <b>Guardião das Areias</b> dança ao som das tempestades, nas ruínas ao sudeste daqui.<br>Ele só se curva diante de quem acerta o ritmo perfeito. Volte quando estiver acima do nível 15.'); break;
  }
}
function buy(id, n) {
  const c = ITEMS[id].price * n;
  if (P.zeny < c) { log('Zeny insuficiente!', 'bad'); Audio8.sfx('miss'); return; }
  P.zeny -= c; P.inv[id] = (P.inv[id] || 0) + n; Audio8.sfx('coin'); log(`Comprou ${n}x <b>${ITEMS[id].name}</b>.`, 'item'); buildHotbar();
}

// ---------------------------------------------------------------- entrada
const cvEl = renderer.domElement;
let drag = null;
cvEl.addEventListener('contextmenu', e => e.preventDefault());
cvEl.addEventListener('pointerdown', e => {
  if (!running) return;
  Audio8.init();
  drag = { x: e.clientX, y: e.clientY, b: e.button };
  if (e.button === 0 && e.pointerType === 'mouse') attack();
});
addEventListener('pointermove', e => {
  if (!drag) return;
  camS.yaw -= (e.clientX - drag.x) * 0.006; camS.pitch += (e.clientY - drag.y) * 0.005;
  drag.x = e.clientX; drag.y = e.clientY;
});
addEventListener('pointerup', () => { drag = null; });
cvEl.addEventListener('wheel', e => { camS.dist += e.deltaY * 0.01; e.preventDefault(); }, { passive: false });
addEventListener('keydown', e => {
  if (!running || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
  if (k === 'escape') { closeDialog(); $('statwin').classList.add('hidden'); return; }
  if (dialogOpen) return;
  keys[k] = true;
  if (e.repeat) return;
  const si = SKILLS.findIndex(s => s.key === k); if (si >= 0) useSkill(si);
  if (k === 'j' || k === 'k') attack();
  if (k === 'q') usePotion('red'); if (k === 'e') usePotion('blue');
  if (k === ' ' && P.onGround && !P.dead) { P.vy = 7.5; P.sit = false; }
  if (k === 'shift' && P.dashCd <= 0 && !P.dead) { P.dashT = 0.2; P.dashCd = 0.9; Audio8.sfx('whip'); }
  if (k === 'f' && nearNpc) talk(nearNpc);
  if (k === 'c') toggleStats();
  if (k === 'x') { P.sit = !P.sit; log(P.sit ? 'Você se sentou para descansar.' : 'Você se levantou.', 'sys'); }
  if (k === 'm') toggleMusic();
  if (k === 'h') showHelp();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function toggleMusic() { const on = Audio8.toggleMusic(); $('btn-music').textContent = on ? '🎵' : '🔇'; }
function showHelp() {
  dialog('📜 Como jogar', `
  <b>WASD</b> andar · <b>Arrastar o mouse</b> gira a câmera · <b>Roda</b> zoom<br>
  <b>Clique</b> ou <b>J</b> — golpe de fita · <b>Espaço</b> pular · <b>Shift</b> esquiva<br>
  <b>1–5</b> danças especiais · <b>Q</b> Poção Vermelha · <b>E</b> Poção Azul<br>
  <b>F</b> falar com NPC · <b>C</b> atributos · <b>X</b> sentar · <b>M</b> música<br><br>
  🎵 <b>Combate rítmico:</b> golpeie quando as barrinhas encontram o centro do marcador.
  <b style="color:#c08000">PERFEITO</b> = +60% de dano e aumenta o combo (até +100%). Errar o tempo zera o combo.<br><br>
  Caminho: Solmira → Campos Dourados → Areias Rubras → Oásis de Kharum. O jogo salva sozinho.`);
}
$('btn-stat').onclick = toggleStats; $('btn-music').onclick = toggleMusic; $('btn-help').onclick = showHelp;
$('btn-sit').onclick = () => { P.sit = !P.sit; };

// ---------------------------------------------------------------- salvar
const SAVE_KEY = 'lyra3d-save-v1';
function save() {
  if (!running) return;
  const keep = ['name', 'lv', 'xp', 'zeny', 'statPts', 'str', 'agi', 'vit', 'int', 'hp', 'sp', 'inv', 'x', 'z', 'face', 'home', 'quest', 'qcount', 'best'];
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(Object.fromEntries(keep.map(k => [k, P[k]])))); } catch (e) { }
}
function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
setInterval(save, 8000); addEventListener('beforeunload', save);

function start(fromSave) {
  Audio8.init();
  $('title').classList.add('hidden'); $('hud').classList.remove('hidden');
  if (fromSave) { const s = loadSave(); Object.assign(P, s, { inv: { red: 0, blue: 0, ...s.inv } }); if (blocked(P.x, P.z)) { P.x = VIL.x; P.z = VIL.z + 10; } }
  else { P.name = ($('name-in').value.trim() || 'Lyra').slice(0, 16); P.hp = stats.maxHp(); P.sp = stats.maxSp(); }
  P.y = groundY(P.x, P.z);
  $('pname').textContent = P.name;
  for (const s of SPAWNS) for (let i = 0; i < s.n; i++) spawnMob(s.type, s.area, s.at);
  L.handR.getWorldPosition(ribPts[0]); ribPts.forEach(p => p.copy(ribPts[0]));
  running = true; buildHotbar();
  if (fromSave) log(`Bem-vinda de volta, <b>${P.name}</b>!`, 'gold');
  else { log(`Bem-vinda, <b>${P.name}</b>! Fale com a <b>Mestra Odete</b> (aperte <b>F</b> perto dela).`, 'gold'); log('Aperte <b>H</b> para ver os controles.', 'sys'); }
}
$('btn-new').onclick = () => { if (loadSave() && !confirm('Começar um novo jogo vai apagar o progresso salvo. Continuar?')) return; start(false); };
$('btn-cont').onclick = () => start(true);
if (!loadSave()) $('btn-cont').style.display = 'none';
$('name-in').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-new').click(); });

// ---------------------------------------------------------------- loop
let last = performance.now();
P.y = groundY(P.x, P.z);
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (running) {
    update(dt); animateLyra(dt); updateCamera(dt);
    renderer.render(scene, camera);
    updateLabels(); updateHUD(); drawBeat(); drawMinimap();
  } else {
    // vitrine na tela de título
    time += dt; P.dance = (time % 4) < 1.2 ? 1 - (time % 4) / 1.2 : 0;
    P.moving = false; P.onGround = true;
    animateLyra(dt);
    camera.position.set(P.x + Math.sin(time * 0.2) * 5, P.y + 1.8, P.z + Math.cos(time * 0.2) * 5);
    camera.lookAt(P.x, P.y + 1.1, P.z);
    sun.position.set(P.x + 30, P.y + 50, P.z + 18); sun.target.position.set(P.x, P.y, P.z);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
