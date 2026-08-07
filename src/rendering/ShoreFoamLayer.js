import { WorldTypeId } from '../data/WorldTypes.js';

export class ShoreFoamLayer {
  render(context, renderer, width, height, elapsed) {
    if (renderer.model.worldType !== WorldTypeId.HUMAN) return;
    const sx = width / renderer.model.width;
    const sy = height / renderer.model.height;
    const coast = renderer.model.contour(0.025, 192);
    context.save(); context.lineCap = 'round';
    for (let start = 0; start < coast.length; start += 8) {
      if ((start / 8 + Math.floor(elapsed * 0.65)) % 3 === 0) continue;
      context.beginPath();
      for (let index = start; index <= Math.min(start + 5, coast.length - 1); index += 1) {
        const point = coast[index];
        const pulse = Math.sin(elapsed * 1.2 + index * 0.31) * 0.012;
        const x = (point.x - renderer.model.width / 2) * (1 + pulse) + renderer.model.width / 2;
        const y = (point.y - renderer.model.height / 2) * (1 + pulse) + renderer.model.height / 2;
        if (index === start) context.moveTo(x * sx, y * sy); else context.lineTo(x * sx, y * sy);
      }
      context.strokeStyle = 'rgba(248,251,226,.72)'; context.lineWidth = Math.max(1.5, height / 430); context.stroke();
    }
    context.restore();
  }
}
