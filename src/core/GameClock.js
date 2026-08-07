export class GameClock {
  constructor() {
    this.elapsedSeconds = 0;
    this.paused = false;
  }

  update(deltaTime) {
    if (!this.paused && Number.isFinite(deltaTime) && deltaTime >= 0) {
      this.elapsedSeconds += deltaTime;
    }
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }

  reset() {
    this.elapsedSeconds = 0;
  }
}
