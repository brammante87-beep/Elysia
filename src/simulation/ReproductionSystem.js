import { Config } from '../core/Config.js';
import { Character } from '../entities/Character.js';
import { CharacterCreator } from '../entities/CharacterCreator.js';
import { NameGenerator } from '../entities/NameGenerator.js';
import { WorldTypeId } from '../data/WorldTypes.js';
import { SeededRandom } from '../world/SeededRandom.js';
import { BehaviourMemory } from '../behaviour/BehaviourMemory.js';

export class ReproductionSystem {
  static NEW_LIFE_MESSAGE = "La nuova vita nasce dal legame tra due esseri, l'amore invoca un briciolo del tuo potere anche senza la tua volontà.";
  constructor(world, data = {}) {
    this.world = world;
    this.random = new SeededRandom(data.randomState ?? ((world.worldSeed ?? 1) ^ 0x7007));
    this.relationships = { ...(data.relationships ?? {}) };
    this.pendingBirths = [...(data.pendingBirths ?? (data.pendingBirth ? [data.pendingBirth] : []))];
    this.intimacyEvents = data.intimacyEvents ?? 0;
    this.birthsCreated = data.birthsCreated ?? 0;
  }

  relationshipId(first, second) { return [first.id, second.id].sort().join('::'); }
  get pendingBirth() { return this.pendingBirths[0] ?? null; }
  beginRelationship(first, second) { const id = this.relationshipId(first, second); this.relationships[id] = { partnerIds: [first.id, second.id], intimacySinceLastBirth: 0, lastIntimacyCycle: null, active: true }; return this.relationships[id]; }
  endRelationshipsFor(characterId) { for (const relationship of Object.values(this.relationships)) if (relationship.partnerIds.includes(characterId)) relationship.active = false; this.pendingBirths = this.pendingBirths.filter(birth => !birth.parentIds.includes(characterId)); }

  eligiblePartners(household) {
    return this.eligibleCouples(household)[0] ?? null;
  }

  eligibleCouples(household) {
    const home = this.world.findHome(household?.homeBuildingId);
    if (!household || !home) return [];
    const adults = household.memberIds.map(id => this.world.characters.find(character => character.id === id)).filter(character => character?.alive && character.lifeStage === 'adult' && character.insideHome);
    const couples = [];
    const included = new Set();
    for (const first of adults) {
      const second = adults.find(candidate => candidate.id === first.partnerId && candidate.partnerId === first.id);
      if (!second) continue;
      const id = this.relationshipId(first, second);
      if (!included.has(id)) { included.add(id); couples.push([first, second]); }
    }
    return couples;
  }

  visualVariant(relationshipId, cycle) { let hash = cycle; for (const character of relationshipId) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0; return hash % 4; }

  evaluateNight(cycle) {
    let occurred = false;
    for (const household of this.world.households) {
      const couples = this.eligibleCouples(household);
      if (!couples.length) this.world.diagnostics.trace('INTIMACY_ELIGIBILITY_CHECK', { householdId: household.id, eligible: false, reason: this.ineligibilityReason(household) });
      for (const partners of couples) {
        const id = this.relationshipId(...partners);
        const relationship = this.relationships[id] ?? this.beginRelationship(...partners);
        if (!relationship.active || relationship.lastIntimacyCycle === cycle) continue;
        relationship.lastIntimacyCycle = cycle;
        relationship.intimacySinceLastBirth += 1;
        this.intimacyEvents += 1;
        this.world.diagnostics.trace('INTIMACY_ELIGIBILITY_CHECK', { householdId: household.id, eligible: true });
        this.world.diagnostics.trace('INTIMACY_TRIGGERED', { relationshipId: id, cycle });
        const home = this.world.findHome(household.homeBuildingId);
        this.world.addEffect(home.position, 'intimacy', { relationshipId: id, visualVariant: this.visualVariant(id, cycle) });
        const guaranteed = relationship.intimacySinceLastBirth >= 3;
        const conceived = this.canConceive(...partners) && (guaranteed || this.random.next() < Config.NEW_LIFE_CHANCE);
        this.world.diagnostics.trace(guaranteed ? 'NEW_LIFE_GUARANTEED' : 'NEW_LIFE_ROLL', { relationshipId: id, conceived, attempt: relationship.intimacySinceLastBirth });
        if (conceived) {
          this.pendingBirths.push({ cycle, householdId: household.id, homeBuildingId: home.id, parentIds: partners.map(parent => parent.id), relationshipId: id });
          this.world.diagnostics.trace('BIRTH_QUEUED', { relationshipId: id, cycle });
          relationship.intimacySinceLastBirth = 0;
        }
        occurred = true;
      }
    }
    return occurred;
  }

  ineligibilityReason(household) { const home = this.world.findHome(household?.homeBuildingId); if (!home) return 'no Home'; const adults = household.memberIds.map(id => this.world.characters.find(character => character.id === id)).filter(character => character?.alive && character.lifeStage === 'adult'); if (adults.length < 2) return 'fewer than two living adults'; const first = adults.find(character => character.partnerId); if (!first) return 'no partner'; const partner = adults.find(character => character.id === first.partnerId); if (!partner || partner.partnerId !== first.id) return 'relationship not reciprocal'; if (!first.insideHome || !partner.insideHome) return 'partner not inside Home'; return 'couple not eligible'; }

  canConceive(first, second) {
    if (!first?.alive || !second?.alive || first.partnerId !== second.id || second.partnerId !== first.id || first.householdId !== second.householdId) return false;
    if (first.worldType === WorldTypeId.HUMAN && second.worldType === WorldTypeId.HUMAN) return true;
    return first.worldType === WorldTypeId.BEAST && second.worldType === WorldTypeId.BEAST && first.species === second.species;
  }

  birthAtDawn(cycle) {
    const ready = this.pendingBirths.filter(pending => pending.cycle < cycle);
    this.pendingBirths = this.pendingBirths.filter(pending => pending.cycle >= cycle);
    let firstChild = null;
    for (const pending of ready) {
      const parents = pending.parentIds.map(id => this.world.characters.find(character => character.id === id));
      const household = this.world.households.find(item => item.id === pending.householdId);
      const home = this.world.findHome(pending.homeBuildingId);
      if (parents.some(parent => !parent?.alive) || !household || !home) continue;
      const name = new NameGenerator(this.world.characters.map(character => character.name)).generate(this.random.state);
      const child = new Character({ id: `child-${cycle}-${this.world.nextCharacterId++}`, name, position: { ...home.position }, worldType: parents[0].worldType, species: parents[0].species, chosenOne: false, alive: true, lifeStage: 'child', householdId: household.id, homeBuildingId: home.id, parentIds: pending.parentIds, birthCycle: cycle, birthSimulationTime: this.world.simulationTime, insideHome: false, reproductiveSex: parents[0].species ? (this.random.next() < .5 ? 'male' : 'female') : undefined });
      this.world.addCharacter(child); household.addMember(child.id); this.world.addEffect(home.position, 'newLife', { message: ReproductionSystem.NEW_LIFE_MESSAGE }); firstChild ??= child;
      this.birthsCreated += 1; this.world.diagnostics.trace('BIRTH_CREATED', { childId: child.id, householdId: household.id });
    }
    return firstChild;
  }

  growChildren(currentSimulationTime) { for (const child of this.world.characters.filter(character => character.lifeStage === 'child' && currentSimulationTime - character.birthSimulationTime + Number.EPSILON >= Config.CHILD_GROWTH_DURATION_SECONDS)) { child.lifeStage = 'adult'; child.behaviourMemory = new BehaviourMemory(); child.behaviourPreferences = child.behaviourMemory.preferences; child.insideHome = false; if (child.worldType === WorldTypeId.HUMAN) { child.sexCharacteristics = this.pick(CharacterCreator.SexCharacteristics); child.genderIdentity = this.pick(CharacterCreator.GenderIdentities); child.sexualOrientation = this.pick(CharacterCreator.SexualOrientations); } this.world.ensureAI(child).setTask('idle'); } }
  pick(values) { return values[Math.floor(this.random.next() * values.length)]; }
  restore(data = {}) { this.random.state = data.randomState ?? this.random.state; this.relationships = { ...(data.relationships ?? {}) }; this.pendingBirths = [...(data.pendingBirths ?? (data.pendingBirth ? [data.pendingBirth] : []))]; this.intimacyEvents = data.intimacyEvents ?? this.intimacyEvents; this.birthsCreated = data.birthsCreated ?? this.birthsCreated; }
  toJSON() { return { randomState: this.random.state, relationships: this.relationships, pendingBirths: this.pendingBirths, intimacyEvents: this.intimacyEvents, birthsCreated: this.birthsCreated }; }
}
