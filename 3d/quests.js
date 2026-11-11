// =====================================================================
//  Missões: 🟡 principal (história), 🔵 secundárias (moradores),
//  🟢 caça (quadros de caça, repetíveis) e 🟣 ocultas (escondidas pelo mapa).
// =====================================================================
'use strict';
const Quests = (() => {
  const TYPE = {
    principal: { n: 'Principal', c: '#ffcf40', dot: '🟡' },
    secundaria: { n: 'Secundária', c: '#6ab0ff', dot: '🔵' },
    caca: { n: 'Caça', c: '#7dff9a', dot: '🟢' },
    oculta: { n: 'Oculta', c: '#c27aff', dot: '🟣' },
  };
  // passos: { kill: tipo, n } · { item: id, n } (entregue no fim) · { reach: [x, z, raio] }
  // giver/to = nome do NPC (to = onde entrega; padrão = giver). req = missão anterior. lv = nível mínimo.
  const Q = [
    // ---------------- principal: A Essência que vaza
    { id: 'p1', type: 'principal', giver: 'Mestra Odete', title: 'Primeira lição', txt: 'A Essência vaza pelas rachaduras e as larvas se multiplicam nos campos.', steps: [{ kill: 'pompom', n: 5 }], rw: { xp: 60, zeny: 80, items: { red: 3 } } },
    { id: 'p2', type: 'principal', giver: 'Mestra Odete', req: 'p1', title: 'Ecos nos campos', txt: 'Os Ecos Famintos atacam quem passa pela estrada.', steps: [{ kill: 'zunzum', n: 5 }], rw: { xp: 120, zeny: 120, items: { red: 4 } } },
    { id: 'p3', type: 'principal', giver: 'Mestra Odete', req: 'p2', title: 'Raízes que rastejam', txt: 'Raízes vivas brotam perto do trigo.', steps: [{ kill: 'fungolino', n: 5 }], rw: { xp: 220, zeny: 160, items: { blue: 2 } } },
    { id: 'p4', type: 'principal', giver: 'Mestra Odete', to: 'Guarda Tobias', req: 'p3', title: 'Carta ao Guarda', txt: 'Leve a carta da Mestra ao Guarda Tobias, na saída leste da vila.', steps: [], rw: { xp: 150, zeny: 60 } },
    { id: 'p5', type: 'principal', giver: 'Guarda Tobias', req: 'p4', title: 'Rumo às Areias', txt: 'Larvas Cristalinas surgiram nas Areias Rubras, a leste do rio.', steps: [{ kill: 'besouro', n: 6 }], rw: { xp: 500, zeny: 300, items: { red: 5, manto: 1 } } },
    { id: 'p6', type: 'principal', giver: 'Guarda Tobias', to: 'Anciã Zahra', req: 'p5', title: 'O Oásis de Kharum', txt: 'A Anciã Zahra, no Oásis de Kharum, sabe de onde vêm as sombras.', steps: [], rw: { xp: 300, zeny: 100 } },
    { id: 'p7', type: 'principal', giver: 'Anciã Zahra', req: 'p6', title: 'Sombras errantes', txt: 'Sombras andam pelas dunas à noite e de dia.', steps: [{ kill: 'serpe', n: 5 }], rw: { xp: 900, zeny: 400, items: { blue: 3 } } },
    { id: 'p8', type: 'principal', giver: 'Anciã Zahra', req: 'p7', title: 'A Sentinela sem Rosto', txt: 'Nas ruínas ao sudeste vaga uma armadura vazia tomada pelo Vazio.', steps: [{ kill: 'guardiao', n: 1 }], rw: { xp: 2500, zeny: 1500, items: { blue: 5, cota: 1 } } },
    { id: 'p9', type: 'principal', giver: 'Anciã Zahra', to: 'Vigia Morvan', req: 'p8', title: 'A Cidadela do Cisma', txt: 'Vá até a Cidadela do Cisma, no extremo leste, e fale com o Vigia Morvan.', steps: [], rw: { xp: 800, zeny: 300 } },
    { id: 'p10', type: 'principal', giver: 'Vigia Morvan', req: 'p9', title: 'A Torre do Cisma', txt: 'Seis andares tomados pela Essência. Comece limpando as Sentinelas.', steps: [{ kill: 'sentinela', n: 10 }], rw: { xp: 4000, zeny: 2000, items: { anel_vazio: 1 } } },
    { id: 'p11', type: 'principal', giver: 'Vigia Morvan', req: 'p10', title: 'O Soberano dorme', txt: 'Chegue ao topo da Torre e veja com os próprios olhos quem dorme lá.', steps: [{ reach: 'topo' }], rw: { xp: 8000, zeny: 4000, items: { elmo_sentinela: 1 } } },
    // ---------------- secundárias
    { id: 's1', type: 'secundaria', giver: 'Irmã Celina', title: 'Ervas para os feridos', txt: 'Preciso de Raízes Secas para os unguentos.', steps: [{ item: 'raiz', n: 4 }], rw: { xp: 120, zeny: 80, items: { blue: 3 } } },
    { id: 's2', type: 'secundaria', giver: 'Mercador Bento', title: 'Gosma para o sabão', txt: 'Gosma de Larva faz o melhor sabão da região.', steps: [{ item: 'gosma', n: 8 }], rw: { xp: 100, zeny: 150, items: { anel_raiz: 1 } } },
    { id: 's3', type: 'secundaria', giver: 'Guarda Tobias', req: 'p4', title: 'Vigia dos campos', txt: 'Ajude a limpar a estrada dos Ecos Famintos.', steps: [{ kill: 'zunzum', n: 12 }], rw: { xp: 300, zeny: 200, items: { botas_couro: 1 } } },
    { id: 's4', type: 'secundaria', giver: 'Fazendeira Dália', title: 'Ovos frescos', txt: 'Uma encomenda grande de ovos chegou da Cidadela.', steps: [{ item: 'ovo', n: 5 }], rw: { xp: 150, zeny: 250, items: { racao: 10 } } },
    { id: 's5', type: 'secundaria', giver: 'Mercador Farid', title: 'Cristais para o mercado', txt: 'Cristais Opacos valem ouro aqui no oásis.', steps: [{ item: 'cristal', n: 6 }], rw: { xp: 600, zeny: 400, items: { turbante: 1 } } },
    { id: 's6', type: 'secundaria', giver: 'Curandeira Samira', title: 'Fios de sombra', txt: 'Com Fio de Sombra eu costuro amuletos de proteção.', steps: [{ item: 'fio', n: 4 }], rw: { xp: 800, zeny: 300, items: { colar_sombra: 1 } } },
    { id: 's7', type: 'secundaria', giver: 'Curandeira Ilsa', title: 'Lascas da guerra', txt: 'As Lascas de Armadura guardam memórias de quem as usou.', steps: [{ item: 'lasca', n: 6 }], rw: { xp: 2500, zeny: 800, items: { manoplas_sentinela: 1 } } },
    { id: 's8', type: 'secundaria', giver: 'Mercador Dravo', title: 'Essência para estudo', txt: 'Pago muito bem por uma Essência Negra.', steps: [{ item: 'essencia', n: 1 }], rw: { xp: 3000, zeny: 2500 } },
    // ---------------- caça (quadros de caça, repetíveis)
    { id: 'c1', type: 'caca', board: 'solmira', repeat: true, title: 'Praga de larvas', txt: 'Recompensa pela limpeza dos campos.', steps: [{ kill: 'pompom', n: 15 }], rw: { xp: 150, zeny: 120 } },
    { id: 'c2', type: 'caca', board: 'solmira', repeat: true, title: 'Raízes no trigo', txt: 'As raízes estão comendo a colheita.', steps: [{ kill: 'fungolino', n: 10 }], rw: { xp: 250, zeny: 180, items: { red: 2 } } },
    { id: 'c3', type: 'caca', board: 'kharum', repeat: true, title: 'Cristal nas dunas', txt: 'Larvas Cristalinas bloqueiam a rota das caravanas.', steps: [{ kill: 'besouro', n: 12 }], rw: { xp: 700, zeny: 400 } },
    { id: 'c4', type: 'caca', board: 'kharum', repeat: true, title: 'Caçada às sombras', txt: 'Ninguém dorme com as sombras rondando.', steps: [{ kill: 'serpe', n: 10 }], rw: { xp: 1100, zeny: 550, items: { blue: 2 } } },
    { id: 'c5', type: 'caca', board: 'cidadela', repeat: true, title: 'Larvas da Torre', txt: 'A Torre transborda de larvas.', steps: [{ kill: 'larva', n: 15 }], rw: { xp: 2000, zeny: 800 } },
    { id: 'c6', type: 'caca', board: 'cidadela', repeat: true, title: 'Sentinelas do Vazio', txt: 'Contrato da guarda da Cidadela.', steps: [{ kill: 'sentinela', n: 10 }], rw: { xp: 3500, zeny: 1400, items: { blue: 3 } } },
    // ---------------- ocultas (quem dá está escondido pelo mapa)
    { id: 'h1', type: 'oculta', giver: 'Viajante Perdido', title: 'O anel engolido', txt: '"Uma Raiz Rastejante engoliu o anel da minha mãe... por favor."', steps: [{ kill: 'fungolino', n: 8 }], rw: { xp: 600, zeny: 500, items: { anel_cristal: 1 } } },
    { id: 'h2', type: 'oculta', giver: 'Eco Sussurrante', title: 'Vozes da cratera', txt: '"Traga o pó dos meus irmãos e eu te conto um segredo."', steps: [{ item: 'po_eco', n: 5 }], rw: { xp: 900, zeny: 300, items: { colar_sombra: 1 } }, lore: 'O Eco sussurra: "Antes do Cisma, o Reino era um só. A Fonte guardava a memória de todos… e alguém quis guardá-la só para si."' },
  ];
  const byId = Object.fromEntries(Q.map(q => [q.id, q]));
  // tesouros escondidos (abrir uma vez) e NPCs ocultos
  const SECRETS = [
    { id: 'b1', kind: 'bau', name: 'Baú Esquecido', x: -62, z: -80, rw: { zeny: 600, items: { red: 4, blue: 2, gibao_couro: 1 } }, msg: 'Debaixo das folhas, um baú de madeira velha.' },
    { id: 'b2', kind: 'bau', name: 'Túmulo do Cavaleiro', x: 92, z: -78, rw: { zeny: 1500, items: { sandalias: 1, blue: 3 } }, msg: 'Uma espada cravada na areia marca o túmulo de um cavaleiro antigo.' },
    { id: 'b3', kind: 'bau', name: 'Altar Antigo', x: 214 - 12, z: -60, lv: 20, rw: { zeny: 4000, items: { anel_vazio: 1, essencia: 1 } }, msg: 'Um altar de pedra escondido atrás da Torre. A Essência pulsa aqui.' },
    { id: 'n1', kind: 'npc', name: 'Viajante Perdido', sprite: 'estranho', x: -200, z: 72 },
    { id: 'n2', kind: 'npc', name: 'Eco Sussurrante', sprite: 'origem', x: -20 + 24, z: -64 - 10 },
  ];

  const S = () => (P.qs = P.qs || { act: {}, done: {} });
  const colorOf = q => TYPE[q.type].c;
  const prog = (q, i) => { const st = q.steps[i], a = S().act[q.id] || { k: {} }; if (st.kill) return Math.min(st.n, a.k[st.kill] || 0); if (st.item) return Math.min(st.n, P.inv[st.item] || 0); if (st.reach) return a.r ? 1 : 0; return 0; };
  const need = st => st.n || 1;
  const ready = q => S().act[q.id] && q.steps.every((st, i) => prog(q, i) >= need(st));
  const stepTxt = (st, i, q) => {
    if (st.kill) return `Derrote ${st.n} ${MOBDEF[st.kill] ? MOBDEF[st.kill].name : st.kill}`;
    if (st.item) return `Traga ${st.n}× ${ITEMS[st.item] ? ITEMS[st.item].name : st.item}`;
    if (st.reach === 'topo') return 'Chegue ao topo da Torre do Cisma';
    return '';
  };
  const available = q => !S().act[q.id] && (q.repeat || !S().done[q.id]) && (!q.req || S().done[q.req]) && (!q.lv || P.lv >= q.lv);
  const npcByName = n => NPCS.find(o => o.name === n);

  function accept(q) {
    S().act[q.id] = { k: {} }; Audio8.sfx('buff');
    log(`${TYPE[q.type].dot} Missão aceita: <b style="color:${colorOf(q)}">${q.title}</b>`, 'gold'); save();
  }
  function finish(q) {
    for (const st of q.steps) if (st.item) P.inv[st.item] = Math.max(0, (P.inv[st.item] || 0) - st.n);
    delete S().act[q.id]; S().done[q.id] = (S().done[q.id] || 0) + 1;
    const r = q.rw || {}; P.zeny += r.zeny || 0;
    const got = [];
    for (const [id, n] of Object.entries(r.items || {})) { P.inv[id] = (P.inv[id] || 0) + n; got.push(`${n}× ${ITEMS[id] ? ITEMS[id].ic + ' ' + ITEMS[id].name : id}`); }
    Audio8.sfx('coin'); buildHotbar();
    log(`${TYPE[q.type].dot} <b style="color:${colorOf(q)}">${q.title}</b> concluída! ${r.xp ? '+' + r.xp + ' XP' : ''} ${r.zeny ? '+' + r.zeny + ' cr' : ''}${got.length ? ' · ' + got.join(', ') : ''}`, 'gold');
    if (r.xp) gainXp(r.xp);
    if (q.lore) setTimeout(() => dialog('🟣 Segredo', q.lore), 300);
    // a principal seguinte já fica disponível no mesmo NPC
    const nx = Q.find(o => o.req === q.id && o.type === 'principal');
    if (nx && available(nx) && nx.giver === (q.to || q.giver)) accept(nx);
    save();
  }
  function rewardTxt(q) { const r = q.rw || {}; return [r.xp ? r.xp + ' XP' : '', r.zeny ? r.zeny + ' cr' : '', ...Object.entries(r.items || {}).map(([id, n]) => `${n}× ${ITEMS[id] ? ITEMS[id].ic + ' ' + ITEMS[id].name : id}`)].filter(Boolean).join(' · '); }
  function questCard(q) { return `<b style="color:${colorOf(q)}">${TYPE[q.type].dot} ${q.title}</b> <small>(${TYPE[q.type].n})</small><br>${q.txt}<br>${q.steps.map((st, i) => '▫️ ' + stepTxt(st, i, q)).join('<br>')}<br><small>Recompensa: ${rewardTxt(q)}</small>`; }

  // conversa: entrega e oferece missões; "Outros assuntos" volta ao diálogo normal do NPC
  function talk(n, base) {
    const toHere = Object.keys(S().act).map(id => byId[id]).filter(q => q && (q.to || q.giver) === n.name);
    const turn = toHere.filter(ready), offers = Q.filter(q => q.giver === n.name && available(q));
    const pending = toHere.filter(q => !ready(q));
    if (!turn.length && !offers.length && !(n.hidden && pending.length)) return false;
    const opts = [];
    for (const q of turn) opts.push({ label: `✅ Entregar: ${q.title}`, fn: () => { finish(q); setTimeout(() => talk(n, base) || null, 50); } });
    for (const q of offers) opts.push({ label: `${TYPE[q.type].dot} ${q.title}`, fn: () => { dialog(`💬 ${n.name}`, questCard(q), [{ label: 'Aceitar', fn: () => accept(q) }, { label: 'Agora não' }]); return true; } });
    if (base) opts.push({ label: 'Outros assuntos', fn: () => { setTimeout(base, 30); } });
    opts.push({ label: 'Tchau' });
    const intro = turn.length ? `Você voltou, <b>${P.name}</b>!` : `Olá, <b>${P.name}</b>. Tenho um pedido.`;
    dialog(`💬 ${n.name}`, intro + (pending.length ? `<br><small>Em andamento: ${pending.map(q => q.title).join(', ')}</small>` : ''), opts);
    return true;
  }
  function boardTalk(city) {
    const qs = Q.filter(q => q.board === city), opts = [];
    for (const q of qs) {
      if (S().act[q.id] && ready(q)) opts.push({ label: `✅ Receber: ${q.title}`, fn: () => { finish(q); setTimeout(() => boardTalk(city), 50); } });
      else if (S().act[q.id]) opts.push({ label: `⏳ ${q.title} (${prog(q, 0)}/${q.steps[0].n})`, fn: () => true });
      else opts.push({ label: `🟢 ${q.title} — ${rewardTxt(q)}`, fn: () => { accept(q); setTimeout(() => boardTalk(city), 50); } });
    }
    P.warps = P.warps || {}; P.warps[city] = 1;            // memória de viagem: só leva a cidades já visitadas
    opts.push({ label: '🧭 Viagem rápida', fn: () => { travel(city); return true; } });
    opts.push({ label: 'Fechar' });
    dialog('📋 Quadro de Caça', 'Contratos de caça da cidade. Pode repetir quantas vezes quiser.', opts);
  }
  const CITY_N = { solmira: 'Vila de Solmira', kharum: 'Oásis de Kharum', cidadela: 'Cidadela do Cisma' };
  function travel(from) {
    const opts = Object.keys(BOARDS).filter(c => c !== from).map(c => P.warps[c]
      ? { label: `🧭 ${CITY_N[c]} — 50 cr`, fn: () => {
          if (P.zeny < 50) { log('Coroas insuficientes!', 'bad'); Audio8.sfx('miss'); return; }
          P.zeny -= 50; const b = BOARDS[c]; P.x = b.x + 2.5; P.z = b.z + 2.5; P.y = groundY(P.x, P.z); P.vy = 0;
          Audio8.sfx('buff'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0x80c0ff, 30, 4, 0.9); log(`🧭 Você viajou para <b>${CITY_N[c]}</b>.`, 'sys'); } }
      : { label: `🔒 ${CITY_N[c]} — visite o Quadro de lá uma vez`, fn: () => { travel(from); return true; } });
    opts.push({ label: '← Voltar', fn: () => { boardTalk(from); return true; } });
    dialog('🧭 Viagem rápida', 'A guilda de caçadores leva você até outra cidade cujo Quadro você já conhece.', opts);
  }
  function mark(n) {
    const toHere = Object.keys(S().act).map(id => byId[id]).filter(q => q && (q.to || q.giver) === n.name);
    const r = toHere.find(ready); if (r) return '?:' + colorOf(r);
    const o = Q.find(q => q.giver === n.name && available(q)); if (o) return '!:' + colorOf(o);
    if (toHere.length) return '!:#8a8a98';
    return null;
  }

  function onKill(m) {
    for (const id in S().act) { const q = byId[id]; if (!q) continue; const st = q.steps.find(s => s.kill === m.type); if (st) { const a = S().act[id]; a.k[m.type] = (a.k[m.type] || 0) + 1; if (ready(q) && !a.avisou) { a.avisou = 1; log(`${TYPE[q.type].dot} <b style="color:${colorOf(q)}">${q.title}</b>: objetivo cumprido! ${q.board ? 'Volte ao Quadro de Caça.' : 'Volte a ' + (q.to || q.giver) + '.'}`, 'gold'); } } }
  }
  // painel: até 3 missões, a principal primeiro
  // linha única: título + o que falta (para caber mais missões no canto da tela)
  function compact(q) {
    let tail;
    if (ready(q)) tail = '✅'; else if (!q.steps.length) tail = '💬';
    else { const i = Math.max(0, q.steps.findIndex((st, k) => prog(q, k) < need(st))); tail = `<b>${prog(q, i)}/${need(q.steps[i])}</b>`; }
    return `<div class="qi"><b style="color:${colorOf(q)}">${TYPE[q.type].dot} ${q.title}</b> ${tail}</div>`;
  }
  function html() {
    // principal primeiro, depois as mais novas (a última aceita aparece sempre); o resto vira "+N"
    const all = Object.keys(S().act).map(id => byId[id]).filter(Boolean), main = all.filter(q => q.type === 'principal'), rest = all.filter(q => q.type !== 'principal').reverse();
    const act = main.concat(rest).slice(0, 4), more = all.length - act.length;
    if (!act.length) return '';
    return `<div class="wt">📜 Missões</div><div class="wb">` + act.map(q => q.type !== 'principal' && act.length > 2 ? compact(q) : `<div class="qi"><b style="color:${colorOf(q)}">${TYPE[q.type].dot} ${q.title}</b><br>${ready(q) ? `✅ Volte a ${q.board ? 'o Quadro de Caça' : (q.to || q.giver)}` : q.steps.length ? q.steps.map((st, i) => `${stepTxt(st, i, q)} <b>${prog(q, i)}/${need(st)}</b>`).join('<br>') : `Fale com ${q.to || q.giver}`}</div>`).join('') + (more > 0 ? `<div class="qi qmore">+${more} ${more > 1 ? 'missões' : 'missão'} </div>` : '') + `</div>`;
  }
  // destino da seta: missão principal ativa (ou a primeira)
  function target() {
    const act = Object.keys(S().act).map(id => byId[id]).filter(Boolean);
    const q = act.find(q => q.type === 'principal') || act[0]; if (!q) return null;
    if (ready(q) || !q.steps.length) { if (q.board) return BOARDS[q.board]; const n = npcByName(q.to || q.giver); return n ? { x: n.x, z: n.z } : null; }
    const st = q.steps.find((s, i) => prog(q, i) < need(s));
    if (st && st.kill) { let best = null, bd = 1e9; for (const m of mobs) if (m.type === st.kill) { const d = Math.hypot(m.x - P.x, m.z - P.z); if (d < bd) { bd = d; best = m; } } if (best) return { x: best.x, z: best.z }; const sp = SPAWNS.find(s => s.type === st.kill); if (sp) return sp.at ? { x: sp.at.x, z: sp.at.z } : { x: (sp.area[0] + sp.area[1]) / 2, z: (sp.area[2] + sp.area[3]) / 2 }; if (['larva', 'verme', 'esfera', 'sentinela'].includes(st.kill)) return { x: TOWER.x, z: TOWER.z + 12 }; }
    if (st && st.item) { const src = Object.keys(MOBDEF).find(t => MOBDEF[t].drops.some(([id]) => id === st.item)); const m = src && mobs.find(o => o.type === src); if (m) return { x: m.x, z: m.z }; }
    if (st && st.reach === 'topo') return { x: TOWER.x, z: TOWER.z + 12 };
    return null;
  }

  // ---------------- mundo: quadros de caça, tesouros e NPCs escondidos
  const BOARDS = { solmira: { x: VIL.x - 9, z: VIL.z + 9 }, kharum: { x: OAS.x - 12, z: OAS.z - 18 }, cidadela: { x: CIT.x - 4, z: CIT.z - 6 } };
  const opened = () => (P.secrets = P.secrets || {});
  const glintMats = [];
  function build() {
    for (const [city, b] of Object.entries(BOARDS)) {
      const g = new THREE.Group(); g.position.set(b.x, groundY(b.x, b.z), b.z); g.rotation.y = Math.atan2(P.x - b.x, P.z - b.z) * 0; scene.add(g);
      const wood = PM('madeira.jpg', [0.3, 1], 0x8a6a50);
      [-0.9, 0.9].forEach(x => mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), wood, x, 1.1, 0, g));
      mesh(new THREE.BoxGeometry(2.1, 1.3, 0.12), PM('madeira.jpg', [1, 0.6], 0xa08060), 0, 1.6, 0, g);
      const paper = new THREE.MeshLambertMaterial({ color: 0xe8dcc0 });
      [[-0.5, 1.75], [0.1, 1.5], [0.55, 1.8]].forEach(([x, y]) => mesh(new THREE.BoxGeometry(0.42, 0.5, 0.02), paper, x, y, 0.08, g, false));
      const tag = bangSprite(); tag.material = tag.material.clone(); tag.material.map = markTex('!:#7dff9a'); tag.position.y = 2.9; g.add(tag);
      addOb(b.x, b.z, 1.1);
    }
    for (const s of SECRETS) {
      if (s.kind === 'bau') {
        const g = new THREE.Group(); g.position.set(s.x, groundY(s.x, s.z), s.z); scene.add(g); s.g = g;
        const box = mesh(new THREE.BoxGeometry(1.1, 0.7, 0.75), PM('madeira.jpg', [1, 0.5], 0x7a5a3a), 0, 0.35, 0, g);
        mesh(new THREE.BoxGeometry(1.15, 0.12, 0.8), new THREE.MeshLambertMaterial({ color: 0x4a3a20 }), 0, 0.72, 0, g);
        const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex('✦:#ffe8a0'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glint.scale.setScalar(0.6); glint.position.y = 1.2; g.add(glint); s.glint = glint;
        addOb(s.x, s.z, 0.7);
        if (s.id === 'b2') { const sw = mesh(new THREE.BoxGeometry(0.08, 1.4, 0.18), new THREE.MeshLambertMaterial({ color: 0x9aa0a8 }), 0.9, 0.7, 0, g); sw.rotation.z = 0.15; }
      } else {
        const n = { id: 'h_' + s.id, name: s.name, x: s.x, z: s.z, hidden: true };
        const g = new THREE.Group(); g.position.set(n.x, groundY(n.x, n.z), n.z); scene.add(g);
        const bang = bangSprite(); bang.position.y = 2.3; g.add(bang); n.bang = bang; n.g = g;
        addOb(n.x, n.z, 1.2); NPCS.push(n); NPC_SPR[n.name] = s.sprite;
      }
    }
  }
  function nearest() {
    for (const [city, b] of Object.entries(BOARDS)) if (Math.hypot(b.x - P.x, b.z - P.z) < 2.6) return { label: 'Ler o Quadro de Caça', fn: () => boardTalk(city) };
    for (const s of SECRETS) if (s.kind === 'bau' && !opened()[s.id] && Math.hypot(s.x - P.x, s.z - P.z) < 2.2) return { label: `Abrir: ${s.name}`, fn: () => openChest(s) };
    return null;
  }
  function openChest(s) {
    if (s.lv && P.lv < s.lv) { dialog(`🟣 ${s.name}`, `${s.msg}<br><br><small>Uma força estranha te repele. Volte no nível ${s.lv}.</small>`); return; }
    opened()[s.id] = 1;
    const r = s.rw; P.zeny += r.zeny || 0; const got = [];
    for (const [id, n] of Object.entries(r.items || {})) { P.inv[id] = (P.inv[id] || 0) + n; got.push(`${n}× ${ITEMS[id].ic} ${ITEMS[id].name}`); }
    Audio8.sfx('level'); burst(new THREE.Vector3(s.x, groundY(s.x, s.z) + 1, s.z), 0xffe8a0, 40, 4, 1.1); buildHotbar();
    if (s.glint) s.glint.visible = false;
    banner('🟣 Tesouro encontrado!');
    dialog(`🟣 ${s.name}`, `${s.msg}<br><br>Você encontrou: <b>${r.zeny} cr</b>${got.length ? ', ' + got.join(', ') : ''}.`);
    save();
  }
  let tAcc = 0;
  function update(dt) {
    tAcc += dt; if (tAcc < 0.4) return; tAcc = 0;
    for (const s of SECRETS) if (s.glint) s.glint.visible = !opened()[s.id] && Math.hypot(s.x - P.x, s.z - P.z) < 22;
    for (const id in S().act) { const q = byId[id]; if (!q) continue; if (q.steps.some(st => st.reach === 'topo') && inTower(P.z) && Tower.floor === 5 && !S().act[id].r) { S().act[id].r = 1; log(`🟡 Você chegou ao topo. Volte ao <b>${q.giver}</b>.`, 'gold'); } }
  }
  // saves antigos: converte a missão da Mestra Odete (P.quest) e já começa a próxima
  function migrate() {
    const s = S();
    if (P.quest !== undefined && !s.migrated) {
      const map = [[], ['p1'], ['p1', 'p2'], ['p1', 'p2', 'p3', 'p4'], ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'], ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']];
      for (const id of map[Math.min(6, P.quest || 0)]) s.done[id] = 1;
      s.migrated = 1;
    }
    if (!Object.keys(s.act).some(id => byId[id] && byId[id].type === 'principal')) { const nx = Q.find(q => q.type === 'principal' && available(q)); if (nx) s.act[nx.id] = { k: {} }; }
  }
  return { talk, boardTalk, mark, onKill, html, target, build, nearest, update, migrate, TYPE };
})();
Quests.build();
