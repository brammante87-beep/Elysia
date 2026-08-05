export class Engine {
    constructor(game) {
        this.game = game;
        this.running = false;
        this.lastTime = 0;
    }

    start() {
        if (this.running) {
            return;
        }

        this.running = true;
        requestAnimationFrame((time) => this.loop(time));
    }

    loop(time) {
        if (!this.running) {
            return;
        }

        const delta = this.lastTime === 0 ? 0 : (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.game.update(delta);
        this.game.render();

        requestAnimationFrame((nextTime) => this.loop(nextTime));
    }
}
