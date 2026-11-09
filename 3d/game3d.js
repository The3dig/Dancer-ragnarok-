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
const TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (TOUCH) document.body.classList.add('touch');
const rr = (a, b) => a + R() * (b - a);

// ---------------------------------------------------------------- renderer
// cores em sRGB + tone mapping cinematográfico
THREE.ColorManagement.legacyMode = false;
{ const setHSL0 = THREE.Color.prototype.setHSL; THREE.Color.prototype.setHSL = function (h, s, l) { setHSL0.call(this, h, s, l); return this.convertSRGBToLinear(); }; }
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 1.25 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.domElement.id = 'cv3';
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const SKY_GREEN = new THREE.Color(0xbfe3ff), SKY_DESERT = new THREE.Color(0xf6dcb2);
const SKY_TOP_G = new THREE.Color(0x3d8be0), SKY_TOP_D = new THREE.Color(0x6fa8d8);
scene.fog = new THREE.Fog(SKY_GREEN.clone(), 60, 175);
// céu em gradiente com sol
const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: SKY_TOP_G.clone() }, horizon: { value: SKY_GREEN.clone() }, sunDir: { value: new THREE.Vector3(0.5, 0.75, 0.3).normalize() } },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = vec4(p.xy, p.w * 0.9999, p.w); }',
  fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; varying vec3 vDir;
    void main(){ vec3 d = normalize(vDir); float h = clamp(d.y, 0.0, 1.0);
      vec3 c = mix(horizon, top, pow(h, 0.5));
      float s = max(dot(d, sunDir), 0.0);
      c += vec3(1.0, 0.92, 0.75) * (pow(s, 600.0) * 3.0 + pow(s, 12.0) * 0.18);
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
// sombreado estilo anime (3 tons) e contornos
const TOON_GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x1b1222, side: THREE.BackSide });
OUTLINE.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.022;'); };
function addOutline(root) {
  const list = [];
  root.traverse(o => { if (o.isMesh && !o.isOutline && !o.material.transparent && o.material.side !== THREE.DoubleSide && !o.material.isMeshBasicMaterial) list.push(o); });
  for (const o of list) { const ol = new THREE.Mesh(o.geometry, OUTLINE); ol.isOutline = true; ol.castShadow = false; o.add(ol); }
}
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
const hemi = new THREE.HemisphereLight(0xe4f2ff, 0x5a6a3a, 0.75); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 1.25);
sun.castShadow = true; sun.shadow.mapSize.set(TOUCH ? 1024 : 2048, TOUCH ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 140 });
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);
function fitScreen() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', fitScreen);
addEventListener('orientationchange', () => { fitScreen(); setTimeout(fitScreen, 300); setTimeout(fitScreen, 900); });

const matCache = {};
const M = (c, o) => { const k = c + JSON.stringify(o || {}); return matCache[k] || (matCache[k] = new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...o })); };
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  (parent || scene).add(m); return m;
}

// ---------------------------------------------------------------- mundo
const WX = 220, WZ = 90;
const VIL = { x: -105, z: 0 }, OAS = { x: 120, z: 55 }, RUIN = { x: 128, z: -52 }, LAIR = { x: -20, z: -64 };
// Reino Quebrado (extremo leste): Cidadela do Cisma e a Torre do Cisma
const CIT = { x: 188, z: 4 }, TOWER = { x: 196, z: -30 };
const TZ = 420;                                                   // andares da torre ficam fora do mapa (z ~ 420)
const FLOORS = [0, 1, 2, 3, 4, 5].map(i => ({ i, x: -250 + i * 100, z: TZ, y: 40 + i * 14, r: i === 5 ? 34 : 17 }));
const inTower = z => z > 300;
const floorAt = (x, z) => { for (const f of FLOORS) if (Math.hypot(x - f.x, z - f.z) < f.r + 6) return f; return null; };
const riverX = z => 20 + Math.sin(z * 0.08) * 4;
const WHEAT = [[-42, -42, 20, 14], [-22, 22, 18, 12], [30, -38, 13, 10], [-48, 30, 12, 10]];
function dRoad(x, z) {
  let d = Math.abs(z);
  if (x < -140 || x > 200) d = 99;
  const bd = Math.abs(x - 115) + (z < 0 ? -z : z > 40 ? z - 40 : 0);
  return Math.min(d, bd);
}
function zoneOf(x, z) {
  if (inTower(z)) { const f = floorAt(x, z); return f && f.i === 5 ? 'topo' : 'torre'; }
  if (x > 158) return 'cidadela';
  if (Math.hypot(x - LAIR.x, z - LAIR.z) < 24) return 'lair';
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
  f *= smooth(19, 27, Math.hypot(x - LAIR.x, z - LAIR.z));
  f *= smooth(26, 40, Math.hypot(x - CIT.x, z - CIT.z));
  h *= f;
  const rd = Math.abs(x - riverX(z));
  if (rd < 10) { h = lerp(Math.max(h, 0.3), h, smooth(6, 10, rd)); h -= 2.4 * (1 - smooth(2.6, 4.6, rd)); }
  const od = Math.hypot(x - OAS.x, z - OAS.z);
  if (od < 12) h -= 2.2 * (1 - smooth(6, 9, od));
  if (Math.abs(x) > WX - 6 || Math.abs(z) > WZ - 6) h += (Math.max(Math.abs(x) - WX + 6, Math.abs(z) - WZ + 6, 0)) * 1.2;
  return h;
}
const onBridge = (x, z) => Math.abs(z) < 2.6 && Math.abs(x - riverX(z)) < 6;
const groundY = (x, z) => inTower(z) ? (floorAt(x, z) || FLOORS[0]).y : onBridge(x, z) ? Math.max(0.35, height(x, z)) : height(x, z);
const nearWater = (x, z) => Math.abs(x - riverX(z)) < 5 || Math.hypot(x - OAS.x, z - OAS.z) < 9.5;
const isWater = (x, z) => !inTower(z) && !onBridge(x, z) && nearWater(x, z) && height(x, z) < -0.45;

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
  const rq = smooth(150, 164, x);
  if (rq > 0) {
    const dk = new THREE.Color().setHSL(0.76, 0.18, 0.17 + n * 1.5);
    const vein = Math.abs(Math.sin(x * 0.55 + Math.sin(z * 0.3) * 2.2) + Math.cos(z * 0.5 + Math.sin(x * 0.2)));
    if (vein < 0.09) dk.setHSL(0.78, 0.8, 0.45);
    if (Math.hypot(x - CIT.x, z - CIT.z) < 22 && dRoad(x, z) > 3.4) dk.setHSL(0.75, 0.06, 0.3 + ((Math.floor(x * 0.8) + Math.floor(z * 0.8)) & 1) * 0.04);
    c.lerp(dk, rq);
  }
  const lair = Math.hypot(x - LAIR.x, z - LAIR.z);
  if (lair < 20) {
    c.setHSL(0.76, 0.22, 0.16 + n + smooth(14, 20, lair) * 0.1);
    const crack = Math.abs(Math.sin(x * 0.9 + Math.sin(z * 0.4) * 2) + Math.cos(z * 0.8 + Math.sin(x * 0.3)));
    if (crack < 0.12 && lair < 17) c.setHSL(0.02, 0.9, 0.45);
  }
  const ruin = Math.hypot(x - RUIN.x, z - RUIN.z);
  if (ruin < 13) c.setHSL(0.06, 0.4, 0.55 + n);
  return c;
}

// terreno
(function buildTerrain() {
  const geo = new THREE.PlaneGeometry(WX * 2, WZ * 2, 352, 144);
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
const waterMat = new THREE.MeshPhongMaterial({ color: 0x2f86d6, specular: 0xbfe6ff, shininess: 140, transparent: true, opacity: 0.86 });
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
  if (inTower(z)) { const f = floorAt(x, z); if (!f || Math.hypot(x - f.x, z - f.z) > f.r - 1 - r) return true; const l = OB.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)); if (l) for (const o of l) if (Math.hypot(x - o.x, z - o.z) < o.r + r) return true; return false; }
  if (Math.abs(x) > WX - 4 || Math.abs(z) > WZ - 4) return true;
  if (isWater(x, z)) return true;
  const l = OB.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL));
  if (l) for (const o of l) if (Math.hypot(x - o.x, z - o.z) < o.r + r) return true;
  return false;
}
function freeSpot(x, z, minRoad = 5) {
  return Math.hypot(x - LAIR.x, z - LAIR.z) > 27 && !blocked(x, z, 1.2) && dRoad(x, z) > minRoad && Math.abs(x - riverX(z)) > 7;
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
for (let i = 0; i < 3200 && trees.length < 470; i++) {
  const x = rr(-WX + 5, 46), z = rr(-WZ + 5, WZ - 5);
  if (Math.hypot(x - VIL.x, z - VIL.z) < 52 && x < -55) continue;
  if (WHEAT.some(([wx, wz, ww, wd]) => x > wx - 2 && x < wx + ww + 2 && z > wz - 2 && z < wz + wd + 2)) continue;
  if (!freeSpot(x, z, 6)) continue;
  trees.push({ x, z, s: rr(0.8, 1.4) });
}
trees.forEach(t => addOb(t.x, t.z, 0.7));
for (let i = 0; i < 1500 && cacti.length < 70; i++) {
  const x = rr(56, WX - 5), z = rr(-WZ + 5, WZ - 5);
  if (x > 150 || Math.hypot(x - OAS.x, z - OAS.z) < 36 || Math.hypot(x - RUIN.x, z - RUIN.z) < 18 || !freeSpot(x, z)) continue;
  cacti.push({ x, z, s: rr(0.8, 1.3), r: rr(0, TAU) }); addOb(x, z, 0.5);
}
for (let i = 0; i < 1500 && rocks.length < 90; i++) {
  const x = rr(-60, WX - 5), z = rr(-WZ + 5, WZ - 5);
  if (Math.hypot(x - OAS.x, z - OAS.z) < 34 || Math.hypot(x - CIT.x, z - CIT.z) < 30 || !freeSpot(x, z)) continue;
  const s = rr(0.5, x > 50 ? 1.8 : 1); rocks.push({ x, z, s }); addOb(x, z, s * 0.8);
}
for (let a = 0; a < TAU; a += TAU / 14) palms.push({ x: OAS.x + Math.cos(a) * 11.5, z: OAS.z + Math.sin(a) * 11.5, s: rr(0.9, 1.2), lean: rr(-0.2, 0.2) });
for (let i = 0; i < 12; i++) { const x = rr(60, 140), z = rr(-80, 80); if (freeSpot(x, z) && Math.hypot(x - OAS.x, z - OAS.z) > 36) palms.push({ x, z, s: rr(0.9, 1.2), lean: rr(-0.25, 0.25) }); }
palms.forEach(p => addOb(p.x, p.z, 0.5));

instanced(new THREE.CylinderGeometry(0.18, 0.28, 2, 6), M(0x7a4f2a), trees, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + o.s, o.z); s.setScalar(o.s); c.set(0xffffff); });
instanced(new THREE.IcosahedronGeometry(1.5, 2), new THREE.MeshLambertMaterial(), trees, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + 2.6 * o.s, o.z); s.set(o.s, o.s * 1.15, o.s); q.setFromEuler(new THREE.Euler(0, o.x, 0)); c.setHSL(0.27 + Math.sin(o.x * 3) * 0.04, 0.55, 0.32 + Math.cos(o.z) * 0.05); });
instanced(new THREE.IcosahedronGeometry(1.0, 2), new THREE.MeshLambertMaterial(), trees, (o, p, q, s, c) => { p.set(o.x + 0.3, height(o.x, o.z) + 3.8 * o.s, o.z - 0.2); s.setScalar(o.s); c.setHSL(0.26, 0.55, 0.42); });
const treeIM = scene.children.filter(o => o.isInstancedMesh && o.count === trees.length);
const treeOrig = treeIM.map(im => trees.map((t, i) => { const m4 = new THREE.Matrix4(); im.getMatrixAt(i, m4); return m4; }));
const treeGrid = new Map();
trees.forEach((t, i) => { const k = Math.floor(t.x / CELL) + ',' + Math.floor(t.z / CELL); if (!treeGrid.has(k)) treeGrid.set(k, []); treeGrid.get(k).push(i); });
let treeHidden = new Set();
const ZERO_M = new THREE.Matrix4().makeScale(0, 0, 0);
function hideTreesBetween(ax, az, bx, bz, by0, by1) {
  const now = new Set(), len = Math.hypot(bx - ax, bz - az) || 1;
  for (let k = 0; k <= 12; k++) {
    const x = lerp(ax, bx, k / 12), z = lerp(az, bz, k / 12);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const l = treeGrid.get((Math.floor(x / CELL) + i) + ',' + (Math.floor(z / CELL) + j)); if (!l) continue;
      for (const ti of l) {
        const t = trees[ti];
        // distância do tronco ao segmento câmera→personagem
        const u = clamp(((t.x - ax) * (bx - ax) + (t.z - az) * (bz - az)) / (len * len), 0, 1);
        const d = Math.hypot(ax + (bx - ax) * u - t.x, az + (bz - az) * u - t.z);
        const ly = lerp(by0, by1, u), top = height(t.x, t.z) + 4.6 * t.s;
        if (d < 2.3 * t.s && ly < top && u > 0.04) now.add(ti);
      }
    }
  }
  let dirty = false;
  for (const ti of treeHidden) if (!now.has(ti)) { treeIM.forEach((im, n) => im.setMatrixAt(ti, treeOrig[n][ti])); dirty = true; }
  for (const ti of now) if (!treeHidden.has(ti)) { treeIM.forEach(im => im.setMatrixAt(ti, ZERO_M)); dirty = true; }
  if (dirty) treeIM.forEach(im => { im.instanceMatrix.needsUpdate = true; });
  treeHidden = now;
}
instanced(new THREE.DodecahedronGeometry(0.8, 0), new THREE.MeshLambertMaterial({ flatShading: true }), rocks, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + o.s * 0.3, o.z); s.set(o.s * 1.2, o.s * 0.8, o.s); q.setFromEuler(new THREE.Euler(o.x, o.z, 0)); c.setHSL(0.08, 0.12, o.x > 50 ? 0.5 : 0.45); });
instanced(new THREE.CylinderGeometry(0.32, 0.36, 2.6, 8), new THREE.MeshLambertMaterial({ flatShading: true }), cacti, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + 1.3 * o.s, o.z); s.setScalar(o.s); c.set(0x3f8f4a); });
instanced(new THREE.CylinderGeometry(0.2, 0.22, 1.1, 6), new THREE.MeshLambertMaterial({ flatShading: true }), cacti, (o, p, q, s, c) => { p.set(o.x + Math.cos(o.r) * 0.55 * o.s, height(o.x, o.z) + 1.6 * o.s, o.z + Math.sin(o.r) * 0.55 * o.s); s.setScalar(o.s); c.set(0x3f8f4a); });
// trigo
{
  const stalks = [];
  for (const [wx, wz, ww, wd] of WHEAT) for (let x = wx; x < wx + ww; x += 0.7) for (let z = wz; z < wz + wd; z += 0.7) stalks.push({ x: x + rr(0, 0.5), z: z + rr(0, 0.5), h: rr(0.8, 1.2) });
  window.wheat = instanced(new THREE.ConeGeometry(0.12, 1.2, 4), new THREE.MeshLambertMaterial({ flatShading: true }), stalks, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + 0.6 * o.h, o.z); s.set(1, o.h, 1); c.setHSL(0.12 + rr(-0.01, 0.02), 0.75, 0.55); });
}
// grama que balança e flores
const windU = { value: 0 };
{
  const grassOk = (x, z) => x < 44 && dRoad(x, z) > 3.8 && Math.hypot(x - VIL.x, z - VIL.z) > 18 && Math.hypot(x - LAIR.x, z - LAIR.z) > 21 &&
    !isWater(x, z) && Math.abs(x - riverX(z)) > 5.5 && !WHEAT.some(([wx, wz, ww, wd]) => x > wx && x < wx + ww && z > wz && z < wz + wd) && Math.abs(x) < WX - 6 && Math.abs(z) < WZ - 6;
  const pos = [], col = [];
  for (let b = 0; b < 3; b++) {           // tufo de 3 folhas cruzadas
    const a = b * Math.PI / 3, cx = Math.cos(a) * 0.12, cz = Math.sin(a) * 0.12;
    pos.push(-cx, 0, -cz, cx, 0, cz, 0, 0.55, 0); col.push(0.35, 0.55, 0.2, 0.35, 0.55, 0.2, 1, 1, 0.8);
  }
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  gg.computeVertexNormals();
  const gm = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  gm.onBeforeCompile = sh => {
    sh.uniforms.uTime = windU;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      'vec3 transformed = position; float ph = instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.27; transformed.x += sin(uTime * 2.2 + ph) * position.y * 0.25; transformed.z += cos(uTime * 1.7 + ph) * position.y * 0.15;');
  };
  const N = TOUCH ? 4500 : 11000, list = [];
  for (let i = 0; i < N * 3 && list.length < N; i++) { const x = rr(-WX + 6, 44), z = rr(-WZ + 6, WZ - 6); if (grassOk(x, z)) list.push({ x, z, s: rr(0.45, 0.85), r: rr(0, TAU) }); }
  const grass = instanced(gg, gm, list, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z), o.z); s.set(o.s, o.s * rr(0.8, 1.3), o.s); q.setFromEuler(new THREE.Euler(0, o.r, 0)); c.setHSL(0.24 + rr(0, 0.07), 0.55, 0.42 + rr(-0.05, 0.08)); });
  grass.castShadow = false;
  const fl = [];
  for (let i = 0; i < 6000 && fl.length < (TOUCH ? 700 : 1600); i++) { const x = rr(-WX + 6, 44), z = rr(-WZ + 6, WZ - 6); if (grassOk(x, z)) fl.push({ x, z }); }
  const FLC = [0xffffff, 0xffd84a, 0xff7eb6, 0xb48cff, 0xff6b5b];
  const fm = instanced(new THREE.IcosahedronGeometry(0.09, 0), new THREE.MeshLambertMaterial(), fl, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + 0.38, o.z); s.set(1, 0.6, 1); c.set(FLC[Math.floor(rr(0, FLC.length))]); });
  fm.castShadow = false;
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
const toon = c => new THREE.MeshToonMaterial({ color: c, gradientMap: TOON_GRAD });
const SKIN = toon(0xffd9be), HAIR = toon(0xff7b6b), HAIR_D = toon(0xd9534f), CLOTH = toon(0x1fb5a8), CLOTH_D = toon(0x13887e), GOLD = toon(0xffcf40), SILK = 0xff4fa3, EYE = toon(0x3a2a4a);

// ---------------------------------------------------------------- personagem (gerado por avatar.js)
const lyra = new THREE.Group(); scene.add(lyra);
let L = buildAvatar(lyra, { race: 'humano', cls: 'dancarina', gender: 'f', hair: 0, skin: 0 });
let body = L.body;
function rebuildAvatar() {
  L = buildAvatar(lyra, { race: P.race, cls: P.cls, gender: P.gender, hair: P.hair, skin: P.skin });
  body = L.body; ribbon.visible = !!L.ribbon;
  lyra.updateMatrixWorld(true); L.handR.getWorldPosition(ribPts[0]); ribPts.forEach(p => p.copy(ribPts[0]));
}

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
  besouro:   { name: 'Caranguejo Rubi', lv: 9, hp: 200, atk: 19, def: 6, xp: 60, zeny: [12, 28], speed: 2.2, aggro: 8, respawn: 12, drops: [['red', 0.3], ['blue', 0.1]] },
  serpe:     { name: 'Raptor das Dunas', lv: 12, hp: 300, atk: 26, def: 8, xp: 95, zeny: [18, 40], speed: 2.6, aggro: 9, respawn: 14, drops: [['red', 0.3], ['blue', 0.15]] },
  kravenox:  { name: 'Kravenox', lv: 40, hp: 50000, atk: 70, def: 22, xp: 6000, zeny: [2500, 3500], speed: 3.4, aggro: 40, rad: 5, respawn: 1e9, boss: true, world: true, drops: [['blue', 1], ['blue', 1], ['blue', 1], ['red', 1], ['red', 1], ['red', 1]] },
  larva:     { name: 'Larva da Essência', lv: 14, hp: 520, atk: 34, def: 10, xp: 180, zeny: [20, 45], speed: 2.4, aggro: 13, respawn: 1e9, drops: [['red', 0.4], ['blue', 0.15]] },
  verme:     { name: 'Verme de Dentes', lv: 16, hp: 640, atk: 40, def: 12, xp: 230, zeny: [25, 55], speed: 2.0, aggro: 12, respawn: 1e9, drops: [['red', 0.4], ['blue', 0.2]] },
  esfera:    { name: 'Sentinela Esférica', lv: 17, hp: 560, atk: 44, def: 16, xp: 260, zeny: [30, 60], speed: 3.0, aggro: 15, respawn: 1e9, drops: [['blue', 0.3]] },
  sentinela: { name: 'Sentinela do Vazio', lv: 19, hp: 1000, atk: 52, def: 20, xp: 380, zeny: [40, 90], speed: 2.6, aggro: 16, respawn: 1e9, drops: [['red', 0.5], ['blue', 0.3]] },
  guardiao:  { name: 'Guardião das Areias', lv: 18, hp: 2400, atk: 42, def: 15, xp: 900, zeny: [300, 500], speed: 2.0, aggro: 14, respawn: 90, boss: true, drops: [['blue', 1], ['red', 1], ['red', 1]] },
};
const ITEMS = { red: { name: 'Poção Vermelha', price: 25 }, blue: { name: 'Poção Azul', price: 90 } };

function mobModel(type) {
  const g = new THREE.Group(), mats = [];
  const mt = c => { const m = new THREE.MeshLambertMaterial({ color: c }); mats.push(m); return m; };
  const ms = c => { const m = new THREE.MeshToonMaterial({ color: c }); mats.push(m); return m; };
  const r = { g, mats };
  if (['larva', 'verme', 'esfera', 'sentinela'].includes(type)) return towerMobModel(type, r, mt);
  if (ModelKit.ready && MOB_MODELS[type]) return mobFromModel(type, r);
  if (type === 'kravenox') return kravenoxModel(r, mt);
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
  if (!TOUCH) addOutline(g);
  return r;
}

const MOB_MODELS = {
  pompom:    { m: 'slime_pink', h: 0.85, idle: 'Idle', walk: 'Walk', atk: 'Bite_Front', die: 'Death' },
  zunzum:    { m: 'bee', h: 0.75, y: 0.9, idle: 'Flying', walk: 'Flying', atk: 'Bite_Front', die: 'Death' },
  fungolino: { m: 'mushroom_imp', h: 1.15, idle: 'Idle', walk: 'Walk', atk: 'Bite_Front', die: 'Death' },
  besouro:   { m: 'crab', h: 0.95, idle: 'Idle', walk: 'Walk', atk: 'Bite_Front', die: 'Death' },
  serpe:     { m: 'raptor', h: 1.35, idle: 'Velociraptor_Idle', walk: 'Velociraptor_Run', atk: 'Velociraptor_Attack', die: 'Velociraptor_Death', tint: { '*': 0xc8955a } },
  guardiao:  { m: 'orc_brute', h: 3.6, idle: 'Idle', walk: 'Walk', atk: 'Weapon', die: 'Death', tint: { Orc_Main: 0xc79a5c, Orc_Secondary: 0x8a5a32 } },
  // Kravenox mantém o visual original (kravenoxModel em kravenox.js)
};
function mobFromModel(type, r) {
  const d = MOB_MODELS[type], inst = ModelKit.instance(d.m, d.h);
  const holder = new THREE.Group(); holder.position.y = d.y || 0; holder.add(inst.root); r.g.add(holder);
  if (d.tint) for (const [mn, c] of Object.entries(d.tint)) { if (mn === '*') inst.mats.forEach(m => m.color.lerp(new THREE.Color(c), 0.5)); else inst.tint(mn, c); }
  r.mats = inst.mats.filter(m => m.emissive);
  r.inst = inst; r.h = d.h + (d.y || 0); r.def = d;
  r.lt = 0; r.lastSwing = 0;
  inst.play(d.idle);
  r.anim = (m, t) => {
    const dt = Math.min(0.1, r.lt ? t - r.lt : 0); r.lt = t;
    const sw = Math.max(m.swing || 0, m.roar > 0.3 ? 1 : 0);
    if (sw > 0.9 && r.lastSwing <= 0.9) inst.play(type === 'kravenox' && Math.random() < 0.5 ? d.atk2 : d.atk, { once: true, restart: true, speed: 1.3 });
    else if (sw <= 0.05) inst.play(m.moving ? d.walk : d.idle, { speed: m.moving ? 1.2 : 1 });
    r.lastSwing = sw;
    if (type === 'kravenox') inst.tint('Dragon_Main', m.enraged ? 0x5a1020 : 0x2c1a3c);
    inst.update(dt);
  };
  r.g.traverse(o => { if (o.isMesh) o.castShadow = true; });
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
  { id: 'watch', name: 'Vigia Morvan', x: CIT.x + 2, z: CIT.z - 16, look: [0x2a2430, 0x1a1a1a, 'helm'] },
  { id: 'healer', name: 'Curandeira Ilsa', x: CIT.x - 8, z: CIT.z + 2, look: [0x3a2848, 0xd8d8d8, 'veil'] },
  { id: 'shop', name: 'Mercador Dravo', x: CIT.x + 8, z: CIT.z + 3, look: [0x5a2a2a, 0x2a1a0a, 'cap'] },
  { id: 'elder', name: 'Anciã Zahra', x: OAS.x + 14, z: OAS.z - 14, look: [0x6c3483, 0xe0e0e0, 'veil'] },
];
function upgradeNPCs() {
  for (const n of NPCS) {
    const [cloth, hair, hat] = n.look, fem = ['veil', 'flower'].includes(hat);
    const inst = ModelKit.instance(fem ? 'hooded_adventurer' : 'worker', 1.72);
    if (!inst) return;
    for (const c of [...n.g.children]) if (c !== n.bang) n.g.remove(c);
    if (fem) { inst.tint('DarkBrown', cloth); inst.tint('LightBrown', 0xe8d8b0); const sw = inst.obj.getObjectByName('Sword') || inst.mesh('Sword'); if (sw) sw.visible = false; }
    else { inst.tint('Shirt', cloth); inst.tint('Hair', hair); inst.tint('Pants', 0x4a3a2a); }
    inst.play(fem ? 'Idle' : 'Man_Idle');
    n.g.add(inst.root); n.inst = inst;
    inst.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  }
}
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
  addOutline(g);
  addOb(n.x, n.z, 0.45);
}

// ---------------------------------------------------------------- jogadora
const P = {
  name: 'Lyra', race: 'humano', cls: 'dancarina', gender: 'f', hair: 0, skin: 0,
  lv: 1, xp: 0, zeny: 60, statPts: 3, str: 3, agi: 3, vit: 3, int: 3, dex: 3, luk: 3,
  hp: 1, sp: 1, inv: { red: 5, blue: 1 }, x: VIL.x, z: VIL.z + 10, y: 0, vy: 0, face: Math.PI,
  skillLv: {}, skillPts: 0,
  atkCd: 0, attackAnim: 0, dance: 0, cast: 0, sit: false, dead: false, deadT: 0, regenT: 0, cds: {}, buffs: {},
  combo: 0, comboT: 0, best: 0, dashT: 0, dashCd: 0, home: 'solmira', quest: 0, qcount: 0, hurtT: 0,
};
const CLS = () => CLASSES[P.cls] || CLASSES.dancarina;
let SKILLS = [];
function refreshSkills() { SKILLS = CLS().skills.map((s, i) => ({ ...s, key: String(i + 1) })); }
refreshSkills();
// bônus de buffs: multiplicativos (atk, matk, aspd, speed) e aditivos (def, crit, poison, regen)
function bmul(k) { let v = 1; for (const id in P.buffs) { const m = P.buffs[id].mods; if (m && m[k] !== undefined) v *= m[k]; } return v; }
function badd(k) { let v = 0; for (const id in P.buffs) { const m = P.buffs[id].mods; if (m && m[k] !== undefined) v += m[k]; } return v; }
const stats = {
  atk: () => { const c = CLS(); const main = c.dmg === 'dex' ? P.dex * 2 + P.str * 0.5 : P.str * 2 + P.dex * 0.5; return Math.round((6 + P.lv + main + P.luk * 0.3) * bmul('atk')); },
  matk: () => Math.round((6 + P.lv + P.int * 3 + P.dex * 0.3) * bmul('matk')),
  def: () => Math.floor(P.vit * 0.6) + badd('def'),
  maxHp: () => Math.round((80 + P.vit * 13 + P.lv * 11) * CLS().hp),
  maxSp: () => Math.round((25 + P.int * 7 + P.lv * 3) * CLS().sp),
  aspd: () => Math.max(0.2, CLS().aspd * (1 - P.agi * 0.009 - P.dex * 0.003)) / bmul('aspd'),
  speed: () => 6.2 * bmul('speed'),
  flee: () => Math.min(0.6, 0.03 + P.agi * 0.011 + P.luk * 0.003),
  crit: () => Math.min(0.75, CLS().crit + P.luk * 0.004 + badd('crit')),
};
const xpNeed = lv => Math.floor(30 + 22 * Math.pow(lv, 1.75));

const QUESTS = [
  { mob: 'pompom', n: 5, txt: 'Derrote 5 Pompons nos Campos Dourados', xp: 60, zeny: 80, red: 3 },
  { mob: 'zunzum', n: 5, txt: 'Derrote 5 Zunzuns', xp: 120, zeny: 120, red: 4 },
  { mob: 'fungolino', n: 5, txt: 'Derrote 5 Fungolinos', xp: 220, zeny: 160, blue: 2 },
  { mob: 'besouro', n: 6, txt: 'Derrote 6 Caranguejos Rubi nas Areias Rubras', xp: 500, zeny: 300, red: 5 },
  { mob: 'serpe', n: 5, txt: 'Derrote 5 Raptores das Dunas', xp: 900, zeny: 400, blue: 3 },
  { mob: 'guardiao', n: 1, txt: 'Derrote o Guardião das Areias nas ruínas', xp: 2500, zeny: 1500, blue: 5 },
];

// ---------------------------------------------------------------- estado
let mobs = [], drops = [], fx = [], floaters = [], respawnQ = [], corpses = [];
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
  while (t < 300 && (blocked(x, z, 1) || dRoad(x, z) < 4 || Math.hypot(x - P.x, z - P.z) < 18 || Math.hypot(x - OAS.x, z - OAS.z) < 34 || (type !== 'guardiao' && Math.hypot(x - RUIN.x, z - RUIN.z) < 16) || Math.hypot(x - LAIR.x, z - LAIR.z) < 26));
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
function dmgMob(m, base, crit, magic, color) {
  if (m.dead) return 0;
  let dmg = Math.max(1, Math.round(base * rand(0.9, 1.1) - m.d.def * (magic ? 0.4 : 1)));
  if (crit) dmg = Math.round(dmg * 1.8);
  m.hp -= dmg; m.flash = 0.12; m.state = 'chase'; m.lastHit = time;
  if (m.type === 'kravenox') Kvx.addDmg(dmg);
  floater(m.x, groundY(m.x, m.z) + m.model.h, m.z, dmg, crit ? 'crit' : magic ? 'mag' : '');
  Audio8.sfx(crit ? 'crit' : 'hit');
  _p.set(m.x, groundY(m.x, m.z) + m.model.h * 0.5, m.z);
  burst(_p.clone(), color ?? (crit ? 0xffcf40 : 0xffffff), crit ? 10 : 5, 3, 0.4);
  if (!magic && badd('poison') > 0) poison(m, stats.atk() * 0.3, 5);
  if (m.hp <= 0) killMob(m);
  return dmg;
}
function poison(m, dps, t) { if (!m.dead) m.dot = { dps, t, acc: 0 }; }
function killMob(m) {
  m.dead = true; mobs = mobs.filter(o => o !== m);
  burst(new THREE.Vector3(m.x, groundY(m.x, m.z) + 0.6, m.z), m.d.boss ? 0xffcf40 : 0xffe0f0, m.d.boss ? 70 : 18, m.d.boss ? 9 : 4, 0.9);
  Audio8.sfx(m.d.boss ? 'boom' : 'die');
  m.lab.remove();
  if (m.model.inst) { m.model.inst.play(m.model.def.die, { once: true, restart: true }); corpses.push({ g: m.model.g, inst: m.model.inst, t: 1.6 }); }
  else scene.remove(m.model.g);
  drops.push(makeDrop('zeny', irand(...m.d.zeny), m.x, m.z));
  const dropMul = bmul('drop') * (m.plundered && time - m.plundered < 3 ? 1.8 : 1);
  for (const [it, ch] of m.d.drops) if (Math.random() < ch * dropMul) drops.push(makeDrop(it, 1, m.x + rand(-1, 1), m.z + rand(-1, 1)));
  const diff = P.lv - m.d.lv, mult = diff > 8 ? 0.3 : diff > 5 ? 0.6 : 1;
  const xp = Math.round(m.d.xp * mult);
  log(`Você derrotou <b>${m.d.name}</b>! +${xp} XP`, 'xp');
  gainXp(xp);
  const q = QUESTS[P.quest];
  if (q && q.mob === m.type && P.qcount < q.n) { P.qcount++; if (P.qcount === q.n) log(`📜 Missão concluída! Volte à <b>Mestra Odete</b>.`, 'gold'); }
  if (m.type === 'guardiao') log('🏆 <b>O Guardião das Areias caiu!</b> O ritmo do deserto foi restaurado!', 'gold');
  if (m.type === 'kravenox') { Kvx.onKill(m); return; }
  if (m.noRespawn) return;
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
    log(`✨ <b>Nível ${P.lv}!</b> Você ganhou pontos de atributo (${TOUCH ? 'botão 📊' : 'tecla C'}).`, 'gold');
    P.skillPts++;
    log(`📜 +1 ponto de habilidade! Abra a árvore (${TOUCH ? 'botão 📜' : 'tecla K'}).`, 'gold');
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
    if (d > r + (m.d.rad ?? (m.d.boss ? 1.6 : 0))) continue;
    let ang = Math.abs(((Math.atan2(dx, dz) - P.face + Math.PI) % TAU + TAU) % TAU - Math.PI);
    const score = d + (cone ? ang * 1.5 : 0);
    if (score < bs) { bs = score; best = m; }
  }
  return best;
}
function handPos() { const v = new THREE.Vector3(); (L.orb || L.handR).getWorldPosition(v); return v; }
function attack() {
  if (P.dead || dialogOpen || P.atkCd > 0) return;
  const c = CLS();
  P.atkCd = stats.aspd(); P.attackAnim = 1; P.sit = false; P.atkSeq = (P.atkSeq || 0) + 1;
  const k = c.rhythm ? applyRhythm(rhythm()) : 1;
  const m = nearestMob(c.range + 0.4);
  if (m) P.face = Math.atan2(m.x - P.x, m.z - P.z);
  if (c.ranged) {
    if (!m) return;
    Audio8.sfx(c.magic ? 'pick' : 'whip');
    const base = c.magic ? stats.matk() * 0.9 : stats.atk();
    shoot(handPos(), m, c.proj, false, t => dmgMob(t, base * k, Math.random() < stats.crit(), c.magic, c.proj));
  } else {
    slash(k > 1.3 ? 0xffcf40 : c.colors.accent);
    Audio8.sfx('whip');
    if (m && Math.hypot(m.x - P.x, m.z - P.z) < c.range + (m.d.rad ?? (m.d.boss ? 1.6 : 0))) dmgMob(m, stats.atk() * k, Math.random() < stats.crit());
  }
}
function healP(h) { h = Math.round(h); if (h <= 0 || P.dead) return; P.hp = Math.min(stats.maxHp(), P.hp + h); floater(P.x, P.y + 2.4, P.z, '+' + h, 'heal'); }
function addBuff(id, dur, mods, icon) { P.buffs[id] = { t: dur, mods, icon }; }
const nearAt = (x, z, r) => mobs.filter(m => Math.hypot(m.x - x, m.z - z) < r + (m.d.rad ?? (m.d.boss ? 1.6 : 0)));
function nearestN(r, n) {
  const l = mobs.filter(m => Math.hypot(m.x - P.x, m.z - P.z) < r).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z)).slice(0, n);
  for (let i = 0; l.length && l.length < n; i++) l.push(l[i]);
  return l;
}
function useSkill(i) {
  const c = CLS();
  if (!SKILLS[i] || P.dead || dialogOpen) return;
  const L = P.skillLv[SKILLS[i].id] || 0;
  if (!L) { log(`${SKILLS[i].name} ainda não foi aprendida. Use a árvore de habilidades (${TOUCH ? '📜' : 'K'}).`, 'bad'); return; }
  const s = scaleSkill(SKILLS[i], L);
  if ((P.cds[s.id] || 0) > 0) return;
  if (P.sp < s.sp) { log('SP insuficiente!', 'bad'); return; }
  if (s.hpCost && P.hp <= stats.maxHp() * s.hpCost + 1) { log('HP insuficiente para o pacto!', 'bad'); return; }
  const targeted = ['strike', 'blast', 'bolt', 'step', 'drain', 'charge'].includes(s.type);
  const range = s.type === 'strike' ? c.range + 0.8 : (s.type === 'step' || s.type === 'charge') ? 12 : Math.max(c.range, 10);
  const tgt = targeted ? nearestMob(range) : null;
  if (targeted && !tgt) { log('Nenhum alvo ao alcance.', 'bad'); return; }
  P.sp -= s.sp; P.cds[s.id] = s.cd; P.sit = false;
  if (s.hpCost) { const c2 = Math.round(stats.maxHp() * s.hpCost); P.hp -= c2; floater(P.x, P.y + 2, P.z, c2, 'hurt'); }
  if (tgt) P.face = Math.atan2(tgt.x - P.x, tgt.z - P.z);
  const k = c.rhythm ? applyRhythm(rhythm()) : 1;
  if (c.rhythm) { P.dance = 1; notes(4); } else P.cast = 1;
  P.atkSeq = (P.atkSeq || 0) + 1;
  const base = (s.magic ? stats.matk() : stats.atk()) * (s.mult || 1) * k;
  const crit = () => Math.random() < stats.crit() + (s.critBonus || 0);
  const hitOne = (m, b) => {
    for (let h = 0; h < (s.hits || 1); h++) dmgMob(m, b, crit(), s.magic, s.color);
    if (s.stun && !m.dead) m.stun = Math.max(m.stun, s.stun);
    if (s.poison) poison(m, stats.matk() * 0.35 * s.poison, 6);
  };
  const center = new THREE.Vector3(P.x, P.y + 1, P.z);
  switch (s.type) {
    case 'strike':
      slash(s.color); Audio8.sfx('whip'); hitOne(tgt, base);
      if (s.heal) healP(stats.maxHp() * s.heal);
      if (s.plunder) tgt.plundered = time;
      if (s.steal) { const z = irand(5, 12) + tgt.d.lv * 2; P.zeny += z; Audio8.sfx('coin'); floater(P.x, P.y + 2, P.z, `+${z}z`, 'zeny'); }
      break;
    case 'nova':
      Audio8.sfx(s.mult >= 3 ? 'boom' : 'skill');
      ring(P.x, P.z, s.r, s.color, 0.5); ring(P.x, P.z, s.r * 0.65, 0xffffff, 0.35); burst(center, s.color, 30, s.r * 1.2, 0.8);
      nearAt(P.x, P.z, s.r).forEach(m => hitOne(m, base));
      if (s.heal) healP(stats.maxHp() * s.heal);
      if (s.regen) addBuff(s.id + '_regen', s.regen, { regen: 0.03 }, '💚');
      break;
    case 'blast': {
      const x = tgt.x, z = tgt.z, gy = groundY(x, z);
      Audio8.sfx('boom'); ring(x, z, s.r, s.color, 0.6); ring(x, z, s.r * 0.5, 0xffffff, 0.4);
      burst(new THREE.Vector3(x, gy + 1, z), s.color, 36, s.r * 1.3, 1);
      for (let j = 0; j < 8; j++) burst(new THREE.Vector3(x + rand(-s.r, s.r) * 0.7, gy + 4, z + rand(-s.r, s.r) * 0.7), s.color, 2, 1, 0.5);
      nearAt(x, z, s.r).forEach(m => hitOne(m, base));
      break;
    }
    case 'bolt': {
      Audio8.sfx('skill');
      const list = s.spread ? nearestN(range, s.shots) : Array(s.shots || 1).fill(tgt);
      list.forEach((t, j) => setTimeout(() => { if (!P.dead && !t.dead) shoot(handPos(), t, s.color, s.big, m => hitOne(m, base)); }, j * 130));
      break;
    }
    case 'drain':
      Audio8.sfx('skill');
      shoot(handPos(), tgt, s.color, true, m => { const d = dmgMob(m, base, crit(), true, s.color); healP(d * s.steal); });
      break;
    case 'step': {
      const a = Math.atan2(tgt.x - P.x, tgt.z - P.z);
      const nx = tgt.x + Math.sin(a) * 1.3, nz = tgt.z + Math.cos(a) * 1.3;
      burst(center, s.color, 20, 3, 0.5);
      if (!blocked(nx, nz)) { P.x = nx; P.z = nz; P.y = groundY(nx, nz); }
      P.face = a + Math.PI; Audio8.sfx('whip'); slash(s.color);
      burst(new THREE.Vector3(P.x, P.y + 1, P.z), s.color, 20, 3, 0.5);
      dmgMob(tgt, base, true, false, s.color);
      break;
    }
    case 'charge': {
      const a = Math.atan2(tgt.x - P.x, tgt.z - P.z), d = Math.hypot(tgt.x - P.x, tgt.z - P.z) - 1.4;
      for (let t = 0; t < d; t += 0.7) { const x = P.x + Math.sin(a) * t, z = P.z + Math.cos(a) * t; if (blocked(x, z)) break; burst(new THREE.Vector3(x, groundY(x, z) + 0.4, z), s.color, 2, 1.5, 0.4); P.x = x; P.z = z; }
      P.y = groundY(P.x, P.z); Audio8.sfx('boom'); ring(tgt.x, tgt.z, 2.5, s.color, 0.4); hitOne(tgt, base);
      break;
    }
    case 'buff':
      addBuff(s.id, s.dur, s.mods, s.icon); Audio8.sfx('buff'); burst(center, s.color, 30, 5, 0.9); ring(P.x, P.z, 2.5, s.color, 0.6);
      if (s.heal) healP(stats.maxHp() * s.heal);
      log(`${s.icon} <b>${s.name}</b> ativo por ${s.dur}s.`, 'gold');
      break;
    case 'heal':
      Audio8.sfx('heal'); healP(stats.maxHp() * s.pct); ring(P.x, P.z, 2.5, s.color, 0.8); burst(center, s.color, 25, 3, 1.2);
      break;
    case 'summon':
      Audio8.sfx('skill'); summon(s.minion, s.life);
      break;
  }
}

// ---------------------------------------------------------------- projéteis
let projs = [];
const projGeo = new THREE.SphereGeometry(0.13, 8, 6);
function shoot(from, target, color, big, onHit) {
  const m = new THREE.Mesh(projGeo, new THREE.MeshBasicMaterial({ color }));
  if (big) m.scale.setScalar(1.9);
  m.position.copy(from); scene.add(m);
  projs.push({ m, target, onHit, color });
}
function updateProjs(dt) {
  for (const p of projs) {
    const t = p.target;
    if (!t || t.dead) { p.done = true; continue; }
    _v.set(t.x, groundY(t.x, t.z) + t.model.h * 0.5, t.z);
    _d.subVectors(_v, p.m.position); const d = _d.length();
    if (d < 0.5) { p.done = true; p.onHit(t); continue; }
    p.m.position.addScaledVector(_d, Math.min(1, 24 * dt / d));
    if (Math.random() < 0.5) burst(p.m.position.clone(), p.color, 1, 0.5, 0.25);
  }
  projs = projs.filter(p => { if (p.done) { scene.remove(p.m); p.m.material.dispose(); } return !p.done; });
}

// ---------------------------------------------------------------- invocações
let minions = [];
function summon(kind, life) {
  const g = new THREE.Group(); scene.add(g);
  const bone = toon(0xe8e4d0), glow = new THREE.MeshLambertMaterial({ color: 0x50dcff, emissive: 0x50dcff, emissiveIntensity: 0.8 });
  const mn = { kind, g, life, cd: 0.5, face: P.face, swing: 0 };
  if (kind === 'skeleton' && ModelKit.ready) {
    mn.inst = ModelKit.instance('skeleton', 1.7); g.add(mn.inst.root); mn.inst.play('Skeleton_Spawn', { once: true });
    mn.spawnT = mn.inst.clip('Skeleton_Spawn'); mn.arm = new THREE.Group();
  } else if (kind === 'skeleton') {
    [-0.1, 0.1].forEach(x => mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), bone, x, 0.4, 0, g));
    mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.5, 6), bone, 0, 1.05, 0, g);
    for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(0.17 - i * 0.02, 0.025, 4, 10), bone, 0, 0.95 + i * 0.12, 0, g).rotation.x = Math.PI / 2;
    mesh(new THREE.SphereGeometry(0.17, 10, 8), bone, 0, 1.5, 0, g);
    [-0.06, 0.06].forEach(x => mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: 0x7dff4a }), x, 1.52, 0.14, g));
    mn.arm = new THREE.Group(); mn.arm.position.set(0.25, 1.25, 0); g.add(mn.arm);
    mesh(new THREE.BoxGeometry(0.05, 0.8, 0.02), toon(0x9a9aa8), 0, -0.4, 0.1, mn.arm).rotation.x = 0.3;
  } else {
    mesh(new THREE.CylinderGeometry(0.4, 0.55, 0.4, 8), toon(0x5a6470), 0, 0.2, 0, g);
    mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.6, 6), toon(0xd08a30), 0, 1.1, 0, g);
    mn.orb = mesh(new THREE.OctahedronGeometry(0.28), glow, 0, 2.2, 0, g);
  }
  mn.x = P.x + Math.sin(P.face + 1) * 1.6; mn.z = P.z + Math.cos(P.face + 1) * 1.6;
  if (blocked(mn.x, mn.z)) { mn.x = P.x; mn.z = P.z; }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  minions.push(mn);
  burst(new THREE.Vector3(mn.x, groundY(mn.x, mn.z) + 0.8, mn.z), kind === 'skeleton' ? 0x7dff4a : 0x50dcff, 30, 3, 0.8);
  log(kind === 'skeleton' ? '💀 Um esqueleto se ergue para lutar ao seu lado!' : '🗼 Torre de Raios montada!', 'gold');
}
function updateMinions(dt) {
  for (const mn of minions) {
    mn.life -= dt; mn.cd -= dt; mn.swing = Math.max(0, mn.swing - dt * 3);
    const reach = mn.kind === 'tower' ? 12 : 10;
    let tgt = null, bd = 1e9;
    for (const m of mobs) { const d = Math.hypot(m.x - mn.x, m.z - mn.z); if (d < reach && d < bd) { bd = d; tgt = m; } }
    const go = (tx, tz, sp) => {
      const dx = tx - mn.x, dz = tz - mn.z, d = Math.hypot(dx, dz); if (d < 0.05) return;
      const nx = mn.x + dx / d * sp * dt, nz = mn.z + dz / d * sp * dt;
      if (!blocked(nx, nz)) { mn.x = nx; mn.z = nz; }
      mn.face = Math.atan2(dx, dz);
    };
    if (mn.kind === 'skeleton') {
      if (!tgt) { if (Math.hypot(P.x - mn.x, P.z - mn.z) > 2.5) go(P.x, P.z, 5.5); }
      else if (bd > 1.6) go(tgt.x, tgt.z, 4.5);
      else { mn.face = Math.atan2(tgt.x - mn.x, tgt.z - mn.z); if (mn.cd <= 0) { mn.cd = 1.1; mn.swing = 1; dmgMob(tgt, stats.matk() * 0.75, Math.random() < 0.08, true, 0xe8e4d0); } }
      mn.arm.rotation.x = -mn.swing * 2;
      if (mn.inst) {
        mn.spawnT -= dt;
        if (mn.spawnT <= 0) mn.inst.play(mn.swing > 0.9 ? 'Skeleton_Attack' : (tgt && bd > 1.6) || (!tgt && Math.hypot(P.x - mn.x, P.z - mn.z) > 2.5) ? 'Skeleton_Running' : 'Skeleton_Idle', { once: mn.swing > 0.9, restart: mn.swing > 0.99 });
        mn.inst.update(dt);
      }
    } else {
      mn.orb.rotation.y += dt * 3; mn.orb.position.y = 2.2 + Math.sin(time * 4) * 0.1;
      if (tgt && mn.cd <= 0) { mn.cd = 0.9; const from = new THREE.Vector3(); mn.orb.getWorldPosition(from); shoot(from, tgt, 0x50dcff, false, m => dmgMob(m, stats.atk() * 0.8, false, true, 0x50dcff)); }
    }
    mn.g.position.set(mn.x, groundY(mn.x, mn.z), mn.z); mn.g.rotation.y = mn.face;
    if (mn.life <= 0) { burst(new THREE.Vector3(mn.x, mn.g.position.y + 0.8, mn.z), 0xaaaaaa, 20, 3, 0.6); scene.remove(mn.g); }
  }
  minions = minions.filter(mn => mn.life > 0);
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
  lair: { name: 'Cratera do Cisma', music: 'areias' },
  cidadela: { name: 'Cidadela do Cisma', music: 'kharum', town: true },
  torre: { name: 'Torre do Cisma', music: 'areias' },
  topo: { name: 'Topo da Torre do Cisma', music: 'kravenox' },
  kharum: { name: 'Oásis de Kharum', music: 'kharum', town: true },
};
function update(dt) {
  time += dt; windU.value = time;
  updatePlayer(dt);
  for (const m of mobs) updateMob(m, dt);
  for (const r of respawnQ) r.t -= dt;
  respawnQ = respawnQ.filter(r => { if (r.t <= 0) { spawnMob(r.type, r.area, r.at); return false; } return true; });
  for (const d of drops) { d.t += dt; d.m.rotation.y += dt * 3; d.m.position.y = groundY(d.x, d.z) + 0.4 + Math.sin(d.t * 4) * 0.1; }
  updateFx(dt); updateProjs(dt); updateMinions(dt); Tower.update(dt); Kvx.update(dt); Net.update(dt); Net.tickMyBubble(dt);
  for (const c of corpses) { c.t -= dt; c.inst.update(dt); if (c.t < 0.5) c.g.position.y -= dt * 2; if (c.t <= 0) scene.remove(c.g); }
  corpses = corpses.filter(c => c.t > 0);
  for (const n of NPCS) if (n.inst) n.inst.update(dt);
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
    zone = z; Audio8.play(ZONES[z].music); banner(ZONES[z].name); $('zonename').textContent = ZONES[z].name;
    log(`Você entrou em <b>${ZONES[z].name}</b>.`, 'sys');
    if (ZONES[z].town) P.home = z;
  }
  if (P.combo && (P.comboT -= dt) <= 0) { if (P.combo >= 3) log(`Combo final: ${P.combo}`, 'sys'); P.combo = 0; }
  const des = inTower(P.z) ? 0 : smooth(40, 70, P.x);
  skyMat.uniforms.horizon.value.copy(SKY_GREEN).lerp(SKY_DESERT, des); skyMat.uniforms.top.value.copy(SKY_TOP_G).lerp(SKY_TOP_D, des); const dark = inTower(P.z) ? 1 : smooth(150, 166, P.x);
  if (dark > 0) { skyMat.uniforms.horizon.value.lerp(new THREE.Color(0x4a1830), dark); skyMat.uniforms.top.value.lerp(new THREE.Color(0x12081c), dark); }
  scene.fog.color.copy(skyMat.uniforms.horizon.value);
}

function updatePlayer(dt) {
  if (P.dead) {
    P.deadT -= dt;
    if (P.deadT <= 0) {
      P.dead = false; P.hp = Math.round(stats.maxHp() * 0.5); P.sp = Math.round(stats.maxSp() * 0.5);
      P.xp = Math.max(0, P.xp - Math.floor(xpNeed(P.lv) * 0.03));
      const h = P.home === 'kharum' ? { x: OAS.x - 4, z: OAS.z - 22 } : P.home === 'cidadela' ? { x: CIT.x - 6, z: CIT.z + 8 } : { x: VIL.x, z: VIL.z + 10 };
      P.x = h.x; P.z = h.z; P.y = groundY(P.x, P.z);
    }
    return;
  }
  for (const k in P.cds) P.cds[k] = Math.max(0, P.cds[k] - dt);
  for (const k in P.buffs) { P.buffs[k].t -= dt; if (P.buffs[k].t <= 0) delete P.buffs[k]; }
  P.cast = Math.max(0, P.cast - dt * 2.5);
  P.atkCd -= dt; P.attackAnim = Math.max(0, P.attackAnim - dt * 4); P.dance = Math.max(0, P.dance - dt * 1.5);
  P.hurtT = Math.max(0, P.hurtT - dt); P.dashCd -= dt;

  P.regenT += dt;
  if (P.regenT >= (P.sit ? 1 : 3)) {
    P.regenT = 0;
    P.hp = Math.min(stats.maxHp(), P.hp + Math.max(1, Math.floor(stats.maxHp() * 0.02 + P.vit * 0.3)));
    P.sp = Math.min(stats.maxSp(), P.sp + Math.max(1, Math.floor(stats.maxSp() * 0.03 + P.int * 0.2)));
  }
  const rg = badd('regen'); if (rg) P.hp = Math.min(stats.maxHp(), P.hp + stats.maxHp() * rg * dt);

  let ix = 0, iz = 0;
  if (!dialogOpen) {
    if (keys.w || keys.arrowup) iz += 1; if (keys.s || keys.arrowdown) iz -= 1;
    if (keys.a) ix += 1; if (keys.d) ix -= 1;
    if (joy.x || joy.y) { ix -= joy.x; iz -= joy.y; }
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
  if (Object.keys(P.buffs).length && Math.random() < 0.2) burst(new THREE.Vector3(P.x, P.y + rand(0.3, 1.5), P.z), CLS().colors.accent, 1, 0.8, 0.5);

  for (const d of drops) if (d.t > 0.4 && Math.hypot(d.x - P.x, d.z - P.z) < 1.3) {
    d.taken = true; scene.remove(d.m);
    if (d.id === 'zeny') { P.zeny += d.n; Audio8.sfx('coin'); floater(d.x, P.y + 1.5, d.z, `+${d.n}z`, 'zeny'); }
    else { P.inv[d.id] = (P.inv[d.id] || 0) + d.n; Audio8.sfx('pick'); log(`Você pegou <b>${ITEMS[d.id].name}</b>.`, 'item'); buildHotbar(); }
  }
  drops = drops.filter(d => !d.taken);

  nearNpc = null;
  for (const n of NPCS) if (Math.hypot(n.x - P.x, n.z - P.z) < 3) nearNpc = n;
  const pr = $('prompt');
  if (nearNpc && !dialogOpen) { pr.innerHTML = TOUCH ? `Toque 💬 para falar com ${nearNpc.name}` : `<b>[F]</b> Falar com ${nearNpc.name}`; pr.classList.remove('hidden'); }
  else pr.classList.add('hidden');
  $('t-talk').classList.toggle('hidden', !nearNpc || dialogOpen);
}

function updateMob(m, dt) {
  if (m.dot) {
    m.dot.t -= dt; m.dot.acc += dt;
    if (m.dot.acc >= 1) { m.dot.acc = 0; const d = Math.max(1, Math.round(m.dot.dps)); m.hp -= d; floater(m.x, groundY(m.x, m.z) + m.model.h, m.z, d, 'poison'); burst(new THREE.Vector3(m.x, groundY(m.x, m.z) + 0.6, m.z), 0x7dff4a, 4, 1.5, 0.5); if (m.hp <= 0) { killMob(m); return; } }
    if (m.dot && m.dot.t <= 0) m.dot = null;
  }
  m.flash = Math.max(0, m.flash - dt); m.atkCd -= dt; m.moving = false; m.swing = Math.max(0, (m.swing || 0) - dt * 2);
  if (m.type === 'kravenox') Kvx.ai(m, dt);
  else if (m.stun > 0) m.stun -= dt;
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
  const far = Math.hypot(m.x - P.x, m.z - P.z) > (m.d.boss ? 140 : 70);
  g.visible = !far;
  if (far) return;
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
  const vx = dx / d * sp * dt, vz = dz / d * sp * dt, r = m.d.rad ? m.d.rad * 0.6 : m.d.boss ? 1.2 : 0.5;
  let moved = false;
  if (!blocked(m.x + vx, m.z, r)) { m.x += vx; moved = true; }
  if (!blocked(m.x, m.z + vz, r)) { m.z += vz; moved = true; }
  if (!moved) { m.tx = m.x; m.tz = m.z; m.timer = 0; }
  m.face = Math.atan2(dx, dz); m.moving = moved;
}

// ---------------------------------------------------------------- animação da Lyra
function animateLyra(dt) {
  if (L.model) return animateModel(dt);
  lyra.position.set(P.x, P.y, P.z);
  lyra.rotation.y = P.face + (P.dance > 0 ? (1 - P.dance) * TAU * 2 : 0);
  const t = time, run = P.moving && P.onGround;
  const sw = run ? Math.sin(t * 13) : 0;
  body.position.y = P.dead ? 0 : (P.sit ? -0.45 : (run ? Math.abs(Math.sin(t * 13)) * 0.06 : Math.sin(t * 2.5) * 0.015)) + (P.dance > 0 ? Math.sin(P.dance * Math.PI) * 0.5 : 0);
  body.rotation.x = P.dead ? -Math.PI / 2 : (run ? 0.12 : 0);
  if (P.dead) body.position.y = 0.2;
  L.legL.rotation.x = P.sit ? -1.5 : sw * 0.8; L.legR.rotation.x = P.sit ? -1.5 : -sw * 0.8;
  if (!P.onGround && !P.sit) { L.legL.rotation.x = -0.6; L.legR.rotation.x = 0.3; }
  if (L.skirt) L.skirt.scale.set(1 + (P.dance > 0 ? 0.35 : run ? 0.08 : 0), 1, 1 + (P.dance > 0 ? 0.35 : run ? 0.08 : 0));
  if (L.skirt) L.skirt.rotation.y = Math.sin(t * 3) * 0.1;
  if (L.cape) L.cape.rotation.x = 0.12 + (run ? 0.5 : 0) + Math.sin(t * 4) * 0.05;
  if (L.orb) L.orb.scale.setScalar(1 + Math.sin(t * 5) * 0.15);
  if (P.cast > 0) {
    L.armR.rotation.set(-1.6 - Math.sin(P.cast * Math.PI) * 0.8, 0, 0.1); L.armL.rotation.set(-1.4, 0, -0.1);
  } else if (P.attackAnim > 0 && CLS().ranged) {
    L.armR.rotation.set(-1.5, 0, 0.1); L.armL.rotation.set(-1.5 + (CLS().weapon === 'bow' ? 0 : 1.2), 0, -0.1);
  } else if (P.attackAnim > 0) {
    const a = 1 - P.attackAnim;
    L.armR.rotation.set(-2.6 + a * 3.4, 0, 0.3 - a * 0.9); L.armL.rotation.set(0.3, 0, -0.4);
  } else if (P.dance > 0) {
    L.armR.rotation.set(0, 0, 2.6 + Math.sin(t * 14) * 0.3); L.armL.rotation.set(0, 0, -2.6 - Math.sin(t * 14) * 0.3);
  } else {
    L.armR.rotation.set(-sw * 0.8, 0, 0.18 + Math.sin(t * 2) * 0.03); L.armL.rotation.set(sw * 0.8, 0, -0.18 - Math.sin(t * 2) * 0.03);
  }
  if (L.tail) L.tail.rotation.x = 0.2 + (run ? 0.5 : 0) + Math.sin(t * (run ? 13 : 2.5)) * 0.15;
  if (L.tail) L.tail.rotation.z = Math.sin(t * 2) * 0.15;
  L.head.rotation.y = P.sit ? 0 : Math.sin(t * 0.7) * 0.15;
  lyra.visible = !(P.hurtT > 0 && Math.floor(time * 30) % 2);
  if (L.ribbon) updateRibbon(dt);
}

function animateModel(dt) {
  lyra.position.set(P.x, P.y, P.z);
  lyra.rotation.y = P.face + (P.dance > 0 ? (1 - P.dance) * TAU * 2 : 0);
  const a = L.inst, C = CLS();
  let st, once = false, speed = 1, restart = false;
  if (P.dead) { st = 'Death'; once = true; }
  else if (P.dashT > 0) { st = 'Roll'; once = true; speed = 1.7; }
  else if (P.attackAnim > 0 || P.cast > 0) {
    st = (C.ranged || (P.cast > 0 && !C.rhythm)) ? 'Gun_Shoot' : (C.weapon === 'club' ? 'Punch_Right' : 'Sword_Slash'); once = true;
    speed = Math.max(1.3, a.clip(st) / Math.max(0.3, stats.aspd()));
    restart = P.atkSeq !== L.lastSeq; L.lastSeq = P.atkSeq;
  }
  else if (P.dance > 0) st = 'Wave';
  else if (P.moving && P.onGround) { st = 'Run'; speed = stats.speed() / 6.2; }
  else if (P.hurtT > 0) { st = 'HitRecieve'; once = true; }
  else if (P.sit) st = 'Interact';
  else st = (C.weapon === 'ribbon' || C.ranged) ? 'Idle' : 'Idle_Sword';
  a.play(st, { once, speed, restart });
  a.update(dt);
  updateFollow(L);
  if (L.orb) L.orb.scale.setScalar(1 + Math.sin(time * 5) * 0.15);
  if (L.cape) L.cape.rotation.x = 0.1 + (P.moving ? 0.5 : 0) + Math.sin(time * 4) * 0.05;
  lyra.visible = !(P.hurtT > 0 && Math.floor(time * 30) % 2);
  if (L.ribbon) updateRibbon(dt);
}

// ---------------------------------------------------------------- câmera
function updateCamera(dt) {
  const big = inTower(P.z) && Tower.floor === 5;                   // topo da torre: câmera para o gigante
  camS.pitch = clamp(camS.pitch, 0.08, 1.25); camS.dist = clamp(camS.dist, big ? 10 : 4, big ? 32 : 18);
  const tx = P.x, ty = P.y + (big ? 4.5 : 1.3), tz = P.z;
  camS.x = lerp(camS.x, tx, Math.min(1, dt * 10)); camS.y = lerp(camS.y, ty, Math.min(1, dt * 10)); camS.z = lerp(camS.z, tz, Math.min(1, dt * 10));
  // aproxima a câmera quando uma árvore/casa fica entre ela e o personagem
  const dx = Math.sin(camS.yaw) * Math.cos(camS.pitch), dy = Math.sin(camS.pitch), dz = Math.cos(camS.yaw) * Math.cos(camS.pitch);
  let want = camS.dist;
  for (let k = 1; k <= 16; k++) {
    const d = camS.dist * k / 16, x = camS.x + dx * d, z = camS.z + dz * d, y = camS.y + dy * d;
    const l = OB.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL));
    if (l && y < groundY(x, z) + 5 && l.some(o => o.r > 2 && Math.hypot(x - o.x, z - o.z) < o.r + 0.8)) { want = Math.max(2.2, camS.dist * (k - 1) / 16); break; }
  }
  camS.cur = lerp(camS.cur ?? want, want, Math.min(1, dt * (want < (camS.cur ?? want) ? 14 : 3)));
  const cx = camS.x + dx * camS.cur, cz = camS.z + dz * camS.cur;
  let cy = camS.y + dy * camS.cur;
  cy = Math.max(cy, (inTower(cz) ? groundY(camS.x, camS.z) : height(cx, cz)) + 0.6);
  camera.position.set(cx, cy, cz);
  camera.lookAt(camS.x, camS.y, camS.z);
  hideTreesBetween(cx, cz, camS.x, camS.z, cy, camS.y);
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
  $('st-lv').textContent = `${RACES[P.race].name} · ${className(P.cls, P.gender)} · Nv ${P.lv}`;
  $('hpbar').style.width = (P.hp / mh * 100) + '%'; $('spbar').style.width = (P.sp / ms * 100) + '%'; $('xpbar').style.width = (P.xp / need * 100) + '%';
  $('hptxt').textContent = `${Math.ceil(P.hp)} / ${mh}`; $('sptxt').textContent = `${Math.floor(P.sp)} / ${ms}`; $('xptxt').textContent = `${(P.xp / need * 100).toFixed(1)}%`;
  $('zeny').textContent = P.zeny.toLocaleString('pt-BR');
  $('btn-stat').classList.toggle('alert', P.statPts > 0);
  $('btn-skill').classList.toggle('alert', SKILLS.some((s, i) => canLearn(i)));
  if (!$('skillwin').classList.contains('hidden')) renderSkills();
  document.querySelectorAll('.slot[data-skill]').forEach(el => {
    const s = SKILLS[+el.dataset.skill];
    el.querySelector('.cd').style.height = ((P.cds[s.id] || 0) / s.cd * 100) + '%';
    el.classList.toggle('locked', !(P.skillLv[s.id] > 0)); el.classList.toggle('nosp', P.sp < scaleSkill(s, P.skillLv[s.id] || 1).sp);
  });
  let b = '';
  for (const id in P.buffs) b += `<span>${P.buffs[id].icon || '✦'} ${Math.ceil(P.buffs[id].t)}s</span>`;
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
  bc.style.display = CLS().rhythm ? '' : 'none';
  if (!CLS().rhythm) return;
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
  if (inTower(P.z)) { Tower.minimap(mg); return; }
  Kvx.minimap(mg, sx, sz);
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
    const lv = P.skillLv[s.id] || 0;
    el.innerHTML = `<span class="ic">${s.icon}</span><span class="k">${s.key}</span>${lv ? `<span class="slv">${lv}</span>` : ''}<span class="cost">${lv ? scaleSkill(s, lv).sp : '🔒'}</span><div class="cd"></div>`;
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
  const row = k => `<div class="srow"><span class="sl">${STAT_NAMES[k]}</span><b>${P[k]}</b><button data-st="${k}" ${P.statPts ? '' : 'disabled'}>+</button><span class="si">${STAT_INFO[k]}</span></div>`;
  const html = `<div class="wt">${className(P.cls, P.gender)} ${RACES[P.race].name} <span class="x" data-close>×</span></div>
    ${STAT_KEYS.map(row).join('')}
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
function toggleStats() { $('skillwin').classList.add('hidden'); $('statwin').classList.toggle('hidden'); renderStats(); }

// ---------------------------------------------------------------- árvore de habilidades
const SK_MAX = 5;
// estrutura igual para todas as classes: [inicial] → [ramo A, ramo B] → [final]
const SK_REQ = [[], [[0, 2]], [[0, 3]], [[1, 3], [2, 2]]];
function scaleSkill(s, L) {
  const k = L - 1, o = { ...s };
  if (s.mult) o.mult = s.mult * (1 + 0.2 * k);
  if (s.stun) o.stun = s.stun * (1 + 0.1 * k);
  if (s.dur) o.dur = Math.round(s.dur * (1 + 0.1 * k));
  if (s.pct) o.pct = s.pct * (1 + 0.1 * k);
  if (s.heal) o.heal = s.heal * (1 + 0.15 * k);
  if (s.life) o.life = Math.round(s.life * (1 + 0.15 * k));
  if (s.poison) o.poison = s.poison * (1 + 0.2 * k);
  if (s.mods) { o.mods = {}; for (const [m, v] of Object.entries(s.mods)) o.mods[m] = ['def', 'crit', 'poison', 'regen'].includes(m) ? v * (1 + 0.25 * k) : 1 + (v - 1) * (1 + 0.25 * k); }
  o.sp = Math.round(s.sp * (1 + 0.12 * k));
  return o;
}
function reqMet(i) { return SK_REQ[i].every(([j, lv]) => (P.skillLv[SKILLS[j].id] || 0) >= lv); }
function canLearn(i) { const s = SKILLS[i]; return P.skillPts > 0 && (P.skillLv[s.id] || 0) < SK_MAX && P.lv >= s.lv && reqMet(i); }
function learn(i) {
  if (!canLearn(i)) return;
  const s = SKILLS[i]; P.skillLv[s.id] = (P.skillLv[s.id] || 0) + 1; P.skillPts--;
  Audio8.sfx(P.skillLv[s.id] === 1 ? 'buff' : 'click');
  if (P.skillLv[s.id] === 1) log(`✨ Você aprendeu <b>${s.icon} ${s.name}</b>!`, 'gold');
  buildHotbar(); renderSkills(); save();
}
function describe(s, L) {
  const e = scaleSkill(s, Math.max(1, L)), bits = [];
  if (e.mult) bits.push(`${Math.round(e.mult * 100)}% de dano${e.hits > 1 ? ` ×${e.hits}` : ''}`);
  if (e.stun) bits.push(`atordoa ${e.stun.toFixed(1)}s`);
  if (e.dur) bits.push(`${e.dur}s`);
  if (e.pct) bits.push(`cura ${Math.round(e.pct * 100)}%`);
  if (e.heal) bits.push(`cura ${Math.round(e.heal * 100)}%`);
  if (e.life) bits.push(`dura ${e.life}s`);
  bits.push(`${e.sp} SP`);
  return bits.join(' · ');
}
function renderSkills() {
  const w = $('skillwin');
  const node = (i, cls) => {
    const s = SKILLS[i], L = P.skillLv[s.id] || 0;
    const reqs = [];
    if (P.lv < s.lv) reqs.push(`nível ${s.lv}`);
    for (const [j, lv] of SK_REQ[i]) if ((P.skillLv[SKILLS[j].id] || 0) < lv) reqs.push(`${SKILLS[j].name} Nv ${lv}`);
    return `<div class="snode ${cls} ${L ? 'learned' : ''} ${reqs.length && !L ? 'locked' : ''}">
      <span class="si2">${s.icon}</span>
      <div class="sb"><div class="sn">${s.name}</div><div class="sl2">Nível ${L}/${SK_MAX}</div>
      <div class="sd">${s.desc}<br>${L ? 'Atual: ' + describe(s, L) : 'Nv 1: ' + describe(s, 1)}${L && L < SK_MAX ? '<br>Próximo: ' + describe(s, L + 1) : ''}</div>
      ${reqs.length ? `<div class="req">Requer: ${reqs.join(', ')}</div>` : ''}</div>
      <button data-learn="${i}" ${canLearn(i) ? '' : 'disabled'}>+</button></div>`;
  };
  const html = `<div class="wt">📜 Habilidades — ${className(P.cls, P.gender)} <span class="x" data-close>×</span></div>
    <div class="spts">Pontos de habilidade: <b style="color:#f2c86a">${P.skillPts}</b> <small>(ganhe 1 por nível)</small></div>
    <div class="stree">${node(0, 'root')}<div class="sarrow">▼ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ▼</div>${node(1, '')}${node(2, '')}<div class="sarrow">▼</div>${node(3, 'ult')}</div>`;
  if (w.dataset.h !== html) { w.innerHTML = html; w.dataset.h = html; }
}
$('skillwin').addEventListener('click', e => {
  const b = e.target.closest('[data-learn]'); if (b) learn(+b.dataset.learn);
  if (e.target.dataset.close !== undefined) toggleSkills();
});
function toggleSkills() { $('statwin').classList.add('hidden'); $('skillwin').classList.toggle('hidden'); renderSkills(); }

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
  const nm = `💬 ${n.name}`, eu = P.name, bv = P.gender === 'm' ? 'Bem-vindo' : 'Bem-vinda', heroi = P.gender === 'm' ? 'herói' : 'heroína';
  switch (n.id) {
    case 'healer':
      dialog(nm, `Que a luz guie seus passos, <b>${eu}</b>. Deixe-me cuidar de você.`, [
        { label: '✚ Curar (grátis)', fn: () => { P.hp = stats.maxHp(); P.sp = stats.maxSp(); Audio8.sfx('heal'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xcfe8ff, 25, 3, 1); log(`${n.name} restaurou seu HP e SP.`, 'item'); } },
        { label: 'Até logo' }]); break;
    case 'shop': {
      const shop = () => dialog(nm, `${bv}, <b>${eu}</b>! Poções fresquinhas.<br><small>Zeny: <b>${P.zeny}z</b> · 🧪 ${P.inv.red} · 💧 ${P.inv.blue}</small>`, [
        { label: `🧪 Poção Vermelha — 25z`, fn: () => { buy('red', 1); shop(); return true; } },
        { label: `🧪×10 — 250z`, fn: () => { buy('red', 10); shop(); return true; } },
        { label: `💧 Poção Azul — 90z`, fn: () => { buy('blue', 1); shop(); return true; } },
        { label: 'Sair' }]);
      shop(); break;
    }
    case 'master': {
      const q = QUESTS[P.quest];
      if (!q) { dialog(nm, `Você completou todas as minhas lições, <b>${P.name}</b>! Estou tão orgulhosa.<br>Seu melhor combo foi <b>${P.best}</b>. Consegue superar?`); break; }
      if (P.qcount >= q.n) {
        dialog(nm, `Maravilhoso, <b>${eu}</b>! Você está ficando cada vez mais forte.<br><br>Recompensa: <b>${q.xp} XP</b>, <b>${q.zeny}z</b>${q.red ? `, ${q.red}× Poção Vermelha` : ''}${q.blue ? `, ${q.blue}× Poção Azul` : ''}.`, [
          { label: '🎁 Receber recompensa', fn: () => {
            P.zeny += q.zeny; P.inv.red += q.red || 0; P.inv.blue += q.blue || 0; Audio8.sfx('coin'); gainXp(q.xp);
            P.quest++; P.qcount = 0; buildHotbar(); save();
            const nq = QUESTS[P.quest]; if (nq) log(`📜 Nova missão: <b>${nq.txt}</b>`, 'gold');
          } }]);
      } else if (P.quest === 0 && P.qcount === 0) {
        dialog(nm, `<b>${P.name}</b>, algo terrível aconteceu: a <b>melodia do mundo saiu do compasso</b>, e os monstros ficaram agitados.<br><br>
          Precisamos de heróis para proteger as vilas, e você é ${P.gender === 'm' ? 'o' : 'a'} ${heroi} que eu esperava. Mostre do que um(a) ${className(P.cls, P.gender)} é capaz!<br><br>
          Primeira lição: <b>${q.txt}</b>.`, [{ label: 'Estou pronta!' }]);
      } else dialog(nm, `Continue praticando: <b>${q.txt}</b> (${P.qcount}/${q.n}).<br><small>Dica: ${TOUCH ? 'toque 🧘' : 'aperte <b>X</b>'} para sentar e recuperar HP/SP mais rápido.</small>`);
      break;
    }
    case 'watch': dialog(nm, `${eu}, você chegou longe. Aquela é a <b>Torre do Cisma</b>. São seis andares tomados pela Essência: <b>Larvas</b>, <b>Vermes de Dentes</b>, <b>Sentinelas</b>... Cada andar só libera a escada quando não sobra nenhum de pé.<br><br>No topo dorme <b>Kravenox</b>, gigante, o Soberano do Reino Quebrado. Ele desperta todo <b>sábado às 20h</b>. Leve amigos.<br><small>A entrada fica na base da torre, ao norte daqui.</small>`); break;
    case 'guard': dialog(nm, `Saudações, <b>${eu}</b>! Os Campos Dourados começam aqui, a leste. Cuidado com os <b>Zunzuns</b>: eles atacam quem chega perto!<br>Seguindo a estrada você chega às <b>Areias Rubras</b> e ao <b>Oásis de Kharum</b>.`); break;
    case 'elder': dialog(nm, `Sente-se, <b>${eu}</b>. Dizem que o <b>Guardião das Areias</b> dança ao som das tempestades, nas ruínas ao sudeste daqui.<br>Ele só se curva diante de quem acerta o ritmo perfeito. Volte quando estiver acima do nível 15.`); break;
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
  drag = { x: e.clientX, y: e.clientY, b: e.button, id: e.pointerId };
  if (e.button === 0 && e.pointerType === 'mouse') attack();
});
addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const ts = e.pointerType === 'touch' ? 1.4 : 1;
  camS.yaw -= (e.clientX - drag.x) * 0.006 * ts; camS.pitch += (e.clientY - drag.y) * 0.005;
  drag.x = e.clientX; drag.y = e.clientY;
});
addEventListener('pointerup', e => { if (drag && e.pointerId === drag.id) drag = null; });
addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.id) drag = null; });
cvEl.addEventListener('wheel', e => { camS.dist += e.deltaY * 0.01; e.preventDefault(); }, { passive: false });
addEventListener('keydown', e => {
  if (!running || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
  if (k === 'escape') { closeDialog(); $('statwin').classList.add('hidden'); $('skillwin').classList.add('hidden'); return; }
  if (dialogOpen) return;
  keys[k] = true;
  if (e.repeat) return;
  const si = SKILLS.findIndex(s => s.key === k); if (si >= 0) useSkill(si);
  if (k === 'j' || k === 'k') attack();
  if (k === 'q') usePotion('red'); if (k === 'e') usePotion('blue');
  if (k === ' ') doJump();
  if (k === 'shift') doDash();
  if (k === 'f' && nearNpc) talk(nearNpc);
  if (k === 'c') toggleStats();
  if (k === 'enter') { e.preventDefault(); openChat(); return; }
  if (k === 'k') toggleSkills();
  if (k === 'x') { P.sit = !P.sit; log(P.sit ? 'Você se sentou para descansar.' : 'Você se levantou.', 'sys'); }
  if (k === 'm') toggleMusic();
  if (k === 'h') showHelp();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function doJump() { if (P.onGround && !P.dead && !dialogOpen) { P.vy = 7.5; P.sit = false; } }
function doDash() { if (P.dashCd <= 0 && !P.dead && !dialogOpen) { P.dashT = 0.2; P.dashCd = 0.9; P.sit = false; Audio8.sfx('whip'); } }

// ---------------------------------------------------------------- controles por toque
const joy = { x: 0, y: 0, id: null };
{
  const base = $('joy'), knob = $('knob');
  const setJoy = e => {
    const r = base.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, max = r.width / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy);
    if (l > max) { dx *= max / l; dy *= max / l; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const k = Math.hypot(dx, dy) / max;
    joy.x = k > 0.2 ? dx / max : 0; joy.y = k > 0.2 ? dy / max : 0;
  };
  base.addEventListener('pointerdown', e => { Audio8.init(); joy.id = e.pointerId; base.setPointerCapture(e.pointerId); setJoy(e); e.preventDefault(); });
  base.addEventListener('pointermove', e => { if (e.pointerId === joy.id) setJoy(e); });
  const end = e => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; };
  base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
  const btn = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Audio8.init(); fn(); });
  btn('t-atk', attack); btn('t-jump', doJump); btn('t-dash', doDash);
  btn('t-talk', () => { if (nearNpc) talk(nearNpc); });
  if (TOUCH) $('touch').classList.remove('hidden');
}
function toggleMusic() { const on = Audio8.toggleMusic(); $('btn-music').textContent = on ? '🎵' : '🔇'; }
function showHelp() {
  if (TOUCH) return dialog('📜 Como jogar', `
  🕹️ <b>Joystick</b> (esquerda) para andar · <b>arraste a tela</b> para girar a câmera<br>
  ⚔️ golpe de fita · ⤴ pular · 💨 esquivar · 💬 falar com NPC<br>
  Toque nos ícones de baixo para as habilidades e poções.<br><br>
  🎵 <b>Combate rítmico:</b> golpeie quando as barrinhas encontram o centro do marcador. <b style="color:#c08000">PERFEITO</b> = +60% de dano e aumenta o combo!`);
  dialog('📜 Como jogar', `
  <b>WASD</b> andar · <b>Arrastar o mouse</b> gira a câmera · <b>Roda</b> zoom<br>
  <b>Clique</b> ou <b>J</b> — golpe de fita · <b>Espaço</b> pular · <b>Shift</b> esquiva<br>
  <b>1–4</b> habilidades da classe · <b>Q</b> Poção Vermelha · <b>E</b> Poção Azul<br>
  <b>F</b> falar com NPC · <b>C</b> atributos · <b>X</b> sentar · <b>M</b> música<br><br>
  🎵 <b>Combate rítmico:</b> golpeie quando as barrinhas encontram o centro do marcador.
  <b style="color:#c08000">PERFEITO</b> = +60% de dano e aumenta o combo (até +100%). Errar o tempo zera o combo.<br><br>
  Caminho: Solmira → Campos Dourados → Areias Rubras → Oásis de Kharum. O jogo salva sozinho.`);
}
function openChat() { $('chatbox').classList.remove('hidden'); $('chat-in').focus(); for (const k in keys) keys[k] = false; }
function sendChat() { const i = $('chat-in'); Net.say(i.value); i.value = ''; $('chatbox').classList.add('hidden'); i.blur(); }
$('btn-chat').onclick = openChat;
$('chat-send').onclick = sendChat;
$('chat-in').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') sendChat(); if (e.key === 'Escape') { $('chatbox').classList.add('hidden'); e.target.blur(); } });
$('btn-stat').onclick = toggleStats; $('btn-skill').onclick = toggleSkills; $('btn-music').onclick = toggleMusic; $('btn-help').onclick = showHelp;
$('btn-sit').onclick = () => { P.sit = !P.sit; };

// ---------------------------------------------------------------- salvar
const SAVE_KEY = 'lyra3d-save-v1';
function save() {
  if (!running) return;
  const keep = ['skillLv', 'skillPts', 'kvxWeek', 'kvxKills', 'title', 'name', 'race', 'cls', 'gender', 'hair', 'skin', 'dex', 'luk', 'lv', 'xp', 'zeny', 'statPts', 'str', 'agi', 'vit', 'int', 'hp', 'sp', 'inv', 'x', 'z', 'face', 'home', 'quest', 'qcount', 'best'];
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(Object.fromEntries(keep.map(k => [k, P[k]])))); } catch (e) { }
}
function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
setInterval(save, 8000); addEventListener('beforeunload', save);

function start(fromSave) {
  Audio8.init();
  $('title').classList.add('hidden'); $('hud').classList.remove('hidden'); camera.clearViewOffset();
  if (fromSave) {
    const s = loadSave();
    Object.assign(P, { race: 'humano', cls: 'dancarina', gender: 'f', hair: 0, skin: 0, dex: 3, luk: 3 }, s, { inv: { red: 0, blue: 0, ...s.inv } });
    if (inTower(P.z)) { P.x = CIT.x; P.z = CIT.z + 8; }
    if (blocked(P.x, P.z)) { P.x = VIL.x; P.z = VIL.z + 10; }
  } else {
    Object.assign(P, CREATE, { name: $('name-in').value.trim().replace(/\s+/g, ' ').slice(0, 16) });
    const r = RACES[P.race].bonus, c = CLASSES[P.cls].bonus;
    for (const k of STAT_KEYS) P[k] = Math.max(1, 3 + (r[k] || 0) + (c[k] || 0));
    P.statPts = 3;
  }
  refreshSkills(); rebuildAvatar();
  if (!fromSave) { P.skillLv = { [SKILLS[0].id]: 1 }; P.skillPts = 0; }
  else if (!P.skillLv || !Object.keys(P.skillLv).length || !SKILLS.some(s => P.skillLv[s.id])) {   // save antigo: converte
    P.skillLv = {}; SKILLS.forEach(s => { if (P.lv >= s.lv) P.skillLv[s.id] = 1; });
    P.skillPts = Math.max(0, P.lv - Object.keys(P.skillLv).length);
  }
  try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) { }
  if (!fromSave) { P.hp = stats.maxHp(); P.sp = stats.maxSp(); }
  P.y = groundY(P.x, P.z);
  $('pname').textContent = P.name;
  for (const s of SPAWNS) for (let i = 0; i < s.n; i++) spawnMob(s.type, s.area, s.at);
  running = true; Kvx.init(); Net.init(); buildHotbar();
  const who = `${className(P.cls, P.gender)} ${RACES[P.race].name.toLowerCase()}`;
  if (fromSave) log(`${P.gender === 'm' ? 'Bem-vindo' : 'Bem-vinda'} de volta, <b>${P.name}</b>!`, 'gold');
  else if (TOUCH) { log(`<b>${P.name}</b>, ${who}, chegou a Solmira! Fale com a <b>Mestra Odete</b> (toque 💬 perto dela).`, 'gold'); log('Toque ❓ para ver como jogar.', 'sys'); }
  else { log(`<b>${P.name}</b>, ${who}, chegou a Solmira! Fale com a <b>Mestra Odete</b> (aperte <b>F</b> perto dela).`, 'gold'); log('Aperte <b>H</b> para ver os controles.', 'sys'); }
}

// ---------------------------------------------------------------- criação de personagem
const CREATE = { race: 'humano', gender: 'f', cls: 'dancarina', hair: 0, skin: 0 };
function renderCreate() {
  const chips = (id, items, cur, onPick) => {
    const el = $(id); el.innerHTML = '';
    items.forEach(([val, label, style]) => {
      const b = document.createElement('button'); b.className = 'chip' + (val === cur ? ' on' : '');
      b.innerHTML = label; if (style) b.style.cssText = style;
      b.onclick = () => { Audio8.init(); Audio8.sfx('click'); onPick(val); renderCreate(); };
      el.appendChild(b);
    });
  };
  chips('c-race', Object.entries(RACES).map(([k, r]) => [k, r.name]), CREATE.race, v => { CREATE.race = v; CREATE.skin = 0; });
  chips('c-gender', [['f', 'Feminino'], ['m', 'Masculino']], CREATE.gender, v => CREATE.gender = v);
  const allowed = RACES[CREATE.race].classes || Object.keys(CLASSES);
  if (!allowed.includes(CREATE.cls)) CREATE.cls = allowed[0];
  chips('c-class', allowed.map(k => [k, `${CLASSES[k].skills[0].icon} ${className(k, CREATE.gender)}`]), CREATE.cls, v => CREATE.cls = v);
  chips('c-hair', HAIR_COLORS.map((c, i) => [i, '', `background:#${c.toString(16).padStart(6, '0')}`]), CREATE.hair, v => CREATE.hair = v);
  chips('c-skin', RACES[CREATE.race].skins.map((c, i) => [i, '', `background:#${c.toString(16).padStart(6, '0')}`]), CREATE.skin, v => CREATE.skin = v);
  const r = RACES[CREATE.race], c = CLASSES[CREATE.cls];
  const st = STAT_KEYS.map(k => `${STAT_NAMES[k]} <b>${Math.max(1, 3 + (r.bonus[k] || 0) + (c.bonus[k] || 0))}</b>`).join(' · ');
  $('c-info').innerHTML = `<p><b>${r.name}:</b> ${r.desc}</p><p><b>${className(CREATE.cls, CREATE.gender)}:</b> ${c.role}</p>
    <p class="cst">${st}</p><p class="csk">${c.skills.map(s => `${s.icon} ${s.name} <small>(Nv ${s.lv})</small>`).join('<br>')}</p>`;
  Object.assign(P, CREATE); refreshSkills(); rebuildAvatar();
}
// confirmação dentro do jogo (confirm() não funciona em todo lugar, ex.: páginas do Claude)
let newArmed = false;
function armNew() {
  if (newArmed) return true;
  newArmed = true; $('btn-new').textContent = '⚠️ Toque de novo: apaga o progresso';
  setTimeout(() => { newArmed = false; $('btn-new').textContent = '✨ Novo Jogo'; }, 4000);
  return false;
}
function nameOk() {
  const v = $('name-in').value.trim();
  if (v.length < 2) { $('name-in').classList.add('err'); $('name-in').placeholder = 'Escolha um nome (mín. 2 letras)'; $('name-in').focus(); Audio8.sfx('miss'); return false; }
  $('name-in').classList.remove('err'); return true;
}
$('btn-new').onclick = () => {
  if (!nameOk()) return; if (loadSave() && !armNew()) return; start(false); };
$('btn-cont').onclick = () => start(true);
renderCreate();
(function loadModels() {
  const btn = $('btn-new'), cont = $('btn-cont'), label = btn.textContent;
  btn.disabled = true; cont.disabled = true;
  ModelKit.load(p => { btn.textContent = `⏳ Carregando personagens… ${Math.round(p * 100)}%`; }).then(ok => {
    btn.disabled = false; cont.disabled = false; btn.textContent = label;
    if (ok) { upgradeNPCs(); renderCreate(); }
  });
})();
if (!loadSave()) $('btn-cont').style.display = 'none';
$('name-in').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-new').click(); });

// ---------------------------------------------------------------- loop
let last = performance.now();
P.y = groundY(P.x, P.z);
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (running) {
    update(dt); animateLyra(dt); updateCamera(dt);
    sky.position.copy(camera.position); renderer.render(scene, camera);
    updateLabels(); updateHUD(); drawBeat(); drawMinimap();
  } else {
    // vitrine na tela de título
    time += dt; const ph = time % 4;
    if (CLS().rhythm) P.dance = ph < 1.2 ? 1 - ph / 1.2 : 0; else { P.dance = 0; P.cast = ph < 0.6 ? 1 - ph / 0.6 : 0; }
    P.moving = false; P.onGround = true;
    animateLyra(dt);
    camera.position.set(P.x + Math.sin(time * 0.2) * 5, P.y + 1.8, P.z + Math.cos(time * 0.2) * 5);
    camera.lookAt(P.x, P.y + 1.1, P.z);
    camera.setViewOffset(innerWidth, innerHeight, innerWidth * 0.2, 0, innerWidth, innerHeight);
    sun.position.set(P.x + 30, P.y + 50, P.z + 18); sun.target.position.set(P.x, P.y, P.z);
    sky.position.copy(camera.position); renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
