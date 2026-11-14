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
  // ---------------- visual da Larva-Mãe: larva alongada recolorida (a original tinha ovos espalhados)
  (function recolor() {
    if (typeof SPR === 'undefined' || !SPR.e_larvaLonga) return;
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; const r = p[i], g = p[i + 1], b = p[i + 2];
        if (r > 150 && g < 90) continue;                                            // boca vermelha fica
        p[i] = Math.min(255, g * 0.95 + 20); p[i + 1] = r * 0.55; p[i + 2] = Math.min(255, g * 1.05 + 25); }
      x.putImageData(d, 0, 0);
      if (typeof SpriteKit !== 'undefined' && SpriteKit.addCanvas) SpriteKit.addCanvas('e_larvaMaeX', c);
      SPR.e_larvaMaeX = c.toDataURL('image/png').split(',')[1];
      SPR_MOBS.larvaMae.img = 'e_larvaMaeX';
    };
    im.src = 'data:image/png;base64,' + SPR.e_larvaLonga;
  })();
  // ---------------- ataques especiais com aviso no chão (círculo vermelho) para dar tempo de fugir
  const warnTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,40,30,.15)'); r.addColorStop(0.85, 'rgba(255,40,30,.45)'); r.addColorStop(0.93, 'rgba(255,90,60,1)'); r.addColorStop(1, 'rgba(255,40,30,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const warnGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  function warn(x, z, rad, t) {
    const m = new THREE.Mesh(warnGeo, new THREE.MeshBasicMaterial({ map: warnTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    m.position.set(x, groundY(x, z) + 0.1, z); m.scale.setScalar(rad * 2); scene.add(m);
    const fill = new THREE.Mesh(warnGeo, new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); fill.position.copy(m.position); fill.position.y += 0.01; scene.add(fill);
    return { m, fill, x, z, rad, t, max: t };
  }
  const warns = [];
  function ai(m, dt) {
    for (let i = warns.length - 1; i >= 0; i--) {                        // avisos em andamento
      const w = warns[i]; w.t -= dt; const k = 1 - w.t / w.max;
      w.fill.scale.setScalar(Math.max(0.01, w.rad * 2 * k)); w.m.material.opacity = 0.6 + Math.sin(time * 18) * 0.4;
      if (w.t <= 0) { scene.remove(w.m); scene.remove(w.fill); warns.splice(i, 1); w.boom(); }
    }
    if (m.dead || m.state !== 'chase' || P.dead) return false;
    m.spT = (m.spT ?? 4) - dt;
    if (m.busy > 0) { m.busy -= dt; m.moving = false; return true; }   // parado preparando o golpe
    if (m.spT > 0) return false;
    m.spT = rand(4.5, 7);
    const dP = Math.hypot(P.x - m.x, P.z - m.z);
    const fP = inTower(P.z) ? floorAt(P.x, P.z) : null, pRampa = fP && !fP.casa && rampa(fP, P.x, P.z);
    if (dP > 7 && dP < 26 && !pRampa) {                                             // salto: cai em cima de onde você estava
      const tx = P.x, tz = P.z, w = warn(tx, tz, 4, 1.2); m.busy = 1.25; m.face = Math.atan2(tx - m.x, tz - m.z);
      w.boom = () => { if (m.dead) return;
        // não cai em cima das escadarias da Torre (ficava preso lá em cima, fora do alcance)
        const fT = inTower(tz) ? floorAt(tx, tz) : null, naRampa = fT && !fT.casa && typeof rampa === 'function' && rampa(fT, tx, tz);
        if (!naRampa && !blocked(tx, tz, 0.45)) { m.x = tx; m.z = tz; } Audio8.sfx('boom'); ring(tx, tz, 4, 0xff6a30, 0.5);
        if (typeof VFX !== 'undefined') { VFX.wave(tx, tz, 4.5, 0xff8a40, 0.5); VFX.flash(new THREE.Vector3(tx, groundY(tx, tz) + 1, tz), 0xff8a40, 4); }
        if (Math.hypot(P.x - tx, P.z - tz) < 4) hurtPlayer(m, 1.8); };
      warns.push(w); log(`⚠️ <b>${m.d.name}</b> vai saltar! Saia do círculo vermelho!`, 'bad');
    } else {                                                             // pancada em volta
      const w = warn(m.x, m.z, 6.5, 1.1); m.busy = 1.15;
      w.boom = () => { if (m.dead) return; Audio8.sfx('boom'); ring(m.x, m.z, 6.5, 0xe0a050, 0.6);
        if (typeof VFX !== 'undefined') { VFX.wave(m.x, m.z, 7, 0xffa040, 0.55); VFX.flash(new THREE.Vector3(m.x, groundY(m.x, m.z) + 1, m.z), 0xffa040, 4); }
        if (Math.hypot(P.x - m.x, P.z - m.z) < 6.5) hurtPlayer(m, 2.2); };
      warns.push(w);
    }
    return true;
  }
  return { ai, update, onKill, status, addDmg, BOSSES };
})();

// =====================================================================
//  Monstros Alfa (chefes médios): versões maiores e mais fortes dos
//  monstros comuns. De tempos em tempos um aparece perto de você, só
//  para você: dá para vencer sozinho e solta equipamento e carta com
//  muito mais chance. Os chefes de campo (acima) são os de grupo.
// =====================================================================
const Alfas = (() => {
  const BASE = ['pompom', 'zunzum', 'fungolino', 'besouro', 'serpe', 'raizNegra', 'ecoCinza', 'larvaCinza'];
  for (const t of BASE) {
    const d = MOBDEF[t], s = SPR_MOBS[t]; if (!d || !s) continue;
    MOBDEF['alfa_' + t] = { ...d, name: d.name + ' Alfa', lv: d.lv + 3, hp: d.hp * 9, atk: Math.round(d.atk * 1.7), def: d.def + 3, xp: d.xp * 8, zeny: [d.zeny[0] * 6, d.zeny[1] * 8],
      speed: d.speed * 1.1, aggro: Math.max(d.aggro, 9), respawn: 1e9, rad: 0.9, alfa: true, base: t,
      drops: d.drops.map(([id, ch]) => [id, ITEMS[id] && (ITEMS[id].kind === 'equip' || ITEMS[id].kind === 'carta') ? Math.min(1, ch * (ITEMS[id].kind === 'carta' ? 6 : 5)) : Math.min(1, ch * 2)]) };
    SPR_MOBS['alfa_' + t] = { ...s, h: s.h * 1.6 };
  }
  const FIRST = 90, EVERY = 240, LIFE = 480;   // segundos
  let wait = FIRST, cur = null, life = 0;
  function where() {
    for (const sp of SPAWNS) if (sp.area && BASE.includes(sp.type) && P.x > sp.area[0] && P.x < sp.area[1] && P.z > sp.area[2] && P.z < sp.area[3]) return sp;
    return null;
  }
  function spawnNear() {
    const sp = where(); if (!sp) return false;
    const opts = SPAWNS.filter(o => o.area && BASE.includes(o.type) && o.area[0] === sp.area[0] && o.area[1] === sp.area[1]);
    const t = opts[Math.floor(Math.random() * opts.length)].type, A = sp.area;
    for (let i = 0; i < 40; i++) {
      const a = rand(0, TAU), r = rand(22, 38), x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r;
      if (x < A[0] || x > A[1] || z < A[2] || z > A[3] || blocked(x, z, 1.2) || isWater(x, z)) continue;
      const m = spawnMob('alfa_' + t, null, { x, z }); m.noRespawn = true; m.area = A; cur = m; life = LIFE;
      Audio8.sfx('warp');
      log(`⭐ Um monstro <b style="color:#ffcf40">${m.d.name}</b> (Nv ${m.d.lv}) apareceu por perto! Dá para vencer sozinho e ele solta coisa boa.`, 'gold');
      return true;
    }
    return false;
  }
  function update(dt) {
    if (!running || inTower(P.z)) return;
    if (cur) {
      if (cur.dead) { cur = null; wait = EVERY; return; }
      life -= dt;
      if (life <= 0 || Math.hypot(cur.x - P.x, cur.z - P.z) > 140) {
        const m = cur; cur = null; wait = EVERY;
        m.dead = true; mobs = mobs.filter(o => o !== m); scene.remove(m.model.g); m.lab.remove();
      }
      return;
    }
    if ((wait -= dt) <= 0) { if (!spawnNear()) wait = 20; }
  }
  function onKill(m) {
    if (!m.d.alfa) return;
    banner(`⭐ ${m.d.name} derrotado!`);
    P.alfaKills = (P.alfaKills || 0) + 1;
    if (cur === m) { cur = null; wait = EVERY; }
  }
  return { update, onKill, get cur() { return cur; } };
})();
