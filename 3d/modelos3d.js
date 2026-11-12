// =====================================================================
//  Monstros em 3D, com os modelos do jogo de plataforma do Kravenox
//  (kravenox-jogar/plataforma): larvas de segmentos com bocarra, ecos de
//  manto, sentinelas de armadura, raízes com tentáculos e o guerreiro de
//  cristal. Cada tipo é montado uma vez e "achatado" em poucas malhas
//  (uma por material), para o celular desenhar rápido.
// =====================================================================
'use strict';
const Modelos3D = (() => {
  const GEO = { sph: new THREE.SphereGeometry(1, 14, 10), box: new THREE.BoxGeometry(1, 1, 1), cone: new THREE.ConeGeometry(1, 1, 8), cyl: new THREE.CylinderGeometry(1, 1, 1, 10), crystal: new THREE.OctahedronGeometry(.22) };
  const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .75, metalness: 0 }, o));
  const B = c => new THREE.MeshBasicMaterial({ color: c });
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const addS = (parent, geo, mat, x, y, z, sx, sy, sz) => { const m = add(parent, geo, mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
  const MATX = { crystalV: M(0x1a0f28, { emissive: 0x8a4aff, emissiveIntensity: .7, roughness: .2, metalness: .3 }) };
  function makeLarva(o){ const g=new THREE.Group(), inner=new THREE.Group(); g.add(inner); const segs=[], n=o.long?8:6;
    const m1=M(o.c1,{roughness:.6}), m2=M(o.c2,{roughness:.5}), core=new THREE.MeshBasicMaterial({color:o.core||0xffaa5a,transparent:true,opacity:.8}), ring=M(0x141a12);
    for(let i=0;i<n;i++){ const t=i/(n-1), r=.25-t*.12, seg=new THREE.Group(); seg.position.set(-i*.2+.55,r,0); seg.userData.y=r; inner.add(seg);
      addS(seg,GEO.sph,m1,0,0,0,r*1.15,r,r); addS(seg,GEO.sph,m2,-r*.25,r*.5,0,r*.6,r*.32,r*.55,false); addS(seg,GEO.sph,core,0,-r*.05,r*.8,r*.38,r*.38,r*.2,false);
      if(i>0) add(seg,new THREE.TorusGeometry(r*.98,r*.08,4,12),ring,0,0,0,false).rotation.y=Math.PI/2;
      if(o.crystal&&i%2===0){ const c=addS(seg,GEO.crystal,MATX.crystalV,0,r*1.15,0,.7,1.8,.7,false); c.rotation.z=rand(-.3,.3); }
      if(o.armor&&i%2===1) addS(seg,new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),M(0x3a3640,{metalness:.5,roughness:.4}),0,r*.1,0,r*1.25,r*1.12,r*1.15);
      if(o.long&&i>0) [-1,1].forEach(z=>{ const l=addS(seg,GEO.cyl,m1,0,-r*.9,z*r*.5,.02,r*.9,.02,false); l.rotation.x=z*.5; });
      segs.push(seg); }
    const head=segs[0];
    add(head,new THREE.TorusGeometry(.13,.04,6,14),M(0x2a1410),.24,0,0,false).rotation.y=Math.PI/2;
    add(head,new THREE.CircleGeometry(.13,14),B(0x120404),.25,0,0,false).rotation.y=Math.PI/2;
    for(let k=0;k<7;k++){ const a=k/7*Math.PI*2, tt=addS(head,GEO.cone,M(0xf2ead8),.25,Math.sin(a)*.1,Math.cos(a)*.1,.02,.08,.02,false); tt.rotation.z=-Math.PI/2; }
    addS(head,GEO.sph,B(0xff3a2a),.1,.2,0,.06,.06,.06,false);
    return {g,inner,segs}; }
  // Ecos, Sombras e Lembranças: mantos com capuz, rosto escuro e olhos brilhando
  function makeGhost(o){ const g=new THREE.Group(), inner=new THREE.Group(); g.add(inner);
    const cl=M(o.c1,{roughness:.85,side:THREE.DoubleSide,transparent:!!o.glow,opacity:o.glow?.88:1,emissive:o.glow?o.c1:0x000000,emissiveIntensity:o.glow?.3:0});
    add(inner,new THREE.ConeGeometry(.36,1.0,12,1,true),cl,0,.5,0);
    const hem=new THREE.Group(); inner.add(hem); for(let k=0;k<9;k++){ const a=k/9*Math.PI*2, c=addS(hem,GEO.cone,cl,Math.cos(a)*.32,.02,Math.sin(a)*.32,.08,.2,.08,false); c.rotation.x=Math.PI; }
    addS(inner,GEO.sph,cl,0,1.02,0,.27,.29,.27); addS(inner,GEO.sph,B(0x07050a),0,.99,.11,.19,.21,.17,false);
    [-1,1].forEach(s=>{ addS(inner,GEO.sph,B(o.eye),s*.075,1.02,.27,.045,.045,.03,false); const sl=addS(inner,GEO.cone,cl,s*.3,.62,.12,.09,.42,.09); sl.rotation.z=s*.7; sl.rotation.x=-.4;
      addS(inner,GEO.sph,M(0x9a9aa8),s*.42,.45,.24,.05,.05,.05,false); });
    if(o.crystal) for(let k=0;k<3;k++){ const c=addS(inner,GEO.crystal,MATX.crystalV,rand(-.2,.2),rand(.3,.8),-.2,.5,1.2,.5,false); c.rotation.z=rand(-.5,.5); }
    return {g,inner,hem}; }
  // Sentinelas: armadura escura, viseira com brilho violeta e espada corroída
  function makeSentinel(o){ const g=new THREE.Group(), inner=new THREE.Group(); g.add(inner);
    const a1=M(o.c1,{metalness:.55,roughness:.45,emissive:o.trim||0x000000,emissiveIntensity:o.trim?.12:0}), a2=M(o.c2,{metalness:.5,roughness:.5}), glow=B(o.eye);
    [-1,1].forEach(s=>{ addS(inner,GEO.box,a2,s*.12,.25,0,.16,.5,.2); addS(inner,GEO.box,a1,s*.12,.04,.04,.18,.08,.28); });
    addS(inner,GEO.box,a1,0,.8,0,.5,.6,.32); addS(inner,GEO.box,a2,0,.62,.17,.32,.5,.02,false); addS(inner,GEO.box,glow,0,.72,.18,.04,.32,.01,false);
    [-1,1].forEach(s=>{ addS(inner,GEO.box,a1,s*.32,1.04,0,.2,.14,.32); addS(inner,GEO.box,a2,s*.32,.78,0,.12,.42,.14); });
    addS(inner,GEO.box,a1,0,1.28,0,.3,.32,.3);
    if(!o.faceless) addS(inner,GEO.box,glow,0,1.3,.155,.2,.04,.01,false);
    if(o.trim) [[0,1.45,.16,.32,.02],[0,.5,.17,.5,.02]].forEach(([x,y,z,w,h])=>addS(inner,GEO.box,B(o.trim),x,y,z,w,h,.01,false));
    const sw=new THREE.Group(); sw.position.set(.34,.58,.12); inner.add(sw);
    addS(sw,GEO.box,M(0x5a4e66,{metalness:.7,roughness:.5}),0,-.1,.12,.07,.9,.04).rotation.x=0; addS(sw,GEO.box,glow,0,-.1,.145,.015,.82,.01,false); addS(sw,GEO.box,a2,0,.36,.12,.22,.05,.08);
    sw.rotation.z=.2;
    return {g,inner,arm:sw}; }
  // Raízes: tronco torcido, tentáculos que se mexem e olhos vermelhos
  function makeRoot(o){ const g=new THREE.Group(), inner=new THREE.Group(); g.add(inner); const tend=[];
    const m1=M(o.c1,{roughness:.9}), m2=M(o.c2,{roughness:.9});
    addS(inner,GEO.sph,m2,0,.04,0,.5,.12,.4); const tr=addS(inner,GEO.cone,m1,0,.55,0,.22,1.1,.22); tr.rotation.y=.4;
    for(let k=0;k<o.n;k++){ const piv=new THREE.Group(); const a=k/o.n*Math.PI*2; piv.position.set(Math.cos(a)*.12,rand(.25,.85),Math.sin(a)*.1); inner.add(piv);
      let par=piv; for(let j=0;j<3;j++){ const seg=new THREE.Group(); seg.position.y=j?.26:0; par.add(seg); addS(seg,GEO.cyl,j%2?m2:m1,0,.13,0,.035-j*.008,.26,.035-j*.008,false); seg.rotation.z=(j?.35:0)*(k%2?1:-1); par=seg; }
      piv.rotation.z=(Math.cos(a)>0?-1:1)*rand(.6,1.3); piv.rotation.x=rand(-.4,.4); piv.userData.base=piv.rotation.z; piv.userData.ph=Math.random()*6; tend.push(piv); }
    for(let k=0;k<o.eyes;k++) addS(inner,GEO.sph,B(o.eye),(k-(o.eyes-1)/2)*.11,.72+(k%2)*.06,.16,.04,.04,.03,false);
    if(o.mouth){ addS(inner,GEO.sph,B(0x120404),0,.5,.17,.12,.06,.04,false); for(let k=0;k<5;k++){ const t=addS(inner,GEO.cone,M(0xe8dcc8),-.08+k*.04,.52,.19,.012,.05,.012,false); t.rotation.z=Math.PI; } }
    return {g,inner,tend}; }
  // Guerreiro Cristalizado: corpo de cristal escuro com brilho violeta
  function makeCrystalman(){ const g=new THREE.Group(), inner=new THREE.Group(); g.add(inner); const m=MATX.crystalV, d=M(0x2a2040,{roughness:.3,metalness:.4});
    [-1,1].forEach(s=>addS(inner,GEO.crystal,d,s*.12,.3,0,.45,1.6,.45)); addS(inner,GEO.crystal,m,0,.85,0,1.2,1.6,.8); addS(inner,GEO.crystal,d,0,1.28,0,.6,.9,.6);
    addS(inner,GEO.box,B(0xd8a8ff),0,1.3,.11,.12,.025,.01,false);
    [-1,1].forEach(s=>{ const c=addS(inner,GEO.crystal,m,s*.34,1.05,0,.4,.9,.4,false); c.rotation.z=s*.6; });
    const arm=new THREE.Group(); arm.position.set(.32,.75,.1); inner.add(arm); const bl=addS(arm,GEO.crystal,m,0,-.2,0,.3,3,.2); bl.rotation.z=.15;
    return {g,inner,arm}; }
  // Mão da Névoa: braços cinzentos que saem do chão
  // Sentinela sem Rosto e Larva-Mãe: as versões de chefe do jogo de plataforma
  function makeSemRosto() { const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); const S = makeSentinel({ c1: 0x2a2632, c2: 0x16131c, eye: 0xb26bff, faceless: true }); S.g.scale.setScalar(2.0); inner.add(S.g); addS(inner, GEO.box, B(0xb26bff), 0, 2.6, .32, .5, .05, .02); return { g, inner }; }

  // ---------------- receitas: tipo do MMO → modelo
  const R = {
    pompom: () => makeLarva({ c1: 0x5c6650, c2: 0x8a9476 }),
    besouro: () => makeLarva({ c1: 0x4e5662, c2: 0x7a8496, core: 0xc88cff, crystal: true }),
    larva: () => makeLarva({ c1: 0x56604a, c2: 0x7e8a6a, long: true }),
    verme: () => makeLarva({ c1: 0x5c6650, c2: 0x8a9476, armor: true, long: true }),
    larvaMae: () => makeLarva({ c1: 0x5a3a66, c2: 0x8a6a9a, core: 0xff7ad0, long: true, armor: true }),
    larvaFogo: () => makeLarva({ c1: 0x5a2a1a, c2: 0x8a4a2a, core: 0xff7828, long: true }),
    zunzum: () => makeGhost({ c1: 0x7a6a90, eye: 0xff5a2a }),
    serpe: () => makeGhost({ c1: 0x2a2030, eye: 0xc18bff }),
    esfera: () => makeGhost({ c1: 0x5a3a8a, eye: 0xff5a2a, crystal: true }),
    sentinela: () => makeSentinel({ c1: 0x2a2632, c2: 0x16131c, eye: 0xb26bff }),
    guardiao: () => makeSemRosto(),
    fungolino: () => makeRoot({ c1: 0x1a1214, c2: 0x2a1a20, eye: 0xff3c3c, eyes: 1, n: 6 }),
    raizPetra: () => makeRoot({ c1: 0x4a3a30, c2: 0x2a201a, eye: 0xe0c060, eyes: 2, n: 8, mouth: true }),
    cristalizado: () => makeCrystalman(),
  };
  const SIDE = new Set(['pompom', 'besouro', 'larva', 'verme', 'larvaMae', 'larvaFogo']);   // larvas olham para +x
  const FLOAT = new Set(['zunzum', 'serpe', 'esfera']);
  const baseOf = t => (MOBDEF[t] && MOBDEF[t].base) || t;
  let on = true; try { on = localStorage.getItem('monstros3d') !== '0'; } catch (e) { }
  const has = t => on && !!R[baseOf(t)];

  // a luz do MMO é mais escura que a do jogo de plataforma: troca por Lambert e clareia as cores escuras
  const LIT = new Map();
  function lit(m) {
    const key = [m.type, m.color.getHex(), m.emissive ? m.emissive.getHex() : 0, m.transparent, m.opacity, m.side].join('|');
    if (LIT.has(key)) return LIT.get(key);
    let out = m;
    if (m.isMeshStandardMaterial) {
      const c = m.color.clone().convertLinearToSRGB(), hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, Math.min(1, hsl.s * 1.1), Math.max(0.36, Math.min(0.62, hsl.l * 1.5 + 0.12))); c.convertSRGBToLinear();
      // luz própria suave: os monstros ficam legíveis mesmo contra o sol (como os sprites)
      const em = m.emissive && m.emissive.getHex() ? m.emissive.clone().multiplyScalar(m.emissiveIntensity * 1.3) : c.clone().multiplyScalar(0.38);
      out = new THREE.MeshLambertMaterial({ color: c, emissive: em, transparent: m.transparent, opacity: m.opacity, side: m.side });
    }
    LIT.set(key, out); return out;
  }
  const LITM = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  LITM.onBeforeCompile = sh => {
    sh.vertexShader = 'attribute vec3 aEm; varying vec3 vEm;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vEm = aEm;');
    sh.fragmentShader = 'varying vec3 vEm;\n' + sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive + vEm;');
  };
  const GLOWM = new THREE.MeshBasicMaterial({ vertexColors: true });
  // ---------------- achatar: junta as peças por material (posição + normal)
  const cache = {};
  function bake(t) {
    if (cache[t]) return cache[t];
    const o = R[t](), root = o.g;
    if (SIDE.has(t)) root.rotation.y = -Math.PI / 2;
    root.updateMatrixWorld(true);
    const groups = new Map();
    root.traverse(n => {
      if (!n.isMesh) return;
      let g = n.geometry.index ? n.geometry.toNonIndexed() : n.geometry.clone();
      g.applyMatrix4(n.matrixWorld);
      const mt = lit(n.material);
      if (!groups.has(mt)) groups.set(mt, []);
      groups.get(mt).push(g);
    });
    // tudo vira no máximo 2 malhas por monstro (cor por vértice): iluminada e brilhante → poucos desenhos por quadro
    const buckets = { lit: [], glow: [] };
    for (const [mat, list] of groups) for (const g of list) (mat.isMeshBasicMaterial ? buckets.glow : buckets.lit).push({ g, mat });
    const parts = []; const box = new THREE.Box3();
    for (const kind of ['lit', 'glow']) {
      const list = buckets[kind]; if (!list.length) continue;
      let n = 0; for (const { g } of list) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), em = new Float32Array(n * 3); let off = 0;
      for (const { g, mat } of list) {
        const c = g.attributes.position.count;
        pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3);
        const e = mat.emissive || new THREE.Color(0);
        for (let i = 0; i < c; i++) { col.set([mat.color.r, mat.color.g, mat.color.b], (off + i) * 3); em.set([e.r, e.g, e.b], (off + i) * 3); }
        off += c; g.dispose();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      if (kind === 'lit') geo.setAttribute('aEm', new THREE.BufferAttribute(em, 3));
      geo.computeBoundingBox(); geo.computeBoundingSphere(); box.union(geo.boundingBox);
      parts.push({ geo, mat: kind === 'lit' ? LITM : GLOWM });
    }
    return (cache[t] = { parts, h: box.max.y - Math.min(0, box.min.y), minY: box.min.y, len: box.max.z - box.min.z });
  }

  // ---------------- um monstro no mundo
  function mob(type, r) {
    const t = baseOf(type), K = bake(t), d = SPR_MOBS[type] || SPR_MOBS[t] || { h: 1.5 };
    const H = (d.h || 1.5) * (SIDE.has(t) ? 0.85 : 1), k = SIDE.has(t) ? (d.h || 1.5) * 1.45 / K.len : H / K.h;
    const body = new THREE.Group(); body.scale.setScalar(k); body.position.y = -K.minY * k; r.g.add(body);
    const cast = !TOUCH || (MOBDEF[type] && (MOBDEF[type].boss || MOBDEF[type].alfa));
    for (const p of K.parts) { const m = new THREE.Mesh(p.geo, p.mat); m.castShadow = cast; body.add(m); }
    const fl = FLOAT.has(t), ph = Math.random() * 10;
    r.m3 = true; r.mats = []; r.h = K.h * k + (fl ? 0.5 : 0); r.body = body;
    r.anim = (m, time) => {
      const mv = m.moving, sw = m.swing || 0;
      const bob = fl ? 0.45 + Math.sin(time * 2.4 + ph) * 0.18 : mv ? Math.abs(Math.sin(time * 9 + ph)) * 0.06 * H : 0;
      body.position.y = -K.minY * k + bob;
      const sq = SIDE.has(t) ? (mv ? Math.sin(time * 10 + ph) * 0.06 : Math.sin(time * 2 + ph) * 0.025) : Math.sin(time * 2.2 + ph) * 0.02;
      const hit = m.flash > 0 ? 1.12 : 1;
      body.scale.set(k * (1 - sq * 0.5) * hit, k * (1 + sq) * hit, k * (1 + sq * 0.6) * hit);
      body.position.z = sw * 0.35 * H;                                   // bote do ataque
      body.rotation.x = sw * 0.25; body.rotation.z = fl ? Math.sin(time * 1.7 + ph) * 0.08 : 0;
    };
    return r;
  }
  return { has, mob };
})();
