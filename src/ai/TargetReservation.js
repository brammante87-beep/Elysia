export class TargetReservation {
  constructor() { this.targets = new Map(); }
  reserve(targetId, characterId) { const owner = this.targets.get(targetId); if (owner && owner !== characterId) return false; this.targets.set(targetId, characterId); return true; }
  isReservedByOther(targetId, characterId) { const owner = this.targets.get(targetId); return Boolean(owner && owner !== characterId); }
  releaseFor(characterId) { for (const [target, owner] of this.targets) if (owner === characterId) this.targets.delete(target); }
  releaseTarget(targetId) { this.targets.delete(targetId); }
  clear() { this.targets.clear(); }
}
