import { UI } from './UI.js';
import { MobileDivineToolbar } from './MobileDivineToolbar.js';

export class MobileUI extends UI {
  constructor(root, presentation = null) {
    super(root, presentation);
    this.divineToolbar = new MobileDivineToolbar(root.ownerDocument ?? globalThis.document, presentation);
  }
}
