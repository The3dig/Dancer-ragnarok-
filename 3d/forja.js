// =====================================================================
//  Animação do refino: o Ferreiro Doran aparece na forja e martela a peça
//  na bigorna (3 golpes, faíscas e brasa). No fim: SUCESSO (brilho dourado),
//  FALHOU (a peça volta um nível) ou QUEBROU (a peça se parte em pedaços).
//  Tudo desenhado num canvas, leve para o celular.
// =====================================================================
'use strict';
const Forja = (() => {
  let el = null, cv = null, g = null, raf = 0, fim = null;
  function montar() {
    if (el) return;
    el = document.createElement('div'); el.id = 'forja'; el.className = 'hidden';
    el.innerHTML = '<div class="fj-caixa"><canvas width="520" height="300"></canvas><div class="fj-txt"></div><div class="fj-dica">toque para continuar</div></div>';
    document.body.appendChild(el); cv = el.querySelector('canvas'); g = cv.getContext('2d');
    el.addEventListener('pointerdown', () => { if (fim && fim.pode) fechar(); });
  }
  function fechar() {
    if (!fim) return; const cb = fim.cb; fim = null; cancelAnimationFrame(raf); el.classList.add('hidden');
    if (typeof dialogOpen !== 'undefined') dialogOpen = false;
    cb && cb();
  }
  // o controle também fecha (A/B), quando o resultado já apareceu
  function botao() { if (fim && fim.pode) fechar(); }

  const GOLPES = [0.55, 1.15, 1.75], REVELA = 2.25;
  function animar(o, cb) {
    montar(); el.classList.remove('hidden'); el.querySelector('.fj-txt').innerHTML = o.desp !== undefined ? `✨ Doran desperta <b>${o.ic} ${o.nome}</b> com a força do Cisma…` : `🔨 Doran martela <b>${o.ic} +${o.de} ${o.nome}</b>${o.selo ? ' <small>(🔰 com Selo)</small>' : ''}…`;
    el.querySelector('.fj-dica').style.opacity = 0;
    if (typeof dialogOpen !== 'undefined') dialogOpen = true;           // o herói não anda nem ataca enquanto a forja trabalha
    const t0 = performance.now(), faiscas = [], cacos = []; let golpe = 0, revelou = false;
    fim = { cb, pode: false };
    const passo = () => {
      const t = (performance.now() - t0) / 1000;
      while (golpe < GOLPES.length && t >= GOLPES[golpe]) {
        golpe++; Audio8.sfx('anvil');
        for (let k = 0; k < 22; k++) faiscas.push({ x: 300, y: 196, vx: (Math.random() - 0.5) * 420, vy: -Math.random() * 360 - 60, v: 0.5 + Math.random() * 0.5, t: 0 });
      }
      if (!revelou && t >= REVELA) {
        revelou = true; fim.pode = true; setTimeout(() => { if (fim) el.querySelector('.fj-dica').style.opacity = 1; }, 500);
        const tx = el.querySelector('.fj-txt');
        if (o.res === 'sucesso') { Audio8.sfx('level'); tx.innerHTML = o.desp !== undefined ? `<b class="fj-ok">DESPERTOU!</b> ${o.ic} <b>${o.nome.replace(/ ★+$/, '')} ${'★'.repeat(o.desp)}</b>` : `<b class="fj-ok">SUCESSO!</b> ${o.ic} <b>+${o.para} ${o.nome}</b>`; for (let k = 0; k < 40; k++) faiscas.push({ x: 300, y: 190, vx: (Math.random() - 0.5) * 520, vy: -Math.random() * 420, v: 0.9 + Math.random() * 0.6, t: 0, ouro: true }); }
        else if (o.res === 'quebrou') { Audio8.sfx('boom'); tx.innerHTML = `<b class="fj-ruim">QUEBROU!</b> A ${o.ic} <b>+${o.de} ${o.nome}</b> se partiu e sumiu.`; for (let k = 0; k < 14; k++) cacos.push({ x: 300, y: 186, vx: (Math.random() - 0.5) * 380, vy: -Math.random() * 300 - 80, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, s: 6 + Math.random() * 10 }); }
        else { Audio8.sfx('miss'); tx.innerHTML = o.desp !== undefined ? `<b class="fj-falhou">FALHOU…</b> Os materiais se perderam, mas ${o.ic} <b>${o.nome}</b> continua inteira.` : `<b class="fj-falhou">FALHOU…</b> ${o.selo ? '🔰 O Selo protegeu a peça: ' : ''}${o.ic} <b>${o.nome}</b> ficou <b>+${o.para}</b>.`; }
      }
      desenhar(t, o, faiscas, cacos, revelou);
      raf = requestAnimationFrame(passo);
      if (revelou && t > REVELA + 6) fechar();                           // fecha sozinho depois de um tempo
    };
    raf = requestAnimationFrame(passo);
  }

  // braço do martelo: sobe devagar, desce rápido em cada golpe
  function anguloBraco(t) {
    for (const gt of GOLPES) { const d = t - gt; if (d > -0.4 && d <= 0) return -1.9 + (d + 0.4) / 0.4 * 0.3; if (d > 0 && d < 0.08) return -1.6 + d / 0.08 * 2.1; if (d >= 0.08 && d < 0.18) return 0.5; }
    return t < GOLPES[0] - 0.4 ? -0.3 - Math.min(1, t / 0.15) * 1.6 : t > GOLPES[2] + 0.18 ? Math.max(-0.3, 0.5 - (t - GOLPES[2] - 0.18) * 2) : -1.9;
  }
  function desenhar(t, o, faiscas, cacos, revelou) {
    const W = cv.width, H = cv.height, dt = 1 / 60;
    // fundo: a forja de pedra com a boca em brasa
    const fl = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 3.3);
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a0f0a'); bg.addColorStop(1, '#3a2014'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#4a3a34'; g.fillRect(30, 70, 150, 170); g.fillRect(60, 10, 60, 70);
    const br = g.createRadialGradient(105, 190, 4, 105, 190, 90); br.addColorStop(0, `rgba(255,190,90,${0.95 * fl})`); br.addColorStop(0.4, `rgba(255,90,20,${0.6 * fl})`); br.addColorStop(1, 'rgba(255,60,0,0)');
    g.fillStyle = br; g.fillRect(0, 90, 240, 200);
    g.fillStyle = `rgb(255,${110 + 60 * fl},30)`; g.fillRect(60, 175, 90, 28);
    g.fillStyle = '#2a1a12'; g.fillRect(0, 262, W, 38);
    // bigorna
    g.fillStyle = '#3a3a42'; g.beginPath(); g.moveTo(250, 200); g.lineTo(360, 200); g.lineTo(372, 188); g.lineTo(238, 188); g.closePath(); g.fill();
    g.fillRect(262, 200, 76, 16); g.fillRect(282, 216, 36, 30); g.fillRect(266, 246, 68, 16);
    g.fillStyle = '#5a5a66'; g.fillRect(238, 186, 134, 4);
    // a peça na bigorna (ícone), vermelha de quente enquanto martela; dourada no sucesso
    if (!(revelou && o.res === 'quebrou')) {
      const quente = Math.min(1, t / 0.6);
      if (revelou && o.res === 'sucesso') { const k = 0.6 + 0.4 * Math.sin(t * 6); const gl = g.createRadialGradient(300, 172, 2, 300, 172, 60); gl.addColorStop(0, `rgba(255,220,90,${k})`); gl.addColorStop(1, 'rgba(255,200,60,0)'); g.fillStyle = gl; g.fillRect(230, 100, 140, 140); }
      else { const gl = g.createRadialGradient(300, 176, 2, 300, 176, 34); gl.addColorStop(0, `rgba(255,80,20,${0.7 * quente})`); gl.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gl; g.fillRect(260, 140, 80, 70); }
      g.font = '34px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const pulo = GOLPES.some(gt => t - gt > 0 && t - gt < 0.12) ? -4 : 0; g.fillText(o.ic, 300, 168 + pulo);
    }
    // Doran: corpo, avental, cabeça com barba, braço com o martelo
    const cx = 420, cy = 196;
    g.fillStyle = '#6a4a34'; g.fillRect(cx - 26, cy - 40, 52, 80);             // tronco
    g.fillStyle = '#3a2a20'; g.fillRect(cx - 22, cy - 26, 44, 70);             // avental de couro
    g.fillStyle = '#2a2420'; g.fillRect(cx - 22, cy + 40, 18, 26); g.fillRect(cx + 4, cy + 40, 18, 26);   // pernas
    g.fillStyle = '#e0a878'; g.beginPath(); g.arc(cx, cy - 58, 18, 0, Math.PI * 2); g.fill();            // cabeça
    g.fillStyle = '#8a8a90'; g.beginPath(); g.moveTo(cx - 16, cy - 54); g.quadraticCurveTo(cx, cy - 18, cx + 16, cy - 54); g.fill();   // barba grisalha
    g.fillStyle = '#2a1a14'; g.fillRect(cx - 9, cy - 64, 5, 4); g.fillRect(cx + 3, cy - 64, 5, 4);     // olhos
    g.fillStyle = '#5a3a2a'; g.fillRect(cx - 18, cy - 78, 36, 8);                                       // faixa na testa
    g.fillStyle = '#e0a878'; g.beginPath(); g.arc(cx + 20, cy - 4, 7, 0, Math.PI * 2); g.fill();        // mão de apoio
    // braço do martelo (ombro em cx-22, cy-30)
    const a = anguloBraco(t), sx = cx - 22, sy = cy - 30;
    g.save(); g.translate(sx, sy); g.rotate(a - 0.2);
    g.fillStyle = '#c88a60'; g.fillRect(-60, -7, 62, 14);                      // braço
    g.fillStyle = '#6a4a2a'; g.fillRect(-92, -4, 40, 8);                       // cabo
    g.fillStyle = '#4a4a52'; g.fillRect(-104, -16, 22, 32);                    // cabeça do martelo
    g.restore();
    // faíscas e cacos
    for (const f of faiscas) { if (f.t > f.v) continue; f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 600 * dt; const k = 1 - f.t / f.v; g.fillStyle = f.ouro ? `rgba(255,225,110,${k})` : `rgba(255,${150 + 80 * k},60,${k})`; g.fillRect(f.x, f.y, f.ouro ? 4 : 3, f.ouro ? 4 : 3); }
    for (const c of cacos) { c.x += c.vx * dt; c.y = Math.min(258, c.y + c.vy * dt); c.vy += 700 * dt; c.r += c.vr * dt; g.save(); g.translate(c.x, c.y); g.rotate(c.r); g.fillStyle = '#9a8a80'; g.beginPath(); g.moveTo(-c.s / 2, 0); g.lineTo(0, -c.s); g.lineTo(c.s / 2, c.s / 3); g.closePath(); g.fill(); g.restore(); }
    // letreiro do resultado
    if (revelou) {
      const k = Math.min(1, (t - REVELA) * 4), txt = o.res === 'sucesso' ? 'SUCESSO!' : o.res === 'quebrou' ? 'QUEBROU!' : 'FALHOU';
      g.save(); g.globalAlpha = k; g.translate(W / 2, 64); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      g.font = 'bold 54px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8; g.strokeStyle = '#120a06'; g.strokeText(txt, 0, 0);
      g.fillStyle = o.res === 'sucesso' ? '#ffd860' : o.res === 'quebrou' ? '#ff4a3a' : '#c8c0d0'; g.fillText(txt, 0, 0); g.restore();
    }
  }
  return { animar, botao, get aberta() { return !!fim; } };
})();
