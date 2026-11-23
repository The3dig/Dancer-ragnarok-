// =====================================================================
//  Desafios: caçadas e entregas longas (300 de cada bicho, chefe 5 vezes,
//  centenas de materiais). Cada um dá um prêmio que SÓ vem daqui:
//  aura, rastro, mascote, título, cor do nome ou equipamento lendário.
//  Quatro mestres, um em cada cidade. Cada desafio vale uma vez por personagem.
//  A contagem de mortes começa com o que o personagem já matou (bestiário).
// =====================================================================
'use strict';
const Desafios = (() => {
  // ---------------- prêmios exclusivos
  const EQUIP = {
    // [nome, ícone, espaço, mods]
    colar_alfa: ['Colar do Caçador Alfa', '🦴', 'colar', { pow: 16, crit: 0.05, hp: 150 }],
    lamina_miragem: ['Lâmina da Miragem', '🌙', 'arma', { pow: 52, crit: 0.08, spd: 0.05 }],
    elmo_guardiao: ['Elmo do Guardião Eterno', '🪖', 'capacete', { def: 20, hp: 220, pow: 10 }],
    anel_algoz: ['Anel do Algoz do Soberano', '💍', 'anel', { pow: 22, crit: 0.07, sp: 60 }],
    armadura_cinzas: ['Armadura das Cinzas', '🔥', 'armadura', { def: 40, hp: 420, pow: 8 }],
    anel_valdora: ['Anel de Valdora Eterna', '💍', 'anel', { def: 10, hp: 180, sp: 40 }],
    coroa_raiz: ['Coroa da Primeira Raiz', '👑', 'capacete', { def: 26, hp: 280, pow: 14 }],
    // a melhor armadura do jogo: só no fim da Grande Aventura do Nosferatur (Praia de Cômodo)
    armadura_nosferatur: ['Armadura Noturna de Nosferatur', '🦇', 'armadura', { def: 80, hp: 1100, pow: 25, crit: 0.05 }, 4, 'amigos'],
    // o melhor capacete do jogo: só no fim da Grande Jornada de Rivas (Oásis de Kharum)
    manto_lembrancas: ['Manto das Lembranças', '🌫️', 'armadura', { def: 58, hp: 620, pow: 12 }],
    capa_suspensa: ['Capa do Vazio Suspenso', '🌌', 'armadura', { def: 66, hp: 760, pow: 16 }],
    // o colar da assassina: só no fim da aventura da Skye (Acampamento de Valdora)
    colar_skye: ['Colar da Lâmina Oculta de Skye', '🗡️', 'colar', { hp: 520, sp: 220, pow: 26, crit: 0.05, spd: 0.06 }, 4, 'amigos'],
    // a arma do Michel Temmer (Clareira de Lira), o anel do Will Sacer (Vigília do Vale) e as botas do Urakin Star (Refúgio Suspenso)
    espada_temmer: ['Espada Eterna de Michel Temmer', '⚔️', 'arma', { pow: 96, crit: 0.08, hp: 300, spd: 0.04 }, 4, 'amigos'],
    anel_sacer: ['Anel Sagrado de Will Sacer', '💍', 'anel', { sp: 320, hp: 460, def: 26, pow: 18 }, 4, 'amigos'],
    botas_urakin: ['Botas Estelares de Urakin Star', '👢', 'botas', { spd: 0.12, def: 34, hp: 420, crit: 0.04 }, 4, 'amigos'],
    luvas_ludivicki: ['Luvas Eternas de Ludivicki', '🧤', 'luvas', { pow: 40, crit: 0.07, def: 22, hp: 300 }, 4, 'amigos'],
    anel_imperium: ['Anel Imperial do Imperio', '👑', 'anel', { pow: 34, def: 20, hp: 380, crit: 0.06 }, 4, 'amigos'],
    elmo_rivas: ['Elmo das Mil Areias de Rivas', '🪖', 'capacete', { def: 40, hp: 550, pow: 30, crit: 0.06 }, 4, 'amigos'],
  };
  for (const [id, [name, ic, slot, mods, rar, set]] of Object.entries(EQUIP))
    ITEMS[id] = { name, ic, kind: 'equip', slot, mods, rar: rar || 3, set, price: 0, sell: set === 'amigos' ? 0 : rar === 4 ? 20000 : 5000, desafio: true, preso: set === 'amigos' };   // peça dos amigos: só de quem fez a aventura (não troca, não vende)
  const VIS = [   // [categoria, chave, nome, ícone, extra]
    ['aura', 'trigo', 'Aura do Trigo Dourado', '🌾', { c: [0xffd860, 0xc8a040] }],
    ['rastro', 'outono', 'Folhas de Outono', '🍂', { c: [0xe08030, 0xc04020], smoke: true }],
    ['titulo', 'flagelo', '« Flagelo dos Campos »', '🐛', {}],
    ['titulo', 'alfa', '« Caçador de Alfas »', '🦴', {}],
    ['aura', 'miragem', 'Aura da Miragem', '🏜️', { c: [0xffb070, 0x9ad8ff] }],
    ['aura', 'chefes', 'Aura Quebra-Chefes', '💥', { c: [0xffb040, 0xff6020] }],
    ['titulo', 'quebra', '« Quebra-Chefes »', '💥', {}],
    ['pet', 'rainha', 'Larva Rainha', '👑', { img: 'e_larvaMaeX', h: 0.8 }],
    ['aura', 'espinhos', 'Coroa de Espinhos', '🩸', { c: [0xff2020, 0x2a0008] }],
    ['titulo', 'algoz', '« Algoz do Soberano »', '☠️', {}],
    ['rastro', 'cisma', 'Chamas do Cisma', '🟣', { c: [0x9a40ff, 0xff40c0], spark: true }],
    ['aura', 'cinzas', 'Cinzas Vivas', '🌋', { c: [0xff6a20, 0x5a4a48] }],
    ['titulo', 'carrasco', '« Fim do Carrasco »', '🪓', {}],
    ['rastro', 'prata', 'Rastro de Prata', '⚪', { c: [0xd8dce8, 0xffffff], spark: true }],
    ['aura', 'ordem', 'Luz da Ordem', '🔹', { c: [0x7ad8ff, 0xffffff] }],
    ['titulo', 'lanca', '« Herdeiro da Lança »', '🔱', {}],
    ['rastro', 'raizes', 'Raízes Douradas', '✴️', { c: [0xffd060, 0xc8a050], spark: true }],
    ['titulo', 'memoria', '« Memória Viva »', '✴️', {}],
    ['aura', 'nosferatur', 'Aura Noturna de Nosferatur', '🦇', { c: [0xc0103a, 0x6a1aa0] }],
    ['titulo', 'amigo_nosfe', '« Amigo do Nosferatur »', '🦇', {}],
    ['aura', 'nevoa', 'Névoa dos Mortos', '🌫️', { c: [0xd8dce4, 0x8a8a9a] }],
    ['titulo', 'ponte', '« Quem Atravessou a Ponte »', '🦴', {}],
    ['rastro', 'areias', 'Areias de Rivas', '🐪', { c: [0xffd080, 0xe8a040], spark: true }],
    ['titulo', 'amigo_rivas', '« Amigo de Rivas »', '🐪', {}],
    ['aura', 'ceu', 'Sombra Assassina de Skye', '🗡️', { c: [0x6a1a8a, 0x1a0a1a] }],
    ['rastro', 'nuvens', 'Passos nas Sombras', '🌑', { c: [0x2a1a3a, 0x8a4aff], smoke: true }],
    ['titulo', 'amigo_skye', '« Amigo da Skye »', '🗡️', {}],
    ['aura', 'temmer', 'Lâmina de Temmer', '⚔️', { c: [0xff8040, 0xffd060] }],
    ['rastro', 'brasas', 'Rastro de Brasas', '🔥', { c: [0xff6020, 0xffb040], spark: true }],
    ['titulo', 'amigo_temmer', '« Amigo do Michel Temmer »', '⚔️', {}],
    ['aura', 'sagrada', 'Luz Sagrada de Will Sacer', '✝️', { c: [0xfff4c0, 0xffffff] }],
    ['rastro', 'bencao', 'Rastro de Bênçãos', '✨', { c: [0xfff0a0, 0xffffff], spark: true }],
    ['titulo', 'amigo_sacer', '« Amigo do Will Sacer »', '✝️', {}],
    ['aura', 'estrelas', 'Céu Estrelado de Urakin', '⭐', { c: [0x6a8aff, 0xfff0a0] }],
    ['rastro', 'estelar', 'Poeira Estelar', '🌠', { c: [0xb0c8ff, 0xffffff], spark: true }],
    ['titulo', 'amigo_urakin', '« Amigo do Urakin Star »', '⭐', {}],
    ['aura', 'ludivicki', 'Fúria de Ludivicki', '🧤', { c: [0x40e080, 0xffe060] }],
    ['rastro', 'trevos', 'Rastro de Trevos', '🍀', { c: [0x40c060, 0xb0ff90], spark: true }],
    ['titulo', 'amigo_ludi', '« Amigo do Ludivicki »', '🧤', {}],
    ['aura', 'imperial', 'Majestade do Imperio', '👑', { c: [0xffcf40, 0x8a2aff] }],
    ['rastro', 'coroas', 'Rastro Imperial', '👑', { c: [0xffd860, 0xa040ff], spark: true }],
    ['titulo', 'amigo_imperium', '« Amigo do Imperio »', '👑', {}],
    ['aura', 'lyra', 'Cristal de Lyra', '💠', { c: [0xffc860, 0x9a5aff] }],
    ['titulo', 'fundo', '« Quem Viu o Fundo »', '🌌', {}],
  ];
  const visNome = (c, k) => { const v = VIS.find(x => x[0] === c && x[1] === k); return v ? `${v[3]} ${v[2]}` : k; };

  // ---------------- os mestres e os desafios
  // pede: m = matar {tipo: n}; g = grupos {alfa|campo|guardiao|kravenox: n}; i = entregar itens {id: n}
  // dá: v = [[categoria, chave]], e = [equipamento]
  const MESTRES = {
    ivanna: { nome: 'Caçadora Ivanna', fala: 'Eu caço nestes campos desde antes do Cisma. Mostre que aguenta o serviço e eu te dou o que ninguém compra.', lista: [
      { id: 'd1', t: 'Praga dos Campos', pede: { m: { pompom: 300, zunzum: 300, fungolino: 300 } }, da: { v: [['aura', 'trigo'], ['titulo', 'flagelo']] } },
      { id: 'd2', t: 'Colheita Sombria', pede: { i: { gosma: 300, po_eco: 300, raiz: 300, nucleo_lumen: 3 } }, da: { v: [['rastro', 'outono']] } },
      { id: 'd3', t: 'O Grande Alfa', pede: { g: { alfa: 50 } }, da: { e: ['colar_alfa'], v: [['titulo', 'alfa']] } },
    ] },
    zahir: { nome: 'Rivas', saga: 'rivas', sagaNome: '🐪 A Grande Jornada de Rivas', fala: 'A areia guarda tudo, viajante. Até o que você ainda não conquistou.', lista: [
      { id: 'd4', t: 'Senhor das Dunas', pede: { m: { besouro: 300, serpe: 300 } }, da: { v: [['aura', 'miragem']] } },
      { id: 'd5', t: 'Lâmina da Miragem', pede: { i: { areia_rubra: 200, carapaca: 100, veu: 100, cristal_puro: 3, lagrima: 2 } }, da: { e: ['lamina_miragem'] } },
      { id: 'd6', t: 'Quebra-Chefes', pede: { g: { campo: 5 } }, da: { v: [['aura', 'chefes'], ['titulo', 'quebra']] } },
    ] },
    vex: { nome: 'Arauto Vex', fala: 'A Torre não perdoa. Quem sobe e desce trinta andares vezes sem conta merece ser lembrado.', lista: [
      { id: 'd7', t: 'Os Cinco da Torre', pede: { m: { larva: 300, verme: 300, esfera: 300, sentinela: 300 }, g: { guardiao: 30 } }, da: { e: ['elmo_guardiao'], v: [['pet', 'rainha']] } },
      { id: 'd8', t: 'Algoz do Soberano', pede: { g: { kravenox: 5 } }, da: { e: ['anel_algoz'], v: [['aura', 'espinhos'], ['titulo', 'algoz']] } },
      { id: 'd9', t: 'Essência do Cisma', pede: { i: { lasca: 300, essencia: 100, placa_vazio: 50, olho_vazio: 5 } }, da: { v: [['rastro', 'cisma']] } },
    ] },
    teodor: { nome: 'Andarilho Teodor', fala: 'Eu me perdi nesta floresta há tantos anos que ela parou de tentar me matar. Você ainda é interessante para ela.', lista: [
      { id: 'd13', t: 'Floresta em Silêncio', pede: { m: { larvaPernalta: 300, raizOssuda: 300, larvaCristal: 300, larvaAntiga: 300, memoria: 300 } }, da: { e: ['coroa_raiz'] } },
      { id: 'd14', t: 'Herdeiro da Lança', pede: { m: { guardiaoBranco: 5 } }, da: { v: [['aura', 'ordem'], ['titulo', 'lanca']] } },
      { id: 'd15', t: 'Memória Viva', pede: { i: { lembranca: 300, membrana: 200, fragmento_dourado: 10, coracao_floresta: 5 } }, da: { v: [['rastro', 'raizes'], ['titulo', 'memoria']] } },
    ] },
    // a Grande Aventura do Nosferatur: sete etapas em sequência, por todo o mundo (pedido do Rone)
    nosferatur: { nome: 'Nosferatur', fala: 'Quando eu crescer vou ser o maior aventureiro do mundo! Mas antes... você me ajuda? É uma aventura <b>gigante</b>, tá? Uma de cada vez!', lista: [
      { id: 'n1', t: '1. O treino do Nosferatur', pede: { m: { pompom: 300, zunzum: 300, fungolino: 300, besouro: 300, serpe: 300 } }, da: { cr: 20000, it: { red: 50, blue: 20 } } },
      { id: 'n2', req: 'n1', t: '2. Pescador de verdade', pede: { p: { pesca: 300 }, i: { perola: 3 } }, da: { cr: 30000, it: { lagosta: 10 } } },
      { id: 'n3', req: 'n2', t: '3. Caçador de monstros grandes', pede: { g: { alfa: 60, campo: 15 } }, da: { cr: 40000, it: { blue: 40 } } },
      { id: 'n4', req: 'n3', t: '4. Os três guardiões', pede: { m: { guardiao: 20, carrasco: 10, guardiaoBranco: 10 } }, da: { cr: 60000, it: { essencia: 10 } } },
      { id: 'n5', req: 'n4', t: '5. O topo da Torre', pede: { p: { torre: 30 }, g: { kravenox: 2 } }, da: { cr: 80000, it: { fragmento_dourado: 3 } } },
      { id: 'n6', req: 'n5', t: '6. O tesouro escondido', pede: { i: { gosma: 500, cinza: 300, lembranca: 300, fragmento_dourado: 10, olho_vazio: 10, aco_valdora: 10, perola: 5 } }, da: { cr: 100000 } },
      { id: 'n7', req: 'n6', t: '7. A armadura da noite', pede: { m: { larvaAntiga: 500, memoria: 500, sentinelaMuralha: 500, raizNegra: 500 }, p: { kvx: 1500 } }, da: { e: ['armadura_nosferatur'], v: [['aura', 'nosferatur'], ['titulo', 'amigo_nosfe']], cr: 150000 } },
    ] },
    // a Grande Jornada de Rivas: sete etapas em sequência, com o melhor capacete do jogo no fim (pedido do Rone)
    rivas: { nome: 'Rivas', fala: 'Eu atravessei estas areias mais vezes do que tem estrela no céu. Quer o meu elmo? Então caminhe o que eu caminhei. Uma etapa de cada vez.', lista: [
      { id: 'r1', t: '1. As areias do Rivas', pede: { m: { besouro: 400, serpe: 400 } }, da: { cr: 25000, it: { blue: 30 } } },
      { id: 'r2', req: 'r1', t: '2. A caravana perdida', pede: { i: { areia_rubra: 300, carapaca: 150, veu: 150 } }, da: { cr: 35000, it: { agua_coco: 20 } } },
      { id: 'r3', req: 'r2', t: '3. Os senhores das dunas', pede: { g: { campo: 20, alfa: 40 } }, da: { cr: 45000, it: { cristal_puro: 2 } } },
      { id: 'r4', req: 'r3', t: '4. As muralhas caídas', pede: { m: { sentinelaMuralha: 400, carrasco: 10 } }, da: { cr: 60000, it: { aco_valdora: 2 } } },
      { id: 'r5', req: 'r4', t: '5. Miragem na Torre', pede: { p: { torre: 30 }, g: { guardiao: 40 } }, da: { cr: 80000, it: { fragmento_dourado: 3 } } },
      { id: 'r6', req: 'r5', t: '6. O tesouro do deserto', pede: { i: { cristal_puro: 10, lagrima: 10, coral: 10, coroa_caranguejo: 5, runa_ordem: 10 } }, da: { cr: 100000 } },
      { id: 'r7', req: 'r6', t: '7. O elmo das mil areias', pede: { m: { guardiaoBranco: 15, reiCaranguejo: 10 }, p: { kvx: 1500 } }, da: { e: ['elmo_rivas'], v: [['rastro', 'areias'], ['titulo', 'amigo_rivas']], cr: 150000 } },
    ] },
    severo: { nome: 'Vigia Severo', fala: 'Faz trinta anos que eu vigio esse vale. Ninguém atravessa. Se você quer provar o contrário, prove aqui primeiro.', lista: [
      { id: 'd16', t: 'Silêncio no Vale', pede: { m: { maoPalida: 300, sussurro: 300, damaSemOlhos: 300, sombraVale: 300, guardaOssos: 300 } }, da: { e: ['manto_lembrancas'] } },
      { id: 'd17', t: 'Quem Atravessou a Ponte', pede: { m: { primeiroGuardiao: 5 } }, da: { v: [['aura', 'nevoa'], ['titulo', 'ponte']] } },
    ] },
    skye: { nome: 'Skye', fala: 'Sou assassina. Ninguém me vê chegar, e ninguém me vê sair... nem os monstros de Valdora. Quer aprender a andar nas sombras? São sete etapas, e no fim eu te dou o meu colar.', lista: [
      { id: 'sk1', t: '1. Silêncio nas cinzas', pede: { m: { ecoCinza: 150, raizNegra: 150 } }, da: { cr: 20000, it: { blue: 20 } } },
      { id: 'sk2', req: 'sk1', t: '2. Veneno e corda', pede: { i: { cinza: 100, fibra: 100, membrana: 30 } }, da: { cr: 30000, it: { red: 40 } } },
      { id: 'sk3', req: 'sk2', t: '3. Alvos grandes', pede: { g: { alfa: 40, campo: 10 } }, da: { cr: 40000, it: { fragmento_dourado: 2 } } },
      { id: 'sk4', req: 'sk3', t: '4. Entre as árvores mortas', pede: { m: { larvaPernalta: 300, raizOssuda: 300, guardiaoBranco: 5 } }, da: { cr: 60000, it: { blue: 40 } } },
      { id: 'sk5', req: 'sk4', t: '5. A Torre, sem ser vista', pede: { p: { torre: 30 }, g: { guardiao: 30 } }, da: { cr: 80000, it: { fragmento_dourado: 3 } } },
      { id: 'sk6', req: 'sk5', t: '6. Uma sombra entre sombras', pede: { m: { sombraVale: 300, primeiroGuardiao: 3 }, i: { osso_ponte: 50 } }, da: { cr: 100000, v: [['rastro', 'nuvens']] } },
      { id: 'sk7', req: 'sk6', t: '7. A Lâmina Oculta', pede: { m: { carrasco: 10, primeiroGuardiao: 5 }, p: { kvx: 1500 } }, da: { e: ['colar_skye'], v: [['aura', 'ceu'], ['titulo', 'amigo_skye']], cr: 150000 } },
    ] },
    temmer: { nome: 'Michel Temmer', fala: 'Floresta morta, raiz que anda, larva do tamanho de casa... pra mim isso é treino. Vem comigo? Sete etapas. No fim, a minha espada é sua.', lista: [
      { id: 'mt1', t: '1. Raízes no caminho', pede: { m: { larvaPernalta: 200, raizOssuda: 200 } }, da: { cr: 40000, it: { blue: 30 } } },
      { id: 'mt2', req: 'mt1', t: '2. O que a floresta deixa', pede: { i: { osso_raiz: 100, cristal_carne: 80 } }, da: { cr: 50000, it: { red: 60 } } },
      { id: 'mt3', req: 'mt2', t: '3. Larvas antigas', pede: { m: { larvaCristal: 300, larvaAntiga: 300 } }, da: { cr: 60000, it: { fragmento_dourado: 2 } } },
      { id: 'mt4', req: 'mt3', t: '4. Caçada grande', pede: { g: { alfa: 60, campo: 15 } }, da: { cr: 70000, it: { blue: 40 } } },
      { id: 'mt5', req: 'mt4', t: '5. Memórias e guardiões', pede: { m: { memoria: 300, guardiaoBranco: 10 } }, da: { cr: 80000, it: { fragmento_dourado: 3 } } },
      { id: 'mt6', req: 'mt5', t: '6. A forja da espada', pede: { i: { placa_antiga: 60, lembranca: 60, runa_ordem: 20 } }, da: { cr: 100000, v: [['rastro', 'brasas']] } },
      { id: 'mt7', req: 'mt6', t: '7. A Espada Eterna', pede: { m: { guardiaoBranco: 15, primeiroGuardiao: 5 }, p: { kvx: 1500 } }, da: { e: ['espada_temmer'], v: [['aura', 'temmer'], ['titulo', 'amigo_temmer']], cr: 150000 } },
    ] },
    sacer: { nome: 'Will Sacer', fala: 'Sou sacerdote. Vim pro Vale porque aqui os mortos não descansam, e alguém precisa rezar por eles... e às vezes bater neles. Me ajuda? No fim, te dou o meu anel sagrado.', lista: [
      { id: 'ws1', t: '1. Mãos que não descansam', pede: { m: { maoPalida: 300 } }, da: { cr: 50000, it: { blue: 30 } } },
      { id: 'ws2', req: 'ws1', t: '2. Silenciar as vozes', pede: { m: { sussurro: 300, damaSemOlhos: 200 } }, da: { cr: 60000, it: { red: 60 } } },
      { id: 'ws3', req: 'ws2', t: '3. Flores para os túmulos', pede: { i: { unha_palida: 100, veu_branco: 60, flor_tumulo: 30 } }, da: { cr: 70000, it: { fragmento_dourado: 2 } } },
      { id: 'ws4', req: 'ws3', t: '4. Sombras e ossos', pede: { m: { sombraVale: 300, guardaOssos: 300 } }, da: { cr: 80000, it: { blue: 50 } } },
      { id: 'ws5', req: 'ws4', t: '5. A oração na Torre', pede: { p: { torre: 30 }, g: { guardiao: 40 } }, da: { cr: 90000, it: { fragmento_dourado: 3 } } },
      { id: 'ws6', req: 'ws5', t: '6. Bênção sobre a ponte', pede: { m: { primeiroGuardiao: 5 }, i: { sombra_densa: 60, eco_voz: 60 } }, da: { cr: 110000, v: [['rastro', 'bencao']] } },
      { id: 'ws7', req: 'ws6', t: '7. O Anel Sagrado', pede: { m: { primeiroGuardiao: 10, sombraFonte: 2 }, p: { kvx: 1500 } }, da: { e: ['anel_sacer'], v: [['aura', 'sagrada'], ['titulo', 'amigo_sacer']], cr: 160000 } },
    ] },
    urakin: { nome: 'Urakin Star', fala: 'Daqui do Refúgio dá pra ver todas as estrelas. Cada uma é alguém que atravessou o vazio. Quer virar estrela também? Sete etapas, e as minhas botas são suas.', lista: [
      { id: 'us1', t: '1. Raízes no vazio', pede: { m: { raizSuspensa: 300 } }, da: { cr: 60000, it: { luz_suspensa: 20 } } },
      { id: 'us2', req: 'us1', t: '2. Cristais que andam', pede: { m: { cristalVivo: 300 }, i: { estilhaco_vivo: 60 } }, da: { cr: 70000, it: { blue: 50 } } },
      { id: 'us3', req: 'us2', t: '3. Ecos e sentinelas', pede: { m: { ecoCidade: 300, sentinelaSubmersa: 300 } }, da: { cr: 80000, it: { fragmento_dourado: 3 } } },
      { id: 'us4', req: 'us3', t: '4. Ovos do abismo', pede: { m: { larvaAbismo: 300 }, i: { ovo_abismo: 60, placa_submersa: 60 } }, da: { cr: 90000, it: { red: 80 } } },
      { id: 'us5', req: 'us4', t: '5. Caçador de estrelas', pede: { g: { alfa: 80, campo: 20 } }, da: { cr: 100000, it: { cristal_tres: 1 } } },
      { id: 'us6', req: 'us5', t: '6. A luz do fundo', pede: { m: { sombraFonte: 5 } }, da: { cr: 120000, v: [['rastro', 'estelar']] } },
      { id: 'us7', req: 'us6', t: '7. As Botas Estelares', pede: { m: { sombraFonte: 10, primeiroGuardiao: 10 }, p: { kvx: 2000 } }, da: { e: ['botas_urakin'], v: [['aura', 'estrelas'], ['titulo', 'amigo_urakin']], cr: 180000 } },
    ] },
    ludivicki: { nome: 'Ludivicki', fala: 'E aí! Cheguei agora no Reino também. Bora começar do zero, junto? Sete etapas, do primeiro bichinho até o Kravenox. No fim eu te dou as minhas luvas.', lista: [
      { id: 'ld1', t: '1. Os primeiros bichinhos', pede: { m: { pompom: 200, zunzum: 200 } }, da: { cr: 5000, it: { red: 20 } } },
      { id: 'ld2', req: 'ld1', t: '2. Material de iniciante', pede: { i: { gosma: 50, po_eco: 50, raiz: 50 } }, da: { cr: 10000, it: { blue: 10 } } },
      { id: 'ld3', req: 'ld2', t: '3. As Areias Rubras', pede: { m: { besouro: 200, serpe: 200 } }, da: { cr: 20000, it: { red: 40 } } },
      { id: 'ld4', req: 'ld3', t: '4. Subindo a Torre', pede: { p: { torre: 10 }, g: { guardiao: 10 } }, da: { cr: 30000, it: { fragmento_dourado: 1 } } },
      { id: 'ld5', req: 'ld4', t: '5. As muralhas de Valdora', pede: { m: { raizNegra: 300, sentinelaMuralha: 200 } }, da: { cr: 50000, it: { blue: 30 } } },
      { id: 'ld6', req: 'ld5', t: '6. Carrasco e caranguejo', pede: { m: { carrasco: 5, reiCaranguejo: 3 } }, da: { cr: 80000, v: [['rastro', 'trevos']] } },
      { id: 'ld7', req: 'ld6', t: '7. As Luvas Eternas', pede: { m: { guardiaoBranco: 10, primeiroGuardiao: 3 }, p: { kvx: 1000 } }, da: { e: ['luvas_ludivicki'], v: [['aura', 'ludivicki'], ['titulo', 'amigo_ludi']], cr: 120000 } },
    ] },
    imperium: { nome: 'Imperio', fala: 'Um império não se ergue sozinho. A Cidadela já foi o coração do Reino, e a Torre ainda é a coroa dela. Prove que merece ficar do meu lado: sete etapas, e o meu anel imperial é seu.', lista: [
      { id: 'im1', t: '1. Limpar a Cidadela', pede: { m: { sentinela: 200, esfera: 200 } }, da: { cr: 15000, it: { blue: 15 } } },
      { id: 'im2', req: 'im1', t: '2. Os primeiros degraus', pede: { p: { torre: 15 } }, da: { cr: 25000, it: { red: 40 } } },
      { id: 'im3', req: 'im2', t: '3. Guardiões e chefes', pede: { g: { guardiao: 20, campo: 10 } }, da: { cr: 40000, it: { fragmento_dourado: 1 } } },
      { id: 'im4', req: 'im3', t: '4. O tesouro do império', pede: { i: { brasao: 50, aco_valdora: 5, runa_ordem: 10 } }, da: { cr: 60000, it: { blue: 40 } } },
      { id: 'im5', req: 'im4', t: '5. A coroa da Torre', pede: { p: { torre: 30 }, m: { carrasco: 8 } }, da: { cr: 80000, it: { fragmento_dourado: 3 } } },
      { id: 'im6', req: 'im5', t: '6. As fronteiras do império', pede: { m: { guardaOssos: 300, primeiroGuardiao: 5 } }, da: { cr: 100000, v: [['rastro', 'coroas']] } },
      { id: 'im7', req: 'im6', t: '7. O Anel Imperial', pede: { m: { sombraFonte: 3, guardiaoBranco: 10 }, p: { kvx: 2000 } }, da: { e: ['anel_imperium'], v: [['aura', 'imperial'], ['titulo', 'amigo_imperium']], cr: 170000 } },
    ] },
    oren: { nome: 'Vidente Oren', fala: 'Eu caí da ponte há tanto tempo que esqueci de que lado fica o céu. Mas vejo o que ninguém vê. Mostre que você também consegue.', lista: [
      { id: 'd18', t: 'Silêncio no Vazio', pede: { m: { raizSuspensa: 300, cristalVivo: 300, ecoCidade: 300, sentinelaSubmersa: 300, larvaAbismo: 300 } }, da: { e: ['capa_suspensa'] } },
      { id: 'd19', t: 'Quem Viu o Fundo', pede: { m: { sombraFonte: 5 } }, da: { v: [['aura', 'lyra'], ['titulo', 'fundo']] } },
    ] },
    brigida: { nome: 'Velha Brígida', fala: 'Eu vi Valdora inteira, antes de virar cinza. Traga o que restou dela e eu te conto como ela era.', lista: [
      { id: 'd10', t: 'Cinzas de Valdora', pede: { m: { raizNegra: 300, ecoCinza: 300, larvaCinza: 300, sentinelaMuralha: 300 } }, da: { e: ['armadura_cinzas'] } },
      { id: 'd11', t: 'O Fim do Carrasco', pede: { m: { carrasco: 5 } }, da: { v: [['aura', 'cinzas'], ['titulo', 'carrasco']] } },
      { id: 'd12', t: 'Memória de Valdora', pede: { i: { cinza: 300, fibra: 300, brasao: 50, aco_valdora: 5 } }, da: { e: ['anel_valdora'], v: [['rastro', 'prata']] } },
    ] },
  };
  const TODOS = Object.values(MESTRES).flatMap(M => M.lista.map(d => ({ ...d, mestre: M.nome })));
  for (const d of TODOS) for (const [c, k] of (d.da.v || [])) {
    const v = VIS.find(x => x[0] === c && x[1] === k);
    if (v && typeof Cos !== 'undefined' && Cos.exclusivo) Cos.exclusivo(c, k, v[2], v[3], { ...v[4], desafio: `${d.t} (${d.mestre})` });
  }
  const GRUPO = { alfa: 'monstros Alfa', campo: 'chefes de campo', guardiao: 'Guardiões da Torre', kravenox: 'Kravenox' };

  // ---------------- contagem
  function S() {
    if (P.dsf) return P.dsf;
    const b = P.bestiary || {}, k = { ...b }, g = { alfa: 0, campo: 0, guardiao: b.guardiao || 0, kravenox: P.kvxKills || 0 };
    for (const [t, n] of Object.entries(b)) { if (t.startsWith('alfa_')) g.alfa += n; else if (MOBDEF[t] && MOBDEF[t].field) g.campo += n; }
    return (P.dsf = { k, g, feito: {} });
  }
  function onKill(m) {
    const s = S(); s.k[m.type] = (s.k[m.type] || 0) + 1;
    // aviso quando um monstro de qualquer etapa aberta chega no número pedido (para não caçar a mais)
    for (const d of TODOS) { const n = (d.pede.m || {})[m.type]; if (!n || s.feito[d.id] || (d.req && !s.feito[d.req]) || s.k[m.type] !== n) continue;
      const falta = linhas(d).filter(l => l.tem < l.n);
      log(`✅ <b>${nomeMob(m.type)}</b> ${n}/${n} em <b>${d.t}</b> (${d.mestre}). ${falta.length ? 'Pode parar de caçar esse! Agora falta: ' + falta.map(l => `${l.txt.replace(/^\S+ /, '')} (${l.n - l.tem})`).join(', ') : '🏆 Etapa pronta: receba o prêmio no 🤝!'}`, 'gold');
      Audio8.sfx('buff'); }
    const F = P.dsfFoco; if (F) { const d = TODOS.find(q => q.id === F.id); if (!d || s.feito[d.id]) P.dsfFoco = null;
      else if (F.t === m.type) { const n = (d.pede.m || {})[F.t], tem = s.k[m.type];
        if (n && tem >= n) { const prox = Object.entries(d.pede.m || {}).find(([t, q]) => (s.k[t] || 0) < q); F.t = prox ? prox[0] : null; }
        else if (n && tem % 10 === 0) log(`🎯 ${nomeMob(m.type)}: <b>${tem}/${n}</b> · faltam ${n - tem}`, 'sys'); } }
    if (m.d.alfa) s.g.alfa++;
    if (m.d.field) s.g.campo++;
    if (m.type === 'guardiao' || m.towerGuard) s.g.guardiao++;
    if (m.type === 'kravenox') s.g.kravenox++;
  }
  const nomeMob = t => (MOBDEF[t] && MOBDEF[t].name) || t;
  function linhas(d) {
    const s = S(), L = [];
    for (const [t, n] of Object.entries(d.pede.m || {})) L.push({ txt: `⚔️ ${nomeMob(t)}`, tem: Math.min(n, s.k[t] || 0), n });
    for (const [g, n] of Object.entries(d.pede.g || {})) L.push({ txt: `☠️ ${GRUPO[g]}`, tem: Math.min(n, s.g[g] || 0), n });
    for (const [k, n] of Object.entries(d.pede.p || {})) L.push(k === 'kvx' ? { txt: '☠️ dano no Kravenox acordado (sábado, 20h) depois de abrir esta etapa', tem: Math.min(n, Math.round((S().kvx || {})[d.id] || (d.id === 'n7' ? S().kvxN || 0 : 0))), n } : k === 'pesca' ? { txt: '🎣 peixes pescados em Cômodo', tem: Math.min(n, (P.pesca && P.pesca.n) || 0), n } : { txt: '🗼 andar mais alto da Torre (30 = topo)', tem: Math.min(n, P.towerBest || 0), n });
    for (const [id, n] of Object.entries(d.pede.i || {})) L.push({ txt: `${ITEMS[id] ? ITEMS[id].ic + ' ' + ITEMS[id].name : id} (entregar)`, tem: Math.min(n, P.inv[id] || 0), n });
    return L;
  }
  const pronto = d => linhas(d).every(l => l.tem >= l.n);
  const premioTxt = d => [...(d.da.cr ? [`<b style="color:#ffcf40">💰 ${d.da.cr.toLocaleString('pt-BR')} cr</b>`] : []), ...Object.entries(d.da.it || {}).map(([id, n]) => `${ITEMS[id] ? ITEMS[id].ic + ' ' + ITEMS[id].name : id} ×${n}`),...(d.da.e || []).map(id => `<b style="color:${ITEMS[id].rar === 4 ? '#ff4a4a' : '#ffb640'}">${ITEMS[id].ic} ${ITEMS[id].name}</b> <small>(${ITEMS[id].rar === 4 ? 'MÍTICO' : 'lendário'}: ${Object.entries(ITEMS[id].mods).map(([k, v]) => `${{ pow: 'Dano', def: 'Defesa', hp: 'HP', sp: 'SP', crit: 'Crítico', spd: 'Velocidade' }[k]} +${['crit', 'spd'].includes(k) ? Math.round(v * 100) + '%' : v}`).join(', ')})</small>`),
    ...(d.da.v || []).map(([c, k]) => `<b>${visNome(c, k)}</b> <small>(${{ aura: 'aura', rastro: 'rastro', pet: 'mascote', titulo: 'título', cor: 'cor' }[c]})</small>`)].join('<br>');

  // ---------------- conversa
  function talk(n, direto) {
    const M0 = MESTRES[n.dsf]; if (!M0) return;
    if (M0.saga && !direto) { dialog(`💬 ${M0.nome}`, M0.fala, [{ label: '🏆 Desafios', fn: () => { talk(n, 'desafios'); return true; } }, { label: M0.sagaNome, fn: () => { talk({ ...n, dsf: M0.saga }, 'saga'); return true; } }, { label: 'Até mais' }]); return; }
    const M = M0;
    const s = S();
    const opts = M.lista.map(d => {
      const trava = d.req && !s.feito[d.req], ok = !trava && pronto(d), feito = s.feito[d.id];
      return { label: `${feito ? '✅' : trava ? '🔒' : ok ? '🏆' : '▫️'} ${d.t}${feito ? ' (concluído)' : trava ? ' — termine a anterior' : ok ? ' — pronto para receber!' : ''}`, fn: () => { ver(n, d); return true; } };
    });
    if (n.remoto) { const npc = NPCS.find(q => q.name === n.npcNome); if (npc) opts.push({ label: `🧭 Ir até ${n.npcNome}`, fn: () => irAte(npc) }); opts.push({ label: '← Amigos', fn: () => { amigos(); return true; } }); }
    else opts.push({ label: 'Até mais' });
    dialog(`🏆 ${M.nome}`, `${M.fala}<br><small>Cada desafio vale uma vez. A contagem de mortes inclui o que você já caçou.</small>`, opts);
  }
  function ver(n, d) {
    const s = S(), feito = s.feito[d.id], L = linhas(d), trava = d.req && !s.feito[d.req], ok = !trava && L.every(l => l.tem >= l.n);
    const prog = L.map(l => `${l.tem >= l.n ? '✅' : '▫️'} ${l.txt}: <b>${l.tem.toLocaleString('pt-BR')}</b> / ${l.n.toLocaleString('pt-BR')}`).join('<br>');
    const opts = [];
    if (!feito && ok) opts.push({ label: '🏆 Receber o prêmio', fn: () => { receber(d); return; } });
    if (!feito && !trava) for (const [t, n] of Object.entries(d.pede.m || {})) { const tem = Math.min(n, S().k[t] || 0); if (tem < n) opts.push({ label: `🎯 Caçar ${nomeMob(t)} (${tem}/${n})`, fn: () => { cacar(t, d); } }); }
    // item para entregar: vai caçar o monstro que dropa (o de nível mais perto do seu, com mais chance)
    if (!feito && !trava) for (const [id, q] of Object.entries(d.pede.i || {})) { const tem = Math.min(q, P.inv[id] || 0); if (tem >= q) continue;
      const dropa = boss => Object.entries(MOBDEF).filter(([t, D]) => !!D.boss === boss && !t.startsWith('alfa_') && SPAWNS.some(q => q.type === t) && (D.drops || []).some(([i]) => i === id))
        .sort((a, b) => Math.abs(a[1].lv - P.lv) - Math.abs(b[1].lv - P.lv))[0];
      const quem = dropa(false) || dropa(true);          // monstro comum; se só chefe dropa, vai até o chefe
      if (quem) opts.push({ label: `🎯 Caçar ${nomeMob(quem[0])} (dropa ${ITEMS[id] ? ITEMS[id].name : id}: ${tem}/${q})`, fn: () => { cacar(quem[0], d); } });
      else if (ITEMS[id]) opts.push({ label: `ℹ️ ${ITEMS[id].name}: vem de chefe, pesca ou forja (${tem}/${q})`, fn: () => { ver(n, d); return true; } }); }
    opts.push({ label: '← Voltar', fn: () => { talk(n); return true; } });
    dialog(`🏆 ${d.t}`, `${trava ? '🔒 <b>Termine a etapa anterior primeiro.</b><br><br>' : ''}${prog}<br><br>🎁 Prêmio (só existe aqui):<br>${premioTxt(d)}${feito ? '<br><br>✅ <b>Você já concluiu este desafio.</b>' : ''}`, opts);
  }
  function receber(d) {
    const s = S(); if (s.feito[d.id] || !pronto(d) || (d.req && !s.feito[d.req])) return;
    for (const [id, n] of Object.entries(d.pede.i || {})) P.inv[id] -= n;
    for (const id of d.da.e || []) P.inv[id] = (P.inv[id] || 0) + 1;
    if (d.da.cr) P.zeny += d.da.cr; for (const [id, n] of Object.entries(d.da.it || {})) P.inv[id] = (P.inv[id] || 0) + n;
    for (const [c, k] of d.da.v || []) if (typeof Cos !== 'undefined') Cos.ganhar(c, k);
    s.feito[d.id] = Date.now(); if (P.dsfFoco && P.dsfFoco.id === d.id) P.dsfFoco = null;
    banner('🏆 DESAFIO CONCLUÍDO 🏆'); Audio8.sfx('level');
    burst(new THREE.Vector3(P.x, P.y + 1.2, P.z), 0xffcf40, 60, 6, 1.2);
    log(`🏆 Desafio <b>${d.t}</b> concluído! Você ganhou:<br>${premioTxt(d)}<br><small>Visuais: 🛍️ Loja de Visuais. Equipamento: 🎒 mochila.</small>`, 'gold');
    save();
  }
  // ---------------- a etapa que você está caçando aparece no quadro de Missões, com quanto falta
  function painel() {
    const F = P.dsfFoco; if (!F) return ''; const d = TODOS.find(q => q.id === F.id); if (!d || S().feito[d.id]) return '';
    const L = linhas(d), ok = L.every(l => l.tem >= l.n);
    return `<div class="qi focus" data-dsf="${d.id}"><b style="color:#ffcf40">🎯 ${d.t}</b> <small>(${d.mestre})</small><br>` + (ok ? '🏆 <b>Pronto!</b> Toque para receber o prêmio' :
      L.map(l => l.tem >= l.n ? `✅ <s>${l.txt.replace(/^\S+ /, '')}</s>` : `${l.txt.replace(/^\S+ /, '')} <b>${l.tem}/${l.n}</b> <small>· faltam ${(l.n - l.tem).toLocaleString('pt-BR')}</small>`).join('<br>')) + `</div>`;
  }
  function abrirFoco() { const F = P.dsfFoco; if (!F) return; const d = TODOS.find(q => q.id === F.id); if (!d) return; const id = Object.keys(MESTRES).find(k => MESTRES[k].lista.some(q => q.id === d.id)); const a = AMIGOS.find(x => x[0] === id); Audio8.sfx('click'); ver({ dsf: id, remoto: true, npcNome: a ? a[1] : MESTRES[id].nome }, d); }
  // ---------------- 🤝 Amigos: as grandes aventuras dos amigos (cada um dá uma peça da Irmandade Eterna)
  // amigo novo: é só pôr aqui [saga, nome do NPC, ícone, onde fica]
  const AMIGOS = [['nosferatur', 'Nosferatur', '🦇', 'Praia de Cômodo'], ['rivas', 'Rivas', '🐪', 'Oásis de Kharum'], ['skye', 'Skye', '🗡️', 'Acampamento de Valdora'], ['temmer', 'Michel Temmer', '⚔️', 'Clareira de Lira'], ['sacer', 'Will Sacer', '✝️', 'Vigília do Vale'], ['urakin', 'Urakin Star', '⭐', 'Refúgio Suspenso'], ['ludivicki', 'Ludivicki', '🧤', 'Vila de Solmira'], ['imperium', 'Imperio', '👑', 'Cidadela do Cisma']];
  function sagaInfo(id) {
    const M = MESTRES[id], s = S(), L = M.lista, feitos = L.filter(d => s.feito[d.id]).length, prox = L.find(d => !s.feito[d.id]);
    const ok = prox && !(prox.req && !s.feito[prox.req]) && pronto(prox);
    return { M, feitos, total: L.length, prox, ok, fim: !prox };
  }
  // ir caçar um monstro do desafio: vai até o lugar mais perto onde ele aparece (atravessando os mapas)
  function cacar(t, d) {
    let best = null, bd = 1e9;
    for (const m of mobs) if (m.type === t && !m.dead) { const dd = Math.hypot(m.x - P.x, m.z - P.z); if (dd < bd) { bd = dd; best = { x: m.x, z: m.z }; } }
    if (!best) { const sp = SPAWNS.find(q => q.type === t); if (sp) best = sp.at ? { x: sp.at.x, z: sp.at.z } : { x: (sp.area[0] + sp.area[1]) / 2, z: (sp.area[2] + sp.area[3]) / 2 }; }
    if (!best) { log(`Não sei onde aparece <b>${nomeMob(t)}</b> agora.`, 'bad'); return; }
    P.dsfFoco = { t, id: d.id }; closeDialog(); log(`🎯 Seguindo <b>${d.t}</b>: o quadro de Missões mostra quanto falta de cada monstro.`, 'sys');
    irAte({ x: best.x, z: best.z, name: `caçar ${nomeMob(t)}` });
  }
  function irAte(npc) { P.qGo = { x: npc.x, z: npc.z, name: npc.name }; if (typeof BigMap !== 'undefined' && BigMap.rota && typeof mapaDe === 'function') { const aqui = mapaDe(P.x, P.z), la = mapaDe(npc.x, npc.z); if (aqui !== la && !inTower(P.z)) { const w = BigMap.rota(aqui, la); P.qGo = { x: w.x, z: w.z, name: w.name, reg: la, regN: npc.name, fim: { x: npc.x, z: npc.z } }; } } log(`🧭 Indo até <b>${npc.name}</b>. Mexa o joystick para parar.`, 'sys'); if (typeof autoStart === 'function') autoStart(); }
  function amigos() {
    const s = S(); s.vistos = s.vistos || {};
    for (const [id] of AMIGOS) s.vistos[id] = 1;
    const opts = AMIGOS.map(([id, nome, ic, onde]) => { const I = sagaInfo(id);
      const st = I.fim ? '✅ completa!' : I.ok ? '🏆 etapa pronta para receber!' : I.feitos ? `etapa ${I.feitos + 1} de ${I.total}` : '🆕 ainda não começou';
      return { label: `${ic} ${nome} · ${onde} — ${st}`, fn: () => { talk({ dsf: id, remoto: true, npcNome: nome }, 'saga'); return true; } }; });
    // peças do conjunto
    const pecas = Object.entries(ITEMS).filter(([, it]) => it.set === 'amigos'), tem = pecas.filter(([id]) => (P.inv[id] || 0) > 0 || Object.values(P.equip || {}).includes(id));
    opts.push({ label: 'Fechar' });
    dialog('🤝 Amigos do Reino', `As grandes aventuras dos amigos. Cada uma termina com uma peça do <b>Conjunto da Irmandade Eterna</b> (${tem.length}/8 peças com você; quanto mais peças, mais bônus).<br><small>Toque num amigo para ver cada etapa, receber o prêmio de qualquer lugar ou ir até ele.</small>`, opts);
  }
  // número do botão 🤝: etapas prontas; "!" se tem aventura que você ainda não viu
  function amigosAviso() { const s = S(); const prontas = AMIGOS.filter(([id]) => sagaInfo(id).ok).length; if (prontas) return String(prontas); return AMIGOS.some(([id]) => !(s.vistos || {})[id] && !sagaInfo(id).feitos) ? '!' : ''; }
  // marca acima da cabeça: ★ dourada quando algum desafio está pronto
  function mark(n) { const M = MESTRES[n.dsf]; if (!M) return ''; const s = S(); return [...M.lista, ...(M.saga ? MESTRES[M.saga].lista : [])].some(d => !s.feito[d.id] && !(d.req && !s.feito[d.req]) && pronto(d)) ? '★:#ffcf40' : '★:#7a7a88'; }
  // quem já tinha concluído um desafio recebe os visuais que mudaram (sem colocar em uso)
  function repor() { const s = S(); if (typeof Cos === 'undefined' || !Cos.dar) return; for (const d of TODOS) if (s.feito[d.id]) for (const [c, k] of d.da.v || []) if (!Cos.tem(c, k)) Cos.dar(c, k); }
  // dano no Kravenox: só conta para a última etapa do Nosferatur, depois que ela abre
  function danoKvx(v) { const s = S(); s.kvx = s.kvx || {}; for (const d of TODOS) if (d.pede.p && d.pede.p.kvx && !s.feito[d.id] && (!d.req || s.feito[d.req])) s.kvx[d.id] = (s.kvx[d.id] || ((d.id === 'n7' && s.kvxN) || 0)) + v; }
  return { painel, abrirFoco, talk, mark, onKill, repor, danoKvx, amigos, amigosAviso, AMIGOS, MESTRES, S };
})();
