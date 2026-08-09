import { WorldEntity } from './WorldEntity.js';
export class WaterSource extends WorldEntity {
  constructor(data) { super({ collisionRadius: 0.8, kind: 'waterSource', ...data }); this.dry = data.dry ?? false; this.claimedBySettlementId = data.claimedBySettlementId ?? null; this.reservedByFoundingId = data.reservedByFoundingId ?? null; }
  collect() { return this.alive && !this.dry ? 1 : 0; }
}
