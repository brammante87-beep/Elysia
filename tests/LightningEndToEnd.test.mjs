import test from "node:test";
import assert from "node:assert/strict";
import { Input } from "../js/input/Input.js";
import { MiracleManager } from "../js/miracles/MiracleManager.js";
import { Renderer } from "../js/renderer/Renderer.js";
import { AdultCharacterGeometry } from "../js/renderer/AdultCharacterGeometry.js";
import { UI } from "../js/ui/UI.js";
import { World } from "../js/world/World.js";
import { LightningEffect } from "../js/miracles/LightningEffect.js";
import { House } from "../js/entities/House.js";
import { Child } from "../js/entities/Child.js";

class TestElement extends EventTarget {
    constructor() { super(); this.dataset = {}; this.children = []; this.classList = { toggle() {} }; this.disabled = false; }
    appendChild(child) { this.children.push(child); }
    setAttribute(name, value) { this[name] = value; }
}

class TestCanvas extends EventTarget {
    constructor() { super(); this.width = 1280; this.height = 720; this.title = ""; }
    getBoundingClientRect() { return { left: 10, top: 20, width: 640, height: 360 }; }
}

class RecordingContext {
    constructor() { this.strokeCount = 0; }
    save() {} restore() {} fillRect() {} beginPath() {} moveTo() {} lineTo() {} arc() {} fill() {}
    stroke() { this.strokeCount += 1; }
    clearRect() {} ellipse() {} drawImage() {} fillText() {} strokeRect() {} quadraticCurveTo() {} bezierCurveTo() {} closePath() {} setLineDash() {}
    measureText() { return { width: 10 }; }
}

function clickAt(canvas, x, y) {
    const event = new Event("click");
    Object.defineProperties(event, { button: { value: 0 }, clientX: { value: 10 + x / 2 }, clientY: { value: 20 + y / 2 } });
    canvas.dispatchEvent(event);
}

test("Community toolbar to scaled canvas rebuild casts deterministic Lightning", () => {
    const originalDocument = globalThis.document;
    const logs = [];
    const originalDebug = console.debug;
    globalThis.document = { createElement: () => new TestElement() };
    globalThis.ELYSIA_DEBUG = true;
    console.debug = (message) => logs.push(message);
    try {
        const world = new World(); world.initialize({ name: "Blu" }); world.worldEra = "community";
        const miracles = new MiracleManager(); miracles.refreshAvailableMiracles(world.getCurrentEra());
        const ui = Object.create(UI.prototype); Object.assign(ui, { world, miracleManager: miracles, updateMiracleButtons() {} });
        const button = ui.createMiracleButton("lightning");
        assert.equal(button.dataset.miracle, "lightning"); assert.equal(button.disabled, false);
        button.dispatchEvent(new Event("click", { cancelable: true }));
        assert.equal(miracles.selectedMiracle, "lightning");

        const canvas = new TestCanvas(); new Input(canvas, world, miracles);
        const target = world.villagers[0]; const bounds = AdultCharacterGeometry.getAdultCharacterBounds(target);
        clickAt(canvas, (bounds.left + bounds.right) / 2, bounds.top + 4);
        assert.equal(target.lightningWarnings, 1); assert.equal(world.lightningEffects.length, 1);
        assert.equal(world.lastLightningResult.targetId, target.id); assert.equal(miracles.selectedMiracle, null);
        assert.deepEqual(logs.filter((line) => typeof line === "string" && line.startsWith("Lightning")), [
            "Lightning toolbar selected", "Lightning coordinates converted", "Lightning world click received",
            "Lightning target search started", "Lightning target found", "Lightning strike applied",
            "Lightning effect created", "Lightning deselected"
        ]);

        miracles.select("lightning"); clickAt(canvas, bounds.right + 2, target.y);
        assert.equal(target.lightningWarnings, 1); assert.equal(world.lightningEffects.length, 1);
        assert.equal(miracles.selectedMiracle, "lightning"); assert.equal(canvas.title, "Nessun abitante da colpire");
        assert.equal(world.lastLightningResult.reason, "no-target");

        const frontTarget = world.villagers[1]; frontTarget.x = target.x; frontTarget.y = target.y;
        miracles.select("lightning"); clickAt(canvas, target.x, target.y);
        assert.equal(frontTarget.lightningWarnings, 1); assert.equal(target.lightningWarnings, 1);
        frontTarget.x += 100;

        const house = new House(100, 100, world.hero); world.houses.push(house); miracles.select("lightning"); clickAt(canvas, house.x, house.y);
        assert.equal(miracles.selectedMiracle, "lightning");
        clickAt(canvas, world.hero.x, world.hero.y); assert.equal(miracles.selectedMiracle, "lightning");
        const child = new Child({ name: "Child", x: 700, y: 300 }); world.villagers.push(child); clickAt(canvas, child.x, child.y);
        assert.equal(miracles.selectedMiracle, "lightning"); assert.equal(world.lightningEffects.length, 2);

        target.lightningWarnings = 2; miracles.select("lightning"); clickAt(canvas, target.x, target.y);
        assert.equal(target.lightningWarnings, 3); assert.equal(target.alive, false);
        miracles.select("lightning"); clickAt(canvas, target.x, target.y);
        assert.equal(target.lightningWarnings, 3); assert.equal(miracles.selectedMiracle, "lightning");

        world.updateLightningEffects(1); assert.equal(world.lightningEffects.length, 0);
        world.lightningEffects.push(new LightningEffect(target.x, target.y));
        const context = new RecordingContext();
        const renderer = new Renderer(canvas, context, world, { getImage: () => null });
        renderer.drawLightningEffects();
        assert.ok(context.strokeCount > 0, "missing Lightning asset uses the Canvas bolt fallback");
    } finally {
        console.debug = originalDebug; globalThis.document = originalDocument; delete globalThis.ELYSIA_DEBUG;
    }
});
