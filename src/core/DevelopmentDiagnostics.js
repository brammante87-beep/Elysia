export class DevelopmentDiagnostics {
  constructor(enabled = false) { this.enabled = enabled; this.events = []; }
  trace(type, details = {}) {
    if (!this.enabled) return null;
    const event = { type, ...details };
    this.events.push(event);
    return event;
  }
}
