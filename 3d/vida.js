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
    cinza: ['Cinza de Valdora', '🌫️', 55, 0, 'mat'], fibra: ['Fibra de Raiz Negra', '🪢', 50, 0, 'mat'],
    s_trigo: ['Semente de Trigo', '🌱', 2, 6, 'semente'], s_cenoura: ['Semente de Cenoura', '🌱', 4, 12, 'semente'],
    s_flor: ['Semente de Flor-da-Fonte', '🌱', 10, 30, 'semente'], racao: ['Ração', '🌾', 1, 4, 'racao'],
    trigo: ['Trigo', '🌾', 9, 0, 'colheita'], cenoura: ['Cenoura', '🥕', 15, 0, 'colheita'], flor: ['Flor-da-Fonte', '🌸', 40, 0, 'colheita'],
    ovo: ['Ovo', '🥚', 8, 0, 'colheita'], la: ['Lã', '🧶', 20, 0, 'colheita'], leite: ['Leite', '🥛', 14, 0, 'colheita'],
    pao: ['Pão de Trigo', '🍞', 10, 0, 'comida', { heal: 0.3 }],
    asa_mosca: ['Asa de Mosca', '🪰', 60, 300, 'tp', { use: 'tp' }],
    asa_borboleta: ['Asa de Borboleta', '🦋', 200, 900, 'tp', { use: 'tp' }],
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
    // Valdora (Nv 24–36): o conjunto da guarda da cidade caída e a espada da estátua
    elmo_valdora: ['Elmo da Guarda de Valdora', '⛑️', 'capacete', 0, { def: 12, hp: 110 }, 2, 'valdora'],
    couraca_valdora: ['Couraça da Guarda de Valdora', '🛡️', 'armadura', 0, { def: 24, hp: 220 }, 2, 'valdora'],
    luvas_valdora: ['Manoplas de Valdora', '🧤', 'luvas', 0, { def: 6, pow: 12 }, 2, 'valdora'],
    botas_valdora: ['Botas de Valdora', '🥾', 'botas', 0, { def: 6, spd: 0.1, hp: 70 }, 2, 'valdora'],
    arma_valdora: ['Espada de Valdora', '⚔️', 'arma', 0, { pow: 34, crit: 0.04 }, 2],
    // Míticos: só o próprio Kravenox, no topo dos 30 andares, deixa cair (um garantido por vitória)
    arma_soberano: ['Espinho do Soberano', '🗡️', 'arma', 0, { pow: 90, crit: 0.12 }, 4, 'soberano'],
    coroa_soberano: ['Coroa do Soberano', '👑', 'capacete', 0, { def: 26, hp: 350, pow: 22 }, 4, 'soberano'],
    manto_soberano: ['Manto do Soberano Adormecido', '🦇', 'armadura', 0, { def: 50, hp: 650 }, 4, 'soberano'],
    olho_kravenox: ['Olho de Kravenox', '🔴', 'colar', 0, { pow: 28, crit: 0.1, hp: 260, sp: 90 }, 4, 'soberano'],
  };
  const RARITY = [{ n: 'Comum', c: '#e8e4dc', hex: 0xe8e4dc }, { n: 'Raro', c: '#6ab0ff', hex: 0x4a90ff }, { n: 'Épico', c: '#c27aff', hex: 0xa050ff }, { n: 'Lendário', c: '#ffb640', hex: 0xffa020 }, { n: 'Mítico', c: '#ff4a4a', hex: 0xff2020 }];
  const SETS = {
    couro: { name: 'Conjunto de Couro', bonus: { hp: 60, def: 3 } },
    areias: { name: 'Conjunto das Areias', bonus: { crit: 0.05, spd: 0.05, hp: 80 } },
    sentinela: { name: 'Conjunto da Sentinela', bonus: { def: 20, pow: 10, hp: 150 } },
    cisma: { name: 'Conjunto do Cisma', bonus: { pow: 25, def: 25, hp: 300, crit: 0.08 } },
    valdora: { name: 'Conjunto da Guarda de Valdora', bonus: { pow: 18, def: 22, hp: 220 } },
    soberano: { name: 'Conjunto do Soberano', bonus: { pow: 60, def: 50, hp: 800, crit: 0.12, spd: 0.1 } },
  };
  for (const [id, [name, ic, slot, price, mods, rar, set]] of Object.entries(GEAR)) ITEMS[id] = { name, ic, kind: 'equip', slot, mods, rar, set, price: price || 0, sell: Math.round((price || [60, 220, 700, 2000, 15000][rar]) / 2) };
  const SLOTS = { arma: 'Arma', capacete: 'Capacete', armadura: 'Armadura', luvas: 'Luvas', botas: 'Botas', anel1: 'Anel', anel2: 'Anel', colar: 'Colar' };
  const MODN = { pow: 'Dano', def: 'Defesa', hp: 'HP', sp: 'SP', crit: 'Crítico', spd: 'Velocidade' };
  const modTxt = m => Object.entries(m || {}).map(([k, v]) => `${MODN[k]} +${['crit', 'spd'].includes(k) ? Math.round(v * 100) + '%' : v}`).join(' · ');
  for (const [id, [name, ic, sell, price, kind, extra]] of Object.entries(NEW)) ITEMS[id] = { name, ic, sell, price: price || sell * 2, kind, ...(extra || {}) };
  const it = id => ITEMS[id] || { name: id, ic: '❔', sell: 0, price: 0 };
  const has = (id, n = 1) => (P.inv[id] || 0) >= n;
  const add = (id, n) => { P.inv[id] = Math.max(0, (P.inv[id] || 0) + n); if (id === 'red' || id === 'blue') buildHotbar(); };

  // materiais que cada monstro solta
  const MOB_MAT = { pompom: 'gosma', zunzum: 'po_eco', fungolino: 'raiz', besouro: 'cristal', serpe: 'fio', guardiao: 'lasca', larva: 'gosma', verme: 'lasca', esfera: 'cristal', sentinela: 'lasca', kravenox: 'essencia', raizNegra: 'fibra', ecoCinza: 'cinza', larvaCinza: 'cinza', sentinelaMuralha: 'lasca', carrasco: 'essencia' };
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
    raizNegra: [['botas_valdora', 0.012], ['luvas_valdora', 0.01]],
    ecoCinza: [['elmo_valdora', 0.012], ['colar_sombra', 0.02]],
    larvaCinza: [['luvas_valdora', 0.012], ['couraca_valdora', 0.008]],
    sentinelaMuralha: [['couraca_valdora', 0.015], ['elmo_valdora', 0.015], ['arma_essencia', 0.02], ['essencia', 0.04]],
    carrasco: [['arma_valdora', 0.35], ['couraca_valdora', 0.25], ['elmo_valdora', 0.25], ['arm_negra', 0.2], ['anel_vazio', 0.15]],
    kravenox: [['marca', 0.5], ['arma_cisma', 0.3], ['coroa_espinhos', 0.25], ['manto_cisma', 0.2], ['garras_cisma', 0.2], ['passos_cisma', 0.2], ['anel_kravenox', 0.15]],
  };
  for (const [t, l] of Object.entries(GEAR_DROP)) if (MOBDEF[t]) MOBDEF[t].drops.push(...l);
  // ---------------- cartas de monstro (Ragnarok): caem muito raramente; encaixe num espaço de equipamento
  const CARD_MOD = {
    pompom: { hp: 40 }, zunzum: { sp: 25 }, fungolino: { def: 3 }, besouro: { crit: 0.03 }, serpe: { spd: 0.05 },
    larva: { hp: 80, def: 2 }, verme: { def: 6 }, esfera: { sp: 50, pow: 3 }, sentinela: { pow: 8 }, guardiao: { pow: 12, def: 6 },
    kravenox: { pow: 20, crit: 0.05, hp: 200 },
    raizNegra: { def: 8, hp: 60 }, ecoCinza: { crit: 0.04, sp: 30 }, larvaCinza: { hp: 160 }, sentinelaMuralha: { pow: 10, def: 4 }, carrasco: { pow: 16, crit: 0.04 },
  };
  // cada carta só encaixa num tipo de peça (como no Ragnarok)
  const CARD_SLOT = { pompom: 'armadura', zunzum: 'capacete', fungolino: 'luvas', besouro: 'arma', serpe: 'botas', larva: 'armadura', verme: 'capacete', esfera: 'colar', sentinela: 'arma', guardiao: 'luvas', kravenox: 'anel', raizNegra: 'botas', ecoCinza: 'capacete', larvaCinza: 'armadura', sentinelaMuralha: 'arma', carrasco: 'luvas' };
  for (const [t, mods] of Object.entries(CARD_MOD)) {
    if (!MOBDEF[t]) continue;
    const id = 'carta_' + t, D = MOBDEF[t];
    ITEMS[id] = { name: 'Carta ' + (D.name.startsWith('Kravenox') ? 'de ' : 'da ') + D.name, ic: '🃏', kind: 'carta', mods, mob: t, cslot: CARD_SLOT[t], sell: D.boss ? 900 : 300, price: 0 };
    D.drops.push([id, t === 'kravenox' ? 0.2 : D.boss || t === 'guardiao' ? 0.04 : 0.004]);
  }
  // refino (+1 a +7): cada nível soma 10% do dano/defesa/HP da peça; falhar só volta um nível, nunca quebra
  const REF = [[100, 1], [200, 1], [400, 1], [800, 1], [1500, 0.6], [2500, 0.4], [4000, 0.25]];
  const refOf = id => (P.refine && P.refine[id]) || 0;
  const nameOf = id => (refOf(id) ? '+' + refOf(id) + ' ' : '') + it(id).name;

  // ---------------------------------------------------------------- Sítio
  const CROPS = {
    trigo: { seed: 's_trigo', min: 3, n: [2, 3], color: 0xe8c050 },
    cenoura: { seed: 's_cenoura', min: 6, n: [2, 3], color: 0xff8a30 },
    flor: { seed: 's_flor', min: 15, n: [1, 2], color: 0xff7ec8 },
  };
  const ANIMALS = {
    galinha: { name: 'Galinha', price: 60, prod: 'ovo', min: 4, n: [1, 2], h: 0.78 },
    ovelha: { name: 'Ovelha', price: 220, prod: 'la', min: 8, n: [1, 2], h: 1.3 },
    vaca: { name: 'Vaca', price: 420, prod: 'leite', min: 10, n: [2, 3], h: 1.85 },
  };
  const MAX_ANIMALS = 8;
  let st = { plots: Array(8).fill(null), animals: [], stall: null, pend: [] };
  function useSlot(n) {      // cada vaga de personagem tem o próprio Sítio
    SAVE = 'reino-vida-v1-' + n;
    st = { plots: Array(8).fill(null), animals: [], stall: null, pend: [] };
    try { const s = JSON.parse(localStorage.getItem(SAVE)); if (s) st = { ...st, ...s }; } catch (e) { }
    loaded = true;
  }
  let loaded = false;   // só salva depois de escolher a vaga (antes disso apagaria o Sítio da vaga 1)
  const save = () => { if (!loaded) return; try { localStorage.setItem(SAVE, JSON.stringify(st)); } catch (e) { } };
  setInterval(save, 8000); addEventListener('beforeunload', save);

  const F = FARM;
  const PLOTS = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) PLOTS.push({ x: F.x - 8 + c * 4.4, z: F.z - 11 + r * 4.4 });
  const PEN = { x0: F.x - 12, x1: F.x + 2, z0: F.z + 4, z1: F.z + 13 };

  // construção do Sítio: canteiros de terra com borda de tábuas e plantas em cartões desenhados
  const woodM = PM('madeira.jpg', [1, 0.2], new THREE.Color(1.25, 1.1, 0.95));
  const soilM = PM('terra.jpg', [1, 1], new THREE.Color(1.75, 1.55, 1.4)), wetM = PM('terra.jpg', [1, 1], new THREE.Color(1.05, 0.9, 0.8));
  // textura de cada planta em cada fase (0 broto, 1 crescendo, 2 madura)
  function cropTex(crop, stage) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    let sd = 11 + stage * 7 + crop.length * 13; const rn = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const leaf = (x, y, len, ang, w, col) => { g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(w, -len * 0.5, 0, -len); g.quadraticCurveTo(-w, -len * 0.5, 0, 0); g.fill(); g.restore(); };
    const greens = ['#4f7a2a', '#5e8a32', '#6b9a3a', '#3f6a22'];
    const H = stage === 0 ? 34 : stage === 1 ? 70 : 100;
    if (crop === 'trigo' && stage === 2) {
      for (let k = 0; k < 14; k++) {
        const x0 = 14 + rn() * 100, top = 128 - H + rn() * 20, lean = (rn() - 0.5) * 16, hue = 40 + rn() * 8;
        g.strokeStyle = `hsl(${hue},45%,42%)`; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, 128); g.quadraticCurveTo(x0, 80, x0 + lean, top + 26); g.stroke();
        for (let j = 0; j < 7; j++) { g.fillStyle = `hsl(${hue},${62 + rn() * 12}%,${54 + rn() * 10}%)`; g.beginPath(); g.ellipse(x0 + lean + (j % 2 ? 2.5 : -2.5), top + 26 - j * 4.5, 2.2, 4.2, j % 2 ? 0.5 : -0.5, 0, 6.3); g.fill(); }
      }
    } else {
      const n = stage === 0 ? 5 : 9;
      for (let k = 0; k < n; k++) leaf(64 + (rn() - 0.5) * (stage ? 80 : 40), 128, H * (0.6 + rn() * 0.4), (rn() - 0.5) * 1.1, crop === 'cenoura' ? 4 : 7, greens[k % 4]);
      if (crop === 'cenoura' && stage >= 1) {                     // folhagem rendada da cenoura
        g.strokeStyle = '#5f9a34'; g.lineWidth = 1.2;
        for (let k = 0; k < 18; k++) { const x0 = 40 + rn() * 48, a = (rn() - 0.5) * 1.4, l = H * (0.5 + rn() * 0.5); g.beginPath(); g.moveTo(x0, 124); g.lineTo(x0 + Math.sin(a) * l, 124 - Math.cos(a) * l); g.stroke(); }
        if (stage === 2) for (let k = 0; k < 4; k++) { const x0 = 34 + k * 20 + rn() * 6; g.fillStyle = '#e07a24'; g.beginPath(); g.moveTo(x0 - 7, 116); g.lineTo(x0 + 7, 116); g.lineTo(x0, 128); g.fill(); g.fillStyle = '#f39a3c'; g.fillRect(x0 - 6, 115, 12, 3); }
      }
      if (crop === 'flor' && stage === 2) for (let k = 0; k < 6; k++) {   // flores rosadas abertas
        const x = 24 + rn() * 80, y = 128 - H + 10 + rn() * 36;
        g.strokeStyle = '#4f7a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rn() - 0.5) * 10, 128); g.stroke();
        for (let pt = 0; pt < 5; pt++) { const a = pt / 5 * 6.28; g.fillStyle = pt % 2 ? '#f08ac8' : '#e46fb6'; g.beginPath(); g.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 5, 3.2, a, 0, 6.3); g.fill(); }
        g.fillStyle = '#ffe070'; g.beginPath(); g.arc(x, y, 2.6, 0, 6.3); g.fill();
      }
      if (crop === 'trigo' && stage === 1) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(190,170,60,.25)'; g.fillRect(0, 0, 128, 128); }
    }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  const cropMats = {};
  const cropMat = (crop, stage) => {
    const k = crop + stage; if (cropMats[k]) return cropMats[k];
    const m = new THREE.MeshLambertMaterial({ map: cropTex(crop, stage), alphaTest: 0.4, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0; vec3 normal = normalize( vNormal ); vec3 geometryNormal = normal;');
      sh.uniforms.uTime = windU;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position; float h = max(position.y, 0.0); vec4 wp = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0); transformed.x += sin(uTime * 2.0 + wp.x * 0.7 + wp.z * 0.5) * 0.12 * h * h;');
    };
    return (cropMats[k] = m);
  };
  const cropGeo = cardGeo([[0, 0.5, 0, 0, 0, 1.1, 1, -0.55, true], [0, 0.5, 0, Math.PI / 2, 0, 1.1, 1, -0.55, true]]);
  const board = new THREE.BoxGeometry(3.7, 0.3, 0.16), ridge = new THREE.BoxGeometry(3.1, 0.12, 0.42);
  for (const p of PLOTS) {
    const y = groundY(p.x, p.z);
    p.soil = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 3.4), soilM); p.soil.position.set(p.x, y + 0.05, p.z); p.soil.receiveShadow = true; scene.add(p.soil);
    p.ridges = [-1, 0, 1].map(k => { const r = new THREE.Mesh(ridge, soilM); r.position.set(p.x, y + 0.18, p.z + k * 1.05); r.receiveShadow = true; scene.add(r); return r; });   // sulcos
    for (const [dx, dz, ry] of [[0, -1.78, 0], [0, 1.78, 0], [-1.78, 0, Math.PI / 2], [1.78, 0, Math.PI / 2]]) { const b = new THREE.Mesh(board, woodM); b.position.set(p.x + dx, y + 0.12, p.z + dz); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; scene.add(b); }
    p.g = new THREE.Group(); p.g.position.set(p.x, y + 0.2, p.z); scene.add(p.g);
    p.stalks = [];
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(cropGeo, cropMat('trigo', 0));
      m.position.set((i % 3 - 1) * 1.0 + Math.sin(i * 7.1) * 0.12, 0, (Math.floor(i / 3) - 1) * 1.05); m.rotation.y = i * 1.3; p.g.add(m); p.stalks.push(m);
    }
    p.mark = null; p.markT = '';
  }
  // cerca do curral (visual) e celeiro
  const post = new THREE.BoxGeometry(0.2, 1.1, 0.2), rail = new THREE.BoxGeometry(1, 0.14, 0.07);
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
  // fardos de feno, bebedouro, espantalho e caminho de terra
  {
    const hay = PM('palha.jpg', [2, 1], new THREE.Color(1.7, 1.5, 1.1)), hayEnd = PM('palha.jpg', [1, 1], new THREE.Color(1.5, 1.3, 0.95));
    const bale = (x, z, ry) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.3, 16), [hay, hayEnd, hayEnd]); m.rotation.z = Math.PI / 2; m.rotation.y = ry; m.position.set(x, groundY(x, z) + 0.72, z); m.castShadow = m.receiveShadow = true; scene.add(m); addOb(x, z, 0.9); };
    bale(F.x - 13.5, F.z + 1.8, 0.2); bale(F.x - 11.8, F.z + 2.2, -0.3); bale(F.x + 4.5, F.z + 15.2, 1.4);
    const tx = F.x - 5, tz = F.z + 12.2, ty = groundY(tx, tz);                                   // bebedouro no curral
    const tr = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 0.8), woodM); tr.position.set(tx, ty + 0.3, tz); tr.castShadow = true; scene.add(tr);
    const wt = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, 0.62), new THREE.MeshPhongMaterial({ color: 0x3a5a66, shininess: 60, specular: 0x406070 })); wt.position.set(tx, ty + 0.53, tz); scene.add(wt);
    const sx = F.x - 3, sz = F.z - 6.6, sy = groundY(sx, sz), sg = new THREE.Group(); sg.position.set(sx, sy, sz); sg.rotation.y = 0.4; scene.add(sg);   // espantalho
    const stick = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodM); m.position.set(x, y, z); m.castShadow = true; sg.add(m); };
    stick(0.12, 2.4, 0.12, 0, 1.2, 0); stick(1.8, 0.1, 0.1, 0, 1.75, 0);
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.8, 0.32), new THREE.MeshLambertMaterial({ color: 0x6a4a3a })); shirt.position.y = 1.55; shirt.castShadow = true; sg.add(shirt);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), hay); head.position.y = 2.25; sg.add(head);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.42, 12), hay); hat.position.y = 2.6; sg.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 14), hay); brim.position.y = 2.42; sg.add(brim);
    addOb(sx, sz, 0.4);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 26), PM('terra.jpg', [1, 8], new THREE.Color(1.9, 1.7, 1.5))); path.rotation.x = -Math.PI / 2; path.position.set(F.x + 4.2, groundY(F.x + 4.2, F.z) + 0.04, F.z - 1); path.receiveShadow = true; scene.add(path);
  }
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
  // pixel art dos animais: formas simples rasterizadas, com sombreado em faixas (luz de cima/esquerda) e contorno escuro
  function art(w, h, shapes, outline = '#1c1610') {
    const cell = new Array(w * h).fill(null);
    const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    for (const S of shapes) {
      const col = hex(S.c);
      let x0, y0, x1, y1, inside;
      if (S.e) { const [cx, cy, rx, ry] = S.e; x0 = cx - rx; x1 = cx + rx; y0 = cy - ry; y1 = cy + ry; inside = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1; }
      else if (S.r) { const [rx, ry, rw, rh] = S.r; x0 = rx; y0 = ry; x1 = rx + rw; y1 = ry + rh; inside = (x, y) => x >= rx && x < rx + rw && y >= ry && y < ry + rh; }
      else { const P = S.p; x0 = Math.min(...P.map(q => q[0])); x1 = Math.max(...P.map(q => q[0])); y0 = Math.min(...P.map(q => q[1])); y1 = Math.max(...P.map(q => q[1]));
        inside = (x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; }; }
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(h - 1, Math.ceil(y1)); y++) for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(w - 1, Math.ceil(x1)); x++) {
        if (!inside(x + 0.5, y + 0.5)) continue;
        const i = y * w + x; if (S.clip && !cell[i]) continue;
        let k = 1;
        if (S.flat !== true) {                                  // faixas de luz: claro no alto/esquerda, escuro embaixo/direita
          const ny = (y + 0.5 - y0) / Math.max(1, y1 - y0), nx = (x + 0.5 - x0) / Math.max(1, x1 - x0), v = ny * 0.75 + nx * 0.25;
          k = v < 0.28 ? 1.14 : v < 0.62 ? 1.0 : v < 0.86 ? 0.84 : 0.72;
          if (S.dith && ((x + y) % 2 === 0) && v > 0.5) k *= 0.93;
        }
        cell[i] = col.map(c => Math.max(0, Math.min(255, Math.round(c * k))));
      }
    }
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h), o = hex(outline);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; let v = cell[i];
      if (!v) { const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && cell[yy * w + xx]; if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) v = o; else continue; }
      im.data.set([v[0], v[1], v[2], 255], i * 4);
    }
    g.putImageData(im, 0, 0); return c;
  }
  function drawAnimals() {
    // vaca malhada, de lado (olhando para a direita)
    SpriteKit.addCanvas('a_vaca', art(64, 46, [
      { r: [15, 30, 4, 12], c: '#a8a296' }, { r: [41, 30, 4, 12], c: '#a8a296' },                     // pernas do outro lado
      { r: [15, 41, 4, 2], c: '#2e241c', flat: true }, { r: [41, 41, 4, 2], c: '#2e241c', flat: true },
      { r: [8, 16, 2, 16], c: '#3a302a', flat: true }, { e: [8.5, 33, 2.2, 2.6], c: '#2a221c' },        // rabo
      { e: [28, 24, 20, 11], c: '#f2eee4', dith: true },                                                 // corpo
      { e: [21, 19, 7, 6], c: '#2c2622', clip: true }, { e: [35, 28, 6, 5], c: '#2c2622', clip: true }, { e: [13, 27, 4, 4], c: '#2c2622', clip: true }, { e: [33, 15, 4, 3], c: '#2c2622', clip: true },
      { e: [35, 34, 5, 3], c: '#eea2aa' },                                                               // úbere
      { r: [11, 30, 5, 13], c: '#ece6da' }, { r: [37, 30, 5, 13], c: '#ece6da' },                      // pernas da frente
      { r: [11, 41, 5, 3], c: '#2e241c', flat: true }, { r: [37, 41, 5, 3], c: '#2e241c', flat: true },
      { p: [[42, 14], [50, 10], [52, 22], [44, 26]], c: '#f2eee4' },                                    // pescoço
      { e: [53, 16, 7, 6.5], c: '#f2eee4' }, { e: [52, 13, 3.5, 3], c: '#2c2622', clip: true },        // cabeça
      { e: [58, 21, 4.5, 3.8], c: '#f0b2b2' }, { r: [60, 20, 1, 1], c: '#5a2a2a', flat: true },       // focinho
      { r: [54, 14, 2, 2], c: '#141010', flat: true }, { r: [54, 14, 1, 1], c: '#ffffff', flat: true }, // olho
      { e: [46, 11, 4, 2], c: '#e2dccf' }, { p: [[50, 9], [51, 4], [53, 9]], c: '#e8dcc0' }, { p: [[55, 9], [57, 4], [58, 9]], c: '#e8dcc0' },
    ]));
    // ovelha de lã fofa (cada tufo é sombreado à parte) e cara escura
    const wool = [];
    for (const [x, y, r] of [[12, 20, 6], [18, 15, 6.5], [26, 13, 6.5], [34, 14, 6.5], [40, 18, 6], [10, 27, 6], [17, 28, 6.5], [25, 29, 6.5], [33, 28, 6.5], [40, 25, 6], [21, 21, 7], [30, 21, 7]]) wool.push({ e: [x, y, r, r * 0.92], c: '#efe9dc', dith: true });
    SpriteKit.addCanvas('a_ovelha', art(56, 42, [
      { r: [14, 30, 3, 10], c: '#1e1a18' }, { r: [33, 30, 3, 10], c: '#1e1a18' },
      ...wool,
      { r: [11, 31, 4, 10], c: '#2e2824' }, { r: [30, 31, 4, 10], c: '#2e2824' },
      { e: [47, 20, 6, 5.5], c: '#2e2824' }, { e: [51, 23, 3.2, 2.6], c: '#3e3632' },                 // cabeça e focinho
      { e: [42, 16, 4, 2], c: '#2a2420' }, { e: [44, 13, 4.5, 3.5], c: '#f2ede2' },                   // orelha e topete
      { r: [48, 18, 2, 2], c: '#e8dcc0', flat: true }, { r: [49, 18, 1, 1], c: '#141010', flat: true },
    ]));
    // galinha
    SpriteKit.addCanvas('a_galinha', art(32, 30, [
      { r: [12, 21, 1, 6], c: '#d89a20', flat: true }, { r: [17, 21, 1, 6], c: '#e8a828', flat: true }, { r: [10, 27, 4, 1], c: '#d89a20', flat: true }, { r: [16, 27, 4, 1], c: '#e8a828', flat: true },
      { e: [6, 9, 3.5, 6], c: '#ece6da' }, { e: [9, 8, 3, 6], c: '#f4f0e6' },                          // rabo
      { e: [14, 16, 9.5, 7], c: '#f6f2ea', dith: true },                                               // corpo
      { e: [13, 16, 5.5, 3.6], c: '#e2dacb' },                                                         // asa
      { e: [22, 8, 4.5, 4.5], c: '#f6f2ea' },                                                          // cabeça
      { e: [21, 3, 1.8, 1.8], c: '#d63a2c' }, { e: [23.5, 2.8, 1.8, 2], c: '#d63a2c' }, { e: [25, 12, 1.3, 2], c: '#d63a2c' },
      { p: [[26, 7], [30, 8.5], [26, 10]], c: '#f0b020' }, { r: [23, 7, 1, 1], c: '#141010', flat: true },
    ]));
  }
  function iconSprite(txt) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 32, 34);
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
  function water(i) {
    const p = st.plots[i]; if (!p || p.w || cropLeft(p) <= 0) return;
    p.t -= cropLeft(p) * 0.35; p.w = 1; save();
    Audio8.sfx('pick'); burst(new THREE.Vector3(PLOTS[i].x, groundY(PLOTS[i].x, PLOTS[i].z) + 0.6, PLOTS[i].z), 0x6ab0ff, 16, 2, 0.6);
    log(`💧 Regou o canteiro. ${it(p.c).name} cresce mais rápido: falta ${fmtT(cropLeft(p))}.`, 'item');
  }
  function harvest(i) {
    const p = st.plots[i]; if (!p || cropLeft(p) > 0) return;
    const C = CROPS[p.c], n = irand(C.n[0], C.n[1]); add(p.c, n); st.plots[i] = null; save();
    Audio8.sfx('coin'); floater(PLOTS[i].x, groundY(PLOTS[i].x, PLOTS[i].z) + 1.5, PLOTS[i].z, `+${n} ${it(p.c).ic}`, 'zeny');
    log(`Colheu ${n}× <b>${it(p.c).name}</b>.`, 'item');
    if (Math.random() < 0.3) { add(C.seed, 1); log(`🌱 Sobrou uma <b>${it(C.seed).name}</b>.`, 'item'); }
    gainXp(4 + C.min);
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
    const c = Math.round(price * n * (1 - gBon('desc'))); if (P.zeny < c) { log('Coroas insuficientes!', 'bad'); Audio8.sfx('miss'); return false; }   // guilda nível 2+: 5% de desconto
    P.zeny -= c; add(id, n); Audio8.sfx('coin'); return true;
  }
  // encomenda do dia: a Fazendeira pede uma produção do Sítio e paga bem
  const ORDERS = [['trigo', 6], ['cenoura', 4], ['ovo', 4], ['leite', 3], ['la', 2], ['pao', 2], ['flor', 2]];
  function order() {
    const d = new Date().toDateString();
    if (!st.order || st.order.d !== d) { let h = 0; for (const ch of d) h = (h * 31 + ch.charCodeAt(0)) % 9973; const [id, n] = ORDERS[h % ORDERS.length]; st.order = { d, id, n, done: false }; }
    const o = st.order, pay = Math.round(it(o.id).sell * o.n * 2.5 + 40);
    return { ...o, pay, xp: 25 + o.n * 6 };
  }
  function talkFarm(eu) {
    const menu = () => dialog('Fazendeira Dália', `Olá, <b>${eu}</b>! Este é o Sítio de Solmira. Os canteiros e o curral são seus: plante, crie e venda o que quiser.<br><small>Coroas: <b>${P.zeny} cr</b> · Animais: ${st.animals.length}/${MAX_ANIMALS}</small>`, [
      { label: '🌱 Sementes e ração', fn: () => { seeds(); return true; } },
      { label: '🐔 Comprar animais', fn: () => { animals(); return true; } },
      { label: '🍳 Fazer receitas', fn: () => { recipes(); return true; } },
      { label: (o => o.done ? '📦 Encomenda do dia (entregue ✅)' : `📦 Encomenda do dia: ${o.n} ${it(o.id).ic} ${it(o.id).name}`)(order()), fn: () => { orderMenu(); return true; } },
      { label: '💰 Vender colheita', fn: () => { sellAll(['colheita']); menu(); return true; } },
      { label: 'Tchau' }]);
    const seeds = () => dialog('Sementes e ração', `<small>Coroas: <b>${P.zeny} cr</b></small>`, [
      ...['s_trigo', 's_cenoura', 's_flor'].map(id => ({ label: `${it(id).name} ×5 — ${it(id).price * 5} cr (tem ${P.inv[id] || 0})`, fn: () => { buyIt(id, 5, it(id).price); seeds(); return true; } })),
      { label: `🌾 Ração ×10 — ${it('racao').price * 10} cr (tem ${P.inv.racao || 0})`, fn: () => { buyIt('racao', 10, it('racao').price); seeds(); return true; } },
      { label: '← Voltar', fn: () => { menu(); return true; } }]);
    const animals = () => dialog('Comprar animais', `Cada animal, alimentado, produz sozinho. <small>Coroas: <b>${P.zeny} cr</b></small>`, [
      ...Object.entries(ANIMALS).map(([k, A]) => ({ label: `${A.name} — ${A.price} cr (dá ${it(A.prod).ic} ${it(A.prod).name})`, fn: () => {
        if (st.animals.length >= MAX_ANIMALS) { log('O curral está cheio.', 'bad'); }
        else if (P.zeny >= A.price) { P.zeny -= A.price; const a = { k, fed: 0 }; st.animals.push(a); spawnAnimal(a); save(); Audio8.sfx('coin'); log(`Comprou uma <b>${A.name}</b>. Ela está no curral.`, 'gold'); }
        else { log('Coroas insuficientes!', 'bad'); }
        animals(); return true; } })),
      { label: '← Voltar', fn: () => { menu(); return true; } }]);
    const orderMenu = () => {
      const o = order();
      if (o.done) return dialog('Encomenda do dia', 'Já entregou a de hoje. Volte amanhã: cada dia é um pedido diferente.', [{ label: '← Voltar', fn: () => { menu(); return true; } }]);
      dialog('Encomenda do dia', `Preciso de <b>${o.n}× ${it(o.id).ic} ${it(o.id).name}</b> para a cidade. Pago <b>${o.pay} cr</b> e ensino um pouco do ofício (+${o.xp} XP).<br><small>Você tem ${P.inv[o.id] || 0}.</small>`, [
        { label: `Entregar ${o.n} ${it(o.id).ic}`, fn: () => {
          if (!has(o.id, o.n)) { log(`Falta ${it(o.id).name}.`, 'bad'); Audio8.sfx('miss'); orderMenu(); return true; }
          add(o.id, -o.n); P.zeny += o.pay; st.order.done = true; save(); gainXp(o.xp); Audio8.sfx('level'); banner('Encomenda entregue!'); log(`📦 Encomenda entregue: <b>+${o.pay} cr</b>, +${o.xp} XP.`, 'gold'); menu(); return true; } },
        { label: '← Voltar', fn: () => { menu(); return true; } }]);
    };
    const recipes = () => dialog('Receitas', 'A Fazendeira transforma a produção do Sítio.', [
      ...RECIPES.map(r => ({ label: r.label, fn: () => { craft(r); recipes(); return true; } })),
      { label: '← Voltar', fn: () => { menu(); return true; } }]);
    menu();
  }
  function gearShop() {
    const sh = () => dialog('⚔️ Equipamentos', `Equipe pela 🎒 mochila. Refino e forja: <b>Ferreiro Doran</b>, perto da praça. <small>Coroas: <b>${P.zeny} cr</b></small>`, [
      ...Object.keys(GEAR).filter(id => GEAR[id][3]).map(id => ({ label: `${it(id).ic} ${it(id).name} — ${it(id).price} cr (${modTxt(it(id).mods)})`, fn: () => { if (buyIt(id, 1, it(id).price)) log(`Comprou <b>${it(id).name}</b>. Equipe pela mochila 🎒.`, 'item'); sh(); return true; } })),
      { label: 'Sair' }]);
    sh();
  }
  // ---------------- Ferreiro: refino e forja (crafting estilo Lineage 2: materiais dos monstros viram equipamento)
  const FORGE = [
    { out: 'capuz_couro', need: { gosma: 5, po_eco: 3 }, z: 60 },
    { out: 'gibao_couro', need: { gosma: 6, raiz: 4 }, z: 80 },
    { out: 'luvas_couro', need: { gosma: 4, raiz: 3 }, z: 60 },
    { out: 'botas_couro', need: { po_eco: 5, raiz: 3 }, z: 60 },
    { out: 'arma_cristal', need: { cristal: 8, raiz: 4 }, z: 300 },
    { out: 'anel_cristal', need: { cristal: 6, fio: 2 }, z: 400 },
    { out: 'manto_areias', need: { fio: 8, cristal: 6 }, z: 600 },
    { out: 'couraca_sentinela', need: { lasca: 10, essencia: 2 }, z: 2000 },
    { out: 'arma_essencia', need: { lasca: 8, essencia: 3 }, z: 3000 },
  ];
  const needTxt = r => Object.entries(r.need).map(([id, n]) => `${n} ${it(id).ic}`).join(' + ') + ` + ${r.z} cr`;
  function forge() {
    const opts = FORGE.map(r => {
      const ok = P.zeny >= r.z && Object.entries(r.need).every(([id, n]) => has(id, n));
      return { label: `${ok ? '✅' : '▫️'} ${it(r.out).ic} ${it(r.out).name} — ${needTxt(r)}`, fn: () => {
        if (!ok) { const falta = Object.entries(r.need).filter(([id, n]) => !has(id, n)).map(([id, n]) => `${n - (P.inv[id] || 0)} ${it(id).ic} ${it(id).name}`); log(falta.length ? `Falta: ${falta.join(', ')}.` : 'Coroas insuficientes!', 'bad'); Audio8.sfx('miss'); forge(); return true; }
        for (const [id, n] of Object.entries(r.need)) add(id, -n);
        P.zeny -= r.z; add(r.out, 1); Audio8.sfx('anvil'); burst(new THREE.Vector3(P.x, P.y + 1.2, P.z), 0xff9040, 30, 4, 0.8);
        log(`⚒️ Doran forjou <b style="color:${RARITY[it(r.out).rar].c}">${it(r.out).ic} ${it(r.out).name}</b>! Equipe pela mochila.`, 'gold'); forge(); return true; } };
    });
    opts.push({ label: '← Voltar', fn: () => { smith(); return true; } });
    dialog('⚒️ Forjar', `Traga os materiais que os monstros soltam e eu faço a peça. <small>(✅ = você já tem tudo)</small><br><small>Coroas: <b>${P.zeny} cr</b></small>`, opts);
  }
  function smith(eu) {
    dialog('💬 Ferreiro Doran', `${eu ? `Ah, <b>${eu}</b>. ` : ''}O fogo desta forja nunca apagou, nem no dia do Cisma. Trago o aço de volta à vida: refino suas peças e forjo novas com o que você trouxer das caçadas.`, [
      { label: '🔨 Refinar equipamento', fn: () => { refine(); return true; } },
      { label: '⚒️ Forjar equipamento', fn: () => { forge(); return true; } },
      { label: 'Até mais' }]);
  }
  // forja e bigorna ao lado do Ferreiro
  {
    const fx = VIL.x - 14.6, fz = VIL.z - 9.6, fy = groundY(fx, fz), g = new THREE.Group(); g.position.set(fx, fy, fz); scene.add(g);
    const stone = PM('pedra.jpg', [1, 1], new THREE.Color(1.1, 1.05, 1)), metal = new THREE.MeshPhongMaterial({ color: 0x2a2a2e, shininess: 50, specular: 0x555560 });
    const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
    box(2.2, 1.1, 1.6, stone, 0, 0.55, 0);                                   // fornalha
    box(0.9, 2.6, 0.9, stone, -0.5, 2.4, -0.25);                             // chaminé
    const ember = box(1.2, 0.35, 0.05, new THREE.MeshBasicMaterial({ color: 0xff6a20, toneMapped: false }), 0, 0.75, 0.81);   // boca acesa
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,170,80,.9)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set(0, 0.8, 1.0); glow.scale.setScalar(2.4); g.add(glow);
    glow.onBeforeRender = () => { const k = 0.75 + 0.25 * Math.sin(time * 7) * Math.sin(time * 3.1); glow.material.opacity = k; ember.material.color.setRGB(1, 0.35 + 0.15 * k, 0.1); };
    box(0.5, 0.6, 0.5, PM('madeira.jpg', [0.4, 0.4], 0x8a6a50), 2.2, 0.3, 1.2);   // cepo
    box(0.9, 0.22, 0.35, metal, 2.2, 0.71, 1.2); box(0.35, 0.14, 0.22, metal, 2.75, 0.75, 1.2);   // bigorna
    addOb(fx, fz, 1.6); addOb(fx + 2.2, fz + 1.2, 0.6);
  }
  function refine() {
    P.refine = P.refine || {};
    const eq = Object.keys(SLOTS).map(sl => P.equip && P.equip[sl]).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
    const opts = eq.map(id => {
      const r = refOf(id);
      if (r >= 7) return { label: `${it(id).ic} +7 ${it(id).name} — refino máximo`, fn: () => { refine(); return true; } };
      const [z, ch] = REF[r], lasca = r >= 4;
      return { label: `${it(id).ic} ${nameOf(id)} → +${r + 1} — ${z}z${lasca ? ' + 1 🛡️ Lasca' : ''} · ${Math.round(ch * 100)}%`, fn: () => {
        if (P.zeny < z) { log('Coroas insuficientes!', 'bad'); Audio8.sfx('miss'); refine(); return true; }
        if (lasca && !has('lasca')) { log('Falta 🛡️ <b>Lasca de Armadura</b> (cai das criaturas da Torre).', 'bad'); Audio8.sfx('miss'); refine(); return true; }
        P.zeny -= z; if (lasca) add('lasca', -1);
        Audio8.sfx('anvil');
        if (Math.random() < ch) { P.refine[id] = r + 1; setTimeout(() => Audio8.sfx('level'), 600); burst(new THREE.Vector3(P.x, P.y + 1.4, P.z), 0xffd060, 30, 4, 0.9); log(`🔨 Sucesso! <b>${nameOf(id)}</b>.`, 'gold'); if (r + 1 >= 5) banner(`Refino +${r + 1}!`); }
        else { P.refine[id] = Math.max(4, r - 1); Audio8.sfx('miss'); log(`🔨 O refino falhou... a peça voltou para +${P.refine[id]} (ela nunca quebra).`, 'bad'); }
        refine(); return true; } };
    });
    if (!opts.length) opts.push({ label: 'Equipe uma peça para refinar.', fn: () => { refine(); return true; } });
    opts.push({ label: '← Voltar', fn: () => { smith(); return true; } });
    dialog('🔨 Refinar', `Até +4 sempre dá certo. Do +5 ao +7 pode falhar, mas a peça só perde um nível — <b>nunca quebra</b>. Cada + soma 10% de dano, defesa e HP da peça.<br><small>Coroas: <b>${P.zeny} cr</b> · Lascas: ${P.inv.lasca || 0}</small>`, opts);
  }
  // vende ao NPC (materiais e colheita)
  function sellAll(kinds = ['mat', 'colheita']) {
    let z = 0, parts = [];
    for (const id in P.inv) { const I = ITEMS[id]; if (!I || !kinds.includes(I.kind) || !P.inv[id]) continue; z += I.sell * P.inv[id]; parts.push(`${P.inv[id]} ${I.ic}`); P.inv[id] = 0; }
    if (!z) { log('Nada para vender.', 'sys'); return; }
    P.zeny += z; Audio8.sfx('coin'); log(`Vendeu ${parts.join(', ')} por <b>${z} cr</b>.`, 'gold');
  }

  // ---------------------------------------------------------------- mochila (inventário com o personagem)
  function setCount() { const c = {}; for (const sl in (P.equip || {})) { const I = ITEMS[P.equip[sl]]; if (I && I.set) c[I.set] = (c[I.set] || 0) + 1; } return c; }
  const gear = k => {
    let v = 0; for (const sl in (P.equip || {})) { const id = P.equip[sl]; if (id && ITEMS[id] && ITEMS[id].mods) v += (ITEMS[id].mods[k] || 0) * (['pow', 'def', 'hp'].includes(k) ? 1 + 0.1 * refOf(id) : 1); }
    for (const sl in (P.cards || {})) { const c = P.cards[sl]; if (c && P.equip && P.equip[sl] && ITEMS[c]) v += ITEMS[c].mods[k] || 0; }   // carta só vale com peça no espaço
    if (k === 'pow' || k === 'def' || k === 'hp' || k === 'sp') v = Math.round(v);
    const sc = setCount(); for (const st in sc) if (sc[st] >= 4) v += SETS[st].bonus[k] || 0;
    return v;
  };
  let sel = null, tab = 'tudo', trashArm = null;
  // abas da mochila (do lado direito)
  const TABS = [
    ['tudo', '🎒', 'Tudo', () => true],
    ['equip', '⚔️', 'Equip.', I => I.kind === 'equip'],
    ['mat', '🪨', 'Material', I => I.kind === 'mat'],
    ['carta', '🃏', 'Cartas', I => I.kind === 'carta'],
    ['uso', '🧪', 'Usáveis', I => !!(I.use || I.heal)],
    ['sitio', '🌾', 'Sítio', I => ['semente', 'colheita', 'racao', 'comida'].includes(I.kind)],
    ['missao', '📜', 'Missão', (I, id) => typeof Quests !== 'undefined' && Quests.needItems && !!Quests.needItems()[id]],
  ];
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
  // ---------------- comparar equipamento com o que está em uso
  const W = { pow: 1, def: 1.3, hp: 0.12, sp: 0.08, crit: 250, spd: 180 };
  const effMods = id => { const I = it(id), r = refOf(id), o = {}; for (const k in I.mods || {}) o[k] = (I.mods[k] || 0) * (['pow', 'def', 'hp'].includes(k) ? 1 + 0.1 * r : 1); return o; };
  const score = id => { if (!id) return 0; const m = effMods(id); let v = 0; for (const k in m) v += m[k] * (W[k] || 0); return v; };
  // peça em uso que seria trocada (anel: o pior dos dois, ou um espaço vazio)
  function rival(id) {
    const I = it(id); P.equip = P.equip || {};
    if (I.slot === 'anel') { const a = P.equip.anel1, b = P.equip.anel2; if (!a || !b) return null; return score(a) <= score(b) ? a : b; }
    return P.equip[I.slot] || null;
  }
  const better = id => ITEMS[id] && ITEMS[id].kind === 'equip' && score(id) > score(rival(id)) + 0.01;
  function compareHtml(id) {
    const cur = rival(id), a = effMods(id), b = cur ? effMods(cur) : {}, keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    const fmt = (k, v) => ['crit', 'spd'].includes(k) ? Math.round(v * 100) + '%' : Math.round(v);
    const rows = keys.map(k => { const d = (a[k] || 0) - (b[k] || 0), dv = ['crit', 'spd'].includes(k) ? Math.round(d * 100) : Math.round(d);
      return `<tr><td>${MODN[k]}</td><td>${b[k] ? fmt(k, b[k]) : '—'}</td><td>${a[k] ? fmt(k, a[k]) : '—'}</td><td class="${dv > 0 ? 'up' : dv < 0 ? 'down' : ''}">${dv > 0 ? '▲ +' + dv : dv < 0 ? '▼ ' + dv : '='}${dv && ['crit', 'spd'].includes(k) ? '%' : ''}</td></tr>`; }).join('');
    const sa = score(id), sb = score(cur), verdict = !cur ? '<b class="up">Espaço vazio: equipe!</b>' : sa > sb + 0.01 ? '<b class="up">▲ Melhor que a sua</b>' : sa < sb - 0.01 ? '<b class="down">▼ Pior que a sua</b>' : '<b>= Igual à sua</b>';
    return `<div class="cmp">${verdict}<table><tr><th></th><th>${cur ? it(cur).ic + ' Em uso' : 'Em uso'}</th><th>${it(id).ic} Esta</th><th></th></tr>${rows}</table>${cur ? `<small>Comparando com: ${nameOf(cur)}</small>` : ''}</div>`;
  }
  function renderInv() {
    P.equip = P.equip || {};
    const C = CLASSES[P.cls], spr = C.sprite ? (C.sprite.kind === 'dir' ? C.sprite.base + '_down_0' : C.sprite.base + '_down_0') : null;
    const img = spr && window.SPR && SPR[spr] ? `<img class="doll-img" src="data:image/png;base64,${SPR[spr]}">` : '';
    const slots = Object.entries(SLOTS).map(([sl, nm]) => { const id = P.equip[sl]; return `<div class="eslot${id ? ' on r' + (it(id).rar || 0) : ''}${sel === 'eq:' + sl ? ' sel' : ''}" data-a="eq" data-v="${sl}"><span class="ei">${id ? it(id).ic : '·'}</span><span><small>${nm}${P.cards && P.cards[sl] ? ' 🃏' : ''}</small><br>${id ? nameOf(id) : '<i>vazio</i>'}</span></div>`; }).join('');
    const allIds = Object.keys(P.inv).filter(id => P.inv[id] > 0 && ITEMS[id]);
    const tabF = (TABS.find(t => t[0] === tab) || TABS[0])[3], ids = allIds.filter(id => tabF(ITEMS[id], id));
    const tabsHtml = `<div class="itabs">${TABS.map(([k, ic, nm, f]) => { const n = allIds.filter(id => f(ITEMS[id], id)).length; return `<div class="itab${tab === k ? ' on' : ''}" data-a="tab" data-v="${k}"><span>${ic}</span><small>${nm}</small>${k !== 'tudo' && n ? `<b>${n}</b>` : ''}</div>`; }).join('')}</div>`;
    const cells = ids.map(id => `<div class="icell${sel === id ? ' sel' : ''}${ITEMS[id].kind === 'equip' ? ' eq r' + ITEMS[id].rar : ''}" data-a="sel" data-v="${id}" title="${it(id).name}"><span>${it(id).ic}</span><b>${P.inv[id]}</b>${better(id) ? '<em class="better">▲</em>' : ''}</div>`).join('') || `<i class="empty">${tab === 'tudo' ? 'Vazia. Derrote monstros para juntar materiais.' : tab === 'missao' ? 'Nenhum item pedido pelas suas missões.' : 'Nada nesta aba.'}</i>`;
    let det = '<small>Toque num item para ver de perto.</small>', view = '';
    const slotName = sl => sl === 'anel' ? 'Anel' : SLOTS[sl];
    const mobImg = t => { const k = typeof SPR_MOBS !== 'undefined' && SPR_MOBS[t] && SPR_MOBS[t].img; const b = k && SPR[k] ? SPR[k] : t === 'kravenox' && SPR.k_down_0 ? SPR.k_down_0 : null; return b ? `<img src="data:image/png;base64,${b}">` : '<span class="nopic">❔</span>'; };
    // carta desenhada: moldura dourada, retrato do monstro, bônus e onde encaixa
    const cardArt = I => `<div class="tcard"><div class="tc-t">${I.name.replace(/^Carta (da |de )?/, '')}</div><div class="tc-pic">${mobImg(I.mob)}</div><div class="tc-b">${modTxt(I.mods)}</div><div class="tc-s">Encaixa em: <b>${slotName(I.cslot)}</b></div></div>`;
    const bigArt = (I, id) => I.kind === 'carta' ? cardArt(I) : `<div class="ibig r${I.kind === 'equip' ? I.rar : 'x'}"><span>${I.ic}</span></div>`;
    if (sel && sel.startsWith('eq:')) {
      const sl = sel.slice(3), id = P.equip[sl], cd = P.cards && P.cards[sl];
      if (id) {
        const I = it(id);
        view = `<div class="iview"><div class="iv-art">${bigArt(I, id)}${cd ? `<div class="iv-mini">${cardArt(it(cd))}</div>` : ''}</div><div class="iv-txt">
          <b class="iv-n" style="color:${RARITY[I.rar || 0].c}">${nameOf(id)}</b><small>${RARITY[I.rar || 0].n} · ${slotName(sl.startsWith('anel') ? 'anel' : sl)} · equipado</small>
          <p>${modTxt(I.mods)}${refOf(id) ? `<br>🔨 Refino +${refOf(id)}: +${refOf(id) * 10}% de dano, defesa e HP` : ''}${I.set ? `<br>🔗 ${SETS[I.set].name} (4 peças: ${modTxt(SETS[I.set].bonus)})` : ''}${cd ? `<br>🃏 ${it(cd).name}: ${modTxt(it(cd).mods)}` : `<br><small>🃏 Espaço de carta vazio</small>`}</p>
          <div class="ibtn"><button data-a="unequip" data-v="${sl}">Tirar</button>${cd ? `<button data-a="uncard" data-v="${sl}">Tirar carta</button>` : ''}<button data-a="unsel">Fechar</button></div></div></div>`;
      } else det = `<small>${SLOTS[sl]} vazio. Equipe algo da mochila.</small>`;
    } else if (sel && P.inv[sel] > 0) {
      const I = ITEMS[sel], btns = [];
      if (I.kind === 'equip') btns.push(`<button data-a="equip" data-v="${sel}">Equipar</button>`);
      if (I.sell > 0 && !['red', 'blue'].includes(sel)) btns.push(`<button data-a="sell1" data-v="${sel}">💰 Vender 1 (${I.sell} cr)</button>`);
      if (I.sell > 0 && P.inv[sel] > 1 && !['red', 'blue'].includes(sel)) btns.push(`<button data-a="sellall" data-v="${sel}">💰 Vender todos (${(I.sell * P.inv[sel]).toLocaleString('pt-BR')} cr)</button>`);
      btns.push(`<button data-a="trash" data-v="${sel}" class="${trashArm === sel ? 'danger' : ''}">${trashArm === sel ? '⚠️ Toque de novo para destruir' : '🗑️ Destruir'}</button>`);
      if (I.use || I.heal) { btns.push(`<button data-a="use" data-v="${sel}">Usar</button>`); const on = ensureBar().includes('i:' + sel); btns.push(`<button data-a="hot" data-v="${sel}">${on ? '✖ Tirar do atalho' : '📌 Pôr no atalho'}</button>`); }
      let extra = '';
      if (I.kind === 'carta') {
        const ok = Object.keys(SLOTS).filter(sl => P.equip[sl] && (sl === I.cslot || (I.cslot === 'anel' && sl.startsWith('anel'))));
        ok.forEach(sl => btns.push(`<button data-a="card" data-v="${sl}">🃏 Encaixar em ${it(P.equip[sl]).name}</button>`));
        if (!ok.length) extra = `<br><small>Equipe ${I.cslot === 'arma' ? 'uma arma' : I.cslot === 'anel' ? 'um anel' : I.cslot === 'botas' ? 'botas' : I.cslot === 'luvas' ? 'luvas' : 'um ' + slotName(I.cslot).toLowerCase()} para encaixar esta carta.</small>`;
      }
      const txt = I.kind === 'equip' ? `${RARITY[I.rar].n} · ${slotName(I.slot)}${I.set ? ` · 🔗 ${SETS[I.set].name}` : ''} · vende por ${I.sell} cr${compareHtml(sel)}`
        : I.kind === 'carta' ? `Carta de monstro · rara<p>${modTxt(I.mods)}<br>Encaixa em: <b>${slotName(I.cslot)}</b>${extra}<br><small>A carta vale enquanto houver uma peça no espaço.</small></p>`
        : I.heal ? `Comida<p>Cura ${Math.round(I.heal * 100)}% do HP</p>` : I.use ? `Poção<p>Recupera ${sel === 'blue' ? 'SP' : 'HP'}</p>` : `${I.kind === 'semente' ? 'Semente: plante no Sítio' : I.kind === 'colheita' ? 'Produção do Sítio' : 'Material de monstro: o Ferreiro Doran usa para forjar'}<p><small>Vende por ${I.sell} cr</small></p>`;
      view = `<div class="iview"><div class="iv-art">${bigArt(I, sel)}</div><div class="iv-txt"><b class="iv-n" style="color:${I.kind === 'equip' ? RARITY[I.rar].c : I.kind === 'carta' ? '#ffb640' : '#f0e6d0'}">${I.name}</b> <small>×${P.inv[sel]}</small><small>${txt}</small>
        <div class="ibtn">${btns.join('')}<button data-a="unsel">Fechar</button></div></div></div>`;
    }
    const mag = CLASSES[P.cls].magic;
    invWin().innerHTML = `<div class="wt">🎒 Mochila <small>· ${P.zeny} cr</small><span class="x" data-a="close">×</span></div>
      <div class="invb">
        <div class="doll"><div class="doll-fig">${img}<div class="doll-n">${P.name}<br><small>${typeof tierName === 'function' ? tierName() : className(P.cls, P.gender)} · Nv ${P.lv}</small></div></div><div class="eslots">${slots}</div>
          <div class="dstat">${mag ? 'MATQ ' + stats.matk() : 'ATQ ' + stats.atk()} · DEF ${stats.def()} · HP ${stats.maxHp()}</div>
          ${Object.entries(setCount()).map(([st, n]) => `<div class="dset ${n >= 4 ? 'on' : ''}">${SETS[st].name}: ${n}/4${n >= 4 ? ' ✅ ' + modTxt(SETS[st].bonus) : ''}</div>`).join('')}</div>
        <div class="invr"><div class="invc"><div class="igrid">${cells}</div><div class="idet">${det}</div>
          <div class="ibtn foot"><button data-a="trade">🤝 Trocar</button><button data-a="stall">${st.stall ? '🏪 Fechar banca' : '🏪 Abrir banca'}</button></div></div>${tabsHtml}</div>${view}
      </div>`;
  }
  function act(a, v) {
    if (a === 'close') return closeInv();
    if (a === 'sel') sel = sel === v ? null : v;
    if (a === 'unsel') sel = null;
    if (a !== 'trash') trashArm = null;
    if (a === 'sell1' || a === 'sellall') { const n = a === 'sell1' ? 1 : P.inv[v], z = ITEMS[v].sell * n; P.inv[v] -= n; P.zeny += z; Audio8.sfx('coin'); log(`💰 Vendeu ${n}× <b>${it(v).name}</b> por <b>${z.toLocaleString('pt-BR')} cr</b>.`, 'gold'); if (!P.inv[v]) sel = null; buildHotbar(); }
    if (a === 'trash') { if (trashArm !== v) trashArm = v; else { const n = P.inv[v]; P.inv[v] = 0; trashArm = null; sel = null; Audio8.sfx('miss'); log(`🗑️ Destruiu ${n}× <b>${it(v).name}</b>.`, 'sys'); buildHotbar(); } }
    if (a === 'hot') {                                   // põe/tira o item da barra de atalhos
      const r = barToggle('i:' + v);
      if (r === true) log(`📌 <b>${it(v).name}</b> foi para a barra de atalhos.`, 'item'); else if (r === false) log(`✖ <b>${it(v).name}</b> saiu da barra de atalhos.`, 'sys'); else { renderInv(); return; }
      buildHotbar();
    }
    if (a === 'tab') { tab = v; sel = null; }
    if (a === 'eq') sel = 'eq:' + v;
    if (a === 'equip') { let sl = ITEMS[v].slot; P.equip = P.equip || {}; if (sl === 'anel') sl = !P.equip.anel1 ? 'anel1' : !P.equip.anel2 ? 'anel2' : 'anel1'; if (P.equip[sl]) add(P.equip[sl], 1); add(v, -1); P.equip[sl] = v; Audio8.sfx('buff'); log(`Equipou <b>${it(v).name}</b>.`, 'item'); sel = 'eq:' + sl; }
    if (a === 'unequip') { const id = P.equip[v]; if (id) { add(id, 1); P.equip[v] = null; log(`Tirou <b>${it(id).name}</b>.`, 'sys'); } }
    if (a === 'use') { use(v); if (!P.inv[v]) sel = null; }
    if (a === 'card' && sel && ITEMS[sel] && ITEMS[sel].kind === 'carta') {
      Audio8.sfx('anvil'); P.cards = P.cards || {}; if (P.cards[v]) add(P.cards[v], 1); P.cards[v] = sel; log(`🃏 Encaixou <b>${it(sel).name}</b> em ${SLOTS[v]}.`, 'gold'); Audio8.sfx('buff'); add(sel, -1); sel = 'eq:' + v; }
    if (a === 'uncard') { const c = P.cards && P.cards[v]; if (c) { add(c, 1); P.cards[v] = null; log(`Tirou <b>${it(c).name}</b>.`, 'sys'); } }
    if (a === 'trade') { closeInv(); return tradePick(); }
    if (a === 'stall') { closeInv(); return st.stall ? closeStall() : stallSetup(); }
    P.hp = Math.min(P.hp, stats.maxHp()); P.sp = Math.min(P.sp, stats.maxSp());
    renderInv();
  }
  function use(id) {
    if (ITEMS[id].use === 'pot') return usePotion(id);
    if (ITEMS[id].use === 'tp') { closeInv(); return useWing(id); }
    if (!has(id)) return;
    add(id, -1); healP(stats.maxHp() * ITEMS[id].heal); Audio8.sfx('heal');
  }

  // ---------------------------------------------------------------- multiplayer: troca e banca
  let peers = [], tr = null, stallSold = [], stallRej = [], buyReq = [], declined = new Set(), doneTr = new Set(), stallMode = 1;
  const online = () => typeof Net !== 'undefined' && Net.connected && Net.me;
  const soloMsg = () => log('Troca e banca funcionam com os amigos online no mesmo mundo (precisa de internet).', 'sys');
  const near = (r, d) => Math.hypot(r.x - P.x, r.z - P.z) < d;
  const keyOf = (a, b) => JSON.stringify([a || {}, b || {}]);
  const offerTxt = g => { const e = Object.entries(g || {}).filter(([k, n]) => n > 0); return e.length ? e.map(([k, n]) => k === 'z' ? `<b>${n} cr</b>` : `${it(k).ic} ${it(k).name} ×${n}`).join('<br>') : '<i>nada ainda</i>'; };

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
    if (P.zeny >= (tr.give.z || 0) + 50) opts.push({ label: '+50 cr', fn: () => { tr.give.z = (tr.give.z || 0) + 50; tr.ok = false; tradeWin(); return true; } });
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
    const opts = Object.keys(P.inv).filter(id => P.inv[id] > (sel[id] || 0) && ITEMS[id]).map(id => ({ label: `+1 ${it(id).ic} ${it(id).name} (${price(id)} cr)`, fn: () => { sel[id] = (sel[id] || 0) + 1; stallSetup(sel); return true; } }));
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
    dialog(`🏪 ${bk.t}`, `<small>Suas coroas: <b>${P.zeny} cr</b></small>`, [
      ...bk.it.filter(([, n]) => n > 0).map(([id, n, p], i) => ({ label: `${it(id).ic} ${it(id).name} (${n}) — ${p} cr`, fn: () => {
        if (P.zeny < p) { log('Coroas insuficientes!', 'bad'); return true; }
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
        if (e) { e[1]--; P.zeny += q.p; stallSold.push(q.id); Audio8.sfx('coin'); log(`🏪 <b>${r.n}</b> comprou ${it(q.it).ic} ${it(q.it).name} por ${q.p} cr.`, 'gold'); save(); }
        else stallRej.push(q.id);
        stallSold = stallSold.slice(-20); stallRej = stallRej.slice(-20);
      }
    }
    // comprador: recebe ou é reembolsado
    for (const q of [...st.pend]) {
      const r = peers.find(p => p.peer === q.to);
      const ok = r && (r.s.sd || []).includes(q.id), no = !r || (r.s.rj || []).includes(q.id) || now() - q.at > 60000;
      if (ok) { add(q.it, 1); log(`Recebeu ${it(q.it).ic} <b>${it(q.it).name}</b>.`, 'item'); Audio8.sfx('pick'); }
      else if (no) { P.zeny += q.p; log(`Compra de ${it(q.it).name} não concluída: ${q.p} cr devolvidos.`, 'sys'); }
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
  // moedas e poções em 3D; o resto mostra o próprio item
  const goldM = new THREE.MeshPhongMaterial({ color: 0xe8b828, emissive: 0x5a3800, specular: 0xfff0b0, shininess: 120 });
  const coinG = new THREE.CylinderGeometry(0.17, 0.17, 0.045, 18);
  const glintTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.15, 'rgba(255,240,180,.8)'); r.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(31, 4, 2, 56); g.fillRect(4, 31, 56, 2); return new THREE.CanvasTexture(c); })();
  const glassG = new THREE.SphereGeometry(0.2, 16, 12), neckG = new THREE.CylinderGeometry(0.07, 0.09, 0.16, 12), corkG = new THREE.CylinderGeometry(0.075, 0.065, 0.08, 10), liqG = new THREE.SphereGeometry(0.17, 14, 10, 0, TAU, Math.PI * 0.35, Math.PI * 0.65);
  const corkM = new THREE.MeshLambertMaterial({ color: 0x8a6238 });
  function potion(col) {
    const g = new THREE.Group();
    const glass = new THREE.Mesh(glassG, new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, shininess: 140, specular: 0xffffff, depthWrite: false }));
    const liq = new THREE.Mesh(liqG, new THREE.MeshPhongMaterial({ color: col, emissive: new THREE.Color(col).multiplyScalar(0.45), shininess: 60 }));
    const neck = new THREE.Mesh(neckG, glass.material); neck.position.y = 0.24; const cork = new THREE.Mesh(corkG, corkM); cork.position.y = 0.35;
    g.add(liq, glass, neck, cork); g.scale.setScalar(1.25); g.position.y = 0.05; return g;
  }
  function dropMesh(id, n = 1) {
    const I = id === 'zeny' ? { ic: '🪙' } : it(id), grp = new THREE.Group();
    if (id === 'zeny') {
      const k = Math.min(9, 3 + Math.floor(Math.log2(Math.max(1, n))));
      for (let i = 0; i < k; i++) {
        const c = new THREE.Mesh(coinG, goldM), a = i * 2.4, r = i < 3 ? 0.06 : 0.18 + (i % 2) * 0.06;
        c.position.set(Math.cos(a) * r, -0.3 + (i < 3 ? i * 0.05 : 0.02), Math.sin(a) * r); c.rotation.set(i < 3 ? 0 : rand(0.2, 0.7), 0, i < 3 ? 0 : rand(-0.5, 0.5)); c.castShadow = true; grp.add(c);
      }
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); gl.scale.setScalar(0.5); gl.position.y = -0.1; grp.add(gl);
      gl.onBeforeRender = () => { const k = Math.max(0, Math.sin(time * 2.5 + grp.id)); gl.material.opacity = k * k; gl.material.rotation = time; };
      grp.userData.flat = true;
    } else if (id === 'red' || id === 'blue') {
      grp.add(potion(id === 'red' ? 0xe02a2a : 0x2a6ae8));
    } else {
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: itemIcon(I.ic), transparent: true, depthWrite: false, toneMapped: false }));
      spr.scale.setScalar(1.05); spr.position.y = 0.15; grp.add(spr);
    }
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = -0.37; grp.add(sh);   // sombrinha no chão
    const rar = I.kind === 'equip' ? I.rar : I.kind === 'carta' ? 3 : -1;
    if (rar >= 0 || id === 'essencia') {          // todo equipamento ganha feixe; a cor e a força dizem a raridade
      const col = rar >= 0 ? RARITY[rar].hex : 0xa050ff, base = [0.3, 0.5, 0.6, 0.7, 0.85][Math.max(0, rar)];
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
    if (I.kind === 'carta') { log(`🎉🃏 Você pegou a <b style="color:#ffb640">${I.name}</b>! (${modTxt(I.mods)}) Encaixe pela mochila.`, 'item'); banner('🃏 ' + I.name); Audio8.sfx('level'); return true; }
    if (I.kind === 'equip') {
      log(`${I.rar >= 2 ? '🎉 ' : ''}Você pegou <b style="color:${RARITY[I.rar].c}">[${RARITY[I.rar].n}] ${I.ic} ${I.name}</b>!`, 'item');
      if (I.rar >= 2) { banner(`${RARITY[I.rar].n}: ${I.name}`); Audio8.sfx('level'); }
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- bestiário: onde fica cada monstro e o que ele solta
  const REGION = { pompom: 'Campos Dourados', zunzum: 'Campos Dourados', fungolino: 'Campos Dourados', besouro: 'Areias Rubras', serpe: 'Areias Rubras',
    guardiao: 'Ruínas das Areias (chefe)', larva: 'Torre do Cisma', verme: 'Torre do Cisma', esfera: 'Torre do Cisma', sentinela: 'Torre do Cisma', kravenox: 'Topo da Torre · sábado 20h (chefe mundial)',
    larvaMae: 'Campos Dourados (chefe de campo)', raizPetra: 'Floresta a oeste (chefe de campo)', cristalizado: 'Areias Rubras (chefe de campo)', larvaFogo: 'Perto das ruínas (chefe de campo)' };
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
    const drops = d.drops.map(([id, ch]) => { const I = it(id); const c = I.kind === 'equip' ? RARITY[I.rar].c : I.kind === 'carta' ? '#ffb640' : '#cfc8b8'; return `<div class="bd"><span>${I.ic}</span><b style="color:${c}">${I.name}</b><em>${ch >= 1 ? '100%' : (ch * 100).toFixed(ch < 0.01 ? 2 : ch < 0.1 ? 1 : 0).replace('.', ',') + '%'}</em></div>`; }).join('');
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
        else if (cropLeft(s) > 0 && !s.w) consider(d, `💧 Regar ${it(s.c).name} (${fmtT(cropLeft(s))})`, () => water(i));
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
        const wet = !!(s && s.w && cropLeft(s) > 0), sm = wet ? wetM : soilM;
        if (p.soil.material !== sm) { p.soil.material = sm; p.ridges.forEach(r => r.material = sm); }
        const ready = !!s && cropLeft(s) <= 0, want = ready ? it(s.c).ic : '';
        if (want !== p.markT) { if (p.mark) p.g.remove(p.mark); p.mark = want ? icon(want) : null; if (p.mark) p.g.add(p.mark); p.markT = want; }
        if (p.mark) p.mark.position.y = 1.9 + Math.sin(time * 3 + i) * 0.1;
        if (!s) { p.stalks.forEach(m => m.visible = false); return; }
        const C = CROPS[s.c], k = Math.min(1, 1 - cropLeft(s) / (C.min * MIN)), stage = ready ? 2 : k < 0.4 ? 0 : 1, mat = cropMat(s.c, stage);
        p.stalks.forEach((m, j) => {
          m.visible = true; m.material = mat; m.scale.setScalar((stage === 0 ? 0.55 : 0.7) + k * 0.45 + Math.sin(j * 3.7) * 0.06);
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
  return { use, smith, useSlot, init, update, nearest, onPeers, pres, sellAll, bag, talkFarm, gear, gearShop, dropMesh, pickMsg, bestiary, onKill, migrateEquip, SLOTS, RARITY, get stall() { return st.stall; } };
})();
