export class CharacterNeeds {
  static DEFAULTS = Object.freeze({ hunger: .78, safety: .8, happiness: .72 });
  constructor(data = {}) { this.hunger = this.value(data.hunger, CharacterNeeds.DEFAULTS.hunger); this.safety = this.value(data.safety, CharacterNeeds.DEFAULTS.safety); this.happiness = this.value(data.happiness, CharacterNeeds.DEFAULTS.happiness); this.peaceTime = Math.max(0, data.peaceTime ?? 0); }
  value(value, fallback) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : fallback)); }
  change(key, amount) { this[key] = this.value(this[key] + amount, CharacterNeeds.DEFAULTS[key]); return this[key]; }
  update(deltaTime, context = {}) { this.change('hunger', -deltaTime / 420); if (context.danger) { this.change('safety', -deltaTime * .04); this.peaceTime = 0; } else { this.peaceTime += deltaTime; this.change('safety', deltaTime * (context.shielded ? .004 : .0012)); } if (context.shielded) this.change('safety', deltaTime * .006); const pressure = Math.max(0, .45 - this.hunger) + Math.max(0, .4 - this.safety); this.change('happiness', deltaTime * (.0004 - pressure * .002)); }
  meal() { this.change('hunger', .38); this.change('happiness', .07); }
  danger(severity = .2) { this.change('safety', -severity); this.change('happiness', -severity * .3); this.peaceTime = 0; }
  shield() { this.change('safety', .2); }
  familyEvent(positive, close = true) { this.change('happiness', (positive ? 1 : -1) * (close ? .3 : .12)); }
  qualitative() { if (this.hunger < .32) return 'Affamato'; if (this.safety < .35) return 'Spaventato'; if (this.happiness < .35) return 'Triste'; if (this.happiness > .72) return 'Felice'; return 'Tranquillo'; }
  toJSON() { return { hunger: this.hunger, safety: this.safety, happiness: this.happiness, peaceTime: this.peaceTime }; }
}
