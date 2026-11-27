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

  // ---------------- bichos do mar da Praia de Cômodo
  function makeCaranguejo(o) {                                              // carapaça larga, 6 patas, duas pinças e olhos em hastes
    const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
    const cas = M(o.c1, { roughness: .45 }), esc = M(o.c2, { roughness: .5 }), olho = B(0x111111);
    addS(inner, GEO.sph, cas, 0, .38, 0, .55, .26, .45); addS(inner, GEO.sph, esc, 0, .3, .05, .5, .16, .4);
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 3; k++) { const p1 = addS(inner, GEO.cyl, esc, sx * .55, .26, -.18 + k * .2, .04, .32, .04); p1.rotation.z = sx * 1.0; const p2 = addS(inner, GEO.cyl, cas, sx * .78, .1, -.18 + k * .2, .035, .28, .035); p2.rotation.z = -sx * .35; }
      const br = addS(inner, GEO.cyl, cas, sx * .42, .36, .42, .06, .3, .06); br.rotation.x = 1.2; br.rotation.z = -sx * .4;
      addS(inner, GEO.sph, cas, sx * .52, .4, .66, .18, .14, .2); const dedo = addS(inner, GEO.cone, esc, sx * .48, .42, .84, .07, .2, .07); dedo.rotation.x = Math.PI / 2;
      addS(inner, GEO.cyl, esc, sx * .12, .62, .3, .025, .16, .025); addS(inner, GEO.sph, olho, sx * .12, .71, .3, .05, .05, .05);
    }
    if (o.coroa) for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, c = addS(inner, GEO.cone, M(0xffd040, { metalness: .6, roughness: .3, emissive: 0x6a4a00 }), Math.cos(a) * .22, .7, Math.sin(a) * .18, .07, .2, .07); }
    return { g, inner };
  }
  function makeMedusa(o) {                                                  // sino translúcido que brilha e tentáculos pendurados
    const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
    const sino = M(o.c1, { transparent: true, opacity: .75, emissive: o.c1, emissiveIntensity: .5, roughness: .2, side: THREE.DoubleSide });
    add(inner, new THREE.SphereGeometry(.45, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), sino, 0, .9, 0);
    addS(inner, GEO.sph, B(o.c2), 0, 1.0, 0, .18, .12, .18);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, t = addS(inner, GEO.cyl, sino, Math.cos(a) * .28, .55, Math.sin(a) * .28, .025, .7, .025); t.rotation.z = Math.cos(a) * .15; }
    return { g, inner };
  }
  function makeTartaruga(o) {                                               // casco com espinhos, cabeça e nadadeiras
    const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
    const cas = M(o.c1, { roughness: .6 }), pele = M(o.c2, { roughness: .7 });
    addS(inner, GEO.sph, cas, 0, .4, 0, .65, .38, .75); addS(inner, GEO.sph, pele, 0, .2, 0, .6, .12, .7);
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, e = addS(inner, GEO.cone, M(0xe8e0c8), Math.cos(a) * .35, .66, Math.sin(a) * .4, .07, .22, .07); e.rotation.z = -Math.cos(a) * .4; }
    addS(inner, GEO.sph, pele, 0, .35, .85, .2, .18, .25); for (const sx of [-1, 1]) { addS(inner, GEO.sph, B(0x111111), sx * .1, .42, 1.0, .04, .04, .04); const n = addS(inner, GEO.sph, pele, sx * .6, .18, .35, .3, .06, .14); n.rotation.y = sx * .5; const t = addS(inner, GEO.sph, pele, sx * .45, .18, -.5, .2, .06, .12); t.rotation.y = -sx * .5; }
    return { g, inner };
  }
  // ---------------- Vale dos Mortos: a mão pálida que sai da terra (com um montinho de terra em volta)
  function makeMao(o) {
    const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
    const pele = M(o.c1, { roughness: .7 }), terra = M(0x3a3430, { roughness: 1 });
    addS(inner, GEO.sph, terra, 0, .05, 0, .6, .15, .6);
    const braco = addS(inner, GEO.cyl, pele, 0, .5, 0, .12, .9, .12); braco.rotation.z = .1;
    addS(inner, GEO.sph, pele, .05, 1.0, 0, .2, .24, .09);
    for (let k = 0; k < 4; k++) { const d = addS(inner, GEO.cyl, pele, -.12 + k * .08 + .05, 1.32 - Math.abs(k - 1.5) * .05, 0, .03, .3, .03); d.rotation.z = (k - 1.5) * .12; }
    const pol = addS(inner, GEO.cyl, pele, .22, 1.06, .02, .03, .2, .03); pol.rotation.z = -.9;
    return { g, inner };
  }
  // ================= formas novas (pedido do Rone: "tem muito bicho igual que deveria ter formas diferentes").
  // Antes 11 bichos eram o mesmo fantasma de capuz trocando só a cor. Cada um ganhou silhueta própria. Criadas para o jogo.
  const novo = () => { const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); return { g, inner }; };
  const tubo = (par, pts, r, mat) => add(par, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 24, r, 7), mat);
  // Eco Faminto: uma boca enorme que flutua, cheia de dentes, com um rabinho de fumaça
  function makeBoca(o) { const r = novo(), pele = M(o.c1, { roughness: .8 }), dente = M(0xf2ead8, { roughness: .5 }), goela = B(0x2a0610);
    const cima = add(r.inner, new THREE.SphereGeometry(.55, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), pele, 0, .75, 0); cima.rotation.x = -.35;
    const baixo = add(r.inner, new THREE.SphereGeometry(.5, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), pele, 0, .62, .05); baixo.rotation.x = .3;
    addS(r.inner, GEO.sph, goela, 0, .7, .08, .4, .14, .36);
    for (let k = 0; k < 9; k++) { const a = -1.2 + k * 0.3; const d1 = addS(r.inner, GEO.cone, dente, Math.sin(a) * .42, .72, Math.cos(a) * .42, .06, .16, .06); d1.rotation.x = Math.PI;
      const d2 = addS(r.inner, GEO.cone, dente, Math.sin(a + .15) * .38, .63, Math.cos(a + .15) * .38, .05, .13, .05); }
    for (const s of [-1, 1]) addS(r.inner, GEO.sph, B(o.eye), s * .2, 1.05, .32, .07, .09, .05);
    const rabo = addS(r.inner, GEO.cone, M(o.c1, { transparent: true, opacity: .7 }), 0, .2, -.35, .22, .7, .22); rabo.rotation.x = 2.4;
    return r; }
  // Sombra Errante: uma serpente de sombra ondulando no ar
  function makeSerpe(o) { const r = novo(), pele = M(o.c1, { roughness: .6, emissive: o.c1, emissiveIntensity: .15 }), pts = [];
    for (let k = 0; k <= 10; k++) pts.push([Math.sin(k * .9) * .35, .35 + k * .02, -1 + k * .2]);
    tubo(r.inner, pts, .13, pele);
    const cab = addS(r.inner, GEO.sph, pele, pts[10][0], pts[10][1] + .05, pts[10][2] + .1, .2, .17, .3);
    for (const s of [-1, 1]) addS(r.inner, GEO.sph, B(o.eye), pts[10][0] + s * .1, pts[10][1] + .12, pts[10][2] + .28, .04, .05, .04);
    for (let k = 2; k < 10; k += 2) { const p = pts[k], e = addS(r.inner, GEO.cone, B(o.eye), p[0], p[1] + .14, p[2], .04, .14, .04); }
    return r; }
  // Eco das Cinzas: um núcleo de brasa com pedaços de cinza girando em volta
  function makeCinzas(o) { const r = novo(), cinza = M(0x3a3434, { roughness: 1, flatShading: true }), brasa = M(0x2a0a04, { emissive: o.eye, emissiveIntensity: 1.2 });
    addS(r.inner, new THREE.IcosahedronGeometry(1, 0), brasa, 0, .7, 0, .26, .26, .26);
    for (let k = 0; k < 14; k++) { const a = k * 2.399, h = .2 + (k % 5) * .2, rr = .38 + (k % 3) * .14; const c = addS(r.inner, new THREE.IcosahedronGeometry(1, 0), cinza, Math.cos(a) * rr, h, Math.sin(a) * rr, .07 + (k % 3) * .03, .06, .08); c.rotation.set(k, k * 2, 0); }
    for (const s of [-1, 1]) addS(r.inner, GEO.sph, B(0xffe0a0), s * .08, .76, .22, .035, .035, .03);
    return r; }
  // Memória Aprisionada: um cristal alto com um vulto preso dentro
  function makePrisao(o) { const r = novo(), cr = M(o.c1, { transparent: true, opacity: .45, roughness: .1, metalness: .2, emissive: o.c1, emissiveIntensity: .25, flatShading: true });
    addS(r.inner, new THREE.OctahedronGeometry(1, 0), cr, 0, .9, 0, .38, .9, .38);
    const vulto = M(0x1a1420, { roughness: 1 }); addS(r.inner, GEO.sph, vulto, 0, 1.1, 0, .1, .11, .1); addS(r.inner, GEO.cone, vulto, 0, .8, 0, .13, .4, .13);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, c = addS(r.inner, new THREE.OctahedronGeometry(1, 0), cr, Math.cos(a) * .4, .12, Math.sin(a) * .4, .1, .22, .1); c.rotation.z = Math.cos(a) * .4; }
    return r; }
  // Eco da Cidade: lampião vivo, chama azul presa numa gaiola, pano rasgado embaixo
  function makeLampiao(o) { const r = novo(), ferro = M(0x2a2a30, { metalness: .6, roughness: .4 }), chama = M(0x0a1a2a, { emissive: o.eye, emissiveIntensity: 1.3, transparent: true, opacity: .9 });
    for (const [x, z] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) addS(r.inner, GEO.cyl, ferro, x, 1.0, z, .02, .55, .02);
    addS(r.inner, GEO.box, ferro, 0, 1.3, 0, .5, .05, .5); addS(r.inner, GEO.box, ferro, 0, .72, 0, .5, .05, .5);
    addS(r.inner, GEO.cone, ferro, 0, 1.45, 0, .32, .25, .32); addS(r.inner, GEO.sph, ferro, 0, 1.6, 0, .05, .05, .05);
    addS(r.inner, GEO.cone, chama, 0, 1.02, 0, .13, .4, .13);
    const pano = M(o.c1, { side: THREE.DoubleSide, transparent: true, opacity: .8 });
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, p = addS(r.inner, GEO.cone, pano, Math.cos(a) * .15, .35, Math.sin(a) * .15, .12, .7, .05); p.rotation.set(Math.PI + Math.sin(a) * .2, a, 0); }
    return r; }
  // Memória Afogada: cabeça curvada e cabelo comprido flutuando como na água
  function makeAfogada(o) { const r = novo(), pele = M(o.c1, { transparent: true, opacity: .8, emissive: o.c1, emissiveIntensity: .2 }), cabelo = M(0x0a2a34, { roughness: .9 });
    addS(r.inner, GEO.sph, pele, 0, 1.0, 0, .22, .25, .22); addS(r.inner, GEO.cone, pele, 0, .62, 0, .25, .6, .2);
    for (const s of [-1, 1]) { const b = addS(r.inner, GEO.cyl, pele, s * .28, .6, .08, .04, .5, .04); b.rotation.z = s * .35; }
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, x = Math.cos(a) * .18, z = Math.sin(a) * .18 - .05; tubo(r.inner, [[x, 1.1, z], [x * 1.6, .8, z * 1.6 - .1], [x * 2.2 + Math.sin(k) * .1, .4, z * 2 - .25]], .025, cabelo); }
    for (const s of [-1, 1]) addS(r.inner, GEO.sph, B(o.eye), s * .08, 1.0, .19, .03, .015, .02);
    return r; }
  // Lume Errante: chama viva com faíscas em volta
  function makeLume(o) { const r = novo(), f1 = M(0x2a1a04, { emissive: 0xffb040, emissiveIntensity: 1.4 }), f2 = M(0x2a2008, { emissive: 0xfff0a0, emissiveIntensity: 1.5 });
    addS(r.inner, GEO.sph, f1, 0, .45, 0, .3, .3, .3); addS(r.inner, GEO.cone, f1, 0, .85, 0, .26, .7, .26); addS(r.inner, GEO.cone, f2, 0, .72, .02, .14, .45, .14);
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; addS(r.inner, GEO.sph, f2, Math.cos(a) * .55, .4 + (k % 3) * .25, Math.sin(a) * .55, .04, .04, .04); }
    for (const s of [-1, 1]) addS(r.inner, GEO.sph, B(0x3a1a04), s * .09, .55, .27, .04, .05, .03);
    return r; }
  // Sussurro da Névoa: nuvem de névoa cheia de olhinhos
  function makeNevoa(o) { const r = novo(), nv = M(o.c1, { transparent: true, opacity: .55, roughness: 1 });
    for (let k = 0; k < 7; k++) { const a = k * 2.1; addS(r.inner, GEO.sph, nv, Math.cos(a) * .3, .55 + (k % 3) * .15, Math.sin(a) * .25, .32, .26, .3); }
    for (let k = 0; k < 9; k++) { const a = -0.9 + k * .22; addS(r.inner, GEO.sph, B(o.eye), Math.sin(a) * .48, .5 + (k % 3) * .17, Math.cos(a) * .4, .035, .035, .02); }
    return r; }
  // Dama sem Olhos: vestido longo, véu e um rosto liso, sem olhos
  function makeDama(o) { const r = novo(), vest = M(o.c1, { side: THREE.DoubleSide, roughness: .7 }), pele = M(0xe8e4dc, { roughness: .4 }), veu = M(0xf8f6f0, { transparent: true, opacity: .5, side: THREE.DoubleSide });
    add(r.inner, new THREE.ConeGeometry(.55, 1.2, 16, 1, true), vest, 0, .6, 0); addS(r.inner, GEO.cyl, vest, 0, 1.35, 0, .16, .35, .13);
    addS(r.inner, GEO.sph, pele, 0, 1.68, 0, .15, .19, .15);
    add(r.inner, new THREE.ConeGeometry(.28, .9, 14, 1, true), veu, 0, 1.45, -.02);
    for (const s of [-1, 1]) { const b = addS(r.inner, GEO.cyl, vest, s * .22, 1.15, .05, .04, .6, .04); b.rotation.z = s * .25; addS(r.inner, GEO.sph, pele, s * .3, .85, .08, .05, .06, .05); }
    addS(r.inner, GEO.box, B(0x050505), 0, 1.66, .14, .12, .015, .01);   // só a marca onde seriam os olhos
    return r; }
  // Sombra do Vale: um vulto alto e magro, de braços compridos até o chão
  function makeAlto(o) { const r = novo(), sb = M(o.c1, { roughness: 1 });
    for (const s of [-1, 1]) { addS(r.inner, GEO.cyl, sb, s * .1, .5, 0, .035, 1.0, .035); const b = addS(r.inner, GEO.cyl, sb, s * .24, 1.05, .05, .03, 1.1, .03); b.rotation.z = s * .18; for (let d = 0; d < 3; d++) { const dd = addS(r.inner, GEO.cone, sb, s * .34 + (d - 1) * .03, .45, .08, .015, .14, .015); dd.rotation.x = Math.PI; } }
    addS(r.inner, GEO.cone, sb, 0, 1.4, 0, .17, .9, .12); addS(r.inner, GEO.sph, sb, 0, 1.92, 0, .13, .16, .13);
    for (const s of [-1, 1]) addS(r.inner, GEO.sph, B(o.eye), s * .05, 1.94, .11, .025, .03, .02);
    return r; }
  // Serpente das Ondas: serpente do mar com barbatanas e escamas brilhando
  function makeSerpMar(o) { const r = novo(), pele = M(o.c1, { roughness: .35, metalness: .3 }), barb = M(o.c2, { side: THREE.DoubleSide, transparent: true, opacity: .8 }), pts = [];
    for (let k = 0; k <= 10; k++) pts.push([Math.sin(k * .8) * .3, .12 + Math.max(0, k - 6) * .14, -1 + k * .18]);
    tubo(r.inner, pts, .16, pele); const h = pts[10];
    addS(r.inner, GEO.sph, pele, h[0], h[1] + .05, h[2] + .12, .2, .17, .32);
    for (const s of [-1, 1]) { addS(r.inner, GEO.sph, B(o.eye), h[0] + s * .11, h[1] + .12, h[2] + .26, .04, .04, .04); const f = addS(r.inner, GEO.cone, barb, h[0] + s * .22, h[1] + .1, h[2], .03, .3, .16); f.rotation.z = -s * 1.2; }
    for (let k = 1; k < 10; k++) { const p = pts[k], f = addS(r.inner, GEO.cone, barb, p[0], p[1] + .16, p[2], .02, .2, .1); }
    return r; }
  // Guarda de Ossos: esqueleto de guarda com costelas, escudo e lança
  function makeEsqueleto(o) { const r = novo(), osso = M(o.c1, { roughness: .6 }), ferro = M(0x5a5a62, { metalness: .5, roughness: .5 });
    for (const s of [-1, 1]) { addS(r.inner, GEO.cyl, osso, s * .1, .3, 0, .035, .6, .035); addS(r.inner, GEO.cyl, osso, s * .26, .95, 0, .03, .55, .03); }
    addS(r.inner, GEO.cyl, osso, 0, .95, -.05, .035, .65, .035);
    for (let k = 0; k < 4; k++) add(r.inner, new THREE.TorusGeometry(.16 - k * .015, .018, 5, 14, Math.PI * 1.4), osso, 0, 1.12 - k * .1, 0).rotation.set(Math.PI / 2, 0, Math.PI * .8);
    addS(r.inner, GEO.box, osso, 0, .65, 0, .28, .06, .14);
    addS(r.inner, GEO.sph, osso, 0, 1.48, 0, .15, .16, .15); for (const s of [-1, 1]) addS(r.inner, GEO.sph, B(o.eye), s * .055, 1.49, .12, .035, .04, .02);
    addS(r.inner, GEO.cyl, ferro, -.32, 1.0, .1, .2, .03, .2).rotation.x = Math.PI / 2;
    addS(r.inner, GEO.cyl, ferro, .32, 1.1, .08, .02, 1.7, .02); addS(r.inner, GEO.cone, ferro, .32, 2.0, .08, .05, .2, .05);
    return r; }
  // ---------------- receitas: tipo do MMO → modelo
  const R = {
    pompom: () => makeLarva({ c1: 0x5c6650, c2: 0x8a9476 }),
    besouro: () => makeLarva({ c1: 0x4e5662, c2: 0x7a8496, core: 0xc88cff, crystal: true }),
    larva: () => makeLarva({ c1: 0x56604a, c2: 0x7e8a6a, long: true }),
    verme: () => makeLarva({ c1: 0x5c6650, c2: 0x8a9476, armor: true, long: true }),
    larvaMae: () => makeLarva({ c1: 0x5a3a66, c2: 0x8a6a9a, core: 0xff7ad0, long: true, armor: true }),
    larvaFogo: () => makeLarva({ c1: 0x5a2a1a, c2: 0x8a4a2a, core: 0xff7828, long: true }),
    zunzum: () => makeBoca({ c1: 0x7a6a90, eye: 0xff5a2a }),
    serpe: () => makeSerpe({ c1: 0x2a2030, eye: 0xc18bff }),
    esfera: () => makeGhost({ c1: 0x5a3a8a, eye: 0xff5a2a, crystal: true }),
    sentinela: () => makeSentinel({ c1: 0x2a2632, c2: 0x16131c, eye: 0xb26bff }),
    guardiao: () => makeSemRosto(),
    fungolino: () => makeRoot({ c1: 0x7a5232, c2: 0x9a7048, eye: 0xff3c3c, eyes: 1, n: 6 }),   // cor de madeira (antes quase preta: sumia no trigo de dia)
    raizPetra: () => makeRoot({ c1: 0x4a3a30, c2: 0x2a201a, eye: 0xe0c060, eyes: 2, n: 8, mouth: true }),
    cristalizado: () => makeCrystalman(),
    // Valdora
    raizNegra: () => makeRoot({ c1: 0x120a0e, c2: 0x241418, eye: 0xff6a20, eyes: 2, n: 9, mouth: true }),
    ecoCinza: () => makeCinzas({ c1: 0x6a6266, eye: 0xff8a3a }),
    larvaCinza: () => makeLarva({ c1: 0x4a4446, c2: 0x6e6668, core: 0xff7a3a, long: true, armor: true }),
    sentinelaMuralha: () => makeSentinel({ c1: 0x3a3238, c2: 0x1a1418, eye: 0xff3a3a }),
    // Floresta Morta (livro I, cap. 4): larvas maiores, de membros alongados; umas com cristais crescendo na carne,
    // outras com pedaços de armadura antiga; raízes que se mexem como ossos; memórias presas nos cristais do Templo
    larvaPernalta: () => { const r = makeLarva({ c1: 0x3e3a34, c2: 0x6e665a, core: 0x9a7aff, long: true }); r.g.scale.set(1.7, 1.9, 1.7); return r; },
    larvaCristal: () => { const r = makeLarva({ c1: 0x2c2638, c2: 0x544468, core: 0xd070ff, long: true, crystal: true }); r.g.scale.setScalar(1.7); return r; },
    larvaAntiga: () => { const r = makeLarva({ c1: 0x4a4238, c2: 0x9a907e, core: 0xffd070, long: true, armor: true }); r.g.scale.setScalar(1.85); return r; },
    raizOssuda: () => { const r = makeRoot({ c1: 0xcfc4a8, c2: 0x8a7e68, eye: 0x9a6aff, eyes: 2, n: 10, mouth: true }); r.g.scale.setScalar(1.3); return r; },
    memoria: () => makePrisao({ c1: 0xd8c078, eye: 0xffffff }),
    guardiaoBranco: () => {                                                   // armadura branca rachada, máscara e lança (a Ordem da Essência)
      const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
      const S = makeSentinel({ c1: 0xdcdce4, c2: 0xa4a4b2, eye: 0x7ad8ff, faceless: true }); S.g.scale.setScalar(2.1); inner.add(S.g);
      const haste = M(0xd8c8a0, { roughness: .4 }), ponta = M(0xe8f4ff, { roughness: .2, metalness: .6 }), runa = new THREE.MeshBasicMaterial({ color: 0x7ad8ff });
      const l = add(inner, new THREE.CylinderGeometry(.05, .05, 4.2, 6), haste, .95, 2.2, .35, false); l.rotation.x = .12;
      const pt = add(inner, new THREE.ConeGeometry(.14, .7, 6), ponta, .95, 4.55, .6, false); pt.rotation.x = .12;
      add(inner, new THREE.BoxGeometry(.5, .06, .06), runa, .95, 3.95, .55, false);
      addS(inner, GEO.box, runa, 0, 2.7, .34, .55, .06, .02);
      return { g, inner };
    },
    // Praia de Cômodo: bichos do mar na beira d'água
    caranguejo: () => makeCaranguejo({ c1: 0xd8482a, c2: 0xf0a070 }),
    reiCaranguejo: () => makeCaranguejo({ c1: 0x9a1a3a, c2: 0xe07a6a, coroa: true }),
    medusa: () => makeMedusa({ c1: 0x8ad8ff, c2: 0xff8ad8 }),
    tartaruga: () => makeTartaruga({ c1: 0x4a6a3a, c2: 0x8aa070 }),
    serpenteOnda: () => makeSerpMar({ c1: 0x1a6a7a, c2: 0x5ad0c0, eye: 0x9affff }),
    // Cidade Submersa (livro I, caps. 9 e 10)
    raizSuspensa: () => makeRoot({ c1: 0x120a1a, c2: 0x2a1a3a, eye: 0xc070ff, eyes: 2, n: 11, mouth: true }),
    cristalVivo: () => makeCrystalman(),
    ecoCidade: () => makeLampiao({ c1: 0x3a6a9a, eye: 0x6affff }),
    sentinelaSubmersa: () => makeSentinel({ c1: 0x1a3a4a, c2: 0x0a1a24, eye: 0x5affd0 }),
    larvaAbismo: () => makeLarva({ c1: 0x1a1030, c2: 0x3a2060, core: 0xb070ff, long: true, crystal: true }),
    sombraFonte: () => {                                                    // a sombra atrás da Fonte: manto negro, olhos dourados e raízes
      const r = makeGhost({ c1: 0x05030a, eye: 0xffd040, crystal: true });
      const raiz = M(0x140a10, { roughness: .9 });
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, pts = [new THREE.Vector3(0, .5, 0), new THREE.Vector3(Math.cos(a) * .4, .2, Math.sin(a) * .4), new THREE.Vector3(Math.cos(a) * .8, -.1, Math.sin(a) * .8)];
        add(r.inner, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, .04, 5), raiz, 0, 0, 0, false); }
      return r;
    },
    // Rio das Memórias (livro I, cap. 11): nomes do jogo
    memoriaAfogada: () => makeAfogada({ c1: 0x4ab0c8, eye: 0xd8ffff }),
    lumeErrante: () => makeLume({ c1: 0xffe6a0, eye: 0xffffff }),
    raizRio: () => makeRoot({ c1: 0x0a1c22, c2: 0x1a3a44, eye: 0x6affff, eyes: 3, n: 12, mouth: true }),
    soldadoMemoria: () => makeSentinel({ c1: 0x8ab0c0, c2: 0x3a5a68, eye: 0xd8ffff, trim: 0x9af0ff }),
    guardaEspinhos: () => makeSentinel({ c1: 0x2a2a30, c2: 0x141418, eye: 0xffd040, trim: 0xffd040 }),
    guardiaoBrancoRio: () => {                                                // o Guardião Branco (livro I, cap. 11): armadura branca, máscara e lança
      const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
      const S = makeSentinel({ c1: 0xf4f4fa, c2: 0xc0c4d0, eye: 0x9af0ff, faceless: true, trim: 0xffe9a8 }); S.g.scale.setScalar(2.3); inner.add(S.g);
      const haste = M(0xe8d8a8, { roughness: .35, metalness: .4 }), ponta = M(0xf0f8ff, { roughness: .15, metalness: .7 }), runa = new THREE.MeshBasicMaterial({ color: 0x9af0ff });
      const l = add(inner, new THREE.CylinderGeometry(.06, .06, 4.8, 6), haste, 1.05, 2.4, .35, false); l.rotation.x = .1;
      const pt = add(inner, new THREE.ConeGeometry(.16, .8, 6), ponta, 1.05, 5.0, .58, false); pt.rotation.x = .1;
      for (let k = 0; k < 3; k++) { const e = add(inner, new THREE.ConeGeometry(.09, .5, 5), runa, -.4 + k * .4, 3.55, .38, false); e.rotation.x = -.2; }   // os três espinhos no peito
      return { g, inner };
    },
    // Vale dos Mortos e Ponte dos Mortos
    maoPalida: () => makeMao({ c1: 0xd8d4cc }),
    sussurro: () => makeNevoa({ c1: 0xa8b0bc, eye: 0x9ad8ff }),
    damaSemOlhos: () => makeDama({ c1: 0x3a3440 }),
    sombraVale: () => makeAlto({ c1: 0x14101a, eye: 0xff3030 }),
    guardaOssos: () => makeEsqueleto({ c1: 0xe0d6be, eye: 0x9affd8 }),
    primeiroGuardiao: () => {                                               // armadura branca, cajado e olhos dourados (livro I, cap. 8)
      const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
      const S = makeSentinel({ c1: 0xf4f4f8, c2: 0xc8c8d4, eye: 0xffd040 }); S.g.scale.setScalar(2.2); inner.add(S.g);
      const haste = M(0xe8d8a0, { roughness: .3, metalness: .5 }), orbe = new THREE.MeshBasicMaterial({ color: 0xffd860 });
      add(inner, new THREE.CylinderGeometry(.06, .06, 4.4, 8), haste, 1.0, 2.2, .3, false);
      addS(inner, GEO.sph, orbe, 1.0, 4.5, .3, .26, .26, .26);
      for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2, c = add(inner, new THREE.TorusGeometry(.32, .03, 6, 16), haste, 1.0, 4.5, .3, false); c.rotation.set(a, a * .5, 0); }
      return { g, inner };
    },
    carrasco: () => { const r = makeSemRosto(); r.g.traverse(o => { if (o.material && o.material.color && o.material.color.getHex() === 0xb26bff) o.material = o.material.clone(), o.material.color.set(0xff3030); }); return r; },
  };
  const SIDE = new Set(['pompom', 'besouro', 'larva', 'verme', 'larvaMae', 'larvaFogo', 'larvaCinza', 'larvaPernalta', 'larvaCristal', 'larvaAntiga', 'larvaAbismo']);   // larvas olham para +x
  const FLOAT = new Set(['memoriaAfogada', 'lumeErrante', 'zunzum', 'esfera', 'ecoCinza', 'memoria', 'medusa', 'sussurro', 'damaSemOlhos', 'ecoCidade', 'sombraFonte']);
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

  // ---------------- 🦀 caranguejo VIVO (pedido do Rone: o antigo era uma peça só e "andava pior que Roblox"):
  // patas articuladas que andam em tripé alternado, pinças que abrem/fecham e beliscam, olhos em hastes que balançam
  const CRAB = { caranguejo: { c1: 0xd8482a, c2: 0xf6b080, c3: 0xa8301c }, reiCaranguejo: { c1: 0x9a1a3a, c2: 0xe8907a, c3: 0x6a0a24, coroa: true } };
  function crabMob(type, t, r) {
    const o = CRAB[t], cas = lit(M(o.c1, { roughness: .45 })), bar = lit(M(o.c2, { roughness: .55 })), esc = lit(M(o.c3, { roughness: .5 })), preto = B(0x0a0a0a), branco = B(0xffffff);
    const d = SPR_MOBS[type] || SPR_MOBS[t] || { h: 1.1 }, root = new THREE.Group(); r.g.add(root);
    const body = new THREE.Group(); root.add(body);
    // carapaça: domo achatado com borda, saliências e a barriga clara
    addS(body, GEO.sph, cas, 0, .42, 0, .62, .26, .5); addS(body, GEO.sph, esc, 0, .36, 0, .66, .12, .54); addS(body, GEO.sph, bar, 0, .28, .02, .54, .14, .44);
    for (const [x, z] of [[-.22, -.08], [.22, -.08], [0, -.22], [-.12, .14], [.12, .14]]) addS(body, GEO.sph, esc, x, .62, z, .08, .05, .08);
    // olhos em hastes
    const olhos = [];
    for (const sx of [-1, 1]) { const h = new THREE.Group(); h.position.set(sx * .13, .56, .36); body.add(h); addS(h, GEO.cyl, bar, 0, .1, 0, .028, .2, .028); addS(h, GEO.sph, preto, 0, .22, 0, .065, .065, .065); addS(h, GEO.sph, branco, sx * .02, .24, .045, .018, .018, .018); olhos.push(h); }
    // boca
    addS(body, GEO.box, esc, 0, .36, .47, .18, .06, .04);
    // patas: 3 de cada lado, coxa subindo e canela descendo até a ponta
    const patas = [];
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
      const hip = new THREE.Group(); hip.position.set(sx * .5, .34, -.2 + k * .2); body.add(hip);
      const coxa = new THREE.Group(); coxa.rotation.z = sx * 0.42; hip.add(coxa); addS(coxa, GEO.cyl, cas, sx * .16, 0, 0, .036, .32, .036).rotation.z = Math.PI / 2;
      const joelho = new THREE.Group(); joelho.position.set(sx * .34, 0, 0); joelho.rotation.z = -sx * 1.15; coxa.add(joelho);
      addS(joelho, GEO.cyl, esc, sx * .13, 0, 0, .026, .27, .026).rotation.z = Math.PI / 2; const ponta = addS(joelho, GEO.cone, bar, sx * .3, 0, 0, .026, .08, .026); ponta.rotation.z = -sx * Math.PI / 2;
      patas.push({ hip, sx, fase: ((k + (sx > 0 ? 1 : 0)) % 2) * Math.PI, baseY: (k - 1) * .18 * sx });
    }
    // pinças: braço, garra grande, dedo fixo e dedo que mexe
    const pincas = [];
    for (const sx of [-1, 1]) {
      const ombro = new THREE.Group(); ombro.position.set(sx * .36, .4, .38); body.add(ombro);
      addS(ombro, GEO.cyl, cas, sx * .08, .05, .14, .06, .3, .06).rotation.x = 1.1;
      const mao = new THREE.Group(); mao.position.set(sx * .14, .14, .32); ombro.add(mao);
      addS(mao, GEO.sph, cas, 0, 0, .06, .17, .13, .2);
      const fixo = addS(mao, GEO.cone, esc, sx * -.05, -.02, .3, .05, .22, .05); fixo.rotation.x = Math.PI / 2;
      const dedo = new THREE.Group(); dedo.position.set(sx * .06, .05, .18); mao.add(dedo); const dd = addS(dedo, GEO.cone, esc, 0, 0, .12, .045, .2, .045); dd.rotation.x = Math.PI / 2;
      pincas.push({ ombro, dedo, sx });
    }
    if (o.coroa) for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; addS(body, GEO.cone, B(0xffd040), Math.cos(a) * .14, .74, Math.sin(a) * .11, .04, .13, .04); }
    // tamanho pelo do sprite antigo
    const bx = new THREE.Box3().setFromObject(root), hh = bx.max.y - Math.min(0, bx.min.y), H = d.h || 1.1, k = H / hh;
    root.scale.setScalar(k); root.position.y = -Math.min(0, bx.min.y) * k;
    const ph = Math.random() * 10, cast = !TOUCH || (MOBDEF[type] && MOBDEF[type].boss);
    root.traverse(n => { if (n.isMesh) n.castShadow = cast; });
    r.m3 = true; r.mats = []; r.h = H; r.body = root;
    r.anim = (m, time) => {
      const mv = m.moving, sw = m.swing || 0, v = mv ? 13 : 0;
      for (const p of patas) {                                           // tripé alternado: metade levanta e passa para a frente enquanto a outra apoia
        const s = Math.sin(time * v + p.fase), lev = mv ? Math.max(0, s) * 0.45 : 0;
        p.hip.rotation.z = p.sx * lev; p.hip.rotation.y = p.baseY + (mv ? Math.cos(time * v + p.fase) * 0.32 * p.sx : Math.sin(time * 1.5 + ph + p.fase) * 0.03);
      }
      body.position.y = mv ? Math.abs(Math.sin(time * v)) * 0.03 : Math.sin(time * 1.8 + ph) * 0.01;
      body.rotation.z = mv ? Math.sin(time * v * 0.5) * 0.05 : 0;
      for (const c of pincas) {                                          // pinças: abrem e fecham sozinhas e dão o bote no ataque
        const abre = 0.25 + Math.max(0, Math.sin(time * 3 + ph + c.sx)) * 0.35 + sw * 0.6;
        c.dedo.rotation.y = c.sx * abre; c.ombro.rotation.x = -sw * 0.9 + Math.sin(time * 2 + ph) * 0.05; c.ombro.rotation.y = c.sx * (0.15 - sw * 0.25);
      }
      for (const e of olhos) e.rotation.z = Math.sin(time * 2.5 + ph + e.position.x * 10) * 0.18;
      const hit = m.flash > 0 ? 1.1 : 1; root.scale.setScalar(k * hit);
      body.position.z = sw * 0.25;
    };
    return r;
  }
  // ---------------- ⚔️ cavaleiros de armadura (pedido do Rone: os Sentinelas, Soldados e Guardiões eram "tudo igual quadrado")
  // Corpo de verdade: peitoral arredondado, ombreiras, joelheiras, elmo com viseira, capa e arma na mão.
  // É UMA malha só com esqueleto (cada peça presa a um osso): um desenho por monstro, mas com pernas que dobram
  // o joelho ao andar, braços que balançam e golpe com preparo (ergue a arma, desce, volta). Criado no jogo; as cores
  // e as armas seguem o que o livro diz de cada um (Guardião Branco com lança e máscara, Primeiro Guardião com cajado).
  const CAV = {
    sentinela: { c1: 0x4a4458, c2: 0x24202c, eye: 0xb26bff, arma: 'espada', escudo: 0x2a2434 },
    sentinelaMuralha: { c1: 0x5a4a4e, c2: 0x2a2024, eye: 0xff3a3a, arma: 'machado', capa: 0x5a1414, crista: 0x8a1a1a },
    sentinelaSubmersa: { c1: 0x2a5a6a, c2: 0x12303a, eye: 0x5affd0, arma: 'tridente', crista: 0x1a6a5a, algas: 0x2a5a3a },
    soldadoMemoria: { c1: 0x8ab0c0, c2: 0x3a5a68, eye: 0xd8ffff, trim: 0x9af0ff, arma: 'espada', escudo: 0x3a6a80, capa: 0x1e4a66 },
    guardaEspinhos: { c1: 0x34343c, c2: 0x16161a, eye: 0xffd040, trim: 0xffd040, arma: 'alabarda', espinhos: true, capa: 0x3a1010 },
    guardiao: { c1: 0x3a3444, c2: 0x1c1824, eye: 0xb26bff, semRosto: true, arma: 'montante', larg: 1.15, capa: 0x241a30 },
    carrasco: { c1: 0x3a2a2c, c2: 0x1a1214, eye: 0xff3030, semRosto: true, arma: 'machado', grande: true, larg: 1.2, chifres: true, capa: 0x4a0a0a },
    guardiaoBranco: { c1: 0xdcdce4, c2: 0xa4a4b2, eye: 0x7ad8ff, trim: 0x7ad8ff, semRosto: true, arma: 'lanca', capa: 0xe8e8f0, larg: 1.1 },
    guardiaoBrancoRio: { c1: 0xf4f4fa, c2: 0xc0c4d0, eye: 0x9af0ff, trim: 0xffe9a8, semRosto: true, arma: 'lanca', capa: 0xf0ece0, larg: 1.1 },
    primeiroGuardiao: { c1: 0xf4f4f8, c2: 0xc8c8d4, eye: 0xffd040, trim: 0xffd040, arma: 'cajado', capa: 0xc89a30, crista: 0xffd040, larg: 1.1 },
  };
  const ALTURA_CAV = 1.95;                                                  // topo do elmo no molde
  function bakeCav(t) {
    if (cache['cav_' + t]) return cache['cav_' + t];
    const o = CAV[t], L = o.larg || 1, PI = Math.PI;
    const OSSOS = [['quadril', -1, 0, 1.0, 0], ['peito', 0, 0, 1.22, 0], ['cabeca', 1, 0, 1.6, 0],
      ['ombroD', 1, -.33 * L, 1.5, 0], ['cotoveloD', 3, -.36 * L, 1.2, 0], ['ombroE', 1, .33 * L, 1.5, 0], ['cotoveloE', 5, .36 * L, 1.2, 0],
      ['coxaD', 0, -.13, .96, 0], ['joelhoD', 7, -.13, .54, 0], ['coxaE', 0, .13, .96, 0], ['joelhoE', 9, .13, .54, 0], ['capa', 1, 0, 1.52, -.2]];
    const idx = {}; OSSOS.forEach((b, i) => idx[b[0]] = i);
    const root = new THREE.Group();
    const p = (osso, geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz); m.userData.osso = idx[osso]; root.add(m); return m; };
    const a1 = M(o.c1, { metalness: .6, roughness: .35 }), a2 = M(o.c2, { metalness: .4, roughness: .6 }), couro = M(0x4a3424, { roughness: .9 });
    const glow = B(o.eye), tr = o.trim ? B(o.trim) : a2, aco = M(0xc8ccd4, { metalness: .8, roughness: .25 }), ouro = M(0xd8b048, { metalness: .8, roughness: .3 });
    const meia = new THREE.SphereGeometry(1, 14, 8, 0, PI * 2, 0, PI / 2);
    // tronco: peitoral arredondado (mais largo no peito, fino na cintura), faixas do abdômen e o cinto
    const perfil = [[.15, .98], [.19, 1.06], [.2, 1.15], [.24, 1.3], [.27, 1.42], [.25, 1.5], [.16, 1.56], [.08, 1.58]].map(([r, y]) => new THREE.Vector2(r, y));
    p('peito', new THREE.LatheGeometry(perfil, 16), a1, 0, 0, 0, L, 1, .72);
    for (const y of [1.08, 1.16]) p('peito', new THREE.TorusGeometry(.205, .022, 6, 18), a2, 0, y, 0, L, .72, 1, PI / 2);
    p('peito', GEO.box, tr, 0, 1.32, .195, .03, .34, .03, -.12);
    if (o.trim) p('peito', GEO.crystal, glow, 0, 1.38, .2, .5, .7, .3);
    p('quadril', new THREE.TorusGeometry(.19, .03, 6, 18), couro, 0, .98, 0, L, .75, 1, PI / 2);
    p('quadril', GEO.box, ouro, 0, .98, .145, .08, .07, .03);
    // saiote de placas e, nos que têm capa, o tabardo na frente
    p('quadril', new THREE.CylinderGeometry(.2, .29, .3, 14, 1, true), a2, 0, .84, 0, L, 1, .8);
    if (o.capa) p('quadril', GEO.box, M(o.capa, { roughness: .9 }), 0, .78, .23, .17, .42, .015, .08);
    // pescoço e ombreiras em camadas (inclinadas para fora)
    p('peito', GEO.cyl, a2, 0, 1.6, 0, .09, .08, .09);
    for (const s of [-1, 1]) {
      p('peito', meia, a1, s * .34 * L, 1.49, 0, .17, .13, .18, 0, 0, -s * .45);
      p('peito', meia, a2, s * .38 * L, 1.42, 0, .15, .1, .16, 0, 0, -s * .55);
      if (o.trim) p('peito', GEO.box, tr, s * .4 * L, 1.47, 0, .015, .015, .3, 0, 0, -s * .5);
      if (o.espinhos) for (const z of [-.08, 0, .08]) p('peito', GEO.cone, ouro, s * .4 * L, 1.6, z, .03, .2, .03, 0, 0, -s * .6);
      if (o.algas) p('peito', GEO.box, M(o.algas, { roughness: 1 }), s * .3 * L, 1.32, .12, .03, .3, .01, .1, 0, s * .2);
      const ob = s < 0 ? 'D' : 'E';
      // braço: manga de malha, cotoveleira, manopla que alarga no punho e a mão
      p('ombro' + ob, GEO.cyl, a2, s * .345 * L, 1.36, 0, .062, .3, .062);
      p('cotovelo' + ob, GEO.sph, a1, s * .36 * L, 1.2, -.01, .075, .075, .075);
      p('cotovelo' + ob, new THREE.CylinderGeometry(.08, .058, .26, 12), a1, s * .365 * L, 1.05, 0);
      p('cotovelo' + ob, GEO.sph, a2, s * .37 * L, .9, .01, .062, .07, .065);
      // perna: coxa, joelheira, caneleira e bota com bico de metal
      p('coxa' + ob, new THREE.CylinderGeometry(.095, .08, .42, 12), a2, s * .13, .76, 0);
      p('joelho' + ob, GEO.sph, a1, s * .13, .54, .04, .088, .085, .08);
      p('joelho' + ob, new THREE.CylinderGeometry(.082, .062, .42, 12), a1, s * .13, .32, 0);
      p('joelho' + ob, GEO.sph, a2, s * .13, .07, .04, .09, .07, .16);
      p('joelho' + ob, GEO.sph, a1, s * .13, .07, .15, .07, .055, .07);
    }
    // cabeça: elmo redondo; com rosto = viseira com a fenda dos olhos brilhando; sem rosto = máscara lisa com uma marca
    p('cabeca', GEO.sph, a1, 0, 1.76, 0, .165, .18, .175);
    if (o.semRosto) {
      p('cabeca', GEO.sph, M(0xe8e4dc, { roughness: .3 }), 0, 1.74, .05, .14, .16, .14);
      p('cabeca', GEO.box, glow, 0, 1.77, .19, .02, .13, .01);
    } else {
      p('cabeca', GEO.box, a2, 0, 1.75, .14, .3, .07, .09);
      p('cabeca', GEO.box, glow, 0, 1.755, .185, .2, .024, .01);
      p('cabeca', GEO.box, a2, 0, 1.67, .15, .02, .1, .04);
    }
    p('cabeca', GEO.box, o.crista ? M(o.crista) : tr, 0, 1.93, -.01, .035, .06, .32);
    if (o.crista) p('cabeca', GEO.sph, M(o.crista, { roughness: 1 }), 0, 1.95, -.16, .045, .07, .2, .5);
    if (o.chifres) for (const s of [-1, 1]) p('cabeca', GEO.cone, M(0x2a1a1a, { roughness: .6 }), s * .2, 1.9, 0, .055, .34, .055, 0, 0, -s * .7);
    // capa presa nos ombros (alarga embaixo e mexe com o vento)
    if (o.capa) {
      const cg = new THREE.PlaneGeometry(.5 * L, .95, 2, 6); cg.translate(0, -.475, 0);
      const ps = cg.attributes.position; for (let i = 0; i < ps.count; i++) { const y = ps.getY(i); ps.setX(i, ps.getX(i) * (1 - y * .55)); ps.setZ(i, -Math.abs(ps.getX(i)) * .25 + y * .05); }
      cg.computeVertexNormals(); p('capa', cg, M(o.capa, { roughness: .9, side: THREE.DoubleSide }), 0, 1.52, -.2);
    }
    // arma na mão direita (aponta para a frente; o cotovelo dobrado a deixa erguida)
    const hx = -.37 * L, hy = .9, A = o.arma, brilho = o.trim ? tr : glow;
    const lamina = (len, w, z0, guarda) => {
      p('cotoveloD', GEO.cyl, couro, hx, hy, z0 - .02, .024, .22, .024, PI / 2);
      p('cotoveloD', GEO.sph, ouro, hx, hy, z0 - .14, .04, .04, .04);
      p('cotoveloD', GEO.box, ouro, hx, hy, z0 + .1, guarda, .04, .05);
      p('cotoveloD', GEO.box, aco, hx, hy, z0 + .12 + len / 2, w, .016, len);
      p('cotoveloD', GEO.cone, aco, hx, hy, z0 + .12 + len + .07, w / 2, .14, .008, PI / 2);
      p('cotoveloD', GEO.box, brilho, hx, hy, z0 + .12 + len * .45, .014, .02, len * .8);
    };
    const haste = (z0, z1, r, mat) => p('cotoveloD', GEO.cyl, mat, hx, hy, (z0 + z1) / 2, r, z1 - z0, r, PI / 2);
    const lamMachado = (z, raio) => { p('cotoveloD', new THREE.CylinderGeometry(raio, raio, .03, 16, 1, false, 0, PI), aco, hx, hy + .02, z, 1, 1, 1, 0, 0, PI / 2); p('cotoveloD', GEO.box, brilho, hx, hy + raio * .55, z, .035, .02, raio * 1.4); };
    if (A === 'espada') lamina(.85, .075, 0, .26);
    else if (A === 'montante') lamina(1.35, .11, 0, .36);
    else if (A === 'machado') { const g = o.grande ? 1.4 : 1; haste(-.2, .95 * g, .03, couro); lamMachado(.8 * g, .24 * g); p('cotoveloD', GEO.cone, aco, hx, hy - .1, .8 * g, .03, .2, .03, PI); }
    else if (A === 'lanca' || A === 'alabarda' || A === 'tridente') {
      haste(-.75, 1.65, .03, A === 'lanca' ? M(0xd8c8a0, { roughness: .4 }) : couro);
      p('cotoveloD', new THREE.TorusGeometry(.05, .015, 6, 12), brilho, hx, hy, 1.6);
      if (A === 'tridente') { p('cotoveloD', GEO.box, aco, hx, hy, 1.66, .26, .03, .03); for (const dx of [-.11, 0, .11]) p('cotoveloD', GEO.cone, aco, hx + dx, hy, 1.85, .03, .36, .03, PI / 2); }
      else p('cotoveloD', GEO.cone, aco, hx, hy, 1.86, .07, .44, .02, PI / 2);
      if (A === 'alabarda') lamMachado(1.5, .2);
    } else if (A === 'cajado') {
      haste(-.6, 1.4, .035, ouro);
      p('cotoveloD', GEO.sph, glow, hx, hy, 1.55, .13, .13, .13);
      for (let k = 0; k < 2; k++) p('cotoveloD', new THREE.TorusGeometry(.19, .015, 6, 18), ouro, hx, hy, 1.55, 1, 1, 1, k ? 1.1 : .3, k ? .5 : 1.2, 0);
    }
    // escudo pontudo no braço esquerdo, com o emblema brilhando
    if (o.escudo) {
      const sh = new THREE.Shape(); sh.moveTo(-.2, .26); sh.lineTo(.2, .26); sh.quadraticCurveTo(.24, .02, .0, -.38); sh.quadraticCurveTo(-.24, .02, -.2, .26);
      const eg = new THREE.ExtrudeGeometry(sh, { depth: .035, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 1, curveSegments: 6 });
      p('cotoveloE', eg, M(o.escudo, { metalness: .5, roughness: .45 }), .37 * L + .05, 1.02, .08, 1, 1, 1, 0, .45, 0);
      p('cotoveloE', GEO.crystal, brilho, .37 * L + .1, 1.04, .16, .35, .45, .2, 0, .45, 0);
    }
    // junta tudo numa malha com cor por vértice, o brilho na emissão e o osso de cada peça
    root.updateMatrixWorld(true);
    const lista = []; let n = 0;
    root.traverse(m => { if (!m.isMesh) return; const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld); lista.push({ g, mat: m.material, b: m.userData.osso }); n += g.attributes.position.count; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), em = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    let off = 0;
    for (const { g, mat, b } of lista) {
      const c = g.attributes.position.count; pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3);
      let cor = new THREE.Color(0), e;
      // cor própria (o lit() geral satura os brancos: o Guardião Branco ficava azul): só clareia o que é muito escuro
      if (mat.isMeshBasicMaterial) e = mat.color; else { const hsl = {}; cor = mat.color.clone().convertLinearToSRGB(); cor.getHSL(hsl); cor.setHSL(hsl.h, Math.min(hsl.s, .7) * (hsl.l > .75 ? .3 : 1), Math.max(.4, Math.min(.84, hsl.l * 1.2 + .1))); cor.convertSRGBToLinear(); e = cor.clone().multiplyScalar(.34); }
      for (let i = 0; i < c; i++) { const j = off + i; col[j * 3] = cor.r; col[j * 3 + 1] = cor.g; col[j * 3 + 2] = cor.b; em[j * 3] = e.r; em[j * 3 + 1] = e.g; em[j * 3 + 2] = e.b; si[j * 4] = b; sw[j * 4] = 1; }
      off += c; g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aEm', new THREE.BufferAttribute(em, 3)); geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    geo.computeBoundingBox(); geo.computeBoundingSphere(); geo.boundingSphere.radius *= 1.3;   // folga para os braços e a arma em movimento
    return (cache['cav_' + t] = { geo, OSSOS });
  }
  // poses do braço da arma no golpe: [ombro x, cotovelo x, giro do peito] — descanso, preparo e golpe
  const GOLPE = {
    corte: [[0, -.6, 0], [-2.7, -.5, .4], [-.7, .15, -.35]],
    estocada: [[0, -.6, 0], [.5, -1.5, .3], [-1.25, .85, -.25]],
    magia: [[0, -1.1, 0], [-1.0, -1.3, .2], [-1.7, .5, -.1]],
  };
  const TIPO_GOLPE = { espada: 'corte', montante: 'corte', machado: 'corte', lanca: 'estocada', alabarda: 'estocada', tridente: 'estocada', cajado: 'magia' };
  const suave = x => x * x * (3 - 2 * x);
  function cavMob(type, t, r) {
    const K = bakeCav(t), o = CAV[t], d = SPR_MOBS[type] || SPR_MOBS[t] || { h: 3 }, H = d.h || 3, k = H / ALTURA_CAV;
    const ossos = K.OSSOS.map(() => new THREE.Bone());
    K.OSSOS.forEach(([, pai, x, y, z], i) => { if (pai < 0) ossos[i].position.set(x, y, z); else { const q = K.OSSOS[pai]; ossos[i].position.set(x - q[2], y - q[3], z - q[4]); ossos[pai].add(ossos[i]); } });
    const sk = new THREE.SkinnedMesh(K.geo, LITM); sk.add(ossos[0]); sk.bind(new THREE.Skeleton(ossos));
    sk.castShadow = !TOUCH || !!(MOBDEF[type] && (MOBDEF[type].boss || MOBDEF[type].alfa));
    const body = new THREE.Group(); body.add(sk); body.scale.setScalar(k); r.g.add(body);
    const [quadril, peito, cabeca, ombroD, cotoveloD, ombroE, cotoveloE, coxaD, joelhoD, coxaE, joelhoE, capa] = ossos;
    const G = GOLPE[TIPO_GOLPE[o.arma] || 'corte'], ph = Math.random() * 10, base = quadril.position.y;
    const doisMaos = o.arma === 'montante' || (o.arma === 'machado' && o.grande);
    r.m3 = true; r.mats = []; r.h = H; r.body = body;
    let fase = ph, ultimo = null;
    r.anim = (m, time) => {
      const dt = ultimo === null ? 0 : Math.min(0.1, time - ultimo); ultimo = time;
      const mv = m.moving; fase += dt * (mv ? 7.5 : 0);
      const s = Math.sin(fase), c = Math.cos(fase), a = mv ? 1 : 0;
      // pernas: a coxa vai e volta e o joelho dobra quando a perna passa para a frente
      coxaD.rotation.x = -s * .6 * a; coxaE.rotation.x = s * .6 * a;
      joelhoD.rotation.x = (Math.max(0, c) * .95 + .05) * a; joelhoE.rotation.x = (Math.max(0, -c) * .95 + .05) * a;
      // quadril sobe no meio do passo e gira um pouco; o peito gira ao contrário (andar de gente, não de boneco)
      const resp = Math.sin(time * 1.8 + ph);
      quadril.position.y = base + (mv ? Math.abs(c) * .035 - .02 : resp * .006);
      quadril.rotation.y = s * .1 * a; peito.rotation.set(mv ? .08 : resp * .015, -s * .16 * a, 0);
      cabeca.rotation.set(0, mv ? s * .06 : Math.sin(time * .6 + ph) * .18, 0);
      // braços balançam ao contrário das pernas, um pouco abertos
      ombroE.rotation.set(-s * .5 * a + resp * .02, 0, .12); cotoveloE.rotation.x = -.35 - Math.max(0, -s) * .3 * a;
      ombroD.rotation.set(s * .3 * a, 0, -.12); cotoveloD.rotation.x = G[0][1];
      // golpe: ergue (ou recua) a arma, desce rápido e volta ao descanso
      const sw = m.swing || 0;
      if (sw > 0.01) {
        const pp = 1 - sw; let pose;
        if (pp < .35) { const f = suave(pp / .35); pose = G[0].map((v, i) => v + (G[1][i] - v) * f); }
        else if (pp < .55) { const f = suave((pp - .35) / .2); pose = G[1].map((v, i) => v + (G[2][i] - v) * f); }
        else { const f = suave((pp - .55) / .45); pose = G[2].map((v, i) => v + (G[0][i] - v) * f); }
        ombroD.rotation.x = pose[0]; cotoveloD.rotation.x = pose[1]; peito.rotation.y += pose[2];
        const forca = pp > .35 && pp < .7 ? Math.sin((pp - .35) / .35 * Math.PI) : 0;
        peito.rotation.x += forca * .25; body.position.z = forca * .12 * H;
        if (doisMaos) { ombroE.rotation.x = pose[0] * .9; ombroE.rotation.z = -.25; cotoveloE.rotation.x = pose[1]; }
      } else body.position.z = 0;
      // capa: voa para trás ao andar e balança devagar parada
      capa.rotation.x = mv ? .45 + Math.sin(fase * 2) * .08 : .06 + Math.sin(time * 1.3 + ph) * .04;
      body.scale.setScalar(k * (m.flash > 0 ? 1.08 : 1));
    };
    return r;
  }
  // ---------------- um monstro no mundo
  function mob(type, r) {
    if (CRAB[baseOf(type)]) return crabMob(type, baseOf(type), r);
    if (CAV[baseOf(type)]) return cavMob(type, baseOf(type), r);
    const t = baseOf(type), K = bake(t), d = SPR_MOBS[type] || SPR_MOBS[t] || { h: 1.5 };
    const H = (d.h || 1.5) * (SIDE.has(t) ? 0.85 : 1), k = SIDE.has(t) ? (d.h || 1.5) * 1.45 / K.len : H / K.h;
    const body = new THREE.Group(); body.scale.setScalar(k); body.position.y = -K.minY * k; r.g.add(body);
    const cast = !TOUCH || (MOBDEF[type] && (MOBDEF[type].boss || MOBDEF[type].alfa));
    for (const p of K.parts) { const m = new THREE.Mesh(p.geo, p.mat); m.castShadow = cast; body.add(m); }
    const fl = FLOAT.has(t), ph = Math.random() * 10;
    r.m3 = true; r.mats = []; r.h = K.h * k + (fl ? 0.5 : 0); r.body = body;
    r.anim = (m, time) => {
      const mv = m.moving, sw = m.swing || 0;
      const bob = fl ? 0.45 + Math.sin(time * 2.4 + ph) * 0.18 : mv ? Math.abs(Math.sin(time * 9 + ph)) * 0.022 * H : 0;   // passo curto (era um pulo de 6%: "pulando Atari")
      body.position.y = -K.minY * k + bob;
      const sq = SIDE.has(t) ? (mv ? Math.sin(time * 10 + ph) * 0.06 : Math.sin(time * 2 + ph) * 0.025) : Math.sin(time * 2.2 + ph) * 0.02;
      const hit = m.flash > 0 ? 1.12 : 1;
      body.scale.set(k * (1 - sq * 0.5) * hit, k * (1 + sq) * hit, k * (1 + sq * 0.6) * hit);
      body.position.z = sw * 0.35 * H;                                   // bote do ataque
      if (t === 'serpe') body.rotation.y = Math.sin(time * (mv ? 7 : 2) + ph) * (mv ? 0.22 : 0.06);   // 🐍 serpenteia rente à areia (antes flutuava e parecia passar por cima do mapa)
      body.rotation.x = sw * 0.25 + (mv && !fl ? 0.06 : 0); body.rotation.z = fl ? Math.sin(time * 1.7 + ph) * 0.08 : mv ? Math.sin(time * 9 + ph) * 0.025 : 0;   // andando: balanço leve (0,07 deixava torto) e inclina para frente
    };
    return r;
  }
  return { has, mob };
})();
