import { Terrain } from "./Terrain.js";
import { Hero } from "../entities/Hero.js";
import { Villager } from "../entities/Villager.js";
import { Tree } from "../entities/Tree.js";
import { House } from "../entities/House.js";
import { WaterSource } from "../entities/WaterSource.js";
import { Animal } from "../entities/Animal.js";
import { Child } from "../entities/Child.js";

export class World {
    constructor() {
        this.tileSize = 64;
        this.terrain = new Terrain(16, 10, this.tileSize);
        this.hero = null;
        this.heroDestination = null;
        this.villagers = [];
        this.trees = [];
        this.waterSources = [];
        this.animals = [];
        this.houses = [];
        this.nextResourceAssignmentIndex = 0;
        this.lastPartnerIneligibilityReason = null;
        this.lastFertilityIneligibilityReason = null;
        this.autonomousHouseBuilder = null;
        this.nextAutonomousBuilderIndex = 0;
        this.nextAutonomousPartnerIndex = 0;
        this.nextEntityId = 1;
        this.nextHouseId = 1;
        this.nextResourceId = 1;
        this.arrivalsUsed = 0;
        this.maxArrivals = 3;
        this.arrivalCooldown = 300;
        this.nextArrivalCheckTimer = 30;
        this.arrivalCheckInterval = 30;
        this.arrivalInProgress = false;
        this.feedbackMessages = [];
        this.eventLog = [];
        this.onAutosaveNeeded = null;
        this.onEraChanged = null;
        this.worldEra = "tribe";
        this.villageUnlocked = false;
        this.villageUnlockedAtPopulation = null;
        this.eraTransitionSequence = 0;
        this.dayDuration = 300;
        this.nightReturnDuration = 20;
        this.nightDuration = 10;
        this.dayNumber = 1;
        this.timeOfDay = 0;
        this.dayPhase = "day";
        this.phaseTimer = 0;
        this.nightlyConsumptionProcessed = false;
    }

    initialize(settings = {}) {
        this.terrain.generate();
        this.heroDestination = null;
        this.hero = new Hero(settings.name || "Prescelto", 320, 384, settings);
        this.trees = [];
        this.waterSources = [];
        this.animals = [];
        this.houses = [];
        this.nextResourceAssignmentIndex = 0;
        this.lastPartnerIneligibilityReason = null;
        this.lastFertilityIneligibilityReason = null;
        this.autonomousHouseBuilder = null;
        this.nextAutonomousBuilderIndex = 0;
        this.nextAutonomousPartnerIndex = 0;
        this.nextEntityId = 1;
        this.nextHouseId = 1;
        this.nextResourceId = 1;
        this.arrivalsUsed = 0;
        this.arrivalCooldown = 300;
        this.nextArrivalCheckTimer = 30;
        this.arrivalInProgress = false;
        this.feedbackMessages = [];
        this.eventLog = [];
        this.worldEra = "tribe";
        this.villageUnlocked = false;
        this.villageUnlockedAtPopulation = null;
        this.eraTransitionSequence = 0;
        this.dayNumber = 1;
        this.timeOfDay = 0;
        this.dayPhase = "day";
        this.phaseTimer = 0;
        this.nightlyConsumptionProcessed = false;
        this.villagers = [
            new Villager({
                name: "Mira",
                x: 448,
                y: 384,
                gender: "donna",
                orientation: "bisessuale",
                relationshipStyle: "monogamo",
                age: 26,
                spriteKey: "villager_female_01"
            }),
            new Villager({
                name: "Taro",
                x: 384,
                y: 480,
                gender: "uomo",
                orientation: "pansessuale",
                relationshipStyle: "poliamoroso",
                age: 29,
                spriteKey: "villager_male_01"
            })
        ];
        this.assignEntityId(this.hero);
        this.villagers.forEach((villager) => {
            this.assignEntityId(villager);
            villager.idleTimer = this.getRandomVillagerIdleTime();
        });
    }

    update(delta) {
        this.updateDayNightCycle(delta);
        if (this.dayPhase !== "day") {
            this.updateFertilityEvents(delta);
            this.updateNightSensitiveOperations(delta);
            this.updateNightReturns(delta);
            this.updateResourceFeedback(delta);
            this.updatePartnerFeedback(delta);
            this.updateFeedbackMessages(delta);
            return;
        }
        this.checkEraProgression();
        this.unlockHeroAutonomyIfEligible();
        this.updateHero(delta);
        this.updateFertilityEvents(delta);
        this.updateChildren(delta);
        this.updateAutonomousHouseBuilding(delta);
        this.updateAutonomousPartnerSearch(delta);
        this.assignVillagersToResources();
        this.assignAutonomousHeroToResource();
        this.updateResourceFeedback(delta);
        this.updatePartnerFeedback(delta);
        this.updateFeedbackMessages(delta);
        this.updateAdultArrivals(delta);

        this.villagers.forEach((villager) => {
            this.updateVillager(villager, delta);
        });
    }

    updateDayNightCycle(delta) {
        this.phaseTimer += delta;
        this.timeOfDay = this.dayPhase === "day" ? this.phaseTimer : this.dayDuration;
        if (this.dayPhase === "day" && this.phaseTimer >= this.dayDuration) { this.beginNightApproach(); return; }
        if (this.dayPhase === "nightApproaching" && (this.areAllResidentsHome() || this.phaseTimer >= this.nightReturnDuration)) { this.beginNight(); return; }
        if (this.dayPhase === "night" && this.phaseTimer >= this.nightDuration) { this.beginNewDay(); }
    }

    beginNightApproach() {
        this.dayPhase = "nightApproaching";
        this.phaseTimer = 0;
        this.nightlyConsumptionProcessed = false;
        this.addEvent("La notte si avvicina.");
        this.feedbackMessages.push({ text: "Gli abitanti stanno tornando a casa.", timer: 5 });
        this.prepareResidentsForNight();
    }

    prepareResidentsForNight() {
        this.houses.filter((house) => house.fertilityInProgress && house.fertilityPhase !== "private").forEach((house) => this.cancelFertilityEvent(house));
        this.villagers.filter((person) => person.relationshipGoal === "FindPartner" && person.state !== "socializing").forEach((person) => this.cancelAutonomousPartnerSearch(person, person.partnerTarget));
        if (this.hero.partnerTarget !== null && this.hero.state !== "socializing") { this.clearHeroPartnerProposal(); }
        if (this.autonomousHouseBuilder !== null && this.autonomousHouseBuilder.state !== "buildingHouse") {
            this.cancelAutonomousHouseBuild(this.autonomousHouseBuilder);
        }
        this.getLivingInhabitants().forEach((person) => {
            if (person.state === "insideHouse" && person.reservedForFertility) { return; }
            if (person.state === "socializing") { return; }
            this.clearPersonResourceWork(person);
            person.autonomousAction = false;
            person.destination = null;
            if (person === this.hero) { this.heroDestination = null; }
            person.state = this.isValidResidence(person) ? "returningForNight" : "nightWithoutHome";
        });
        const houseless = this.getLivingInhabitants().filter((person) => !this.isValidResidence(person)).length;
        if (houseless > 0) { this.addEvent(`${houseless} abitanti non hanno una casa per la notte.`); }
    }

    updateNightReturns(delta) {
        if (this.dayPhase === "night") { return; }
        this.getLivingInhabitants().forEach((person) => {
            if (!this.isValidResidence(person)) { person.state = "nightWithoutHome"; return; }
            if (person.state === "insideHouse" || person.state === "socializing") { return; }
            const entrance = this.getHouseEntrance(person.house);
            const distance = Math.hypot(entrance.x - person.x, entrance.y - person.y);
            if (distance <= 3) { person.x = entrance.x; person.y = entrance.y; person.state = "insideHouse"; return; }
            const step = Math.min(person.speed * delta, distance);
            person.x += ((entrance.x - person.x) / distance) * step;
            person.y += ((entrance.y - person.y) / distance) * step;
            person.state = "returningForNight";
        });
    }

    updateNightSensitiveOperations(delta) {
        if (this.dayPhase !== "nightApproaching") { return; }
        if (this.autonomousHouseBuilder !== null && this.autonomousHouseBuilder.state === "buildingHouse") { this.updateAutonomousHouseBuilder(delta); }
        this.villagers.filter((person) => person.relationshipGoal === "FindPartner" && person.state === "socializing").forEach((person) => this.updateAutonomousPartnerSeeker(person, delta));
        if (this.hero.partnerTarget !== null && this.hero.state === "socializing") { this.updateHeroPartnerProposal(delta); }
    }

    beginNight() {
        if (this.dayPhase !== "nightApproaching") { return; }
        this.getLivingInhabitants().forEach((person) => {
            if (!this.isValidResidence(person)) { person.state = "nightWithoutHome"; return; }
            const entrance = this.getHouseEntrance(person.house);
            person.x = entrance.x; person.y = entrance.y; person.state = "insideHouse";
        });
        this.dayPhase = "night";
        this.phaseTimer = 0;
        this.processNightlyConsumption();
    }

    processNightlyConsumption() {
        if (this.nightlyConsumptionProcessed) { return; }
        let occupied = 0;
        let shortages = 0;
        this.houses.forEach((house) => {
            const residents = this.getLivingHouseResidents(house);
            if (residents.length === 0) { return; }
            occupied += 1;
            const required = { wood: 3, water: residents.length * 2, food: residents.length * 3 };
            const consumed = {
                wood: Math.min(Math.max(0, house.storage.wood || 0), required.wood),
                water: Math.min(Math.max(0, house.storage.water || 0), required.water),
                food: house.consumeFood(required.food)
            };
            house.storage.wood = Math.max(0, (house.storage.wood || 0) - consumed.wood);
            house.storage.water = Math.max(0, (house.storage.water || 0) - consumed.water);
            const missing = { wood: required.wood - consumed.wood, water: required.water - consumed.water, food: required.food - consumed.food };
            const wasFullySupplied = Object.values(missing).every((amount) => amount === 0);
            house.lastNightResult = { dayNumber: this.dayNumber, occupants: residents.length, required, consumed, missing, wasFullySupplied };
            if (!wasFullySupplied) { shortages += 1; this.addEvent(`${this.getHouseName(house)} non aveva abbastanza ${this.formatMissingResources(missing)}.`); }
        });
        this.nightlyConsumptionProcessed = true;
        if (occupied > 0) { this.addEvent(shortages === 0 ? "Il villaggio ha superato la notte." : "Alcune famiglie hanno affrontato una notte difficile."); }
        this.requestAutosave();
    }

    beginNewDay() {
        this.dayNumber += 1;
        this.dayPhase = "day";
        this.phaseTimer = 0;
        this.timeOfDay = 0;
        this.nightlyConsumptionProcessed = false;
        this.getLivingInhabitants().forEach((person) => {
            if (person.state === "insideHouse" || person.state === "nightWithoutHome" || person.state === "returningForNight") {
                person.state = "idle"; person.destination = null; person.idleTimer = this.getRandomVillagerIdleTime();
            }
        });
        this.requestAutosave();
    }

    getLivingInhabitants() { return this.getEntities().filter((person) => person !== null && person.alive); }
    isValidResidence(person) { return person.house !== null && this.houses.includes(person.house) && person.house.occupants.includes(person); }
    areAllResidentsHome() { return this.getLivingInhabitants().filter((person) => this.isValidResidence(person)).every((person) => person.state === "insideHouse"); }
    getLivingHouseResidents(house) { return [...new Set(house.occupants)].filter((person) => person && person.alive && person.house === house); }
    getTimeUntilNight() { return this.dayPhase === "day" ? Math.max(0, this.dayDuration - this.phaseTimer) : 0; }
    getDayPhaseLabel() { return { day: "Giorno", nightApproaching: "La notte si avvicina", night: "Notte" }[this.dayPhase]; }
    getHouseName(house) { const names = this.getLivingHouseResidents(house).filter((person) => person.isAdult).map((person) => person.name); return names.length > 0 ? `Casa di ${names.join(" e ")}` : "Casa"; }
    formatMissingResources(missing) { const labels = []; if (missing.wood > 0) { labels.push("legna"); } if (missing.water > 0) { labels.push("acqua"); } if (missing.food > 0) { labels.push("cibo"); } return labels.length <= 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`; }
    addEvent(text) { this.eventLog.push(text); this.eventLog = this.eventLog.slice(-20); }

    updateAutonomousHouseBuilding(delta) {
        if (this.autonomousHouseBuilder !== null) {
            this.updateAutonomousHouseBuilder(delta);
            return;
        }

        if (!this.hasChosenHouse() || this.houses.length >= this.getMaximumHouseCountForPopulation(this.getPopulationCount())) {
            return;
        }

        const builder = this.getNextAutonomousHouseBuilder();

        if (builder === null) {
            return;
        }

        this.reserveAutonomousHouseBuilder(builder);
    }

    getMaximumHouseCountForPopulation(population) {
        const thresholds = [
            { population: 32, houses: 10 },
            { population: 28, houses: 9 },
            { population: 24, houses: 8 },
            { population: 19, houses: 7 },
            { population: 16, houses: 6 },
            { population: 13, houses: 5 },
            { population: 9, houses: 4 },
            { population: 7, houses: 3 },
            { population: 5, houses: 2 }
        ];

        const threshold = thresholds.find((candidate) => population >= candidate.population);

        return threshold === undefined ? 1 : threshold.houses;
    }

    getNextAutonomousHouseBuilder() {
        const candidates = this.villagers.filter((villager) => this.canVillagerBuildAutonomousHouse(villager));

        if (candidates.length === 0) {
            return null;
        }

        const builder = candidates[this.nextAutonomousBuilderIndex % candidates.length];
        this.nextAutonomousBuilderIndex = (this.nextAutonomousBuilderIndex + 1) % Math.max(1, this.villagers.length);

        return builder;
    }

    canVillagerBuildAutonomousHouse(villager) {
        return this.villagers.includes(villager) &&
            villager !== this.hero &&
            villager.alive &&
            villager.isAdult &&
            this.getAvailableBuilderWood(villager) >= 3 &&
            villager.ownedHouse === null &&
            (villager.house === null || this.isAdultChildLivingWithParents(villager)) &&
            !this.hero.partners.includes(villager) &&
            !villager.reservedForFertility &&
            !villager.reservedForPartnership &&
            villager.state !== "insideHouse" &&
            !this.isVillagerBuildingHouse(villager) &&
            villager.targetTree === null &&
            villager.targetWaterSource === null &&
            villager.targetAnimal === null;
    }

    getAvailableBuilderWood(builder) {
        // Transitional fallback remains only for unhoused autonomous builders.
        return builder.house === null ? builder.wood : builder.house.storage.wood;
    }

    reserveAutonomousHouseBuilder(builder) {
        const site = this.findCompactHouseSite(builder);

        if (site === null) {
            builder.state = "idle";
            builder.idleTimer = this.getRandomVillagerIdleTime();
            return;
        }

        this.clearVillagerAllWork(builder);
        this.autonomousHouseBuilder = builder;
        builder.houseSite = site;
        builder.houseBuildTimer = 0;
        builder.destination = null;
        builder.state = "walkingToHouseSite";
    }

    updateAutonomousHouseBuilder(delta) {
        const builder = this.autonomousHouseBuilder;

        if (!this.canContinueAutonomousHouseBuild(builder)) {
            this.cancelAutonomousHouseBuild(builder);
            return;
        }

        if (builder.state === "walkingToHouseSite") {
            this.moveBuilderToHouseSite(builder, delta);
            return;
        }

        if (builder.state === "buildingHouse") {
            builder.houseBuildTimer += delta;

            if (builder.houseBuildTimer >= 3) {
                this.completeAutonomousHouseBuild(builder);
            }
        }
    }

    canContinueAutonomousHouseBuild(builder) {
        return builder !== null &&
            builder.alive &&
            builder.isAdult &&
            this.getAvailableBuilderWood(builder) >= 3 &&
            builder.ownedHouse === null &&
            (builder.house === null || this.isAdultChildLivingWithParents(builder)) &&
            !this.hero.partners.includes(builder) &&
            builder.houseSite !== null &&
            this.houses.length < this.getMaximumHouseCountForPopulation(this.getPopulationCount()) &&
            this.isValidCompactHouseSite(builder.houseSite.x, builder.houseSite.y, builder);
    }

    moveBuilderToHouseSite(builder, delta) {
        const site = builder.houseSite;
        const distanceX = site.x - builder.x;
        const distanceY = site.y - builder.y;
        const distance = Math.hypot(distanceX, distanceY);
        const stopDistance = builder.radius + 34;
        const step = Math.min(builder.speed * delta, Math.max(0, distance - stopDistance));

        if (distance <= stopDistance + 0.5 || step === 0) {
            builder.state = "buildingHouse";
            builder.houseBuildTimer = 0;
            return;
        }

        builder.x += (distanceX / distance) * step;
        builder.y += (distanceY / distance) * step;
    }

    completeAutonomousHouseBuild(builder) {
        if (!this.canContinueAutonomousHouseBuild(builder)) {
            this.cancelAutonomousHouseBuild(builder);
            return;
        }

        const previousHouse = builder.house;
        const house = new House(builder.houseSite.x, builder.houseSite.y, builder);
        this.assignHouseId(house);
        this.houses.push(house);
        if (previousHouse !== null) { previousHouse.storage.wood -= 3; } else { builder.wood -= 3; }
        if (previousHouse !== null) {
            previousHouse.occupants = previousHouse.occupants.filter((occupant) => occupant !== builder);
        }
        builder.house = house;
        builder.ownedHouse = house;
        this.releaseAutonomousHouseBuilder(builder);
        this.requestAutosave();
    }

    cancelAutonomousHouseBuild(builder) {
        if (builder !== null) {
            this.releaseAutonomousHouseBuilder(builder);
        }
    }

    releaseAutonomousHouseBuilder(builder) {
        builder.houseSite = null;
        builder.houseBuildTimer = 0;
        builder.destination = null;
        builder.idleTimer = this.getRandomVillagerIdleTime();
        builder.state = "idle";
        this.autonomousHouseBuilder = null;
    }

    isVillagerBuildingHouse(villager) {
        return villager.state === "seekingHouseSite" || villager.state === "walkingToHouseSite" || villager.state === "buildingHouse";
    }

    isAdultChildLivingWithParents(villager) {
        return villager.isAdult &&
            villager.parents.length > 0 &&
            villager.house !== null &&
            villager.ownedHouse === null &&
            villager.parents.some((parent) => villager.house.owner === parent || villager.house.occupants.includes(parent));
    }

    updateAutonomousPartnerSearch(delta) {
        this.villagers.forEach((villager) => {
            if (villager.relationshipGoal === "FindPartner") {
                this.updateAutonomousPartnerSeeker(villager, delta);
            }
        });

        const owner = this.getNextAutonomousPartnerOwner();

        if (owner !== null) {
            this.startAutonomousPartnerSearch(owner);
        }
    }

    getNextAutonomousPartnerOwner() {
        const candidates = this.villagers.filter((villager) => this.canVillagerStartAutonomousPartnerSearch(villager));

        if (candidates.length === 0) {
            return null;
        }

        const owner = candidates[this.nextAutonomousPartnerIndex % candidates.length];
        this.nextAutonomousPartnerIndex = (this.nextAutonomousPartnerIndex + 1) % Math.max(1, this.villagers.length);

        return owner;
    }

    canVillagerStartAutonomousPartnerSearch(villager) {
        return this.villagers.includes(villager) &&
            villager !== this.hero &&
            villager.alive &&
            villager.isAdult &&
            villager.ownedHouse !== null &&
            villager.ownedHouse.owner === villager &&
            villager.house === villager.ownedHouse &&
            this.hasAutonomousPartnerCapacity(villager) &&
            this.hasPartnershipResources(villager) &&
            !villager.reservedForFertility &&
            !villager.reservedForPartnership &&
            !villager.reservedForAutonomousPartnership &&
            villager.relationshipGoal !== "FindPartner" &&
            villager.state !== "insideHouse" &&
            !this.isVillagerBuildingHouse(villager) &&
            villager.targetTree === null &&
            villager.targetWaterSource === null &&
            villager.targetAnimal === null;
    }

    hasAutonomousPartnerCapacity(villager) {
        if (villager.partners.length === 0) {
            return true;
        }

        return false;
    }

    hasPartnershipResources(villager) {
        const storage = villager.house === null ? null : villager.house.storage;
        return storage !== null && storage.wood >= 3 && storage.water >= 3 && storage.meat >= 3;
    }

    startAutonomousPartnerSearch(owner) {
        const candidates = this.villagers.filter((candidate) => this.isEligibleAutonomousPartner(owner, candidate));

        if (candidates.length === 0) {
            return false;
        }

        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        this.clearVillagerAllWork(owner);
        this.clearVillagerAllWork(candidate);
        owner.relationshipGoal = "FindPartner";
        owner.partnerTarget = candidate;
        owner.socialTimer = 0;
        owner.reservedForAutonomousPartnership = true;
        owner.reservedForPartnership = true;
        owner.state = "seekingPartner";
        candidate.reservedForAutonomousPartnership = true;
        candidate.reservedForPartnership = true;
        candidate.destination = null;
        candidate.state = "awaitingPartner";

        return true;
    }

    updateAutonomousPartnerSeeker(owner, delta) {
        const candidate = owner.partnerTarget;

        if (!this.canContinueAutonomousPartnerSearch(owner, candidate)) {
            this.cancelAutonomousPartnerSearch(owner, candidate);
            return;
        }

        const stopDistance = owner.radius + candidate.radius + 4;
        const distanceX = candidate.x - owner.x;
        const distanceY = candidate.y - owner.y;
        const distance = Math.hypot(distanceX, distanceY);

        if (distance > stopDistance + 0.5) {
            owner.state = "seekingPartner";
            candidate.state = "awaitingPartner";

            const step = Math.min(owner.speed * delta, distance - stopDistance);
            owner.x += (distanceX / distance) * step;
            owner.y += (distanceY / distance) * step;
            return;
        }

        owner.state = "socializing";
        candidate.state = "socializing";
        owner.socialTimer += delta;

        if (owner.socialTimer >= 2) {
            this.completeAutonomousPartnership(owner, candidate);
        }
    }

    canContinueAutonomousPartnerSearch(owner, candidate) {
        return this.canVillagerStartAutonomousPartnerSearchDuringReservation(owner) &&
            this.isEligibleAutonomousPartnerDuringReservation(owner, candidate);
    }

    canVillagerStartAutonomousPartnerSearchDuringReservation(villager) {
        return this.villagers.includes(villager) &&
            villager !== this.hero &&
            villager.alive &&
            villager.isAdult &&
            villager.ownedHouse !== null &&
            this.houses.includes(villager.ownedHouse) &&
            villager.ownedHouse.owner === villager &&
            villager.house === villager.ownedHouse &&
            this.hasAutonomousPartnerCapacity(villager) &&
            this.hasPartnershipResources(villager) &&
            !villager.reservedForFertility &&
            villager.relationshipGoal === "FindPartner" &&
            villager.partnerTarget !== null &&
            villager.reservedForAutonomousPartnership &&
            villager.reservedForPartnership &&
            !this.isVillagerBuildingHouse(villager);
    }

    completeAutonomousPartnership(owner, candidate) {
        if (!this.canContinueAutonomousPartnerSearch(owner, candidate)) {
            this.cancelAutonomousPartnerSearch(owner, candidate);
            return false;
        }

        owner.house.storage.wood -= 3;
        owner.house.storage.water -= 3;
        owner.house.storage.meat -= 3;
        owner.partners.push(candidate);
        candidate.partners.push(owner);
        candidate.house = owner.ownedHouse;

        if (!owner.ownedHouse.occupants.includes(candidate)) {
            owner.ownedHouse.occupants.push(candidate);
        }

        owner.partnerFeedbackTimer = 1.5;
        candidate.partnerFeedbackTimer = 1.5;
        this.cancelAutonomousPartnerSearch(owner, candidate);
        this.requestAutosave();

        return true;
    }

    cancelAutonomousPartnerSearch(owner, candidate) {
        [owner, candidate].forEach((person) => {
            if (person === null || person === undefined) {
                return;
            }

            person.relationshipGoal = null;
            person.partnerTarget = null;
            person.socialTimer = 0;
            person.reservedForAutonomousPartnership = false;
            person.reservedForPartnership = false;
            person.destination = null;
            person.idleTimer = this.getRandomVillagerIdleTime();
            person.state = "idle";
        });
    }

    isEligibleAutonomousPartner(owner, candidate) {
        if (!this.villagers.includes(candidate) || candidate === owner || candidate === this.hero || !candidate.alive || !candidate.isAdult) {
            return false;
        }

        return candidate.ownedHouse === null &&
            candidate.house === null &&
            !candidate.reservedForFertility &&
            !candidate.reservedForPartnership &&
            !candidate.reservedForAutonomousPartnership &&
            candidate.state !== "insideHouse" &&
            !this.isVillagerBuildingHouse(candidate) &&
            candidate.partners.length === 0 &&
            !owner.partners.includes(candidate) &&
            !candidate.partners.includes(owner) &&
            !this.isCloseRelative(owner, candidate) &&
            this.areCharactersMutuallyCompatible(owner, candidate);
    }

    isEligibleAutonomousPartnerDuringReservation(owner, candidate) {
        if (!this.villagers.includes(candidate) || candidate === owner || candidate === this.hero || !candidate.alive || !candidate.isAdult) {
            return false;
        }

        return candidate.ownedHouse === null &&
            candidate.house === null &&
            !candidate.reservedForFertility &&
            candidate.reservedForPartnership &&
            candidate.reservedForAutonomousPartnership &&
            candidate.relationshipGoal === null &&
            candidate.partnerTarget === null &&
            (candidate.state === "awaitingPartner" || candidate.state === "socializing") &&
            !this.isVillagerBuildingHouse(candidate) &&
            candidate.partners.length === 0 &&
            !owner.partners.includes(candidate) &&
            !candidate.partners.includes(owner) &&
            !this.isCloseRelative(owner, candidate) &&
            this.areCharactersMutuallyCompatible(owner, candidate);
    }

    findAutonomousHouseSite(builder) { return this.findCompactHouseSite(builder); }

    findCompactHouseSite(builder) {
        if (this.getSettlementCenterHouse() === null) { return null; }
        return this.searchCompactHouseSiteInBand(builder, 140, 220, 30) ||
            this.searchCompactHouseSiteInBand(builder, 220, 320, 30) ||
            this.searchCompactHouseSiteInBand(builder, 320, 420, 40);
    }

    getSettlementCenterHouse() {
        return this.hero === null ? null : this.hero.ownedHouse;
    }

    searchCompactHouseSiteInBand(builder, minDistance, maxDistance, attempts) {
        const center = this.getSettlementCenterHouse();
        if (center === null) { return null; }
        for (let attempt = 0; attempt < attempts; attempt += 1) {
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);
            const site = { x: center.x + Math.cos(angle) * distance, y: center.y + Math.sin(angle) * distance };
            if (this.isValidCompactHouseSite(site.x, site.y, builder)) { return site; }
        }
        return null;
    }

    isValidCompactHouseSite(x, y, builder) {
        const distance = this.getDistanceFromSettlementCenter(x, y);
        return distance !== null && distance <= 420 && this.canPlaceAutonomousHouseAt(x, y, builder);
    }

    getDistanceFromSettlementCenter(x, y) {
        const center = this.getSettlementCenterHouse();
        return center === null ? null : Math.hypot(center.x - x, center.y - y);
    }

    getRandomGrassHouseSite() {
        const margin = 48;
        return {
            x: margin + Math.random() * (this.getWidth() - margin * 2),
            y: this.tileSize * 5 + margin + Math.random() * (this.getHeight() - this.tileSize * 5 - margin * 2)
        };
    }

    canPlaceAutonomousHouseAt(x, y, builder) {
        const house = new House(x, y, builder);

        return x - house.radius >= 0 && y - house.radius >= 0 &&
            x + house.radius <= this.getWidth() && y + house.radius <= this.getHeight() &&
            this.terrain.isGrassAtWorldPosition(x, y) &&
            this.houses.every((existingHouse) => Math.hypot(existingHouse.x - x, existingHouse.y - y) >= 120) &&
            !this.overlapsAnyTree(house) &&
            !this.overlapsAnyWaterSource(house) &&
            !this.overlapsAnyAnimal(house) &&
            !this.overlapsEntity(house, this.hero) &&
            !this.villagers.some((villager) => villager !== builder && this.overlapsEntity(house, villager));
    }

    getChosenHouse() {
        return this.hero === null ? null : this.hero.ownedHouse;
    }

    getHouseResourceTotals(house) {
        if (house === null) {
            return { wood: 0, water: 0, meat: 0, occupants: 0 };
        }

        const livingOccupants = house.occupants.filter((occupant) => occupant.alive && occupant.house === house);

        return { ...house.storage, occupants: livingOccupants.length };
    }

    getHouseHudSummary(house) {
        const totals = this.getHouseResourceTotals(house);
        const cost = { wood: house === null || totals.occupants === 0 ? 0 : 3, water: totals.occupants * 2, food: totals.occupants * 3 };
        let phaseText = "La notte è in corso";
        if (this.dayPhase === "day") {
            const seconds = Math.ceil(this.getTimeUntilNight());
            phaseText = `Notte tra: ${Math.floor(seconds / 60)} min ${seconds % 60} sec`;
        } else if (this.dayPhase === "nightApproaching") {
            phaseText = "Gli abitanti stanno tornando a casa";
        }
        return { title: house === null ? "Nessuna casa" : this.getHouseName(house), totals, cost, phaseText, lastNightText: this.getLastNightText(house) };
    }

    getLastNightText(house) {
        const result = house?.lastNightResult;
        if (result === null || result === undefined) { return "Ultima notte: nessun dato"; }
        if (result.wasFullySupplied) { return "Ultima notte: tutto disponibile"; }
        const missing = [];
        if (result.missing.wood > 0) { missing.push(`${result.missing.wood} legna`); }
        if (result.missing.water > 0) { missing.push(`${result.missing.water} acqua`); }
        if (result.missing.food > 0) { missing.push(`${result.missing.food} cibo`); }
        return `Ultima notte: mancavano ${missing.join(" e ")}`;
    }

    updateHero(delta) {
        if (this.hero.reservedForFertility) {
            return;
        }

        if (this.hero.partnerTarget !== null) {
            this.updateHeroPartnerProposal(delta);
            return;
        }

        if (this.updateReturnHome(this.hero, delta)) {
            return;
        }

        if (this.hero.targetTree !== null) {
            this.updateHeroTreeWorker(delta);
            return;
        }

        if (this.hero.targetWaterSource !== null) {
            this.updateHeroWaterWorker(delta);
            return;
        }

        if (this.hero.targetAnimal !== null) {
            this.updateHeroAnimalWorker(delta);
            return;
        }

        if (this.heroDestination === null) {
            if (!this.startHeroAutonomousWander()) {
                this.hero.state = "idle";
            }
            return;
        }

        this.hero.state = "walking";
        this.moveHeroTowardDestination(delta);
    }

    moveHeroTowardDestination(delta) {
        const distanceX = this.heroDestination.x - this.hero.x;
        const distanceY = this.heroDestination.y - this.hero.y;
        const distance = Math.hypot(distanceX, distanceY);
        const step = this.hero.speed * delta;

        if (distance <= step) {
            this.hero.x = this.heroDestination.x;
            this.hero.y = this.heroDestination.y;
            this.heroDestination = null;
            this.hero.state = "idle";
            return;
        }

        this.hero.x += (distanceX / distance) * step;
        this.hero.y += (distanceY / distance) * step;
    }

    updateHeroTreeWorker(delta) {
        const tree = this.hero.targetTree;

        if (!this.trees.includes(tree)) {
            this.clearHeroTreeWork();
            return;
        }

        const stopDistance = this.hero.radius + tree.radius + 4;
        const distanceX = tree.x - this.hero.x;
        const distanceY = tree.y - this.hero.y;
        const distance = Math.hypot(distanceX, distanceY);

        if (distance > stopDistance + 0.5) {
            this.hero.state = "walking";
            this.heroDestination = null;

            const step = Math.min(this.hero.speed * delta, distance - stopDistance);
            this.hero.x += (distanceX / distance) * step;
            this.hero.y += (distanceY / distance) * step;
            return;
        }

        this.hero.state = "cuttingTree";
        tree.isBeingCut = true;
        this.hero.actionTimer += delta;

        if (this.hero.actionTimer >= 1 && this.trees.includes(tree)) {
            this.hero.actionTimer = 0;
            this.cutTree(this.hero, tree);
        }
    }

    updateVillager(villager, delta) {
        if (!villager.isAdult || villager.reservedForPartnership || villager.reservedForFertility || villager.state === "insideHouse" || this.isVillagerBuildingHouse(villager)) {
            return;
        }

        if (this.updateReturnHome(villager, delta)) {
            return;
        }

        if (villager.targetTree !== null) {
            this.updateTreeWorker(villager, delta);
            return;
        }

        if (villager.targetWaterSource !== null) {
            this.updateWaterWorker(villager, delta);
            return;
        }

        if (villager.targetAnimal !== null) {
            this.updateAnimalWorker(villager, delta);
            return;
        }

        if (villager.destination === null) {
            villager.state = "idle";
            villager.idleTimer -= delta;

            if (villager.idleTimer <= 0) {
                villager.destination = this.terrain.getRandomWalkableWorldPosition();
                villager.state = "walking";
            }

            return;
        }

        villager.state = "walking";
        const distanceX = villager.destination.x - villager.x;
        const distanceY = villager.destination.y - villager.y;
        const distance = Math.hypot(distanceX, distanceY);
        const step = villager.speed * delta;

        if (distance <= step) {
            villager.x = villager.destination.x;
            villager.y = villager.destination.y;
            villager.destination = null;
            villager.idleTimer = this.getRandomVillagerIdleTime();
            villager.state = "idle";
            return;
        }

        villager.x += (distanceX / distance) * step;
        villager.y += (distanceY / distance) * step;
    }

    updateTreeWorker(villager, delta) {
        const tree = villager.targetTree;

        if (!this.trees.includes(tree)) {
            this.clearVillagerTreeWork(villager);
            return;
        }

        const stopDistance = villager.radius + tree.radius + 4;
        const distanceX = tree.x - villager.x;
        const distanceY = tree.y - villager.y;
        const distance = Math.hypot(distanceX, distanceY);

        if (distance > stopDistance + 0.5) {
            villager.state = "walking";
            villager.destination = null;

            const step = Math.min(villager.speed * delta, distance - stopDistance);
            villager.x += (distanceX / distance) * step;
            villager.y += (distanceY / distance) * step;
            return;
        }

        villager.state = "cuttingTree";
        tree.isBeingCut = true;
        villager.actionTimer += delta;

        if (villager.actionTimer >= 1 && this.trees.includes(tree)) {
            villager.actionTimer = 0;
            this.cutTree(villager, tree);
        }
    }

    cutTree(worker, tree) {
        tree.woodRemaining -= 1;
        tree.cutFeedbackTimer = 0.2;
        this.addCarriedResource(worker, "wood");

        if (tree.woodRemaining <= 0) {
            this.removeTree(tree);
        }

        this.clearTreeWork(worker);
    }

    updateHeroWaterWorker(delta) {
        this.updateResourceWorker(this.hero, this.hero.targetWaterSource, this.waterSources, "collectingWater", "useWaterSource", "clearHeroWaterWork", delta);
    }

    updateHeroAnimalWorker(delta) {
        this.updateResourceWorker(this.hero, this.hero.targetAnimal, this.animals, "huntingAnimal", "huntAnimal", "clearHeroAnimalWork", delta);
    }

    updateWaterWorker(villager, delta) {
        this.updateResourceWorker(villager, villager.targetWaterSource, this.waterSources, "collectingWater", "useWaterSource", "clearVillagerWaterWork", delta);
    }

    updateAnimalWorker(villager, delta) {
        this.updateResourceWorker(villager, villager.targetAnimal, this.animals, "huntingAnimal", "huntAnimal", "clearVillagerAnimalWork", delta);
    }

    updateResourceWorker(worker, resource, collection, workState, completeMethod, clearMethod, delta = 0) {
        if (!collection.includes(resource)) {
            this[clearMethod](worker);
            return;
        }

        const stopDistance = worker.radius + resource.radius + 4;
        const distanceX = resource.x - worker.x;
        const distanceY = resource.y - worker.y;
        const distance = Math.hypot(distanceX, distanceY);

        if (distance > stopDistance + 0.5) {
            worker.state = "walking";
            worker.destination = null;
            if (worker === this.hero) { this.heroDestination = null; }
            const step = Math.min(worker.speed * delta, distance - stopDistance);
            worker.x += (distanceX / distance) * step;
            worker.y += (distanceY / distance) * step;
            return;
        }

        worker.state = workState;
        if (resource instanceof WaterSource) { resource.isBeingUsed = true; }
        if (resource instanceof Animal) { resource.isBeingHunted = true; }
        worker.actionTimer += delta;

        if (worker.actionTimer >= 1 && collection.includes(resource)) {
            worker.actionTimer = 0;
            this[completeMethod](worker, resource);
        }
    }

    useWaterSource(worker, source) {
        source.waterRemaining -= 1;
        source.useFeedbackTimer = 0.2;
        this.addCarriedResource(worker, "water");
        if (source.waterRemaining <= 0) { this.removeWaterSource(source); }
        this.clearWaterWork(worker);
    }

    huntAnimal(worker, animal) {
        animal.meatRemaining -= 1;
        animal.hitFeedbackTimer = 0.2;
        this.addCarriedResource(worker, "meat");
        if (animal.meatRemaining <= 0) { this.removeAnimal(animal); }
        this.clearAnimalWork(worker);
    }

    clearTreeWork(worker) {
        if (worker === this.hero) {
            this.clearHeroTreeWork();
            return;
        }

        this.clearVillagerTreeWork(worker);
    }

    addCarriedResource(worker, type) {
        // Transitional exception: the first chosen House is built before a
        // household exists, so only that build continues to use personal wood.
        if (worker === this.hero && worker.house === null) { worker[type] += 1; return; }
        if (worker.carrying.type !== null && worker.carrying.type !== type) { return; }
        worker.carrying.type = type;
        worker.carrying.amount = Math.min(worker.carryingCapacity, worker.carrying.amount + 1);
    }

    canDepositAtHome(person) {
        const house = person === null ? null : person.house;
        const storage = house === null ? null : house.storage;

        return house !== null &&
            this.houses.includes(house) &&
            Array.isArray(house.occupants) &&
            house.occupants.includes(person) &&
            storage !== null &&
            typeof storage === "object" &&
            ["wood", "water", "meat"].every((type) => Number.isFinite(storage[type]));
    }

    shouldReturnHome(person) {
        const alreadyReturning = person.state === "returningHome" || person.state === "depositingResources";
        return this.canDepositAtHome(person) &&
            (alreadyReturning || person.carrying.amount >= person.carryingCapacity);
    }

    normalizeInvalidHomeState(person) {
        const returning = person.state === "returningHome" || person.state === "depositingResources";

        if (!returning || this.canDepositAtHome(person)) {
            return false;
        }

        person.state = "idle";
        person.destination = null;
        person.depositTimer = 0;
        if (person === this.hero) { this.heroDestination = null; }
        return true;
    }

    updateReturnHome(person, delta) {
        this.normalizeInvalidHomeState(person);
        if (person === this.hero && this.heroDestination !== null && !person.autonomousAction) { return false; }
        if (!this.shouldReturnHome(person)) { return false; }
        if (person.state !== "depositingResources") {
            this.clearPersonResourceWork(person);
            const entrance = this.getHouseEntrance(person.house);
            const distance = Math.hypot(entrance.x - person.x, entrance.y - person.y);
            if (distance > 2) {
                person.state = "returningHome";
                const step = Math.min(person.speed * delta, distance);
                person.x += ((entrance.x - person.x) / distance) * step;
                person.y += ((entrance.y - person.y) / distance) * step;
                return true;
            }
            person.state = "depositingResources"; person.depositTimer = 0;
        }
        person.depositTimer += delta;
        if (person.depositTimer >= 0.75) {
            const { type, amount } = person.carrying;
            if (type !== null && Object.hasOwn(person.house.storage, type)) {
                person.house.storage[type] += amount;
                person.house.depositFeedback = { type, amount, timer: 1.25 };
            }
            person.carrying = { type: null, amount: 0 };
            person.depositTimer = 0; person.state = "idle";
            person.idleTimer = this.getRandomVillagerIdleTime();
            this.requestAutosave();
        }
        return true;
    }

    clearPersonResourceWork(person) {
        if (person.targetTree !== null) { this.clearTreeWork(person); }
        if (person.targetWaterSource !== null) { this.clearWaterWork(person); }
        if (person.targetAnimal !== null) { this.clearAnimalWork(person); }
        person.destination = null;
        if (person === this.hero) { this.heroDestination = null; }
    }

    unlockHeroAutonomyIfEligible() {
        if (this.hero === null || this.hero.autonomyUnlocked || this.hero.children.length < 1) { return; }
        this.hero.autonomyUnlocked = true;
        const text = `${this.hero.name} ha iniziato a vivere con maggiore autonomia.`;
        this.eventLog.push(text);
        this.feedbackMessages.push({ text, timer: 5 });
        this.requestAutosave();
    }

    startHeroAutonomousWander() {
        if (!this.hero.autonomyUnlocked || this.hero.house === null || this.hero.carrying.amount >= this.hero.carryingCapacity) { return false; }
        for (let attempt = 0; attempt < 20; attempt += 1) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 35 + Math.random() * 145;
            const x = this.hero.house.x + Math.cos(angle) * radius;
            const y = this.hero.house.y + Math.sin(angle) * radius;
            if (this.contains(x, y) && this.terrain.isWalkableAtWorldPosition(x, y)) {
                this.heroDestination = { x, y }; this.hero.state = "autonomousWandering"; this.hero.autonomousAction = true; return true;
            }
        }
        return false;
    }

    assignAutonomousHeroToResource() {
        const hero = this.hero;
        if (!hero.autonomyUnlocked || hero.house === null || hero.carrying.amount >= hero.carryingCapacity || hero.partnerTarget !== null ||
            hero.reservedForFertility || hero.targetTree || hero.targetWaterSource || hero.targetAnimal || (this.heroDestination !== null && !hero.autonomousAction)) { return false; }
        const jobs = hero.carrying.type === null ? ["wood", "water", "meat"] : [hero.carrying.type];
        for (const job of jobs) {
            const collection = job === "wood" ? this.trees : job === "water" ? this.waterSources : this.animals;
            const resource = collection.find((item) => item.assignedHero === null && item.assignedVillager === null);
            if (resource === undefined) { continue; }
            this.heroDestination = null; hero.autonomousAction = true;
            if (job === "wood") { resource.assignedHero = hero; hero.targetTree = resource; }
            if (job === "water") { resource.assignedHero = hero; hero.targetWaterSource = resource; }
            if (job === "meat") { resource.assignedHero = hero; hero.targetAnimal = resource; }
            hero.state = "walking"; return true;
        }
        return false;
    }

    assignVillagersToResources() {
        const jobTypes = ["tree", "water", "animal"];

        for (let offset = 0; offset < jobTypes.length; offset += 1) {
            const jobType = jobTypes[(this.nextResourceAssignmentIndex + offset) % jobTypes.length];

            if (this.assignVillagerToResourceType(jobType)) {
                this.nextResourceAssignmentIndex = (this.nextResourceAssignmentIndex + offset + 1) % jobTypes.length;
                return;
            }
        }
    }

    assignVillagerToResourceType(jobType) {
        const villager = this.getAvailableVillager(jobType);

        if (villager === null) {
            return false;
        }

        if (jobType === "tree") {
            const tree = this.trees.find((candidate) => candidate.assignedVillager === null && candidate.assignedHero === null) || null;
            if (tree === null) { return false; }
            tree.assignedVillager = villager;
            villager.targetTree = tree;
        }

        if (jobType === "water") {
            const source = this.waterSources.find((candidate) => candidate.assignedVillager === null && candidate.assignedHero === null) || null;
            if (source === null) { return false; }
            source.assignedVillager = villager;
            villager.targetWaterSource = source;
        }

        if (jobType === "animal") {
            const animal = this.animals.find((candidate) => candidate.assignedVillager === null && candidate.assignedHero === null) || null;
            if (animal === null) { return false; }
            animal.assignedVillager = villager;
            villager.targetAnimal = animal;
        }

        villager.destination = null;
        villager.actionTimer = 0;
        villager.state = "walking";
        return true;
    }

    getAvailableVillager(jobType = null) {
        return this.villagers.find((villager) => {
            const resourceType = jobType === "tree" ? "wood" : jobType === "animal" ? "meat" : jobType;
            return villager.targetTree === null &&
                villager.targetWaterSource === null &&
                villager.targetAnimal === null &&
                !this.isVillagerBuildingHouse(villager) &&
                !villager.reservedForPartnership &&
                !villager.reservedForAutonomousPartnership &&
                !villager.reservedForFertility &&
                villager.relationshipGoal === null &&
                villager.isAdult &&
                villager.carrying.amount < villager.carryingCapacity &&
                (villager.carrying.type === null || villager.carrying.type === resourceType) &&
                villager.state === "idle";
        }) || null;
    }

    clearVillagerTreeWork(villager) {
        if (villager.targetTree !== null && villager.targetTree.assignedVillager === villager) {
            villager.targetTree.assignedVillager = null;
            villager.targetTree.isBeingCut = this.isTreeBeingCutByHero(villager.targetTree);
        }

        villager.targetTree = null;
        villager.destination = this.terrain.getRandomWalkableWorldPosition();
        villager.actionTimer = 0;
        villager.idleTimer = this.getRandomVillagerIdleTime();
        villager.state = "walking";
    }

    clearHeroTreeWork() {
        if (this.hero.targetTree !== null && this.hero.targetTree.assignedHero === this.hero) {
            this.hero.targetTree.assignedHero = null;
            this.hero.targetTree.isBeingCut = this.isTreeBeingCutByVillager(this.hero.targetTree);
        }

        this.hero.targetTree = null;
        this.hero.actionTimer = 0;
        this.hero.state = "idle";
    }


    clearWaterWork(worker) {
        if (worker === this.hero) { this.clearHeroWaterWork(); return; }
        this.clearVillagerWaterWork(worker);
    }

    clearAnimalWork(worker) {
        if (worker === this.hero) { this.clearHeroAnimalWork(); return; }
        this.clearVillagerAnimalWork(worker);
    }

    clearVillagerAllWork(villager) {
        if (villager.targetTree !== null) { this.clearVillagerTreeWork(villager); }
        if (villager.targetWaterSource !== null) { this.clearVillagerWaterWork(villager); }
        if (villager.targetAnimal !== null) { this.clearVillagerAnimalWork(villager); }
        villager.destination = null;
        villager.actionTimer = 0;
        villager.state = "idle";
    }

    clearVillagerWaterWork(villager) {
        if (villager.targetWaterSource !== null && villager.targetWaterSource.assignedVillager === villager) {
            villager.targetWaterSource.assignedVillager = null;
            villager.targetWaterSource.isBeingUsed = this.isWaterSourceUsedByHero(villager.targetWaterSource);
        }
        villager.targetWaterSource = null;
        villager.destination = this.terrain.getRandomWalkableWorldPosition();
        villager.actionTimer = 0;
        villager.idleTimer = this.getRandomVillagerIdleTime();
        villager.state = "walking";
    }

    clearHeroWaterWork() {
        if (this.hero.targetWaterSource !== null && this.hero.targetWaterSource.assignedHero === this.hero) {
            this.hero.targetWaterSource.assignedHero = null;
            this.hero.targetWaterSource.isBeingUsed = this.isWaterSourceUsedByVillager(this.hero.targetWaterSource);
        }
        this.hero.targetWaterSource = null;
        this.hero.actionTimer = 0;
        if (this.hero.state === "collectingWater") { this.hero.state = "idle"; }
    }

    clearVillagerAnimalWork(villager) {
        if (villager.targetAnimal !== null && villager.targetAnimal.assignedVillager === villager) {
            villager.targetAnimal.assignedVillager = null;
            villager.targetAnimal.isBeingHunted = this.isAnimalHuntedByHero(villager.targetAnimal);
        }
        villager.targetAnimal = null;
        villager.destination = this.terrain.getRandomWalkableWorldPosition();
        villager.actionTimer = 0;
        villager.idleTimer = this.getRandomVillagerIdleTime();
        villager.state = "walking";
    }

    clearHeroAnimalWork() {
        if (this.hero.targetAnimal !== null && this.hero.targetAnimal.assignedHero === this.hero) {
            this.hero.targetAnimal.assignedHero = null;
            this.hero.targetAnimal.isBeingHunted = this.isAnimalHuntedByVillager(this.hero.targetAnimal);
        }
        this.hero.targetAnimal = null;
        this.hero.actionTimer = 0;
        if (this.hero.state === "huntingAnimal") { this.hero.state = "idle"; }
    }

    isTreeBeingCutByHero(tree) {
        return tree.assignedHero === this.hero && this.hero.state === "cuttingTree";
    }

    isTreeBeingCutByVillager(tree) {
        return tree.assignedVillager !== null && tree.assignedVillager.state === "cuttingTree";
    }


    isWaterSourceUsedByHero(source) { return source.assignedHero === this.hero && this.hero.state === "collectingWater"; }

    isWaterSourceUsedByVillager(source) { return source.assignedVillager !== null && source.assignedVillager.state === "collectingWater"; }

    isAnimalHuntedByHero(animal) { return animal.assignedHero === this.hero && this.hero.state === "huntingAnimal"; }

    isAnimalHuntedByVillager(animal) { return animal.assignedVillager !== null && animal.assignedVillager.state === "huntingAnimal"; }

    removeTree(tree) {
        this.trees = this.trees.filter((existingTree) => existingTree !== tree);
        tree.assignedVillager = null;
        tree.assignedHero = null;
        tree.isBeingCut = false;
    }


    removeWaterSource(source) {
        this.waterSources = this.waterSources.filter((existingSource) => existingSource !== source);
        if (source.assignedVillager !== null) { source.assignedVillager.targetWaterSource = null; }
        if (source.assignedHero !== null) { source.assignedHero.targetWaterSource = null; }
        source.assignedVillager = null;
        source.assignedHero = null;
        source.isBeingUsed = false;
    }

    removeAnimal(animal) {
        this.animals = this.animals.filter((existingAnimal) => existingAnimal !== animal);
        if (animal.assignedVillager !== null) { animal.assignedVillager.targetAnimal = null; }
        if (animal.assignedHero !== null) { animal.assignedHero.targetAnimal = null; }
        animal.assignedVillager = null;
        animal.assignedHero = null;
        animal.isBeingHunted = false;
    }

    updateResourceFeedback(delta) {
        this.trees.forEach((tree) => {
            tree.cutFeedbackTimer = Math.max(0, tree.cutFeedbackTimer - delta);
        });
        this.waterSources.forEach((source) => {
            source.useFeedbackTimer = Math.max(0, source.useFeedbackTimer - delta);
        });
        this.animals.forEach((animal) => {
            animal.hitFeedbackTimer = Math.max(0, animal.hitFeedbackTimer - delta);
        });
        this.houses.forEach((house) => {
            if (house.depositFeedback !== null) {
                house.depositFeedback.timer -= delta;
                if (house.depositFeedback.timer <= 0) { house.depositFeedback = null; }
            }
        });
    }

    updatePartnerFeedback(delta) {
        this.hero.partnerFeedbackTimer = Math.max(0, this.hero.partnerFeedbackTimer - delta);
        this.villagers.forEach((villager) => {
            villager.partnerFeedbackTimer = Math.max(0, villager.partnerFeedbackTimer - delta);
        });
    }

    getRandomVillagerIdleTime() {
        return 1 + Math.random() * 3;
    }

    setHeroDestination(x, y) {
        this.clearHeroPartnerProposal();
        this.clearHeroTreeWork();
        this.clearHeroWaterWork();
        this.clearHeroAnimalWork();
        this.heroDestination = { x, y };
        this.hero.autonomousAction = false;
        this.hero.state = "walking";
    }

    commandHeroToCutTree(tree) {
        if (!this.trees.includes(tree) || !this.canCarryResource(this.hero, "wood")) {
            return false;
        }

        this.clearHeroPartnerProposal();
        this.clearHeroTreeWork();
        this.clearHeroWaterWork();
        this.clearHeroAnimalWork();
        this.releaseTreeFromVillager(tree);
        tree.assignedHero = this.hero;
        tree.isBeingCut = false;
        this.hero.targetTree = tree;
        this.heroDestination = null;
        this.hero.actionTimer = 0;
        this.hero.state = "walking";
        this.hero.autonomousAction = false;

        return true;
    }

    releaseTreeFromVillager(tree) {
        if (tree.assignedVillager === null) {
            return;
        }

        this.clearVillagerTreeWork(tree.assignedVillager);
    }


    commandHeroToCollectWater(source) {
        if (!this.waterSources.includes(source) || !this.canCarryResource(this.hero, "water")) { return false; }
        this.clearHeroPartnerProposal();
        this.clearHeroTreeWork();
        this.clearHeroWaterWork();
        this.clearHeroAnimalWork();
        this.releaseWaterSourceFromVillager(source);
        source.assignedHero = this.hero;
        source.isBeingUsed = false;
        this.hero.targetWaterSource = source;
        this.heroDestination = null;
        this.hero.actionTimer = 0;
        this.hero.state = "walking";
        this.hero.autonomousAction = false;
        return true;
    }

    commandHeroToHuntAnimal(animal) {
        if (!this.animals.includes(animal) || !this.canCarryResource(this.hero, "meat")) { return false; }
        this.clearHeroPartnerProposal();
        this.clearHeroTreeWork();
        this.clearHeroWaterWork();
        this.clearHeroAnimalWork();
        this.releaseAnimalFromVillager(animal);
        animal.assignedHero = this.hero;
        animal.isBeingHunted = false;
        this.hero.targetAnimal = animal;
        this.heroDestination = null;
        this.hero.actionTimer = 0;
        this.hero.state = "walking";
        this.hero.autonomousAction = false;
        return true;
    }

    releaseWaterSourceFromVillager(source) {
        if (source.assignedVillager !== null) { this.clearVillagerWaterWork(source.assignedVillager); }
    }

    releaseAnimalFromVillager(animal) {
        if (animal.assignedVillager !== null) { this.clearVillagerAnimalWork(animal.assignedVillager); }
    }

    getWaterSourceAtWorldPosition(x, y) {
        return this.waterSources.find((source) => Math.hypot(source.x - x, source.y - y) <= source.radius) || null;
    }

    getAnimalAtWorldPosition(x, y) {
        return this.animals.find((animal) => Math.hypot(animal.x - x, animal.y - y) <= animal.radius) || null;
    }

    getTreeAtWorldPosition(x, y) {
        return this.trees.find((tree) => {
            return Math.hypot(tree.x - x, tree.y - y) <= tree.radius;
        }) || null;
    }

    getVillagerAtWorldPosition(x, y) {
        return this.villagers.find((villager) => {
            return villager.isAdult && Math.hypot(villager.x - x, villager.y - y) <= villager.radius;
        }) || null;
    }

    commandHeroToPartnerWith(villager) {
        const ineligibilityReason = this.getPartnerIneligibilityReason(villager);

        if (ineligibilityReason !== null) {
            this.lastPartnerIneligibilityReason = ineligibilityReason;
            this.clearHeroPartnerProposal();
            return false;
        }

        this.lastPartnerIneligibilityReason = null;

        this.clearHeroPartnerProposal();
        this.clearHeroTreeWork();
        this.clearHeroWaterWork();
        this.clearHeroAnimalWork();
        this.clearVillagerAllWork(villager);
        this.hero.partnerTarget = villager;
        this.hero.socialTimer = 0;
        this.heroDestination = null;
        this.hero.state = "seekingPartner";
        this.hero.autonomousAction = false;
        villager.reservedForPartnership = true;
        villager.destination = null;
        villager.state = "awaitingPartner";

        return true;
    }

    canCarryResource(person, type) {
        return person.carrying.amount < person.carryingCapacity && (person.carrying.type === null || person.carrying.type === type);
    }

    updateHeroPartnerProposal(delta) {
        const villager = this.hero.partnerTarget;

        if (!this.isVillagerEligiblePartner(villager)) {
            this.clearHeroPartnerProposal();
            return;
        }

        const stopDistance = this.hero.radius + villager.radius + 4;
        const distanceX = villager.x - this.hero.x;
        const distanceY = villager.y - this.hero.y;
        const distance = Math.hypot(distanceX, distanceY);

        if (distance > stopDistance + 0.5) {
            this.hero.state = "seekingPartner";
            villager.state = "awaitingPartner";

            const step = Math.min(this.hero.speed * delta, distance - stopDistance);
            this.hero.x += (distanceX / distance) * step;
            this.hero.y += (distanceY / distance) * step;
            return;
        }

        this.hero.state = "socializing";
        villager.state = "socializing";
        this.hero.socialTimer += delta;

        if (this.hero.socialTimer >= 2) {
            this.completeHeroPartnership(villager);
        }
    }

    completeHeroPartnership(villager) {
        if (!this.isVillagerEligiblePartner(villager)) {
            this.clearHeroPartnerProposal();
            return false;
        }

        this.hero.house.storage.wood -= 3;
        this.hero.house.storage.water -= 3;
        this.hero.house.storage.meat -= 3;
        this.hero.partners.push(villager);
        villager.partners.push(this.hero);
        villager.house = this.hero.house;

        if (!this.hero.house.occupants.includes(villager)) {
            this.hero.house.occupants.push(villager);
        }

        this.hero.partnerFeedbackTimer = 1.5;
        villager.partnerFeedbackTimer = 1.5;
        this.clearHeroPartnerProposal();
        this.requestAutosave();

        return true;
    }

    clearHeroPartnerProposal() {
        const villager = this.hero.partnerTarget;

        if (villager !== null) {
            villager.reservedForPartnership = false;
            villager.destination = null;
            villager.idleTimer = this.getRandomVillagerIdleTime();
            villager.state = "idle";
        }

        this.hero.partnerTarget = null;
        this.hero.socialTimer = 0;

        if (this.hero.state === "seekingPartner" || this.hero.state === "socializing") {
            this.hero.state = "idle";
        }
    }

    isVillagerEligiblePartner(villager) {
        return this.getPartnerIneligibilityReason(villager) === null;
    }

    getPartnerIneligibilityReason(villager) {
        if (!this.villagers.includes(villager) || villager === this.hero || !villager.alive || !villager.isAdult) {
            return "Non disponibile";
        }

        if (this.hero.house === null) {
            return "Casa non costruita";
        }

        if (this.hero.house.storage.wood < 3 || this.hero.house.storage.water < 3 || this.hero.house.storage.meat < 3) {
            return "Servono 3 legna, 3 acqua e 3 carne";
        }

        if (this.hero.partners.length > 0 || this.hero.partners.includes(villager)) {
            return "Il Prescelto ha già un partner";
        }

        if (this.isCloseRelative(this.hero, villager)) {
            return "Parente stretto";
        }

        if (villager.relationshipStyle === "monogamo" && villager.partners.length > 0) {
            return "Ha già una relazione esclusiva";
        }

        if (villager.reservedForAutonomousPartnership || villager.reservedForFertility || this.isVillagerBuildingHouse(villager)) {
            return "Non disponibile";
        }

        if (!this.areCharactersMutuallyCompatible(this.hero, villager)) {
            return "Non compatibile con l'orientamento";
        }

        return null;
    }

    isCloseRelative(first, second) {
        return first.parents.includes(second) ||
            first.children.includes(second) ||
            second.parents.includes(first) ||
            second.children.includes(first) ||
            first.parents.some((parent) => second.parents.includes(parent));
    }

    areCharactersMutuallyCompatible(first, second) {
        return this.isOrientationCompatible(first, second) && this.isOrientationCompatible(second, first);
    }

    isOrientationCompatible(person, candidate) {
        if (person.orientation === "pansessuale") {
            return true;
        }

        if (person.gender === "non-binario") {
            return true;
        }

        if (person.orientation === "bisessuale") {
            return candidate.gender === "uomo" || candidate.gender === "donna" || candidate.gender === "non-binario";
        }

        if (person.orientation === "gay-lesbica") {
            return candidate.gender === person.gender;
        }

        if (person.orientation === "etero") {
            return (person.gender === "uomo" && candidate.gender === "donna") ||
                (person.gender === "donna" && candidate.gender === "uomo") ||
                person.gender === "non-binario" ||
                candidate.gender === "non-binario";
        }

        return false;
    }


    getHouseAtWorldPosition(x, y) {
        return this.houses.find((house) => Math.hypot(house.x - x, house.y - y) <= house.radius) || null;
    }

    getPopulationCount() {
        return (this.hero !== null && this.hero.alive ? 1 : 0) + this.villagers.filter((villager) => villager.alive).length;
    }

    getCurrentEra() { return this.worldEra; }

    getEraDisplayName(era = this.worldEra) {
        return { tribe: "L'Alba della Vita", village: "La Comunità", faith: "La Fede" }[era] || "L'Alba della Vita";
    }

    canAdvanceToVillage() { return this.worldEra === "tribe" && this.getPopulationCount() >= 32; }

    checkEraProgression() { if (this.canAdvanceToVillage()) { this.enterVillageEra(); } }

    enterVillageEra() {
        if (!this.canAdvanceToVillage()) { return false; }
        this.worldEra = "village";
        this.villageUnlocked = true;
        this.villageUnlockedAtPopulation = this.getPopulationCount();
        this.eraTransitionSequence += 1;
        this.eventLog.push("La tribù è diventata un villaggio.");
        if (this.onEraChanged !== null) { this.onEraChanged(this.getEraDisplayName()); }
        this.requestAutosave();
        return true;
    }

    hasReachedVillageEra() { return this.villageUnlocked || this.worldEra === "village" || this.worldEra === "faith"; }

    getSettlementBounds(margin = 80) {
        if (this.houses.length === 0) { return null; }
        const safeMargin = Math.max(0, Number(margin) || 0);
        const minX = Math.max(0, Math.min(...this.houses.map((house) => house.x - house.radius)) - safeMargin);
        const minY = Math.max(0, Math.min(...this.houses.map((house) => house.y - house.radius)) - safeMargin);
        const maxX = Math.min(this.getWidth(), Math.max(...this.houses.map((house) => house.x + house.radius)) + safeMargin);
        const maxY = Math.min(this.getHeight(), Math.max(...this.houses.map((house) => house.y + house.radius)) + safeMargin);
        return { minX, minY, maxX, maxY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2, width: maxX - minX, height: maxY - minY, margin: safeMargin };
    }

    isInsideSettlementBounds(x, y, margin = 0) {
        const bounds = this.getSettlementBounds(margin);
        return bounds !== null && x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
    }

    commandFertilityAt(x, y) {
        const house = this.getHouseAtWorldPosition(x, y);
        if (house === null) { this.lastFertilityIneligibilityReason = null; return false; }
        const reason = this.getFertilityIneligibilityReason(house);
        if (reason !== null) { this.lastFertilityIneligibilityReason = reason; return false; }
        this.lastFertilityIneligibilityReason = null;
        this.startFertilityEvent(house);
        return true;
    }

    getFertilityIneligibilityReason(house) {
        if (this.getPopulationCount() >= 32) { return "La popolazione ha raggiunto il limite"; }
        if (house.fertilityInProgress) { return "La casa è già occupata"; }
        if (house.fertilityCooldown > 0) { return "La casa ha bisogno di tempo"; }
        const dependentChildren = house.occupants.filter((occupant) => !occupant.isAdult);
        if (dependentChildren.length >= 2) { return "La casa ospita già due figli"; }
        const adults = house.occupants.filter((occupant) => occupant.isAdult);
        if (adults.length < 2) { return "Servono due adulti nella casa"; }
        if (adults.some((adult) => !adult.alive || adult.house !== house || this.isBusyForFertility(adult))) { return "Gli adulti non sono disponibili"; }
        if (!this.areEstablishedHouseholdPartners(adults)) { return "Servono partner stabiliti"; }
        if (this.hasCloseRelatives(adults)) { return "Parenti stretti non ammessi"; }
        return null;
    }

    isBusyForFertility(person) {
        return person.reservedForPartnership || person.reservedForFertility ||
            person.targetTree !== null || person.targetWaterSource !== null || person.targetAnimal !== null ||
            this.isVillagerBuildingHouse(person) ||
            (person.partnerTarget !== undefined && person.partnerTarget !== null);
    }

    areEstablishedHouseholdPartners(adults) {
        return adults.every((adult) => adults.some((other) => other !== adult && adult.partners.includes(other)));
    }

    hasCloseRelatives(people) {
        return people.some((person, index) => people.slice(index + 1).some((other) => this.isCloseRelative(person, other)));
    }

    startFertilityEvent(house) {
        house.participants = house.occupants.filter((occupant) => occupant.isAdult);
        house.fertilityInProgress = true;
        house.fertilityPhase = "walking";
        house.fertilityTimer = 0;
        house.pendingChild = null;
        house.participants.forEach((participant) => {
            if (participant !== this.hero) { this.clearVillagerAllWork(participant); }
            participant.reservedForFertility = true;
            participant.destination = this.getHouseEntrance(house);
            participant.state = "walkingToHouse";
        });
        if (house.participants.includes(this.hero)) {
            this.clearHeroPartnerProposal();
            this.clearHeroTreeWork();
            this.clearHeroWaterWork();
            this.clearHeroAnimalWork();
            this.heroDestination = this.getHouseEntrance(house);
        }
    }

    updateFertilityEvents(delta) {
        this.houses.forEach((house) => {
            house.fertilityCooldown = Math.max(0, house.fertilityCooldown - delta);
            if (!house.fertilityInProgress) { return; }
            if (this.getFertilityIneligibilityReasonDuringEvent(house) !== null) { this.cancelFertilityEvent(house); return; }
            if (house.fertilityPhase === "walking") { this.updateFertilityWalking(house, delta); return; }
            if (house.fertilityPhase === "private") { this.updateFertilityPrivate(house, delta); }
        });
    }

    getFertilityIneligibilityReasonDuringEvent(house) {
        if (house.participants.some((p) => !p.alive || p.house !== house || !p.isAdult)) { return "invalid"; }
        if (this.hasCloseRelatives(house.participants)) { return "invalid"; }
        return null;
    }

    updateFertilityWalking(house, delta) {
        house.participants.forEach((participant) => this.moveParticipantToHouse(participant, house, delta));
        if (house.participants.every((participant) => Math.hypot(participant.x - this.getHouseEntrance(house).x, participant.y - this.getHouseEntrance(house).y) <= 4)) {
            house.fertilityPhase = "private";
            house.fertilityTimer = 0;
            house.participants.forEach((participant) => { participant.state = "insideHouse"; participant.destination = null; });
            if (house.participants.includes(this.hero)) { this.heroDestination = null; }
        }
    }

    moveParticipantToHouse(participant, house, delta) {
        const entrance = this.getHouseEntrance(house);
        const distanceX = entrance.x - participant.x;
        const distanceY = entrance.y - participant.y;
        const distance = Math.hypot(distanceX, distanceY);
        const step = participant.speed * delta;
        if (distance <= step || distance === 0) { participant.x = entrance.x; participant.y = entrance.y; return; }
        participant.x += (distanceX / distance) * step;
        participant.y += (distanceY / distance) * step;
    }

    updateFertilityPrivate(house, delta) {
        house.fertilityTimer += delta;
        if (house.fertilityTimer >= 5) { this.completeFertilityEvent(house); }
    }

    completeFertilityEvent(house) {
        const child = this.createChildForHouse(house);
        this.assignEntityId(child);
        this.villagers.push(child);
        house.occupants.push(child);
        house.participants.forEach((parent) => { if (!parent.children.includes(child)) { parent.children.push(child); } });
        house.participants.forEach((participant, index) => {
            participant.x = house.x - 18 + index * 18;
            participant.y = house.y + 48;
            participant.reservedForFertility = false;
            participant.state = "idle";
            participant.idleTimer = this.getRandomVillagerIdleTime();
        });
        house.fertilityInProgress = false;
        house.fertilityPhase = null;
        house.fertilityTimer = 0;
        house.fertilityCooldown = 60;
        house.participants = [];
        house.pendingChild = null;
        this.requestAutosave();
    }

    createChildForHouse(house) {
        const gender = this.getRandomChildGender();
        const entrance = this.getHouseEntrance(house);
        return new Child({ name: this.getRandomChildName(), x: entrance.x + 24, y: entrance.y + 8, gender, house, parents: [...house.participants], spriteKey: this.getChildSpriteKey(gender) });
    }

    cancelFertilityEvent(house) {
        house.participants.forEach((participant) => { participant.reservedForFertility = false; participant.destination = null; participant.state = "idle"; });
        house.fertilityInProgress = false; house.fertilityPhase = null; house.fertilityTimer = 0; house.participants = []; house.pendingChild = null;
    }

    updateChildren(delta) {
        this.villagers.forEach((villager) => {
            if (villager.ageStage === "child") { this.updateChild(villager, delta); }
        });
    }

    updateChild(child, delta) {
        child.ageTimer += delta;
        if (child.ageTimer >= child.ageDuration) { this.growChildIntoAdult(child); return; }
        if (child.destination === null) { child.idleTimer -= delta; if (child.idleTimer <= 0) { child.destination = this.getRandomChildDestination(child); child.state = "childWalking"; } return; }
        this.moveChild(child, delta);
    }

    moveChild(child, delta) {
        const dx = child.destination.x - child.x; const dy = child.destination.y - child.y; const distance = Math.hypot(dx, dy); const step = child.speed * delta;
        if (distance <= step || distance === 0) { child.x = child.destination.x; child.y = child.destination.y; child.destination = null; child.idleTimer = this.getRandomVillagerIdleTime(); child.state = "childIdle"; return; }
        child.x += (dx / distance) * step; child.y += (dy / distance) * step;
    }

    getRandomChildDestination(child) {
        for (let attempt = 0; attempt < 20; attempt += 1) {
            const angle = Math.random() * Math.PI * 2; const radius = Math.random() * 120;
            const x = child.house.x + Math.cos(angle) * radius; const y = child.house.y + Math.sin(angle) * radius;
            if (this.contains(x, y) && this.isWalkableAtWorldPosition(x, y)) { return { x, y }; }
        }
        return this.getHouseEntrance(child.house);
    }

    growChildIntoAdult(child) {
        child.ageStage = "adult"; child.isAdult = true; child.orientation = this.getRandomAdultOrientation(); child.relationshipStyle = Math.random() < 0.5 ? "monogamo" : "poliamoroso"; child.spriteKey = this.getAdultVillagerSpriteKey(child.gender); child.state = "idle"; child.destination = null;
    }

    getHouseEntrance(house) { return { x: house.x, y: house.y + 34 }; }
    getRandomChildName() { return ["Lina", "Nilo", "Sami", "Elia", "Rina"][Math.floor(Math.random() * 5)]; }
    getRandomChildGender() { return ["uomo", "donna", "non-binario"][Math.floor(Math.random() * 3)]; }
    getChildSpriteKey(gender) { if (gender === "donna") { return "child_female_01"; } if (gender === "non-binario") { return "child_nonbinary_01"; } return "child_male_01"; }
    getRandomAdultOrientation() { return ["etero", "gay-lesbica", "bisessuale", "pansessuale"][Math.floor(Math.random() * 4)]; }
    getAdultVillagerSpriteKey(gender) { if (gender === "donna") { return "villager_female_01"; } if (gender === "non-binario") { return "villager_nonbinary_01"; } return "villager_male_01"; }

    isWalkableAtWorldPosition(x, y) {
        return this.terrain.isWalkableAtWorldPosition(x, y);
    }

    addTreeAt(x, y) {
        if (!this.canPlaceTreeAt(x, y)) {
            return false;
        }

        const tree = new Tree(x, y);
        this.assignResourceId(tree);
        this.trees.push(tree);

        return true;
    }

    canPlaceTreeAt(x, y) {
        const tree = new Tree(x, y);

        return this.contains(x, y) &&
            this.terrain.isGrassAtWorldPosition(x, y) &&
            !this.overlapsAnyTree(tree) &&
            !this.overlapsAnyWaterSource(tree) &&
            !this.overlapsAnyAnimal(tree) &&
            !this.overlapsAnyHouse(tree) &&
            !this.overlapsEntity(tree, this.hero) &&
            !this.villagers.some((villager) => this.overlapsEntity(tree, villager));
    }

    addChosenHouseAt(x, y) {
        if (!this.canPlaceHouseAt(x, y)) {
            return false;
        }

        const house = new House(x, y, this.hero);

        this.assignHouseId(house);
        this.houses.push(house);
        this.hero.house = house;
        this.hero.ownedHouse = house;
        this.requestAutosave();

        return true;
    }

    canPlaceHouseAt(x, y) {
        const house = new House(x, y, this.hero);

        return this.hero.house === null &&
            this.houses.length === 0 &&
            this.contains(x, y) &&
            this.terrain.isGrassAtWorldPosition(x, y) &&
            !this.overlapsAnyHouse(house) &&
            !this.overlapsAnyTree(house) &&
            !this.overlapsAnyWaterSource(house) &&
            !this.overlapsAnyAnimal(house) &&
            !this.overlapsEntity(house, this.hero) &&
            !this.villagers.some((villager) => this.overlapsEntity(house, villager));
    }


    addWaterSourceAt(x, y) {
        if (!this.canPlaceWaterSourceAt(x, y)) { return false; }
        const source = new WaterSource(x, y);
        this.assignResourceId(source);
        this.waterSources.push(source);
        return true;
    }

    canPlaceWaterSourceAt(x, y) {
        const source = new WaterSource(x, y);
        return this.canPlaceResourceAt(source, x, y);
    }

    addAnimalAt(x, y) {
        if (!this.canPlaceAnimalAt(x, y)) { return false; }
        const animal = new Animal("Deer", x, y);
        this.assignResourceId(animal);
        this.animals.push(animal);
        return true;
    }

    canPlaceAnimalAt(x, y) {
        const animal = new Animal("Deer", x, y);
        return this.canPlaceResourceAt(animal, x, y);
    }

    canPlaceResourceAt(resource, x, y) {
        return this.contains(x, y) &&
            this.terrain.isGrassAtWorldPosition(x, y) &&
            !this.overlapsAnyTree(resource) &&
            !this.overlapsAnyWaterSource(resource) &&
            !this.overlapsAnyAnimal(resource) &&
            !this.overlapsAnyHouse(resource) &&
            !this.overlapsEntity(resource, this.hero) &&
            !this.villagers.some((villager) => this.overlapsEntity(resource, villager));
    }

    hasChosenHouse() {
        return this.hero !== null && this.hero.house !== null;
    }

    overlapsAnyTree(tree) {
        return this.trees.some((existingTree) => this.overlapsEntity(tree, existingTree));
    }

    overlapsAnyWaterSource(entity) {
        return this.waterSources.some((source) => this.overlapsEntity(entity, source));
    }

    overlapsAnyAnimal(entity) {
        return this.animals.some((animal) => this.overlapsEntity(entity, animal));
    }

    overlapsAnyHouse(entity) {
        return this.houses.some((house) => this.overlapsEntity(entity, house));
    }

    overlapsEntity(first, second) {
        return Math.hypot(first.x - second.x, first.y - second.y) < first.radius + second.radius;
    }

    contains(x, y) {
        return x >= 0 &&
            y >= 0 &&
            x <= this.getWidth() &&
            y <= this.getHeight();
    }

    getWidth() {
        return this.terrain.columns * this.tileSize;
    }

    getHeight() {
        return this.terrain.rows * this.tileSize;
    }

    getEntities() {
        return [this.hero, ...this.villagers];
    }

    getTrees() {
        return this.trees;
    }

    getHouses() {
        return this.houses;
    }

    getWaterSources() {
        return this.waterSources;
    }


    assignEntityId(entity) {
        if (entity !== null && entity.id === null) { entity.id = `entity-${this.nextEntityId}`; this.nextEntityId += 1; }
    }

    assignHouseId(house) {
        if (house !== null && house.id === null) { house.id = `house-${this.nextHouseId}`; this.nextHouseId += 1; }
    }

    assignResourceId(resource) {
        if (resource !== null && resource.id === null) { resource.id = `resource-${this.nextResourceId}`; this.nextResourceId += 1; }
    }

    requestAutosave() { if (this.onAutosaveNeeded !== null) { this.onAutosaveNeeded(); } }

    updateFeedbackMessages(delta) { this.feedbackMessages.forEach((m) => { m.timer = Math.max(0, m.timer - delta); }); this.feedbackMessages = this.feedbackMessages.filter((m) => m.timer > 0); this.villagers.forEach((v) => { v.arrivalMarkerTimer = Math.max(0, (v.arrivalMarkerTimer || 0) - delta); }); }

    updateAdultArrivals(delta) {
        if (this.arrivalsUsed >= this.maxArrivals || this.getPopulationCount() >= 32 || this.arrivalInProgress) { return; }
        this.arrivalCooldown = Math.max(0, this.arrivalCooldown - delta);
        this.nextArrivalCheckTimer = Math.max(0, this.nextArrivalCheckTimer - delta);
        if (this.arrivalCooldown > 0 || this.nextArrivalCheckTimer > 0) { return; }
        this.nextArrivalCheckTimer = this.arrivalCheckInterval;
        this.tryCreateAdultArrival();
    }

    tryCreateAdultArrival() {
        const target = this.selectArrivalTarget(); const spawn = this.findArrivalSpawnPosition();
        if (target === null || spawn === null) { return false; }
        const identity = this.generateCompatibleArrivalIdentity(target);
        if (identity === null) { return false; }
        const villager = new Villager({ ...identity, x: spawn.x, y: spawn.y });
        this.assignEntityId(villager); villager.state = "arriving"; villager.destination = this.getArrivalDestination(spawn); villager.idleTimer = 0; villager.arrivalMarkerTimer = 5;
        this.villagers.push(villager); this.arrivalsUsed += 1; this.arrivalCooldown = 300; this.nextArrivalCheckTimer = this.arrivalCheckInterval;
        this.feedbackMessages.push({ text: `Un nuovo abitante è arrivato: ${villager.name}`, timer: 5 }); this.requestAutosave(); return true;
    }

    selectArrivalTarget() { const candidates = this.getArrivalAvailableAdults().map((adult) => ({ adult, count: this.countCompatibleUnrelatedCandidates(adult) })).filter((item) => item.count <= 1); if (candidates.length === 0) { return null; } const preferred = candidates.filter((item) => item.count === 0); const pool = preferred.length > 0 ? preferred : candidates; return pool[Math.floor(Math.random() * pool.length)].adult; }
    getArrivalAvailableAdults() { return this.getEntities().filter((adult) => adult !== null && adult.alive && adult.isAdult && this.hasPartnerCapacity(adult) && !adult.reservedForFertility && !adult.reservedForPartnership && !adult.reservedForAutonomousPartnership && adult.state !== "insideHouse" && adult.relationshipGoal === null && adult.partnerTarget === null && !this.isVillagerBuildingHouse(adult)); }
    hasPartnerCapacity(adult) { return adult.partners.length === 0 || (adult.relationshipStyle === "poliamoroso" && adult.partners.length < 2); }
    countCompatibleUnrelatedCandidates(adult) { return this.getArrivalAvailableAdults().filter((candidate) => candidate !== adult && !this.isCloseRelative(adult, candidate) && this.areCharactersMutuallyCompatible(adult, candidate)).length; }
    generateCompatibleArrivalIdentity(target) { for (let attempt = 0; attempt < 50; attempt += 1) { const gender = this.getRandomChildGender(); const identity = { name: this.getRandomArrivalName(), age: 18 + Math.floor(Math.random() * 23), gender, orientation: this.getRandomAdultOrientation(), relationshipStyle: Math.random() < 0.65 ? "monogamo" : "poliamoroso", spriteKey: this.getAdultVillagerSpriteKey(gender) }; const candidate = new Villager(identity); if (this.areCharactersMutuallyCompatible(target, candidate)) { return identity; } } return null; }
    getRandomArrivalName() { const names = ["Alba", "Brin", "Cora", "Dario", "Enea", "Fio", "Gio", "Iris", "Luce", "Milo", "Noa", "Onda", "Pia", "Rami", "Vera"]; let name = names[Math.floor(Math.random() * names.length)]; let suffix = 2; const used = new Set(this.getEntities().filter(Boolean).map((e) => e.name)); while (used.has(name)) { name = `${name} ${suffix}`; suffix += 1; } return name; }
    findArrivalSpawnPosition() { for (let attempt = 0; attempt < 80; attempt += 1) { const margin = 28; const side = Math.floor(Math.random() * 4); const x = side === 0 ? margin : side === 1 ? this.getWidth() - margin : margin + Math.random() * (this.getWidth() - margin * 2); const y = side === 2 ? this.tileSize * 5 + margin : side === 3 ? this.getHeight() - margin : this.tileSize * 5 + margin + Math.random() * (this.getHeight() - this.tileSize * 5 - margin * 2); const probe = new Villager({ x, y }); if (this.canSpawnArrivalAt(probe, x, y)) { return { x, y }; } } return null; }
    canSpawnArrivalAt(probe, x, y) { return this.contains(x, y) && this.terrain.isGrassAtWorldPosition(x, y) && !this.overlapsAnyHouse(probe) && !this.overlapsAnyTree(probe) && !this.overlapsAnyWaterSource(probe) && !this.overlapsAnyAnimal(probe) && !this.overlapsEntity(probe, this.hero) && !this.villagers.some((v) => this.overlapsEntity(probe, v)); }
    getArrivalDestination(spawn) { const center = { x: this.getWidth() / 2, y: this.tileSize * 7 }; const dx = center.x - spawn.x; const dy = center.y - spawn.y; const distance = Math.max(1, Math.hypot(dx, dy)); return { x: spawn.x + (dx / distance) * 96, y: spawn.y + (dy / distance) * 96 }; }

    serialize() { return { world: { schemaVersion: 4, dayNumber: this.dayNumber, timeOfDay: this.timeOfDay, dayPhase: this.dayPhase, phaseTimer: this.phaseTimer, nightlyConsumptionProcessed: this.nightlyConsumptionProcessed, eventLog: this.eventLog, worldEra: this.worldEra, villageUnlocked: this.villageUnlocked, villageUnlockedAtPopulation: this.villageUnlockedAtPopulation, eraTransitionSequence: this.eraTransitionSequence, terrain: { columns: this.terrain.columns, rows: this.terrain.rows, tileSize: this.tileSize, tiles: this.terrain.tiles }, heroDestination: this.heroDestination, nextResourceAssignmentIndex: this.nextResourceAssignmentIndex, nextAutonomousBuilderIndex: this.nextAutonomousBuilderIndex, nextAutonomousPartnerIndex: this.nextAutonomousPartnerIndex, nextEntityId: this.nextEntityId, nextHouseId: this.nextHouseId, nextResourceId: this.nextResourceId, arrivalsUsed: this.arrivalsUsed, maxArrivals: this.maxArrivals, arrivalCooldown: this.arrivalCooldown, nextArrivalCheckTimer: this.nextArrivalCheckTimer, feedbackMessages: this.feedbackMessages, hero: this.serializePerson(this.hero, "hero"), villagers: this.villagers.map((v) => this.serializePerson(v, v.ageStage === "child" ? "child" : "villager")), houses: this.houses.map((h) => this.serializeHouse(h)), trees: this.trees.map((t) => this.serializeResource(t, "tree")), waterSources: this.waterSources.map((w) => this.serializeResource(w, "water")), animals: this.animals.map((a) => this.serializeResource(a, "animal")) } }; }
    serializePerson(p, type) { return { id: p.id, type, name: p.name, x: p.x, y: p.y, destination: p.destination, state: p.state === "insideHouse" ? p.state : "idle", gender: p.gender, orientation: p.orientation, relationshipStyle: p.relationshipStyle, age: p.age, ageStage: p.ageStage || "adult", ageTimer: p.ageTimer || 0, ageDuration: p.ageDuration || Child.GROWTH_DURATION_SECONDS, spriteKey: p.spriteKey || (p.getSpriteKey ? p.getSpriteKey() : null), wood: p.wood || 0, water: p.water || 0, meat: p.meat || 0, alive: p.alive, isAdult: p.isAdult, partnerIds: p.partners.map((x) => x.id).filter(Boolean), parentIds: p.parents.map((x) => x.id).filter(Boolean), childIds: p.children.map((x) => x.id).filter(Boolean), houseId: p.house ? p.house.id : null, ownedHouseId: p.ownedHouse ? p.ownedHouse.id : null, reservedForFertility: false, reservedForPartnership: false, arrivalMarkerTimer: p.arrivalMarkerTimer || 0, autonomyUnlocked: p === this.hero && p.autonomyUnlocked === true, carrying: { type: p.carrying.type, amount: p.carrying.amount } }; }
    serializeHouse(h) { return { id: h.id, x: h.x, y: h.y, ownerId: h.owner ? h.owner.id : null, occupantIds: h.occupants.map((o) => o.id).filter(Boolean), fertilityInProgress: false, fertilityPhase: null, fertilityTimer: 0, fertilityCooldown: h.fertilityCooldown, storage: { ...h.storage }, lastNightResult: h.lastNightResult, participantIds: [] }; }
    serializeResource(r, type) { return { id: r.id, type, name: r.name, x: r.x, y: r.y, woodRemaining: r.woodRemaining, waterRemaining: r.waterRemaining, meatRemaining: r.meatRemaining, cutFeedbackTimer: r.cutFeedbackTimer || 0, useFeedbackTimer: r.useFeedbackTimer || 0, hitFeedbackTimer: r.hitFeedbackTimer || 0 }; }
    loadFromData(data) { if (!data || !data.world || !data.world.hero) { return false; } const w = data.world; this.tileSize = w.terrain.tileSize; this.terrain = new Terrain(w.terrain.columns, w.terrain.rows, w.terrain.tileSize); this.terrain.tiles = w.terrain.tiles; this.hero = this.createPersonFromData(w.hero); this.villagers = w.villagers.map((v) => this.createPersonFromData(v)); this.houses = w.houses.map((h) => { const house = new House(h.x, h.y, null); house.id = h.id; house.occupants = []; house.fertilityCooldown = h.fertilityCooldown || 0; house.storage = { wood: h.storage?.wood || 0, water: h.storage?.water || 0, meat: h.storage?.meat || 0 }; house.lastNightResult = h.lastNightResult || null; return house; }); this.trees = w.trees.map((t) => { const tree = new Tree(t.x, t.y); tree.id = t.id; tree.woodRemaining = t.woodRemaining; tree.cutFeedbackTimer = t.cutFeedbackTimer || 0; return tree; }); this.waterSources = w.waterSources.map((r) => { const source = new WaterSource(r.x, r.y); source.id = r.id; source.waterRemaining = r.waterRemaining; source.useFeedbackTimer = r.useFeedbackTimer || 0; return source; }); this.animals = w.animals.map((r) => { const animal = new Animal(r.name, r.x, r.y); animal.id = r.id; animal.meatRemaining = r.meatRemaining; animal.hitFeedbackTimer = r.hitFeedbackTimer || 0; return animal; }); this.rebuildReferences(w); this.migrateHouseholdResources(w); this.heroDestination = w.heroDestination; this.getEntities().forEach((person) => this.normalizeInvalidHomeState(person)); this.nextResourceAssignmentIndex = w.nextResourceAssignmentIndex || 0; this.nextAutonomousBuilderIndex = w.nextAutonomousBuilderIndex || 0; this.nextAutonomousPartnerIndex = w.nextAutonomousPartnerIndex || 0; this.nextEntityId = w.nextEntityId || 1; this.nextHouseId = w.nextHouseId || 1; this.nextResourceId = w.nextResourceId || 1; this.arrivalsUsed = w.arrivalsUsed || 0; this.maxArrivals = w.maxArrivals || 3; this.arrivalCooldown = w.arrivalCooldown ?? 300; this.nextArrivalCheckTimer = w.nextArrivalCheckTimer ?? 30; this.arrivalInProgress = false; this.autonomousHouseBuilder = null; this.feedbackMessages = w.feedbackMessages || []; this.eventLog = (w.eventLog || []).slice(-20); this.loadDayNightState(w); this.loadEraProgression(w); return true; }
    loadDayNightState(worldData) {
        this.dayNumber = Math.max(1, Number(worldData.dayNumber) || 1);
        this.dayPhase = ["day", "nightApproaching", "night"].includes(worldData.dayPhase) ? worldData.dayPhase : "day";
        this.phaseTimer = Math.max(0, Number(worldData.phaseTimer) || 0);
        this.timeOfDay = Math.max(0, Number(worldData.timeOfDay) || 0);
        this.nightlyConsumptionProcessed = worldData.nightlyConsumptionProcessed === true;
        if (this.dayPhase === "night" && !this.nightlyConsumptionProcessed) { this.processNightlyConsumption(); }
        if (this.dayPhase !== "day") {
            this.getLivingInhabitants().forEach((person) => {
                if (!this.isValidResidence(person)) { person.state = "nightWithoutHome"; return; }
                const entrance = this.getHouseEntrance(person.house);
                person.x = entrance.x; person.y = entrance.y; person.state = "insideHouse";
            });
        }
    }

    loadEraProgression(worldData) {
        const hasEraData = typeof worldData.worldEra === "string";
        if (!hasEraData) {
            const population = this.getPopulationCount();
            this.worldEra = population >= 32 ? "village" : "tribe";
            this.villageUnlocked = population >= 32;
            this.villageUnlockedAtPopulation = population >= 32 ? population : null;
            this.eraTransitionSequence = population >= 32 ? 1 : 0;
            return;
        }
        this.worldEra = ["tribe", "village", "faith"].includes(worldData.worldEra) ? worldData.worldEra : "tribe";
        this.villageUnlocked = worldData.villageUnlocked === true || this.worldEra !== "tribe";
        this.villageUnlockedAtPopulation = worldData.villageUnlockedAtPopulation ?? (this.villageUnlocked ? this.getPopulationCount() : null);
        this.eraTransitionSequence = Math.max(0, Number(worldData.eraTransitionSequence) || 0);
    }

    createPersonFromData(d) { const isChild = d.type === "child" || d.ageStage === "child"; const person = d.type === "hero" ? new Hero(d.name, d.x, d.y, d) : isChild ? new Child({ name: d.name, x: d.x, y: d.y, gender: d.gender, spriteKey: d.spriteKey }) : new Villager(d); const growth = this.getMigratedChildGrowth(d, isChild); Object.assign(person, { id: d.id, x: d.x, y: d.y, destination: d.destination, state: d.state || "idle", wood: d.wood || 0, water: d.water || 0, meat: d.meat || 0, alive: d.alive !== false, isAdult: d.isAdult, age: d.age, ageStage: d.ageStage, ageTimer: growth.ageTimer, ageDuration: growth.ageDuration, orientation: d.orientation, relationshipStyle: d.relationshipStyle, spriteKey: d.spriteKey, reservedForFertility: false, reservedForPartnership: false, reservedForAutonomousPartnership: false, targetTree: null, targetWaterSource: null, targetAnimal: null, relationshipGoal: null, partnerTarget: null, socialTimer: 0, actionTimer: 0, arrivalMarkerTimer: d.arrivalMarkerTimer || 0, autonomyUnlocked: d.type === "hero" ? (d.autonomyUnlocked ?? false) : false, carrying: { type: d.carrying?.type || null, amount: Math.min(3, d.carrying?.amount || 0) }, carryingCapacity: 3, depositTimer: 0, autonomousAction: false }); return person; }
    migrateHouseholdResources(worldData) {
        if ((worldData.schemaVersion || 1) >= 2) {
            if (this.hero.children.length >= 1) { this.hero.autonomyUnlocked = true; }
            return;
        }
        this.getEntities().forEach((person) => {
            if (person.house === null) { return; }
            person.house.storage.wood += person.wood || 0;
            person.house.storage.water += person.water || 0;
            person.house.storage.meat += person.meat || 0;
            person.wood = 0; person.water = 0; person.meat = 0;
            person.carrying = { type: null, amount: 0 };
        });
        this.hero.autonomyUnlocked = this.hero.children.length >= 1;
    }

    getMigratedChildGrowth(data, isChild) { if (!isChild) { return { ageTimer: data.ageTimer || 0, ageDuration: data.ageDuration }; } const oldDuration = Number(data.ageDuration) > 0 ? Number(data.ageDuration) : Child.GROWTH_DURATION_SECONDS; const oldTimer = Math.max(0, Number(data.ageTimer) || 0); const progress = Math.min(1, oldTimer / oldDuration); return { ageTimer: progress * Child.GROWTH_DURATION_SECONDS, ageDuration: Child.GROWTH_DURATION_SECONDS }; }
    rebuildReferences(w) { const people = new Map(this.getEntities().map((p) => [p.id, p])); const houses = new Map(this.houses.map((h) => [h.id, h])); [w.hero, ...w.villagers].forEach((d) => { const p = people.get(d.id); p.partners = (d.partnerIds || []).map((id) => people.get(id)).filter(Boolean); p.parents = (d.parentIds || []).map((id) => people.get(id)).filter(Boolean); p.children = (d.childIds || []).map((id) => people.get(id)).filter(Boolean); p.house = houses.get(d.houseId) || null; p.ownedHouse = houses.get(d.ownedHouseId) || null; }); w.houses.forEach((d, i) => { const h = this.houses[i]; h.owner = people.get(d.ownerId) || null; h.occupants = (d.occupantIds || []).map((id) => people.get(id)).filter(Boolean); h.participants = []; h.fertilityInProgress = false; h.fertilityPhase = null; h.fertilityTimer = 0; h.pendingChild = null; }); }

    getAnimals() {
        return this.animals;
    }
}
