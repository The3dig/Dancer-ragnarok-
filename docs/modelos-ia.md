# Modelos 3D feitos com IA (Meshy)

Teste começado em 22/11/2026, ideia do Rone: refazer em 3D os chefes que eram desenhos de pixel.

## Guerreiro Cristalizado (chefe de campo das Areias Rubras)

- Gerado pelo Rone no app do Meshy (créditos grátis), a partir de texto:
  cavaleiro de pedra de areia com cristais vermelhos e rosa e uma espada de cristal.
- Original (90 MB, 2 milhões de triângulos, 3 texturas): Google Drive do Rone,
  https://drive.google.com/file/d/1iS1KkL_9QkFa0omJy0Vvm9egvBYq-V5q/view
- No jogo: `3d/models/guerreiro_ia.js` (≈400 KB). Reduzido para 16 mil triângulos,
  cor da textura passada para os vértices e dividido em 5 peças (corpo, braços,
  pernas) para animar em `3d/modelos-ia.js`.

## Cuidados para os próximos

- Exportar em **GLB**. Antes de gerar, ver se o app deixa escolher poucos polígonos.
- O Meshy entrega o modelo de braços abertos e sem esqueleto: o jogo abaixa os
  braços e anima andar e golpe sozinho.
- Plano grátis do Meshy: conferir a licença (modelos públicos e crédito ao Meshy).
