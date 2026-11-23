// =====================================================================
//  🏆 Ranking (ideia do Rone): o menor tempo e o maior dano de cada corrida,
//  em cada masmorra, no Templo, na Torre (do 1º andar ao topo) e no Abismo
//  (do 1º andar ao Fundo). O servidor guarda o melhor de cada personagem.
// =====================================================================
'use strict';
const Ranking = (() => {
  const NOMES = { minas: '⛏️ Mina da Forja', cripta: '🃏 Cripta das Cartas', templo: '🏛️ Templo do Eco Selado', torre: '🗼 Torre do Cisma (1º andar ao topo)', abismo: '🕳️ Abismo do Cisma (1º andar ao Fundo)' };
  let corrida = null;                                                    // { cat, t0, dano }
  const fmt = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}:${String(ss).padStart(2, '0')}`; };
  const num = n => Math.round(n).toLocaleString('pt-BR');

  function comecar(cat) { corrida = { cat, t0: Date.now(), dano: 0 }; }
  function dano(v) { if (corrida && v > 0) corrida.dano += v; }
  function cancelar(cat) { if (corrida && (!cat || corrida.cat === cat)) corrida = null; }
  const atual = () => corrida;
  async function terminar(cat) {
    if (!corrida || corrida.cat !== cat) return;
    if (typeof Tarefas !== 'undefined') Tarefas.evento('masmorra');
    const tempo = (Date.now() - corrida.t0) / 1000, d = corrida.dano; corrida = null;
    log(`🏆 <b>${NOMES[cat]}</b> concluída em <b>${fmt(tempo)}</b>, com <b>${num(d)}</b> de dano.`, 'gold');
    if (typeof Nuvem === 'undefined' || !Nuvem.logado) return;
    try {
      const r = await Nuvem.api('POST', '/conta/ranking/' + cat, { nome: P.name, vaga: typeof Contas !== 'undefined' ? Contas.slot : 0, tempo, dano: d });
      const pt = (r.tempo || []).findIndex(o => o.nome === P.name), pd = (r.dano || []).findIndex(o => o.nome === P.name);
      if (pt >= 0 || pd >= 0) log(`🏆 Você está no ranking: ${pt >= 0 ? `<b>${pt + 1}º em tempo</b>` : ''}${pt >= 0 && pd >= 0 ? ' e ' : ''}${pd >= 0 ? `<b>${pd + 1}º em dano</b>` : ''}!`, 'gold');
    } catch (e) { }
  }
  async function mostrar(cat, voltar) {
    let r = null;
    try { r = await Nuvem.api('GET', '/conta/ranking/' + cat); } catch (e) { }
    const lista = (l, f) => l && l.length ? l.map((o, i) => `${['🥇', '🥈', '🥉'][i] || `<b>${i + 1}º</b>`} ${o.nome} — <b>${f(o)}</b>`).join('<br>') : '<small>Ninguém ainda. Seja o primeiro!</small>';
    const txt = r ? `<div class="rk"><div><b>⏱️ Mais rápidos</b><br>${lista(r.tempo, o => fmt(o.tempo))}</div><div><b>💥 Mais dano</b><br>${lista(r.dano, o => num(o.dano))}</div></div>` : 'Não deu para buscar o ranking agora (sem internet?).';
    dialog(`🏆 Ranking: ${NOMES[cat]}`, txt, [...(voltar ? [{ label: '← Voltar', fn: () => { voltar(); return true; } }] : []), { label: 'Fechar' }]);
  }
  // placas de ranking (na porta da Torre e na boca da Cratera): toque/F perto para ver
  const PLACAS = [];
  function placa(x, z, cat, nome) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d');
    g.fillStyle = '#3a2a18'; g.fillRect(0, 0, 256, 160); g.strokeStyle = '#d8a840'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 152);
    g.fillStyle = '#ffd860'; g.font = 'bold 44px serif'; g.textAlign = 'center'; g.fillText('🏆', 128, 62); g.font = 'bold 26px Georgia'; g.fillText('RANKING', 128, 104); g.font = '18px Georgia'; g.fillStyle = '#f0e2c0'; g.fillText(nome, 128, 136);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    const y = groundY(x, z), gr = new THREE.Group(); gr.position.set(x, y, z); scene.add(gr);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false })); s.position.y = 1.7; gr.add(s);
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 0.14), new THREE.MeshLambertMaterial({ color: 0x5a3a24 })); poste.position.y = 0.7; gr.add(poste);
    gr.onBeforeRender = () => { }; s.onBeforeRender = () => { s.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z); };   // sempre de frente para a câmera
    addOb(x, z, 0.4); PLACAS.push({ x, z, cat, nome });
  }
  function nearest() { if (!running || inTower(P.z)) return null; for (const p of PLACAS) if (Math.hypot(P.x - p.x, P.z - p.z) < 2.4) return { label: `🏆 Ranking: ${p.nome}`, fn: () => mostrar(p.cat) }; return null; }
  // ---------------- ícones lá em cima: 🏆 Recordes (todos os rankings) e 🏰 Masmorras (todas as masmorras)
  const ORDEM = ['templo', 'cripta', 'minas', 'torre', 'abismo'];
  // 🏆 Recordes: já mostra os 5 primeiros de cada lugar (tempo e dano); tocar num lugar mostra os 10
  async function recordes() {
    const med = i => ['🥇', '🥈', '🥉'][i] || `<b>${i + 1}º</b>`;
    const top = (l, f) => l && l.length ? l.slice(0, 5).map((o, i) => `${med(i)} ${o.nome} <b>${f(o)}</b>`).join('<br>') : '<small>ninguém ainda</small>';
    dialog('🏆 Recordes', '<small>Buscando os recordes…</small>', [{ label: 'Fechar' }]);
    const rs = await Promise.all(ORDEM.map(c => Nuvem.api('GET', '/conta/ranking/' + c).catch(() => null)));
    if (!dialogOpen) return;                                             // fechou enquanto buscava
    const blocos = ORDEM.map((c, k) => { const r = rs[k]; return `<div class="rk-bloco"><b class="rk-t">${NOMES[c]}</b>${r ? `<div class="rk"><div><small>⏱️ Mais rápidos</small><br>${top(r.tempo, o => fmt(o.tempo))}</div><div><small>💥 Mais dano</small><br>${top(r.dano, o => num(o.dano))}</div></div>` : '<small>sem conexão</small>'}</div>`; }).join('');
    dialog('🏆 Recordes', `<small>Os 5 primeiros de cada lugar. Toque num lugar para ver os 10.</small>${blocos}`, [
      ...ORDEM.map(c => ({ label: NOMES[c], fn: () => { mostrar(c, recordes); return true; } })), { label: '⚔️ Arena (vitórias da temporada)', fn: () => { if (typeof Arena !== 'undefined') Arena.ranking(recordes); return true; } }, { label: 'Fechar' }]);
  }
  const npcPos = id => { const n = NPCS.find(o => o.id === id); return n ? { x: n.x, z: n.z + 2.5 } : null; };
  const MASM = () => {
    const sem = (m, lim) => m && m.restam ? `restam <b>${m.restam()} de ${lim}</b> esta semana` : '';
    return [
      { cat: 'templo', ic: '🏛️', quem: 'Estudiosa Ilka', nome: 'Templo do Eco Selado', onde: 'Estudiosa Ilka, ao sul da praça de Solmira', nivel: '30+', sem: sem(MASMORRAS.eco, 3), txt: 'Armadilhas e enigmas em 6 salas e o Guardião do Eco. Baú de ouro, prata ou bronze pelo tempo e pelas quedas. Sozinho ou em grupo.', pos: () => npcPos('templo') },
      { cat: 'cripta', ic: '🃏', quem: 'Cartomante Zaíra', nome: 'Cripta das Cartas', onde: 'Cartomante Zaíra, na tenda roxa a oeste da praça de Solmira', nivel: '30+', sem: sem(MASMORRAS.cripta, 2), txt: '3 ondas e o Guardião das Cartas em 8 minutos. 🧩 Fragmentos Arcanos e, raramente, uma Carta Arcana. Sozinho ou em grupo.', pos: () => npcPos('cartas') },
      { cat: 'minas', ic: '⛏️', quem: 'Ferreiro Doran', nome: 'Mina da Forja', onde: 'Ferreiro Doran, perto da praça de Solmira', nivel: 'qualquer', sem: sem(MASMORRAS.minas, 5), txt: '3 ondas e o Capataz em 8 minutos. 🔶 Minério, 🔷 Têmpera e 🔰 Selo da Forja para o refino. Sozinho ou em grupo.', pos: () => npcPos('smith') },
      { cat: 'torre', ic: '🗼', quem: 'a porta da Torre', nome: 'Torre do Cisma', onde: 'na Cidadela do Cisma (extremo leste)', nivel: '18 a 58', sem: 'sem limite', txt: '30 andares subindo, com guardiões a cada 5. No topo, o Kravenox acorda aos sábados, às 20h. 🔺 Fragmentos do Cisma para o Despertar.', pos: () => typeof Tower !== 'undefined' && Tower.door ? { x: Tower.door.x, z: Tower.door.z + 5 } : null },
      { cat: 'arena', ic: '⚔️', quem: 'Mestre Brakus', nome: 'Arena de Solmira', onde: 'Mestre Brakus, a leste da praça de Solmira', nivel: '15+', sem: 'sem limite', txt: 'PvP livre num coliseu, sem penalidade (morrer não tira XP nem itens). Cada vitória conta no placar da temporada (um mês).', pos: () => npcPos('arena') },
      { cat: 'forte', ic: '🏰', quem: 'Comandante Varek', nome: 'Guerra de Guildas', onde: 'Comandante Varek, ao sul da praça de Solmira', nivel: 'membro de guilda', sem: 'domingo, 18h às 19h', txt: 'A Fortaleza das Bandeiras: a guilda que causar mais dano no Coração da Fortaleza domina a semana inteira (+10% de XP e de drop para os membros).', pos: () => npcPos('guerra') },
      { cat: 'abismo', ic: '🕳️', quem: 'a boca da Cratera', nome: 'Abismo do Cisma', onde: 'na Cratera do Cisma, perto de Solmira', nivel: '58+', sem: 'sem limite', txt: '30 andares descendo, bem mais perigosos que a Torre. No Fundo, o Verme Colossal acorda de 15 em 15 dias. 🌑 Núcleos do Abismo.', pos: () => typeof LAIR !== 'undefined' ? { x: LAIR.x, z: LAIR.z + 8 } : null },
    ];
  };
  function masmorras() {
    const L = MASM();
    dialog('🏰 Masmorras', `Todas as masmorras do Reino. Toque numa para ver como funciona, ir até lá ou ver o ranking.${typeof Eventos !== 'undefined' ? `<br><small>⚡ Eventos: ${Eventos.resumo()}</small>` : ''}`, [
      ...L.map(m => ({ label: `${m.ic} ${m.nome} · nível ${m.nivel}${m.sem && m.sem !== 'sem limite' ? ' · ' + m.sem.replace(/<\/?b>/g, '') : ''}`, fn: () => { detalhe(m); return true; } })), { label: 'Fechar' }]);
  }
  function detalhe(m) {
    dialog(`${m.ic} ${m.nome}`, `${m.txt}<br><small>📍 ${m.onde} · nível ${m.nivel}${m.sem ? ' · ' + m.sem : ''}</small>`, [
      { label: '🧭 Ir até lá', fn: () => { const p = m.pos(); if (!p) return; P.qGo = { x: p.x, z: p.z, name: m.quem, qt: m.nome, qc: '#ffd860' }; $('quest').dataset.h = ''; log(`🧭 A seta leva até a <b>${m.nome}</b> (${m.onde}).`, 'sys'); if (typeof autoStart === 'function' && !inTower(P.z)) { if (AUTO.on) autoStop(''); autoStart(); } } },
      ...(m.cat === 'forte' ? [] : [{ label: m.cat === 'arena' ? '🏆 Placar da temporada' : '🏆 Ranking', fn: () => { if (m.cat === 'arena') { if (typeof Arena !== 'undefined') Arena.ranking(() => detalhe(m)); } else mostrar(m.cat, () => detalhe(m)); return true; } }]),
      { label: '← Voltar', fn: () => { masmorras(); return true; } }]);
  }
  function botoes() {
    const menu = $('menu'), antes = $('btn-help'); if (!menu || $('btn-recordes')) return;
    const b1 = document.createElement('button'); b1.id = 'btn-masmorras'; b1.title = 'Masmorras'; b1.textContent = '🏰'; b1.onclick = () => { Audio8.sfx('click'); masmorras(); }; menu.insertBefore(b1, antes);
    const b2 = document.createElement('button'); b2.id = 'btn-recordes'; b2.title = 'Recordes'; b2.textContent = '🏆'; b2.onclick = () => { Audio8.sfx('click'); recordes(); }; menu.insertBefore(b2, antes);
  }
  function init() {
    botoes();
    if (typeof Tower !== 'undefined' && Tower.door) placa(Tower.door.x + 5, Tower.door.z + 5, 'torre', 'Torre do Cisma');
    if (typeof LAIR !== 'undefined') placa(LAIR.x + 6, LAIR.z + 9, 'abismo', 'Abismo do Cisma');
  }
  return { comecar, dano, cancelar, terminar, mostrar, atual, nearest, init, NOMES, fmt, recordes, masmorras };
})();
