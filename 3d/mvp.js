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
    Net.send({ t: 'mvps', ids: lista().map(o => o.id) });
  }
  function init() {
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
  function abrir() { aberto = 'lista'; pedir(); render(); }
  function render() {
    const rolA = (document.querySelector('#dialog .dtext') || {}).scrollTop || 0, rolB = (document.querySelector('#dialog .mvp-lista') || {}).scrollTop || 0, mesmo = render.ult === aberto; render.ult = aberto;
    try { render2(); } finally { if (mesmo) { const a = document.querySelector('#dialog .dtext'), b = document.querySelector('#dialog .mvp-lista'); if (a) a.scrollTop = rolA; if (b) b.scrollTop = rolB; } }
  }
  function render2() {
    if (aberto === 'lista') {
      const L = lista(), linhas = L.map(o => { const st = statusDe(o), s = estado[o.id];
        return `<div class="mvp-l${st.vivo ? ' vivo' : ''}" data-mvp="${o.id}"><span class="mvp-ic">${o.mvp ? '👑' : '⭐'}</span><span class="mvp-n"><b>${o.D.name}</b> <small>Nv ${o.D.lv} · ${o.mapa}</small><br><small>${st.txt}${s && s.matou ? ` · último: <b>${s.matou}</b>` : ''}</small></span></div>`; }).join('');
      dialog('👑 MVP e chefes', `<small>👑 MVP · ⭐ mini-chefe. Toque num deles para ver os drops e ir até lá.</small><div class="mvp-lista">${linhas || '<i>Nenhum chefe no mapa.</i>'}</div><small>🗓️ Kravenox: sábado 20h · Verme Colossal: de 15 em 15 dias · Campeão Sombrio: terça 21h (castelo da guilda).</small>`, [{ label: 'Fechar', fn: () => { aberto = null; } }]);
      document.querySelectorAll('#dialog [data-mvp]').forEach(el => el.addEventListener('click', () => { Audio8.sfx('click'); aberto = el.dataset.mvp; render(); }));
      return;
    }
    const o = lista().find(x => x.id === aberto); if (!o) { aberto = 'lista'; render(); return; }
    const st = statusDe(o), s = estado[o.id], D = o.D;
    const drops = (D.drops || []).filter(([id]) => ITEMS[id] && !/^(red|blue)$/.test(id)).slice(0, 12).map(([id, ch]) => `<span class="mvp-d">${ITEMS[id].ic || '•'} ${ITEMS[id].name} <small>${ch >= 1 ? '100' : (ch * 100).toFixed(ch < 0.01 ? 2 : 1).replace('.', ',')}%</small></span>`).join('');
    dialog(`${o.mvp ? '👑' : '⭐'} ${D.name}`, `<b>Nível ${D.lv}</b> · ${o.mapa}<br>❤️ ${D.hp.toLocaleString('pt-BR')} de vida · ⚔️ ${D.atk} de ataque<br>${st.txt}<br>${s && s.matou ? `🗡️ Último a derrotar: <b>${s.matou}</b>${s.quando ? `, há ${tempo(Date.now() - s.quando)}` : ''}` : '🗡️ Ninguém derrotou desde que o servidor acordou.'}<br>⏱️ Renasce ${Math.round((D.respawn || 0) / 60) || '?'} min depois de cair.<br><br><b>Pode soltar:</b><div class="mvp-drops">${drops || '<i>—</i>'}</div>`,
      [{ label: '🧭 Ir até lá', fn: () => { aberto = null; P.qGo = { x: o.x, z: o.z, name: D.name }; if (typeof autoStart === 'function') autoStart(); log(`🧭 Indo até <b>${D.name}</b> (${o.mapa}).`, 'sys'); } },
       { label: '← Voltar', fn: () => { aberto = 'lista'; render(); return true; } }, { label: 'Fechar', fn: () => { aberto = null; } }]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500)); else setTimeout(init, 500);
  return { abrir, lista };
})();
