import { WorldEntity } from './WorldEntity.js';

export class Flower extends WorldEntity {
  constructor(data) {
    super({ collisionRadius: .52, kind: 'flower', ...data });
    this.creationCycle = data.creationCycle ?? 1;
  }

  isReady(currentCycle) { return currentCycle >= this.creationCycle + 1; }
}
