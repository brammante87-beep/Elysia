import { WorldTypeId } from '../data/WorldTypes.js';

export class DeepSeaLayer {
  render(context, renderer) {
    const { pixelWidth: width, pixelHeight: height, worldType } = renderer.model;
    if (worldType !== WorldTypeId.HUMAN) return;
    const sea = context.createRadialGradient(width * 0.43, height * 0.34, width * 0.04,
      width * 0.52, height * 0.52, width * 0.72);
    sea.addColorStop(0, '#247fc2');
    sea.addColorStop(0.5, '#125da5');
    sea.addColorStop(1, '#073678');
    context.fillStyle = sea;
    context.fillRect(0, 0, width, height);
  }
}
