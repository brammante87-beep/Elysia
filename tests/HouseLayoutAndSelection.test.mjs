import assert from "node:assert/strict";
import { World } from "../js/world/World.js";
import { House } from "../js/entities/House.js";

class HouseLayoutAndSelectionTest {
    run() {
        let randomState = 123456789;
        const originalRandom = Math.random;
        Math.random = () => { randomState = (1664525 * randomState + 1013904223) >>> 0; return randomState / 4294967296; };
        const world = this.createWorld();
        this.verifyCompactPlacement(world);
        this.verifySelection(world);
        this.verifySaveCompatibility(world);
        Math.random = originalRandom;
        console.log("compact House layout, selection, details, and save compatibility: ok");
    }

    createWorld() {
        const world = new World();
        world.initialize({ name: "Blu", gender: "non-binario", orientation: "pansessuale", relationshipStyle: "monogamo" });
        world.trees = [];
        world.waterSources = [];
        world.animals = [];
        assert.equal(world.addChosenHouseAt(512, 400), true);
        return world;
    }

    verifyCompactPlacement(world) {
        for (let index = 0; index < 8; index += 1) {
            const builder = world.villagers[index % world.villagers.length];
            const site = world.findCompactHouseSite(builder);
            assert.notEqual(site, null, `compact site ${index + 1} should be available`);
            const house = new House(site.x, site.y, builder);
            world.assignHouseId(house);
            world.houses.push(house);
        }

        const center = world.getChosenHouse();
        world.houses.forEach((house) => {
            assert(Math.hypot(house.x - center.x, house.y - center.y) <= 275, "every House should remain in the compact settlement radius");
        });
        for (let left = 0; left < world.houses.length; left += 1) {
            for (let right = left + 1; right < world.houses.length; right += 1) {
                assert(Math.hypot(world.houses[left].x - world.houses[right].x, world.houses[left].y - world.houses[right].y) >= 100, "Houses must not overlap");
            }
        }
    }

    verifySelection(world) {
        const house = world.houses[1];
        house.storage = { wood: 7, water: 8, meat: 9 };
        house.owner.house = house;
        assert.equal(world.getHouseAtWorldPosition(house.x, house.y), house, "sprite should be clickable");
        assert.equal(world.getHouseAtWorldPosition(house.x, house.y - 45), house, "name label should be clickable");
        world.selectHouse(house);
        assert.equal(world.getSelectedHouse(), house, "selected House should update immediately");
        assert.equal(world.getHouseHudSummary(house).capacity, house.capacity);
        assert.deepEqual(world.getHouseHudSummary(house).occupants, [house.owner.name]);
        assert.deepEqual(world.getHouseHudSummary(house).totals, { wood: 7, water: 8, meat: 9, occupants: 1 });
        world.setHeroDestination(100, 100);
        assert.equal(world.getSelectedHouse(), house, "issuing commands should preserve House selection");
        world.houses = world.houses.filter((candidate) => candidate !== house);
        assert.equal(world.getSelectedHouse(), world.getChosenHouse(), "removed House selection should return to the chosen House");
    }

    verifySaveCompatibility(world) {
        const loaded = new World();
        assert.equal(loaded.loadFromData(structuredClone(world.serialize())), true);
        assert.equal(loaded.getSelectedHouse(), loaded.getChosenHouse());
    }
}

new HouseLayoutAndSelectionTest().run();
