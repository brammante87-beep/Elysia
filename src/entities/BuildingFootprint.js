import { Config } from '../core/Config.js';

export class BuildingFootprint {
  static dwelling() { return { halfWidth: Config.HOME_PLACEMENT_HALF_WIDTH, halfHeight: Config.HOME_PLACEMENT_HALF_HEIGHT }; }
  static central() { return { halfWidth: Config.CENTRAL_PLACEMENT_HALF_WIDTH, halfHeight: Config.CENTRAL_PLACEMENT_HALF_HEIGHT }; }
  static interaction(bounds) { return { halfWidth: bounds.halfWidth + .45, halfHeight: bounds.halfHeight + .45 }; }
}
