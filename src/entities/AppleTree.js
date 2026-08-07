import { WorldEntity } from './WorldEntity.js';

export class AppleTree extends WorldEntity {
  static HARVEST_COOLDOWN = 45;

  constructor(data) {
    super({ collisionRadius: .76, kind: 'appleTree', ...data });
    this.availableFruit = data.availableFruit ?? true;
    this.nextFruitTime = data.nextFruitTime ?? 0;
  }

  update(simulationTime) { if (!this.availableFruit && simulationTime >= this.nextFruitTime) this.availableFruit = true; }
  hunt(simulationTime = 0) { return this.harvest(simulationTime); }
  harvest(simulationTime = 0) {
    if (!this.alive || !this.availableFruit) return 0;
    this.availableFruit = false;
    this.nextFruitTime = simulationTime + AppleTree.HARVEST_COOLDOWN;
    return 1;
  }
}
