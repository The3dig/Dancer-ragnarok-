// =====================================================================
//  Minha Jornada: o resumo de tudo que você já fez no jogo
//  (monstros, chefes, Torre, Abismo, missões, desafios, mascotes, tempo jogado)
// =====================================================================
'use strict';
const Jornada = (() => {
  const n = v => Math.round(v || 0).toLocaleString('pt-BR');
  function tempo(s) { s = Math.floor(s || 0); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m}min` : `${m}min`; }
  function abrir() {
    const b = P.bestiary || {}, tipos = Object.keys(b).filter(t => MOBDEF[t]);
    const total = tipos.reduce((a, t) => a + b[t], 0), chefes = tipos.filter(t => MOBDEF[t].boss || MOBDEF[t].mini).reduce((a, t) => a + b[t], 0);
    const top = tipos.sort((x, y) => b[y] - b[x]).slice(0, 5);
    const niv10 = Object.keys(P.bestCard || {}).length, qs = (P.qs && P.qs.done) || {}, missoes = Object.values(qs).reduce((a, v) => a + (v | 0), 0);
    const dsf = (P.dsf && P.dsf.feito) ? Object.keys(P.dsf.feito).length : 0, pets = Object.keys(P.pets || {}).length;
    const linha = (ic, t, v) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06)"><span>${ic} ${t}</span><b>${v}</b></div>`;
    const html = [
      linha('⏱️', 'Tempo jogado', tempo(P.tempo)),
      linha('⭐', 'Nível', `${P.lv}${P.tier ? ` · ${P.tier + 1}ª classe` : ''}`),
      linha('⚔️', 'Monstros derrotados', n(total)),
      linha('📖', 'Espécies diferentes', `${tipos.length}`),
      linha('☠️', 'Chefes e guardiões', n(chefes)),
      linha('🌟', 'Monstros Alfa', n(P.alfaKills)),
      linha('👹', 'Chefes de campo', n(P.fieldKills)),
      linha('🗼', 'Andar mais alto da Torre', P.towerBest != null ? `${P.towerBest + 1}º` : '—'),
      linha('🕳️', 'Andar mais fundo do Abismo', P.abismoBest != null ? `${P.abismoBest + 1}º` : '—'),
      linha('☠', 'Vitórias contra o Kravenox', n(P.kvxKills)),
      linha('🐛', 'Vitórias contra o Verme Colossal', n(P.vermeKills)),
      linha('📜', 'Missões concluídas', n(missoes)),
      linha('🏆', 'Desafios e etapas de amigos', n(dsf)),
      linha('🃏', 'Cartas do bestiário (nível 10)', n(niv10)),
      linha('🐾', 'Mascotes capturados', n(pets)),
      linha('💀', 'Vezes que desmaiou', n(P.mortes)),
    ].join('');
    const ranking = top.length ? `<br><b>Os que você mais caçou</b><br>${top.map((t, i) => `${['🥇', '🥈', '🥉', '4º', '5º'][i]} ${MOBDEF[t].name}: <b>${n(b[t])}</b>`).join('<br>')}` : '';
    dialog(`📜 Jornada de ${P.name}`, `<div style="font-size:14px">${html}</div>${ranking}<br><small>Os números contam desde que o jogo passou a guardar cada um (tempo jogado e desmaios começaram agora).</small>`, [{ label: '📖 Abrir o Bestiário', fn: () => { if (typeof Vida !== 'undefined') Vida.bestiary(); } }, { label: 'Fechar' }]);
  }
  let ult = 0;
  function update() { if (!running) return; const t = Date.now(); if (ult) P.tempo = (P.tempo || 0) + Math.min(5, (t - ult) / 1000); ult = t; }     // conta o tempo jogado (relógio de verdade; aba parada não conta)
  return { abrir, update };
})();
