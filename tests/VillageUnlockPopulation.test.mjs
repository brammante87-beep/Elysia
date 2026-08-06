import assert from "node:assert/strict";
import { World } from "../js/world/World.js";
import { Villager } from "../js/entities/Villager.js";
import { MiracleManager } from "../js/miracles/MiracleManager.js";

class VillageUnlockPopulationTest {
    run() {
        assert.equal(World.VILLAGE_UNLOCK_POPULATION, 15);
        assert.equal(World.MAX_POPULATION, 32);
        this.verifySaveAtFourteenRemainsTribe();
        this.verifySaveAtThresholdTransformsOnce();
        this.verifyAboveThresholdTribeSaveTransformsOnUpdate();
        this.verifyVillageSaveDoesNotDuplicateTransformation();
        console.log("Village unlock population checks passed");
    }

    verifySaveAtFourteenRemainsTribe() {
        const world = this.loadTribeSaveAtPopulation(14);
        world.update(0);
        assert.equal(world.worldEra, "tribe");
        assert.equal(world.villageTransformationCompleted, false);
    }

    verifySaveAtThresholdTransformsOnce() {
        const world = this.loadTribeSaveAtPopulation(World.VILLAGE_UNLOCK_POPULATION);
        assert.equal(world.worldEra, "tribe", "loading an eligible Tribe save must be silent until its next update");
        world.update(0);
        this.verifyVillageFeatures(world);
        const transitionSequence = world.eraTransitionSequence;
        const eventCount = world.eventLog.length;
        const well = world.villageWell;
        world.update(0);
        assert.equal(world.eraTransitionSequence, transitionSequence);
        assert.equal(world.eventLog.length, eventCount);
        assert.equal(world.villageWell, well);
    }

    verifyAboveThresholdTribeSaveTransformsOnUpdate() {
        const world = this.loadTribeSaveAtPopulation(18);
        assert.equal(world.worldEra, "tribe");
        world.update(0);
        this.verifyVillageFeatures(world);
    }

    verifyVillageSaveDoesNotDuplicateTransformation() {
        const original = this.loadTribeSaveAtPopulation(15);
        original.update(0);
        const loaded = new World();
        assert.equal(loaded.loadFromData(structuredClone(original.serialize())), true);
        const transitionSequence = loaded.eraTransitionSequence;
        const eventCount = loaded.eventLog.length;
        const wellId = loaded.villageWell.id;
        loaded.update(0);
        assert.equal(loaded.eraTransitionSequence, transitionSequence);
        assert.equal(loaded.eventLog.length, eventCount);
        assert.equal(loaded.villageWell.id, wellId);
        assert.equal(loaded.getPopulationCount(), 15);
        assert.notEqual(loaded.getFertilityIneligibilityReason(loaded.houses[0]), "La popolazione ha raggiunto il limite");
    }

    loadTribeSaveAtPopulation(population) {
        const source = this.createTribeAtPopulation(population);
        const loaded = new World();
        assert.equal(loaded.loadFromData(structuredClone(source.serialize())), true);
        return loaded;
    }

    createTribeAtPopulation(population) {
        const world = new World();
        world.initialize({ name: "Ari" });
        assert.equal(world.addChosenHouseAt(640, 448), true);
        while (world.getPopulationCount() < population) {
            const villager = new Villager({ name: `Resident ${world.getPopulationCount()}`, x: 520, y: 420 });
            world.assignEntityId(villager);
            world.villagers.push(villager);
        }
        return world;
    }

    verifyVillageFeatures(world) {
        assert.equal(world.worldEra, "village");
        assert.equal(world.villageTransformationCompleted, true);
        assert.equal(world.eraTransitionSequence, 1);
        assert.notEqual(world.villageBounds, null);
        assert.notEqual(world.villageGate, null);
        assert.notEqual(world.villageBoundary, null);
        assert.notEqual(world.villageWell, null);
        assert(world.houses.every((house) => house.upgraded && house.capacity === 6));
        assert.deepEqual(new MiracleManager().getMiraclesForEra(world.worldEra), ["fertility", "flower", "light", "lightning", "blessing"]);
    }
}

new VillageUnlockPopulationTest().run();
