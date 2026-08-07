import { WorldEntity } from './WorldEntity.js';
import { Config } from '../core/Config.js';

export class Flower extends WorldEntity {
  constructor(data) {
    super({ collisionRadius: .52, kind: 'flower', ...data });
    this.creationCycle = data.creationCycle ?? 1;
    this.creationSimulationTime = data.creationSimulationTime ?? null;
  }

  isReady(currentSimulationTime) { return currentSimulationTime - this.creationSimulationTime + Number.EPSILON >= Config.FLOWER_GROWTH_DURATION_SECONDS; }
}
