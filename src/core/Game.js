import { Engine } from './Engine.js';
import { GameClock } from './GameClock.js';
import { GameState } from './GameState.js';
import { Input } from '../input/Input.js';
import { Renderer } from '../rendering/Renderer.js';
import { UI } from '../ui/UI.js';
import { World } from '../world/World.js';
import { SaveManager } from '../persistence/SaveManager.js';
import { IntroScreen } from '../ui/IntroScreen.js';
import { WorldTypeId, WorldTypes } from '../data/WorldTypes.js';
import { CharacterCreator } from '../entities/CharacterCreator.js';

export class Game {
  constructor(root) {
    this.ui = new UI(root);
    this.canvas = this.ui.createCanvas();
    this.renderer = new Renderer(this.canvas);
    this.input = new Input(this.canvas);
    this.world = new World();
    this.clock = new GameClock();
    this.state = new GameState();
    this.saves = new SaveManager();
    this.engine = new Engine(this);
    this.introPage = 0;
    this.worldType = null;
    this.worldSeed = null;
    this.chosenOne = null;
    this.characterCreator = new CharacterCreator();
    this.resize = this.resize.bind(this);
  }

  start() {
    this.input.connect();
    globalThis.window.addEventListener('resize', this.resize);
    this.resize();
    this.showTitle();
    this.engine.start();
  }

  showTitle() {
    this.state.transitionTo(GameState.States.TITLE);
    this.ui.showTitle(this.saves.hasSave(), {
      onNewGame: () => this.requestNewGame(),
      onContinue: () => this.continueGame(),
    });
  }

  requestNewGame() {
    if (!this.saves.hasSave()) {
      this.beginNewGame();
      return;
    }
    this.ui.showNewGameConfirmation(
      () => this.beginNewGame(),
      () => this.showTitle(),
    );
  }

  beginNewGame() {
    this.saves.deleteSave();
    this.introPage = 0;
    this.worldType = null;
    this.worldSeed = this.createWorldSeed();
    this.chosenOne = null;
    this.saveProgress(GameState.States.INTRO);
    this.state.transitionTo(GameState.States.INTRO);
    this.showIntro();
  }

  showIntro() {
    this.state.transitionTo(GameState.States.INTRO);
    this.ui.showIntro(this.introPage, () => this.advanceIntro());
  }

  advanceIntro() {
    if (!this.state.is(GameState.States.INTRO)) return;
    if (this.introPage < IntroScreen.Pages.length - 1) {
      this.introPage += 1;
      this.saveProgress(GameState.States.INTRO);
      this.showIntro();
      return;
    }
    this.showWorldSelection();
  }

  showWorldSelection() {
    this.state.transitionTo(GameState.States.WORLD_SELECTION);
    this.saveProgress(GameState.States.WORLD_SELECTION);
    this.ui.showWorldSelection(WorldTypes.all(), { onSelect: id => this.selectWorld(id) });
  }

  selectWorld(id) {
    const selection = WorldTypes.find(id);
    if (selection === null || !this.state.is(GameState.States.WORLD_SELECTION)) return;
    this.ui.showWorldConfirmation(selection, () => this.confirmWorld(id), () => this.showWorldSelection());
  }

  confirmWorld(id) {
    if (!this.state.is(GameState.States.WORLD_SELECTION) || !WorldTypes.isValid(id)) return;
    this.worldType = id;
    if (this.worldSeed === null) this.worldSeed = this.createWorldSeed();
    this.world.create(id, this.worldSeed);
    this.renderer.setWorld(this.world);
    this.state.transitionTo(GameState.States.WORLD_REVEAL);
    this.saveProgress(GameState.States.WORLD_REVEAL);
    this.ui.showWorldReveal(() => this.completeWorldReveal());
  }

  completeWorldReveal() {
    if (this.worldType === WorldTypeId.PLANT) { this.enterPlaying(); return; }
    this.state.transitionTo(GameState.States.CHARACTER_CREATION);
    this.saveProgress(GameState.States.CHARACTER_CREATION);
    this.ui.showCharacterCreation(this.worldType, data => this.createChosenOne(data));
  }

  createChosenOne(data) {
    const position = this.world.findSpawnPosition();
    this.chosenOne = this.worldType === WorldTypeId.HUMAN
      ? this.characterCreator.createHuman(data, position, this.worldSeed)
      : this.characterCreator.createBeast(data, position, this.worldSeed);
    this.world.addCharacter(this.chosenOne);
    this.enterPlaying();
  }

  enterPlaying() {
    this.state.transitionTo(GameState.States.PLAYING);
    this.saveProgress(GameState.States.PLAYING);
    this.ui.showPlaying();
  }

  createWorldSeed() {
    const values = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(values);
    return values[0] || (Date.now() >>> 0);
  }

  saveProgress(state) {
    this.saves.save({ state, introPage: this.introPage, worldType: this.worldType,
      worldSeed: this.worldSeed, chosenOne: this.chosenOne?.toJSON() ?? null });
  }

  continueGame() {
    const save = this.saves.load();
    if (save === null) {
      this.showTitle();
      return;
    }
    this.introPage = Math.min(save.data.introPage, IntroScreen.Pages.length - 1);
    this.worldType = save.data.worldType;
    this.worldSeed = save.data.worldSeed;
    this.chosenOne = this.characterCreator.restore(save.data.chosenOne);
    if (save.data.state === GameState.States.INTRO) this.showIntro();
    else if (save.data.state === GameState.States.WORLD_SELECTION) this.showWorldSelection();
    else if (this.worldType !== null && this.worldSeed !== null) {
      this.world.restore(this.worldType, this.worldSeed, this.chosenOne);
      this.renderer.setWorld(this.world);
      if (save.data.state === GameState.States.WORLD_REVEAL) {
        this.state.transitionTo(GameState.States.WORLD_REVEAL);
        this.ui.showWorldReveal(() => this.completeWorldReveal());
      } else if (save.data.state === GameState.States.CHARACTER_CREATION && !this.chosenOne) {
        this.state.transitionTo(GameState.States.CHARACTER_CREATION);
        this.ui.showCharacterCreation(this.worldType, data => this.createChosenOne(data));
      } else this.enterPlaying();
    } else this.showIntro();
  }

  resize() { this.renderer.resize(); }

  update(deltaTime) {
    this.clock.update(deltaTime);
    this.renderer.update(deltaTime);
    if (this.state.is(GameState.States.PLAYING)) this.world.update(deltaTime);
  }

  render() { this.renderer.render(); }
}
