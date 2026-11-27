// =====================================================================
//  🏘️ As outras cidades no estilo da capital, em menor tamanho (pedido do Rone: "se ficar bom o que
//  fez em Solmira, faça em todos os outros, mas em menor tamanho"). Em cada cidade, de forma automática
//  (sem cobrir NPC nem bloquear caminho): moradores andando, lampiões, varal de bandeirinhas e, nas
//  cidades de comércio, barracas com vendedor anunciando. Criado para o jogo.
// =====================================================================
'use strict';
const Cidades = (() => {
  const LISTA = [
    { z: 'kharum', c: OAS, R: 24, n: 7, rostos: ['s_mascate', 's_aldea', 's_refugiada', 's_menino'], feira: [['Tâmaras e figos!', 'Água fresca do oásis!', 'Tapete bordado, olha só!'], ['Especiarias de longe!', 'Lenço contra a areia!', 'Barato, barato!']], cores: ['#c8862a', '#e8d0a0', '#8a3a2a'] },
    { z: 'cidadela', c: { x: 186, z: 5 }, R: 18, n: 6, rostos: ['s_aldeao', 's_estranho', 's_senhora'], feira: [['Pedra de amolar!', 'Flechas bem retas!'], ['Ração para a viagem!', 'Pão de soldado, dura um mês!']], cores: ['#5a6a8a', '#d8d0c0', '#8a2a2a'] },
    { z: 'praia', c: PVILA, R: 20, n: 6, rostos: ['s_aldea', 's_aldeao', 's_menina', 's_menino'], feira: [['Peixe frito na hora!', 'Água de coco gelada!'], ['Conchas da sorte!', 'Chapéu de palha contra o sol!']], cores: ['#3a8ab0', '#f0f0e8', '#e8a040'] },
    { z: 'acampamento', c: { x: -112, z: -667 }, R: 14, n: 5, rostos: ['s_refugiada', 's_aldeao', 's_ancia'], feira: [['Sopa quente para quem chega!', 'Cobertor de lã!'], ['Lenha seca!', 'Remendo armadura!']], cores: ['#6a5a4a', '#c8b898', '#4a6a4a'] },
    { z: 'clareira', c: { x: 361, z: -749 }, R: 12, n: 4, rostos: ['s_menina', 's_ancia', 's_leitor'], cores: ['#4a8a5a', '#e8f0c8', '#c8a040'] },
    { z: 'vigilia', c: { x: 742, z: -742 }, R: 12, n: 4, rostos: ['s_estranho', 's_ancia', 's_leitor'], cores: ['#4a4a5a', '#c8c8d0', '#6a5a8a'] },
    { z: 'refugio', c: { x: 1085, z: -761 }, R: 10, n: 4, rostos: ['s_refugiada', 's_leitor', 's_menina'], cores: ['#5a4a8a', '#d8d0f0', '#3a6a9a'] },
    { z: 'margem', c: { x: 1451, z: -759 }, R: 9, n: 3, rostos: ['s_estranho', 's_ancia'], cores: ['#2a6a7a', '#c8e8f0', '#d8c070'] },
  ];
  const ferro = new THREE.MeshLambertMaterial({ color: 0x2c2a2a }), luz = new THREE.MeshBasicMaterial({ color: 0xffc070, toneMapped: false });
  const longeNPC = (x, z, d) => !NPCS.some(n => Math.hypot(n.x - x, n.z - z) < d);
  const livre = (x, z, r = 0.5) => !blocked(x, z, r) && !isWater(x, z);
  const caminhoLivre = (a, b) => { const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / 0.6); for (let i = 1; i <= n; i++) if (!livre(a.x + (b.x - a.x) * i / n, a.z + (b.z - a.z) * i / n)) return false; return true; };
  const flagT = cores => { const c = document.createElement('canvas'); c.width = 96; c.height = 32; const x = c.getContext('2d'); for (let i = 0; i < 6; i++) { x.fillStyle = cores[i % cores.length]; x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16 + 16, 0); x.lineTo(i * 16 + 8, 26); x.fill(); } const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t; };
  let pronto = false;
  function montar() {
    for (const C of LISTA) {
      const g = new THREE.Group(); scene.add(g); C.g = g; C.lamps = [];
      // lampiões em volta (só onde não atrapalha)
      for (let k = 0; k < 10 && C.lamps.length < 6; k++) {
        const a = k / 10 * TAU + 0.3, x = C.c.x + Math.cos(a) * (C.R + 1), z = C.c.z + Math.sin(a) * (C.R + 1);
        if (!livre(x, z, 0.8) || !longeNPC(x, z, 3)) continue;
        const y = groundY(x, z), p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.2, 7), ferro); p.position.set(x, y + 1.6, z); g.add(p);
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.28), luz); l.position.set(x, y + 3.25, z); g.add(l);
        addOb(x, z, 0.3); C.lamps.push({ x, z, y: y + 3.1 });
      }
      // varal de bandeirinhas entre lampiões vizinhos
      const fm = new THREE.MeshLambertMaterial({ map: flagT(C.cores), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
      for (let i = 0; i < C.lamps.length; i++) { const a = C.lamps[i], b = C.lamps[(i + 1) % C.lamps.length], d = Math.hypot(b.x - a.x, b.z - a.z); if (d > 16 || d < 3) continue;
        const n = Math.floor(d / 1.1);
        for (let k = 1; k < n; k++) { const t = k / n, f = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.45), fm); f.position.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 0.7, a.z + (b.z - a.z) * t); f.rotation.y = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2; f.material = fm; f.userData.ph = k; g.add(f); } }
      // barracas de feira com vendedor (cidades de comércio)
      C.vend = [];
      if (C.feira) for (let k = 0, feitas = 0; k < 24 && feitas < C.feira.length; k++) {
        const a = k / 24 * TAU + 0.7, x = C.c.x + Math.cos(a) * (C.R - 2), z = C.c.z + Math.sin(a) * (C.R - 2);
        if (!livre(x, z, 2.3) || !longeNPC(x, z, 5) || C.vend.some(v => Math.hypot(v.bx - x, v.bz - z) < 9)) continue;
        const ry = Math.atan2(C.c.x - x, C.c.z - z), t = house(x, z, ry, 3.2, 2.4, null, 'tent'); g.attach(t);
        const vx = x - Math.sin(ry) * 1.6, vz = z - Math.cos(ry) * 1.6;
        C.vend.push({ bx: x, bz: z, x: vx, z: vz, ry, fala: C.feira[feitas], cd: 4 + Math.random() * 10 }); feitas++;
      }
      decor(g, 25);
      // caminhos dos moradores
      const nos = [];
      for (const [rr, n] of [[0.45, 8], [0.8, 12]]) for (let k = 0; k < n; k++) { const a = k / n * TAU, x = C.c.x + Math.cos(a) * C.R * rr, z = C.c.z + Math.sin(a) * C.R * rr; if (livre(x, z)) nos.push({ x, z }); }
      for (const v of C.vend) nos.push({ x: v.bx + Math.sin(v.ry) * 2.2, z: v.bz + Math.cos(v.ry) * 2.2, loja: v });
      for (const n of nos) n.viz = nos.filter(o => o !== n && Math.hypot(o.x - n.x, o.z - n.z) < 12 && caminhoLivre(n, o));
      C.nos = nos.filter(n => n.viz.length);
      C.mor = [];
    }
    pronto = true;
  }
  const baloes = [];
  function falar(o, txt) {
    if (baloes.length >= 4 || baloes.some(b => b.o === o)) return;
    const el = document.createElement('div'); el.className = 'bubble fala-vila'; el.textContent = txt; document.getElementById('labels').appendChild(el); baloes.push({ el, o, t: 3.4 });
  }
  const COMPRA = ['Quanto custa?', 'Vou levar dois!', 'Está fresquinho?', 'Faz um desconto?'];
  function update(dt) {
    if (typeof running === 'undefined' || !running) return;
    if (!pronto) { if (typeof SpriteKit === 'undefined' || !SpriteKit.ready) return; montar(); }
    const t = performance.now() / 1000;
    for (const C of LISTA) {
      const perto = !inTower(P.z) && Math.hypot(P.x - C.c.x, P.z - C.c.z) < C.R + 60;
      for (const m of C.mor) m.g.visible = perto; for (const v of C.vend) if (v.g) v.g.visible = perto;
      if (!perto) continue;
      if (!C.mor.length && C.nos.length) {                      // cria na primeira vez que alguém chega perto
        for (let i = 0; i < C.n; i++) { const no = C.nos[(i * 5) % C.nos.length], g = new THREE.Group(); scene.add(g); const act = SpriteKit.actor({ kind: 'dir', base: C.rostos[i % C.rostos.length] }); g.add(act.root);
          C.mor.push({ g, act, x: no.x, z: no.z, no, alvo: null, para: Math.random() * 4, face: Math.random() * TAU, vel: /menin/.test(C.rostos[i % C.rostos.length]) ? 2.2 : 1.1 + Math.random() * 0.4 }); }
        for (const v of C.vend) { v.g = new THREE.Group(); scene.add(v.g); v.act = SpriteKit.actor({ kind: 'dir', base: C.rostos[0] }); v.g.add(v.act.root); v.g.position.set(v.x, groundY(v.x, v.z), v.z); }
      }
      for (const m of C.mor) {
        let anda = false;
        if (m.para > 0) m.para -= dt;
        else { if (!m.alvo) { const v = m.no.viz; m.alvo = v[Math.floor(Math.random() * v.length)]; }
          const dx = m.alvo.x - m.x, dz = m.alvo.z - m.z, d = Math.hypot(dx, dz), passo = m.vel * dt;
          if (d <= passo) { m.x = m.alvo.x; m.z = m.alvo.z; m.no = m.alvo; m.alvo = null; m.para = m.no.loja ? 4 + Math.random() * 4 : Math.random() < 0.5 ? 1 + Math.random() * 3 : 0;
            if (m.no.loja) { m.face = m.no.loja.ry + Math.PI; if (Math.random() < 0.5) falar(m, COMPRA[Math.floor(Math.random() * COMPRA.length)]); } }
          else { m.x += dx / d * passo; m.z += dz / d * passo; m.face = Math.atan2(dx, dz); anda = true; } }
        const pd = Math.hypot(P.x - m.x, P.z - m.z);
        m.g.position.set(m.x, groundY(m.x, m.z), m.z);
        m.act.update(dt, { face: !anda && pd < 4 ? Math.atan2(P.x - m.x, P.z - m.z) : m.face, moving: anda });
      }
      for (const v of C.vend) if (v.act) { const pd = Math.hypot(P.x - v.x, P.z - v.z); v.act.update(dt, { face: pd < 5 ? Math.atan2(P.x - v.x, P.z - v.z) : v.ry, moving: false });
        if ((v.cd -= dt) <= 0) { v.cd = 10 + Math.random() * 12; if (pd < 25) falar(v, v.fala[Math.floor(Math.random() * v.fala.length)]); } }
      C.g.children.forEach(f => { if (f.userData.ph) f.rotation.x = Math.sin(t * 2 + f.userData.ph) * 0.25; });   // bandeirinhas ao vento
    }
    for (let i = baloes.length - 1; i >= 0; i--) { const b = baloes[i]; b.t -= dt; if (b.t <= 0 || !b.o.g.visible) { b.el.remove(); baloes.splice(i, 1); continue; }
      const sp = toScreen(b.o.x, groundY(b.o.x, b.o.z) + 2.5, b.o.z); b.el.style.display = sp.vis && !(typeof dialogOpen !== 'undefined' && dialogOpen) ? '' : 'none'; b.el.style.opacity = Math.min(1, b.t * 2); b.el.style.transform = `translate(${sp.x | 0}px,${sp.y | 0}px) translate(-50%,-100%)`; }
  }
  // para as conversas (conversas.js): os moradores das outras cidades também batem papo
  const moradores = () => LISTA.flatMap(C => C.mor || []);
  return { update, moradores };
})();
