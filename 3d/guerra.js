// =====================================================================
//  🏰 Guerra de Guildas (ideia do Rone): todo DOMINGO, das 18h às 19h, a
//  Fortaleza das Bandeiras abre. No meio dela está o Coração da Fortaleza
//  (o mesmo para todos: o servidor divide a vida). As guildas lutam entre si
//  (PvP livre, menos com a própria guilda) e a guilda que causar MAIS DANO no
//  Coração até ele cair domina a Fortaleza até a próxima guerra: todos os
//  membros ganham +10% de XP e de drop. O Comandante Varek fica em Solmira.
// =====================================================================
'use strict';
const Guerra = (() => {
  const F = FORTE, R = F.r, DIA = 0, INI = 18, FIM = 19, VIDA = 2000000;
  const SAIDA = { x: VIL.x + 8, z: VIL.z - 13.5 };
  const semana = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };   // o domingo da semana
  const aberta = () => { const d = new Date(); return d.getDay() === DIA && d.getHours() >= INI && d.getHours() < FIM; };
  const forcada = () => /guerra/i.test(location.hash);                  // para testar: #guerra no link
  const ativa = () => aberta() || forcada();
  let dona = null, donaT = -99, coracao = null, pulsoT = 4, avisou = '';
  const idCoracao = () => `dg:forte:x:${semana().replace(/-/g, '')}${forcada() ? 't' : ''}:90:1:1:0:0`;

  // ---------------- quem domina a Fortaleza (servidor)
  async function buscarDona() { if (typeof Nuvem === 'undefined' || !Nuvem.logado) return; try { dona = await Nuvem.api('GET', '/conta/guerra'); } catch (e) { } }
  const minhaGid = () => typeof Guilda !== 'undefined' && Guilda.minha() ? Guilda.minha() : null;
  const souDona = () => !!(dona && dona.gid && minhaGid() && String(dona.gid) === String(minhaGid()));
  function bonus(k) { return souDona() && (k === 'xp' || k === 'drop') ? 0.1 : 0; }

  // ---------------- a fortaleza (só aparece com você dentro)
  const g = new THREE.Group(); g.position.set(F.x, 0, F.z); g.visible = false; scene.add(g);
  const pedra = PM('pedra.jpg', [8, 8], new THREE.Color(0.55, 0.55, 0.6)), muro = PM('pedra.jpg', [14, 2], new THREE.Color(0.48, 0.48, 0.52), { side: THREE.BackSide });
  const chao = new THREE.Mesh(new THREE.CircleGeometry(R + 1, 48).rotateX(-Math.PI / 2), pedra); chao.receiveShadow = true; g.add(chao);
  const parede = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.5, R + 0.5, 6, 40, 1, true), muro); parede.position.y = 3; g.add(parede);
  const ban = [0xc03030, 0x3060c0, 0xd8a840, 0x40a060, 0x8a40c0];
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.2), new THREE.MeshLambertMaterial({ color: ban[k % 5], side: THREE.DoubleSide })); b.position.set(Math.sin(a) * (R + 0.3), 3.6, Math.cos(a) * (R + 0.3)); b.rotation.y = a + Math.PI; g.add(b); }
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3, t = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 1.6), pedra); t.position.set(Math.sin(a) * 10, 1.5, Math.cos(a) * 10); g.add(t); addOb(F.x + Math.sin(a) * 10, F.z + Math.cos(a) * 10, 1.1); }   // barricadas
  const luz = new THREE.PointLight(0xffe0c0, 1.3, 70); luz.position.set(0, 12, 0); g.add(luz);
  const portao = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.4), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.6, toneMapped: false, side: THREE.DoubleSide })); portao.position.set(0, 1.7, R - 0.6); g.add(portao);
  const SAIDA_IN = { x: F.x, z: F.z + R - 1.2 }; let armada = false, dentroAntes = false;

  // ---------------- o Coração (monstro compartilhado pelo servidor, parado no meio)
  function escalar(m) {
    m.d = { ...m.d, name: 'Coração da Fortaleza', lv: 90, hp: VIDA, atk: 0, def: 60, xp: 0, zeny: [0, 0], speed: 0, aggro: 0, respawn: 1e9, boss: true, drops: [] };
    m.hp = m.maxHp = VIDA; m.noRespawn = true; m.towerFloor = 'forte'; m.coracao = true; m.state = 'idle';
    const sp = m.lab.querySelector('span'); if (sp) sp.innerHTML = '💎 Coração da Fortaleza';
    m.model.g.scale.multiplyScalar(2.2);
  }
  const tipoBase = () => MOBDEF.esfera ? 'esfera' : Object.keys(MOBDEF)[0];
  function criarRemoto(o) {
    if (!String(o.id).startsWith('dg:forte:')) return null;
    const m = spawnMob(o.type, null, { x: o.x, z: o.z }); escalar(m); m.nid = o.id; m.dg = o.id; m.dono = o.dono; m.nx = o.x; m.nz = o.z; m.hp = Math.min(m.maxHp, o.hp ?? m.maxHp); coracao = m; return m;
  }
  function garantirCoracao() {
    if (coracao && !coracao.dead && mobs.includes(coracao)) return;
    const ja = mobs.find(m => m.coracao && !m.dead); if (ja) { coracao = ja; return; }
    if ((P.gwFeito || '') === idCoracao()) return;                         // já caiu nesta guerra
    if (!Net.connected) return;
    const m = spawnMob(tipoBase(), null, { x: F.x, z: F.z }); escalar(m); m.nid = idCoracao(); m.dg = m.nid; m.dono = Net.me; m.nx = m.x; m.nz = m.z; coracao = m;
    Net.send({ t: 'semente+', l: [{ id: m.nid, type: m.type, max: VIDA, hp: VIDA, resp: 3600, x: +m.x.toFixed(2), z: +m.z.toFixed(2) }] });
  }
  // o Coração caiu: soma o dano por guilda; quem deu o último golpe grava a vencedora no servidor
  async function coracaoCaiu(msg) {
    P.gwFeito = idCoracao();
    const porGuilda = {}, nomes = {};
    for (const [peer, d] of Object.entries(msg.dano || {})) {
      let gid = null, sig = null;
      if (peer === Net.me) { gid = minhaGid(); sig = typeof Guilda !== 'undefined' ? Guilda.sigla : null; }
      else { const r = Net.peers().find(o => o.peer === peer); if (r && r.s) { gid = r.s.gid; sig = r.s.gt; } }
      if (!gid) continue; porGuilda[gid] = (porGuilda[gid] || 0) + d; nomes[gid] = sig;
    }
    const venc = Object.entries(porGuilda).sort((a, b) => b[1] - a[1])[0];
    banner('🏰 O CORAÇÃO DA FORTALEZA CAIU!'); Audio8.sfx('boom');
    if (!venc) { log('🏰 O Coração caiu, mas ninguém de guilda bateu nele. A Fortaleza continua sem dono.', 'sys'); return; }
    log(`🏰 A guilda <b>[${nomes[venc[0]] || '?'}]</b> causou mais dano (${Math.round(venc[1]).toLocaleString('pt-BR')}) e <b>domina a Fortaleza</b> até a próxima guerra: +10% de XP e de drop para os membros!`, 'gold');
    if (msg.by === Net.me && typeof Nuvem !== 'undefined' && Nuvem.logado) { try { dona = await Nuvem.api('POST', '/conta/guerra', { semana: semana(), gid: venc[0], sigla: nomes[venc[0]] || '?' }); } catch (e) { } }
    setTimeout(buscarDona, 3000);
  }

  function entrar() {
    if (!ativa()) { log('🏰 A Fortaleza das Bandeiras só abre aos <b>domingos, das 18h às 19h</b>.', 'bad'); Audio8.sfx('miss'); return; }
    if (!minhaGid()) { log('🏰 Só quem é de uma <b>guilda</b> entra na guerra. Crie ou entre numa guilda no 🛡️.', 'bad'); Audio8.sfx('miss'); return; }
    if (typeof autoStop === 'function') autoStop('');
    const a = Math.random() * TAU; P.x = F.x + Math.sin(a) * (R - 4); P.z = F.z + Math.cos(a) * (R - 4); P.y = 0; P.face = Math.atan2(F.x - P.x, F.z - P.z); camS.x = P.x; camS.z = P.z; P.protT = time + 4; armada = false; Audio8.sfx('warp');
    banner('🏰 GUERRA DE GUILDAS'); log('🏰 <b>Guerra de Guildas:</b> destrua o 💎 <b>Coração da Fortaleza</b>. A guilda que causar <b>mais dano</b> nele domina a Fortaleza até domingo que vem (+10% de XP e de drop). PvP livre contra as outras guildas, sem perder itens.', 'gold');
  }
  function sair(msg) { const q = pontoLivre(SAIDA.x, SAIDA.z); P.x = q.x; P.z = q.z; P.y = groundY(P.x, P.z); P.face = 0; Audio8.sfx('warp'); if (msg) log(msg, 'sys'); }
  function npc(eu) {
    const d = dona && dona.sigla ? `Hoje a Fortaleza é da guilda <b>[${dona.sigla}]</b>${souDona() ? ' — a sua! Vocês têm +10% de XP e de drop' : ''}.` : 'Ninguém domina a Fortaleza ainda.';
    dialog('💬 Comandante Varek', `${eu ? `<b>${eu}</b>, ` : ''}todo <b>domingo, das 18h às 19h</b>, as guildas disputam a Fortaleza das Bandeiras. Quem fizer mais estrago no Coração da Fortaleza manda nela a semana inteira. ${d}<br><small>${ativa() ? '⚔️ A guerra está acontecendo AGORA!' : 'Só membros de guilda entram.'}</small>`, [
      { label: ativa() ? '⚔️ Entrar na guerra' : '🔒 A Fortaleza está fechada (domingo, 18h às 19h)', fn: () => { entrar(); } },
      { label: 'Até mais' }]);
  }
  function update(dt) {
    if ((donaT -= dt) <= 0) { donaT = 120; buscarDona(); }
    const dentro = inTower(P.z) && zoneOf(P.x, P.z) === 'forte'; g.visible = dentro;
    const a = ativa(), k = a ? 'on' : 'off';
    if (k !== avisou) { if (a && avisou) { banner('🏰 GUERRA DE GUILDAS!'); log('🏰 <b>A Guerra de Guildas começou!</b> Fale com o Comandante Varek, em Solmira, para entrar na Fortaleza das Bandeiras.', 'gold'); } avisou = k; }
    if (!dentro) { dentroAntes = false; return; }
    if (!dentroAntes) { dentroAntes = true; armada = false; }
    if (!a) { sair('🏰 A guerra acabou: a Fortaleza fechou.'); return; }
    garantirCoracao();
    portao.material.opacity = 0.45 + Math.sin(time * 2) * 0.15;
    // o Coração pulsa: quem está perto leva dano
    if (coracao && !coracao.dead && (pulsoT -= dt) <= 0) { pulsoT = 5; ring(coracao.x, coracao.z, 6, 0x60c0ff, 0.6); if (Math.hypot(P.x - coracao.x, P.z - coracao.z) < 6 && !P.dead) { const d = Math.round(stats.maxHp() * 0.12); P.hp -= d; floater(P.x, P.y + 2, P.z, d, 'hurt'); if (P.hp <= 0) { P.hp = 0; P.dead = true; P.deadT = 3; onDeath(); } } }
    const d = Math.hypot(P.x - SAIDA_IN.x, P.z - SAIDA_IN.z); if (d > 4) armada = true;
    if (armada && d < 1.6 && !P.dead) sair('🏰 Você saiu da Fortaleza.');
  }
  function minimap(mg) {
    const W = mg.canvas.width, H = mg.canvas.height; mg.fillStyle = '#1a1a22'; mg.fillRect(0, 0, W, H); mg.textAlign = 'center';
    mg.fillStyle = '#ffd860'; mg.font = 'bold 12px Georgia'; mg.fillText('🏰 Fortaleza', W / 2, H / 2 - 10);
    mg.fillStyle = '#f0e2c0'; mg.font = 'bold 11px sans-serif'; mg.fillText(coracao && !coracao.dead ? `💎 ${Math.round(coracao.hp / VIDA * 100)}%` : '💎 caiu', W / 2, H / 2 + 10); mg.textAlign = 'left';
  }
  // o estandarte da Fortaleza em Solmira (atrás do Comandante Varek)
  {
    const ex = VIL.x + 8, ez = VIL.z - 17.5, y = groundY(ex, ez), gg = new THREE.Group(); gg.position.set(ex, y, ez); scene.add(gg);
    const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5), new THREE.MeshLambertMaterial({ color: 0x5a3a24 })); mastro.position.y = 2.5; gg.add(mastro);
    const band = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), new THREE.MeshLambertMaterial({ color: 0xc03030, side: THREE.DoubleSide })); band.position.set(0.85, 4.3, 0); gg.add(band);
    addOb(ex, ez, 0.3);
  }
  const api = { update, minimap, pres: () => null, saida: SAIDA, entrar, sair, npc, criarRemoto, coracaoCaiu, bonus, get dona() { return dona; } };
  MASMORRAS.forte = api;
  return api;
})();
