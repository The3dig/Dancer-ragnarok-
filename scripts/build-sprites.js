// Gera 3d/sprites.js: os sprites do RPG Kravenox (arte do autor) embutidos em base64.
// Uso: node scripts/build-sprites.js <pasta img do RPG> <pasta com inimigos pré-renderizados>
'use strict';
const fs = require('fs'), path = require('path');
const [IMG, PROC] = process.argv.slice(2);
const DIRS = ['down', 'left', 'right', 'up'];
const want = [];
for (const p of ['k', 't']) {
  for (const d of DIRS) for (const f of [0, 1]) want.push(`${p}_${d}_${f}`);
  for (const d of ['left', 'right']) for (const w of [0, 1, 2, 3]) want.push(`${p}_${d}_w${w}`);
  want.push(`${p}_furia`, `${p}_portrait`);
}
want.push('k_desperto');
const PEOPLE = ['lyra', 'seraphyne', 'erya', 'mae', 'ancia', 'senhora', 'mascate', 'aldeao', 'aldea', 'estranho', 'velha', 'refugiada', 'refugiado', 'origem', 'arkan', 'bibliotecario', 'leitor', 'menina', 'menino'];
for (const n of PEOPLE) for (const d of DIRS) for (const f of [0, 1]) want.push(`s_${n}_${d}_${f}`);
for (const n of ['lyra', 'seraphyne', 'erya', 'mae']) want.push(`p_${n}`);
const ENEMIES = ['eco', 'raizRast', 'sombra', 'fragmento', 'sentinela', 'sentinela1', 'lembranca', 'raizPetra', 'voz', 'ecoGrande', 'maoNevoa', 'cristalizado', 'coisa'];
for (const n of ENEMIES) want.push(`e_${n}`);
for (const f of ['garra1', 'garra2', 'raio', 'espinhos', 'espinhos2', 'explosao', 'orbe']) want.push(`fx_${f}`);
const out = {};
for (const n of want) {
  const f = path.join(IMG, n + '.png');
  if (!fs.existsSync(f)) { console.error('faltando', n); continue; }
  out[n] = fs.readFileSync(f).toString('base64');
}
for (const n of ['larva', 'larvaCristal', 'larvaLonga', 'larvaArmor', 'larvaFogo', 'larvaMae', 'semRosto']) {
  out['e_' + n] = fs.readFileSync(path.join(PROC, n + '.png')).toString('base64');
}
const js = '// Sprites do universo Kravenox (arte do RPG do autor). Gerado por scripts/build-sprites.js\nwindow.SPR=' + JSON.stringify(out) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', '3d', 'sprites.js'), js);
console.log(Object.keys(out).length, 'sprites,', (js.length / 1024).toFixed(0), 'KB');
