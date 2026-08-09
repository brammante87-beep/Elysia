export class SettlementCulture {
  static Dimensions = Object.freeze(['COOPERATION','INDIVIDUALISM','COURAGE','CAUTION','HOSPITALITY','DISTRUST','DEVOTION','SKEPTICISM','MERCY','SEVERITY']);
  static Customs = Object.freeze(['SHARE_FOOD_IN_CRISIS','WELCOME_TRAVELERS','DEFEND_SETTLEMENT','PROTECT_CHILDREN_FIRST','AVOID_THEFT','HELP_INJURED','RETURN_HOME_EARLY_DURING_DANGER']);
  static MAX_MEMORIES = 12;
  constructor(data = {}) {
    this.dimensions = Object.fromEntries(SettlementCulture.Dimensions.map(key => [key, this.clamp(data.dimensions?.[key] ?? 0)]));
    this.stability = Object.fromEntries(SettlementCulture.Dimensions.map(key => [key, Math.max(0, data.stability?.[key] ?? 0)]));
    this.customs = [...new Set(data.customs ?? [])].filter(value => SettlementCulture.Customs.includes(value));
    this.memories = (data.memories ?? []).slice(-SettlementCulture.MAX_MEMORIES).map(item => ({ ...item }));
    this.founderInfluence = data.founderInfluence ? { ...data.founderInfluence } : null;
    this.identityDimensions = [...(data.identityDimensions ?? [])].filter(value => SettlementCulture.Dimensions.includes(value));
  }
  clamp(value) { return Math.max(-1, Math.min(1, Number(value) || 0)); }
  value(dimension) { return this.dimensions[dimension] ?? 0; }
  hasCustom(custom) { return this.customs.includes(custom); }
  remember(memory) { this.memories.push({ ...memory }); this.memories = this.memories.slice(-SettlementCulture.MAX_MEMORIES); }
  toJSON() { return { dimensions: { ...this.dimensions }, stability: { ...this.stability }, customs: [...this.customs], memories: this.memories.map(item => ({ ...item })), founderInfluence: this.founderInfluence ? { ...this.founderInfluence } : null, identityDimensions: [...this.identityDimensions] }; }
}
