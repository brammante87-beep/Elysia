import { Engine } from "./Engine.js";
import { World } from "../world/World.js";
import { Renderer } from "../renderer/Renderer.js";
import { Input } from "../input/Input.js";
import { UI } from "../ui/UI.js";
import { MiracleManager } from "../miracles/MiracleManager.js";
import { AssetLoader } from "../assets/AssetLoader.js";

export class Game {
    constructor(canvasId, uiId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext("2d");
        this.uiRoot = document.getElementById(uiId);

        this.assetLoader = new AssetLoader();
        this.world = new World();
        this.renderer = new Renderer(this.canvas, this.context, this.world, this.assetLoader);
        this.miracleManager = new MiracleManager();
        this.input = new Input(this.canvas, this.world, this.miracleManager);
        this.ui = new UI(this.uiRoot, this.miracleManager, this.world);
        this.engine = new Engine(this);
        this.started = false;

        this.preloadAssets();
        this.resize();
        window.addEventListener("resize", () => this.resize());
    }

    preloadAssets() {
        this.assetLoader.preloadImages([
            { name: "tree", source: "assets/sprites/trees/tree_01.svg" },
            { name: "treeHit", source: "assets/sprites/trees/tree_01_hit.svg" }
        ]);
    }

    start() {
        this.ui.showMainMenu(() => {
            this.ui.showCharacterCreation((settings) => {
                this.startNewGame(settings);
            });
        });
    }

    startNewGame(settings) {
        if (this.started) {
            return;
        }

        this.started = true;
        this.world.initialize(settings);
        this.ui.clear();
        this.ui.showMiracleToolbar();
        this.engine.start();
    }

    update(delta) {
        this.world.update(delta);
        this.ui.updateMiracleButtons();
    }

    render() {
        this.renderer.render();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}
