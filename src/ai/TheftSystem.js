import { Config } from '../core/Config.js';
import { Resources } from '../data/Resources.js';
import { WorldTime } from '../world/WorldTime.js';

export class TheftSystem {
  constructor(ai) { this.ai = ai; this.world = ai.world; this.character = ai.character; this.state = null; this.cooldown = 0; this.decisionTimer = 0; }

  isActive() { return this.state !== null; }
  eligible() {
    const meals = this.world.meals;
    const mandatoryMeal = meals && meals.state !== 'normal' && meals.members?.includes(this.character);
    return this.world.worldType !== 'plant' && this.character.alive && this.character.lifeStage === 'adult' && !this.character.insideHome
      && this.ai.task === 'idle' && this.world.worldTime.phase !== WorldTime.Phases.NIGHT && !this.world.rally && !mandatoryMeal;
  }

  updateTime(deltaTime) { this.cooldown = Math.max(0, this.cooldown - deltaTime); this.decisionTimer = Math.max(0, this.decisionTimer - deltaTime); }
  consider(random = Math.random) {
    if (!this.eligible() || this.cooldown > 0 || this.decisionTimer > 0) return false;
    this.decisionTimer = Config.THEFT_DECISION_INTERVAL_SECONDS;
    const choice = this.selectTarget();
    if (!choice || random() >= this.character.behaviourMemory.tendency('theft')) return false;
    return this.start(choice);
  }

  selectTarget() {
    const own = this.world.homeFor(this.character);
    if (!own) return null;
    const needed = Resources.ALL.filter(resource => own.storage.get(resource) <= Config.THEFT_NEED_THRESHOLD && !own.storage.isFull(resource));
    const choices = [];
    for (const resource of needed) for (const home of this.world.homes) {
      const reservationId = this.reservationId(home.id, resource);
      if (home.id === own.id || home.householdId === this.character.householdId || !home.completed || home.occupancy === 'vacant' || home.storage.get(resource) < 1 || this.world.reservations.isReservedByOther(reservationId, this.character.id)) continue;
      choices.push({ resource, victimHomeId: home.id, ownHomeId: own.id, reservationId, distance: Math.hypot(home.position.x-this.character.position.x, home.position.y-this.character.position.y) });
    }
    return choices.sort((a, b) => own.storage.get(a.resource)-own.storage.get(b.resource) || a.distance-b.distance)[0] ?? null;
  }

  reservationId(homeId, resource) { return `theft:${homeId}:${resource}`; }
  start(choice) {
    if (!this.world.reservations.reserve(choice.reservationId, this.character.id)) return false;
    const victim = this.world.findHome(choice.victimHomeId);
    const path = victim ? this.ai.pathfinder.findPath(this.world.terrain, this.character.position, victim.position) : [];
    if (!victim || (!path.length && Math.hypot(victim.position.x-this.character.position.x, victim.position.y-this.character.position.y) > 1)) { this.world.reservations.releaseTarget(choice.reservationId); return false; }
    this.state = { ...choice, phase: 'approach', carrying: false };
    this.character.activeBehaviour = 'theft'; this.character.theftIndicator = true; this.character.visualState = this.character.worldType === 'human' ? 'sneak' : 'walk';
    this.ai.targetId = choice.victimHomeId;
    this.ai.movement.follow(path);
    this.ai.setTask('moveToSteal');
    return true;
  }

  arriveAtVictim() { this.state.phase = 'taking'; this.ai.actionTime = .75; this.ai.setTask('stealResource'); }
  take() {
    const victim = this.world.findHome(this.state?.victimHomeId);
    if (!victim || victim.storage.remove(this.state.resource, 1) !== 1) return this.cancel('unavailable');
    this.state.carrying = true; this.state.phase = 'returning'; this.ai.carried[this.state.resource] += 1;
    this.world.reservations.releaseTarget(this.state.reservationId);
    this.world.addEffect(victim.position, 'theft', { characterId: this.character.id });
    const own = this.world.findHome(this.state.ownHomeId);
    if (!own) return this.cancel('invalidHome');
    this.ai.movement.follow(this.ai.pathfinder.findPath(this.world.terrain, this.character.position, own.position)); this.ai.setTask('returnStolenResource');
  }

  deposit() {
    if (!this.character.alive || !this.state?.carrying) return this.cancel('invalid');
    const own = this.world.findHome(this.state.ownHomeId); const amount = this.ai.carried[this.state.resource];
    const unit = Math.min(1, amount); const deposited = own?.storage.add(this.state.resource, unit) ?? 0;
    if (deposited < unit) this.world.findHome(this.state.victimHomeId)?.storage.add(this.state.resource, unit-deposited);
    this.ai.carried[this.state.resource] = Math.max(0, amount - unit); this.finish();
  }

  cancel() {
    if (this.state?.carrying) {
      const victim = this.world.findHome(this.state.victimHomeId); const amount = this.ai.carried[this.state.resource];
      victim?.storage.add(this.state.resource, Math.min(1, amount)); this.ai.carried[this.state.resource] = Math.max(0, amount - 1);
    }
    this.finish(); return false;
  }
  finish() { this.world.reservations.releaseFor(this.character.id); this.state = null; this.character.activeBehaviour = null; this.character.theftIndicator = false; this.cooldown = Config.THEFT_COOLDOWN_SECONDS; this.ai.targetId = null; this.ai.movement.follow([]); this.ai.setTask('idle'); }
  toJSON() { return { cooldown: this.cooldown, state: this.state ? { ...this.state } : null }; }
  restore(data = {}) { this.cooldown = data.cooldown ?? 0; this.state = data.state ? { ...data.state } : null; if (this.state) this.cancel('continue'); }
}
