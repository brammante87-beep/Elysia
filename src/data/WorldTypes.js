export const WorldTypeId = Object.freeze({ HUMAN: 'human', BEAST: 'beast', PLANT: 'plant' });

export const WORLD_TYPES = Object.freeze([
  Object.freeze({ id: WorldTypeId.PLANT, label: 'MONDO DELLE PIANTE', confirmationLabel: 'il Mondo delle Piante', description: 'Un mondo quieto e verde, dominato da radici, foglie e crescita.' }),
  Object.freeze({ id: WorldTypeId.BEAST, label: 'MONDO DELLE BESTIE', confirmationLabel: 'il Mondo delle Bestie', description: "Creature guidate dall’istinto, capaci di popolare una terra selvaggia." }),
  Object.freeze({ id: WorldTypeId.HUMAN, label: 'MONDO DEGLI UOMINI', confirmationLabel: 'il Mondo degli Uomini', description: 'Esseri senzienti capaci di costruire, amare, creare e distruggere.' }),
]);

export class WorldTypes {
  static all() { return WORLD_TYPES; }
  static find(id) { return WORLD_TYPES.find(worldType => worldType.id === id) ?? null; }
  static isValid(id) { return WorldTypes.find(id) !== null; }
}
