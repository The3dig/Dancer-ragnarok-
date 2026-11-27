// =====================================================================
//  Presença do mês (recompensa de login diário, como o calendário do Ragnarok)
//  - Cada dia em que você entra, recebe o prêmio do PRÓXIMO dia do calendário
//    (não precisa entrar todos os dias seguidos: dia perdido só não conta).
//  - Vale só até o fim do mês: no dia 1 começa um calendário novo, do zero.
//  - Os prêmios vão ficando melhores; nos dias 7, 14, 21 e 28 tem presente especial.
// =====================================================================
'use strict';
const Presenca = (() => {
  // [ícone, texto, função que entrega]
  const it = (id, n) => () => { P.inv[id] = (P.inv[id] || 0) + n; if (id === 'red' || id === 'blue') buildHotbar(); };
  const cr = n => () => { P.zeny += n; };
  const isca = n => () => { const ts = Object.keys(ITEMS).filter(k => k.startsWith('isca_') && MOBDEF[k.slice(5)] && !MOBDEF[k.slice(5)].boss); for (let i = 0; i < n; i++) { const k = ts[Math.floor(Math.random() * ts.length)]; P.inv[k] = (P.inv[k] || 0) + 1; log(`🪤 Veio a <b>${ITEMS[k].name}</b>.`, 'item'); } };
  const junto = (...fs) => () => fs.forEach(f => f());
  const PREMIOS = [
    ['🧪', '10 Poções Vermelhas', it('red', 10)], ['💰', '2.000 cr', cr(2000)], ['💧', '5 Poções Azuis', it('blue', 5)], ['🪰', '3 Asas de Mosca', it('asa_mosca', 3)],
    ['💰', '5.000 cr', cr(5000)], ['🦋', '2 Asas de Borboleta', it('asa_borboleta', 2)], ['🎁', 'Isca surpresa + Fragmento Dourado', junto(isca(1), it('fragmento_dourado', 1))],
    ['🧪', '20 Poções Vermelhas', it('red', 20)], ['💰', '8.000 cr', cr(8000)], ['💧', '10 Poções Azuis', it('blue', 10)], ['✴️', '1 Essência', it('essencia', 1)],
    ['💰', '10.000 cr', cr(10000)], ['🦋', '3 Asas de Borboleta', it('asa_borboleta', 3)], ['🎁', '2 Iscas surpresa + 2 Fragmentos', junto(isca(2), it('fragmento_dourado', 2))],
    ['🧪', '30 Poções Vermelhas', it('red', 30)], ['💰', '15.000 cr', cr(15000)], ['💧', '15 Poções Azuis', it('blue', 15)], ['✴️', '2 Essências', it('essencia', 2)],
    ['💰', '20.000 cr', cr(20000)], ['🦋', '5 Asas de Borboleta', it('asa_borboleta', 5)], ['🎁', '3 Iscas surpresa + 3 Fragmentos', junto(isca(3), it('fragmento_dourado', 3))],
    ['🧪', '40 Poções Vermelhas', it('red', 40)], ['💰', '25.000 cr', cr(25000)], ['💧', '20 Poções Azuis', it('blue', 20)], ['✴️', '3 Essências', it('essencia', 3)],
    ['💰', '30.000 cr', cr(30000)], ['🪰', '10 Asas de Mosca', it('asa_mosca', 10)], ['🏆', '50.000 cr + 4 Iscas surpresa + 5 Fragmentos', junto(cr(50000), isca(4), it('fragmento_dourado', 5))],
    ['🧪', '50 Poções Vermelhas', it('red', 50)], ['💧', '30 Poções Azuis', it('blue', 30)], ['💎', '60.000 cr + 5 Essências', junto(cr(60000), it('essencia', 5))],
  ];
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const hoje = () => { const d = new Date(); return { mes: `${d.getFullYear()}-${d.getMonth() + 1}`, dia: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, nDias: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), nomeMes: MESES[d.getMonth()], d };  };
  function S() {
    const h = hoje(); let s = P.presenca;
    if (!s || s.mes !== h.mes) s = P.presenca = { mes: h.mes, n: 0, ultimo: '' };      // mês novo: calendário novo
    return s;
  }
  const podeHoje = () => { const s = S(), h = hoje(); return s.ultimo !== h.dia && s.n < h.nDias; };
  function receber() {
    if (!podeHoje()) return;
    const s = S(), h = hoje(), [ic, txt, dar] = PREMIOS[s.n];
    dar(); s.n++; s.ultimo = h.dia;
    banner(`📅 PRESENÇA: DIA ${s.n}`); Audio8.sfx('level');
    log(`📅 Presença de ${h.nomeMes}, <b>dia ${s.n}</b>: você recebeu ${ic} <b>${txt}</b>!`, 'gold');
    if (typeof save === 'function') save();
    abrir(true);
  }
  function abrir(depois) {
    const s = S(), h = hoje(), pode = podeHoje();
    const grade = PREMIOS.slice(0, h.nDias).map(([ic, txt], i) => {
      const feito = i < s.n, agora = i === s.n && pode, esp = (i + 1) % 7 === 0;
      return `<div title="${txt}" style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:44px;height:50px;margin:2px;border-radius:8px;font:700 10px Nunito,sans-serif;
        background:${feito ? 'rgba(80,200,110,.25)' : agora ? 'rgba(255,207,64,.35)' : 'rgba(255,255,255,.06)'};border:1px solid ${agora ? '#ffcf40' : esp ? '#c890ff' : 'rgba(255,255,255,.12)'};${feito ? 'opacity:.75' : ''}">
        <span style="font-size:18px">${feito ? '✅' : ic}</span>${i + 1}</div>`;
    }).join('');
    const prox = PREMIOS[s.n];
    const msg = pode ? `Hoje você recebe o <b>dia ${s.n + 1}</b>: ${prox[0]} <b>${prox[1]}</b>.` : s.n >= h.nDias ? '🏆 Você completou o calendário deste mês!' : `✅ Você já recebeu o prêmio de hoje. Volte amanhã para o <b>dia ${s.n + 1}</b>: ${prox[0]} ${prox[1]}.`;
    const opts = pode ? [{ label: `🎁 Receber o dia ${s.n + 1}`, fn: () => { receber(); return true; } }, { label: 'Depois' }] : [{ label: 'Fechar' }];
    dialog(`📅 Presença de ${h.nomeMes}`, `${typeof Festas !== 'undefined' ? `<div style="margin-bottom:8px;padding:6px 8px;border:1px solid rgba(242,200,106,.4);border-radius:8px">🎉 ${Festas.resumo()}<br><small>Cada dia uma vila faz festa: ache os objetos da festa espalhados por ela.<br>${Festas.semana()}</small></div>` : ''}${msg}<br><small>Cada dia que você entra vale um prêmio do calendário (não precisa ser seguido). O calendário vale só até o fim do mês: no dia 1 começa outro, do zero. Dias 7, 14, 21 e 28 têm presente especial.</small><div style="margin-top:8px;text-align:center">${grade}</div>`, opts);
  }
  let mostrou = false, t = 0;
  function update(dt) {
    if (!running || mostrou) return; if (!t) t = Date.now(); if (Date.now() - t < 4000) return;                // depois de entrar no mundo, abre sozinho uma vez se tiver prêmio
    const av = document.getElementById('avisos'); if (dialogOpen || (av && !av.classList.contains('hidden') && av.style.display !== 'none')) return;   // espera o aviso de novidades fechar
    mostrou = true; if (podeHoje()) abrir();
  }
  return { abrir, update, podeHoje };
})();
