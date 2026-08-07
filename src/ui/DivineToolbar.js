import { DIVINE_POWERS } from '../data/Powers.js';

export class DivineToolbar {
  constructor(documentObject) { this.document = documentObject; this.element = null; }
  show(root, worldType, miracles, onSelect) {
    this.element = this.document.createElement('nav'); this.element.className = 'divine-toolbar'; this.element.setAttribute('aria-label', 'Poteri divini');
    const title = this.document.createElement('span'); title.className = 'divine-toolbar__title'; title.textContent = 'POTERI DIVINI'; this.element.append(title);
    const powers = this.document.createElement('div'); powers.className = 'divine-toolbar__powers';
    for (const power of DIVINE_POWERS) { const available = power.worlds.includes(worldType); const button = this.document.createElement('button'); button.type = 'button'; button.dataset.powerId = power.id; button.className = 'divine-power'; button.disabled = !available; button.title = available ? `${power.label} — ${power.description}` : `${power.label} — Non ancora disponibile`; button.setAttribute('aria-label', button.title); button.innerHTML = `<img src="${power.icon}" alt=""><span>${power.label}</span>`; if (available) button.addEventListener('click', () => { miracles.select(power.id); this.update(miracles.selectedPowerId); onSelect?.(miracles.selectedPowerId); }); powers.append(button); }
    this.element.append(powers); root.append(this.element); this.update(miracles.selectedPowerId);
  }
  update(selectedId) { this.element?.querySelectorAll('.divine-power').forEach(button => { const selected = button.dataset.powerId === selectedId; button.classList.toggle('is-selected', selected); button.setAttribute('aria-pressed', String(selected)); }); }
  remove() { this.element?.remove(); this.element = null; }
}
