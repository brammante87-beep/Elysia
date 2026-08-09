import { DivineToolbar } from './DivineToolbar.js';

export class MobileDivineToolbar extends DivineToolbar {
  show(root, worldType, miracles, onSelect, onFocus) {
    super.show(root, worldType, miracles, onSelect, onFocus);
    this.element.classList.add('mobile-divine-toolbar');
  }
}
