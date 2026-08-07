import { WorldTypeId } from '../data/WorldTypes.js';

export class PlantWorldProgression {
  static Threshold = 10;
  static Duration = 7.2;
  constructor(world) { this.world = world; this.triggered = false; this.complete = false; this.elapsed = 0; this.triggerCount = 0; }
  canCast() { return !this.triggered; }
  notifyTreeCreated() { if (this.world.worldType !== WorldTypeId.PLANT || this.triggered || this.world.playerCreatedTreeCount < PlantWorldProgression.Threshold) return false; this.triggered = true; this.triggerCount += 1; return true; }
  update(deltaTime) { if (!this.triggered || this.complete) return; this.elapsed += deltaTime; if (this.elapsed >= PlantWorldProgression.Duration) this.complete = true; }
  phase() { if (!this.triggered) return 'peaceful'; if (this.elapsed < 1.2) return 'calm'; if (this.elapsed < 3.3) return 'rival'; if (this.elapsed < 5.2) return 'meteor'; return this.complete ? 'destroyed' : 'impact'; }
  toJSON() { return { triggered: this.triggered, complete: this.complete, elapsed: this.complete ? PlantWorldProgression.Duration : 0, triggerCount: this.triggerCount }; }
  restore(data = {}) { this.triggered = Boolean(data.triggered); this.complete = Boolean(data.complete); this.elapsed = this.complete ? PlantWorldProgression.Duration : 0; this.triggerCount = data.triggerCount ?? (this.triggered ? 1 : 0); }
}
