import { Config } from '../core/Config.js';
import { CharacterRenderer } from './CharacterRenderer.js';
import { CharacterAssetRegistry } from '../assets/CharacterAssetRegistry.js';
import { AssetLoader } from '../assets/AssetLoader.js';
import { TerrainLayerCache } from './TerrainLayerCache.js';

export class Renderer {
  constructor(canvas, windowObject = globalThis.window, registry = new CharacterAssetRegistry(), assetLoader = null) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.window = windowObject;
    this.world = null;
    this.elapsed = 0;
    this.terrainCache = null;
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
    this.terrainCache = new TerrainLayerCache(documentObject, terrain, this.world.worldType, this.world.worldSeed);
  }

  drawBaseTerrain() {
    const { context, canvas } = this;
    context.fillStyle = '#083b59'; context.fillRect(0, 0, canvas.width, canvas.height);
    this.terrainCache?.drawStatic(context, canvas.width, canvas.height);
    this.terrainCache?.drawDynamic(context, canvas.width, canvas.height, this.elapsed);
    if (this.world.plantProgression?.triggered) { context.fillStyle = `rgba(15,8,20,${Math.min(.58, this.world.plantProgression.elapsed * .075)})`; context.fillRect(0, 0, canvas.width, canvas.height); }
  }

  screenToWorld(point) { return { x: point.x / this.canvas.width * this.world.terrain.width, y: point.y / this.canvas.height * this.world.terrain.height }; }
  worldPoint(position) { return { x: position.x / this.world.terrain.width * this.canvas.width, y: position.y / this.world.terrain.height * this.canvas.height }; }
  image(path) { if (!this.worldImages.has(path)) { const image = new Image(); image.src = path; this.worldImages.set(path, image); } return this.worldImages.get(path); }
  drawAsset(path, position, worldWidth, worldHeight, alpha = 1) { const image = this.image(path); if (!image.complete) return; const point = this.worldPoint(position); const width = worldWidth / this.world.terrain.width * this.canvas.width; const height = worldHeight / this.world.terrain.height * this.canvas.height; this.context.save(); this.context.globalAlpha = alpha; this.context.drawImage(image, point.x - width / 2, point.y - height * .82, width, height); this.context.restore(); }
  drawWorldObjects() { for (const tree of this.world.trees) this.drawAsset(tree.harvestable ? 'assets/entities/tree-healthy.svg' : 'assets/entities/tree-stump.svg', tree.position, 4.1, tree.harvestable ? 5.2 : 2.1); for (const source of this.world.waterSources.filter(e => e.alive)) this.drawAsset('assets/entities/water-source.svg', source.position, 3.5, 2.4); for (const cow of this.world.cows.filter(e => e.alive)) this.drawAsset('assets/entities/cow-idle.svg', cow.position, 4.8, 3.5); }
  drawBuildings() { if (this.world.hut) { const house = this.world.hut.kind === 'house'; this.drawAsset(house ? 'assets/entities/house.svg' : 'assets/entities/hut.svg', this.world.hut.position, house ? 8 : 6.2, house ? 6.4 : 5.2, this.world.hut.completed ? 1 : Math.max(.25, this.world.hut.buildProgress)); if (house && this.world.hut.transformationAge < 1.4) this.drawTransformation(this.world.hut); } }
  drawMiracleEffects() { for (const effect of this.world.effects) { const point = this.worldPoint(effect.position); const radius = (12 + effect.age * 35) * (this.canvas.width / 1200); this.context.save(); this.context.globalAlpha = 1 - effect.age / .8; this.context.strokeStyle = effect.type === 'valid' ? '#fff1a8' : '#ef8d79'; this.context.lineWidth = 3; this.context.beginPath(); this.context.arc(point.x, point.y, radius, 0, Math.PI * 2); this.context.stroke(); this.context.restore(); } }
  drawGameplayUI() { if (this.world.hut?.completed) { const point = this.worldPoint(this.world.hut.position); const storage = this.world.hut.storage; this.context.save(); this.context.fillStyle = 'rgba(8,18,22,.82)'; this.context.fillRect(point.x - 72, point.y + 12, 144, 28); this.context.fillStyle = '#f7e9b7'; this.context.textAlign = 'center'; this.context.font = '11px system-ui'; this.context.fillText(`Legno ${storage.get('wood')}/6  Acqua ${storage.get('water')}/6  Cibo ${storage.get('food')}/6`, point.x, point.y + 30); const household = this.world.households[0]; if (household) { const names = household.memberIds.map(id => this.world.characters.find(c => c.id === id)?.name).filter(Boolean); this.context.font = '600 12px Georgia'; this.context.fillText(names.join(' & ').toLocaleUpperCase('it'), point.x, point.y - 55); } this.context.restore(); } for (const character of this.world.characters) { const ai = this.world.ais.get(character.id); if (!ai) continue; const point = this.characterPoint(character); this.context.save(); this.context.fillStyle = 'rgba(7,16,20,.7)'; this.context.font = '11px system-ui'; this.context.textAlign = 'center'; this.context.fillText(ai.status(), point.x, point.y - 42); this.context.restore(); } this.drawCharacterInfo(); this.drawSpeechBubble(); this.drawPlantEnding(); }

  drawCharacterInfo() { const character = this.world.characters.find(item => item.id === this.world.selectedCharacterId); if (!character) return; const ai = this.world.ais.get(character.id); const household = this.world.households.find(item => item.id === character.householdId); const lines = [character.name, character.chosenOne ? 'Prescelto di Elysia' : 'Abitante di Elysia', ai?.status() ?? 'In attesa', household ? `Casa: ${household.id}` : 'Senza dimora']; if (character.genderIdentity) lines.push(`Identità: ${character.genderIdentity} · Orientamento: ${character.sexualOrientation}`); const context = this.context; context.save(); context.fillStyle='rgba(7,14,20,.9)'; context.strokeStyle='#b99d68'; context.lineWidth=1; context.fillRect(18,18,310,22+lines.length*21); context.strokeRect(18,18,310,22+lines.length*21); context.fillStyle='#f4e7bd'; context.textAlign='left'; lines.forEach((line,index)=>{ context.font=index===0?'600 17px Georgia':'12px system-ui'; context.fillText(line,34,46+index*21); }); context.restore(); }

  drawTransformation(building) { const point = this.worldPoint(building.position); const progress = building.transformationAge / 1.4; const context = this.context; context.save(); context.globalAlpha = 1 - progress; const glow = context.createRadialGradient(point.x, point.y, 4, point.x, point.y, 90); glow.addColorStop(0, '#fffbd5dd'); glow.addColorStop(.45, '#f4c76e66'); glow.addColorStop(1, '#f4c76e00'); context.fillStyle = glow; context.beginPath(); context.arc(point.x, point.y, 90, 0, Math.PI * 2); context.fill(); context.restore(); }
  drawSpeechBubble() { const progression = this.world.householdProgression; if (progression?.state !== 'speaking' || !progression.partner) return; const point = this.characterPoint(progression.partner); const context = this.context; const width = Math.min(330, this.canvas.width * .42); const x = Math.max(width / 2 + 10, Math.min(this.canvas.width - width / 2 - 10, point.x)); const y = Math.max(58, point.y - 90); context.save(); context.fillStyle = 'rgba(255,248,220,.96)'; context.strokeStyle = '#8f7446'; context.lineWidth = 2; context.beginPath(); context.roundRect(x-width/2, y-34, width, 56, 14); context.fill(); context.stroke(); context.fillStyle = '#30251c'; context.font = 'italic 14px Georgia'; context.textAlign = 'center'; context.fillText(progression.speechText(), x, y); context.restore(); }
  drawPlantEnding() { const progression = this.world.plantProgression; if (!progression?.triggered) return; const context = this.context; const phase = progression.phase(); if (phase === 'rival') { context.save(); context.textAlign = 'center'; context.fillStyle = '#eee4ff'; context.shadowColor = '#aa8eff'; context.shadowBlur = 18; context.font = `400 ${Math.max(20, this.canvas.width*.026)}px Georgia`; context.fillText('« Interessante. Hai scelto un mondo incapace di difendersi. »', this.canvas.width/2, this.canvas.height*.2); context.restore(); } if (phase === 'meteor' || phase === 'impact') { const target = this.worldPoint({ x: this.world.terrain.width/2, y: this.world.terrain.height/2 }); const t = Math.min(1, Math.max(0, (progression.elapsed-3.3)/1.9)); const start = { x: this.canvas.width*1.08, y: -80 }; const meteor = { x: start.x+(target.x-start.x)*t, y:start.y+(target.y-start.y)*t }; context.save(); const gradient = context.createLinearGradient(start.x,start.y,meteor.x,meteor.y); gradient.addColorStop(0,'rgba(255,80,20,0)'); gradient.addColorStop(1,'#ffd08a'); context.strokeStyle=gradient; context.lineWidth=22; context.beginPath(); context.moveTo(start.x,start.y); context.lineTo(meteor.x,meteor.y); context.stroke(); context.fillStyle='#fff1bd'; context.shadowColor='#ff5b24'; context.shadowBlur=28; context.beginPath(); context.arc(meteor.x,meteor.y,14,0,Math.PI*2); context.fill(); if (phase==='impact') { const radius=(progression.elapsed-5.2)*180; context.strokeStyle='#ffe9bd'; context.lineWidth=12; context.globalAlpha=Math.max(0,1-radius/360); context.beginPath(); context.arc(target.x,target.y,radius,0,Math.PI*2); context.stroke(); context.fillStyle=`rgba(255,225,180,${Math.max(0,.8-radius/300)})`; context.fillRect(0,0,this.canvas.width,this.canvas.height); } context.restore(); } }

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
