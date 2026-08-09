export class PersonalBeliefs {
  static MAX_BELIEFS = 8;
  static MAX_EVIDENCE = 5;
  static Sources = Object.freeze({ PERSONAL_OBSERVATION: 'PERSONAL_OBSERVATION', PERSONAL_EXPERIENCE: 'PERSONAL_EXPERIENCE', TOLD_BY_OTHER: 'TOLD_BY_OTHER', EXALTED_TEACHING: 'EXALTED_TEACHING', ASSUMPTION: 'ASSUMPTION' });
  static Confidence = Object.freeze({ LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' });
  constructor(entries = []) { this.entries = entries.map(item => this.normalize(item)).filter(item => item.beliefType).slice(0, PersonalBeliefs.MAX_BELIEFS); }
  normalize(item) { return { beliefType: item.beliefType, confidence: this.clamp(item.confidence ?? .15), supportingMemories: [...new Set(item.supportingMemories ?? [])].slice(-PersonalBeliefs.MAX_EVIDENCE), contradictingMemories: [...new Set(item.contradictingMemories ?? [])].slice(-PersonalBeliefs.MAX_EVIDENCE), sourceType: item.sourceType ?? PersonalBeliefs.Sources.ASSUMPTION, taughtBy: item.taughtBy ?? null }; }
  clamp(value) { return Math.max(0, Math.min(.95, value)); }
  get(type) { return this.entries.find(item => item.beliefType === type) ?? null; }
  confidenceLevel(belief) { const value = typeof belief === 'number' ? belief : belief?.confidence ?? 0; return value >= .7 ? PersonalBeliefs.Confidence.HIGH : value >= .4 ? PersonalBeliefs.Confidence.MEDIUM : PersonalBeliefs.Confidence.LOW; }
  upsert(type, amount, memoryId, sourceType, contradicts = false, taughtBy = null) { let belief = this.get(type); if (!belief) { belief = this.normalize({ beliefType: type, confidence: 0, sourceType, taughtBy }); this.entries.push(belief); } const before = belief.confidence; belief.confidence = this.clamp(belief.confidence + (contradicts ? -Math.abs(amount) : Math.abs(amount))); const evidence = contradicts ? belief.contradictingMemories : belief.supportingMemories; if (memoryId && !evidence.includes(memoryId)) evidence.push(memoryId); if (evidence.length > PersonalBeliefs.MAX_EVIDENCE) evidence.shift(); if (!contradicts && before === 0) { belief.sourceType = sourceType; belief.taughtBy = taughtBy; } this.prune(); return { belief, before, changed: belief.confidence - before };
  }
  prune() { this.entries = this.entries.filter(item => item.confidence >= .08 || item.supportingMemories.length).sort((a, b) => b.confidence - a.confidence).slice(0, PersonalBeliefs.MAX_BELIEFS); }
  strongest(limit = 3) { return [...this.entries].sort((a, b) => b.confidence - a.confidence).slice(0, limit); }
  toJSON() { return this.entries.map(item => ({ ...item, supportingMemories: [...item.supportingMemories], contradictingMemories: [...item.contradictingMemories] })); }
}
