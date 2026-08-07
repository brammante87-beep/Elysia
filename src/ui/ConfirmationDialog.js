export class ConfirmationDialog {
  constructor(documentObject = globalThis.document) {
    this.document = documentObject;
    this.element = this.createElement();
  }

  createElement() {
    const dialog = this.document.createElement('div');
    dialog.className = 'confirmation-backdrop';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'confirmation-title');
    dialog.innerHTML = `
      <section class="confirmation-panel">
        <h2 id="confirmation-title">Esiste già una partita salvata.</h2>
        <p>Vuoi davvero iniziare una nuova partita? I progressi attuali verranno sostituiti.</p>
        <div class="confirmation-actions">
          <button type="button" data-action="cancel">ANNULLA</button>
          <button type="button" class="button-danger" data-action="confirm">NUOVA PARTITA</button>
        </div>
      </section>`;
    return dialog;
  }

  open(onConfirm, onCancel, content = {}) {
    this.element.querySelector('h2').textContent = content.title ?? 'Esiste già una partita salvata.';
    this.element.querySelector('p').textContent = content.message ?? 'Vuoi davvero iniziare una nuova partita? I progressi attuali verranno sostituiti.';
    this.element.querySelector('[data-action="cancel"]').textContent = content.cancelLabel ?? 'ANNULLA';
    this.element.querySelector('[data-action="confirm"]').textContent = content.confirmLabel ?? 'NUOVA PARTITA';
    const close = (callback) => {
      this.element.remove();
      callback();
    };
    this.element.querySelector('[data-action="cancel"]').onclick = () => close(onCancel);
    this.element.querySelector('[data-action="confirm"]').onclick = () => close(onConfirm);
    this.element.onkeydown = event => {
      if (event.key === 'Escape') close(onCancel);
    };
    this.document.body.append(this.element);
    this.element.querySelector('[data-action="cancel"]').focus();
  }
}
