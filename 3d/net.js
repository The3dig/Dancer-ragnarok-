// =====================================================================
//  Multiplayer — usa a "sala" da página do Claude (presence em tempo real).
//  Cada jogador publica o próprio estado; todos veem todos.
//  Fora do Claude (GitHub Pages / app) o jogo continua single-player.
// =====================================================================
'use strict';
const Net = (() => {
  let room = null, sendT = 0, lastSent = '', online = 1;
  const remotes = new Map();   // peer -> jogador remoto
  const seenSay = new Map();

  async function init() {
    try {
      if (!window.claude || !window.claude.use) return;
      room = await window.claude.use('room');
    } catch (e) { room = null; }
    if (!room) return;
    room.onPeers(ch => {
      for (const p of ch.left) drop(p.peer);
      online = ch.peers.length || 1;
      for (const p of ch.peers) if (!p.isMe || !p.sameTab) upsert(p);
      updateBadge();
      for (const p of ch.joined) if (!p.sameTab && p.presence && p.presence.n) log(`👋 <b>${esc(p.presence.n)}</b> entrou no mundo.`, 'item');
    }, () => { room = null; updateBadge(); });
    updateBadge();
  }
  const esc = t => String(t || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])).slice(0, 80);

  // ---------------- jogadores remotos
  function upsert(p) {
    if (p.sameTab) return;
    const s = p.presence || {};
    if (!s.n || typeof s.x !== 'number') return;
    let r = remotes.get(p.peer);
    const lookKey = JSON.stringify(s.look || {});
    if (!r || r.lookKey !== lookKey) {
      if (r) { scene.remove(r.g); r.lab.remove(); r.bub.remove(); }
      const g = new THREE.Group(); scene.add(g);
      const look = { race: 'humano', cls: 'dancarina', gender: 'f', hair: 0, skin: 0, ...(s.look || {}) };
      if (!RACES[look.race]) look.race = 'humano';
      if (!CLASSES[look.cls]) look.cls = 'dancarina';
      const L2 = buildAvatar(g, look);
      const lab = document.createElement('div'); lab.className = 'alabel plabel'; $('labels').appendChild(lab);
      const bub = document.createElement('div'); bub.className = 'bubble hidden'; $('labels').appendChild(bub);
      r = { g, L: L2, look, lookKey, lab, bub, x: s.x, z: s.z, y: s.y || 0, f: s.f || 0, k: s.k || 0 };
      remotes.set(p.peer, r);
    }
    r.s = s; r.tx = s.x; r.tz = s.z; r.ty = s.y || 0; r.tf = s.f || 0;
    if (s.say && s.say.at && seenSay.get(p.peer) !== s.say.at) {
      seenSay.set(p.peer, s.say.at);
      if (Date.now() - s.say.at < 15000) { log(`💬 <b>${esc(s.n)}</b>: ${esc(s.say.t)}`, 'chat'); r.bub.textContent = String(s.say.t).slice(0, 80); r.bubT = 6; }
    }
  }
  function drop(peer) {
    const r = remotes.get(peer); if (!r) return;
    if (r.s && r.s.n) log(`<b>${esc(r.s.n)}</b> saiu do mundo.`, 'sys');
    scene.remove(r.g); r.lab.remove(); r.bub.remove(); remotes.delete(peer);
  }
  function updateBadge() {
    const el = $('online'); if (!el) return;
    if (!room) { el.textContent = '👤 Solo'; el.title = 'Multiplayer disponível ao abrir pelo link do Claude'; return; }
    el.textContent = `👥 ${Math.max(1, remotes.size + 1)} online`;
  }

  // ---------------- laço
  function update(dt) {
    if (!room) return;
    // publica o próprio estado ~10x/s
    sendT -= dt;
    if (sendT <= 0) {
      sendT = 0.1;
      const st = P.dead ? 'd' : P.dashT > 0 ? 'r' : P.moving ? 'm' : P.sit ? 's' : 'i';
      const pres = {
        n: P.name, lv: P.lv, x: +P.x.toFixed(2), z: +P.z.toFixed(2), y: +P.y.toFixed(2), f: +P.face.toFixed(2), st, k: P.atkSeq || 0,
        hp: Math.round(P.hp / stats.maxHp() * 100), look: { race: P.race, cls: P.cls, gender: P.gender, hair: P.hair, skin: P.skin },
        kd: P.kvxDmg || null, title: P.title || null, say: P.say || null,
      };
      const j = JSON.stringify(pres);
      if (j !== lastSent) { lastSent = j; room.presence(pres).catch(() => { }); }
    }
    for (const r of remotes.values()) {
      const s = r.s || {};
      const k = Math.min(1, dt * 10);
      const moving = Math.hypot(r.tx - r.x, r.tz - r.z) > 0.05;
      r.x += (r.tx - r.x) * k; r.z += (r.tz - r.z) * k; r.y += (r.ty - r.y) * k;
      let df = ((r.tf - r.f + Math.PI) % TAU + TAU) % TAU - Math.PI; r.f += df * k;
      r.g.position.set(r.x, Math.max(r.y, groundY(r.x, r.z)), r.z); r.g.rotation.y = r.f;
      if (r.L.model) {
        const C = CLASSES[r.look.cls] || CLASSES.dancarina;
        let anim = s.st === 'd' ? 'Death' : s.st === 'r' ? 'Roll' : (moving || s.st === 'm') ? 'Run' : s.st === 's' ? 'Interact' : (C.ranged || C.weapon === 'ribbon' ? 'Idle' : 'Idle_Sword');
        let once = anim === 'Death' || anim === 'Roll', restart = false;
        if ((s.k || 0) !== r.k) { r.k = s.k || 0; r.atkT = 0.45; restart = true; }
        if (r.atkT > 0) { r.atkT -= dt; anim = C.ranged ? 'Gun_Shoot' : (C.weapon === 'club' ? 'Punch_Right' : 'Sword_Slash'); once = true; }
        r.L.inst.play(anim, { once, restart, speed: anim === 'Run' ? 1 : 1.5 });
        r.L.inst.update(dt); updateFollow(r.L);
      }
      // nome, classe e vida
      const sp = toScreen(r.x, r.g.position.y + 2.15, r.z);
      const near = Math.hypot(r.x - P.x, r.z - P.z) < 45;
      r.lab.style.display = sp.vis && near ? 'block' : 'none';
      r.lab.style.transform = `translate(${sp.x | 0}px,${sp.y | 0}px) translate(-50%,-100%)`;
      const html = `${esc(s.n)} <span class="lv">Nv ${s.lv | 0}</span><small>${esc(className(r.look.cls, r.look.gender))}${s.title ? ' · « ' + esc(s.title) + ' »' : ''}</small><i><b style="width:${Math.max(0, Math.min(100, s.hp | 0))}%"></b></i>`;
      if (r.lab.dataset.h !== html) { r.lab.innerHTML = html; r.lab.dataset.h = html; }
      if (r.bubT > 0) {
        r.bubT -= dt; r.bub.classList.remove('hidden');
        const bp = toScreen(r.x, r.g.position.y + 2.7, r.z);
        r.bub.style.display = bp.vis && near ? 'block' : 'none';
        r.bub.style.transform = `translate(${bp.x | 0}px,${bp.y | 0}px) translate(-50%,-100%)`;
      } else r.bub.classList.add('hidden');
    }
    updateBadge();
  }
  // dano que os outros jogadores já causaram no Kravenox nesta semana
  function kvxOthers(week) {
    let t = 0;
    for (const r of remotes.values()) { const kd = r.s && r.s.kd; if (kd && kd.w === week && typeof kd.d === 'number') t += Math.max(0, Math.min(1e6, kd.d)); }
    return t;
  }
  function say(text) {
    text = String(text || '').trim().slice(0, 80); if (!text) return;
    P.say = { t: text, at: Date.now() };
    log(`💬 <b>${esc(P.name)}</b>: ${esc(text)}`, 'chat');
    const b = $('mybubble'); b.textContent = text; b.classList.remove('hidden'); myBubT = 6;
    if (!room) log('Você está jogando sozinho. O chat aparece para amigos quando todos abrem o mesmo link do Claude.', 'sys');
  }
  let myBubT = 0;
  function tickMyBubble(dt) {
    const b = $('mybubble'); if (!b) return;
    if (myBubT > 0) { myBubT -= dt; const sp = toScreen(P.x, P.y + 2.7, P.z); b.style.transform = `translate(${sp.x | 0}px,${sp.y | 0}px) translate(-50%,-100%)`; }
    else b.classList.add('hidden');
  }
  return { init, update, kvxOthers, say, tickMyBubble, get connected() { return !!room; }, get count() { return remotes.size + 1; } };
})();
