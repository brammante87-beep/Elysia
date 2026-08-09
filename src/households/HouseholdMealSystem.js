import { Config } from '../core/Config.js';
import { CharacterAI } from '../ai/CharacterAI.js';

export class HouseholdMealSystem {
  static States = Object.freeze({ NORMAL: 'normal', RETURNING: 'mealCalled', ANNOUNCING: 'announcing', EATING: 'eating', FAILED: 'mealFailedWaitingForNight' });
  static Cost = Object.freeze({ wood: 2, water: 2, food: 2 });

  constructor(world, data = {}) { this.world = world; this.elapsed = data.elapsed ?? 0; this.state = data.state ?? HouseholdMealSystem.States.NORMAL; this.stageTime = data.stageTime ?? 0; this.events = data.events ?? 0; this.mealEventsCompleted = data.mealEventsCompleted ?? 0; }
  get household() { const chosen = this.world.characters.find(character => character.chosenOne && character.alive); return this.world.households.find(item => item.id === chosen?.householdId && item.memberIds.includes(chosen.id)) ?? null; }
  get home() { return this.world.findHome(this.household?.homeBuildingId); }
  get members() { return this.household?.memberIds.map(id => this.world.characters.find(character => character.id === id)).filter(character => character?.alive) ?? []; }
  get adults() { return this.members.filter(character => character.alive && character.lifeStage === 'adult'); }
  get partner() { return this.adults.find(character => !character.chosenOne && character.partnerId) ?? null; }
  get chosen() { return this.adults.find(character => character.chosenOne) ?? null; }
  get speechText() { return this.state === HouseholdMealSystem.States.ANNOUNCING ? 'È pronto!' : null; }

  update(deltaTime, isDay) {
    if (!isDay || deltaTime <= 0 || this.state === HouseholdMealSystem.States.FAILED) return;
    if (this.state === HouseholdMealSystem.States.NORMAL) {
      this.elapsed += deltaTime;
      if (this.elapsed + Number.EPSILON >= Config.MEAL_INTERVAL_SECONDS) { this.world.diagnostics.trace('MEAL_THRESHOLD_REACHED', { elapsed: this.elapsed }); if (this.callMeal()) { this.elapsed -= Config.MEAL_INTERVAL_SECONDS; this.events += 1; } }
    } else if (this.state === HouseholdMealSystem.States.RETURNING) this.updateReturning();
    else if (this.state === HouseholdMealSystem.States.ANNOUNCING) this.updateAnnouncement(deltaTime);
    else if (this.state === HouseholdMealSystem.States.EATING) this.updateEating(deltaTime);
  }

  callMeal() { const reason = !this.chosen ? 'no Chosen One' : !this.partner ? 'no partner' : !this.household ? 'no Household' : !this.home ? 'no Home' : null; if (reason) { this.world.diagnostics.trace('MEAL_ABORTED', { reason }); return false; } this.state = HouseholdMealSystem.States.RETURNING; this.world.ais.get(this.partner.id)?.returnHome(); this.world.diagnostics.trace('MEAL_STARTED', { householdId: this.household.id, homeBuildingId: this.home.id }); return true; }
  updateReturning() {
    if (!this.partner?.insideHome) return;
    this.partner.insideHome = false; this.partner.position = { x: this.home.position.x + .8, y: this.home.position.y + .45 };
    this.partner.carryingMeal = this.world.worldType === 'human' ? 'pot' : 'call';
    this.world.ais.get(this.partner.id)?.setTask(CharacterAI.Tasks.MEAL_CALL);
    this.state = HouseholdMealSystem.States.ANNOUNCING; this.stageTime = Config.MEAL_ANNOUNCEMENT_SECONDS;
    this.world.ais.get(this.chosen.id)?.returnHome();
  }
  updateAnnouncement(deltaTime) {
    this.stageTime -= deltaTime;
    if (this.stageTime > 0 || !this.chosen?.insideHome) return;
    this.partner.carryingMeal = null; this.partner.insideHome = true;
    this.world.ais.get(this.partner.id)?.setTask(CharacterAI.Tasks.EATING); this.world.ais.get(this.chosen.id)?.setTask(CharacterAI.Tasks.EATING);
    if (!this.home.storage.consume(HouseholdMealSystem.Cost)) { this.state = HouseholdMealSystem.States.FAILED; this.world.diagnostics.trace('MEAL_ABORTED', { reason: 'insufficient resources' }); for (const adult of this.adults) { adult.insideHome = true; this.world.ais.get(adult.id)?.setTask(CharacterAI.Tasks.WAITING_NIGHT); } return; }
    this.state = HouseholdMealSystem.States.EATING; this.stageTime = Config.MEAL_DURATION_SECONDS;
  }
  updateEating(deltaTime) { this.stageTime -= deltaTime; if (this.stageTime > 0) return; this.state = HouseholdMealSystem.States.NORMAL; this.mealEventsCompleted += 1; this.world.diagnostics.trace('MEAL_COMPLETED', { mealEventsCompleted: this.mealEventsCompleted }); for (const adult of this.adults) { adult.needs?.meal(); this.world.ais.get(adult.id)?.wake(); } }
  beginNight() { if (this.state === HouseholdMealSystem.States.FAILED) this.state = HouseholdMealSystem.States.NORMAL; }
  restoreBehavior() {
    if (this.state === HouseholdMealSystem.States.RETURNING) this.world.ais.get(this.partner?.id)?.returnHome();
    if (this.state === HouseholdMealSystem.States.ANNOUNCING) { if (this.partner) { this.partner.carryingMeal = this.world.worldType === 'human' ? 'pot' : 'call'; this.world.ais.get(this.partner.id)?.setTask(CharacterAI.Tasks.MEAL_CALL); } this.world.ais.get(this.chosen?.id)?.returnHome(); }
    if (this.state === HouseholdMealSystem.States.EATING) for (const adult of this.adults) { adult.insideHome = true; this.world.ais.get(adult.id)?.setTask(CharacterAI.Tasks.EATING); }
    if (this.state === HouseholdMealSystem.States.FAILED) for (const adult of this.adults) { adult.insideHome = true; this.world.ais.get(adult.id)?.setTask(CharacterAI.Tasks.WAITING_NIGHT); }
  }
  toJSON() { return { elapsed: this.elapsed, state: this.state, stageTime: this.stageTime, events: this.events, mealEventsCompleted: this.mealEventsCompleted }; }
}
