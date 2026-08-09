export class DevelopmentDiagnostics {
  static BeliefEvents = Object.freeze(['faithChanged','beliefEvidenceAdded','beliefFormed','beliefStrengthened','beliefContradicted','beliefWeakened','beliefForgotten','beliefTaught','beliefAccepted','beliefRejected','beliefDisagreement','settlementBeliefTrendChanged']);
  static CultureEvents = Object.freeze(['cultureSignalAdded','cultureDimensionChanged','customFormed','customWeakened','customLost','reputationChanged','culturalPraise','culturalCriticism','settlementIdentityChanged']);
  static DiplomacyEvents = Object.freeze(['settlementRelationCreated','trustChanged','tensionChanged','aidRequested','aidAccepted','aidRefused','aidDeliveryStarted','aidDelivered','visitorStarted','visitorArrived','visitorReturned','interSettlementTheft','representativeDeath','relationStatusChanged','cultureDiffused']);
  constructor(enabled = false) { this.enabled = enabled; this.events = []; }
  trace(type, details = {}) {
    if (!this.enabled) return null;
    const event = { type, ...details };
    this.events.push(event);
    return event;
  }
}
