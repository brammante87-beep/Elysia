import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/World.js';
import { Character } from '../src/entities/Character.js';
import { House } from '../src/entities/House.js';
import { Household } from '../src/households/Household.js';

class PopulationGrowthHarness {
  createHumanFamily() {
    const world = new World();
    world.create('human', 808);
    const spawn = world.findSpawnPosition();
    const position = { x: spawn.x + 0.5, y: spawn.y + 0.5 };
    const home = new House({ id: 'home-1', position, completed: true, householdId: 'household-1' });
    const first = this.createParent('parent-1', 'Alba', 'parent-2', position);
    const second = this.createParent('parent-2', 'Elio', 'parent-1', position);
    world.hut = home;
    world.homes = [home];
    world.addCharacter(first);
    world.addCharacter(second);
    world.households = [new Household({ id: 'household-1', memberIds: [first.id, second.id], homeBuildingId: home.id })];
    world.settlementProgression.ensureFoundingSettlement();
    return world;
  }

  createParent(id, name, partnerId, position) {
    return new Character({ id, name, partnerId, position: { ...position }, worldType: 'human', lifeStage: 'adult', alive: true, householdId: 'household-1', homeBuildingId: 'home-1' });
  }

  advance(world, seconds) {
    for (let elapsed = 0; elapsed < seconds; elapsed += 0.1) world.update(0.1);
  }
}

test('a complete Human cycle produces a child and an arriving newcomer', () => {
  const harness = new PopulationGrowthHarness();
  const world = harness.createHumanFamily();
  world.reproduction.random.next = () => 0;

  harness.advance(world, 90.1);

  assert.ok(world.characters.some(character => character.lifeStage === 'child'));
  const newcomer = world.characters.find(character => character.newcomer);
  assert.ok(newcomer);
  assert.equal(newcomer.arrivalCycle, 2);
  assert.equal(newcomer.settlementId, 'settlement-1');
  assert.equal(world.newcomers.lastArrivalCycle, 2);
});
