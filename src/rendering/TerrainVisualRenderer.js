import { TerrainVisualModel } from './TerrainVisualModel.js';
import { DeepSeaLayer } from './DeepSeaLayer.js';
import { ShallowWaterLayer } from './ShallowWaterLayer.js';
import { BeachLayer } from './BeachLayer.js';
import { GrassBaseLayer } from './GrassBaseLayer.js';
import { GrassVariationLayer } from './GrassVariationLayer.js';
import { StaticDecorationLayer } from './StaticDecorationLayer.js';
import { ShoreFoamLayer } from './ShoreFoamLayer.js';

export class TerrainVisualRenderer {
  constructor(documentObject, terrain, worldType, seed) {
    this.document = documentObject;
    this.model = new TerrainVisualModel(terrain, worldType, seed);
    this.staticLayer = this.createCanvas();
    this.staticLayers = [new DeepSeaLayer(), new ShallowWaterLayer(), new BeachLayer(),
      new GrassBaseLayer(), new GrassVariationLayer(), new StaticDecorationLayer()];
    this.foamLayer = new ShoreFoamLayer();
    this.buildStaticLayer();
  }

  createCanvas() {
    const canvas = this.document.createElement('canvas');
    canvas.width = this.model.pixelWidth; canvas.height = this.model.pixelHeight;
    return canvas;
  }

  buildStaticLayer() {
    const context = this.staticLayer.getContext('2d');
    context.clearRect(0, 0, this.staticLayer.width, this.staticLayer.height);
    for (const layer of this.staticLayers) layer.render(context, this);
  }

  traceContour(context, offset, count = 240) {
    const scale = TerrainVisualModel.PIXELS_PER_WORLD_UNIT;
    const points = this.model.contour(offset, count);
    if (!points.length) return false;
    context.beginPath(); context.moveTo(points[0].x * scale, points[0].y * scale);
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index]; const next = points[(index + 1) % points.length];
      context.quadraticCurveTo(current.x * scale, current.y * scale,
        (current.x + next.x) * scale / 2, (current.y + next.y) * scale / 2);
    }
    context.closePath(); return true;
  }

  fillContour(context, offset, fillStyle, shadow = null) {
    context.save();
    if (shadow) { context.shadowColor=shadow.color;context.shadowBlur=shadow.blur;context.shadowOffsetY=shadow.y; }
    if (this.traceContour(context, offset)) { context.fillStyle = fillStyle; context.fill(); }
    context.restore();
  }

  clipContour(context, offset) { if (this.traceContour(context, offset)) context.clip(); }
  drawStatic(context, width, height) { context.drawImage(this.staticLayer, 0, 0, width, height); }
  drawDynamic(context, width, height, elapsed) { this.foamLayer.render(context, this, width, height, elapsed); }
}
