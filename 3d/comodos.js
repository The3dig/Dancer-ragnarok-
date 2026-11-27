// =====================================================================
//  🏗️ Cômodos da casa, móveis de verdade e a governanta (pedido do Rone: "faz valer a pena os móveis
//  da casa"; "a casa pode ficar gigante de cômodos e cheia de móveis"; "uma NPC limpando, igual ao Rag,
//  que vai te falando se dá para comprar os móveis"; "deixa os móveis com muito material").
//  - Mestre de Obras Tibério (do lado de fora da casa) constrói 8 cômodos, cada um mais caro.
//  - Cada cômodo tem 5 móveis que pedem coroas e MUITO material de monstro.
//  - Todo móvel dá CONFORTO. Ao sair de casa você fica 1 hora "🏠 Descansado": bônus de XP, drop e
//    coroas que crescem com o conforto (os móveis antigos da sala também contam).
//  - Governanta Clara varre a casa e diz o que já dá para fazer.
//  Os cômodos ficam lado a lado (fora do mapa, como a casa) e se ligam por portas de luz.
// =====================================================================
'use strict';
const Comodos = (() => {
  // janelas com paisagem (de dia) e céu estrelado (no Observatório), no lugar do azul liso (27/11)
  const JANELA = {};
  function janelaMat(noite) {
    const k = noite ? 'n' : 'd'; if (JANELA[k]) return JANELA[k];
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
    if (noite) { const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#0a0e2a'); g.addColorStop(1, '#2a3a7a'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,230,${0.4 + Math.random() * 0.6})`; const s = Math.random() < 0.15 ? 2 : 1; x.fillRect(Math.random() * 128, Math.random() * 100, s, s); }
      x.fillStyle = '#f6f0d0'; x.beginPath(); x.arc(92, 30, 12, 0, 7); x.fill(); x.fillStyle = '#0e1430'; x.beginPath(); x.arc(98, 26, 11, 0, 7); x.fill(); }
    else { const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#7ab8e8'); g.addColorStop(0.65, '#d8ecf4'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      x.fillStyle = '#fff6c0'; x.beginPath(); x.arc(96, 28, 11, 0, 7); x.fill();
      for (const [y0, cor] of [[84, '#7aa86a'], [100, '#5a8a4a'], [116, '#4a7a3a']]) { x.fillStyle = cor; x.beginPath(); x.moveTo(0, 128); for (let i = 0; i <= 128; i += 8) x.lineTo(i, y0 - Math.sin(i * 0.05 + y0) * 8); x.lineTo(128, 128); x.fill(); }
      x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(30, 30, 8, 0, 7); x.arc(40, 33, 7, 0, 7); x.arc(21, 34, 6, 0, 7); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    return (JANELA[k] = new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
  }
  const H = 7.6, LAR_MIN = 60;
  const S = () => { const c = (P.casa = P.casa || { mov: {}, bau: {} }); c.salas = c.salas || {}; c.mob = c.mob || {}; return c; };
  const it = id => ITEMS[id] || { name: id, ic: '❔' };
  // ---------------- os 8 cômodos: [nome, ícone, coroas, materiais, piso, parede]
  const SALAS = [
    { id: 'quarto', nome: 'Quarto Real', ic: '🛏️', cr: 60000, mat: { raiz: 80, casca: 60 }, piso: 0x9a6a44, parede: 0xd8c8a8 },
    { id: 'biblio', nome: 'Biblioteca Arcana', ic: '📚', cr: 150000, mat: { fio: 80, cristal: 60 }, piso: 0x6a4a30, parede: 0x5a4a6a },
    { id: 'trofeus', nome: 'Sala de Troféus', ic: '🏆', cr: 300000, mat: { lasca: 120, escama: 80 }, piso: 0x7a6a5a, parede: 0x8a2a2a },
    { id: 'cozinha', nome: 'Cozinha e Adega', ic: '🍷', cr: 500000, mat: { fibra: 120, seiva: 100 }, piso: 0x8a7a6a, parede: 0xc8b090 },
    { id: 'atelie', nome: 'Ateliê do Artesão', ic: '🛠️', cr: 800000, mat: { brasao: 120, placa_vazio: 120 }, piso: 0x6a5a4a, parede: 0x9a8a70 },
    { id: 'jardim', nome: 'Jardim de Inverno', ic: '🌿', cr: 1200000, mat: { membrana: 150, osso_raiz: 150 }, piso: 0x6a8a5a, parede: 0xbfe0c8 },
    { id: 'salao', nome: 'Salão Nobre', ic: '👑', cr: 2000000, mat: { placa_antiga: 200, lembranca: 150 }, piso: 0x3a2a4a, parede: 0xe8d8a8 },
    { id: 'observ', nome: 'Observatório Estelar', ic: '🔭', cr: 3500000, mat: { estilhaco_vivo: 200, eco_cidade: 200 }, piso: 0x1a1a3a, parede: 0x2a2a5a },
  ];
  // ---------------- móveis de cada cômodo: [id, nome, ícone, coroas, materiais, conforto, tipo, x, z, giro, cor]
  const M = (id, nome, ic, cr, mat, conf, tipo, x, z, r = 0, cor = 0x8a5a3a) => ({ id, nome, ic, cr, mat, conf, tipo, x, z, r, cor });
  const MOVEIS = {
    quarto: [M('q_cama', 'Cama de Dossel', '🛏️', 20000, { la: 30, raiz: 60 }, 30, 'dossel', -3.5, -4.5, 0, 0x7a1a2a), M('q_tapete', 'Tapete Bordado', '🟥', 8000, { la: 40, fio: 20 }, 12, 'tapete', 0, 0, 0, 0x6a1a3a), M('q_armario', 'Guarda-Roupa', '🚪', 12000, { raiz: 80, casca: 40 }, 15, 'armario', 4.5, -6.3, 0, 0x5a3a24), M('q_penteadeira', 'Penteadeira com Espelho', '🪞', 15000, { cristal: 20, raiz: 40 }, 15, 'penteadeira', 6.2, 1.5, -Math.PI / 2, 0x8a5a3a), M('q_lustre', 'Lustre de Velas', '🕯️', 18000, { lasca: 20, gosma: 60 }, 18, 'lustre', 0, 0, 0, 0xd9a63a)],
    biblio: [M('b_estante1', 'Estante Alta', '📚', 30000, { fio: 60, raiz: 100 }, 20, 'estante', -3, -6.4, 0, 0x4a2a1a), M('b_estante2', 'Estante de Grimórios', '📕', 40000, { fio: 80, cristal: 40 }, 25, 'estante', 3, -6.4, 0, 0x3a1a2a), M('b_mesa', 'Mesa de Leitura', '🕮', 25000, { raiz: 60, po_eco: 80 }, 18, 'mesaleitura', 0, -1.5, 0, 0x5a3a24), M('b_globo', 'Globo do Reino', '🌐', 35000, { cristal: 60, areia_rubra: 60 }, 22, 'globo', -5, 2.5, 0, 0x2a6aa8), M('b_cristal', 'Cristal de Estudo', '💠', 50000, { cristal_puro: 4, cristal: 80 }, 30, 'cristal', 5, 2.5, 0, 0x7ae0ff)],
    trofeus: [M('t_armadura', 'Armadura em Pé', '🛡️', 60000, { lasca: 150, escama: 60 }, 30, 'armadura', -5.5, -5.5, 0, 0x9aa8c0), M('t_vitrine', 'Vitrine de Troféus', '🏆', 70000, { cristal: 100, lasca: 80 }, 32, 'vitrine', 0, -6.3, 0, 0xd9a63a), M('t_cabeca', 'Cabeça de Fera', '🐗', 50000, { presa: 80, escama: 80 }, 25, 'cabeca', 5.5, -6.6, 0, 0x6a4a3a), M('t_espadas', 'Espadas Cruzadas', '⚔️', 55000, { lasca: 100, nucleo_ferro: 3 }, 28, 'espadas', -6.6, 1, Math.PI / 2, 0xdfe6f0), M('t_estandarte', 'Estandartes de Guerra', '🚩', 45000, { fio: 100, veu: 60 }, 22, 'estandartes', 6.6, 1, -Math.PI / 2, 0xa8182a)],
    cozinha: [M('c_fogao', 'Fogão a Lenha', '🔥', 90000, { fibra: 150, cinza: 100 }, 35, 'fogao', -5, -6, 0, 0x5a5a5a), M('c_mesa', 'Mesa do Banquete', '🍗', 80000, { fibra: 120, raiz: 200 }, 32, 'banquete', 0, 0, 0, 0x6a4a2a), M('c_barris', 'Barris da Adega', '🍷', 70000, { seiva: 150, casca: 150 }, 28, 'barris', 5.5, -5.5, 0, 0x6a3a1a), M('c_prateleira', 'Prateleira de Potes', '🫙', 60000, { pele_cinza: 100, gosma: 200 }, 25, 'prateleira', -6.6, 2, Math.PI / 2, 0x8a6a4a), M('c_caldeirao', 'Caldeirão Borbulhante', '🫕', 100000, { brasa: 120, seiva: 100 }, 38, 'caldeirao', 4.5, 3, 0, 0x3a3a3a)],
    atelie: [M('a_bigorna', 'Bigorna Mestra', '⚒️', 140000, { brasao: 150, aco_valdora: 6 }, 40, 'bigorna', -4.5, -4.5, 0, 0x5a5a66), M('a_bancada', 'Bancada de Ferramentas', '🛠️', 120000, { placa_vazio: 150, fibra: 150 }, 35, 'bancada', 2, -6.3, 0, 0x6a4a2a), M('a_tear', 'Tear de Tapeçaria', '🧵', 110000, { fio: 200, la: 80 }, 32, 'tear', 6, 0, -Math.PI / 2, 0x8a5a3a), M('a_manequim', 'Manequim de Armaduras', '🧍', 100000, { estilhaco: 150, brasao: 100 }, 30, 'armadura', -6, 3, Math.PI / 2, 0xb08a3a), M('a_forno', 'Forno de Vidro', '🏺', 150000, { brasa: 200, cristal: 150 }, 42, 'fogao', 4, 4.5, Math.PI, 0x7a3a2a)],
    jardim: [M('j_fonte', 'Fonte de Pedra', '⛲', 220000, { osso_raiz: 200, membrana: 150 }, 50, 'fonte', 0, 0, 0, 0x9ab0c8), M('j_arvore', 'Árvore Interna', '🌳', 200000, { membrana: 200, muda: 6 }, 48, 'arvore', -4.5, -4, 0, 0x4a8a3a), M('j_flores', 'Canteiros de Flores', '🌸', 150000, { flor: 60, osso_raiz: 150 }, 40, 'flores', 4.5, -4.5, 0, 0xff8ab0), M('j_banco', 'Banco do Jardim', '🪑', 120000, { cristal_carne: 150, raiz: 200 }, 35, 'banco', 4.5, 3.5, 0, 0x8a6a4a), M('j_borboletas', 'Viveiro de Borboletas', '🦋', 250000, { asa_eco: 300, membrana: 150 }, 55, 'viveiro', -4.5, 4, 0, 0x7ae0ff)],
    salao: [M('s_trono', 'Trono Dourado', '👑', 400000, { placa_antiga: 250, lembranca: 150 }, 70, 'trono', 0, -5.6, 0, 0xd9a63a), M('s_tapete', 'Tapete Real', '🟥', 250000, { fio: 300, lembranca: 100 }, 50, 'tapetelongo', 0, 0, 0, 0xa8182a), M('s_lustre', 'Lustre de Cristal', '💎', 350000, { cristal_puro: 12, placa_antiga: 150 }, 65, 'lustre', 0, -1, 0, 0x9ae0ff), M('s_quadros', 'Galeria de Retratos', '🖼️', 300000, { lembranca: 200, veu: 150 }, 55, 'quadros', -6.6, 0, Math.PI / 2, 0x8a5a3a), M('s_colunas', 'Colunas de Mármore', '🏛️', 380000, { placa_antiga: 300, osso_raiz: 150 }, 60, 'colunas', 0, 0, 0, 0xeae2d0)],
    observ: [M('o_telescopio', 'Grande Telescópio', '🔭', 700000, { estilhaco_vivo: 250, nucleo_ferro: 10 }, 90, 'telescopio', 0, -4.5, 0, 0xd9a63a), M('o_esfera', 'Esfera Armilar', '🪐', 600000, { eco_cidade: 250, po_estelar: 6 }, 80, 'esfera', -4.5, 1, 0, 0xd9a63a), M('o_mapa', 'Mapa do Céu', '🗺️', 500000, { placa_submersa: 200, estilhaco_vivo: 150 }, 70, 'mapaceu', 6.6, 0, -Math.PI / 2, 0x1a2a5a), M('o_cupula', 'Cúpula de Estrelas', '✨', 900000, { po_estelar: 12, eco_cidade: 300 }, 110, 'cupula', 0, 0, 0, 0xfff0a0), M('o_cristal', 'Cristal do Firmamento', '🔮', 800000, { ovo_abismo: 200, olho_vazio: 8 }, 100, 'cristal', 4.5, 3, 0, 0xb46bff)],
  };
  const VELHOS = 8 * 6;                         // os 8 móveis antigos da sala valem 6 de conforto cada
  function conforto() {
    const c = S(); let n = Object.keys(c.mov || {}).length * 6;
    for (const k in MOVEIS) for (const m of MOVEIS[k]) if (c.mob[m.id]) n += m.conf;
    return n;
  }
  const CONF_MAX = VELHOS + Object.values(MOVEIS).flat().reduce((a, m) => a + m.conf, 0);
  // bônus do "🏠 Descansado" (1 hora depois de sair de casa)
  const bonusDe = cf => ({ xp: Math.min(0.30, cf * 0.0002 * 1.5), drop: Math.min(0.15, cf * 0.0001), cr: Math.min(0.20, cf * 0.00012) });
  function bonus(k) { if (!(P.larAte > Date.now())) return 0; return bonusDe(conforto())[k] || 0; }
  const pct = v => Math.round(v * 1000) / 10 + '%';

  // ---------------- os cômodos no mundo (um ao lado do outro, a oeste da casa)
  const ROOMS = SALAS.map((s, k) => ({ ...s, k, f: CASA_SALAS[k], g: null, objs: {} }));
  const madeira = c => PM('madeira.jpg', [4, 4], new THREE.Color(c));
  const box = (w, h, d, m, x, y, z, par) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; par.add(o); return o; };
  const L = c => new THREE.MeshLambertMaterial({ color: c }), PH = (c, e = 0) => new THREE.MeshPhongMaterial({ color: c, emissive: e, shininess: 80 }), B = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  // 🚪 porta de verdade (pedido do Rone: "a porta não aparece / está zuada"): moldura de madeira com arco, portal enfumaçado
  // que gira por dentro e a placa com o nome do cômodo do outro lado
  const FUMO = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.45, 'rgba(240,190,110,.85)'); g.addColorStop(1, 'rgba(120,70,160,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.12})`; x.beginPath(); x.arc(64 + (Math.random() - 0.5) * 90, 64 + (Math.random() - 0.5) * 90, 6 + Math.random() * 16, 0, 7); x.fill(); } const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
  const portais = [];
  function portaMat() { const t = FUMO.clone(); t.center.set(0.5, 0.5); t.needsUpdate = true; return new THREE.MeshBasicMaterial({ map: t, color: 0xffe6b0, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }); }
  function portaBonita(par, x, y, z, ry, nome) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; par.add(g);
    const mad = PM('madeira.jpg', [1, 2], new THREE.Color(0.75, 0.55, 0.38));
    for (const sx of [-1.25, 1.25]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.3), mad); p.position.set(sx, 1.6, 0); g.add(p); }
    const arco = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.16, 8, 20, Math.PI), mad); arco.position.set(0, 3.1, 0); g.add(arco);
    for (const k of [0, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.6), portaMat()); m.position.set(0, 1.75, 0.02 + k * 0.03); m.userData.k = k; g.add(m); portais.push(m); }
    if (nome) { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const q = c.getContext('2d'); q.fillStyle = '#3a2a18'; q.fillRect(0, 0, 512, 96); q.strokeStyle = '#d9a63a'; q.lineWidth = 6; q.strokeRect(3, 3, 506, 90); q.fillStyle = '#ffd860'; q.font = 'bold 40px Georgia'; q.textAlign = 'center'; q.fillText(nome, 256, 62);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); pl.position.set(0, 4.85, 0.05); g.add(pl); }
    return g;
  }
  function montarSala(R) {
    if (R.g) return; const f = R.f, g = new THREE.Group(); g.position.set(f.x, f.y, f.z); g.visible = false; scene.add(g); R.g = g;
    box(H * 2 + 1, 0.4, H * 2 + 1, madeira(R.piso), 0, -0.2, 0, g);
    const parede = PM('reboco.jpg', [3, 1.2], new THREE.Color(R.parede));
    box(H * 2 + 1, 3.8, 0.5, parede, 0, 1.9, -H, g); box(H * 2 + 1, 3.8, 0.5, parede, 0, 1.9, H, g);
    for (const sx of [-1, 1]) box(0.5, 3.8, H * 2 + 1, parede, sx * H, 1.9, 0, g);   // paredes leste e oeste inteiras: as portas são de luz (antes tinha um vão e atrás da porta aparecia o roxo de fora)
    const viga = madeira(0x9a6a40);   // mais clara: a 0x5a3a24 ficava preta ("Quarto Real" com listras pretas) for (let k = -3; k <= 3; k++) { box(0.25, 3.8, 0.3, viga, k * 2.2, 1.9, -H + 0.35, g); box(0.25, 3.8, 0.3, viga, k * 2.2, 1.9, H - 0.35, g); }
    box(H * 2 + 1, 0.3, 0.4, viga, 0, 3.75, -H + 0.4, g); box(H * 2 + 1, 0.3, 0.4, viga, 0, 3.75, H - 0.4, g);
    // janelas no meio do vão entre as vigas (±3,3), com moldura, cruz da vidraça e peitoril (antes ficavam em cima de uma viga)
    for (const x of [-3.3, 3.3]) { const j = new THREE.Group(); j.position.set(x, 0, H - 0.26); j.rotation.y = Math.PI; g.add(j);
      const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.3), janelaMat(R.id === 'observ')); w.position.set(0, 2.2, 0); j.add(w);
      box(1.44, 0.12, 0.12, viga, 0, 2.91, 0.05, j); box(0.12, 1.54, 0.12, viga, -0.66, 2.2, 0.05, j); box(0.12, 1.54, 0.12, viga, 0.66, 2.2, 0.05, j);
      box(0.06, 1.3, 0.05, viga, 0, 2.2, 0.03, j); box(1.2, 0.06, 0.05, viga, 0, 2.2, 0.03, j); box(1.6, 0.1, 0.26, viga, 0, 1.5, 0.1, j); }
    // placa com o nome
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x = c.getContext('2d'); x.fillStyle = '#3a2a18'; x.fillRect(0, 0, 512, 96); x.strokeStyle = '#d9a63a'; x.lineWidth = 6; x.strokeRect(3, 3, 506, 90); x.fillStyle = '#ffd860'; x.font = 'bold 44px Georgia'; x.textAlign = 'center'; x.fillText(R.ic + ' ' + R.nome, 256, 64);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; const pl = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.75), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); pl.position.set(0, 3.2, -H + 0.28); g.add(pl);
    tetoCasa(g, H, 3.8, parede, R.id === 'observ' ? 0x3a3a6a : 0xa0704a);
    const luz = new THREE.PointLight(R.id === 'observ' ? 0xa0b0ff : 0xffd8a0, 1.8, 28); luz.position.set(0, 4.4, 0); g.add(luz);
    // portas de luz: leste (volta) e oeste (próximo cômodo)
    const kk = ROOMS.indexOf(R), prox = SALAS[kk + 1];
    R.portaL = portaBonita(g, H - 0.32, 0, 0, -Math.PI / 2, kk === 0 ? '🏠 Sala' : `${SALAS[kk - 1].ic} ${SALAS[kk - 1].nome}`);
    R.portaO = portaBonita(g, -H + 0.32, 0, 0, Math.PI / 2, prox ? `${prox.ic} ${prox.nome}` : '');
    { const pf = new THREE.Group(); pf.position.set(-H, 0, 0); g.add(pf); R.portaFechada = pf;            // fecha o vão quando ainda não há próximo cômodo
      const tab = PM('madeira.jpg', [1, 2], new THREE.Color(0x8a5a34)), ferro = new THREE.MeshLambertMaterial({ color: 0x2a2420 });
      box(0.2, 3.0, 2.4, tab, 0.05, 1.5, 0, pf); for (const y of [0.6, 2.4]) box(0.26, 0.12, 2.3, ferro, 0.1, y, 0, pf);
      for (let k = -2; k <= 2; k++) box(0.22, 2.9, 0.03, madeira(0x5a3a24), 0.06, 1.5, k * 0.46, pf);
      box(0.3, 0.12, 0.12, ferro, 0.2, 1.5, 0.8, pf); }
    mobiliar(R);
    if (R.id === 'biblio' && typeof Livros !== 'undefined') { Livros.pulpito(g, 0, 5, Math.PI); addOb(f.x, f.z + 5, 0.6); Livros.ponto(f.x, f.z + 5, () => g.visible); }   // 📚 os dois livros de verdade (pedido do Rone)
  }
  function mobiliar(R) {
    for (const m of MOVEIS[R.id]) { if (!S().mob[m.id] || R.objs[m.id]) continue; const p = new THREE.Group(); p.position.set(m.x, 0, m.z); p.rotation.y = m.r; R.g.add(p); try { CONSTR[m.tipo](p, m.cor); } catch (e) { } R.objs[m.id] = p; }
  }
  // ---------------- construtores dos móveis (formas simples, bem acabadas)
  const ouro = PH(0xd9a63a, 0x2a1800);
  const CONSTR = {
    dossel(p, c) { const mad = madeira(0x5a3a24); box(2.6, 0.6, 3.6, mad, 0, 0.4, 0, p); box(2.4, 0.3, 3.4, L(0xf0e8d8), 0, 0.85, 0, p); box(2.4, 0.35, 2, L(c), 0, 0.92, 0.6, p); box(1.8, 0.3, 0.6, L(0xffffff), 0, 1.05, -1.3, p); for (const [x, z] of [[-1.2, -1.7], [1.2, -1.7], [-1.2, 1.7], [1.2, 1.7]]) box(0.14, 3.2, 0.14, mad, x, 1.6, z, p); box(2.7, 0.15, 3.7, mad, 0, 3.2, 0, p); const cort = new THREE.MeshLambertMaterial({ color: c, transparent: true, opacity: 0.8, side: THREE.DoubleSide }); for (const x of [-1.25, 1.25]) { const cc = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.4), cort); cc.position.set(x, 2, 0); cc.rotation.y = Math.PI / 2; p.add(cc); } },
    tapete(p, c) { const t = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.4).rotateX(-Math.PI / 2), L(c)); t.position.y = 0.02; p.add(t); const b = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.8).rotateX(-Math.PI / 2), L(0xd9a63a)); b.position.y = 0.025; p.add(b); const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4).rotateX(-Math.PI / 2), L(c)); m.position.y = 0.03; p.add(m); },
    tapetelongo(p, c) { const t = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 12).rotateX(-Math.PI / 2), L(c)); t.position.y = 0.02; p.add(t); for (const x of [-1.2, 1.2]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 12).rotateX(-Math.PI / 2), L(0xd9a63a)); b.position.set(x, 0.025, 0); p.add(b); } },
    armario(p, c) { const mad = madeira(c); box(2.2, 3, 0.9, mad, 0, 1.5, 0, p); box(0.04, 2.6, 0.02, L(0x2a1a10), 0, 1.5, 0.46, p); for (const x of [-0.15, 0.15]) box(0.08, 0.3, 0.06, ouro, x, 1.5, 0.48, p); box(2.4, 0.2, 1, mad, 0, 3.1, 0, p); },
    penteadeira(p, c) { const mad = madeira(c); box(1.6, 0.9, 0.7, mad, 0, 0.45, 0, p); const e = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), PH(0xdfefff, 0x203040)); e.position.set(0, 1.6, -0.3); p.add(e); box(1.3, 1.3, 0.06, ouro, 0, 1.6, -0.34, p); },
    lustre(p, c) { box(0.05, 1, 0.05, L(0x3a3a3a), 0, 3.3, 0, p); const r = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 8, 24), ouro); r.rotation.x = Math.PI / 2; r.position.y = 2.8; p.add(r); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; box(0.08, 0.25, 0.08, L(0xf8f0e0), Math.cos(a) * 0.8, 2.95, Math.sin(a) * 0.8, p); const ch = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), B(c === 0x9ae0ff ? 0xbff2ff : 0xffd070)); ch.position.set(Math.cos(a) * 0.8, 3.12, Math.sin(a) * 0.8); p.add(ch); } p.userData.brilha = true; },
    estante(p, c) { const mad = madeira(c); box(2.6, 3.2, 0.08, mad, 0, 1.6, -0.26, p); for (const x of [-1.25, 1.25]) box(0.1, 3.2, 0.6, mad, x, 1.6, 0, p); box(2.6, 0.12, 0.6, mad, 0, 3.14, 0, p);   /* fundo, laterais e topo: antes era uma caixa maciça e os livros ficavam escondidos dentro */ const cores = [0x8a2a2a, 0x2a4a8a, 0x3a6a2a, 0x8a6a2a, 0x5a2a6a, 0x2a6a6a]; for (let r = 0; r < 4; r++) { box(2.4, 0.06, 0.5, mad, 0, 0.3 + r * 0.75, 0.04, p); for (let k = 0; k < 10; k++) box(0.18, 0.5 + (k % 3) * 0.07, 0.38, L(cores[(k + r) % 6]), -1.05 + k * 0.23, 0.6 + r * 0.75, 0.05, p); } },
    mesaleitura(p, c) { const mad = madeira(c); box(2.4, 0.12, 1.3, mad, 0, 1, 0, p); for (const [x, z] of [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]]) box(0.12, 1, 0.12, mad, x, 0.5, z, p); box(0.9, 0.08, 0.6, L(0xf0e6c8), -0.3, 1.1, 0, p); box(0.08, 0.3, 0.08, L(0xf8f0e0), 0.7, 1.21, -0.2, p); const ch = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), B(0xffd070)); ch.position.set(0.7, 1.4, -0.2); p.add(ch); },
    globo(p, c) { box(0.12, 1, 0.12, madeira(0x5a3a24), 0, 0.5, 0, p); const s = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), PH(c, 0x0a1a2a)); s.position.y = 1.5; p.add(s); const r = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 6, 24), ouro); r.position.y = 1.5; r.rotation.y = Math.PI / 2; p.add(r); p.userData.gira = s; },
    cristal(p, c) { box(1, 0.6, 1, L(0x5a5a66), 0, 0.3, 0, p); const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), PH(c, new THREE.Color(c).multiplyScalar(0.5))); s.position.y = 1.5; s.scale.y = 1.6; p.add(s); p.userData.gira = s; p.userData.flutua = s; },
    armadura(p, c) { const m = PH(c); box(0.9, 0.15, 0.9, madeira(0x4a2a14), 0, 0.08, 0, p); box(0.1, 1.2, 0.1, L(0x3a3a3a), 0, 0.7, 0, p); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.9, 12), m); t.position.y = 1.6; p.add(t); for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), m); o.position.set(0.48 * s, 1.95, 0); p.add(o); } const e = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), m); e.position.y = 2.35; p.add(e); box(0.36, 0.06, 0.1, L(0x1a1a1a), 0, 2.33, 0.26, p); },
    vitrine(p, c) { box(2.6, 0.9, 0.9, madeira(0x4a2a14), 0, 0.45, 0, p); const v = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.8), new THREE.MeshPhongMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.25, shininess: 120 })); v.position.y = 1.6; p.add(v); for (let k = 0; k < 3; k++) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.1, 0.4, 12), ouro); tr.position.set(-0.8 + k * 0.8, 1.3, 0); p.add(tr); const g = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), PH([0xff4060, 0x7ae0ff, 0x7dff6a][k])); g.position.set(-0.8 + k * 0.8, 1.6, 0); p.add(g); } },
    cabeca(p) { box(1.2, 1.2, 0.15, madeira(0x5a3a24), 0, 2.4, 0, p); const h = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), L(0x6a4a3a)); h.position.set(0, 2.4, 0.4); h.scale.z = 1.3; p.add(h); for (const s of [-1, 1]) { const ch = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 8), L(0xf0e6c8)); ch.position.set(0.35 * s, 2.7, 0.5); ch.rotation.z = -0.7 * s; p.add(ch); } },
    espadas(p, c) { box(1.6, 1.6, 0.1, madeira(0x4a2a14), 0, 2.2, 0, p); for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(0, 2.2, 0.1); g.rotation.z = 0.75 * s; p.add(g); box(0.1, 1.9, 0.04, PH(c), 0, 0, 0, g); box(0.45, 0.08, 0.08, ouro, 0, -0.7, 0, g); } const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 6), PH(0xa8182a)); sh.rotation.x = Math.PI / 2; sh.position.set(0, 2.2, 0.15); p.add(sh); },
    estandartes(p, c) { for (const z of [-1.2, 1.2]) { box(0.06, 0.06, 1.2, ouro, 0, 3.2, z, p); const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.2), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide })); b.position.set(0, 2.05, z); p.add(b); } },
    fogao(p, c) { const pd = L(c); box(2.2, 1.6, 1.1, pd, 0, 0.8, 0, p); box(0.9, 0.6, 0.1, B(0x1a0a04), 0, 0.6, 0.56, p); const f = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), B(0xff8a30)); f.position.set(0, 0.55, 0.57); p.add(f); p.userData.fogo = f; box(0.5, 1.8, 0.5, pd, 0.7, 2.5, -0.2, p); },
    banquete(p, c) { const mad = madeira(c); box(5, 0.15, 1.6, mad, 0, 1, 0, p); for (const x of [-2.2, 2.2]) for (const z of [-0.6, 0.6]) box(0.14, 1, 0.14, mad, x, 0.5, z, p); for (const z of [-1.3, 1.3]) box(4.6, 0.12, 0.45, madeira(0x4a2a14), 0, 0.55, z, p); const comida = [0xd08a3a, 0xc04030, 0x70a040, 0xe0c060]; for (let k = 0; k < 6; k++) { const pr = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.05, 12), L(0xf0f0f0)); pr.position.set(-2 + k * 0.8, 1.1, 0); p.add(pr); const cc = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), L(comida[k % 4])); cc.position.set(-2 + k * 0.8, 1.2, 0); p.add(cc); } },
    barris(p, c) { for (const [x, y, z] of [[-0.6, 0.55, 0], [0.6, 0.55, 0], [0, 1.55, 0]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 14), madeira(c)); b.rotation.z = Math.PI / 2; b.position.set(x, y, z); p.add(b); for (const dx of [-0.3, 0.3]) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.04, 6, 16), L(0x3a3a3a)); a.rotation.y = Math.PI / 2; a.position.set(x + dx, y, z); p.add(a); } } },
    prateleira(p, c) { const mad = madeira(c); box(2.4, 0.1, 0.5, mad, 0, 1.2, 0, p); box(2.4, 0.1, 0.5, mad, 0, 2.1, 0, p); const cores = [0x8ad86a, 0xd86a6a, 0x6a8ad8, 0xe0c060]; for (const y of [1.45, 2.35]) for (let k = 0; k < 6; k++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.35, 10), new THREE.MeshPhongMaterial({ color: cores[k % 4], transparent: true, opacity: 0.85 })); j.position.set(-1 + k * 0.4, y, 0); p.add(j); } },
    caldeirao(p, c) { const cd = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12, 0, Math.PI * 2, Math.PI / 2.6, Math.PI / 1.7), PH(c)); cd.position.y = 0.9; p.add(cd); const s = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20).rotateX(-Math.PI / 2), B(0x7dff6a)); s.position.y = 1.15; p.add(s); p.userData.bolha = s; for (let k = 0; k < 3; k++) box(0.1, 0.6, 0.1, L(0x2a2a2a), Math.cos(k * 2.1) * 0.6, 0.3, Math.sin(k * 2.1) * 0.6, p); },
    bigorna(p, c) { box(0.8, 0.6, 0.8, madeira(0x4a2a14), 0, 0.3, 0, p); box(1.4, 0.35, 0.5, PH(c), 0, 0.8, 0, p); const bico = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 8), PH(c)); bico.rotation.z = -Math.PI / 2; bico.position.set(0.95, 0.85, 0); p.add(bico); box(0.12, 0.6, 0.12, madeira(0x5a3a24), -0.4, 1.3, 0.3, p); box(0.35, 0.18, 0.2, PH(0x5a5a66), -0.4, 1.6, 0.3, p); },
    bancada(p, c) { const mad = madeira(c); box(3, 0.15, 1, mad, 0, 1, 0, p); for (const x of [-1.3, 1.3]) for (const z of [-0.4, 0.4]) box(0.12, 1, 0.12, mad, x, 0.5, z, p); box(3, 1.4, 0.1, mad, 0, 1.9, -0.45, p); for (let k = 0; k < 6; k++) box(0.08, 0.5, 0.06, PH(0x9aa8c0), -1.2 + k * 0.48, 2, -0.38, p); },
    tear(p, c) { const mad = madeira(c); for (const x of [-1, 1]) box(0.12, 2.2, 0.12, mad, x, 1.1, 0, p); box(2.2, 0.12, 0.12, mad, 0, 2.15, 0, p); box(2.2, 0.12, 0.12, mad, 0, 0.6, 0, p); const tc = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshLambertMaterial({ color: 0xa8182a, side: THREE.DoubleSide })); tc.position.y = 1.35; p.add(tc); },
    fonte(p, c) { const pd = L(c); const b = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.6, 24), pd); b.position.y = 0.3; p.add(b); const ag = new THREE.Mesh(new THREE.CircleGeometry(1.45, 24).rotateX(-Math.PI / 2), PH(0x4aa8e8, 0x0a2a4a)); ag.position.y = 0.58; p.add(ag); const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.4, 12), pd); col.position.y = 1.2; p.add(col); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.3, 0.2, 16), pd); t.position.y = 1.9; p.add(t); p.userData.agua = ag; },
    arvore(p) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 2.4, 10), madeira(0x5a3a24)); tr.position.y = 1.2; p.add(tr); for (const [x, y, z, r] of [[0, 2.8, 0, 1.1], [0.6, 2.4, 0.3, 0.7], [-0.6, 2.5, -0.2, 0.75], [0.1, 3.4, -0.3, 0.7]]) { const f = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), L(0x4a8a3a)); f.position.set(x, y, z); p.add(f); } box(1.2, 0.5, 1.2, L(0x8a5a3a), 0, 0.25, 0, p); },
    flores(p, c) { box(2.6, 0.4, 1.4, madeira(0x5a3a24), 0, 0.2, 0, p); for (let k = 0; k < 14; k++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), L([c, 0xffe070, 0xb08aff, 0xff7070][k % 4])); fl.position.set(-1.1 + (k % 7) * 0.37, 0.65 + (k % 2) * 0.1, k < 7 ? -0.3 : 0.3); p.add(fl); } },
    banco(p, c) { const mad = madeira(c); box(2.2, 0.12, 0.6, mad, 0, 0.55, 0, p); box(2.2, 0.6, 0.1, mad, 0, 0.95, -0.28, p); for (const x of [-0.95, 0.95]) box(0.12, 0.55, 0.5, L(0x3a3a3a), x, 0.28, 0, p); },
    viveiro(p, c) { const g2 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2.2, 16, 1, true), new THREE.MeshPhongMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide })); g2.position.y = 1.3; p.add(g2); box(2.2, 0.2, 2.2, L(0x5a3a24), 0, 0.1, 0, p); p.userData.borb = []; for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16), new THREE.MeshBasicMaterial({ color: [c, 0xffd060, 0xff8ab0][k % 3], side: THREE.DoubleSide, toneMapped: false })); p.add(b); p.userData.borb.push({ b, a: k }); } },
    trono(p, c) { const m = PH(c, 0x2a1800); box(1.6, 0.6, 1.3, m, 0, 0.3, 0, p); box(1.4, 0.2, 1.1, L(0xa8182a), 0, 0.7, 0, p); box(1.6, 2.6, 0.25, m, 0, 1.9, -0.55, p); box(1.3, 2.1, 0.05, L(0xa8182a), 0, 1.9, -0.41, p); for (const s of [-1, 1]) box(0.2, 0.5, 1.2, m, 0.8 * s, 1, 0, p); const gm = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), PH(0xff4060, 0x400010)); gm.position.set(0, 3.35, -0.55); p.add(gm); box(3.2, 0.25, 2.4, L(0x5a4a6a), 0, 0.12, 0.3, p); },
    quadros(p, c) { for (const z of [-3.5, 0, 3.5]) { box(2, 2.4, 0.12, ouro, 0, 2.2, z, p); const cv = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), L([0x3a5a8a, 0x8a3a3a, 0x3a7a4a][Math.abs(z) % 3 | 0])); cv.position.set(0, 2.2, z + 0.07); p.add(cv); const fc = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), L(0xe8c8a8)); fc.position.set(0, 2.5, z + 0.08); p.add(fc); } },
    colunas(p, c) { const m = L(c); for (const x of [-5, 5]) for (const z of [-4, 0, 4]) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 3.6, 16), m); col.position.set(x, 1.8, z); p.add(col); box(0.95, 0.25, 0.95, m, x, 0.12, z, p); box(0.95, 0.25, 0.95, m, x, 3.6, z, p); } },
    telescopio(p, c) { const m = PH(c, 0x2a1800); box(0.12, 1.6, 0.12, L(0x2a2a2a), 0, 0.8, 0, p); for (const a of [0, 2.1, 4.2]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), L(0x2a2a2a)); l.position.set(Math.cos(a) * 0.4, 0.7, Math.sin(a) * 0.4); l.rotation.z = Math.cos(a) * 0.3; l.rotation.x = -Math.sin(a) * 0.3; p.add(l); } const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.6, 16), m); tb.position.set(0, 2.1, 0.4); tb.rotation.x = 0.9; p.add(tb); },
    esfera(p, c) { box(0.8, 0.8, 0.8, L(0x3a2a4a), 0, 0.4, 0, p); const g2 = new THREE.Group(); g2.position.y = 1.7; p.add(g2); for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.7 - k * 0.08, 0.035, 6, 32), ouro); r.rotation.set(k * 0.9, k * 0.6, 0); g2.add(r); } const s = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), B(0xffd060)); g2.add(s); p.userData.gira = g2; },
    mapaceu(p) { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#0a1030'; x.fillRect(0, 0, 256, 160); x.fillStyle = '#fff'; for (let k = 0; k < 90; k++) x.fillRect(Math.random() * 256, Math.random() * 160, Math.random() < 0.15 ? 2 : 1, Math.random() < 0.15 ? 2 : 1); x.strokeStyle = 'rgba(255,220,120,.7)'; x.beginPath(); for (let k = 0; k < 7; k++) x.lineTo(30 + k * 30, 40 + Math.sin(k) * 30 + 40); x.stroke(); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; const m = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.9), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.y = 2.1; p.add(m); box(4.8, 3.1, 0.06, ouro, 0, 2.1, -0.05, p); },
    cupula(p) { const n = 120, pos = new Float32Array(n * 3); for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 6.5; pos.set([Math.cos(a) * r, 3.2 + Math.random() * 0.4, Math.sin(a) * r], k * 3); } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: pontoTex(), transparent: true, alphaTest: 0.02, depthWrite: false, color: 0xfff0a0, size: 0.18, toneMapped: false })); p.add(pts); p.userData.gira = pts; },
  };

  // ---------------- portas entre os cômodos
  // a sala da casa ganha uma porta no lado oeste quando o 1º cômodo existe
  let portaCasa = null;
  function montarPortaCasa() { if (portaCasa) return; portaCasa = portaBonita(scene, CASA.x - H + 0.32, CASA.y || 0, CASA.z - 0.5, Math.PI / 2, `${SALAS[0].ic} ${SALAS[0].nome}`); }
  const tem = k => !!S().salas[SALAS[k].id];
  let armada = true, chegou = null;
  function ir(x, z, face) { P.x = x; P.z = z; P.y = 0; P.face = face; P.vy = 0; camS.x = x; camS.z = z; camS.yaw = face + Math.PI; Audio8.sfx('warp'); armada = false; chegou = { x, z }; }
  function salaAqui() { if (!inTower(P.z)) return -2; if (Math.hypot(P.x - CASA.x, P.z - CASA.z) < 12) return -1; return ROOMS.findIndex(R => Math.hypot(P.x - R.f.x, P.z - R.f.z) < 12); }

  // ---------------- governanta (varre a sala, anda de canto a canto)
  const gov = { g: new THREE.Group(), act: null, x: CASA.x + 2, z: CASA.z + 2, tx: CASA.x + 2, tz: CASA.z + 2, t: 0, face: 0, varre: 0 };
  scene.add(gov.g); gov.g.visible = false;
  const GOV_PTS = [[-4, -4], [3, -5], [5, 2], [-2, 4], [0, 0], [-5, 1], [4, -2]];
  // ---------------- Mestre de Obras do lado de fora da casa
  const obra = { g: new THREE.Group(), act: null, x: FARM.x - 11.5, z: FARM.z - 5 };
  obra.g.position.set(obra.x, groundY(obra.x, obra.z), obra.z); scene.add(obra.g);
  {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d'); x.fillStyle = '#3a2a18'; x.fillRect(0, 0, 256, 96); x.strokeStyle = '#d9a63a'; x.lineWidth = 6; x.strokeRect(3, 3, 250, 90); x.fillStyle = '#ffd860'; x.font = 'bold 34px Georgia'; x.textAlign = 'center'; x.fillText('🏗️ OBRAS', 128, 60);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.55), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, side: THREE.DoubleSide })); pl.position.set(1.2, 1.6, 0); obra.g.add(pl);
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.1), new THREE.MeshLambertMaterial({ color: 0x5a3a24 })); poste.position.set(1.2, 0.7, 0); obra.g.add(poste);
    for (const [dx, dz, h] of [[-0.9, -1.4, 0.5], [0.7, -1.6, 0.35]])   /* tábuas atrás dele (na frente parecia que ele estava dentro de uma caixa) */ { const tb = new THREE.Mesh(new THREE.BoxGeometry(1.2, h, 0.4), PM('madeira.jpg', [1, 1], new THREE.Color(1.2, 1, 0.8))); tb.position.set(dx, h / 2, dz); obra.g.add(tb); }   // pilha de tábuas
    addOb(obra.x, obra.z, 0.8);
  }
  let pronto = false;
  function prepararSprites() {
    if (pronto || typeof SpriteKit === 'undefined' || !SpriteKit.ready) return; pronto = true;
    gov.act = SpriteKit.actor({ kind: 'dir', base: 's_senhora' }); gov.g.add(gov.act.root);
    obra.act = SpriteKit.actor({ kind: 'dir', base: 's_aldeao' }); obra.g.add(obra.act.root);
    const vass = new THREE.Group(); const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), new THREE.MeshLambertMaterial({ color: 0x8a5a3a })); cabo.position.y = 0.7; vass.add(cabo); const cerda = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 8), new THREE.MeshLambertMaterial({ color: 0xd8b860 })); cerda.position.y = 0.1; vass.add(cerda); vass.position.set(0.45, 0, 0.2); gov.g.add(vass); gov.vass = vass;
  }

  // ---------------- conversa: Mestre de Obras
  // 📦 entregas usam a mochila E o baú da casa (pedido do Rone): mostra quanto tem em cada um, separado,
  // e você escolhe de onde sai primeiro
  const naMochila = id => P.inv[id] || 0, noBau = id => (S().bau || {})[id] || 0, qtd = id => naMochila(id) + noBau(id);
  const podeMat = mat => Object.entries(mat).every(([id, n]) => qtd(id) >= n);
  const fmt = n => n.toLocaleString('pt-BR');
  // de onde vem o material (pedido do Rone: "não sei o que precisa para ativar a compra dos móveis")
  const fonte = id => { const I = ITEMS[id] || {}; const de = Object.entries(MOBDEF).filter(([t, D]) => (D.drops || []).some(([i]) => i === id) && !t.startsWith('alfa_') && !D.boss).sort((a, b) => a[1].lv - b[1].lv).slice(0, 2).map(([, D]) => `${D.name} (Nv ${D.lv})`);
    return de.length ? `cai de ${de.join(' ou ')}` : ['semente', 'colheita', 'racao', 'comida'].includes(I.kind) || /lã|leite|ovo|flor/i.test(I.name || '') ? 'vem do Sítio' : I.price ? 'compra nas lojas' : 'missões e baús'; };
  const matTxt = mat => Object.entries(mat).map(([id, n]) => { const t = qtd(id), ok = t >= n; return `${ok ? '✅' : '❌'} <b>${it(id).ic} ${it(id).name}</b>: tem <b>${fmt(t)}</b> de ${fmt(n)}${ok ? '' : ` · <b style="color:#ff9a8a">faltam ${fmt(n - t)}</b>`} <small>(🎒 ${fmt(naMochila(id))} · 📦 ${fmt(noBau(id))} · ${fonte(id)})</small>`; }).join('<br>');
  const faltaTxt = (cr, mat) => { const f = []; if (P.zeny < cr) f.push(`${fmt(cr - P.zeny)} cr`); for (const [id, n] of Object.entries(mat)) if (qtd(id) < n) f.push(`${fmt(n - qtd(id))} ${it(id).name}`); return f.length ? 'falta: ' + f.join(', ') : 'já dá para fazer!'; };
  const pref = () => S().pref === 'bau' ? 'bau' : 'mochila';
  function tirarMat(mat) {
    const b = (S().bau = S().bau || {});
    for (const [id, n] of Object.entries(mat)) {
      let falta = n;
      const de = pref() === 'bau' ? [b, P.inv] : [P.inv, b];
      for (const o of de) { const t = Math.min(falta, o[id] || 0); o[id] = (o[id] || 0) - t; falta -= t; if (o === b && !b[id]) delete b[id]; }
    }
  }
  const optPref = volta => ({ label: `🔁 Tirar primeiro do: ${pref() === 'bau' ? '📦 Baú da casa' : '🎒 Mochila'} (tocar para trocar)`, fn: () => { S().pref = pref() === 'bau' ? 'mochila' : 'bau'; Audio8.sfx('click'); volta(); return true; } });
  function obras() {
    const k = SALAS.findIndex(s => !S().salas[s.id]);
    const feitos = SALAS.filter(s => S().salas[s.id]).length;
    if (k < 0) { dialog('🏗️ Mestre de Obras Tibério', `Sua casa já tem <b>todos os ${SALAS.length} cômodos</b>! É a maior do Reino. Agora é mobiliar tudo.<br><small>Conforto: <b>${conforto()} / ${CONF_MAX}</b></small>`, [{ label: 'Até mais' }]); return; }
    const s = SALAS[k], ok = P.zeny >= s.cr && podeMat(s.mat);
    dialog('🏗️ Mestre de Obras Tibério', `Quer uma casa maior? Eu construo, cômodo por cômodo, do lado oeste da sala. Cada um tem <b>5 móveis</b> próprios, e móvel é conforto: quem sai de uma casa confortável caça melhor.<br><br>Próximo cômodo (${feitos + 1} de ${SALAS.length}): <b>${s.ic} ${s.nome}</b><br>💰 ${s.cr.toLocaleString('pt-BR')} cr <small>(tem ${P.zeny.toLocaleString('pt-BR')})</small><br>${matTxt(s.mat)}`, [
      { label: ok ? `🏗️ Construir ${s.nome}` : `🔒 Falta material ou coroas`, fn: () => {
        if (!ok) { Audio8.sfx('miss'); obras(); return true; }
        P.zeny -= s.cr; tirarMat(s.mat); S().salas[s.id] = 1;
        montarSala(ROOMS[k]); if (k === 0) montarPortaCasa(); Audio8.sfx('anvil'); banner(`🏗️ ${s.nome.toUpperCase()}`);
        log(`🏗️ <b>${s.nome}</b> construído! A porta fica no ${k === 0 ? '<b>lado oeste da sala</b> da casa' : 'lado oeste do cômodo anterior'}. Fale com a <b>Governanta Clara</b> lá dentro para ver os móveis.`, 'gold'); try { save(); } catch (e) { } return; } },
      optPref(obras),
      { label: '📖 Livro dos Móveis', fn: () => { livro(); return true; } },
      { label: '📜 Ver todos os cômodos', fn: () => { dialog('🏗️ Os cômodos', SALAS.map((x, i) => `${S().salas[x.id] ? '✅' : i === k ? '➡️' : '▫️'} ${x.ic} <b>${x.nome}</b> — ${x.cr.toLocaleString('pt-BR')} cr`).join('<br>'), [{ label: '← Voltar', fn: () => { obras(); return true; } }]); return true; } },
      { label: 'Até mais' }]);
  }
  // ---------------- conversa: Governanta (móveis de cada cômodo)
  function governanta(sala) {
    const cf = conforto(), b = bonusDe(cf);
    const podem = [];
    for (const R of ROOMS) if (S().salas[R.id]) for (const m of MOVEIS[R.id]) if (!S().mob[m.id] && P.zeny >= m.cr && podeMat(m.mat)) podem.push(m.nome);
    const salas = ROOMS.filter(R => S().salas[R.id]);
    const fala = !salas.length ? 'A casa ainda é só esta sala. O <b>Mestre de Obras Tibério</b>, lá fora, constrói cômodos novos. Cada cômodo tem móveis lindos!' : podem.length ? `Já dá para fazer: <b>${podem.slice(0, 4).join(', ')}</b>${podem.length > 4 ? ` e mais ${podem.length - 4}` : ''}!` : 'Ainda falta material para os próximos móveis. Caçando bastante a gente chega lá!';
    dialog('🧹 Governanta Clara', `Bem-vindo de volta! Eu cuido de tudo por aqui. ${fala}<br><br>🏠 <b>Conforto: ${cf} / ${CONF_MAX}</b><br><small>Ao sair de casa você fica <b>1 hora Descansado</b>: +${pct(b.xp)} de XP, +${pct(b.drop)} de drop e +${pct(b.cr)} de coroas. Mais móveis, mais conforto.</small>`, [
      ...salas.map(R => ({ label: `${R.ic} Móveis: ${R.nome} (${MOVEIS[R.id].filter(m => S().mob[m.id]).length}/5)`, fn: () => { moveis(R); return true; } })),
      { label: '📖 Livro dos Móveis', fn: () => { livro(); return true; } },
      ...(typeof Casa !== 'undefined' && Casa.menuMudar ? [{ label: '🪑 Mudar os móveis da sala de lugar', fn: () => { Casa.menuMudar(() => governanta()); return true; } }] : []),
      { label: 'Obrigado, Clara' }]);
  }
  function moveis(R) {
    dialog(`${R.ic} ${R.nome}`, `Cada móvel dá conforto (e fica lindo!). <small>Coroas: <b>${P.zeny.toLocaleString('pt-BR')} cr</b></small>`, [
      ...MOVEIS[R.id].map(m => { const feito = S().mob[m.id], ok = !feito && P.zeny >= m.cr && podeMat(m.mat);
        return { label: `${feito ? '✅' : ok ? '🔨' : '🔒'} ${m.ic} ${m.nome} · +${m.conf} conforto${feito ? ' · feito' : ` · ${faltaTxt(m.cr, m.mat)}`}`, fn: () => {
          if (feito) { moveis(R); return true; }
          dialog(`${m.ic} ${m.nome}`, `+${m.conf} de conforto<br>${P.zeny >= m.cr ? '✅' : '❌'} <b>💰 Coroas</b>: tem <b>${fmt(P.zeny)}</b> de ${fmt(m.cr)}<br>${matTxt(m.mat)}<br><small>A mochila e o baú da casa contam juntos.</small>`, [
            { label: ok ? '🔨 Fazer' : '🔒 Falta material ou coroas', fn: () => { if (!ok) { Audio8.sfx('miss'); moveis(R); return true; }
              P.zeny -= m.cr; tirarMat(m.mat); S().mob[m.id] = 1; montarSala(R); mobiliar(R); Audio8.sfx('anvil');
              log(`🏠 <b>${m.nome}</b> está na ${R.nome}! Conforto agora: <b>${conforto()}</b>.`, 'gold'); try { save(); } catch (e) { } completos(); moveis(R); return true; } },
            optPref(() => moveis(R)),
            { label: '← Voltar', fn: () => { moveis(R); return true; } }]);
          return true; } }; }),
      { label: '← Voltar', fn: () => { governanta(); return true; } }]);
  }

  // ---------------- 📖 livro da casa (ideia do Rone): cada cômodo completo (5 móveis) dá +1 ponto de atributo e
  // uma placa dourada no cômodo; a sala da casa completa (os 8 móveis da bancada) também vale
  function completos() {
    const c = S(); c.ok = c.ok || {};
    const marcar = (k, nome) => { if (c.ok[k]) return; c.ok[k] = 1; P.statPts = (P.statPts || 0) + 1; P.ptsExtra = (P.ptsExtra || 0) + 1; banner('📖 CÔMODO COMPLETO'); Audio8.sfx('level');
      log(`📖 <b>${nome}</b> completo! Você ganhou <b>+1 ponto de atributo</b> (📊 Atributos) e uma placa dourada no cômodo.`, 'gold'); try { save(); } catch (e) { } };
    if (Object.keys(c.mov || {}).length >= 8) marcar('sala', 'Sala da casa');
    for (const R of ROOMS) if (MOVEIS[R.id].every(m => c.mob[m.id])) { marcar(R.id, R.nome); if (R.g && !R.placa) placa(R); }
  }
  function placa(R) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#ffe7a0'); gr.addColorStop(1, '#b0781a'); x.fillStyle = gr; x.fillRect(0, 0, 256, 128);
    x.strokeStyle = '#5a3a10'; x.lineWidth = 6; x.strokeRect(5, 5, 246, 118); x.fillStyle = '#3a2208'; x.font = 'bold 20px Georgia'; x.textAlign = 'center'; x.fillText('★ CÔMODO COMPLETO ★', 128, 48); x.font = 'bold 24px Georgia'; x.fillText(R.nome, 128, 90);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshPhongMaterial({ map: t, shininess: 90, emissive: 0x2a1800 })); m.position.set(-3.2, 2.4, -H + 0.3); R.g.add(m); R.placa = m;
  }
  // ---------------- 📖 Livro dos Móveis (pedido do Rone: "a gente tem mania de colecionador")
  // cada linha é um cômodo; linha completa = ★, +1 ponto de atributo e placa dourada
  // 📸 fotos de verdade dos móveis no Livro (pedido do Rone: "a gente tem mania de colecionador"; no livro só
  // apareciam emojis apagados). Cada móvel 3D é montado sozinho numa cena pequena, fotografado de 3/4 e guardado.
  const FOTO = {};
  let fotoRT = null;
  function fotoMovel(chave, montar) {
    if (FOTO[chave]) return FOTO[chave];
    const N = 128; if (!fotoRT) { fotoRT = new THREE.WebGLRenderTarget(N, N); fotoRT.texture.encoding = THREE.sRGBEncoding; }
    const cena = new THREE.Scene(); cena.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 0.9)); const sol = new THREE.DirectionalLight(0xfff0dd, 0.9); sol.position.set(3, 5, 6); cena.add(sol); const apoio = new THREE.DirectionalLight(0xd8e0ff, 0.45); apoio.position.set(-5, 2, 3); cena.add(apoio);
    const p = new THREE.Group(); cena.add(p);
    const orig = addOb; addOb = () => ({}); try { montar(p); } catch (e) { } finally { addOb = orig; }
    // madeira escura saía preta na foto: clareia as cores escuras (só na foto; o móvel na casa não muda)
    const clones = []; p.traverse(o => { if (o.isPoints || o.isSprite) { o.visible = false; return; }
      if (o.material && o.material.color && !o.material.isMeshBasicMaterial) { const m = o.material.clone(), hsl = {}; m.color.getHSL(hsl); if (hsl.l < 0.4) m.color.setHSL(hsl.h, hsl.s, 0.4 + hsl.l * 0.4); o.material = m; clones.push(m); } });
    const bx = new THREE.Box3().setFromObject(p); if (bx.isEmpty()) return (FOTO[chave] = '');
    const ctr = bx.getCenter(new THREE.Vector3()), tam = bx.getSize(new THREE.Vector3()), r = Math.max(tam.x, tam.y, tam.z) * 0.7 + 0.1;
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 100), d = r / Math.sin(Math.PI / 12);
    const chao = tam.y < 0.25;                                                  // tapete: foto de cima
    cam.position.set(ctr.x + d * (chao ? 0.15 : 0.55), ctr.y + d * (chao ? 0.95 : 0.28), ctr.z + d * (chao ? 0.3 : 0.8)); cam.lookAt(ctr);
    const antes = renderer.getRenderTarget(), cor = renderer.getClearColor(new THREE.Color()), alfa = renderer.getClearAlpha();
    renderer.setRenderTarget(fotoRT); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(cena, cam);
    const px = new Uint8Array(N * N * 4); renderer.readRenderTargetPixels(fotoRT, 0, 0, N, N, px);
    renderer.setRenderTarget(antes); renderer.setClearColor(cor, alfa);
    const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
    for (let y = 0; y < N; y++) im.data.set(px.subarray((N - 1 - y) * N * 4, (N - y) * N * 4), y * N * 4);   // a imagem vem de cabeça para baixo
    x.putImageData(im, 0, 0);
    p.traverse(o => { if (o.geometry) o.geometry.dispose(); }); clones.forEach(m => m.dispose());
    return (FOTO[chave] = c.toDataURL());
  }
  // lista de todos os móveis do livro: sala da casa + os 8 cômodos
  function itensLivro() {
    const c = S(), sala = typeof Casa !== 'undefined' && Casa.MOVEIS ? Casa.MOVEIS : {}, B = (typeof Casa !== 'undefined' && Casa.BUILD) || {};
    const linhas = [{ id: 'sala', ic: '🏠', nome: 'Sala da casa', trancada: false, its: Object.entries(sala).map(([k, [nome, ic, cr, mat]]) => ({ chave: 'sala_' + k, nome, ic, cr, mat, conf: 6, tem: !!(c.mov || {})[k], montar: B[k] ? p => B[k](p) : null, onde: 'a Sala da casa (Reformas, na bancada)', fazer: () => typeof Casa !== 'undefined' && Casa.fazer && Casa.fazer(k) })) }];
    for (const R of ROOMS) linhas.push({ id: R.id, ic: R.ic, nome: R.nome, trancada: !c.salas[R.id], its: MOVEIS[R.id].map(m => ({ chave: m.id, nome: m.nome, ic: m.ic, cr: m.cr, mat: m.mat, conf: m.conf, tem: !!c.mob[m.id], montar: CONSTR[m.tipo] ? p => CONSTR[m.tipo](p, m.cor) : null, onde: `o ${R.nome} (com a Governanta Clara)`, fazer: () => { if (S().mob[m.id] || !c.salas[R.id] || P.zeny < m.cr || !podeMat(m.mat)) return false; P.zeny -= m.cr; tirarMat(m.mat); S().mob[m.id] = 1; montarSala(R); mobiliar(R); Audio8.sfx('anvil'); log(`🏠 <b>${m.nome}</b> está no lugar dele no ${R.nome}! Conforto agora: <b>${conforto()}</b>.`, 'gold'); try { save(); } catch (e) { } completos(); return true; } })) });
    return linhas;
  }
  function livro() {
    const c = S(), ok = c.ok || {}, linhas = itensLivro();
    let total = 0, max = 0;
    const cel = (it, li, ii) => `<span class="lm-c ${it.tem ? 'tem' : ''}" title="${it.nome}" onclick="Comodos.verMovel(${li},${ii})"><span class="lm-f" data-k="${it.chave}">${FOTO[it.chave] ? `<img src="${FOTO[it.chave]}">` : `<b>${it.ic}</b>`}</span><small>${it.nome}</small>${it.tem ? '<i>✔</i>' : '<i class="lm-x">🔒</i>'}</span>`;
    const html = linhas.map((L0, li) => { const n = L0.its.filter(x => x.tem).length, feita = !!ok[L0.id]; total += n; max += L0.its.length;
      return `<div class="lm-l ${feita ? 'feita' : ''}"><div class="lm-t">${feita ? '★' : L0.trancada ? '🔒' : '☆'} ${L0.ic} <b>${L0.nome}</b> <small>${L0.trancada ? 'cômodo ainda não construído' : `${n}/${L0.its.length}${feita ? ' · +1 ponto ganho' : ''}`}</small></div><div class="lm-g">${L0.its.map((it, ii) => cel(it, li, ii)).join('')}</div></div>`; }).join('');
    const pts = Object.keys(ok).length;
    dialog('📖 Livro dos Móveis', `<div class="lm-top">Móveis: <b>${total} / ${max}</b> · Linhas completas: <b>${pts} / ${ROOMS.length + 1}</b> · Pontos de atributo ganhos: <b>+${pts}</b></div><div class="lm">${html}</div><small>Toque num móvel para ver o que ele pede. Os que você já tem ficam coloridos com ✔; complete uma linha (todos os móveis do cômodo) para ganhar <b>+1 ponto de atributo</b> e a placa dourada.</small>`, [{ label: 'Fechar' }]);
    // tira as fotos aos poucos (algumas por quadro) para o livro abrir na hora
    const fila = linhas.flatMap(L0 => L0.its).filter(it => !FOTO[it.chave] && it.montar);
    const passo = () => { const dlg = $('dialog'); if (!fila.length || !dlg || dlg.classList.contains('hidden')) return;
      for (let k = 0; k < 4 && fila.length; k++) { const it = fila.shift(), url = fotoMovel(it.chave, it.montar); const el = dlg.querySelector(`.lm-f[data-k="${it.chave}"]`); if (el && url) el.innerHTML = `<img src="${url}">`; }
      requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  }
  function verMovel(li, ii) {
    const L0 = itensLivro()[li], it = L0 && L0.its[ii]; if (!it) return;
    Audio8.sfx('click');
    const url = it.montar ? fotoMovel(it.chave, it.montar) : '';
    dialog(`${it.ic} ${it.nome}`, `<div class="lm-ver">${url ? `<img src="${url}">` : `<b>${it.ic}</b>`}<div>${it.tem ? '✅ <b>Você já tem este móvel.</b>' : L0.trancada ? `🔒 Primeiro construa o cômodo <b>${L0.nome}</b> com o Mestre de Obras Tibério.` : `Faça em ${it.onde}.`}<br>🏠 +${it.conf} de conforto<br>${P.zeny >= it.cr ? '✅' : '❌'} 💰 <b>${fmt(it.cr)} cr</b> <small>(tem ${fmt(P.zeny)})</small></div></div>${it.tem ? '' : matTxt(it.mat)}`, [...(!it.tem && !L0.trancada ? [{ label: P.zeny >= it.cr && podeMat(it.mat) ? '🔨 Fazer agora (vai direto para o lugar dele)' : '🔒 Ainda falta material ou coroas', fn: () => { if (it.fazer && it.fazer()) { banner(`🏠 ${it.nome.toUpperCase()}`); verMovel(li, ii); } else { Audio8.sfx('miss'); verMovel(li, ii); } return true; } }] : []), { label: '← Voltar ao livro', fn: () => { livro(); return true; } }, { label: 'Fechar' }]);
  }
  // botão no ☰ Mais
  function botaoLivro() { const m = $('menu'); if (!m || $('btn-moveis')) return; const b = document.createElement('button'); b.id = 'btn-moveis'; b.title = 'Livro dos Móveis'; b.textContent = '📖'; b.style.display = 'none'; b.onclick = () => { Audio8.sfx('click'); livro(); }; m.appendChild(b); }
  setInterval(botaoLivro, 2000);
  // ---------------- laço
  let dentroAntes = false;
  let iniciou = false;
  function update(dt) {
    if (!iniciou && running) { iniciou = true; init(); }
    prepararSprites();
    const aqui = salaAqui();
    if (aqui >= 0 && aqui !== update.ultima) { montarSala(ROOMS[aqui]); mobiliar(ROOMS[aqui]); if (S().ok && S().ok[ROOMS[aqui].id] && !ROOMS[aqui].placa) placa(ROOMS[aqui]); } update.ultima = aqui;
    for (const R of ROOMS) if (R.g) R.g.visible = aqui === R.k;
    if (portaCasa) portaCasa.visible = aqui === -1;
    // bônus: saiu de casa → 1 hora Descansado
    const dentro = aqui >= -1;
    if (dentroAntes && !dentro && conforto() > 0) { P.larAte = Date.now() + LAR_MIN * 60000; const b = bonusDe(conforto()); if (typeof addBuff === 'function') addBuff('lar', LAR_MIN * 60, {}, '🏠'); log(`🏠 <b>Descansado</b> por 1 hora (conforto ${conforto()}): +${pct(b.xp)} XP, +${pct(b.drop)} drop, +${pct(b.cr)} coroas.`, 'gold'); }
    dentroAntes = dentro;
    // governanta
    gov.g.visible = aqui === -1;
    if (gov.g.visible && gov.act) {
      // só vai para ponto livre (não entra em móvel nem no baú: ficava presa "dentro de uma caixa")
      gov.t -= dt; if (gov.t <= 0) { const ok = GOV_PTS.filter(q => !blocked(CASA.x + q[0], CASA.z + q[1], 0.7)); const q = ok.length ? ok[Math.floor(Math.random() * ok.length)] : [0, 2]; gov.tx = CASA.x + q[0]; gov.tz = CASA.z + q[1]; gov.t = rand(5, 9); gov.varre = 0; }
      if (blocked(gov.x, gov.z, 0.5)) { const f = typeof pontoLivre === 'function' && pontoLivre(gov.x, gov.z); if (f) { gov.x = f.x; gov.z = f.z; } }
      const dx = gov.tx - gov.x, dz = gov.tz - gov.z, d = Math.hypot(dx, dz), anda = d > 0.2;
      if (anda) { const nx = gov.x + dx / d * Math.min(d, 1.1 * dt), nz = gov.z + dz / d * Math.min(d, 1.1 * dt); if (blocked(nx, nz, 0.4)) gov.t = 0; else { gov.x = nx; gov.z = nz; } gov.face = Math.atan2(dx, dz); } else gov.varre += dt;
      gov.g.position.set(gov.x, CASA.y, gov.z);
      gov.act.update(dt, { face: !anda && Math.hypot(P.x - gov.x, P.z - gov.z) < 3 ? Math.atan2(P.x - gov.x, P.z - gov.z) : gov.face, moving: anda });
      if (gov.vass) { gov.vass.rotation.z = !anda ? Math.sin(gov.varre * 7) * 0.5 : 0.2; if (!anda && Math.random() < dt * 4 && typeof VFX !== 'undefined') VFX.particle(new THREE.Vector3(gov.x + 0.5, CASA.y + 0.15, gov.z + 0.2), 0xc8b89a, { map: VFX.T.smoke, size: 0.5, speed: 0.6, g: -0.3, life: 0.8, op: 0.4 }); }
    }
    if (obra.act) obra.act.update(dt, { face: Math.hypot(P.x - obra.x, P.z - obra.z) < 7 ? Math.atan2(P.x - obra.x, P.z - obra.z) : 0, moving: false });
    // animação dos móveis do cômodo onde você está
    if (aqui >= 0) for (const p of Object.values(ROOMS[aqui].objs)) { const u = p.userData; if (u.gira) u.gira.rotation.y += dt * 0.6; if (u.flutua) u.flutua.position.y = 1.5 + Math.sin(time * 2) * 0.1; if (u.fogo) u.fogo.material.color.setHSL(0.07, 1, 0.5 + Math.sin(time * 12) * 0.08); if (u.bolha) u.bolha.scale.setScalar(1 + Math.sin(time * 6) * 0.04); if (u.agua) u.agua.material.emissive.setHSL(0.55, 0.6, 0.1 + Math.sin(time * 2) * 0.04); if (u.borb) for (const o of u.borb) { const a = time * 1.5 + o.a * 1.1; o.b.position.set(Math.cos(a) * 0.6, 1.2 + Math.sin(a * 1.7) * 0.6, Math.sin(a) * 0.6); o.b.rotation.y = a; o.b.scale.x = 0.5 + Math.abs(Math.sin(time * 18 + o.a)); } }
    for (const m of portais) { m.material.map.rotation += dt * (m.userData.k ? -0.5 : 0.35); m.material.opacity = 0.75 + Math.sin(time * 2 + m.userData.k) * 0.2; }
    // portas
    if (P.dead) return;
    if (aqui < -1) { armada = true; return; }
    const perto = (x, z) => Math.hypot(P.x - x, P.z - z) < 1.3;
    if (!armada) { if (!chegou || Math.hypot(P.x - chegou.x, P.z - chegou.z) > 1.5) armada = true; return; }      // só usa outra porta depois de sair de perto de onde chegou
    if (aqui === -1) { if (tem(0) && perto(CASA.x - H + 0.6, CASA.z - 0.5)) { montarSala(ROOMS[0]); const f = ROOMS[0].f; ir(f.x + H - 1.6, f.z, -Math.PI / 2); } return; }
    const R = ROOMS[aqui];
    if (perto(R.f.x + H - 0.6, R.f.z)) { if (aqui === 0) ir(CASA.x - H + 1.8, CASA.z - 0.5, Math.PI / 2); else { const f = ROOMS[aqui - 1].f; ir(f.x - H + 1.6, f.z, Math.PI / 2); } }
    else if (perto(R.f.x - H + 0.6, R.f.z) && tem(aqui + 1) && ROOMS[aqui + 1]) { montarSala(ROOMS[aqui + 1]); const f = ROOMS[aqui + 1].f; ir(f.x + H - 1.6, f.z, -Math.PI / 2); }
    if (R.portaO) R.portaO.visible = !!ROOMS[aqui + 1] && tem(aqui + 1);
    if (R.portaFechada) R.portaFechada.visible = !(R.portaO && R.portaO.visible);
  }
  function nearest() {
    if (!inTower(P.z)) { if (Math.hypot(P.x - obra.x, P.z - obra.z) < 3) return { label: '🏗️ Falar com o Mestre de Obras', fn: () => obras() }; return null; }
    if (salaAqui() === -1 && gov.g.visible && Math.hypot(P.x - gov.x, P.z - gov.z) < 2.6) return { label: '🧹 Falar com a Governanta', fn: () => governanta() };
    return null;
  }
  function init() { for (const R of ROOMS) if (S().salas[R.id]) montarSala(R); if (tem(0)) montarPortaCasa(); completos(); if (P.larAte > Date.now() && typeof addBuff === 'function') addBuff('lar', Math.round((P.larAte - Date.now()) / 1000), {}, '🏠'); }
  return { faltaTxt, fonte, update, nearest, bonus, conforto, init, completos, livro, verMovel, qtd, podeMat, tirarMat, matTxt, optPref, SALAS, MOVEIS };
})();
