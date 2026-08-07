import { Config } from '../core/Config.js';
import { CharacterAI } from '../ai/CharacterAI.js';

export class HouseholdMealSystem {
  static States = Object.freeze({ NORMAL: 'normal', RETURNING: 'mealCalled', ANNOUNCING: 'announcing', EATING: 'eating', FAILED: 'mealFailedWaitingForNight' });
  static Cost = Object.freeze({ wood: 2, water: 2, food: 2 });

  constructor(world, data = {}) { this.world = world; this.elapsed = data.elapsed ?? 0; this.state = data.state ?? HouseholdMealSystem.States.NORMAL; this.stageTime = data.stageTime ?? 0; this.events = data.events ?? 0; }
  get household() { return this.world.households[0] ?? null; }
  get members() { return this.household?.memberIds.map(id => this.world.characters.find(character => character.id === id)).filter(character => character?.alive) ?? []; }
  get adults() { return this.members.filter(character => character.alive && character.lifeStage === 'adult'); }
  get partner() { return this.adults.find(character => !character.chosenOne && character.partnerId) ?? null; }
  get chosen() { return this.adults.find(character => character.chosenOne) ?? null; }
  get speechText() { return this.state === HouseholdMealSystem.States.ANNOUNCING ? 'È pronto!' : null; }

  update(deltaTime, isDay) {
    if (!this.household || !this.world.hut || !isDay || deltaTime <= 0 || this.state === HouseholdMealSystem.States.FAILED) return;
    if (this.state === HouseholdMealSystem.States.NORMAL) {
      this.elapsed += deltaTime;
      if (this.elapsed + Number.EPSILON >= Config.MEAL_INTERVAL_SECONDS) { this.elapsed -= Config.MEAL_INTERVAL_SECONDS; this.events += 1; this.callMeal(); }
    } else if (this.state === HouseholdMealSystem.States.RETURNING) this.updateReturning();
    else if (this.state === HouseholdMealSystem.States.ANNOUNCING) this.updateAnnouncement(deltaTime);
    else if (this.state === HouseholdMealSystem.States.EATING) this.updateEating(deltaTime);
  }

  callMeal() { if (!this.partner || !this.chosen) return; this.state = HouseholdMealSystem.States.RETURNING; this.world.ais.get(this.partner.id)?.returnHome(); }
  updateReturning() {
    if (!this.partner?.insideHome) return;
    this.partner.insideHome = false; this.partner.position = { x: this.world.hut.position.x + .8, y: this.world.hut.position.y + .45 };
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
    if (!this.world.hut.storage.consume(HouseholdMealSystem.Cost)) { this.state = HouseholdMealSystem.States.FAILED; for (const adult of this.adults) { adult.insideHome = true; this.world.ais.get(adult.id)?.setTask(CharacterAI.Tasks.WAITING_NIGHT); } return; }
    this.state = HouseholdMealSystem.States.EATING; this.stageTime = Config.MEAL_DURATION_SECONDS;
  }
  updateEating(deltaTime) { this.stageTime -= deltaTime; if (this.stageTime > 0) return; this.state = HouseholdMealSystem.States.NORMAL; for (const adult of this.adults) this.world.ais.get(adult.id)?.wake(); }
  beginNight() { if (this.state === HouseholdMealSystem.States.FAILED) this.state = HouseholdMealSystem.States.NORMAL; }
  restoreBehavior() {
    if (this.state === HouseholdMealSystem.States.RETURNING) this.world.ais.get(this.partner?.id)?.returnHome();
    if (this.state === HouseholdMealSystem.States.ANNOUNCING) { if (this.partner) { this.partner.carryingMeal = this.world.worldType === 'human' ? 'pot' : 'call'; this.world.ais.get(this.partner.id)?.setTask(CharacterAI.Tasks.MEAL_CALL); } this.world.ais.get(this.chosen?.id)?.returnHome(); }
    if (this.state === HouseholdMealSystem.States.EATING) for (const adult of this.adults) { adult.insideHome = true; this.world.ais.get(adult.id)?.setTask(CharacterAI.Tasks.EATING); }
    if (this.state === HouseholdMealSystem.States.FAILED) for (const adult of this.adults) { adult.insideHome = true; this.world.ais.get(adult.id)?.setTask(CharacterAI.Tasks.WAITING_NIGHT); }
  }
  toJSON() { return { elapsed: this.elapsed, state: this.state, stageTime: this.stageTime, events: this.events }; }
}
