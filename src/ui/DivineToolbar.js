import { DIVINE_POWERS } from '../data/Powers.js';
import { PowerManifestations } from '../data/PowerManifestations.js';

export class DivineToolbar {
  constructor(documentObject, presentation = null) { this.document = documentObject; this.presentation = presentation; this.element = null; }
  show(root, worldType, miracles, onSelect, onFocus) {
    this.element = this.document.createElement('nav'); this.element.className = 'divine-toolbar'; this.element.setAttribute('aria-label', 'Poteri divini');
    const title = this.document.createElement('span'); title.className = 'divine-toolbar__title'; title.textContent = 'POTERI DIVINI'; this.element.append(title);
    const focus = this.document.createElement('button'); focus.type = 'button'; focus.className = 'camera-focus'; focus.textContent = '◎'; focus.title = 'Centra sul Prescelto'; focus.setAttribute('aria-label', focus.title); focus.addEventListener('click', () => onFocus?.()); this.element.append(focus);
    const powers = this.document.createElement('div'); powers.className = 'divine-toolbar__powers';
    for (const basePower of DIVINE_POWERS) { const resolved = PowerManifestations.resolve(basePower, worldType); const power = this.presentation?.isFamily && resolved.id === 'changeSex' ? { ...resolved, label: 'TRASFORMA', description: 'Trasforma magicamente un essere.' } : resolved; const available = power.worlds.includes(worldType); const button = this.document.createElement('button'); button.type = 'button'; button.dataset.powerId = power.id; button.className = 'divine-power'; button.disabled = !available; button.title = available ? `${power.label} — ${power.description}` : `${power.label} — Non ancora disponibile`; button.setAttribute('aria-label', button.title); button.innerHTML = `<img src="${power.icon}" alt=""><span>${power.label}</span>`; if (available) button.addEventListener('click', () => { miracles.select(power.id); this.update(miracles.selectedPowerId); onSelect?.(miracles.selectedPowerId); }); powers.append(button); }
    this.element.append(powers); root.append(this.element); this.update(miracles.selectedPowerId);
  }
  update(selectedId) { this.element?.querySelectorAll('.divine-power').forEach(button => { const selected = button.dataset.powerId === selectedId; button.classList.toggle('is-selected', selected); button.setAttribute('aria-pressed', String(selected)); }); }
  remove() { this.element?.remove(); this.element = null; }
}
