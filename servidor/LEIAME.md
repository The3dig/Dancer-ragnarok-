# Servidor do MMO (Reino Quebrado Online)

Endereço: **https://kravenox-mmo.kravenox.workers.dev**

O jogo é **todo on-line**. Roda em Cloudflare Workers + Durable Objects
(SQLite), no plano grátis, na conta do Rone.

- **Contas** (`/conta/...`):
  - Usuário e senha (senha guardada com PBKDF2).
  - As 3 vagas de personagem de cada conta.
  - Nomes únicos de personagem.
  - Rotas: `criar`, `entrar`, `eu`, `vaga/<0-2>` (PUT/DELETE), `nome`, `sair`.
  - **Guildas** (`/conta/guilda`): ver, `criar`, `convidar`, `aceitar`/`recusar`,
    `sair`, `desfazer`, `aviso`, `expulsar`, `cargo` (líder, oficial, membro).
    No máximo 50 membros.
- **Mundo** (`/mundo/reino?token=...`):
  - Só entra quem está logado.
  - O servidor repassa o estado de cada jogador para os outros e guarda os
    **monstros compartilhados**.
  - Ele guarda a vida de cada monstro, recebe o dano de todos e diz quem
    matou. Quem está mais perto controla a IA do monstro.
  - O 1º jogador manda a lista inicial de monstros (a "semente").
- `GET /mundo/reino/online` mostra quantos estão jogando e quantos monstros
  existem.

## Publicar

A chave da Cloudflare fica no ambiente "Kravenox jogos" do Claude Code e o
proxy a coloca sozinho. Para publicar, use o wrangler 4 (o 3 dá o erro 10013):

    CLOUDFLARE_API_TOKEN=proxy-injected CLOUDFLARE_ACCOUNT_ID=<id da conta> npx wrangler@4 deploy

O worker `kravenox-duelo` é o do Quadros do Cisma. Não mexer nele.
