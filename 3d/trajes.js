// =====================================================================
//  👘 Trajes de classe (ideia do Rone: missões que dão visuais de classe)
//  e a marca da evolução. Cada herói tem 3 trajes, cada um com a sua missão:
//   🌅 Traje da Alvorada — derrote 1.000 monstros com esta classe e vença o Templo do Eco 2 vezes
//   🌑 Traje do Abismo   — chegue ao nível 60 e ao 15º andar do Abismo do Cisma
//   👑 Traje do Soberano — derrote o Kravenox ou o Verme Colossal
//  O traje é um brilho na cor dele por cima do personagem (todos veem).
//  Sem traje, quem já evoluiu ganha um brilho fraco na cor da própria classe (2ª e 3ª classe).
// =====================================================================
'use strict';
const Trajes = (() => {
  const S = () => (P.trajes = P.trajes || { kills: {}, eco: {}, ganhou: {}, usa: null });
  const TRAJES = [
    { id: 'alvorada', nome: 'Traje da Alvorada', ic: '🌅', cor: c => CLASSES[c] && CLASSES[c].colors ? clarear(CLASSES[c].colors.accent) : 0xffe0a0,
      req: c => [[`Derrote 1.000 monstros com ${nomeCl(c)}`, S().kills[c] || 0, 1000], [`Vença o Templo do Eco 2 vezes com ${nomeCl(c)}`, S().eco[c] || 0, 2]] },
    { id: 'abismo', nome: 'Traje do Abismo', ic: '🌑', cor: () => 0x9a40ff,
      req: () => [['Chegue ao nível 60', P.lv, 60], ['Chegue ao 15º andar do Abismo do Cisma', P.abismoBest || 0, 15]] },
    { id: 'soberano', nome: 'Traje do Soberano', ic: '👑', cor: () => 0xff3040,
      req: () => [['Derrote o Kravenox ou o Verme Colossal', (P.kvxKills || 0) + (P.vermeKills || 0), 1]] },
  ];
  function clarear(h) { const c = new THREE.Color(h); c.lerp(new THREE.Color(1, 1, 1), 0.35); return c.getHex(); }
  const nomeCl = c => (TIERS && TIERS[c] ? TIERS[c][0] : c);
  const chave = (c, id) => c + ':' + id;
  const pronto = (c, T) => T.req(c).every(([, v, n]) => v >= n);
  // contadores (com a classe atual)
  function kill() { const s = S(); s.kills[P.cls] = (s.kills[P.cls] || 0) + 1; verificar(); }
  function templo() { const s = S(); s.eco[P.cls] = (s.eco[P.cls] || 0) + 1; verificar(); }
  function verificar() {
    const s = S();
    for (const T of TRAJES) { const k = chave(P.cls, T.id); if (!s.ganhou[k] && pronto(P.cls, T)) { s.ganhou[k] = 1; banner(`${T.ic} ${T.nome}!`); Audio8.sfx('level'); log(`👘 Você ganhou o <b>${T.ic} ${T.nome}</b> de ${nomeCl(P.cls)}! Vista em 📅 Tarefas → 👘 Trajes.`, 'gold'); } }
  }
  // cor do brilho que vai no personagem: o traje vestido ou, sem traje, a marca da evolução
  function cor() {
    const s = S(); if (s.usa) { const T = TRAJES.find(t => t.id === s.usa); if (T && s.ganhou[chave(P.cls, T.id)]) return T.cor(P.cls); }
    return (P.tier || 0) >= 1 && CLASSES[P.cls] && CLASSES[P.cls].colors ? clarear(CLASSES[P.cls].colors.accent) : 0;
  }
  const forca = () => S().usa ? 0.26 : (P.tier || 0) >= 2 ? 0.16 : 0.09;
  function painel() {
    const s = S(), opts = TRAJES.map(T => {
      const k = chave(P.cls, T.id), tem = !!s.ganhou[k], veste = s.usa === T.id;
      const prog = T.req(P.cls).map(([t, v, n]) => `${v >= n ? '✅' : '▫️'} ${t} (${Math.min(v, n).toLocaleString('pt-BR')}/${n.toLocaleString('pt-BR')})`).join(' · ');
      return { label: `${T.ic} ${T.nome}${tem ? (veste ? ' — VESTIDO (toque para tirar)' : ' — toque para vestir') : ' 🔒'} · ${prog}`, fn: () => {
        if (!tem) { log(`👘 Ainda falta: ${prog}`, 'sys'); return true; }
        s.usa = veste ? null : T.id; Audio8.sfx('buff'); log(veste ? '👘 Traje guardado.' : `👘 Você vestiu o <b>${T.nome}</b>.`, 'sys'); try { save(); } catch (e) { } painel(); return true; } };
    });
    opts.push({ label: '← Tarefas', fn: () => { if (typeof Tarefas !== 'undefined') Tarefas.painel(); return true; } }, { label: 'Fechar' });
    dialog(`👘 Trajes de ${nomeCl(P.cls)}`, 'Cada traje é um brilho na cor dele, que todos veem. São ganhos com missões (cada classe tem os seus). Sem traje, quem já evoluiu de classe ganha um brilho fraco na cor da própria classe.', opts);
  }
  return { kill, templo, cor, forca, painel, verificar };
})();
