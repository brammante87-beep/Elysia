import { WorldTypeId } from '../data/WorldTypes.js';

export class BeachLayer {
  render(context, renderer) {
    const { pixelWidth: width, pixelHeight: height, worldType } = renderer.model;
    if (worldType !== WorldTypeId.HUMAN) return;
    renderer.fillContour(context, 0.012, '#c9954f');
    const sand = context.createLinearGradient(width * 0.2, height * 0.15, width * 0.8, height * 0.85);
    sand.addColorStop(0, '#fff0bd');
    sand.addColorStop(0.52, '#efd28b');
    sand.addColorStop(1, '#dbae63');
    renderer.fillContour(context, -0.018, sand);
  }
}
