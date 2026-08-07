import { WorldEntity } from './WorldEntity.js';
export class Cow extends WorldEntity {
  constructor(data) { super({ collisionRadius: 0.62, kind: 'cow', ...data }); this.foodYield = 1; }
  hunt() { if (!this.alive) return 0; this.alive = false; return this.foodYield; }
}
