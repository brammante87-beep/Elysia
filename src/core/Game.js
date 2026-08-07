import { Engine } from './Engine.js';
import { GameClock } from './GameClock.js';
import { GameState } from './GameState.js';
import { Input } from '../input/Input.js';
import { Renderer } from '../rendering/Renderer.js';
import { UI } from '../ui/UI.js';
import { World } from '../world/World.js';

export class Game {
  constructor(root) {
    this.ui = new UI(root);
    this.canvas = this.ui.createCanvas();
    this.renderer = new Renderer(this.canvas);
    this.input = new Input(this.canvas);
    this.world = new World();
    this.clock = new GameClock();
    this.state = new GameState();
    this.engine = new Engine(this);
    this.resize = this.resize.bind(this);
  }

  start() {
    this.input.connect();
    globalThis.window.addEventListener('resize', this.resize);
    this.resize();
    this.engine.start();
  }

  resize() { this.renderer.resize(); }

  update(deltaTime) {
    this.clock.update(deltaTime);
    this.world.update(deltaTime);
  }

  render() { this.renderer.render(); }
}
