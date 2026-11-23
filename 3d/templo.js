// =====================================================================
//  🏛️ Templo do Eco Selado (ideia do Rone; criado para o jogo, não está no livro).
//  Uma ruína sob Solmira com 6 salas em fila. O foco não é matar monstro:
//  é pensar, ter reflexo e prestar atenção. A Estudiosa Ilka manda você descer.
//   1. O Piso que Lembra   — as placas seguras brilham por um instante; pise errado e saem espinhos.
//   2. Corredor das Lâminas — lâminas gigantes balançam; passe no tempo certo ou use a esquiva.
//   3. As Quatro Alavancas — uma charada diz a ordem dos símbolos ☀️ 🌙 ⭐ 🌑.
//   4. A Luz dos Espelhos  — gire os espelhos para levar o raio até o cristal.
//   5. A Ponte que Desaba  — runas mostram as pedras firmes; as pedras caem pouco depois de pisar.
//   6. O Guardião do Eco   — imune até os 4 pilares estarem acesos ao mesmo tempo.
//  Sem relógio de desabar: conta o TEMPO e as QUEDAS. Baú de ouro, prata ou bronze. 🏆 Ranking.
//  Em grupo (até 6): nas alavancas são duas pessoas ao mesmo tempo; o Guardião é o mesmo para todos.
// =====================================================================
'use strict';
const Templo = (() => {
  const HW = 6, HL = 15, ENTRA = 12.5, PORTA = -13.4, LIMITE = 3;
  const SAIDA = { x: VIL.x, z: VIL.z - 11.5 };                              // em Solmira, na frente da Ilka
  const NOMES = ['O Piso que Lembra', 'O Corredor das Lâminas', 'As Quatro Alavancas', 'A Luz dos Espelhos', 'A Ponte que Desaba', 'O Guardião do Eco'];
  let run = null, salas = [];
  // sorteio com semente (no grupo todos têm o mesmo templo)
  const sorteador = seed => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  const hashStr = t => { let h = 2166136261; for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
  const loc = (S, x, z) => [x - S.x, z - S.z];
  const salaDe = (x, z) => { if (!inTower(z)) return null; const f = floorAt(x, z); return f && f.templo ? f.sala : null; };
  const dentro = () => salaDe(P.x, P.z) !== null;
  const membrosNaSala = s => (typeof Grupo !== 'undefined' && run && run.grupo ? Grupo.membros().filter(r => r.s && r.s.st !== 'd' && salaDe(r.x, r.z) === s) : []);

  // ---------------- materiais e peças comuns
  const pedra = PM('pedra.jpg', [3, 8], new THREE.Color(0.62, 0.58, 0.52)), pedraP = PM('pedra.jpg', [8, 2], new THREE.Color(0.5, 0.47, 0.44));
  const ouroM = new THREE.MeshLambertMaterial({ color: 0xd8a840 }), escuro = new THREE.MeshBasicMaterial({ color: 0x050304 });
  function texto(linhas, w = 512, h = 256, cor = '#f0e2c0', fundo = '#2a2018') {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = fundo; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8a840'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = cor; g.textAlign = 'center'; g.textBaseline = 'middle';
    linhas.forEach((l, i) => { g.font = (i === 0 ? 'bold 34px' : '26px') + ' Georgia'; g.fillText(l, w / 2, h * (i + 1) / (linhas.length + 1)); });
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false });
  }
  function construirSala(S) {
    const g = new THREE.Group(); g.position.set(S.x, 0, S.z); g.visible = false; scene.add(g);
    const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, HL * 2).rotateX(-Math.PI / 2), pedra); chao.receiveShadow = true; g.add(chao);
    // paredes só com o lado de dentro: de fora (onde a câmera fica, atrás de você) dá para ver através delas
    const parede = (w, x, z, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 6), pedraP); p.position.set(x, 3, z); p.rotation.y = ry; g.add(p); };
    parede(HL * 2, -HW, 0, Math.PI / 2); parede(HL * 2, HW, 0, -Math.PI / 2); parede(HW * 2, 0, HL, Math.PI); parede(HW * 2, 0, -HL, 0);
    const teto = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2 + 1, HL * 2 + 1).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x1a1612 })); teto.position.y = 6; g.add(teto);
    // porta ao norte (sobe quando a sala é vencida) com o portal de luz atrás
    box(0.8, 4.4, 0.8, ouroM, -2.2, 2.2, PORTA); box(0.8, 4.4, 0.8, ouroM, 2.2, 2.2, PORTA); box(5.2, 0.8, 0.8, ouroM, 0, 4.6, PORTA);
    const porta = box(3.6, 4, 0.4, pedraP, 0, 2, PORTA - 0.1);
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.8), new THREE.MeshBasicMaterial({ color: 0xa0e0ff, transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide })); portal.position.set(0, 1.9, PORTA - 0.6); g.add(portal);
    // nome da sala na parede da entrada
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), texto([NOMES[S.sala]], 512, 128)); placa.position.set(0, 5.45, -HL + 0.05); placa.scale.set(0.85, 0.8, 1); g.add(placa);   // acima da porta, de frente para quem entra
    const luz = new THREE.PointLight(0xffe0b0, 1.2, 40); luz.position.set(0, 5, 0); g.add(luz);
    return { S, g, box, porta, portal, aberta: false, obs: [] };
  }
  function abrir(sala, msg) {
    if (sala.aberta) return; sala.aberta = true;
    Audio8.sfx('level'); if (msg) log(msg, 'gold'); banner('🚪 A PORTA SE ABRIU');
  }
  // ---------------- espinhos e dano das armadilhas
  const espGeo = new THREE.ConeGeometry(0.22, 1.4, 6), espMat = new THREE.MeshLambertMaterial({ color: 0x8a8a90 });
  function espinhos(S, lx, lz) {
    for (let k = 0; k < 7; k++) { const e = new THREE.Mesh(espGeo, espMat); e.position.set(S.x + lx + rand(-0.8, 0.8), 0.7, S.z + lz + rand(-0.8, 0.8)); scene.add(e); fx.push({ m: e, life: 0.8, max: 0.8, kind: 'note', v: new THREE.Vector3(0, -0.6, 0) }); }
    Audio8.sfx('crit');
  }
  function cair(motivo, frac = 0.18) {
    if (!run || P.dead) return;
    run.quedas++; const d = Math.max(1, Math.round(stats.maxHp() * frac)); P.hp -= d; floater(P.x, P.y + 2, P.z, d, 'hurt'); hurtFlash(frac);
    if (P.hp <= 0) { P.hp = 0; P.dead = true; P.deadT = 3; onDeath(); return; }
    log(`💢 ${motivo} <small>(quedas: ${run.quedas})</small>`, 'bad');
    voltarAoComeco();
  }
  function voltarAoComeco() { const S = TEMPLO[run.sala]; P.x = S.x; P.z = S.z + ENTRA; P.y = 0; P.face = Math.PI; P.dashT = 0; P.protT = time + 1; camS.x = P.x; camS.z = P.z; reiniciarSala(run.sala); }

  // ================= SALA 1: O Piso que Lembra =================
  const P1 = { cols: [-4.4, -2.2, 0, 2.2, 4.4], rows: [8.8, 6.6, 4.4, 2.2, 0, -2.2] };
  function montar1(sala) {
    sala.placas = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) { const m = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 2.0), new THREE.MeshLambertMaterial({ color: 0x8a8070, emissive: 0x000000 })); m.position.set(P1.cols[c], 0.06, P1.rows[r]); sala.g.add(m); sala.placas.push({ r, c, m }); }
    const dica = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.2), texto(['Volte aqui para ver de novo'], 512, 128)); dica.position.set(HW - 0.05, 2.6, 7); dica.rotation.y = -Math.PI / 2; sala.g.add(dica);
  }
  function preparar1(sala, rnd) {
    let c = Math.floor(rnd() * 5); sala.seguro = new Set();
    for (let r = 0; r < 6; r++) { sala.seguro.add(r + ',' + c); if (r < 5) { const nc = Math.max(0, Math.min(4, c + Math.floor(rnd() * 3) - 1)); if (nc !== c) sala.seguro.add((r) + ',' + nc); c = nc; } }
    sala.mostrarAte = 0; sala.viuT = -99;
  }
  function tick1(sala, lx, lz) {
    if (lz > 10.3 && time - sala.viuT > 6) { sala.viuT = time; sala.mostrarAte = time + 4.5; log('✨ As placas seguras brilham... decore o caminho!', 'sys'); Audio8.sfx('buff'); }
    const mostra = time < sala.mostrarAte;
    for (const p of sala.placas) p.m.material.emissive.setHex(mostra && sala.seguro.has(p.r + ',' + p.c) ? 0x40c0ff : 0x000000);
    if (lz < 9.9 && lz > -3.3) {
      const c = Math.round((lx + 4.4) / 2.2), r = Math.round((8.8 - lz) / 2.2);
      if (r >= 0 && r < 6 && c >= 0 && c < 5 && Math.abs(lx - P1.cols[c]) < 0.95 && Math.abs(lz - P1.rows[r]) < 0.95 && !sala.seguro.has(r + ',' + c)) { espinhos(sala.S, P1.cols[c], P1.rows[r]); cair('Placa errada! Espinhos saíram do chão.'); }
    }
    if (lz < -4) abrir(sala, '🚪 Você atravessou o <b>Piso que Lembra</b>!');
  }

  // ================= SALA 2: O Corredor das Lâminas =================
  function montar2(sala) {
    sala.laminas = [7, 2.5, -2, -6.5].map((z, k) => {
      const piv = new THREE.Group(); piv.position.set(0, 5.6, z); sala.g.add(piv);
      const haste = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.3, 0.12), ouroM); haste.position.y = -2.15; piv.add(haste);
      const lam = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.12), new THREE.MeshPhongMaterial({ color: 0xc8ccd8, shininess: 80 })); lam.position.y = -4.6; piv.add(lam);
      return { z, piv, w: 1.5 + k * 0.25, ph: k * 1.7 };
    });
    const dica = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.2), texto(['A esquiva atravessa a lâmina'], 512, 128)); dica.position.set(HW - 0.05, 2.6, 7); dica.rotation.y = -Math.PI / 2; sala.g.add(dica);
  }
  function tick2(sala, lx, lz) {
    for (const L of sala.laminas) {
      const a = Math.sin(time * L.w * (L.vel || 1) + L.ph) * 1.05; L.piv.rotation.z = a; const bx = Math.sin(a) * 4.6;
      if (Math.abs(lz - L.z) < 0.7 && Math.abs(lx - bx) < 1.15 && !(P.dashT > 0) && !(P.protT && time < P.protT)) { cair('A lâmina te acertou!', 0.2); return; }
    }
    if (lz < -9.5) abrir(sala, '🚪 Você passou pelo <b>Corredor das Lâminas</b>!');
  }

  // ================= SALA 3: As Quatro Alavancas =================
  const SIMB = ['☀️', '🌙', '⭐', '🌑'], PADS3 = [[-4, 4], [4, 4], [-4, -4], [4, -4]];
  const CHARADAS = [
    ['Primeiro o que nasce, depois o que segue,', 'então o que cai, e por fim o que fica.', [0, 1, 2, 3]],
    ['A noite chega primeiro; a estrela cai sobre ela;', 'o sol a expulsa; e a sombra fica no fim.', [1, 2, 0, 3]],
    ['Na sombra tudo começa; o sol rasga a sombra;', 'a lua o substitui; a estrela fecha o ciclo.', [3, 0, 1, 2]],
    ['A estrela guia a noite; a noite chama a sombra;', 'a sombra foge do sol, que vem por último.', [2, 1, 3, 0]],
  ];
  function montar3(sala) {
    sala.pads = PADS3.map(([x, z], k) => {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.15, 20), new THREE.MeshLambertMaterial({ color: 0x6a6050, emissive: 0x000000 })); base.position.set(x, 0.08, z); sala.g.add(base);
      const al = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.2, 0.14), ouroM); al.position.set(x + (x > 0 ? 0.9 : -0.9), 0.6, z); al.rotation.z = 0.5; sala.g.add(al);
      const sp = iconeSprite(SIMB[k]); sp.position.set(x, 2.2, z); sp.scale.setScalar(1.3); sala.g.add(sp);
      return { x, z, k, base, al, t: 0 };
    });
  }
  function preparar3(sala, rnd) {
    const ch = CHARADAS[Math.floor(rnd() * CHARADAS.length)]; sala.ordem = ch[2]; sala.prox = 0; sala.feitos = new Set();
    if (sala.quadro) sala.g.remove(sala.quadro);
    sala.quadro = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.2), texto(['📜 A charada da parede', ch[0], ch[1]], 1024, 320)); sala.quadro.position.set(-HW + 0.05, 3.2, 0); sala.quadro.rotation.y = Math.PI / 2; sala.g.add(sala.quadro);   // na parede da esquerda (a da frente tem a porta)
    for (const p of sala.pads) { p.base.material.emissive.setHex(0); p.al.rotation.z = p.x > 0 ? -0.5 : 0.5; p.t = 0; }
  }
  function tick3(sala, lx, lz, dt) {
    const S = sala.S, grupo = !!(run.grupo), outros = membrosNaSala(S.sala).map(r => loc(S, r.x, r.z));
    const ocupado = p => [[lx, lz], ...outros].some(([x, z]) => Math.hypot(x - p.x, z - p.z) < 1.1);
    if (sala.aberta) return;
    if (!grupo) {                                                         // sozinho: um símbolo de cada vez, na ordem da charada
      for (const p of sala.pads) {
        if (sala.feitos.has(p.k)) continue;
        if (ocupado(p)) p.t += dt; else p.t = 0;
        if (p.t > 0.5) {
          p.t = 0;
          if (sala.ordem[sala.prox] === p.k) { sala.feitos.add(p.k); sala.prox++; p.base.material.emissive.setHex(0xffb040); p.al.rotation.z *= -1; Audio8.sfx('coin'); log(`🔓 ${SIMB[p.k]} certo! (${sala.prox} de 4)`, 'sys'); }
          else { Audio8.sfx('miss'); errar3(sala); return; }
        }
      }
      if (sala.prox >= 4) abrir(sala, '🚪 A charada estava certa: as <b>Quatro Alavancas</b> abriram a porta!');
    } else {                                                              // em grupo: os símbolos saem em PARES, duas pessoas ao mesmo tempo
      const par = [sala.ordem[sala.prox], sala.ordem[sala.prox + 1]], ps = par.map(k => sala.pads[k]);
      for (const p of sala.pads) if (!sala.feitos.has(p.k) && !par.includes(p.k) && ocupado(p)) { if ((p.t += dt) > 0.8) { p.t = 0; errar3(sala); return; } } else if (!par.includes(p.k)) p.t = 0;
      if (ps.every(ocupado)) { sala.parT = (sala.parT || 0) + dt; if (sala.parT > 0.6) { sala.parT = 0; ps.forEach(p => { sala.feitos.add(p.k); p.base.material.emissive.setHex(0xffb040); p.al.rotation.z *= -1; }); sala.prox += 2; Audio8.sfx('coin'); log(`🔓 ${SIMB[par[0]]} e ${SIMB[par[1]]} juntos! (${sala.prox} de 4)`, 'sys'); } }
      else { sala.parT = 0; if (ps.some(ocupado) && !sala.avisoPar) { sala.avisoPar = true; log('👥 Em grupo, os símbolos vão em <b>pares</b>: duas pessoas, cada uma numa placa, <b>ao mesmo tempo</b> (na ordem da charada).', 'sys'); } }
      if (sala.prox >= 4) abrir(sala, '🚪 Juntos vocês resolveram as <b>Quatro Alavancas</b>!');
    }
  }
  function errar3(sala) {
    log('💢 Ordem errada! As alavancas voltaram e criaturas saíram das paredes.', 'bad'); run.quedas++;
    const L = Math.max(10, Math.min(100, P.lv)), tipos = Object.keys(MOBDEF).filter(t => { const d = MOBDEF[t]; return !d.boss && !d.mini && !d.alfa && !d.field && !d.world && d.drops; }).sort((a, b) => Math.abs(MOBDEF[a].lv - L) - Math.abs(MOBDEF[b].lv - L)).slice(0, 3);
    for (let k = 0; k < 3; k++) { const m = spawnMob(tipos[k % tipos.length], null, { x: sala.S.x + rand(-4, 4), z: sala.S.z + rand(-2, 2) }); m.templo = true; m.noRespawn = true; m.towerFloor = 'templo'; m.state = 'chase'; }
    preparar3(sala, Math.random);
    sala.ordem = sala.ordemFixa || sala.ordem;
  }

  // ================= SALA 4: A Luz dos Espelhos =================
  // espelho com 2 posições: 0 desvia (dx,dz)→(−dz,−dx); 1 desvia (dx,dz)→(dz,dx)
  const ESP = [{ x: 3, z: 8, certo: 0 }, { x: 3, z: -1, certo: 1 }, { x: -3, z: -1, certo: 1 }, { x: -1, z: 4, certo: null }];
  const FONTE = { x: -5.6, z: 8, dx: 1, dz: 0 }, ALVO = { x: -3, z: -11 };
  function montar4(sala) {
    sala.esp = ESP.map((e, k) => {
      const g = new THREE.Group(); g.position.set(e.x, 0, e.z); sala.g.add(g);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.6, 12), ouroM); base.position.y = 0.3; g.add(base);
      const vidro = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.08), new THREE.MeshPhongMaterial({ color: 0xd0f0ff, shininess: 120, emissive: 0x204050 })); vidro.position.y = 1.3; g.add(vidro);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), new THREE.MeshLambertMaterial({ color: 0x4a6a8a, emissive: 0x102030 })); pad.position.set(e.x, 0.05, e.z + 1.6); sala.g.add(pad);
      sala.obs.push({ x: e.x, z: e.z, r: 0.6 });
      return { ...e, k, g, vidro, est: 0, dentro: false };
    });
    const fonte = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe080, toneMapped: false })); fonte.position.set(FONTE.x, 1.3, FONTE.z); sala.g.add(fonte);
    sala.cristal = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), new THREE.MeshLambertMaterial({ color: 0x4080ff, emissive: 0x102040 })); sala.cristal.position.set(ALVO.x, 1.3, ALVO.z); sala.cristal.scale.y = 1.6; sala.g.add(sala.cristal);
    sala.obs.push({ x: ALVO.x, z: ALVO.z, r: 0.6 });
    sala.raioM = new THREE.MeshBasicMaterial({ color: 0xffe060, toneMapped: false, transparent: true, opacity: 0.85 }); sala.raios = [];
    const dica = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.2), texto(['Pise na placa azul para girar o espelho'], 640, 128)); dica.position.set(HW - 0.05, 2.6, 7); dica.rotation.y = -Math.PI / 2; sala.g.add(dica);
  }
  function preparar4(sala, rnd) { for (const e of sala.esp) { e.est = e.certo === null ? Math.floor(rnd() * 2) : 1 - e.certo; if (rnd() < 0.3 && e.k === 0) e.est = e.certo; } desenharEsp(sala); }
  function desenharEsp(sala) { for (const e of sala.esp) e.g.rotation.y = e.est ? -Math.PI / 4 : Math.PI / 4; }
  function tracar(sala) {   // segue o raio de espelho em espelho; devolve os pontos e se chegou no cristal
    let x = FONTE.x, z = FONTE.z, dx = FONTE.dx, dz = FONTE.dz; const pts = [[x, z]];
    for (let passo = 0; passo < 8; passo++) {
      let melhor = null, md = 1e9;
      for (const e of sala.esp) { const ex = e.x - x, ez = e.z - z, ao = ex * dx + ez * dz, lat = Math.abs(ex * dz - ez * dx); if (ao > 0.3 && lat < 0.3 && ao < md) { md = ao; melhor = e; } }
      const ax = ALVO.x - x, az = ALVO.z - z, aAo = ax * dx + az * dz, aLat = Math.abs(ax * dz - az * dx);
      if (aAo > 0.3 && aLat < 0.4 && aAo < md) { pts.push([ALVO.x, ALVO.z]); return { pts, ok: true }; }
      if (!melhor) { const t = Math.min(dx > 0 ? (HW - x) : dx < 0 ? (x + HW) : 99, dz > 0 ? (HL - z) : dz < 0 ? (z + HL) : 99); pts.push([x + dx * t, z + dz * t]); return { pts, ok: false }; }
      x = melhor.x; z = melhor.z; pts.push([x, z]);
      [dx, dz] = melhor.est === 0 ? [-dz, -dx] : [dz, dx];
    }
    return { pts, ok: false };
  }
  function tick4(sala, lx, lz) {
    for (const e of sala.esp) { const no = Math.hypot(lx - e.x, lz - (e.z + 1.6)) < 0.75; if (no && !e.dentro) { e.est = 1 - e.est; desenharEsp(sala); Audio8.sfx('click'); } e.dentro = no; }
    const { pts, ok } = tracar(sala);
    const k = pts.map(p => p.join()).join('|');
    if (k !== sala.raioK) {
      sala.raioK = k; for (const r of sala.raios) sala.g.remove(r); sala.raios = [];
      for (let i = 0; i < pts.length - 1; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0); const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, L), sala.raioM); m.position.set((x0 + x1) / 2, 1.3, (z0 + z1) / 2); m.rotation.y = Math.atan2(x1 - x0, z1 - z0); sala.g.add(m); sala.raios.push(m); }
    }
    sala.cristal.material.emissive.setHex(ok ? 0x60c0ff : 0x102040); sala.cristal.rotation.y += 0.02;
    if (ok) abrir(sala, '🚪 A luz chegou ao cristal: <b>A Luz dos Espelhos</b> abriu a porta!');
  }

  // ================= SALA 5: A Ponte que Desaba =================
  const P5 = { cols: [-3, 0, 3], rows: [8, 5.9, 3.8, 1.7, -0.4, -2.5, -4.6, -6.7] };
  function montar5(sala) {
    const fosso = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, 18.4).rotateX(-Math.PI / 2), escuro); fosso.position.set(0, 0.02, 0.6); sala.g.add(fosso);
    sala.pedras = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 3; c++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.8), new THREE.MeshLambertMaterial({ color: 0x7a7266, emissive: 0x000000 })); m.position.set(P5.cols[c], 0.15, P5.rows[r]); sala.g.add(m); sala.pedras.push({ r, c, m, caiu: false, pisouT: 0 }); }
    const dica = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.2), texto(['As runas mostram as pedras firmes'], 640, 128)); dica.position.set(HW - 0.05, 2.6, 7); dica.rotation.y = -Math.PI / 2; sala.g.add(dica);
  }
  function preparar5(sala, rnd) {
    sala.firmes = new Set(); let c = Math.floor(rnd() * 3);
    for (let r = 0; r < 8; r++) { sala.firmes.add(r + ',' + c); if (rnd() < 0.35) { const c2 = Math.max(0, Math.min(2, c + (rnd() < 0.5 ? -1 : 1))); sala.firmes.add(r + ',' + c2); } c = Math.max(0, Math.min(2, c + Math.floor(rnd() * 3) - 1)); }
    sala.mostrarAte = 0; sala.viuT = -99; resetar5(sala);
  }
  function resetar5(sala) { for (const p of sala.pedras) { p.caiu = false; p.pisouT = 0; p.m.position.y = 0.15; p.m.visible = true; } }
  function tick5(sala, lx, lz, dt) {
    if (lz > 9.6 && time - sala.viuT > 6) { sala.viuT = time; sala.mostrarAte = time + 3.5; resetar5(sala); log('✨ As runas brilham nas pedras firmes... decore!', 'sys'); Audio8.sfx('buff'); }
    const mostra = time < sala.mostrarAte;
    for (const p of sala.pedras) {
      p.m.material.emissive.setHex(mostra && sala.firmes.has(p.r + ',' + p.c) ? 0x9060ff : 0x000000);
      if (p.caiu && p.m.visible) { p.m.position.y -= dt * 6; if (p.m.position.y < -6) p.m.visible = false; }
      if (p.pisouT && !p.caiu && time - p.pisouT > 1.6) { p.caiu = true; Audio8.sfx('hit'); }
    }
    if (lz < 9.4 && lz > -7.9) {
      const sob = sala.pedras.find(p => !p.caiu && Math.abs(lx - P5.cols[p.c]) < 0.95 && Math.abs(lz - P5.rows[p.r]) < 0.95);
      if (!sob) { cair('Você caiu no abismo!', 0.15); return; }
      if (!sala.firmes.has(sob.r + ',' + sob.c)) { sob.caiu = true; cair('Era uma pedra falsa! Ela desabou com você.', 0.15); return; }
      if (!sob.pisouT) sob.pisouT = time;
    }
    if (lz < -8.4) abrir(sala, '🚪 Você atravessou <b>A Ponte que Desaba</b>!');
  }

  // ================= SALA 6: O Guardião do Eco =================
  const PIL = [[-4.6, 6], [4.6, 6], [-4.6, -8], [4.6, -8]];
  function montar6(sala) {
    sala.pil = PIL.map(([x, z]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 4, 10), pedraP); col.position.set(x, 2, z); sala.g.add(col);
      const chama = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), new THREE.MeshBasicMaterial({ color: 0x404040, toneMapped: false })); chama.position.set(x, 4.3, z); sala.g.add(chama);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16), new THREE.MeshLambertMaterial({ color: 0x4a4030, emissive: 0x000000 })); pad.position.set(x + (x > 0 ? -1.4 : 1.4), 0.05, z); sala.g.add(pad);
      sala.obs.push({ x, z, r: 0.6 });
      return { x: x + (x > 0 ? -1.4 : 1.4), z, chama, pad, aceso: 0, t: 0 };
    });
    sala.avisos = [];
    sala.bau = new THREE.Group(); sala.bau.position.set(0, 0, -10); sala.bau.visible = false; sala.g.add(sala.bau);
    const cx = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.0), PM('madeira.jpg', [1, 1], new THREE.Color(0.8, 0.6, 0.4))); cx.position.y = 0.45; sala.bau.add(cx);
    const tampa = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 1.1), ouroM); tampa.position.y = 1.05; sala.bau.add(tampa); sala.tampa = tampa;
  }
  function preparar6(sala) { for (const p of sala.pil) { p.aceso = 0; p.t = 0; } sala.guardiao = null; sala.vulnAte = 0; sala.bauAberto = false; sala.bau.visible = false; sala.armT = 3; }
  const nivel = () => Math.max(10, Math.min(100, P.lv));
  function escalarGuardiao(m, L, n) {
    const d0 = m.d, kf = L / d0.lv;
    m.d = { ...d0, name: 'Guardião do Eco', lv: L, hp: Math.round(d0.hp * Math.pow(kf, 1.6) * 30 * (n > 1 ? (1 + 0.8 * (n - 1)) * 1.3 : 1)), atk: Math.round(d0.atk * kf * 1.5), def: Math.round(d0.def * kf), xp: Math.round((typeof Tower !== 'undefined' && Tower.xpCampo ? Tower.xpCampo(L) : d0.xp) * 20), zeny: [Math.round(d0.zeny[0] * kf * 5), Math.round(d0.zeny[1] * kf * 5)], aggro: 40, respawn: 1e9, mini: true, drops: [['red', 1], ['blue', 1]] };
    m.hp = m.maxHp = m.d.hp; m.noRespawn = true; m.towerFloor = 'templo'; m.templo = true; m.guardiaoEco = true; m.invul = true; m.model.g.scale.multiplyScalar(1.8);
    const sp = m.lab.querySelector('span'); if (sp) sp.innerHTML = `Guardião do Eco <small>Nv ${L}</small>`;
  }
  function tipoGuardiao(L) { return Object.keys(MOBDEF).filter(t => { const d = MOBDEF[t]; return !d.boss && !d.mini && !d.alfa && !d.field && !d.world && d.drops; }).sort((a, b) => Math.abs(MOBDEF[a].lv - L) - Math.abs(MOBDEF[b].lv - L))[0]; }
  function chamarGuardiao(sala) {
    const S = sala.S, L = nivel() + 4, G = run.grupo;
    if (G) {
      const ja = mobs.find(m => m.guardiaoEco && m.dg === G.id && !m.dead); if (ja) { sala.guardiao = ja; return; }
      if (!G.host) return;                                                // o Guardião do grupo nasce no jogo de quem começou
      const m = spawnMob(tipoGuardiao(L), null, { x: S.x, z: S.z - 2 }); escalarGuardiao(m, L, G.n);
      m.nid = `${G.id}:${L}:${G.n}:1:6:0`; m.dg = G.id; m.dono = Net.me; m.nx = m.x; m.nz = m.z;
      Net.send({ t: 'semente+', l: [{ id: m.nid, type: m.type, max: m.maxHp, hp: m.hp, resp: 3600, x: +m.x.toFixed(2), z: +m.z.toFixed(2) }] });
      sala.guardiao = m;
    } else { const m = spawnMob(tipoGuardiao(L), null, { x: S.x, z: S.z - 2 }); escalarGuardiao(m, L, 1); sala.guardiao = m; }
    banner('O GUARDIÃO DO ECO'); Audio8.sfx('boom');
    log('☠ <b>O Guardião do Eco</b> despertou. Ele é <b>imune</b> enquanto os <b>4 pilares</b> não estiverem acesos <b>ao mesmo tempo</b>: fique 1 segundo na placa de cada pilar (cada um fica aceso por 12 segundos). Cuidado com os círculos no chão!', 'bad');
  }
  function criarRemoto(o) {
    const p = String(o.id).split(':'); if (p[1] !== 'eco' || p[2] !== P.grupo) return null;
    const m = spawnMob(o.type, null, { x: o.x, z: o.z }); escalarGuardiao(m, +p[4], +p[5]);
    m.nid = o.id; m.dg = p.slice(0, 4).join(':'); m.dono = o.dono; m.nx = o.x; m.nz = o.z; m.hp = Math.min(m.maxHp, o.hp ?? m.maxHp);
    return m;
  }
  function tick6(sala, lx, lz, dt) {
    const S = sala.S;
    if (!sala.guardiao || (sala.guardiao.dead && !sala.bau.visible)) {
      if (sala.guardiao && sala.guardiao.dead) { sala.bau.visible = true; Audio8.sfx('level'); banner('O GUARDIÃO CAIU!'); log('🏆 O Guardião do Eco caiu! Abra o <b>baú</b> no fundo da sala.', 'gold'); }
      else if (!sala.guardiao) chamarGuardiao(sala);
    }
    const g = sala.guardiao;
    // pilares: 1 s na placa acende por 12 s (os companheiros também acendem)
    const outros = membrosNaSala(S.sala).map(r => loc(S, r.x, r.z));
    for (const p of sala.pil) {
      const no = [[lx, lz], ...outros].some(([x, z]) => Math.hypot(x - p.x, z - p.z) < 1.1);
      if (no && time > p.aceso) { p.t += dt; if (p.t > 1) { p.t = 0; p.aceso = time + 12; Audio8.sfx('buff'); } } else if (!no) p.t = 0;
      const on = time < p.aceso; p.chama.material.color.setHex(on ? 0xffa030 : 0x404040); p.pad.material.emissive.setHex(no ? 0x403010 : 0);
    }
    if (g && !g.dead) {
      if (sala.pil.every(p => time < p.aceso) && time > sala.vulnAte) { sala.vulnAte = time + 12; for (const p of sala.pil) p.aceso = 0; banner('🔥 O ESCUDO CAIU!'); Audio8.sfx('boom'); log('🔥 Os 4 pilares estão acesos: o Guardião está <b>vulnerável por 12 segundos</b>!', 'gold'); }
      g.invul = time > sala.vulnAte; if (g.model && g.model.g) g.model.g.traverse(o => { if (o.material && o.material.emissive && o.isMesh) o.material.emissive.setHex(g.invul ? 0x101830 : 0x301000); });
      // armadilhas: círculos no chão que explodem
      if ((sala.armT -= dt) <= 0) {
        sala.armT = 2.4;
        for (let k = 0; k < 2; k++) {
          const x = k ? lx + rand(-1.5, 1.5) : rand(-HW + 1.5, HW - 1.5), z = k ? lz + rand(-1.5, 1.5) : rand(-HL + 3, HL - 3);
          const fill = new THREE.Mesh(new THREE.CircleGeometry(2.2, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0.3, depthWrite: false })); fill.position.set(S.x + x, 0.08, S.z + z); scene.add(fill);
          sala.avisos.push({ x, z, t: 1.3, fill });
        }
      }
    }
    for (const a of sala.avisos) { a.t -= dt; a.fill.material.opacity = 0.25 + (1.3 - a.t) * 0.4; if (a.t <= 0) { scene.remove(a.fill); a.fim = true; espinhos(S, a.x, a.z); if (Math.hypot(lx - a.x, lz - a.z) < 2.2 && !P.dead) { const d = Math.round(stats.maxHp() * 0.2); P.hp -= d; floater(P.x, P.y + 2, P.z, d, 'hurt'); hurtFlash(0.2); run.quedas++; if (P.hp <= 0) { P.hp = 0; P.dead = true; P.deadT = 3; onDeath(); } } } }
    sala.avisos = sala.avisos.filter(a => !a.fim);
    if (sala.bau.visible && !sala.bauAberto && Math.hypot(lx, lz + 10) < 2.2) { sala.bauAberto = true; sala.tampa.rotation.x = -1.1; sala.tampa.position.z = -0.4; premiar(); abrir(sala, ''); }
  }
  function premiar() {
    const T = (Date.now() - run.t0) / 1000, Q = run.quedas, n = run.grupo ? run.grupo.n : 1;
    const nota = T < 600 && Q <= 3 ? 'ouro' : T < 1080 && Q <= 8 ? 'prata' : 'bronze';
    const R = { ouro: { frag_cisma: 14, frag_carta: 20, nucleo_abismo: 3, selo_forja: 1, cr: 70000 }, prata: { frag_cisma: 8, frag_carta: 12, nucleo_abismo: 1, cr: 40000 }, bronze: { frag_cisma: 4, frag_carta: 6, cr: 20000 } }[nota];
    const mult = n > 1 ? 1.5 : 1, partes = [];
    for (const [k, v] of Object.entries(R)) { const q = Math.round(v * mult); if (k === 'cr') { P.zeny += q; partes.push(`${q.toLocaleString('pt-BR')} cr`); } else { P.inv[k] = (P.inv[k] || 0) + q; partes.push(`${q} ${ITEMS[k].ic} ${ITEMS[k].name}`); } }
    const xp = Math.round((typeof Tower !== 'undefined' && Tower.xpCampo ? Tower.xpCampo(nivel()) : 1000) * 25 * mult); gainXp(xp);
    if (nota === 'ouro' && P.title !== 'Decifrador do Eco' && !P.ecoOuro) { P.ecoOuro = 1; P.title = 'Decifrador do Eco'; $('pname').innerHTML = `${P.name}<small>« ${P.title} »</small>`; log('🏅 Título novo: <b>« Decifrador do Eco »</b>!', 'gold'); }
    banner(`BAÚ DE ${nota.toUpperCase()}!`); Audio8.sfx('level');
    log(`🎁 <b>Baú de ${nota === 'ouro' ? '🥇 ouro' : nota === 'prata' ? '🥈 prata' : '🥉 bronze'}</b> (${Ranking.fmt(T)}, ${Q} queda${Q === 1 ? '' : 's'}): ${partes.join(', ')} e <b>${xp.toLocaleString('pt-BR')} XP</b>.${nota !== 'ouro' ? ' <small>Ouro: menos de 10 min e até 3 quedas.</small>' : ''}`, 'gold');
    if (typeof Ranking !== 'undefined') Ranking.terminar('templo');
    if (typeof Trajes !== 'undefined') Trajes.templo();
    run.acabou = true; try { save(); } catch (e) { }
  }

  // ---------------- as salas
  const MONTAR = [montar1, montar2, montar3, montar4, montar5, montar6], PREP = [preparar1, () => { }, preparar3, preparar4, preparar5, preparar6], TICK = [tick1, tick2, tick3, tick4, tick5, tick6];
  function garantir() { if (salas.length) return; salas = TEMPLO.map(S => { const s = construirSala(S); MONTAR[S.sala](s); return s; }); }
  function reiniciarSala(i) {
    const s = salas[i]; if (!s || s.aberta) return;
    if (i === 4) resetar5(s);
    if (i === 2 && !run.grupo) { s.prox = 0; s.feitos = new Set(); for (const p of s.pads) { p.base.material.emissive.setHex(0); p.t = 0; } }
  }
  function prepararTudo(seed) {
    garantir(); const rnd = sorteador(seed);
    for (const s of salas) { s.aberta = false; s.porta.position.y = 2; s.portal.material.opacity = 0; PREP[s.S.sala](s, rnd); }
  }

  // ---------------- semana, entrar, sair
  const semana = () => Math.floor((Date.now() / 864e5 + 3) / 7);
  const usadas = () => { const s = P.dgSemana; return s && s.w === semana() ? (s.templo || 0) : 0; };
  const restam = () => Math.max(0, LIMITE - usadas());
  function corridaDoGrupo() {
    if (!P.grupo || typeof Grupo === 'undefined') return null;
    for (const r of Grupo.membros()) { const g = r.s && r.s.dg; if (g && g.z === 'eco' && !g.acabou && g.fim > Date.now() && g.id.split(':')[2] === P.grupo) return { ...g, nome: r.n }; }
    return null;
  }
  function entrar(modo) {
    if (P.lv < 30) { log('🏛️ O Templo do Eco Selado é para o nível 30 em diante.', 'bad'); Audio8.sfx('miss'); return; }
    if (!restam()) { log(`🏛️ Você já entrou <b>${LIMITE} vezes</b> no Templo esta semana. Ele abre de novo na <b>segunda-feira</b>.`, 'bad'); Audio8.sfx('miss'); return; }
    let grupo = null;
    if (modo === 'grupo') {
      const outra = corridaDoGrupo();
      if (outra) grupo = { id: outra.id, n: outra.n, host: false, de: outra.nome };
      else {
        const M_ = typeof Grupo !== 'undefined' ? Grupo.membros() : [];
        if (!P.grupo || !M_.length || !Net.connected) { log('🏛️ Para ir em grupo, monte um grupo no 👥 (2 a 6 pessoas, todos on-line).', 'bad'); Audio8.sfx('miss'); return; }
        grupo = { id: `dg:eco:${P.grupo}:${Date.now().toString(36)}`, n: Math.min(6, M_.length + 1), host: true };
      }
    }
    if (typeof autoStop === 'function') autoStop('');
    if (!P.dgSemana || P.dgSemana.w !== semana()) P.dgSemana = { w: semana() }; P.dgSemana.templo = (P.dgSemana.templo || 0) + 1;
    run = { sala: 0, t0: Date.now(), quedas: 0, grupo, acabou: false };
    prepararTudo(grupo ? hashStr(grupo.id) : (Math.random() * 1e9) | 0);
    // as 5 primeiras salas vêm em ordem sorteada (o Guardião é sempre o último): não dá para decorar o templo
    const rnd = sorteador((grupo ? hashStr(grupo.id) : (Math.random() * 1e9) | 0) ^ 0x5bd1e995);
    run.ordem = [0, 1, 2, 3, 4].sort(() => rnd() - 0.5).concat(5); run.passo = 0;
    for (const L of salas[1].laminas) L.vel = 0.8 + rnd() * 0.5;   // e as lâminas mudam de velocidade
    irPara(0);
    if (typeof Ranking !== 'undefined') Ranking.comecar('templo');
    banner('🏛️ TEMPLO DO ECO SELADO'); Audio8.sfx('warp');
    log(`🏛️ <b>Templo do Eco Selado</b>${grupo ? ' (em grupo)' : ''}: 6 salas de armadilhas e enigmas. Não há pressa de desabar, mas o <b>tempo</b> e as <b>quedas</b> contam para o baú e para o 🏆 ranking. Entradas esta semana: <b>${usadas()} de ${LIMITE}</b>.`, 'gold');
    try { save(); } catch (e) { }
  }
  function irPara(passo) {
    const i = run.ordem ? run.ordem[passo] : passo, S = TEMPLO[i]; run.sala = i; run.passo = passo;
    P.x = S.x; P.z = S.z + ENTRA; P.y = 0; P.face = Math.PI; camS.yaw = 0; camS.x = P.x; camS.z = P.z; camS.y = 0; camS.dist = Math.min(camS.dist || 9, 11); P.protT = time + 1.5;
    log(`🏛️ Sala ${passo + 1} de 6: <b>${NOMES[i]}</b>.`, 'sys');
  }
  function sair(msg) {
    if (run && run.grupo && run.grupo.host && Net.connected) Net.send({ t: 'dgfim', pref: run.grupo.id + ':' });
    if (run && !run.acabou && typeof Ranking !== 'undefined') Ranking.cancelar('templo');
    for (const m of mobs.filter(m => m.templo)) { m.dead = true; scene.remove(m.model.g); m.lab.remove(); } mobs = mobs.filter(m => !m.templo);
    run = null; P.x = SAIDA.x; P.z = SAIDA.z; P.y = groundY(P.x, P.z); P.face = Math.PI; camS.yaw = 0; Audio8.sfx('warp');
    if (msg) log(msg, 'sys');
  }

  // ---------------- colisão (salas retangulares) e laço
  function bloqueia(f, x, z, r) {
    const lx = x - f.x, lz = z - f.z, s = salas[f.sala];
    if (Math.abs(lx) > HW - r || Math.abs(lz) > HL - r) return true;
    if (s && !s.aberta && lz < PORTA + 0.6 + r) return true;
    if (s) for (const o of s.obs) if (Math.hypot(lx - o.x, lz - o.z) < o.r + r) return true;
    return false;
  }
  function update(dt) {
    const sl = salaDe(P.x, P.z);
    for (const s of salas) s.g.visible = s.S.sala === sl;                // só a sala onde você está é desenhada
    if (sl === null) { if (run) sair(); return; }
    if (!run) { sair(); return; }                                         // voltou de outro jeito (sem corrida): sai
    const s = salas[sl], [lx, lz] = loc(s.S, P.x, P.z);
    if (s.aberta) { s.porta.position.y = Math.min(6.5, s.porta.position.y + dt * 3); s.portal.material.opacity = 0.35 + Math.sin(time * 3) * 0.15; }
    if (!P.dead) TICK[sl](s, lx, lz, dt);
    // atravessou o portal: próxima sala (ou, na última, volta para Solmira)
    if (s.aberta && lz < PORTA + 0.2 && !P.dead) {
      if (sl !== 5) irPara(run.passo + 1);
      else sair(run.acabou ? '🏛️ Você saiu do Templo do Eco Selado. Até a próxima!' : '');
    }
  }
  function minimap(mg) {
    const W = mg.canvas.width, H = mg.canvas.height; mg.fillStyle = '#1a1612'; mg.fillRect(0, 0, W, H); mg.textAlign = 'center';
    mg.fillStyle = '#ffd860'; mg.font = 'bold 12px Georgia'; mg.fillText('🏛️ Templo do Eco', W / 2, H / 2 - 22);
    mg.fillStyle = '#f0e2c0'; mg.font = 'bold 11px sans-serif'; if (run) { mg.fillText(`Sala ${run.passo + 1}/6`, W / 2, H / 2 - 4); mg.fillText(`⏱️ ${Ranking.fmt((Date.now() - run.t0) / 1000)} · 💢 ${run.quedas}`, W / 2, H / 2 + 14); }
    mg.textAlign = 'left';
  }
  function pres() { return run && run.grupo && run.grupo.host ? { id: run.grupo.id, z: 'eco', n: run.grupo.n, fim: run.t0 + 30 * 60e3, onda: run.passo, chefe: run.sala === 5, acabou: run.acabou } : null; }

  // ---------------- a Estudiosa Ilka e a entrada da ruína em Solmira
  {
    const ex = VIL.x, ez = VIL.z - 18, y = groundY(ex, ez), g = new THREE.Group(); g.position.set(ex, y, ez); scene.add(g);
    const pm = PM('pedra.jpg', [1, 2], new THREE.Color(0.7, 0.66, 0.6));
    const b = (w, h, d, x, yy, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pm); o.position.set(x, yy, z); o.castShadow = true; g.add(o); return o; };
    b(0.9, 3.6, 0.9, -1.8, 1.8, 0); b(0.9, 3.6, 0.9, 1.8, 1.8, 0); b(4.6, 0.8, 1.0, 0, 3.9, 0);
    const vao = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 3.2), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); vao.position.set(0, 1.6, -0.05); g.add(vao);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), texto(['🏛️ TEMPLO DO ECO SELADO'], 512, 128)); pl.position.set(0, 4.75, 0.52); g.add(pl);
    addOb(ex - 1.8, ez, 0.7); addOb(ex + 1.8, ez, 0.7); addOb(ex, ez - 0.3, 1.3);
  }
  function npc(eu) {
    const outra = corridaDoGrupo();
    dialog('💬 Estudiosa Ilka', `${eu ? `<b>${eu}</b>! ` : ''}Debaixo de Solmira há um templo que ninguém conseguiu atravessar inteiro. Não é força que abre as portas dele: é <b>cabeça, olho e reflexo</b>. São 6 salas de armadilhas e enigmas, e um guardião no fim. Quanto mais rápido e com menos quedas, melhor o baú.<br><small>Nível 30+. Entradas esta semana: <b>${usadas()} de ${LIMITE}</b>.</small>`, [
      { label: `🏛️ Entrar sozinho · restam ${restam()} de ${LIMITE} esta semana`, fn: () => { entrar(); } },
      { label: outra ? `👥 Entrar com o seu grupo (${outra.nome} já começou)` : '👥 Entrar em grupo (2 a 6: alavancas em dupla, guardião mais forte, baú maior)', fn: () => { entrar('grupo'); } },
      { label: '🏆 Ranking do Templo', fn: () => { Ranking.mostrar('templo', () => npc(eu)); return true; } },
      { label: 'Até mais' }]);
  }
  const api = { update, minimap, saida: SAIDA, pres, criarRemoto, entrar, sair, corridaDoGrupo, restam, npc, bloqueia, get run() { return run; }, _salas: () => salas };
  MASMORRAS.eco = api;
  return api;
})();
