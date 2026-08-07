import { WorldTypeId } from '../data/WorldTypes.js';

export class GrassBaseLayer {
  render(context, renderer) {
    const { pixelWidth: width, pixelHeight: height, worldType } = renderer.model;
    const grass = context.createLinearGradient(width * 0.12, 0, width * 0.88, height);
    if (worldType === WorldTypeId.BEAST) {
      grass.addColorStop(0, '#9bc66a'); grass.addColorStop(0.48, '#78ad58'); grass.addColorStop(1, '#5b8d4c');
      context.fillStyle = grass; context.fillRect(0, 0, width, height); return;
    }
    if (worldType === WorldTypeId.PLANT) {
      grass.addColorStop(0, '#a6d77a'); grass.addColorStop(0.5, '#78bd61'); grass.addColorStop(1, '#52954f');
      context.fillStyle = grass; context.fillRect(0, 0, width, height); return;
    }
    grass.addColorStop(0, '#a9db72'); grass.addColorStop(0.52, '#79bf58'); grass.addColorStop(1, '#54a04b');
    renderer.fillContour(context, -0.112, grass, { color: 'rgba(48,80,34,.2)', blur: 9, y: 4 });
  }
}
