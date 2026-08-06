import assert from "node:assert/strict";
import { World } from "../js/world/World.js";
import { Tree } from "../js/entities/Tree.js";
import { WaterSource } from "../js/entities/WaterSource.js";
import { Animal } from "../js/entities/Animal.js";

class PostHousePartnershipProgressionTest {
    constructor() {
        this.originalRandom = Math.random;
        this.randomState = 987654321;
    }

    run() {
        Math.random = () => this.nextRandom();
        try {
            ["Mira", "Taro"].forEach((ownerName) => this.verifyScenario(ownerName));
            console.log("post-House partnership and arrival progression: ok");
        } finally {
            Math.random = this.originalRandom;
        }
    }

    verifyScenario(ownerName) {
        let { world, owner } = this.createPopulationFiveWorld(ownerName);
        const startingDay = world.dayNumber;
        this.advanceUntil(world, () => owner.carrying.type === "wood" && owner.carrying.amount === 3, 1600,
            `${ownerName} did not gather three wood while houseless`);
        assert.deepEqual(world.getAllowedAutonomousResourceTypes(owner), ["wood"]);
        this.advanceUntil(world, () => owner.ownedHouse !== null, 1200, `${ownerName} did not build the second House`);
        this.verifyOwnerResidence(world, owner);
        assert.equal(world.getArrivalTargetIneligibilityReason(owner), null, "ordinary work excluded the House owner from arrival need");
        this.printDiagnostic(world, owner, 0);

        world = this.reload(world);
        owner = this.findPerson(world, ownerName);
        this.verifyOwnerResidence(world, owner);

        const checkpoints = new Set([60, 300, 360]);
        let arrival = null;
        let savedWhileWaiting = false;
        let savedAfterArrival = false;
        let storageBeforePartnership = null;
        let partnershipVerified = false;
        for (let elapsed = 0; elapsed < 900 && (elapsed < 360 || owner.partners.length === 0); elapsed += 0.25) {
            world.update(0.25);
            owner = this.findPerson(world, ownerName);
            if (checkpoints.has(elapsed + 0.25)) { this.printDiagnostic(world, owner, elapsed + 0.25); }
            if (elapsed + 0.25 === 60) {
                assert.equal(world.getArrivalTargetIneligibilityReason(owner), null, "gathering or carrying hid the owner's arrival need");
            }
            if (!savedWhileWaiting && elapsed + 0.25 >= 60 && world.arrivalsUsed === 0) {
                world = this.reload(world); owner = this.findPerson(world, ownerName); savedWhileWaiting = true;
            }
            const currentArrival = world.villagers.find((person) => person !== owner && person.arrivalMarkerTimer > 0);
            if (currentArrival && arrival === null) {
                arrival = currentArrival;
                assert(world.areCharactersMutuallyCompatible(owner, arrival));
                assert.equal(arrival.state, "arriving");
                storageBeforePartnership = { ...owner.ownedHouse.storage };
                world = this.reload(world); owner = this.findPerson(world, ownerName);
                arrival = this.findPerson(world, currentArrival.name);
                savedAfterArrival = true;
            }
            if (!partnershipVerified && arrival !== null && owner.partners.includes(arrival)) {
                assert(storageBeforePartnership);
                ["wood", "water", "meat"].forEach((type) => {
                    assert(storageBeforePartnership[type] >= 3, `partnership began without three ${type}`);
                    assert.equal(owner.ownedHouse.storage[type], storageBeforePartnership[type] - 3);
                });
                partnershipVerified = true;
            }
        }

        assert(savedWhileWaiting, "the waiting-for-arrival save point was not exercised");
        assert(savedAfterArrival, "the post-arrival save point was not exercised");
        assert(arrival, "a compatible adult arrival was not generated");
        assert.notEqual(arrival.state, "arriving", "the arrival did not finish entering");
        assert(owner.partners.includes(arrival), `${ownerName} did not partner with the arrival`);
        assert(arrival.partners.includes(owner), "the partnership was not reciprocal");
        assert.equal(arrival.house, owner.ownedHouse);
        assert(owner.ownedHouse.occupants.includes(arrival));
        assert(partnershipVerified, "the autonomous partnership cost was not verified");
        assert(world.dayNumber > startingDay, "the scenario did not cross a complete day/night cycle");
        [owner, arrival].forEach((person) => {
            assert(!["insideHouse", "returningForNight", "nightWithoutHome", "arriving"].includes(person.state), `${person.name} remained frozen after night or arrival`);
            assert.equal(person.reservedForPartnership, false);
            assert.equal(person.reservedForAutonomousPartnership, false);
        });

        const arrivalsUsed = world.arrivalsUsed;
        const storageAfterPartnership = { ...owner.ownedHouse.storage };
        world = this.reload(world); owner = this.findPerson(world, ownerName); arrival = this.findPerson(world, arrival.name);
        assert.deepEqual(owner.ownedHouse.storage, storageAfterPartnership, "partnership storage was not preserved by reload");
        this.advance(world, 20);
        assert.equal(world.arrivalsUsed, arrivalsUsed, "reload created a duplicate arrival");
        assert.equal(owner.partners.filter((person) => person === arrival).length, 1, "reload duplicated the partnership");
    }

    createPopulationFiveWorld(ownerName) {
        const world = new World();
        world.initialize({ name: "Prescelto", gender: "non-binario", orientation: "pansessuale", relationshipStyle: "monogamo" });
        const site = this.findHouseSite(world);
        assert(site && world.addChosenHouseAt(site.x, site.y));
        const owner = this.findPerson(world, ownerName);
        const chosenPartner = world.villagers.find((person) => person !== owner);
        world.hero.house.storage = { wood: 30, water: 30, meat: 30 };
        assert(world.commandHeroToPartnerWith(chosenPartner));
        this.advanceUntil(world, () => world.hero.partners.includes(chosenPartner), 300, "initial partnership did not complete");
        this.createChild(world);
        world.hero.house.fertilityCooldown = 0;
        this.createChild(world);
        assert.equal(world.getPopulationCount(), 5);
        assert.equal(owner.house, null);
        assert.equal(owner.partners.length, 0);
        world.trees = Array.from({ length: 12 }, (_, index) => new Tree(520 + (index % 4) * 90, 350 + Math.floor(index / 4) * 100));
        world.waterSources = Array.from({ length: 5 }, (_, index) => new WaterSource(540 + index * 85, 620));
        world.animals = Array.from({ length: 8 }, (_, index) => new Animal("Deer", 500 + (index % 4) * 100, 540 + Math.floor(index / 4) * 70));
        [...world.trees, ...world.waterSources, ...world.animals].forEach((resource) => world.assignResourceId(resource));
        return { world, owner };
    }

    createChild(world) {
        const population = world.getPopulationCount();
        assert(world.commandFertilityAt(world.hero.house.x, world.hero.house.y));
        this.advanceUntil(world, () => world.getPopulationCount() === population + 1, 300, "Fertility did not create a Child");
    }

    verifyOwnerResidence(world, owner) {
        assert.equal(world.houses.length, 2);
        assert(owner.ownedHouse);
        assert.equal(owner.house, owner.ownedHouse);
        assert.equal(owner.ownedHouse.owner, owner);
        assert(owner.ownedHouse.occupants.includes(owner));
        assert.equal(world.isHouselessAdult(owner), false);
        assert.deepEqual(world.getAllowedAutonomousResourceTypes(owner), ["wood", "water", "meat"]);
    }

    printDiagnostic(world, owner, elapsed) {
        const house = owner.ownedHouse;
        const resourceEligibility = Object.fromEntries(["wood", "water", "meat"].map((type) => [type, world.canAutonomouslyGatherResource(owner, type)]));
        console.log(`post-House diagnostic ${owner.name} at ${elapsed}s: ${JSON.stringify({
            id: owner.id, name: owner.name, houseId: owner.house?.id ?? null, ownedHouseId: house?.id ?? null,
            occupants: house?.occupants.map((person) => person.id) ?? [], capacity: house?.capacity ?? null,
            storage: house?.storage ?? null, state: owner.state, carrying: owner.carrying,
            relationshipGoal: owner.relationshipGoal, partnerTarget: owner.partnerTarget?.id ?? null,
            partners: owner.partners.map((person) => person.id), reservations: {
                partnership: owner.reservedForPartnership, autonomousPartnership: owner.reservedForAutonomousPartnership,
                fertility: owner.reservedForFertility
            }, resourceEligibility, allowedResources: world.getAllowedAutonomousResourceTypes(owner),
            autonomousPartnerEligible: world.canVillagerStartAutonomousPartnerSearch(owner),
            autonomousPartnerReason: world.getAutonomousPartnerSearchIneligibilityReason(owner),
            compatibleCandidates: world.getLivingInhabitants().filter((person) => world.isTheoreticallyCompatiblePair(owner, person)).map((person) => person.id),
            actionableCandidates: world.getActionablePartnerCandidates(owner).map((person) => person.id),
            arrivalTargetEligible: world.getArrivalTargetIneligibilityReason(owner) === null,
            arrivalTargetReason: world.getArrivalTargetIneligibilityReason(owner), arrivalsUsed: world.arrivalsUsed,
            maxArrivals: world.maxArrivals, arrivalCooldown: world.arrivalCooldown,
            nextArrivalCheckTimer: world.nextArrivalCheckTimer
        })}`);
    }

    reload(world) {
        const before = world.serialize().world;
        const loaded = new World();
        assert(loaded.loadFromData(structuredClone({ world: before })));
        assert.equal(loaded.arrivalsUsed, before.arrivalsUsed);
        assert.equal(loaded.arrivalCooldown, before.arrivalCooldown);
        assert.equal(loaded.nextArrivalCheckTimer, before.nextArrivalCheckTimer);
        assert.equal(loaded.arrivalInProgress, before.arrivalInProgress);
        assert.deepEqual(loaded.houses.map((house) => house.storage), before.houses.map((house) => house.storage));
        return loaded;
    }

    findPerson(world, name) { return world.getLivingInhabitants().find((person) => person.name === name); }
    advance(world, seconds) { for (let elapsed = 0; elapsed < seconds; elapsed += 0.25) { world.update(0.25); } }
    advanceUntil(world, condition, ticks, message) {
        for (let tick = 0; tick < ticks && !condition(); tick += 1) { world.update(0.25); }
        assert(condition(), message);
    }
    findHouseSite(world) {
        for (let y = 352; y < world.getHeight() - 48; y += 32) {
            for (let x = 48; x < world.getWidth() - 48; x += 32) { if (world.canPlaceHouseAt(x, y)) { return { x, y }; } }
        }
        return null;
    }
    nextRandom() { this.randomState = (1664525 * this.randomState + 1013904223) >>> 0; return this.randomState / 4294967296; }
}

new PostHousePartnershipProgressionTest().run();
