export class Character {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.position = { ...data.position };
    this.worldType = data.worldType;
    this.chosenOne = data.chosenOne ?? true;
    this.alive = data.alive ?? true;
    this.householdId = data.householdId ?? null;
    this.homeBuildingId = data.homeBuildingId ?? null;
    this.partnerId = data.partnerId ?? null;
    this.parentIds = [...(data.parentIds ?? [])];
    this.lifeStage = data.lifeStage ?? 'adult';
    this.birthCycle = data.birthCycle ?? null;
    this.insideHome = data.insideHome ?? false;
    this.appearanceVariant = data.appearanceVariant ?? 'base';
    this.interactionRadius = data.interactionRadius ?? 1.25;
    this.collisionRadius = data.collisionRadius ?? 0.42;
    this.lightningStrikeCount = data.lightningStrikeCount ?? 0;
    this.blessingCount = data.blessingCount ?? 0;
    this.isExalted = data.isExalted ?? false;
    this.canFoundSettlement = data.canFoundSettlement ?? this.isExalted;
    this.isArmed = data.isArmed ?? false;
    this.hasShield = data.hasShield ?? false;
    if (data.sexCharacteristics) this.sexCharacteristics = data.sexCharacteristics;
    if (data.genderIdentity) this.genderIdentity = data.genderIdentity;
    if (data.sexualOrientation) this.sexualOrientation = data.sexualOrientation;
    if (data.species) this.species = data.species;
    if (data.reproductiveSex) this.reproductiveSex = data.reproductiveSex;
    if (!this.sexCharacteristics && this.reproductiveSex) this.sexCharacteristics = this.reproductiveSex;
  }

  toJSON() { return { ...this, position: { ...this.position } }; }
}
