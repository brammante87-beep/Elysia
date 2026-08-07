import { Config } from '../core/Config.js';

export class WorldTime {
  static Phases = Object.freeze({ DAWN: 'dawn', DAY: 'day', DUSK: 'dusk', NIGHT: 'night' });

  constructor(data = {}) {
    this.cycle = Math.max(1, data.cycle ?? 1);
    this.elapsed = this.restoreElapsed(data);
    this.phase = this.phaseAt(this.elapsed);
  }

  restoreElapsed(data) {
    const elapsed = Math.max(0, Number(data.elapsed) || 0);
    if (data.timingVersion === 2 || !data.phase) return elapsed % Config.WORLD_CYCLE_SECONDS;
    const legacy = { dawn: [0, 15], day: [15, 225], dusk: [225, 15], night: [240, 60] }[data.phase];
    const current = { dawn: [0, Config.DAWN_DURATION_SECONDS], day: [Config.DAWN_DURATION_SECONDS, Config.FULL_DAY_DURATION_SECONDS], dusk: [Config.DAY_DURATION_SECONDS - Config.DUSK_DURATION_SECONDS, Config.DUSK_DURATION_SECONDS], night: [Config.DAY_DURATION_SECONDS, Config.NIGHT_DURATION_SECONDS] }[data.phase];
    if (!legacy || !current) return elapsed % Config.WORLD_CYCLE_SECONDS;
    return current[0] + Math.min(1, Math.max(0, (elapsed - legacy[0]) / legacy[1])) * current[1];
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

  daytimeBetween(startCycle, startElapsed, endCycle = this.cycle, endElapsed = this.elapsed) {
    const start = (startCycle - 1) * Config.WORLD_CYCLE_SECONDS + startElapsed;
    const end = (endCycle - 1) * Config.WORLD_CYCLE_SECONDS + endElapsed;
    const accumulated = absolute => Math.floor(absolute / Config.WORLD_CYCLE_SECONDS) * Config.DAY_DURATION_SECONDS
      + Math.min(absolute % Config.WORLD_CYCLE_SECONDS, Config.DAY_DURATION_SECONDS);
    return Math.max(0, accumulated(end) - accumulated(start));
  }

  toJSON() { return { timingVersion: 2, cycle: this.cycle, elapsed: this.elapsed, phase: this.phase }; }
}
