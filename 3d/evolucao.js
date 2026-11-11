// =====================================================================
//  Evolução de classe: provações longas nos lugares mais difíceis
//  (Torre do Cisma, Ruínas). Quem entrega é o Vigia Morvan, na Cidadela.
// =====================================================================
'use strict';
const Evo = (() => {
  const Q = [null,
    { lv: 20, title: 'Provação da 2ª classe', need: [
      { kill: 'sentinela', n: 15, txt: 'Derrote 15 Sentinelas do Vazio (Torre do Cisma)' },
      { kill: 'guardiao', n: 1, txt: 'Derrote a Sentinela sem Rosto (Ruínas das Areias)' },
      { item: 'lasca', n: 5, txt: 'Traga 5 Lascas de Armadura' }] },
    { lv: 40, title: 'Provação da 3ª classe', need: [
      { kill: 'sentinela', n: 40, txt: 'Derrote 40 Sentinelas do Vazio' },
      { kill: 'esfera', n: 25, txt: 'Derrote 25 Fragmentos Errantes (Torre)' },
      { kill: 'guardiao', n: 3, txt: 'Derrote a Sentinela sem Rosto 3 vezes' },
      { item: 'essencia', n: 3, txt: 'Traga 3 Essências Negras' }] },
  ];
  const next = () => (P.tier || 0) + 1;
  const prog = r => r.kill ? Math.min(r.n, (P.evo.k[r.kill] || 0)) : Math.min(r.n, P.inv[r.item] || 0);
  const done = () => P.evo && Q[P.evo.t].need.every(r => prog(r) >= r.n);
  function onKill(m) { if (P.evo) { P.evo.k[m.type] = (P.evo.k[m.type] || 0) + 1; if (done() && !P.evo.avisou) { P.evo.avisou = 1; log('⚔️ Provação concluída! Volte ao <b>Vigia Morvan</b>, na Cidadela do Cisma.', 'gold'); } } }
  function html() {
    if (!P.evo) return '';
    const q = Q[P.evo.t];
    return `<div class="wt">⚔️ ${q.title}</div><div class="wb">${q.need.map(r => `${prog(r) >= r.n ? '✅' : '▫️'} ${r.txt} <b>${prog(r)}/${r.n}</b>`).join('<br>')}</div>`;
  }
  function mark() {
    const q = Q[next()]; if (!q) return '';
    if (P.evo) return done() ? '?:#c27aff' : '!:#8a7aa8';
    return P.lv >= q.lv ? '!:#c27aff' : '';
  }
  function talk(eu) {
    const t = next(), q = Q[t]; if (!q) return false;
    const names = TIERS[P.cls] || [];
    if (!P.evo) {
      if (P.lv < q.lv) return false;
      dialog('💬 Vigia Morvan', `${eu}, sinto a Essência crescer em você. Está na hora de deixar de ser apenas <b>${names[t - 1]}</b>.<br><br>
        Prove o seu valor e eu abro o caminho para a <b>${t + 1 === 2 ? '2ª' : '3ª'} classe: ${names[t]}</b>.<br><br>${q.need.map(r => '▫️ ' + r.txt).join('<br>')}
        <br><br><small>As novas habilidades já aparecem na sua árvore (📜) para você ler.</small>`,
        [{ label: 'Aceito a provação', fn: () => { P.evo = { t, k: {} }; log(`⚔️ <b>${q.title}</b> começou. Veja o progresso no canto da tela.`, 'gold'); save(); } }, { label: 'Agora não' }]);
      return true;
    }
    if (!done()) { dialog('💬 Vigia Morvan', `Ainda não, ${eu}.<br><br>${q.need.map(r => `${prog(r) >= r.n ? '✅' : '▫️'} ${r.txt} (${prog(r)}/${r.n})`).join('<br>')}`); return true; }
    dialog('💬 Vigia Morvan', `Você conseguiu, ${eu}. A Torre do Cisma reconhece a sua força.<br><br>Ajoelhe-se… e levante como <b>${names[t]}</b>.`, [{ label: `✨ Evoluir para ${names[t]}`, fn: () => evolve(t) }]);
    return true;
  }
  function evolve(t) {
    for (const r of Q[t].need) if (r.item) P.inv[r.item] -= r.n;
    P.tier = t; P.evo = null; P.statPts += 5; P.skillPts += 2;
    refreshSkills(); buildHotbar(); P.hp = stats.maxHp(); P.sp = stats.maxSp();
    const names = TIERS[P.cls];
    banner(`${t === 1 ? '2ª' : '3ª'} classe: ${names[t]}`); Audio8.sfx('level');
    for (let i = 0; i < 6; i++) setTimeout(() => ring(P.x, P.z, 1.5 + i * 1.2, 0xc27aff, 0.8), i * 110);
    burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0xffcf40, 70, 8, 1.4);
    log(`🌟 <b>${P.name}</b> evoluiu para <b>${names[t]}</b>! +5 pontos de atributo, +2 de habilidade e 2 habilidades novas na árvore (📜).`, 'gold');
    save();
  }
  return { onKill, html, mark, talk, get active() { return !!P.evo; } };
})();
