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
    elmo_rivas: ['Elmo das Mil Areias de Rivas', '🪖', 'capacete', { def: 40, hp: 550, pow: 30, crit: 0.06 }, 4, 'amigos'],
  };
  for (const [id, [name, ic, slot, mods, rar, set]] of Object.entries(EQUIP))
    ITEMS[id] = { name, ic, kind: 'equip', slot, mods, rar: rar || 3, set, price: 0, sell: rar === 4 ? 20000 : 5000, desafio: true };
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
    opts.push({ label: '← Voltar', fn: () => { talk(n); return true; } });
    dialog(`🏆 ${d.t}`, `${trava ? '🔒 <b>Termine a etapa anterior primeiro.</b><br><br>' : ''}${prog}<br><br>🎁 Prêmio (só existe aqui):<br>${premioTxt(d)}${feito ? '<br><br>✅ <b>Você já concluiu este desafio.</b>' : ''}`, opts);
  }
  function receber(d) {
    const s = S(); if (s.feito[d.id] || !pronto(d) || (d.req && !s.feito[d.req])) return;
    for (const [id, n] of Object.entries(d.pede.i || {})) P.inv[id] -= n;
    for (const id of d.da.e || []) P.inv[id] = (P.inv[id] || 0) + 1;
    if (d.da.cr) P.zeny += d.da.cr; for (const [id, n] of Object.entries(d.da.it || {})) P.inv[id] = (P.inv[id] || 0) + n;
    for (const [c, k] of d.da.v || []) if (typeof Cos !== 'undefined') Cos.ganhar(c, k);
    s.feito[d.id] = Date.now();
    banner('🏆 DESAFIO CONCLUÍDO 🏆'); Audio8.sfx('level');
    burst(new THREE.Vector3(P.x, P.y + 1.2, P.z), 0xffcf40, 60, 6, 1.2);
    log(`🏆 Desafio <b>${d.t}</b> concluído! Você ganhou:<br>${premioTxt(d)}<br><small>Visuais: 🛍️ Loja de Visuais. Equipamento: 🎒 mochila.</small>`, 'gold');
    save();
  }
  // ---------------- 🤝 Amigos: as grandes aventuras dos amigos (cada um dá uma peça da Irmandade Eterna)
  // amigo novo: é só pôr aqui [saga, nome do NPC, ícone, onde fica]
  const AMIGOS = [['nosferatur', 'Nosferatur', '🦇', 'Praia de Cômodo'], ['rivas', 'Rivas', '🐪', 'Oásis de Kharum'], ['skye', 'Skye', '🗡️', 'Acampamento de Valdora'], ['temmer', 'Michel Temmer', '⚔️', 'Clareira de Lira'], ['sacer', 'Will Sacer', '✝️', 'Vigília do Vale'], ['urakin', 'Urakin Star', '⭐', 'Refúgio Suspenso']];
  function sagaInfo(id) {
    const M = MESTRES[id], s = S(), L = M.lista, feitos = L.filter(d => s.feito[d.id]).length, prox = L.find(d => !s.feito[d.id]);
    const ok = prox && !(prox.req && !s.feito[prox.req]) && pronto(prox);
    return { M, feitos, total: L.length, prox, ok, fim: !prox };
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
  return { talk, mark, onKill, repor, danoKvx, amigos, amigosAviso, AMIGOS, MESTRES, S };
})();
