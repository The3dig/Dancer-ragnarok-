// =====================================================================
//  Gera o livreto em PDF dos heróis (docs/herois.pdf).
//  Lê as habilidades de docs/personagens.md (que sai do jogo) e os retratos
//  de 3d/sprites.js. A história e os caminhos sugeridos estão aqui embaixo.
//  Uso: node scripts/gerar_pdf_herois.js   (precisa do Playwright)
// =====================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

// ---------- retratos ----------
global.window = {};
require(path.join(RAIZ, '3d/sprites.js'));
const SPR = window.SPR;
const RETRATO = { Kravenox: 'k_portrait', Thornox: 't_portrait', Lyra: 'p_lyra', Seraphyne: 'p_seraphyne', Erya: 'p_erya', 'Mãe': 'p_mae' };

// ---------- habilidades (de docs/personagens.md) ----------
const md = fs.readFileSync(path.join(RAIZ, 'docs/personagens.md'), 'utf8');
const herois = [];
let h = null, tier = 0;
for (const l of md.split('\n')) {
  let m;
  if ((m = l.match(/^## (.+)$/)) && !l.includes('Dica')) { h = { nome: m[1], classes: [], skills: [] }; herois.push(h); tier = 0; continue; }
  if (l.startsWith('## Dica')) { h = null; continue; }
  if (!h) continue;
  if ((m = l.match(/^\*\*(.+ → .+)\*\*$/))) h.classes = m[1].split(' → ');
  else if ((m = l.match(/^\*\*Papel:\*\* (.+)$/))) h.papel = m[1];
  else if ((m = l.match(/^\*(.+)\*$/))) h.frase = m[1];
  else if ((m = l.match(/^### (\d)ª classe/))) tier = +m[1];
  else if ((m = l.match(/^- (\S+) \*\*(.+?)\*\*( 💛)? · (\*passiva\* · )?nível (\d+): (.+)$/))) {
    let desc = m[6], req = null, r;
    if ((r = desc.match(/ \*Requer (.+) Nv (\d+)\.\*$/))) { req = { nome: r[1], nv: +r[2] }; desc = desc.slice(0, r.index); }
    h.skills.push({ icone: m[1], nome: m[2], grupo: !!m[3], passiva: !!m[4], nv: +m[5], desc, req, tier });
  }
}

// ---------- o que é escrito à mão ----------
const COR = { Kravenox: '#e0303f', Thornox: '#f2c94c', Lyra: '#9cc8ff', Seraphyne: '#b26bff', Erya: '#e9edc0', 'Mãe': '#d9cff5' };
const EXTRA = {
  Kravenox: {
    historia: 'Séculos depois do Grande Cisma, um cristal negro racha no fundo do Abismo Carmesim e Kravenox desperta: fraco, com os poderes partidos em fragmentos e uma fome que não passa. Desde menino, ele era o irmão que perguntava. Foi ele quem leu os registros proibidos do templo e descobriu que a Fonte Pura não protegia o mundo: ela <i>continha</i> alguma coisa. Ninguém quis ouvir. Agora ele usa a Essência Corrompida para pegar de volta tudo o que lhe tiraram.',
    citacao: '“Não há luz sem sombra… E tudo que foi tomado, eu vou recuperar.”',
    notas: { Ataque: 5, Defesa: 3, Cura: 1, Grupo: 2, Facilidade: 4 },
    caminhos: [
      ['🩸 Fúria Sangrenta', 'Um alvo de cada vez, sem largar. Rouba vida e quase não precisa de poção.', ['Garras Afiadas', 'Sede de Sangue', 'Modo Fúria', 'Espinhos Sanguinários', 'Fome do Abismo', 'Garras do Abismo', 'Fome Eterna', 'Pelas Sombras', 'O Despertar']],
      ['🌋 Tempestade de Espinhos', 'Junta os monstros e apaga todos de uma vez.', ['Espinhos Vorazes', 'Couraça de Espinhos', 'Esmagamento', 'Pele do Abismo', 'Rugido do Abismo', 'Quarta Essência', 'Coroa de Espinhos', 'Chuva Carmesim']],
    ],
  },
  Thornox: {
    historia: 'O irmão que aprendeu a proteger. Quando nasceu, a Essência reagia a ele como luz diante do amanhecer. Thornox e Kravenox têm o mesmo corpo: um é a sombra, o outro é a luz. Na noite do Cisma, ele ficou dividido entre o irmão e a Ordem que tinha jurado proteger, e essa rachadura nunca fechou. Hoje é o Guardião: seus espinhos brilham com uma luz suave, e onde ele está, o grupo não cai.',
    citacao: '“Thornox pela frente, Kravenox pelas sombras.”',
    notas: { Ataque: 3, Defesa: 4, Cura: 5, Grupo: 5, Facilidade: 4 },
    caminhos: [
      ['🛡️ Guardião', 'O curandeiro do grupo: cura, defesa e bênçãos para todo mundo perto.', ['Luz Dourada', 'Mãos que Curam', 'Barreira de Luz', 'Aurora', 'Bênção do Guardião', 'Renovação', 'Muralha de Luz', 'Coroa de Luz', 'Santuário Dourado']],
      ['☀️ Sol de Guerra', 'Luz que machuca. Muito dano de longe, ainda com uma cura de reserva.', ['Lança Dourada', 'Luz Interior', 'Raio de Sol', 'Onda de Luz', 'Chuva de Luz', 'Julgamento Dourado', 'Lança do Céu', 'Sol Nascente']],
    ],
  },
  Lyra: {
    historia: 'A irmã que o Reino esqueceu. Na noite do Cisma, eram três diante da Fonte: Lyra segurava o cristal, Thornox gritava, Kravenox discutia. Uma sombra atrás da Fonte avançou, e raízes negras envolveram a menina. Por muito tempo, nem os irmãos se lembravam dela. Lyra voltou guardando a última memória da Fonte, e com ela cura, prende e protege.',
    citacao: '“Você não pode tirar o que é nosso!”',
    notas: { Ataque: 3, Defesa: 2, Cura: 5, Grupo: 5, Facilidade: 3 },
    caminhos: [
      ['💙 Curandeira', 'Ninguém morre perto dela. Curas grandes e regeneração para o grupo.', ['Memória', 'Lembranças Boas', 'Fonte Interna', 'Eco da Vida', 'Águas da Memória', 'Canção Calma', 'Renascer', 'Eternidade']],
      ['⛓️ Carcereira', 'Prende os monstros no lugar e bate enquanto eles não se mexem.', ['Memória Viva', 'Barreira de Memórias', 'Mil Memórias', 'Prisão Dourada', 'Voz da Fonte', 'Última Memória', 'Tempestade de Memórias']],
    ],
  },
  Seraphyne: {
    historia: 'Ela apareceu sorrindo nas muralhas, com milhares de Sentinelas atrás dela. Armadura negra, cabelos prateados e o Vazio na palma da mão. Seraphyne é filha da Fonte, e o Vazio que ela usa não explode: apenas apaga. Lê línguas que ninguém mais lê e abre portais para onde quiser. Começou do outro lado. Aprendeu alguma coisa no caminho.',
    citacao: '“Parece que alguém aprendeu alguma coisa.”',
    notas: { Ataque: 5, Defesa: 2, Cura: 2, Grupo: 3, Facilidade: 2 },
    caminhos: [
      ['⚫ Apagadora', 'O maior dano de magia do jogo. Frágil: fique longe e apague tudo antes que chegue.', ['Vazio Interior', 'Toque do Vazio', 'Concentração', 'Lâmina do Vazio', 'Filha da Essência', 'Apagar', 'Raio do Vazio', 'Fim de Tudo']],
      ['🩸 Sobrevivente', 'Para jogar sozinha: rouba vida, prende e se protege.', ['Absorver', 'Armadura Negra', 'Portal', 'Fome do Vazio', 'Correntes do Vazio', 'Manto do Vazio', 'Buraco Negro']],
    ],
  },
  Erya: {
    historia: 'Uma menina de uns oito anos, de cabelos escuros e olhos brancos, de quem lembra de antes de tudo existir. Na parede, surgiram quatro símbolos: luz, sombra, memória e Vazio. Depois, um quinto: escolha. Erya é a quinta marca. Seus espíritos correm pelo chão atrás de vários inimigos ao mesmo tempo, porque, em cada possibilidade, o golpe acerta.',
    citacao: '“Meu nome é Erya. Eu sou a quinta.”',
    notas: { Ataque: 4, Defesa: 3, Cura: 4, Grupo: 4, Facilidade: 3 },
    caminhos: [
      ['👻 Caçadora de Espíritos', 'Muitos alvos ao mesmo tempo. Ótima para limpar andar e caçar quest.', ['Espíritos da Escolha', 'Olhos Brancos', 'Espírito Guia', 'Possibilidade', 'Revoada de Espíritos', 'Mil Espíritos', 'Destino Quebrado']],
      ['🕊️ Marca da Vida', 'Suporte que também bate: cura, defesa e o melhor bônus de grupo do 3º caminho.', ['Quinta Marca', 'Marca Protetora', 'Escolha Livre', 'Espíritos Guardiões', 'Escolha da Vida', 'Antes de Tudo', 'Quinta Marca Plena', 'A Escolha Final']],
    ],
  },
  'Mãe': {
    historia: 'Os irmãos achavam que ela tinha morrido antes do Grande Cisma. Não morreu: ficou presa no Entre, um lugar que não pertence ao Primeiro Mundo, nem ao Reino da Escolha, nem ao Abismo Carmesim. Passou milênios lá, porque descobriu o que os filhos eram. Agora carrega de novo a sua lâmina antiga, e as correntes que a prendiam trabalham a favor dela.',
    citacao: '“Você cresceu.”',
    notas: { Ataque: 4, Defesa: 5, Cura: 3, Grupo: 4, Facilidade: 5 },
    caminhos: [
      ['🛡️ Muralha', 'A linha de frente: segura os monstros, atordoa e protege quem está atrás.', ['Pele Endurecida', 'Coração de Mãe', 'Correntes Brancas', 'Resistência', 'Promessa', 'Grito da Guardiã', 'Proteção de Mãe', 'Guardiã do Entre', 'Última Promessa']],
      ['⚔️ Lâmina', 'Corpo a corpo forte e seguro. A melhor escolha para quem está começando.', ['Braço Forte', 'Lâmina Antiga', 'Golpe Firme', 'Fúria de Mãe', 'Lâmina de Auren', 'Lâmina Eterna', 'Corte do Entre', 'Passos que Tremem']],
    ],
  },
};

// ---------- HTML ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const md2 = s => esc(s).replace(/“|"/g, '"').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const estrelas = n => '★'.repeat(n) + '<span class="apagada">' + '★'.repeat(5 - n) + '</span>';
const img = k => `data:image/png;base64,${SPR[k]}`;
const id = (heroi, nome) => (heroi + '-' + nome).normalize('NFD').replace(/[^\w-]/g, '');

function paginaHeroi(h, n) {
  const x = EXTRA[h.nome], cor = COR[h.nome];
  const noCaminho = new Map(); x.caminhos.forEach(([, , lst], i) => lst.forEach(s => noCaminho.set(s, (noCaminho.get(s) || '') + 'AB'[i])));
  const colunas = [1, 2, 3].map(t => `
    <div class="col">
      <div class="col-tit"><small>${t}ª classe · nível ${[1, 20, 40][t - 1]}+</small>${h.classes[t - 1]}</div>
      ${h.skills.filter(s => s.tier === t).map(s => `
        <div class="no${s.passiva ? ' pas' : ''}" id="${id(h.nome, s.nome)}" ${s.req ? `data-req="${id(h.nome, s.req.nome)}" data-nv="${s.req.nv}"` : ''}>
          <span class="ic">${s.icone}</span><span class="nm">${s.nome}${s.grupo ? ' 💛' : ''}</span><span class="nv">${s.nv}</span>
          ${(noCaminho.get(s.nome) || '').split('').map(c => `<i class="mk mk${c}">${c}</i>`).join('')}
        </div>`).join('')}
    </div>`).join('');
  const notas = Object.entries(x.notas).map(([k, v]) => `<div class="nota"><span>${k}</span><b>${estrelas(v)}</b></div>`).join('');
  const caminhos = x.caminhos.map(([t, d, lst], i) => `<div class="caminho"><div class="cam-tit"><i class="mk mk${'AB'[i]}">${'AB'[i]}</i> ${t}</div><div class="cam-d">${d}</div><div class="cam-l"><b>Pegue:</b> ${lst.join(' · ')}</div></div>`).join('');
  const lista = [1, 2, 3].map(t => `
      <h3>${t}ª classe: ${h.classes[t - 1]} <small>(a partir do nível ${[1, 20, 40][t - 1]})</small></h3>
      ${h.skills.filter(s => s.tier === t).map(s => `
        <div class="hab${s.passiva ? ' pas' : ''}">
          <div class="hab-ic">${s.icone}</div>
          <div><div class="hab-nm">${s.nome}${s.grupo ? ' <span class="tag gr">💛 grupo</span>' : ''}${s.passiva ? ' <span class="tag">passiva</span>' : ''} <span class="hab-nv">nível ${s.nv}</span></div>
          <div class="hab-d">${md2(s.desc)}${s.req ? ` <span class="req">Requer ${s.req.nome} Nv ${s.req.nv}.</span>` : ''}</div></div>
        </div>`).join('')}`).join('');
  return `
  <section class="pag heroi" style="--cor:${cor}">
    <div class="cab">
      <img class="retrato" src="${img(RETRATO[h.nome])}">
      <div class="cab-txt">
        <div class="num">Herói ${n} de 6</div>
        <h2>${h.nome}</h2>
        <div class="evo">${h.classes.join(' <span>→</span> ')}</div>
        <div class="papel">${esc(h.papel)}</div>
      </div>
    </div>
    <div class="dois">
      <div class="lore"><p>${x.historia}</p><p class="cit">${x.citacao}</p></div>
      <div class="notas">${notas}</div>
    </div>
    <h4>Árvore de habilidades</h4>
    <div class="arvore">${colunas}<svg class="linhas"></svg></div>
    <div class="legenda">O número é o nível do herói para liberar. Borda tracejada = passiva. 💛 = vale também para o grupo perto. As linhas mostram o que precisa antes (“requer”).</div>
    <h4>Dois caminhos (os pontos não dão para tudo)</h4>
    <div class="caminhos">${caminhos}</div>
  </section>
  <section class="pag heroi lista-pag" style="--cor:${cor}">
    <div class="mini-cab"><img src="${img(RETRATO[h.nome])}"> <b>${h.nome}</b> · todas as habilidades</div>
    <div class="lista">${lista}</div>
  </section>`;
}

const capa = `
  <section class="pag capa">
    <div class="capa-in">
      <div class="sobre">KRAVENOX APRESENTA</div>
      <h1>Reino Quebrado<br><span>Online</span></h1>
      <div class="sub">Os seis heróis, suas histórias<br>e suas árvores de habilidades</div>
      <div class="fila">${herois.map(h => `<div><img src="${img(RETRATO[h.nome])}" style="border-color:${COR[h.nome]}"><small>${h.nome}</small></div>`).join('')}</div>
      <div class="rod">Livreto dos jogadores · ${new Date().toLocaleDateString('pt-BR')}<br>Baseado no livro <i>Reino Quebrado</i>, de Rone Ignacio da Silva</div>
    </div>
  </section>`;

const historia = `
  <section class="pag texto">
    <h2 class="tit">A Lenda dos Irmãos Espinhos</h2>
    <p class="cap">Antes de o Reino ser quebrado, existia a Essência. Ela não era simplesmente magia: era a força que fazia as coisas existirem. Corria sob as montanhas, brilhava dentro das árvores antigas e alimentava os rios. No centro do mundo havia a Fonte Pura, e dizia-se que ninguém poderia alcançá-la sem ser transformado por aquilo que encontrasse.</p>
    <p>Foi nesse mundo que nasceram dois irmãos, <b>Thornox</b> e <b>Kravenox</b>. A Essência reagia a Thornox como luz diante do amanhecer. Em Kravenox, ela era mais intensa, irregular, como uma chama tentando escapar de uma lâmpada fechada. Thornox aprendeu a proteger. Kravenox aprendeu a questionar.</p>
    <p>Então o Reino começou a adoecer. Cristais escureceram, florestas morreram sem fogo nem seca. Kravenox descobriu nos registros proibidos que a Fonte Pura não estava apenas protegendo o mundo: estava <i>contendo</i> alguma coisa. A Ordem da Essência o silenciou, e Thornox ficou dividido entre o irmão e aqueles que havia jurado proteger.</p>
    <p>Uma acusação. Uma batalha. Uma escolha. E, finalmente, o <b>Grande Cisma</b>: o céu se abriu, a Essência explodiu em milhares de fragmentos, cidades foram engolidas e montanhas se partiram como vidro. Os irmãos se enfrentaram no centro da ruptura, e uma irmã, <b>Lyra</b>, desapareceu entre raízes negras.</p>
    <p>Séculos depois, quando quase todos os nomes já tinham virado poeira, um cristal negro rachou no fundo do Abismo Carmesim.</p>
    <p class="destaque">E alguém despertou.</p>
    <div class="caixa">
      <b>No jogo</b>, você escolhe um dos seis heróis da história e entra no Reino Quebrado com seus amigos: a Vila de Solmira, os Campos Dourados, a Floresta Morta, a Cidade Submersa, a Torre e o Abismo do Cisma, que desce 30 andares a partir da cratera. Cada herói evolui duas vezes e tem 22 habilidades. Ninguém consegue pegar todas: cada jogador faz o seu caminho.
    </div>
  </section>
  <section class="pag texto">
    <h2 class="tit">Como funcionam as habilidades</h2>
    <div class="regras">
      <div><b>22 habilidades por herói</b><span>8 ativas principais (4 da 1ª classe e 2 a cada evolução) e mais 14 da árvore (6 passivas e 8 ativas), espalhadas pelas três classes.</span></div>
      <div><b>Até o nível 10</b><span>Cada habilidade sobe até o nível 10. Você ganha <b>1 ponto por nível</b> e mais alguns ao evoluir. Não dá para pegar tudo: escolha.</span></div>
      <div><b>Passivas</b><span>Bônus que valem sempre, sem apertar nada: ataque, magia, HP, defesa, crítico, roubo de vida, cura… O número mostrado é <b>por nível</b>.</span></div>
      <div><b>💛 Grupo</b><span>Curas e proteções com 💛 também valem para quem está no seu grupo, até 15 metros de você.</span></div>
      <div><b>Requer</b><span>Algumas habilidades pedem outra num nível mínimo antes. Na árvore, isso aparece como uma linha ligando as duas.</span></div>
      <div><b>Evolução</b><span>A <b>2ª classe</b> abre no nível 20 e a <b>3ª classe</b> no nível 40, com o <b>Vigia Morvan</b>, na Cidadela do Cisma, depois de uma provação.</span></div>
    </div>
    <h2 class="tit" style="margin-top:28px">Quem é quem</h2>
    <table class="quem">
      <tr><th></th><th>Herói</th><th>Luta</th><th>Papel</th></tr>
      ${herois.map(h => `<tr style="--cor:${COR[h.nome]}"><td><img src="${img(RETRATO[h.nome])}"></td><td><b>${h.nome}</b></td><td>${['Kravenox', 'Mãe'].includes(h.nome) ? 'De perto' : 'De longe (magia)'}</td><td>${esc(h.papel)}</td></tr>`).join('')}
    </table>
    <div class="caixa"><b>Grupo ideal:</b> Kravenox ou Mãe na frente, Seraphyne ou Erya no dano de magia, e Thornox ou Lyra curando e protegendo o time. Em grupo, a experiência e os itens são divididos entre quem está perto.</div>
  </section>`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { background: #110b18; color: #e8e0f2; font: 13px/1.5 Nunito, 'Noto Color Emoji', sans-serif; -webkit-print-color-adjust: exact }
.pag { width: 210mm; height: 297mm; padding: 16mm 15mm; position: relative; overflow: hidden; page-break-after: always;
  background: radial-gradient(ellipse at 50% -10%, rgba(200,160,80,.13), transparent 60%), #110b18 }
h1, h2, h3, h4, .tit { font-family: Cinzel, serif }
img { image-rendering: pixelated }
.capa { display: flex; align-items: center; justify-content: center; text-align: center;
  background: radial-gradient(circle at 50% 42%, #3a1420 0%, #160c1c 55%, #0a0610 100%) }
.capa::before { content: ''; position: absolute; inset: 10mm; border: 2px solid #c8a050; border-radius: 6px; box-shadow: inset 0 0 0 6px #110b18, inset 0 0 0 7px rgba(200,160,80,.4) }
.sobre { letter-spacing: 6px; color: #c8a050; font-weight: 800; font-size: 12px }
.capa h1 { font-size: 58px; line-height: 1.05; color: #f7e2a8; margin: 18px 0 10px; text-shadow: 0 0 30px rgba(224,48,63,.5) }
.capa h1 span { font-size: 34px; letter-spacing: 12px; color: #e0303f }
.sub { font-size: 17px; color: #d8cce8 }
.fila { display: flex; justify-content: center; gap: 14px; margin: 46px 0 }
.fila img { width: 76px; height: 76px; border: 2px solid; border-radius: 12px; background: #1e1630 }
.fila small { display: block; font-weight: 800; margin-top: 4px; font-size: 11px }
.rod { color: #9a8db0; font-size: 11px }
.texto p { font-size: 14.5px; line-height: 1.7; margin-bottom: 12px; text-align: justify }
.tit { color: #f7e2a8; font-size: 24px; margin-bottom: 14px; border-bottom: 1px solid rgba(200,160,80,.4); padding-bottom: 6px }
.cap::first-letter { font-family: Cinzel; font-size: 46px; float: left; line-height: .9; margin: 4px 8px 0 0; color: #e0303f }
.destaque { font-family: Cinzel; font-size: 22px !important; color: #e0303f; text-align: center !important; margin: 18px 0 !important }
.caixa { background: rgba(200,160,80,.08); border: 1px solid rgba(200,160,80,.35); border-left: 4px solid #c8a050; border-radius: 8px; padding: 12px 14px; font-size: 13.5px; margin-top: 16px }
.regras { display: grid; grid-template-columns: 1fr 1fr; gap: 10px }
.regras div { background: #1b1328; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; padding: 10px 12px }
.regras > div > b { display: block; color: #f7e2a8; font-size: 14px; margin-bottom: 3px }
.quem { width: 100%; border-collapse: collapse; font-size: 12.5px }
.quem th { text-align: left; color: #c8a050; font-size: 11px; padding: 4px 6px; border-bottom: 1px solid rgba(200,160,80,.4) }
.quem td { padding: 5px 6px; border-bottom: 1px solid rgba(255,255,255,.06); vertical-align: middle }
.quem td b { color: var(--cor) }
.quem img { width: 38px; height: 38px; border-radius: 8px; border: 1px solid var(--cor); display: block }
/* página do herói */
.heroi { padding: 12mm 13mm; background: radial-gradient(ellipse at 15% 0%, color-mix(in srgb, var(--cor) 20%, transparent), transparent 55%), #110b18 }
.cab { display: flex; gap: 16px; align-items: center }
.retrato { width: 136px; height: 136px; border-radius: 16px; border: 3px solid var(--cor); background: #1e1630; box-shadow: 0 0 24px color-mix(in srgb, var(--cor) 45%, transparent) }
.num { font-size: 10px; letter-spacing: 3px; color: #9a8db0; font-weight: 800; text-transform: uppercase }
.cab h2 { font-size: 38px; color: var(--cor); line-height: 1.1 }
.evo { font-family: Cinzel; font-weight: 600; font-size: 13px; color: #f7e2a8 } .evo span { color: var(--cor) }
.papel { font-size: 13px; color: #cfc4e0; margin-top: 3px }
.dois { display: grid; grid-template-columns: 1fr 165px; gap: 14px; margin: 12px 0 6px }
.lore p { font-size: 13.5px; line-height: 1.65; text-align: justify }
.cit { font-style: italic; color: var(--cor); margin-top: 6px; font-weight: 700 }
.notas { background: #1b1328; border-radius: 10px; padding: 8px 10px; border: 1px solid rgba(255,255,255,.08); align-self: start }
.nota { display: flex; justify-content: space-between; font-size: 12px; line-height: 1.9 }
.nota b { color: #f2c94c; letter-spacing: 1px } .apagada { color: #3a3048 }
h4 { font-family: Cinzel; color: #f7e2a8; font-size: 15px; margin: 14px 0 8px; border-bottom: 1px solid rgba(200,160,80,.3); padding-bottom: 3px }
.arvore { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 26px; position: relative }
.col-tit { text-align: center; font-family: Cinzel; font-weight: 800; color: var(--cor); font-size: 13px; margin-bottom: 5px }
.col-tit small { display: block; font-family: Nunito; color: #9a8db0; font-size: 9.5px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase }
.no { position: relative; z-index: 2; display: flex; align-items: center; gap: 6px; background: #1d1530; border: 1.5px solid color-mix(in srgb, var(--cor) 60%, transparent); border-radius: 9px; padding: 5px 8px; margin: 0 0 9px 14px; font-size: 12.5px; font-weight: 800; height: 38px }
.no.pas { border-style: dashed; background: #160f22 }
.no .ic { font-size: 18px } .no .nm { flex: 1; line-height: 1.1 }
.no .nv { background: var(--cor); color: #110b18; border-radius: 6px; padding: 0 5px; font-size: 10.5px }
.mk { font-style: normal; display: inline-block; width: 15px; height: 15px; line-height: 15px; text-align: center; border-radius: 50%; font-size: 9.5px; font-weight: 800; color: #110b18 }
.mkA { background: #ff8a5c } .mkB { background: #6fd3c0 }
.linhas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; overflow: visible }
.legenda { font-size: 10px; color: #9a8db0; margin-top: 2px }
.caminhos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px }
.caminho { background: #1b1328; border-radius: 10px; padding: 8px 11px; border: 1px solid rgba(255,255,255,.08) }
.cam-tit { font-weight: 800; font-size: 14px; color: #f7e2a8 } .cam-d { font-size: 12px; color: #cfc4e0 } .cam-l { font-size: 11.5px; margin-top: 5px; color: #f5eefc; line-height: 1.55 } .cam-l b { color: var(--cor) }
.mini-cab { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #cfc4e0; margin-bottom: 4px }
.mini-cab img { width: 34px; height: 34px; border-radius: 8px; border: 2px solid var(--cor) } .mini-cab b { font-family: Cinzel; font-size: 18px; color: var(--cor) }
.lista h3 { font-size: 14px; color: var(--cor); margin: 9px 0 5px; border-bottom: 1px solid color-mix(in srgb, var(--cor) 40%, transparent); padding-bottom: 2px }
.lista h3 small { font-family: Nunito; color: #9a8db0; font-size: 10.5px }
.hab { display: flex; gap: 9px; padding: 3.5px 0; break-inside: avoid }
.hab-ic { font-size: 19px; width: 26px; text-align: center; flex: none }
.hab-nm { font-weight: 800; font-size: 12.5px; color: #f5eefc }
.hab-nv { color: #9a8db0; font-weight: 700; font-size: 10.5px }
.hab-d { font-size: 11.5px; color: #cfc4e0; line-height: 1.4 }
.tag { font-size: 9px; font-weight: 800; border: 1px solid #9a8db0; color: #cfc4e0; border-radius: 5px; padding: 0 4px; vertical-align: 1px }
.tag.gr { border-color: #f2c94c; color: #f2c94c }
.req { color: var(--cor); font-weight: 700 }
</style></head><body>
${capa}${historia}${herois.map((h, i) => paginaHeroi(h, i + 1)).join('')}
<script>
// liga as habilidades que pedem outra antes ("requer")
document.querySelectorAll('.arvore').forEach(a => {
  const svg = a.querySelector('.linhas'), R = a.getBoundingClientRect(), cor = getComputedStyle(a).getPropertyValue('--cor');
  let out = '';
  a.querySelectorAll('[data-req]').forEach(n => {
    const p = document.getElementById(n.dataset.req); if (!p) return;
    const r1 = p.getBoundingClientRect(), r2 = n.getBoundingClientRect();
    const x = r1.left - R.left - 7, y1 = r1.top - R.top + r1.height / 2, y2 = r2.top - R.top + r2.height / 2;
    out += '<path d="M' + (x + 7) + ' ' + y1 + ' H' + x + ' V' + y2 + ' H' + (x + 7) + '" fill="none" stroke="' + cor + '" stroke-width="1.6" opacity=".85"/>'
      + '<circle cx="' + (x + 7) + '" cy="' + y2 + '" r="2.4" fill="' + cor + '"/>'
      + '<text x="' + (x - 3) + '" y="' + ((y1 + y2) / 2 + 3) + '" font-size="8.5" font-weight="800" fill="' + cor + '" text-anchor="end">' + n.dataset.nv + '</text>';
  });
  svg.innerHTML = out;
});
</script></body></html>`;

(async () => {
  const sai = path.join(RAIZ, 'docs');
  fs.writeFileSync(path.join(sai, 'herois.html'), html);
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.join(sai, 'herois.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(sai, 'herois.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
  console.log('ok:', herois.length, 'heróis,', herois.reduce((a, h) => a + h.skills.length, 0), 'habilidades');
})();
