export class CharacterAssetRegistry {
  static States = Object.freeze(['idle', 'walk', 'work', 'attack', 'sleep', 'hurt', 'death']);

  static Definitions = Object.freeze({
    'human.base': CharacterAssetRegistry.definition('human', 4.2, 5.2),
    'human.child': CharacterAssetRegistry.definition('human-child', 3.4, 3.8),
    'beast.deer': CharacterAssetRegistry.definition('deer', 5.8, 4.8),
    'beast.cat': CharacterAssetRegistry.definition('cat', 4.8, 3.8),
    'beast.dog': CharacterAssetRegistry.definition('dog', 5.2, 4.0),
    'beast.deer.child': CharacterAssetRegistry.definition('fawn', 4.2, 3.5),
    'beast.cat.child': CharacterAssetRegistry.definition('kitten', 3.6, 2.9),
    'beast.dog.child': CharacterAssetRegistry.definition('puppy', 4, 3.1),
  });

  static definition(folder, worldWidth, worldHeight) {
    return Object.freeze({
      nativeWidth: 160,
      nativeHeight: 200,
      worldWidth,
      worldHeight,
      states: Object.freeze({
        idle: Object.freeze({ frameDuration: 0.62, frames: Object.freeze([
          `assets/characters/${folder}/idle-01.svg`,
          `assets/characters/${folder}/idle-02.svg`,
        ]) }),
        walk: Object.freeze({ frameDuration: 0.2, frames: Object.freeze([`assets/characters/${folder}/walk-01.svg`, `assets/characters/${folder}/walk-02.svg`]) }),
        work: Object.freeze({ frameDuration: 0.16, frames: Object.freeze([`assets/characters/${folder}/walk-02.svg`, `assets/characters/${folder}/idle-01.svg`]) }),
      }),
    });
  }

  resolveId(character) {
    if (character.lifeStage === 'child') return character.species ? `beast.${character.species}.child` : 'human.child';
    return character.species ? `beast.${character.species}` : 'human.base';
  }

  get(id) { return CharacterAssetRegistry.Definitions[id] ?? null; }

  requiredIds(worldType) {
    if (worldType === 'human') return ['human.base', 'human.child'];
    if (worldType === 'beast') return ['beast.deer', 'beast.cat', 'beast.dog', 'beast.deer.child', 'beast.cat.child', 'beast.dog.child'];
    return [];
  }
}
