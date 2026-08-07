import { WorldTypeId } from '../data/WorldTypes.js';
import { SeededRandom } from './SeededRandom.js';
import { TerrainMap } from './TerrainMap.js';

export class WorldGenerator {
  static WIDTH = 96;
  static HEIGHT = 60;

  generate(worldType, seed) {
    const random = new SeededRandom(seed);
    const cells = worldType === WorldTypeId.HUMAN
      ? this.generateIsland(random)
      : new Array(WorldGenerator.WIDTH * WorldGenerator.HEIGHT).fill(TerrainMap.Types.GRASS);
    return new TerrainMap(WorldGenerator.WIDTH, WorldGenerator.HEIGHT, cells, this.generateDecoration(random, worldType));
  }

  generateIsland(random) {
    const { WIDTH: width, HEIGHT: height } = WorldGenerator;
    const phases = Array.from({ length: 5 }, () => random.range(0, Math.PI * 2));
    const cells = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const nx = (x + 0.5 - width / 2) / (width * 0.39);
        const ny = (y + 0.5 - height / 2) / (height * 0.4);
        const angle = Math.atan2(ny, nx);
        const radius = Math.sqrt(nx * nx + ny * ny);
        const coast = 1 + Math.sin(angle * 3 + phases[0]) * 0.09
          + Math.sin(angle * 5 + phases[1]) * 0.045
          + Math.sin(x * 0.19 + phases[2]) * Math.sin(y * 0.17 + phases[3]) * 0.045;
        const sandWidth = 0.10 + Math.sin(angle * 7 + phases[4]) * 0.025;
        cells.push(radius < coast - sandWidth ? TerrainMap.Types.GRASS
          : radius < coast ? TerrainMap.Types.BEACH : TerrainMap.Types.SEA);
      }
    }
    return cells;
  }

  generateDecoration(random, worldType) {
    const count = worldType === WorldTypeId.HUMAN ? 190 : 330;
    return Array.from({ length: count }, () => ({
      x: random.range(0, WorldGenerator.WIDTH), y: random.range(0, WorldGenerator.HEIGHT),
      size: random.range(0.35, 1), tone: random.next(), phase: random.range(0, Math.PI * 2),
    }));
  }
}
