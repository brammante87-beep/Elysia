import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../js/world/World.js";
import { House } from "../js/entities/House.js";
import { Animal } from "../js/entities/Animal.js";
import { MiracleManager } from "../js/miracles/MiracleManager.js";

test("village transformation removes animals and safely releases hunters", () => {
    const world = new World(); world.initialize({ name: "Blu" });
    const house = new House(420, 400, world.hero); world.assignHouseId(house); world.houses.push(house); world.hero.house = house; world.hero.ownedHouse = house;
    const animal = new Animal("Deer", 520, 430); world.animals.push(animal);
    const hunter = world.villagers[0]; hunter.targetAnimal = animal; hunter.state = "huntingAnimal"; animal.assignedVillager = hunter;
    hunter.carrying = { type: "meat", amount: 2 };
    world.worldEra = "village";
    assert.equal(world.performVillageTransformation(), true);
    assert.equal(world.animals.length, 0); assert.equal(hunter.targetAnimal, null); assert.deepEqual(hunter.carrying, { type: "meat", amount: 2 });
});

test("lightning preserves cargo, increments warnings, and third strike kills", () => {
    const world = new World(); world.initialize({ name: "Blu" }); world.worldEra = "village";
    const villager = world.villagers[0]; villager.carrying = { type: "wood", amount: 3 }; villager.destination = { x: 20, y: 20 };
    const miracles = new MiracleManager(); miracles.refreshAvailableMiracles("village"); miracles.select("lightning");
    assert.equal(miracles.cast(villager.x, villager.y, world), true);
    assert.equal(villager.lightningWarnings, 1); assert.deepEqual(villager.carrying, { type: "wood", amount: 3 }); assert.equal(villager.state, "idle");
    world.warnVillagerWithLightning(villager); world.warnVillagerWithLightning(villager);
    assert.equal(villager.alive, false); assert.equal(world.getLivingInhabitants().includes(villager), false);
});

test("warning counters and house variants survive save/load with old-save defaults", () => {
    const world = new World(); world.initialize({ name: "Blu" }); const villager = world.villagers[0]; villager.lightningWarnings = 2;
    const house = new House(420, 400, world.hero); world.assignHouseId(house); world.houses.push(house); world.hero.house = house; house.visualVariant = 3;
    const saved = world.serialize(); const loaded = new World(); assert.equal(loaded.loadFromData(saved), true);
    assert.equal(loaded.villagers[0].lightningWarnings, 2); assert.equal(loaded.houses[0].visualVariant, 3);
    delete saved.world.villagers[0].lightningWarnings; const migrated = new World(); migrated.loadFromData(saved); assert.equal(migrated.villagers[0].lightningWarnings, 0);
});

test("lightning immediately removes future raider targets", () => {
    const world = new World(); world.initialize(); world.worldEra = "village"; const raider = { x: 200, y: 200, radius: 14, alive: true }; world.raiders.push(raider);
    assert.equal(world.castLightningAt(200, 200), true); assert.equal(raider.alive, false); assert.equal(world.raiders.length, 0);
});
