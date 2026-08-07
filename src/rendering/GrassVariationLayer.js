import { WorldTypeId } from '../data/WorldTypes.js';
import { SeededRandom } from '../world/SeededRandom.js';

export class GrassVariationLayer {
  render(context, renderer) {
    const { model } = renderer;
    const random = new SeededRandom(model.seed ^ 0x7a11f3);
    const scale = model.constructor.PIXELS_PER_WORLD_UNIT;
    context.save();
    if (model.worldType === WorldTypeId.HUMAN) renderer.clipContour(context, -0.115);
    context.globalCompositeOperation = 'soft-light';
    const profile = model.worldType === WorldTypeId.BEAST
      ? { count: 28, min: 12, max: 29, light: 'rgba(240,211,125,.2)', shade: 'rgba(83,75,42,.2)' }
      : { count: 34, min: 10, max: 24, light: 'rgba(247,239,151,.2)', shade: 'rgba(43,116,67,.16)' };
    for (let index = 0; index < profile.count; index += 1) {
      const x = random.range(0, model.width) * scale;
      const y = random.range(0, model.height) * scale;
      const radius = random.range(profile.min, profile.max) * scale;
      const patch = context.createRadialGradient(x, y, radius * 0.08, x, y, radius);
      patch.addColorStop(0, random.next() > 0.46 ? profile.light : profile.shade);
      patch.addColorStop(0.55, random.next() > 0.5 ? 'rgba(255,255,210,.07)' : 'rgba(26,88,55,.06)');
      patch.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = patch;
      context.beginPath();
      context.ellipse(x, y, radius, radius * random.range(0.48, 0.82), random.range(0, Math.PI), 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}
