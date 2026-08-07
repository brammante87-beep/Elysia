import { CharacterCreator } from '../entities/CharacterCreator.js';
import { WorldTypeId } from '../data/WorldTypes.js';

export class CharacterCreationScreen {
  constructor(documentObject = globalThis.document) { this.document = documentObject; }

  show(root, worldType, onSubmit) {
    const screen = this.document.createElement('section');
    screen.className = 'character-creation-screen celestial-screen';
    screen.innerHTML = `<form class="creation-panel"><p class="screen-kicker">IL PRIMO ESSERE DI ELYSIA</p>
      <h1>Plasma il tuo Prescelto</h1><label>Nome<input name="name" maxlength="${CharacterCreator.MAX_NAME_LENGTH}" required autocomplete="off"></label>
      ${worldType === WorldTypeId.HUMAN ? this.humanFields() : this.beastFields()}
      <p class="creation-error" role="alert"></p><button type="submit">DONAGLI LA VITA</button></form>`;
    const form = screen.querySelector('form');
    form.onsubmit = event => {
      event.preventDefault();
      const values = Object.fromEntries(new this.windowFormData(form));
      try { onSubmit(values); } catch (error) { screen.querySelector('.creation-error').textContent = error.message; }
    };
    root.append(screen);
    screen.querySelector('input').focus();
  }

  get windowFormData() { return this.document.defaultView?.FormData ?? globalThis.FormData; }

  humanFields() {
    return `${this.choice('Caratteristiche sessuali', 'sexCharacteristics', [['male', 'Maschili'], ['female', 'Femminili'], ['intersex', 'Intersessuali']])}
      ${this.choice('Identità di genere', 'genderIdentity', [['man', 'Uomo'], ['woman', 'Donna'], ['nonBinary', 'Non-binaria']])}
      ${this.choice('Orientamento sessuale', 'sexualOrientation', [['heterosexual', 'Eterosessuale'], ['gayLesbian', 'Gay / Lesbica'], ['bisexual', 'Bisessuale']])}`;
  }

  beastFields() { return this.choice('Specie', 'species', [['deer', 'CERVO'], ['cat', 'GATTO'], ['dog', 'CANE']]); }

  choice(title, name, options) {
    return `<fieldset><legend>${title}</legend><div class="choice-pills">${options.map(([value, label], index) =>
      `<label><input type="radio" name="${name}" value="${value}" ${index === 0 ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div></fieldset>`;
  }
}
