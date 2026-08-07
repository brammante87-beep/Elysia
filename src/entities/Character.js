import { BehaviourMemory } from '../behaviour/BehaviourMemory.js';

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
    this.settlementId = data.settlementId ?? null;
    this.partnerId = data.partnerId ?? null;
    this.formerPartnerIds = [...new Set(data.formerPartnerIds ?? [])];
    this.parentIds = [...(data.parentIds ?? [])];
    this.lifeStage = data.lifeStage ?? 'adult';
    this.birthCycle = data.birthCycle ?? null;
    this.birthSimulationTime = data.birthSimulationTime ?? null;
    this.arrivalCycle = data.arrivalCycle ?? null;
    this.arrivalPosition = data.arrivalPosition ? { ...data.arrivalPosition } : null;
    this.newcomer = data.newcomer ?? false;
    this.originWorld = data.originWorld ?? 'ELYSIA';
    this.arrivalStoryType = data.arrivalStoryType ?? null;
    this.arrivalLineId = data.arrivalLineId ?? null;
    this.introductionCompleted = data.introductionCompleted ?? !this.newcomer;
    this.foundingState = data.foundingState ?? null;
    this.speechText = data.speechText ?? null;
    this.speechLines = [...(data.speechLines ?? (data.speechText ? [data.speechText] : []))];
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
    this.behaviourMemory = new BehaviourMemory(data.behaviourPreferences ?? (this.lifeStage === 'child' ? { theft: 0 } : null));
    this.behaviourPreferences = this.behaviourMemory.preferences;
    if (data.sexCharacteristics) this.sexCharacteristics = data.sexCharacteristics;
    if (data.genderIdentity) this.genderIdentity = data.genderIdentity;
    if (data.sexualOrientation) this.sexualOrientation = data.sexualOrientation;
    if (data.species) this.species = data.species;
    if (data.reproductiveSex) this.reproductiveSex = data.reproductiveSex;
    if (!this.sexCharacteristics && this.reproductiveSex) this.sexCharacteristics = this.reproductiveSex;
  }

  get hasDivineShield() { return this.alive && this.hasShield === true; }

  toJSON() { return { ...this, position: { ...this.position } }; }
}
