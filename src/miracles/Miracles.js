import { DIVINE_POWERS } from '../data/Powers.js';

export class Miracles {
  constructor(world = null) { this.world = world; this.selectedPowerId = null; }
  isAvailable(id, worldType = this.world?.worldType) { return DIVINE_POWERS.some(power => power.id === id && power.worlds.includes(worldType)); }
  select(id) { if (!this.isAvailable(id)) return false; this.selectedPowerId = this.selectedPowerId === id ? null : id; return true; }
  cast(id, position) { if (!this.isAvailable(id)) return false; return this.world.placeEntity(id, position); }
  castSelected(position) { return this.selectedPowerId ? this.cast(this.selectedPowerId, position) : false; }
}
