import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/World.js';
import { WorldTypeId } from '../src/data/WorldTypes.js';
import { CharacterCreator } from '../src/entities/CharacterCreator.js';
import { CharacterCompatibility } from '../src/relationships/CharacterCompatibility.js';
import { Resources } from '../src/data/Resources.js';
import { Hut } from '../src/entities/Hut.js';
import { House } from '../src/entities/House.js';

class Alpha006Harness {
  human(seed = 106) {
    const world = new World(); world.create(WorldTypeId.HUMAN, seed);
    const chosen = new CharacterCreator().createHuman({ name: 'Blu', sexCharacteristics: 'female', genderIdentity: 'woman', sexualOrientation: 'bisexual' }, world.findSpawnPosition(), seed);
    world.addCharacter(chosen); world.hut = new Hut({ id: 'hut-1', position: world.findBuildPosition(chosen.position), storage: {} });
    return { world, chosen };
  }
  fill(hut) { for (const resource of Resources.ALL) hut.storage.add(resource, 6); }
  plant(seed = 306) { const world = new World(); world.create(WorldTypeId.PLANT, seed); return world; }
  validPoints(world, count = 12) { const points = []; for (let y = 1; y < world.terrain.height && points.length < count; y += 2) for (let x = 1; x < world.terrain.width && points.length < count; x += 2) { const point = { x: x + .2, y: y + .2 }; if (world.canPlace(point)) points.push(point); } return points; }
}

test('partner waits for 3/3/3, spawns once, is unique and mutually compatible', () => {
  const harness = new Alpha006Harness(); const { world, chosen } = harness.human();
  world.update(.1); assert.equal(world.characters.length, 1);
  world.hut.storage.add('wood', 3); world.hut.storage.add('water', 3); world.hut.storage.add('food', 2); world.update(.1); assert.equal(world.characters.length, 1);
  world.hut.storage.add('food', 1); world.update(.1); assert.equal(world.householdProgression.state, 'blooming'); assert.equal(world.characters.length, 1); world.update(3.6); const partner = world.characters.find(character => !character.chosenOne);
  assert.ok(partner); assert.notEqual(partner.name, chosen.name); assert.equal(CharacterCompatibility.isHumanCompatible(chosen, partner), true);
  world.update(.1); assert.equal(world.characters.filter(character => !character.chosenOne).length, 1);
  assert.equal(world.isWalkable(partner.position.x, partner.position.y), true);
});

test('compatibility supports bisexual and transgender character data independently', () => {
  const transWoman = { sexCharacteristics: 'male', genderIdentity: 'woman', sexualOrientation: 'bisexual' };
  const lesbian = { sexCharacteristics: 'female', genderIdentity: 'woman', sexualOrientation: 'gayLesbian' };
  assert.equal(CharacterCompatibility.isHumanCompatible(transWoman, lesbian), true);
  assert.equal(CharacterCompatibility.isHumanCompatible({ ...transWoman, sexualOrientation: 'heterosexual' }, lesbian), false);
});

test('beast partner has the chosen creature species', () => {
  const world = new World(); world.create(WorldTypeId.BEAST, 206); const creator = new CharacterCreator();
  const chosen = creator.createBeast({ name: 'Rovo', species: 'deer' }, world.findSpawnPosition(), 206); world.addCharacter(chosen);
  world.hut = new Hut({ id: 'hut-1', position: world.findBuildPosition(chosen.position), storage: { wood: 6, water: 6, food: 6 } }); world.update(3.7);
  const partner = world.characters.find(character => !character.chosenOne); assert.equal(partner.species, 'deer'); assert.equal(CharacterCompatibility.isBeastCompatible(chosen, partner), true);
});

test('household transforms the same hut into a shared-capacity House and persists', () => {
  const harness = new Alpha006Harness(); const { world } = harness.human(); harness.fill(world.hut); const position = { ...world.hut.position }; world.update(5.3);
  world.householdProgression.state = 'speaking'; world.householdProgression.speechRemaining = 0; world.update(.1);
  assert.ok(world.hut instanceof House); assert.deepEqual(world.hut.position, position); assert.equal(world.households.length, 1); assert.equal(world.households[0].memberIds.length, 2); assert.equal(world.ais.size, 2);
  assert.equal(world.hut.storage.add('wood', 2), 0); assert.equal(world.hut.storage.get('wood'), 6);
  const saved = world.toJSON(); const restored = new World(); restored.restore(world.worldType, world.worldSeed, null, saved);
  assert.ok(restored.hut instanceof House); assert.equal(restored.households.length, 1); assert.equal(restored.characters.filter(character => !character.chosenOne).length, 1); restored.update(.1); assert.equal(restored.characters.filter(character => !character.chosenOne).length, 1);
});

test('target reservations prefer alternatives and clear safely', () => {
  const harness = new Alpha006Harness(); const { world, chosen } = harness.human(); const other = { ...chosen.toJSON(), id: 'partner-test', name: 'Alma', chosenOne: false }; world.addCharacter(new (chosen.constructor)(other));
  world.reservations.reserve('tree-1', chosen.id); assert.equal(world.reservations.isReservedByOther('tree-1', 'partner-test'), true); world.reservations.releaseTarget('tree-1'); assert.equal(world.reservations.isReservedByOther('tree-1', 'partner-test'), false);
});

test('Plant ending counts only successful player Trees and triggers exactly on ten', () => {
  const harness = new Alpha006Harness(); const world = harness.plant(); const points = harness.validPoints(world);
  assert.equal(world.playerCreatedTreeCount, 0); assert.equal(world.placeEntity('plant', { x: -1, y: -1 }), false); assert.equal(world.playerCreatedTreeCount, 0);
  for (let index = 0; index < 9; index += 1) { assert.ok(world.placeEntity('plant', points[index])); assert.equal(world.plantProgression.triggered, false); }
  assert.ok(world.placeEntity('plant', points[9])); assert.equal(world.playerCreatedTreeCount, 10); assert.equal(world.plantProgression.triggered, true); assert.equal(world.plantProgression.triggerCount, 1);
  assert.equal(world.placeEntity('plant', points[10]), false); world.update(7.3); assert.equal(world.plantProgression.complete, true);
});

test('meteor progression is Plant-only and restore never duplicates it', () => {
  const harness = new Alpha006Harness(); const human = harness.human().world; human.playerCreatedTreeCount = 10; assert.equal(human.plantProgression.notifyTreeCreated(), false);
  const plant = harness.plant(); plant.playerCreatedTreeCount = 10; assert.equal(plant.plantProgression.notifyTreeCreated(), true); const saved = plant.toJSON(); const restored = new World(); restored.restore(WorldTypeId.PLANT, plant.worldSeed, null, saved);
  assert.equal(restored.plantProgression.triggerCount, 1); assert.equal(restored.plantProgression.notifyTreeCreated(), false); assert.equal(restored.plantProgression.triggerCount, 1);
});
