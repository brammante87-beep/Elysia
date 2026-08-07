export class GameOverScreen {
  constructor(documentObject) { this.document = documentObject; }
  show(root, handlers) {
    const screen = this.document.createElement('section'); screen.className = 'game-over-screen celestial-screen';
    const panel = this.document.createElement('div'); panel.className = 'ending-panel';
    const kicker = this.document.createElement('p'); kicker.className = 'screen-kicker'; kicker.textContent = 'IL SILENZIO DOPO IL CIELO';
    const heading = this.document.createElement('h1'); heading.textContent = 'ELYSIA È MORTA';
    const text = this.document.createElement('p'); text.textContent = "Hai creato un mondo pacifico, ma incapace di difendersi. Quando l’Onnipotente rivale colpì, nessun essere di Elysia poté opporsi.";
    const actions = this.document.createElement('div'); actions.className = 'confirmation-actions';
    for (const [label, handler] of [['TORNA AL MENU', handlers.onMenu], ['NUOVA PARTITA', handlers.onNewGame]]) { const button = this.document.createElement('button'); button.textContent = label; button.addEventListener('click', handler); actions.append(button); }
    panel.append(kicker, heading, text, actions); screen.append(panel); root.append(screen);
  }
}
