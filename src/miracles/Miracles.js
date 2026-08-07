import { DIVINE_POWERS } from '../data/Powers.js';
import { PowerManager } from './PowerManager.js';

export class Miracles {
  constructor(world = null) { this.world = world; this.selectedPowerId = null; this.powerManager = new PowerManager(world); }
  isAvailable(id, worldType = this.world?.worldType) { return DIVINE_POWERS.some(power => power.id === id && power.worlds.includes(worldType)); }
  select(id) { if (!this.isAvailable(id)) return false; this.selectedPowerId = this.selectedPowerId === id ? null : id; return true; }
  cast(id, position, choice = null) { if (!this.isAvailable(id)) return false; return this.powerManager.cast(id, position, choice); }
  castSelected(position, choice = null) { return this.selectedPowerId ? this.cast(this.selectedPowerId, position, choice) : false; }
}
