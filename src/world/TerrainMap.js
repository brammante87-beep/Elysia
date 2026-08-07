export class TerrainMap {
  static Types = Object.freeze({ SEA: 'sea', BEACH: 'beach', GRASS: 'grass' });

  constructor(width, height, cells, decoration = []) {
    this.width = width;
    this.height = height;
    this.cells = cells;
    this.decoration = decoration;
  }

  getTerrainAt(x, y) {
    const column = Math.floor(x);
    const row = Math.floor(y);
    if (column < 0 || row < 0 || column >= this.width || row >= this.height) return null;
    return this.cells[row * this.width + column];
  }

  isTerrainType(x, y, type) { return this.getTerrainAt(x, y) === type; }
  isWalkable(x, y) { return this.isTerrainType(x, y, TerrainMap.Types.GRASS); }
}
