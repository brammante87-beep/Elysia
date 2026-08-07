export class UI {
  constructor(root) { this.root = root; }

  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.setAttribute('aria-label', 'Elysia game canvas');
    this.root.replaceChildren(canvas);
    return canvas;
  }
}
