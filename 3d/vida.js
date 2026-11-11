// =====================================================================
//  Vida no mundo: materiais dos monstros, mochila, Sítio de Solmira
//  (plantação e criação), troca direta e banca entre jogadores.
//  Mecânicas inspiradas em Ragnarok (banca/vending, janela de troca),
//  Priston Tale (troca) e Lineage 2 (private store, manor de sementes).
// =====================================================================
'use strict';
const Vida = (() => {
  let SAVE = 'reino-vida-v1-0'; const MIN = 60000;

  // ---------------------------------------------------------------- itens
  Object.assign(ITEMS.red, { ic: '🧪', sell: 12, use: 'pot' });
  Object.assign(ITEMS.blue, { ic: '💧', sell: 45, use: 'pot' });
  // id: [nome, ícone, valor de venda ao NPC, preço de compra, tipo, extra]
  const NEW = {
    gosma: ['Gosma de Larva', '🟢', 8, 0, 'mat'], po_eco: ['Pó de Eco', '🌫️', 10, 0, 'mat'], raiz: ['Raiz Seca', '🪵', 12, 0, 'mat'],
    cristal: ['Cristal Opaco', '💎', 20, 0, 'mat'], fio: ['Fio de Sombra', '🧵', 28, 0, 'mat'], lasca: ['Lasca de Armadura', '🛡️', 45, 0, 'mat'],
    essencia: ['Essência Negra', '🖤', 120, 0, 'mat'],
    s_trigo: ['Semente de Trigo', '🌱', 2, 6, 'semente'], s_cenoura: ['Semente de Cenoura', '🌱', 4, 12, 'semente'],
    s_flor: ['Semente de Flor-da-Fonte', '🌱', 10, 30, 'semente'], racao: ['Ração', '🌾', 1, 4, 'racao'],
    trigo: ['Trigo', '🌾', 9, 0, 'colheita'], cenoura: ['Cenoura', '🥕', 15, 0, 'colheita'], flor: ['Flor-da-Fonte', '🌸', 40, 0, 'colheita'],
    ovo: ['Ovo', '🥚', 8, 0, 'colheita'], la: ['Lã', '🧶', 20, 0, 'colheita'], leite: ['Leite', '🥛', 14, 0, 'colheita'],
    pao: ['Pão de Trigo', '🍞', 10, 0, 'comida', { heal: 0.3 }],
  };
  // ---------------- equipamentos (estilo Priston/Lineage): 8 espaços, raridade e conjuntos
  // mods: pow = dano (físico ou mágico, conforme o herói), def, hp, sp, crit, spd (velocidade)
  // [nome, ícone, espaço, preço na loja (0 = só cai de monstro), mods, raridade, conjunto]
  const GEAR = {
    arma_ferro: ['Arma de Ferro Velho', '⚔️', 'arma', 120, { pow: 6 }, 0],
    arma_cristal: ['Arma de Cristal', '🗡️', 'arma', 0, { pow: 14 }, 1],
    arma_essencia: ['Arma da Essência', '🔱', 'arma', 0, { pow: 26, crit: 0.03 }, 2],
    arma_cisma: ['Garra do Cisma', '🦴', 'arma', 0, { pow: 42, crit: 0.06 }, 3],
    capuz_couro: ['Capuz de Couro', '🪖', 'capacete', 0, { def: 2, hp: 15 }, 0, 'couro'],
    gibao_couro: ['Gibão de Couro', '🦺', 'armadura', 0, { def: 4, hp: 25 }, 0, 'couro'],
    luvas_couro: ['Luvas de Couro', '🧤', 'luvas', 0, { def: 1, pow: 2 }, 0, 'couro'],
    botas_couro: ['Botas de Couro', '🥾', 'botas', 0, { def: 1, spd: 0.04 }, 0, 'couro'],
    manto: ['Manto de Viajante', '🧥', 'armadura', 90, { def: 4, hp: 30 }, 0],
    turbante: ['Turbante das Areias', '👳', 'capacete', 0, { def: 4, hp: 30, crit: 0.01 }, 1, 'areias'],
    manto_areias: ['Manto das Areias', '🧥', 'armadura', 0, { def: 8, hp: 60 }, 1, 'areias'],
    luvas_areias: ['Braçadeiras das Areias', '🧤', 'luvas', 0, { def: 2, pow: 4, crit: 0.01 }, 1, 'areias'],
    sandalias: ['Sandálias das Dunas', '👡', 'botas', 0, { def: 2, spd: 0.07 }, 1, 'areias'],
    cota: ['Cota do Reino', '🦺', 'armadura', 420, { def: 10, hp: 90 }, 1],
    elmo_sentinela: ['Elmo da Sentinela', '⛑️', 'capacete', 0, { def: 8, hp: 60 }, 2, 'sentinela'],
    couraca_sentinela: ['Couraça da Sentinela', '🛡️', 'armadura', 0, { def: 16, hp: 140 }, 2, 'sentinela'],
    manoplas_sentinela: ['Manoplas da Sentinela', '🥊', 'luvas', 0, { def: 4, pow: 8 }, 2, 'sentinela'],
    grevas_sentinela: ['Grevas da Sentinela', '🥾', 'botas', 0, { def: 4, spd: 0.08, hp: 40 }, 2, 'sentinela'],
    arm_negra: ['Armadura Negra', '🥋', 'armadura', 0, { def: 18, hp: 180 }, 2],
    coroa_espinhos: ['Coroa de Espinhos', '👑', 'capacete', 0, { def: 14, hp: 120, pow: 8 }, 3, 'cisma'],
    manto_cisma: ['Manto do Cisma', '🧛', 'armadura', 0, { def: 26, hp: 260 }, 3, 'cisma'],
    garras_cisma: ['Garras do Cisma', '🧤', 'luvas', 0, { def: 6, pow: 14, crit: 0.03 }, 3, 'cisma'],
    passos_cisma: ['Passos do Cisma', '👢', 'botas', 0, { def: 6, spd: 0.12, hp: 80 }, 3, 'cisma'],
    anel_raiz: ['Anel de Raiz', '💍', 'anel', 150, { crit: 0.03, sp: 10 }, 0],
    anel_cristal: ['Anel de Cristal', '💍', 'anel', 0, { crit: 0.05, pow: 3 }, 1],
    anel_vazio: ['Anel do Vazio', '💍', 'anel', 0, { pow: 7, sp: 30 }, 2],
    anel_kravenox: ['Anel do Soberano', '💍', 'anel', 0, { pow: 12, crit: 0.06, hp: 100 }, 3],
    amuleto: ['Amuleto da Fonte', '📿', 'colar', 380, { sp: 40, hp: 40 }, 0],
    colar_sombra: ['Colar de Sombra', '📿', 'colar', 0, { crit: 0.04, hp: 50 }, 1],
    marca: ['Marca dos Quatro Espinhos', '✴️', 'colar', 0, { pow: 10, crit: 0.07, hp: 120 }, 3],
  };
  const RARITY = [{ n: 'Comum', c: '#e8e4dc', hex: 0xe8e4dc }, { n: 'Raro', c: '#6ab0ff', hex: 0x4a90ff }, { n: 'Épico', c: '#c27aff', hex: 0xa050ff }, { n: 'Lendário', c: '#ffb640', hex: 0xffa020 }];
  const SETS = {
    couro: { name: 'Conjunto de Couro', bonus: { hp: 60, def: 3 } },
    areias: { name: 'Conjunto das Areias', bonus: { crit: 0.05, spd: 0.05, hp: 80 } },
    sentinela: { name: 'Conjunto da Sentinela', bonus: { def: 20, pow: 10, hp: 150 } },
    cisma: { name: 'Conjunto do Cisma', bonus: { pow: 25, def: 25, hp: 300, crit: 0.08 } },
  };
  for (const [id, [name, ic, slot, price, mods, rar, set]] of Object.entries(GEAR)) ITEMS[id] = { name, ic, kind: 'equip', slot, mods, rar, set, price: price || 0, sell: Math.round((price || [60, 220, 700, 2000][rar]) / 2) };
  const SLOTS = { arma: 'Arma', capacete: 'Capacete', armadura: 'Armadura', luvas: 'Luvas', botas: 'Botas', anel1: 'Anel', anel2: 'Anel', colar: 'Colar' };
  const MODN = { pow: 'Dano', def: 'Defesa', hp: 'HP', sp: 'SP', crit: 'Crítico', spd: 'Velocidade' };
  const modTxt = m => Object.entries(m || {}).map(([k, v]) => `${MODN[k]} +${['crit', 'spd'].includes(k) ? Math.round(v * 100) + '%' : v}`).join(' · ');
  for (const [id, [name, ic, sell, price, kind, extra]] of Object.entries(NEW)) ITEMS[id] = { name, ic, sell, price: price || sell * 2, kind, ...(extra || {}) };
  const it = id => ITEMS[id] || { name: id, ic: '❔', sell: 0, price: 0 };
  const has = (id, n = 1) => (P.inv[id] || 0) >= n;
  const add = (id, n) => { P.inv[id] = Math.max(0, (P.inv[id] || 0) + n); if (id === 'red' || id === 'blue') buildHotbar(); };

  // materiais que cada monstro solta
  const MOB_MAT = { pompom: 'gosma', zunzum: 'po_eco', fungolino: 'raiz', besouro: 'cristal', serpe: 'fio', guardiao: 'lasca', larva: 'gosma', verme: 'lasca', esfera: 'cristal', sentinela: 'lasca', kravenox: 'essencia' };
  for (const [t, m] of Object.entries(MOB_MAT)) if (MOBDEF[t]) MOBDEF[t].drops.push([m, MOBDEF[t].boss ? 1 : 0.45]);
  const GEAR_DROP = {
    pompom: [['capuz_couro', 0.04], ['botas_couro', 0.02]],
    zunzum: [['luvas_couro', 0.04], ['botas_couro', 0.03]],
    fungolino: [['gibao_couro', 0.03], ['anel_raiz', 0.03]],
    besouro: [['turbante', 0.025], ['luvas_areias', 0.025], ['arma_cristal', 0.02], ['anel_cristal', 0.015]],
    serpe: [['manto_areias', 0.02], ['sandalias', 0.012], ['colar_sombra', 0.015]],
    guardiao: [['couraca_sentinela', 0.12], ['arma_essencia', 0.15], ['arm_negra', 0.08]],
    larva: [['manoplas_sentinela', 0.012]],
    verme: [['grevas_sentinela', 0.015], ['arma_essencia', 0.01]],
    esfera: [['anel_vazio', 0.02], ['essencia', 0.02]],
    sentinela: [['elmo_sentinela', 0.02], ['manoplas_sentinela', 0.015], ['essencia', 0.03]],
    kravenox: [['marca', 0.5], ['arma_cisma', 0.3], ['coroa_espinhos', 0.25], ['manto_cisma', 0.2], ['garras_cisma', 0.2], ['passos_cisma', 0.2], ['anel_kravenox', 0.15]],
  };
  for (const [t, l] of Object.entries(GEAR_DROP)) if (MOBDEF[t]) MOBDEF[t].drops.push(...l);

  // ---------------------------------------------------------------- Sítio
  const CROPS = {
    trigo: { seed: 's_trigo', min: 3, n: [2, 3], color: 0xe8c050 },
    cenoura: { seed: 's_cenoura', min: 6, n: [2, 3], color: 0xff8a30 },
    flor: { seed: 's_flor', min: 15, n: [1, 2], color: 0xff7ec8 },
  };
  const ANIMALS = {
    galinha: { name: 'Galinha', price: 60, prod: 'ovo', min: 4, n: [1, 2], h: 0.62 },
    ovelha: { name: 'Ovelha', price: 220, prod: 'la', min: 8, n: [1, 2], h: 1.0 },
    vaca: { name: 'Vaca', price: 420, prod: 'leite', min: 10, n: [2, 3], h: 1.45 },
  };
  const MAX_ANIMALS = 8;
  let st = { plots: Array(8).fill(null), animals: [], stall: null, pend: [] };
  function useSlot(n) {      // cada vaga de personagem tem o próprio Sítio
    SAVE = 'reino-vida-v1-' + n;
    st = { plots: Array(8).fill(null), animals: [], stall: null, pend: [] };
    try { const s = JSON.parse(localStorage.getItem(SAVE)); if (s) st = { ...st, ...s }; } catch (e) { }
  }
  const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(st)); } catch (e) { } };
  setInterval(save, 8000); addEventListener('beforeunload', save);

  const F = FARM;
  const PLOTS = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) PLOTS.push({ x: F.x - 8 + c * 4.4, z: F.z - 11 + r * 4.4 });
  const PEN = { x0: F.x - 12, x1: F.x + 2, z0: F.z + 4, z1: F.z + 13 };

  // construção do Sítio
  const soilM = new THREE.MeshLambertMaterial({ color: 0x6a4a2c }), woodM = new THREE.MeshLambertMaterial({ color: 0x8a6238 });
  for (const p of PLOTS) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 3.4), soilM); s.position.set(p.x, groundY(p.x, p.z) + 0.05, p.z); s.receiveShadow = true; scene.add(s);
    p.g = new THREE.Group(); p.g.position.set(p.x, groundY(p.x, p.z) + 0.18, p.z); scene.add(p.g);
    p.stalks = [];
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 5), new THREE.MeshLambertMaterial({ color: 0x4caf50 }));
      m.position.set((i % 3 - 1) * 1.0, 0.45, (Math.floor(i / 3) - 1) * 1.0); m.castShadow = true; p.g.add(m); p.stalks.push(m);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.17, 7, 5), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      top.position.y = 0.5; m.add(top); m.top = top;
    }
  }
  // cerca do curral (visual) e celeiro
  const post = new THREE.BoxGeometry(0.18, 1.0, 0.18), rail = new THREE.BoxGeometry(1, 0.1, 0.08);
  const fenceLine = (ax, az, bx, bz, gap) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.round(len / 1.6);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (gap && Math.abs(t - 0.5) < 0.14) continue;
      const m = new THREE.Mesh(post, woodM); m.position.set(x, groundY(x, z) + 0.5, z); m.castShadow = true; scene.add(m);
      if (i < n && !(gap && Math.abs(t + 0.5 / n - 0.5) < 0.16)) for (const y of [0.45, 0.8]) {
        const r = new THREE.Mesh(rail, woodM); const t2 = (i + 0.5) / n, rx = ax + (bx - ax) * t2, rz = az + (bz - az) * t2;
        r.position.set(rx, groundY(rx, rz) + y, rz); r.scale.x = len / n; r.rotation.y = -Math.atan2(bz - az, bx - ax); scene.add(r);
      }
    }
  };
  fenceLine(PEN.x0, PEN.z0, PEN.x1, PEN.z0, true); fenceLine(PEN.x1, PEN.z0, PEN.x1, PEN.z1); fenceLine(PEN.x1, PEN.z1, PEN.x0, PEN.z1); fenceLine(PEN.x0, PEN.z1, PEN.x0, PEN.z0);
  house(F.x - 17, F.z - 1, Math.PI / 2, 6, 5, '#a0402a', 'wood');
  // Fazendeira (NPC)
  {
    const n = { id: 'farm', name: 'Fazendeira Dália', x: F.x + 7, z: F.z - 4 };
    const g = new THREE.Group(); g.position.set(n.x, groundY(n.x, n.z), n.z); g.rotation.y = -Math.PI / 2; scene.add(g);
    const bang = bangSprite(); bang.position.y = 2.3; g.add(bang); n.bang = bang; n.g = g;
    addOb(n.x, n.z, 1.6); NPCS.push(n);
    if (typeof NPC_SPR !== 'undefined') NPC_SPR[n.name] = 'aldea';
  }

  // ---------------------------------------------------------------- animais em pixel art
  function pix(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; draw((x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }); return c; }
  function drawAnimals() {
    SpriteKit.addCanvas('a_galinha', pix(16, 15, f => {
      f(4, 5, 9, 6, '#f4f0e8'); f(3, 6, 2, 3, '#e8e0d0'); f(11, 2, 3, 4, '#f4f0e8'); f(12, 0, 2, 2, '#d8302a'); f(14, 3, 2, 1, '#f0b020');
      f(12, 3, 1, 1, '#1a1a1a'); f(6, 7, 4, 2, '#e0d8c8'); f(6, 11, 1, 3, '#f0b020'); f(10, 11, 1, 3, '#f0b020'); f(5, 14, 3, 1, '#f0b020'); f(9, 14, 3, 1, '#f0b020');
    }));
    SpriteKit.addCanvas('a_ovelha', pix(22, 17, f => {
      for (const [x, y] of [[3, 3], [7, 2], [11, 2], [15, 3], [3, 7], [7, 7], [11, 7], [15, 6]]) f(x, y, 5, 5, '#f2efe6');
      f(4, 4, 14, 7, '#ebe6da'); f(17, 4, 4, 5, '#2a2a2a'); f(19, 5, 1, 1, '#ffffff'); f(16, 3, 2, 2, '#2a2a2a');
      f(5, 12, 2, 4, '#2a2a2a'); f(9, 12, 2, 4, '#2a2a2a'); f(13, 12, 2, 4, '#2a2a2a'); f(16, 12, 2, 4, '#2a2a2a');
    }));
    SpriteKit.addCanvas('a_vaca', pix(26, 19, f => {
      f(3, 4, 17, 9, '#f4f2ec'); f(5, 5, 4, 3, '#2a2a2a'); f(12, 8, 5, 4, '#2a2a2a'); f(15, 4, 3, 2, '#2a2a2a');
      f(19, 2, 6, 6, '#f4f2ec'); f(20, 2, 2, 2, '#2a2a2a'); f(19, 0, 1, 2, '#d8d0b8'); f(24, 0, 1, 2, '#d8d0b8'); f(22, 6, 4, 3, '#f0a0a8'); f(21, 4, 1, 1, '#1a1a1a');
      f(4, 13, 2, 5, '#e8e4dc'); f(8, 13, 2, 5, '#e8e4dc'); f(14, 13, 2, 5, '#e8e4dc'); f(17, 13, 2, 5, '#e8e4dc'); f(10, 13, 3, 2, '#f0a0a8'); f(2, 5, 1, 6, '#2a2a2a');
      for (const x of [4, 8, 14, 17]) f(x, 18, 2, 1, '#3a3a3a');
    }));
  }
  function iconSprite(txt) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.font = '44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 32, 34);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.setScalar(0.7); s.renderOrder = 9; return s;
  }
  const ICONS = {};
  const icon = t => (ICONS[t] = ICONS[t] || iconSprite(t)).clone();
  const live = [];   // animais no mundo
  function spawnAnimal(a) {
    const A = ANIMALS[a.k], g = new THREE.Group(); scene.add(g);
    const act = SpriteKit.actor({ kind: 'one', img: 'a_' + a.k }, { h: A.h, faceRight: true });
    g.add(act.root);
    const x = rand(PEN.x0 + 1.5, PEN.x1 - 1.5), z = rand(PEN.z0 + 1.5, PEN.z1 - 1.5);
    const o = { a, A, g, act, x, z, tx: x, tz: z, face: rand(0, TAU), t: rand(0, 3), mark: null, markT: '' };
    live.push(o); return o;
  }

  // ---------------------------------------------------------------- estado
  const now = () => Date.now();
  const cropLeft = p => p ? Math.max(0, p.t + CROPS[p.c].min * MIN - now()) : 0;
  const prodLeft = a => a.fed ? Math.max(0, a.fed + ANIMALS[a.k].min * MIN - now()) : Infinity;
  const fmtT = ms => { const s = Math.ceil(ms / 1000); return s >= 60 ? `${Math.ceil(s / 60)} min` : `${s}s`; };

  function plant(i, crop) {
    const C = CROPS[crop];
    if (!has(C.seed)) { log(`Sem ${it(C.seed).name}. A <b>Fazendeira Dália</b> vende.`, 'bad'); return; }
    add(C.seed, -1); st.plots[i] = { c: crop, t: now() }; save();
    Audio8.sfx('pick'); burst(new THREE.Vector3(PLOTS[i].x, groundY(PLOTS[i].x, PLOTS[i].z) + 0.5, PLOTS[i].z), 0x8a6238, 12, 2, 0.6);
    log(`🌱 Plantou <b>${it(crop).name}</b>. Fica pronto em ${C.min} min (cresce mesmo com o jogo fechado).`, 'item');
  }
  function harvest(i) {
    const p = st.plots[i]; if (!p || cropLeft(p) > 0) return;
    const C = CROPS[p.c], n = irand(C.n[0], C.n[1]); add(p.c, n); st.plots[i] = null; save();
    Audio8.sfx('coin'); floater(PLOTS[i].x, groundY(PLOTS[i].x, PLOTS[i].z) + 1.5, PLOTS[i].z, `+${n} ${it(p.c).ic}`, 'zeny');
    log(`Colheu ${n}× <b>${it(p.c).name}</b>.`, 'item');
  }
  function feed(o) {
    const food = has('racao') ? 'racao' : has('trigo') ? 'trigo' : null;
    if (!food) { log('Sem <b>Ração</b> nem <b>Trigo</b> para alimentar. A Fazendeira vende ração.', 'bad'); return; }
    add(food, -1); o.a.fed = now(); save(); Audio8.sfx('pick');
    log(`Alimentou a ${o.A.name.toLowerCase()} com ${it(food).name.toLowerCase()}. ${it(o.A.prod).ic} em ${o.A.min} min.`, 'item');
  }
  function collect(o) {
    if (prodLeft(o.a) > 0) return;
    const n = irand(o.A.n[0], o.A.n[1]); add(o.A.prod, n); o.a.fed = 0; save(); Audio8.sfx('coin');
    floater(o.x, groundY(o.x, o.z) + 1.6, o.z, `+${n} ${it(o.A.prod).ic}`, 'zeny');
    log(`Recolheu ${n}× <b>${it(o.A.prod).name}</b>.`, 'item');
  }
  function plantMenu(i) {
    const opts = Object.entries(CROPS).map(([c, C]) => ({ label: `${it(c).ic} ${it(c).name} — ${C.min} min (tem ${P.inv[C.seed] || 0} sementes)`, fn: () => { plant(i, c); } }));
    opts.push({ label: 'Cancelar' });
    dialog('🌱 Canteiro ' + (i + 1), 'O que plantar aqui? Cada semente rende 1 a 3 unidades.', opts);
  }

  // ---------------------------------------------------------------- Fazendeira
  const RECIPES = [
    { out: 'pao', n: 1, need: { trigo: 3 }, label: '🍞 Pão de Trigo (3 🌾)' },
    { out: 'red', n: 2, need: { cenoura: 2, ovo: 1 }, label: '🧪×2 Poção Vermelha (2 🥕 + 1 🥚)' },
    { out: 'blue', n: 1, need: { flor: 1, leite: 1 }, label: '💧 Poção Azul (1 🌸 + 1 🥛)' },
  ];
  function craft(r) {
    for (const [id, n] of Object.entries(r.need)) if (!has(id, n)) { log(`Falta ${it(id).name}.`, 'bad'); Audio8.sfx('miss'); return; }
    for (const [id, n] of Object.entries(r.need)) add(id, -n);
    add(r.out, r.n); Audio8.sfx('buff'); log(`Fez ${r.n}× <b>${it(r.out).name}</b>.`, 'gold');
  }
  function buyIt(id, n, price) {
    const c = price * n; if (P.zeny < c) { log('Zeny insuficiente!', 'bad'); Audio8.sfx('miss'); return false; }
    P.zeny -= c; add(id, n); Audio8.sfx('coin'); return true;
  }
  function talkFarm(eu) {
    const menu = () => dialog('Fazendeira Dália', `Olá, <b>${eu}</b>! Este é o Sítio de Solmira. Os canteiros e o curral são seus: plante, crie e venda o que quiser.<br><small>Zeny: <b>${P.zeny}z</b> · Animais: ${st.animals.length}/${MAX_ANIMALS}</small>`, [
      { label: '🌱 Sementes e ração', fn: () => { seeds(); return true; } },
      { label: '🐔 Comprar animais', fn: () => { animals(); return true; } },
      { label: '🍳 Fazer receitas', fn: () => { recipes(); return true; } },
      { label: '💰 Vender colheita', fn: () => { sellAll(['colheita']); menu(); return true; } },
      { label: 'Tchau' }]);
    const seeds = () => dialog('Sementes e ração', `<small>Zeny: <b>${P.zeny}z</b></small>`, [
      ...['s_trigo', 's_cenoura', 's_flor'].map(id => ({ label: `${it(id).name} ×5 — ${it(id).price * 5}z (tem ${P.inv[id] || 0})`, fn: () => { buyIt(id, 5, it(id).price); seeds(); return true; } })),
      { label: `🌾 Ração ×10 — ${it('racao').price * 10}z (tem ${P.inv.racao || 0})`, fn: () => { buyIt('racao', 10, it('racao').price); seeds(); return true; } },
      { label: '← Voltar', fn: () => { menu(); return true; } }]);
    const animals = () => dialog('Comprar animais', `Cada animal, alimentado, produz sozinho. <small>Zeny: <b>${P.zeny}z</b></small>`, [
      ...Object.entries(ANIMALS).map(([k, A]) => ({ label: `${A.name} — ${A.price}z (dá ${it(A.prod).ic} ${it(A.prod).name})`, fn: () => {
        if (st.animals.length >= MAX_ANIMALS) { log('O curral está cheio.', 'bad'); }
        else if (P.zeny >= A.price) { P.zeny -= A.price; const a = { k, fed: 0 }; st.animals.push(a); spawnAnimal(a); save(); Audio8.sfx('coin'); log(`Comprou uma <b>${A.name}</b>. Ela está no curral.`, 'gold'); }
        else { log('Zeny insuficiente!', 'bad'); }
        animals(); return true; } })),
      { label: '← Voltar', fn: () => { menu(); return true; } }]);
    const recipes = () => dialog('Receitas', 'A Fazendeira transforma a produção do Sítio.', [
      ...RECIPES.map(r => ({ label: r.label, fn: () => { craft(r); recipes(); return true; } })),
      { label: '← Voltar', fn: () => { menu(); return true; } }]);
    menu();
  }
  function gearShop() {
    const sh = () => dialog('⚔️ Equipamentos', `Equipe pela 🎒 mochila. <small>Zeny: <b>${P.zeny}z</b></small>`, [
      ...Object.keys(GEAR).filter(id => GEAR[id][3]).map(id => ({ label: `${it(id).ic} ${it(id).name} — ${it(id).price}z (${modTxt(it(id).mods)})`, fn: () => { if (buyIt(id, 1, it(id).price)) log(`Comprou <b>${it(id).name}</b>. Equipe pela mochila 🎒.`, 'item'); sh(); return true; } })),
      { label: 'Sair' }]);
    sh();
  }
  // vende ao NPC (materiais e colheita)
  function sellAll(kinds = ['mat', 'colheita']) {
    let z = 0, parts = [];
    for (const id in P.inv) { const I = ITEMS[id]; if (!I || !kinds.includes(I.kind) || !P.inv[id]) continue; z += I.sell * P.inv[id]; parts.push(`${P.inv[id]} ${I.ic}`); P.inv[id] = 0; }
    if (!z) { log('Nada para vender.', 'sys'); return; }
    P.zeny += z; Audio8.sfx('coin'); log(`Vendeu ${parts.join(', ')} por <b>${z}z</b>.`, 'gold');
  }

  // ---------------------------------------------------------------- mochila (inventário com o personagem)
  function setCount() { const c = {}; for (const sl in (P.equip || {})) { const I = ITEMS[P.equip[sl]]; if (I && I.set) c[I.set] = (c[I.set] || 0) + 1; } return c; }
  const gear = k => {
    let v = 0; for (const sl in (P.equip || {})) { const id = P.equip[sl]; if (id && ITEMS[id] && ITEMS[id].mods) v += ITEMS[id].mods[k] || 0; }
    const sc = setCount(); for (const st in sc) if (sc[st] >= 4) v += SETS[st].bonus[k] || 0;
    return v;
  };
  let sel = null;
  function invWin() {
    let w = $('invwin');
    if (!w) {
      w = document.createElement('div'); w.id = 'invwin'; w.className = 'win hidden'; $('hud').appendChild(w);
      w.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (!t) return; Audio8.sfx('click'); act(t.dataset.a, t.dataset.v); });
    }
    return w;
  }
  function migrateEquip() { P.equip = P.equip || {}; if (P.equip.acessorio) { const id = P.equip.acessorio; delete P.equip.acessorio; (ITEMS[id] && ITEMS[id].slot === 'anel' ? (P.equip.anel1 = id) : (P.equip.colar = id)); } }
  function bag() { migrateEquip(); $('statwin').classList.add('hidden'); $('skillwin').classList.add('hidden'); if (dialogOpen) closeDialog(); sel = null; renderInv(); invWin().classList.remove('hidden'); }
  function closeInv() { invWin().classList.add('hidden'); }
  function renderInv() {
    P.equip = P.equip || {};
    const C = CLASSES[P.cls], spr = C.sprite ? (C.sprite.kind === 'dir' ? C.sprite.base + '_down_0' : C.sprite.base + '_down_0') : null;
    const img = spr && window.SPR && SPR[spr] ? `<img class="doll-img" src="data:image/png;base64,${SPR[spr]}">` : '';
    const slots = Object.entries(SLOTS).map(([sl, nm]) => { const id = P.equip[sl]; return `<div class="eslot${id ? ' on r' + (it(id).rar || 0) : ''}${sel === 'eq:' + sl ? ' sel' : ''}" data-a="eq" data-v="${sl}"><span class="ei">${id ? it(id).ic : '·'}</span><span><small>${nm}</small><br>${id ? it(id).name : '<i>vazio</i>'}</span></div>`; }).join('');
    const ids = Object.keys(P.inv).filter(id => P.inv[id] > 0 && ITEMS[id]);
    const cells = ids.map(id => `<div class="icell${sel === id ? ' sel' : ''}${ITEMS[id].kind === 'equip' ? ' eq r' + ITEMS[id].rar : ''}" data-a="sel" data-v="${id}" title="${it(id).name}"><span>${it(id).ic}</span><b>${P.inv[id]}</b></div>`).join('') || '<i class="empty">Vazia. Derrote monstros para juntar materiais.</i>';
    let det = '<small>Toque num item para ver o que dá para fazer.</small>';
    if (sel && sel.startsWith('eq:')) {
      const sl = sel.slice(3), id = P.equip[sl];
      det = id ? `<b style="color:${RARITY[it(id).rar || 0].c}">${it(id).ic} ${it(id).name}</b> <small>${modTxt(it(id).mods)}${it(id).set ? ' · ' + SETS[it(id).set].name : ''}</small><div class="ibtn"><button data-a="unequip" data-v="${sl}">Tirar</button></div>` : `<small>${SLOTS[sl]} vazio. Equipe algo da mochila.</small>`;
    } else if (sel && P.inv[sel] > 0) {
      const I = ITEMS[sel], btns = [];
      if (I.kind === 'equip') btns.push(`<button data-a="equip" data-v="${sel}">Equipar</button>`);
      if (I.use || I.heal) btns.push(`<button data-a="use" data-v="${sel}">Usar</button>`);
      det = `<b style="color:${I.kind === 'equip' ? RARITY[I.rar].c : 'inherit'}">${I.ic} ${I.name}</b> ×${P.inv[sel]} <small>${I.kind === 'equip' ? RARITY[I.rar].n + ' · ' + (I.slot === 'anel' ? 'Anel' : SLOTS[I.slot]) + ' · ' + modTxt(I.mods) + (I.set ? ' · ' + SETS[I.set].name : '') : I.heal ? 'Cura ' + Math.round(I.heal * 100) + '% do HP' : I.use ? 'Poção' : 'Vende por ' + I.sell + 'z no mercador'}</small><div class="ibtn">${btns.join('')}</div>`;
    }
    const mag = CLASSES[P.cls].magic;
    invWin().innerHTML = `<div class="wt">🎒 Mochila <small>· ${P.zeny}z</small><span class="x" data-a="close">×</span></div>
      <div class="invb">
        <div class="doll"><div class="doll-fig">${img}<div class="doll-n">${P.name}<br><small>${typeof tierName === 'function' ? tierName() : className(P.cls, P.gender)} · Nv ${P.lv}</small></div></div><div class="eslots">${slots}</div>
          <div class="dstat">${mag ? 'MATQ ' + stats.matk() : 'ATQ ' + stats.atk()} · DEF ${stats.def()} · HP ${stats.maxHp()}</div>
          ${Object.entries(setCount()).map(([st, n]) => `<div class="dset ${n >= 4 ? 'on' : ''}">${SETS[st].name}: ${n}/4${n >= 4 ? ' ✅ ' + modTxt(SETS[st].bonus) : ''}</div>`).join('')}</div>
        <div class="invr"><div class="igrid">${cells}</div><div class="idet">${det}</div>
          <div class="ibtn foot"><button data-a="trade">🤝 Trocar</button><button data-a="stall">${st.stall ? '🏪 Fechar banca' : '🏪 Abrir banca'}</button></div></div>
      </div>`;
  }
  function act(a, v) {
    if (a === 'close') return closeInv();
    if (a === 'sel') sel = sel === v ? null : v;
    if (a === 'eq') sel = 'eq:' + v;
    if (a === 'equip') { let sl = ITEMS[v].slot; P.equip = P.equip || {}; if (sl === 'anel') sl = !P.equip.anel1 ? 'anel1' : !P.equip.anel2 ? 'anel2' : 'anel1'; if (P.equip[sl]) add(P.equip[sl], 1); add(v, -1); P.equip[sl] = v; Audio8.sfx('buff'); log(`Equipou <b>${it(v).name}</b>.`, 'item'); sel = 'eq:' + sl; }
    if (a === 'unequip') { const id = P.equip[v]; if (id) { add(id, 1); P.equip[v] = null; log(`Tirou <b>${it(id).name}</b>.`, 'sys'); } }
    if (a === 'use') { use(v); if (!P.inv[v]) sel = null; }
    if (a === 'trade') { closeInv(); return tradePick(); }
    if (a === 'stall') { closeInv(); return st.stall ? closeStall() : stallSetup(); }
    P.hp = Math.min(P.hp, stats.maxHp()); P.sp = Math.min(P.sp, stats.maxSp());
    renderInv();
  }
  function use(id) {
    if (ITEMS[id].use === 'pot') return usePotion(id);
    if (!has(id)) return;
    add(id, -1); healP(stats.maxHp() * ITEMS[id].heal); Audio8.sfx('heal');
  }

  // ---------------------------------------------------------------- multiplayer: troca e banca
  let peers = [], tr = null, stallSold = [], stallRej = [], buyReq = [], declined = new Set(), doneTr = new Set(), stallMode = 1;
  const online = () => typeof Net !== 'undefined' && Net.connected && Net.me;
  const soloMsg = () => log('Troca e banca funcionam pelo link do Claude, com os amigos online no mesmo mundo.', 'sys');
  const near = (r, d) => Math.hypot(r.x - P.x, r.z - P.z) < d;
  const keyOf = (a, b) => JSON.stringify([a || {}, b || {}]);
  const offerTxt = g => { const e = Object.entries(g || {}).filter(([k, n]) => n > 0); return e.length ? e.map(([k, n]) => k === 'z' ? `<b>${n}z</b>` : `${it(k).ic} ${it(k).name} ×${n}`).join('<br>') : '<i>nada ainda</i>'; };

  function tradePick() {
    if (!online()) return soloMsg();
    const list = peers.filter(r => r.n && near(r, 10));
    if (!list.length) { dialog('🤝 Trocar', 'Chegue perto de outro jogador (até 10 m) para trocar.'); return; }
    dialog('🤝 Trocar com…', 'Escolha o jogador:', [...list.map(r => ({ label: r.n, fn: () => { tr = { to: r.peer, id: Math.random().toString(36).slice(2, 8), give: {}, ok: false }; tradeWin(); return true; } })), { label: 'Cancelar' }]);
  }
  function partnerOf() { return tr && peers.find(r => r.peer === tr.to); }
  function tradeWin() {
    const pr = partnerOf();
    if (!tr || !pr) { tr = null; dialog('🤝 Troca', 'A troca foi encerrada.'); return; }
    const their = (pr.s.tr && pr.s.tr.to === Net.me && pr.s.tr.id === tr.id) ? pr.s.tr : null;
    const opts = [];
    for (const id of Object.keys(P.inv).filter(id => P.inv[id] > (tr.give[id] || 0) && ITEMS[id])) opts.push({ label: `+1 ${it(id).ic} ${it(id).name}`, fn: () => { tr.give[id] = (tr.give[id] || 0) + 1; tr.ok = false; tradeWin(); return true; } });
    if (P.zeny >= (tr.give.z || 0) + 50) opts.push({ label: '+50z', fn: () => { tr.give.z = (tr.give.z || 0) + 50; tr.ok = false; tradeWin(); return true; } });
    opts.push({ label: 'Limpar minha oferta', fn: () => { tr.give = {}; tr.ok = false; tradeWin(); return true; } });
    opts.push({ label: tr.ok ? '⏳ Esperando o outro confirmar…' : '✅ Confirmar troca', fn: () => { if (their) tr.ok = keyOf(tr.give, their.give); tradeWin(); return true; } });
    opts.push({ label: '✖ Cancelar troca', fn: () => { tr = null; log('Troca cancelada.', 'sys'); } });
    dialog(`🤝 Troca com ${pr.n}`, `<div class="trade"><div><b>Você dá</b><br>${offerTxt(tr.give)}</div><div><b>Você recebe</b><br>${their ? offerTxt(their.give) : '<i>esperando aceitar…</i>'}${their && their.ok ? '<br><em>✅ confirmou</em>' : ''}</div></div>`, opts);
  }
  function checkTrade() {
    // convites recebidos
    for (const r of peers) {
      const t = r.s.tr;
      if (!t || t.to !== Net.me || declined.has(t.id) || doneTr.has(t.id) || (tr && tr.id === t.id) || t.done) continue;
      if (tr) continue;
      declined.add(t.id);
      log(`🤝 <b>${r.n}</b> quer trocar com você.`, 'gold');
      dialog('🤝 Pedido de troca', `<b>${r.n}</b> quer trocar com você.`, [
        { label: 'Aceitar', fn: () => { tr = { to: r.peer, id: t.id, give: {}, ok: false }; tradeWin(); return true; } }, { label: 'Recusar' }]);
    }
    if (!tr) return;
    const pr = partnerOf();
    if (!pr) { if (!tr.done) log('O outro jogador saiu. Troca cancelada.', 'bad'); tr = null; return; }
    const their = pr.s.tr && pr.s.tr.to === Net.me && pr.s.tr.id === tr.id ? pr.s.tr : null;
    if (tr.done) { if (now() > tr.done) tr = null; return; }
    if (!their) return;
    const mine = keyOf(tr.give, their.give), theirs = keyOf(their.give, tr.give);
    if (tr.ok && tr.ok !== mine) tr.ok = false;                       // a oferta mudou: confirma de novo
    if (tr.ok === mine && (their.ok === theirs || their.done)) {
      for (const [k, n] of Object.entries(tr.give)) if (k === 'z' ? P.zeny < n : !has(k, n)) { tr.ok = false; log('Você não tem mais o que ofereceu.', 'bad'); return; }
      for (const [k, n] of Object.entries(tr.give)) k === 'z' ? P.zeny -= n : add(k, -n);
      for (const [k, n] of Object.entries(their.give || {})) k === 'z' ? P.zeny += n : add(k, n);
      doneTr.add(tr.id); tr.done = now() + 6000; Audio8.sfx('level');
      log(`🤝 Troca com <b>${pr.n}</b> concluída!`, 'gold');
      if (dialogOpen && $('dialog').textContent.includes('Troca com')) closeDialog();
    } else if (dialogOpen && $('dialog').textContent.includes('Troca com')) {
      const sig = JSON.stringify(their) + JSON.stringify(tr);
      if (sig !== checkTrade.sig) { checkTrade.sig = sig; tradeWin(); }
    }
  }

  // banca: os itens saem da mochila e ficam expostos; quem passa compra
  function stallSetup(sel = {}) {
    if (!online()) return soloMsg();
    const mult = [0.8, 1, 1.5][stallMode], price = id => Math.max(1, Math.round(it(id).price * mult));
    const opts = Object.keys(P.inv).filter(id => P.inv[id] > (sel[id] || 0) && ITEMS[id]).map(id => ({ label: `+1 ${it(id).ic} ${it(id).name} (${price(id)}z)`, fn: () => { sel[id] = (sel[id] || 0) + 1; stallSetup(sel); return true; } }));
    opts.push({ label: `Preço: ${['barato (80%)', 'normal', 'caro (150%)'][stallMode]} — mudar`, fn: () => { stallMode = (stallMode + 1) % 3; stallSetup(sel); return true; } });
    opts.push({ label: '🏪 Abrir banca', fn: () => {
      const items = Object.entries(sel).filter(([, n]) => n > 0).map(([id, n]) => [id, n, price(id)]);
      if (!items.length) { log('Escolha pelo menos um item.', 'bad'); stallSetup(sel); return true; }
      for (const [id, n] of items) add(id, -n);
      st.stall = { t: `Banca de ${P.name}`, it: items }; P.sit = true; save();
      log('🏪 Banca aberta! Fique parado: se andar, a banca fecha e os itens voltam para a mochila.', 'gold');
    } });
    opts.push({ label: 'Cancelar' });
    dialog('🏪 Montar banca', `<div class="bag">${Object.entries(sel).map(([id, n]) => `<span class="bagi">${it(id).ic} ${it(id).name} ×${n}</span>`).join('') || '<i>Toque nos itens para pôr à venda.</i>'}</div>`, opts);
  }
  function closeStall(msg) {
    if (!st.stall) return;
    for (const [id, n] of st.stall.it) if (n > 0) add(id, n);
    st.stall = null; save(); log(msg || 'Banca fechada. Os itens voltaram para a mochila.', 'sys');
  }
  function viewStall(r) {
    const bk = r.s.bk; if (!bk) return;
    dialog(`🏪 ${bk.t}`, `<small>Seu zeny: <b>${P.zeny}z</b></small>`, [
      ...bk.it.filter(([, n]) => n > 0).map(([id, n, p], i) => ({ label: `${it(id).ic} ${it(id).name} (${n}) — ${p}z`, fn: () => {
        if (P.zeny < p) { log('Zeny insuficiente!', 'bad'); return true; }
        P.zeny -= p; const q = { to: r.peer, id: Math.random().toString(36).slice(2, 9), it: id, p, at: now() };
        st.pend.push(q); buyReq.push(q); buyReq = buyReq.slice(-6); save();
        log(`Pedido de compra enviado a <b>${r.n}</b>…`, 'sys'); return false; } })),
      { label: 'Fechar' }]);
  }
  function checkStalls() {
    // vendedor: atende pedidos
    if (st.stall) {
      if (P.moving) { closeStall(); }
      else for (const r of peers) for (const q of (r.s.by || [])) {
        if (q.to !== Net.me || stallSold.includes(q.id) || stallRej.includes(q.id)) continue;
        const e = st.stall.it.find(([id, n, p]) => id === q.it && n > 0 && p === q.p);
        if (e) { e[1]--; P.zeny += q.p; stallSold.push(q.id); Audio8.sfx('coin'); log(`🏪 <b>${r.n}</b> comprou ${it(q.it).ic} ${it(q.it).name} por ${q.p}z.`, 'gold'); save(); }
        else stallRej.push(q.id);
        stallSold = stallSold.slice(-20); stallRej = stallRej.slice(-20);
      }
    }
    // comprador: recebe ou é reembolsado
    for (const q of [...st.pend]) {
      const r = peers.find(p => p.peer === q.to);
      const ok = r && (r.s.sd || []).includes(q.id), no = !r || (r.s.rj || []).includes(q.id) || now() - q.at > 60000;
      if (ok) { add(q.it, 1); log(`Recebeu ${it(q.it).ic} <b>${it(q.it).name}</b>.`, 'item'); Audio8.sfx('pick'); }
      else if (no) { P.zeny += q.p; log(`Compra de ${it(q.it).name} não concluída: ${q.p}z devolvidos.`, 'sys'); }
      if (ok || no) { st.pend = st.pend.filter(o => o !== q); buyReq = buyReq.filter(o => o.id !== q.id); save(); }
    }
  }

  // ---------------------------------------------------------------- drops no chão: ícone do item, brilho e feixe de luz pela raridade
  const shadowGeo = new THREE.CircleGeometry(0.35, 16), shadowMat = new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.35, depthWrite: false });
  const iconTex = {}, beamGeo = new THREE.CylinderGeometry(0.1, 0.22, 6, 12, 1, true), coreGeo = new THREE.CylinderGeometry(0.04, 0.08, 6, 8, 1, true);
  function itemIcon(ic) {
    if (iconTex[ic]) return iconTex[ic];
    // o próprio item (poção, bota, espada...) desenhado grande, com contorno escuro para ler no chão
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.font = '96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.95)'; g.shadowBlur = 10; g.fillText(ic, 64, 70); g.shadowBlur = 3; g.fillText(ic, 64, 70);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return (iconTex[ic] = t);
  }
  function dropMesh(id) {
    const I = id === 'zeny' ? { ic: '🪙' } : it(id), grp = new THREE.Group();
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: itemIcon(I.ic), transparent: true, depthWrite: false, toneMapped: false }));
    spr.scale.setScalar(id === 'zeny' ? 0.7 : 1.05); spr.position.y = 0.15; grp.add(spr);
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = -0.37; grp.add(sh);   // sombrinha no chão
    const rar = I.kind === 'equip' ? I.rar : -1;
    if (rar >= 0 || id === 'essencia') {          // todo equipamento ganha feixe; a cor e a força dizem a raridade
      const col = rar >= 0 ? RARITY[rar].hex : 0xa050ff, base = [0.3, 0.5, 0.6, 0.7][Math.max(0, rar)];
      const mk = (o, fog) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog });
      const beam = new THREE.Mesh(beamGeo, mk(base, false)); beam.position.y = 2.6; grp.add(beam);
      const core = new THREE.Mesh(coreGeo, mk(Math.min(1, base + 0.3), false)); core.position.y = 2.6; grp.add(core);
      beam.onBeforeRender = () => { const k = 0.7 + 0.3 * Math.sin(time * 4 + grp.id); beam.material.opacity = base * k; core.material.opacity = Math.min(1, base + 0.3) * k; };
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.55, 28), mk(0.7, true)); ring.rotation.x = -Math.PI / 2; ring.position.y = -0.36; grp.add(ring);
    }
    return grp;
  }
  function pickMsg(id, n) {
    const I = it(id);
    if (I.kind === 'equip') {
      log(`${I.rar >= 2 ? '🎉 ' : ''}Você pegou <b style="color:${RARITY[I.rar].c}">[${RARITY[I.rar].n}] ${I.ic} ${I.name}</b>!`, 'item');
      if (I.rar >= 2) { banner(`${RARITY[I.rar].n}: ${I.name}`); Audio8.sfx('level'); }
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- bestiário: onde fica cada monstro e o que ele solta
  const REGION = { pompom: 'Campos Dourados', zunzum: 'Campos Dourados', fungolino: 'Campos Dourados', besouro: 'Areias Rubras', serpe: 'Areias Rubras',
    guardiao: 'Ruínas das Areias (chefe)', larva: 'Torre do Cisma', verme: 'Torre do Cisma', esfera: 'Torre do Cisma', sentinela: 'Torre do Cisma', kravenox: 'Topo da Torre · sábado 20h (chefe mundial)' };
  function bestiary(sel) {
    let w = $('bestwin');
    if (!w) {
      w = document.createElement('div'); w.id = 'bestwin'; w.className = 'win hidden'; $('hud').appendChild(w);
      w.addEventListener('click', e => { const t = e.target.closest('[data-b]'); if (!t) return; Audio8.sfx('click'); if (t.dataset.b === 'x') w.classList.add('hidden'); else bestiary(t.dataset.b); });
    }
    if (dialogOpen) closeDialog(); $('invwin') && $('invwin').classList.add('hidden');
    const types = Object.keys(REGION).filter(t => MOBDEF[t]).sort((a, b) => MOBDEF[a].lv - MOBDEF[b].lv);
    sel = sel || w.dataset.sel || types[0]; w.dataset.sel = sel;
    const seen = P.bestiary || {}, d = MOBDEF[sel];
    const img = t => { const s = typeof SPR_MOBS !== 'undefined' && SPR_MOBS[t] && SPR_MOBS[t].img; return s && SPR[s] ? `<img src="data:image/png;base64,${SPR[s]}">` : (t === 'kravenox' && SPR.k_down_0 ? `<img src="data:image/png;base64,${SPR.k_down_0}">` : '❔'); };
    const list = types.map(t => `<div class="bl${t === sel ? ' on' : ''}" data-b="${t}">${img(t)}<span>${seen[t] ? MOBDEF[t].name : '???'}<small>Nv ${MOBDEF[t].lv}</small></span></div>`).join('');
    const drops = d.drops.map(([id, ch]) => { const I = it(id); const c = I.kind === 'equip' ? RARITY[I.rar].c : '#cfc8b8'; return `<div class="bd"><span>${I.ic}</span><b style="color:${c}">${I.name}</b><em>${ch >= 1 ? '100%' : (ch * 100).toFixed(ch < 0.1 ? 1 : 0) + '%'}</em></div>`; }).join('');
    w.innerHTML = `<div class="wt">📖 Bestiário <small>· ${Object.keys(seen).length}/${types.length} conhecidos</small><button class="x" data-b="x">×</button></div>
      <div class="bb"><div class="blist">${list}</div>
      <div class="bdet">${seen[sel] ? `<div class="bh">${img(sel)}<div><b>${d.name}</b><br><small>Nv ${d.lv} · HP ${d.hp.toLocaleString('pt-BR')} · ${REGION[sel]}</small><br><small>Abatidos: ${seen[sel]}</small></div></div><div class="bdl">${drops}</div>`
        : `<div class="bh">${img(sel)}<div><b>???</b><br><small>Nv ${d.lv} · ${REGION[sel]}</small></div></div><p class="bq">Derrote um para registrar o que ele solta.</p>`}</div></div>`;
    w.classList.remove('hidden');
  }
  function onKill(m) { P.bestiary = P.bestiary || {}; P.bestiary[m.type] = (P.bestiary[m.type] || 0) + 1; }

  // ---------------------------------------------------------------- interface com o jogo
  function nearest() {
    let best = null, bd = 1e9;
    const consider = (d, label, fn) => { if (d < bd) { bd = d; best = { label, fn }; } };
    if (Math.hypot(P.x - F.x, P.z - F.z) < 26) {
      PLOTS.forEach((p, i) => {
        const d = Math.hypot(p.x - P.x, p.z - P.z); if (d > 2.4) return;
        const s = st.plots[i];
        if (!s) consider(d, `Plantar no canteiro ${i + 1}`, () => plantMenu(i));
        else if (cropLeft(s) > 0) consider(d, `${it(s.c).name} crescendo (${fmtT(cropLeft(s))})`, () => log(`${it(s.c).ic} ${it(s.c).name}: falta ${fmtT(cropLeft(s))}.`, 'sys'));
        else consider(d, `Colher ${it(s.c).name}`, () => harvest(i));
      });
      for (const o of live) {
        const d = Math.hypot(o.x - P.x, o.z - P.z); if (d > 2.6) continue;
        if (!o.a.fed) consider(d, `Alimentar ${o.A.name}`, () => feed(o));
        else if (prodLeft(o.a) <= 0) consider(d, `Recolher ${it(o.A.prod).name}`, () => collect(o));
        else consider(d, `${o.A.name} produzindo (${fmtT(prodLeft(o.a))})`, () => log(`${o.A.name}: ${it(o.A.prod).ic} em ${fmtT(prodLeft(o.a))}.`, 'sys'));
      }
    }
    for (const r of peers) if (r.s.bk && near(r, 3)) consider(Math.hypot(r.x - P.x, r.z - P.z), `Ver ${r.s.bk.t}`, () => viewStall(r));
    return best;
  }
  let tAcc = 0;
  function update(dt) {
    tAcc += dt;
    const nearFarm = Math.hypot(P.x - F.x, P.z - F.z) < 70;
    for (const p of PLOTS) p.g.visible = nearFarm;
    if (nearFarm && tAcc > 0.25) {
      tAcc = 0;
      PLOTS.forEach((p, i) => {
        const s = st.plots[i];
        if (!s) { p.stalks.forEach(m => m.visible = false); return; }
        const C = CROPS[s.c], k = 1 - cropLeft(s) / (C.min * MIN), ready = k >= 1;
        p.stalks.forEach((m, j) => {
          m.visible = true; m.scale.setScalar(0.25 + Math.min(1, k) * 0.85);
          m.material.color.setHex(ready && s.c === 'trigo' ? 0xd8b040 : 0x4caf50);
          m.top.visible = ready; m.top.material.color.setHex(C.color);
        });
      });
    }
    for (const o of live) {
      o.g.visible = nearFarm; if (!nearFarm) continue;
      o.t -= dt;
      if (o.t <= 0) { o.t = rand(2, 6); o.tx = rand(PEN.x0 + 1.2, PEN.x1 - 1.2); o.tz = rand(PEN.z0 + 1.2, PEN.z1 - 1.2); }
      const dx = o.tx - o.x, dz = o.tz - o.z, d = Math.hypot(dx, dz), moving = d > 0.2;
      if (moving) { const sp = 0.9 * dt; o.x += dx / d * Math.min(sp, d); o.z += dz / d * Math.min(sp, d); o.face = Math.atan2(dx, dz); }
      o.g.position.set(o.x, groundY(o.x, o.z), o.z);
      o.act.update(dt, { face: o.face, moving });
      const want = !o.a.fed ? '🍽️' : prodLeft(o.a) <= 0 ? it(o.A.prod).ic : '';
      if (want !== o.markT) { if (o.mark) o.g.remove(o.mark); o.mark = want ? icon(want) : null; if (o.mark) { o.mark.position.y = o.A.h + 0.5; o.g.add(o.mark); } o.markT = want; }
      if (o.mark) o.mark.position.y = o.A.h + 0.5 + Math.sin(time * 3) * 0.08;
    }
  }
  function onPeers(list) { peers = list; if (online()) { checkTrade(); checkStalls(); } }
  function pres() {
    const o = {};
    if (tr) o.tr = { to: tr.to, id: tr.id, give: tr.give, ok: tr.ok || false, done: !!tr.done };
    if (st.stall) o.bk = st.stall;
    if (buyReq.length) o.by = buyReq;
    if (stallSold.length) o.sd = stallSold;
    if (stallRej.length) o.rj = stallRej;
    return o;
  }
  let inited = false;
  function init() {
    if (inited) return; inited = true;
    drawAnimals();
    for (const a of st.animals) spawnAnimal(a);
    // banca e compras pendentes de uma sessão anterior voltam para a mochila
    if (st.stall) closeStall('Sua banca anterior foi fechada; os itens voltaram para a mochila.');
    for (const q of st.pend) P.zeny += q.p; st.pend = [];
    // botão da mochila no menu
    if (!$('btn-bag')) { const b = document.createElement('button'); b.id = 'btn-bag'; b.title = 'Mochila (B)'; b.textContent = '🎒'; b.onclick = bag; $('menu').insertBefore(b, $('btn-chat')); }
    if (!$('btn-best')) { const b = document.createElement('button'); b.id = 'btn-best'; b.title = 'Bestiário (L)'; b.textContent = '📖'; b.onclick = () => bestiary(); $('menu').insertBefore(b, $('btn-chat')); }
    migrateEquip();
    addEventListener('keydown', e => { if (e.key.toLowerCase() === 'b' && running && !dialogOpen && document.activeElement.tagName !== 'INPUT') bag(); });
    save();
  }
  return { useSlot, init, update, nearest, onPeers, pres, sellAll, bag, talkFarm, gear, gearShop, dropMesh, pickMsg, bestiary, onKill, migrateEquip, SLOTS, RARITY, get stall() { return st.stall; } };
})();
