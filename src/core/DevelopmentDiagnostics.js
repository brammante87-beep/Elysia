export class DevelopmentDiagnostics {
  static BeliefEvents = Object.freeze(['faithChanged','beliefEvidenceAdded','beliefFormed','beliefStrengthened','beliefContradicted','beliefWeakened','beliefForgotten','beliefTaught','beliefAccepted','beliefRejected','beliefDisagreement','settlementBeliefTrendChanged']);
  static CultureEvents = Object.freeze(['cultureSignalAdded','cultureDimensionChanged','customFormed','customWeakened','customLost','reputationChanged','culturalPraise','culturalCriticism','settlementIdentityChanged']);
  constructor(enabled = false) { this.enabled = enabled; this.events = []; }
  trace(type, details = {}) {
    if (!this.enabled) return null;
    const event = { type, ...details };
    this.events.push(event);
    return event;
  }
}
