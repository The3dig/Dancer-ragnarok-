// Reino Quebrado Online: servidor do multiplayer.
//
// Cada "mundo" (por padrão, "reino") é um Durable Object que junta os
// jogadores por WebSocket. O servidor não roda o jogo: cada jogador manda o
// próprio estado (posição, nível, aparência, PvP, dano nos chefes…) e o
// servidor repassa para todos os outros. É o mesmo jeito da "sala" do link do
// Claude, então o jogo funciona igual nos dois.
//
// Usa a hibernação do WebSocket: enquanto ninguém manda nada, o objeto dorme e
// não gasta a cota do plano grátis. O "ping" é respondido sem acordá-lo.
//
// Mensagens do jogo para o servidor:
//   {t:"p", s:{...}}   meu estado (repassado aos outros como {t:"p", peer, s})
// Do servidor para o jogo:
//   {t:"eu", peer}                  o seu código neste mundo
//   {t:"todos", peers:[{peer,s}]}   quem já estava aqui
//   {t:"p", peer, s}                estado novo de alguém
//   {t:"saiu", peer}                alguém saiu
//   {t:"erro", msg}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const MAX = 50;          // jogadores por mundo
const MAX_MSG = 12000;   // tamanho máximo de uma mensagem (bytes)

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const partes = url.pathname.split("/").filter(Boolean);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (partes.length === 0) return new Response("Reino Quebrado Online: servidor ok", { headers: { ...CORS, "content-type": "text/plain; charset=utf-8" } });
    if (partes[0] === "mundo") {
      const nome = (partes[1] || "reino").toLowerCase();
      if (!/^[a-z0-9_-]{2,32}$/.test(nome)) return new Response("nome de mundo inválido", { status: 400, headers: CORS });
      const obj = env.MUNDOS.get(env.MUNDOS.idFromName(nome));
      if (partes[2] === "online") return obj.fetch(new Request(url.origin + "/online"));          // quantos estão jogando (GET)
      if (req.headers.get("Upgrade") !== "websocket") return new Response("use WebSocket", { status: 426, headers: CORS });
      return obj.fetch(req);
    }
    return new Response("não encontrado", { status: 404, headers: CORS });
  },
};

export class Mundo {
  constructor(state) {
    this.state = state;
    // "ping" → "pong" sem acordar o objeto (mantém a conexão viva)
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  vivos() { return this.state.getWebSockets(); }
  dados(ws) { try { return ws.deserializeAttachment() || {}; } catch (e) { return {}; } }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/online") {
      return new Response(JSON.stringify({ online: this.vivos().length }), { headers: { ...CORS, "content-type": "application/json" } });
    }
    const par = new WebSocketPair();
    const [cliente, servidor] = Object.values(par);
    if (this.vivos().length >= MAX) {
      servidor.accept();
      servidor.send(JSON.stringify({ t: "erro", msg: "O mundo está cheio agora. Tente de novo daqui a pouco." }));
      servidor.close(1000, "cheio");
      return new Response(null, { status: 101, webSocket: cliente });
    }
    const peer = crypto.randomUUID().slice(0, 8);
    this.state.acceptWebSocket(servidor);
    servidor.serializeAttachment({ peer, s: null });
    servidor.send(JSON.stringify({ t: "eu", peer }));
    const todos = [];
    for (const ws of this.vivos()) { if (ws === servidor) continue; const d = this.dados(ws); if (d.peer && d.s) todos.push({ peer: d.peer, s: d.s }); }
    servidor.send(JSON.stringify({ t: "todos", peers: todos }));
    return new Response(null, { status: 101, webSocket: cliente });
  }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > MAX_MSG) return;
    let m; try { m = JSON.parse(msg); } catch (e) { return; }
    if (!m || m.t !== "p" || !m.s || typeof m.s !== "object") return;
    const d = this.dados(ws); if (!d.peer) return;
    d.s = m.s;
    try { ws.serializeAttachment(d); } catch (e) { return; }      // estado grande demais: ignora
    this.todosMenos(ws, JSON.stringify({ t: "p", peer: d.peer, s: m.s }));
  }

  async webSocketClose(ws, code) { this.saiu(ws); try { ws.close(code === 1005 ? 1000 : code, "tchau"); } catch (e) {} }
  async webSocketError(ws) { this.saiu(ws); }
  saiu(ws) { const d = this.dados(ws); if (d.peer) this.todosMenos(ws, JSON.stringify({ t: "saiu", peer: d.peer })); }
  todosMenos(eu, txt) { for (const ws of this.vivos()) if (ws !== eu) { try { ws.send(txt); } catch (e) {} } }
}
