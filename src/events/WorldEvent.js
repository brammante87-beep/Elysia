export class WorldEvent {
  static Status = Object.freeze({ PENDING: 'PENDING', ACTIVE: 'ACTIVE', RESOLVED: 'RESOLVED', FAILED: 'FAILED', EXPIRED: 'EXPIRED' });
  constructor(data) { Object.assign(this, { id: null, type: null, status: WorldEvent.Status.PENDING, target: null, targetId: null, settlementId: null, startCycle: 0, startTime: 0, duration: null, remaining: null, severity: 'MINOR', resolved: false, participants: [], outcome: null, divineIntervention: null, elapsed: 0, requestMade: false, absenceRemembered: false, affectedTreeIds: [], spreadElapsed: 0, ...data }); this.participants = [...(data.participants ?? [])]; this.affectedTreeIds = [...(data.affectedTreeIds ?? [])]; }
  activate() { if (this.status !== WorldEvent.Status.PENDING) return false; this.status = WorldEvent.Status.ACTIVE; return true; }
  finish(outcome, status = WorldEvent.Status.RESOLVED) { if (this.resolved) return false; this.status = status; this.resolved = true; this.outcome = outcome; return true; }
  toJSON() { return { ...this, target: this.target ? { ...this.target } : null, participants: [...this.participants], affectedTreeIds: [...this.affectedTreeIds] }; }
}
