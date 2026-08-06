import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Mushroom } from "../js/entities/Mushroom.js";
import { Input } from "../js/input/Input.js";
import { MiracleManager } from "../js/miracles/MiracleManager.js";
import { Renderer } from "../js/renderer/Renderer.js";
import { UI } from "../js/ui/UI.js";
import { World } from "../js/world/World.js";

class TestCanvas extends EventTarget {
    constructor() { super(); this.width = 1024; this.height = 640; this.title = ""; }
    getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; }
}

class TestButton extends EventTarget {
    constructor() { super(); this.dataset = {}; this.classList = { toggle() {} }; this.children = []; }
    appendChild(child) { this.children.push(child); }
    setAttribute() {}
}

class TestContext {
    constructor() { this.operations = []; }
    beginPath() { this.operations.push("beginPath"); }
    ellipse() { this.operations.push("ellipse"); }
    fillRect() { this.operations.push("fillRect"); }
    arc() { this.operations.push("arc"); }
    lineTo() { this.operations.push("lineTo"); }
    fill() { this.operations.push("fill"); }
}

function findFreeGrass(world) {
    for (let y = 336; y < world.getHeight(); y += 16) {
        for (let x = 16; x < world.getWidth(); x += 16) {
            if (world.validateMushroomPosition(x, y).success) { return { x, y }; }
        }
    }
    throw new Error("No mushroom position available");
}

test("Mushroom follows toolbar, canvas, collection, rendering and persistence paths", () => {
    const previousWindow = globalThis.window; const previousDocument = globalThis.document;
    globalThis.window = { addEventListener() {} };
    globalThis.document = { createElement: () => new TestButton() };
    try {
        const world = new World(); world.initialize({ name: "Test Hero" });
        const miracles = new MiracleManager();
        assert.ok(miracles.availableMiracles.includes("mushroom"));
        const root = { querySelectorAll: () => [], querySelector: () => null };
        const ui = new UI(root, miracles, world);
        const button = ui.createMiracleButton("mushroom");
        assert.equal(button.dataset.miracle, "mushroom");
        button.dispatchEvent(new Event("click"));
        assert.equal(miracles.selectedMiracle, "mushroom");

        const canvas = new TestCanvas(); const input = new Input(canvas, world, miracles); const position = findFreeGrass(world);
        const cast = new Event("click"); Object.defineProperties(cast, { button: { value: 0 }, clientX: { value: position.x }, clientY: { value: position.y } }); canvas.dispatchEvent(cast);
        assert.equal(world.mushrooms.length, 1); assert.equal(world.feedbackMessages.at(-1).text, "Un fungo è spuntato"); assert.equal(miracles.selectedMiracle, null);

        miracles.select("mushroom"); input.handleWorldClick(20, 20);
        assert.equal(world.mushrooms.length, 1); assert.equal(world.feedbackMessages.at(-1).text, "Qui il fungo non può crescere"); assert.equal(miracles.selectedMiracle, "mushroom");
        miracles.clearSelection();

        const context = new TestContext(); const renderer = new Renderer({}, context, world); renderer.drawMushrooms();
        assert.ok(context.operations.includes("ellipse")); assert.ok(context.operations.includes("fillRect")); assert.ok(context.operations.includes("arc"));

        const saved = world.serialize(); const loaded = new World(); assert.equal(loaded.loadFromData(saved), true);
        assert.equal(loaded.mushrooms.length, 1); assert.ok(loaded.mushrooms[0] instanceof Mushroom);
        const loadedContext = new TestContext(); loaded.mushrooms[0].render(loadedContext); assert.ok(loadedContext.operations.length > 0);

        const mushroom = world.mushrooms[0]; const meatBefore = world.hero.meat;
        input.handleWorldClick(mushroom.x, mushroom.y); assert.equal(world.hero.targetMushroom, mushroom);
        for (let step = 0; step < 100 && world.mushrooms.length > 0; step += 1) { world.updateHero(0.1); }
        assert.equal(world.mushrooms.length, 0); assert.equal(world.hero.meat, meatBefore + mushroom.foodValue); assert.equal(world.feedbackMessages.at(-1).text, "Fungo raccolto");
        world.updateHero(0.1); assert.equal(world.hero.meat, meatBefore + mushroom.foodValue, "collection happens once");
    } finally { globalThis.window = previousWindow; globalThis.document = previousDocument; }
});

test("index boots the real Game module and Mushroom uses only the toolbar click listener", async () => {
    const [index, ui] = await Promise.all([readFile(new URL("../index.html", import.meta.url), "utf8"), readFile(new URL("../js/ui/UI.js", import.meta.url), "utf8")]);
    assert.match(index, /import \{ Game \} from "\.\/js\/core\/Game\.js"/);
    assert.match(ui, /button\.dataset\.miracle = miracle/); assert.match(ui, /button\.addEventListener\("click", selectMiracle\)/);
    assert.doesNotMatch(ui, /button\.addEventListener\("(?:pointer|touch)/);
});
