import { ConfirmationDialog } from './ConfirmationDialog.js';

export class WorldSelectionScreen {
  constructor(documentObject = globalThis.document) { this.document = documentObject; }

  show(root, worldTypes, handlers) {
    const screen = this.document.createElement('section');
    screen.className = 'world-selection-screen celestial-screen';
    screen.setAttribute('aria-labelledby', 'world-selection-title');
    const heading = this.document.createElement('div');
    heading.className = 'selection-heading';
    heading.innerHTML = '<p class="screen-kicker">ELYSIA</p><h1 id="world-selection-title">Che cosa diventerà Elysia?</h1>';
    const choices = this.document.createElement('div');
    choices.className = 'world-choices';
    worldTypes.forEach(worldType => choices.append(this.createChoice(worldType, handlers.onSelect)));
    screen.append(heading, choices);
    root.append(screen);
  }

  createChoice(worldType, onSelect) {
    const button = this.document.createElement('button');
    button.type = 'button';
    button.className = `world-choice world-choice-${worldType.id}`;
    button.dataset.worldType = worldType.id;
    button.innerHTML = `<strong>${worldType.label}</strong><span>${worldType.description}</span>`;
    button.onclick = () => onSelect(worldType.id);
    return button;
  }

  confirm(worldType, onConfirm, onCancel) {
    new ConfirmationDialog(this.document).open(onConfirm, onCancel, {
      title: `Hai scelto ${worldType.confirmationLabel}.`,
      message: 'Vuoi affidare Elysia a questo destino?', confirmLabel: 'CONFERMA', cancelLabel: 'INDIETRO',
    });
  }
}
