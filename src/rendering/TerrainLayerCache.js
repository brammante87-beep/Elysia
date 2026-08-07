import { WorldTypeId } from '../data/WorldTypes.js';
import { SeededRandom } from '../world/SeededRandom.js';
import { TerrainVisualModel } from './TerrainVisualModel.js';

export class TerrainLayerCache {
  constructor(documentObject, terrain, worldType, seed) {
    this.document = documentObject;
    this.model = new TerrainVisualModel(terrain, worldType, seed);
    this.layers = new Map();
    this.build();
  }

  build() {
    this.layers.set('base', this.createLayer());
    this.layers.set('texture', this.createLayer());
    this.layers.set('decoration', this.createLayer());
    this.drawBase(this.layers.get('base').getContext('2d'));
    this.drawTexture(this.layers.get('texture').getContext('2d'));
    this.drawDecorations(this.layers.get('decoration').getContext('2d'));
  }

  createLayer() {
    const canvas = this.document.createElement('canvas');
    canvas.width = this.model.pixelWidth;
    canvas.height = this.model.pixelHeight;
    return canvas;
  }

  scalePoint(point) {
    const scale = TerrainVisualModel.PIXELS_PER_WORLD_UNIT;
    return { x: point.x * scale, y: point.y * scale };
  }

  trace(context, points) {
    if (!points.length) return;
    const scaled = points.map(point => this.scalePoint(point));
    context.beginPath(); context.moveTo(scaled[0].x, scaled[0].y);
    for (let index = 0; index < scaled.length; index += 1) {
      const current = scaled[index];
      const next = scaled[(index + 1) % scaled.length];
      context.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
    }
    context.closePath();
  }

  fillContour(context, offset, fillStyle, shadow = null) {
    context.save();
    if (shadow) { context.shadowColor = shadow.color; context.shadowBlur = shadow.blur; context.shadowOffsetY = shadow.y; }
    this.trace(context, this.model.contour(offset)); context.fillStyle = fillStyle; context.fill(); context.restore();
  }

  drawBase(context) {
    const { pixelWidth: width, pixelHeight: height, worldType } = this.model;
    if (worldType !== WorldTypeId.HUMAN) {
      const meadow = context.createLinearGradient(0, 0, width, height);
      meadow.addColorStop(0, worldType === WorldTypeId.PLANT ? '#76b95f' : '#69a955');
      meadow.addColorStop(.48, worldType === WorldTypeId.PLANT ? '#4f964b' : '#518c48');
      meadow.addColorStop(1, '#35743f'); context.fillStyle = meadow; context.fillRect(0, 0, width, height);
      return;
    }
    const sea = context.createRadialGradient(width * .48, height * .44, 20, width * .5, height * .5, width * .7);
    sea.addColorStop(0, '#247f96'); sea.addColorStop(.48, '#12617d'); sea.addColorStop(1, '#073a5a');
    context.fillStyle = sea; context.fillRect(0, 0, width, height);
    this.fillContour(context, .19, '#258fa2');
    this.fillContour(context, .13, '#31a9ae');
    this.fillContour(context, .075, '#68c8bd');
    this.fillContour(context, .025, '#b2ded0');
    const sand = context.createLinearGradient(0, height * .25, width, height * .78);
    sand.addColorStop(0, '#f2d993'); sand.addColorStop(.55, '#ddb96f'); sand.addColorStop(1, '#c99a58');
    this.fillContour(context, 0, sand, { color: 'rgba(4,45,50,.28)', blur: 16, y: 7 });
    const grass = context.createRadialGradient(width * .45, height * .4, 10, width * .5, height * .52, width * .38);
    grass.addColorStop(0, '#83bd5f'); grass.addColorStop(.58, '#559b4b'); grass.addColorStop(1, '#377d43');
    this.fillContour(context, -.1, grass, { color: 'rgba(48,76,33,.35)', blur: 10, y: 5 });
  }

  drawTexture(context) {
    const random = new SeededRandom(this.model.seed ^ 0xb1005);
    const scale = TerrainVisualModel.PIXELS_PER_WORLD_UNIT;
    context.save();
    if (this.model.worldType === WorldTypeId.HUMAN) {
      context.lineCap = 'round';
      for (let index = 0; index < 95; index += 1) {
        const x = random.range(0, this.model.width) * scale; const y = random.range(0, this.model.height) * scale;
        if (this.model.isVisualGrass(x / scale, y / scale)) continue;
        context.strokeStyle = `rgba(205,247,231,${random.range(.06, .16)})`; context.lineWidth = random.range(1, 3);
        context.beginPath(); context.moveTo(x, y); context.quadraticCurveTo(x + 10, y - 4, x + random.range(18, 45), y + 1); context.stroke();
      }
    }
    context.globalCompositeOperation = 'soft-light';
    for (let index = 0; index < 75; index += 1) {
      const x = random.range(0, this.model.width); const y = random.range(0, this.model.height);
      if (!this.model.isVisualGrass(x, y)) continue;
      const radius = random.range(22, 75) * scale;
      const glow = context.createRadialGradient(x * scale, y * scale, 0, x * scale, y * scale, radius);
      glow.addColorStop(0, random.next() > .5 ? 'rgba(210,240,126,.2)' : 'rgba(17,75,47,.18)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = glow; context.fillRect(x * scale - radius, y * scale - radius, radius * 2, radius * 2);
    }
    context.restore();
  }

  drawDecorations(context) {
    const scale = TerrainVisualModel.PIXELS_PER_WORLD_UNIT;
    for (const detail of this.model.decorations) {
      const x = detail.x * scale; const y = detail.y * scale; const size = detail.size * scale;
      context.save(); context.translate(x, y);
      if (detail.kind === 'rock') this.drawRock(context, size, detail.variant);
      else if (detail.kind === 'shrub') this.drawShrub(context, size, detail.variant);
      else if (detail.kind === 'flower') this.drawFlower(context, size, detail.variant);
      else this.drawTuft(context, size, detail.variant);
      context.restore();
    }
  }

  drawRock(context, size, variant) {
    context.fillStyle = 'rgba(29,55,42,.22)'; context.beginPath(); context.ellipse(size * .1, size * .22, size * .85, size * .35, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = ['#718475', '#798b7b', '#687b70', '#87917d'][variant]; context.beginPath(); context.moveTo(-size * .65, size * .12); context.lineTo(-size * .25, -size * .55); context.lineTo(size * .5, -size * .35); context.lineTo(size * .7, size * .18); context.closePath(); context.fill();
    context.strokeStyle = 'rgba(224,225,183,.35)'; context.lineWidth = Math.max(1, size * .1); context.beginPath(); context.moveTo(-size * .22, -size * .38); context.lineTo(size * .4, -size * .2); context.stroke();
  }

  drawShrub(context, size, variant) {
    context.fillStyle = 'rgba(29,67,35,.25)'; context.beginPath(); context.ellipse(0, size * .24, size, size * .38, 0, 0, Math.PI * 2); context.fill();
    const tones = [['#286b3e', '#4b974e'], ['#397b3e', '#69a952'], ['#276748', '#4b8e58'], ['#3e8144', '#72a94d']][variant];
    for (const [dx, dy, radius] of [[-.45,0,.55],[.4,.05,.62],[0,-.28,.72]]) { context.fillStyle = tones[0]; context.beginPath(); context.arc(dx * size, dy * size, radius * size, 0, Math.PI * 2); context.fill(); context.fillStyle = tones[1]; context.beginPath(); context.arc((dx - .12) * size, (dy - .16) * size, radius * size * .58, 0, Math.PI * 2); context.fill(); }
  }

  drawFlower(context, size, variant) {
    context.strokeStyle = '#34783e'; context.lineWidth = Math.max(1, size * .1); context.beginPath(); context.moveTo(0, size * .35); context.lineTo(0, -size * .32); context.stroke();
    context.fillStyle = ['#f6e5a3', '#e9b6cf', '#c9d6f2', '#f5c487'][variant];
    for (let petal = 0; petal < 4; petal += 1) { const angle = petal * Math.PI / 2; context.beginPath(); context.arc(Math.cos(angle) * size * .25, -size * .34 + Math.sin(angle) * size * .25, size * .21, 0, Math.PI * 2); context.fill(); }
    context.fillStyle = '#e2a742'; context.beginPath(); context.arc(0, -size * .34, size * .14, 0, Math.PI * 2); context.fill();
  }

  drawTuft(context, size, variant) {
    context.strokeStyle = ['#397d3d', '#4f9145', '#326f42', '#639a49'][variant]; context.lineWidth = Math.max(1, size * .1); context.lineCap = 'round';
    for (const bend of [-.65, -.28, .12, .5]) { context.beginPath(); context.moveTo(0, size * .3); context.quadraticCurveTo(bend * size, 0, bend * size * 1.3, -size * (.5 + Math.abs(bend) * .2)); context.stroke(); }
  }

  drawStatic(context, width, height) {
    for (const name of ['base', 'texture', 'decoration']) context.drawImage(this.layers.get(name), 0, 0, width, height);
  }

  drawDynamic(context, width, height, elapsed) {
    const sx = width / this.model.width; const sy = height / this.model.height;
    context.save(); context.lineCap = 'round';
    if (this.model.worldType === WorldTypeId.HUMAN) {
      const coast = this.model.contour(.012, 180);
      for (let start = 0; start < coast.length; start += 9) {
        if ((start / 9 + Math.floor(elapsed * .7)) % 3 === 0) continue;
        const end = Math.min(start + 5, coast.length - 1); context.beginPath();
        for (let index = start; index <= end; index += 1) {
          const point = coast[index]; const pulse = Math.sin(elapsed * 1.25 + index * .35) * .11;
          const x = (point.x - this.model.width / 2) * (1 + pulse / 30) + this.model.width / 2;
          const y = (point.y - this.model.height / 2) * (1 + pulse / 30) + this.model.height / 2;
          if (index === start) context.moveTo(x * sx, y * sy); else context.lineTo(x * sx, y * sy);
        }
        context.strokeStyle = 'rgba(244,255,237,.58)'; context.lineWidth = Math.max(1.5, height / 420); context.stroke();
      }
    } else if (this.model.worldType === WorldTypeId.PLANT) {
      context.strokeStyle = 'rgba(218,242,159,.18)'; context.lineWidth = Math.max(1, height / 600);
      for (const detail of this.model.decorations.filter(item => item.kind === 'tuft').slice(0, 90)) { const sway = Math.sin(elapsed * .65 + detail.phase) * sx * .18; context.beginPath(); context.moveTo(detail.x * sx, detail.y * sy); context.lineTo(detail.x * sx + sway, detail.y * sy - detail.size * sy); context.stroke(); }
    }
    context.restore();
  }
}
