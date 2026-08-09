import { UI } from './UI.js';
import { MobileDivineToolbar } from './MobileDivineToolbar.js';

export class MobileUI extends UI {
  constructor(root) {
    super(root);
    this.divineToolbar = new MobileDivineToolbar(root.ownerDocument ?? globalThis.document);
  }
}
