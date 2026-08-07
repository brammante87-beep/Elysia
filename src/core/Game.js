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
    const nextState = id === WorldTypeId.PLANT ? GameState.States.PLAYING : GameState.States.CHARACTER_CREATION;
    this.state.transitionTo(nextState);
    this.saveProgress(nextState);
    this.showPostSelection();
  }

  showPostSelection() {
    const messages = {
      [WorldTypeId.HUMAN]: 'Elysia attende il suo primo essere umano.',
      [WorldTypeId.BEAST]: 'Elysia attende la sua prima creatura.',
      [WorldTypeId.PLANT]: 'Elysia attende di essere ricoperta di vita.',
    };
    this.ui.showPlaceholder([messages[this.worldType], 'Il suo cammino proseguirà in una futura Alpha.']);
  }

  saveProgress(state) { this.saves.save({ state, introPage: this.introPage, worldType: this.worldType }); }

  continueGame() {
    const save = this.saves.load();
    if (save === null) {
      this.showTitle();
      return;
    }
    this.introPage = Math.min(save.data.introPage, IntroScreen.Pages.length - 1);
    this.worldType = save.data.worldType;
    if (save.data.state === GameState.States.INTRO) this.showIntro();
    else if (save.data.state === GameState.States.WORLD_SELECTION) this.showWorldSelection();
    else if (this.worldType !== null) {
      this.state.transitionTo(save.data.state);
      this.showPostSelection();
    } else this.showIntro();
  }

  resize() { this.renderer.resize(); }

  update(deltaTime) {
    this.clock.update(deltaTime);
    if (this.state.is(GameState.States.PLAYING)) this.world.update(deltaTime);
  }

  render() { this.renderer.render(); }
}
