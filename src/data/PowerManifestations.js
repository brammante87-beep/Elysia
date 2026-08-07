import { WorldTypeId } from './WorldTypes.js';
export class PowerManifestations {
  static FOOD_SLOT_ID = 'cow';
  static manifests = Object.freeze({
    [WorldTypeId.HUMAN]: Object.freeze({ cow: Object.freeze({ label: 'MUCCA', icon: 'assets/powers/cow.svg', description: 'Crea una mucca su terreno fertile.', entityType: 'cow' }) }),
    [WorldTypeId.BEAST]: Object.freeze({ cow: Object.freeze({ label: 'CIBO', icon: 'assets/powers/animal-food.svg', description: 'Crea un dono naturale ricco di nutrimento.', entityType: 'animalFood' }) }),
  });
  static resolve(power, worldType) { return { ...power, ...(this.manifests[worldType]?.[power.id] ?? {}) }; }
  static entityType(powerId, worldType) { return this.manifests[worldType]?.[powerId]?.entityType ?? powerId; }
}
