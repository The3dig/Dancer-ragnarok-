// Copia os arquivos do jogo para www/ (pasta usada pelo Capacitor e pelo GitHub Pages).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'www');
const ITEMS = ['index.html', 'manifest.webmanifest', 'sw.js', '.nojekyll', 'css', 'js', '3d', 'icons', 'musica'];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const it of ITEMS) fs.cpSync(path.join(root, it), path.join(out, it), { recursive: true });
console.log('www/ pronto:', ITEMS.join(', '));
