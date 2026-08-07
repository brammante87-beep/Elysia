import { WorldEntity } from './WorldEntity.js';
import { ResourceStorage } from '../resources/ResourceStorage.js';
export class Hut extends WorldEntity {
  constructor(data) { super({ collisionRadius: 1.25, kind: 'hut', ...data }); this.completed = data.completed ?? true; this.buildProgress = data.buildProgress ?? 1; this.visualVariant = data.visualVariant ?? 'hut'; this.householdId = data.householdId ?? null; this.settlementId = data.settlementId ?? null; this.occupancy = data.occupancy ?? (this.householdId ? 'occupied' : 'vacant'); this.storage = new ResourceStorage(data.storage?.values ?? data.storage ?? {}, data.storage?.capacity ?? 6); }
  toJSON() { return { ...super.toJSON(), storage: this.storage.toJSON() }; }
}
