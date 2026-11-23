# Projeto: Reino Quebrado no Meta Quest 2 (realidade virtual)

Guardado em 21/11/2026 para continuar durante a semana. Ideia do Rone.

## Por que dá para fazer

- O navegador do Quest 2 abre o jogo pelo mesmo link:
  https://the3dig.github.io/kravenox-jogar/mmo/
- O Three.js (a biblioteca 3D do jogo) já tem suporte a WebXR, o padrão de
  realidade virtual dos navegadores. Não é preciso fazer outro jogo.

## Etapa 1: tela gigante (sem programar nada)

O Rone testa no Quest 2:

1. Abrir o link acima no navegador do Quest.
2. Parear o controle de Xbox em Configurações → Dispositivos → Bluetooth.
3. Se pesar, ligar o 🐢 Modo leve (menu ❓).

O que anotar no teste:

- [ ] Carrega até o fim?
- [ ] Fica liso ou trava?
- [ ] O controle de Xbox responde?
- [ ] O som sai?

## Etapa 2: botão "🥽 Entrar em VR"

A pessoa fica dentro do mundo, olhando em volta com a cabeça.

1. **Câmera sem enjoo.** Fica no modo "maquete": a pessoa parada, olhando de
   cima, e o personagem andando à frente. Depois dá para pensar numa opção em
   primeira pessoa.
2. **Controles do Quest:**
   - analógico esquerdo: andar;
   - gatilho direito: atacar (o mesmo que o A);
   - botões A, B, X e Y: habilidades e andar até a missão.

   O controle de Xbox continua valendo.
3. **Desempenho.** O Quest 2 desenha duas imagens 72 vezes por segundo:
   - no VR, o modo leve vem ligado;
   - menos sombras;
   - menos bichos desenhados ao longe.
4. **Painéis (depois).** A vida, a barra de habilidades, as missões e a
   mochila viram placas flutuantes. A primeira versão vem só com o essencial:
   vida, mana e a mensagem do log.

Primeira entrega combinada: o botão VR com andar, olhar em volta e atacar.
Os painéis ficam para depois.

## Cuidados

- Os testes reais são com o Rone, porque aqui não há óculos. É o mesmo jeito
  dos testes com o iPhone.
- A versão VR não pode mudar nada no jogo de celular.

## Situação em 23/11/2026

A etapa 2 foi feita como **experimental** (`3d/vr.js`):

- O botão 🥽 aparece lá em cima **só** se o navegador tiver VR (no Quest).
- Câmera "maquete", controles do Quest (analógico esquerdo anda, gatilho direito
  ataca, A e B habilidades, analógico direito gira a vista) e modo leve ligado.
- Ainda **não foi testada nos óculos** (aqui não há Quest). Falta também a
  vida, a mana e as mensagens dentro dos óculos (os painéis ficam para depois).
