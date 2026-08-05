/*
=========================================
ELYSIA
Engine
=========================================
*/

class Engine {

    constructor(game) {

        this.game = game;

        this.running = false;

        this.lastFrame = 0;

        this.delta = 0;

        this.fps = 0;

    }

    //----------------------------------

    start() {

        if (this.running) return;

        this.running = true;

        requestAnimationFrame(
            this.loop.bind(this)
        );

    }

    //----------------------------------

    stop() {

        this.running = false;

    }

    //----------------------------------

    loop(time) {

        if (!this.running) return;

        //----------------------------------
        // Delta Time
        //----------------------------------

        this.delta = (time - this.lastFrame) / 1000;

        this.lastFrame = time;

        //----------------------------------
        // FPS
        //----------------------------------

        if (this.delta > 0) {

            this.fps = Math.round(
                1 / this.delta
            );

        }

        //----------------------------------
        // Update
        //----------------------------------

        this.update(this.delta);

        //----------------------------------
        // Render
        //----------------------------------

        this.render();

        //----------------------------------

        requestAnimationFrame(
            this.loop.bind(this)
        );

    }

    //----------------------------------

    update(delta) {

        this.game.world.update(delta);

        this.game.ui.update(delta);

    }

    //----------------------------------

    render() {

        this.game.renderer.render();

    }

}