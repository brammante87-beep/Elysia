import { WorldEntity } from './WorldEntity.js';
export class WaterSource extends WorldEntity {
  constructor(data) { super({ collisionRadius: 0.8, kind: 'waterSource', ...data }); }
  collect() { return this.alive ? 1 : 0; }
}
