import assert from "node:assert/strict";
import { World } from "../js/world/World.js";
import { Villager } from "../js/entities/Villager.js";
import { Tree } from "../js/entities/Tree.js";
import { WaterSource } from "../js/entities/WaterSource.js";
import { Animal } from "../js/entities/Animal.js";

class HouselessAdultResourcePrioritiesTest {
    run() {
        const world = this.createWorldAtGatheringThreshold();
        const houseless = world.villagers[0];

        assert.deepEqual(world.getAllowedAutonomousResourceTypes(houseless), ["wood"]);
        assert.equal(world.canAutonomouslyGatherResource(houseless, "water"), false);
        assert.equal(world.canAutonomouslyGatherResource(houseless, "meat"), false);
        assert.equal(world.assignVillagerToResourceType("water"), false);
        assert.equal(world.assignVillagerToResourceType("animal"), false);
        assert.equal(world.assignVillagerToResourceType("tree"), true);
        assert.equal(houseless.targetTree, world.trees[0]);

        world.clearVillagerAllWork(houseless);
        houseless.carrying = { type: "wood", amount: 3 };
        assert.notEqual(world.getAvailableVillager("tree"), houseless, "three wood must be reserved for House construction");
        assert.equal(world.canBuilderAffordHouse(houseless), true);

        houseless.carrying = { type: "water", amount: 3 };
        assert.equal(world.normalizeHouselessInvalidCarrying(houseless), true);
        assert.deepEqual(houseless.carrying, { type: null, amount: 0 });
        assert.equal(world.normalizeHouselessInvalidCarrying(houseless), false, "normalization must not repeat");

        this.verifyResidenceAndLoadBehavior(world, houseless);
        console.log("houseless adult resource priorities: ok");
    }

    createWorldAtGatheringThreshold() {
        const world = new World();
        world.initialize({ name: "Ari" });
        world.villagers.push(new Villager({ name: "Rin", x: 500, y: 400 }));
        world.villagers.push(new Villager({ name: "Sol", x: 520, y: 400 }));
        world.trees = [new Tree(700, 400)];
        world.waterSources = [new WaterSource(720, 400)];
        world.animals = [new Animal("Deer", 740, 400)];
        assert.equal(world.getPopulationCount(), 5);
        return world;
    }

    verifyResidenceAndLoadBehavior(world, adult) {
        assert.equal(world.addChosenHouseAt(640, 448), true);
        adult.house = world.hero.house;
        world.hero.house.occupants.push(adult);
        assert.deepEqual(world.getAllowedAutonomousResourceTypes(adult), ["wood", "water", "meat"]);

        adult.house.occupants = adult.house.occupants.filter((occupant) => occupant !== adult);
        adult.carrying = { type: "wood", amount: 3 };
        const loadedWood = new World();
        assert.equal(loadedWood.loadFromData(world.serialize()), true);
        assert.deepEqual(loadedWood.villagers[0].carrying, { type: "wood", amount: 3 });

        adult.carrying = { type: "meat", amount: 3 };
        const loadedMeat = new World();
        assert.equal(loadedMeat.loadFromData(world.serialize()), true);
        assert.deepEqual(loadedMeat.villagers[0].carrying, { type: null, amount: 0 });
    }
}

new HouselessAdultResourcePrioritiesTest().run();
