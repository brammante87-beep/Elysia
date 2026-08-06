import assert from "node:assert/strict";
import { World } from "../js/world/World.js";
import { Tree } from "../js/entities/Tree.js";
import { WaterSource } from "../js/entities/WaterSource.js";
import { Animal } from "../js/entities/Animal.js";
import { Well } from "../js/entities/Well.js";

class HouselessAdultResourcePrioritiesTest {
    constructor() {
        this.randomState = 246813579;
        this.originalRandom = Math.random;
    }

    run() {
        Math.random = () => this.nextRandom();
        try {
            ["Mira", "Taro"].forEach((name) => this.verifyNewGameSequence(name));
            ["Mira", "Taro"].forEach((name) => this.verifySaveLoadSequence(name));
            console.log("houseless adult new-game and save/load resource priorities: ok");
        } finally {
            Math.random = this.originalRandom;
        }
    }

    verifyNewGameSequence(houselessName) {
        const { world, houseless } = this.createPopulationFiveWorld(houselessName, false);
        world.autonomousResourceDebugEnabled = true;
        this.advanceUntil(world, () => world.lastAutonomousResourceDecision !== null, 400,
            `${houselessName} did not receive Tree work: ${JSON.stringify(this.describeWorker(houseless))}`);
        this.assertFirstAssignment(world, houseless);
        this.verifyInvalidTargetsAreReleased(world, houseless);
        this.advanceUntil(world, () => houseless.carrying.type === "wood" && houseless.carrying.amount === 3, 1200,
            `${houselessName} did not collect exactly three wood`);

        const woodBeforeBuild = this.getWorldResourceTotal(world);
        world.update(0.25);
        assert.equal(houseless.targetTree, null, "House construction must preempt a fourth Tree assignment");
        assert.equal(houseless.carrying.amount, 3, "the House wood must remain carried until a site is reserved");
        assert.equal(world.autonomousHouseBuilder, houseless, "the houseless adult must become the next House builder");
        this.advanceUntil(world, () => houseless.ownedHouse !== null, 800, `${houselessName} did not build the second House`);
        assert.equal(world.houses.length, 2);
        assert.equal(world.isHouselessAdult(houseless), false);
        assert.equal(houseless.carrying.amount, 0);
        assert.equal(this.getWorldResourceTotal(world), woodBeforeBuild - 3, "House construction must consume exactly three wood");
        assert.deepEqual(world.getAllowedAutonomousResourceTypes(houseless), ["wood", "water", "meat"]);
        this.verifyResidentCanGatherWaterAndMeat(world, houseless);
    }

    verifySaveLoadSequence(houselessName) {
        const prepared = this.createPopulationFiveWorld(houselessName, true);
        const totalBeforeSave = this.getWorldResourceTotal(prepared.world);
        const loaded = new World();
        assert.equal(loaded.loadFromData(structuredClone(prepared.world.serialize())), true);
        const houseless = loaded.villagers.find((person) => person.name === houselessName);
        loaded.villageWell = new Well(760, 420);
        loaded.autonomousResourceDebugEnabled = true;

        assert(houseless);
        assert.equal(loaded.getPopulationCount(), 5);
        assert.equal(loaded.isHouselessAdult(houseless), true);
        assert.deepEqual(loaded.getAllowedAutonomousResourceTypes(houseless), ["wood"]);
        assert.equal(this.getWorldResourceTotal(loaded), totalBeforeSave, "save/load must not duplicate or lose resources");
        this.advanceUntil(loaded, () => houseless.targetTree !== null, 400, `${houselessName} did not receive Tree work after load`);
        this.assertFirstAssignment(loaded, houseless);
    }

    createPopulationFiveWorld(houselessName, stopBeforeFirstAssignment) {
        const world = new World();
        world.initialize({ name: "Prescelto", gender: "non-binario", orientation: "pansessuale", relationshipStyle: "monogamo" });
        world.dayDuration = 100000;
        const chosenHouseSite = this.findChosenHouseSite(world);
        assert(chosenHouseSite);
        assert.equal(world.addChosenHouseAt(chosenHouseSite.x, chosenHouseSite.y), true);
        world.hero.house.storage = { wood: 30, water: 30, meat: 30 };
        const houseless = world.villagers.find((person) => person.name === houselessName);
        const partner = world.villagers.find((person) => person !== houseless);
        assert(houseless && partner);
        assert.equal(world.commandHeroToPartnerWith(partner), true);
        this.advanceUntil(world, () => world.hero.partners.includes(partner), 200, "the initial family did not form");

        this.createChildThroughUpdateLoop(world);
        world.hero.house.fertilityCooldown = 0;
        if (stopBeforeFirstAssignment) { world.dayPhase = "nightApproaching"; world.phaseTimer = 0; }
        this.createChildThroughUpdateLoop(world);
        if (stopBeforeFirstAssignment) { world.dayPhase = "day"; world.phaseTimer = 0; }

        assert.equal(world.getPopulationCount(), 5);
        assert.equal(houseless.alive, true);
        assert.equal(houseless.isAdult, true);
        assert.equal(houseless.partners.length, 0);
        assert.equal(houseless.house, null);
        assert.equal(houseless.ownedHouse, null);
        world.hero.house.storage = { wood: 30, water: 30, meat: 30 };
        world.trees = [new Tree(720, 384), new Tree(760, 460), new Tree(560, 520)];
        world.waterSources = [new WaterSource(780, 384)];
        world.animals = [new Animal("Deer", 800, 500)];
        [...world.trees, ...world.waterSources, ...world.animals].forEach((resource) => world.assignResourceId(resource));
        world.villageWell = new Well(740, 540);
        return { world, houseless };
    }

    createChildThroughUpdateLoop(world) {
        assert.equal(world.commandFertilityAt(world.hero.house.x, world.hero.house.y), true);
        const startingPopulation = world.getPopulationCount();
        this.advanceUntil(world, () => world.getPopulationCount() === startingPopulation + 1, 200, "Fertility did not create a Child");
    }

    findChosenHouseSite(world) {
        for (let y = 352; y < world.getHeight() - 48; y += 32) {
            for (let x = 48; x < world.getWidth() - 48; x += 32) {
                if (world.canPlaceHouseAt(x, y)) { return { x, y }; }
            }
        }
        return null;
    }

    assertFirstAssignment(world, houseless) {
        const diagnostic = world.lastAutonomousResourceDecision;
        console.log(`assignment diagnostic ${houseless.name}: ${JSON.stringify(diagnostic)}`);
        assert(diagnostic);
        assert.equal(diagnostic.population, 5);
        assert.equal(diagnostic.personId, houseless.id);
        assert.equal(diagnostic.houseId, null);
        assert.equal(diagnostic.isHouselessAdult, true);
        assert.deepEqual(diagnostic.allowedTypes, ["wood"]);
        assert(diagnostic.candidatesBeforeFiltering.includes("water"));
        assert(diagnostic.candidatesBeforeFiltering.includes("meat"));
        assert.deepEqual(diagnostic.candidatesAfterFiltering, ["wood"]);
        assert.equal(diagnostic.selectedJob, "wood");
        assert.notEqual(diagnostic.assignedTarget, null);
        assert.notEqual(houseless.targetTree, null);
        assert.equal(houseless.targetWaterSource, null);
        assert.equal(houseless.targetAnimal, null);
        assert([null, "wood"].includes(houseless.carrying.type));
        assert.equal(world.villageWell.assignedWorkers.includes(houseless), false);
    }

    verifyInvalidTargetsAreReleased(world, houseless) {
        const source = world.waterSources[0];
        world.clearVillagerTreeWork(houseless);
        source.assignedVillager = houseless;
        houseless.targetWaterSource = source;
        houseless.actionTimer = 0.9;
        const quantity = source.waterRemaining;
        world.updateVillager(houseless, 1);
        assert.equal(houseless.targetWaterSource, null);
        assert.equal(source.assignedVillager, null);
        assert.equal(source.waterRemaining, quantity);
        assert.equal(houseless.actionTimer, 0);

        houseless.carrying = { type: "meat", amount: 2 };
        world.updateVillager(houseless, 0);
        assert.deepEqual(houseless.carrying, { type: null, amount: 0 });
    }

    verifyResidentCanGatherWaterAndMeat(world, resident) {
        world.hero.house.storage = { wood: 30, water: 30, meat: 30 };
        resident.house.storage = { wood: 30, water: 0, meat: 0 };
        world.nextResourceAssignmentIndex = 1;
        this.advanceUntil(world, () => resident.carrying.type === "water" && resident.carrying.amount > 0, 800,
            `${resident.name} could not gather water after becoming resident`);
        resident.carrying = { type: null, amount: 0 };
        world.clearVillagerAllWork(resident);
        resident.house.storage.water = 30;
        world.nextResourceAssignmentIndex = 2;
        this.advanceUntil(world, () => resident.carrying.type === "meat" && resident.carrying.amount > 0, 800,
            `${resident.name} could not gather meat after becoming resident`);
    }

    advanceUntil(world, condition, maximumTicks, message) {
        for (let tick = 0; tick < maximumTicks && !condition(); tick += 1) { world.update(0.25); }
        assert(condition(), message);
    }

    describeWorker(person) {
        return { state: person.state, carrying: person.carrying, tree: person.targetTree?.id ?? null,
            water: person.targetWaterSource?.id ?? null, animal: person.targetAnimal?.id ?? null };
    }

    getWorldResourceTotal(world) {
        const stored = world.houses.reduce((total, house) => total + house.storage.wood + house.storage.water + house.storage.meat, 0);
        const carried = world.getLivingInhabitants().reduce((total, person) => total + person.carrying.amount, 0);
        const remaining = [...world.trees, ...world.waterSources, ...world.animals].reduce((total, resource) =>
            total + (resource.woodRemaining || 0) + (resource.waterRemaining || 0) + (resource.meatRemaining || 0), 0);
        return stored + carried + remaining;
    }

    nextRandom() {
        this.randomState = (1664525 * this.randomState + 1013904223) >>> 0;
        return this.randomState / 4294967296;
    }
}

new HouselessAdultResourcePrioritiesTest().run();
