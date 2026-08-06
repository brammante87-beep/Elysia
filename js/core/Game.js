import { Engine } from "./Engine.js";
import { World } from "../world/World.js";
import { Renderer } from "../renderer/Renderer.js";
import { Input } from "../input/Input.js";
import { UI } from "../ui/UI.js";
import { MiracleManager } from "../miracles/MiracleManager.js";
import { AssetManager } from "../assets/AssetManager.js";
import { AssetCatalog } from "../assets/AssetCatalog.js";
import { SaveManager } from "./SaveManager.js";
import { TutorialManager } from "../tutorial/TutorialManager.js";

export class Game {
    constructor(canvasId, uiId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext("2d");
        this.uiRoot = document.getElementById(uiId);

        this.assetLoader = new AssetManager();
        this.world = new World();
        this.renderer = new Renderer(this.canvas, this.context, this.world, this.assetLoader);
        this.miracleManager = new MiracleManager();
        this.input = new Input(this.canvas, this.world, this.miracleManager);
        this.ui = new UI(this.uiRoot, this.miracleManager, this.world);
        this.engine = new Engine(this);
        this.world.onAutosaveNeeded = () => this.safeAutosave();
        this.world.onEraChanged = (displayName) => {
            this.miracleManager.refreshAvailableMiracles(this.world.getCurrentEra());
            this.ui.rebuildMiracleToolbar();
            this.ui.updateVillageStatistics();
            this.ui.showEraFeedback(displayName);
        };
        this.saveManager = new SaveManager();
        this.pendingNewGameSettings = null;
        this.tutorialManager = new TutorialManager(this.ui, () => this.beginPendingNewGame());
        this.autosaveTimer = 0;
        this.started = false;

        this.preloadAssets();
        this.resize();
        window.addEventListener("resize", () => this.resize());
    }

    preloadAssets() {
        AssetCatalog.getLegacyAliases().forEach((key, alias) => this.assetLoader.registerAlias(alias, key));
        this.assetLoader.preloadImages(AssetCatalog.getEntries());
    }

    start() {
        this.ui.showMainMenu({
            hasSave: this.saveManager.hasValidSave(),
            onContinue: () => this.continueGame(),
            onNewGame: () => this.prepareNewGame()
        });
    }

    prepareNewGame() {
        if (this.saveManager.hasValidSave() && !window.confirm("Iniziare una nuova partita eliminerà il salvataggio attuale.")) {
            this.start();
            return;
        }

        this.saveManager.deleteSave();
        this.ui.showCharacterCreation((settings) => {
            this.prepareIntroduction(settings);
        });
    }

    prepareIntroduction(settings) {
        this.pendingNewGameSettings = settings;

        if (!this.tutorialManager.hasBeenSeen()) {
            this.tutorialManager.start();
            return;
        }

        this.ui.showTutorialReplayPrompt({
            onReplay: () => this.tutorialManager.start(),
            onContinue: () => this.beginPendingNewGame()
        });
    }

    beginPendingNewGame() {
        const settings = this.pendingNewGameSettings;
        this.pendingNewGameSettings = null;
        this.startNewGame(settings);
    }

    continueGame() {
        const save = this.saveManager.load();
        if (save === null || !this.world.loadFromData(save.gameState)) {
            this.start();
            return;
        }

        this.showGameplayUi();
        this.started = true;
        this.engine.start();
    }

    startNewGame(settings) {
        this.started = true;
        this.autosaveTimer = 0;
        this.world.initialize(settings);
        this.showGameplayUi();
        this.engine.start();
    }

    update(delta) {
        this.world.update(delta);
        this.updateAutosave(delta);
        this.ui.updateMiracleButtons();
        this.ui.updateHouseHud();
        this.ui.updateVillageStatistics();
    }

    showGameplayUi() {
        this.ui.clear();
        this.miracleManager.refreshAvailableMiracles(this.world.getCurrentEra());
        this.ui.showMiracleToolbar();
        this.ui.showHouseHud();
        this.ui.showVillageStatistics();
        this.ui.showSaveButton(() => this.manualSave());
    }

    updateAutosave(delta) {
        this.autosaveTimer += delta;
        if (this.autosaveTimer >= 60) {
            this.autosaveTimer = 0;
            this.safeAutosave();
        }
    }

    safeAutosave() {
        try { this.saveManager.save(this.world.serialize()); } catch (error) { console.warn("Autosave non riuscito", error); }
    }

    manualSave() {
        try {
            this.saveManager.save(this.world.serialize());
            this.ui.showFeedback("Partita salvata");
        } catch (error) {
            console.warn("Salvataggio non riuscito", error);
        }
    }

    render() {
        this.renderer.render();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}
