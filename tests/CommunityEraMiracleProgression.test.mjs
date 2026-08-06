import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../js/world/World.js";
import { Villager } from "../js/entities/Villager.js";
import { MiracleManager } from "../js/miracles/MiracleManager.js";
import { Input } from "../js/input/Input.js";
import { UI } from "../js/ui/UI.js";
import { Renderer } from "../js/renderer/Renderer.js";
import { Flower } from "../js/entities/Flower.js";
import { AssetLoader } from "../js/assets/AssetLoader.js";

class TestClassList {
    constructor(element) { this.element = element; }
    toggle(name, enabled) {
        const names = new Set(this.element.className.split(" ").filter(Boolean));
        if (enabled) { names.add(name); } else { names.delete(name); }
        this.element.className = [...names].join(" ");
    }
}

class TestElement extends EventTarget {
    constructor(tagName) {
        super();
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.parentNode = null;
        this.dataset = {};
        this.attributes = {};
        this.className = "";
        this.classList = new TestClassList(this);
        this.textContent = "";
        this.title = "";
        this.id = "";
        this.width = 1024;
        this.height = 640;
    }

    appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
    append(...children) { children.forEach((child) => this.appendChild(child)); }
    remove() {
        if (this.parentNode === null) { return; }
        this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
        this.parentNode = null;
    }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    querySelectorAll(selector) {
        const matches = [];
        this.children.forEach((child) => {
            if (child.matches(selector)) { matches.push(child); }
            matches.push(...child.querySelectorAll(selector));
        });
        return matches;
    }
    matches(selector) {
        if (selector.startsWith("#")) { return this.id === selector.slice(1); }
        if (selector.startsWith(".")) { return this.className.split(" ").includes(selector.slice(1)); }
        return false;
    }
    getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; }
}

class TestDocument {
    createElement(tagName) { return new TestElement(tagName); }
}

class FlowerRenderContext {
    constructor() { this.arcCount = 0; this.drawImageCount = 0; }
    beginPath() {}
    moveTo() {}
    lineTo() {}
    stroke() {}
    fill() {}
    arc() { this.arcCount += 1; }
    drawImage() { this.drawImageCount += 1; }
}

class CommunityEraMiracleProgressionTest {
    constructor() {
        globalThis.window = new EventTarget();
        globalThis.window.setTimeout = () => 0;
        globalThis.document = new TestDocument();
        this.root = new TestElement("main");
        this.canvas = new TestElement("canvas");
        this.world = new World();
        this.world.initialize({ name: "Ari" });
        this.miracles = new MiracleManager();
        this.input = new Input(this.canvas, this.world, this.miracles);
        this.ui = new UI(this.root, this.miracles, this.world);
    }

    run() {
        this.prepareRealProgression();
        this.verifyTransitionAndToolbar();
        this.verifyFlower();
        this.verifyLightning();
        this.verifyUnimplementedMiracles();
        this.verifySaveCompatibility();
    }

    prepareRealProgression() {
        assert.equal(this.world.addChosenHouseAt(640, 448), true);
        while (this.world.getPopulationCount() < World.VILLAGE_UNLOCK_POPULATION) {
            const villager = new Villager({ name: `Resident ${this.world.getPopulationCount()}`, x: 520, y: 420 });
            this.world.assignEntityId(villager);
            this.world.villagers.push(villager);
        }
        this.miracles.refreshAvailableMiracles(this.world.getCurrentEra());
        this.ui.showMiracleToolbar();
        this.tribeToolbar = this.root.querySelector("#miracleToolbar");
        this.world.onEraChanged = () => {
            this.miracles.refreshAvailableMiracles(this.world.getCurrentEra());
            this.ui.rebuildMiracleToolbar();
        };
        this.world.update(0);
    }

    verifyTransitionAndToolbar() {
        assert.equal(this.world.getCurrentEra(), "community");
        assert.equal(this.world.eraTransitionSequence, 1);
        assert.equal(this.tribeToolbar.parentNode, null, "the replaced toolbar must be detached");
        const buttons = this.getButtons();
        assert.deepEqual(buttons.map((button) => button.dataset.miracle), ["fertility", "flower", "light", "lightning", "blessing"]);
        this.verifyButton(buttons[1], "flower", "🌸", "Flower miracle");
        this.verifyButton(buttons[3], "lightning", "⚡", "Lightning miracle");
    }

    verifyButton(button, miracle, icon, label) {
        assert.equal(button.dataset.miracle, miracle);
        assert.equal(button.textContent, icon);
        assert.equal(button.title, label);
        assert.equal(button.attributes["aria-label"], label);
    }

    verifyFlower() {
        const position = this.findValidFlowerPosition();
        const diagnostics = [];
        const originalDebug = console.debug;
        globalThis.ELYSIA_DEBUG = true;
        console.debug = (message) => diagnostics.push(message);
        try {
            const countBefore = this.world.flowers.length;
            this.activate("flower");
            assert.equal(this.miracles.selectedMiracle, "flower");
            this.clickCanvas(position.x, position.y);
            assert.equal(this.world.flowers.length, countBefore + 1);
            const placedFlower = this.world.flowers.at(-1);
            assert.ok(placedFlower instanceof Flower);
            assert.equal(placedFlower.alive, true);
            assert.equal(placedFlower.x, position.x);
            assert.equal(placedFlower.y, position.y);
            assert.equal(this.world.feedbackMessages.at(-1).text, "Un fiore è sbocciato");
            assert.equal(this.world.lastFlowerPlacementReason, null);
            assert.equal(this.miracles.selectedMiracle, null);

            const context = new FlowerRenderContext();
            const assetManager = new AssetLoader();
            const checkerboard = { assetFallback: true, width: 32, height: 32 };
            assetManager.getImage = () => checkerboard;
            assert.equal(assetManager.hasLoaded("flower"), false, "flower asset must be absent from the real asset registry");
            new Renderer(this.canvas, context, this.world, assetManager).drawFlowers();
            assert.ok(context.arcCount >= 6, "Canvas fallback must draw visible petals and a center");
            assert.equal(context.drawImageCount, 0, "checkerboard fallback must not be drawn");

            const guardedContext = new FlowerRenderContext();
            placedFlower.render(guardedContext, checkerboard);
            assert.ok(guardedContext.arcCount >= 6, "Flower must reject an AssetManager checkerboard");
            assert.equal(guardedContext.drawImageCount, 0);

            const saved = structuredClone(this.world.serialize());
            assert.deepEqual(saved.world.flowers.map(({ id, x, y }) => ({ id, x, y })), [{ id: this.world.flowers[0].id, x: position.x, y: position.y }]);
            const loaded = new World();
            assert.equal(loaded.loadFromData(saved), true);
            assert.equal(loaded.flowers.length, 1);
            assert.ok(loaded.flowers[0] instanceof Flower);
            const loadedContext = new FlowerRenderContext();
            new Renderer(this.canvas, loadedContext, loaded, assetManager).drawFlowers();
            assert.ok(loadedContext.arcCount >= 6);

            const house = this.world.houses[0];
            const flowerCount = this.world.flowers.length;
            this.activate("flower");
            this.clickCanvas(house.x, house.y);
            assert.equal(this.world.flowers.length, flowerCount);
            assert.equal(this.world.feedbackMessages.at(-1).text, "Qui il fiore non può crescere");
            assert.equal(this.world.lastFlowerPlacementReason, "House");
            assert.equal(this.miracles.selectedMiracle, "flower");
        } finally {
            console.debug = originalDebug;
            delete globalThis.ELYSIA_DEBUG;
        }
        ["Flower toolbar selected", "Flower world click received", "Flower coordinates converted", "Flower validation result", "Flower instance exists", "Flower pushed to world.flowers", "Flower passed to Renderer", "Flower asset unavailable", "Flower procedural fallback selected", "Flower fallback rendered", "Flower rendered", "Flower deselected"].forEach((message) => {
            assert.ok(diagnostics.includes(message), `missing diagnostic: ${message}`);
        });
        assert.equal(this.hasUnavailableFeedback(), false);
    }

    verifyLightning() {
        const villager = this.world.villagers[0];
        this.activate("lightning");
        assert.equal(this.miracles.selectedMiracle, "lightning");
        this.clickCanvas(villager.x, villager.y);
        assert.equal(villager.lightningWarnings, 1);
        assert.equal(this.world.lightningEffects.length, 1);
        assert.equal(this.miracles.selectedMiracle, null);
        assert.equal(this.hasUnavailableFeedback(), false);
    }

    verifyUnimplementedMiracles() {
        ["light", "blessing"].forEach((miracle) => {
            this.activate(miracle);
            this.clickCanvas(32, 352);
        });
        assert.equal(this.world.feedbackMessages.filter((message) => message.text === "Questo miracolo non è ancora disponibile.").length, 2);
    }

    verifySaveCompatibility() {
        const communitySave = structuredClone(this.world.serialize());
        const community = new World();
        assert.equal(community.loadFromData(communitySave), true);
        assert.equal(community.getCurrentEra(), "community");
        assert.deepEqual(new MiracleManager().getMiraclesForEra(community.getCurrentEra()), ["fertility", "flower", "light", "lightning", "blessing"]);

        communitySave.world.worldEra = "village";
        const legacyCommunity = new World();
        assert.equal(legacyCommunity.loadFromData(communitySave), true);
        assert.equal(legacyCommunity.getCurrentEra(), "community");
        assert.equal(legacyCommunity.serialize().world.worldEra, "community");

        const tribe = new World();
        tribe.initialize();
        const loadedTribe = new World();
        assert.equal(loadedTribe.loadFromData(structuredClone(tribe.serialize())), true);
        assert.equal(loadedTribe.getCurrentEra(), "tribe");
    }

    getButtons() { return this.root.querySelectorAll(".miracleButton"); }
    getButton(miracle) { return this.getButtons().find((button) => button.dataset.miracle === miracle); }
    activate(miracle) { this.getButton(miracle).dispatchEvent(new Event("click", { cancelable: true })); }
    clickCanvas(x, y) {
        const event = new Event("click");
        Object.defineProperties(event, { button: { value: 0 }, clientX: { value: x }, clientY: { value: y } });
        this.canvas.dispatchEvent(event);
    }
    hasUnavailableFeedback() { return this.world.feedbackMessages.some((message) => message.text === "Questo miracolo non è ancora disponibile."); }
    findValidFlowerPosition() {
        for (let y = 352; y < this.world.getHeight(); y += 16) {
            for (let x = 16; x < this.world.getWidth(); x += 16) {
                const before = this.world.flowers.length;
                if (!this.world.placeFlowerAt(x, y).success) { continue; }
                this.world.flowers.splice(before, 1);
                this.world.feedbackMessages.pop();
                return { x, y };
            }
        }
        throw new Error("No valid Flower position found");
    }
}

const progressionTest = new CommunityEraMiracleProgressionTest();
test("Community miracles remain wired through real progression and toolbar rebuild", progressionTest.run.bind(progressionTest));
