import { WorldTypeId } from '../data/WorldTypes.js';
import { SeededRandom } from '../world/SeededRandom.js';

export class TerrainVisualModel {
  static PIXELS_PER_WORLD_UNIT = 12;

  constructor(terrain, worldType, seed) {
    this.width = terrain.width;
    this.height = terrain.height;
    this.worldType = worldType;
    this.seed = Number(seed) >>> 0;
    this.pixelWidth = this.width * TerrainVisualModel.PIXELS_PER_WORLD_UNIT;
    this.pixelHeight = this.height * TerrainVisualModel.PIXELS_PER_WORLD_UNIT;
    this.phases = this.createPhases();
    this.decorations = this.createDecorations();
  }

  createPhases() {
    const random = new SeededRandom(this.seed ^ 0x51a7c3);
    return Array.from({ length: 8 }, () => random.range(0, Math.PI * 2));
  }

  coastRadius(angle) {
    return 1 + Math.sin(angle * 3 + this.phases[0]) * 0.075
      + Math.sin(angle * 5 + this.phases[1]) * 0.04
      + Math.sin(angle * 7 + this.phases[2]) * 0.022
      + Math.sin(angle * 11 + this.phases[3]) * 0.012;
  }

  contour(offset = 0, count = 240) {
    if (this.worldType !== WorldTypeId.HUMAN) return [];
    const points = [];
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * Math.PI * 2;
      const radius = this.coastRadius(angle) + offset;
      points.push({
        x: this.width * 0.5 + Math.cos(angle) * this.width * 0.39 * radius,
        y: this.height * 0.5 + Math.sin(angle) * this.height * 0.4 * radius,
      });
    }
    return points;
  }

  normalizedRadius(x, y) {
    const nx = (x - this.width * 0.5) / (this.width * 0.39);
    const ny = (y - this.height * 0.5) / (this.height * 0.4);
    return { angle: Math.atan2(ny, nx), radius: Math.hypot(nx, ny) };
  }

  isVisualGrass(x, y) {
    if (this.worldType !== WorldTypeId.HUMAN) return true;
    const point = this.normalizedRadius(x, y);
    return point.radius < this.coastRadius(point.angle) - 0.12;
  }

  createDecorations() {
    const random = new SeededRandom(this.seed ^ 0xd3c04a);
    const target = this.worldType === WorldTypeId.PLANT ? 430 : this.worldType === WorldTypeId.BEAST ? 260 : 220;
    const decorations = [];
    for (let attempt = 0; attempt < target * 12 && decorations.length < target; attempt += 1) {
      const x = random.range(2, this.width - 2);
      const y = random.range(2, this.height - 2);
      if (!this.isVisualGrass(x, y)) continue;
      const centerDistance = Math.hypot((x - this.width / 2) / (this.width / 2), (y - this.height / 2) / (this.height / 2));
      const density = 0.18 + Math.min(0.72, centerDistance * 0.85);
      if (random.next() > density) continue;
      const roll = random.next();
      decorations.push({
        x, y, phase: random.range(0, Math.PI * 2), size: random.range(0.55, 1.35),
        kind: roll < 0.47 ? 'tuft' : roll < 0.72 ? 'flower' : roll < 0.9 ? 'shrub' : 'rock',
        variant: Math.floor(random.range(0, 4)),
      });
    }
    return decorations;
  }
}
