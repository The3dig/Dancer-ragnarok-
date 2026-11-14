// =====================================================================
//  Props — objetos 3D realistas do cenário (Poly Haven, CC0; ver props/CREDITOS.md):
//  rochas, tocos, troncos caídos, barris, caixotes, lanternas, fogueira.
// =====================================================================
'use strict';
const Props = (() => {
  const NAMES = ['rock_07', 'rock_09', 'rock_moss_set_01', 'wooden_barrels_01', 'wooden_crate_01', 'wine_barrel_01', 'wooden_lantern_01', 'stone_fire_pit', 'wooden_bucket_01', 'dead_tree_trunk_02', 'tree_stump_01'];
  const lib = {};
  let ready = false;
  const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
  const script = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

  async function load() {
    const loader = new THREE.GLTFLoader();
    try {
      for (const n of NAMES) {
        if (!(window.GLB && window.GLB[n])) await script(`${window.GAME_BASE || ''}props/${n}.js`);
        const g = await new Promise((ok, no) => loader.parse(b64(window.GLB[n]), '', ok, no));
        delete window.GLB[n];
        g.scene.traverse(o => {
          if (!o.isMesh) return;
          o.castShadow = true; o.receiveShadow = true;
          const m = o.material; m.metalness = 0; m.metalnessMap = null; m.roughness = 0.95; m.envMapIntensity = 0; m.needsUpdate = true;
        });
        const box = new THREE.Box3().setFromObject(g.scene), size = box.getSize(new THREE.Vector3());
        lib[n] = { scene: g.scene, h: size.y || 1, w: Math.max(size.x, size.z) || 1, minY: box.min.y };
      }
      ready = true;
    } catch (e) { console.warn('Objetos 3D indisponíveis', e); }
    return ready;
  }

  // coloca um objeto com altura h (metros); ob = raio de colisão (0 = atravessável)
  function place(n, x, z, h, rot = 0, ob = 0) {
    const L = lib[n]; if (!L) return null;
    const o = L.scene.clone(true), k = h / L.h;
    o.scale.setScalar(k); o.rotation.y = rot;
    o.position.set(x, groundY(x, z) - L.minY * k, z);
    scene.add(o);
    if (ob) addOb(x, z, ob);
    return o;
  }
  // muitas cópias de um modelo de uma malha só (rochas): InstancedMesh
  function instanced(n, list, setup) {
    const L = lib[n]; if (!L) return null;
    let mesh = null; L.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    if (!mesh) return null;
    mesh.updateWorldMatrix(true, false);
    const geo = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    const im = new THREE.InstancedMesh(geo, mesh.material, list.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    list.forEach((it, i) => { setup(it, p, q, s, L); m4.compose(p, q, s); im.setMatrixAt(i, m4); });
    im.castShadow = !TOUCH; im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
    return im;
  }

  // ---------------- decoração do mundo
  const rnd = (() => { let s = 1234567; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  const R = (a, b) => a + rnd() * (b - a);
  function decorate() {
    if (!ready) return;
    // rochas do mapa viram rochas escaneadas
    if (window.rockIM && window.rockList) {
      window.rockIM.visible = false;
      const A = window.rockList.filter((_, i) => i % 2 === 0), B = window.rockList.filter((_, i) => i % 2 === 1);
      const set = (o, p, q, s, L) => { const k = o.s * 1.6 / L.w; s.setScalar(k); q.setFromEuler(new THREE.Euler(0, o.x * 3.7, 0)); p.set(o.x, height(o.x, o.z) - L.minY * k - 0.1, o.z); };
      instanced('rock_07', A, set); instanced('rock_09', B, set);
    }
    // tocos e troncos caídos pelos campos e florestas
    let n = 0;
    for (let i = 0; i < 400 && n < 34; i++) {
      const x = R(-WX + 20, 40), z = R(-WZ + 10, WZ - 10);
      if (!freeSpot(x, z, 6) || Math.hypot(x - VIL.x, z - VIL.z) < 30 || Math.hypot(x - FARM.x, z - FARM.z) < 26 || Math.hypot(x - LAIR.x, z - LAIR.z) < 24) continue;
      if (n % 2) place('tree_stump_01', x, z, R(0.5, 0.8), R(0, TAU), 0.5); else place('dead_tree_trunk_02', x, z, R(0.7, 1.0), R(0, TAU), 1.0);
      n++;
    }
    // rochas com musgo nas bordas da floresta
    for (let i = 0, k = 0; i < 300 && k < 14; i++) {
      const x = R(-WX + 20, 30), z = R(-WZ + 10, WZ - 10);
      if (!freeSpot(x, z, 7) || Math.hypot(x - VIL.x, z - VIL.z) < 34) continue;
      place('rock_moss_set_01', x, z, R(0.9, 1.6), R(0, TAU), 1.4); k++;
    }
    // Vila de Solmira: barris, caixotes, lanternas e baldes junto às casas e à praça
    const villageHouses = [[-125, -22], [-105, -30], [-84, -24], [-127, 22], [-104, 30], [-84, 22], [-135, -6]];
    villageHouses.forEach(([hx, hz], i) => {
      const a = Math.atan2(VIL.x - hx, VIL.z - hz), sx = Math.cos(a) * 3.6, sz = -Math.sin(a) * 3.6;
      const fx = hx + Math.sin(a) * 3.2, fz = hz + Math.cos(a) * 3.2;
      if (i % 3 === 0) place('wooden_barrels_01', fx + sx, fz + sz, 1.1, a, 0.9);
      if (i % 3 === 1) { place('wooden_crate_01', fx + sx, fz + sz, 0.7, a + 0.3, 0.6); place('wooden_crate_01', fx + sx * 1.25, fz + sz * 1.25, 0.6, a - 0.4, 0); }
      if (i % 3 === 2) place('wine_barrel_01', fx - sx, fz - sz, 1.0, a, 0.6);
      place('wooden_bucket_01', fx - sx * 0.8, fz - sz * 0.8, 0.45, R(0, TAU), 0);
    });
    for (let k = 0; k < 8; k++) {                       // lanternas em volta da praça
      const a = k / 8 * TAU + 0.2, x = VIL.x + Math.cos(a) * 15.5, z = VIL.z + Math.sin(a) * 15.5;
      if (Math.abs(Math.sin(a)) < 0.25) continue;       // não bloqueia a estrada
      lantern(x, z);
    }
    place('stone_fire_pit', VIL.x + 30, VIL.z - 9, 0.6, 0, 1.2);
    // Mercador e curandeira: caixotes e barris
    place('wooden_crate_01', VIL.x + 8.5, VIL.z - 8.5, 0.7, 0.4, 0.6); place('wine_barrel_01', VIL.x + 9.5, VIL.z - 6.5, 1.0, 0, 0.6);
    // Forja do Ferreiro Doran
    place('wooden_barrels_01', VIL.x - 13.1, VIL.z - 11.2, 1.0, 0.3, 0.8); place('wooden_crate_01', VIL.x - 16.4, VIL.z - 8, 0.6, 0.5, 0.5);
    // Sítio
    place('wooden_crate_01', FARM.x - 12, FARM.z - 5, 0.7, 0.2, 0.6); place('wooden_bucket_01', FARM.x - 3, FARM.z + 3.3, 0.45, 0, 0);
    place('wooden_barrels_01', FARM.x - 14, FARM.z + 4, 1.1, 1.2, 0.9);
    // Oásis de Kharum
    [[106, 35], [124, 34], [131, 37]].forEach(([x, z], i) => { place('wooden_crate_01', x + 2, z + 1, 0.7, i, 0.6); place('wine_barrel_01', x - 2.2, z + 1.2, 0.95, 0, 0.6); });
    place('stone_fire_pit', OAS.x + 4, OAS.z - 14, 0.6, 0, 1.2);
    // Cidadela do Cisma: lanternas e rochas
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.5; lantern(CIT.x + Math.cos(a) * 18, CIT.z + Math.sin(a) * 18, 0xb060ff); }
  }
  // poste de ferro torneado (base, anéis e braço curvo) com a lanterna pendurada e luz
  let posteG = null, bracoG = null, ferroM = null;
  function lantern(x, z, color = 0xffb060) {
    if (!posteG) {
      posteG = new THREE.LatheGeometry([[0, 0], [0.26, 0], [0.26, 0.12], [0.16, 0.22], [0.1, 0.45], [0.06, 0.6], [0.06, 1.9], [0.1, 1.95], [0.1, 2.05], [0.06, 2.1], [0.05, 2.7], [0.09, 2.78], [0, 2.95]].map(([a, b]) => new THREE.Vector2(a, b)), 12);
      const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 2.55, 0), new THREE.Vector3(0.15, 2.85, 0), new THREE.Vector3(0.62, 2.62, 0));
      bracoG = new THREE.TubeGeometry(cv, 12, 0.035, 6, false);
      ferroM = new THREE.MeshLambertMaterial({ color: 0x2a262e });
    }
    const g = new THREE.Group(); g.position.set(x, groundY(x, z), z); scene.add(g);
    const p = new THREE.Mesh(posteG, ferroM); p.castShadow = true; g.add(p);
    g.add(new THREE.Mesh(bracoG, ferroM));
    const l = place('wooden_lantern_01', x + 0.62, z, 0.42, 0, 0);
    if (l) l.position.y = groundY(x, z) + 2.05;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }));
    glow.position.set(x + 0.62, groundY(x, z) + 2.25, z); glow.scale.setScalar(1.6); scene.add(glow); glows.push(glow);
    addOb(x, z, 0.3);
  }
  let _glow = null;
  function glowTex() {
    if (_glow) return _glow;
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,220,160,.5)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (_glow = new THREE.CanvasTexture(c));
  }
  // lanternas mais fortes à noite
  const glows = [];
  function setNight(n) { const k = 0.35 + 0.65 * n; for (const g of glows) { g.material.opacity = 0.55 * k; g.scale.setScalar(1.2 + n * 0.6); } }
  return { load, decorate, place, setNight, get ready() { return ready; } };
})();
