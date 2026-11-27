// =====================================================================
//  👑 Painel de MVP e mini-chefes (ideia do Ludi, como o "Show MINI" do Ragnarok):
//  todos os chefes do mundo, o nível, o mapa, se está vivo, quanto falta para renascer,
//  quem matou por último e o que ele pode soltar. Botão "Ir até lá" leva o personagem.
//  O servidor guarda quem matou e quando (o mesmo para todos os jogadores).
// =====================================================================
'use strict';
const MVP = (() => {
  let estado = {}, pedidoT = 0, aberto = null;
  // os chefes que nascem no mapa (id do servidor = "<índice do spawn>-<n>")
  function lista() {
    const out = [];
    SPAWNS.forEach((sp, si) => {
      const D = MOBDEF[sp.type]; if (!D || !(D.boss || D.mini) || D.world) return;
      for (let i = 0; i < sp.n; i++) {
        const x = sp.at ? sp.at.x : (sp.area[0] + sp.area[1]) / 2, z = sp.at ? sp.at.z : (sp.area[2] + sp.area[3]) / 2;
        out.push({ id: si + '-' + i, type: sp.type, D, x, z, mapa: nomeLugar(x, z), mvp: !!D.boss && !D.mini });
      }
    });
    return out.sort((a, b) => a.D.lv - b.D.lv);
  }
  function nomeLugar(x, z) { try { const zn = ZONES[zoneOf(x, z)]; return zn ? zn.name : '?'; } catch (e) { return '?'; } }
  const tempo = ms => { const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return h ? `${h}h ${m}min` : m ? `${m}min ${ss}s` : `${ss}s`; };
  function pedir() {
    if (typeof Net === 'undefined' || !Net.send || Date.now() - pedidoT < 1500) return; pedidoT = Date.now();
    Net.send({ t: 'mvps', ids: [...lista().map(o => o.id), ...(typeof Chefes !== 'undefined' && Chefes.BOSSES ? Object.keys(Chefes.BOSSES).map(k => 'fb:' + k) : [])] });
  }
  function init() {
    // 📣 um MVP de verdade caiu em algum lugar do mundo: todos ficam sabendo (pedido do Rone); dá para ir até lá
    if (typeof Net !== 'undefined' && Net.on) Net.on('mvpcaiu', m => {
      const eu = m.matou === P.name, nome = String(m.nome || 'Um MVP'), x = +m.x, z = +m.z;
      log(`👑 <b>${eu ? 'Você' : m.matou}</b> derrotou o MVP <b>${nome}</b>${m.lugar ? ` (${m.lugar})` : ''}!`, 'gold');
      if (typeof Anuncio === 'undefined') return;
      Anuncio.mostrar({ ic: '👑', cor: 'sangue', tag: 'MVP DERROTADO', titulo: eu ? `Você derrotou ${nome}!` : `${m.matou} derrotou ${nome}!`, sub: `${m.lugar || ''}${eu ? '' : '. Fora das cidades vale PvP (botão 🗡️): quem quiser disputar, corre!'}`, seg: 9, som: 'boom',
        ...(eu || !isFinite(x) ? {} : { botao: '🧭 Ir até lá', acao: () => { if (P.dead) return; P.caca = null; P.qGo = { x, z, name: nome }; if (typeof autoStart === 'function') autoStart(); } }) });
    });
    if (typeof Net !== 'undefined' && Net.on) Net.on('mvps', m => { const dif = Date.now() - (m.agora || Date.now()); estado = {}; for (const o of m.l || []) estado[o.id] = { ...o, volta: o.volta ? o.volta + dif : 0, quando: o.quando ? o.quando + dif : 0 }; if (aberto) render(); });
    const menu = document.getElementById('menu');
    if (menu && !document.getElementById('btn-mvp')) {
      const b = document.createElement('button'); b.id = 'btn-mvp'; b.title = 'MVP e chefes'; b.textContent = '👑';
      b.onclick = e => { e.stopPropagation(); Audio8.sfx('click'); abrir(); };
      const mais = document.getElementById('btn-mais'); menu.insertBefore(b, mais || null);
    }
    setInterval(() => {
      if (!aberto) return;
      const t = (document.querySelector('#dialog .wt') || {}).textContent || '';
      if (typeof dialogOpen !== 'undefined' && (!dialogOpen || !/^[👑⭐]/u.test(t.trim()))) { aberto = null; return; }   // fechou ou abriu outra janela: para de atualizar
      pedir(); render();
    }, 1000);
  }
  function statusDe(o) {
    const local = mobs.find(m => m.nid === o.id && !m.dead), s = estado[o.id];
    if (local) return { vivo: true, hp: Math.round(local.hp / local.maxHp * 100), txt: `🟢 <b>Vivo</b> · ${Math.round(local.hp / local.maxHp * 100)}% de vida` };
    if (s && s.vivo) return { vivo: true, hp: s.hp, txt: `🟢 <b>Vivo</b> · ${s.hp}% de vida` };
    if (s && s.volta) { const f = s.volta - Date.now(); return { vivo: false, txt: f > 0 ? `⏳ Renasce em <b>${tempo(f)}</b>` : '⏳ Renascendo...' }; }
    return { vivo: false, txt: '❔ Sem notícia' };
  }
  // 📸 foto de cada chefe e alfa (pedido da Lady Ingrid): o próprio modelo do jogo, fotografado de frente e guardado
  const FOTO = {}, fila = new Set(); let rt = null;
  function fotoMob(tipo) {
    if (tipo in FOTO) return FOTO[tipo];
    let url = '';
    try {
      const N = 128; if (!rt) { rt = new THREE.WebGLRenderTarget(N, N); rt.texture.encoding = THREE.sRGBEncoding; }
      const cena = new THREE.Scene(); cena.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.0)); const sol = new THREE.DirectionalLight(0xffffff, 0.8); sol.position.set(3, 5, 6); cena.add(sol);
      const r = mobModel(tipo); cena.add(r.g);
      const fake = { moving: false, swing: 0, flash: 0, face: 0, seed: 1 }; try { if (r.anim) r.anim(fake, 1); if (r.spr && r.spr.update) r.spr.update(0.016, { face: 0, moving: false }); } catch (e) { }
      r.g.updateMatrixWorld(true);
      const bx = new THREE.Box3().setFromObject(r.g);
      if (!bx.isEmpty()) {
        const ctr = bx.getCenter(new THREE.Vector3()), tam = bx.getSize(new THREE.Vector3()), raio = Math.max(tam.x, tam.y, tam.z * 0.75) * 0.6 + 0.05;
        const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 500), d = raio / Math.sin(Math.PI / 12);
        cam.position.set(ctr.x + d * 0.35, ctr.y + d * 0.2, ctr.z + d * 0.92); cam.lookAt(ctr);
        const antes = renderer.getRenderTarget(), cor = renderer.getClearColor(new THREE.Color()), alfa = renderer.getClearAlpha();
        renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(cena, cam);
        const px = new Uint8Array(N * N * 4); renderer.readRenderTargetPixels(rt, 0, 0, N, N, px); renderer.setRenderTarget(antes); renderer.setClearColor(cor, alfa);
        const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
        for (let y = 0; y < N; y++) im.data.set(px.subarray((N - 1 - y) * N * 4, (N - y) * N * 4), y * N * 4);
        x.putImageData(im, 0, 0); url = c.toDataURL();
      }
      cena.remove(r.g); if (r.spr && r.spr.dispose) r.spr.dispose();
    } catch (e) { url = ''; }
    return (FOTO[tipo] = url);
  }
  // ícone da lista: a foto, ou o emoji enquanto a foto não foi tirada (tira algumas por vez)
  const icone = (tipo, em) => { if (FOTO[tipo]) return `<span class="mvp-ic"><img src="${FOTO[tipo]}"></span>`; if (!(tipo in FOTO)) fila.add(tipo); return `<span class="mvp-ic">${em}</span>`; };
  const fotoGrande = tipo => { const u = fotoMob(tipo); return u ? `<img class="mvp-foto" src="${u}">` : ''; };
  function tirarFila() { let n = 0; for (const t of fila) { fila.delete(t); fotoMob(t); if (++n >= 4) break; } return n; }
  function abrir() { aberto = 'lista'; pedir(); render(); }
  function render() {
    const rolA = (document.querySelector('#dialog .dtext') || {}).scrollTop || 0, rolB = (document.querySelector('#dialog .mvp-lista') || {}).scrollTop || 0, mesmo = render.ult === aberto; render.ult = aberto;
    try { render2(); } finally { if (mesmo) { const a = document.querySelector('#dialog .dtext'), b = document.querySelector('#dialog .mvp-lista'); if (a) a.scrollTop = rolA; if (b) b.scrollTop = rolB; } }
  }
  function render2() {
    if (aberto === 'lista') {
      if (tirarFila()) setTimeout(() => { if (aberto === 'lista') render(); }, 60);
      const L = lista(), linhas = L.map(o => { const st = statusDe(o), s = estado[o.id];
        return `<div class="mvp-l${st.vivo ? ' vivo' : ''}" data-mvp="${o.id}">${icone(o.type, o.mvp ? '👑' : '⭐')}<span class="mvp-n"><b>${o.D.name}</b> <small>Nv ${o.D.lv} · ${o.mapa}</small><br><small>${st.txt}${s && s.matou ? ` · último: <b>${s.matou}</b>` : ''}</small></span></div>`; }).join('');
      // 👑 chefes de campo (os MVPs de verdade: aparecem para todos, a cada 20 min, no mesmo horário) e ⭐ alfas (pedido do Wesley)
      const AG = typeof Chefes !== 'undefined' && Chefes.agenda ? Chefes.agenda() : [];
      const campo = AG.sort((a, b) => (b.vivo - a.vivo) || ((a.prox ? a.prox.em : 9e9) - (b.prox ? b.prox.em : 9e9))).map(o => `<div class="mvp-l${o.vivo ? ' vivo' : ''}" data-mvp="fb:${o.k}">${icone(o.k, '👑')}<span class="mvp-n"><b>${o.B.name}</b> <small>Nv ${o.B.lv} · ${o.B.where}</small><br><small>${o.vivo ? `🟢 <b>Vivo agora</b>${o.hp ? ` · ${o.hp}% de vida` : ''} · vai embora em <b>${tempo(o.fim)}</b>` : o.prox ? `⏳ Aparece em <b>${tempo(o.prox.em)}</b> · ${nomeLugar(o.prox.spot[0], o.prox.spot[1])}` : '❔'}${estado['fb:' + o.k] && estado['fb:' + o.k].matou ? ` · último: <b>${estado['fb:' + o.k].matou}</b>` : ''}</small></span></div>`).join('');
      const ALF = typeof Alfas !== 'undefined' && Alfas.BASE ? Alfas.BASE.filter(t => MOBDEF['alfa_' + t]) : [], ac = typeof Alfas !== 'undefined' ? Alfas.cur : null;
      const alfas = ALF.map(t => { const D = MOBDEF['alfa_' + t], sp = SPAWNS.find(o => o.type === t && o.area), lug = sp ? nomeLugar((sp.area[0] + sp.area[1]) / 2, (sp.area[2] + sp.area[3]) / 2) : '?', aqui = ac && !ac.dead && ac.type === 'alfa_' + t;
        return `<div class="mvp-l${aqui ? ' vivo' : ''}" data-mvp="al:${t}">${icone('alfa_' + t, '⭐')}<span class="mvp-n"><b>${D.name}</b> <small>Nv ${D.lv} · ${lug}</small><br><small>${aqui ? `🟢 <b>Está perto de você agora!</b> (${Math.round(Math.hypot(ac.x - P.x, ac.z - P.z))} m)` : '✨ Aparece perto de quem caça na região, de 4 em 4 minutos'}</small></span></div>`; }).join('');
      dialog('👑 MVP e chefes', `<small>Toque num deles para ver os drops e ir até lá.</small><div class="mvp-lista"><h4 class="mvp-sec">👑 Chefes de campo (MVP)</h4><small class="mvp-exp">Aparecem para todos, no mesmo lugar e hora, e ficam 15 min. Vida enorme: junte um grupo.</small>${campo || '<i>—</i>'}<h4 class="mvp-sec">⭐ Alfas</h4><small class="mvp-exp">Versões maiores dos bichos comuns, só para você. Dá para vencer sozinho e soltam equipamento e carta com mais chance.</small>${alfas || '<i>—</i>'}<h4 class="mvp-sec">📍 Chefes fixos do mapa</h4>${linhas || '<i>Nenhum chefe no mapa.</i>'}</div><small>🗓️ Kravenox: sábado 20h · Verme Colossal: de 15 em 15 dias · Campeão Sombrio: terça 21h (castelo da guilda).</small>`, [{ label: 'Fechar', fn: () => { aberto = null; } }]);
      document.querySelectorAll('#dialog [data-mvp]').forEach(el => el.addEventListener('click', () => { Audio8.sfx('click'); aberto = el.dataset.mvp; render(); }));
      return;
    }
    if (/^(fb|al):/.test(aberto)) return detalheNovo();
    const o = lista().find(x => x.id === aberto); if (!o) { aberto = 'lista'; render(); return; }
    const st = statusDe(o), s = estado[o.id], D = o.D;
    const drops = (D.drops || []).filter(([id]) => ITEMS[id] && !/^(red|blue)$/.test(id)).slice(0, 12).map(([id, ch]) => `<span class="mvp-d">${ITEMS[id].ic || '•'} ${ITEMS[id].name} <small>${ch >= 1 ? '100' : (ch * 100).toFixed(ch < 0.01 ? 2 : 1).replace('.', ',')}%</small></span>`).join('');
    dialog(`${o.mvp ? '👑' : '⭐'} ${D.name}`, `${fotoGrande(o.type)}<b>Nível ${D.lv}</b> · ${o.mapa}<br>❤️ ${D.hp.toLocaleString('pt-BR')} de vida · ⚔️ ${D.atk} de ataque<br>${st.txt}<br>${s && s.matou ? `🗡️ Último a derrotar: <b>${s.matou}</b>${s.quando ? `, há ${tempo(Date.now() - s.quando)}` : ''}` : '🗡️ Ninguém derrotou ainda desde 27/11 (quando o registro começou).'}<br>⏱️ Renasce ${Math.round((D.respawn || 0) / 60) || '?'} min depois de cair.<br><br><b>Pode soltar:</b><div class="mvp-drops">${drops || '<i>—</i>'}</div>`,
      [{ label: '🧭 Ir até lá', fn: () => { aberto = null; P.qGo = { x: o.x, z: o.z, name: D.name }; if (typeof autoStart === 'function') autoStart(); log(`🧭 Indo até <b>${D.name}</b> (${o.mapa}).`, 'sys'); } },
       { label: '← Voltar', fn: () => { aberto = 'lista'; render(); return true; } }, { label: 'Fechar', fn: () => { aberto = null; } }]);
  }
  function detalheNovo() {
    const [tp, k] = aberto.split(':'), voltar = { label: '← Voltar', fn: () => { aberto = 'lista'; render(); return true; } }, fechar = { label: 'Fechar', fn: () => { aberto = null; } };
    const dropsDe = D => (D.drops || []).filter(([id]) => ITEMS[id] && !/^(red|blue)$/.test(id)).slice(0, 12).map(([id, ch]) => `<span class="mvp-d">${ITEMS[id].ic || '•'} ${ITEMS[id].name} <small>${ch >= 1 ? '100' : (ch * 100).toFixed(ch < 0.01 ? 2 : 1).replace('.', ',')}%</small></span>`).join('');
    const ir = (x, z, nome) => ({ label: '🧭 Ir até lá', fn: () => { aberto = null; P.qGo = { x, z, name: nome }; if (typeof autoStart === 'function') autoStart(); log(`🧭 Indo até <b>${nome}</b> (${nomeLugar(x, z)}).`, 'sys'); } });
    if (tp === 'fb') {
      const o = (Chefes.agenda() || []).find(a => a.k === k); if (!o) { aberto = 'lista'; return render(); }
      const D = MOBDEF[k], [x, z] = o.spot;
      dialog(`👑 ${o.B.name}`, `${fotoGrande(k)}<b>Chefe de campo · Nível ${o.B.lv}</b> · ${o.B.where}<br>❤️ ${o.B.hp.toLocaleString('pt-BR')} de vida (dividida entre todos) · ⚔️ ${o.B.atk} de ataque<br>${o.vivo ? `🟢 <b>Vivo agora</b> em ${nomeLugar(x, z)}${o.hp ? ` · ${o.hp}% de vida` : ''}. Vai embora em <b>${tempo(o.fim)}</b>.` : o.prox ? `⏳ Aparece em <b>${tempo(o.prox.em)}</b>, em ${nomeLugar(x, z)}, e fica 15 min.` : ''}<br>${(e => e && e.matou ? `🗡️ Último a derrotar: <b>${e.matou}</b>${e.quando ? `, há ${tempo(Date.now() - e.quando)}` : ''}<br>` : '')(estado['fb:' + k])}🗡️ Quem causar dano leva o saque.<br><br><b>Pode soltar:</b><div class="mvp-drops">${dropsDe(D) || '<i>—</i>'}</div>`,
        [ir(x, z, o.B.name), voltar, fechar]);
      return;
    }
    const D = MOBDEF['alfa_' + k], sp = SPAWNS.find(o => o.type === k && o.area), ac = Alfas.cur, aqui = ac && !ac.dead && ac.type === 'alfa_' + k;
    const x = aqui ? ac.x : sp ? (sp.area[0] + sp.area[1]) / 2 : P.x, z = aqui ? ac.z : sp ? (sp.area[2] + sp.area[3]) / 2 : P.z;
    dialog(`⭐ ${D.name}`, `${fotoGrande('alfa_' + k)}<b>Alfa · Nível ${D.lv}</b> · ${nomeLugar(x, z)}<br>❤️ ${D.hp.toLocaleString('pt-BR')} de vida · ⚔️ ${D.atk} de ataque<br>${aqui ? '🟢 <b>Está perto de você agora!</b>' : '✨ Cace os bichos dessa região: de 4 em 4 minutos um alfa aparece perto de quem está caçando ali (fica 8 min).'}<br><br><b>Pode soltar:</b><div class="mvp-drops">${dropsDe(D) || '<i>—</i>'}</div>`,
      [ir(x, z, aqui ? D.name : 'a região do ' + D.name), voltar, fechar]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500)); else setTimeout(init, 500);
  return { abrir, lista, lugar: nomeLugar };
})();
