import { WorldTypeId } from '../data/WorldTypes.js';

export class ShallowWaterLayer {
  render(context, renderer) {
    if (renderer.model.worldType !== WorldTypeId.HUMAN) return;
    renderer.fillContour(context, 0.2, '#209fca');
    renderer.fillContour(context, 0.145, '#2dbbd0');
    renderer.fillContour(context, 0.09, '#51d1d1');
    renderer.fillContour(context, 0.045, '#82ded3');
  }
}
