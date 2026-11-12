// =====================================================================
//  Chefes de campo (raid do Lineage 2): o MESMO chefe aparece para todos
//  os jogadores, no mesmo lugar e hora (a cada 20 min, fica 15 min), e a
//  vida dele é compartilhada: cada um publica o dano que causou e a vida
//  é o total menos a soma de todos. Com a vida enorme, sozinho não dá
//  tempo: é preciso juntar um grupo. Quem causou dano leva o saque.
//  Os chefes são criaturas do RPG do Kravenox.
// =====================================================================
'use strict';
const Chefes = (() => {
  const BOSSES = {
    larvaMae:    { name: 'Larva-Mãe', img: 'e_larvaMae', h: 3.4, lv: 10, hp: 60000, atk: 30, def: 8, xp: 1400, zeny: [400, 700], speed: 1.8, aggro: 14,
                   where: 'nos Campos Dourados', spots: [[-40, -28], [-20, 40], [0, -20]], gear: ['gibao_couro', 'capuz_couro', 'luvas_couro', 'botas_couro', 'anel_raiz'] },
    raizPetra:   { name: 'Raiz Petrificada', img: 'e_raizPetra', h: 3.6, lv: 13, hp: 90000, atk: 40, def: 14, xp: 2200, zeny: [600, 1000], speed: 1.4, aggro: 14,
                   where: 'na floresta a oeste do rio', spots: [[-35, 65], [-45, -70], [-15, 70]], gear: ['gibao_couro', 'anel_raiz', 'arma_cristal', 'manto'] },
    cristalizado: { name: 'Guerreiro Cristalizado', img: 'e_cristalizado', h: 3.8, lv: 16, hp: 130000, atk: 52, def: 18, xp: 3400, zeny: [900, 1500], speed: 2.2, aggro: 16,
                   where: 'nas Areias Rubras', spots: [[80, -20], [100, 70], [140, 10]], gear: ['turbante', 'manto_areias', 'luvas_areias', 'sandalias', 'arma_cristal', 'anel_cristal'] },
    larvaFogo:   { name: 'Larva Incendiária', img: 'e_larvaFogo', h: 3.6, lv: 20, hp: 200000, atk: 68, def: 22, xp: 5200, zeny: [1500, 2500], speed: 2.4, aggro: 18,
                   where: 'perto das ruínas, ao sudeste', spots: [[110, -70], [150, -40], [95, -55]], gear: ['manto_areias', 'colar_sombra', 'anel_vazio', 'arm_negra', 'arma_essencia'] },
  };
  // registra os chefes como monstros comuns do jogo (sprite, atributos e o que soltam)
  for (const [k, B] of Object.entries(BOSSES)) {
    MOBDEF[k] = { name: B.name, lv: B.lv, hp: B.hp, atk: B.atk, def: B.def, xp: B.xp, zeny: B.zeny, speed: B.speed, aggro: B.aggro, rad: 1.6, respawn: 1e9, boss: true, field: true,
      drops: [['red', 1], ['red', 1], ['blue', 1], ['blue', 0.6], ...B.gear.map(g => [g, Math.min(1, 1.3 / B.gear.length)])] };
    SPR_MOBS[k] = { img: B.img, h: B.h };
  }

  const SLOT = 20 * 60e3, START = 3 * 60e3, LIFE = 15 * 60e3;   // ms: a cada 20 min, aparece aos 3 min e fica 15
  const KEYS = Object.keys(BOSSES);
  const hash = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };
  let cur = null, curSlot = -1, warned = -1, preWarned = -1;
  const slotNow = () => Math.floor(Date.now() / SLOT);
  const plan = s => { const k = KEYS[hash(s) % KEYS.length], B = BOSSES[k]; return { k, B, spot: B.spots[hash(s * 7 + 3) % B.spots.length] }; };
  const tIn = () => Date.now() % SLOT;                                  // ms desde o começo da janela
  const mine = s => (P.fb && P.fb.s === s ? P.fb.d : 0);
  function addDmg(d) { const s = slotNow(); if (!P.fb || P.fb.s !== s) P.fb = { s, d: 0 }; P.fb.d += d; }
  const sharedHp = (m, s) => m.maxHp - mine(s) - (typeof Net !== 'undefined' && Net.fbOthers ? Net.fbOthers(s) : 0);

  function spawn(k, s, spot) {
    const B = BOSSES[k], [x, z] = spot;
    const m = spawnMob(k, null, { x, z });
    m.noRespawn = true; m.fbSlot = s; cur = m; curSlot = s;
    const left = Math.max(1, Math.round((START + LIFE - tIn()) / 60e3));
    banner(`⚠️ Chefe de campo: ${B.name}!`);
    log(`⚠️ <b style="color:#ff6a40">${B.name}</b> (Nv ${B.lv}) apareceu ${B.where}! <b>É forte demais para um só: junte um grupo.</b> Vai embora em ${left} min. Ponto vermelho grande no mapa.`, 'gold');
    if (!(typeof Net !== 'undefined' && Net.count > 1)) log('👥 Você está sem outros jogadores agora. O chefe é de todos: quando mais gente entrar, o dano de cada um soma.', 'sys');
    Audio8.sfx('boom');
  }
  function remove(m, msg) {
    if (!m || m.dead) return;
    m.dead = true; mobs = mobs.filter(o => o !== m); scene.remove(m.model.g); m.lab.remove();
    if (msg) log(msg, 'sys');
  }
  // morreu: quem causou dano leva o saque (o killMob normal solta coroas, poções e equipamento)
  function onKill(m) {
    const B = BOSSES[m.type]; if (!B) return;
    P.fbDone = m.fbSlot;
    if (Math.random() < 0.1) { const pool = Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'carta' && id !== 'carta_kravenox'); drops.push(makeDrop(pool[Math.floor(Math.random() * pool.length)], 1, m.x, m.z + 1.5)); }
    for (let i = 0; i < 4; i++) drops.push(makeDrop('zeny', irand(...B.zeny) >> 2, m.x + rand(-3, 3), m.z + rand(-3, 3)));
    const n = typeof Net !== 'undefined' ? Net.count : 1;
    banner(`🏆 ${B.name} derrotada!`);
    log(`🏆 O grupo derrotou o chefe de campo <b>${B.name}</b>!${n > 1 ? ` (${n} caçadores no mundo)` : ''} Seu dano: <b>${mine(m.fbSlot).toLocaleString('pt-BR')}</b>.`, 'gold');
    P.fieldKills = (P.fieldKills || 0) + 1;
    if (cur === m) cur = null;
  }
  function update(dt) {
    if (!running) return;
    const s = slotNow(), t = tIn(), { k, B, spot } = plan(s), alive = t >= START && t < START + LIFE && P.fbDone !== s;
    if (!alive) {
      if (cur && !cur.dead) remove(cur, `💨 <b>${cur.d.name}</b> foi embora. Outro chefe aparece em alguns minutos.`);
      cur = null;
      if (t < START && t > START - 30e3 && preWarned !== s) { preWarned = s; log(`🌑 A terra treme ${B.where}... um chefe de campo vai aparecer.`, 'sys'); }
      return;
    }
    if (!cur || cur.dead || curSlot !== s) spawn(k, s, spot);
    // vida compartilhada entre todos os jogadores
    const hp = sharedHp(cur, s);
    if (hp <= 0) {
      if (mine(s) > 0) { cur.hp = 0; killMob(cur); }
      else { P.fbDone = s; remove(cur, `🏆 Outros caçadores derrotaram <b>${cur.d.name}</b>.`); cur = null; }
      return;
    }
    cur.hp = Math.min(cur.hp, hp);
    if (t > START + LIFE - 120e3 && warned !== s) { warned = s; log(`⏳ <b>${cur.d.name}</b> vai embora em 2 minutos.`, 'sys'); }
  }
  // para a ajuda
  function status() {
    const s = slotNow(), t = tIn(), { B } = plan(s);
    if (t >= START && t < START + LIFE && P.fbDone !== s) return `${B.name} está ${B.where} (vai embora em ${Math.ceil((START + LIFE - t) / 60e3)} min)`;
    const next = t < START ? START - t : SLOT - t + START;
    return `próximo em ${Math.max(1, Math.ceil(next / 60e3))} min`;
  }
  return { update, onKill, status, addDmg, BOSSES };
})();
