import { WorldGenerator } from './WorldGenerator.js';
import { TerrainMap } from './TerrainMap.js';

export class World {
  constructor(generator = new WorldGenerator()) {
    this.generator = generator;
    this.terrain = null;
    this.worldType = null;
    this.worldSeed = null;
    this.characters = [];
  }

  create(worldType, worldSeed) {
    this.worldType = worldType;
    this.worldSeed = worldSeed;
    this.terrain = this.generator.generate(worldType, worldSeed);
    this.characters = [];
    return this.terrain;
  }

  restore(worldType, worldSeed, chosenOne = null) {
    this.create(worldType, worldSeed);
    if (chosenOne) this.characters.push(chosenOne);
  }

  addCharacter(character) { if (!this.characters.some(item => item.id === character.id)) this.characters.push(character); }
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

  update(_deltaTime) {
    // Gameplay systems will be delegated here in later milestones.
  }
}
