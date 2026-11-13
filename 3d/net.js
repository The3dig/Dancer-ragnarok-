// =====================================================================
//  Multiplayer: cada jogador publica o próprio estado e todos veem todos.
//  No link do Claude usa a "sala" da página (presence em tempo real).
//  Fora dele (GitHub Pages / app) usa o servidor do MMO na Cloudflare
//  (servidor/ → kravenox-mmo.kravenox.workers.dev), que faz a mesma coisa
//  por WebSocket. O resto do jogo não sabe a diferença.
// =====================================================================
'use strict';
const SERVIDOR_MMO = 'wss://kravenox-mmo.kravenox.workers.dev/mundo/reino';
// sala por WebSocket com a mesma cara da sala do Claude: presence() e onPeers()
function salaServidor(url) {
  let ws = null, me = null, cb = null, pend = null, espera = 1000, aberta = false;
  const peers = new Map();
  const emit = (joined = [], left = []) => {
    if (!cb) return;
    const list = [...peers.entries()].map(([peer, s]) => ({ peer, isMe: false, sameTab: false, presence: s }));
    if (me) list.push({ peer: me, isMe: true, sameTab: true, presence: null });
    cb({ peers: list, joined, left });
  };
  function conectar() {
    try { ws = new WebSocket(url); } catch (e) { setTimeout(conectar, espera = Math.min(espera * 2, 30000)); return; }
    ws.onopen = () => { aberta = true; espera = 1000; if (pend) ws.send(JSON.stringify({ t: 'p', s: pend })); };
    ws.onmessage = e => {
      if (e.data === 'pong') return;
      let m; try { m = JSON.parse(e.data); } catch (_) { return; }
      if (m.t === 'eu') { me = m.peer; emit(); }
      else if (m.t === 'todos') { const velhos = [...peers.keys()]; peers.clear(); for (const p of m.peers || []) peers.set(p.peer, p.s); emit([], velhos.filter(k => !peers.has(k)).map(peer => ({ peer }))); }
      else if (m.t === 'p') { const novo = !peers.has(m.peer); peers.set(m.peer, m.s); emit(novo ? [{ peer: m.peer, presence: m.s, sameTab: false }] : []); }
      else if (m.t === 'saiu') { if (peers.delete(m.peer)) emit([], [{ peer: m.peer }]); }
      else if (m.t === 'erro' && typeof log === 'function') log('🌐 ' + String(m.msg).slice(0, 120), 'sys');
    };
    ws.onclose = () => {
      aberta = false; const left = [...peers.keys()].map(peer => ({ peer })); peers.clear(); me = null; emit([], left);
      setTimeout(conectar, espera); espera = Math.min(espera * 2, 30000);        // cai a internet: tenta de novo, cada vez esperando mais
    };
    ws.onerror = () => { };
  }
  conectar();
  setInterval(() => { if (aberta) try { ws.send('ping'); } catch (e) { } }, 25000);   // mantém a conexão viva
  return {
    servidor: true, get aberta() { return aberta; },
    presence(s) { pend = s; if (aberta) try { ws.send(JSON.stringify({ t: 'p', s })); } catch (e) { } return Promise.resolve(); },
    onPeers(f) { cb = f; emit(); },
  };
}
const Net = (() => {
  let room = null, sendT = 0, lastSent = '', online = 1, myPeer = null;
  const remotes = new Map();   // peer -> jogador remoto
  const seenSay = new Map();

  async function init() {
    try { if (window.claude && window.claude.use) room = await window.claude.use('room'); } catch (e) { room = null; }
    if (!room && !/[?&#]solo\b/.test(location.href) && 'WebSocket' in window) room = salaServidor((/[?&]servidor=(wss?:\/\/[^&#]+)/.exec(location.search) || [])[1] ? decodeURIComponent(/[?&]servidor=(wss?:\/\/[^&#]+)/.exec(location.search)[1]) : SERVIDOR_MMO);   // fora do Claude: servidor na Cloudflare
    if (!room) return;
    room.onPeers(ch => {
      for (const p of ch.left) drop(p.peer);
      online = ch.peers.length || 1;
      for (const p of ch.peers) if (p.isMe && p.sameTab) myPeer = p.peer;
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
      if (!CLASSES[look.cls]) look.cls = OLD_TO_HERO[look.cls] || 'kravenox';
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
    if (!room) { el.textContent = '👤 Solo'; el.title = 'Jogando sozinho'; return; }
    if (room.servidor && !room.aberta) { el.textContent = '🌐 Conectando…'; el.title = 'Ligando ao servidor do Reino'; return; }
    el.textContent = `👥 ${Math.max(1, remotes.size + 1)} online`;
  }

  // ---------------- laço
  function update(dt) {
    if (!room) return;
    // publica o próprio estado ~10x/s
    sendT -= dt;
    if (sendT <= 0) {
      sendT = room.servidor ? 0.15 : 0.1;              // no servidor, ~7x/s (poupa a cota grátis da Cloudflare)
      const st = P.dead ? 'd' : P.dashT > 0 ? 'r' : P.moving ? 'm' : P.sit ? 's' : 'i';
      const pres = {
        n: P.name, lv: P.lv, x: +P.x.toFixed(2), z: +P.z.toFixed(2), y: +P.y.toFixed(2), f: +P.face.toFixed(2), st, k: P.atkSeq || 0,
        hp: Math.round(P.hp / stats.maxHp() * 100), look: { race: P.race, cls: P.cls, gender: P.gender, hair: P.hair, skin: P.skin },
        kd: P.kvxDmg || null, fb: P.fb || null, ...(typeof Cos !== 'undefined' ? Cos.pres() : {}), ...(typeof PvP !== 'undefined' ? PvP.pres() : {}), title: P.title || null, say: P.say || null,
        ...(typeof Vida !== 'undefined' ? Vida.pres() : {}),
      };
      const j = JSON.stringify(pres);
      if (j !== lastSent) { lastSent = j; room.presence(pres).catch(() => { }); }
      if (typeof Vida !== 'undefined') Vida.onPeers(peers());
    }
    for (const r of remotes.values()) {
      const s = r.s || {};
      const k = Math.min(1, dt * 10);
      const moving = Math.hypot(r.tx - r.x, r.tz - r.z) > 0.05;
      r.x += (r.tx - r.x) * k; r.z += (r.tz - r.z) * k; r.y += (r.ty - r.y) * k;
      let df = ((r.tf - r.f + Math.PI) % TAU + TAU) % TAU - Math.PI; r.f += df * k;
      r.g.position.set(r.x, Math.max(r.y, groundY(r.x, r.z)), r.z); r.g.rotation.y = r.f;
      if (r.L.sprite) {
        if ((s.k || 0) !== r.k) { r.k = s.k || 0; r.atkT = 0.3; }
        r.atkT = Math.max(0, (r.atkT || 0) - dt);
        r.L.sprite.update(dt, { face: r.f, moving: moving || s.st === 'm' || s.st === 'r', atk: r.atkT / 0.3, dead: s.st === 'd', sit: s.st === 's' });
      } else if (r.L.model) {
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
      // o Sítio e a casa são só seus: ninguém aparece lá, e você não vê quem está no Sítio dele
      const priv = typeof zoneOf === 'function' && (['sitio', 'casa'].includes(zoneOf(P.x, P.z)) || ['sitio', 'casa'].includes(zoneOf(r.x, r.z)));
      r.g.visible = !priv; if (priv) { r.lab.style.display = 'none'; continue; }
      r.lab.style.display = sp.vis && near ? 'block' : 'none';
      r.lab.style.transform = `translate(${sp.x | 0}px,${sp.y | 0}px) translate(-50%,-100%)`;
      const pvc = typeof PvP !== 'undefined' && (s.fl === 'r' || s.fl === 'p') ? PvP.color(s.fl, (s.pk || 0) - Date.now()) : null;
      const html = `<span style="${pvc ? 'color:' + pvc + ';font-weight:900' : /^#[0-9a-f]{6}$/i.test(s.cn || '') ? 'color:' + s.cn : ''}">${s.fl === 'r' ? '☠️ ' : ''}${esc(s.n)}</span> <span class="lv">Nv ${s.lv | 0}</span><small>${esc(className(r.look.cls, r.look.gender))}${s.title ? ' · « ' + esc(s.title) + ' »' : s.ct ? ' · ' + esc(s.ct) : ''}</small>${s.bk ? `<em class="bk">🏪 ${esc(s.bk.t)}</em>` : ''}<i><b style="width:${Math.max(0, Math.min(100, s.hp | 0))}%"></b></i>`;
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
  // dano que os outros jogadores já causaram no chefe de campo desta janela
  function fbOthers(slot) {
    let t = 0;
    for (const r of remotes.values()) { const fb = r.s && r.s.fb; if (fb && fb.s === slot && typeof fb.d === 'number') t += Math.max(0, Math.min(1e7, fb.d)); }
    return t;
  }
  function say(text) {
    text = String(text || '').trim().slice(0, 80); if (!text) return;
    P.say = { t: text, at: Date.now() };
    log(`💬 <b>${esc(P.name)}</b>: ${esc(text)}`, 'chat');
    const b = $('mybubble'); b.textContent = text; b.classList.remove('hidden'); myBubT = 6;
    if (!room) log('Você está jogando sozinho agora (sem internet). O chat aparece para os amigos online.', 'sys');
  }
  let myBubT = 0;
  function tickMyBubble(dt) {
    const b = $('mybubble'); if (!b) return;
    if (myBubT > 0) { myBubT -= dt; const sp = toScreen(P.x, P.y + 2.7, P.z); b.style.transform = `translate(${sp.x | 0}px,${sp.y | 0}px) translate(-50%,-100%)`; }
    else b.classList.add('hidden');
  }
  // jogadores remotos para o Sítio/troca/banca: { peer, n, x, z, s }
  function peers() { return [...remotes.entries()].map(([peer, r]) => ({ peer, n: r.s && r.s.n, x: r.x, z: r.z, s: r.s || {} })); }
  return { peers, get me() { return myPeer; },
    init, update, kvxOthers, fbOthers, say, tickMyBubble, get connected() { return !!room; }, get count() { return remotes.size + 1; } };
})();
