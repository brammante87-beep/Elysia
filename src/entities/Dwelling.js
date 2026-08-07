import { WorldTypeId } from '../data/WorldTypes.js';

export class Dwelling {
  static Variants = Object.freeze({ HUT: 'hut', HOUSE: 'house', DEN: 'den', ESTABLISHED_DEN: 'establishedDen' });

  static variant(worldType, established = false, species = null) {
    const kind = worldType === WorldTypeId.BEAST
      ? (established ? Dwelling.Variants.ESTABLISHED_DEN : Dwelling.Variants.DEN)
      : (established ? Dwelling.Variants.HOUSE : Dwelling.Variants.HUT);
    return species ? `${kind}.${species}` : kind;
  }
}
