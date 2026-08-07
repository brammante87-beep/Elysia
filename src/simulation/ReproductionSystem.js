import { Config } from '../core/Config.js';
import { Character } from '../entities/Character.js';
import { CharacterCreator } from '../entities/CharacterCreator.js';
import { NameGenerator } from '../entities/NameGenerator.js';
import { WorldTypeId } from '../data/WorldTypes.js';
import { SeededRandom } from '../world/SeededRandom.js';

export class ReproductionSystem {
  constructor(world, data = {}) {
    this.world = world;
    this.random = new SeededRandom(data.randomState ?? ((world.worldSeed ?? 1) ^ 0x7007));
    this.lastEvaluatedCycle = data.lastEvaluatedCycle ?? 0;
    this.pendingBirth = data.pendingBirth ?? null;
  }

  eligiblePartners(household) {
    if (!household || !this.world.hut || household.homeBuildingId !== this.world.hut.id) return null;
    const adults = household.memberIds.map(id => this.world.characters.find(character => character.id === id))
      .filter(character => character?.alive && character.lifeStage === 'adult' && character.insideHome);
    for (const first of adults) {
      const second = adults.find(candidate => candidate.id === first.partnerId && candidate.partnerId === first.id);
      if (second) return [first, second];
    }
    return null;
  }

  evaluateNight(cycle) {
    if (cycle <= this.lastEvaluatedCycle) return false;
    const household = this.world.households[0];
    const partners = this.eligiblePartners(household);
    if (!partners) return false;
    this.lastEvaluatedCycle = cycle;
    if (this.random.next() >= Config.INTIMACY_PROBABILITY) return false;
    this.world.addEffect(this.world.hut.position, 'intimacy');
    if (this.canConceive(partners[0], partners[1])) this.pendingBirth = { cycle, householdId: household.id, parentIds: partners.map(parent => parent.id) };
    return true;
  }

  canConceive(first, second) {
    if (first.worldType === WorldTypeId.HUMAN && second.worldType === WorldTypeId.HUMAN) {
      return new Set([first.sexCharacteristics, second.sexCharacteristics]).size === 2
        && [first.sexCharacteristics, second.sexCharacteristics].every(value => value === 'male' || value === 'female');
    }
    return first.worldType === WorldTypeId.BEAST && second.worldType === WorldTypeId.BEAST
      && first.species === second.species && new Set([first.reproductiveSex, second.reproductiveSex]).size === 2
      && [first.reproductiveSex, second.reproductiveSex].every(value => value === 'male' || value === 'female');
  }

  birthAtDawn(cycle) {
    if (!this.pendingBirth || this.pendingBirth.cycle >= cycle) return null;
    const pending = this.pendingBirth; this.pendingBirth = null;
    const parents = pending.parentIds.map(id => this.world.characters.find(character => character.id === id));
    if (parents.some(parent => !parent?.alive)) return null;
    const household = this.world.households.find(item => item.id === pending.householdId);
    if (!household) return null;
    const name = new NameGenerator(this.world.characters.map(character => character.name)).generate(this.random.state);
    const child = new Character({ id: `child-${cycle}-${this.world.nextCharacterId++}`, name, position: { ...this.world.hut.position },
      worldType: parents[0].worldType, species: parents[0].species, chosenOne: false, alive: true, lifeStage: 'child',
      householdId: household.id, homeBuildingId: this.world.hut.id, parentIds: pending.parentIds, birthCycle: cycle,
      insideHome: false, reproductiveSex: parents[0].species ? (this.random.next() < .5 ? 'male' : 'female') : undefined });
    this.world.addCharacter(child); household.addMember(child.id);
    return child;
  }

  growChildren(cycle) {
    for (const child of this.world.characters.filter(character => character.lifeStage === 'child' && cycle > character.birthCycle)) {
      child.lifeStage = 'adult'; child.insideHome = false;
      if (child.worldType === WorldTypeId.HUMAN) {
        child.sexCharacteristics = this.pick(CharacterCreator.SexCharacteristics);
        child.genderIdentity = this.pick(CharacterCreator.GenderIdentities);
        child.sexualOrientation = this.pick(CharacterCreator.SexualOrientations);
      }
      this.world.ensureAI(child).setTask('idle');
    }
  }

  pick(values) { return values[Math.floor(this.random.next() * values.length)]; }
  restore(data = {}) { this.random.state = data.randomState ?? this.random.state; this.lastEvaluatedCycle = data.lastEvaluatedCycle ?? 0; this.pendingBirth = data.pendingBirth ?? null; }
  toJSON() { return { randomState: this.random.state, lastEvaluatedCycle: this.lastEvaluatedCycle, pendingBirth: this.pendingBirth }; }
}
