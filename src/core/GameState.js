export class GameState {
  static States = Object.freeze({
    BOOT: 'BOOT',
    TITLE: 'TITLE',
    INTRO: 'INTRO',
    WORLD_SELECTION: 'WORLD_SELECTION',
    WORLD_REVEAL: 'WORLD_REVEAL',
    CHARACTER_CREATION: 'CHARACTER_CREATION',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER',
  });

  constructor(initialState = GameState.States.BOOT) {
    this.current = null;
    this.transitionTo(initialState);
  }

  transitionTo(nextState) {
    if (!Object.values(GameState.States).includes(nextState)) {
      throw new TypeError(`Unknown game state: ${nextState}`);
    }
    this.current = nextState;
  }

  is(state) {
    return this.current === state;
  }
}
