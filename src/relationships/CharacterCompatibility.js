export class CharacterCompatibility {
  static isHumanCompatible(first, second) {
    return this.isAttractedTo(first, second) && this.isAttractedTo(second, first);
  }

  static isAttractedTo(character, candidate) {
    const orientation = character.sexualOrientation;
    if (orientation === 'bisexual') return ['man', 'woman', 'nonBinary'].includes(candidate.genderIdentity);
    const sameGender = character.genderIdentity === candidate.genderIdentity;
    if (orientation === 'gayLesbian') return sameGender;
    if (orientation === 'heterosexual') return !sameGender;
    return false;
  }

  static isBeastCompatible(first, second) {
    return Boolean(first.species && first.species === second.species);
  }
}
