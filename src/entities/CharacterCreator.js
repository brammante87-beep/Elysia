import { Character } from './Character.js';
import { WorldTypeId } from '../data/WorldTypes.js';

export class CharacterCreator {
  static SexCharacteristics = Object.freeze(['male', 'female', 'intersex']);
  static GenderIdentities = Object.freeze(['man', 'woman', 'nonBinary']);
  static SexualOrientations = Object.freeze(['heterosexual', 'gayLesbian', 'bisexual']);
  static BeastSpecies = Object.freeze(['deer', 'cat', 'dog']);
  static MAX_NAME_LENGTH = 32;

  createHuman(data, position, seed = 0) {
    this.validateName(data.name);
    this.validateChoice(data.sexCharacteristics, CharacterCreator.SexCharacteristics, 'sex characteristics');
    this.validateChoice(data.genderIdentity, CharacterCreator.GenderIdentities, 'gender identity');
    this.validateChoice(data.sexualOrientation, CharacterCreator.SexualOrientations, 'sexual orientation');
    return new Character({ ...data, name: data.name.trim(), position, worldType: WorldTypeId.HUMAN, id: this.createId(seed) });
  }

  createBeast(data, position, seed = 0) {
    this.validateName(data.name);
    this.validateChoice(data.species, CharacterCreator.BeastSpecies, 'species');
    return new Character({ name: data.name.trim(), species: data.species, position, worldType: WorldTypeId.BEAST, id: this.createId(seed), reproductiveSex: (Number(seed) & 1) ? 'female' : 'male' });
  }

  restore(data) { return data ? new Character(data) : null; }
  createId(seed) { return `chosen-${Number(seed).toString(36)}`; }

  validateName(name) {
    if (typeof name !== 'string' || name.trim().length === 0) throw new TypeError('Il nome è obbligatorio.');
    if (name.trim().length > CharacterCreator.MAX_NAME_LENGTH) throw new RangeError('Il nome è troppo lungo.');
  }

  validateChoice(value, choices, label) {
    if (!choices.includes(value)) throw new TypeError(`Invalid ${label}.`);
  }
}
