// =====================================================================
//  Missões: 🟡 principal (história), 🔵 secundárias (moradores),
//  🟢 caça (quadros de caça, repetíveis) e 🟣 ocultas (escondidas pelo mapa).
// =====================================================================
'use strict';
const Quests = (() => {
  const TYPE = {
    principal: { n: 'Principal', c: '#ffcf40', dot: '🟡' },
    secundaria: { n: 'Secundária', c: '#6ab0ff', dot: '🔵' },
    caca: { n: 'Caça', c: '#7dff9a', dot: '🟢' },
    oculta: { n: 'Oculta', c: '#c27aff', dot: '🟣' },
  };
  // passos: { kill: tipo, n } · { item: id, n } (entregue no fim) · { reach: [x, z, raio] }
  // giver/to = nome do NPC (to = onde entrega; padrão = giver). req = missão anterior. lv = nível mínimo.
  const Q = [
    // ---------------- principal: A Essência que vaza
    { id: 'p1', type: 'principal', giver: 'Mestra Odete', title: 'Primeira lição', txt: 'A Essência vaza pelas rachaduras e as larvas se multiplicam nos campos.', steps: [{ kill: 'pompom', n: 5 }], rw: { xp: 60, zeny: 80, items: { red: 3 } } },
    { id: 'p2', type: 'principal', giver: 'Mestra Odete', req: 'p1', title: 'Ecos nos campos', txt: 'Os Ecos Famintos atacam quem passa pela estrada.', steps: [{ kill: 'zunzum', n: 5 }], rw: { xp: 120, zeny: 120, items: { red: 4 } } },
    { id: 'p3', type: 'principal', giver: 'Mestra Odete', req: 'p2', title: 'Raízes que rastejam', txt: 'Raízes vivas brotam perto do trigo.', steps: [{ kill: 'fungolino', n: 5 }], rw: { xp: 220, zeny: 160, items: { blue: 2 } } },
    { id: 'p4', type: 'principal', giver: 'Mestra Odete', to: 'Guarda Tobias', req: 'p3', title: 'Carta ao Guarda', txt: 'Leve a carta da Mestra ao Guarda Tobias, na saída leste da vila.', steps: [], rw: { xp: 150, zeny: 60 } },
    { id: 'p5', type: 'principal', giver: 'Guarda Tobias', req: 'p4', title: 'Rumo às Areias', txt: 'Larvas Cristalinas surgiram nas Areias Rubras, a leste do rio.', steps: [{ kill: 'besouro', n: 6 }], rw: { xp: 500, zeny: 300, items: { red: 5, manto: 1 } } },
    { id: 'p6', type: 'principal', giver: 'Guarda Tobias', to: 'Anciã Zahra', req: 'p5', title: 'O Oásis de Kharum', txt: 'A Anciã Zahra, no Oásis de Kharum, sabe de onde vêm as sombras.', steps: [], rw: { xp: 300, zeny: 100 } },
    { id: 'p7', type: 'principal', giver: 'Anciã Zahra', req: 'p6', title: 'Sombras errantes', txt: 'Sombras andam pelas dunas à noite e de dia.', steps: [{ kill: 'serpe', n: 5 }], rw: { xp: 900, zeny: 400, items: { blue: 3 } } },
    { id: 'p8', type: 'principal', giver: 'Anciã Zahra', req: 'p7', title: 'A Sentinela sem Rosto', txt: 'Nas ruínas ao sudeste vaga uma armadura vazia tomada pelo Vazio.', steps: [{ kill: 'guardiao', n: 1 }], rw: { xp: 2500, zeny: 1500, items: { blue: 5, cota: 1 } } },
    { id: 'p9', type: 'principal', giver: 'Anciã Zahra', to: 'Vigia Morvan', req: 'p8', title: 'A Cidadela do Cisma', txt: 'Vá até a Cidadela do Cisma, no extremo leste, e fale com o Vigia Morvan.', steps: [], rw: { xp: 800, zeny: 300 } },
    { id: 'p10', type: 'principal', giver: 'Vigia Morvan', req: 'p9', title: 'A Torre do Cisma', txt: 'Trinta andares tomados pela Essência. Comece limpando as Sentinelas.', steps: [{ kill: 'sentinela', n: 10 }], rw: { xp: 4000, zeny: 2000, items: { anel_vazio: 1 } } },
    { id: 'p11', type: 'principal', giver: 'Vigia Morvan', req: 'p10', title: 'O Soberano dorme', txt: 'Chegue ao topo da Torre e veja com os próprios olhos quem dorme lá.', steps: [{ reach: 'topo' }], rw: { xp: 8000, zeny: 4000, items: { elmo_sentinela: 1 } } },
    // ---------------- principal: Valdora (livro I, caps. 14–15)
    { id: 'v1', type: 'principal', giver: 'Vigia Morvan', to: 'Arlen, o Refugiado', req: 'p9', lv: 24, title: 'A Passagem do Norte', txt: 'Refugiados chegam pela Passagem do Norte, no alto das Areias Rubras. Atravesse e fale com eles.', steps: [], rw: { xp: 3000, zeny: 800 } },
    { id: 'v2', type: 'principal', giver: 'Arlen, o Refugiado', req: 'v1', title: 'Raízes na estrada', txt: 'A estrada até Valdora está tomada pelas Raízes Negras. Abra caminho.', steps: [{ kill: 'raizNegra', n: 8 }], rw: { xp: 6000, zeny: 1500, items: { red: 10 } } },
    { id: 'v3', type: 'principal', giver: 'Arlen, o Refugiado', req: 'v2', title: 'Ecos das cinzas', txt: 'Vozes sem corpo vagam entre as casas queimadas. Cale-as.', steps: [{ kill: 'ecoCinza', n: 8 }], rw: { xp: 7500, zeny: 1800, items: { blue: 5 } } },
    { id: 'v4', type: 'principal', giver: 'Arlen, o Refugiado', req: 'v3', title: 'Do alto da colina', txt: 'Suba a colina e veja o que restou de Valdora.', steps: [{ reach: [VHILL.x, VHILL.z, 7], label: 'Suba a Colina de Valdora' }], rw: { xp: 4000, zeny: 1000 }, lore: 'Do alto da colina, Valdora aparece, irreconhecível. As muralhas estão destruídas, as torres queimam, criaturas percorrem as ruas. No centro, um símbolo gigantesco desenhado com sangue: <b>três espinhos</b>.' },
    { id: 'v5', type: 'principal', giver: 'Arlen, o Refugiado', req: 'v4', title: 'Os portões abertos', txt: 'Os portões de Valdora estão abertos. Nenhum guarda, só fumaça e Sentinelas.', steps: [{ kill: 'sentinelaMuralha', n: 10 }], rw: { xp: 12000, zeny: 3000, items: { couraca_valdora: 1 } } },
    { id: 'v6', type: 'principal', giver: 'Arlen, o Refugiado', req: 'v5', title: 'A estátua da praça', txt: 'Na praça há uma estátua de um homem com uma espada. O Carrasco de Valdora a guarda.', steps: [{ kill: 'carrasco', n: 1 }], rw: { xp: 30000, zeny: 8000, items: { arma_valdora: 1, essencia: 2 } }, lore: 'A estátua não estava aqui antes do Cisma. Alguém a pôs há pouco tempo. A espada de pedra tem uma rachadura fina, como se esperasse a mão certa.' },
    // Floresta Morta e Templo da Primeira Raiz (livro I, caps. 4 e 5)
    { id: 'f1', type: 'principal', giver: 'Arlen, o Refugiado', to: 'Lira', req: 'v6', lv: 40, title: 'A floresta que prende a respiração', txt: 'A leste de Valdora começa a Floresta Morta. Arlen jura que de lá ninguém volta, mas à noite uma voz pequena chama o seu nome entre as árvores. Atravesse a passagem do leste e siga a trilha.', steps: [], rw: { xp: 20000, zeny: 3000 } },
    { id: 'f2', type: 'principal', giver: 'Lira', req: 'f1', title: 'Larvas maiores que as do Abismo', txt: '"Eles chegaram." Larvas de membros alongados cercam a clareira. Não querem matar ninguém: querem cercar.', steps: [{ kill: 'larvaPernalta', n: 10 }], rw: { xp: 40000, zeny: 5000, items: { seiva_branca: 5 } } },
    { id: 'f3', type: 'principal', giver: 'Lira', req: 'f2', title: 'Raízes como ossos', txt: 'Uma raiz se mexe e volta ao lugar. Outra se mexe atrás de você. Nesta floresta, algumas coisas continuam se mexendo depois de morrer.', steps: [{ kill: 'raizOssuda', n: 10 }], rw: { xp: 48000, zeny: 6000, items: { blue: 8 } } },
    { id: 'f4', type: 'principal', giver: 'Lira', req: 'f3', title: 'Cristais na carne', txt: 'Algumas larvas carregam cristais crescendo dentro do corpo. Lira diz que é a Essência corrompida tentando florescer.', steps: [{ kill: 'larvaCristal', n: 12 }], rw: { xp: 56000, zeny: 7000, items: { red: 20 } } },
    { id: 'f5', type: 'principal', giver: 'Lira', req: 'f4', title: 'Os pilares da Ordem', txt: 'No meio da floresta há pilares brancos quebrados, com runas da antiga Ordem da Essência. Vá até lá. Com cuidado.', steps: [{ reach: [FGUARD.x, FGUARD.z + 10, 8], label: 'Chegue aos pilares da Ordem' }], rw: { xp: 30000, zeny: 4000 }, lore: 'Entre os galhos há uma figura alta, numa armadura branca rachada, com uma lança na mão e o rosto oculto por uma máscara. As runas são da Ordem da Essência. — O Guardião Branco — sussurra Lira. — Guardião daquilo que está enterrado sob a Fonte.' },
    { id: 'f6', type: 'principal', giver: 'Lira', req: 'f5', title: 'O Guardião Branco', txt: 'A lança dele brilha com uma força diferente: não é Vazio nem Essência. É algo anterior aos dois.', steps: [{ kill: 'guardiaoBranco', n: 1 }], rw: { xp: 120000, zeny: 15000, items: { lanca_ordem: 1, runa_ordem: 1 } }, lore: 'Quando a poeira baixa, não há corpo. Apenas a lança, cravada no chão. Antes de sumir, uma palavra surge na lâmina: PRIMEIRA RAIZ. — Meu nome era Lira — diz a pequena criatura, com um cristal negro pulsando sob a pele do peito. — Eu morri há muito tempo. Alguém precisa lembrar.' },
    { id: 'f7', type: 'principal', giver: 'Lira', req: 'f6', title: 'A parede dos dois espinhos', txt: 'Ao norte, numa encosta, não há templo nem porta. Só uma parede de pedra com dois espinhos, um claro e um escuro.', steps: [{ reach: [FWALL.x, FWALL.z + 4, 5], label: 'Chegue à parede do Templo' }], rw: { xp: 40000, zeny: 5000 }, lore: '"Somente os que carregam a ruptura podem entrar." A marca dos espinhos brilha em dourado, depois em vermelho, por fim em preto. A montanha treme, e a parede se abre num túnel que desce por raízes petrificadas.' },
    { id: 'f8', type: 'principal', giver: 'Lira', req: 'f7', title: 'Testemunhas', txt: 'Nos cristais do túnel há vozes: sacerdotes, guerreiros, crianças, reis. Todos mortos, todos presos nas paredes. Algumas memórias ganharam corpo. Cale-as e chegue à sala redonda.', steps: [{ kill: 'memoria', n: 10 }, { reach: [FHALL.x, FHALL.z + 5, 5], label: 'Chegue à estátua da sala redonda' }], rw: { xp: 160000, zeny: 20000, items: { manto_floresta: 1, fragmento_dourado: 1 } }, lore: 'No centro da sala, uma estátua dos dois irmãos. Mas os rostos são iguais: não como irmãos, e sim como duas versões da mesma criatura. Na base, a inscrição: ANTES DE HAVER DOIS, HOUVE UM.' },
    // Vale dos Mortos e Ponte dos Mortos (livro I, cap. 8)
    { id: 'g1', type: 'principal', giver: 'Lira', to: 'Coveira Maren', req: 'f8', lv: 55, title: 'Os sinos do vazio', txt: 'Os sinos estão tocando por todo o Reino. Sete sinos: seis já tocaram, e o sétimo só toca quando a Fonte começa a morrer. O caminho passa pelo Vale dos Mortos, a leste da floresta, e ninguém atravessa o vale.', steps: [], rw: { xp: 60000, zeny: 8000 } },
    { id: 'g2', type: 'principal', giver: 'Coveira Maren', req: 'g1', title: 'Mãos que saem da terra', txt: 'A névoa sobe até a cintura. Algo toca a sua perna: uma mão pálida saindo da terra. E outra. E outra.', steps: [{ kill: 'maoPalida', n: 12 }], rw: { xp: 110000, zeny: 12000, items: { flor_tumulo: 8 } } },
    { id: 'g3', type: 'principal', giver: 'Coveira Maren', req: 'g2', title: 'Não responda às vozes', txt: 'Um sussurro atravessa a névoa e chama o seu nome. Não responda. Cale os Sussurros.', steps: [{ kill: 'sussurro', n: 12 }], rw: { xp: 125000, zeny: 13000, items: { blue: 12 } } },
    { id: 'g4', type: 'principal', giver: 'Coveira Maren', req: 'g3', title: 'A mulher sem olhos', txt: 'O vale se alimenta de lembranças. Ele usa a voz de quem você ama: uma mulher de vestido branco, cabelos longos, o rosto escondido.', steps: [{ kill: 'damaSemOlhos', n: 10 }], rw: { xp: 150000, zeny: 15000, items: { red: 30 } }, lore: 'A mulher ergueu o rosto. Não havia olhos. A boca se abriu. — Você prometeu voltar. — NÃO ESCUTE! A forma desapareceu, mas o rosto ficou na memória. — O vale se alimenta de lembranças.' },
    { id: 'g5', type: 'principal', giver: 'Coveira Maren', req: 'g4', title: 'As mãos apontam para o norte', txt: 'Dezenas de mãos brotaram do solo e, uma a uma, apontaram para a mesma direção: o norte. Siga até a beira do abismo.', steps: [{ reach: [900, -832, 6], label: 'Chegue à Ponte dos Mortos' }], rw: { xp: 80000, zeny: 9000 }, lore: 'Entre a névoa havia uma ponte, feita não de pedra, mas de ossos. — A Ponte dos Mortos. Se atravessarmos, não poderemos voltar. A cada passo, vozes surgem sob os pés: algumas gritam, outras choram, outras riem.' },
    { id: 'g6', type: 'principal', giver: 'Coveira Maren', req: 'g5', title: 'Centenas de sombras', txt: 'Na ponte, os ossos se levantam. Embaixo, na névoa do abismo, centenas de sombras esperam.', steps: [{ kill: 'guardaOssos', n: 10 }, { kill: 'sombraVale', n: 10 }], rw: { xp: 190000, zeny: 20000, items: { capuz_vale: 1 } } },
    { id: 'g7', type: 'principal', giver: 'Coveira Maren', req: 'g6', title: 'O Primeiro Guardião', txt: 'No fim da ponte, sobre a névoa: armadura branca, cajado, olhos dourados. — Kravenox. Eu sabia que você viria.', steps: [{ kill: 'primeiroGuardiao', n: 1 }], rw: { xp: 420000, zeny: 50000, items: { cajado_guardiao: 1, cristal_memoria: 1 } }, lore: '— Você é aquele que estava preso sob a Fonte? — Não. Eu sou aquele que colocou vocês dois lá. Eu não quero destruir o Reino. Quero libertá-lo. A ponte começou a desmoronar, e os dois irmãos caíram juntos no abismo.' },
    { id: 'h1', type: 'principal', giver: 'Coveira Maren', to: 'Náufraga Ilene', req: 'g7', lv: 70, title: 'A queda', txt: 'A ponte caiu, e os irmãos caíram com ela. No fim da Ponte dos Mortos ficou um redemoinho no chão. Pule. Lá embaixo alguém espera por quem cai.', steps: [], rw: { xp: 200000, zeny: 20000 } },
    { id: 'h2', type: 'principal', giver: 'Náufraga Ilene', req: 'h1', title: 'Raízes que pendem do nada', txt: 'As raízes que seguram as ilhas também caçam. Corte as Raízes Suspensas que rondam o Refúgio.', steps: [{ kill: 'raizSuspensa', n: 14 }], rw: { xp: 260000, zeny: 24000, items: { luz_suspensa: 10 } } },
    { id: 'h3', type: 'principal', giver: 'Náufraga Ilene', req: 'h2', title: 'Cristais que andam', txt: 'Os cristais da cidade estão acordando. Quebre os Cristais Vivos e traga os estilhaços.', steps: [{ kill: 'cristalVivo', n: 12 }, { item: 'estilhaco_vivo', n: 6 }], rw: { xp: 300000, zeny: 28000, items: { blue: 15 } } },
    { id: 'h4', type: 'principal', giver: 'Náufraga Ilene', req: 'h3', title: 'O Jardim de Cristais', txt: 'Siga pelas pontes até o Jardim de Cristais, onde os cristais são maiores que torres.', steps: [{ reach: [CILHAS[3].x, CILHAS[3].z, 9], label: 'Chegue ao Jardim de Cristais' }], rw: { xp: 150000, zeny: 15000 }, lore: 'Os ecos repetem vozes que você nunca ouviu. Uma delas é de menina. Ela não chama Kravenox. Chama <b>irmão</b>.' },
    { id: 'h5', type: 'principal', giver: 'Náufraga Ilene', req: 'h4', title: 'Vozes que não são suas', txt: 'Os Ecos da Cidade e as Sentinelas Submersas guardam o caminho até o fundo.', steps: [{ kill: 'ecoCidade', n: 12 }, { kill: 'sentinelaSubmersa', n: 10 }], rw: { xp: 380000, zeny: 34000, items: { red: 40 } } },
    { id: 'h6', type: 'principal', giver: 'Náufraga Ilene', req: 'h5', title: 'Onde não há ponte', txt: 'Entre as Torres Rachadas e O Fundo não existe ponte. Não havia chão, mas a cada passo os pés encontravam uma superfície invisível. Atravesse.', steps: [{ kill: 'larvaAbismo', n: 10 }, { reach: [CILHAS[4].x, CILHAS[4].z, 8], label: 'Chegue a O Fundo' }], rw: { xp: 400000, zeny: 36000 } },
    { id: 'h7', type: 'principal', giver: 'Náufraga Ilene', req: 'h6', title: 'A Sombra da Fonte', txt: 'No fundo há uma figura coberta de raízes negras. Ela segura um cristal partido ao meio. As raízes não deixam ninguém chegar perto.', steps: [{ kill: 'sombraFonte', n: 1 }], rw: { xp: 900000, zeny: 90000, items: { raiz_fonte: 1, cristal_tres: 1 } }, lore: 'As raízes se soltam. Por baixo há uma garota, de cabelos longos e olhos dourados. — Lira... — Esse foi o nome que me deram depois. Meu nome é <b>Lyra</b>. Eu sou a irmã que vocês esqueceram. O cristal na mão dela já uniu três irmãos.' },
    // Rio das Memórias (livro I, cap. 11): a história segue o livro; Ondina e os detalhes do acampamento foram criados para o jogo
    { id: 'r1', type: 'principal', giver: 'Náufraga Ilene', to: 'Guardiã Ondina', req: 'h7', lv: 86, title: 'O Sétimo Sino', txt: 'Um sino toca e a Cidade Submersa começa a desaparecer. Em O Fundo, na beira norte, a água se abre num redemoinho. Pule: <i>"dessa vez não havia abismo, mas água."</i> Lá embaixo, alguém acampa na margem.', steps: [], rw: { xp: 500000, zeny: 40000 } },
    { id: 'r2', type: 'principal', giver: 'Guardiã Ondina', req: 'r1', title: 'Rostos sob a água', txt: '<i>"A água brilhava. Sob a superfície havia milhares de pequenas luzes."</i> Algumas memórias se afogaram e voltaram com raiva. Acalme as Memórias Afogadas.', steps: [{ kill: 'memoriaAfogada', n: 14 }], rw: { xp: 560000, zeny: 44000, items: { blue_m: 15 } } },
    { id: 'r3', type: 'principal', giver: 'Guardiã Ondina', req: 'r2', title: 'Luzes que se perdem', txt: 'Lumes Errantes saem do rio e esquecem para onde iam. Traga de volta os lumes que eles carregam.', steps: [{ kill: 'lumeErrante', n: 12 }, { item: 'lume_memoria', n: 6 }], rw: { xp: 620000, zeny: 48000, items: { red_m: 20 } } },
    { id: 'r4', type: 'principal', giver: 'Guardiã Ondina', req: 'r3', title: 'Raízes negras saltaram do solo', txt: '<i>"Raízes negras saltaram do solo, cristais explodiram."</i> As raízes chegaram até o rio. Abra caminho até as Galerias Afogadas.', steps: [{ kill: 'raizRio', n: 12 }, { reach: [MILHAS[3].x, MILHAS[3].z, 10], label: 'Chegue às Galerias Afogadas' }], rw: { xp: 680000, zeny: 52000 }, lore: 'Na água, um rosto passa devagar. É uma batalha antiga, de quando o Reino ainda era inteiro. <i>"Milhares de anos de história guardados ali."</i>' },
    { id: 'r5', type: 'principal', giver: 'Guardiã Ondina', req: 'r4', title: 'Batalhas lembradas', txt: 'Os soldados das batalhas que o rio guarda levantaram da água. Mais adiante, guardas de armadura escura cuidam de uma porta enorme.', steps: [{ kill: 'soldadoMemoria', n: 12 }, { kill: 'guardaEspinhos', n: 8 }, { reach: [MILHAS[4].x, MILHAS[4].z, 9], label: 'Chegue à Porta dos Três Espinhos' }], rw: { xp: 760000, zeny: 58000, items: { red_g: 10 } }, lore: '<i>"Uma porta enorme, diferente de todas as outras. Não tinha fechadura, apenas uma marca no centro: três espinhos."</i>' },
    { id: 'r6', type: 'principal', giver: 'Guardiã Ondina', req: 'r5', title: 'O Guardião Branco', txt: 'Diante da porta está ele: o Guardião Branco. <i>"Você continua acreditando que pode impedir isso."</i> Derrote-o.', steps: [{ kill: 'guardiaoBrancoRio', n: 1 }], rw: { xp: 1600000, zeny: 140000, items: { espinho_porta: 5 } }, lore: 'O Guardião cai de joelhos, mas sorri de canto. <i>"Quando a Fonte escolher, você terá que escolher também. Entre seu irmão e sua irmã."</i> Atrás dele, a porta continua fechada. Só três mãos juntas abrem a marca dos três espinhos. Pela fresta, uma luz branca, e uma voz que não vem de lugar nenhum: <i>"Filhos. Vocês voltaram."</i>' },
    // ---------------- secundárias
    { id: 's1', type: 'secundaria', giver: 'Irmã Celina', title: 'Ervas para os feridos', txt: 'Preciso de Raízes Secas para os unguentos.', steps: [{ item: 'raiz', n: 4 }], rw: { xp: 120, zeny: 80, items: { blue: 3 } } },
    { id: 's2', type: 'secundaria', giver: 'Mercador Bento', title: 'Gosma para o sabão', txt: 'Gosma de Larva faz o melhor sabão da região.', steps: [{ item: 'gosma', n: 8 }], rw: { xp: 100, zeny: 150, items: { anel_raiz: 1 } } },
    { id: 's3', type: 'secundaria', giver: 'Guarda Tobias', req: 'p4', title: 'Vigia dos campos', txt: 'Ajude a limpar a estrada dos Ecos Famintos.', steps: [{ kill: 'zunzum', n: 12 }], rw: { xp: 300, zeny: 200, items: { botas_couro: 1 } } },
    { id: 's4', type: 'secundaria', giver: 'Fazendeira Dália', title: 'Ovos frescos', txt: 'Uma encomenda grande de ovos chegou da Cidadela.', steps: [{ item: 'ovo', n: 5 }], rw: { xp: 150, zeny: 250, items: { racao: 10 } } },
    { id: 's5', type: 'secundaria', giver: 'Mercador Farid', title: 'Cristais para o mercado', txt: 'Cristais Opacos valem ouro aqui no oásis.', steps: [{ item: 'cristal', n: 6 }], rw: { xp: 600, zeny: 400, items: { turbante: 1 } } },
    { id: 's6', type: 'secundaria', giver: 'Curandeira Samira', title: 'Fios de sombra', txt: 'Com Fio de Sombra eu costuro amuletos de proteção.', steps: [{ item: 'fio', n: 4 }], rw: { xp: 800, zeny: 300, items: { colar_sombra: 1 } } },
    { id: 's7', type: 'secundaria', giver: 'Curandeira Ilsa', title: 'Lascas da guerra', txt: 'As Lascas de Armadura guardam memórias de quem as usou.', steps: [{ item: 'lasca', n: 6 }], rw: { xp: 2500, zeny: 800, items: { manoplas_sentinela: 1 } } },
    { id: 's8', type: 'secundaria', giver: 'Mercador Dravo', title: 'Essência para estudo', txt: 'Pago muito bem por uma Essência Negra.', steps: [{ item: 'essencia', n: 1 }], rw: { xp: 3000, zeny: 2500 } },
    { id: 's9', type: 'secundaria', giver: 'Curandeira Wenna', title: 'Cinzas para os unguentos', txt: 'A Cinza de Valdora ainda guarda calor. Serve para cicatrizar queimaduras.', steps: [{ item: 'cinza', n: 6 }], rw: { xp: 5000, zeny: 1500, items: { blue: 6 } } },
    { id: 's10', type: 'secundaria', giver: 'Mascate Iara', title: 'Cordas de raiz', txt: 'Fibra de Raiz Negra vira a corda mais forte que existe.', steps: [{ item: 'fibra', n: 8 }], rw: { xp: 5500, zeny: 2500, items: { botas_valdora: 1 } } },
    { id: 's11', type: 'secundaria', giver: 'Eremita Odila', title: 'Seiva para os feridos', txt: 'A Membrana Alongada das larvas guarda uma seiva branca que fecha feridas.', steps: [{ item: 'membrana', n: 8 }], rw: { xp: 30000, zeny: 4000, items: { seiva_branca: 10 } } },
    { id: 's12', type: 'secundaria', giver: 'Mascate Corvo', title: 'Ossos de raiz', txt: 'Raiz-Osso vale ouro em Kharum. Ninguém pergunta de onde vem.', steps: [{ item: 'osso_raiz', n: 10 }], rw: { xp: 32000, zeny: 9000, items: { botas_raiz: 1 } } },
    // ---------------- caça (quadros de caça, repetíveis)
    { id: 'c1', type: 'caca', board: 'solmira', repeat: true, title: 'Praga de larvas', txt: 'Recompensa pela limpeza dos campos.', steps: [{ kill: 'pompom', n: 15 }], rw: { xp: 150, zeny: 120 } },
    { id: 'c2', type: 'caca', board: 'solmira', repeat: true, title: 'Raízes no trigo', txt: 'As raízes estão comendo a colheita.', steps: [{ kill: 'fungolino', n: 10 }], rw: { xp: 250, zeny: 180, items: { red: 2 } } },
    { id: 'c3', type: 'caca', board: 'kharum', repeat: true, title: 'Cristal nas dunas', txt: 'Larvas Cristalinas bloqueiam a rota das caravanas.', steps: [{ kill: 'besouro', n: 12 }], rw: { xp: 700, zeny: 400 } },
    { id: 'c4', type: 'caca', board: 'kharum', repeat: true, title: 'Caçada às sombras', txt: 'Ninguém dorme com as sombras rondando.', steps: [{ kill: 'serpe', n: 10 }], rw: { xp: 1100, zeny: 550, items: { blue: 2 } } },
    { id: 'c5', type: 'caca', board: 'cidadela', repeat: true, title: 'Larvas da Torre', txt: 'A Torre transborda de larvas.', steps: [{ kill: 'larva', n: 15 }], rw: { xp: 2000, zeny: 800 } },
    { id: 'c6', type: 'caca', board: 'cidadela', repeat: true, title: 'Sentinelas do Vazio', txt: 'Contrato da guarda da Cidadela.', steps: [{ kill: 'sentinela', n: 10 }], rw: { xp: 3500, zeny: 1400, items: { blue: 3 } } },
    { id: 'c7', type: 'caca', board: 'acampamento', repeat: true, title: 'Estrada livre', txt: 'Os refugiados precisam passar.', steps: [{ kill: 'raizNegra', n: 15 }], rw: { xp: 9000, zeny: 2200 } },
    { id: 'c8', type: 'caca', board: 'acampamento', repeat: true, title: 'Muralhas de Valdora', txt: 'Cada Sentinela a menos é uma casa a mais.', steps: [{ kill: 'sentinelaMuralha', n: 12 }], rw: { xp: 16000, zeny: 3500, items: { blue: 4 } } },
    { id: 'c9', type: 'caca', board: 'clareira', repeat: true, title: 'A trilha da clareira', txt: 'As Pernaltas cercam quem chega. Abra a trilha.', steps: [{ kill: 'larvaPernalta', n: 15 }], rw: { xp: 45000, zeny: 6000 } },
    { id: 'c10', type: 'caca', board: 'clareira', repeat: true, title: 'Armaduras antigas', txt: 'Larvas Antigas carregam pedaços da armadura da Ordem.', steps: [{ kill: 'larvaAntiga', n: 15 }], rw: { xp: 60000, zeny: 8000, items: { blue: 6 } } },
    { id: 'c11', type: 'caca', board: 'vigilia', repeat: true, title: 'Mãos na névoa', txt: 'Ninguém dorme com mãos saindo da terra.', steps: [{ kill: 'maoPalida', n: 15 }], rw: { xp: 130000, zeny: 14000 } },
    { id: 'c12', type: 'caca', board: 'vigilia', repeat: true, title: 'Ossos da ponte', txt: 'A Vigília paga por cada Guarda de Ossos que cai no abismo.', steps: [{ kill: 'guardaOssos', n: 12 }], rw: { xp: 170000, zeny: 18000, items: { blue: 8 } } },
    { id: 'c15', type: 'caca', board: 'margem', repeat: true, title: 'Rostos que não descansam', txt: 'As Memórias Afogadas sobem até a margem e assustam quem acampa.', steps: [{ kill: 'memoriaAfogada', n: 15 }], rw: { xp: 420000, zeny: 34000 } },
    { id: 'c16', type: 'caca', board: 'margem', repeat: true, title: 'Soldados de outra era', txt: 'Os Soldados de Memória marcham pelas Galerias como se a guerra não tivesse acabado.', steps: [{ kill: 'soldadoMemoria', n: 12 }], rw: { xp: 520000, zeny: 40000, items: { blue_m: 10 } } },
    { id: 'c13', type: 'caca', board: 'refugio', repeat: true, title: 'Raízes famintas', txt: 'As raízes sobem pelas bordas do Refúgio à noite.', steps: [{ kill: 'raizSuspensa', n: 15 }], rw: { xp: 240000, zeny: 22000 } },
    { id: 'c14', type: 'caca', board: 'refugio', repeat: true, title: 'Calar os ecos', txt: 'Ninguém consegue dormir com vozes que não são de ninguém.', steps: [{ kill: 'ecoCidade', n: 12 }], rw: { xp: 300000, zeny: 26000, items: { blue: 8 } } },
    // ---------------- ocultas (quem dá está escondido pelo mapa)
    { id: 'h1', type: 'oculta', giver: 'Viajante Perdido', title: 'O anel engolido', txt: '"Uma Raiz Rastejante engoliu o anel da minha mãe... por favor."', steps: [{ kill: 'fungolino', n: 8 }], rw: { xp: 600, zeny: 500, items: { anel_cristal: 1 } } },
    { id: 'h2', type: 'oculta', giver: 'Eco Sussurrante', title: 'Vozes da cratera', txt: '"Traga o pó dos meus irmãos e eu te conto um segredo."', steps: [{ item: 'po_eco', n: 5 }], rw: { xp: 900, zeny: 300, items: { colar_sombra: 1 } }, lore: 'O Eco sussurra: "Antes do Cisma, o Reino era um só. A Fonte guardava a memória de todos… e alguém quis guardá-la só para si."' },
  ];
  const byId = Object.fromEntries(Q.map(q => [q.id, q]));
  // tesouros escondidos (abrir uma vez) e NPCs ocultos
  const SECRETS = [
    { id: 'b1', kind: 'bau', name: 'Baú Esquecido', x: -62, z: -80, rw: { zeny: 600, items: { red: 4, blue: 2, gibao_couro: 1 } }, msg: 'Debaixo das folhas, um baú de madeira velha.' },
    { id: 'b2', kind: 'bau', name: 'Túmulo do Cavaleiro', x: 92, z: -78, rw: { zeny: 1500, items: { sandalias: 1, blue: 3 } }, msg: 'Uma espada cravada na areia marca o túmulo de um cavaleiro antigo.' },
    { id: 'b3', kind: 'bau', name: 'Altar Antigo', x: 214 - 12, z: -60, lv: 20, rw: { zeny: 4000, items: { anel_vazio: 1, essencia: 1 } }, msg: 'Um altar de pedra escondido atrás da Torre. A Essência pulsa aqui.' },
    { id: 'n1', kind: 'npc', name: 'Viajante Perdido', sprite: 'estranho', x: -200, z: 72 },
    { id: 'n2', kind: 'npc', name: 'Eco Sussurrante', sprite: 'origem', x: -20 + 24, z: -64 - 10 },
  ];

  const S = () => (P.qs = P.qs || { act: {}, done: {} });
  const colorOf = q => TYPE[q.type].c;
  const prog = (q, i) => { const st = q.steps[i], a = S().act[q.id] || { k: {} }; if (st.kill) return Math.min(st.n, a.k[st.kill] || 0); if (st.item) return Math.min(st.n, P.inv[st.item] || 0); if (st.reach) return a.r ? 1 : 0; return 0; };
  const need = st => st.n || 1;
  const ready = q => S().act[q.id] && q.steps.every((st, i) => prog(q, i) >= need(st));
  const stepTxt = (st, i, q) => {
    if (st.kill) return `Derrote ${st.n} ${MOBDEF[st.kill] ? MOBDEF[st.kill].name : st.kill}`;
    if (st.item) return `Traga ${st.n}× ${ITEMS[st.item] ? ITEMS[st.item].name : st.item}`;
    if (st.reach === 'topo') return 'Chegue ao topo da Torre do Cisma (30 andares)';
    if (Array.isArray(st.reach)) return st.label || 'Chegue ao local marcado';
    return '';
  };
  const available = q => !S().act[q.id] && (q.repeat || !S().done[q.id]) && (!q.req || S().done[q.req]) && (!q.lv || P.lv >= q.lv);
  const npcByName = n => NPCS.find(o => o.name === n);

  // contratos do Quadro de Caça: 2 por dia EM CADA QUADRO (pedido do Rone: antes eram 6 somando todos, e quem
  // gastava tudo em Solmira não tinha motivo para ir às outras cidades). Conta os aceitos e os já entregues hoje.
  const LIM_CACA = 2, hoje = () => new Date().toLocaleDateString('pt-BR');
  function cacas() { const s = S(); if (!s.caca || s.caca.d !== hoje() || !s.caca.b) s.caca = { d: hoje(), b: {} }; return s.caca; }
  const cacasUsadas = city => (cacas().b[city] || 0) + Object.keys(S().act).filter(id => byId[id] && byId[id].type === 'caca' && byId[id].board === city).length;
  const quadrosAbertos = () => Object.keys(BOARDS).filter(c => cacasUsadas(c) < LIM_CACA);
  function accept(q) {
    if (q.type === 'caca' && cacasUsadas(q.board) >= LIM_CACA) { const o = quadrosAbertos().map(c => CITY_N[c]); log(`📋 Você já pegou os <b>${LIM_CACA} contratos deste quadro hoje</b>.${o.length ? ` Os quadros de outras cidades ainda têm: ${o.join(', ')}.` : ' Todos os quadros abrem de novo amanhã.'}`, 'bad'); Audio8.sfx('miss'); return; }
    P.qGo = null;
    S().act[q.id] = { k: {} }; Audio8.sfx('buff');
    log(`${TYPE[q.type].dot} Missão aceita: <b style="color:${colorOf(q)}">${q.title}</b>`, 'gold'); save();
  }
  function finish(q) {
    for (const st of q.steps) if (st.item) P.inv[st.item] = Math.max(0, (P.inv[st.item] || 0) - st.n);
    if (q.type === 'caca') { const c = cacas(); c.b[q.board] = (c.b[q.board] || 0) + 1; }
    delete S().act[q.id]; S().done[q.id] = (S().done[q.id] || 0) + 1;
    const r = q.rw || {}; P.zeny += r.zeny || 0;
    const got = [];
    for (const [id, n] of Object.entries(r.items || {})) { P.inv[id] = (P.inv[id] || 0) + n; got.push(`${n}× ${ITEMS[id] ? ITEMS[id].ic + ' ' + ITEMS[id].name : id}`); }
    Audio8.sfx('coin'); buildHotbar();
    // XP de missão com teto (antes uma missão do Vale dava até 2 níveis): principal até 25% de um nível, secundária 15%, caça 10%
    const tetoXp = Math.round(xpNeed(P.lv) * (q.type === 'principal' ? 0.25 : q.type === 'caca' ? 0.10 : 0.15)), xpQ = r.xp ? Math.min(r.xp, tetoXp) : 0;
    log(`${TYPE[q.type].dot} <b style="color:${colorOf(q)}">${q.title}</b> concluída! ${xpQ ? '+' + xpQ.toLocaleString('pt-BR') + ' XP' : ''} ${r.zeny ? '+' + r.zeny + ' cr' : ''}${got.length ? ' · ' + got.join(', ') : ''}`, 'gold');
    if (xpQ) gainXp(xpQ);
    if (q.lore) setTimeout(() => dialog(q.type === 'oculta' ? '🟣 Segredo' : '📖 ' + q.title, q.lore), 300);
    // a principal seguinte já fica disponível no mesmo NPC
    const nx = Q.find(o => o.req === q.id && o.type === 'principal');
    if (nx && available(nx) && nx.giver === (q.to || q.giver)) accept(nx);
    save();
  }
  function rewardTxt(q) { const r = q.rw || {}; return [r.xp ? r.xp + ' XP' : '', r.zeny ? r.zeny + ' cr' : '', ...Object.entries(r.items || {}).map(([id, n]) => `${n}× ${ITEMS[id] ? ITEMS[id].ic + ' ' + ITEMS[id].name : id}`)].filter(Boolean).join(' · '); }
  function questCard(q) { return `<b style="color:${colorOf(q)}">${TYPE[q.type].dot} ${q.title}</b> <small>(${TYPE[q.type].n})</small><br>${q.txt}<br>${q.steps.map((st, i) => '▫️ ' + stepTxt(st, i, q)).join('<br>')}<br><small>Recompensa: ${rewardTxt(q)}</small>`; }

  // conversa: entrega e oferece missões; "Outros assuntos" volta ao diálogo normal do NPC
  function talk(n, base) {
    const toHere = Object.keys(S().act).map(id => byId[id]).filter(q => q && (q.to || q.giver) === n.name);
    const turn = toHere.filter(ready), offers = Q.filter(q => q.giver === n.name && available(q));
    const pending = toHere.filter(q => !ready(q));
    if (!turn.length && !offers.length && !(n.hidden && pending.length)) return false;
    const opts = [];
    for (const q of turn) opts.push({ label: `✅ Entregar: ${q.title}`, fn: () => { finish(q); setTimeout(() => talk(n, base) || null, 50); } });
    for (const q of offers) opts.push({ label: `${TYPE[q.type].dot} ${q.title}`, fn: () => { dialog(`💬 ${n.name}`, questCard(q), [{ label: 'Aceitar', fn: () => accept(q) }, { label: 'Agora não' }]); return true; } });
    if (base) opts.push({ label: 'Outros assuntos', fn: () => { setTimeout(base, 30); } });
    opts.push({ label: 'Tchau' });
    const intro = turn.length ? `Você voltou, <b>${P.name}</b>!` : `Olá, <b>${P.name}</b>. Tenho um pedido.`;
    dialog(`💬 ${n.name}`, intro + (pending.length ? `<br><small>Em andamento: ${pending.map(q => q.title).join(', ')}</small>` : ''), opts);
    return true;
  }
  function boardTalk(city) {
    const qs = Q.filter(q => q.board === city), opts = [];
    for (const q of qs) {
      if (S().act[q.id] && ready(q)) opts.push({ label: `✅ Receber: ${q.title}`, fn: () => { finish(q); setTimeout(() => boardTalk(city), 50); } });
      else if (S().act[q.id]) opts.push({ label: `⏳ ${q.title} (${prog(q, 0)}/${q.steps[0].n})`, fn: () => true });
      else if (cacasUsadas(city) >= LIM_CACA) opts.push({ label: `🔒 ${q.title} — amanhã (ou em outro quadro)`, fn: () => true });
      else opts.push({ label: `🟢 ${q.title} — ${rewardTxt(q)}`, fn: () => { accept(q); setTimeout(() => boardTalk(city), 50); } });
    }
    P.warps = P.warps || {}; P.warps[city] = 1;            // memória de viagem: só leva a cidades já visitadas
    opts.push({ label: '🧭 Viagem rápida', fn: () => { travel(city); return true; } });
    opts.push({ label: 'Fechar' });
    const u = cacasUsadas(city), outros = quadrosAbertos().filter(c => c !== city).map(c => CITY_N[c]);
    dialog('📋 Quadro de Caça · ' + CITY_N[city], `Contratos de caça desta cidade. <b>Cada quadro dá ${LIM_CACA} contratos por dia</b>: para fazer mais, viaje e pegue nos quadros das <b>outras cidades</b>.<br><small>Aqui hoje: <b>${u} de ${LIM_CACA}</b>${u >= LIM_CACA ? ' · este quadro abre de novo amanhã' : ''}${outros.length ? `<br>Ainda com contratos hoje: ${outros.join(', ')}` : ''}</small>`, opts);
  }
  const CITY_N = { solmira: 'Vila de Solmira', kharum: 'Oásis de Kharum', cidadela: 'Cidadela do Cisma', acampamento: 'Acampamento de Valdora', clareira: 'Clareira de Lira', praia: 'Praia de Cômodo', vigilia: 'Vigília do Vale', refugio: 'Refúgio Suspenso', margem: 'Margem das Memórias' };
  function travel(from) {
    const opts = Object.keys(BOARDS).filter(c => c !== from).map(c => P.warps[c]
      ? { label: `🧭 ${CITY_N[c]} — 50 cr`, fn: () => {
          if (P.zeny < 50) { log('Coroas insuficientes!', 'bad'); Audio8.sfx('miss'); return; }
          P.zeny -= 50; const b = BOARDS[c]; P.x = b.x + 2.5; P.z = b.z + 2.5; P.y = groundY(P.x, P.z); P.vy = 0;
          Audio8.sfx('buff'); burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0x80c0ff, 30, 4, 0.9); log(`🧭 Você viajou para <b>${CITY_N[c]}</b>.`, 'sys'); } }
      : { label: `🔒 ${CITY_N[c]} — fale com o Guia de lá uma vez`, fn: () => { travel(from); return true; } });
    opts.push({ label: 'Fechar' });
    dialog('🧭 Viagem rápida', 'Leva você até outra cidade que você já visitou. <small>(Cidade nova: fale com o Guia de Viagem de lá uma vez.)</small>', opts);
  }
  // NPC de viagem em cada cidade (como a Kafra): registra a cidade e abre a viagem
  function warp(city) { P.warps = P.warps || {}; P.warps[city] = 1; travel(city); }
  function mark(n) {
    const toHere = Object.keys(S().act).map(id => byId[id]).filter(q => q && (q.to || q.giver) === n.name);
    const r = toHere.find(ready); if (r) return '?:' + colorOf(r);
    const o = Q.find(q => q.giver === n.name && available(q)); if (o) return '!:' + colorOf(o);
    if (toHere.length) return '?:#7a7a88';
    return null;
  }

  // itens pedidos pelas missões aceitas (aba 📜 da mochila)
  function needItems() { const o = {}; for (const id of Object.keys(S().act)) { const q = byId[id]; if (q) q.steps.forEach(st => { if (st.item) o[st.item] = 1; }); } return o; }
  function onKill(m) {
    for (const id in S().act) { const q = byId[id]; if (!q) continue; const st = q.steps.find(s => s.kill === m.type); if (st) { const a = S().act[id]; a.k[m.type] = (a.k[m.type] || 0) + 1; if (ready(q) && !a.avisou) { a.avisou = 1; log(`${TYPE[q.type].dot} <b style="color:${colorOf(q)}">${q.title}</b>: objetivo cumprido! ${q.board ? 'Volte ao Quadro de Caça.' : 'Volte a ' + (q.to || q.giver) + '.'}`, 'gold'); } } }
  }
  // painel: até 3 missões, a principal primeiro
  // linha única: título + o que falta (para caber mais missões no canto da tela)
  function compact(q) {
    let tail;
    if (ready(q)) tail = '✅'; else if (!q.steps.length) tail = '💬';
    else { const i = Math.max(0, q.steps.findIndex((st, k) => prog(q, k) < need(st))); tail = `<b>${prog(q, i)}/${need(q.steps[i])}</b>`; }
    return `<div class="qi${q.id === focusId() ? ' focus' : ''}" data-q="${q.id}"><b style="color:${colorOf(q)}">${TYPE[q.type].dot} ${q.title}</b> ${tail}</div>`;
  }
  // missão que a seta segue: a escolhida pelo jogador (tocando no quadro) ou, se não houver, a principal
  function focusId() {
    const act = Object.keys(S().act);
    if (P.qFocus && act.includes(P.qFocus)) return P.qFocus;
    const m = act.map(id => byId[id]).filter(Boolean); const q = m.find(q => q.type === 'principal') || m[0];
    return q ? q.id : null;
  }
  // diário: ativas (seguir), disponíveis (a seta leva até quem dá a missão) e quantas já concluiu
  // 📜 a seta leva até a FRENTE do quadro (pedido do Rone: parar bem na frente para já apertar o botão de conversa)
  const frenteQuadro = b => ({ x: b.x, z: b.z + 1.6, quadro: b });
  const placeOf = (x, z) => { try { return ZONES[zoneOf(x, z)].name; } catch (e) { return ''; } };
  function giverPos(q) {
    if (q.board) { const b = BOARDS[q.board]; return { ...frenteQuadro(b), name: 'Quadro de Caça · ' + placeOf(b.x, b.z) }; }
    const n = npcByName(q.giver); return n ? { x: n.x, z: n.z, name: n.name + ' · ' + placeOf(n.x, n.z) } : null;
  }
  // missões novas (que você ainda não pegou nem viu no diário): o 📜 mostra "!"
  const novas = () => Q.filter(q => (q.type === 'principal' || q.type === 'secundaria') && available(q) && giverPos(q));
  function novasCount() { const v = S().vistas || {}; return novas().filter(q => !v[q.id]).length; }
  function journal() {
    const act = Object.keys(S().act).map(id => byId[id]).filter(Boolean);
    // contratos de caça somem do diário quando o limite do dia já foi usado (antes apareciam e o quadro dizia "amanhã")
    const avail = Q.filter(q => q.type !== 'oculta' && available(q) && !(q.type === 'caca' && cacasUsadas(q.board) >= LIM_CACA));
    const sv = S(); sv.vistas = sv.vistas || {}; const novo = new Set(novas().filter(q => !sv.vistas[q.id]).map(q => q.id)); for (const id of novo) sv.vistas[id] = 1;
    const done = Object.keys(S().done).length;
    const opts = [];
    for (const q of act) opts.push({ label: `🧭 ${TYPE[q.type].dot} ${q.title} — ${ready(q) ? 'pronta para entregar' : 'em andamento'}`, fn: () => { follow(q.id); P.qGo = null; $('quest').dataset.h = ''; andar(); } });
    for (const q of avail) { const g = giverPos(q); if (!g) continue; opts.push({ label: `${novo.has(q.id) ? '🆕 ' : ''}${TYPE[q.type].dot} ${q.title} — pegar com ${g.name}`, fn: () => { P.qGo = { ...g, qt: q.title, qc: colorOf(q) }; Audio8.sfx('click'); log(`🧭 A seta leva até <b>${g.name}</b> para pegar <b style="color:${colorOf(q)}">${q.title}</b>.`, 'sys'); $('quest').dataset.h = ''; andar(); } }); }
    opts.push({ label: 'Fechar' });
    dialog('📖 Diário de Missões', `<small>🟡 principal · 🔵 secundária · 🟢 caça · 🟣 oculta</small><br>${act.length} ativa(s) · ${avail.length} disponível(is) · ${done} concluída(s).<br><small>🟢 Caça: <b>${LIM_CACA} contratos por dia em cada quadro</b> (são ${Object.keys(BOARDS).length} cidades com quadro). Os quadros que já deram os ${LIM_CACA} de hoje somem da lista.</small><br><small>Toque numa disponível e a seta leva até quem dá a missão.</small>`, opts);
  }
  // escolheu no diário: já sai andando sozinho até lá (antes só mudava a seta e ninguém ia)
  function andar() { if (typeof autoStart === 'function' && !inTower(P.z)) { if (AUTO.on) autoStop(''); autoStart(); } }
  function follow(id) { if (!byId[id]) return; P.qFocus = id; Audio8.sfx('click'); log(`🧭 Seguindo <b style="color:${colorOf(byId[id])}">${byId[id].title}</b>.`, 'sys'); }
  function readyCount() { return Object.keys(S().act).map(id => byId[id]).filter(q => q && ready(q)).length; }
  function html(compact) {
    // principal primeiro, depois as mais novas (a última aceita aparece sempre); o resto vira "+N"
    const all = Object.keys(S().act).map(id => byId[id]).filter(Boolean), main = all.filter(q => q.type === 'principal'), rest = all.filter(q => q.type !== 'principal').reverse();
    const ord = main.concat(rest), fq = ord.find(q => q.id === focusId()), act = (fq ? [fq, ...ord.filter(q => q !== fq)] : ord).slice(0, compact ? 1 : 4), more = all.length - act.length;
    const G = P.qGo && P.qGo.qt ? P.qGo : null, pegar = G ? `<div class="qi focus" data-qgo="1"><b style="color:${G.qc || 'var(--gold)'}">Pegar: ${G.qt}</b><br>com ${G.name}</div>` : '';
    if (!act.length) return `<div class="wt">📜 Missões${typeof AUTO !== 'undefined' && AUTO.on ? ' <small>🚶 andando</small>' : ''}</div><div class="wb">${pegar}<div class="qi qmore">${G ? 'Ver o diário' : 'Nenhuma ativa · toque para ver as disponíveis'}</div></div>`;
    return `<div class="wt">📜 Missões${typeof AUTO !== 'undefined' && AUTO.on ? ' <small>🚶 andando</small>' : ' <small>📖 diário</small>'}</div><div class="wb">` + pegar + act.map(q => q !== fq && act.length > 2 ? compact(q) : `<div class="qi${q.id === focusId() && !G ? ' focus' : ''}" data-q="${q.id}"><b style="color:${colorOf(q)}">${TYPE[q.type].dot} ${q.title}</b><br>${ready(q) ? `✅ Volte a ${q.board ? 'o Quadro de Caça' : (q.to || q.giver)}` : q.steps.length ? q.steps.map((st, i) => `${stepTxt(st, i, q)} <b>${prog(q, i)}/${need(st)}</b>`).join('<br>') : `Fale com ${q.to || q.giver}`}</div>`).join('') + (more > 0 ? `<div class="qi qmore">+${more} ${more > 1 ? 'missões' : 'missão'} </div>` : '') + `</div>`;
  }
  // destino da seta: missão principal ativa (ou a primeira)
  function target() {
    if (P.qGo && P.qGo.reg) {                        // indo para outro mapa (Mapa do Mundo): passagem por passagem até chegar
      const G = P.qGo, aqui = inTower(P.z) ? 'torre' : mapaDe(P.x, P.z);
      if (aqui === G.reg || (G.reg === 'torre' && Math.hypot(P.x - Tower.door.x, P.z - Tower.door.z) < 6)) { if (G.fim && Math.hypot(P.x - G.fim.x, P.z - G.fim.z) > 4) { G.x = G.fim.x; G.z = G.fim.z; G.name = `o ponto marcado (${G.regN})`; return G; } log(`🧭 Você chegou: <b>${G.regN}</b>.`, 'sys'); P.qGo = null; return null; }
      const w = BigMap.rota(aqui, G.reg); G.x = w.x; G.z = w.z; G.name = `${w.name}, caminho para ${G.regN}`; return G;
    }
    if (P.qGo) { if (!P.qGo.grave && Math.hypot(P.x - P.qGo.x, P.z - P.qGo.z) < (P.qGo.quadro ? 1.1 : P.qGo.name === 'o ponto marcado' ? 1.3 : 4)) { if (!P.qGo.seguir) log(`🧭 Você chegou: <b>${P.qGo.name}</b>.`, 'sys'); const seg = P.qGo.seguir; P.qGo = null; if (!seg && typeof autoStop === 'function' && typeof AUTO !== 'undefined' && AUTO.on) { autoStop(''); return null; } } else return P.qGo; }
    const act = Object.keys(S().act).map(id => byId[id]).filter(Boolean);
    const q = byId[focusId()]; if (!q) return null;
    if (ready(q) || !q.steps.length) { if (q.board) return frenteQuadro(BOARDS[q.board]); const n = npcByName(q.to || q.giver); return n ? { x: n.x, z: n.z } : null; }
    const st = q.steps.find((s, i) => prog(q, i) < need(s));
    if (st && st.kill) { let best = null, bd = 1e9; for (const m of mobs) if (m.type === st.kill) { const d = Math.hypot(m.x - P.x, m.z - P.z); if (d < bd) { bd = d; best = m; } } if (best) return { x: best.x, z: best.z }; const sp = SPAWNS.find(s => s.type === st.kill); if (sp) return sp.at ? { x: sp.at.x, z: sp.at.z } : { x: (sp.area[0] + sp.area[1]) / 2, z: (sp.area[2] + sp.area[3]) / 2 }; if (['larva', 'verme', 'esfera', 'sentinela'].includes(st.kill)) return { x: Tower.door.x, z: Tower.door.z }; }
    if (st && st.item) {                                   // quem solta o item: monstro vivo perto, senão onde ele nasce
      const srcs = Object.keys(MOBDEF).filter(t => !MOBDEF[t].alfa && !MOBDEF[t].field && MOBDEF[t].drops.some(([id]) => id === st.item));
      let best = null, bd = 1e9; for (const m of mobs) if (srcs.includes(m.type)) { const d = Math.hypot(m.x - P.x, m.z - P.z); if (d < bd) { bd = d; best = m; } }
      if (best) return { x: best.x, z: best.z };
      for (const t of srcs) { const sp = SPAWNS.find(s => s.type === t); if (sp) return sp.at ? { x: sp.at.x, z: sp.at.z } : { x: (sp.area[0] + sp.area[1]) / 2, z: (sp.area[2] + sp.area[3]) / 2 }; }
      if (srcs.some(t => ['larva', 'verme', 'esfera', 'sentinela'].includes(t))) return { x: Tower.door.x, z: Tower.door.z };
    }
    if (st && st.reach === 'topo') return { x: Tower.door.x, z: Tower.door.z };
    if (st && Array.isArray(st.reach)) return { x: st.reach[0], z: st.reach[1] };
    return null;
  }

  // ---------------- mundo: quadros de caça, tesouros e NPCs escondidos
  const BOARDS = { margem: { x: MREF.x + 11, z: MREF.z - 1 }, solmira: { x: VIL.x - 9, z: VIL.z + 9 }, kharum: { x: OAS.x - 12, z: OAS.z - 18 }, cidadela: { x: CIT.x - 4, z: CIT.z - 6 }, acampamento: { x: VCAMP.x + 9, z: VCAMP.z + 3 }, clareira: { x: FCLAR.x + 9, z: FCLAR.z - 1 }, praia: { x: PVILA.x + 10, z: PVILA.z - 2 }, vigilia: { x: VIGIL.x + 9, z: VIGIL.z + 4 }, refugio: { x: CREF.x - 9, z: CREF.z - 3 } };
  const opened = () => (P.secrets = P.secrets || {});
  const glintMats = [];
  // 🟣 mais baús escondidos (pedido do Rone): um no canto de metade das áreas de caça de todos os mapas (Reino, Valdora,
  // Floresta, Vale, Cidade Submersa, Rio das Memórias) e dois na Praia. Prêmio pelo nível dos bichos do lugar.
  function gerarBaus() {
    if (SECRETS.some(s => s.gerado)) return;
    const NOMES = ['Baú Esquecido', 'Arca Enterrada', 'Cofre do Viajante', 'Baú Coberto de Musgo', 'Arca do Desertor', 'Caixa de Oferendas', 'Relicário Perdido', 'Baú do Caçador'];
    const MSG = ['Meio enterrado, quase invisível, um baú que alguém escondeu com pressa.', 'Atrás das pedras, uma arca que ninguém lembrou de buscar.', 'Um cofre pequeno, preso por raízes. Alguém fugiu e deixou para trás.', 'O musgo cobre tudo, menos a fechadura dourada.'];
    const pot = L => L >= 80 ? ['red_x', 'blue_g'] : L >= 60 ? ['red_g', 'blue_m'] : L >= 40 ? ['red_m', 'blue_m'] : ['red', 'blue'];
    const premio = L => { const [r, b] = pot(L), it = { [r]: 3 + Math.floor(L / 25), [b]: 2 + Math.floor(L / 30) }; if (L >= 20) it.frag_carta = 1 + Math.floor(L / 40); if (L >= 50) it.frag_cisma = 1 + Math.floor(L / 50); return { zeny: Math.round(L * L * 3 + 300), items: it }; };
    const vistos = new Set(); let k = 0;
    for (const sp of SPAWNS) {
      if (!sp.area || !MOBDEF[sp.type] || MOBDEF[sp.type].boss) continue; const key = sp.area.join(','); if (vistos.has(key)) continue; vistos.add(key);
      if (k++ % 2) continue;
      const [x0, x1, z0, z1] = sp.area, L = MOBDEF[sp.type].lv;
      let pt = null; const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2; for (const [cx, cz] of [[x0 + 1.5, z0 + 1.5], [x1 - 1.5, z1 - 1.5], [x0 + 1.5, z1 - 1.5], [x1 - 1.5, z0 + 1.5], [mx, z0 + 1.5], [mx, z1 - 1.5], [x0 + 1.5, mz], [x1 - 1.5, mz], [mx + 2, mz + 2]]) if (!blocked(cx, cz, 0.9)) { pt = [cx, cz]; break; }
      if (!pt) continue;
      SECRETS.push({ id: 'bx' + key.replace(/[^0-9-]/g, '').slice(0, 14), gerado: 1, kind: 'bau', name: NOMES[k % NOMES.length], x: pt[0], z: pt[1], lv: Math.max(1, L - 5), rw: premio(L), msg: MSG[k % MSG.length] });
    }
    // Praia de Cômodo (sem monstros): perto do farol e atrás da vila
    for (const [id, bx, bz] of [['bpraia1', PFAROL.x + 7, PFAROL.z + 5], ['bpraia2', PVILA.x - 16, PVILA.z + 12]]) {
      let pt = null; for (let r = 0; r < 10 && !pt; r += 2) for (let a = 0; a < 6.3 && !pt; a += 0.8) { const x = bx + Math.cos(a) * r, z = bz + Math.sin(a) * r; if (!blocked(x, z, 0.9)) pt = [x, z]; }
      if (pt) SECRETS.push({ id, gerado: 1, kind: 'bau', name: 'Baú do Náufrago', x: pt[0], z: pt[1], rw: premio(25), msg: 'A maré trouxe um baú e a areia escondeu. Ainda está seco por dentro.' });
    }
  }
  function montarBau(s) {
    const g = new THREE.Group(); g.position.set(s.x, groundY(s.x, s.z), s.z); scene.add(g); s.g = g;
    mesh(new THREE.BoxGeometry(1.1, 0.7, 0.75), PM('madeira.jpg', [1, 0.5], 0x7a5a3a), 0, 0.35, 0, g);
    mesh(new THREE.BoxGeometry(1.15, 0.12, 0.8), new THREE.MeshLambertMaterial({ color: 0x4a3a20 }), 0, 0.72, 0, g);
    const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex('✦:#ffe8a0'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glint.scale.setScalar(0.6); glint.position.y = 1.2; g.add(glint); s.glint = glint;
    addOb(s.x, s.z, 0.7);
  }
  let bausGerados = false;
  function gerarDepois() {                                 // só depois que todos os mapas (Floresta, Vale, Cidade, Rio, Praia) carregaram
    if (bausGerados || typeof running === 'undefined' || !running || typeof Memorias === 'undefined' || typeof Praia === 'undefined') return;
    bausGerados = true; const antes = SECRETS.length; try { gerarBaus(); } catch (e) { } for (const s of SECRETS.slice(antes)) montarBau(s);
  }
  function build() {
    for (const [city, b] of Object.entries(BOARDS)) {
      const g = new THREE.Group(); g.position.set(b.x, groundY(b.x, b.z), b.z); g.rotation.y = Math.atan2(P.x - b.x, P.z - b.z) * 0; scene.add(g);
      // quadro de caça: postes roliços, telhadinho de duas águas, moldura e papéis tortos presos com tachinhas
      const wood = PM('madeira.jpg', [0.3, 1], 0x8a6a50), tabua = PM('madeira.jpg', [1, 0.6], 0xa08060), escuro = PM('madeira.jpg', [0.3, 1], 0x5a4030);
      [-1.05, 1.05].forEach(x => { mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.9, 8), wood, x, 1.45, 0, g); mesh(new THREE.SphereGeometry(0.13, 8, 6), escuro, x, 2.92, 0, g); });
      mesh(new THREE.BoxGeometry(2.0, 1.25, 0.08), tabua, 0, 1.65, 0, g);
      for (const [w, h, x, y] of [[2.2, 0.1, 0, 2.3], [2.2, 0.1, 0, 1.0], [0.1, 1.4, -1.05, 1.65], [0.1, 1.4, 1.05, 1.65]]) mesh(new THREE.BoxGeometry(w, h, 0.14), escuro, x, y, 0.02, g, false);
      const tel = new THREE.Shape(); tel.moveTo(-1.35, 0); tel.lineTo(1.35, 0); tel.lineTo(0, 0.55); tel.closePath();
      const tj = new THREE.Mesh(new THREE.ExtrudeGeometry(tel, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }), PM('telha.jpg', [2, 1], 0x9a5a48)); tj.position.set(0, 2.42, -0.25); tj.castShadow = true; g.add(tj);
      const papel = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 80; const x = c.getContext('2d'); x.fillStyle = '#efe4c8'; x.fillRect(0, 0, 64, 80); x.fillStyle = '#7a3a2a'; x.font = 'bold 14px serif'; x.fillText('PROCURA-SE', 3, 16); x.fillStyle = '#5a4a3a'; for (let i = 0; i < 6; i++) x.fillRect(6, 26 + i * 8, 40 + (i * 13) % 16, 2); x.strokeStyle = '#a08a60'; x.strokeRect(1, 1, 62, 78); return new THREE.CanvasTexture(c); })();
      const pm = new THREE.MeshLambertMaterial({ map: papel }), tach = new THREE.MeshLambertMaterial({ color: 0xc03030 });
      [[-0.55, 1.75, 0.08], [0.05, 1.5, -0.06], [0.6, 1.8, 0.12]].forEach(([x, y, r]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.58), pm); p.position.set(x, y, 0.05); p.rotation.z = r; g.add(p); mesh(new THREE.SphereGeometry(0.035, 6, 4), tach, x, y + 0.25, 0.07, g, false); });
      const tag = bangSprite(); tag.material = tag.material.clone(); tag.material.map = markTex('!:#7dff9a'); tag.material.fog = false; tag.material.toneMapped = false; tag.position.y = 3.1; tag.scale.setScalar(1.1); g.add(tag);
      addOb(b.x, b.z, 1.1);
    }
    for (const s of SECRETS) {
      if (s.kind === 'bau') {
        const g = new THREE.Group(); g.position.set(s.x, groundY(s.x, s.z), s.z); scene.add(g); s.g = g;
        const box = mesh(new THREE.BoxGeometry(1.1, 0.7, 0.75), PM('madeira.jpg', [1, 0.5], 0x7a5a3a), 0, 0.35, 0, g);
        mesh(new THREE.BoxGeometry(1.15, 0.12, 0.8), new THREE.MeshLambertMaterial({ color: 0x4a3a20 }), 0, 0.72, 0, g);
        const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex('✦:#ffe8a0'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glint.scale.setScalar(0.6); glint.position.y = 1.2; g.add(glint); s.glint = glint;
        addOb(s.x, s.z, 0.7);
        if (s.id === 'b2') { const sw = mesh(new THREE.BoxGeometry(0.08, 1.4, 0.18), new THREE.MeshLambertMaterial({ color: 0x9aa0a8 }), 0.9, 0.7, 0, g); sw.rotation.z = 0.15; }
      } else {
        const n = { id: 'h_' + s.id, name: s.name, x: s.x, z: s.z, hidden: true };
        const g = new THREE.Group(); g.position.set(n.x, groundY(n.x, n.z), n.z); scene.add(g);
        const bang = bangSprite(); bang.position.y = 2.3; g.add(bang); n.bang = bang; n.g = g;
        addOb(n.x, n.z, 1.2); NPCS.push(n); NPC_SPR[n.name] = s.sprite;
      }
    }
  }
  const quadroPerto = () => Math.min(...Object.values(BOARDS).map(b => Math.hypot(b.x - P.x, b.z - P.z)));
  function nearest() {
    for (const [city, b] of Object.entries(BOARDS)) if (Math.hypot(b.x - P.x, b.z - P.z) < 2.6) return { label: 'Ler o Quadro de Caça', fn: () => boardTalk(city) };
    for (const s of SECRETS) if (s.kind === 'bau' && !opened()[s.id] && Math.hypot(s.x - P.x, s.z - P.z) < 2.2) return { label: `Abrir: ${s.name}`, fn: () => openChest(s) };
    return null;
  }
  function openChest(s) {
    if (s.lv && P.lv < s.lv) { dialog(`🟣 ${s.name}`, `${s.msg}<br><br><small>Uma força estranha te repele. Volte no nível ${s.lv}.</small>`); return; }
    opened()[s.id] = 1;
    const r = s.rw; P.zeny += r.zeny || 0; const got = [];
    for (const [id, n] of Object.entries(r.items || {})) { P.inv[id] = (P.inv[id] || 0) + n; got.push(`${n}× ${ITEMS[id].ic} ${ITEMS[id].name}`); }
    Audio8.sfx('level'); burst(new THREE.Vector3(s.x, groundY(s.x, s.z) + 1, s.z), 0xffe8a0, 40, 4, 1.1); buildHotbar();
    if (s.glint) s.glint.visible = false;
    banner('🟣 Tesouro encontrado!');
    dialog(`🟣 ${s.name}`, `${s.msg}<br><br>Você encontrou: <b>${r.zeny} cr</b>${got.length ? ', ' + got.join(', ') : ''}.`);
    save();
  }
  let tAcc = 0;
  function update(dt) {
    tAcc += dt; if (tAcc < 0.4) return; tAcc = 0;
    gerarDepois();
    for (const s of SECRETS) if (s.glint) s.glint.visible = !opened()[s.id] && Math.hypot(s.x - P.x, s.z - P.z) < 22;
    for (const id in S().act) { const q = byId[id]; if (!q) continue; if (q.steps.some(st => st.reach === 'topo') && inTower(P.z) && Tower.floor === TOP && !S().act[id].r) { S().act[id].r = 1; log(`🟡 Você chegou ao topo. Volte ao <b>${q.giver}</b>.`, 'gold'); } }
    for (const id in S().act) { const q = byId[id]; if (!q) continue; const st = q.steps.find(t => Array.isArray(t.reach)); if (st && !S().act[id].r && Math.hypot(P.x - st.reach[0], P.z - st.reach[1]) < st.reach[2]) { S().act[id].r = 1; Audio8.sfx('level'); log(`${TYPE[q.type].dot} <b>${q.title}</b>: você chegou! Volte a ${q.to || q.giver}.`, 'gold'); } }
  }
  // saves antigos: converte a missão da Mestra Odete (P.quest) e já começa a próxima
  function migrate() {
    const s = S();
    if (P.quest !== undefined && !s.migrated) {
      const map = [[], ['p1'], ['p1', 'p2'], ['p1', 'p2', 'p3', 'p4'], ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'], ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']];
      for (const id of map[Math.min(6, P.quest || 0)]) s.done[id] = 1;
      s.migrated = 1;
    }
    if (!Object.keys(s.act).some(id => byId[id] && byId[id].type === 'principal')) { const nx = Q.find(q => q.type === 'principal' && available(q)); if (nx) s.act[nx.id] = { k: {} }; }
  }
  return { _boards: BOARDS, _baus: () => SECRETS.filter(s => s.kind === 'bau').map(s => [s.name, Math.round(s.x), Math.round(s.z), s.lv || 0]), quadroPerto, warp, readyCount, novasCount, journal, needItems, follow, talk, boardTalk, mark, onKill, html, target, build, nearest, update, migrate, TYPE };
})();
Quests.build();
