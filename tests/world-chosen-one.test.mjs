import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldGenerator } from '../src/world/WorldGenerator.js';
import { TerrainMap } from '../src/world/TerrainMap.js';
import { World } from '../src/world/World.js';
import { CharacterCreator } from '../src/entities/CharacterCreator.js';
import { SaveManager } from '../src/persistence/SaveManager.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

test('Human generation is deterministic, seed-sensitive, and contains all terrain types', () => {
  const generator = new WorldGenerator();
  const first = generator.generate('human', 12345); const again = generator.generate('human', 12345);
  const different = generator.generate('human', 54321);
  assert.deepEqual(first.cells, again.cells);
  assert.notDeepEqual(first.cells, different.cells);
  for (const type of Object.values(TerrainMap.Types)) assert.equal(first.cells.includes(type), true);
});

for (const type of ['beast', 'plant']) test(`${type} gameplay terrain is entirely grass`, () => {
  const terrain = new WorldGenerator().generate(type, 22);
  assert.equal(terrain.cells.every(cell => cell === TerrainMap.Types.GRASS), true);
});

for (const type of ['human', 'beast']) test(`${type} spawn is valid grass`, () => {
  const world = new World(); world.create(type, 99); const spawn = world.findSpawnPosition();
  assert.equal(world.isWalkable(spawn.x, spawn.y), true);
});

test('human attributes remain independent and accept a trans-compatible combination', () => {
  const character = new CharacterCreator().createHuman({ name: '  Alba  ', sexCharacteristics: 'female',
    genderIdentity: 'man', sexualOrientation: 'bisexual' }, { x: 2, y: 3 }, 77);
  assert.equal(character.name, 'Alba'); assert.equal(character.sexCharacteristics, 'female');
  assert.equal(character.genderIdentity, 'man'); assert.equal(character.sexualOrientation, 'bisexual');
  assert.equal(character.id, 'chosen-25'); assert.equal(character.chosenOne, true); assert.equal(character.alive, true);
});

test('human and beast names are required and beast IDs are exact', () => {
  const creator = new CharacterCreator();
  assert.deepEqual(CharacterCreator.BeastSpecies, ['deer', 'cat', 'dog']);
  assert.throws(() => creator.createHuman({ name: ' ', sexCharacteristics: 'male', genderIdentity: 'man', sexualOrientation: 'heterosexual' }, { x: 0, y: 0 }), /nome/i);
  assert.throws(() => creator.createBeast({ name: '', species: 'cat' }, { x: 0, y: 0 }), /nome/i);
  assert.throws(() => creator.createBeast({ name: 'Luce', species: 'wolf' }, { x: 0, y: 0 }), /species/i);
});

for (const type of ['human', 'beast']) test(`${type} save restores one Chosen One, position, seed, and terrain`, () => {
  const world = new World(); world.create(type, 8080); const creator = new CharacterCreator();
  const data = type === 'human' ? { name: 'Ari', sexCharacteristics: 'intersex', genderIdentity: 'nonBinary', sexualOrientation: 'gayLesbian' } : { name: 'Nube', species: 'deer' };
  const chosen = type === 'human' ? creator.createHuman(data, world.findSpawnPosition(), 8080) : creator.createBeast(data, world.findSpawnPosition(), 8080);
  world.addCharacter(chosen); const cells = [...world.terrain.cells];
  const saves = new SaveManager(new MemoryStorage()); saves.save({ state: 'PLAYING', worldType: type, worldSeed: 8080, chosenOne: chosen.toJSON() });
  const loaded = saves.load().data; const restored = new World(); restored.restore(loaded.worldType, loaded.worldSeed, creator.restore(loaded.chosenOne));
  restored.addCharacter(creator.restore(loaded.chosenOne));
  assert.equal(loaded.worldType, type); assert.equal(loaded.worldSeed, 8080); assert.deepEqual(restored.terrain.cells, cells);
  assert.deepEqual(restored.characters[0].position, chosen.position); assert.equal(restored.characters.length, 1);
});
