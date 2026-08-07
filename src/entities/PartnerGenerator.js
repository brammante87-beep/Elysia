import { Character } from './Character.js';
import { NameGenerator } from './NameGenerator.js';
import { CharacterCreator } from './CharacterCreator.js';
import { CharacterCompatibility } from '../relationships/CharacterCompatibility.js';
import { WorldTypeId } from '../data/WorldTypes.js';

export class PartnerGenerator {
  generate(chosenOne, position, characters, seed = 0) {
    const name = new NameGenerator(characters.map(character => character.name)).generate(seed + characters.length);
    const base = { id: `partner-${Number(seed).toString(36)}`, name, position, alive: true, chosenOne: false, worldType: chosenOne.worldType };
    if (chosenOne.worldType === WorldTypeId.BEAST) return new Character({ ...base, species: chosenOne.species, reproductiveSex: chosenOne.reproductiveSex === 'male' ? 'female' : 'male' });
    const candidates = this.humanCandidates(chosenOne);
    const attributes = candidates[Math.abs(seed) % candidates.length];
    return new Character({ ...base, ...attributes });
  }

  humanCandidates(chosenOne) {
    const candidates = [];
    for (const genderIdentity of CharacterCreator.GenderIdentities) for (const sexualOrientation of CharacterCreator.SexualOrientations) {
      for (const sexCharacteristics of CharacterCreator.SexCharacteristics) {
        const candidate = { genderIdentity, sexualOrientation, sexCharacteristics };
        if (CharacterCompatibility.isHumanCompatible(chosenOne, candidate)) candidates.push(candidate);
      }
    }
    if (!candidates.length) throw new Error('No compatible partner attributes are available.');
    return candidates;
  }
}
