import { Config } from '../core/Config.js';
import { TerrainMap } from '../world/TerrainMap.js';
import { WorldTypeId } from '../data/WorldTypes.js';
import { SeededRandom } from '../world/SeededRandom.js';
import { CharacterRenderer } from './CharacterRenderer.js';
import { CharacterAssetRegistry } from '../assets/CharacterAssetRegistry.js';
import { AssetLoader } from '../assets/AssetLoader.js';

export class Renderer {
  constructor(canvas, windowObject = globalThis.window, registry = new CharacterAssetRegistry(), assetLoader = null) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.window = windowObject;
    this.world = null;
    this.elapsed = 0;
    this.terrainLayer = null;
    this.assetRegistry = registry;
    this.assetLoader = assetLoader ?? new AssetLoader(registry);
    this.characterRenderer = new CharacterRenderer(this.context, registry, this.assetLoader);
  }

  setWorld(world) { this.world = world; this.buildTerrainLayer(); }
  update(deltaTime) { this.elapsed += deltaTime; }

  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.max(1, this.window?.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width; this.canvas.height = height;
    }
  }

  render() {
    if (!this.world?.terrain) { this.renderFoundation(); return; }
    this.drawBaseTerrain();
    this.drawTerrainDecoration();
    this.drawWorldObjects();
    this.drawBuildings();
    this.drawCharacters();
    this.drawMiracleEffects();
    this.drawGameplayUI();
  }

  renderFoundation() {
    const { context, canvas } = this;
    context.fillStyle = Config.BACKGROUND_COLOR; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#e8e4dc'; context.textAlign = 'center';
    context.font = `${Math.max(18, canvas.height * 0.035)}px system-ui, sans-serif`;
    context.fillText('ELYSIA', canvas.width / 2, canvas.height / 2);
    context.font = `${Math.max(11, canvas.height * 0.018)}px system-ui, sans-serif`;
    context.fillText(Config.VERSION, canvas.width / 2, canvas.height / 2 + canvas.height * 0.05);
  }

  buildTerrainLayer() {
    const terrain = this.world?.terrain;
    const documentObject = this.canvas.ownerDocument ?? globalThis.document;
    if (!terrain || !documentObject?.createElement) return;
    this.terrainLayer = documentObject.createElement('canvas');
    this.terrainLayer.width = terrain.width * 10; this.terrainLayer.height = terrain.height * 10;
    const context = this.terrainLayer.getContext('2d');
    const random = new SeededRandom(this.world.worldSeed ^ 0xa73c9);
    const colors = {
      sea: ['#17657a', '#20788a', '#155b73'], beach: ['#d6bd78', '#e0ca8a', '#cbb06c'],
      grass: this.world.worldType === WorldTypeId.PLANT ? ['#3f8059', '#4b9064', '#367650'] : ['#3c7445', '#4b824e', '#32683d'],
    };
    terrain.cells.forEach((type, index) => {
      const x = index % terrain.width; const y = Math.floor(index / terrain.width);
      context.fillStyle = colors[type][Math.floor(random.next() * colors[type].length)];
      context.fillRect(x * 10, y * 10, 11, 11);
    });
  }

  drawBaseTerrain() {
    const { context, canvas } = this;
    context.fillStyle = '#174e62'; context.fillRect(0, 0, canvas.width, canvas.height);
    if (this.terrainLayer) context.drawImage(this.terrainLayer, 0, 0, canvas.width, canvas.height);
    if (this.world.worldType === WorldTypeId.HUMAN) {
      context.save(); context.globalAlpha = 0.12;
      context.fillStyle = '#a6e5e1';
      const band = (this.elapsed * 18) % 55;
      for (let y = -55 + band; y < canvas.height; y += 55) context.fillRect(0, y, canvas.width, Math.max(1, canvas.height * 0.004));
      context.restore();
    }
  }

  drawTerrainDecoration() {
    const { context, canvas } = this; const terrain = this.world.terrain;
    context.save(); context.lineCap = 'round';
    for (const detail of terrain.decoration) {
      if (!terrain.isTerrainType(detail.x, detail.y, TerrainMap.Types.GRASS)) continue;
      const x = detail.x / terrain.width * canvas.width; const y = detail.y / terrain.height * canvas.height;
      const sway = this.world.worldType === WorldTypeId.PLANT ? Math.sin(this.elapsed * 0.8 + detail.phase) * 2 : 0;
      context.strokeStyle = detail.tone > 0.5 ? 'rgba(177,210,116,.28)' : 'rgba(26,79,42,.24)';
      context.lineWidth = Math.max(1, detail.size * canvas.height / 420);
      context.beginPath(); context.moveTo(x, y + 4); context.quadraticCurveTo(x + sway, y, x + sway + 2, y - 5 * detail.size); context.stroke();
    }
    context.restore();
  }

  drawWorldObjects() {}
  drawBuildings() {}
  drawMiracleEffects() {}
  drawGameplayUI() {}

  characterPoint(character) {
    return { x: (character.position.x + 0.5) / this.world.terrain.width * this.canvas.width,
      y: (character.position.y + 0.5) / this.world.terrain.height * this.canvas.height };
  }

  drawCharacters() {
    for (const character of this.world.characters) {
      const point = this.characterPoint(character);
      const pixelsPerWorldUnit = Math.min(this.canvas.width / this.world.terrain.width,
        this.canvas.height / this.world.terrain.height);
      this.characterRenderer.render(character, point, this.elapsed, pixelsPerWorldUnit);
    }
  }
}
