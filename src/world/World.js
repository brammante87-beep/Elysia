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
import { WorldTime } from './WorldTime.js';
import { ReproductionSystem } from '../simulation/ReproductionSystem.js';
import { Dwelling } from '../entities/Dwelling.js';
import { HouseholdMealSystem } from '../households/HouseholdMealSystem.js';
import { AnimalFoodSource } from '../entities/AnimalFoodSource.js';
import { PowerManifestations } from '../data/PowerManifestations.js';
import { Settlement } from '../settlements/Settlement.js';
import { SettlementProgression } from '../settlements/SettlementProgression.js';
import { NewcomerSystem } from '../settlements/NewcomerSystem.js';
import { RelationshipSystem } from '../relationships/RelationshipSystem.js';
import { CentralStructure } from '../entities/CentralStructure.js';

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
    for (const item of data.animalFoodSources ?? []) this.animalFoodSources.push(new AnimalFoodSource(item));
    if (data.hut) { const home = { ...data.hut, visualVariant: data.hut.visualVariant ?? Dwelling.variant(worldType, data.hut.kind === 'house', data.characters?.[0]?.species ?? chosenOne?.species) }; this.hut = data.hut.kind === 'house' ? new House(home) : new Hut(home); }
    this.playerCreatedTreeCount = data.playerCreatedTreeCount ?? this.trees.filter(tree => tree.playerCreated).length;
    this.nextEntityId = this.allEntities().reduce((maximum, entity) => Math.max(maximum, Number(String(entity.id).match(/\d+$/)?.[0] ?? 0)), 0) + 1;
    const savedCharacters = data.characters ?? (chosenOne ? [chosenOne.toJSON()] : []);
    for (const item of savedCharacters) this.addCharacter(item instanceof Character ? item : new Character(item));
    this.homes = (data.homes ?? (data.hut ? [data.hut] : [])).map(item => item.kind === 'centralStructure' ? new CentralStructure(item) : item.kind === 'house' ? new House(item) : new Hut(item));
    if (this.homes.length) this.hut = this.homes.find(home => home.id === data.hut?.id) ?? this.homes[0];
    this.households = (data.households ?? []).map(item => new Household(item));
    this.settlements = (data.settlements ?? []).map(item => new Settlement(item));
    this.worldTime = new WorldTime(data.worldTime);
    this.reproduction = new ReproductionSystem(this); this.reproduction.restore(data.reproduction);
    this.meals = new HouseholdMealSystem(this, data.meals);
    this.settlementProgression = new SettlementProgression(this, data.settlementProgression);
    this.newcomers = new NewcomerSystem(this, data.newcomers);
    this.relationships = new RelationshipSystem(this, data.relationships);
    this.nextCharacterId = data.nextCharacterId ?? this.characters.length + 1;
    this.householdProgression.restore(data.householdProgression);
    this.plantProgression.restore(data.plantProgression);
    for (const character of this.characters) this.ensureAI(character).restore(data.ais?.[character.id] ?? (character.chosenOne ? data.ai : {}));
    this.meals.restoreBehavior();
  }

  resetEntities() { this.trees = []; this.waterSources = []; this.cows = []; this.animalFoodSources = []; this.hut = null; this.homes = []; this.settlements = []; this.effects = []; this.nextEntityId = 1; this.nextCharacterId = 1; this.ai = null; this.ais = new Map(); this.households = []; this.selectedCharacterId = null; this.selectedBuildingId = null; this.reservations = new TargetReservation(); this.playerCreatedTreeCount = 0; this.worldTime = new WorldTime(); this.reproduction = new ReproductionSystem(this); this.meals = new HouseholdMealSystem(this); this.settlementProgression = new SettlementProgression(this); this.newcomers = new NewcomerSystem(this); this.relationships = new RelationshipSystem(this); this.householdProgression = new HouseholdProgression(this); this.plantProgression = new PlantWorldProgression(this); }
  addCharacter(character, withAI = true) { if (!this.characters.some(item => item.id === character.id)) this.characters.push(character); if (withAI) this.ensureAI(character); }
  ensureAI(character) { if (!this.ais.has(character.id)) this.ais.set(character.id, new CharacterAI(character, this)); if (character.chosenOne) this.ai = this.ais.get(character.id); return this.ais.get(character.id); }
  getTerrainAt(x, y) { return this.terrain?.getTerrainAt(x, y) ?? null; }
  inspectCharacter(position) { const character = this.characters.find(item => Math.hypot(item.position.x - position.x, item.position.y - position.y) <= item.interactionRadius); this.selectedCharacterId = character?.id ?? null; return character ?? null; }
  inspectHome(position) { const home = this.homes.find(item => Math.hypot(item.position.x - position.x, item.position.y - position.y) <= item.collisionRadius + .55) ?? null; this.selectedBuildingId = home?.id ?? null; this.selectedCharacterId = null; return home; }
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

  findEntity(id) { return [...this.trees, ...this.waterSources, ...this.cows, ...this.animalFoodSources].find(entity => entity.id === id) ?? null; }
  findHome(id) { return this.homes.find(home => home.id === id) ?? (this.hut?.id === id ? this.hut : null); }
  homeFor(character) { return this.findHome(character.homeBuildingId) ?? this.hut; }
  allEntities() { return [...this.characters, ...this.trees.filter(e => e.alive), ...this.waterSources.filter(e => e.alive), ...this.cows.filter(e => e.alive), ...this.animalFoodSources.filter(e => e.alive), ...this.homes]; }
  canPlace(position, radius = 0.8) { return this.isTerrainType(position.x, position.y, TerrainMap.Types.GRASS) && this.allEntities().every(entity => Math.hypot(entity.position.x - position.x, entity.position.y - position.y) >= (entity.collisionRadius + radius)); }
  placeEntity(powerId, position) { if (this.worldType === WorldTypeId.PLANT && !this.plantProgression.canCast()) return false; const entityType = PowerManifestations.entityType(powerId, this.worldType); const constructors = { plant: Tree, water: WaterSource, cow: Cow, animalFood: AnimalFoodSource }; const Entity = constructors[entityType]; if (!Entity || !this.canPlace(position)) { this.addEffect(position, 'invalid'); return false; } const entity = new Entity({ id: `${entityType}-${this.nextEntityId++}`, position, playerCreated: powerId === 'plant' }); if (powerId === 'plant') { this.trees.push(entity); this.playerCreatedTreeCount += 1; this.plantProgression.notifyTreeCreated(); } else if (powerId === 'water') this.waterSources.push(entity); else if (entityType === 'animalFood') this.animalFoodSources.push(entity); else this.cows.push(entity); this.addEffect(position, 'valid'); return entity; }
  addEffect(position, type, data = {}) { this.effects.push({ position: { ...position }, type, age: 0, ...data }); }
  findBuildPosition(origin) { for (let radius = 2; radius < 9; radius += 1) for (let y = -radius; y <= radius; y += 1) for (let x = -radius; x <= radius; x += 1) { const point = { x: Math.floor(origin.x + x) + 0.5, y: Math.floor(origin.y + y) + 0.5 }; if (this.canPlace(point, 1.25)) return point; } return null; }
  beginHut(position) { if (!this.hut) { this.hut = new Hut({ id: 'hut-1', position, completed: false, buildProgress: 0, visualVariant: Dwelling.variant(this.worldType, false, this.characters[0]?.species) }); this.homes = [this.hut]; } }
  completeHut() { if (this.hut) { this.hut.completed = true; this.hut.buildProgress = 1; this.addEffect(this.hut.position, 'valid'); } }
  findDistantReachablePosition(origin, hutPosition) { const pathfinder = new Pathfinder(); const candidates = []; for (let y = 1; y < this.terrain.height - 1; y += 1) for (let x = 1; x < this.terrain.width - 1; x += 1) if (this.isWalkable(x, y) && Math.hypot(x - origin.x, y - origin.y) >= 8 && Math.hypot(x - hutPosition.x, y - hutPosition.y) >= 5) candidates.push({ x, y }); candidates.sort((a, b) => Math.min(a.x, a.y, this.terrain.width-a.x, this.terrain.height-a.y) - Math.min(b.x, b.y, this.terrain.width-b.x, this.terrain.height-b.y)); return candidates.find(point => pathfinder.findPath(this.terrain, point, origin).length > 0) ?? null; }
  findEdgeReachablePosition(target) { const pathfinder = new Pathfinder(); const candidates = []; for (let y = 1; y < this.terrain.height - 1; y += 1) for (let x = 1; x < this.terrain.width - 1; x += 1) if (this.isWalkable(x,y) && Math.min(x,y,this.terrain.width-1-x,this.terrain.height-1-y) <= 3) candidates.push({x,y}); return candidates.find(point => pathfinder.findPath(this.terrain, point, target).length > 0) ?? null; }
  findSettlementHomePosition(settlement) { const center = settlement.center ?? this.hut.position; for (let radius = 3; radius <= 10; radius += 1) for (let step = 0; step < 16; step += 1) { const angle = step * Math.PI / 8; const point = { x: Math.round(center.x + Math.cos(angle) * radius) + .5, y: Math.round(center.y + Math.sin(angle) * radius) + .5 }; if (this.canPlace(point, 1.35)) return point; } return null; }
  moveCharacterToHousehold(householdId, homeId, settlementId, character) { const previous = this.households.find(item => item.id === character.householdId); previous?.removeMember(character.id); const household = this.households.find(item => item.id === householdId); if (!household) return false; household.addMember(character.id); character.householdId = household.id; character.homeBuildingId = homeId; character.settlementId = settlementId; return true; }
  update(deltaTime) { this.effects.forEach(effect => { effect.age += deltaTime; }); this.effects = this.effects.filter(effect => effect.age < (effect.type === 'newLife' ? 6 : effect.type === 'intimacy' ? 4 : effect.type === 'transform' ? 1.4 : .8)); this.hut?.update?.(deltaTime); if (this.worldType !== WorldTypeId.PLANT) { const transitions = this.worldTime.update(deltaTime, true); for (const phase of transitions) this.handleTimePhase(phase); this.householdProgression.update(deltaTime); this.settlementProgression.ensureFoundingSettlement(); this.newcomers.update(deltaTime); this.relationships.update(deltaTime); this.meals.update(deltaTime, this.worldTime.phase !== WorldTime.Phases.NIGHT); for (const ai of this.ais.values()) if (this.householdProgression.partnerId !== ai.character.id || this.householdProgression.state === HouseholdProgression.States.COMPLETE) ai.update(deltaTime); if (this.worldTime.phase === WorldTime.Phases.NIGHT) this.reproduction.evaluateNight(this.worldTime.cycle); } else this.plantProgression.update(deltaTime); }
  handleTimePhase(phase) { if (phase === WorldTime.Phases.NIGHT) { this.meals.beginNight(); for (const ai of this.ais.values()) ai.returnHome(); } if (phase === WorldTime.Phases.DAWN) { this.newcomers.processCompletedDay(this.worldTime.cycle); const child = this.reproduction.birthAtDawn(this.worldTime.cycle); this.reproduction.growChildren(this.worldTime.cycle); for (const ai of this.ais.values()) ai.wake(); if (child) this.ensureAI(child).wake(); } }
  toJSON() { return { trees: this.trees.map(e => e.toJSON()), waterSources: this.waterSources.map(e => e.toJSON()), cows: this.cows.map(e => e.toJSON()), animalFoodSources: this.animalFoodSources.map(e => e.toJSON()), hut: this.hut?.toJSON() ?? null, homes: this.homes.map(e => e.toJSON()), settlements: this.settlements.map(e => e.toJSON()), characters: this.characters.map(e => e.toJSON()), households: this.households.map(e => e.toJSON()), ais: Object.fromEntries([...this.ais].map(([id, ai]) => [id, ai.toJSON()])), ai: this.ai?.toJSON() ?? null, householdProgression: this.householdProgression.toJSON(), plantProgression: this.plantProgression.toJSON(), playerCreatedTreeCount: this.playerCreatedTreeCount, worldTime: this.worldTime.toJSON(), reproduction: this.reproduction.toJSON(), meals: this.meals.toJSON(), newcomers: this.newcomers.toJSON(), relationships: this.relationships.toJSON(), settlementProgression: this.settlementProgression.toJSON(), nextCharacterId: this.nextCharacterId }; }
}
