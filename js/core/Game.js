import { Engine } from "./Engine.js";
import { World } from "../world/World.js";
import { Renderer } from "../renderer/Renderer.js";
import { Input } from "../input/Input.js";
import { UI } from "../ui/UI.js";
import { MiracleManager } from "../miracles/MiracleManager.js";

export class Game {
    constructor(canvasId, uiId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext("2d");
        this.uiRoot = document.getElementById(uiId);

        this.world = new World();
        this.renderer = new Renderer(this.canvas, this.context, this.world);
        this.input = new Input(this.canvas, this.world);
        this.miracleManager = new MiracleManager();
        this.ui = new UI(this.uiRoot, this.miracleManager);
        this.engine = new Engine(this);

        this.resize();
        window.addEventListener("resize", () => this.resize());
    }

    start() {
        this.world.initialize();
        this.ui.clear();
        this.ui.showMiracleToolbar();
        this.engine.start();
    }

    update(delta) {
        this.world.update(delta);
    }

    render() {
        this.renderer.render();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}
