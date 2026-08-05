/*
=========================================
ELYSIA
Game
=========================================
*/

class Game {

    constructor() {

        //==============================
        // Canvas
        //==============================

        this.canvas = document.getElementById("game");

        this.ctx = this.canvas.getContext("2d");

        this.resize();

        window.addEventListener(
            "resize",
            () => this.resize()
        );

        //==============================
        // Moduli
        //==============================

        this.world = new World();

        this.renderer = new Renderer(this);

        this.miracles = new Miracles(this);

        this.ui = new UI(this);

        this.input = new Input(this);

        this.engine = new Engine(this);

        //==============================
        // Avvio
        //==============================

        this.showMainMenu();

    }

    //----------------------------------

    resize() {

        this.canvas.width = window.innerWidth;

        this.canvas.height = window.innerHeight;

    }

    //----------------------------------

    showMainMenu() {

        this.ui.showMainMenu();

    }

    //----------------------------------

    start(settings) {

        this.world.createWorld(settings);

        this.engine.start();

    }

}