# Dançarina: A Fita de Seda

RPG 2D de navegador no estilo dos MMOs clássicos: você clica para andar, ataca monstros e sobe de nível.
A protagonista é **Lyra**, uma dançarina que luta com uma fita de seda. Personagens, cidades e músicas são originais.

## Como jogar
Abra o `index.html` no navegador. Não precisa instalar nada.
Se o navegador bloquear arquivos locais, rode `python3 -m http.server` e acesse http://localhost:8000.

| Controle | Ação |
|---|---|
| Clique no chão (pode segurar) / setas | Andar |
| Clique num monstro | Atacar |
| Clique num NPC (com **!**) | Conversar |
| Q W E R T | Habilidades de dança |
| 1 / 2 | Poção Vermelha / Poção Azul |
| A | Atributos (FOR, AGI, VIT, INT) |
| X | Sentar e descansar |
| M | Liga ou desliga a música |
| H | Ajuda |

## Mundo
Vila de Solmira → Campos Dourados → Areias Rubras → Oásis de Kharum. A caravana leva direto de uma cidade à outra.
Cada mapa tem uma música própria, gerada em tempo real com WebAudio (`js/audio.js`).

## Habilidades
- 🌀 Chicote Giratório (Nv 1): dano em área
- 💫 Passo Encantador (Nv 3): atordoa os inimigos
- 🍃 Dança da Brisa (Nv 5): mais velocidade de ataque e de movimento
- 🌙 Canção da Lua (Nv 8): cura
- ✨ Grande Finale (Nv 12): dano muito alto em área

O progresso é salvo no navegador (localStorage).

---

# 🌟 Spin-off 3D: Lyra — Ritmo Perdido

Abra `3d/index.html`. É um jogo de ação em 3D, com câmera em terceira pessoa, e se passa no mesmo mundo:
Solmira, Campos Dourados, Areias Rubras e Oásis de Kharum, num único mapa contínuo. Os monstros são os mesmos do jogo 2D.

**Combate rítmico:** a melodia do mundo saiu do compasso. Golpeie no tempo da música, guiando-se pelo marcador
embaixo da tela. Um golpe **PERFEITO** causa +60% de dano e aumenta o combo (até +100%). Errar o tempo zera o combo.

| Controle | Ação |
|---|---|
| WASD | Andar |
| Arrastar o mouse / roda | Girar a câmera / zoom |
| Clique ou J | Golpe de fita |
| Espaço / Shift | Pular / esquivar |
| 1–5 | Danças especiais |
| Q / E | Poção Vermelha / Poção Azul |
| F | Falar com NPC |
| C | Atributos |
| X | Sentar |
| M | Música |
| H | Ajuda |

A Mestra Odete dá uma sequência de missões que termina no **Guardião das Areias**.
Usa [Three.js](https://threejs.org) r149 (licença MIT), incluído em `3d/lib/`.
