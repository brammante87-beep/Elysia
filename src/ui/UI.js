import { TitleScreen } from './TitleScreen.js';

export class UI {
  constructor(root) {
    this.root = root;
    this.titleScreen = new TitleScreen(root.ownerDocument ?? globalThis.document);
  }

  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.setAttribute('aria-label', 'Elysia game canvas');
    this.root.append(canvas);
    return canvas;
  }

  showTitle(hasSave, handlers) {
    this.clearScreens();
    this.titleScreen.show(this.root, hasSave, handlers);
  }

  showNewGameConfirmation(onConfirm, onCancel) {
    this.titleScreen.confirmNewGame(onConfirm, onCancel);
  }

  showPlaceholder(lines) {
    this.clearScreens();
    const screen = this.root.ownerDocument.createElement('section');
    screen.className = 'placeholder-screen';
    const heading = this.root.ownerDocument.createElement('h1');
    heading.textContent = lines[0];
    screen.append(heading);
    if (lines[1]) {
      const detail = this.root.ownerDocument.createElement('p');
      detail.textContent = lines[1];
      screen.append(detail);
    }
    this.root.append(screen);
  }

  clearScreens() {
    this.root.querySelectorAll('.title-screen, .placeholder-screen').forEach(screen => screen.remove());
  }
}
