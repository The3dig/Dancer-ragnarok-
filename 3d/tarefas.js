// =====================================================================
//  📅 Tarefas do dia e da semana (ideia do Rone: motivo para entrar todo dia,
//  mesmo com pouco tempo). 3 tarefas por dia e 1 por semana, sorteadas pela
//  data (todo mundo tem as mesmas). Completou: toque no 📅 e pegue o prêmio.
// =====================================================================
'use strict';
const Tarefas = (() => {
  const lv = () => Math.max(1, P.lv || 1);
  // tipos: mata (qualquer monstro), chefe (chefe/alfa/mini), masmorra (Mina, Cripta, Templo, Torre ou Abismo concluídos), dano
  const DIA = [
    { k: 'mata', n: () => 40, txt: n => `Derrote ${n} monstros` },
    { k: 'chefe', n: () => 3, txt: n => `Derrote ${n} chefes, alfas ou guardiões` },
    { k: 'masmorra', n: () => 1, txt: () => 'Conclua 1 masmorra (Mina, Cripta, Templo, Torre ou Abismo)' },
    { k: 'dano', n: () => Math.round(lv() * 1500 / 1000) * 1000, txt: n => `Cause ${n.toLocaleString('pt-BR')} de dano` },
    { k: 'mata', n: () => 70, txt: n => `Derrote ${n} monstros` },
  ];
  const SEMANA = [
    { k: 'mata', n: () => 400, txt: n => `Derrote ${n} monstros nesta semana` },
    { k: 'masmorra', n: () => 5, txt: n => `Conclua ${n} masmorras nesta semana` },
    { k: 'dano', n: () => Math.round(lv() * 20000 / 10000) * 10000, txt: n => `Cause ${n.toLocaleString('pt-BR')} de dano nesta semana` },
    { k: 'chefe', n: () => 20, txt: n => `Derrote ${n} chefes, alfas ou guardiões nesta semana` },
  ];
  const hoje = () => new Date().toLocaleDateString('pt-BR');
  const semana = () => Math.floor((Date.now() / 864e5 + 3) / 7);
  const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
  function estado() {
    const T = P.tarefas = P.tarefas || {};
    if (T.d !== hoje()) {                                                 // dia novo: 3 tarefas sorteadas pela data
      const h = hash(hoje()), idx = [0, 1, 2, 3, 4].sort((a, b) => hash(h + ':' + a) - hash(h + ':' + b)).slice(0, 3);
      T.d = hoje(); T.dia = idx.map(i => ({ i, n: DIA[i].n(), p: 0, pegou: false })); T.bonus = false;
    }
    if (T.w !== semana()) { const i = hash('s' + semana()) % SEMANA.length; T.w = semana(); T.sem = { i, n: SEMANA[i].n(), p: 0, pegou: false }; }
    return T;
  }
  function evento(k, v = 1) {
    if (!P || !running) return;
    const T = estado(), antes = prontas();
    for (const t of T.dia) if (DIA[t.i].k === k && t.p < t.n) t.p = Math.min(t.n, t.p + v);
    if (SEMANA[T.sem.i].k === k && T.sem.p < T.sem.n) T.sem.p = Math.min(T.sem.n, T.sem.p + v);
    const agora = prontas();
    if (agora > antes) { log(`📅 <b>Tarefa completa!</b> Toque no 📅 lá em cima para pegar o prêmio.`, 'gold'); Audio8.sfx('level'); }
    marcar();
  }
  const prontas = () => { const T = P.tarefas; if (!T || !T.dia) return 0; return T.dia.filter(t => t.p >= t.n && !t.pegou).length + (T.sem && T.sem.p >= T.sem.n && !T.sem.pegou ? 1 : 0) + (T.dia.every(t => t.pegou) && !T.bonus ? 1 : 0); };
  function marcar() { const b = $('btn-tarefas'); if (b) b.classList.toggle('alert', prontas() > 0); }
  function dar(itens) {
    const partes = [];
    for (const [k, q] of Object.entries(itens)) {
      if (k === 'cr') { P.zeny += q; partes.push(`${q.toLocaleString('pt-BR')} cr`); }
      else if (k === 'xp') { gainXp(q); partes.push(`${q.toLocaleString('pt-BR')} XP`); }
      else { P.inv[k] = (P.inv[k] || 0) + q; partes.push(`${q} ${ITEMS[k] ? ITEMS[k].ic + ' ' + ITEMS[k].name : k}`); }
    }
    Audio8.sfx('coin'); log(`🎁 Prêmio da tarefa: ${partes.join(', ')}.`, 'gold'); if (typeof buildHotbar === 'function') buildHotbar(); try { save(); } catch (e) { }
  }
  const xpBase = () => Math.round((typeof xpNeed === 'function' ? xpNeed(lv()) : 1000) * 0.04);
  const premioDia = () => ({ xp: xpBase(), cr: 300 * lv(), red: 5, blue: 3 });
  const premioBonus = () => ({ xp: xpBase() * 2, frag_cisma: 2, frag_carta: 4, cr: 600 * lv() });
  const premioSem = () => ({ xp: xpBase() * 6, frag_cisma: 6, nucleo_abismo: 2, frag_carta: 12, selo_forja: 1, cr: 3000 * lv() });
  function painel() {
    const T = estado(), opts = [];
    T.dia.forEach((t, j) => {
      const D = DIA[t.i], ok = t.p >= t.n;
      opts.push({ label: `${t.pegou ? '✅' : ok ? '🎁' : '▫️'} ${D.txt(t.n)} — ${Math.min(t.p, t.n).toLocaleString('pt-BR')}/${t.n.toLocaleString('pt-BR')}${ok && !t.pegou ? ' · PEGAR PRÊMIO' : ''}`, fn: () => { if (ok && !t.pegou) { t.pegou = true; dar(premioDia()); marcar(); } painel(); return true; } });
    });
    const todas = T.dia.every(t => t.pegou);
    opts.push({ label: `${T.bonus ? '✅' : todas ? '🎁' : '🔒'} Bônus por fazer as 3 do dia${todas && !T.bonus ? ' · PEGAR PRÊMIO' : ''}`, fn: () => { if (todas && !T.bonus) { T.bonus = true; dar(premioBonus()); marcar(); } painel(); return true; } });
    const S = SEMANA[T.sem.i], okS = T.sem.p >= T.sem.n;
    opts.push({ label: `${T.sem.pegou ? '✅' : okS ? '🎁' : '🗓️'} Semana: ${S.txt(T.sem.n)} — ${Math.min(T.sem.p, T.sem.n).toLocaleString('pt-BR')}/${T.sem.n.toLocaleString('pt-BR')}${okS && !T.sem.pegou ? ' · PEGAR PRÊMIO' : ''}`, fn: () => { if (okS && !T.sem.pegou) { T.sem.pegou = true; dar(premioSem()); marcar(); } painel(); return true; } });
    opts.push({ label: 'Fechar' });
    dialog('📅 Tarefas', `3 tarefas por dia (mudam à meia-noite) e 1 por semana (muda na segunda-feira). Fazendo as 3 do dia, tem <b>bônus</b>.<br><small>Dia: XP, coroas e poções · Bônus: fragmentos · Semana: 🔺 🌑 🧩 🔰 e muitas coroas.</small>`, opts);
  }
  function init() {
    if ($('btn-tarefas')) return;
    const b = document.createElement('button'); b.id = 'btn-tarefas'; b.title = 'Tarefas do dia'; b.textContent = '📅'; b.onclick = () => { Audio8.sfx('click'); painel(); };
    $('menu').insertBefore(b, $('btn-masmorras') || $('btn-help'));
    estado(); marcar(); setInterval(() => { if (running) { estado(); marcar(); } }, 30000);
  }
  return { evento, painel, init, prontas };
})();
