import { Config } from '../core/Config.js';

export class BehaviourMemory {
  constructor(preferences = null, random = Math.random) {
    const initial = Config.THEFT_INITIAL_MIN + random() * (Config.THEFT_INITIAL_MAX - Config.THEFT_INITIAL_MIN);
    this.preferences = { theft: this.clamp(preferences?.theft ?? initial) };
  }

  tendency(behaviour) { return this.preferences[behaviour] ?? 0; }
  teach(behaviour, amount) { this.preferences[behaviour] = this.clamp(this.tendency(behaviour) + amount); return this.preferences[behaviour]; }
  clamp(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
  toJSON() { return { ...this.preferences }; }
}
