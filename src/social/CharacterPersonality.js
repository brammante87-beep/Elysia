export class CharacterPersonality {
  static TRAITS = Object.freeze(['courage', 'kindness', 'selfishness', 'curiosity', 'sociability', 'faithDisposition']);
  constructor(data = {}, seed = 'character') { for (const [index, trait] of CharacterPersonality.TRAITS.entries()) this[trait] = Number.isFinite(data[trait]) ? this.clamp(data[trait]) : this.seeded(seed, index); }
  clamp(value) { return Math.max(0, Math.min(1, value)); }
  seeded(seed, salt) { let hash = 2166136261 ^ salt; for (const letter of String(seed)) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619); return .15 + ((hash >>> 0) % 7000) / 10000; }
  toJSON() { return Object.fromEntries(CharacterPersonality.TRAITS.map(trait => [trait, this[trait]])); }
}
