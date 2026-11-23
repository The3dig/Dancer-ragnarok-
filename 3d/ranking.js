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
  function init() {
    if (typeof Tower !== 'undefined' && Tower.door) placa(Tower.door.x + 5, Tower.door.z + 5, 'torre', 'Torre do Cisma');
    if (typeof LAIR !== 'undefined') placa(LAIR.x + 6, LAIR.z + 9, 'abismo', 'Abismo do Cisma');
  }
  return { comecar, dano, cancelar, terminar, mostrar, atual, nearest, init, NOMES, fmt };
})();
