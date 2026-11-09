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
