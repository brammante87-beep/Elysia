import { WorldGenerator } from './WorldGenerator.js';
import { TerrainMap } from './TerrainMap.js';
import { Tree } from '../entities/Tree.js';
import { WaterSource } from '../entities/WaterSource.js';
import { Cow } from '../entities/Cow.js';
import { Hut } from '../entities/Hut.js';
import { CharacterAI } from '../ai/CharacterAI.js';
import { WorldTypeId } from '../data/WorldTypes.js';

export class World {
  constructor(generator = new WorldGenerator()) {
    this.generator = generator;
    this.terrain = null;
    this.worldType = null;
    this.worldSeed = null;
    this.characters = [];
    this.resetEntities();
  }

  create(worldType, worldSeed) {
    this.worldType = worldType;
    this.worldSeed = worldSeed;
    this.terrain = this.generator.generate(worldType, worldSeed);
    this.characters = [];
    this.resetEntities();
    return this.terrain;
  }

  restore(worldType, worldSeed, chosenOne = null, data = {}) {
    this.create(worldType, worldSeed);
    for (const item of data.trees ?? []) this.trees.push(new Tree(item));
    for (const item of data.waterSources ?? []) this.waterSources.push(new WaterSource(item));
    for (const item of data.cows ?? []) this.cows.push(new Cow(item));
    if (data.hut) this.hut = new Hut(data.hut);
    this.playerCreatedTreeCount = data.playerCreatedTreeCount ?? this.trees.length;
    this.nextEntityId = this.allEntities().reduce((maximum, entity) => Math.max(maximum, Number(String(entity.id).match(/\d+$/)?.[0] ?? 0)), 0) + 1;
    if (chosenOne) { this.addCharacter(chosenOne); this.ai.restore(data.ai); }
  }

  resetEntities() { this.trees = []; this.waterSources = []; this.cows = []; this.hut = null; this.effects = []; this.nextEntityId = 1; this.ai = null; this.playerCreatedTreeCount = 0; }
  addCharacter(character) { if (!this.characters.some(item => item.id === character.id)) { this.characters.push(character); this.ai = new CharacterAI(character, this); } }
  getTerrainAt(x, y) { return this.terrain?.getTerrainAt(x, y) ?? null; }
  isTerrainType(x, y, type) { return this.terrain?.isTerrainType(x, y, type) ?? false; }
  isWalkable(x, y) { return this.terrain?.isWalkable(x, y) ?? false; }

  findSpawnPosition() {
    const center = { x: Math.floor(this.terrain.width / 2), y: Math.floor(this.terrain.height / 2) };
    if (this.isTerrainType(center.x, center.y, TerrainMap.Types.GRASS)) return center;
    for (let radius = 1; radius < this.terrain.width; radius += 1) {
      for (let y = center.y - radius; y <= center.y + radius; y += 1) {
        for (let x = center.x - radius; x <= center.x + radius; x += 1) if (this.isWalkable(x, y)) return { x, y };
      }
    }
    throw new Error('No valid spawn position.');
  }

  findEntity(id) { return [...this.trees, ...this.waterSources, ...this.cows].find(entity => entity.id === id) ?? null; }
  allEntities() { return [...this.characters, ...this.trees.filter(e => e.alive), ...this.waterSources.filter(e => e.alive), ...this.cows.filter(e => e.alive), ...(this.hut ? [this.hut] : [])]; }
  canPlace(position, radius = 0.8) { return this.isTerrainType(position.x, position.y, TerrainMap.Types.GRASS) && this.allEntities().every(entity => Math.hypot(entity.position.x - position.x, entity.position.y - position.y) >= (entity.collisionRadius + radius)); }
  placeEntity(powerId, position) { const constructors = { plant: Tree, water: WaterSource, cow: Cow }; const Entity = constructors[powerId]; if (!Entity || !this.canPlace(position)) { this.addEffect(position, 'invalid'); return false; } const entity = new Entity({ id: `${powerId}-${this.nextEntityId++}`, position }); if (powerId === 'plant') { this.trees.push(entity); this.playerCreatedTreeCount += 1; } else if (powerId === 'water') this.waterSources.push(entity); else this.cows.push(entity); this.addEffect(position, 'valid'); return entity; }
  addEffect(position, type) { this.effects.push({ position: { ...position }, type, age: 0 }); }
  findBuildPosition(origin) { for (let radius = 2; radius < 9; radius += 1) for (let y = -radius; y <= radius; y += 1) for (let x = -radius; x <= radius; x += 1) { const point = { x: Math.floor(origin.x + x) + 0.5, y: Math.floor(origin.y + y) + 0.5 }; if (this.canPlace(point, 1.25)) return point; } return null; }
  beginHut(position) { if (!this.hut) this.hut = new Hut({ id: 'hut-1', position, completed: false, buildProgress: 0 }); }
  completeHut() { if (this.hut) { this.hut.completed = true; this.hut.buildProgress = 1; this.addEffect(this.hut.position, 'valid'); } }
  update(deltaTime) { this.effects.forEach(effect => { effect.age += deltaTime; }); this.effects = this.effects.filter(effect => effect.age < 0.8); if (this.worldType !== WorldTypeId.PLANT) this.ai?.update(deltaTime); }
  toJSON() { return { trees: this.trees.map(e => e.toJSON()), waterSources: this.waterSources.map(e => e.toJSON()), cows: this.cows.map(e => e.toJSON()), hut: this.hut?.toJSON() ?? null, ai: this.ai?.toJSON() ?? null, playerCreatedTreeCount: this.playerCreatedTreeCount }; }
}
