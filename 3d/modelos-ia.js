// =====================================================================
//  Modelos 3D feitos com IA (Meshy) para os chefes que eram desenhos de pixel.
//  O modelo vem dividido em 5 peças (corpo, braços no ombro e pernas no quadril)
//  e é animado aqui mesmo: anda balançando braços e pernas e golpeia com o braço.
//  Carrega depois que o jogo abre (não atrasa o começo); até lá, o chefe usa o desenho antigo.
// =====================================================================
'use strict';
const ModelosIA = (() => {
  // tipo do monstro → arquivo (models/<arq>.js) e altura no jogo
  const MAPA = { cristalizado: { arq: 'guerreiro_ia', h: 4.6 } };
  const lib = {};
  function b64ToBuf(b64) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
  function carregarScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  async function carregar(arq) {
    if (lib[arq] || !THREE.GLTFLoader) return;
    try {
      if (!(window.GLB && window.GLB[arq])) await carregarScript(`${window.GAME_BASE || ''}models/${arq}.js`);
      const gltf = await new Promise((res, rej) => new THREE.GLTFLoader().parse(b64ToBuf(window.GLB[arq]), '', res, rej));
      delete window.GLB[arq];
      lib[arq] = gltf.scene;
      trocarExistentes();
    } catch (e) { console.warn('Modelo IA indisponível:', arq, e); }
  }
  // o chefe que já estava no mapa (nasceu antes do modelo carregar) troca o desenho antigo pelo 3D na hora
  function trocarExistentes() {
    if (typeof mobs === 'undefined' || typeof mobModel !== 'function') return;
    for (const m of mobs) {
      if (m.dead || !has(m.type) || (m.model && m.model.ia)) continue;
      try {
        const velho = m.model, novo = mobModel(m.type);
        novo.g.position.copy(velho.g.position); novo.g.rotation.y = velho.g.rotation.y; novo.g.scale.copy(velho.g.scale);
        scene.remove(velho.g); if (velho.spr && velho.spr.dispose) velho.spr.dispose(); scene.add(novo.g); m.model = novo;
      } catch (e) { console.warn('troca do modelo', e); }
    }
  }
  setTimeout(() => { for (const k in MAPA) carregar(MAPA[k].arq); }, 600);
  // vitrine para testar no celular: abra o jogo com #ver-guerreiro no fim do link.
  // Aparece um Guerreiro parado na sua frente, que não ataca, não morre e some sozinho em 3 minutos (só você vê).
  let vitrine = null;
  setInterval(() => {
    if (!/ver-guerreiro/.test(location.hash) || vitrine || typeof running === 'undefined' || !running || !has('cristalizado') || inTower(P.z)) return;
    const x = P.x + Math.sin(P.face) * 7, z = P.z + Math.cos(P.face) * 7;
    const m = spawnMob('cristalizado', null, { x, z }); vitrine = m;
    m.d = { ...m.d, speed: 0, aggro: 0, atk: 0, drops: [], xp: 0, zeny: [0, 0] }; m.invul = true; m.noRespawn = true; m.state = 'idle'; m.face = Math.atan2(P.x - x, P.z - z);
    log('🧪 <b>Vitrine:</b> o Guerreiro Cristalizado em 3D apareceu na sua frente (só você vê; some em 3 minutos). A cada pouco ele mostra o golpe.', 'sys');
    const golpe = setInterval(() => { if (m.dead) return clearInterval(golpe); m.swing = 1; }, 4000);
    setTimeout(() => { clearInterval(golpe); m.dead = true; mobs = mobs.filter(o => o !== m); scene.remove(m.model.g); m.lab.remove(); }, 180e3);
  }, 1000);
  const has = t => !!(MAPA[t] && lib[MAPA[t].arq]);

  function mob(type, r) {
    const D = MAPA[type], obj = lib[D.arq].clone(true);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });   // mais leve que o material padrão; um por monstro (pisca ao levar golpe)
    const cast = !TOUCH || (MOBDEF[type] && MOBDEF[type].boss);
    obj.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = cast; } });
    const corpo = new THREE.Group(); corpo.add(obj); corpo.scale.setScalar(D.h); r.g.add(corpo);
    const peca = n => obj.getObjectByName(n) || new THREE.Object3D();
    const bE = peca('bracoE'), bD = peca('bracoD'), pE = peca('pernaE'), pD = peca('pernaD');
    const ph = Math.random() * 10;
    r.mats = [mat]; r.h = D.h; r.ia = true;
    r.anim = (m, t) => {
      const mv = m.moving, sw = m.swing || 0, passo = mv ? Math.sin(t * 6 + ph) : 0;
      pE.rotation.x = passo * 0.5; pD.rotation.x = -passo * 0.5;                        // pernas
      bE.rotation.set(-passo * 0.35, 0, -1.25 + Math.sin(t * 1.8 + ph) * 0.04);         // braços caídos, balançando ao andar
      bD.rotation.set(passo * 0.35 - Math.sin(Math.min(1, sw) * Math.PI) * 1.9, 0, 1.25 - Math.sin(t * 1.8 + ph) * 0.04);   // golpe: o braço da espada desce
      corpo.position.y = mv ? Math.abs(Math.sin(t * 6 + ph)) * 0.08 : Math.sin(t * 2 + ph) * 0.03;
      corpo.rotation.x = sw * 0.12;
      if (m.enraged) mat.color.setRGB(1.25, 0.8, 0.8); else mat.color.setRGB(1, 1, 1);
    };
    return r;
  }
  return { has, mob, trocar: trocarExistentes };
})();
