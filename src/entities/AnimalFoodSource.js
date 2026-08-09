import { WorldEntity } from './WorldEntity.js';
import { Config } from '../core/Config.js';
export class AnimalFoodSource extends WorldEntity {
  constructor(data) { super({ collisionRadius: .7, kind: 'animalFood', ...data }); this.remainingYield = data.remainingYield ?? Config.ANIMAL_FOOD_YIELD; this.spoiled = data.spoiled ?? false; }
  collect() { if (!this.alive || this.spoiled || this.remainingYield <= 0) return 0; this.remainingYield -= 1; if (this.remainingYield === 0) this.alive = false; return 1; }
  hunt() { return this.collect(); }
}
