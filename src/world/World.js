import { WorldGenerator } from './WorldGenerator.js';
import { TerrainMap } from './TerrainMap.js';
import { Tree } from '../entities/Tree.js';
import { WaterSource } from '../entities/WaterSource.js';
import { Cow } from '../entities/Cow.js';
import { Hut } from '../entities/Hut.js';
import { CharacterAI } from '../ai/CharacterAI.js';
import { WorldTypeId } from '../data/WorldTypes.js';
import { House } from '../entities/House.js';
import { Character } from '../entities/Character.js';
import { Household } from '../households/Household.js';
import { HouseholdProgression } from '../progression/HouseholdProgression.js';
import { PlantWorldProgression } from '../progression/PlantWorldProgression.js';
import { TargetReservation } from '../ai/TargetReservation.js';
import { Pathfinder } from './Pathfinder.js';

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
    if (data.hut) this.hut = data.hut.kind === 'house' ? new House(data.hut) : new Hut(data.hut);
    this.playerCreatedTreeCount = data.playerCreatedTreeCount ?? this.trees.filter(tree => tree.playerCreated).length;
    this.nextEntityId = this.allEntities().reduce((maximum, entity) => Math.max(maximum, Number(String(entity.id).match(/\d+$/)?.[0] ?? 0)), 0) + 1;
    const savedCharacters = data.characters ?? (chosenOne ? [chosenOne.toJSON()] : []);
    for (const item of savedCharacters) this.addCharacter(item instanceof Character ? item : new Character(item));
    this.households = (data.households ?? []).map(item => new Household(item));
    this.householdProgression.restore(data.householdProgression);
    this.plantProgression.restore(data.plantProgression);
    for (const character of this.characters) this.ensureAI(character).restore(data.ais?.[character.id] ?? (character.chosenOne ? data.ai : {}));
  }

  resetEntities() { this.trees = []; this.waterSources = []; this.cows = []; this.hut = null; this.effects = []; this.nextEntityId = 1; this.ai = null; this.ais = new Map(); this.households = []; this.selectedCharacterId = null; this.reservations = new TargetReservation(); this.playerCreatedTreeCount = 0; this.householdProgression = new HouseholdProgression(this); this.plantProgression = new PlantWorldProgression(this); }
  addCharacter(character, withAI = true) { if (!this.characters.some(item => item.id === character.id)) this.characters.push(character); if (withAI) this.ensureAI(character); }
  ensureAI(character) { if (!this.ais.has(character.id)) this.ais.set(character.id, new CharacterAI(character, this)); if (character.chosenOne) this.ai = this.ais.get(character.id); return this.ais.get(character.id); }
  getTerrainAt(x, y) { return this.terrain?.getTerrainAt(x, y) ?? null; }
  inspectCharacter(position) { const character = this.characters.find(item => Math.hypot(item.position.x - position.x, item.position.y - position.y) <= item.interactionRadius); this.selectedCharacterId = character?.id ?? null; return character ?? null; }
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
  placeEntity(powerId, position) { if (this.worldType === WorldTypeId.PLANT && !this.plantProgression.canCast()) return false; const constructors = { plant: Tree, water: WaterSource, cow: Cow }; const Entity = constructors[powerId]; if (!Entity || !this.canPlace(position)) { this.addEffect(position, 'invalid'); return false; } const entity = new Entity({ id: `${powerId}-${this.nextEntityId++}`, position, playerCreated: powerId === 'plant' }); if (powerId === 'plant') { this.trees.push(entity); this.playerCreatedTreeCount += 1; this.plantProgression.notifyTreeCreated(); } else if (powerId === 'water') this.waterSources.push(entity); else this.cows.push(entity); this.addEffect(position, 'valid'); return entity; }
  addEffect(position, type) { this.effects.push({ position: { ...position }, type, age: 0 }); }
  findBuildPosition(origin) { for (let radius = 2; radius < 9; radius += 1) for (let y = -radius; y <= radius; y += 1) for (let x = -radius; x <= radius; x += 1) { const point = { x: Math.floor(origin.x + x) + 0.5, y: Math.floor(origin.y + y) + 0.5 }; if (this.canPlace(point, 1.25)) return point; } return null; }
  beginHut(position) { if (!this.hut) this.hut = new Hut({ id: 'hut-1', position, completed: false, buildProgress: 0 }); }
  completeHut() { if (this.hut) { this.hut.completed = true; this.hut.buildProgress = 1; this.addEffect(this.hut.position, 'valid'); } }
  findDistantReachablePosition(origin, hutPosition) { const pathfinder = new Pathfinder(); const candidates = []; for (let y = 1; y < this.terrain.height - 1; y += 1) for (let x = 1; x < this.terrain.width - 1; x += 1) if (this.isWalkable(x, y) && Math.hypot(x - origin.x, y - origin.y) >= 8 && Math.hypot(x - hutPosition.x, y - hutPosition.y) >= 5) candidates.push({ x, y }); candidates.sort((a, b) => Math.min(a.x, a.y, this.terrain.width-a.x, this.terrain.height-a.y) - Math.min(b.x, b.y, this.terrain.width-b.x, this.terrain.height-b.y)); return candidates.find(point => pathfinder.findPath(this.terrain, point, origin).length > 0) ?? null; }
  update(deltaTime) { this.effects.forEach(effect => { effect.age += deltaTime; }); this.effects = this.effects.filter(effect => effect.age < (effect.type === 'transform' ? 1.4 : .8)); this.hut?.update?.(deltaTime); if (this.worldType !== WorldTypeId.PLANT) { this.householdProgression.update(deltaTime); for (const ai of this.ais.values()) if (this.householdProgression.partnerId !== ai.character.id || this.householdProgression.state === HouseholdProgression.States.COMPLETE) ai.update(deltaTime); } else this.plantProgression.update(deltaTime); }
  toJSON() { return { trees: this.trees.map(e => e.toJSON()), waterSources: this.waterSources.map(e => e.toJSON()), cows: this.cows.map(e => e.toJSON()), hut: this.hut?.toJSON() ?? null, characters: this.characters.map(e => e.toJSON()), households: this.households.map(e => e.toJSON()), ais: Object.fromEntries([...this.ais].map(([id, ai]) => [id, ai.toJSON()])), ai: this.ai?.toJSON() ?? null, householdProgression: this.householdProgression.toJSON(), plantProgression: this.plantProgression.toJSON(), playerCreatedTreeCount: this.playerCreatedTreeCount }; }
}
