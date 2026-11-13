// =====================================================================
//  Nuvem: contas (usuário e senha) e personagens guardados no servidor.
//  O jogo é todo on-line: entra com a conta, baixa as 3 vagas do servidor
//  para a memória do aparelho e manda de volta sozinho enquanto joga.
//  A memória do aparelho vira só uma cópia (se o celular quebrar, nada se perde).
// =====================================================================
'use strict';
const Nuvem = (() => {
  const m = /[?&]servidor=(wss?:\/\/[^&#]+)/.exec(location.search);
  const WS = m ? decodeURIComponent(m[1]).replace(/\/mundo.*$/, '') : 'wss://kravenox-mmo.kravenox.workers.dev';
  const BASE = WS.replace(/^ws/, 'http');
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { } };
  let token = get('reino-token'), usuario = get('reino-usuario');
  const enviado = {};
  let parado = false;                                  // a conta entrou em outro aparelho: este para de salvar                                  // o que já foi para o servidor (para não mandar igual)

  async function api(metodo, caminho, corpo, extra = {}) {
    let r;
    try {
      r = await fetch(BASE + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined, ...extra });
    } catch (e) { const er = new Error('Sem conexão com o servidor do Reino. Confira a internet.'); er.rede = true; throw er; }
    let j = {}; try { j = await r.json(); } catch (e) { }
    if (!r.ok) { const er = new Error(j.erro || 'Erro ' + r.status); er.status = r.status; throw er; }
    return j;
  }
  async function entrar(u, s, criar) {
    const j = await api('POST', criar ? '/conta/criar' : '/conta/entrar', { usuario: u, senha: s });
    token = j.token; usuario = j.usuario; set('reino-token', token); set('reino-usuario', usuario);
    return j;
  }
  // baixa as vagas da conta para o aparelho. Na 1ª vez, os personagens que já
  // estavam neste aparelho (de antes do jogo ser on-line) sobem para a conta.
  async function baixar() {
    let j = await api('GET', '/conta/eu');
    const dono = get('reino-dono'), locais = [0, 1, 2].filter(i => get('reino-slot-' + i));
    let subiu = 0;
    if (!dono && locais.length) {                       // personagens de antes do jogo ser on-line: sobem para vagas livres da conta
      const livres = [0, 1, 2].filter(i => !j.vagas.some(v => v.vaga === i)), sobra = [];
      for (const i of locais) {
        const k = livres.includes(i) ? i : (livres.find(x => !locais.includes(x)) ?? livres[0]);
        if (k == null) { sobra.push(i); continue; }
        livres.splice(livres.indexOf(k), 1);
        await api('PUT', '/conta/vaga/' + k, { jogo: get('reino-slot-' + i), vida: get('reino-vida-v1-' + i) }); subiu++;
      }
      for (const i of sobra) { set('reino-reserva-' + i, get('reino-slot-' + i)); set('reino-reserva-vida-' + i, get('reino-vida-v1-' + i)); }   // sem vaga livre: guarda uma cópia
      j = await api('GET', '/conta/eu');
    }
    for (let i = 0; i < 3; i++) { set('reino-slot-' + i, null); set('reino-vida-v1-' + i, null); }
    for (const v of j.vagas) { set('reino-slot-' + v.vaga, v.jogo); if (v.vida) set('reino-vida-v1-' + v.vaga, v.vida); }
    for (let i = 0; i < 3; i++) enviado[i] = (get('reino-slot-' + i) || '') + '|' + (get('reino-vida-v1-' + i) || '');
    set('reino-dono', usuario);
    return { subiu };
  }
  // manda a vaga para o servidor se mudou
  let enviando = false;
  async function enviar(i, sair) {
    if (!token || i == null || enviando || parado) return;
    const jogo = get('reino-slot-' + i); if (!jogo) return;
    const vida = get('reino-vida-v1-' + i), k = jogo + '|' + (vida || '');
    if (enviado[i] === k) return;
    enviando = true;
    try { await api('PUT', '/conta/vaga/' + i, { jogo, vida }, sair ? { keepalive: jogo.length + (vida || '').length < 60000 } : {}); enviado[i] = k; }
    catch (e) { if (e.status === 401) avisoLogin(); }
    finally { enviando = false; }
  }
  const atual = () => typeof Contas !== 'undefined' ? Contas.slot : 0;
  setInterval(() => { if (typeof running !== 'undefined' && running) { try { save(); } catch (e) { } enviar(atual()); } }, 15000);
  addEventListener('visibilitychange', () => { if (document.hidden && typeof running !== 'undefined' && running) { try { save(); } catch (e) { } enviar(atual(), true); } });
  addEventListener('pagehide', () => { if (typeof running !== 'undefined' && running) { try { save(); } catch (e) { } enviar(atual(), true); } });

  async function apagar(i) { await api('DELETE', '/conta/vaga/' + i); delete enviado[i]; }
  async function nome(n, vaga) { await api('POST', '/conta/nome', { nome: n, vaga }); }
  async function sair() { try { await enviar(atual(), true); await api('POST', '/conta/sair'); } catch (e) { } token = null; set('reino-token', null); set('reino-usuario', null); location.reload(); }
  function avisoLogin() { token = null; set('reino-token', null); if (typeof log === 'function') log('🔑 Sua sessão acabou. Entre de novo com usuário e senha.', 'bad'); setTimeout(() => location.reload(), 2500); }
  async function valida() { try { await api('GET', '/conta/valida'); return true; } catch (e) { if (e.status === 401) return false; return null; } }
  return { parar() { parado = true; }, entrar, baixar, enviar, apagar, nome, sair, valida, avisoLogin, WS, get logado() { return !!token; }, get token() { return token; }, get usuario() { return usuario; } };
})();
