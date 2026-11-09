// =====================================================================
//  ModelKit — carrega os modelos 3D animados (CC0, ver models/CREDITOS.txt)
//  e cria instâncias com animações prontas.
// =====================================================================
'use strict';
const ModelKit = (() => {
  const NAMES = ['adventurer', 'hooded_adventurer', 'worker', 'slime_pink', 'bee', 'mushroom_imp', 'crab', 'raptor', 'orc_brute', 'skeleton'];
  const lib = {};
  let ready = false, failed = false;
  const _v = new THREE.Vector3();

  function b64ToBuf(b64) {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  // altura real (com o esqueleto aplicado) para normalizar a escala
  function measure(obj) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3();
    obj.traverse(m => {
      if (!m.isMesh) return;
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 4) { _v.fromBufferAttribute(pos, i); if (m.isSkinnedMesh) m.boneTransform(i, _v); _v.applyMatrix4(m.matrixWorld); box.expandByPoint(_v); }
    });
    return box;
  }
  async function load(onProgress) {
    const loader = new THREE.GLTFLoader();
    let n = 0;
    try {
      for (const name of NAMES) {
        if (!(window.GLB && window.GLB[name])) await loadScript(`${window.GAME_BASE || ''}models/${name}.js`);
        const gltf = await new Promise((res, rej) => loader.parse(b64ToBuf(window.GLB[name]), '', res, rej));
        delete window.GLB[name];
        gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
        const box = measure(gltf.scene);
        gltf.height = box.max.y - box.min.y; gltf.minY = box.min.y;
        lib[name] = gltf;
        onProgress && onProgress(++n / NAMES.length);
      }
      ready = true;
    } catch (e) { console.warn('Modelos 3D indisponíveis, usando bonecos simples.', e); failed = true; }
    return ready;
  }

  // ---------------- instância animada
  class Inst {
    constructor(name, height) {
      const src = lib[name];
      this.name = name;
      this.obj = THREE.SkeletonUtils.clone(src.scene);
      // materiais próprios (para tingir e piscar ao levar dano)
      this.mats = [];
      const cache = new Map();
      this.obj.traverse(o => {
        if (!o.isMesh) return;
        const conv = m => { if (!cache.has(m)) { const c = m.clone(); cache.set(m, c); this.mats.push(c); } return cache.get(m); };
        o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
      });
      const k = height / src.height;
      this.root = new THREE.Group(); this.root.add(this.obj);
      this.obj.scale.multiplyScalar(k); this.obj.position.y = -src.minY * k;
      this.mixer = new THREE.AnimationMixer(this.obj);
      this.actions = {};
      for (const c of src.animations) this.actions[c.name] = this.mixer.clipAction(c);
      this.cur = null; this.curName = '';
    }
    has(n) { return !!this.actions[n]; }
    clip(n) { return this.actions[n] ? this.actions[n].getClip().duration : 1; }
    play(n, { once = false, fade = 0.18, speed = 1, restart = false } = {}) {
      const a = this.actions[n]; if (!a) return;
      if (this.curName === n && !restart) { a.timeScale = speed; return; }
      a.reset(); a.timeScale = speed;
      a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = once;
      a.enabled = true; a.setEffectiveWeight(1);
      if (this.cur && this.cur !== a) a.crossFadeFrom(this.cur, fade, false);
      a.play(); this.cur = a; this.curName = n;
    }
    update(dt) { this.mixer.update(dt); }
    mat(name) { return this.mats.filter(m => m.name === name); }
    tint(name, color) { this.mat(name).forEach(m => m.color.set(color)); }
    bone(n) { return this.obj.getObjectByName(n); }
    mesh(n) { let r = null; this.obj.traverse(o => { if (!r && o.isMesh && (o.name === n || (o.parent && o.parent.name === n))) r = o; }); return r; }
    // grupo preso a um osso, com eixos alinhados ao personagem e escala em metros
    attach(boneName) {
      const b = this.bone(boneName) || this.obj;
      this.root.updateMatrixWorld(true);
      const g = new THREE.Group();
      const wq = new THREE.Quaternion(), ws = new THREE.Vector3(), rq = new THREE.Quaternion();
      b.getWorldQuaternion(wq); b.getWorldScale(ws); this.root.getWorldQuaternion(rq);
      g.quaternion.copy(wq).invert().multiply(rq);
      g.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z);
      b.add(g);
      return g;
    }
  }
  function instance(name, height) { return lib[name] ? new Inst(name, height) : null; }
  return { load, instance, get ready() { return ready; }, get failed() { return failed; } };
})();
