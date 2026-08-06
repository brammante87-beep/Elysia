import assert from "node:assert/strict";
import { World } from "../js/world/World.js";

class PopulationProgressionIntegrationTest {
    constructor() {
        this.randomState = 123456789;
        this.originalRandom = Math.random;
        this.milestones = new Set();
        this.savedAtSeventeen = null;
        this.transformationSequenceAtThirtyTwo = null;
    }

    run() {
        Math.random = () => this.nextRandom();
        try {
            let world = this.createWorld();
            world = this.simulate(world);
            this.verifyFinalState(world);
            console.log(`population progression milestones: ${[...this.milestones].sort((a, b) => a - b).join(", ")}`);
            console.log(`days simulated: ${world.dayNumber}; houses: ${world.houses.length}; arrivals: ${world.arrivalsUsed}/${world.maxArrivals}`);
        } finally {
            Math.random = this.originalRandom;
        }
    }

    createWorld() {
        const world = new World();
        world.initialize({ name: "Ari", gender: "non-binario", orientation: "pansessuale", relationshipStyle: "monogamo" });
        assert.equal(world.addChosenHouseAt(640, 448), true, "the chosen one's first house must be built through World");
        world.hero.house.storage = { wood: 120, water: 120, meat: 120 };
        assert.equal(world.commandHeroToPartnerWith(world.villagers[0]), true, "the first partnership must use the current World command");
        return world;
    }

    simulate(world) {
        let unchangedFor = 0;
        let previousPopulation = world.getPopulationCount();
        for (let tick = 0; tick < 240000 && world.getPopulationCount() < 32; tick += 1) {
            this.provisionGatheredHouseholdResources(world);
            this.invokeEligibleFertility(world);
            world.update(0.25);
            const population = world.getPopulationCount();
            [17, 19, 24, 28, 32].forEach((milestone) => { if (population >= milestone) { this.milestones.add(milestone); } });
            unchangedFor = population === previousPopulation ? unchangedFor + 0.25 : 0;
            previousPopulation = population;
            if (population >= 17 && this.savedAtSeventeen === null) {
                const resourceTotal = this.getResourceTotal(world);
                const adultCount = world.getLivingInhabitants().filter((person) => person.isAdult).length;
                const actionablePairCount = this.getActionablePairCount(world);
                this.savedAtSeventeen = structuredClone(world.serialize());
                const reloaded = new World();
                assert.equal(reloaded.loadFromData(this.savedAtSeventeen), true);
                assert.equal(reloaded.arrivalsUsed, world.arrivalsUsed);
                assert.equal(reloaded.maxArrivals, 6);
                assert.equal(reloaded.getLivingInhabitants().filter((person) => person.isAdult).length, adultCount);
                assert.equal(this.getResourceTotal(reloaded), resourceTotal, "save/load must not duplicate resources");
                assert.equal(this.getActionablePairCount(reloaded), actionablePairCount, "save/load must preserve actionable compatibility");
                this.verifyReferences(reloaded);
                world = reloaded;
            }
            if (unchangedFor >= (world.dayDuration + world.nightReturnDuration + world.nightDuration) * 4) {
                throw new Error(this.buildDiagnostic(world));
            }
        }
        assert.equal(world.getPopulationCount(), 32, this.buildDiagnostic(world));
        return world;
    }

    provisionGatheredHouseholdResources(world) {
        world.houses.forEach((house) => {
            house.storage.wood = Math.max(house.storage.wood, 30);
            house.storage.water = Math.max(house.storage.water, 30);
            house.storage.meat = Math.max(house.storage.meat, 30);
        });
        world.villagers.filter((person) => person.alive && person.isAdult && person.house === null && person.ownedHouse === null).forEach((person) => {
            if (person.carrying.amount === 0) { person.carrying = { type: "wood", amount: 3 }; }
        });
    }

    invokeEligibleFertility(world) {
        if (world.dayPhase === "night") { return; }
        world.houses.forEach((house) => {
            if (world.getFertilityIneligibilityReason(house) === null) { world.startFertilityEvent(house); }
        });
    }

    verifyFinalState(world) {
        [17, 19, 24, 28, 32].forEach((milestone) => assert(this.milestones.has(milestone), `missing milestone ${milestone}`));
        world.update(1);
        assert.equal(world.worldEra, "village");
        this.transformationSequenceAtThirtyTwo = world.eraTransitionSequence;
        world.update(60);
        assert.equal(world.getPopulationCount(), 32);
        assert.equal(world.eraTransitionSequence, this.transformationSequenceAtThirtyTwo, "village transformation must occur once");
        assert.equal(world.villageTransformationCompleted, true);
        assert(world.getLivingInhabitants().every((person) => person.partners.every((partner) => !world.isCloseRelative(person, partner))));
        this.verifyReferences(world);
    }

    verifyReferences(world) {
        world.getLivingInhabitants().forEach((person) => {
            const memberships = world.houses.filter((house) => house.occupants.includes(person));
            assert.equal(memberships.length, person.house === null ? 0 : 1, `${person.name} has an invalid house membership`);
            if (person.house !== null) { assert.equal(memberships[0], person.house); }
        });
        world.houses.forEach((house) => assert(house.owner === null || house.owner.ownedHouse === house));
    }

    getResourceTotal(world) {
        return world.houses.reduce((total, house) => total + house.storage.wood + house.storage.water + house.storage.meat, 0) +
            world.getLivingInhabitants().reduce((total, person) => total + person.carrying.amount, 0);
    }

    getActionablePairCount(world) {
        const adults = world.getLivingInhabitants().filter((person) => person.isAdult);
        return adults.flatMap((first, index) => adults.slice(index + 1).filter((second) => world.isActionablePartnerPair(first, second))).length;
    }

    buildDiagnostic(world) {
        const people = world.getLivingInhabitants();
        const adults = people.filter((person) => person.isAdult);
        const lines = [`population=${people.length} adults=${adults.length} children=${people.length - adults.length} houses=${world.houses.length}/${world.getMaximumHouseCountForPopulation(people.length)} arrivals=${world.arrivalsUsed}/${world.maxArrivals} cooldown=${world.arrivalCooldown}`];
        const theoreticalPairs = adults.flatMap((first, index) => adults.slice(index + 1).filter((second) => world.isTheoreticallyCompatiblePair(first, second))).length;
        const actionablePairs = adults.flatMap((first, index) => adults.slice(index + 1).filter((second) => world.isActionablePartnerPair(first, second))).length;
        lines[0] += ` theoreticalPairs=${theoreticalPairs} actionablePairs=${actionablePairs}`;
        adults.forEach((adult) => lines.push(`adult ${adult.id} ${adult.name}: gender=${adult.gender} orientation=${adult.orientation} style=${adult.relationshipStyle} parents=${adult.parents.map((p) => p.id)} children=${adult.children.map((p) => p.id)} partners=${adult.partners.map((p) => p.id)} house=${adult.house?.id ?? null} owned=${adult.ownedHouse?.id ?? null} capacity=${adult.house?.capacity ?? null} state=${adult.state} carrying=${adult.carrying.type}:${adult.carrying.amount} target=${adult.partnerTarget?.id ?? adult.targetTree?.id ?? adult.targetWaterSource?.id ?? adult.targetAnimal?.id ?? null} goal=${adult.relationshipGoal} reservations=${adult.reservedForPartnership}/${adult.reservedForAutonomousPartnership}/${adult.reservedForFertility} canBuild=${world.canVillagerBuildAutonomousHouse(adult)} buildReason=${world.getAutonomousHouseBuildingIneligibilityReason(adult) ?? "eligible"} canSeek=${world.canVillagerStartAutonomousPartnerSearch(adult)} seekReason=${world.getAutonomousPartnershipIneligibilityReason(adult) ?? "eligible"} theoretical=${world.countCompatibleUnrelatedCandidates(adult)} actionable=${world.getActionablePartnerCandidates(adult).map((p) => p.id)} arrival=${world.getArrivalTargetIneligibilityReason(adult) ?? "eligible"}`));
        world.houses.forEach((house) => lines.push(`house ${house.id}: owner=${house.owner?.id ?? null} adults=${world.getLivingHouseResidents(house).filter((p) => p.isAdult).map((p) => p.id)} children=${world.getLivingHouseResidents(house).filter((p) => !p.isAdult).map((p) => p.id)} capacity=${house.capacity} storage=${JSON.stringify(house.storage)} cooldown=${house.fertilityCooldown} fertility=${house.fertilityInProgress} reason=${world.getFertilityIneligibilityReason(house) ?? "eligible"} childCapacity=${world.canAddHouseOccupant(house)} partnerCapacity=${world.canAddHouseOccupant(house)}`));
        return lines.join("\n");
    }

    nextRandom() {
        this.randomState = (1664525 * this.randomState + 1013904223) >>> 0;
        return this.randomState / 4294967296;
    }
}

new PopulationProgressionIntegrationTest().run();
