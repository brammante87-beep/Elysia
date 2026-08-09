export class CharacterMemory {
  static MAX_ENTRIES = 24;
  constructor(entries = []) { this.entries = entries.map(entry => ({ ...entry, participants: [...(entry.participants ?? [])] })).slice(-CharacterMemory.MAX_ENTRIES); }
  remember(entry) { const memory = { cycle: 0, emotionalImpact: 0, importance: .5, certainty: 1, resolved: false, ...entry, participants: [...(entry.participants ?? [])] }; this.entries.push(memory); this.prune(); return memory; }
  prune() { if (this.entries.length <= CharacterMemory.MAX_ENTRIES) return; this.entries.sort((a, b) => (b.importance ?? .5) - (a.importance ?? .5) || (b.cycle ?? 0) - (a.cycle ?? 0)); this.entries.length = CharacterMemory.MAX_ENTRIES; this.entries.sort((a, b) => (a.cycle ?? 0) - (b.cycle ?? 0)); }
  find(eventType, subjectId = null) { return [...this.entries].reverse().find(entry => entry.eventType === eventType && (!subjectId || entry.participants.includes(subjectId))) ?? null; }
  toJSON() { return this.entries.map(entry => ({ ...entry, participants: [...entry.participants] })); }
}
