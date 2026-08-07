import { Config } from './Config.js';

export class Engine {
  constructor(game, animationFrame = globalThis.requestAnimationFrame?.bind(globalThis)) {
    this.game = game;
    this.animationFrame = animationFrame;
    this.running = false;
    this.previousTime = null;
    this.frame = this.frame.bind(this);
  }

  start() {
    if (this.running) return;
    if (!this.animationFrame) throw new Error('requestAnimationFrame is unavailable.');
    this.running = true;
    this.animationFrame(this.frame);
  }

  stop() { this.running = false; }

  frame(timestamp) {
    if (!this.running) return;
    const elapsed = this.previousTime === null ? 0 : (timestamp - this.previousTime) / 1000;
    this.previousTime = timestamp;
    const deltaTime = Math.min(Math.max(elapsed, 0), Config.MAX_DELTA_SECONDS);
    this.game.update(deltaTime);
    this.game.render();
    this.animationFrame(this.frame);
  }
}
