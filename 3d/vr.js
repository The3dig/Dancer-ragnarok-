// =====================================================================
//  🥽 Realidade virtual (Meta Quest), EXPERIMENTAL — ver docs/projeto-vr.md.
//  O botão só aparece se o navegador tiver VR (o do Quest tem; iPhone e PC não).
//  Câmera "maquete": você fica parado um pouco atrás e acima do herói, olhando
//  em volta com a cabeça, e o herói anda na sua frente (assim não enjoa).
//  Controles do Quest: analógico esquerdo anda, gatilho direito ataca, A e B
//  usam as duas primeiras habilidades. O controle de Xbox continua valendo.
//  Os painéis (vida, mochila...) ainda não aparecem dentro dos óculos.
// =====================================================================
'use strict';
const VR = (() => {
  let suporte = false, sessao = null, dolly = null, apertado = {};
  if (navigator.xr && navigator.xr.isSessionSupported) navigator.xr.isSessionSupported('immersive-vr').then(ok => { suporte = !!ok; if (ok) botao(); }).catch(() => { });
  function botao() {
    const tenta = () => { const m = document.getElementById('menu'); if (!m || document.getElementById('btn-vr')) return; const b = document.createElement('button'); b.id = 'btn-vr'; b.title = 'Entrar em VR (experimental)'; b.textContent = '🥽'; b.onclick = entrar; m.insertBefore(b, document.getElementById('btn-help')); };
    tenta(); setTimeout(tenta, 3000);
  }
  async function entrar() {
    if (!suporte || sessao) return;
    try {
      sessao = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });
      renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor'); await renderer.xr.setSession(sessao);
      dolly = new THREE.Group(); scene.add(dolly); dolly.add(camera); camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
      QUAL.level = 0; applyQuality();                                       // no VR o desenho é duplo: tudo no leve
      window.VR_ATIVO = true; renderer.setAnimationLoop(t => { lerControles(); loop(t); });
      sessao.addEventListener('end', sair);
      log('🥽 <b>VR ligado</b> (experimental). Analógico esquerdo anda, gatilho direito ataca, A e B usam habilidades. Para sair, use o botão do Quest.', 'gold');
    } catch (e) { sessao = null; log('🥽 Não deu para entrar em VR: ' + (e && e.message || e), 'bad'); }
  }
  function sair() {
    window.VR_ATIVO = false; renderer.setAnimationLoop(null); renderer.xr.enabled = false;
    if (dolly) { scene.add(camera); scene.remove(dolly); dolly = null; }
    sessao = null; requestAnimationFrame(loop); log('🥽 VR desligado.', 'sys');
  }
  // câmera maquete: o "corpo" (dolly) fica atrás e acima do herói, virado para onde a câmera olhava
  function cameraVR() {
    if (!dolly) return;
    const yaw = camS.yaw, d = 6;
    dolly.position.set(P.x + Math.sin(yaw) * d, P.y + 2.2, P.z + Math.cos(yaw) * d); dolly.rotation.set(0, yaw, 0);
  }
  function lerControles() {
    if (!sessao) return;
    let jx = 0, jy = 0;
    for (const src of sessao.inputSources) {
      const gp = src.gamepad; if (!gp) continue;
      if (src.handedness === 'left') { jx = gp.axes[2] || 0; jy = gp.axes[3] || 0; }
      if (src.handedness === 'right') {
        const b = (i, f) => { const on = !!(gp.buttons[i] && gp.buttons[i].pressed); if (on && !apertado[i]) f(); apertado[i] = on; };
        if (gp.buttons[0] && gp.buttons[0].pressed) attack();             // gatilho: segura para atacar
        b(4, () => useSkill(0)); b(5, () => useSkill(1));                    // A e B
        if (Math.abs(gp.axes[2] || 0) > 0.6) camS.yaw -= (gp.axes[2] || 0) * 0.03;   // analógico direito gira a vista
      }
    }
    joy.x = Math.abs(jx) > 0.15 ? jx : 0; joy.y = Math.abs(jy) > 0.15 ? jy : 0;
  }
  return { entrar, cameraVR, get suporte() { return suporte; } };
})();
