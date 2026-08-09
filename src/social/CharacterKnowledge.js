export class CharacterKnowledge {
  static Sources = Object.freeze({ WITNESSED: 'WITNESSED', TOLD_BY_OTHER: 'TOLD_BY_OTHER', SETTLEMENT_KNOWLEDGE: 'SETTLEMENT_KNOWLEDGE', ASSUMED: 'ASSUMED', UNCERTAIN: 'UNCERTAIN' });
  static MAX_FACTS = 32;
  constructor(facts = []) { this.facts = facts.map(fact => ({ ...fact })).slice(-CharacterKnowledge.MAX_FACTS); }
  learn(fact) { const key = fact.key ?? `${fact.type}:${fact.subjectId ?? ''}:${fact.objectId ?? fact.resource ?? ''}`; const learned = { certainty: 1, source: CharacterKnowledge.Sources.WITNESSED, cycle: 0, ...fact, key }; const existing = this.facts.findIndex(item => item.key === key); if (existing >= 0) this.facts.splice(existing, 1); this.facts.push(learned); if (this.facts.length > CharacterKnowledge.MAX_FACTS) this.facts.splice(0, this.facts.length - CharacterKnowledge.MAX_FACTS); return learned; }
  knows(type, subjectId = null) { return [...this.facts].reverse().find(fact => fact.type === type && (!subjectId || fact.subjectId === subjectId)) ?? null; }
  told(fact, tellerId, cycle = 0) { return this.learn({ ...fact, source: CharacterKnowledge.Sources.TOLD_BY_OTHER, toldBy: tellerId, certainty: Math.min(.85, fact.certainty ?? .85), cycle }); }
  toJSON() { return this.facts.map(fact => ({ ...fact })); }
}
