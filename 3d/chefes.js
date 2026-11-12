// =====================================================================
//  Chefes de campo (estilo Lineage 2): de tempos em tempos um monstro
//  forte aparece num lugar do mapa, com aviso. Fica 15 minutos; quem
//  derrotar ganha coroas, equipamento garantido e chance de carta.
//  Os chefes são criaturas do RPG do Kravenox.
// =====================================================================
'use strict';
const Chefes = (() => {
  const BOSSES = {
    larvaMae:    { name: 'Larva-Mãe', img: 'e_larvaMae', h: 3.4, lv: 10, hp: 4200, atk: 22, def: 8, xp: 1400, zeny: [400, 700], speed: 1.8, aggro: 14,
                   where: 'nos Campos Dourados', spots: [[-40, -28], [-20, 40], [0, -20]], gear: ['gibao_couro', 'capuz_couro', 'luvas_couro', 'botas_couro', 'anel_raiz'] },
    raizPetra:   { name: 'Raiz Petrificada', img: 'e_raizPetra', h: 3.6, lv: 13, hp: 6500, atk: 30, def: 14, xp: 2200, zeny: [600, 1000], speed: 1.4, aggro: 14,
                   where: 'na floresta a oeste do rio', spots: [[-35, 65], [-45, -70], [-15, 70]], gear: ['gibao_couro', 'anel_raiz', 'arma_cristal', 'manto'] },
    cristalizado: { name: 'Guerreiro Cristalizado', img: 'e_cristalizado', h: 3.8, lv: 16, hp: 9500, atk: 40, def: 18, xp: 3400, zeny: [900, 1500], speed: 2.2, aggro: 16,
                   where: 'nas Areias Rubras', spots: [[80, -20], [100, 70], [140, 10]], gear: ['turbante', 'manto_areias', 'luvas_areias', 'sandalias', 'arma_cristal', 'anel_cristal'] },
    larvaFogo:   { name: 'Larva Incendiária', img: 'e_larvaFogo', h: 3.6, lv: 20, hp: 15000, atk: 54, def: 22, xp: 5200, zeny: [1500, 2500], speed: 2.4, aggro: 18,
                   where: 'perto das ruínas, ao sudeste', spots: [[110, -70], [150, -40], [95, -55]], gear: ['manto_areias', 'colar_sombra', 'anel_vazio', 'arm_negra', 'arma_essencia'] },
  };
  const FIRST = 3 * 60, EVERY = 12 * 60, LIFE = 15 * 60;   // segundos
  let wait = FIRST, cur = null, life = 0, warned = false;

  // registra os chefes como monstros comuns do jogo (sprite, atributos e o que soltam)
  for (const [k, B] of Object.entries(BOSSES)) {
    MOBDEF[k] = { name: B.name, lv: B.lv, hp: B.hp, atk: B.atk, def: B.def, xp: B.xp, zeny: B.zeny, speed: B.speed, aggro: B.aggro, rad: 1.6, respawn: 1e9, boss: true, field: true,
      drops: [['red', 1], ['red', 1], ['blue', 1], ['blue', 0.6], ...B.gear.map(g => [g, Math.min(1, 1.3 / B.gear.length)])] };
    SPR_MOBS[k] = { img: B.img, h: B.h };
  }

  // escolhe um chefe que combine com o nível do jogador (um pouco acima)
  function pick() {
    const list = Object.keys(BOSSES).filter(k => BOSSES[k].lv <= P.lv + 6);
    const pool = list.length ? list : ['larvaMae'];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function spawn(k) {
    const B = BOSSES[k], [x, z] = B.spots[Math.floor(Math.random() * B.spots.length)];
    const m = spawnMob(k, null, { x, z });
    m.noRespawn = true; cur = m; life = LIFE; warned = false;
    banner(`⚠️ Chefe de campo: ${B.name}!`);
    log(`⚠️ <b style="color:#ff6a40">${B.name}</b> (Nv ${B.lv}) apareceu ${B.where}! Ela some em 15 minutos. Aparece como ponto vermelho grande no mapa.`, 'gold');
    Audio8.sfx('boom');
  }
  function despawn() {
    const m = cur; cur = null;
    if (!m || m.dead) return;
    m.dead = true; mobs = mobs.filter(o => o !== m); scene.remove(m.model.g); m.lab.remove();
    log(`💨 <b>${m.d.name}</b> sumiu sem ser derrotada.`, 'sys');
  }
  // recompensa extra quando morre: equipamento garantido da região e chance de carta
  function onKill(m) {
    const B = BOSSES[m.type]; if (!B) return;
    if (Math.random() < 0.1) { const pool = Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'carta' && id !== 'carta_kravenox'); drops.push(makeDrop(pool[Math.floor(Math.random() * pool.length)], 1, m.x, m.z + 1.5)); }
    for (let i = 0; i < 4; i++) drops.push(makeDrop('zeny', irand(...B.zeny) >> 2, m.x + rand(-3, 3), m.z + rand(-3, 3)));
    banner(`🏆 ${B.name} derrotada!`);
    log(`🏆 Você derrotou o chefe de campo <b>${B.name}</b>!`, 'gold');
    P.fieldKills = (P.fieldKills || 0) + 1;
    if (cur === m) cur = null;
    wait = EVERY;
  }
  function update(dt) {
    if (!running || inTower(P.z)) return;
    if (cur) {
      if (cur.dead) { cur = null; wait = EVERY; return; }
      life -= dt;
      if (!warned && life < 120) { warned = true; log(`⏳ <b>${cur.d.name}</b> vai sumir em 2 minutos.`, 'sys'); }
      if (life <= 0) { despawn(); wait = EVERY; }
      return;
    }
    wait -= dt;
    if (wait <= 30 && wait + dt > 30) log('🌑 A terra treme... um chefe de campo está para aparecer.', 'sys');
    if (wait <= 0) spawn(pick());
  }
  // o próximo chefe (para a ajuda / mapa)
  const status = () => cur ? `${cur.d.name} está ${BOSSES[cur.type].where} (some em ${Math.ceil(life / 60)} min)` : `próximo em ${Math.max(1, Math.ceil(wait / 60))} min`;
  return { update, onKill, status, BOSSES, spawn };
})();
