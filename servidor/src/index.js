// Reino Quebrado Online: servidor (Cloudflare Workers + Durable Objects, plano grátis).
//
// O jogo é todo on-line:
//  - CONTAS (um Durable Object "principal", SQLite): usuário e senha, sessões,
//    as 3 vagas de personagem de cada conta e os nomes únicos dos personagens.
//  - MUNDO (um Durable Object por mundo, "reino"): junta os jogadores por
//    WebSocket. Repassa o estado de cada um (como a sala do link do Claude) e
//    guarda os MONSTROS COMPARTILHADOS: a vida de cada monstro fica aqui, quem
//    está mais perto "controla" o monstro (a IA roda no jogo dele e a posição
//    vem para cá), o dano de todos chega aqui e o servidor diz quem matou.
//
// Mensagens do jogo para o mundo:
//   {t:"p", s}                         meu estado
//   {t:"semente", l:[{id,type,max,resp,x,z}]}  monstros iniciais (o 1º jogador manda)
//   {t:"m", l:[[id,x,z,f,st]]}         posições dos monstros que eu controlo
//   {t:"d", id, v}                     dei v de dano no monstro id
//   {t:"cura", id, hp}                 (dono) o monstro voltou para casa e se curou
//   {t:"nasceu", id, x, z}             (dono) o monstro renasceu aqui
//   {t:"hb"}                           ainda estou aqui
// Do mundo para o jogo:
//   {t:"eu", peer} · {t:"todos", peers, mobs} · {t:"p", peer, s} · {t:"saiu", peer}
//   {t:"mundo", mobs}                  lista completa de monstros (depois da semente)
//   {t:"m", l}                         posições (de quem controla)
//   {t:"hp", id, hp, by}               vida nova de um monstro
//   {t:"morre", id, by, dano:{peer:v}} o monstro morreu (by = último golpe)
//   {t:"nasce", id}                    (para o dono) faça o monstro renascer
//   {t:"dono", l:[[id, peer]]}         quem controla cada monstro agora
//   {t:"semente?"}                     o mundo está vazio: mande os monstros
//   {t:"erro", msg}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "content-type": "application/json; charset=utf-8" } });
const MAX = 50;          // jogadores por mundo
const MAX_MSG = 24000;   // tamanho máximo de uma mensagem (bytes)

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const partes = url.pathname.split("/").filter(Boolean);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (partes.length === 0) return new Response("Reino Quebrado Online: servidor ok", { headers: { ...CORS, "content-type": "text/plain; charset=utf-8" } });
    const contas = env.CONTAS.get(env.CONTAS.idFromName("principal"));
    if (partes[0] === "conta") return contas.fetch(req);
    if (partes[0] === "mundo") {
      const nome = (partes[1] || "reino").toLowerCase();
      if (!/^[a-z0-9_-]{2,32}$/.test(nome)) return json({ erro: "nome de mundo inválido" }, 400);
      const obj = env.MUNDOS.get(env.MUNDOS.idFromName(nome));
      if (partes[2] === "online") return obj.fetch(new Request(url.origin + "/online"));
      if (req.headers.get("Upgrade") !== "websocket") return json({ erro: "use WebSocket" }, 426);
      // só entra quem está logado
      const r = await contas.fetch(new Request(url.origin + "/conta/valida", { headers: { Authorization: "Bearer " + (url.searchParams.get("token") || "") } }));
      if (!r.ok) return json({ erro: "faça login de novo" }, 401);
      const { usuario } = await r.json();
      const u2 = new URL(req.url); u2.searchParams.set("usuario", usuario); u2.searchParams.delete("token");
      return obj.fetch(new Request(u2, req));
    }
    return json({ erro: "não encontrado" }, 404);
  },
};

// =====================================================================
//  Contas
// =====================================================================
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hashSenha(senha, sal) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(sal), iterations: 20000 }, k, 256);
  return hex(bits);
}

export class Contas {
  constructor(state) {
    this.sql = state.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS contas (usuario TEXT PRIMARY KEY, sal TEXT, hash TEXT, criado INTEGER);
      CREATE TABLE IF NOT EXISTS sessoes (token TEXT PRIMARY KEY, usuario TEXT, criado INTEGER);
      CREATE TABLE IF NOT EXISTS vagas (usuario TEXT, vaga INTEGER, jogo TEXT, vida TEXT, atualizado INTEGER, PRIMARY KEY (usuario, vaga));
      CREATE TABLE IF NOT EXISTS nomes (nome TEXT PRIMARY KEY, usuario TEXT, vaga INTEGER);
      CREATE TABLE IF NOT EXISTS guildas (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT UNIQUE, nomebaixo TEXT UNIQUE, sigla TEXT, emblema TEXT, aviso TEXT, criada INTEGER);
      CREATE TABLE IF NOT EXISTS membros (nome TEXT PRIMARY KEY, exibe TEXT, guilda INTEGER, cargo TEXT, entrou INTEGER);
      CREATE TABLE IF NOT EXISTS convites (nome TEXT, guilda INTEGER, de TEXT, quando INTEGER, PRIMARY KEY (nome, guilda));`);
    try { this.sql.exec("ALTER TABLE guildas ADD COLUMN xp INTEGER DEFAULT 0"); } catch (e) { }      // XP da guilda (nível 1 a 10)
  }
  um(q, ...a) { const r = this.sql.exec(q, ...a).toArray(); return r[0] || null; }
  quem(req) {
    const t = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!/^[a-f0-9]{48}$/.test(t)) return null;
    const s = this.um("SELECT usuario FROM sessoes WHERE token = ?", t);
    return s ? s.usuario : null;
  }
  novaSessao(usuario) {
    const t = hex(crypto.getRandomValues(new Uint8Array(24)));
    this.sql.exec("INSERT INTO sessoes (token, usuario, criado) VALUES (?, ?, ?)", t, usuario, Date.now());
    return t;
  }

  // ---------------- guildas
  // o personagem que está agindo: a vaga da conta e o nome (reserva o nome se o personagem é antigo e não tinha)
  personagem(usuario, vaga, nome) {
    vaga = Number(vaga) || 0; nome = String(nome || "").trim().replace(/\s+/g, " ").slice(0, 16);
    let r = this.um("SELECT nome FROM nomes WHERE usuario = ? AND vaga = ?", usuario, vaga);
    if (!r && nome.length >= 2 && !this.um("SELECT nome FROM nomes WHERE nome = ?", nome.toLowerCase())) { this.sql.exec("INSERT INTO nomes (nome, usuario, vaga) VALUES (?, ?, ?)", nome.toLowerCase(), usuario, vaga); r = { nome: nome.toLowerCase() }; }
    return r ? { baixo: r.nome, exibe: nome && nome.toLowerCase() === r.nome ? nome : r.nome } : null;
  }
  infoGuilda(gid) {
    const g = this.um("SELECT id, nome, sigla, emblema, aviso, criada, COALESCE(xp, 0) AS xp FROM guildas WHERE id = ?", gid); if (!g) return null;
    const membros = this.sql.exec("SELECT nome, exibe, cargo, entrou FROM membros WHERE guilda = ? ORDER BY CASE cargo WHEN 'lider' THEN 0 WHEN 'oficial' THEN 1 ELSE 2 END, entrou", gid).toArray();
    return { ...g, membros };
  }
  async guilda(req, usuario, p, b) {
    const eu = this.personagem(usuario, b.vaga ?? new URL(req.url).searchParams.get("vaga"), b.nome ?? new URL(req.url).searchParams.get("nome"));
    if (!eu) return json({ erro: "Personagem sem nome registrado." }, 400);
    const m = this.um("SELECT guilda, cargo FROM membros WHERE nome = ?", eu.baixo);
    const acao = p[0] || "";
    const pode = (...c) => m && c.includes(m.cargo);
    const alvoDe = (n) => { const a = this.um("SELECT nome, exibe, guilda, cargo FROM membros WHERE nome = ?", String(n || "").toLowerCase()); return a && m && a.guilda === m.guilda ? a : null; };
    if (req.method === "GET" || acao === "ver") {
      const convites = this.sql.exec("SELECT c.guilda AS id, g.nome, g.sigla, g.emblema, c.de FROM convites c JOIN guildas g ON g.id = c.guilda WHERE c.nome = ?", eu.baixo).toArray();
      return json({ eu: eu.exibe, cargo: m ? m.cargo : null, guilda: m ? this.infoGuilda(m.guilda) : null, convites });
    }
    if (acao === "criar") {
      if (m) return json({ erro: "Você já está numa guilda." }, 409);
      const nome = String(b.gnome || "").trim().replace(/\s+/g, " "), sigla = String(b.sigla || "").trim().toUpperCase(), emb = String(b.emblema || "🛡️").slice(0, 4);
      if (nome.length < 3 || nome.length > 20) return json({ erro: "O nome da guilda precisa ter de 3 a 20 letras." }, 400);
      if (!/^[A-Z0-9]{2,4}$/.test(sigla)) return json({ erro: "A sigla precisa ter de 2 a 4 letras ou números." }, 400);
      if (this.um("SELECT id FROM guildas WHERE nomebaixo = ?", nome.toLowerCase())) return json({ erro: "Já existe uma guilda com esse nome." }, 409);
      if (this.um("SELECT id FROM guildas WHERE sigla = ?", sigla)) return json({ erro: "Essa sigla já é de outra guilda." }, 409);
      this.sql.exec("INSERT INTO guildas (nome, nomebaixo, sigla, emblema, aviso, criada) VALUES (?, ?, ?, ?, ?, ?)", nome, nome.toLowerCase(), sigla, emb, "", Date.now());
      const gid = this.um("SELECT id FROM guildas WHERE nomebaixo = ?", nome.toLowerCase()).id;
      this.sql.exec("INSERT INTO membros (nome, exibe, guilda, cargo, entrou) VALUES (?, ?, ?, 'lider', ?)", eu.baixo, eu.exibe, gid, Date.now());
      this.sql.exec("DELETE FROM convites WHERE nome = ?", eu.baixo);
      return json({ ok: true });
    }
    if (acao === "aceitar" || acao === "recusar") {
      const gid = Number(b.guilda), c = this.um("SELECT guilda FROM convites WHERE nome = ? AND guilda = ?", eu.baixo, gid);
      if (!c) return json({ erro: "Esse convite não existe mais." }, 404);
      this.sql.exec("DELETE FROM convites WHERE nome = ? AND guilda = ?", eu.baixo, gid);
      if (acao === "recusar") return json({ ok: true });
      if (m) return json({ erro: "Saia da sua guilda antes de entrar em outra." }, 409);
      if (!this.um("SELECT id FROM guildas WHERE id = ?", gid)) return json({ erro: "Essa guilda acabou." }, 404);
      if (this.um("SELECT COUNT(*) AS n FROM membros WHERE guilda = ?", gid).n >= 50) return json({ erro: "A guilda está cheia (50)." }, 409);
      this.sql.exec("INSERT INTO membros (nome, exibe, guilda, cargo, entrou) VALUES (?, ?, ?, 'membro', ?)", eu.baixo, eu.exibe, gid, Date.now());
      this.sql.exec("DELETE FROM convites WHERE nome = ?", eu.baixo);
      return json({ ok: true });
    }
    if (!m) return json({ erro: "Você não está numa guilda." }, 400);
    if (acao === "convidar") {
      if (!pode("lider", "oficial")) return json({ erro: "Só o líder e os oficiais convidam." }, 403);
      const alvo = String(b.alvo || "").trim().toLowerCase(), existe = this.um("SELECT nome FROM nomes WHERE nome = ?", alvo);
      if (!existe) return json({ erro: "Não existe personagem com esse nome." }, 404);
      if (this.um("SELECT nome FROM membros WHERE nome = ?", alvo)) return json({ erro: "Esse personagem já está numa guilda." }, 409);
      this.sql.exec("INSERT OR REPLACE INTO convites (nome, guilda, de, quando) VALUES (?, ?, ?, ?)", alvo, m.guilda, eu.exibe, Date.now());
      return json({ ok: true });
    }
    if (acao === "sair") {
      this.sql.exec("DELETE FROM membros WHERE nome = ?", eu.baixo);
      if (m.cargo === "lider") {                                   // passa a liderança: oficial mais antigo, senão membro mais antigo; ninguém → acaba
        const prox = this.um("SELECT nome FROM membros WHERE guilda = ? ORDER BY CASE cargo WHEN 'oficial' THEN 0 ELSE 1 END, entrou LIMIT 1", m.guilda);
        if (prox) this.sql.exec("UPDATE membros SET cargo = 'lider' WHERE nome = ?", prox.nome);
        else { this.sql.exec("DELETE FROM guildas WHERE id = ?", m.guilda); this.sql.exec("DELETE FROM convites WHERE guilda = ?", m.guilda); }
      }
      return json({ ok: true });
    }
    if (acao === "desfazer") {
      if (!pode("lider")) return json({ erro: "Só o líder desfaz a guilda." }, 403);
      this.sql.exec("DELETE FROM membros WHERE guilda = ?", m.guilda); this.sql.exec("DELETE FROM convites WHERE guilda = ?", m.guilda); this.sql.exec("DELETE FROM guildas WHERE id = ?", m.guilda);
      return json({ ok: true });
    }
    if (acao === "xp") {                                            // 10% do XP de monstro dos membros vai para a guilda
      const v = Math.max(0, Math.min(200000, Math.round(Number(b.v) || 0)));
      if (v) this.sql.exec("UPDATE guildas SET xp = COALESCE(xp, 0) + ? WHERE id = ?", v, m.guilda);
      return json({ ok: true });
    }
    if (acao === "aviso") {
      if (!pode("lider", "oficial")) return json({ erro: "Só o líder e os oficiais mudam o aviso." }, 403);
      this.sql.exec("UPDATE guildas SET aviso = ? WHERE id = ?", String(b.texto || "").slice(0, 200), m.guilda);
      return json({ ok: true });
    }
    if (acao === "expulsar" || acao === "cargo") {
      const a = alvoDe(b.alvo); if (!a || a.nome === eu.baixo) return json({ erro: "Membro não encontrado." }, 404);
      if (acao === "expulsar") {
        if (!(pode("lider") || (pode("oficial") && a.cargo === "membro"))) return json({ erro: "Você não pode expulsar esse membro." }, 403);
        this.sql.exec("DELETE FROM membros WHERE nome = ?", a.nome); return json({ ok: true });
      }
      if (!pode("lider")) return json({ erro: "Só o líder muda cargos." }, 403);
      const c = String(b.cargo);
      if (c === "lider") { this.sql.exec("UPDATE membros SET cargo = 'lider' WHERE nome = ?", a.nome); this.sql.exec("UPDATE membros SET cargo = 'oficial' WHERE nome = ?", eu.baixo); return json({ ok: true }); }
      if (c !== "oficial" && c !== "membro") return json({ erro: "cargo inválido" }, 400);
      this.sql.exec("UPDATE membros SET cargo = ? WHERE nome = ?", c, a.nome); return json({ ok: true });
    }
    return json({ erro: "ação desconhecida" }, 404);
  }

  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname.split("/").filter(Boolean).slice(1);     // depois de /conta
    const corpo = async () => { try { return await req.json(); } catch (e) { return {}; } };
    try {
      if (p[0] === "criar" && req.method === "POST") {
        const b = await corpo(), usuario = String(b.usuario || "").trim().toLowerCase(), senha = String(b.senha || "");
        if (!/^[a-z0-9_.-]{3,20}$/.test(usuario)) return json({ erro: "O usuário precisa ter de 3 a 20 letras ou números (sem espaço nem acento)." }, 400);
        if (senha.length < 4 || senha.length > 64) return json({ erro: "A senha precisa ter pelo menos 4 caracteres." }, 400);
        if (this.um("SELECT usuario FROM contas WHERE usuario = ?", usuario)) return json({ erro: "Esse usuário já existe. Escolha outro ou entre com a senha." }, 409);
        const sal = hex(crypto.getRandomValues(new Uint8Array(16)));
        this.sql.exec("INSERT INTO contas (usuario, sal, hash, criado) VALUES (?, ?, ?, ?)", usuario, sal, await hashSenha(senha, sal), Date.now());
        return json({ usuario, token: this.novaSessao(usuario) });
      }
      if (p[0] === "entrar" && req.method === "POST") {
        const b = await corpo(), usuario = String(b.usuario || "").trim().toLowerCase(), senha = String(b.senha || "");
        const c = this.um("SELECT sal, hash FROM contas WHERE usuario = ?", usuario);
        if (!c || (await hashSenha(senha, c.sal)) !== c.hash) return json({ erro: "Usuário ou senha errados." }, 401);
        return json({ usuario, token: this.novaSessao(usuario) });
      }
      const usuario = this.quem(req);
      if (!usuario) return json({ erro: "Faça login de novo." }, 401);
      if (p[0] === "valida") return json({ usuario });
      if (p[0] === "sair" && req.method === "POST") { this.sql.exec("DELETE FROM sessoes WHERE token = ?", (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "")); return json({ ok: true }); }
      if (p[0] === "eu" && req.method === "GET") {
        const vagas = this.sql.exec("SELECT vaga, jogo, vida, atualizado FROM vagas WHERE usuario = ? ORDER BY vaga", usuario).toArray();
        return json({ usuario, vagas });
      }
      if (p[0] === "vaga") {
        const i = Number(p[1]);
        if (!(i >= 0 && i < 3)) return json({ erro: "vaga inválida" }, 400);
        if (req.method === "PUT") {
          const b = await corpo(), jogo = typeof b.jogo === "string" ? b.jogo : null, vida = typeof b.vida === "string" ? b.vida : null;
          if (!jogo || jogo.length > 400000 || (vida && vida.length > 400000)) return json({ erro: "dados grandes demais" }, 413);
          this.sql.exec("INSERT INTO vagas (usuario, vaga, jogo, vida, atualizado) VALUES (?, ?, ?, ?, ?) ON CONFLICT (usuario, vaga) DO UPDATE SET jogo = excluded.jogo, vida = COALESCE(excluded.vida, vagas.vida), atualizado = excluded.atualizado", usuario, i, jogo, vida, Date.now());
          return json({ ok: true });
        }
        if (req.method === "DELETE") {
          this.sql.exec("DELETE FROM vagas WHERE usuario = ? AND vaga = ?", usuario, i);
          this.sql.exec("DELETE FROM nomes WHERE usuario = ? AND vaga = ?", usuario, i);
          return json({ ok: true });
        }
      }
      if (p[0] === "guilda") return this.guilda(req, usuario, p.slice(1), await corpo());
      if (p[0] === "nome" && req.method === "POST") {                // reserva o nome do personagem (único no mundo)
        const b = await corpo(), nome = String(b.nome || "").trim().replace(/\s+/g, " ").slice(0, 16), low = nome.toLowerCase(), vaga = Number(b.vaga) || 0;
        if (nome.length < 2) return json({ erro: "Nome curto demais." }, 400);
        const d = this.um("SELECT usuario, vaga FROM nomes WHERE nome = ?", low);
        if (d && !(d.usuario === usuario && d.vaga === vaga)) return json({ erro: `"${nome}" já existe. Escolha outro nome.` }, 409);
        this.sql.exec("DELETE FROM nomes WHERE usuario = ? AND vaga = ?", usuario, vaga);
        this.sql.exec("INSERT OR REPLACE INTO nomes (nome, usuario, vaga) VALUES (?, ?, ?)", low, usuario, vaga);
        return json({ ok: true });
      }
      return json({ erro: "não encontrado" }, 404);
    } catch (e) {
      return json({ erro: "erro no servidor: " + String(e && e.message || e).slice(0, 120) }, 500);
    }
  }
}

// =====================================================================
//  Mundo: jogadores e monstros compartilhados
// =====================================================================
export class Mundo {
  constructor(state) {
    this.state = state;
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    this.mobs = new Map();       // id -> {id,type,max,hp,resp,x,z,f,st,vivo,volta,dono,dano:{}}
    this.donoT = 0;
  }
  vivos() { return this.state.getWebSockets(); }
  dados(ws) { try { return ws.deserializeAttachment() || {}; } catch (e) { return {}; } }
  enviar(ws, o) { try { ws.send(typeof o === "string" ? o : JSON.stringify(o)); } catch (e) {} }
  todos(o, menos) { const t = JSON.stringify(o); for (const ws of this.vivos()) if (ws !== menos) this.enviar(ws, t); }
  listaMobs() { return [...this.mobs.values()].map((m) => ({ id: m.id, type: m.type, max: m.max, hp: m.hp, x: m.x, z: m.z, f: m.f, vivo: m.vivo, dono: m.dono })); }
  wsDe(peer) { for (const ws of this.vivos()) if (this.dados(ws).peer === peer) return ws; return null; }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/online") return json({ online: this.vivos().length, monstros: this.mobs.size });
    const par = new WebSocketPair();
    const [cliente, servidor] = Object.values(par);
    if (this.vivos().length >= MAX) {
      servidor.accept(); this.enviar(servidor, { t: "erro", msg: "O mundo está cheio agora. Tente de novo daqui a pouco." }); servidor.close(1000, "cheio");
      return new Response(null, { status: 101, webSocket: cliente });
    }
    const usuario = url.searchParams.get("usuario") || "";
    // a mesma conta entrando de novo derruba a conexão antiga
    for (const ws of this.vivos()) if (this.dados(ws).usuario === usuario) { this.enviar(ws, { t: "erro", msg: "Sua conta entrou em outro aparelho." }); try { ws.close(4001, "outro aparelho"); } catch (e) {} }
    const peer = crypto.randomUUID().slice(0, 8);
    this.state.acceptWebSocket(servidor);
    servidor.serializeAttachment({ peer, usuario, s: null });
    this.enviar(servidor, { t: "eu", peer });
    const peers = [];
    for (const ws of this.vivos()) { if (ws === servidor) continue; const d = this.dados(ws); if (d.peer && d.s) peers.push({ peer: d.peer, s: d.s }); }
    this.enviar(servidor, { t: "todos", peers, mobs: this.mobs.size ? this.listaMobs() : null });
    if (!this.mobs.size) this.enviar(servidor, { t: "semente?" });
    return new Response(null, { status: 101, webSocket: cliente });
  }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > MAX_MSG) return;
    let m; try { m = JSON.parse(msg); } catch (e) { return; }
    if (!m || typeof m.t !== "string") return;
    const d = this.dados(ws); if (!d.peer) return;
    const agora = Date.now();
    if (m.t === "p" && m.s && typeof m.s === "object") {
      d.s = m.s; try { ws.serializeAttachment(d); } catch (e) { return; }
      this.todos({ t: "p", peer: d.peer, s: m.s }, ws);
    } else if (m.t === "semente" && Array.isArray(m.l) && !this.mobs.size) {
      for (const o of m.l.slice(0, 600)) {
        if (!o || typeof o.id !== "string" || typeof o.type !== "string") continue;
        const max = Math.max(1, Math.min(5e6, Number(o.max) || 1));
        this.mobs.set(o.id, { id: o.id, type: o.type, max, hp: Math.min(max, Number(o.hp) || max), resp: Math.max(5, Math.min(3600, Number(o.resp) || 20)), x: +o.x || 0, z: +o.z || 0, f: 0, st: 0, vivo: o.vivo !== false, volta: 0, dono: d.peer, dano: {} });
      }
      this.todos({ t: "mundo", mobs: this.listaMobs() });
    } else if (m.t === "m" && Array.isArray(m.l)) {
      const out = [];
      for (const e of m.l.slice(0, 300)) {
        const mob = Array.isArray(e) && this.mobs.get(e[0]);
        if (!mob || mob.dono !== d.peer || !mob.vivo) continue;
        mob.x = +e[1] || mob.x; mob.z = +e[2] || mob.z; mob.f = +e[3] || 0; mob.st = e[4] | 0; out.push(e);
      }
      if (out.length) this.todos({ t: "m", l: out }, ws);
    } else if (m.t === "d" && typeof m.id === "string") {
      const mob = this.mobs.get(m.id), v = Math.max(0, Math.min(1e6, Number(m.v) || 0));
      if (!mob || !mob.vivo || !v) return;
      mob.hp -= v; mob.dano[d.peer] = (mob.dano[d.peer] || 0) + v;
      if (mob.hp <= 0) {
        mob.hp = 0; mob.vivo = false; mob.volta = agora + mob.resp * 1000;
        this.todos({ t: "morre", id: mob.id, by: d.peer, dano: mob.dano });
        mob.dano = {};
      } else this.todos({ t: "hp", id: mob.id, hp: mob.hp, by: d.peer });
    } else if (m.t === "cura" && typeof m.id === "string") {
      const mob = this.mobs.get(m.id);
      if (mob && mob.vivo && mob.dono === d.peer) { mob.hp = Math.max(1, Math.min(mob.max, Number(m.hp) || mob.hp)); mob.dano = {}; this.todos({ t: "hp", id: mob.id, hp: mob.hp, by: null }); }
    } else if (m.t === "nasceu" && typeof m.id === "string") {
      const mob = this.mobs.get(m.id);
      if (mob && !mob.vivo && mob.dono === d.peer && mob.volta && agora >= mob.volta - 2000) {
        mob.vivo = true; mob.hp = mob.max; mob.x = +m.x || mob.x; mob.z = +m.z || mob.z; mob.volta = 0; mob.dano = {};
        this.todos({ t: "mundo1", mob: { id: mob.id, type: mob.type, max: mob.max, hp: mob.hp, x: mob.x, z: mob.z, f: 0, vivo: true, dono: mob.dono } });
      }
    }
    // a cada pouco: monstros que voltam e quem controla cada um
    if (agora - this.donoT > 1000) { this.donoT = agora; this.tique(agora); }
  }

  tique(agora) {
    const gente = [];
    for (const ws of this.vivos()) { const d = this.dados(ws); if (d.peer && d.s && typeof d.s.x === "number" && d.s.st !== "d") gente.push({ peer: d.peer, x: d.s.x, z: d.s.z }); }
    const todosPeers = new Set(this.vivos().map((ws) => this.dados(ws).peer));
    if (!gente.length) return;
    const perto = (x, z) => { let b = null, bd = 1e9; for (const g of gente) { const dd = Math.hypot(g.x - x, g.z - z); if (dd < bd) { bd = dd; b = g; } } return [b, bd]; };
    const mud = [];
    for (const mob of this.mobs.values()) {
      const [g, dd] = perto(mob.x, mob.z);
      let dono = mob.dono;
      if (!todosPeers.has(dono)) dono = g.peer;
      else if (g.peer !== dono) { const atual = gente.find((o) => o.peer === dono); const da = atual ? Math.hypot(atual.x - mob.x, atual.z - mob.z) : 1e9; if (dd + 8 < da) dono = g.peer; }
      if (dono !== mob.dono) { mob.dono = dono; mud.push([mob.id, dono]); }
      if (!mob.vivo && mob.volta && agora >= mob.volta && !mob.pedido) {
        mob.pedido = agora; const w = this.wsDe(mob.dono); if (w) this.enviar(w, { t: "nasce", id: mob.id });
      }
      if (mob.pedido && agora - mob.pedido > 8000) mob.pedido = 0;      // o dono não respondeu: pede de novo
      if (mob.vivo) mob.pedido = 0;
    }
    if (mud.length) this.todos({ t: "dono", l: mud });
  }

  async webSocketClose(ws, code) { this.saiu(ws); try { ws.close(code === 1005 ? 1000 : code, "tchau"); } catch (e) {} }
  async webSocketError(ws) { this.saiu(ws); }
  saiu(ws) {
    const d = this.dados(ws); if (!d.peer) return;
    this.todos({ t: "saiu", peer: d.peer }, ws);
    if (this.vivos().filter((w) => w !== ws).length === 0) this.mobs.clear();      // mundo vazio: o próximo a entrar manda a semente de novo
    else this.tique(Date.now());
  }
}
