import { Pathfinder } from '../world/Pathfinder.js';
import { CharacterMovement } from '../entities/CharacterMovement.js';
import { PartnerGenerator } from '../entities/PartnerGenerator.js';
import { Household } from '../households/Household.js';
import { House } from '../entities/House.js';
import { Dwelling } from '../entities/Dwelling.js';

export class HouseholdProgression {
  static States = Object.freeze({ WAITING: 'waiting', APPROACHING: 'approaching', SPEAKING: 'speaking', COMPLETE: 'complete' });
  constructor(world) { this.world = world; this.state = HouseholdProgression.States.WAITING; this.partnerId = null; this.speechRemaining = 0; this.movement = null; this.pathfinder = new Pathfinder(); }

  update(deltaTime) {
    if (this.state === HouseholdProgression.States.WAITING && this.world.hut?.completed && ['wood', 'water', 'food'].every(resource => this.world.hut.storage.get(resource) >= 3)) this.spawnPartner();
    if (this.state === HouseholdProgression.States.APPROACHING && this.movement?.update(deltaTime)) { this.state = HouseholdProgression.States.SPEAKING; this.speechRemaining = 4.2; this.partner.visualState = 'idle'; }
    else if (this.state === HouseholdProgression.States.SPEAKING) { this.speechRemaining -= deltaTime; if (this.speechRemaining <= 0) this.formHousehold(); }
  }

  get partner() { return this.world.characters.find(character => character.id === this.partnerId) ?? null; }
  spawnPartner() {
    if (this.partnerId || this.world.households.length) return;
    const chosen = this.world.characters.find(character => character.chosenOne);
    if (!chosen) return;
    const spawn = this.world.findDistantReachablePosition(chosen.position, this.world.hut.position);
    if (!spawn) return;
    const partner = new PartnerGenerator().generate(chosen, spawn, this.world.characters, this.world.worldSeed);
    this.world.addCharacter(partner, false);
    this.partnerId = partner.id;
    const path = this.pathfinder.findPath(this.world.terrain, spawn, chosen.position);
    this.movement = new CharacterMovement(partner); this.movement.follow(path);
    partner.visualState = 'walk'; this.state = HouseholdProgression.States.APPROACHING;
  }

  speechText() { return this.partner?.genderIdentity === 'woman' ? 'Sei forte, sei bella, voglio un mondo con te.' : 'Sei forte, sei bello, voglio un mondo con te.'; }
  formHousehold() {
    if (this.world.households.length) { this.state = HouseholdProgression.States.COMPLETE; return; }
    const chosen = this.world.characters.find(character => character.chosenOne); const partner = this.partner;
    if (!chosen || !partner || !this.world.hut) return;
    const household = new Household({ id: 'household-1', memberIds: [chosen.id, partner.id], homeBuildingId: this.world.hut.id });
    const hut = this.world.hut;
    this.world.hut = new House({ ...hut.toJSON(), householdId: household.id, transformationAge: 0, visualVariant: Dwelling.variant(this.world.worldType, true, chosen.species) });
    this.world.households.push(household);
    for (const member of [chosen, partner]) { member.householdId = household.id; member.homeBuildingId = this.world.hut.id; member.partnerId = member === chosen ? partner.id : chosen.id; this.world.ensureAI(member); }
    this.world.addEffect(hut.position, 'transform'); this.state = HouseholdProgression.States.COMPLETE;
  }

  restore(data = {}) { this.state = data.state ?? HouseholdProgression.States.WAITING; this.partnerId = data.partnerId ?? null; this.speechRemaining = data.speechRemaining ?? 0; if ([HouseholdProgression.States.APPROACHING, HouseholdProgression.States.SPEAKING].includes(this.state)) { this.state = HouseholdProgression.States.SPEAKING; this.speechRemaining = Math.max(1, this.speechRemaining); } }
  toJSON() { return { state: this.state, partnerId: this.partnerId, speechRemaining: this.speechRemaining }; }
}
