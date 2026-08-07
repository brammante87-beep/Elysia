import { ConfirmationDialog } from './ConfirmationDialog.js';

export class TitleScreen {
  constructor(documentObject = globalThis.document) {
    this.document = documentObject;
    this.element = this.createElement();
  }

  createElement() {
    const screen = this.document.createElement('section');
    screen.className = 'title-screen';
    screen.setAttribute('aria-labelledby', 'elysia-title');
    screen.innerHTML = `
      <div class="title-content">
        <p class="title-kicker">Un mondo attende il tuo volere</p>
        <h1 id="elysia-title">ELYSIA</h1>
        <nav class="title-menu" aria-label="Menu principale">
          <button type="button" data-action="new-game">NUOVA PARTITA</button>
          <button type="button" data-action="continue">CONTINUA</button>
        </nav>
      </div>
      <small class="version">Alpha 0.0.2</small>`;
    return screen;
  }

  show(root, hasSave, handlers) {
    const continueButton = this.element.querySelector('[data-action="continue"]');
    continueButton.hidden = !hasSave;
    continueButton.onclick = handlers.onContinue;
    this.element.querySelector('[data-action="new-game"]').onclick = handlers.onNewGame;
    root.append(this.element);
  }

  confirmNewGame(onConfirm, onCancel) {
    new ConfirmationDialog(this.document).open(onConfirm, onCancel);
  }
}
