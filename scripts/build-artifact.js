// Gera artifact.html: o jogo 3D rodando na raiz (página principal do link do Claude,
// onde o recurso de sala/multiplayer está disponível).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, '3d/index.html'), 'utf8');
html = html.replace(/(src|href)="([^"]+)"/g, (m, attr, url) => {
  if (/^(https?:|#|data:|mailto:)/.test(url)) return m;
  if (url.startsWith('../')) return `${attr}="${url.slice(3)}"`;
  return `${attr}="3d/${url}"`;
});
html = html.replace('<script src="3d/modelkit.js"></script>', '<script>window.GAME_BASE = "3d/";</script>\n<script src="3d/modelkit.js"></script>');
html = html.replace(/navigator\.serviceWorker\.register\('[^']*'\)/, "navigator.serviceWorker.register('sw.js')");
fs.writeFileSync(path.join(root, 'artifact.html'), html);
console.log('artifact.html gerado');
