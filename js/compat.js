// Compatibilidade com iPhones / navegadores mais antigos.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.min(typeof r === 'number' ? r : 0, Math.abs(w) / 2, Math.abs(h) / 2);
    this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); return this;
  };
}
// iOS: o áudio só pode começar depois de um toque — destrava no primeiro toque.
['touchend', 'pointerup', 'keydown'].forEach(ev => addEventListener(ev, function unlock() {
  if (window.Audio8) Audio8.init();
}, { once: true, passive: true }));
