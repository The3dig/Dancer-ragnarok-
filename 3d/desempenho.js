// =====================================================================
//  📈 Medidor de desempenho (liga no menu ❓): mostra no canto da tela os
//  quadros por segundo, o peso da cena e o lugar onde o jogo ficou mais lento.
//  Serve para o Rone dizer exatamente onde o celular trava.
// =====================================================================
'use strict';
const Desempenho = (() => {
  const ler = () => { try { return localStorage.getItem('medidor') === '1'; } catch (e) { return false; } };
  let ligado = ler(), el = null, n = 0, t0 = performance.now(), ultimo = performance.now(), piorQuadro = 0, fps = 60;
  const lugares = {};                                                     // zona -> { soma, quadros, pior }
  function montar() {
    if (el) return;
    el = document.createElement('div'); el.id = 'medidor';
    el.addEventListener('pointerdown', e => { e.stopPropagation(); relatorio(); });
    document.body.appendChild(el);
  }
  function quadro() {
    const agora = performance.now(), dt = agora - ultimo; ultimo = agora; n++; piorQuadro = Math.max(piorQuadro, dt);
    if (agora - t0 >= 1000) {
      const quadros = Math.max(1, n);
      fps = Math.round(n * 1000 / (agora - t0)); n = 0; t0 = agora;
      const z = typeof running !== 'undefined' && running && typeof zoneOf === 'function' ? zoneOf(P.x, P.z) : '';
      const nome = z && typeof ZONES !== 'undefined' && ZONES[z] ? ZONES[z].name : z || '—';
      if (z) { const L = lugares[nome] = lugares[nome] || { soma: 0, seg: 0, pior: 99 }; L.soma += fps; L.seg++; L.pior = Math.min(L.pior, fps); }
      if (ligado) {
        montar();
        const info = typeof renderer !== 'undefined' ? renderer.info : null;
        // o jogo desenha em duas etapas por quadro: soma tudo do último segundo e divide pelos quadros
        if (info && info.autoReset) info.autoReset = false;
        const chamadas = info ? Math.round(info.render.calls / quadros) : '?', tri = info ? Math.round(info.render.triangles / quadros / 1000) : '?';
        if (info) info.reset();
        const mem = performance.memory ? ` · 🧠 ${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : '';
        const cor = fps >= 40 ? '#7dff6a' : fps >= 25 ? '#ffd860' : '#ff6a50';
        el.innerHTML = `<b style="color:${cor}">${fps} qps</b> · pior ${Math.round(piorQuadro)} ms<br>🎨 ${chamadas} desenhos · ${tri} mil triângulos<br>📦 ${info ? info.memory.geometries : '?'} formas · ${info ? info.memory.textures : '?'} texturas${mem}<br>👾 ${typeof mobs !== 'undefined' ? mobs.length : '?'} monstros · 📍 ${nome}<br><small>toque para o relatório</small>`;
        el.style.display = 'block';
      } else if (el) el.style.display = 'none';
      piorQuadro = 0;
    }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
  // relatório: os lugares mais lentos desta sessão (para mandar ao Claude)
  function relatorio() {
    const l = Object.entries(lugares).filter(([, L]) => L.seg >= 3).map(([nome, L]) => [nome, Math.round(L.soma / L.seg), L.pior]).sort((a, b) => a[1] - b[1]);
    const txt = l.length ? l.map(([nome, m, p]) => `${nome}: média <b>${m}</b> qps, pior <b>${p}</b>`).join('<br>') : 'Ainda sem dados: jogue uns segundos em cada lugar.';
    const info = typeof renderer !== 'undefined' ? renderer.info : null;
    dialog('📈 Relatório de desempenho', `Lugares desta sessão, do mais lento para o mais rápido (qps = quadros por segundo; 60 é perfeito, abaixo de 25 trava):<br>${txt}<br><small>Aparelho: ${navigator.userAgent.match(/iPhone|iPad|Android|Mac|Windows/)?.[0] || '?'} · tela ${innerWidth}×${innerHeight} · qualidade ${typeof QUAL !== 'undefined' ? QUAL.level : '?'}${typeof MODO_LEVE !== 'undefined' && MODO_LEVE ? ' (modo leve)' : ''} · ${info ? info.programs.length : '?'} programas de desenho. Tire um print e mande para o Claude.</small>`, [{ label: 'Fechar' }]);
  }
  function alternar() { ligado = !ligado; try { localStorage.setItem('medidor', ligado ? '1' : '0'); } catch (e) { } if (!ligado && el) el.style.display = 'none'; if (!ligado && typeof renderer !== 'undefined') renderer.info.autoReset = true; log(ligado ? '📈 Medidor de desempenho <b>ligado</b> (canto de cima, à esquerda). Toque nele para ver o relatório.' : '📈 Medidor de desempenho desligado.', 'sys'); }
  return { alternar, relatorio, get ligado() { return ligado; } };
})();
