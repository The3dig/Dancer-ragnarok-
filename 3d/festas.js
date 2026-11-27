// =====================================================================
//  🎉 Festa do dia nas vilas (pedido do Rone: "não esquece que acontecem eventos diários nas vilas").
//  Cada dia da semana uma vila faz festa O DIA INTEIRO (todo mundo vê a mesma). Pela vila ficam escondidos 12 objetos
//  da festa (objetos 3D, nada de desenho chapado): encostar num deles dá um presentinho, e achar os 12 dá o prêmio
//  grande do dia. Cada personagem pode achar os 12 uma vez por dia; à meia-noite os objetos trocam de lugar.
//  As festas são criadas para o jogo (não estão no livro).
// =====================================================================
'use strict';
const Festas = (() => {
  const N = 12;
  const hoje = () => new Date().toLocaleDateString('pt-BR');
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const M = (c, e, o = {}) => new THREE.MeshPhongMaterial({ color: c, emissive: e || 0, shininess: 60, ...o });
  // ---------------- os objetos de cada festa (pequenos modelos 3D)
  const OBJ = {
    cesto: () => { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.3, 12, 1, true), M(0xa8743a, 0x1a0e04, { side: THREE.DoubleSide })); c.position.y = 0.15; g.add(c);
      const al = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 16, Math.PI), M(0x8a5a2a)); al.position.y = 0.3; g.add(al);
      [[0xd83a2a, -0.1, 0.05], [0xf0c030, 0.1, -0.06], [0x5ab040, 0, 0.1], [0xe87a20, 0.08, 0.1]].forEach(([cor, x, z]) => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), M(cor, cor & 0x222222)); f.position.set(x, 0.32, z); g.add(f); }); return g; },
    concha: () => { const g = new THREE.Group(); const m = M(0xf6d8c8, 0x3a2018, { shininess: 100, specular: 0xffffff });
      for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 6), m); r.rotation.z = (i - 3) * 0.28; r.position.set(Math.sin((i - 3) * 0.28) * 0.2, 0.2, 0); r.rotation.x = -0.4; g.add(r); }
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M(0xffffff, 0x666677, { shininess: 140 })); p.position.set(0, 0.12, 0.1); g.add(p); return g; },
    jarro: () => { const pts = [[0, 0], [0.16, 0], [0.26, 0.15], [0.24, 0.35], [0.12, 0.48], [0.11, 0.6], [0.16, 0.64]].map(([x, y]) => new THREE.Vector2(x, y));
      const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 16), M(0xd8a840, 0x4a3000, { shininess: 110, specular: 0xfff0c0, side: THREE.DoubleSide })));
      const f = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.02, 6, 20), M(0x2a6a8a)); f.rotation.x = Math.PI / 2; f.position.y = 0.25; g.add(f); return g; },
    estandarte: () => { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), M(0x5a3a24)); p.position.y = 0.7; g.add(p);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.65), M(0xb83a3a, 0x2a0808, { side: THREE.DoubleSide })); b.position.set(0.26, 1.05, 0); g.add(b);
      const e = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), M(0xf0c040, 0x4a3000, { side: THREE.DoubleSide })); e.position.set(0.26, 1.08, 0.01); g.add(e);
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), M(0xf0c040, 0x4a3000)); t.position.y = 1.42; g.add(t); return g; },
    lanterna: () => { const g = new THREE.Group(); const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff8a3a, toneMapped: false, transparent: true, opacity: 0.9 }));
      corpo.scale.y = 1.25; corpo.position.y = 1.2; g.add(corpo); const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.06, 10), M(0x3a2a1a)); tp.position.y = 1.53; g.add(tp);
      const bs = tp.clone(); bs.position.y = 0.88; g.add(bs); g.userData.flutua = true; return g; },
    suprimento: () => { const g = new THREE.Group(); const sc = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), M(0xc8b088, 0x1a1408)); sc.scale.set(1, 0.85, 0.9); sc.position.y = 0.26; g.add(sc);
      const nó = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 8), M(0xb89a70)); nó.position.y = 0.58; g.add(nó); const co = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 12), M(0x8a3a2a)); co.rotation.x = Math.PI / 2; co.position.y = 0.5; g.add(co); return g; },
    presente: () => { const g = new THREE.Group(); const cor = [0xc83a5a, 0x3a7ac8, 0x4aa85a, 0xd8a030][Math.floor(Math.random() * 4)];
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.5), M(cor, cor & 0x1a1a1a)); c.position.y = 0.21; g.add(c);
      const fita = M(0xf6e070, 0x4a3a00); const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.1), fita); f1.position.y = 0.21; g.add(f1); const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.44, 0.52), fita); f2.position.y = 0.21; g.add(f2);
      for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 6, 12), fita); l.position.set(s * 0.08, 0.47, 0); l.rotation.y = Math.PI / 2; l.rotation.x = s * 0.6; g.add(l); } return g; },
  };
  // domingo = 0 ... sábado = 6
  const FESTAS = [
    { nome: 'Festa da Colheita', ic: '🧺', z: 'solmira', c: () => VIL, R: 32, obj: 'cesto', o: 'cestos de frutas', txt: 'Os moradores espalharam cestos de frutas pela capital para quem ajudar na colheita.' },
    { nome: 'Caça às Conchas', ic: '🐚', z: 'praia', c: () => PVILA, R: 24, obj: 'concha', o: 'conchas da sorte', txt: 'A maré trouxe conchas da sorte para a Vila da Praia. Dizem que cada uma guarda um presente.' },
    { nome: 'Feira dos Jarros', ic: '🏺', z: 'kharum', c: () => OAS, R: 26, obj: 'jarro', o: 'jarros dourados', txt: 'Os mercadores de Kharum esconderam jarros dourados pelo oásis. Quem achar, leva o que tem dentro.' },
    { nome: 'Torneio dos Estandartes', ic: '🚩', z: 'cidadela', c: () => ({ x: 186, z: 5 }), R: 22, obj: 'estandarte', o: 'estandartes', txt: 'Os soldados da Cidadela fincaram estandartes pela cidade: quem tocar em todos é campeão do dia.' },
    { nome: 'Noite das Lanternas', ic: '🏮', z: 'clareira', c: () => ({ x: 361, z: -749 }), R: 18, obj: 'lanterna', o: 'lanternas', txt: 'Na Clareira, lanternas acesas flutuam entre as árvores. Cada uma leva um desejo e devolve um presente.' },
    { nome: 'Fogueira dos Viajantes', ic: '🎒', z: 'acampamento', c: () => ({ x: -112, z: -667 }), R: 18, obj: 'suprimento', o: 'sacos de suprimento', txt: 'No Acampamento, os viajantes deixaram sacos de suprimento para quem chega de longe.' },
    { nome: 'Grande Feira de Solmira', ic: '🎁', z: 'solmira', c: () => VIL, R: 34, obj: 'presente', o: 'presentes', txt: 'Sábado é dia de Grande Feira na capital: há presentes escondidos por toda Solmira.' },
  ];
  const festa = () => FESTAS[new Date().getDay()];
  let objs = [], montadoDia = null, avisouZona = null;
  const geoAnel = new THREE.RingGeometry(0.7, 1.0, 28), matAnel = new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const estado = () => { const F = P.festa = P.festa || {}; if (F.d !== hoje()) { F.d = hoje(); F.pegos = []; F.fim = false; } return F; };
  // lugares do dia: sorteados pela data (todos os jogadores veem os objetos no mesmo lugar)
  function montar() {
    for (const o of objs) { scene.remove(o.g); scene.remove(o.g.userData.anel); } objs = [];
    const f = festa(), c = f.c(), h = hash(hoje() + f.nome), rnd = (k) => (hash(h + ':' + k) % 10000) / 10000;
    for (let i = 0, tent = 0; i < N && tent < 400; tent++) {
      const a = rnd(tent * 2) * Math.PI * 2, r = 5 + rnd(tent * 2 + 1) * f.R, x = c.x + Math.sin(a) * r, z = c.z + Math.cos(a) * r;
      if (blocked(x, z, 0.7) || (typeof isWater === 'function' && isWater(x, z)) || objs.some(o => Math.hypot(o.x - x, o.z - z) < 4)) continue;
      const g = OBJ[f.obj](); g.position.set(x, groundY(x, z), z); g.rotation.y = rnd(tent + 99) * 6.28; g.scale.setScalar(1.25);
      g.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(g);
      const anel = new THREE.Mesh(geoAnel, matAnel); anel.rotation.x = -Math.PI / 2; anel.position.set(x, groundY(x, z) + 0.05, z); scene.add(anel); g.userData.anel = anel;   // brilho no chão para achar de longe
      objs.push({ i, x, z, g, y0: g.position.y }); i++;
    }
    montadoDia = hoje();
  }
  function dar(itens, titulo) {
    const partes = [];
    for (const [k, q] of Object.entries(itens)) {
      if (!q) continue;
      if (k === 'cr') { P.zeny += q; partes.push(`${q.toLocaleString('pt-BR')} cr`); }
      else if (k === 'xp') { gainXp(q); partes.push(`${q.toLocaleString('pt-BR')} XP`); }
      else if (ITEMS[k]) { P.inv[k] = (P.inv[k] || 0) + q; partes.push(`${q} ${ITEMS[k].ic} ${ITEMS[k].name}`); }
    }
    log(`${titulo} ${partes.join(', ')}.`, 'gold'); if (typeof buildHotbar === 'function') buildHotbar(); try { save(); } catch (e) { }
  }
  function pegar(o) {
    const F = estado(), f = festa(), L = Math.max(1, P.lv || 1); if (F.pegos.includes(o.i)) return;
    F.pegos.push(o.i); o.g.visible = false; Audio8.sfx('coin');
    if (typeof Efeitos !== 'undefined' && Efeitos.sobe) try { Efeitos.sobe(o.x, o.y0 + 0.5, o.z, 0xffe080); } catch (e) { }
    const sorte = Math.random();
    dar({ cr: 120 * L, red: sorte < 0.4 ? 2 : 0, blue: sorte > 0.7 ? 2 : 0, frag_carta: sorte > 0.9 ? 1 : 0 }, `${f.ic} Você achou ${F.pegos.length}/${N} ${f.o}:`);
    if (F.pegos.length >= N && !F.fim) {
      F.fim = true; banner(`${f.ic} ${f.nome.toUpperCase()}: VOCÊ ACHOU TODOS!`);
      const xp = Math.round((typeof xpNeed === 'function' ? xpNeed(L) : 1000) * 0.08);
      dar({ xp, cr: 2500 * L, frag_cisma: 2, frag_carta: 4, red_m: 5 }, `🎉 Prêmio da <b>${f.nome}</b>:`);
    }
  }
  function update(dt) {
    if (typeof running === 'undefined' || !running) return;
    if (montadoDia !== hoje()) montar();
    const F = estado(), f = festa();
    for (const o of objs) {
      const ja = F.pegos.includes(o.i); o.g.visible = !ja; o.g.userData.anel.visible = !ja; if (ja) continue;
      o.g.userData.anel.scale.setScalar(1 + Math.sin(time * 3 + o.i) * 0.15);
      o.g.rotation.y += dt * 0.6; o.g.position.y = o.y0 + (o.g.userData.flutua ? Math.sin(time * 1.3 + o.i) * 0.25 : Math.abs(Math.sin(time * 2 + o.i)) * 0.08);
      if (!inTower(P.z) && Math.hypot(P.x - o.x, P.z - o.z) < 1.6) pegar(o);
    }
    // ao chegar na vila da festa, um aviso (uma vez por dia)
    const zn = typeof zoneOf === 'function' ? zoneOf(P.x, P.z) : null;
    if (zn === f.z && avisouZona !== hoje()) { avisouZona = hoje(); banner(`${f.ic} HOJE: ${f.nome.toUpperCase()}`);
      log(`${f.ic} <b>${f.nome}</b> — ${f.txt} Ache os <b>${N} ${f.o}</b> (${F.pegos.length}/${N}) e ganhe o prêmio do dia.`, 'gold'); }
  }
  // texto curto para o calendário e para as telas de eventos
  function resumo() { const f = festa(), F = estado(); return `${f.ic} Festa de hoje: <b>${f.nome}</b> (${F.pegos.length}/${N} ${f.o})`; }
  function semana() { const d = new Date().getDay(), DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return FESTAS.map((f, i) => `${i === d ? '👉 ' : ''}<b>${DIAS[i]}</b>: ${f.ic} ${f.nome}`).join('<br>'); }
  function onde() { const f = festa(), F = estado(), r = objs.filter(o => !F.pegos.includes(o.i)).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0]; return r ? { x: r.x, z: r.z, name: f.o } : null; }
  return { update, resumo, semana, festa, onde, _objs: () => objs, _OBJ: OBJ };
})();
