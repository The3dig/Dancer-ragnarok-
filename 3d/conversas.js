// =====================================================================
//  💬 NPCs e moradores conversando entre si (pedido do Rone: "faça os npc conversarem entre eles,
//  umas fofocas também sobre os personagens"). Dois que estão perto um do outro (e perto de você)
//  trocam falas em balões. As conversas são criadas para o jogo; as fofocas são BOATOS do povo
//  ("dizem que..."), apoiados no livro, para nunca contradizer o cânone:
//   - Kravenox, Thornox e Lyra são irmãos e estavam diante da Fonte na noite do Cisma (Livro I, cap. 10)
//   - depois do Cisma, Thornox e Kravenox desapareceram (Livro I, cap. 0)
//   - a porta com a marca de três espinhos (Livro I, cap. 11)
//   - Seraphyne é rápida e conhecia os golpes do Thornox (Livro I, cap. 18); abre portais (Livro II, cap. 5)
//   - Lyra descobriu que os cristais guardam memórias (Livro II, cap. 4)
//   - a Queda de Valdora (Livro I, cap. 20)
//   - Erya e a marca da Escolha (Livro II, cap. 5); Aveline e o Primeiro Leitor falam de livros (Livro II, cap. 40)
// =====================================================================
'use strict';
const Conversas = (() => {
  // conversas do dia a dia (A fala, B responde, A fecha)
  const PAPO = [
    ['Dormiu bem?', 'Que nada, o vizinho roncou a noite inteira!', 'Ha! Toma um chá de camomila.'],
    ['Viu o preço do pão?', 'Subiu de novo! Duas coroas!', 'Desse jeito eu mesmo vou assar.'],
    ['Vai chover hoje?', 'O joelho da minha avó diz que sim.', 'Então vai, ela nunca erra.'],
    ['Soube do aventureiro novo?', 'O que caiu da escada da Torre?', 'Esse mesmo! Saiu correndo depois.'],
    ['O Doran martelou até tarde ontem.', 'Dizem que o fogo da forja dele nunca apagou.', 'Nem no dia do Cisma. Que teimoso!'],
    ['Comprou flores para quem?', 'Ué, para ninguém...', 'Sei, sei... 😏'],
    ['Os caranguejos da Praia estão maiores.', 'E mais bravos! Me beliscaram o dedo.', 'Bem feito, quem mandou mexer.'],
    ['Já foi na Mina da Forja?', 'Uma vez. Quase não saí antes de desabar!', 'Eu fico aqui em cima, obrigado.'],
    ['Sábado tem Kravenox no topo da Torre.', 'Eu vou ficar trancado em casa.', 'Eu também. Com a cabeça debaixo da coberta.'],
    ['Que dia bonito para a feira!', 'Perfeito. Vou vender tudo hoje.', 'Guarda uma maçã para mim!'],
    ['Meu filho quer ser aventureiro.', 'E você deixou?', 'Deixei... desde que volte para o jantar.'],
    ['Ouviu a música da Torre?', 'Arrepia até os pelos do braço.', 'Dizem que é o vento lá em cima.'],
    ['A guilda fez festa no castelo ontem.', 'Eu ouvi daqui! Até de madrugada.', 'Jovens... cansados nunca.'],
  ];
  // fofocas sobre os personagens (boatos do povo)
  const FOFOCA = [
    ['Dizem que o Kravenox tinha irmãos...', 'O Thornox e a Lyra! Os três estavam na Fonte na noite do Cisma.', 'Shhh! Fala baixo...'],
    ['Depois do Cisma, Kravenox e Thornox sumiram.', 'Sumiram os dois no mesmo dia?', 'No mesmo dia. Coincidência? Eu acho que não.'],
    ['O Thornox é a luz e o Kravenox, a sombra.', 'Mas dizem que têm o mesmo corpo!', 'Por isso brigam tanto. É coisa de irmão.'],
    ['Viu a porta com três espinhos desenhados?', 'Dizem que só abre para o sangue da Fonte.', 'Eu nem chego perto daquilo.'],
    ['A Seraphyne é rápida que nem o vento.', 'E sabia todos os golpes do Thornox!', 'Ué, como ela sabia? Hmmm...'],
    ['Contam que a Seraphyne abre portais.', 'Então é por isso que ela some e aparece!', 'Queria um portal até a padaria.'],
    ['A Lyra guarda memórias em cristais.', 'Memórias de gente?', 'De gente, de cidade inteira! Cada cristal, uma vida.'],
    ['Lembra da Queda de Valdora?', 'Como esquecer... meu avô veio de lá.', 'Por isso ele não gosta de falar.'],
    ['Dizem que a Erya carrega a marca da Escolha.', 'Escolha de quê?', 'Ninguém sabe. É isso que dá medo.'],
    ['A Aveline e o Primeiro Leitor só falam de livros.', 'Livros que ninguém escreveu ainda!', 'Gente estranha... gostei deles.'],
    ['O Kravenox voltou mais forte, ouvi dizer.', 'Juntando os Fragmentos da Essência...', 'Que a Fonte nos proteja.'],
  ];
  const ativos = [];                         // conversas acontecendo agora
  let espera = 4, ultimaFofocaLog = 0;
  // quem pode conversar: NPCs fixos e moradores de Solmira
  function falantes() {
    const out = [];
    if (typeof NPCS !== 'undefined') for (const n of NPCS) if (!n.hidden && Math.hypot(n.x - P.x, n.z - P.z) < 32) out.push({ o: n, nome: n.name, npc: true });
    if (typeof Solmira !== 'undefined' && Solmira.moradores) for (const m of Solmira.moradores()) if (m.g && m.g.visible && Math.hypot(m.x - P.x, m.z - P.z) < 32) out.push({ o: m });
    if (typeof Cidades !== 'undefined') for (const m of Cidades.moradores()) if (m.g && m.g.visible && Math.hypot(m.x - P.x, m.z - P.z) < 32) out.push({ o: m });
    return out.filter(f => !ativos.some(c => c.a.o === f.o || c.b.o === f.o));
  }
  function balao(f, txt) {
    const el = document.createElement('div'); el.className = 'bubble fala-vila'; el.textContent = txt;
    const lab = document.getElementById('labels'); if (!lab) return null; lab.appendChild(el); return el;
  }
  function comecar() {
    const F = falantes(); let par = null;
    for (let i = 0; i < 25 && !par; i++) {
      const a = F[Math.floor(Math.random() * F.length)], b = F[Math.floor(Math.random() * F.length)];
      if (a && b && a !== b && Math.hypot(a.o.x - b.o.x, a.o.z - b.o.z) < 9) par = [a, b];
    }
    if (!par) return;
    const fofoca = Math.random() < 0.4, linhas = (fofoca ? FOFOCA : PAPO)[Math.floor(Math.random() * (fofoca ? FOFOCA : PAPO).length)];
    const [a, b] = par;
    for (const f of par) if (!f.npc) { f.o.para = Math.max(f.o.para || 0, linhas.length * 3 + 1); f.o.alvo = null; }   // morador para para conversar
    ativos.push({ a, b, linhas, i: -1, t: 0, el: null, fofoca });
  }
  function update(dt) {
    if (typeof running === 'undefined' || !running || (typeof naoVisto === 'function' && naoVisto())) return;
    if ((espera -= dt) <= 0) { espera = 5 + Math.random() * 6; if (ativos.length < 2) comecar(); }
    for (let k = ativos.length - 1; k >= 0; k--) {
      const c = ativos[k];
      if ((c.t -= dt) <= 0) {
        if (c.el) c.el.remove();
        c.i++;
        if (c.i >= c.linhas.length) { ativos.splice(k, 1); continue; }
        const quem = c.i % 2 ? c.b : c.a, outro = c.i % 2 ? c.a : c.b;
        c.el = balao(quem, c.linhas[c.i]); c.quem = quem; c.t = 2.6 + c.linhas[c.i].length * 0.04;
        // virar um para o outro (moradores)
        for (const [x, y] of [[quem, outro], [outro, quem]]) if (!x.npc) x.o.face = Math.atan2(y.o.x - x.o.x, y.o.z - x.o.z);
        // fofoca perto de você também aparece no chat, para dar tempo de ler (no máximo 1 por minuto)
        if (c.fofoca && c.i === 0 && Math.hypot(quem.o.x - P.x, quem.o.z - P.z) < 10 && Date.now() - ultimaFofocaLog > 60000 && typeof log === 'function') {
          ultimaFofocaLog = Date.now(); log(`👂 <i>Você escuta uma fofoca:</i> "${c.linhas.join(' ')}"`, 'sys');
        }
      }
      if (c.el) {
        const o = c.quem.o, sp = toScreen(o.x, groundY(o.x, o.z) + (c.quem.npc ? 2.9 : 2.5), o.z);
        c.el.style.display = sp.vis && !(typeof dialogOpen !== 'undefined' && dialogOpen) ? '' : 'none';
        c.el.style.opacity = Math.min(1, c.t * 2);
        c.el.style.transform = `translate(${sp.x | 0}px,${sp.y | 0}px) translate(-50%,-100%)`;
      }
    }
  }
  return { update };
})();
