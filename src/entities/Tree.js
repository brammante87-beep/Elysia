import { WorldEntity } from './WorldEntity.js';
export class Tree extends WorldEntity {
  constructor(data) { super({ collisionRadius: 0.72, kind: 'tree', ...data }); this.resourceYield = 1; this.harvestable = data.harvestable ?? data.alive ?? true; this.playerCreated = data.playerCreated ?? false; this.burning = data.burning ?? false; }
  harvest() { if (!this.harvestable || this.burning) return 0; this.harvestable = false; this.alive = false; return this.resourceYield; }
}
