import { Input } from './Input.js';

export class MobileInput extends Input {
  constructor(canvas) {
    super(canvas);
    this.dragThreshold = 10;
  }
}
