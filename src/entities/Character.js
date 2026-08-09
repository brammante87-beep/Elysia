import { BehaviourMemory } from '../behaviour/BehaviourMemory.js';
import { CharacterNeeds } from '../social/CharacterNeeds.js';
import { CharacterPersonality } from '../social/CharacterPersonality.js';
import { CharacterMemory } from '../social/CharacterMemory.js';
import { CharacterKnowledge } from '../social/CharacterKnowledge.js';
import { PersonalFaith } from '../beliefs/PersonalFaith.js';
import { PersonalBeliefs } from '../beliefs/PersonalBeliefs.js';

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
    this.originType = data.originType ?? (this.originWorld === 'ELYSIA' ? 'elysiaNative' : 'externalMigrant');
    this.originWorldId = data.originWorldId ?? null;
    this.trueSpecies = data.trueSpecies ?? null;
    this.isDisguised = data.isDisguised ?? false;
    this.disguiseVisualProfile = data.disguiseVisualProfile ?? null;
    this.trueVisualProfile = data.trueVisualProfile ?? null;
    this.identityRevealed = data.identityRevealed ?? false;
    this.visualProfile = data.visualProfile ?? (this.isDisguised ? this.disguiseVisualProfile : this.trueVisualProfile);
    this.citizenship = data.citizenship ?? 'elysia';
    this.factionId = data.factionId ?? 'elysia';
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
    this.health = data.health ?? 100;
    this.injured = data.injured ?? false;
    this.injuryRemaining = data.injuryRemaining ?? 0;
    this.lost = data.lost ?? false;
    this.migrantNeed = data.migrantNeed ?? null;
    this.needs = new CharacterNeeds(data.needs);
    this.personality = new CharacterPersonality(data.personality, this.id);
    this.memories = new CharacterMemory(data.memories);
    this.knowledge = new CharacterKnowledge(data.knowledge);
    this.faith = new PersonalFaith(data.faith, { faithDisposition: this.personality.faithDisposition, createdByElysia: this.chosenOne, externalMigrant: this.originType === 'externalMigrant' });
    this.beliefs = new PersonalBeliefs(data.beliefs);
    this.formerDivineBeliefs = [...new Set(data.formerDivineBeliefs ?? [])].slice(0, 3);
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

  toJSON() { return { ...this, position: { ...this.position }, needs: this.needs.toJSON(), personality: this.personality.toJSON(), memories: this.memories.toJSON(), knowledge: this.knowledge.toJSON(), faith: this.faith.toJSON(), beliefs: this.beliefs.toJSON(), formerDivineBeliefs: [...this.formerDivineBeliefs] }; }
}
