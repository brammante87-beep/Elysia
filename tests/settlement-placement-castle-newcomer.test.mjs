import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/World.js';
import { TerrainMap } from '../src/world/TerrainMap.js';
import { Character } from '../src/entities/Character.js';
import { House } from '../src/entities/House.js';
import { Household } from '../src/households/Household.js';
import { Settlement } from '../src/settlements/Settlement.js';
import { Config } from '../src/core/Config.js';
import { NewcomerSystem } from '../src/settlements/NewcomerSystem.js';

class SettlementFixFixture {
  create(type = 'human') {
    const world = new World(); world.create(type, 73);
    world.terrain = new TerrainMap(64, 48, Array(64 * 48).fill(TerrainMap.Types.GRASS));
    const position = { x: 32, y: 24 };
    const character = new Character({ id: 'founder', name: 'Ari', position: { ...position }, worldType: type, chosenOne: true, species: type === 'beast' ? 'deer' : undefined });
    const home = new House({ id: 'home-1', position, completed: true, householdId: 'household-1', settlementId: 'settlement-1', visualVariant: type === 'beast' ? 'establishedDen.deer' : 'house', storage: { wood: 5, water: 4, food: 6 } });
    const household = new Household({ id: 'household-1', memberIds: [character.id], homeBuildingId: home.id, settlementId: 'settlement-1' });
    character.householdId = household.id; character.homeBuildingId = home.id; character.settlementId = 'settlement-1';
    world.addCharacter(character); world.hut = home; world.homes = [home]; world.households = [household];
    world.settlements = [new Settlement({ id: 'settlement-1', householdIds: [household.id], homeBuildingIds: [home.id], foundingHomeId: home.id, center: position })];
    return world;
  }
  addCompletedHome(world, number, position) { const home = new House({ id: `home-${number}`, position, completed: true, settlementId: 'settlement-1', visualVariant: world.worldType === 'beast' ? 'establishedDen.deer' : 'house' }); world.homes.push(home); world.settlements[0].addHome(home.id); return home; }
}

const fixture = new SettlementFixFixture();

test('compact placement separates four Human homes, stays on grass, rejects coast, and reserves pending slots', () => {
  const world = fixture.create(); world.diagnostics.enabled = true; const settlement = world.settlements[0];
  const positions = [];
  for (let number = 2; number <= 4; number += 1) { const owner = `new-${number}`; const position = world.homePlacement.reserve(settlement, owner); assert.ok(position); positions.push(position); fixture.addCompletedHome(world, number, position); world.homePlacement.complete(owner, `home-${number}`); }
  for (let a = 0; a < world.homes.length; a += 1) for (let b = a + 1; b < world.homes.length; b += 1) assert.equal(world.homePlacement.overlaps(world.homes[a].position, world.homes[a].placementBounds, world.homes[b].position, world.homes[b].placementBounds), false);
  for (const home of world.homes) assert.equal(world.homePlacement.isBuildableGrass(home.position, home.placementBounds), true);
  const first = world.homePlacement.reserve(settlement, 'pending-a'); const second = world.homePlacement.reserve(settlement, 'pending-b'); assert.notDeepEqual(first, second);
  world.terrain.cells[Math.floor(first.y) * world.terrain.width + Math.floor(first.x)] = TerrainMap.Types.BEACH;
  assert.equal(world.homePlacement.isValid(first, world.homes[0].placementBounds), false);
  assert.ok(world.homePlacement.reserve(settlement, 'pending-c'));
  assert.ok(world.diagnostics.events.some(event => event.type === 'homePlacementCandidateRejected'));
});

test('Beast dens share the placement architecture and never overlap', () => {
  const world = fixture.create('beast'); const settlement = world.settlements[0];
  for (let number = 2; number <= 4; number += 1) { const position = world.homePlacement.reserve(settlement, `beast-${number}`); fixture.addCompletedHome(world, number, position); world.homePlacement.complete(`beast-${number}`, `home-${number}`); }
  for (let a = 0; a < world.homes.length; a += 1) for (let b = a + 1; b < world.homes.length; b += 1) assert.equal(world.homePlacement.overlaps(world.homes[a].position, world.homes[a].placementBounds, world.homes[b].position, world.homes[b].placementBounds), false);
});

test('old overlapping save repair moves only buildings and preserves IDs, household, occupants, and storage', () => {
  const world = fixture.create(); fixture.addCompletedHome(world, 2, { x: 32, y: 24 });
  const resident = new Character({ id: 'resident', name: 'Eli', position: { x: 32, y: 24 }, worldType: 'human', chosenOne: false, householdId: 'household-2', homeBuildingId: 'home-2', settlementId: 'settlement-1' }); world.addCharacter(resident); const secondHousehold = new Household({ id: 'household-2', memberIds: ['resident'], homeBuildingId: 'home-2', settlementId: 'settlement-1' }); world.households.push(secondHousehold); world.homes[1].householdId = secondHousehold.id; world.homes[1].storage.add('wood', 3); world.settlements[0].addHousehold(secondHousehold.id);
  const saved = world.toJSON(); const restored = new World(); restored.restore('human', 73, null, saved);
  assert.equal(restored.homes[1].id, 'home-2'); assert.equal(restored.homes[1].householdId, 'household-2'); assert.equal(restored.homes[1].storage.get('wood'), 3); assert.deepEqual(restored.households[1].memberIds, ['resident']);
  assert.equal(restored.homePlacement.overlaps(restored.homes[0].position, restored.homes[0].placementBounds, restored.homes[1].position, restored.homes[1].placementBounds), false);
  const continued = new World(); continued.restore('human', 73, null, restored.toJSON()); assert.deepEqual(continued.homes.map(home => home.position), restored.homes.map(home => home.position));
});

test('four completed qualifying homes transform the founding Human home exactly once', () => {
  const world = fixture.create(); world.diagnostics.enabled = true; const founding = world.homes[0];
  assert.equal(world.settlementProgression.evaluate(), false);
  for (let number = 2; number <= 3; number += 1) { fixture.addCompletedHome(world, number, { x: 32 + number * 6, y: 24 }); assert.equal(world.settlementProgression.evaluate(), false); }
  fixture.addCompletedHome(world, 4, { x: 14, y: 24 }); const central = world.settlementProgression.evaluate();
  assert.equal(central.id, founding.id); assert.equal(central.kind, 'centralStructure'); assert.equal(central.centralVariant, 'castle'); assert.equal(central.visualVariant, 'castle'); assert.deepEqual(central.storage.values, { wood: 5, water: 4, food: 6 }); assert.equal(central.storage.capacity, 30);
  assert.equal(world.homes.length, 4); assert.equal(world.households[0].homeBuildingId, central.id); assert.equal(world.settlements[0].centralStructureId, central.id); assert.equal(world.homes.filter(home => home.kind === 'centralStructure').length, 1); assert.equal(world.settlementProgression.evaluate(), false);
  fixture.addCompletedHome(world, 5, { x: 32, y: 34 }); assert.equal(world.settlementProgression.evaluate(), false); assert.equal(world.homes.filter(home => home.kind === 'centralStructure').length, 1);
  assert.ok(world.effects.some(effect => effect.type === 'settlementTransform' && effect.message.includes('Castello'))); assert.ok(world.diagnostics.events.some(event => event.type === 'centralTransformationCompleted'));
});

test('four completed Beast dens transform the founding den into one Great Den with shared capacity', () => {
  const world = fixture.create('beast'); for (let number = 2; number <= 4; number += 1) fixture.addCompletedHome(world, number, { x: 8 + number * 7, y: 10 });
  const central = world.settlementProgression.evaluate(); assert.equal(central.centralVariant, 'greatDen'); assert.equal(central.visualVariant, 'greatDen'); assert.equal(central.storage.capacity, 30); assert.equal(world.homes.length, 4); assert.equal(world.homes.filter(home => home.kind === 'centralStructure').length, 1);
});

test('newcomer walks, pauses for readable exact speech, then progresses once and persists its introduction stage', () => {
  const world = fixture.create(); world.diagnostics.enabled = true; const newcomer = world.newcomers.spawn(2); const arrival = { ...newcomer.position };
  assert.equal(newcomer.speechText, NewcomerSystem.Speech); assert.ok(Math.hypot(arrival.x - world.settlements[0].center.x, arrival.y - world.settlements[0].center.y) > 5); assert.equal(world.newcomers.progress[newcomer.id].stage, 'approaching');
  for (let elapsed = 0; elapsed < 30 && world.newcomers.progress[newcomer.id].stage === 'approaching'; elapsed += .1) world.newcomers.update(.1);
  const state = world.newcomers.progress[newcomer.id]; assert.equal(state.stage, 'speaking'); assert.equal(newcomer.visualState, 'idle'); assert.equal(newcomer.aiTask, 'introducing'); const speechPosition = { ...newcomer.position }; world.newcomers.update(Config.NEWCOMER_SPEECH_DURATION_SECONDS / 2); assert.deepEqual(newcomer.position, speechPosition); assert.equal(state.wood, 0);
  const saved = world.toJSON(); const restored = new World(); restored.restore('human', 73, null, saved); const restoredState = restored.newcomers.progress[newcomer.id]; assert.equal(restoredState.stage, 'speaking'); restored.newcomers.update(Config.NEWCOMER_SPEECH_DURATION_SECONDS); assert.equal(restoredState.stage, 'progressing'); assert.equal(restored.diagnostics.events.filter(event => event.type === 'newcomerIntroductionCompleted').length, 0);
  assert.ok(world.diagnostics.events.some(event => event.type === 'newcomerIntroductionStarted')); assert.ok(world.diagnostics.events.some(event => event.type === 'newcomerSpeechShown'));
  const beast = fixture.create('beast'); const beastNewcomer = beast.newcomers.spawn(2); assert.ok(beastNewcomer.speechText); assert.equal(beastNewcomer.speechText, NewcomerSystem.Speech);
});
