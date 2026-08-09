import { CharacterCreator } from './CharacterCreator.js';

export class FamilyIdentityGenerator {
  generate(data, seed = 0) {
    const style = Math.max(0, Math.min(2, Number(data.appearanceStyle ?? 1) - 1));
    const offset = Math.abs(Number(seed) || 0);
    return {
      name: data.name,
      appearanceStyle: String(style + 1),
      sexCharacteristics: CharacterCreator.SexCharacteristics[(offset + style) % CharacterCreator.SexCharacteristics.length],
      genderIdentity: CharacterCreator.GenderIdentities[(offset + style * 2) % CharacterCreator.GenderIdentities.length],
      sexualOrientation: CharacterCreator.SexualOrientations[(offset * 2 + style) % CharacterCreator.SexualOrientations.length],
    };
  }
}
