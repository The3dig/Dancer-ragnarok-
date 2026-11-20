// Gera docs/atualizacoes.md a partir das novidades de 3d/avisos.js.
// Uso: node scripts/gerar_docs.js
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const s = fs.readFileSync(path.join(raiz, '3d/avisos.js'), 'utf8');
const re = /\{ id: '(n\d+)', data: '([^']*)', t: '((?:[^'\\]|\\.)*)', d: '((?:[^'\\]|\\.)*)' \}/g;
const l = []; let m;
while ((m = re.exec(s))) l.push({ data: m[2], t: m[3].replace(/\\'/g, "'"), d: m[4].replace(/\\'/g, "'") });
const limpa = h => h.replace(/<br\s*\/?>/g, ' ').replace(/<b>(.*?)<\/b>/g, '**$1**').replace(/<i>(.*?)<\/i>/g, '*$1*').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
let o = '# Reino Quebrado Online: atualizações\n\nTudo o que mudou no jogo, da mais nova para a mais antiga (são as mesmas novidades do botão 📢 Avisos, no menu ❓).\n';
let dia = '';
for (const a of l) { if (a.data !== dia) { dia = a.data; o += '\n## ' + dia + '\n\n'; } o += '- **' + limpa(a.t) + '**: ' + limpa(a.d) + '\n'; }
fs.writeFileSync(path.join(raiz, 'docs/atualizacoes.md'), o);
console.log(l.length + ' novidades em docs/atualizacoes.md');
