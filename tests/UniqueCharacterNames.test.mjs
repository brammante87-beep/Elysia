import assert from "node:assert/strict";
import { World } from "../js/world/World.js";
import { Child } from "../js/entities/Child.js";
import { Villager } from "../js/entities/Villager.js";

class UniqueCharacterNamesTest {
    run() {
        this.verifyPlayerNamePriority();
        this.verifyPopulationNamesAndReload();
        this.verifyOldSaveMigration();
        console.log("unique character names and migration: ok");
    }

    verifyPlayerNamePriority() {
        const world = new World();
        world.initialize({ name: "Mira" });
        assert.equal(world.hero.name, "Mira");
        assert.equal(new Set(world.getLivingInhabitants().map((person) => person.name)).size, 3);
        assert.notEqual(world.villagers[0].name, "Mira");
    }

    verifyPopulationNamesAndReload() {
        const world = new World();
        world.initialize({ name: "Prescelto" });
        while (world.getPopulationCount() < 32) {
            const isArrival = world.getPopulationCount() % 3 === 0;
            const name = isArrival ? world.getRandomArrivalName() : world.getRandomChildName();
            const person = isArrival ? new Villager({ name }) : new Child({ name });
            world.assignEntityId(person);
            world.villagers.push(person);
        }
        const names = world.getLivingInhabitants().map((person) => person.name);
        assert.equal(new Set(names).size, 32);
        assert(names.every((name) => !/ \d+$/.test(name)));
        assert.deepEqual(new Set(world.getUsedNames()), new Set(names));

        const loaded = new World();
        assert(loaded.loadFromData(structuredClone(world.serialize())));
        assert.deepEqual(new Set(loaded.getUsedNames()), new Set(world.getUsedNames()));
        assert(loaded.isNameAvailable(names[10]) === false);
        assert(!names.includes(loaded.getRandomArrivalName()));
    }

    verifyOldSaveMigration() {
        const world = new World();
        world.initialize({ name: "Ari" });
        world.villagers[0].name = "Elia";
        world.villagers[1].name = "Elia";
        const oldSave = structuredClone(world.serialize());
        delete oldSave.world.usedNames;
        oldSave.world.schemaVersion = 6;
        const loaded = new World();
        assert(loaded.loadFromData(oldSave));
        assert.equal(loaded.villagers.filter((person) => person.name === "Elia").length, 2);
        assert.equal(loaded.isNameAvailable("Elia"), false);
        assert.notEqual(loaded.getRandomChildName(), "Elia");
    }
}

new UniqueCharacterNamesTest().run();
