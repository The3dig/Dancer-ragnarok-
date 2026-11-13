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
renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 1.0 : 2));
// tamanho real da área visível: no iPhone (Safari e app do Claude) a moldura pode
// crescer para caber num canvas antigo após girar a tela; por isso o canvas segue
// sempre 100% do elemento e o tamanho é medido nele, nunca imposto.
let VW = innerWidth, VH = innerHeight;
function measure() {
  const de = document.documentElement, vv = window.visualViewport;
  VW = Math.max(1, Math.round(Math.min(de.clientWidth || innerWidth, vv ? vv.width : 1e9, innerWidth)));
  VH = Math.max(1, Math.round(Math.min(de.clientHeight || innerHeight, vv ? vv.height : 1e9, innerHeight)));
}
measure();
renderer.setSize(VW, VH, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = TOUCH ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
if (TOUCH) renderer.shadowMap.autoUpdate = false;               // no celular a sombra é refeita a cada 2 quadros
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.domElement.id = 'cv3';
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const SKY_GREEN = new THREE.Color(0xa8b6bf), SKY_DESERT = new THREE.Color(0xd9c4a2);
const SKY_TOP_G = new THREE.Color(0x4b6684), SKY_TOP_D = new THREE.Color(0x7690ac);
scene.fog = new THREE.Fog(SKY_GREEN.clone(), 38, 165);
// céu em gradiente com sol
const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: SKY_TOP_G.clone() }, horizon: { value: SKY_GREEN.clone() }, sunDir: { value: new THREE.Vector3(0.5, 0.75, 0.3).normalize() }, night: { value: 0 } },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = vec4(p.xy, p.w * 0.9999, p.w); }',
  fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform float night; varying vec3 vDir;
    void main(){ vec3 d = normalize(vDir); float h = clamp(d.y, 0.0, 1.0);
      vec3 c = mix(horizon, top, pow(h, 0.5));
      float s = max(dot(d, sunDir), 0.0);
      // nuvens: ruído em camadas projetado no céu
      vec2 q = d.xz / (d.y + 0.18) * 1.6;
      float n = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { n += a * (sin(q.x * 1.7 + sin(q.y * 1.3)) * cos(q.y * 1.9 + sin(q.x * 0.7)) * 0.5 + 0.5); q *= 2.03; q += vec2(1.7, 9.2); a *= 0.5; }
      float cl = smoothstep(0.52, 0.78, n) * smoothstep(0.0, 0.25, d.y);
      vec3 cc = mix(c * 1.25 + 0.06, vec3(0.95, 0.9, 0.82) * (0.4 + dot(c, vec3(0.6))), pow(s, 4.0) * 0.5);
      c = mix(c, cc, cl * 0.7);
      c += vec3(1.0, 0.88, 0.7) * (pow(s, 600.0) * 2.5 + pow(s, 10.0) * 0.22) * (1.0 - night * 0.8);
      // estrelas à noite (e a lua do lado oposto ao sol)
      vec3 sd = floor(d * 220.0); float st = fract(sin(dot(sd, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      c += vec3(0.9, 0.92, 1.0) * step(0.9975, st) * night * smoothstep(0.05, 0.3, d.y) * (1.0 - cl);
      float mo = max(dot(d, -sunDir), 0.0); c += vec3(0.8, 0.85, 1.0) * (pow(mo, 900.0) * 1.6 + pow(mo, 30.0) * 0.08) * night;
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
const camera = new THREE.PerspectiveCamera(55, VW / VH, 0.1, 400);
const hemi = new THREE.HemisphereLight(0xb9c6d2, 0x3a3326, 0.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0bc, 1.7);
sun.castShadow = true; sun.shadow.mapSize.set(TOUCH ? 1024 : 2048, TOUCH ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 140 });
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);
// ---------------------------------------------------------------- tratamento de cor de cinema (pós-processamento)
const POST = (() => {
  if (!renderer.capabilities.isWebGL2) return null;
  const half = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: half ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: TOUCH ? 0 : 4 });
  const mat = new THREE.ShaderMaterial({
    uniforms: { tD: { value: rt.texture } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tD; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(tD, vUv).rgb;
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, 0.8);                                                     // menos saturação
        c += vec3(-0.012, 0.0, 0.018) * (1.0 - smoothstep(0.0, 0.25, l));             // sombras frias
        c += vec3(0.02, 0.01, -0.012) * smoothstep(0.35, 1.0, l);                     // luzes quentes
        c = pow(max(c, 0.0), vec3(1.08));                                             // contraste
        float v = smoothstep(0.98, 0.38, length((vUv - 0.5) * vec2(1.15, 1.0)));
        c *= mix(0.58, 1.0, v);                                                       // vinheta
        gl_FragColor = vec4(c, 1.0);
        #include <encodings_fragment>
      }`,
    depthTest: false, depthWrite: false, toneMapped: false,
  });
  const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); q.frustumCulled = false;
  const ps = new THREE.Scene(); ps.add(q); const pc = new THREE.Camera();
  return { render() {
    const w = renderer.domElement.width, h = renderer.domElement.height;
    if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
    renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(ps, pc);
  } };
})();
const QUAL = { level: TOUCH ? 1 : 2, acc: 0, frames: 0, slow: 0 };
let drawN = 0;
const draw = () => { if (TOUCH && (drawN++ % 2 === 0)) renderer.shadowMap.needsUpdate = true; return (POST && QUAL.level >= 1) ? POST.render() : renderer.render(scene, camera); };
function applyQuality() {
  const lv = QUAL.level;
  FOLIAGE.forEach(im => im.castShadow = lv >= 2);
  if (lv === 0) {
    sun.castShadow = false;          // sem sombras: corta metade do trabalho da placa de vídeo
    renderer.setPixelRatio(Math.min(devicePixelRatio, 0.8)); lastFit = ''; fitScreen();
    sun.shadow.mapSize.set(512, 512); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    if (window.grassIM) window.grassIM.visible = false;
  }
}
function watchFps(dt) {
  QUAL.acc += dt; QUAL.frames++;
  if (QUAL.acc < 2) return;
  const fps = QUAL.frames / QUAL.acc; QUAL.acc = 0; QUAL.frames = 0;
  if (fps < (FRAME_MS ? 24 : 40) && QUAL.level > 0) { if (++QUAL.slow >= 2) { QUAL.level--; QUAL.slow = 0; applyQuality(); log(`⚙️ Gráficos ajustados para o seu aparelho (nível ${QUAL.level}).`, 'sys'); } }
  else QUAL.slow = 0;
}
// ---------------------------------------------------------------- andar sozinho até a missão (toque na missão do quadro)
const AUTO = { on: false, t: 0, side: 1, chk: 0, cx: 0, cz: 0, hp: 0, tg: null, tgT: 0 };
function autoStart() {
  if (!questTarget()) { log('Essa missão não tem um lugar para ir agora.', 'sys'); return; }
  Object.assign(AUTO, { on: true, chk: 0, cx: P.x, cz: P.z, hp: P.hp, tgT: 0 }); document.body.classList.add('walking');
  log('🚶 Andando sozinho até o objetivo. Mexa o joystick para parar.', 'sys');
}
function autoStop(msg) { if (!AUTO.on) return; AUTO.on = false; document.body.classList.remove('walking'); if (msg) log(msg, 'sys'); $('quest').dataset.h = ''; }
// próximo ponto do caminho: se o rio estiver no meio, passa pela ponte mais perto
function autoWaypoint(T) {
  const sp = Math.sign(P.x - riverX(P.z)), st = Math.sign(T.x - riverX(T.z));
  if (sp === st || sp === 0 || inTower(P.z) || inTower(T.z) || inVal(P.z) || inVal(T.z)) return { x: T.x, z: T.z, end: true };
  const bz = BRIDGES.reduce((a, b) => Math.abs(b - (P.z + T.z) / 2) + Math.abs(b - P.z) * 0.5 < Math.abs(a - (P.z + T.z) / 2) + Math.abs(a - P.z) * 0.5 ? b : a), bx = riverX(bz);
  if (Math.abs(P.z - bz) > 1.4 || Math.abs(P.x - bx) > 8) return { x: bx + sp * 7.5, z: bz };
  return { x: bx - sp * 8, z: bz };
}
function autoDir(dt) {
  if ((AUTO.tgT -= dt) <= 0) { AUTO.tgT = 0.4; AUTO.tg = questTarget(); }
  const T = AUTO.tg;
  if (!T) { autoStop('🚶 Objetivo concluído.'); return null; }
  if (P.hp < AUTO.hp - 1) { autoStop('⚠️ Você foi atacado: parou de andar sozinho.'); return null; }
  AUTO.hp = Math.max(AUTO.hp, P.hp);
  const W = autoWaypoint(T), dx = W.x - P.x, dz = W.z - P.z, d = Math.hypot(dx, dz);
  if (W.end && d < 3) { autoStop('🚶 Você chegou.'); return null; }
  let a = Math.atan2(dx, dz);
  // desvia de árvores, casas e pedras: testa o caminho à frente e gira até achar passagem
  const free = ang => !blocked(P.x + Math.sin(ang) * 1.3, P.z + Math.cos(ang) * 1.3) && !blocked(P.x + Math.sin(ang) * 0.6, P.z + Math.cos(ang) * 0.6);
  if (!free(a)) {
    let ok = false;
    for (const k of [1, 2, 3, 4, 5]) for (const s of [AUTO.side, -AUTO.side]) { const b = a + s * k * 0.45; if (!ok && free(b)) { a = b; ok = true; AUTO.side = s; } }
    if (!ok) a += Math.PI;
  }
  if ((AUTO.chk += dt) > 2.5) {                                    // preso: tenta o outro lado; se não sair, desiste
    const moved = Math.hypot(P.x - AUTO.cx, P.z - AUTO.cz);
    if (moved < 0.8) { AUTO.side = -AUTO.side; AUTO.stuck = (AUTO.stuck || 0) + 1; if (AUTO.stuck > 3) { AUTO.stuck = 0; autoStop('🚶 Caminho bloqueado. Ande um pouco e toque na missão de novo.'); return null; } }
    else AUTO.stuck = 0;
    AUTO.chk = 0; AUTO.cx = P.x; AUTO.cz = P.z;
  }
  return { x: Math.sin(a), z: Math.cos(a) };
}
// ---------------------------------------------------------------- dia e noite
const SUN_OFF = new THREE.Vector3(40, 34, 22);
let LASTDAY = null;
const DAYC = { horizon: new THREE.Color(), top: new THREE.Color(), sunC: new THREE.Color(), hemiC: new THREE.Color(), sunDir: new THREE.Vector3() };
const C_ = h => new THREE.Color(h);
const DARK_H = C_(0x4a1830), DARK_T = C_(0x12081c), MOUNT_C = C_(0x2a3440), ASH_H = C_(0x5a4440), ASH_T = C_(0x1e1418);
const SUNSET_H = C_(0xd8905a), SUNSET_T = C_(0x5a5a8a), NIGHT_H = C_(0x1c2436), NIGHT_T = C_(0x060914);
function dayCycle() {
  const forced = /noite/.test(location.hash) ? 0.0 : /tarde/.test(location.hash) ? 0.79 : null;
  const t = forced ?? ((Date.now() / 1000 / 1800 + 0.2) % 1);          // 0..1 (0,25 manhã · 0,5 meio-dia · 0,75 fim de tarde)
  const ang = (t - 0.25) * Math.PI * 2, elev = Math.sin(ang + Math.PI / 2 - Math.PI / 2) ;
  const e = Math.sin((t - 0.2) / 0.62 * Math.PI);                         // elevação do sol: dia de 0,2 a 0,82
  const light = clamp(e * 1.4, 0, 1), dusk = clamp(1 - Math.abs(e) * 2.2, 0, 1), night = clamp(-e * 2.5, 0, 1);
  const az = (t - 0.2) / 0.62 * Math.PI;                                    // o sol atravessa o céu
  SUN_OFF.set(Math.cos(az) * 45, 8 + Math.max(e, 0.12) * 40, 22 + Math.sin(az) * 6);
  DAYC.sunDir.copy(SUN_OFF).normalize(); if (night > 0) DAYC.sunDir.y = Math.max(DAYC.sunDir.y, 0.15);
  DAYC.sunC.setRGB(1, 0.88 - dusk * 0.28, 0.74 - dusk * 0.4);
  DAYC.hemiC.set(0xb9c6d2).lerp(C_(0x5a6a9a), night);
  DAYC.horizon.copy(SUNSET_H).lerp(NIGHT_H, night); DAYC.top.copy(SUNSET_T).lerp(NIGHT_T, night);
  return { t, light, night, dusk, sunDir: DAYC.sunDir, sunC: DAYC.sunC, hemiC: DAYC.hemiC, horizon: DAYC.horizon, top: DAYC.top,
    mixH: Math.max(dusk * 0.7, night * 0.92), mixT: Math.max(dusk * 0.45, night * 0.95), sunI: 0.25 + 1.45 * light, hemiI: 0.42 + 0.22 * light };
}
let lastFit = '';
function fitScreen() {
  const ae = document.activeElement; if (ae && ae.tagName === 'INPUT' && running) return;   // teclado aberto: mantém o tamanho
  measure();
  const k = VW + 'x' + VH; if (k === lastFit) return; lastFit = k;
  renderer.setSize(VW, VH, false); camera.aspect = VW / VH; camera.updateProjectionMatrix();
  document.body.style.setProperty('--vh', VH + 'px');
}
if (window.visualViewport) visualViewport.addEventListener('resize', fitScreen);
setInterval(fitScreen, 700);
addEventListener('resize', fitScreen);
addEventListener('orientationchange', () => { fitScreen(); setTimeout(fitScreen, 300); setTimeout(fitScreen, 900); });

// ---------------------------------------------------------------- texturas procedurais
function noiseCanvas(size, fn) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), im = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const [r, gg, b] = fn(x, y); const i = (y * size + x) * 4; im.data[i] = r; im.data[i + 1] = gg; im.data[i + 2] = b; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); return c;
}
const vnoise = (() => { const P = new Float32Array(4096); for (let i = 0; i < 4096; i++) P[i] = Math.random(); const at = (x, y, w) => P[((y % w + w) % w) * 64 % 4096 + ((x % w + w) % w) % 64];
  return (x, y, f, w) => { const X = x * f, Y = y * f, xi = Math.floor(X), yi = Math.floor(Y), tx = X - xi, ty = Y - yi, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = at(xi, yi, w), b = at(xi + 1, yi, w), c = at(xi, yi + 1, w), d = at(xi + 1, yi + 1, w); return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy; }; })();
function texFrom(c, rep) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (rep) t.repeat.set(rep, rep); t.encoding = THREE.sRGBEncoding; return t; }
// detalhe do chão (cinza, multiplicado pela cor do terreno)
const DETAIL = (() => { const c = noiseCanvas(256, (x, y) => { let v = 0, a = 0.5, f = 1 / 32; for (let o = 0; o < 5; o++) { v += a * vnoise(x, y, f, 256 * f); a *= 0.5; f *= 2; } v = v * 0.8 + Math.random() * 0.2; const k = Math.round(v * 255); return [k, k, k]; });
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; })();
// pedra em blocos irregulares
function stoneCanvas(base, dark) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  g.fillStyle = dark; g.fillRect(0, 0, S, S);
  let y = 0, row = 0;
  while (y < S) { const h = 26 + Math.random() * 14; let x = row % 2 ? -20 : 0;
    while (x < S) { const w = 34 + Math.random() * 30, l = 0.8 + Math.random() * 0.35; g.fillStyle = base; g.globalAlpha = 1; g.fillRect(x + 2, y + 2, w - 4, h - 4);
      g.fillStyle = `rgba(0,0,0,${(1 - l) * 0.9})`; if (l < 1) g.fillRect(x + 2, y + 2, w - 4, h - 4); g.fillStyle = `rgba(255,255,255,${(l - 1) * 0.6})`; if (l > 1) g.fillRect(x + 2, y + 2, w - 4, h - 4);
      x += w; }
    y += h; row++; }
  const im = g.getImageData(0, 0, S, S); for (let i = 0; i < im.data.length; i += 4) { const n = (Math.random() - 0.5) * 22; im.data[i] += n; im.data[i + 1] += n; im.data[i + 2] += n; } g.putImageData(im, 0, 0);
  return c;
}
function woodCanvas(base) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.14})`; g.lineWidth = 1 + Math.random() * 2; const x = Math.random() * S; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, S / 3, x - 6, S * 2 / 3, x + 3, S); g.stroke(); }
  for (let y = 0; y < S; y += 32) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y, S, 2); }
  return c;
}
const TEX = {
  stone: texFrom(stoneCanvas('#8a847a', '#3e3a35')), sandstone: texFrom(stoneCanvas('#b89c74', '#6e5a40')), darkstone: texFrom(stoneCanvas('#5a5560', '#24222a')),
  wood: texFrom(woodCanvas('#4a3626')), plank: texFrom(woodCanvas('#5c4632')),
};
// texturas fotográficas (ambientCG, CC0) em 3d/tex
const TLOAD = new THREE.TextureLoader();
const PHOTO = {};
function photo(n, rep) {
  const k = n + (rep ? rep.join('x') : '');
  if (PHOTO[k]) return PHOTO[k];
  const t = TLOAD.load(`${window.GAME_BASE || ''}tex/${n}`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  if (rep) t.repeat.set(rep[0], rep[1]);
  return (PHOTO[k] = t);
}
const PM = (n, rep, c = 0xffffff, o = {}) => new THREE.MeshLambertMaterial({ map: photo(n, rep), color: c, ...o });
const TM = (t, rep, c = 0xffffff) => { const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(rep[0], rep[1]); return new THREE.MeshLambertMaterial({ map: tt, color: c }); };

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
// Valdora (livro I, caps. 14–15): mapa novo ao norte, fora do Reino (z < -300), ligado pela Passagem do Norte
const VCAMP = { x: -110, z: -668 }, VHILL = { x: -12, z: -735 }, VCITY = { x: 85, z: -795 };
const VGATE_R = { x: 84, z: -84 }, VGATE_V = { x: -110, z: -645 };            // passagem no Reino (Areias Rubras) e chegada em Valdora
const inVal = z => z < -300;
const TZ = 420;                                                   // andares da torre ficam fora do mapa (z ~ 420)
// Torre do Cisma: 30 andares + topo. Cada andar é um salão redondo; ao norte, uma escadaria
// sobe 7 m até o andar de cima; ao sul, a escadaria por onde se chegou desce para o de baixo.
const TOP = 30, STAIR_L = 14, STAIR_W = 2.4, STAIR_H = 7;
const FLOORS = Array.from({ length: TOP + 1 }, (_, i) => ({ i, x: -250 + (i % 10) * 100, z: TZ + 140 + Math.floor(i / 10) * 110, y: 40 + i * STAIR_H, r: i === TOP ? 34 : 18 + Math.floor(i / 10) * 2 }));
const inTower = z => z > 300;
const CASA = { i: 'casa', casa: true, x: 520, z: TZ, y: 0, r: 8 };            // interior da casa do Sítio (fora do mapa, como a Torre)
function floorAt(x, z) {
  const row = Math.round((z - TZ - 140) / 110), col = Math.round((x + 250) / 100), f = row >= 0 && col >= 0 && col < 10 ? FLOORS[row * 10 + col] : null;
  if (f && (Math.hypot(x - f.x, z - f.z) < f.r + 6 || (Math.abs(x - f.x) < STAIR_W + 1 && Math.abs(z - f.z) < f.r + STAIR_L + 3))) return f;
  if (Math.hypot(x - CASA.x, z - CASA.z) < CASA.r + 6) return CASA; return null;
}
// altura extra nas escadarias (rampa suave sob os degraus)
function stairRise(f, x, z) {
  if (f.casa || Math.abs(x - f.x) > STAIR_W + 1) return 0;
  const n = f.z - f.r + 0.5 - z, s = z - (f.z + f.r - 0.5);
  if (n > 0 && f.i < TOP) return Math.min(1, n / STAIR_L) * STAIR_H;
  if (s > 0) return -Math.min(1, s / STAIR_L) * STAIR_H;
  return 0;
}
const riverX = z => 20 + Math.sin(z * 0.08) * 4;
const FARM = { x: -176, z: 0 };   // Sítio de Solmira (vida.js)
const WHEAT = [[-42, -42, 20, 14], [-22, 22, 18, 12], [30, -38, 13, 10], [-48, 30, 12, 10]];
function dRoad(x, z) {
  let d = Math.abs(z);
  if (x < -162 || x > 200) d = 99;
  const bd = Math.abs(x - 115) + (z < 0 ? -z : z > 40 ? z - 40 : 0);
  return Math.min(d, bd);
}
function zoneOf(x, z) {
  if (inTower(z)) { const f = floorAt(x, z); return f && f.casa ? 'casa' : f && f.i === TOP ? 'topo' : 'torre'; }
  if (z < -300) { const dc = Math.hypot(x - VCITY.x, z - VCITY.z); return Math.hypot(x - VCAMP.x, z - VCAMP.z) < 18 ? 'acampamento' : dc < 40 ? 'valdora' : 'estrada'; }
  if (x > 158) return 'cidadela';
  if (Math.hypot(x - LAIR.x, z - LAIR.z) < 24) return 'lair';
  if (Math.hypot(x - FARM.x, z - FARM.z) < 22) return 'sitio';
  if (x < -62) return 'solmira';
  if (Math.hypot(x - OAS.x, z - OAS.z) < 34) return 'kharum';
  if (x >= 48) return 'areias';
  return 'campos';
}
function height(x, z) {
  if (z < -300) return typeof Valdora !== 'undefined' ? Valdora.h(x, z) : 0;
  let h = Math.sin(x * 0.05) * Math.cos(z * 0.06) * 1.6 + Math.sin(x * 0.13 + z * 0.09) * 0.6;
  const des = smooth(42, 58, x);
  h += des * (Math.sin(x * 0.07 + z * 0.035) * 1.6 + Math.cos(z * 0.11) * 0.7);
  let f = smooth(3, 10, dRoad(x, z));
  f *= smooth(36, 50, Math.hypot(x - VIL.x, z - VIL.z));
  f *= smooth(20, 30, Math.hypot(x - FARM.x, z - FARM.z));
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
const BRIDGES = [-58, 0, 56];   // pontes sobre o rio (z)
const onBridge = (x, z) => Math.abs(x - riverX(z)) < 6 && BRIDGES.some(bz => Math.abs(z - bz) < 2.6);
const groundY = (x, z) => inTower(z) ? towerY(x, z) : onBridge(x, z) ? Math.max(0.35, height(x, z)) : height(x, z);
const nearWater = (x, z) => Math.abs(x - riverX(z)) < 5 || Math.hypot(x - OAS.x, z - OAS.z) < 9.5;
function towerY(x, z) { const f = floorAt(x, z) || FLOORS[0]; return f.y + stairRise(f, x, z); }
const isWater = (x, z) => z > -300 && !inTower(z) && !onBridge(x, z) && nearWater(x, z) && height(x, z) < -0.45;

function groundColor(x, z, y, c) {
  const n = Math.sin(x * 0.9) * Math.cos(z * 0.7) * 0.03 + Math.sin(x * 0.31 + z * 0.17) * 0.03;
  const des = smooth(44, 56, x) * smooth(22, 30, Math.hypot(x - OAS.x, z - OAS.z));
  const patch = Math.sin(x * 0.045 + Math.cos(z * 0.06) * 2) * Math.cos(z * 0.05 - x * 0.02);
  c.setHSL(0.24 + n + patch * 0.025, 0.3 + patch * 0.05, 0.25 + n * 1.5 + patch * 0.03);
  if (des > 0) { const s = new THREE.Color().setHSL(0.085 + n * 0.3, 0.36, 0.5 + n * 1.5); c.lerp(s, des); }
  for (const [wx, wz, ww, wd] of WHEAT) if (x > wx && x < wx + ww && z > wz && z < wz + wd) c.setHSL(0.11, 0.42, 0.38 + n);
  const rd = dRoad(x, z);
  if (rd < 3.4) c.setHSL(0.075, 0.22, 0.32 + n);
  const vd = Math.hypot(x - VIL.x, z - VIL.z);
  if (vd < 17) { const k = (Math.floor(x * 1.2) + Math.floor(z * 1.2)) & 1; c.setHSL(0.08, 0.05, 0.34 + k * 0.03 + n); }
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

// terreno: grama/musgo de base, com terra (estrada), areia, calçamento e rocha misturados por região
function groundMix(x, z, y) {
  const n = Math.sin(x * 0.9) * Math.cos(z * 0.7) * 0.05 + Math.sin(x * 0.31 + z * 0.17) * 0.05;
  const t = [0.92 + n, 0.92 + n, 0.88 + n], w = [0, 0, 0, 0];   // tinta; pesos: estrada, areia, calçada, rocha
  const des = smooth(44, 56, x) * smooth(22, 30, Math.hypot(x - OAS.x, z - OAS.z));
  w[1] = des;
  const od = Math.hypot(x - OAS.x, z - OAS.z);
  if (od < 17 && od > 10.5) w[1] = 1;
  for (const [wx, wz, ww, wd] of WHEAT) if (x > wx && x < wx + ww && z > wz && z < wz + wd) { w[0] = 0.7; t[0] = 1.1; t[1] = 0.95; t[2] = 0.6; }
  const rd = dRoad(x, z); w[0] = Math.max(w[0], 1 - smooth(2.2, 3.8, rd));
  if (y < -0.3 && !onBridge(x, z) && nearWater(x, z)) w[0] = 1;
  const vd = Math.hypot(x - VIL.x, z - VIL.z); w[2] = 1 - smooth(14, 17.5, vd);
  const rq = smooth(150, 164, x);
  if (rq > 0) {
    w[3] = Math.max(w[3], rq); t[0] = lerp(t[0], 0.86, rq); t[1] = lerp(t[1], 0.78, rq); t[2] = lerp(t[2], 0.98, rq);
    const vein = Math.abs(Math.sin(x * 0.55 + Math.sin(z * 0.3) * 2.2) + Math.cos(z * 0.5 + Math.sin(x * 0.2)));
    if (Math.hypot(x - CIT.x, z - CIT.z) < 22 && rd > 3.4) { w[2] = Math.max(w[2], rq); }
  }
  const lair = Math.hypot(x - LAIR.x, z - LAIR.z);
  if (lair < 20) {
    const k = 1 - smooth(14, 20, lair); w[3] = Math.max(w[3], k); t[0] = lerp(t[0], 0.6, k); t[1] = lerp(t[1], 0.42, k); t[2] = lerp(t[2], 0.62, k);
    const crack = Math.abs(Math.sin(x * 0.9 + Math.sin(z * 0.4) * 2) + Math.cos(z * 0.8 + Math.sin(x * 0.3)));
  }
  if (Math.hypot(x - RUIN.x, z - RUIN.z) < 13) { w[3] = Math.max(w[3], 0.6); }
  return { t, w };
}
(function buildTerrain() {
  const geo = new THREE.PlaneGeometry(WX * 2, WZ * 2, TOUCH ? 230 : 352, TOUCH ? 94 : 144);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), wts = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = height(x, z);
    pos.setY(i, y);
    const g = groundMix(x, z, y); col.set(g.t, i * 3); wts.set(g.w, i * 4);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aW', new THREE.BufferAttribute(wts, 4));
  geo.computeVertexNormals();
  const tm = new THREE.MeshLambertMaterial({ vertexColors: true });
  const U = { tGrama: photo('grama.jpg'), tMusgo: photo('musgo.jpg'), tTerra: photo('terra.jpg'), tAreia: photo('areia.jpg'), tCalcada: photo('calcada.jpg'), tRocha: photo('rocha_clara.jpg'), detailMap: DETAIL };
  tm.onBeforeCompile = sh => {
    for (const k in U) sh.uniforms[k] = { value: U[k] };
    sh.vertexShader = 'attribute vec4 aW; varying vec4 vW; varying vec2 vWXZ;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWXZ = (modelMatrix * vec4(transformed, 1.0)).xz; vW = aW;');
    sh.fragmentShader = 'uniform sampler2D tGrama, tMusgo, tTerra, tAreia, tCalcada, tRocha, detailMap; varying vec4 vW; varying vec2 vWXZ;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec2 uv = vWXZ * 0.22;
      float nb = texture2D(detailMap, vWXZ * 0.018).r;
      vec3 c = mix(texture2D(tGrama, uv).rgb, texture2D(tMusgo, uv * 0.7).rgb, smoothstep(0.42, 0.62, nb));
      c = mix(c, texture2D(tTerra, uv * 0.9).rgb, clamp(vW.x, 0.0, 1.0));
      c = mix(c, texture2D(tAreia, uv * 0.6).rgb, clamp(vW.y, 0.0, 1.0));
      c = mix(c, texture2D(tCalcada, vWXZ * 0.16).rgb, clamp(vW.z, 0.0, 1.0));
      c = mix(c, texture2D(tRocha, uv * 0.5).rgb * 0.85, clamp(vW.w, 0.0, 1.0));
      float dA = texture2D(detailMap, vWXZ * 0.031).r;
      diffuseColor.rgb *= c * (0.8 + 0.4 * dA);`);
  };
  const t = new THREE.Mesh(geo, tm);
  t.receiveShadow = true; scene.add(t); window.TERRAIN_MAT = tm;
})();

// água
// ---------------------------------------------------------------- cordilheiras no horizonte (silhuetas na névoa)
const mountains = (() => {
  const P = [], C = [], I = [];
  const ring = (cx, cz, rx, rz, n, hBase, hVar, seed) => {
    const b = P.length / 3;
    for (let i = 0; i <= n; i++) {
      const a = i / n * TAU, x = cx + Math.cos(a) * rx, z = cz + Math.sin(a) * rz;
      const h = hBase + hVar * (0.5 + 0.5 * Math.sin(a * 7 + seed) * Math.cos(a * 3.3 + seed * 2)) + hVar * 0.45 * Math.abs(Math.sin(a * 17 + seed));
      P.push(x, -20, z, x, h, z); C.push(0.55, 0.55, 0.6, 1, 1, 1);
      if (i < n) { const k = b + i * 2; I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
  };
  ring(0, 0, WX + 70, WZ + 110, 160, 22, 38, 1.3);
  ring(0, 0, WX + 130, WZ + 170, 120, 40, 55, 4.1);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide, color: 0x7a8490 }));
  m.renderOrder = -0.5; scene.add(m); return m;
})();
// vagalumes à noite perto do jogador
const fireflies = (() => {
  const N = 60, pos = new Float32Array(N * 3), seeds = [];
  for (let i = 0; i < N; i++) seeds.push([Math.random() * 30 - 15, Math.random() * 30 - 15, Math.random() * TAU, 0.6 + Math.random() * 1.4]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(230,255,160,.8)'); gr.addColorStop(1, 'rgba(200,255,120,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: dot, color: 0xc8ff70, size: 0.32, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pts.frustumCulled = false; scene.add(pts); return { pts, seeds, pos };
})();
function updateFireflies(dt, k) {
  const zoneOk = P.x < 44 && !inTower(P.z);
  fireflies.pts.material.opacity = zoneOk ? k * (0.6 + 0.4 * Math.sin(time * 3)) : 0;
  if (!zoneOk || k <= 0.02) return;
  fireflies.seeds.forEach(([ox, oz, ph, sp], i) => {
    const x = P.x + ox + Math.sin(time * 0.4 * sp + ph) * 2, z = P.z + oz + Math.cos(time * 0.33 * sp + ph) * 2;
    const fp = fireflies.pos; fp[i * 3] = x; fp[i * 3 + 1] = groundY(x, z) + 0.6 + Math.sin(time * sp + ph) * 0.5; fp[i * 3 + 2] = z;
  });
  fireflies.pts.geometry.attributes.position.needsUpdate = true;
}
// água: mapa de normais de ondas (gerado) que desliza, com brilho do sol
const WAVES = (() => {
  const N = 256, h = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let v = 0, a = 1, f = 1 / 32; for (let o = 0; o < 4; o++) { v += a * vnoise(x, y, f, N * f); a *= 0.5; f *= 2; } h[y * N + x] = v; }
  const c = noiseCanvas(N, (x, y) => { const at = (i, j) => h[((j + N) % N) * N + (i + N) % N]; const dx = (at(x + 1, y) - at(x - 1, y)) * 3, dy = (at(x, y + 1) - at(x, y - 1)) * 3, l = Math.hypot(dx, dy, 1);
    return [Math.round((-dx / l * 0.5 + 0.5) * 255), Math.round((-dy / l * 0.5 + 0.5) * 255), Math.round((1 / l * 0.5 + 0.5) * 255)]; });
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t;
})();
const waterMat = new THREE.MeshPhongMaterial({ color: 0x34565f, specular: 0x5a6a70, shininess: 40, transparent: true, opacity: 0.88, normalMap: WAVES, normalScale: new THREE.Vector2(0.35, 0.35) });
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
  const MD = PM('madeira.jpg', [3, 1], 0x8a7058), MT = PM('madeira.jpg', [0.2, 1], 0x6a5040), MR = PM('madeira.jpg', [3, 0.1], 0x6a5040), MP = PM('madeira.jpg', [0.1, 0.5], 0x6a5040);
  for (const bz of BRIDGES) {
    const bx = riverX(bz);
    mesh(new THREE.BoxGeometry(12, 0.3, 5), MD, bx, 0.2, bz);
    for (let i = -5; i <= 5; i += 1.2) mesh(new THREE.BoxGeometry(0.15, 0.32, 5.02), MT, bx + i, 0.21, bz);
    [-2.5, 2.5].forEach(z => { mesh(new THREE.BoxGeometry(12, 0.15, 0.15), MR, bx, 1.1, bz + z); for (let i = -6; i <= 6; i += 2) mesh(new THREE.BoxGeometry(0.2, 1, 0.2), MP, bx + i, 0.6, bz + z); });
  }
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
  if (inTower(z)) { const f = floorAt(x, z); if (!f || (Math.hypot(x - f.x, z - f.z) > f.r - 1 - r && !(typeof Tower !== 'undefined' && Tower.corridor(f, x, z, r)))) return true; const l = OB.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)); if (l) for (const o of l) if (Math.hypot(x - o.x, z - o.z) < o.r + r) return true; return false; }
  if (z < -300) { if (typeof Valdora === 'undefined' || Valdora.out(x, z, r)) return true; }
  else if (Math.abs(x) > WX - 4 || Math.abs(z) > WZ - 4) return true;
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
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;   // as cópias se espalham pelo mapa: a esfera da malha não serve para cortar
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
  if (Math.hypot(x - FARM.x, z - FARM.z) < 24) continue;
  if (WHEAT.some(([wx, wz, ww, wd]) => x > wx - 2 && x < wx + ww + 2 && z > wz - 2 && z < wz + wd + 2)) continue;
  if (!freeSpot(x, z, 6)) continue;
  trees.push({ x, z, s: rr(0.8, 1.4) });
}
trees.forEach(t => addOb(t.x, t.z, 0.7));
for (let i = 0; i < 1500 && cacti.length < 70; i++) {
  const x = rr(56, WX - 5), z = rr(-WZ + 5, WZ - 5);
  if (x > 150 || Math.hypot(x - OAS.x, z - OAS.z) < 36 || Math.hypot(x - RUIN.x, z - RUIN.z) < 18 || !freeSpot(x, z)) continue;
  cacti.push({ x, z, s: rr(0.8, 1.3), r: rr(0, TAU) });   // capim seco: dá para atravessar
}
for (let i = 0; i < 1500 && rocks.length < 90; i++) {
  const x = rr(-60, WX - 5), z = rr(-WZ + 5, WZ - 5);
  if (Math.hypot(x - OAS.x, z - OAS.z) < 34 || Math.hypot(x - CIT.x, z - CIT.z) < 30 || !freeSpot(x, z)) continue;
  const s = rr(0.5, x > 50 ? 1.8 : 1); rocks.push({ x, z, s }); addOb(x, z, s * 0.8);
}
for (let a = 0; a < TAU; a += TAU / 14) palms.push({ x: OAS.x + Math.cos(a) * 11.5, z: OAS.z + Math.sin(a) * 11.5, s: rr(0.9, 1.2), lean: rr(-0.2, 0.2) });
for (let i = 0; i < 12; i++) { const x = rr(60, 140), z = rr(-80, 80); if (freeSpot(x, z) && Math.hypot(x - OAS.x, z - OAS.z) > 36) palms.push({ x, z, s: rr(0.9, 1.2), lean: rr(-0.25, 0.25) }); }
palms.forEach(p => addOb(p.x, p.z, 0.5));

// árvores de cartões (como nos MMOs clássicos): tronco com casca real + galhos e folhas fotográficos
const FOLIAGE = [];
const isPine = o => (Math.sin(o.x * 12.9898 + o.z * 78.233) * 43758.5453 % 1 + 1) % 1 < 0.6;
function cardGeo(quads) {
  // cada quad: [cx, cy, cz, yaw, pitch, w, h, ox, vertical]; u vai de ox a ox+w; normais para cima (luz uniforme, como folhagem de MMO)
  const P = [], U = [], N = [], I = [];
  quads.forEach(([cx, cy, cz, yaw, pitch, w, h, ox = 0, vert = false], k) => {
    const ca = Math.cos(-pitch), sa = Math.sin(-pitch), cy_ = Math.cos(yaw), sy = Math.sin(yaw);
    for (const [u, v] of [[ox, -h / 2], [ox + w, -h / 2], [ox + w, h / 2], [ox, h / 2]]) {
      let x = u, y = vert ? v : 0, z = vert ? 0 : v;
      const x1 = x * ca - y * sa, y1 = x * sa + y * ca;
      P.push(cx + x1 * cy_ + z * sy, cy + y1, cz - x1 * sy + z * cy_);
    }
    U.push(0, 0, 1, 0, 1, 1, 0, 1); for (let i = 0; i < 4; i++) N.push(0, 1, 0);
    const b = k * 4; I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
  g.computeBoundingSphere(); return g;
}
// pinheiro: camadas de galhos saindo do tronco, inclinados para baixo; topo em cruz
const pineQuads = [];
for (let L = 0; L < 10; L++) {
  const y = 1.5 + L * 0.7, len = 3.3 - L * 0.29, n = 10 - Math.floor(L / 2);
  for (let k = 0; k < n; k++) { const yaw = k / n * TAU + L * 0.9; pineQuads.push([0, y, 0, yaw, 0.32 + L * 0.03, len, len * 1.0, -0.1]); }
}
pineQuads.push([0, 8.4, 0, 0, Math.PI / 2, 2.2, 1.3, -0.6], [0, 8.4, 0, Math.PI / 2, Math.PI / 2, 2.2, 1.3, -0.6]);   // ponta: galhos em pé
const PINE_G = cardGeo(pineQuads);
// silhueta inteira em cartões em pé (dá volume ao pinheiro visto de longe)
const PINE_SIL = cardGeo([0, 1, 2].map(k => [0, 4.9, 0, k * Math.PI / 3, 0, 5.4, 9.2, -2.7, true]));
PINE_SIL.attributes.uv.array.forEach((v, i, arr) => { if (i % 2 === 0) { } });
{ const uv = PINE_SIL.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i)); }
// árvore de folhas: cachos de cartões em volta da copa
const leafQuads = [];
for (let k = 0; k < 14; k++) { const yaw = k * 2.39, r = 0.6 + (k % 3) * 0.5, y = 3.6 + Math.sin(k * 1.7) * 1.0; leafQuads.push([Math.cos(yaw) * r, y, Math.sin(yaw) * r, yaw, (k % 2 ? 0.3 : -0.25), 2.8, 2.8, -1.4, k % 3 !== 0]); }
const LEAF_G = cardGeo(leafQuads);
// folhagem dos dois lados recebe a mesma luz (normal sempre para cima, sem inverter no verso)
const upNormals = m => { m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0; vec3 normal = normalize( vNormal ); vec3 geometryNormal = normal;'); }; return m; };
const cardMat = (n) => upNormals(new THREE.MeshLambertMaterial({ map: photo(n), alphaTest: 0.45, side: THREE.DoubleSide, emissive: 0x0c120a }));
const pineMat = cardMat('pinheiro.png'), leafMat = cardMat('folhas.png');
instanced(new THREE.CylinderGeometry(0.16, 0.32, 1, 7), PM('casca.jpg', [1, 3]), trees, (o, p, q, s, c) => { const pine = isPine(o), h = pine ? 8.0 : 3.6; p.set(o.x, height(o.x, o.z) + h * o.s / 2, o.z); s.set(o.s, h * o.s, o.s); c.setHSL(0.08, 0.1, pine ? 0.55 : 0.7); });
FOLIAGE.push(instanced(PINE_G, pineMat, trees, (o, p, q, s, c) => { const pine = isPine(o); p.set(o.x, height(o.x, o.z), o.z); s.setScalar(pine ? o.s : 0); q.setFromEuler(new THREE.Euler(0, o.x * 3.1, 0)); c.setHSL(0.28, 0.2, 0.78 + Math.sin(o.z * 1.3) * 0.08); }));
const pineSilMat = cardMat('pinheiro_silhueta.png');
FOLIAGE.push(instanced(PINE_SIL, pineSilMat, trees, (o, p, q, s, c) => { const pine = isPine(o); p.set(o.x, height(o.x, o.z), o.z); s.setScalar(pine ? o.s : 0); q.setFromEuler(new THREE.Euler(0, o.z * 1.7, 0)); c.setHSL(0.28, 0.2, 0.8 + Math.sin(o.x * 1.1) * 0.08); }));
FOLIAGE.push(instanced(LEAF_G, leafMat, trees, (o, p, q, s, c) => { const pine = isPine(o); p.set(o.x, height(o.x, o.z), o.z); s.setScalar(pine ? 0 : o.s * 1.1); q.setFromEuler(new THREE.Euler(0, o.z * 2.3, 0)); c.setHSL(0.2 + Math.sin(o.x) * 0.03, 0.3, 0.8 + Math.sin(o.z * 2) * 0.06); }));
const treeIM = scene.children.filter(o => o.isInstancedMesh && o.count === trees.length);
const treeOrig = treeIM.map(im => trees.map((t, i) => { const m4 = new THREE.Matrix4(); im.getMatrixAt(i, m4); return m4; }));
const treeCol = treeIM.map(im => trees.map((t, i) => { const c = new THREE.Color(); im.getColorAt(i, c); return c; }));
// só desenha as cópias que existem (escala ≠ 0) e, do pinheiro detalhado, só as perto; longe fica a silhueta
const treeUse = treeIM.map((im, n) => trees.map((_, i) => i).filter(i => treeOrig[n][i].elements[0] !== 0 || treeOrig[n][i].elements[5] !== 0));
const TREE_R = TOUCH ? 75 : 120;
let treeRef = { x: 1e9, z: 1e9 };
function refreshTrees(force) {
  if (!force && Math.hypot(P.x - treeRef.x, P.z - treeRef.z) < 5) return;
  treeRef = { x: P.x, z: P.z };
  treeIM.forEach((im, n) => {
    const cut = im.material === pineMat; let k = 0;
    for (const i of treeUse[n]) {
      if (treeHidden.has(i)) continue;
      if (cut) { const t = trees[i]; if (Math.hypot(t.x - P.x, t.z - P.z) > TREE_R) continue; }
      im.setMatrixAt(k, treeOrig[n][i]); im.setColorAt(k, treeCol[n][i]); k++;
    }
    im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
}
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
  let dirty = now.size !== treeHidden.size;
  if (!dirty) for (const ti of now) if (!treeHidden.has(ti)) { dirty = true; break; }
  treeHidden = now;
  refreshTrees(dirty);
}
window.rockList = rocks; window.rockIM = instanced(new THREE.DodecahedronGeometry(0.8, 1), PM('rocha_clara.jpg', [1, 1]), rocks, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + o.s * 0.3, o.z); s.set(o.s * 1.2, o.s * 0.8, o.s); q.setFromEuler(new THREE.Euler(o.x, o.z, 0)); c.setHSL(0.08, 0.15, o.x > 50 ? 0.62 : 0.5); });
// deserto: moitas de capim seco fotográfico (no lugar dos cactos)
instanced(cardGeo([0, 1, 2].map(k => [0, 0.7, 0, k * Math.PI / 3, 0, 2.0, 1.5, -1.0, true])), cardMat('capim_seco.png'), cacti, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z), o.z); s.setScalar(o.s); q.setFromEuler(new THREE.Euler(0, o.r, 0)); c.setHSL(0.1, 0.25, 0.85); });
// trigo
{
  const stalks = [];
  for (const [wx, wz, ww, wd] of WHEAT) for (let x = wx; x < wx + ww; x += 0.7) for (let z = wz; z < wz + wd; z += 0.7) stalks.push({ x: x + rr(0, 0.5), z: z + rr(0, 0.5), h: rr(0.8, 1.2) });
  window.WHEAT_STALKS = stalks;
}
// grama que balança e flores
const windU = { value: 0 };
{
  // trigo: tufos de espigas (textura desenhada) que ondulam com o vento, em ondas que correm pelo campo
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  let sd = 7; const rn = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 16; k++) {
    const x0 = 10 + rn() * 108, top = 20 + rn() * 70, lean = (rn() - 0.5) * 22, hue = 38 + rn() * 10, li = 48 + rn() * 18;
    g.strokeStyle = `hsl(${hue},45%,${li - 10}%)`; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x0, 256); g.quadraticCurveTo(x0 + lean * 0.3, 160, x0 + lean, top + 40); g.stroke();
    for (let j = 0; j < 9; j++) {                       // grãos da espiga
      const t = j / 9, ex = x0 + lean + Math.sin(j * 2.1) * 0.5, ey = top + 40 - t * 44;
      g.fillStyle = `hsl(${hue},${60 + rn() * 15}%,${li + rn() * 10}%)`;
      g.beginPath(); g.ellipse(ex + (j % 2 ? 3 : -3), ey, 2.6, 5, (j % 2 ? 0.5 : -0.5), 0, TAU); g.fill();
    }
    g.strokeStyle = `hsla(${hue},50%,75%,.6)`; g.lineWidth = 0.8;   // pragana
    for (let j = 0; j < 5; j++) { const ey = top + 36 - j * 9, ex = x0 + lean; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + (j % 2 ? 7 : -7), ey - 14); g.stroke(); }
  }
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const wm = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.35, side: THREE.DoubleSide });
  wm.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0; vec3 normal = normalize( vNormal ); vec3 geometryNormal = normal;');
    sh.uniforms.uTime = windU;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      'vec3 transformed = position; float wx = instanceMatrix[3].x, wz = instanceMatrix[3].z; float gust = sin(uTime * 1.3 - wx * 0.22 - wz * 0.12) * 0.5 + 0.5; float h = max(position.y, 0.0); float sw = (0.12 + 0.35 * gust) * h * h + sin(uTime * 3.1 + wx * 1.7 + wz * 1.3) * 0.04 * h; transformed.x += sw; transformed.z += sw * 0.4; transformed.y -= sw * sw * 0.3;');
  };
  const wg = cardGeo([0, 1, 2].map(k => [0, 0.6, 0, k * Math.PI / 3, 0, 1.2, 1.2, -0.6, true]));
  const clumps = window.WHEAT_STALKS.filter((_, i) => i % 2 === 0);
  window.wheat = instanced(wg, wm, clumps, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z), o.z); s.set(1, o.h, 1); q.setFromEuler(new THREE.Euler(0, o.x * 2.3 + o.z, 0)); c.setHSL(0.11, 0.3, 0.9 + rr(-0.08, 0.06)); });
  window.wheat.castShadow = false;
}
{
  const grassOk = (x, z) => x < 44 && dRoad(x, z) > 3.8 && Math.hypot(x - VIL.x, z - VIL.z) > 18 && Math.hypot(x - LAIR.x, z - LAIR.z) > 21 &&
    !isWater(x, z) && Math.abs(x - riverX(z)) > 5.5 && !WHEAT.some(([wx, wz, ww, wd]) => x > wx && x < wx + ww && z > wz && z < wz + wd) && Math.abs(x) < WX - 6 && Math.abs(z) < WZ - 6;
  const gg = cardGeo([[0, 0.45, 0, 0, 0, 1.3, 0.9, -0.65, true], [0, 0.45, 0, Math.PI / 2, 0, 1.3, 0.9, -0.65, true], [0, 0.45, 0, Math.PI / 4, 0, 1.3, 0.9, -0.65, true]]);
  const gm = new THREE.MeshLambertMaterial({ map: photo('capim.png'), alphaTest: 0.4, side: THREE.DoubleSide });
  gm.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0; vec3 normal = normalize( vNormal ); vec3 geometryNormal = normal;');
    sh.uniforms.uTime = windU;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      'vec3 transformed = position; float ph = instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.27; transformed.x += sin(uTime * 2.2 + ph) * position.y * 0.25; transformed.z += cos(uTime * 1.7 + ph) * position.y * 0.15;');
  };
  const N = TOUCH ? 2200 : 9000, list = [];
  for (let i = 0; i < N * 3 && list.length < N; i++) { const x = rr(-WX + 6, 44), z = rr(-WZ + 6, WZ - 6); if (grassOk(x, z)) list.push({ x, z, s: rr(0.45, 0.85), r: rr(0, TAU) }); }
  const grass = instanced(gg, gm, list, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z), o.z); s.set(o.s, o.s * rr(0.8, 1.3), o.s); q.setFromEuler(new THREE.Euler(0, o.r, 0)); c.setHSL(0.2 + rr(0, 0.05), 0.2, 0.85 + rr(-0.08, 0.08)); });
  grass.castShadow = false; window.grassIM = grass;
  const fl = [];
  for (let i = 0; i < 6000 && fl.length < (TOUCH ? 260 : 600); i++) { const x = rr(-WX + 6, 44), z = rr(-WZ + 6, WZ - 6); if (grassOk(x, z)) fl.push({ x, z }); }
  const FLC = [0xcfc8b8, 0xb89a48, 0x8a6a8a, 0xa8503a];
  const fm = instanced(new THREE.IcosahedronGeometry(0.09, 0), new THREE.MeshLambertMaterial(), fl, (o, p, q, s, c) => { p.set(o.x, height(o.x, o.z) + 0.38, o.z); s.set(1, 0.6, 1); c.set(FLC[Math.floor(rr(0, FLC.length))]); });
  fm.castShadow = false;
}

// palmeiras: tronco com casca e folhas em cartões (horizontais, caídas)
const PALM_G = cardGeo(Array.from({ length: 9 }, (_, i) => [0, 0, 0, i * TAU / 9 + (i % 2) * 0.2, 0.25 + (i % 3) * 0.12, 3.4, 1.0, 0.0]));
const palmMat = cardMat('palmeira.png');
for (const p of palms) {
  const g = new THREE.Group(); g.position.set(p.x, height(p.x, p.z), p.z); g.scale.setScalar(p.s); scene.add(g);
  const trunk = mesh(new THREE.CylinderGeometry(0.14, 0.26, 4.6, 8), PM('casca.jpg', [1, 3], 0xb0a088), 0, 2.25, 0, g); trunk.rotation.z = p.lean;
  const top = new THREE.Mesh(PALM_G, palmMat); top.position.set(-Math.sin(p.lean) * 4.5, 4.45, 0); top.castShadow = true; g.add(top);
}

// ---------------------------------------------------------------- construções
const smokes = [];
function house(x, z, rot, w, d, roofC, style) {
  const g = new THREE.Group(); g.position.set(x, groundY(x, z), z); g.rotation.y = rot; scene.add(g);
  if (style === 'sand') {
    mesh(new THREE.BoxGeometry(w, 3.2, d), PM('pedra.jpg', [w / 2, 1.6], 0xd8b890), 0, 1.6, 0, g);
    const adobe = PM('reboco.jpg', [1, 0.5], 0xc8a478);
    mesh(new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3), adobe, 0, 3.3, 0, g);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), adobe, a * (w / 2), 3.7, b * (d / 2), g));   // ameias
    for (let k = -2; k <= 2; k++) { const v = mesh(new THREE.CylinderGeometry(0.1, 0.1, d + 1.0, 6), PM('madeira.jpg', [0.2, 1], 0x6a5040), k * w / 5.5, 2.9, 0, g); v.rotation.x = Math.PI / 2; }   // vigas salientes
    if (roofC) mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.32, 20, 10, 0, TAU, 0, Math.PI / 2), PM('reboco.jpg', [2, 1], new THREE.Color(roofC).lerp(new THREE.Color(0xd8c8b0), 0.6).getHex()), 0, 3.4, 0, g);
    const door = mesh(new THREE.BoxGeometry(1.1, 1.8, 0.1), M(0x5a3a1a), 0, 0.9, d / 2 + 0.03, g, false);
    [-w / 2 + 1, w / 2 - 1].forEach(wx => mesh(new THREE.BoxGeometry(0.6, 0.8, 0.1), M(0x2a3a5a), wx, 2, d / 2 + 0.03, g, false));
  } else if (style === 'tent') {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4), M(0x6b4a2a), a * w / 2, 1.2, b * d / 2, g));
    const roof = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.3, 1.2, 4), M(roofC), 0, 2.9, 0, g); roof.rotation.y = Math.PI / 4;
    mesh(new THREE.BoxGeometry(w - 0.4, 0.8, 1), M(0xd9c39a), 0, 0.4, d / 2 - 0.6, g);
    ['#8a4a3a', '#a08040', '#5a6a40', '#9a6a3a'].forEach((c, i) => mesh(new THREE.SphereGeometry(0.2, 6, 5), M(c), -w / 2 + 0.8 + i * (w - 1.6) / 3, 0.95, d / 2 - 0.6, g));
  } else {
    mesh(new THREE.BoxGeometry(w, 1.3, d), PM('pedra.jpg', [w / 2, 0.65], 0xa8a090), 0, 0.65, 0, g);                       // base de pedra
    mesh(new THREE.BoxGeometry(w - 0.1, 1.6, d - 0.1), PM('reboco.jpg', [1, 0.4], 0xb8ab94), 0, 2.1, 0, g);         // reboco
    const beam = PM('madeira.jpg', [0.25, 1], 0x6a5040);
    [-1, 1].forEach(a => [-1, 1].forEach(b => mesh(new THREE.BoxGeometry(0.28, 2.9, 0.28), beam, a * w / 2, 1.45, b * d / 2, g)));
    [-1, 1].forEach(b => { mesh(new THREE.BoxGeometry(w + 0.1, 0.22, 0.22), beam, 0, 1.35, b * d / 2, g); mesh(new THREE.BoxGeometry(w + 0.1, 0.22, 0.22), beam, 0, 2.85, b * d / 2, g); });
    [-1, 1].forEach(a => { const x = mesh(new THREE.BoxGeometry(0.16, 1.9, 0.16), beam, a * w / 4, 2.1, d / 2 + 0.02, g); x.rotation.z = a * 0.6; });
    const thatch = (Math.round(x * 7 + z) & 1) === 0;
    const roof = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.7, 2.6, 4), PM(thatch ? 'palha.jpg' : 'telha.jpg', thatch ? [3, 1.5] : [4, 2], thatch ? 0xb0a080 : new THREE.Color(roofC).lerp(new THREE.Color(0xffffff), 0.55).multiplyScalar(1.5).getHex()), 0, 4.1, 0, g); roof.rotation.y = Math.PI / 4;
    mesh(new THREE.BoxGeometry(0.7, 1.9, 0.7), PM('pedra.jpg', [0.4, 1], 0x9a9284), w / 4, 4.4, -d / 5, g);
    smokes.push(new THREE.Vector3(x, 0, z).add(new THREE.Vector3(w / 4, 5, -d / 5).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot)).setY(groundY(x, z) + 5.1));
    mesh(new THREE.BoxGeometry(1.1, 2.0, 0.12), PM('madeira.jpg', [0.5, 1], 0x7a5a40), 0, 1.0, d / 2 + 0.05, g, false);
    [-w / 2 + 1.1, w / 2 - 1.1].forEach(wx => { mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), new THREE.MeshBasicMaterial({ color: 0x3a2a14 }), wx, 2.1, d / 2 + 0.04, g, false); mesh(new THREE.BoxGeometry(0.95, 0.12, 0.2), beam, wx, 1.66, d / 2 + 0.1, g, false); });
  }
  addOb(x, z, Math.max(w, d) / 2 + 0.3);
  return g;
}
// Vila de Solmira
[[-125, -22, '#7a5546'], [-105, -30, '#5a5e64'], [-84, -24, '#6e5a44'], [-127, 22, '#4e545a'], [-104, 30, '#7a5a40'], [-84, 22, '#5e5048'], [-135, -6, '#585e5e']]
  .forEach(([x, z, c]) => house(x, z, Math.atan2(VIL.x - x, VIL.z - z), 5, 4.5, c, 'wood'));
// chafariz
const fountain = new THREE.Group(); fountain.position.set(VIL.x, 0, VIL.z); scene.add(fountain);
mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.7, 24), PM('pedra.jpg', [8, 0.5], 0xb0a898), 0, 0.35, 0, fountain);
mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.1, 24), waterMat, 0, 0.66, 0, fountain, false);
mesh(new THREE.CylinderGeometry(0.4, 0.5, 2.2, 10), TM(TEX.stone, [1, 1]), 0, 1.4, 0, fountain);
mesh(new THREE.CylinderGeometry(1.2, 0.8, 0.35, 16), TM(TEX.stone, [3, 0.3]), 0, 2.5, 0, fountain);
addOb(VIL.x, VIL.z, 3.4);
// Oásis de Kharum
[[100, 48, '#6a7a80'], [118, 77, '#8a5a44'], [141, 64, '#6a7058'], [142, 42, '#9a7a4a'], [100, 68, null]]
  .forEach(([x, z, c]) => house(x, z, Math.atan2(OAS.x - x, OAS.z - z), 6, 5, c, 'sand'));
[[106, 32, '#7a3a2e'], [124, 31, '#3e4e5a'], [131, 34, '#5a4a3a']].forEach(([x, z, c]) => house(x, z, 0, 3.2, 2.4, c, 'tent'));
// ruínas do Guardião
for (let i = 0; i < 9; i++) {
  const a = i * TAU / 9, x = RUIN.x + Math.cos(a) * 12, z = RUIN.z + Math.sin(a) * 12, h = rr(2, 6);
  mesh(new THREE.CylinderGeometry(0.7, 0.8, h, 10), PM('rocha_clara.jpg', [1, h / 2], 0xc8a888), x, height(x, z) + h / 2, z);
  if (h > 4) mesh(new THREE.BoxGeometry(2, 0.5, 2), M(0x8a5a32), x, height(x, z) + h + 0.25, z);
  addOb(x, z, 0.9);
}
// nuvens
const clouds = [];
for (let i = 0; i < 0; i++) {
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
  pompom:    { name: 'Larva da Essência', lv: 1, hp: 40, atk: 5, def: 0, xp: 9, zeny: [2, 6], speed: 1.6, aggro: 0, respawn: 8, drops: [['red', 0.18]] },
  zunzum:    { name: 'Eco Faminto', lv: 3, hp: 60, atk: 8, def: 1, xp: 16, zeny: [4, 10], speed: 2.8, aggro: 7, respawn: 10, drops: [['red', 0.2], ['blue', 0.05]] },
  fungolino: { name: 'Raiz Rastejante', lv: 5, hp: 110, atk: 12, def: 3, xp: 30, zeny: [6, 15], speed: 1.4, aggro: 0, respawn: 12, drops: [['red', 0.25], ['blue', 0.08]] },
  besouro:   { name: 'Larva Cristalina', lv: 9, hp: 200, atk: 19, def: 6, xp: 60, zeny: [12, 28], speed: 2.2, aggro: 8, respawn: 12, drops: [['red', 0.3], ['blue', 0.1]] },
  serpe:     { name: 'Sombra Errante', lv: 12, hp: 300, atk: 26, def: 8, xp: 95, zeny: [18, 40], speed: 2.6, aggro: 9, respawn: 14, drops: [['red', 0.3], ['blue', 0.15]] },
  kravenox:  { name: 'Kravenox', lv: 60, hp: 300000, atk: 140, def: 42, xp: 90000, zeny: [8000, 12000], speed: 3.4, aggro: 40, rad: 5, respawn: 1e9, boss: true, world: true, drops: [['blue', 1], ['blue', 1], ['blue', 1], ['red', 1], ['red', 1], ['red', 1]] },
  larva:     { name: 'Larva Alongada', lv: 14, hp: 520, atk: 34, def: 10, xp: 180, zeny: [20, 45], speed: 2.4, aggro: 13, respawn: 1e9, drops: [['red', 0.4], ['blue', 0.15]] },
  verme:     { name: 'Larva Encouraçada', lv: 16, hp: 640, atk: 40, def: 12, xp: 230, zeny: [25, 55], speed: 2.0, aggro: 12, respawn: 1e9, drops: [['red', 0.4], ['blue', 0.2]] },
  esfera:    { name: 'Fragmento Errante', lv: 17, hp: 560, atk: 44, def: 16, xp: 260, zeny: [30, 60], speed: 3.0, aggro: 15, respawn: 1e9, drops: [['blue', 0.3]] },
  sentinela: { name: 'Sentinela do Vazio', lv: 19, hp: 1000, atk: 52, def: 20, xp: 380, zeny: [40, 90], speed: 2.6, aggro: 16, respawn: 1e9, drops: [['red', 0.5], ['blue', 0.3]] },
  // Valdora: Raízes Negras na estrada, Ecos das Cinzas, Larvas das Cinzas, Sentinelas do Vazio nas muralhas
  raizNegra: { name: 'Raiz Negra', lv: 24, hp: 2000, atk: 72, def: 22, xp: 900, zeny: [60, 120], speed: 1.8, aggro: 10, respawn: 20, drops: [['red', 0.4], ['blue', 0.2]] },
  ecoCinza:  { name: 'Eco das Cinzas', lv: 26, hp: 2100, atk: 84, def: 18, xp: 1050, zeny: [70, 140], speed: 3.0, aggro: 14, respawn: 20, drops: [['red', 0.4], ['blue', 0.25]] },
  larvaCinza: { name: 'Larva das Cinzas', lv: 28, hp: 2800, atk: 90, def: 26, xp: 1300, zeny: [80, 160], speed: 2.4, aggro: 12, respawn: 22, drops: [['red', 0.45], ['blue', 0.25]] },
  sentinelaMuralha: { name: 'Sentinela da Muralha', lv: 32, hp: 3800, atk: 112, def: 34, xp: 2000, zeny: [120, 240], speed: 2.8, aggro: 16, respawn: 25, drops: [['red', 0.5], ['blue', 0.35]] },
  carrasco:  { name: 'Carrasco de Valdora', lv: 36, hp: 60000, atk: 150, def: 40, xp: 22000, zeny: [3000, 4500], speed: 2.6, aggro: 18, respawn: 300, boss: true, mini: true, drops: [['blue', 1], ['red', 1], ['red', 1], ['essencia', 1]] },
  guardiao:  { name: 'Sentinela sem Rosto', lv: 22, hp: 14000, atk: 64, def: 24, xp: 2600, zeny: [600, 900], speed: 2.4, aggro: 16, respawn: 180, boss: true, mini: true, drops: [['blue', 1], ['red', 1], ['red', 1]] },
};
const ITEMS = { red: { name: 'Poção Vermelha', price: 25 }, blue: { name: 'Poção Azul', price: 90 } };

function mobModel(type) {
  const g = new THREE.Group(), mats = [];
  const mt = c => { const m = new THREE.MeshLambertMaterial({ color: c }); mats.push(m); return m; };
  const ms = c => { const m = new THREE.MeshToonMaterial({ color: c }); mats.push(m); return m; };
  const r = { g, mats };
  if (typeof Modelos3D !== 'undefined' && Modelos3D.has(type)) return Modelos3D.mob(type, r);   // monstros 3D do jogo de plataforma
  if (typeof SpriteKit !== 'undefined' && SpriteKit.ready && SPR_MOBS[type]) return spriteMob(type, r);
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
// arte dos inimigos do RPG Kravenox (inimigos do livro)
const SPR_MOBS = {
  pompom:    { img: 'e_larva', h: 1.25 },
  zunzum:    { img: 'e_eco', h: 1.9, float: true },
  fungolino: { img: 'e_raizRast', h: 1.9 },
  besouro:   { img: 'e_larvaCristal', h: 1.5 },
  serpe:     { img: 'e_sombra', h: 2.1, float: true },
  guardiao:  { img: 'e_semRosto', h: 5.2 },
  larva:     { img: 'e_larvaLonga', h: 1.7 },
  verme:     { img: 'e_larvaArmor', h: 1.9 },
  esfera:    { img: 'e_fragmento', h: 2.0, float: true },
  sentinela: { img: 'e_sentinela', h: 2.8 },
  kravenox:  { set: { kind: 'hero', base: 'k' }, px: 22 / 34 },        // o próprio Kravenox, gigante
  raizNegra: { img: 'e_raizRast', h: 2.4 }, ecoCinza: { img: 'e_eco', h: 2.2, float: true }, larvaCinza: { img: 'e_larvaLonga', h: 2.0 },
  sentinelaMuralha: { img: 'e_sentinela', h: 3.0 }, carrasco: { img: 'e_semRosto', h: 5.6 },
};
function spriteMob(type, r) {
  const d = SPR_MOBS[type];
  const a = SpriteKit.actor(d.set || { kind: 'one', img: d.img }, { h: d.h, px: d.px, float: d.float });
  r.g.add(a.root); r.spr = a; r.h = a.h + (d.float ? 0.5 : 0); r.mats = []; r.lt = 0;
  r.anim = (m, t) => {
    const dt = Math.min(0.1, r.lt ? t - r.lt : 0); r.lt = t;
    a.update(dt, { face: m.face, moving: m.moving, atk: m.swing || 0, flash: m.flash > 0, fury: m.enraged, beam: m.beam, sleeping: m.sleeping });
  };
  return r;
}
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
  { id: 'smith', name: 'Ferreiro Doran', x: VIL.x - 12, z: VIL.z - 8, look: [0x4a3a2a, 0x2a1a0a, 'cap'] },
  { id: 'warp', city: 'solmira', name: 'Guia de Viagem Lúcio', x: VIL.x - 6, z: VIL.z + 10, look: [0x3a5a8a, 0x2a1a0a, 'cap'] },
  { id: 'warp', city: 'kharum', name: 'Guia de Viagem Nadira', x: OAS.x - 15, z: OAS.z - 17, look: [0xb5651d, 0x1a1a1a, 'veil'] },
  { id: 'warp', city: 'cidadela', name: 'Guia de Viagem Bram', x: CIT.x - 7, z: CIT.z - 4, look: [0x3a3442, 0x1a1a1a, 'helm'] },
  { id: 'elder', name: 'Anciã Zahra', x: OAS.x + 14, z: OAS.z - 14, look: [0x6c3483, 0xe0e0e0, 'veil'] },
  // Acampamento dos refugiados de Valdora
  { id: 'refugee', name: 'Arlen, o Refugiado', x: VCAMP.x + 5, z: VCAMP.z - 4, look: [0x5a4a3a, 0x2a1a0a, 'cap'] },
  { id: 'healer', name: 'Curandeira Wenna', x: VCAMP.x - 7, z: VCAMP.z + 1, look: [0xd8d0c0, 0x6a4a2a, 'veil'] },
  { id: 'shop', name: 'Mascate Iara', x: VCAMP.x + 7, z: VCAMP.z + 5, look: [0x8a5a2a, 0x2a1a0a, 'veil'] },
  { id: 'warp', city: 'acampamento', name: 'Guia de Viagem Tessa', x: VCAMP.x - 3, z: VCAMP.z + 8, look: [0x3a4a5a, 0x1a1a1a, 'cap'] },
];
const NPC_SPR = { 'Mestra Odete': 'ancia', 'Irmã Celina': 'senhora', 'Mercador Bento': 'mascate', 'Guarda Tobias': 'aldeao', 'Curandeira Samira': 'aldea', 'Mercador Farid': 'mascate', 'Vigia Morvan': 'estranho', 'Curandeira Ilsa': 'refugiada', 'Mercador Dravo': 'refugiado', 'Anciã Zahra': 'velha', 'Ferreiro Doran': 'refugiado', 'Guia de Viagem Lúcio': 'aldeao', 'Guia de Viagem Nadira': 'aldea', 'Guia de Viagem Bram': 'estranho' };
function spriteNPCs() {
  for (const n of NPCS) {
    const a = SpriteKit.actor({ kind: 'dir', base: 's_' + (NPC_SPR[n.name] || 'aldeao') });
    for (const c of [...n.g.children]) if (c !== n.bang) n.g.remove(c);
    n.g.add(a.root); n.spr = a; n.face0 = n.g.rotation.y; n.bangY = a.h + 0.45;
  }
}
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
const MARKS = {};
function markTex(k) {
  if (MARKS[k]) return MARKS[k];
  const [t, col] = k.split(':'), c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const live = col !== '#7a7a88';                       // novidade brilha; em andamento fica apagado
  if (live) {                                           // medalhão colorido com brilho, borda branca e sinal grande
    const r = x.createRadialGradient(64, 64, 20, 64, 64, 64); r.addColorStop(0, col + 'ff'); r.addColorStop(0.55, col + 'aa'); r.addColorStop(1, col + '00'); x.fillStyle = r; x.fillRect(0, 0, 128, 128);
    x.beginPath(); x.arc(64, 64, 40, 0, TAU); x.fillStyle = col; x.fill(); x.fillStyle = 'rgba(10,0,40,.35)'; x.fill(); x.lineWidth = 7; x.strokeStyle = '#fff'; x.stroke();
    const h = x.createLinearGradient(0, 24, 0, 104); h.addColorStop(0, 'rgba(255,255,255,.3)'); h.addColorStop(0.5, 'rgba(255,255,255,0)'); x.fillStyle = h; x.beginPath(); x.arc(64, 64, 36, 0, TAU); x.fill();
    x.font = 'bold 64px Verdana'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 8; x.strokeStyle = '#1a1020'; x.strokeText(t, 64, 68); x.fillStyle = '#fff'; x.fillText(t, 64, 68);
  } else { x.font = 'bold 84px Verdana'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 9; x.strokeStyle = '#000'; x.strokeText(t, 64, 68); x.fillStyle = col; x.fillText(t, 64, 68); }
  const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; return (MARKS[k] = tx);
}
const BEAM_G = new THREE.CylinderGeometry(0.35, 0.7, 9, 14, 1, true).translate(0, 4.5, 0), RING_G = new THREE.RingGeometry(0.7, 1.15, 32).rotateX(-Math.PI / 2);
function npcMark(n) {
  let k = '';
  if (n.hidden && Math.hypot(n.x - P.x, n.z - P.z) > 14) { if (n.markK !== 'h') { n.markK = 'h'; n.bang.visible = false; if (n.beam) n.beam.visible = n.ring.visible = false; } return; }
  const qm = typeof Quests !== 'undefined' ? Quests.mark(n) : null;
  if (qm) k = qm; else
  if (false) { }
  else if (n.id === 'farm') k = P.farmSeen ? '' : '!:#7dff9a';
  else if (n.id === 'watch' && typeof Evo !== 'undefined') k = Evo.mark();
  const live = !!k && !k.endsWith('#7a7a88');
  if (n.beam && n.beam.visible) {                       // pulso do medalhão, coluna de luz e anel no chão
    const p = 1 + Math.sin(time * 5) * 0.12, d = Math.min(2.4, Math.max(1, Math.hypot(n.x - P.x, n.z - P.z) / 14));
    n.bang.scale.setScalar(1.9 * p * d); n.beam.material.opacity = 0.32 + Math.sin(time * 3) * 0.12; n.ring.rotation.y += 0.03; n.ring.scale.setScalar(1 + (time * 0.8 % 1) * 0.8); n.ring.material.opacity = 0.9 * (1 - time * 0.8 % 1);
  }
  if (n.markK === k) return; n.markK = k;
  n.bang.visible = !!k; if (k) { n.bang.material.map = markTex(k); n.bang.material.toneMapped = false; n.bang.material.fog = false; n.bang.material.needsUpdate = true; n.bang.scale.setScalar(live ? 1.9 : 0.6); n.bang.renderOrder = 999; }
  if (live && !n.beam) {
    const am = () => new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
    n.beam = new THREE.Mesh(BEAM_G, am()); n.ring = new THREE.Mesh(RING_G, am()); n.ring.position.y = 0.08; n.g.add(n.beam, n.ring);
  }
  if (n.beam) { n.beam.visible = n.ring.visible = live; if (live) { const c = new THREE.Color(k.split(':')[1]); n.beam.material.color.copy(c); n.ring.material.color.copy(c); } }
}
function bangSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.font = 'bold 54px Verdana'; x.textAlign = 'center'; x.lineWidth = 6; x.strokeStyle = '#000'; x.strokeText('!', 32, 52); x.fillStyle = '#ffcf40'; x.fillText('!', 32, 52);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, fog: false, toneMapped: false })); s.scale.setScalar(0.6); return s;
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
  addOb(n.x, n.z, 1.6);
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
function refreshSkills() { SKILLS = [...CLS().skills, ...((typeof TIER_SKILLS !== 'undefined' && TIER_SKILLS[P.cls]) || [])].map((s, i) => ({ ...s, key: String(i + 1) })); }
const tierOk = s => (s.tier || 0) <= (P.tier || 0);
const tierName = () => (typeof TIERS !== 'undefined' && TIERS[P.cls] ? TIERS[P.cls][P.tier || 0] : className(P.cls, P.gender));
refreshSkills();
// bônus de buffs: multiplicativos (atk, matk, aspd, speed) e aditivos (def, crit, poison, regen)
function bmul(k) { let v = 1; for (const id in P.buffs) { const m = P.buffs[id].mods; if (m && m[k] !== undefined) v *= m[k]; } return v; }
function badd(k) { let v = 0; for (const id in P.buffs) { const m = P.buffs[id].mods; if (m && m[k] !== undefined) v += m[k]; } return v; }
const gearB = k => (typeof Vida !== 'undefined' ? Vida.gear(k) : 0);
// vantagens da guilda (guilda.js): xp, cr, desc, hp, dano, drop
const gBon = k => typeof Guilda !== 'undefined' && running ? (Guilda.bonus()[k] || 0) : 0;
const stats = {
  atk: () => { const c = CLS(); const main = c.dmg === 'dex' ? P.dex * 2 + P.str * 0.5 : P.str * 2 + P.dex * 0.5; return Math.round((6 + P.lv + main + P.luk * 0.3 + (c.magic ? 0 : gearB('pow'))) * bmul('atk') * (1 + gBon('dano'))); },
  matk: () => Math.round((6 + P.lv + P.int * 3 + P.dex * 0.3 + (CLS().magic ? gearB('pow') : 0)) * bmul('matk') * (1 + gBon('dano'))),
  def: () => Math.floor(P.vit * 0.6) + badd('def') + gearB('def'),
  maxHp: () => Math.round(((80 + P.vit * 13 + P.lv * 11) * CLS().hp * (1 + 0.12 * (P.tier || 0)) + gearB('hp')) * (1 + gBon('hp'))),
  maxSp: () => Math.round((25 + P.int * 7 + P.lv * 3) * CLS().sp + gearB('sp')),
  aspd: () => Math.max(0.2, CLS().aspd * (1 - P.agi * 0.009 - P.dex * 0.003)) / bmul('aspd'),
  speed: () => 6.2 * bmul('speed') * (1 + gearB('spd')),
  flee: () => Math.min(0.6, 0.03 + P.agi * 0.011 + P.luk * 0.003),
  crit: () => Math.min(0.75, CLS().crit + P.luk * 0.004 + badd('crit') + gearB('crit')),
};
const xpNeed = lv => Math.floor(30 + 22 * Math.pow(lv, 1.75));

const QUESTS = [
  { mob: 'pompom', n: 5, txt: 'Derrote 5 Larvas da Essência nos Campos Dourados', xp: 60, zeny: 80, red: 3 },
  { mob: 'zunzum', n: 5, txt: 'Derrote 5 Ecos Famintos', xp: 120, zeny: 120, red: 4 },
  { mob: 'fungolino', n: 5, txt: 'Derrote 5 Raízes Rastejantes', xp: 220, zeny: 160, blue: 2 },
  { mob: 'besouro', n: 6, txt: 'Derrote 6 Larvas Cristalinas nas Areias Rubras', xp: 500, zeny: 300, red: 5 },
  { mob: 'serpe', n: 5, txt: 'Derrote 5 Sombras Errantes', xp: 900, zeny: 400, blue: 3 },
  { mob: 'guardiao', n: 1, txt: 'Derrote a Sentinela sem Rosto nas ruínas', xp: 2500, zeny: 1500, blue: 5 },
];

// ---------------------------------------------------------------- estado
let mobs = [], drops = [], fx = [], floaters = [], respawnQ = [], corpses = [];
let ambAcc = 0, stepAcc = 0;
let time = 0, running = false, zone = null, nearNpc = null, nearUse = null, dialogOpen = false;
const keys = {};
const camS = { yaw: Math.PI, pitch: 0.42, dist: 9, x: 0, y: 0, z: 0 };

const SPAWNS = [
  { type: 'pompom', n: 16, area: [-58, 14, -84, 84] }, { type: 'zunzum', n: 9, area: [-58, 14, -84, 84] },
  { type: 'fungolino', n: 9, area: [-40, 45, -84, 84] },
  { type: 'besouro', n: 14, area: [55, 145, -84, 84] }, { type: 'serpe', n: 10, area: [62, 145, -84, 84] },
  { type: 'guardiao', n: 1, at: RUIN },
  // Valdora
  { type: 'raizNegra', n: 12, area: [-125, -25, -730, -660] }, { type: 'ecoCinza', n: 10, area: [-70, 30, -790, -700] },
  { type: 'larvaCinza', n: 10, area: [-40, 120, -720, -665] }, { type: 'ecoCinza', n: 6, area: [-140, -60, -840, -740] },
  { type: 'sentinelaMuralha', n: 12, area: [VCITY.x - 26, VCITY.x + 26, VCITY.z - 26, VCITY.z + 26] }, { type: 'carrasco', n: 1, at: { x: VCITY.x, z: VCITY.z + 9 } },
];
function spawnMob(type, area, at) {
  const d = MOBDEF[type]; let x, z, t = 0;
  if (at) { x = at.x; z = at.z; }
  else do { x = rand(area[0], area[1]); z = rand(area[2], area[3]); t++; }
  while (t < 300 && (blocked(x, z, 1) || dRoad(x, z) < 4 || Math.hypot(x - P.x, z - P.z) < 18 || Math.hypot(x - OAS.x, z - OAS.z) < 34 || (type !== 'guardiao' && Math.hypot(x - RUIN.x, z - RUIN.z) < 16) || Math.hypot(x - LAIR.x, z - LAIR.z) < 26));
  const model = mobModel(type);
  model.g.position.set(x, groundY(x, z), z); scene.add(model.g);
  const lab = document.createElement('div'); lab.className = 'mlabel' + (d.boss ? ' boss' : d.alfa ? ' alfa' : '');
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
  if (typeof VFX !== 'undefined') return VFX.arc(color, false);
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
  return { x: (_p.x + 1) / 2 * VW, y: (1 - _p.y) / 2 * VH, vis: _p.z < 1 && Math.abs(_p.x) < 1.2 && Math.abs(_p.y) < 1.2 };
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
  if (m.isPeer) return PvP.hit(m, base, crit);
  let dmg = Math.max(1, Math.round(base * rand(0.9, 1.1) - m.d.def * (magic ? 0.4 : 1)));
  if (crit) dmg = Math.round(dmg * 1.8);
  m.hp -= dmg; m.flash = 0.12; m.state = 'chase'; m.lastHit = time;
  if (m.type === 'kravenox') Kvx.addDmg(dmg);
  if (m.d.field && typeof Chefes !== 'undefined') Chefes.addDmg(dmg);
  floater(m.x, groundY(m.x, m.z) + m.model.h, m.z, dmg, crit ? 'crit' : magic ? 'mag' : '');
  Audio8.sfx(crit ? 'crit' : 'hit');
  _p.set(m.x, groundY(m.x, m.z) + m.model.h * 0.5, m.z);
  burst(_p.clone(), color ?? (crit ? 0xffcf40 : 0xffffff), crit ? 10 : 5, 3, 0.4);
  if (!magic && badd('poison') > 0) poison(m, stats.atk() * 0.3, 5);
  if (m.nid && typeof Partilha !== 'undefined') { Partilha.dano(m, dmg); m.hp = Math.max(1, m.hp); return dmg; }
  if (m.hp <= 0) killMob(m);
  return dmg;
}
function poison(m, dps, t) { if (!m.dead) m.dot = { dps, t, acc: 0 }; }
function killMob(m, o = {}) {
  m.dead = true; mobs = mobs.filter(o => o !== m);
  burst(new THREE.Vector3(m.x, groundY(m.x, m.z) + 0.6, m.z), m.d.boss ? 0xffcf40 : 0xffe0f0, m.d.boss ? 70 : 18, m.d.boss ? 9 : 4, 0.9);
  Audio8.sfx(m.d.boss ? 'boom' : 'die');
  m.lab.remove();
  if (m.model.inst) { m.model.inst.play(m.model.def.die, { once: true, restart: true }); corpses.push({ g: m.model.g, inst: m.model.inst, t: 1.6 }); }
  else if (m.model.spr) corpses.push({ g: m.model.g, spr: m.model.spr, face: m.face, t: 1.1 });
  else if (m.model.m3) corpses.push({ g: m.model.g, m3: m.model.body, t: 1.0 });
  else scene.remove(m.model.g);
  if (o.semPremio) return;                                              // morreu na mão de outro jogador
  if (o.ajuda) {                                                       // ajudou a matar: XP pela parte do dano (e conta na missão se foi boa parte)
    const xp = Math.max(1, Math.round(m.d.xp * o.ajuda * (1 + gBon('xp')))); if (typeof Guilda !== 'undefined') Guilda.contribuir(xp);
    log(`🤝 <b>${m.d.name}</b> caiu com a sua ajuda! +${xp} XP`, 'xp'); gainXp(xp);
    if (o.ajuda >= 0.25) { if (typeof Quests !== 'undefined') Quests.onKill(m); if (typeof Evo !== 'undefined') Evo.onKill(m); }
    return;
  }
  drops.push(makeDrop('zeny', Math.round(irand(...m.d.zeny) * (1 + gBon('cr'))), m.x, m.z));
  const dropMul = bmul('drop') * (m.plundered && time - m.plundered < 3 ? 1.8 : 1) * (1 + gBon('drop'));
  for (const [it, ch] of m.d.drops) if (Math.random() < ch * dropMul) drops.push(makeDrop(it, 1, m.x + rand(-1, 1), m.z + rand(-1, 1)));
  const diff = P.lv - m.d.lv, mult = diff > 8 ? 0.3 : diff > 5 ? 0.6 : 1;
  const xp = Math.round(m.d.xp * mult * (o.parte ?? 1) * (1 + gBon('xp')));
  if (typeof Guilda !== 'undefined') Guilda.contribuir(xp);
  log(`Você derrotou <b>${m.d.name}</b>! +${xp} XP${o.parte != null && o.parte < 0.99 ? ` <small>(${Math.round(o.parte * 100)}% do dano)</small>` : ''}`, 'xp');
  if (typeof Vida !== 'undefined') Vida.onKill(m);
  if (typeof Evo !== 'undefined') Evo.onKill(m);
  if (typeof Quests !== 'undefined') Quests.onKill(m);
  if (typeof Chefes !== 'undefined') Chefes.onKill(m);
  if (typeof Alfas !== 'undefined') Alfas.onKill(m);
  gainXp(xp);
  const q = QUESTS[P.quest];
  if (q && q.mob === m.type && P.qcount < q.n) { P.qcount++; if (P.qcount === q.n) log(`📜 Missão concluída! Volte à <b>Mestra Odete</b>.`, 'gold'); }
  if (m.type === 'guardiao') log('🏆 <b>A Sentinela sem Rosto caiu!</b> As ruínas estão livres.', 'gold');
  if (m.type === 'kravenox') { Kvx.onKill(m); return; }
  if (m.noRespawn || m.nid) return;                                     // os compartilhados renascem pelo servidor
  respawnQ.push({ type: m.type, area: m.area, at: m.at, t: m.d.respawn });
}
const dropGeo = { zeny: new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12), red: new THREE.SphereGeometry(0.16, 10, 8), blue: new THREE.SphereGeometry(0.16, 10, 8) };
dropGeo.mat = new THREE.BoxGeometry(0.26, 0.26, 0.26);
const dropMat = { mat: new THREE.MeshLambertMaterial({ color: 0xc8b070, emissive: 0x302810 }), zeny: new THREE.MeshLambertMaterial({ color: 0xf5c518, emissive: 0x604000 }), red: new THREE.MeshLambertMaterial({ color: 0xe8312f, emissive: 0x400000 }), blue: new THREE.MeshLambertMaterial({ color: 0x2f7ae8, emissive: 0x001840 }) };
function makeDrop(id, n, x, z) {
  const m = typeof Vida !== 'undefined' && Vida.dropMesh ? Vida.dropMesh(id, n) : new THREE.Mesh(dropGeo[id] || dropGeo.mat, dropMat[id] || dropMat.mat); m.castShadow = true;
  if (id === 'zeny' && m.isMesh) m.rotation.x = Math.PI / 2;
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
  floater(P.x, P.y + 2, P.z, dmg, 'hurt'); Audio8.sfx('ouch'); hurtFlash(dmg / stats.maxHp()); breakCast();
  if (P.hp <= 0) { P.hp = 0; P.dead = true; P.deadT = 3; P.combo = 0; onDeath(); }
}
// aviso de evolução de classe: grande no topo quando aparece; depois do toque vira um quadrinho
// embaixo do quadro do Kravenox (e volta a ficar grande quando muda de fase: provação pronta etc.)
let evoT = 0, evoSeen = '';
function evoCard(dt) {
  if ((evoT -= dt) > 0 || typeof Evo === 'undefined' || !Evo.card) return; evoT = 0.4;
  let el = $('evocard');
  if (!el) {
    el = document.createElement('div'); el.id = 'evocard'; $('hud').appendChild(el);
    el.addEventListener('click', () => { const t = Evo.target(); if (!t) return; Audio8.sfx('click'); const c = Evo.card(); if (c) P.evoMini = c.k; P.qGo = { ...t }; log(`🧭 A seta leva até <b>${t.name}</b>.`, 'sys'); if (typeof autoStart === 'function' && !inTower(P.z)) autoStart(); $('quest').dataset.h = ''; evoT = 0; });
  }
  const c = Evo.card();
  if (!c) { el.classList.add('hidden'); return; }
  const mini = c.k === 'hunt' || P.evoMini === c.k;
  if (mini && !(P.ui && P.ui.evo)) { el.classList.add('hidden'); return; }
  const html = mini ? `<div class="wb">⭐ ${c.mini} <b class="ev-ir">›</b></div>` : c.txt;
  if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; if (!mini && c.k !== 'hunt' && evoSeen !== c.txt) { evoSeen = c.txt; Audio8.sfx('buff'); el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); } }
  el.classList.toggle('mini', mini); el.classList.toggle('win', mini);
  if (mini) { const k = $('rail'), r = k && k.getBoundingClientRect(); if (r && r.height) { el.style.top = (r.bottom + 6) + 'px'; el.style.left = r.left + 'px'; el.style.width = ''; } }
  else { el.style.top = el.style.left = el.style.width = ''; }
  el.classList.remove('hidden');
}
// ---------------- barra de vida do chefe perto de você (no topo da tela): nome, nível e quanto falta
let bossT = 0;
function bossBar(dt) {
  if ((bossT -= dt) > 0) return; bossT = 0.12;
  let bar = $('bossbar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'bossbar'; bar.className = 'hidden'; bar.innerHTML = '<div class="kn"></div><div class="kt"><b></b><em></em></div>'; $('hud').appendChild(bar); }
  let best = null, bd = 1e9;
  for (const m of mobs) {
    if (m.dead || m.type === 'kravenox' || !(m.d.boss || m.d.mini || m.d.field || m.d.alfa || m.towerGuard)) continue;
    const d = Math.hypot(m.x - P.x, m.z - P.z); if (d < 40 && d < bd) { bd = d; best = m; }
  }
  if (!best) { bar.classList.add('hidden'); return; }
  const pct = Math.max(0, best.hp / best.maxHp * 100);
  const kn = `${best.d.alfa ? '⭐' : '☠'} ${best.d.name.toUpperCase()} <small>Nv ${best.d.lv}</small>`;
  if (bar.dataset.n !== kn) { bar.querySelector('.kn').innerHTML = kn; bar.dataset.n = kn; }
  bar.querySelector('.kt b').style.width = pct + '%';
  bar.querySelector('.kt em').textContent = `${Math.max(0, Math.ceil(best.hp)).toLocaleString('pt-BR')} / ${best.maxHp.toLocaleString('pt-BR')} (${pct < 1 && pct > 0 ? '<1' : Math.round(pct)}%)`;
  bar.classList.toggle('alfa', !!best.d.alfa); bar.classList.remove('hidden');
  const ev = $('evocard'), er = ev && !ev.classList.contains('hidden') && !ev.classList.contains('mini') ? ev.getBoundingClientRect() : null;
  bar.style.top = er && er.height ? (er.bottom + 4) + 'px' : '';                       // não fica embaixo do aviso grande de evolução
}
// ---------------- barra de ícones (estilo Ragnarok): os quadros ficam fechados; bolinha vermelha avisa novidade
let railT = 0;
function railTick(dt) {
  if ((railT -= dt) > 0) return; railT = 0.4;
  P.ui = P.ui || { kvx: false, evo: false, quest: false };
  let r = $('rail');
  if (!r) {
    r = document.createElement('div'); r.id = 'rail'; $('hud').appendChild(r);
    r.innerHTML = '<button data-p="quest" title="Missões">📜<b></b></button><button data-p="evo" title="Evolução de classe">⭐<b></b></button><button data-p="kvx" title="Kravenox">☠️<b></b></button>';
    r.addEventListener('pointerdown', e => { const b = e.target.closest('[data-p]'); if (!b) return; e.preventDefault(); e.stopPropagation(); Audio8.sfx('click');
      const k = b.dataset.p; if (k === 'quest') { if (typeof Quests !== 'undefined') Quests.journal(); return; }
      const was = P.ui[k]; P.ui.kvx = P.ui.evo = false; P.ui[k] = !was;
      if (k === 'evo' && P.ui.evo && typeof Evo !== 'undefined') { const c = Evo.card(); if (c) P.evoMini = c.k; }
      $('quest').dataset.h = ''; evoT = 0; railT = 0; });
  }
  const st = $('status').getBoundingClientRect();
  r.style.top = (st.bottom + 6) + 'px'; r.style.left = st.left + 'px';
  const set = (k, txt) => { const b = r.querySelector(`[data-p="${k}"]`); b.classList.toggle('on', !!P.ui[k]); const d = b.querySelector('b'); d.textContent = txt || ''; d.style.display = txt ? '' : 'none'; };
  const ready = typeof Quests !== 'undefined' && Quests.readyCount ? Quests.readyCount() : 0;
  set('quest', ready ? String(ready) : ''); r.querySelector('[data-p="quest"]').classList.remove('on');
  const c = typeof Evo !== 'undefined' && Evo.card ? Evo.card() : null;
  r.querySelector('[data-p="evo"]').style.display = c ? '' : 'none';
  set('evo', c && c.k !== 'hunt' ? '!' : '');
  const live = typeof Kvx !== 'undefined' && Kvx.active;
  set('kvx', live ? '!' : '');
  const kv = $('kvx');
  if (kv) { const show = P.ui.kvx || live; kv.style.display = show ? '' : 'none'; if (show) { const rr = r.getBoundingClientRect(); kv.style.top = (rr.bottom + 6) + 'px'; kv.style.left = rr.left + 'px'; kv.style.transform = 'none'; kv.style.width = '190px'; } }
}
function hurtFlash(k) {
  let el = $('hurtfx'); if (!el) { el = document.createElement('div'); el.id = 'hurtfx'; document.body.appendChild(el); }
  el.style.opacity = Math.min(0.85, 0.35 + k * 3); clearTimeout(el._t); el._t = setTimeout(() => { el.style.opacity = 0; }, 90);
}
// morrer: perde 5% da XP do nível e a SACOLA cai no chão com toda a pilhagem (materiais, cartas,
// colheita e equipamentos que não estavam no corpo); 10% de chance de uma peça equipada ir junto.
// Guarde as coisas no baú da sua casa para não perder. Até 3 sacolas; a mais velha some.
const LOOT_KINDS = ['mat', 'carta', 'colheita', 'equip'];
function onDeath() {
  const lost = Math.min(P.xp, Math.floor(xpNeed(P.lv) * 0.05));
  P.xp -= lost; P.deathXp = lost;
  Audio8.sfx('die');
  log(`💔 Você desmaiou e perdeu <b>${lost} XP</b>... voltando para a cidade.`, 'bad');
  const items = {};
  for (const id of Object.keys(P.inv)) if (P.inv[id] > 0 && ITEMS[id] && LOOT_KINDS.includes(ITEMS[id].kind)) { items[id] = P.inv[id]; P.inv[id] = 0; }
  const eq = Object.entries(P.equip || {}).filter(([, id]) => id);
  let eqLost = null;
  if (eq.length && Math.random() < 0.10) { const [sl, id] = eq[Math.floor(Math.random() * eq.length)]; P.equip[sl] = null; items[id] = (items[id] || 0) + 1; eqLost = id; }
  if (!Object.keys(items).length) return;
  const zn = zoneOf(P.x, P.z), fT = inTower(P.z) ? floorAt(P.x, P.z) : null;
  const at = zn === 'casa' ? { x: FARM.x - 11, z: FARM.z + 1 } : fT && !fT.casa ? { x: P.x, z: P.z, andar: fT.i } : inTower(P.z) ? { x: Tower.door.x + rand(-3, 3), z: Tower.door.z + 2 } : { x: P.x, z: P.z };
  P.graves = P.graves || []; if (P.grave) { P.graves.push({ x: P.grave.x, z: P.grave.z, items: { [P.grave.id]: P.grave.n } }); P.grave = null; }
  P.graves.push({ x: at.x, z: at.z, items, t: Date.now(), andar: at.andar });
  while (P.graves.length > 3) { P.graves.shift(); log('💨 Sua sacola mais antiga foi saqueada e sumiu.', 'bad'); }
  buildGraves(); buildHotbar();
  const n = Object.values(items).reduce((a, b) => a + b, 0);
  log(`🎒 Sua <b>sacola</b> caiu com <b>${n} itens</b> da pilhagem!${eqLost ? ` Junto foi <b>${ITEMS[eqLost].ic} ${ITEMS[eqLost].name}</b> que estava equipado.` : ''} A seta mostra onde: volte para buscar. <small>Dica: guarde no baú da sua casa no Sítio.</small>`, 'bad');
}
let graveObjs = [];
const sackGeo = new THREE.SphereGeometry(0.55, 14, 10), knotGeo = new THREE.ConeGeometry(0.22, 0.4, 10);
function buildGraves() {
  graveObjs.forEach(o => scene.remove(o)); graveObjs = [];
  if (P.grave) { P.graves = P.graves || []; P.graves.push({ x: P.grave.x, z: P.grave.z, items: { [P.grave.id]: P.grave.n } }); P.grave = null; }
  for (const gv of (P.graves || [])) {
    const g = new THREE.Group(); g.position.set(gv.x, groundY(gv.x, gv.z), gv.z);
    const cloth = PM('palha.jpg', [2, 2], new THREE.Color(1.15, 0.85, 0.55));
    const sack = new THREE.Mesh(sackGeo, cloth); sack.scale.set(1, 0.85, 1); sack.position.y = 0.45; sack.castShadow = true; g.add(sack);
    const knot = new THREE.Mesh(knotGeo, cloth); knot.position.y = 1.05; knot.rotation.x = Math.PI; g.add(knot);
    const rope = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 14), new THREE.MeshLambertMaterial({ color: 0x6a4a2a })); rope.rotation.x = Math.PI / 2; rope.position.y = 0.88; g.add(rope);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 6, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false })); beam.position.y = 3; g.add(beam);
    beam.onBeforeRender = () => { beam.material.opacity = 0.35 + 0.2 * Math.sin(time * 3); };
    scene.add(g); graveObjs.push(g);
  }
  const last = (P.graves || [])[P.graves ? P.graves.length - 1 : 0];
  if (last && last.andar != null) P.qGo = { x: Tower.door.x, z: Tower.door.z, name: `sua sacola (${last.andar === TOP ? 'topo' : last.andar + 1 + 'º andar'} da Torre)`, grave: true };   // na Torre: a seta leva até a porta
  else if (last) P.qGo = { x: last.x, z: last.z, name: 'sua sacola', grave: true };
  else if (P.qGo && P.qGo.grave) P.qGo = null;
}
const buildGrave = buildGraves;
function checkGrave() {
  if (P.dead || !P.graves || !P.graves.length) return;
  const i = P.graves.findIndex(gv => Math.hypot(P.x - gv.x, P.z - gv.z) < 2.2); if (i < 0) return;
  const gv = P.graves.splice(i, 1)[0], got = [];
  for (const [id, n] of Object.entries(gv.items)) { P.inv[id] = (P.inv[id] || 0) + n; got.push(`${n > 1 ? n + '× ' : ''}${ITEMS[id] ? ITEMS[id].ic : ''}`); }
  P.qGo = null; buildGraves(); buildHotbar();
  Audio8.sfx('level'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xffb040, 30, 4, 0.8);
  log(`🎒 Você recuperou a sacola: ${got.join(' ')} (está na mochila).`, 'gold');
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
  if (typeof PvP !== 'undefined') for (const t of PvP.targets(r)) {          // jogadores (PvP)
    const dx = t.x - P.x, dz = t.z - P.z, d = Math.hypot(dx, dz);
    const ang = Math.abs(((Math.atan2(dx, dz) - P.face + Math.PI) % TAU + TAU) % TAU - Math.PI), score = d + (cone ? ang * 1.5 : 0);
    if (score < bs) { bs = score; best = t; }
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
    const hit = t => dmgMob(t, base * k, Math.random() < stats.crit(), c.magic, c.proj);
    if (typeof VFX !== 'undefined') VFX.basic(c, handPos(), m, hit); else shoot(handPos(), m, c.proj, false, hit);
  } else {
    slash(k > 1.3 ? 0xffcf40 : c.colors.accent);
    Audio8.sfx('whip');
    if (m && Math.hypot(m.x - P.x, m.z - P.z) < c.range + (m.d.rad ?? (m.d.boss ? 1.6 : 0))) {
      dmgMob(m, stats.atk() * k, Math.random() < stats.crit());
      if (c.hitFx === 'garra') clawFx(m);
    }
  }
}
function clawFx(m) {
  if (typeof SpriteKit === 'undefined' || !SpriteKit.ready) return;
  const big = m.d.rad ? 4 : 1;
  SpriteKit.fx(P.atkSeq % 2 ? 'fx_garra1' : 'fx_garra2', { x: m.x, y: groundY(m.x, m.z) + Math.min(m.model.h * 0.55, 4), z: m.z, h: 1.7 * big, life: 0.28, flip: Math.random() < 0.5 });
}
function skillFx(s, tgt) {
  if (!s.fx || typeof SpriteKit === 'undefined' || !SpriteKit.ready) return false;
  if (s.fx === 'espinhos') {
    const gy = groundY(tgt.x, tgt.z);
    SpriteKit.fx('fx_espinhos', { x: tgt.x, y: gy, z: tgt.z, h: 3.4, bottom: true, life: 0.65 });
    for (let j = 0; j < 4; j++) { const a = rand(0, TAU), r = rand(1, s.r); SpriteKit.fx('fx_espinhos2', { x: tgt.x + Math.cos(a) * r, y: groundY(tgt.x + Math.cos(a) * r, tgt.z + Math.sin(a) * r), z: tgt.z + Math.sin(a) * r, h: 1.5, bottom: true, life: 0.5 }); }
  } else if (s.fx === 'espinhos2') {
    for (let j = 0; j < 14; j++) { const a = j / 14 * TAU + rand(0, 0.3), r = rand(1.5, s.r); const x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r; SpriteKit.fx(j % 3 ? 'fx_espinhos2' : 'fx_espinhos', { x, y: groundY(x, z), z, h: j % 3 ? 1.7 : 2.6, bottom: true, life: 0.6 }); }
  } else if (s.fx === 'raio') {
    const to = new THREE.Vector3(tgt.x, groundY(tgt.x, tgt.z) + Math.min(tgt.model.h * 0.5, 4), tgt.z);
    SpriteKit.fx('fx_raio', { from: handPos(), to, h: 1.1, life: 0.5 });
    SpriteKit.fx('fx_explosao', { x: to.x, y: to.y, z: to.z, h: 2.2, life: 0.45, grow: 1.5 });
    return true;                                                     // raio acerta na hora
  }
  return false;
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
    if (s.stun && !m.dead && !m.d.boss) m.stun = Math.max(m.stun, s.stun);   // chefes não ficam atordoados
    if (s.poison) poison(m, stats.matk() * 0.35 * s.poison, 6);
  };
  const center = new THREE.Vector3(P.x, P.y + 1, P.z);
  const instant = skillFx(s, tgt);
  if (s.fury && typeof SpriteKit !== 'undefined' && SpriteKit.ready) SpriteKit.fx('fx_explosao', { x: P.x, y: P.y + 1, z: P.z, h: 3, life: 0.5, grow: 2 });
  switch (s.type) {
    case 'strike':
      VFX.strike(s, tgt); Audio8.sfx('whip'); hitOne(tgt, base);
      if (s.heal) healP(stats.maxHp() * s.heal);
      if (s.plunder) tgt.plundered = time;
      if (s.steal) { const z = irand(5, 12) + tgt.d.lv * 2; P.zeny += z; Audio8.sfx('coin'); floater(P.x, P.y + 2, P.z, `+${z} cr`, 'zeny'); }
      break;
    case 'nova':
      Audio8.sfx(s.mult >= 3 ? 'boom' : 'skill');
      VFX.nova(s);
      nearAt(P.x, P.z, s.r).forEach(m => hitOne(m, base));
      if (s.heal) healP(stats.maxHp() * s.heal);
      if (s.regen) addBuff(s.id + '_regen', s.regen, { regen: 0.03 }, '💚');
      break;
    case 'blast': {
      const x = tgt.x, z = tgt.z, gy = groundY(x, z);
      Audio8.sfx('boom'); VFX.blast(s, tgt);
      nearAt(x, z, s.r).forEach(m => hitOne(m, base));
      break;
    }
    case 'bolt': {
      Audio8.sfx('skill');
      if (instant) { hitOne(tgt, base); break; }
      const list = s.spread ? nearestN(range, s.shots) : Array(s.shots || 1).fill(tgt);
      list.forEach((t, j) => setTimeout(() => { if (!P.dead && !t.dead) VFX.shoot(s, handPos(), t, m => hitOne(m, base), j); }, j * (s.fx === 'espiritos' ? 90 : 130)));
      break;
    }
    case 'drain':
      Audio8.sfx('skill');
      VFX.shoot(s, handPos(), tgt, m => { const d = dmgMob(m, base, crit(), true, s.color); healP(d * s.steal); VFX.drain(s, m); });
      break;
    case 'step': {
      const a = Math.atan2(tgt.x - P.x, tgt.z - P.z);
      const nx = tgt.x + Math.sin(a) * 1.3, nz = tgt.z + Math.cos(a) * 1.3;
      const x0 = P.x, z0 = P.z;
      if (!blocked(nx, nz)) { P.x = nx; P.z = nz; P.y = groundY(nx, nz); }
      P.face = a + Math.PI; Audio8.sfx('whip'); VFX.dash(s, x0, z0);
      dmgMob(tgt, base, true, false, s.color);
      break;
    }
    case 'charge': {
      const a = Math.atan2(tgt.x - P.x, tgt.z - P.z), d = Math.hypot(tgt.x - P.x, tgt.z - P.z) - 1.4;
      const x0 = P.x, z0 = P.z, sx = P.x, sz = P.z;
      for (let t = 0; t < d; t += 0.7) { const x = sx + Math.sin(a) * t, z = sz + Math.cos(a) * t; if (blocked(x, z)) break; P.x = x; P.z = z; }
      P.y = groundY(P.x, P.z); Audio8.sfx('boom'); VFX.dash(s, x0, z0); VFX.wave(tgt.x, tgt.z, 2.8, s.color, 0.45); VFX.flash(new THREE.Vector3(tgt.x, groundY(tgt.x, tgt.z) + 1, tgt.z), s.color, 3); hitOne(tgt, base);
      break;
    }
    case 'buff':
      addBuff(s.id, s.dur, s.mods, s.icon); Audio8.sfx('buff'); VFX.buff(s);
      if (s.heal) healP(stats.maxHp() * s.heal);
      log(`${s.icon} <b>${s.name}</b> ativo por ${s.dur}s.`, 'gold');
      break;
    case 'heal':
      Audio8.sfx('heal'); healP(stats.maxHp() * s.pct); VFX.heal(s);
      break;
    case 'summon':
      Audio8.sfx('skill'); VFX.summon(s); summon(s.minion, s.life);
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
  solmira: { name: 'Vila de Solmira', music: 'vila', town: true },
  sitio: { name: 'Sítio de Solmira', music: 'vila' },
  campos: { name: 'Campos Dourados', music: 'floresta' },
  areias: { name: 'Areias Rubras', music: 'vale' },
  lair: { name: 'Cratera do Cisma', music: 'abismo' },
  cidadela: { name: 'Cidadela do Cisma', music: 'fortaleza', town: true },
  torre: { name: 'Torre do Cisma', music: 'masmorra' },
  topo: { name: 'Topo da Torre do Cisma', music: 'chefe' },
  casa: { name: 'Sua Casa', music: 'vila' },
  kharum: { name: 'Oásis de Kharum', music: 'cidade', town: true },
  acampamento: { name: 'Acampamento de Valdora', music: 'vila', town: true },
  estrada: { name: 'Estrada de Valdora', music: 'abismo' },
  valdora: { name: 'Ruínas de Valdora', music: 'fortaleza' },
};
function update(dt) {
  time += dt; windU.value = time; WAVES.offset.set(time * 0.012, time * 0.02);
  updatePlayer(dt);
  for (const m of mobs) updateMob(m, dt);
  for (const r of respawnQ) r.t -= dt;
  respawnQ = respawnQ.filter(r => { if (r.t <= 0) { spawnMob(r.type, r.area, r.at); return false; } return true; });
  for (const d of drops) { d.t += dt; d.m.rotation.y += dt * (d.m.userData.flat ? 0.6 : 3); d.m.position.y = groundY(d.x, d.z) + 0.4 + (d.m.userData.flat ? 0 : Math.sin(d.t * 4) * 0.1); }
  if (typeof Vida !== 'undefined') Vida.update(dt);
  if (typeof Quests !== 'undefined') Quests.update(dt);
  if ((ambAcc += dt) > 0.25) { ambAcc = 0; const zz = zoneOf(P.x, P.z); Audio8.ambient(zz === 'areias' || zz === 'kharum' ? 'deserto' : zz === 'torre' || zz === 'topo' || zz === 'cidadela' || zz === 'lair' ? 'torre' : zz === 'solmira' || zz === 'sitio' ? 'vila' : 'campo', (LASTDAY ? LASTDAY.night : 0) > 0.5); }
  if (P.moving && P.onGround && !P.dead && (stepAcc += dt * stats.speed() / 6.2) > 0.34) { stepAcc = 0; Audio8.step(P.x > 48); }
  updateFx(dt); updateProjs(dt); updateMinions(dt); Tower.update(dt); if (typeof Valdora !== 'undefined') Valdora.update(dt); Kvx.update(dt); Net.update(dt); if (typeof Partilha !== 'undefined') Partilha.update(dt); if (typeof Guilda !== 'undefined') Guilda.update(dt); Net.tickMyBubble(dt);
  for (const c of corpses) { c.t -= dt; if (c.inst) c.inst.update(dt); else if (c.spr) c.spr.update(dt, { dead: true, face: c.face, fade: Math.min(1, c.t * 1.5) }); else if (c.m3) { c.m3.rotation.z = Math.min(Math.PI / 2, c.m3.rotation.z + dt * 6); } if (c.t < 0.5) c.g.position.y -= dt * 2; if (c.t <= 0) scene.remove(c.g); }
  corpses = corpses.filter(c => c.t > 0);
  for (const n of NPCS) if (n.inst) n.inst.update(dt); else if (n.spr) n.spr.update(dt, { face: Math.hypot(P.x - n.x, P.z - n.z) < 7 ? Math.atan2(P.x - n.x, P.z - n.z) : n.face0 });
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
  for (const n of NPCS) { n.bang.position.y = (n.bangY || 2.3) + 0.35 + Math.sin(time * 3) * 0.15; npcMark(n); }
  const z = zoneOf(P.x, P.z);
  if (z !== zone) {
    zone = z; Audio8.play(ZONES[z].music); banner(ZONES[z].name); $('zonename').textContent = ZONES[z].name;
    log(`Você entrou em <b>${ZONES[z].name}</b>.`, 'sys');
    if (ZONES[z].town) P.home = z;
  }
  if (P.combo && (P.comboT -= dt) <= 0) { if (P.combo >= 3) log(`Combo final: ${P.combo}`, 'sys'); P.combo = 0; }
  // ciclo de dia e noite (30 min por dia; dia mais longo que a noite)
  const DAY = LASTDAY = dayCycle();
  sky.material.uniforms.sunDir.value.copy(DAY.sunDir); sky.material.uniforms.night.value = DAY.night;
  sun.intensity = DAY.sunI; sun.color.copy(DAY.sunC); hemi.intensity = DAY.hemiI; hemi.color.copy(DAY.hemiC);
  const des = inTower(P.z) ? 0 : smooth(40, 70, P.x);
  skyMat.uniforms.horizon.value.copy(SKY_GREEN).lerp(SKY_DESERT, des); skyMat.uniforms.top.value.copy(SKY_TOP_G).lerp(SKY_TOP_D, des); const dark = inTower(P.z) ? 1 : smooth(150, 166, P.x);
  skyMat.uniforms.horizon.value.lerp(DAY.horizon, DAY.mixH); skyMat.uniforms.top.value.lerp(DAY.top, DAY.mixT);
  if (dark > 0) { skyMat.uniforms.horizon.value.lerp(DARK_H, dark); skyMat.uniforms.top.value.lerp(DARK_T, dark); }
  if (inVal(P.z)) { skyMat.uniforms.horizon.value.lerp(ASH_H, 0.85); skyMat.uniforms.top.value.lerp(ASH_T, 0.85); }
  if (typeof Props !== 'undefined' && Props.setNight) Props.setNight(DAY.night);
  mountains.material.color.copy(skyMat.uniforms.horizon.value).multiplyScalar(0.5).lerp(MOUNT_C, 0.25);
  updateFireflies(dt, DAY.night * (1 - dark));
  scene.fog.color.copy(skyMat.uniforms.horizon.value);
  if (typeof SpriteKit !== 'undefined') SpriteKit.setLight((1 - 0.3 * dark) * (0.62 + 0.38 * DAY.light));
}

function updatePlayer(dt) {
  if (P.dead) {
    P.deadT -= dt;
    if (P.deadT <= 0) {
      P.dead = false; P.hp = Math.round(stats.maxHp() * 0.5); P.sp = Math.round(stats.maxSp() * 0.5);
      const h = homePos();
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
  if ((ix || iz) && AUTO.on) autoStop('');
  if (!ix && !iz && AUTO.on && !dialogOpen) {                      // andando sozinho até o objetivo da missão
    const d = autoDir(dt);
    if (d) {
      P.sit = false;
      let df = ((Math.atan2(d.x, d.z) - P.face + Math.PI) % TAU + TAU) % TAU - Math.PI;
      if (P.attackAnim <= 0.3) P.face += df * Math.min(1, dt * 10);
      const sp = stats.speed(); vx = d.x * sp; vz = d.z * sp; P.moving = true;
    }
  }
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
    if (d.id === 'zeny') { P.zeny += d.n; Audio8.sfx('coin'); floater(d.x, P.y + 1.5, d.z, `+${d.n} cr`, 'zeny'); }
    else { P.inv[d.id] = (P.inv[d.id] || 0) + d.n; Audio8.sfx('pick'); if (!(typeof Vida !== 'undefined' && Vida.pickMsg(d.id, d.n))) log(`Você pegou <b>${ITEMS[d.id].name}</b>.`, 'item'); buildHotbar(); }
  }
  drops = drops.filter(d => !d.taken);
  checkGrave();

  nearNpc = null;
  for (const n of NPCS) if (Math.hypot(n.x - P.x, n.z - P.z) < 3) nearNpc = n;
  const pr = $('prompt');
  nearUse = !nearNpc ? ((typeof Casa !== 'undefined' && Casa.nearest()) || (typeof Vida !== 'undefined' && Vida.nearest()) || (typeof Quests !== 'undefined' && Quests.nearest()) || null) : null;
  if (nearNpc && !dialogOpen) { pr.innerHTML = TOUCH ? `Toque 💬 para falar com ${nearNpc.name}` : `<b>[F]</b> Falar com ${nearNpc.name}`; pr.classList.remove('hidden'); }
  else if (nearUse && !dialogOpen) { pr.innerHTML = TOUCH ? `Toque 💬: ${nearUse.label}` : `<b>[F]</b> ${nearUse.label}`; pr.classList.remove('hidden'); }
  else pr.classList.add('hidden');
  $('t-talk').classList.toggle('hidden', !(nearNpc || nearUse) || dialogOpen);
}

function updateMob(m, dt) {
  if (m.dot) {
    m.dot.t -= dt; m.dot.acc += dt;
    if (m.dot.acc >= 1) { m.dot.acc = 0; const d = Math.max(1, Math.round(m.dot.dps)); if (m.nid && typeof Partilha !== 'undefined') { Partilha.dano(m, d); m.hp = Math.max(1, m.hp - d); } else m.hp -= d; floater(m.x, groundY(m.x, m.z) + m.model.h, m.z, d, 'poison'); burst(new THREE.Vector3(m.x, groundY(m.x, m.z) + 0.6, m.z), 0x7dff4a, 4, 1.5, 0.5); if (m.hp <= 0) { killMob(m); return; } }
    if (m.dot && m.dot.t <= 0) m.dot = null;
  }
  m.flash = Math.max(0, m.flash - dt); m.atkCd -= dt; m.moving = false; m.swing = Math.max(0, (m.swing || 0) - dt * 2);
  if (m.type === 'kravenox') Kvx.ai(m, dt);
  if (m.nid && typeof Partilha !== 'undefined' && !Partilha.meu(m)) Partilha.mover(m, dt);
  else if ((m.d.field || m.d.mini) && typeof Chefes !== 'undefined' && Chefes.ai(m, dt)) return;
  else if (m.stun > 0) m.stun -= dt;
  else {
    const dP = Math.hypot(m.x - P.x, m.z - P.z);
    if (m.state !== 'chase' && m.d.aggro && dP < m.d.aggro && !P.dead) m.state = 'chase';
    const reach = m.d.boss ? 4.2 : 1.6;
    if (m.state === 'chase') {
      if (P.dead || Math.hypot(m.x - m.sx, m.z - m.sz) > (m.d.field ? 70 : 32)) { m.state = 'return'; m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.25); if (m.nid && typeof Partilha !== 'undefined') Partilha.cura(m); }
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
  const far = Math.hypot(m.x - P.x, m.z - P.z) > (m.d.boss ? (TOUCH ? 90 : 140) : (TOUCH ? 48 : 70));
  g.visible = !far;
  if (far) return;
  g.position.set(m.x, groundY(m.x, m.z), m.z);
  let df = ((m.face - g.rotation.y + Math.PI) % TAU + TAU) % TAU - Math.PI;
  g.rotation.y += df * Math.min(1, dt * 8);
  if (m.stun <= 0 || m.model.spr) m.model.anim(m, time); else g.rotation.z = Math.sin(time * 8) * 0.1;
  if (m.stun <= 0) g.rotation.z = 0;
  const em = m.flash > 0 ? 0xffffff : 0x000000;
  for (const mt of m.model.mats) mt.emissive.setHex(em);
}
function stepMob(m, tx, tz, sp, dt) {
  const dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz);
  if (d < 0.01) return;
  const vx = dx / d * sp * dt, vz = dz / d * sp * dt, r = (m.d.field || m.d.alfa) ? 0.45 : m.d.rad ? m.d.rad * 0.6 : m.d.boss ? 1.2 : 0.5;
  let moved = false;
  if (!blocked(m.x + vx, m.z, r)) { m.x += vx; moved = true; }
  if (!blocked(m.x, m.z + vz, r)) { m.z += vz; moved = true; }
  if (!moved && (m.d.field || m.d.alfa)) {                          // chefes contornam árvores e pedras
    const a0 = Math.atan2(dx, dz), st = sp * dt;
    for (const k of [0.6, -0.6, 1.2, -1.2, 1.8, -1.8]) { const a = a0 + k, nx = m.x + Math.sin(a) * st, nz = m.z + Math.cos(a) * st; if (!blocked(nx, nz, r)) { m.x = nx; m.z = nz; moved = true; break; } }
  }
  if (!moved) { m.tx = m.x; m.tz = m.z; m.timer = 0; }
  m.face = Math.atan2(dx, dz); m.moving = moved;
}

// ---------------------------------------------------------------- animação da Lyra
function animateLyra(dt) {
  if (L.sprite) return animateSprite(dt);
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

function animateSprite(dt) {
  lyra.position.set(P.x, P.y, P.z); lyra.rotation.y = P.face;
  L.sprite.update(dt, { face: P.face, moving: P.moving && P.onGround, atk: Math.max(P.attackAnim, P.cast), dead: P.dead, flash: P.hurtT > 0, fury: !!P.buffs.furia, sit: P.sit, gy: (running ? groundY(P.x, P.z) : P.y) - P.y });
  lyra.visible = true;
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
  const big = inTower(P.z) && Tower.floor === TOP;                   // topo da torre: câmera para o gigante
  camS.pitch = clamp(camS.pitch, 0.08, 1.25); camS.dist = clamp(camS.dist, big ? 10 : 4, big ? 32 : 18);
  if (inTower(P.z)) {                                    // escadaria da Torre: a câmera se alinha com ela (de lado só veria a parede)
    const f = floorAt(P.x, P.z);
    if (f && !f.casa && stairRise(f, P.x, P.z) !== 0) { const alvo = Math.cos(camS.yaw) >= 0 ? 0 : Math.PI, d = ((alvo - camS.yaw + Math.PI) % TAU + TAU) % TAU - Math.PI; camS.yaw += d * Math.min(1, dt * 4); }
  }
  const tx = P.x, ty = P.y + (big ? 4.5 : 1.3), tz = P.z;
  camS.x = lerp(camS.x, tx, Math.min(1, dt * 10)); camS.y = lerp(camS.y, ty, Math.min(1, dt * 10)); camS.z = lerp(camS.z, tz, Math.min(1, dt * 10));
  // aproxima a câmera quando uma árvore/casa fica entre ela e o personagem
  const dx = Math.sin(camS.yaw) * Math.cos(camS.pitch), dy = Math.sin(camS.pitch), dz = Math.cos(camS.yaw) * Math.cos(camS.pitch);
  let want = camS.dist;
  for (let k = 1; k <= 16; k++) {
    const d = camS.dist * k / 16, x = camS.x + dx * d, z = camS.z + dz * d, y = camS.y + dy * d;
    const l = OB.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL));
    if (l && y < groundY(x, z) + 5 && l.some(o => o.r > 2 && Math.hypot(x - o.x, z - o.z) < o.r + 0.8)) { want = Math.max(2.2, camS.dist * (k - 1) / 16); break; }
    if (inTower(camS.z) && blocked(x, z, 0.35)) { want = Math.max(1.4, camS.dist * (k - 1) / 16); break; }   // parede da Torre: a câmera chega perto em vez de ficar atrás dela
  }
  camS.cur = lerp(camS.cur ?? want, want, Math.min(1, dt * (want < (camS.cur ?? want) ? 20 : 2.5)));
  const cx = camS.x + dx * camS.cur, cz = camS.z + dz * camS.cur;
  let cy = camS.y + dy * camS.cur;
  cy = Math.max(cy, (inTower(cz) ? groundY(camS.x, camS.z) : height(cx, cz)) + 0.6);
  camera.position.set(cx, cy, cz);
  camera.lookAt(camS.x, camS.y, camS.z);
  hideTreesBetween(cx, cz, camS.x, camS.z, cy, camS.y);
  sun.position.set(P.x + SUN_OFF.x, P.y + SUN_OFF.y, P.z + SUN_OFF.z); sun.target.position.set(P.x, P.y, P.z);
}

// ---------------------------------------------------------------- HUD
function updateLabels() {
  for (const m of mobs) {
    const d = Math.hypot(m.x - P.x, m.z - P.z);
    const show = d < (m.d.boss ? 45 : m.d.alfa ? 35 : 22) && (m.hp < m.maxHp || d < 9 || m.d.boss || m.d.alfa);
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
  $('btn-stat').classList.toggle('badge', P.statPts > 0); $('btn-skill').classList.toggle('badge', P.skillPts > 0);
  const mh = stats.maxHp(), ms = stats.maxSp(), need = xpNeed(P.lv);
  $('st-name').textContent = P.name;
  $('st-lv').textContent = `${tierName()} · Nv ${P.lv}`;
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
  if (typeof Guilda !== 'undefined') b += Guilda.hud();
  $('buffs').innerHTML = b;
  $('combo').innerHTML = P.combo >= 2 ? `<b>${P.combo}</b> COMBO<small>+${Math.min(100, P.combo * 5)}% dano</small>` : '';
  const q = QUESTS[P.quest];
  const qt = questTarget(), qd = qt ? Math.round(Math.hypot(qt.x - P.x, qt.z - P.z)) : 0;
  const qh = q ? `<div class="wt">📜 Missão</div><div class="wb">${q.txt}<br><b>${Math.min(P.qcount, q.n)} / ${q.n}</b>${P.qcount >= q.n ? ' — fale com a Mestra Odete' : ''}${qt && qd > 5 ? `<br><span class="qd">📍 ${qd} m · siga a seta dourada</span>` : ''}</div>` : '';
  const ui = P.ui || {};
  const qh2 = (ui.quest && typeof Evo !== 'undefined' && Evo.active ? Evo.html() : '') + (typeof Quests !== 'undefined' ? Quests.html(!ui.quest) : qh) || `<div class="wt">📜 Missões</div><div class="wb">Todas concluídas!</div>`;
  if ($('quest').dataset.h !== qh2) { $('quest').innerHTML = qh2; $('quest').dataset.h = qh2; }
  if (!$('quest').dataset.on) { $('quest').dataset.on = 1; $('quest').addEventListener('pointerdown', e => { if (e.target.closest('.wt, .qmore') && typeof Quests !== 'undefined') { Audio8.sfx('click'); Quests.journal(); return; } const t = e.target.closest('[data-q]'); if (t && typeof Quests !== 'undefined') { const same = P.qFocus === t.dataset.q; if (same && AUTO.on) autoStop('🚶 Parou.'); else { if (!same) Quests.follow(t.dataset.q); else Audio8.sfx('click'); P.qFocus = t.dataset.q; autoStart(); } $('quest').dataset.h = ''; } }); }
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
mm.addEventListener('click', e => { e.stopPropagation(); Audio8.sfx('click'); BigMap.show(); });
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
// ---------------------------------------------------------------- mapa grande (toque no minimapa)
const BigMap = (() => {
  let open = false, base = null, box = null, cv = null, g = null, view = null;   // view: null = reino inteiro; senão a cidade aberta
  const PLACES = [[VIL, 'Vila de Solmira'], [FARM, 'Sítio'], [OAS, 'Oásis de Kharum'], [CIT, 'Cidadela do Cisma'], [TOWER, 'Torre do Cisma'], [LAIR, 'Cratera do Cisma'], [RUIN, 'Ruínas'], [VGATE_R, 'Passagem do Norte ↑']];
  const CITIES = [{ c: VIL, z: 'solmira', n: 'Vila de Solmira', R: 32 }, { c: OAS, z: 'kharum', n: 'Oásis de Kharum', R: 36 }, { c: CIT, z: 'cidadela', n: 'Cidadela do Cisma', R: 34 }, { c: FARM, z: 'sitio', n: 'Sítio de Solmira', R: 24 }];
  const ICON = { master: '📘', healer: '✚', shop: '🛒', guard: '🛡️', watch: '👁️', elder: '🧓', farm: '🌾', smith: '⚒️', warp: '🧭' };
  function build() {
    if (base) return;
    const W = WX * 2, H = WZ * 2; base = document.createElement('canvas'); base.width = W; base.height = H;
    const x = base.getContext('2d'), img = x.createImageData(W, H), c = new THREE.Color();
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const wx = i - WX + 0.5, wz = j - WZ + 0.5; groundColor(wx, wz, height(wx, wz), c); if (isWater(wx, wz)) c.set(0x3f94e0);
      if (onBridge(wx, wz)) c.set(0x8a6a48);
      const o = (j * W + i) * 4; img.data[o] = c.r * 255; img.data[o + 1] = c.g * 255; img.data[o + 2] = c.b * 255; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  }
  // área mostrada (em coordenadas do mundo)
  const area = () => { if (view) return { x0: view.c.x - view.R * 1.6, z0: view.c.z - view.R, w: view.R * 3.2, h: view.R * 2 }; const M = curMap(); return { x0: M.x0, z0: M.z0, w: M.w, h: M.h }; };
  const places = () => curMap().places || PLACES, cities = () => curMap().cities || CITIES;
  const npcsOf = v => NPCS.filter(n => !n.hidden && Math.hypot(n.x - v.c.x, n.z - v.c.z) < v.R * 1.5);
  function show(city) {
    if (inTower(P.z)) { log('Dentro da Torre o mapa grande não funciona.', 'sys'); return; }
    build();
    if (!box) {
      box = document.createElement('div'); box.id = 'bigmap';
      box.innerHTML = '<div class="bm-in"><div class="bm-t"><button class="bm-back">← Reino</button><span class="bm-n">🗺️ Mapa do Reino</span><button class="bm-x" title="Fechar">✕</button></div><div class="bm-body"><canvas></canvas><div class="bm-list"></div></div><div class="bm-leg"></div></div>';
      $('hud').appendChild(box); cv = box.querySelector('canvas'); g = cv.getContext('2d');
      box.addEventListener('click', e => {
        if (e.target.closest('.bm-x') || e.target === box) { Audio8.sfx('click'); hide(); return; }
        if (e.target.closest('.bm-back')) { Audio8.sfx('click'); show(null); return; }
        const it = e.target.closest('[data-npc]'); if (it) { const n = NPCS[+it.dataset.npc]; go(n.x, n.z, n.name); return; }
      });
      cv.addEventListener('click', e => {
        const r = cv.getBoundingClientRect(), A = area(), wx = A.x0 + (e.clientX - r.left) / r.width * A.w, wz = A.z0 + (e.clientY - r.top) / r.height * A.h;
        if (!view) { const c = cities().find(c => Math.hypot(wx - c.c.x, wz - c.c.z) < 14); if (c) { Audio8.sfx('click'); show(c); return; } }
        if (view) { const n = npcsOf(view).find(n => Math.hypot(n.x - wx, n.z - wz) < 2.5); if (n) { go(n.x, n.z, n.name); return; } }
        if (blocked(wx, wz) && !inTower(wz)) { let ok = false; for (let i = 1; i < 8 && !ok; i++) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, x = wx + Math.cos(a) * i, z = wz + Math.sin(a) * i; if (!blocked(x, z)) { go(x, z, 'o ponto marcado'); ok = true; break; } } if (!ok) log('Não dá para chegar aí.', 'bad'); return; }
        go(wx, wz, 'o ponto marcado');
      });
    }
    view = city || null;
    box.querySelector('.bm-back').style.display = view ? '' : 'none';
    box.querySelector('.bm-n').textContent = view ? '🏘️ ' + view.n : inVal(P.z) ? '🗺️ Terras de Valdora' : '🗺️ Mapa do Reino';
    box.querySelector('.bm-back').textContent = inVal(P.z) ? '← Valdora' : '← Reino';
    const list = box.querySelector('.bm-list');
    if (view) { list.style.display = ''; list.innerHTML = '<h4>Moradores</h4>' + npcsOf(view).map(n => `<div class="bm-npc" data-npc="${NPCS.indexOf(n)}"><span>${ICON[n.id] || '•'}</span><b>${n.name}</b><em>ir ›</em></div>`).join('') || '<i>Ninguém aqui.</i>'; }
    else list.style.display = 'none';
    box.querySelector('.bm-leg').innerHTML = view ? '<span>Toque num morador (lista ou mapa) e o personagem vai sozinho até ele.</span>' : '<span>👆 toque num ponto: o personagem vai sozinho · toque numa cidade: abre o mapa dela</span><span><i style="background:#ffcf40"></i>NPC</span><span><i style="background:#ff8080"></i>monstro</span><span><i style="background:#ff3030"></i>chefe</span><span><i style="background:#6ab0ff"></i>jogador</span>';
    const A = area(), listW = view ? Math.min(220, innerWidth * 0.3) : 0;
    const r = Math.min((innerWidth - 40 - listW) / A.w, (innerHeight - 100) / A.h);
    cv.width = Math.round(A.w * r * (devicePixelRatio > 1 ? 1.5 : 1)); cv.height = Math.round(cv.width * A.h / A.w);
    cv.style.width = Math.round(A.w * r) + 'px'; cv.style.height = Math.round(A.h * r) + 'px';
    box.classList.remove('hidden'); open = true; draw();
  }
  function go(x, z, name) {
    Audio8.sfx('click'); hide();
    P.qGo = { x, z, name }; log(`🧭 Indo até <b>${name}</b>. Mexa o joystick para parar.`, 'sys');
    if (typeof autoStart === 'function') autoStart(); $('quest').dataset.h = '';
  }
  function hide() { if (box) box.classList.add('hidden'); open = false; }
  function draw() {
    if (!open) return;
    const A = area(), k = cv.width / A.w, X = x => (x - A.x0) * k, Z = z => (z - A.z0) * k, u = view ? 3 : 1;
    const M = curMap(), B = M.base || base; g.imageSmoothingEnabled = true; g.drawImage(B, (A.x0 - M.x0) * B.width / M.w, (A.z0 - M.z0) * B.height / M.h, A.w * B.width / M.w, A.h * B.height / M.h, 0, 0, cv.width, cv.height);
    g.textAlign = 'center';
    if (!view) {
      g.font = `800 ${Math.round(9 * k)}px Nunito, sans-serif`;
      for (const [p, n] of places()) { const w = g.measureText(n).width / 2 + 4, lx = Math.min(cv.width - w, Math.max(w, X(p.x))), ly = Math.max(12 * k, Z(p.z) - 9 * k); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText(n, lx + 1, ly + 1); g.fillStyle = '#f7e2a8'; g.fillText(n, lx, ly); }
      for (const c of cities()) { g.strokeStyle = 'rgba(247,226,168,.75)'; g.lineWidth = 1.5; g.setLineDash([4, 3]); g.beginPath(); g.arc(X(c.c.x), Z(c.c.z), 12 * k, 0, TAU); g.stroke(); g.setLineDash([]); }
    }
    for (const m of mobs) { if (m.x < A.x0 || m.x > A.x0 + A.w || m.z < A.z0 || m.z > A.z0 + A.h) continue; const s = (m.d.boss ? 3.2 : m.d.alfa ? 2.4 : 1.3) * k / u * (view ? 1.6 : 1); g.fillStyle = m.d.boss ? '#ff3030' : m.d.alfa ? '#ffcf40' : '#ff8080'; g.beginPath(); g.arc(X(m.x), Z(m.z), s, 0, TAU); g.fill(); }
    for (const n of NPCS) {
      if (n.hidden) continue;
      if (view) { const x = X(n.x), z = Z(n.z); g.font = `${Math.round(13 * k / 2.2)}px sans-serif`; g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.arc(x, z, 7 * k / 2.2, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillText(ICON[n.id] || '•', x, z + 4 * k / 2.2); }
      else { g.fillStyle = '#ffcf40'; g.fillRect(X(n.x) - 1.5 * k, Z(n.z) - 1.5 * k, 3 * k, 3 * k); }
    }
    if (typeof Net !== 'undefined' && Net.peers) for (const r of Net.peers()) { g.fillStyle = '#6ab0ff'; g.beginPath(); g.arc(X(r.x), Z(r.z), 2.2 * k / u, 0, TAU); g.fill(); }
    const qt = questTarget(), px = X(P.x), pz = Z(P.z);
    if (qt) {
      const tx = X(qt.x), tz = Z(qt.z), q = k / u;
      g.save(); g.setLineDash([4 * q, 3 * q]); g.strokeStyle = 'rgba(255,207,64,.9)'; g.lineWidth = 1.5 * q; g.beginPath(); g.moveTo(px, pz); g.lineTo(tx, tz); g.stroke();
      g.setLineDash([]); g.fillStyle = '#ffcf40'; g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i < 10; i++) { const r = (i % 2 ? 2.2 : 5.5) * q, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(tx + Math.cos(a) * r, tz + Math.sin(a) * r); }
      g.closePath(); g.fill(); g.stroke(); g.restore();
    }
    g.save(); g.translate(px, pz); g.rotate(-P.face + Math.PI); g.scale(k / u * (view ? 1.8 : 1), k / u * (view ? 1.8 : 1));
    g.fillStyle = '#fff'; g.strokeStyle = '#ff4fa3'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -5); g.lineTo(3.4, 3.4); g.lineTo(-3.4, 3.4); g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  return { show: () => show(null), hide, draw, get open() { return open; } };
})();
function questTarget() {
  if (typeof Quests !== 'undefined') { if (inTower(P.z)) return null; const t = Quests.target(); return t && inVal(t.z) !== inVal(P.z) ? (inVal(P.z) ? { x: VGATE_V.x, z: VGATE_V.z + 4, name: 'Passagem do Norte' } : { x: VGATE_R.x, z: VGATE_R.z - 4, name: 'Passagem do Norte' }) : t; }
  const q = QUESTS[P.quest]; if (!q || inTower(P.z)) return null;
  if (P.qcount >= q.n) { const n = NPCS.find(n => n.id === 'master'); return { x: n.x, z: n.z }; }
  let best = null, bd = 1e9;
  for (const m of mobs) if (m.type === q.mob) { const d = Math.hypot(m.x - P.x, m.z - P.z); if (d < bd) { bd = d; best = m; } }
  if (best) return { x: best.x, z: best.z };
  const sp = SPAWNS.find(s => s.type === q.mob); if (!sp) return null;
  return sp.at ? { x: sp.at.x, z: sp.at.z } : { x: (sp.area[0] + sp.area[1]) / 2, z: (sp.area[2] + sp.area[3]) / 2 };
}
const qArrow = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  for (let k = 0; k < 3; k++) {                       // três setas (›››), com brilho
    const x = 40 + k * 66, a = 0.45 + k * 0.27;
    g.save(); g.shadowColor = 'rgba(255,200,90,1)'; g.shadowBlur = 18; g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = `rgba(255,214,120,${a})`; g.lineWidth = 16;
    g.beginPath(); g.moveTo(x, 26); g.lineTo(x + 38, 64); g.lineTo(x, 102); g.stroke(); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  m.geometry.rotateX(-Math.PI / 2); m.geometry.rotateY(-Math.PI / 2);   // seta aponta para +z
  m.renderOrder = 6; scene.add(m); return m;
})();
function updateQuestArrow() {
  const t = running && !P.dead ? questTarget() : null, d = t ? Math.hypot(t.x - P.x, t.z - P.z) : 0;
  qArrow.visible = !!t && d > 5;
  if (!qArrow.visible) return;
  const a = Math.atan2(t.x - P.x, t.z - P.z), slide = (time * 1.2) % 1;
  const r = 2.0 + slide * 0.5, x = P.x + Math.sin(a) * r, z = P.z + Math.cos(a) * r;
  qArrow.position.set(x, (inTower(P.z) ? P.y : groundY(x, z)) + 0.12, z);
  qArrow.rotation.y = a;
  qArrow.material.opacity = 0.55 + 0.45 * Math.sin(slide * Math.PI);
}
const REINO_MAP = { x0: -WX, z0: -WZ, w: WX * 2, h: WZ * 2 };
function curMap() { return inVal(P.z) && typeof Valdora !== 'undefined' ? Valdora.map : REINO_MAP; }
function drawMinimap() {
  const M = curMap(), sx = mm.width / M.w, sz = mm.height / M.h;
  mg.drawImage(M.mm || mmBase, 0, 0, mm.width, mm.height);
  for (const m of mobs) { const k = m.d.boss ? 4 : m.d.alfa ? 3 : 2; mg.fillStyle = m.d.boss ? '#ff3030' : m.d.alfa ? '#ffcf40' : '#ff8080'; mg.fillRect((m.x - M.x0) * sx - 1, (m.z - M.z0) * sz - 1, k, k); }
  if (inTower(P.z)) { if (zoneOf(P.x, P.z) === 'casa') { mg.fillStyle = '#2a1e14'; mg.fillRect(0, 0, mm.width, mm.height); mg.fillStyle = '#f2c86a'; mg.font = 'bold 16px Georgia'; mg.textAlign = 'center'; mg.fillText('🏠 Sua Casa', mm.width / 2, mm.height / 2 + 6); mg.textAlign = 'left'; return; } Tower.minimap(mg); return; }
  if (!inVal(P.z)) Kvx.minimap(mg, sx, sz);
  for (const n of NPCS) { const mk = n.markK || '', nw = mk.startsWith('!'), rd = mk.startsWith('?') && !mk.endsWith('#7a7a88'), s = nw || rd ? 5 : 3; mg.fillStyle = nw ? '#7dff6a' : rd ? '#6ab0ff' : '#ffcf40'; mg.fillRect((n.x - M.x0) * sx - s / 2, (n.z - M.z0) * sz - s / 2, s, s); }
  const px = (P.x - M.x0) * sx, pz = (P.z - M.z0) * sz;
  const qt = questTarget();
  if (qt) {                                                     // destino da missão: linha tracejada e estrela dourada
    const tx = (qt.x - M.x0) * sx, tz = (qt.z - M.z0) * sz;
    mg.save(); mg.setLineDash([3, 3]); mg.strokeStyle = 'rgba(255,207,64,.85)'; mg.lineWidth = 1.5; mg.beginPath(); mg.moveTo(px, pz); mg.lineTo(tx, tz); mg.stroke();
    mg.setLineDash([]); mg.fillStyle = '#ffcf40'; mg.strokeStyle = '#000'; mg.beginPath();
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 2.5 : 6, a = k * Math.PI / 5 - Math.PI / 2; mg.lineTo(tx + Math.cos(a) * r, tz + Math.sin(a) * r); }
    mg.closePath(); mg.fill(); mg.stroke(); mg.restore();
  }
  mg.save(); mg.translate(px, pz); mg.rotate(-P.face + Math.PI);
  mg.fillStyle = '#fff'; mg.strokeStyle = '#ff4fa3'; mg.lineWidth = 1.5;
  mg.beginPath(); mg.moveTo(0, -6); mg.lineTo(4, 4); mg.lineTo(-4, 4); mg.closePath(); mg.fill(); mg.stroke();
  mg.restore();
}
function useHot(id) {
  if (!(P.inv[id] > 0)) { log(`Sem ${ITEMS[id].name}.`, 'bad'); return; }
  if (ITEMS[id].use === 'tp') return useWing(id);
  if (ITEMS[id].use === 'pot') return usePotion(id);
  if (typeof Vida !== 'undefined' && Vida.use) { Vida.use(id); buildHotbar(); }
}
// toque que funciona mesmo com outro dedo no joystick (o 'click' do iPhone falha com dois dedos)
function tapOn(el, fn) { el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Audio8.init(); fn(); }); }
// ---------------- Asas (estilo Ragnarok): Mosca = salto aleatório no mesmo mapa/andar; Borboleta = volta para a cidade (3 s, quebra se apanhar)
function useWing(id) {
  if (P.dead || dialogOpen) return;
  if (!(P.inv[id] > 0)) { log(`Sem ${ITEMS[id].name}. O Mercador vende.`, 'bad'); return; }
  const zn = zoneOf(P.x, P.z);
  if (zn === 'casa') { log('Aqui dentro não dá para usar asas.', 'sys'); return; }
  if (id === 'asa_mosca') {
    let tx = null, tz = null;
    if (inTower(P.z)) { const f = floorAt(P.x, P.z); for (let i = 0; i < 40 && f; i++) { const a = rand(0, TAU), r = rand(2, f.r - 3), x = f.x + Math.cos(a) * r, z = f.z + Math.sin(a) * r; if (!blocked(x, z)) { tx = x; tz = z; break; } } }
    else for (let i = 0; i < 60; i++) { const a = rand(0, TAU), r = rand(15, 55), x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r; if ((inVal(P.z) ? inVal(z) : Math.abs(x) < WX - 8 && Math.abs(z) < WZ - 8) && !blocked(x, z) && !isWater(x, z) && zoneOf(x, z) === zn) { tx = x; tz = z; break; } }
    if (tx === null) { log('A Asa de Mosca não achou lugar para pousar. Tente de novo.', 'sys'); return; }
    P.inv[id]--; burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0x9ad0ff, 24, 3, 0.6);
    P.x = tx; P.z = tz; P.y = groundY(tx, tz); P.vy = 0; camS.x = P.x; camS.z = P.z;
    Audio8.sfx('warp'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0x9ad0ff, 24, 3, 0.6); if (typeof autoStop === 'function') autoStop('');
    buildHotbar(); return;
  }
  if (P.wingT > 0) return;
  P.wingT = 3; P.wingMax = 3; Audio8.sfx('buff'); log('🦋 Asa de Borboleta: conjurando… não leve golpes por 3 segundos!', 'sys');
}
function wingTick(dt) {
  let bar = $('castbar');
  if (!(P.wingT > 0)) { if (bar) bar.classList.add('hidden'); return; }
  if (!bar) { bar = document.createElement('div'); bar.id = 'castbar'; bar.innerHTML = '<span>🦋 Voltando para a cidade…</span><i><b></b></i>'; $('hud').appendChild(bar); }
  bar.classList.remove('hidden'); P.wingT -= dt; bar.querySelector('b').style.width = Math.min(100, (1 - P.wingT / P.wingMax) * 100) + '%';
  if (Math.random() < 0.3) burst(new THREE.Vector3(P.x + rand(-0.6, 0.6), P.y + rand(0.2, 1.8), P.z + rand(-0.6, 0.6)), 0xffc0f0, 1, 1, 0.6);
  if (P.wingT <= 0) {
    P.wingT = 0; if (!(P.inv.asa_borboleta > 0) || P.dead) return;
    P.inv.asa_borboleta--;
    const h = homePos();
    P.x = h.x; P.z = h.z; P.y = groundY(P.x, P.z); P.vy = 0; camS.x = P.x; camS.z = P.z;
    Audio8.sfx('warp'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xffc0f0, 40, 4, 0.9); log('🦋 Você voltou para a cidade.', 'gold');
    if (typeof autoStop === 'function') autoStop(''); buildHotbar();
  }
}
function homePos() {
  return P.home === 'kharum' ? { x: OAS.x - 4, z: OAS.z - 22 } : P.home === 'cidadela' ? { x: CIT.x - 6, z: CIT.z + 8 } : P.home === 'acampamento' ? { x: VCAMP.x, z: VCAMP.z + 4 } : { x: VIL.x, z: VIL.z + 10 };
}
function breakCast() { if (P.wingT > 0) { P.wingT = 0; log('🦋 A conjuração da Asa de Borboleta foi interrompida!', 'bad'); Audio8.sfx('miss'); } }
// ---------------- barra de atalhos (como no Ragnarok): 2 barras de 6, lado a lado; o jogador escolhe o que vai em cada espaço
// P.bar[i] = 's:<id da habilidade>' | 'i:<id do item>' | null. Teclas: barra 1 = 1 a 6, barra 2 = Q E R T Y U.
const BAR_N = 12, BAR_KEYS = ['1', '2', '3', '4', '5', '6', 'Q', 'E', 'R', 'T', 'Y', 'U'];
let barEdit = false;
function ensureBar() {
  if (Array.isArray(P.bar) && P.bar.length === BAR_N) return P.bar;
  const l = SKILLS.filter(tierOk).map(s => 's:' + s.id).concat((P.hot || ['red', 'blue']).filter(id => ITEMS[id]).map(id => 'i:' + id));
  P.bar = Array.from({ length: BAR_N }, (_, i) => l[i] || null);
  return P.bar;
}
// põe (ou tira) uma habilidade/item no 1º espaço livre — usado pela mochila e pela árvore de habilidades
function barToggle(e) {
  const b = ensureBar(), i = b.indexOf(e);
  if (i >= 0) { b[i] = null; buildHotbar(); return false; }
  const j = b.indexOf(null); if (j < 0) { log('As duas barras de atalho estão cheias. Toque em ✏️ para trocar um espaço.', 'bad'); Audio8.sfx('miss'); return null; }
  b[j] = e; buildHotbar(); return true;
}
function barUse(e) {
  if (!e) return;
  if (e.startsWith('s:')) { const i = SKILLS.findIndex(s => s.id === e.slice(2)); if (i >= 0 && tierOk(SKILLS[i])) useSkill(i); }
  else if (e.startsWith('i:') && ITEMS[e.slice(2)]) useHot(e.slice(2));
}
// escolher o que vai num espaço
function barPick(i) {
  const b = ensureBar(), opts = [];
  SKILLS.forEach(s => { if (tierOk(s) && P.skillLv[s.id] > 0) opts.push({ label: `${s.icon} ${s.name}${b[i] === 's:' + s.id ? ' ✔' : ''}`, fn: () => { const o = b.indexOf('s:' + s.id); if (o >= 0) b[o] = null; b[i] = 's:' + s.id; buildHotbar(); } }); });
  Object.keys(ITEMS).filter(id => (ITEMS[id].use || ITEMS[id].heal || id === 'red' || id === 'blue') && P.inv[id] > 0).forEach(id => opts.push({ label: `${ITEMS[id].ic || '🧪'} ${ITEMS[id].name} ×${P.inv[id]}${b[i] === 'i:' + id ? ' ✔' : ''}`, fn: () => { const o = b.indexOf('i:' + id); if (o >= 0) b[o] = null; b[i] = 'i:' + id; buildHotbar(); } }));
  opts.push({ label: '⬜ Deixar vazio', fn: () => { b[i] = null; buildHotbar(); } }, { label: 'Fechar' });
  dialog(`✏️ Atalho ${BAR_KEYS[i]} (barra ${i < 6 ? 1 : 2})`, 'Escolha o que fica neste espaço. Quando terminar, toque em ✏️ de novo.', opts);
}
function buildHotbar() {
  const hb = $('hotbar'); hb.innerHTML = ''; const old = $('hotbar2'); if (old) old.remove();
  const b = ensureBar();
  for (let g = 0; g < 2; g++) {
    const grp = document.createElement('div'); grp.className = 'hbg' + (barEdit ? ' edit' : ''); hb.appendChild(grp);
    for (let i = g * 6; i < g * 6 + 6; i++) {
      const e = b[i], el = document.createElement('div'); el.className = 'slot';
      const k = `<span class="k">${BAR_KEYS[i]}</span>`;
      if (e && e.startsWith('s:') && SKILLS.some(s => s.id === e.slice(2))) {
        const si = SKILLS.findIndex(s => s.id === e.slice(2)), s = SKILLS[si], lv = P.skillLv[s.id] || 0;
        el.dataset.skill = si; el.title = `${s.name} (Nv ${s.lv}, ${s.sp} SP)\n${s.desc}`;
        el.innerHTML = `<span class="ic">${s.icon}</span>${k}${lv ? `<span class="slv">${lv}</span>` : ''}<span class="cost">${lv && tierOk(s) ? scaleSkill(s, lv).sp : '🔒'}</span><div class="cd"></div>`;
      } else if (e && e.startsWith('i:') && ITEMS[e.slice(2)]) {
        const id = e.slice(2); el.className = 'slot pot ' + id; el.title = ITEMS[id].name;
        el.innerHTML = `<span class="ic">${ITEMS[id].ic || (id === 'red' ? '🧪' : '💧')}</span>${k}<span class="cost">x${P.inv[id] || 0}</span>`;
        if (!(P.inv[id] > 0)) el.style.opacity = 0.45;
      } else { el.className = 'slot vazio'; el.innerHTML = `<span class="ic">${barEdit ? '+' : ''}</span>${k}`; }
      tapOn(el, () => barEdit || !e ? barPick(i) : barUse(e));
      grp.appendChild(el);
    }
  }
  const ed = document.createElement('div'); ed.className = 'slot hbedit' + (barEdit ? ' on' : ''); ed.title = 'Editar atalhos'; ed.innerHTML = '<span class="ic">✏️</span>';
  tapOn(ed, () => { barEdit = !barEdit; Audio8.sfx('click'); if (barEdit) log('✏️ Toque num espaço da barra para escolher a habilidade ou o item. Toque em ✏️ de novo para terminar.', 'sys'); buildHotbar(); });
  hb.appendChild(ed);
}
function renderStats() {
  const w = $('statwin');
  const row = k => `<div class="srow"><span class="sl">${STAT_NAMES[k]}</span><b>${P[k]}</b><button data-st="${k}" ${P.statPts ? '' : 'disabled'}>+</button><span class="si">${STAT_INFO[k]}</span></div>`;
  const html = `<div class="wt">📊 ${className(P.cls, P.gender)} · Nv ${P.lv}<button class="x" data-close>×</button></div>
    <div class="pts${P.statPts ? ' tem' : ''}">Pontos para distribuir: <b>${P.statPts}</b>${P.statPts ? ' · toque em <b>+</b>' : ' · ganhe mais subindo de nível'}</div>
    <div class="sgrid">${STAT_KEYS.map(row).join('')}</div>
    <div class="derived">ATQ <b>${stats.atk()}</b> · MATQ <b>${stats.matk()}</b> · DEF <b>${stats.def()}</b> · Ataques/s <b>${(1 / stats.aspd()).toFixed(2)}</b> · Esquiva <b>${Math.round(stats.flee() * 100)}%</b> · Crítico <b>${Math.round(stats.crit() * 100)}%</b></div>`;
  if (w.dataset.h !== html) { w.innerHTML = html; w.dataset.h = html; }
}
$('statwin').addEventListener('click', e => { const b = e.target.closest('[data-close]'); if (b) toggleStats(); });
// segurar o + vai adicionando sozinho (cada vez mais rápido)
let statHold = null;
const addStat = k => { if (k && P.statPts > 0) { P[k]++; P.statPts--; Audio8.sfx('click'); renderStats(); return true; } return false; };
$('statwin').addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-st]'); if (!b) return; e.preventDefault();
  const k = b.dataset.st; if (!addStat(k)) return;
  let wait = 380; const tick = () => { if (!addStat(k)) return stopHold(); wait = Math.max(60, wait * 0.8); statHold = setTimeout(tick, wait); };
  statHold = setTimeout(tick, wait);
});
const stopHold = () => { clearTimeout(statHold); statHold = null; };
addEventListener('pointerup', stopHold); addEventListener('pointercancel', stopHold);
function toggleStats() { $('skillwin').classList.add('hidden'); $('statwin').classList.toggle('hidden'); renderStats(); }

// ---------------------------------------------------------------- árvore de habilidades
const SK_MAX = 5;
// estrutura igual para todas as classes: [inicial] → [ramo A, ramo B] → [final]
const SK_REQ = [[], [[0, 2]], [[0, 3]], [[1, 3], [2, 2]], [[3, 1]], [[4, 2]], [[5, 2]], [[6, 3]]];
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
function reqMet(i) { return tierOk(SKILLS[i]) && (SK_REQ[i] || []).every(([j, lv]) => (P.skillLv[SKILLS[j].id] || 0) >= lv); }
function canLearn(i) { const s = SKILLS[i]; return P.skillPts > 0 && (P.skillLv[s.id] || 0) < SK_MAX && P.lv >= s.lv && reqMet(i); }
function learn(i) {
  if (!canLearn(i)) return;
  const s = SKILLS[i]; P.skillLv[s.id] = (P.skillLv[s.id] || 0) + 1; P.skillPts--;
  Audio8.sfx(P.skillLv[s.id] === 1 ? 'buff' : 'click');
  if (P.skillLv[s.id] === 1) { log(`✨ Você aprendeu <b>${s.icon} ${s.name}</b>!`, 'gold'); if (!ensureBar().includes('s:' + s.id) && ensureBar().includes(null)) ensureBar()[ensureBar().indexOf(null)] = 's:' + s.id; }
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
    if (!tierOk(s)) reqs.push(`${s.tier === 1 ? '2ª' : '3ª'} classe (${TIERS[P.cls][s.tier]})`);
    for (const [j, lv] of (SK_REQ[i] || [])) if ((P.skillLv[SKILLS[j].id] || 0) < lv) reqs.push(`${SKILLS[j].name} Nv ${lv}`);
    return `<div class="snode ${cls} ${L ? 'learned' : ''} ${reqs.length && !L ? 'locked' : ''}">
      <span class="si2">${s.icon}</span>
      <div class="sb"><div class="sn">${s.name}</div><div class="sl2">Nível ${L}/${SK_MAX}</div>
      <div class="sd">${s.desc}<br>${L ? 'Atual: ' + describe(s, L) : 'Nv 1: ' + describe(s, 1)}${L && L < SK_MAX ? '<br>Próximo: ' + describe(s, L + 1) : ''}</div>
      ${reqs.length ? `<div class="req">Requer: ${reqs.join(', ')}</div>` : ''}</div>
      <button data-learn="${i}" ${canLearn(i) ? '' : 'disabled'}>+</button>${L && tierOk(s) ? `<button class="spin" data-pin="${i}" title="Pôr/tirar da barra de atalhos">${ensureBar().includes('s:' + s.id) ? '✖' : '📌'}</button>` : ''}</div>`;
  };
  const html = `<div class="wt">📜 Habilidades — ${className(P.cls, P.gender)} <button class="x" data-close>×</button></div>
    <div class="spts">Pontos de habilidade: <b style="color:#f2c86a">${P.skillPts}</b> <small>(ganhe 1 por nível)</small></div>
    <div class="stier">1ª classe — <b>${TIERS[P.cls] ? TIERS[P.cls][0] : ''}</b></div>
    <div class="stree">${node(0, 'root')}<div class="sarrow">▼ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ▼</div>${node(1, '')}${node(2, '')}<div class="sarrow">▼</div>${node(3, 'ult')}</div>
    ${SKILLS.length > 4 ? `<div class="stier ${(P.tier || 0) >= 1 ? '' : 'off'}">2ª classe — <b>${TIERS[P.cls][1]}</b> ${(P.tier || 0) >= 1 ? '✅' : '<small>🔒 provação a partir do nível 20 (fale com o Vigia Morvan, na Cidadela)</small>'}</div>
    <div class="stree">${node(4, '')}${node(5, '')}</div>
    <div class="stier ${(P.tier || 0) >= 2 ? '' : 'off'}">3ª classe — <b>${TIERS[P.cls][2]}</b> ${(P.tier || 0) >= 2 ? '✅' : '<small>🔒 provação a partir do nível 40</small>'}</div>
    <div class="stree">${node(6, '')}${node(7, 'ult')}</div>` : ''}`;
  if (w.dataset.h !== html) { w.innerHTML = html; w.dataset.h = html; }
}
$('skillwin').addEventListener('click', e => {
  if (e.target.closest('[data-close]')) return toggleSkills();
  const b = e.target.closest('[data-learn]'); if (b) learn(+b.dataset.learn);
  const pn = e.target.closest('[data-pin]'); if (pn) { const s = SKILLS[+pn.dataset.pin], r = barToggle('s:' + s.id); Audio8.sfx('click'); if (r === true) log(`📌 <b>${s.name}</b> foi para a barra de atalhos.`, 'sys'); renderSkills(); }
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
  if (typeof Quests !== 'undefined' && Quests.talk(n, () => talkBase(n))) return;
  talkBase(n);
}
function talkBase(n) {
  const nm = `💬 ${n.name}`, eu = P.name, bv = P.gender === 'm' ? 'Bem-vindo' : 'Bem-vinda', heroi = P.gender === 'm' ? 'herói' : 'heroína';
  switch (n.id) {
    case 'healer':
      dialog(nm, `Que a luz guie seus passos, <b>${eu}</b>. Deixe-me cuidar de você.`, [
        { label: '✚ Curar (grátis)', fn: () => { P.hp = stats.maxHp(); P.sp = stats.maxSp(); Audio8.sfx('heal'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xcfe8ff, 25, 3, 1); log(`${n.name} restaurou seu HP e SP.`, 'item'); } },
        { label: 'Até logo' }]); break;
    case 'shop': {
      const shop = () => dialog(nm, `${bv}, <b>${eu}</b>! Poções fresquinhas.<br><small>Coroas: <b>${P.zeny} cr</b> · 🧪 ${P.inv.red} · 💧 ${P.inv.blue}</small>`, [
        { label: `🧪 Poção Vermelha — 25 cr`, fn: () => { buy('red', 1); shop(); return true; } },
        { label: `🧪×10 — 250 cr`, fn: () => { buy('red', 10); shop(); return true; } },
        { label: `💧 Poção Azul — 90 cr`, fn: () => { buy('blue', 1); shop(); return true; } },
        { label: `🪰 Asa de Mosca — 300 cr cada (salto no mesmo mapa) · tem ${P.inv.asa_mosca || 0}`, fn: () => { qty('asa_mosca', shop); return true; } },
        { label: `🦋 Asa de Borboleta — 900 cr cada (volta à cidade) · tem ${P.inv.asa_borboleta || 0}`, fn: () => { qty('asa_borboleta', shop); return true; } },
        { label: `🧪 Poção Vermelha — quantidade…`, fn: () => { qty('red', shop); return true; } },
        { label: `💧 Poção Azul — quantidade…`, fn: () => { qty('blue', shop); return true; } },
        { label: '⚔️ Equipamentos', fn: () => { Vida.gearShop(); return true; } },
        { label: '💰 Vender materiais e colheita', fn: () => { Vida.sellAll(); shop(); return true; } },
        { label: 'Sair' }]);
      shop(); break;
    }
    case 'master': dialog(nm, `${bv}, <b>${eu}</b>. A Essência está vazando pelas rachaduras do Reino e as criaturas ficaram agitadas.<br>Cada cidade precisa de ajuda: fale com os moradores, leia os Quadros de Caça e explore. Dizem que há tesouros escondidos pelos mapas...<br><small>Dica: ${TOUCH ? 'toque 🧘' : 'aperte <b>X</b>'} para sentar e recuperar HP/SP mais rápido.</small>`); break;
    case 'refugee': dialog(nm, `Você... veio da Passagem? Ninguém vem <i>para</i> cá, ${eu}. Todo mundo foge.<br>Valdora caiu. As muralhas estão no chão, as torres queimam, e as <b>Sentinelas do Vazio</b> andam pelas ruas. No meio da praça desenharam com sangue um símbolo enorme: <b>três espinhos</b>.<br>A estrada até lá está tomada pelas <b>Raízes Negras</b>. Cuidado.`); break;
    case 'farm': P.farmSeen = 1; Vida.talkFarm(eu); break;
    case 'smith': Vida.smith(eu); break;
    case 'warp': if (typeof Quests !== 'undefined') Quests.warp(n.city); break;
    default: if (n.hidden) dialog(nm, 'Obrigado por ter vindo até aqui.'); break;
    case 'watch': if (typeof Evo !== 'undefined' && Evo.talk(eu)) break; dialog(nm, `${eu}, você chegou longe. Aquela é a <b>Torre do Cisma</b>. São <b>trinta andares</b> tomados pela Essência: <b>Larvas Alongadas</b>, <b>Larvas Encouraçadas</b>, <b>Fragmentos</b>, <b>Sentinelas</b>... Cada andar só libera a escada quando não sobra nenhum de pé.<br><br>No topo dorme <b>Kravenox</b>, gigante, o Soberano do Reino Quebrado. Ele desperta todo <b>sábado às 20h</b>. Leve amigos.<br><small>A entrada fica na base da torre, ao norte daqui.</small>`); break;
    case 'guard': dialog(nm, `Saudações, <b>${eu}</b>! Os Campos Dourados começam aqui, a leste. Cuidado com os <b>Ecos Famintos</b>: eles atacam quem chega perto!<br>Seguindo a estrada você chega às <b>Areias Rubras</b> e ao <b>Oásis de Kharum</b>.`); break;
    case 'elder': dialog(nm, `Sente-se, <b>${eu}</b>. Nas ruínas ao sudeste daqui vaga a <b>Sentinela sem Rosto</b>, uma armadura vazia tomada pelo Vazio.<br>Ela não sente medo nem dor e salta sobre quem foge. Volte quando estiver acima do nível 20, ou traga amigos.`); break;
  }
}
// escolher quanto comprar
function qty(id, back) {
  const pr = ITEMS[id].price, opts = [1, 5, 10, 25, 50].map(n => ({ label: `${n}× — ${(pr * n).toLocaleString('pt-BR')} cr`, fn: () => { buy(id, n); qty(id, back); return true; } }));
  const max = Math.floor(P.zeny / pr); if (max > 50) opts.push({ label: `Máximo (${max}×) — ${(pr * max).toLocaleString('pt-BR')} cr`, fn: () => { buy(id, max); qty(id, back); return true; } });
  opts.push({ label: '← Voltar', fn: () => { back(); return true; } });
  dialog(`${ITEMS[id].ic} ${ITEMS[id].name}`, `Quantos? <small>Tem ${P.inv[id] || 0} · Coroas: <b>${P.zeny.toLocaleString('pt-BR')} cr</b></small>`, opts);
}
function buy(id, n) {
  const c = Math.round(ITEMS[id].price * n * (1 - gBon('desc')));
  if (P.zeny < c) { log('Coroas insuficientes!', 'bad'); Audio8.sfx('miss'); return; }
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
  { const bi = BAR_KEYS.indexOf(k.toUpperCase()); if (bi >= 0) barUse(ensureBar()[bi]); }
  if (k === 'j' || k === 'k') attack();
  if (k === ' ') doJump();
  if (k === 'shift') doDash();
  if (k === 'f' && nearNpc) talk(nearNpc); else if (k === 'f' && nearUse) nearUse.fn();
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
  btn('t-talk', () => { if (nearNpc) talk(nearNpc); else if (nearUse) nearUse.fn(); });
  if (TOUCH) $('touch').classList.remove('hidden');
}
function toggleMusic() { const on = Audio8.toggleMusic(); $('btn-music').textContent = on ? '🎵' : '🔇'; }
const HELP_OPTS = () => [{ label: 'Fechar' }, { label: (() => { let o = true; try { o = localStorage.getItem('monstros3d') !== '0'; } catch (e) { } return o ? '👾 Monstros: 3D (trocar para desenho)' : '👾 Monstros: desenho (trocar para 3D)'; })(), fn: () => { try { localStorage.setItem('monstros3d', localStorage.getItem('monstros3d') === '0' ? '1' : '0'); } catch (e) { } save(); location.reload(); } }, { label: '🔄 Trocar de personagem', fn: () => { if (typeof Contas !== 'undefined') Contas.trocar(); } }, { label: '📢 Avisos, novidades e uso de internet', fn: () => { if (typeof Avisos !== 'undefined') Avisos.mostrar(true); } }, { label: '🚪 Sair da conta', fn: () => { save(); Nuvem.sair(); } }];
function showHelp() {
  const extra = `📜 <b>Missões:</b> 🟡 principal (a história), 🔵 secundárias (moradores), 🟢 caça (Quadros de Caça nas cidades, repetíveis) e 🟣 ocultas (escondidas pelo mapa). <b>!</b> na cabeça do NPC = missão nova; <b>?</b> = entregar. As ativas aparecem no canto direito.<br>
  📜 <b>Missões:</b> toque numa missão do quadro (direita) e o personagem anda sozinho até ela. Mexa o joystick para parar.<br>
  🎒 <b>Mochila:</b> abas por tipo; toque num item para ver de perto. Equipamentos em 8 espaços, troca e banca.<br>
  🃏 <b>Cartas:</b> caem raramente dos monstros; encaixe no tipo de peça indicado na carta.<br>
  ⚒️ <b>Ferreiro Doran</b> (praça de Solmira): refino +1 a +7 (nunca quebra) e forja com materiais.<br>
  ⭐ <b>Monstros Alfa:</b> de vez em quando um monstro maior aparece perto de você: dá para vencer sozinho e solta equipamento e carta com mais chance.<br>
  👹 <b>Chefes de campo:</b> a cada 20 min um chefe aparece para todos os jogadores (ponto vermelho grande). Sozinho não dá: chame um grupo. Agora: ${typeof Chefes !== 'undefined' ? Chefes.status() : '—'}.<br>
  🧭 <b>Viagem rápida:</b> nos Quadros de Caça, para cidades já visitadas (50 cr).<br>
  🌾 <b>Sítio:</b> a oeste da vila: plante, regue, crie animais e faça a encomenda do dia da Fazendeira.`;
  if (TOUCH) return dialog('📜 Como jogar', `
  🕹️ <b>Joystick</b> (esquerda) para andar · <b>arraste a tela</b> para girar a câmera<br>
  ⚔️ ataque · ⤴ pular · 💨 esquivar · 💬 falar / usar<br>
  Toque nos ícones de baixo para as habilidades e poções.<br><br>${extra}`, HELP_OPTS());
  dialog('📜 Como jogar', `
  <b>WASD</b> andar · <b>Arrastar o mouse</b> gira a câmera · <b>Roda</b> zoom<br>
  <b>Clique</b> ou <b>J</b> — ataque básico · <b>Espaço</b> pular · <b>Shift</b> esquiva<br>
  <b>1–4</b> habilidades · <b>Q</b> Poção Vermelha · <b>E</b> Poção Azul · <b>B</b> mochila<br>
  <b>F</b> falar / usar · <b>C</b> atributos · <b>K</b> habilidades · <b>X</b> sentar · <b>M</b> música<br><br>${extra}<br><br>
  Caminho: Solmira → Campos Dourados → Areias Rubras → Cidadela do Cisma. O jogo salva sozinho.`, HELP_OPTS());
}
function openChat() { $('chatbox').classList.remove('hidden'); $('chat-in').focus(); for (const k in keys) keys[k] = false; }
function sendChat() { const i = $('chat-in'); Net.say(i.value); i.value = ''; $('chatbox').classList.add('hidden'); i.blur(); setTimeout(fitScreen, 400); }
$('btn-chat').onclick = openChat;
$('chat-send').onclick = sendChat;
$('chat-in').addEventListener('blur', () => setTimeout(fitScreen, 400));
$('chat-in').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') sendChat(); if (e.key === 'Escape') { $('chatbox').classList.add('hidden'); e.target.blur(); } });
$('btn-stat').onclick = toggleStats; $('btn-skill').onclick = toggleSkills; $('btn-music').onclick = toggleMusic; $('btn-help').onclick = showHelp;
$('btn-sit').onclick = () => { P.sit = !P.sit; };

// ---------------------------------------------------------------- salvar
let SAVE_KEY = 'reino-slot-0';   // uma chave por vaga de personagem (contas.js)
function save() {
  if (!running) return;
  const keep = ['bar', 'towerCp', 'towerBest', 'qs', 'qFocus', 'evoMini', 'ui', 'hot', 'qGo', 'grave', 'graves', 'casa', 'cos', 'flag', 'pvpOn', 'pkCount', 'alfaKills', 'fb', 'fbDone', 'fieldKills', 'cards', 'refine', 'warps', 'secrets', 'tier', 'evo', 'bestiary', 'equip', 'qSeen', 'farmSeen', 'skillLv', 'skillPts', 'kvxWeek', 'kvxKills', 'title', 'name', 'race', 'cls', 'gender', 'hair', 'skin', 'dex', 'luk', 'lv', 'xp', 'zeny', 'statPts', 'str', 'agi', 'vit', 'int', 'hp', 'sp', 'inv', 'x', 'z', 'face', 'home', 'quest', 'qcount', 'best'];
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
    if (!CLASSES[P.cls] || !CLASSES[P.cls].hero) { P.cls = OLD_TO_HERO[P.cls] || 'kravenox'; P.gender = CLASSES[P.cls].gender; P.race = 'humano'; }
    if (inTower(P.z)) { if (zoneOf(P.x, P.z) === 'casa') { P.x = FARM.x - 11; P.z = FARM.z - 1; } else { P.x = CIT.x; P.z = CIT.z + 8; } }
    if (blocked(P.x, P.z)) { P.x = VIL.x; P.z = VIL.z + 10; }
  } else {
    Object.assign(P, CREATE, { name: $('name-in').value.trim().replace(/\s+/g, ' ').slice(0, 16) });
    const r = CLASSES[P.cls].hero ? {} : RACES[P.race].bonus, c = CLASSES[P.cls].bonus;
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
  SPAWNS.forEach((s, si) => { for (let i = 0; i < s.n; i++) { const m = spawnMob(s.type, s.area, s.at); m.nid = si + '-' + i; } });
  if (typeof Quests !== 'undefined') Quests.migrate();
  applyQuality(); running = true; if (typeof VFX !== 'undefined') setTimeout(() => VFX.warm(), 300); if (typeof Cos !== 'undefined') Cos.init(); if (typeof PvP !== 'undefined') PvP.init(); buildGraves(); Kvx.init(); if (typeof Partilha !== 'undefined') Partilha.init(); Net.init(); if (typeof Guilda !== 'undefined') Guilda.init(); buildHotbar(); if (typeof Vida !== 'undefined') Vida.init();
  const who = CLASSES[P.cls].hero ? `no papel de ${className(P.cls, P.gender)}` : `${className(P.cls, P.gender)} ${RACES[P.race].name.toLowerCase()}`;
  if (fromSave) log(`${P.gender === 'm' ? 'Bem-vindo' : 'Bem-vinda'} de volta, <b>${P.name}</b>!`, 'gold');
  else if (TOUCH) { log(`<b>${P.name}</b>, ${who}, chegou a Solmira! Fale com a <b>Mestra Odete</b> (toque 💬 perto dela).`, 'gold'); log('Toque ❓ para ver como jogar.', 'sys'); }
  else { log(`<b>${P.name}</b>, ${who}, chegou a Solmira! Fale com a <b>Mestra Odete</b> (aperte <b>F</b> perto dela).`, 'gold'); log('Aperte <b>H</b> para ver os controles.', 'sys'); }
}

// ---------------------------------------------------------------- criação de personagem
const CREATE = { race: 'humano', gender: 'm', cls: 'kravenox', hair: 0, skin: 0 };
function renderCreate() {
  const el = $('c-class'); el.innerHTML = '';
  for (const k of HEROES) {
    const C = CLASSES[k], b = document.createElement('button');
    b.className = 'chip' + (k === CREATE.cls ? ' on' : '');
    const src = window.SPR && SPR[C.portrait] ? 'data:image/png;base64,' + SPR[C.portrait] : '';
    b.innerHTML = `<img src="${src}" alt=""><span>${C.name.f}</span>`;
    b.onclick = () => { Audio8.init(); Audio8.play('title'); Audio8.sfx('click'); CREATE.cls = k; CREATE.gender = C.gender; renderCreate(); };
    el.appendChild(b);
  }
  const c = CLASSES[CREATE.cls];
  const st = STAT_KEYS.map(k => `${STAT_NAMES[k]} <b>${Math.max(1, 3 + (c.bonus[k] || 0))}</b>`).join(' · ');
  $('c-info').innerHTML = `<p><b>${c.name.f}:</b> ${c.role}</p>
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
// nome único no mundo inteiro: o servidor reserva o nome para esta conta e esta vaga
async function nameFree(v) {
  try { await Nuvem.nome(v, typeof Contas !== 'undefined' ? Contas.slot : 0); return true; }
  catch (e) { return e.message || false; }
}
let checking = false;
$('btn-new').onclick = async () => {
  if (checking || !nameOk()) return;
  const v = $('name-in').value.trim().replace(/\s+/g, ' ').slice(0, 16), btn = $('btn-new'), label = btn.textContent;
  checking = true; btn.textContent = '⏳ Conferindo o nome…';
  const ok = await nameFree(v);
  checking = false; btn.textContent = '✨ Novo Jogo';
  if (ok !== true) { $('name-in').classList.add('err'); $('name-in').value = ''; $('name-in').placeholder = typeof ok === 'string' ? ok : `"${v}" já existe. Escolha outro nome`; Audio8.sfx('miss'); return; }
  start(false); setTimeout(() => { save(); Nuvem.enviar(typeof Contas !== 'undefined' ? Contas.slot : 0); }, 2500); };
$('btn-cont').onclick = () => start(true);
renderCreate();
(function loadModels() {
  const btn = $('btn-new'), cont = $('btn-cont'), label = btn.textContent;
  btn.disabled = true; cont.disabled = true;
  Promise.all([ModelKit.load(p => { btn.textContent = `⏳ Carregando personagens… ${Math.round(p * 100)}%`; }), SpriteKit.load(), Props.load()]).then(([ok]) => {
    Props.decorate();
    btn.disabled = false; cont.disabled = false; btn.textContent = label;
    if (SpriteKit.ready) spriteNPCs(); else if (ok) upgradeNPCs();
    renderCreate();
  });
})();
$('btn-cont').style.display = 'none';
$('name-in').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-new').click(); });

// ---------------------------------------------------------------- loop
let last = performance.now();
P.y = groundY(P.x, P.z);
// no celular, 30 quadros por segundo: metade do trabalho da placa de vídeo, bem menos calor e bateria
const FRAME_MS = TOUCH ? 1000 / 30 : 0; let lastFrame = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden) return;
  if (FRAME_MS && now - lastFrame < FRAME_MS - 3) return;
  lastFrame = now;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (running && typeof Net !== 'undefined' && Net.pausa) {      // sem conexão: o mundo para (o jogo é todo on-line)
    Net.update(dt); sky.position.copy(camera.position); draw();
  } else if (running) {
    update(dt); if (typeof Chefes !== 'undefined') { Chefes.update(dt); Alfas.update(dt); } if (typeof Casa !== 'undefined') Casa.update(dt); if (typeof Cos !== 'undefined') Cos.update(dt); if (typeof PvP !== 'undefined') PvP.update(dt); evoCard(dt); bossBar(dt); wingTick(dt); railTick(dt); if (typeof VFX !== 'undefined') VFX.update(dt); animateLyra(dt); updateCamera(dt); SpriteKit.tick(dt); updateQuestArrow(); watchFps(dt);
    sky.position.copy(camera.position); draw();
    updateLabels(); updateHUD(); drawBeat(); drawMinimap(); if (BigMap.open) BigMap.draw();
  } else {
    // vitrine na tela de título
    time += dt; const ph = time % 4;
    if (CLS().rhythm) P.dance = ph < 1.2 ? 1 - ph / 1.2 : 0; else { P.dance = 0; P.cast = ph < 0.6 ? 1 - ph / 0.6 : 0; }
    P.moving = false; P.onGround = true;
    animateLyra(dt);
    if (window.INTRO) {                    // abertura: a câmera sobrevoa o mundo
      const t = time * 0.035, cx = -40 + Math.sin(t) * 95, cz = Math.sin(t * 1.7) * 45;
      camera.position.set(cx, height(cx, cz) + 16 + Math.sin(t * 2) * 3, cz);
      camera.lookAt(-40 + Math.sin(t + 0.25) * 95, height(cx, cz) + 6, Math.sin((t + 0.25) * 1.7) * 45);
      camera.clearViewOffset();
    } else {
      camera.position.set(P.x + Math.sin(time * 0.2) * 5, P.y + 1.8, P.z + Math.cos(time * 0.2) * 5);
      camera.lookAt(P.x, P.y + 1.1, P.z);
      camera.setViewOffset(VW, VH, VW * 0.2, 0, VW, VH);
    }
    sun.position.set(P.x + SUN_OFF.x, P.y + SUN_OFF.y, P.z + SUN_OFF.z); sun.target.position.set(P.x, P.y, P.z);
    sky.position.copy(camera.position); draw();
  }
}
requestAnimationFrame(loop);
