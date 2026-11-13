# Servidor do MMO (Reino Quebrado Online)

Endereço: **https://kravenox-mmo.kravenox.workers.dev**

- Cloudflare Workers + Durable Objects, plano grátis, conta do Rone.
- Cada mundo (`/mundo/reino`) junta os jogadores por WebSocket.
- O servidor só repassa o estado de cada jogador para os outros. É o mesmo
  modelo da sala do link do Claude.
- `GET /mundo/reino/online` mostra quantos estão jogando.
- O jogo usa a sala do Claude quando está aberto no link do Claude e este
  servidor em todos os outros lugares (GitHub Pages, app).

## Publicar

A chave da Cloudflare fica no ambiente "Kravenox jogos" do Claude Code e o
proxy a coloca sozinho. Para publicar, use o wrangler 4 (o 3 dá o erro 10013):

    CLOUDFLARE_API_TOKEN=proxy-injected CLOUDFLARE_ACCOUNT_ID=<id da conta> npx wrangler@4 deploy

O worker `kravenox-duelo` é o do Quadros do Cisma. Não mexer nele.
