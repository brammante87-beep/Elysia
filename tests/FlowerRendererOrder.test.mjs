import test from "node:test";
import assert from "node:assert/strict";
import { Renderer } from "../js/renderer/Renderer.js";

class FlowerRendererOrderTest extends Renderer {
    constructor() {
        super({}, {}, {});
        this.calls = [];
    }

    record(name) { this.calls.push(name); }
    clear() { this.record("clear"); }
    drawTerrain() { this.record("terrain"); }
    drawDirtPaths() { this.record("dirtPaths"); }
    drawVillageCenter() { this.record("villageCenter"); }
    drawVillageWell() { this.record("villageWell"); }
    drawHouses() { this.record("houses"); }
    drawTrees() { this.record("trees"); }
    drawFlowers() { this.record("flowers"); }
    drawFruitTrees() { this.record("fruitTrees"); }
    drawWaterSources() { this.record("waterSources"); }
    drawAnimals() { this.record("animals"); }
    drawDestinationMarker() { this.record("destinationMarker"); }
    drawEntities() { this.record("entities"); }
    drawVillageBoundary() { this.record("villageBoundary"); }
    drawEntityNames() { this.record("entityNames"); }
    drawEntityFeedback() { this.record("entityFeedback"); }
    drawDayNightOverlay() { this.record("dayNightOverlay"); }
    drawWorldFeedbackMessages() { this.record("worldFeedbackMessages"); }
    drawLightningEffects() { this.record("lightningEffects"); }

    verify() {
        this.render();
        const flowerIndex = this.calls.indexOf("flowers");
        assert.notEqual(flowerIndex, -1, "Renderer.render must call drawFlowers");
        assert.ok(flowerIndex > this.calls.indexOf("terrain"), "flowers must render after terrain");
        assert.ok(flowerIndex < this.calls.indexOf("entities"), "flowers must render before entities");
    }
}

const rendererOrderTest = new FlowerRendererOrderTest();
test("Renderer renders Flowers between terrain and covering entities", rendererOrderTest.verify.bind(rendererOrderTest));
