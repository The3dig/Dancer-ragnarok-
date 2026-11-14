// =====================================================================
//  Avisos e novidades: tudo o que é novo e importante aparece num painel
//  depois do login (uma vez por novidade) e fica no ❓ Ajuda.
//  O primeiro aviso é sempre o do uso de internet: o jogo é todo on-line
//  e, no 4G/5G, gasta dados do plano (crédito).
// =====================================================================
'use strict';
const Avisos = (() => {
  // novidades importantes, a mais nova no topo. Para avisar algo novo: põe aqui com um id novo.
  const NOVIDADES = [
    { id: 'n18', data: '14/11', t: '🌾 Sítio de Solmira refeito', d: 'Os canteiros agora são <b>leiras de terra com sulcos</b>, cercadas por troncos e estacas. A cerca do curral é de <b>postes roliços com ponta</b>, o bebedouro é um <b>tronco escavado</b> com água, e o espantalho ganhou camisa de pano, mangas com palha e chapéu de abas.' },
    { id: 'n17', data: '14/11', t: '🌴 Oásis de Kharum refeito (e o jogo mais leve)', d: 'As casas do Oásis viraram <b>casas de adobe arredondadas</b>, com cúpulas, toldos listrados e janelas de treliça. As barracas do mercado ganharam <b>panos caídos, cestos de frutas e jarros</b>. A fonte tem água correndo de verdade. E o jogo agora <b>não desenha o que está longe</b>: bem mais leve no celular.' },
    { id: 'n16', data: '14/11', t: '🏰 Torre do Cisma por fora: nova entrada', d: 'A Torre ganhou um <b>portal gótico</b> de pedra esculpida, com colunas, portas de madeira abertas, névoa na passagem e braseiros. A torre agora é uma peça só, que afina para o alto, com vitrais acesos e uma coroa de espinhos.' },
    { id: 'n15', data: '14/11', t: '🗼 Torre redesenhada (e bem mais leve)', d: 'Os andares agora são <b>salões grandes</b>, com <b>escadarias laterais</b> que dão a volta pela parede: uma <b>sobe</b> até a porta do andar de cima (selada até você limpar o andar) e outra <b>desce</b> por um vão no chão. <b>Mais monstros por andar</b> (10 a 18). Ao chegar num andar você tem <b>3 segundos de proteção</b>. A Torre ficou muito mais leve para o celular.' },
    { id: 'n13', data: '13/11', t: '🎁 Vantagens de estar numa guilda', d: 'A guilda tem <b>nível de 1 a 10</b>: 10% do XP de monstro dos membros vai para ela (sem tirar nada de ninguém). Cada nível dá <b>+1% de XP e de coroas</b>; no nível 2, <b>5% de desconto</b> nas lojas; no 3, <b>+5% de vida</b>; no 5, <b>+5% de dano</b>; no 7, <b>+10% de itens</b>. <b>Aura de grupo:</b> cada membro perto dá +10% de XP (até +30%). <b>Chamado:</b> viaje até um membro online por 500 cr.' },
    { id: 'n12', data: '13/11', t: '🛡️ Guildas e PvP livre na Torre', d: 'Toque em <b>🛡️ Guilda</b> (no menu de cima) para <b>criar</b> uma guilda (10.000 cr), <b>convidar</b>, organizar <b>líder, oficiais e membros</b>, escrever o <b>aviso</b> e conversar no <b>chat da guilda</b>. A sigla aparece em cima do nome. <b>A Torre do Cisma virou zona de guerra:</b> lá dentro qualquer jogador pode atacar você, menos quem é da sua guilda, e matar não deixa o nome vermelho.' },
    { id: 'n14', data: '14/11', t: '☠ Kravenox acorda neste sábado às 20h', d: 'Ele fica acordado <b>6 horas</b>: de <b>sábado às 20h até as 2h de domingo</b> (horário de Brasília), no topo da Torre do Cisma. A vida dele é dividida entre todos que batem. <b>Só ganha o prêmio quem lutou</b> (pelo menos 1.500 de dano). Quando ele cai, some para todo mundo e só volta no <b>sábado seguinte</b>.' },
    { id: 'n10', data: '13/11', t: '🗼 Torre: vida do chefe, sacola no andar e câmera', d: 'Os chefes agora mostram a <b>barra de vida no topo da tela</b>. Quem morre na Torre deixa a <b>sacola no andar onde caiu</b>, e a entrada tem o botão <b>🎒 Voltar até a sua sacola</b>. A câmera não fica mais presa na parede nas escadarias, e as luzes das tochas ficaram suaves.' },
    { id: 'n9', data: '13/11', t: '🏘️ Casas novas na Cidadela do Cisma', d: 'As casas da Cidadela foram refeitas: térreo de pedra, andar de cima com vigas de madeira, telhado de duas águas e janelas acesas.' },
    { id: 'n8', data: '13/11', t: '⌨️ Barra de atalhos do seu jeito', d: 'A barra voltou a ser uma linha só, com a <b>barra 2 do lado</b> (6 + 6 espaços). Toque em <b>✏️</b> (no fim da barra) e depois num espaço para escolher a habilidade ou o item que fica nele. Também dá para usar o 📌 na árvore de habilidades e na mochila.' },
    { id: 'n7', data: '13/11', t: '📶 Aviso de internet e modo Economia de dados', d: 'O jogo mostra quanto de internet está gastando e tem o modo <b>Economia de dados</b>, que gasta mais ou menos a metade. Músicas, texturas e modelos ficam guardados no aparelho e não são baixados de novo a cada versão.' },
    { id: 'n6', data: '13/11', t: '🌐 O jogo agora é todo on-line', d: 'Entre com <b>usuário e senha</b>. Seus personagens ficam guardados no servidor: entra de qualquer aparelho e nada se perde se o celular quebrar. Sem internet, o jogo pausa até a conexão voltar.' },
    { id: 'n5', data: '13/11', t: '👾 Monstros compartilhados', d: 'Todos veem e batem nos <b>mesmos monstros</b>. O XP é dividido pela parte do dano de cada um; itens e coroas ficam com quem dá o último golpe.' },
    { id: 'n4', data: '13/11', t: '🗺️ Valdora: mapa novo ao norte', d: 'Pela <b>Passagem do Norte</b>, no alto das Areias Rubras. Monstros do nível 24 ao 36 e missões a partir do nível 24 com o Vigia Morvan.' },
    { id: 'n3', data: '13/11', t: '🗼 Torre do Cisma com 30 andares', d: 'Escadarias de verdade, um Guardião a cada 5 andares e Kravenox nível 60 no topo, com item Mítico garantido.' },
  ];
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  const vistos = () => (get('reino-avisos-vistos') || '').split(',');
  const novas = () => NOVIDADES.filter(n => !vistos().includes(n.id));
  const mb = b => (b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace('.', ',');

  function usoTxt() {
    const u = typeof Net !== 'undefined' ? Net.uso : null;
    if (!u || !(u.in + u.out)) return '';
    const tot = u.in + u.out, min = Math.max(1, (Date.now() - u.t0) / 60000);
    return `<div class="av-uso">Nesta sessão: <b>${mb(tot)} MB</b> em ${Math.round(min)} min (≈ <b>${mb(tot / min * 60)} MB por hora</b> no seu ritmo de agora)</div>`;
  }
  function html(lista) {
    const eco = typeof Net !== 'undefined' && Net.economia();
    return `<div class="av-box"><div class="av-t">📢 Avisos e novidades</div><div class="av-corpo">
      <div class="av-item av-dados"><b>📶 Este jogo usa internet o tempo todo</b>
        <p>O Reino Quebrado é todo on-line. <b>No 4G/5G ele gasta dados do seu plano (crédito)</b>; no Wi-Fi, não.</p>
        <ul><li>Primeira vez: baixa uns <b>15 MB</b> (o jogo e as músicas). Depois fica guardado no aparelho e só baixa o que mudar.</li>
        <li>Jogando sozinho: cerca de <b>10 a 15 MB por hora</b>.</li>
        <li>Com amigos e monstros por perto: cerca de <b>30 a 70 MB por hora</b>.</li>
        <li>Modo <b>Economia de dados</b>: mais ou menos <b>a metade</b> (os outros jogadores e monstros andam um pouco menos suave).</li></ul>
        ${usoTxt()}
        <p class="av-dica">Dica: jogue no Wi-Fi quando puder.</p></div>
      ${lista.map(n => `<div class="av-item"><b>${n.t}</b> <small>${n.data}</small><p>${n.d}</p></div>`).join('')}
      </div><div class="av-bt"><button class="av-eco">${eco ? '📉 Economia de dados: LIGADA' : '📶 Economia de dados: desligada'}</button><button class="av-ok">Entendi</button></div></div>`;
  }
  // mostra o painel; feito() roda quando a pessoa toca em "Entendi"
  function mostrar(todas, feito) {
    const lista = todas ? NOVIDADES : novas();
    let el = document.getElementById('avisos'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'avisos'; el.innerHTML = html(lista); document.body.appendChild(el);
    const ligar = () => {
      el.querySelector('.av-eco').onclick = () => { const on = !(typeof Net !== 'undefined' && Net.economia()); set('reino-economia', on ? '1' : '0'); if (typeof Audio8 !== 'undefined') Audio8.sfx('click'); el.innerHTML = html(lista); ligar(); };
      el.querySelector('.av-ok').onclick = () => { if (typeof Audio8 !== 'undefined') Audio8.sfx('click'); set('reino-avisos-vistos', NOVIDADES.map(n => n.id).join(',')); el.remove(); if (feito) feito(); };
    };
    ligar();
  }
  // depois do login: só aparece se tiver novidade que a pessoa ainda não viu
  function seTiverNovo(feito) { if (novas().length) mostrar(false, feito); else feito(); }
  return { mostrar, seTiverNovo };
})();
