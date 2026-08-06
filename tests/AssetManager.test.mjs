import assert from "node:assert/strict";
import test from "node:test";
import { AssetManager } from "../js/assets/AssetManager.js";

class FakeImage {
    static instances = [];

    constructor() {
        this.listeners = new Map();
        this.width = 32;
        this.height = 16;
        FakeImage.instances.push(this);
    }

    addEventListener(type, listener) { this.listeners.set(type, listener); }
    set src(value) { this.source = value; queueMicrotask(() => this.listeners.get(value.includes("missing") ? "error" : "load")()); }
}

test("looks up a loaded asset by stable semantic key", async () => {
    const fallback = { fallback: true };
    const manager = new AssetManager(FakeImage, fallback);
    await manager.loadImage("nature.tree01", "tree.png");
    assert.equal(manager.getImage("nature.tree01").source, "tree.png");
});

test("prevents duplicate loading by key and source", async () => {
    FakeImage.instances.length = 0;
    const manager = new AssetManager(FakeImage, {});
    const first = manager.loadImage("nature.tree01", "tree.png");
    const repeatedKey = manager.loadImage("nature.tree01", "tree.png");
    const repeatedSource = manager.loadImage("nature.tree02", "tree.png");
    await Promise.all([first, repeatedKey, repeatedSource]);
    assert.equal(FakeImage.instances.length, 1);
});

test("returns a safe fallback for absent and failed assets", async () => {
    const fallback = { fallback: true };
    const manager = new AssetManager(FakeImage, fallback);
    assert.equal(manager.getImage("missing.key"), fallback);
    await manager.loadImage("missing.image", "missing.png");
    assert.equal(manager.getImage("missing.image"), fallback);
});

test("legacy aliases resolve to semantic keys", async () => {
    const manager = new AssetManager(FakeImage, {});
    manager.registerAlias("tree", "nature.tree01");
    await manager.loadImage("nature.tree01", "tree.png");
    assert.equal(manager.getImage("tree"), manager.getImage("nature.tree01"));
});

test("exposes sprite-sheet frame coordinates for future animation", async () => {
    const manager = new AssetManager(FakeImage, {});
    await manager.loadImage("character.sheet", "characters.png", { frameWidth: 16, frameHeight: 16, columns: 2 });
    assert.deepEqual(manager.getFrame("character.sheet", 1), {
        image: manager.getImage("character.sheet"), x: 16, y: 0, width: 16, height: 16
    });
});
