// =====================================================================
//  🔥 O Grande Ciclo — Renascimento (transclasse) e a 4ª classe (pedido do Rone, 27/11).
//  Criado para o jogo (não está no livro), inspirado na Fonte que "guardava a memória de todos":
//  quem chega ao nível 110 com a 3ª classe pode pedir ao Vigia Morvan, na Cidadela, a provação mais longa
//  do Reino. Ao terminar, a pessoa devolve tudo o que aprendeu à Fonte e RENASCE no nível 1:
//   - mantém a classe (e a 2ª/3ª), os itens, o equipamento, a casa e as coroas;
//   - atributos e habilidades voltam do zero (os pontos voltam aos poucos, subindo de nível);
//   - o XP passa a valer bem menos (40%): subir de novo é muito mais difícil;
//   - bônus para sempre: +15% de HP e SP, +10% de dano, +30 pontos de atributo, título, nome dourado e aura;
//   - ao chegar de novo no 110, desperta a 4ª CLASSE, com 5 habilidades novas.
// =====================================================================
'use strict';
const Renascer = (() => {
  const LV = 110, KILLS = 400, MINI = 20, MVP = 10, XP_MUL = 0.4, PTS = 30;
  // ---------------- 4ª classe: nome e as 5 habilidades de cada herói (tier 3)
  const QUARTA = { kravenox: 'Kravenox Renascido', thornox: 'Thornox Eterno', lyra: 'Memória Viva', seraphyne: 'Seraphyne do Ciclo', erya: 'Erya Renascida', mae: 'Mãe do Recomeço' };
  const P4 = (id, name, icon, lv, pas, desc) => ({ id, name, icon, tier: 3, lv, type: 'passiva', sp: 0, cd: 0, pas, desc });
  const SK4 = {
    kravenox: [
      P4('cicloVoraz', 'Ciclo Voraz', '♻️', 110, { atk: 0.04, roubo: 0.004 }, 'Passiva da 4ª classe: +4% de ataque e rouba 0,4% do dano, por nível.'),
      { id: 'abismoInterior', name: 'Abismo Interior', icon: '🕳️', tier: 3, lv: 112, sp: 90, cd: 14, type: 'nova', r: 9, mult: 7.5, stun: 2, fx: 'espinhos2', color: 0x8a0a1a, desc: 'O abismo que ele carrega abre em volta (750%, atordoa 2s).' },
      { id: 'garraDoCiclo', name: 'Garra do Ciclo', icon: '🐾', tier: 3, lv: 114, sp: 60, cd: 6, type: 'strike', mult: 3.2, hits: 3, heal: 0.08, color: 0xd01a2a, desc: 'Três garradas que bebem a vida (3× 320%, cura 8%).' },
      { id: 'renascerFera', name: 'Fera Renascida', icon: '🔥', tier: 3, lv: 117, sp: 80, cd: 60, type: 'buff', dur: 30, mods: { atk: 2.0, aspd: 1.5, crit: 0.2 }, fury: true, color: 0xff2030, desc: '30s: +100% de ataque, golpes 50% mais rápidos e +20% de crítico.' },
      { id: 'fimDoCiclo', name: 'Fim do Ciclo', icon: '🌋', tier: 3, lv: 120, sp: 150, cd: 30, type: 'blast', r: 10, mult: 12, stun: 3, fx: 'espinhos', color: 0xff3030, desc: 'Tudo o que ele foi cai de uma vez sobre os inimigos (1200%).' },
    ],
    thornox: [
      P4('luzEterna', 'Luz Eterna', '♻️', 110, { hp: 0.04, def: 3 }, 'Passiva da 4ª classe: +4% de HP e +3 de defesa, por nível.'),
      { id: 'solRenascido', name: 'Sol Renascido', icon: '🌞', tier: 3, lv: 112, sp: 90, cd: 14, type: 'nova', r: 9, mult: 7.0, magic: true, stun: 2, color: 0xffe080, desc: 'Um sol nasce do chão (700% em volta).' },
      { id: 'graçaDoCiclo', name: 'Graça do Ciclo', icon: '🕊️', tier: 3, lv: 114, sp: 70, cd: 16, type: 'heal', pct: 1.0, color: 0xfff2c0, desc: 'Cura todo o HP.' },
      { id: 'escudoEterno', name: 'Escudo Eterno', icon: '🛡️', tier: 3, lv: 117, sp: 80, cd: 60, type: 'buff', dur: 30, mods: { def: 120, matk: 1.4 }, heal: 0.4, color: 0xffe9a0, desc: '30s: +120 de defesa, +40% de magia e cura 40%.' },
      { id: 'juizoFinal', name: 'Juízo do Recomeço', icon: '☀️', tier: 3, lv: 120, sp: 150, cd: 30, type: 'blast', r: 10, mult: 11, magic: true, stun: 3, color: 0xffffff, desc: 'O céu se abre sobre os inimigos (1100%).' },
    ],
    lyra: [
      P4('memoriaViva', 'Memória Viva', '♻️', 110, { cura: 0.05, sp: 0.03 }, 'Passiva da 4ª classe: curas 5% mais fortes e +3% de SP, por nível.'),
      { id: 'coroDaFonte', name: 'Coro da Fonte', icon: '🎶', tier: 3, lv: 112, sp: 90, cd: 14, type: 'nova', r: 9, mult: 6.5, magic: true, heal: 0.3, color: 0xc8e0ff, desc: 'Todas as vozes da Fonte de uma vez (650% e cura 30%).' },
      { id: 'lembrancaPura', name: 'Lembrança Pura', icon: '💗', tier: 3, lv: 114, sp: 70, cd: 16, type: 'heal', pct: 1.0, color: 0xffc8e0, desc: 'Cura todo o HP.' },
      { id: 'cancaoEterna', name: 'Canção Eterna', icon: '🎵', tier: 3, lv: 117, sp: 80, cd: 60, type: 'buff', dur: 30, mods: { matk: 2.0, aspd: 1.4, regen: 0.03 }, color: 0xe8f0ff, desc: '30s: +100% de magia, ataques mais rápidos e regenera 3% do HP por segundo.' },
      { id: 'primeiraMemoria', name: 'A Primeira Memória', icon: '🌟', tier: 3, lv: 120, sp: 150, cd: 30, type: 'blast', r: 10, mult: 11, magic: true, stun: 4, color: 0xffffff, desc: 'A lembrança mais antiga de todas (1100%, prende 4s).' },
    ],
    seraphyne: [
      P4('vazioCiclico', 'Vazio Cíclico', '♻️', 110, { crit: 0.012, flee: 0.006 }, 'Passiva da 4ª classe: +1,2% de crítico e +0,6% de esquiva, por nível.'),
      { id: 'laminasDoCiclo', name: 'Lâminas do Ciclo', icon: '🗡️', tier: 3, lv: 112, sp: 60, cd: 4, type: 'bolt', mult: 4.5, magic: true, shots: 3, color: 0xb26bff, desc: 'Três lâminas de Vazio (3× 450%).' },
      { id: 'espelhoInfinito', name: 'Espelho Infinito', icon: '🔮', tier: 3, lv: 114, sp: 90, cd: 14, type: 'nova', r: 9, mult: 7.0, magic: true, stun: 2, color: 0x6a2aa0, desc: 'Mil reflexos da criatura a devoram (700%).' },
      { id: 'asasRenascidas', name: 'Asas Renascidas', icon: '🦋', tier: 3, lv: 117, sp: 80, cd: 60, type: 'buff', dur: 30, mods: { matk: 1.9, speed: 1.4, crit: 0.25 }, color: 0xb8a0ff, desc: '30s: +90% de magia, +40% de velocidade e +25% de crítico.' },
      { id: 'apagarTudo', name: 'Apagar o Ciclo', icon: '⚫', tier: 3, lv: 120, sp: 150, cd: 30, type: 'blast', r: 11, mult: 12, magic: true, color: 0x1a0a2a, desc: 'Apaga tudo em volta, até a lembrança (1200%).' },
    ],
    erya: [
      P4('escolhaEterna', 'Escolha Eterna', '♻️', 110, { atk: 0.03, aspd: 0.02 }, 'Passiva da 4ª classe: +3% de ataque e +2% de velocidade de golpe, por nível.'),
      { id: 'quintaDanca', name: 'Dança Renascida', icon: '💃', tier: 3, lv: 112, sp: 80, cd: 12, type: 'nova', r: 9, mult: 7.0, stun: 2, color: 0x7dffb0, desc: 'Uma dança que corta tudo em volta (700%).' },
      { id: 'flechaDoCiclo', name: 'Flecha do Ciclo', icon: '🏹', tier: 3, lv: 114, sp: 60, cd: 4, type: 'bolt', mult: 4.5, shots: 3, color: 0x9affd0, desc: 'Três flechas que nunca erram (3× 450%).' },
      { id: 'marcaLivre', name: 'Marca Livre', icon: '✨', tier: 3, lv: 117, sp: 80, cd: 60, type: 'buff', dur: 30, mods: { atk: 1.8, speed: 1.4, flee: 0.15 }, color: 0xb8ffd8, desc: '30s: +80% de ataque, +40% de velocidade e +15% de esquiva.' },
      { id: 'escolhaFinal', name: 'A Escolha Final', icon: '🌿', tier: 3, lv: 120, sp: 150, cd: 30, type: 'blast', r: 10, mult: 11.5, stun: 3, color: 0x6affa0, desc: 'O que ela escolheu ser cai sobre os inimigos (1150%).' },
    ],
    mae: [
      P4('amorQueVolta', 'Amor que Volta', '♻️', 110, { hp: 0.03, def: 2, cura: 0.03 }, 'Passiva da 4ª classe: +3% de HP, +2 de defesa e curas 3% mais fortes, por nível.'),
      { id: 'laminaDoRecomeco', name: 'Lâmina do Recomeço', icon: '⚔️', tier: 3, lv: 112, sp: 60, cd: 6, type: 'strike', mult: 3.4, hits: 3, color: 0xe0d0ff, desc: 'Três cortes de Auren (3× 340%).' },
      { id: 'abracoEterno', name: 'Abraço Eterno', icon: '🤍', tier: 3, lv: 114, sp: 70, cd: 16, type: 'heal', pct: 1.0, color: 0xfff0f0, desc: 'Cura todo o HP.' },
      { id: 'guardiaEterna', name: 'Guardiã Eterna', icon: '🛡️', tier: 3, lv: 117, sp: 80, cd: 60, type: 'buff', dur: 30, mods: { def: 100, atk: 1.5 }, heal: 0.4, color: 0xe8e0ff, desc: '30s: +100 de defesa, +50% de ataque e cura 40%.' },
      { id: 'entreMundos', name: 'Entre os Mundos', icon: '🌀', tier: 3, lv: 120, sp: 150, cd: 30, type: 'blast', r: 10, mult: 11.5, stun: 3, color: 0xc8b0ff, desc: 'Ela abre o Entre sobre os inimigos (1150%).' },
    ],
  };
  // a 1ª habilidade de cada lista é a passiva; para chegar nas 5 são 4 ativas + 1 passiva... a 5ª ativa é o "Eco do Ciclo", igual para todos
  const ECO = { id: 'ecoDoCiclo', name: 'Eco do Ciclo', icon: '♾️', tier: 3, lv: 110, sp: 50, cd: 120, type: 'heal', pct: 0.5, color: 0xffd860, desc: 'Comum a todos os Renascidos: volta 50% do HP e os golpes da próxima luta lembram quem você foi.' };
  for (const [k, l] of Object.entries(SK4)) { if (typeof TIERS !== 'undefined' && TIERS[k]) TIERS[k][3] = QUARTA[k]; if (typeof EXTRA_SKILLS !== 'undefined') (EXTRA_SKILLS[k] = EXTRA_SKILLS[k] || []).push(...l, { ...ECO }); }

  // ---------------- a provação: os bichos de nível 60 a 110, 20 mini-chefes e 10 MVPs
  let ALVOS = null;
  function alvos() {
    if (ALVOS) return ALVOS;
    const vistos = new Set(), l = [];
    for (const sp of SPAWNS) { const D = MOBDEF[sp.type]; if (!D || vistos.has(sp.type) || D.boss || D.mini || D.alfa || D.field || D.world || D.lv < 60 || D.lv > 110 || !sp.area) continue; vistos.add(sp.type); l.push(sp.type); }
    l.sort((a, b) => MOBDEF[a].lv - MOBDEF[b].lv);
    const n = Math.min(10, l.length), pick = []; for (let i = 0; i < n; i++) pick.push(l[Math.round(i * (l.length - 1) / Math.max(1, n - 1))]);
    return (ALVOS = [...new Set(pick)]);
  }
  const C = () => P.ciclo;
  const ehMvp = m => m.d && m.d.boss && !m.d.mini, ehMini = m => m.d && m.d.mini && !m.boneco;
  function prog() {
    const c = C(); if (!c) return null;
    const l = alvos().map(t => ({ t, nome: MOBDEF[t].name, lv: MOBDEF[t].lv, n: Math.min(KILLS, c.k[t] || 0) }));
    return { l, mini: Math.min(MINI, c.mini || 0), mvp: Math.min(MVP, c.mvp || 0), pronto: l.every(x => x.n >= KILLS) && (c.mini || 0) >= MINI && (c.mvp || 0) >= MVP };
  }
  function onKill(m) {
    const c = C(); if (!c || !m || !m.d) return;
    if (ehMvp(m)) c.mvp = (c.mvp || 0) + 1; else if (ehMini(m)) c.mini = (c.mini || 0) + 1;
    else if (alvos().includes(m.type)) { const v = (c.k[m.type] || 0) + 1; c.k[m.type] = v; if (v === KILLS) log(`🔥 O Grande Ciclo: <b>${KILLS} ${m.d.name}</b> completos!`, 'gold'); }
    const p = prog(); if (p && p.pronto && !c.avisou) { c.avisou = 1; banner('🔥 O GRANDE CICLO ESTÁ COMPLETO'); log('🔥 <b>O Grande Ciclo</b> está completo! Volte ao <b>Vigia Morvan</b>, na Cidadela, para renascer.', 'gold'); Audio8.sfx('level'); }
  }
  const lista = p => `${p.l.map(x => `${x.n >= KILLS ? '✅' : '▫️'} ${x.nome} <small>(Nv ${x.lv})</small> <b>${x.n}/${KILLS}</b>`).join('<br>')}<br>${p.mini >= MINI ? '✅' : '▫️'} Mini-chefes (qualquer um) <b>${p.mini}/${MINI}</b><br>${p.mvp >= MVP ? '✅' : '▫️'} MVPs de verdade (chefes do mapa e de campo) <b>${p.mvp}/${MVP}</b>`;
  // ---------------- conversa com o Vigia Morvan
  function talk(eu) {
    if (P.renasceu) {
      if (P.lv >= LV && (P.tier || 0) < 3) { dialog('💬 Vigia Morvan', `${eu}… você subiu de novo até o topo, mesmo com a Fonte cobrando o dobro de cada passo. Pouquíssimos conseguem.<br><br>Está na hora de despertar a <b>4ª classe: ${QUARTA[P.cls] || 'Renascido'}</b>.`, [{ label: `✨ Despertar: ${QUARTA[P.cls]}`, fn: () => quarta() }, { label: 'Agora não' }]); return true; }
      dialog('💬 Vigia Morvan', `${eu}, você é um dos <b>Renascidos</b>. ${P.lv < LV ? `Quando chegar de novo ao <b>nível ${LV}</b>, venha: vou despertar a <b>4ª classe (${QUARTA[P.cls]})</b>, com 5 habilidades que ninguém mais tem.` : 'A 4ª classe já é sua. Poucos no Reino carregam essa marca.'}`); return true;
    }
    if ((P.tier || 0) < 2) return false;
    if (P.lv < LV) { dialog('💬 Vigia Morvan', `${eu}, existe uma provação além da 3ª classe: <b>O Grande Ciclo</b>. Ela só se abre no <b>nível ${LV}</b>. Quem completa devolve tudo à Fonte e <b>renasce</b>, mais forte do que antes.`); return true; }
    if (!C()) {
      dialog('💬 Vigia Morvan', `${eu}, você chegou ao topo. A Fonte guarda a memória de todos… e pode devolver a sua, inteira, desde o primeiro passo.<br><br><b>🔥 O Grande Ciclo</b> é a provação mais longa do Reino:<br>${lista(prog() || { l: alvos().map(t => ({ nome: MOBDEF[t].name, lv: MOBDEF[t].lv, n: 0 })), mini: 0, mvp: 0 })}<br><br>Quando terminar, você <b>renasce no nível 1</b>: guarda a classe, os itens e as coroas; os atributos e as habilidades voltam do zero e o <b>XP passa a valer só 40%</b>. Em troca, para sempre: <b>+15% de HP e SP, +10% de dano, +${PTS} pontos de atributo</b>, nome dourado, aura e o título <b>« Renascido do Ciclo »</b>. E no nível ${LV} de novo: a <b>4ª classe</b>, com <b>5 habilidades novas</b>.`,
        [{ label: '🔥 Aceito O Grande Ciclo', fn: () => { P.ciclo = { k: {}, mini: 0, mvp: 0 }; log('🔥 <b>O Grande Ciclo</b> começou. O progresso aparece no canto da tela (toque para ver tudo).', 'gold'); banner('🔥 O GRANDE CICLO'); try { save(); } catch (e) { } } }, { label: 'Agora não' }]);
      return true;
    }
    const p = prog();
    if (!p.pronto) { dialog('💬 Vigia Morvan', `Ainda não, ${eu}. O Ciclo cobra tudo:<br><br>${lista(p)}`); return true; }
    dialog('💬 Vigia Morvan', `Você completou O Grande Ciclo, ${eu}. Agora vem a parte mais difícil: <b>soltar</b>.<br><br>Você volta ao <b>nível 1</b>, com os atributos e as habilidades do começo, e cada XP vale 40%. Fica com a classe, os itens, a casa e as coroas. Tem certeza?`,
      [{ label: '🔥 Renascer', fn: () => { renascer(); } }, { label: 'Ainda não estou pronto' }]);
    return true;
  }
  // ---------------- o renascimento (com a cena: a câmera gira, a luz sobe, a tela apaga e volta)
  function renascer() {
    if (!C() || !prog().pronto) return;
    cena(() => {
      P.renasceu = (P.renasceu || 0) + 1; P.ciclo = null;
      P.lv = 1; P.xp = 0; P.str = P.agi = P.vit = P.int = P.dex = P.luk = 3;
      P.ptsRen = (P.ptsRen || 0) + PTS; P.statPts = ptsTotais(1, P.tier) + (P.ptsExtra || 0) + P.ptsRen; P.statV = 2;
      refreshSkills(); P.skillLv = { [SKILLS[0].id]: 1 }; P.skillPts = 0; buildHotbar();
      P.title = P.renasceu > 1 ? `Renascido do Ciclo ${['', 'I', 'II', 'III', 'IV', 'V'][Math.min(5, P.renasceu)] || P.renasceu}` : 'Renascido do Ciclo';
      P.hp = stats.maxHp(); P.sp = stats.maxSp();
      log(`🔥 <b>${P.name}</b> renasceu! Nível 1, com <b>+${PTS} pontos de atributo</b> para distribuir (📊), +15% de HP e SP e +10% de dano para sempre. O XP agora vale 40%. No nível ${LV}: a 4ª classe.`, 'gold');
      if (typeof Anuncio !== 'undefined' && Anuncio.global) Anuncio.global({ ic: '🔥', cor: 'ouro', tag: 'RENASCIMENTO', titulo: `${P.name} renasceu!`, sub: 'Completou O Grande Ciclo e voltou ao nível 1, mais forte para sempre.', seg: 10 });
      try { save(); } catch (e) { }
    });
  }
  function quarta() {
    P.tier = 3; refreshSkills(); buildHotbar(); P.ptsRen = (P.ptsRen || 0) + 10; P.statPts += 10; P.skillPts += 5; P.hp = stats.maxHp(); P.sp = stats.maxSp();
    cena(() => {
      log(`🌟 <b>${P.name}</b> despertou a <b>4ª classe: ${QUARTA[P.cls]}</b>! 5 habilidades novas na árvore (📜), +10 pontos de atributo e +5 de habilidade.`, 'gold');
      if (typeof Anuncio !== 'undefined' && Anuncio.global) Anuncio.global({ ic: '🌟', cor: 'ouro', tag: '4ª CLASSE', titulo: `${P.name} virou ${QUARTA[P.cls]}!`, sub: 'Renasceu, subiu tudo de novo e despertou a 4ª classe.', seg: 10 });
      try { save(); } catch (e) { }
    }, `✨ ${String(QUARTA[P.cls]).toUpperCase()} ✨`);
  }
  // cena de ~9 s: tela escurece, câmera gira em volta, pilar de luz, frases, clarão branco, recomeço
  let cenaOn = false;
  function cena(fim, tituloFinal) {
    if (cenaOn) return; cenaOn = true; closeDialog();
    const cor = 0xffc860, ov = document.createElement('div');
    ov.id = 'renascer-cena'; ov.innerHTML = '<div class="rc-txt"></div>'; document.body.appendChild(ov);
    const txt = ov.querySelector('.rc-txt'), frases = tituloFinal ? ['O Ciclo reconhece você.', 'Tudo o que você foi…', '…desperta de uma vez.', tituloFinal] : ['A Fonte guarda a memória de todos.', 'Tudo o que você foi…', '…volta para ela.', 'E o Ciclo recomeça.', '🔥 RENASCIDO 🔥'];
    const yaw0 = camS.yaw, d0 = camS.dist, p0 = camS.pitch, ini = performance.now(); let t = 0, k = 0, pilar = false;
    document.body.classList.add('em-cena');
    Audio8.sfx('boom'); if (typeof TREMOR !== 'undefined') TREMOR = Math.max(TREMOR, 0.8);
    if (typeof VFX !== 'undefined') { VFX.rune(P.x, P.z, 7, cor, 9); VFX.rune(P.x, P.z, 4, 0xffffff, 9); }
    const iv = setInterval(() => {
      t = (performance.now() - ini) / 1000; camS.yaw = yaw0 + t * 0.55; camS.dist = Math.max(5, d0 - t * 0.5); camS.pitch = p0 + Math.sin(t * 0.6) * 0.15;
      const fi = Math.floor(t / 1.7); if (fi !== k && fi < frases.length) { k = fi; txt.classList.remove('on'); setTimeout(() => { txt.textContent = frases[fi]; txt.classList.add('on'); }, 150); Audio8.sfx(fi === frases.length - 1 ? 'level' : 'buff'); if (typeof VFX !== 'undefined') VFX.wave(P.x, P.z, 3 + fi * 2, cor, 0.9); }
      if (Math.random() < 0.5) burst(new THREE.Vector3(P.x + rand(-2, 2), P.y + rand(0, 3), P.z + rand(-2, 2)), Math.random() < 0.5 ? cor : 0xffffff, 3, 2, 0.8);
      if (!pilar && t > 0.3 && typeof VFX !== 'undefined') { pilar = true; VFX.pillar(P.x, P.z, 2.6, 22, cor, 8.5, true, 1); }
      if (Math.random() < 0.08 && typeof VFX !== 'undefined') VFX.wave(P.x, P.z, 2 + Math.random() * 5, cor, 0.6);
    }, 50);
    txt.textContent = frases[0]; setTimeout(() => txt.classList.add('on'), 50); ov.classList.add('on');
    const total = frases.length * 1.7 * 1000 + 400;
    setTimeout(() => { ov.classList.add('branco'); Audio8.sfx('level'); }, total - 900);
    setTimeout(() => {
      clearInterval(iv); camS.yaw = yaw0; camS.dist = d0; camS.pitch = p0;
      try { fim(); } catch (e) { console.warn(e); }
      for (let i = 0; i < 6; i++) setTimeout(() => ring(P.x, P.z, 1.5 + i * 1.4, cor, 0.9), i * 110);
      burst(new THREE.Vector3(P.x, P.y + 1, P.z), cor, 90, 9, 1.5);
      banner(tituloFinal || '🔥 RENASCIDO 🔥');
      ov.classList.remove('on'); document.body.classList.remove('em-cena'); setTimeout(() => { ov.remove(); cenaOn = false; }, 1600);
    }, total);
  }
  // ---------------- bônus de quem renasceu
  function bonus(k) { if (!P.renasceu) return 0; return { hp: 0.15, sp: 0.15, dano: 0.10 }[k] || 0; }
  const xpMul = () => P.renasceu ? XP_MUL : 1;
  // aura dourada girando no chão de quem renasceu (só a sua; os outros veem pelo nome dourado e o título)
  let aura = null;
  setInterval(() => {
    if (typeof running === 'undefined' || !running || typeof scene === 'undefined') return;
    if (P.renasceu && !aura) { aura = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 40), new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); aura.rotation.x = -Math.PI / 2; scene.add(aura); }
    if (aura) { aura.visible = !!P.renasceu && !P.dead; aura.position.set(P.x, (P.y || 0) + 0.06, P.z); aura.rotation.z += 0.05; aura.material.opacity = 0.45 + Math.sin(Date.now() / 300) * 0.15; }
  }, 33);
  // ---------------- encaixa no Vigia Morvan e no quadro de evolução (evolucao.js)
  if (typeof Evo !== 'undefined') {
    const t0 = Evo.talk, c0 = Evo.card, g0 = Evo.target, k0 = Evo.onKill;
    Evo.talk = eu => t0(eu) || talk(eu);
    Evo.onKill = m => { k0(m); onKill(m); };
    Evo.card = () => {
      const c = c0(); if (c) return c;
      if (P.renasceu && P.lv >= LV && (P.tier || 0) < 3) return { txt: `🌟 Você pode despertar a <b>4ª classe: ${QUARTA[P.cls]}</b>! Toque para ir até o Vigia Morvan`, mini: `Despertar a 4ª classe`, k: 'go' };
      if (P.renasceu || (P.tier || 0) < 2 || P.lv < LV) return null;
      if (!C()) return { txt: '🔥 <b>O Grande Ciclo</b> está aberto para você! Toque para ir até o Vigia Morvan', mini: 'O Grande Ciclo', k: 'go' };
      const p = prog(); if (p.pronto) return { txt: '🔥 O Grande Ciclo está completo! Toque para voltar ao Vigia Morvan e <b>renascer</b>', mini: 'Pronto para renascer!', k: 'done' };
      const x = p.l.find(x => x.n < KILLS);
      return x ? { txt: `🔥 O Grande Ciclo: ${x.nome} <b>${x.n}/${KILLS}</b> · mini-chefes ${p.mini}/${MINI} · MVPs ${p.mvp}/${MVP} · toque para ir`, mini: `${x.nome} <b>${x.n}/${KILLS}</b>`, k: 'hunt', ciclo: x.t }
        : { txt: `🔥 O Grande Ciclo: mini-chefes <b>${p.mini}/${MINI}</b> · MVPs <b>${p.mvp}/${MVP}</b> · abra 👑 para ver onde estão`, mini: `Chefes ${p.mini}/${MINI} · MVPs ${p.mvp}/${MVP}`, k: 'hunt', chefes: true };
    };
    Evo.target = () => {
      const c = Evo.card(); if (!c) return null;
      if (c.k === 'go' || c.k === 'done') { const n = NPCS.find(n => n.id === 'watch'); return { x: n.x, z: n.z, name: 'Vigia Morvan' }; }
      if (c.ciclo) { const sp = SPAWNS.find(s => s.type === c.ciclo && s.area); if (sp) return { x: (sp.area[0] + sp.area[1]) / 2, z: (sp.area[2] + sp.area[3]) / 2, name: MOBDEF[c.ciclo].name }; }
      if (c.chefes) { if (typeof MVP !== 'undefined') MVP.abrir(); return null; }
      return g0();
    };
  }
  return { talk, onKill, prog, bonus, xpMul, alvos, renascer, quarta, cena, QUARTA, get KILLS() { return KILLS; } };
})();
