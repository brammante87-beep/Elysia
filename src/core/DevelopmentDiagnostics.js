export class DevelopmentDiagnostics {
  static BeliefEvents = Object.freeze(['faithChanged','beliefEvidenceAdded','beliefFormed','beliefStrengthened','beliefContradicted','beliefWeakened','beliefForgotten','beliefTaught','beliefAccepted','beliefRejected','beliefDisagreement','settlementBeliefTrendChanged']);
  constructor(enabled = false) { this.enabled = enabled; this.events = []; }
  trace(type, details = {}) {
    if (!this.enabled) return null;
    const event = { type, ...details };
    this.events.push(event);
    return event;
  }
}
