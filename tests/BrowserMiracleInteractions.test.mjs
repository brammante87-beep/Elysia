import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Input } from "../js/input/Input.js";
import { MiracleManager } from "../js/miracles/MiracleManager.js";
import { World } from "../js/world/World.js";
import { House } from "../js/entities/House.js";

class TestCanvas extends EventTarget {
    constructor(width = 1024, height = 640, rectangle = { left: 0, top: 0, width: 1024, height: 640 }) {
        super();
        this.width = width;
        this.height = height;
        this.rectangle = rectangle;
        this.title = "";
    }

    getBoundingClientRect() { return this.rectangle; }
}

function createVillage() {
    const world = new World();
    world.initialize({ name: "Blu" });
    world.worldEra = "community";
    const miracles = new MiracleManager();
    miracles.refreshAvailableMiracles("community");
    return { world, miracles };
}

function findValidFlowerPosition(world) {
    for (let y = 352; y < world.getHeight(); y += 16) {
        for (let x = 16; x < world.getWidth(); x += 16) {
            const before = world.flowers.length;
            if (world.placeFlowerAt(x, y).success) {
                world.flowers.splice(before, 1);
                world.feedbackMessages.pop();
                return { x, y };
            }
        }
    }
    throw new Error("No valid flower position found");
}

test("browser click conversion casts one selected Flower before House selection", () => {
    const { world, miracles } = createVillage();
    const canvas = new TestCanvas(1024, 640, { left: 10, top: 20, width: 512, height: 320 });
    const input = new Input(canvas, world, miracles);
    const position = findValidFlowerPosition(world);
    let houseSelections = 0;
    const originalSelectHouse = world.selectHouse.bind(world);
    world.selectHouse = (house) => { houseSelections += 1; return originalSelectHouse(house); };

    miracles.select("flower");
    const event = new Event("click");
    Object.defineProperties(event, { button: { value: 0 }, clientX: { value: 10 + position.x / 2 }, clientY: { value: 20 + position.y / 2 } });
    canvas.dispatchEvent(event);

    assert.equal(world.flowers.length, 1);
    assert.equal(world.flowers[0].x, position.x);
    assert.equal(world.flowers[0].y, position.y);
    assert.equal(houseSelections, 0);
    assert.equal(miracles.selectedMiracle, null);
    assert.equal(world.feedbackMessages.at(-1).text, "Un fiore è sbocciato");
    assert.equal(input.getWorldPosition(event).x, position.x);
});

test("invalid selected Flower over a House creates none and is not intercepted", () => {
    const { world, miracles } = createVillage();
    const house = new House(420, 400, world.hero); world.houses.push(house);
    const canvas = new TestCanvas();
    const input = new Input(canvas, world, miracles);
    let houseSelections = 0;
    world.selectHouse = () => { houseSelections += 1; };

    miracles.select("flower");
    input.handleWorldClick(house.x, house.y);

    assert.equal(world.flowers.length, 0);
    assert.equal(houseSelections, 0);
    assert.equal(miracles.selectedMiracle, "flower");
    assert.equal(canvas.title, "Qui il fiore non può crescere");
    assert.equal(world.feedbackMessages.at(-1).text, "Qui il fiore non può crescere");
});

test("selected Lightning reaches a Villager near a House exactly once and preserves cargo", () => {
    const { world, miracles } = createVillage();
    const villager = world.villagers.find((person) => person.name === "Mira") || world.villagers[0];
    const house = new House(villager.x, villager.y, world.hero); world.houses.push(house);
    villager.carrying = { type: "wood", amount: 3 };
    villager.state = "cuttingTree";
    const canvas = new TestCanvas();
    const input = new Input(canvas, world, miracles);
    let houseSelections = 0;
    world.selectHouse = () => { houseSelections += 1; };

    miracles.select("lightning");
    input.handleWorldClick(villager.x, villager.y);

    assert.equal(villager.lightningWarnings, 1);
    assert.deepEqual(villager.carrying, { type: "wood", amount: 3 });
    assert.equal(villager.state, "idle");
    assert.equal(world.lightningEffects.length, 1);
    assert.equal(houseSelections, 0);
    assert.equal(miracles.selectedMiracle, null);
});

test("Lightning targets the visible upper body introduced by the character sprites", () => {
    const { world, miracles } = createVillage();
    const villager = world.villagers[0];
    const input = new Input(new TestCanvas(), world, miracles);

    miracles.select("lightning");
    input.handleWorldClick(villager.x + 25, villager.y - 38);

    assert.equal(villager.lightningWarnings, 1);
    assert.equal(world.lightningEffects.at(-1).x, villager.x);
    assert.equal(world.lightningEffects.at(-1).y, villager.y);
});

test("invalid Flower exposes the exact placement rejection", () => {
    const { world, miracles } = createVillage();
    const house = new House(420, 400, world.hero);
    world.houses.push(house);
    const input = new Input(new TestCanvas(), world, miracles);

    miracles.select("flower");
    input.handleWorldClick(house.x, house.y);

    assert.equal(world.lastFlowerPlacementReason, "House");
    assert.equal(world.feedbackMessages.at(-1).text, "Qui il fiore non può crescere");
});

test("third browser-path Lightning strike kills and dead Villagers gain no warnings", () => {
    const { world, miracles } = createVillage();
    const villager = world.villagers[0];
    const input = new Input(new TestCanvas(), world, miracles);
    for (let strike = 0; strike < 3; strike += 1) {
        miracles.select("lightning");
        input.handleWorldClick(villager.x, villager.y);
    }
    assert.equal(villager.lightningWarnings, 3);
    assert.equal(villager.alive, false);
    miracles.select("lightning");
    input.handleWorldClick(villager.x, villager.y);
    assert.equal(villager.lightningWarnings, 3);
});

test("Flowers and Lightning warnings retain save compatibility", () => {
    const { world } = createVillage();
    const position = findValidFlowerPosition(world);
    assert.equal(world.placeFlowerAt(position.x, position.y).success, true);
    world.villagers[0].lightningWarnings = 2;
    const loaded = new World();
    assert.equal(loaded.loadFromData(world.serialize()), true);
    assert.equal(loaded.flowers.length, 1);
    assert.equal(loaded.flowers[0].x, position.x);
    assert.equal(loaded.villagers[0].lightningWarnings, 2);
});

test("Community toolbar miracle keys exactly match MiracleManager keys", () => {
    const miracles = new MiracleManager();
    miracles.refreshAvailableMiracles("community");
    assert.deepEqual(miracles.availableMiracles, ["fertility", "flower", "light", "lightning", "blessing"]);
});

test("toolbar binds exact dataset keys through one activation listener", async () => {
    const source = await readFile(new URL("../js/ui/UI.js", import.meta.url), "utf8");
    assert.match(source, /button\.dataset\.miracle = miracle/);
    assert.match(source, /button\.addEventListener\("click", selectMiracle\)/);
    assert.doesNotMatch(source, /button\.addEventListener\("touchstart", selectMiracle/);
});

test("ground Lightning is visual-only and the Hero remains immune", () => {
    const { world, miracles } = createVillage();
    const input = new Input(new TestCanvas(), world, miracles);
    miracles.select("lightning");
    input.handleWorldClick(20, 20);
    assert.equal(world.lightningEffects.length, 1);
    assert.equal(miracles.selectedMiracle, null);
    miracles.select("lightning");
    input.handleWorldClick(world.hero.x, world.hero.y);
    assert.equal(world.hero.alive, true);
    assert.equal(world.feedbackMessages.at(-1).text, "Il Prescelto è immune al fulmine");
});
