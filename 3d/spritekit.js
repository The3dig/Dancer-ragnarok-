// =====================================================================
//  SpriteKit — personagens, monstros e efeitos com a arte pixelada do
//  RPG Kravenox, desenhados como "billboards" no mundo 3D (estilo Ragnarok).
//  Os sprites vêm de window.SPR (sprites.js, gerado por scripts/build-sprites.js).
// =====================================================================
'use strict';
const SpriteKit = (() => {
  const IMG = {}, TEX = {};
  let ready = false;
  const actors = new Set(), fxs = [];
  const PX = 1.85 / 36;                       // metros por pixel dos heróis e NPCs (28x36 → 1,85 m)
  const light = new THREE.Color(1, 1, 1);     // escurece os sprites nas regiões sombrias

  function load() {
    const S = window.SPR || {};
    return Promise.all(Object.keys(S).map(n => new Promise(res => {
      const im = new Image();
      im.onload = () => { IMG[n] = im; res(); }; im.onerror = () => res();
      im.src = 'data:image/png;base64,' + S[n];
    }))).then(() => { ready = Object.keys(IMG).length > 0; return ready; });
  }
  function tex(n) {
    if (TEX[n]) return TEX[n];
    const im = IMG[n]; if (!im) return null;
    const t = new THREE.Texture(im);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
    t.userData = { w: im.width, h: im.height };
    return (TEX[n] = t);
  }
  const has = n => !!IMG[n];
  // registra um desenho feito em canvas (ex.: animais do Sítio) como sprite
  function addCanvas(n, c) { IMG[n] = c; delete TEX[n]; }

  const shadowGeo = new THREE.CircleGeometry(1, 20); shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
  const _w = new THREE.Vector3();
  const norm = a => ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

  // set: { kind: 'dir', base: 's_lyra' } (4 direções × 2 quadros)
  //      { kind: 'hero', base: 'k' }      (Kravenox/Thornox: + 4 quadros de andar de lado e fúria)
  //      { kind: 'one', img: 'e_eco' }    (inimigo de um quadro só; espelha conforme o lado)
  // opt: { h (altura em metros, para 'one'), px (escala), shadow, float, faceRight }
  function actor(set, opt = {}) {
    const root = new THREE.Group();
    const mat = new THREE.SpriteMaterial({ map: null, alphaTest: 0.5, transparent: false, fog: true, toneMapped: false });
    const spr = new THREE.Sprite(mat); spr.center.set(0.5, 0);
    root.add(spr);
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.y = 0.03; sh.renderOrder = -1;
    if (opt.shadow !== false) root.add(sh);
    const a = { root, spr, mat, set, opt, t: Math.random() * 10, dir: 'down', fade: 1, tint: new THREE.Color(1, 1, 1) };
    const first = set.kind === 'one' ? set.img : set.base + '_down_0';
    const ft = tex(first);
    let px = opt.px || PX;
    if (set.kind === 'one' && ft) px = (opt.h || 1.8) / ft.userData.h;
    a.px = px;
    a.h = ft ? ft.userData.h * px : 1.8;
    sh.scale.setScalar(ft ? Math.max(0.35, ft.userData.w * px * 0.38) : 0.5);
    if (opt.shadowScale) sh.scale.multiplyScalar(opt.shadowScale);
    a.shadow = sh;
    a.update = (dt, st = {}) => update(a, dt, st);
    a.dispose = () => { actors.delete(a); mat.dispose(); };
    actors.add(a);
    update(a, 0, {});
    return a;
  }

  function pick(a, st) {
    const S = a.set;
    if (S.kind === 'one') return S.img;
    if (st.fury && has(S.base + '_furia')) return S.base + '_furia';
    const d = a.dir;
    if (S.kind === 'hero' && st.moving && (d === 'left' || d === 'right')) return `${S.base}_${d}_w${Math.floor(a.t * 9) % 4}`;
    const f = st.moving ? Math.floor(a.t * 6) % 2 : 0;
    return `${S.base}_${d}_${f}`;
  }

  function update(a, dt, st) {
    a.t += dt;
    // direção em relação à câmera
    a.root.getWorldPosition(_w);
    let screenRight = false;
    if (typeof camera !== 'undefined') {
      const A = Math.atan2(camera.position.x - _w.x, camera.position.z - _w.z);
      const rel = norm((st.face ?? 0) - A);
      a.dir = Math.abs(rel) < Math.PI / 4 ? 'down' : Math.abs(rel) > Math.PI * 3 / 4 ? 'up' : rel > 0 ? 'right' : 'left';
      screenRight = rel > 0.15 && rel < Math.PI - 0.15;
    }
    const n = pick(a, st), t = tex(n) || a.mat.map;
    if (t && a.mat.map !== t) { a.mat.map = t; a.mat.needsUpdate = true; }
    if (!t) return;
    const w = t.userData.w * a.px, h = t.userData.h * a.px;
    let sx = w, sy = h;
    if (a.set.kind === 'one' && (a.opt.faceRight ? !screenRight : screenRight)) sx = -w;
    // golpe: estica e avança um pouco; andar: balanço; flutuar
    const atk = st.atk || 0;
    const lunge = Math.sin(Math.min(1, atk) * Math.PI);
    sx *= 1 + lunge * 0.12; sy *= 1 - lunge * 0.05;
    let y = 0;
    if (a.opt.float) y += 0.35 + Math.sin(a.t * 2.4) * 0.18;
    else if (st.moving && a.set.kind === 'one') { y += Math.abs(Math.sin(a.t * 8)) * 0.08 * a.h; sy *= 1 - Math.abs(Math.sin(a.t * 8)) * 0.05; }
    else if (!st.moving) sy *= 1 + Math.sin(a.t * 2.2) * 0.012;          // respiração
    if (st.sleeping) sy *= 0.92 + Math.sin(a.t * 0.8) * 0.02;
    if (st.sit) sy *= 0.78;
    if (st.jump) y += st.jump;
    a.spr.scale.set(sx, sy, 1);
    // morte: deita e some
    if (st.dead) { a.mat.rotation = lerpA(a.mat.rotation, Math.PI / 2 * (sx < 0 ? -1 : 1), dt * 8); }
    else a.mat.rotation = lerpA(a.mat.rotation, 0, dt * 10);
    a.spr.center.set(0.5, st.dead ? 0.15 : 0);
    a.spr.position.y = y;
    if (st.gy !== undefined) a.shadow.position.y = st.gy + 0.03;
    a.shadow.visible = !st.dead && a.opt.shadow !== false;
    // cor: luz da região, golpe recebido, sono
    a.tint.copy(light);
    if (st.sleeping) a.tint.multiplyScalar(0.35);
    if (st.flash) a.tint.setRGB(1, 0.35, 0.35);
    if (st.beam) a.tint.lerp(new THREE.Color(1, 0.4, 0.4), Math.min(1, st.beam));
    a.mat.color.copy(a.tint);
    const op = st.fade ?? 1;
    a.mat.transparent = op < 1; a.mat.opacity = op;
  }
  const lerpA = (c, t, k) => c + (t - c) * Math.min(1, k);

  // ---------------- efeitos de sprite (garra, espinhos, raio, explosão, orbe)
  // o: { x, y, z, h (altura), life, rise, flip, from/to (raio entre dois pontos), color }
  function fx(name, o) {
    const t = tex(name); if (!t) return null;
    const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: true, toneMapped: false });
    if (o.color !== undefined) m.color.set(o.color);
    const s = new THREE.Sprite(m); s.renderOrder = 5;
    const h = o.h || 2, w = h * t.userData.w / t.userData.h;
    s.scale.set(o.flip ? -w : w, h, 1);
    if (o.bottom) s.center.set(0.5, 0);
    s.position.set(o.x, o.y, o.z); scene.add(s);
    const f = { s, m, life: o.life || 0.45, max: o.life || 0.45, rise: o.rise || 0, w, h, grow: o.grow || 0, beam: o.from ? { from: o.from.clone(), to: o.to.clone() } : null };
    if (f.beam) placeBeam(f);
    fxs.push(f);
    return f;
  }
  function placeBeam(f) {
    const { from, to } = f.beam;
    f.s.position.copy(from).add(to).multiplyScalar(0.5);
    const a = from.clone().project(camera), b = to.clone().project(camera);
    const ang = Math.atan2((b.y - a.y) * (typeof VH !== 'undefined' ? VH : innerHeight), (b.x - a.x) * (typeof VW !== 'undefined' ? VW : innerWidth));
    f.m.rotation = ang;
    const len = from.distanceTo(to);
    f.s.scale.set(len, f.h, 1);
  }
  function tick(dt) {
    for (const f of fxs) {
      f.life -= dt;
      const k = Math.max(0, f.life / f.max);
      f.m.opacity = Math.min(1, k * 2.2);
      f.s.position.y += f.rise * dt;
      if (f.grow) f.s.scale.multiplyScalar(1 + f.grow * dt);
      if (f.beam) placeBeam(f);
    }
    for (let i = fxs.length - 1; i >= 0; i--) if (fxs[i].life <= 0) { scene.remove(fxs[i].s); fxs[i].m.dispose(); fxs.splice(i, 1); }
  }

  return {
    load, actor, fx, tick, tex, has, light, addCanvas,
    get ready() { return ready; },
    setLight(v) { light.setScalar(v); },
  };
})();
