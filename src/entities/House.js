import { Hut } from './Hut.js';

export class House extends Hut {
  constructor(data) { super(data); this.kind = 'house'; this.householdId = data.householdId ?? null; this.transformationAge = data.transformationAge ?? 0; }
  update(deltaTime) { this.transformationAge = Math.min(1.4, this.transformationAge + deltaTime); }
}
