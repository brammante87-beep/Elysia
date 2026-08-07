export class HumanVisualProfileResolver {
  static ProfileIds = Object.freeze([
    'human.base',
    'human.masculine',
    'human.femaleWomanLongHair',
    'human.femaleWomanShortHair',
    'human.femaleWomanTiedHair',
    'human.intersexMan',
    'human.intersexWoman',
    'human.intersexNonBinary',
    'human.nonBinary',
  ]);

  resolve(character) {
    const sex = character.sexCharacteristics ?? 'male';
    const gender = character.genderIdentity ?? 'man';
    if (sex === 'intersex') return this.intersexProfile(gender);
    if (gender === 'woman') return this.womanProfile(character.sexualOrientation);
    if (gender === 'nonBinary') return 'human.nonBinary';
    if (sex === 'male' && (character.sexualOrientation ?? 'heterosexual') === 'heterosexual') return 'human.base';
    return 'human.masculine';
  }

  womanProfile(orientation) {
    if (orientation === 'gayLesbian') return 'human.femaleWomanShortHair';
    if (orientation === 'bisexual') return 'human.femaleWomanTiedHair';
    return 'human.femaleWomanLongHair';
  }

  intersexProfile(gender) {
    if (gender === 'woman') return 'human.intersexWoman';
    if (gender === 'nonBinary') return 'human.intersexNonBinary';
    return 'human.intersexMan';
  }
}
