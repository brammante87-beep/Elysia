import { PresentationMode } from './PresentationMode.js';

export class EntryPresentation {
  static FAMILY_PARAMETER = 'familyEntry';

  constructor(locationObject = globalThis.location) { this.location = locationObject; }

  mode() {
    const parameters = new URLSearchParams(this.location?.search ?? '');
    return parameters.get(EntryPresentation.FAMILY_PARAMETER) === '1' ? PresentationMode.FAMILY : PresentationMode.STANDARD;
  }

  modeLockedByEntry() { return this.mode() === PresentationMode.FAMILY; }
}
