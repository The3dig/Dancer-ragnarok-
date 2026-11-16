// =====================================================================
//  Desafios: caçadas e entregas longas (300 de cada bicho, chefe 5 vezes,
//  centenas de materiais). Cada um dá um prêmio que SÓ vem daqui:
//  aura, rastro, mascote, título, cor do nome ou equipamento lendário.
//  Quatro mestres, um em cada cidade. Cada desafio vale uma vez por personagem.
//  A contagem de mortes começa com o que o personagem já matou (bestiário).
// =====================================================================
'use strict';
const Desafios = (() => {
  // ---------------- prêmios exclusivos
  const EQUIP = {
    // [nome, ícone, espaço, mods]
    colar_alfa: ['Colar do Caçador Alfa', '🦴', 'colar', { pow: 16, crit: 0.05, hp: 150 }],
    lamina_miragem: ['Lâmina da Miragem', '🌙', 'arma', { pow: 52, crit: 0.08, spd: 0.05 }],
    elmo_guardiao: ['Elmo do Guardião Eterno', '🪖', 'capacete', { def: 20, hp: 220, pow: 10 }],
    anel_algoz: ['Anel do Algoz do Soberano', '💍', 'anel', { pow: 22, crit: 0.07, sp: 60 }],
    armadura_cinzas: ['Armadura das Cinzas', '🔥', 'armadura', { def: 40, hp: 420, pow: 8 }],
    anel_valdora: ['Anel de Valdora Eterna', '💍', 'anel', { def: 10, hp: 180, sp: 40 }],
    coroa_raiz: ['Coroa da Primeira Raiz', '👑', 'capacete', { def: 26, hp: 280, pow: 14 }],
  };
  for (const [id, [name, ic, slot, mods]] of Object.entries(EQUIP))
    ITEMS[id] = { name, ic, kind: 'equip', slot, mods, rar: 3, price: 0, sell: 5000, desafio: true };
  const VIS = [   // [categoria, chave, nome, ícone, extra]
    ['aura', 'trigo', 'Aura do Trigo Dourado', '🌾', { c: [0xffd860, 0xc8a040] }],
    ['rastro', 'outono', 'Folhas de Outono', '🍂', { c: [0xe08030, 0xc04020], smoke: true }],
    ['titulo', 'flagelo', '« Flagelo dos Campos »', '🐛', {}],
    ['titulo', 'alfa', '« Caçador de Alfas »', '🦴', {}],
    ['aura', 'miragem', 'Aura da Miragem', '🏜️', { c: [0xffb070, 0x9ad8ff] }],
    ['aura', 'chefes', 'Aura Quebra-Chefes', '💥', { c: [0xffb040, 0xff6020] }],
    ['titulo', 'quebra', '« Quebra-Chefes »', '💥', {}],
    ['pet', 'rainha', 'Larva Rainha', '👑', { img: 'e_larvaMaeX', h: 0.8 }],
    ['aura', 'espinhos', 'Coroa de Espinhos', '🩸', { c: [0xff2020, 0x2a0008] }],
    ['titulo', 'algoz', '« Algoz do Soberano »', '☠️', {}],
    ['rastro', 'cisma', 'Chamas do Cisma', '🟣', { c: [0x9a40ff, 0xff40c0], spark: true }],
    ['aura', 'cinzas', 'Cinzas Vivas', '🌋', { c: [0xff6a20, 0x5a4a48] }],
    ['titulo', 'carrasco', '« Fim do Carrasco »', '🪓', {}],
    ['rastro', 'prata', 'Rastro de Prata', '⚪', { c: [0xd8dce8, 0xffffff], spark: true }],
    ['aura', 'ordem', 'Luz da Ordem', '🔹', { c: [0x7ad8ff, 0xffffff] }],
    ['titulo', 'lanca', '« Herdeiro da Lança »', '🔱', {}],
    ['rastro', 'raizes', 'Raízes Douradas', '✴️', { c: [0xffd060, 0xc8a050], spark: true }],
    ['titulo', 'memoria', '« Memória Viva »', '✴️', {}],
  ];
  const visNome = (c, k) => { const v = VIS.find(x => x[0] === c && x[1] === k); return v ? `${v[3]} ${v[2]}` : k; };

  // ---------------- os mestres e os desafios
  // pede: m = matar {tipo: n}; g = grupos {alfa|campo|guardiao|kravenox: n}; i = entregar itens {id: n}
  // dá: v = [[categoria, chave]], e = [equipamento]
  const MESTRES = {
    ivanna: { nome: 'Caçadora Ivanna', fala: 'Eu caço nestes campos desde antes do Cisma. Mostre que aguenta o serviço e eu te dou o que ninguém compra.', lista: [
      { id: 'd1', t: 'Praga dos Campos', pede: { m: { pompom: 300, zunzum: 300, fungolino: 300 } }, da: { v: [['aura', 'trigo'], ['titulo', 'flagelo']] } },
      { id: 'd2', t: 'Colheita Sombria', pede: { i: { gosma: 300, po_eco: 300, raiz: 300, nucleo_lumen: 3 } }, da: { v: [['rastro', 'outono']] } },
      { id: 'd3', t: 'O Grande Alfa', pede: { g: { alfa: 50 } }, da: { e: ['colar_alfa'], v: [['titulo', 'alfa']] } },
    ] },
    zahir: { nome: 'Rivas', fala: 'A areia guarda tudo, viajante. Até o que você ainda não conquistou.', lista: [
      { id: 'd4', t: 'Senhor das Dunas', pede: { m: { besouro: 300, serpe: 300 } }, da: { v: [['aura', 'miragem']] } },
      { id: 'd5', t: 'Lâmina da Miragem', pede: { i: { areia_rubra: 200, carapaca: 100, veu: 100, cristal_puro: 3, lagrima: 2 } }, da: { e: ['lamina_miragem'] } },
      { id: 'd6', t: 'Quebra-Chefes', pede: { g: { campo: 5 } }, da: { v: [['aura', 'chefes'], ['titulo', 'quebra']] } },
    ] },
    vex: { nome: 'Arauto Vex', fala: 'A Torre não perdoa. Quem sobe e desce trinta andares vezes sem conta merece ser lembrado.', lista: [
      { id: 'd7', t: 'Os Cinco da Torre', pede: { m: { larva: 300, verme: 300, esfera: 300, sentinela: 300 }, g: { guardiao: 30 } }, da: { e: ['elmo_guardiao'], v: [['pet', 'rainha']] } },
      { id: 'd8', t: 'Algoz do Soberano', pede: { g: { kravenox: 5 } }, da: { e: ['anel_algoz'], v: [['aura', 'espinhos'], ['titulo', 'algoz']] } },
      { id: 'd9', t: 'Essência do Cisma', pede: { i: { lasca: 300, essencia: 100, placa_vazio: 50, olho_vazio: 5 } }, da: { v: [['rastro', 'cisma']] } },
    ] },
    teodor: { nome: 'Andarilho Teodor', fala: 'Eu me perdi nesta floresta há tantos anos que ela parou de tentar me matar. Você ainda é interessante para ela.', lista: [
      { id: 'd13', t: 'Floresta em Silêncio', pede: { m: { larvaPernalta: 300, raizOssuda: 300, larvaCristal: 300, larvaAntiga: 300, memoria: 300 } }, da: { e: ['coroa_raiz'] } },
      { id: 'd14', t: 'Herdeiro da Lança', pede: { m: { guardiaoBranco: 5 } }, da: { v: [['aura', 'ordem'], ['titulo', 'lanca']] } },
      { id: 'd15', t: 'Memória Viva', pede: { i: { lembranca: 300, membrana: 200, fragmento_dourado: 10, coracao_floresta: 5 } }, da: { v: [['rastro', 'raizes'], ['titulo', 'memoria']] } },
    ] },
    brigida: { nome: 'Velha Brígida', fala: 'Eu vi Valdora inteira, antes de virar cinza. Traga o que restou dela e eu te conto como ela era.', lista: [
      { id: 'd10', t: 'Cinzas de Valdora', pede: { m: { raizNegra: 300, ecoCinza: 300, larvaCinza: 300, sentinelaMuralha: 300 } }, da: { e: ['armadura_cinzas'] } },
      { id: 'd11', t: 'O Fim do Carrasco', pede: { m: { carrasco: 5 } }, da: { v: [['aura', 'cinzas'], ['titulo', 'carrasco']] } },
      { id: 'd12', t: 'Memória de Valdora', pede: { i: { cinza: 300, fibra: 300, brasao: 50, aco_valdora: 5 } }, da: { e: ['anel_valdora'], v: [['rastro', 'prata']] } },
    ] },
  };
  const TODOS = Object.values(MESTRES).flatMap(M => M.lista.map(d => ({ ...d, mestre: M.nome })));
  for (const d of TODOS) for (const [c, k] of (d.da.v || [])) {
    const v = VIS.find(x => x[0] === c && x[1] === k);
    if (v && typeof Cos !== 'undefined' && Cos.exclusivo) Cos.exclusivo(c, k, v[2], v[3], { ...v[4], desafio: `${d.t} (${d.mestre})` });
  }
  const GRUPO = { alfa: 'monstros Alfa', campo: 'chefes de campo', guardiao: 'Guardiões da Torre', kravenox: 'Kravenox' };

  // ---------------- contagem
  function S() {
    if (P.dsf) return P.dsf;
    const b = P.bestiary || {}, k = { ...b }, g = { alfa: 0, campo: 0, guardiao: b.guardiao || 0, kravenox: P.kvxKills || 0 };
    for (const [t, n] of Object.entries(b)) { if (t.startsWith('alfa_')) g.alfa += n; else if (MOBDEF[t] && MOBDEF[t].field) g.campo += n; }
    return (P.dsf = { k, g, feito: {} });
  }
  function onKill(m) {
    const s = S(); s.k[m.type] = (s.k[m.type] || 0) + 1;
    if (m.d.alfa) s.g.alfa++;
    if (m.d.field) s.g.campo++;
    if (m.type === 'guardiao' || m.towerGuard) s.g.guardiao++;
    if (m.type === 'kravenox') s.g.kravenox++;
  }
  const nomeMob = t => (MOBDEF[t] && MOBDEF[t].name) || t;
  function linhas(d) {
    const s = S(), L = [];
    for (const [t, n] of Object.entries(d.pede.m || {})) L.push({ txt: `⚔️ ${nomeMob(t)}`, tem: Math.min(n, s.k[t] || 0), n });
    for (const [g, n] of Object.entries(d.pede.g || {})) L.push({ txt: `☠️ ${GRUPO[g]}`, tem: Math.min(n, s.g[g] || 0), n });
    for (const [id, n] of Object.entries(d.pede.i || {})) L.push({ txt: `${ITEMS[id] ? ITEMS[id].ic + ' ' + ITEMS[id].name : id} (entregar)`, tem: Math.min(n, P.inv[id] || 0), n });
    return L;
  }
  const pronto = d => linhas(d).every(l => l.tem >= l.n);
  const premioTxt = d => [...(d.da.e || []).map(id => `<b style="color:#ffb640">${ITEMS[id].ic} ${ITEMS[id].name}</b> <small>(lendário: ${Object.entries(ITEMS[id].mods).map(([k, v]) => `${{ pow: 'Dano', def: 'Defesa', hp: 'HP', sp: 'SP', crit: 'Crítico', spd: 'Velocidade' }[k]} +${['crit', 'spd'].includes(k) ? Math.round(v * 100) + '%' : v}`).join(', ')})</small>`),
    ...(d.da.v || []).map(([c, k]) => `<b>${visNome(c, k)}</b> <small>(${{ aura: 'aura', rastro: 'rastro', pet: 'mascote', titulo: 'título', cor: 'cor' }[c]})</small>`)].join('<br>');

  // ---------------- conversa
  function talk(n) {
    const M = MESTRES[n.dsf]; if (!M) return;
    const s = S();
    const opts = M.lista.map(d => {
      const ok = pronto(d), feito = s.feito[d.id];
      return { label: `${feito ? '✅' : ok ? '🏆' : '▫️'} ${d.t}${feito ? ' (concluído)' : ok ? ' — pronto para receber!' : ''}`, fn: () => { ver(n, d); return true; } };
    });
    opts.push({ label: 'Até mais' });
    dialog(`🏆 ${M.nome}`, `${M.fala}<br><small>Cada desafio vale uma vez. A contagem de mortes inclui o que você já caçou.</small>`, opts);
  }
  function ver(n, d) {
    const s = S(), feito = s.feito[d.id], L = linhas(d), ok = L.every(l => l.tem >= l.n);
    const prog = L.map(l => `${l.tem >= l.n ? '✅' : '▫️'} ${l.txt}: <b>${l.tem.toLocaleString('pt-BR')}</b> / ${l.n.toLocaleString('pt-BR')}`).join('<br>');
    const opts = [];
    if (!feito && ok) opts.push({ label: '🏆 Receber o prêmio', fn: () => { receber(d); return; } });
    opts.push({ label: '← Voltar', fn: () => { talk(n); return true; } });
    dialog(`🏆 ${d.t}`, `${prog}<br><br>🎁 Prêmio (só existe aqui):<br>${premioTxt(d)}${feito ? '<br><br>✅ <b>Você já concluiu este desafio.</b>' : ''}`, opts);
  }
  function receber(d) {
    const s = S(); if (s.feito[d.id] || !pronto(d)) return;
    for (const [id, n] of Object.entries(d.pede.i || {})) P.inv[id] -= n;
    for (const id of d.da.e || []) P.inv[id] = (P.inv[id] || 0) + 1;
    for (const [c, k] of d.da.v || []) if (typeof Cos !== 'undefined') Cos.ganhar(c, k);
    s.feito[d.id] = Date.now();
    banner('🏆 DESAFIO CONCLUÍDO 🏆'); Audio8.sfx('level');
    burst(new THREE.Vector3(P.x, P.y + 1.2, P.z), 0xffcf40, 60, 6, 1.2);
    log(`🏆 Desafio <b>${d.t}</b> concluído! Você ganhou:<br>${premioTxt(d)}<br><small>Visuais: 🛍️ Loja de Visuais. Equipamento: 🎒 mochila.</small>`, 'gold');
    save();
  }
  // marca acima da cabeça: ★ dourada quando algum desafio está pronto
  function mark(n) { const M = MESTRES[n.dsf]; if (!M) return ''; const s = S(); return M.lista.some(d => !s.feito[d.id] && pronto(d)) ? '★:#ffcf40' : '★:#7a7a88'; }
  // quem já tinha concluído um desafio recebe os visuais que mudaram (sem colocar em uso)
  function repor() { const s = S(); if (typeof Cos === 'undefined' || !Cos.dar) return; for (const d of TODOS) if (s.feito[d.id]) for (const [c, k] of d.da.v || []) if (!Cos.tem(c, k)) Cos.dar(c, k); }
  return { talk, mark, onKill, repor, MESTRES, S };
})();
