// =====================================================================
//  Raças e classes — Crônicas de Solmira
//  Arquétipos clássicos de fantasia; nomes, habilidades e números originais.
// =====================================================================
'use strict';

const STAT_KEYS = ['str', 'agi', 'vit', 'int', 'dex', 'luk'];
const STAT_NAMES = { str: 'FOR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DES', luk: 'SOR' };
const STAT_INFO = {
  str: 'Dano corpo a corpo', agi: 'Vel. de ataque e esquiva', vit: 'HP e defesa',
  int: 'SP e dano mágico', dex: 'Dano à distância e velocidade', luk: 'Crítico e sorte nos drops',
};

const RACES = {
  humano: {
    name: 'Humano', desc: 'Versáteis e adaptáveis. Bons em qualquer classe.',
    bonus: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 }, scale: [1, 1, 1],
    classes: ['guerreiro', 'paladino', 'arqueira', 'assassino', 'arruaceiro', 'sacerdote', 'mago_luz', 'mago_negro', 'dancarina'],
    skins: [0xffd9be, 0xe8b48f, 0xb07a50],
  },
  anao: {
    name: 'Anão', desc: 'Baixos, largos e duros como pedra. Ótimos combatentes de linha de frente.',
    bonus: { vit: 3, str: 3, agi: -1, luk: 1 }, scale: [1.2, 0.78, 1.2], beard: true,
    classes: ['guerreiro', 'saqueador', 'ferreira'],
    skins: [0xf2c6a2, 0xd49a72, 0xa8724c],
  },
  elfo: {
    name: 'Elfo', desc: 'Altos e graciosos, com olhos aguçados. Mestres do arco e da magia de luz.',
    bonus: { dex: 3, agi: 2, int: 1, vit: -1 }, scale: [0.94, 1.08, 0.94], ears: true,
    classes: ['guerreiro', 'arqueira', 'dancarina', 'sacerdote', 'mago_luz'],
    skins: [0xfde6d4, 0xf0d2bc, 0xe4c0a0],
  },
  elfo_negro: {
    name: 'Elfo Negro', desc: 'Filhos das cavernas profundas. Letais nas sombras e nas artes proibidas.',
    bonus: { int: 3, agi: 2, luk: 1, vit: -1 }, scale: [0.94, 1.08, 0.94], ears: true,
    classes: ['guerreiro', 'assassino', 'arqueira', 'dancarina', 'mago_negro', 'necromante'],
    skins: [0x8a8fb8, 0x6c7099, 0x55597e],
  },
};

RACES.orc = {
  name: 'Orc', desc: 'Guerreiros das estepes queimadas. Força bruta, couro grosso e espíritos ancestrais.',
  bonus: { str: 4, vit: 3, int: -1, dex: -1 }, scale: [1.16, 1.07, 1.16], orc: true, tusks: true,
  classes: ['berserker', 'monge', 'xama'],
  skins: [0x6f9a4a, 0x8a7a4a, 0x5a6a5a],
};
const HAIR_COLORS = [0xff7b6b, 0xf4d58d, 0x6b3e26, 0x1e1e24, 0xf2f2f2, 0x7fb7ff, 0xb48cff, 0x5fd38d];

// Tipos de habilidade (motor genérico em game3d.js):
//  strike  golpe num alvo próximo         nova   área ao redor de si
//  blast   área em volta do alvo          bolt   projétil(eis)
//  buff    bônus temporário               heal   cura
//  step    teleporta atrás do alvo        drain  projétil que rouba vida
//  summon  invoca aliado                  charge avança até o alvo
const CLASSES = {
  dancarina: {
    name: { f: 'Dançarina', m: 'Dançarino' }, role: 'Suporte e dano em área. Golpes no ritmo da música causam muito mais dano.',
    weapon: 'ribbon', outfit: 'dress', hat: 'flower', colors: { cloth: 0x1fb5a8, trim: 0xffcf40, accent: 0xff4fa3 },
    range: 3.4, dmg: 'str', aspd: 0.7, hp: 1.0, sp: 1.1, crit: 0.04, bonus: { agi: 2, dex: 1 }, rhythm: true,
    skills: [
      { id: 'whirl', name: 'Chicote Giratório', icon: '🌀', lv: 1, sp: 8, cd: 1.2, type: 'nova', r: 4, mult: 1.5, color: 0xff4fa3, desc: 'Gira a fita causando 150% de dano ao redor.' },
      { id: 'charm', name: 'Passo Encantador', icon: '💫', lv: 4, sp: 14, cd: 6, type: 'nova', r: 6, mult: 0.8, magic: true, stun: 3, color: 0xb48cff, desc: 'Atordoa os inimigos próximos por 3s.' },
      { id: 'breeze', name: 'Dança da Brisa', icon: '🍃', lv: 8, sp: 20, cd: 25, type: 'buff', dur: 25, mods: { aspd: 1.5, speed: 1.3 }, color: 0x7dff9a, desc: '25s: +50% vel. de ataque e +30% de movimento.' },
      { id: 'finale', name: 'Grande Finale', icon: '✨', lv: 12, sp: 45, cd: 12, type: 'nova', r: 8, mult: 3.5, color: 0xffcf40, desc: 'Apresentação final: 350% de dano em grande área.' },
    ],
  },
  arqueira: {
    name: { f: 'Arqueira', m: 'Arqueiro' }, role: 'Dano à distância. Ataca de longe e mantém os inimigos afastados.',
    weapon: 'bow', outfit: 'leather', hat: 'feather', colors: { cloth: 0x3f7d3a, trim: 0xc8a060, accent: 0xe8e0c0 },
    range: 14, dmg: 'dex', ranged: true, proj: 0xe8e0c0, aspd: 0.8, hp: 0.9, sp: 1.0, crit: 0.06, bonus: { dex: 3, agi: 1 },
    skills: [
      { id: 'double', name: 'Tiro Duplo', icon: '🏹', lv: 1, sp: 7, cd: 1, type: 'bolt', mult: 1.2, shots: 2, color: 0xfff2a0, desc: 'Dispara duas flechas seguidas (120% cada).' },
      { id: 'rain', name: 'Chuva de Flechas', icon: '🌧️', lv: 4, sp: 16, cd: 5, type: 'blast', r: 4.5, mult: 1.7, color: 0xd0e8ff, desc: 'Flechas caem em volta do alvo (170%).' },
      { id: 'hawk', name: 'Olho de Falcão', icon: '🦅', lv: 8, sp: 18, cd: 30, type: 'buff', dur: 30, mods: { crit: 0.25, atk: 1.2 }, color: 0xffcf40, desc: '30s: +25% de crítico e +20% de dano.' },
      { id: 'pierce', name: 'Flecha Perfurante', icon: '➹', lv: 12, sp: 30, cd: 8, type: 'bolt', mult: 4, shots: 1, big: true, color: 0x7dff9a, desc: 'Uma flecha poderosa que causa 400% de dano.' },
    ],
  },
  guerreiro: {
    name: { f: 'Guerreira', m: 'Guerreiro' }, role: 'Linha de frente. Muito HP, golpes pesados e controle em área.',
    weapon: 'sword', outfit: 'armor', hat: 'helm', colors: { cloth: 0x8a2a2a, trim: 0xb8bcc8, accent: 0xd8a040 },
    range: 3.2, dmg: 'str', aspd: 0.8, hp: 1.35, sp: 0.8, crit: 0.04, bonus: { str: 3, vit: 2 },
    skills: [
      { id: 'heavy', name: 'Golpe Pesado', icon: '⚔️', lv: 1, sp: 6, cd: 1.5, type: 'strike', mult: 2.3, color: 0xffffff, desc: 'Um golpe brutal (230%).' },
      { id: 'steel', name: 'Redemoinho de Aço', icon: '🌪️', lv: 4, sp: 14, cd: 5, type: 'nova', r: 4.5, mult: 1.7, color: 0xd0d8e8, desc: 'Gira a espada atingindo todos ao redor (170%).' },
      { id: 'cry', name: 'Grito de Guerra', icon: '📣', lv: 8, sp: 18, cd: 30, type: 'buff', dur: 20, mods: { atk: 1.3, def: 12 }, color: 0xff6040, desc: '20s: +30% de dano e +12 de defesa.' },
      { id: 'charge', name: 'Investida', icon: '🐂', lv: 12, sp: 24, cd: 8, type: 'charge', mult: 3, stun: 2, color: 0xffaa40, desc: 'Avança até o alvo: 300% de dano e 2s de atordoamento.' },
    ],
  },
  paladino: {
    name: { f: 'Paladina', m: 'Paladino' }, role: 'Tanque sagrado. Resiste a tudo e cura a si mesmo enquanto luta.',
    weapon: 'mace', outfit: 'armor', hat: 'circlet', colors: { cloth: 0xf0f0f8, trim: 0xe0c050, accent: 0x4a7ad0 },
    range: 3.2, dmg: 'str', aspd: 0.9, hp: 1.4, sp: 1.0, crit: 0.02, bonus: { vit: 3, str: 1, int: 1 },
    skills: [
      { id: 'holyhammer', name: 'Martelo Sagrado', icon: '🔨', lv: 1, sp: 8, cd: 2, type: 'strike', mult: 1.9, magic: true, heal: 0.04, color: 0xfff2a0, desc: '190% de dano sagrado e cura 4% do HP.' },
      { id: 'faith', name: 'Escudo da Fé', icon: '🛡️', lv: 4, sp: 15, cd: 25, type: 'buff', dur: 20, mods: { def: 25 }, color: 0x9fd0ff, desc: '20s: +25 de defesa.' },
      { id: 'purify', name: 'Luz Purificadora', icon: '☀️', lv: 8, sp: 22, cd: 7, type: 'nova', r: 5, mult: 1.6, magic: true, heal: 0.1, color: 0xfff2a0, desc: 'Explosão de luz (160%) que cura 10% do HP.' },
      { id: 'judgment', name: 'Julgamento', icon: '⚖️', lv: 12, sp: 35, cd: 10, type: 'blast', r: 3.5, mult: 3.2, magic: true, color: 0xffe060, desc: 'Um pilar de luz cai sobre o alvo (320%).' },
    ],
  },
  sacerdote: {
    name: { f: 'Sacerdotisa', m: 'Sacerdote' }, role: 'Curandeiro. Cura forte, bênçãos e magia sagrada.',
    weapon: 'staff', staffColor: 0xfff6c0, outfit: 'robe', hat: 'mitre', colors: { cloth: 0xf4f0e6, trim: 0xd4a830, accent: 0x5a8ad0 },
    range: 10, dmg: 'int', ranged: true, magic: true, proj: 0xfff6c0, aspd: 1.0, hp: 1.0, sp: 1.4, crit: 0.02, bonus: { int: 3, vit: 1, dex: 1 },
    skills: [
      { id: 'cure', name: 'Cura Divina', icon: '💖', lv: 1, sp: 12, cd: 3, type: 'heal', pct: 0.4, color: 0xcfe8ff, desc: 'Cura 40% do HP.' },
      { id: 'bless', name: 'Bênção', icon: '🙏', lv: 4, sp: 18, cd: 60, type: 'buff', dur: 60, mods: { atk: 1.15, matk: 1.15, def: 6 }, color: 0xffe9a0, desc: '60s: +15% de dano, +15% de magia e +6 de defesa.' },
      { id: 'holybolt', name: 'Raio Sagrado', icon: '✝️', lv: 8, sp: 14, cd: 1.5, type: 'bolt', mult: 2.3, magic: true, shots: 1, color: 0xfff6c0, desc: 'Um raio de luz sagrada (230%).' },
      { id: 'sanctuary', name: 'Santuário', icon: '⛪', lv: 12, sp: 35, cd: 18, type: 'nova', r: 5, mult: 1.0, magic: true, regen: 8, color: 0xcfe8ff, desc: 'Solo sagrado: 100% de dano em área e regeneração por 8s.' },
    ],
  },
  assassino: {
    name: { f: 'Assassina', m: 'Assassino' }, role: 'Dano explosivo. Ataques muito rápidos, críticos e veneno.',
    weapon: 'daggers', outfit: 'leather', hat: 'hood', colors: { cloth: 0x2a2440, trim: 0x8a2a4a, accent: 0xc0c8d8 },
    range: 2.8, dmg: 'str', aspd: 0.5, hp: 0.95, sp: 0.9, crit: 0.12, bonus: { agi: 3, luk: 2 },
    skills: [
      { id: 'twin', name: 'Lâminas Gêmeas', icon: '🗡️', lv: 1, sp: 6, cd: 1, type: 'strike', mult: 1.2, hits: 2, color: 0xc0c8d8, desc: 'Dois cortes rápidos (120% cada).' },
      { id: 'shadowstep', name: 'Passo Sombrio', icon: '👤', lv: 4, sp: 15, cd: 6, type: 'step', mult: 2.8, color: 0x8a5ad0, desc: 'Surge atrás do alvo e golpeia com crítico garantido (280%).' },
      { id: 'venom', name: 'Lâmina Envenenada', icon: '☠️', lv: 8, sp: 16, cd: 30, type: 'buff', dur: 30, mods: { poison: 1 }, color: 0x7dff4a, desc: '30s: seus golpes envenenam os inimigos.' },
      { id: 'storm', name: 'Tempestade de Lâminas', icon: '🌑', lv: 12, sp: 32, cd: 9, type: 'nova', r: 4.5, mult: 2.6, critBonus: 0.3, color: 0x8a5ad0, desc: 'Gira entre os inimigos (260%, +30% de crítico).' },
    ],
  },
  arruaceiro: {
    name: { f: 'Arruaceira', m: 'Arruaceiro' }, role: 'Lutador de rua. Truques sujos, atordoamento e roubo de zeny.',
    weapon: 'club', outfit: 'leather', hat: 'bandana', colors: { cloth: 0x6a4a2a, trim: 0xc0392b, accent: 0x303030 },
    range: 3.0, dmg: 'str', aspd: 0.65, hp: 1.1, sp: 0.9, crit: 0.08, bonus: { str: 2, luk: 2, agi: 1 },
    skills: [
      { id: 'dirty', name: 'Soco Sujo', icon: '👊', lv: 1, sp: 6, cd: 2, type: 'strike', mult: 1.8, stun: 1, color: 0xffaa40, desc: '180% de dano e 1s de atordoamento.' },
      { id: 'pilfer', name: 'Afanar', icon: '💰', lv: 4, sp: 8, cd: 4, type: 'strike', mult: 1.0, steal: true, color: 0xffcf40, desc: 'Golpe que rouba zeny do alvo.' },
      { id: 'sand', name: 'Areia nos Olhos', icon: '🌫️', lv: 8, sp: 16, cd: 10, type: 'nova', r: 5, mult: 0.4, stun: 2.5, color: 0xe0c080, desc: 'Cega os inimigos próximos por 2,5s.' },
      { id: 'brawl', name: 'Pancadaria', icon: '💥', lv: 12, sp: 28, cd: 8, type: 'nova', r: 4, mult: 2.4, hits: 2, color: 0xff6040, desc: 'Uma briga generalizada: 2 golpes de 240% ao redor.' },
    ],
  },
  necromante: {
    name: { f: 'Necromante', m: 'Necromante' }, role: 'Invocador sombrio. Ergue mortos-vivos, envenena e drena vida.',
    weapon: 'staff', staffColor: 0x7dff4a, skull: true, outfit: 'robe', hat: 'hood', colors: { cloth: 0x1f2a1f, trim: 0x5a7a3a, accent: 0x7dff4a },
    range: 10, dmg: 'int', ranged: true, magic: true, proj: 0x7dff4a, aspd: 1.0, hp: 0.9, sp: 1.3, crit: 0.03, bonus: { int: 3, vit: 1, luk: 1 },
    skills: [
      { id: 'rot', name: 'Toque Pútrido', icon: '🦠', lv: 1, sp: 8, cd: 1.5, type: 'bolt', mult: 1.5, magic: true, shots: 1, poison: 1, color: 0x7dff4a, desc: 'Projétil que causa 150% e envenena.' },
      { id: 'skeleton', name: 'Erguer Esqueleto', icon: '💀', lv: 4, sp: 25, cd: 20, type: 'summon', minion: 'skeleton', life: 40, color: 0xe8e8d0, desc: 'Invoca um esqueleto que luta por 40s.' },
      { id: 'drain', name: 'Drenar Vida', icon: '🩸', lv: 8, sp: 16, cd: 4, type: 'drain', mult: 2.0, magic: true, steal: 0.5, color: 0xc0203a, desc: 'Causa 200% e recupera metade como HP.' },
      { id: 'plague', name: 'Praga', icon: '☣️', lv: 12, sp: 35, cd: 12, type: 'blast', r: 5, mult: 1.5, magic: true, poison: 3, color: 0x7dff4a, desc: 'Nuvem tóxica (150%) com veneno forte em área.' },
    ],
  },
  mago_luz: {
    name: { f: 'Maga da Luz', m: 'Mago da Luz' }, role: 'Mago de luz. Rajadas múltiplas, atordoamento e proteção radiante.',
    weapon: 'staff', staffColor: 0xffe060, outfit: 'robe', hat: 'wizard', colors: { cloth: 0xf8f4e8, trim: 0xe0b030, accent: 0x60b0ff },
    range: 12, dmg: 'int', ranged: true, magic: true, proj: 0xffe060, aspd: 1.05, hp: 0.85, sp: 1.4, crit: 0.03, bonus: { int: 4, dex: 1 },
    skills: [
      { id: 'lightarrow', name: 'Setas de Luz', icon: '🌟', lv: 1, sp: 10, cd: 1.5, type: 'bolt', mult: 1.1, magic: true, shots: 3, spread: true, color: 0xffe060, desc: 'Três setas que buscam alvos diferentes (110% cada).' },
      { id: 'prism', name: 'Prisma', icon: '🔷', lv: 4, sp: 18, cd: 6, type: 'blast', r: 4, mult: 1.8, magic: true, stun: 1.2, color: 0x9fd0ff, desc: 'Explosão de luz no alvo (180%) que atordoa.' },
      { id: 'barrier', name: 'Barreira Radiante', icon: '🔆', lv: 8, sp: 22, cd: 30, type: 'buff', dur: 30, mods: { def: 20 }, heal: 0.15, color: 0xffe9a0, desc: '30s: +20 de defesa e cura 15% do HP.' },
      { id: 'supernova', name: 'Supernova', icon: '💥', lv: 12, sp: 50, cd: 14, type: 'nova', r: 9, mult: 3.8, magic: true, color: 0xffffff, desc: 'Explode como uma estrela (380% em grande área).' },
    ],
  },
  mago_negro: {
    name: { f: 'Maga Negra', m: 'Mago Negro' }, role: 'Mago das trevas. O maior dano mágico, ao custo da própria vida.',
    weapon: 'staff', staffColor: 0xb048ff, outfit: 'robe', hat: 'wizard', colors: { cloth: 0x2a1640, trim: 0x8a3ad0, accent: 0xb048ff },
    range: 12, dmg: 'int', ranged: true, magic: true, proj: 0xb048ff, aspd: 1.05, hp: 0.85, sp: 1.4, crit: 0.04, bonus: { int: 4, luk: 1 },
    skills: [
      { id: 'darkorb', name: 'Esfera Sombria', icon: '🔮', lv: 1, sp: 9, cd: 1.2, type: 'bolt', mult: 2.0, magic: true, shots: 1, big: true, color: 0xb048ff, desc: 'Uma esfera de trevas (200%).' },
      { id: 'abyss', name: 'Correntes do Abismo', icon: '⛓️', lv: 4, sp: 18, cd: 7, type: 'blast', r: 4, mult: 1.5, magic: true, stun: 2, color: 0x6a2aa0, desc: 'Prende os inimigos em volta do alvo (150%, 2s).' },
      { id: 'pact', name: 'Pacto Sombrio', icon: '🩸', lv: 8, sp: 10, cd: 30, type: 'buff', dur: 25, mods: { matk: 1.45 }, hpCost: 0.12, color: 0xc0203a, desc: 'Sacrifica 12% do HP: +45% de dano mágico por 25s.' },
      { id: 'eclipse', name: 'Eclipse', icon: '🌘', lv: 12, sp: 48, cd: 14, type: 'blast', r: 6, mult: 4.2, magic: true, color: 0x2a0a40, desc: 'Apaga o sol sobre os inimigos (420% em área).' },
    ],
  },
  ferreira: {
    name: { f: 'Ferreira de Raios', m: 'Ferreiro de Raios' }, role: 'Artesã de batalha. Martelo elétrico e torres de raio.',
    weapon: 'hammer', outfit: 'armor', hat: 'goggles', colors: { cloth: 0x4a5a6a, trim: 0xd08a30, accent: 0x50dcff },
    range: 3.2, dmg: 'str', aspd: 0.85, hp: 1.25, sp: 1.0, crit: 0.04, bonus: { str: 2, dex: 2, vit: 1 },
    skills: [
      { id: 'zap', name: 'Martelada Elétrica', icon: '⚡', lv: 1, sp: 7, cd: 1.5, type: 'strike', mult: 2.0, stun: 0.8, color: 0x50dcff, desc: '200% de dano e choque de 0,8s.' },
      { id: 'tower', name: 'Torre de Raios', icon: '🗼', lv: 4, sp: 22, cd: 18, type: 'summon', minion: 'tower', life: 30, color: 0x50dcff, desc: 'Monta uma torre que dispara raios por 30s.' },
      { id: 'overload', name: 'Sobrecarga', icon: '🔋', lv: 8, sp: 18, cd: 25, type: 'buff', dur: 20, mods: { aspd: 1.3, atk: 1.2 }, color: 0x50dcff, desc: '20s: +30% de vel. de ataque e +20% de dano.' },
      { id: 'anvil', name: 'Tempestade de Bigornas', icon: '🌩️', lv: 12, sp: 38, cd: 11, type: 'nova', r: 5.5, mult: 3.0, magic: true, color: 0x50dcff, desc: 'Raios caem ao seu redor (300%).' },
    ],
  },
};

Object.assign(CLASSES, {
  saqueador: {
    name: { f: 'Saqueadora', m: 'Saqueador' }, role: 'Coletor de espólio. Bate pesado e arranca itens extras dos monstros.',
    weapon: 'axe', outfit: 'leather', hat: 'goggles', colors: { cloth: 0x6a4a2a, trim: 0xc8a050, accent: 0x6ad0ff },
    range: 3.0, dmg: 'str', aspd: 0.8, hp: 1.2, sp: 0.9, crit: 0.05, bonus: { str: 2, luk: 2, vit: 1 },
    skills: [
      { id: 'plunder', name: 'Pilhagem', icon: '💰', lv: 1, sp: 7, cd: 2, type: 'strike', mult: 1.6, plunder: true, color: 0xffcf40, desc: '160% de dano; se o alvo morrer logo, solta um item extra.' },
      { id: 'stunhit', name: 'Martelada Atordoante', icon: '🔨', lv: 4, sp: 12, cd: 6, type: 'strike', mult: 2.0, stun: 2, color: 0xffaa40, desc: '200% de dano e 2s de atordoamento.' },
      { id: 'treasure', name: 'Faro de Tesouro', icon: '🧭', lv: 8, sp: 18, cd: 40, type: 'buff', dur: 60, mods: { drop: 1.6, crit: 0.1 }, color: 0xffcf40, desc: '60s: +60% de chance de itens e +10% de crítico.' },
      { id: 'avalanche', name: 'Avalanche', icon: '🪨', lv: 12, sp: 32, cd: 10, type: 'nova', r: 5, mult: 2.8, stun: 1, color: 0xb08a5a, desc: 'Rochas caem ao redor (280%) e atordoam.' },
    ],
  },
  berserker: {
    name: { f: 'Berserker', m: 'Berserker' }, role: 'Fúria pura. Machado gigante, quanto mais apanha, mais bate.',
    weapon: 'greataxe', outfit: 'leather', hat: 'bandana', colors: { cloth: 0x5a2a1a, trim: 0x9a8a6a, accent: 0xd03a2a },
    range: 3.4, dmg: 'str', aspd: 0.85, hp: 1.35, sp: 0.8, crit: 0.07, bonus: { str: 3, vit: 2 },
    skills: [
      { id: 'brutal', name: 'Golpe Brutal', icon: '🪓', lv: 1, sp: 7, cd: 1.6, type: 'strike', mult: 2.4, color: 0xff5a3a, desc: 'Um golpe de machado de 240%.' },
      { id: 'warcry', name: 'Rugido de Guerra', icon: '📢', lv: 4, sp: 14, cd: 8, type: 'nova', r: 5, mult: 1.0, stun: 1.5, color: 0xff7a3a, desc: 'Um rugido que atordoa todos por perto.' },
      { id: 'bloodrage', name: 'Fúria Sangrenta', icon: '🩸', lv: 8, sp: 10, cd: 30, type: 'buff', dur: 25, mods: { atk: 1.4, aspd: 1.25 }, hpCost: 0.1, color: 0xc0203a, desc: 'Sacrifica 10% do HP: +40% de dano e +25% de vel. de ataque.' },
      { id: 'massacre', name: 'Massacre', icon: '💀', lv: 12, sp: 34, cd: 11, type: 'nova', r: 4.5, mult: 3.3, hits: 1, color: 0xff3a2a, desc: 'Gira o machado em fúria (330% ao redor).' },
    ],
  },
  monge: {
    name: { f: 'Monja de Punho', m: 'Monge de Punho' }, role: 'Lutador de mãos nuas. Combos rápidos e pele de pedra.',
    weapon: 'fists', outfit: 'leather', hat: 'bandana', colors: { cloth: 0xc87a2a, trim: 0x3a2a1a, accent: 0xffcf40 },
    range: 2.6, dmg: 'str', aspd: 0.5, hp: 1.2, sp: 1.0, crit: 0.08, bonus: { str: 2, agi: 2, vit: 1 },
    skills: [
      { id: 'flurry', name: 'Rajada de Punhos', icon: '👊', lv: 1, sp: 6, cd: 1.2, type: 'strike', mult: 0.9, hits: 3, color: 0xffcf40, desc: 'Três socos rápidos (90% cada).' },
      { id: 'thunderpalm', name: 'Palma Trovejante', icon: '🖐️', lv: 4, sp: 14, cd: 6, type: 'blast', r: 3, mult: 1.8, stun: 1, color: 0x9fd0ff, desc: 'Onda de choque no alvo (180%) que atordoa.' },
      { id: 'stoneskin', name: 'Pele de Pedra', icon: '🗿', lv: 8, sp: 16, cd: 30, type: 'buff', dur: 25, mods: { def: 25, aspd: 1.1 }, color: 0xb0a090, desc: '25s: +25 de defesa e +10% de vel. de ataque.' },
      { id: 'finalfist', name: 'Punho Final', icon: '💥', lv: 12, sp: 30, cd: 9, type: 'charge', mult: 3.6, stun: 1.5, color: 0xffcf40, desc: 'Avança e acerta um soco de 360%.' },
    ],
  },
  xama: {
    name: { f: 'Xamã', m: 'Xamã' }, role: 'Fala com os espíritos do clã. Maldições, bênçãos e tempestades.',
    weapon: 'staff', staffColor: 0x5fd38d, totem: true, outfit: 'robe', hat: 'feather', colors: { cloth: 0x4a3a2a, trim: 0xc8a050, accent: 0x5fd38d },
    range: 11, dmg: 'int', ranged: true, magic: true, proj: 0x5fd38d, aspd: 1.0, hp: 1.05, sp: 1.3, crit: 0.03, bonus: { int: 3, vit: 1, luk: 1 },
    skills: [
      { id: 'ancestral', name: 'Raio Ancestral', icon: '⚡', lv: 1, sp: 9, cd: 1.4, type: 'bolt', mult: 2.0, magic: true, shots: 1, color: 0x5fd38d, desc: 'Um raio dos ancestrais (200%).' },
      { id: 'clancurse', name: 'Maldição do Clã', icon: '🌀', lv: 4, sp: 16, cd: 7, type: 'blast', r: 4, mult: 1.2, magic: true, poison: 2, color: 0x7dff4a, desc: 'Maldição em área (120%) com veneno forte.' },
      { id: 'ancblessing', name: 'Bênção dos Ancestrais', icon: '🪶', lv: 8, sp: 20, cd: 40, type: 'buff', dur: 45, mods: { atk: 1.25, matk: 1.25 }, heal: 0.15, color: 0xffe9a0, desc: '45s: +25% de dano físico e mágico; cura 15%.' },
      { id: 'spiritstorm', name: 'Tempestade de Espíritos', icon: '🌪️', lv: 12, sp: 42, cd: 12, type: 'nova', r: 7, mult: 3.4, magic: true, color: 0x5fd38d, desc: 'Espíritos varrem a área (340%).' },
    ],
  },
});

function className(cls, gender) { return CLASSES[cls].name[gender] || CLASSES[cls].name.f; }
