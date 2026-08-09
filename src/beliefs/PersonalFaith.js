export class PersonalFaith {
  static Levels = Object.freeze({ SKEPTICAL: 'SKEPTICAL', UNCERTAIN: 'UNCERTAIN', BELIEVING: 'BELIEVING', DEVOTED: 'DEVOTED' });
  constructor(data = null, context = {}) {
    const disposition = context.faithDisposition ?? .5;
    const originAdjustment = context.createdByElysia ? .04 : context.externalMigrant ? -.01 : 0;
    this.value = this.clamp(Number.isFinite(data?.value) ? data.value : .38 + (disposition - .5) * .28 + originAdjustment);
    this.initialized = true;
  }
  clamp(value) { return Math.max(0, Math.min(1, value)); }
  change(amount) { const previous = this.value; this.value = this.clamp(this.value + amount); return this.value - previous; }
  level() { if (this.value < .28) return PersonalFaith.Levels.SKEPTICAL; if (this.value < .48) return PersonalFaith.Levels.UNCERTAIN; if (this.value < .76) return PersonalFaith.Levels.BELIEVING; return PersonalFaith.Levels.DEVOTED; }
  toJSON() { return { value: this.value, initialized: true }; }
}
