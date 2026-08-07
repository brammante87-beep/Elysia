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
    this.worldImages = new Map();
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

  screenToWorld(point) { return { x: point.x / this.canvas.width * this.world.terrain.width, y: point.y / this.canvas.height * this.world.terrain.height }; }
  worldPoint(position) { return { x: position.x / this.world.terrain.width * this.canvas.width, y: position.y / this.world.terrain.height * this.canvas.height }; }
  image(path) { if (!this.worldImages.has(path)) { const image = new Image(); image.src = path; this.worldImages.set(path, image); } return this.worldImages.get(path); }
  drawAsset(path, position, worldWidth, worldHeight, alpha = 1) { const image = this.image(path); if (!image.complete) return; const point = this.worldPoint(position); const width = worldWidth / this.world.terrain.width * this.canvas.width; const height = worldHeight / this.world.terrain.height * this.canvas.height; this.context.save(); this.context.globalAlpha = alpha; this.context.drawImage(image, point.x - width / 2, point.y - height * .82, width, height); this.context.restore(); }
  drawWorldObjects() { for (const tree of this.world.trees) this.drawAsset(tree.harvestable ? 'assets/entities/tree-healthy.svg' : 'assets/entities/tree-stump.svg', tree.position, 4.1, tree.harvestable ? 5.2 : 2.1); for (const source of this.world.waterSources.filter(e => e.alive)) this.drawAsset('assets/entities/water-source.svg', source.position, 3.5, 2.4); for (const cow of this.world.cows.filter(e => e.alive)) this.drawAsset('assets/entities/cow-idle.svg', cow.position, 4.8, 3.5); }
  drawBuildings() { if (this.world.hut) this.drawAsset('assets/entities/hut.svg', this.world.hut.position, 6.2, 5.2, this.world.hut.completed ? 1 : Math.max(.25, this.world.hut.buildProgress)); }
  drawMiracleEffects() { for (const effect of this.world.effects) { const point = this.worldPoint(effect.position); const radius = (12 + effect.age * 35) * (this.canvas.width / 1200); this.context.save(); this.context.globalAlpha = 1 - effect.age / .8; this.context.strokeStyle = effect.type === 'valid' ? '#fff1a8' : '#ef8d79'; this.context.lineWidth = 3; this.context.beginPath(); this.context.arc(point.x, point.y, radius, 0, Math.PI * 2); this.context.stroke(); this.context.restore(); } }
  drawGameplayUI() { if (this.world.hut?.completed) { const point = this.worldPoint(this.world.hut.position); const storage = this.world.hut.storage; this.context.save(); this.context.fillStyle = 'rgba(8,18,22,.82)'; this.context.fillRect(point.x - 72, point.y + 12, 144, 28); this.context.fillStyle = '#f7e9b7'; this.context.textAlign = 'center'; this.context.font = '11px system-ui'; this.context.fillText(`Legno ${storage.get('wood')}/6  Acqua ${storage.get('water')}/6  Cibo ${storage.get('food')}/6`, point.x, point.y + 30); this.context.restore(); } const character = this.world.characters[0]; if (character && this.world.ai) { const point = this.characterPoint(character); this.context.save(); this.context.fillStyle = 'rgba(7,16,20,.7)'; this.context.font = '11px system-ui'; this.context.textAlign = 'center'; this.context.fillText(this.world.ai.status(), point.x, point.y - 42); this.context.restore(); } }

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
