// =====================================================================
//  Motor de áudio — trilhas ORIGINAIS geradas em tempo real (WebAudio)
// =====================================================================
const Audio8 = (() => {
  let ctx = null, master, musicBus, sfxBus, noiseBuf;
  let musicOn = true, current = null, timer = null, nextTime = 0, step = 0, startTime = 0;

  const SEMI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function freq(n) {
    const m = n.match(/^([A-G][#b]?)(\d)$/);
    if (!m) return 440;
    const midi = (+m[2] + 1) * 12 + SEMI[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  // "C4 - D4 . E4+G4" -> eventos por passo. "-" sustenta, "." pausa, "+" acorde
  function parse(str) {
    const toks = str.trim().split(/\s+/);
    const out = new Array(toks.length).fill(null);
    let last = -1;
    toks.forEach((t, i) => {
      if (t === '-') { if (last >= 0) out[last].len++; }
      else if (t === '.') last = -1;
      else { out[i] = { f: t.split('+').map(freq), len: 1 }; last = i; }
    });
    return out;
  }

  // ---------- helpers de composição ----------
  const CH = {
    G: 'G3+B3+D4', D: 'F#3+A3+D4', Em: 'E3+G3+B3', C: 'E3+G3+C4', Am: 'E3+A3+C4', A: 'E3+A3+C#4',
    Bm: 'F#3+B3+D4', E: 'E3+G#3+B3', F: 'F3+A3+C4', Dm: 'F3+A3+D4', Gs: 'G3+B3+D4', Bb: 'F3+Bb3+D4', Gm: 'G3+Bb3+D4'
  };
  const rep = (s, n) => Array(n).fill(s).join(' ');

  // ---------- TRILHAS (todas compostas para este jogo) ----------
  const TRACKS = {
    // Valsa alegre da vila — 3/4
    solmira: {
      bpm: 138, div: 2, swing: 0,
      lead: { inst: 'flute', wave: 'triangle', gain: 0.16, vib: 5, rel: 0.12, notes:
        'D5 - B4 - G4 - A4 - B4 C5 D5 - E5 - D5 - B4 - A4 - - - . . ' +
        'G4 - A4 B4 C5 - B4 - A4 - G4 - F#4 - G4 A4 B4 - A4 - - - . . ' +
        'B4 - D5 - G5 - F#5 - E5 - D5 - C5 - E5 - A4 - B4 - - - . . ' +
        'C5 - B4 - A4 - G4 - E4 - F#4 G4 A4 - F#4 - D4 - G4 - - - . .' },
      bass: { inst: 'pluck', wave: 'sine', gain: 0.14, rel: 0.2, notes:
        ['G2', 'D2', 'E2', 'D2', 'C2', 'G2', 'D2', 'D2', 'G2', 'D2', 'A2', 'E2', 'C2', 'G2', 'D2', 'G2']
          .map(r => `${r} - . . . .`).join(' ') },
      pad: { inst: 'pluck', wave: 'square', gain: 0.05, rel: 0.05, notes:
        ['G', 'D', 'Em', 'D', 'C', 'G', 'D', 'D', 'G', 'D', 'Am', 'Em', 'C', 'G', 'D', 'G']
          .map(c => `. . ${CH[c]} . ${CH[c]} .`).join(' ') },
      drums: 'k . h . h . k . h . h h'
    },
    // Campos dourados — 4/4 saltitante
    campos: {
      bpm: 144, div: 2,
      lead: { inst: 'pluck', wave: 'square', gain: 0.13, vib: 0, rel: 0.06, notes:
        'D5 . A4 . F#4 A4 D5 E5 F#5 - E5 D5 E5 - A4 . ' +
        'B4 . D5 . G5 - F#5 E5 F#5 - - - . . . . ' +
        'G5 . F#5 E5 D5 . B4 . A4 . F#4 A4 D5 - C#5 . ' +
        'B4 . C#5 D5 E5 . A4 . D5 - - - . . A4 .' },
      bass: { inst: 'bass', wave: 'triangle', gain: 0.22, rel: 0.08, notes:
        ['D2', 'D2', 'G2', 'D2', 'G2', 'D2', 'A2', 'D2'].map(r => {
          const f = { D2: 'A2', G2: 'D3', A2: 'E3' }[r];
          return `${r} . ${r} . ${f} . ${r} .`;
        }).join(' ') },
      pad: { inst: 'strings', wave: 'triangle', gain: 0.022, rel: 0.3, notes:
        ['D', 'D', 'G', 'D', 'G', 'D', 'A', 'D'].map(c => `${CH[c]} - - - - - - -`).join(' ') },
      drums: 'k . h . s . h . k k h . s . h h'
    },
    // Oásis — escala frígia dominante, tom exótico
    kharum: {
      bpm: 108, div: 2,
      lead: { inst: 'flute', wave: 'sawtooth', gain: 0.15, vib: 7, rel: 0.15, filter: 1600, notes:
        'E4 F4 G#4 - A4 - G#4 F4 E4 - - - . . B3 . ' +
        'E4 F4 G#4 A4 B4 - C5 B4 A4 - G#4 - F4 - E4 . ' +
        'B4 - C5 - D5 C5 B4 A4 G#4 - A4 B4 - - . . ' +
        'C5 B4 A4 G#4 F4 - G#4 F4 E4 - - - - . . .' },
      bass: { inst: 'bass', wave: 'sine', gain: 0.22, rel: 0.4, notes:
        'E2 - - - - - . . E2 - - - F2 - . . E2 - - - - - . . E2 - - - B1 - - . ' +
        'E2 - - - - - . . F2 - - - E2 - . . D2 - - - E2 - . . E2 - - - - - - .' },
      pad: { inst: 'strings', wave: 'triangle', gain: 0.02, rel: 0.5, notes:
        'E3+B3 - - - - - - - - - - - - - - - F3+C4 - - - - - - - E3+B3 - - - - - - - ' +
        'D3+A3 - - - - - - - E3+G#3 - - - - - - - F3+A3 - - - - - - - E3+B3 - - - - - - -' },
      drums: 't . t k . . t . t . t k . t . .'
    },
    // Deserto vermelho — tenso e rápido
    areias: {
      bpm: 156, div: 2,
      lead: { inst: 'strings', wave: 'square', gain: 0.045, vib: 3, rel: 0.05, notes:
        'A4 . A4 C5 B4 . A4 . E5 - D5 - C5 - B4 . ' +
        'A4 . A4 C5 B4 . G#4 . A4 - - - . . E4 . ' +
        'F4 . F4 A4 G4 . F4 . E4 - G4 - B4 - D5 . ' +
        'C5 . B4 A4 G#4 . B4 . A4 - - - . . . .' },
      bass: { inst: 'bass', wave: 'sawtooth', gain: 0.2, rel: 0.05, filter: 700, notes:
        ['A1', 'A1', 'A1', 'E2', 'F1', 'G1', 'E2', 'A1'].map(r => {
          const o = r.replace(/\d/, d => +d + 1);
          return `${r} ${r} ${o} ${r} ${r} ${o} ${r} ${o}`;
        }).join(' ') },
      pad: { inst: 'brass', wave: 'triangle', gain: 0.018, rel: 0.3, notes:
        ['Am', 'Am', 'Am', 'E', 'F', 'C', 'E', 'Am'].map(c => `${CH[c]} - - - - - - -`).join(' ') },
      drums: 'k . s . k k s . k . s . k k s s'
    },
    // Fenda de Kravenox — chefe semanal, ré menor sombrio
    kravenox: {
      bpm: 164, div: 2,
      lead: { inst: 'brass', wave: 'sawtooth', gain: 0.05, vib: 4, rel: 0.05, filter: 2200, notes:
        'D5 . D5 F5 E5 . D5 . A4 - C5 - Bb4 - A4 . ' +
        'D5 . D5 F5 G5 . A5 . Bb5 - A5 - G5 - E5 . ' +
        'F5 . E5 D5 C#5 . D5 . E5 - A4 - C#5 - E5 . ' +
        'D5 - - - . . A4 . D5 - - - - . . .' },
      bass: { inst: 'bass', wave: 'square', gain: 0.24, rel: 0.04, filter: 600, notes:
        ['D2', 'D2', 'Bb1', 'Bb1', 'G1', 'A1', 'A1', 'D2'].map(r => {
          const o = r.replace(/\d/, d => +d + 1);
          return `${r} ${r} ${o} ${r} ${r} ${o} ${r} ${r}`;
        }).join(' ') },
      pad: { inst: 'choir', wave: 'triangle', gain: 0.05, rel: 0.4, notes:
        ['Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'A', 'A', 'Dm'].map(c => `${CH[c]} - - - - - - -`).join(' ') },
      drums: 'k k s . k k s k k k s . k s s s'
    }
  };
  // pré-processa
  for (const t of Object.values(TRACKS)) {
    for (const ch of ['lead', 'bass', 'pad']) if (t[ch]) t[ch].ev = parse(t[ch].notes);
    t.dr = t.drums.split(/\s+/);
  }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    // compressor + reverb de salão para a música soar orquestral
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.7; musicBus.connect(comp);
    const verb = ctx.createConvolver(), len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.32;
    musicBus.connect(verb); verb.connect(wet); wet.connect(comp);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone(bus, wave, f, t, dur, gain, o = {}) {
    const osc = ctx.createOscillator(), env = ctx.createGain();
    osc.type = wave; osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    if (o.vib) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 5.5; lg.gain.value = o.vib;
      lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.5);
    }
    let node = osc;
    if (o.filter) {
      const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.filter;
      osc.connect(fl); node = fl;
    }
    const a = o.att ?? 0.01, r = o.rel ?? 0.1;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + a);
    env.gain.setValueAtTime(gain, t + Math.max(a, dur - 0.02));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
    node.connect(env); env.connect(bus);
    osc.start(t); osc.stop(t + dur + r + 0.05);
  }
  // instrumentos sintetizados (sem som de videogame antigo)
  function instr(name, f, t, dur, gain) {
    const out = ctx.createGain(); out.connect(musicBus);
    const env = (g, a, hold, r) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + a); g.gain.setValueAtTime(gain, t + Math.max(a, hold)); g.gain.exponentialRampToValueAtTime(0.0001, t + hold + r); return t + hold + r + 0.05; };
    const osc = (type, fr, det = 0) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = det; return o; };
    const lp = fr => { const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = fr; return b; };
    let end;
    switch (name) {
      case 'flute': {                        // flauta: seno + vibrato + sopro
        const g = ctx.createGain(); end = env(g, 0.07, dur, 0.18);
        const o1 = osc('sine', f), o2 = osc('sine', f * 2); const g2 = ctx.createGain(); g2.gain.value = 0.18;
        const lfo = osc('sine', 5.2), lg = ctx.createGain(); lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
        o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(out);
        [o1, o2, lfo].forEach(o => { o.start(t); o.stop(end); });
        const n = ctx.createBufferSource(); n.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 2;
        const ng = ctx.createGain(); ng.gain.setValueAtTime(gain * 0.25, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        n.connect(bp); bp.connect(ng); ng.connect(out); n.start(t); n.stop(t + 0.15);
        break;
      }
      case 'strings': {                      // cordas: 3 serras desafinadas + filtro, ataque lento
        const g = ctx.createGain(); end = env(g, 0.18, dur, 0.5); const f1 = lp(Math.min(2600, f * 5)); f1.connect(g); g.connect(out);
        [-9, 0, 8].forEach(d => { const o = osc('sawtooth', f, d); o.connect(f1); o.start(t); o.stop(end); });
        break;
      }
      case 'pluck': {                        // harpa/violão: ataque rápido e decaimento
        const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.5, dur * 1.6)); end = t + Math.max(0.5, dur * 1.6) + 0.05;
        const f1 = lp(f * 6); f1.frequency.setValueAtTime(f * 8, t); f1.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.4);
        const o1 = osc('triangle', f), o2 = osc('sawtooth', f, 4); const g2 = ctx.createGain(); g2.gain.value = 0.35;
        o1.connect(f1); o2.connect(g2); g2.connect(f1); f1.connect(g); g.connect(out); [o1, o2].forEach(o => { o.start(t); o.stop(end); });
        break;
      }
      case 'bell': {                         // sino / celesta
        const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); end = t + 1.7;
        const o1 = osc('sine', f), o2 = osc('sine', f * 2.76), o3 = osc('sine', f * 5.4); const g2 = ctx.createGain(); g2.gain.value = 0.3; const g3 = ctx.createGain(); g3.gain.value = 0.12;
        o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g); g.connect(out); [o1, o2, o3].forEach(o => { o.start(t); o.stop(end); });
        break;
      }
      case 'brass': {                        // metais: serra com filtro que abre
        const g = ctx.createGain(); end = env(g, 0.06, dur, 0.2); const f1 = lp(400);
        f1.frequency.setValueAtTime(300, t); f1.frequency.linearRampToValueAtTime(Math.min(3500, f * 6), t + 0.12); f1.frequency.linearRampToValueAtTime(f * 3, t + dur);
        [-5, 5].forEach(d => { const o = osc('sawtooth', f, d); o.connect(f1); o.start(t); o.stop(end); });
        f1.connect(g); g.connect(out);
        break;
      }
      case 'bass': {                         // contrabaixo dedilhado
        const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(gain * 0.4, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25); end = t + dur + 0.3;
        const f1 = lp(f * 4); const o1 = osc('sine', f), o2 = osc('triangle', f * 2); const g2 = ctx.createGain(); g2.gain.value = 0.25;
        o1.connect(f1); o2.connect(g2); g2.connect(f1); f1.connect(g); g.connect(out); [o1, o2].forEach(o => { o.start(t); o.stop(end); });
        break;
      }
      case 'choir': {                        // coro: formantes sobre serras suaves
        const g = ctx.createGain(); end = env(g, 0.3, dur, 0.6); g.connect(out);
        const mix = ctx.createGain();
        [-6, 6].forEach(d => { const o = osc('sawtooth', f, d); o.connect(mix); o.start(t); o.stop(end); });
        [[700, 6], [1150, 8]].forEach(([fr, q]) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q; mix.connect(b); b.connect(g); });
        break;
      }
    }
  }
  function noise(bus, t, dur, gain, type, fr) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = fr;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(env); env.connect(bus);
    src.start(t); src.stop(t + dur + 0.02);
  }
  function drum(k, t) {
    switch (k) {
      case 'k': tone(musicBus, 'sine', 110, t, 0.2, 0.5, { slide: 42, rel: 0.12 }); noise(musicBus, t, 0.05, 0.05, 'lowpass', 300); break;   // tambor grave
      case 's': noise(musicBus, t, 0.22, 0.13, 'lowpass', 2600); tone(musicBus, 'sine', 190, t, 0.08, 0.12, { slide: 120 }); break;           // caixa suave
      case 'h': noise(musicBus, t, 0.05, 0.03, 'highpass', 9000); break;                                                                     // chocalho
      case 't': tone(musicBus, 'sine', 300, t, 0.14, 0.22, { slide: 180, rel: 0.08 }); noise(musicBus, t, 0.03, 0.04, 'bandpass', 1200); break; // tabla
    }
  }

  function scheduler() {
    if (!current) return;
    const tr = TRACKS[current];
    const spb = 60 / tr.bpm / tr.div;
    while (nextTime < ctx.currentTime + 0.15) {
      for (const ch of ['lead', 'bass', 'pad']) {
        const c = tr[ch]; if (!c) continue;
        const e = c.ev[step % c.ev.length];
        if (e) for (const f of e.f) { if (c.inst) instr(c.inst, f, nextTime, e.len * spb * 0.92, c.gain); else tone(musicBus, c.wave, f, nextTime, e.len * spb * 0.92, c.gain, { vib: c.vib, rel: c.rel, filter: c.filter }); }
      }
      const d = tr.dr[step % tr.dr.length];
      if (d && d !== '.') drum(d, nextTime);
      nextTime += spb; step++;
    }
  }

  // ---------- trilha orquestral gravada (musica/*.m4a) ----------
  // trilhas do RPG Kravenox (kravenox-jogar/rpg/music), com os pontos de laço de lá
  const LOOPS = {"title": {"loop": 1, "a": 0.5, "b": 42.2391304}, "vila": {"loop": 1, "a": 0.5, "b": 34.7857143}, "floresta": {"loop": 1, "a": 0.5, "b": 49.7307692}, "vale": {"loop": 1, "a": 0.5, "b": 64.5}, "abismo": {"loop": 1, "a": 0.5, "b": 60.5}, "cidade": {"loop": 1, "a": 0.5, "b": 53.8333333}, "fortaleza": {"loop": 1, "a": 0.5, "b": 46.2142857}, "masmorra": {"loop": 1, "a": 0.5, "b": 46.2142857}, "chefe": {"loop": 1, "a": 0.5, "b": 26.1}};
  const FILES = Object.keys(LOOPS);
  const MUSIC_BASE = (() => { try { return new URL('../musica/', document.currentScript.src).href; } catch (e) { return 'musica/'; } })();
  // tocada em streaming por <audio> (não decodifica a trilha inteira na memória: sem travar ao trocar de região)
  let fileBus = null, fileName = null, cur = null;
  function deck() {
    const el = new window.Audio(); el.preload = 'auto'; el.crossOrigin = 'anonymous'; el.setAttribute('playsinline', '');
    const g = ctx.createGain(); g.gain.value = 0;
    try { ctx.createMediaElementSource(el).connect(g); } catch (e) { }
    g.connect(fileBus);
    const d = { el, g, a: 0.5, b: 0 };
    el.addEventListener('timeupdate', () => { if (d.b && el.currentTime > d.b - 0.15) el.currentTime = d.a; });
    el.addEventListener('ended', () => { el.currentTime = d.a; el.play().catch(() => { }); });
    return d;
  }
  const decks = [];
  function playFile(name) {
    if (!fileBus) { fileBus = ctx.createGain(); fileBus.gain.value = musicOn ? 0.9 : 0; fileBus.connect(master); decks.push(deck(), deck());
      const u = decks[1].el; u.src = MUSIC_BASE + name + '.mp4'; u.play().then(() => { if (cur !== decks[1]) u.pause(); }).catch(() => { }); }   // iPhone: libera os dois tocadores no mesmo toque
    if (fileName === name) return;
    fileName = name;
    const old = cur;
    if (old) { old.g.gain.setTargetAtTime(0, ctx.currentTime, 0.6); setTimeout(() => { if (cur !== old) old.el.pause(); }, 3000); }
    const d = decks[0] === old ? decks[1] : decks[0];
    const L = LOOPS[name] || {}; d.a = L.a || 0.05; d.b = L.b || 0;
    d.el.src = MUSIC_BASE + name + '.mp4'; d.el.currentTime = 0;
    d.g.gain.cancelScheduledValues(ctx.currentTime); d.g.gain.setValueAtTime(0, ctx.currentTime); d.g.gain.setTargetAtTime(1, ctx.currentTime + 0.1, 0.8);
    d.el.play().catch(() => { });
    cur = d;
  }

  function play(name) {
    if (!ctx) return;
    if (FILES.includes(name)) { current = null; return playFile(name); }
    if (current === name) return;
    current = name; step = 0; nextTime = ctx.currentTime + 0.1; startTime = nextTime;
    if (!timer) timer = setInterval(scheduler, 25);
  }
  function stop() { current = null; }
  function toggleMusic() {
    musicOn = !musicOn;
    if (musicBus) musicBus.gain.setTargetAtTime(musicOn ? 0.55 : 0, ctx.currentTime, 0.1);
    if (fileBus) fileBus.gain.setTargetAtTime(musicOn ? 0.9 : 0, ctx.currentTime, 0.1);
    return musicOn;
  }

  // ---------- efeitos sonoros ----------
  function sfx(name) {
    if (!ctx) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'hit': noise(sfxBus, t, 0.08, 0.35, 'bandpass', 2500); tone(sfxBus, 'square', 330, t, 0.05, 0.1, { slide: 120 }); break;
      case 'crit': noise(sfxBus, t, 0.15, 0.5, 'bandpass', 1200); tone(sfxBus, 'square', 660, t, 0.1, 0.15, { slide: 160 }); break;
      case 'hurt': tone(sfxBus, 'sawtooth', 200, t, 0.12, 0.15, { slide: 90, filter: 900 }); break;
      case 'miss': tone(sfxBus, 'sine', 900, t, 0.06, 0.08, { slide: 1300 }); break;
      case 'whip': noise(sfxBus, t, 0.12, 0.3, 'highpass', 3000); break;
      case 'skill': [0, 4, 7, 12].forEach((s, i) => tone(sfxBus, 'triangle', 523 * Math.pow(2, s / 12), t + i * 0.05, 0.1, 0.15)); break;
      case 'buff': [0, 5, 9, 12, 17].forEach((s, i) => tone(sfxBus, 'sine', 587 * Math.pow(2, s / 12), t + i * 0.06, 0.15, 0.13, { vib: 4 })); break;
      case 'heal': [12, 7, 12, 16].forEach((s, i) => tone(sfxBus, 'sine', 523 * Math.pow(2, s / 12), t + i * 0.09, 0.25, 0.12)); break;
      case 'level': [0, 4, 7, 12, 7, 12, 16, 19].forEach((s, i) => tone(sfxBus, 'square', 392 * Math.pow(2, s / 12), t + i * 0.08, 0.12, 0.08)); break;
      case 'coin': tone(sfxBus, 'square', 988, t, 0.05, 0.08); tone(sfxBus, 'square', 1319, t + 0.05, 0.12, 0.08); break;
      case 'pick': tone(sfxBus, 'triangle', 700, t, 0.06, 0.12, { slide: 1100 }); break;
      case 'die': tone(sfxBus, 'square', 300, t, 0.25, 0.1, { slide: 60 }); break;
      case 'warp': tone(sfxBus, 'sine', 300, t, 0.4, 0.15, { slide: 1200, vib: 20 }); break;
      case 'click': tone(sfxBus, 'triangle', 1200, t, 0.03, 0.06); break;
      case 'anvil': [0, 0.32].forEach(d => { noise(sfxBus, t + d, 0.05, 0.4, 'highpass', 4000); [1760, 2637, 3520].forEach((f, i) => tone(sfxBus, 'sine', f, t + d, 0.5 - i * 0.12, 0.09 - i * 0.02)); }); break;
      case 'ouch': noise(sfxBus, t, 0.12, 0.55, 'lowpass', 700); tone(sfxBus, 'square', 260, t, 0.16, 0.16, { slide: 110, filter: 1200 }); tone(sfxBus, 'sine', 90, t, 0.18, 0.35, { slide: 45 }); break;
      case 'boom': noise(sfxBus, t, 0.5, 0.5, 'lowpass', 600); tone(sfxBus, 'sine', 120, t, 0.4, 0.4, { slide: 30 }); break;
    }
  }

  // posição no compasso (usado pelo combate rítmico do spin-off 3D)
  function beat() {
    if (!ctx || !current) return null;
    const bpm = TRACKS[current].bpm;
    const b = (ctx.currentTime - startTime) * bpm / 60;
    const ph = ((b % 1) + 1) % 1;
    return { bpm, beat: b, phase: ph, offset: Math.min(ph, 1 - ph) * 60 / bpm };
  }

  // ---------- sons de ambiente: vento, pássaros (dia), grilos (noite), passos ----------
  let ambBus = null, wind = null, ambMode = '', ambT = 0, ambOn = true;
  function ambient(mode, night) {
    if (!ctx) return;
    if (!ambBus) {
      ambBus = ctx.createGain(); ambBus.gain.value = 0.35; ambBus.connect(master);
      const src = ctx.createBufferSource(), len = ctx.sampleRate * 4, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      let last = 0; for (let i = 0; i < len; i++) { last = last * 0.985 + (Math.random() * 2 - 1) * 0.015; d[i] = last * 6; }   // ruído marrom (vento)
      src.buffer = b; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
      wind = ctx.createGain(); wind.gain.value = 0;
      src.connect(f); f.connect(wind); wind.connect(ambBus); src.start();
    }
    const want = { campo: 0.10, deserto: 0.22, torre: 0.14, vila: 0.06 }[mode] ?? 0.08;
    wind.gain.setTargetAtTime(ambOn && musicOn ? want * (0.7 + 0.3 * Math.sin(ctx.currentTime * 0.3)) : 0, ctx.currentTime, 0.8);
    ambT -= 0.25;
    if (ambT > 0 || !ambOn || !musicOn) return;
    const t = ctx.currentTime;
    if (night && (mode === 'campo' || mode === 'vila')) {                    // grilos
      ambT = 0.6 + Math.random() * 1.2;
      for (let k = 0; k < 3; k++) tone(ambBus, 'sine', 4300 + Math.random() * 300, t + k * 0.07, 0.035, 0.035);
    } else if (!night && (mode === 'campo' || mode === 'vila')) {            // pássaros
      ambT = 2 + Math.random() * 5;
      const f0 = 2200 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 4);
      for (let k = 0; k < n; k++) tone(ambBus, 'sine', f0 * (1 + Math.random() * 0.2), t + k * 0.12, 0.08, 0.03, { slide: f0 * 1.35 });
    } else ambT = 3;
  }
  function footstep(sand) { if (!ctx || !ambOn) return; noise(sfxBus, ctx.currentTime, 0.06, sand ? 0.08 : 0.05, 'bandpass', sand ? 900 : 500); }

  return { init, play, stop, toggleMusic, sfx, beat, ambient, step: footstep, get musicOn() { return musicOn; } };
})();
