import { Config } from '../core/Config.js';

export class WorldTime {
  static Phases = Object.freeze({ DAWN: 'dawn', DAY: 'day', DUSK: 'dusk', NIGHT: 'night' });

  constructor(data = {}) {
    this.cycle = Math.max(1, data.cycle ?? 1);
    this.elapsed = Math.max(0, data.elapsed ?? 0) % Config.WORLD_CYCLE_SECONDS;
    this.phase = this.phaseAt(this.elapsed);
  }

  update(deltaTime, playing = true) {
    if (!playing || deltaTime <= 0) return [];
    const transitions = [];
    let remaining = deltaTime;
    while (remaining > 0) {
      const boundary = this.nextBoundary();
      const step = Math.min(remaining, boundary - this.elapsed);
      this.elapsed += step; remaining -= step;
      if (this.elapsed + Number.EPSILON >= Config.WORLD_CYCLE_SECONDS) {
        this.elapsed = 0; this.cycle += 1;
      }
      const next = this.phaseAt(this.elapsed);
      if (next !== this.phase) { this.phase = next; transitions.push(next); }
      if (step === 0) break;
    }
    return transitions;
  }

  phaseAt(seconds) {
    if (seconds < Config.DAWN_DURATION_SECONDS) return WorldTime.Phases.DAWN;
    if (seconds < Config.DAY_DURATION_SECONDS - Config.DUSK_DURATION_SECONDS) return WorldTime.Phases.DAY;
    if (seconds < Config.DAY_DURATION_SECONDS) return WorldTime.Phases.DUSK;
    return WorldTime.Phases.NIGHT;
  }

  nextBoundary() {
    const boundaries = [Config.DAWN_DURATION_SECONDS, Config.DAY_DURATION_SECONDS - Config.DUSK_DURATION_SECONDS,
      Config.DAY_DURATION_SECONDS, Config.WORLD_CYCLE_SECONDS];
    return boundaries.find(value => value > this.elapsed) ?? Config.WORLD_CYCLE_SECONDS;
  }

  lighting() {
    const phaseProgress = this.phase === WorldTime.Phases.DAWN ? this.elapsed / Config.DAWN_DURATION_SECONDS
      : this.phase === WorldTime.Phases.DUSK ? (this.elapsed - (Config.DAY_DURATION_SECONDS - Config.DUSK_DURATION_SECONDS)) / Config.DUSK_DURATION_SECONDS
        : this.phase === WorldTime.Phases.NIGHT ? (this.elapsed - Config.DAY_DURATION_SECONDS) / Config.NIGHT_DURATION_SECONDS : 0;
    return { phase: this.phase, progress: Math.max(0, Math.min(1, phaseProgress)) };
  }

  toJSON() { return { cycle: this.cycle, elapsed: this.elapsed, phase: this.phase }; }
}
