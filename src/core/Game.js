import { Engine } from './Engine.js';
import { GameClock } from './GameClock.js';
import { GameState } from './GameState.js';
import { Input } from '../input/Input.js';
import { Renderer } from '../rendering/Renderer.js';
import { UI } from '../ui/UI.js';
import { World } from '../world/World.js';
import { SaveManager } from '../persistence/SaveManager.js';

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
    this.saves.save({ state: GameState.States.INTRO });
    this.state.transitionTo(GameState.States.INTRO);
    this.ui.showPlaceholder([
      'Una nuova esistenza sta per cominciare...',
      'Alpha 0.0.3 introdurrà la storia di Elysia.',
    ]);
  }

  continueGame() {
    const save = this.saves.load();
    if (save === null) {
      this.showTitle();
      return;
    }
    this.state.transitionTo(GameState.States.INTRO);
    this.ui.showPlaceholder([
      'Partita caricata.',
      'Il mondo di Elysia continuerà nelle prossime Alpha.',
    ]);
  }

  resize() { this.renderer.resize(); }

  update(deltaTime) {
    this.clock.update(deltaTime);
    if (this.state.is(GameState.States.PLAYING)) this.world.update(deltaTime);
  }

  render() { this.renderer.render(); }
}
