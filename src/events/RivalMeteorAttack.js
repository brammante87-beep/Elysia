export class RivalMeteorAttack {
  constructor(world) { this.world = world; this.targetSettlementId = null; this.casualties = 0; this.survivors = 0; this.resolved = false; }

  arm(settlementId) { this.targetSettlementId = settlementId; }

  affectedCharacters() {
    if (!this.targetSettlementId) return [];
    return this.world.characters.filter(character => character.alive && character.settlementId === this.targetSettlementId);
  }

  resolve() {
    if (this.resolved) return { casualties: this.casualties, survivors: this.survivors };
    const affected = [...this.affectedCharacters()];
    const protectedCharacters = affected.filter(character => character.hasDivineShield);
    const casualties = affected.filter(character => !character.hasDivineShield);
    for (const character of protectedCharacters) {
      character.hasShield = false;
      character.shieldImpactReaction = 2.2;
    }
    for (const character of casualties) this.world.killCharacter(character);
    this.casualties = casualties.length;
    this.survivors = protectedCharacters.length;
    this.resolved = true;
    return { casualties: this.casualties, survivors: this.survivors };
  }
}
