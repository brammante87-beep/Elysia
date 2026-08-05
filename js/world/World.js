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
        this.villagers.forEach((villager) => {
            villager.idleTimer = this.getRandomVillagerIdleTime();
        });
    }

    update(delta) {
        this.updateHero(delta);
        this.updateFertilityEvents(delta);
        this.updateChildren(delta);
        this.updateAutonomousHouseBuilding(delta);
        this.updateAutonomousPartnerSearch(delta);
        this.assignVillagersToResources();
        this.updateResourceFeedback(delta);
        this.updatePartnerFeedback(delta);

        this.villagers.forEach((villager) => {
            this.updateVillager(villager, delta);
        });
    }

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
            villager.wood >= 3 &&
            villager.house === null &&
            villager.ownedHouse === null &&
            !villager.reservedForFertility &&
            !villager.reservedForPartnership &&
            villager.state !== "insideHouse" &&
            !this.isVillagerBuildingHouse(villager) &&
            villager.targetTree === null &&
            villager.targetWaterSource === null &&
            villager.targetAnimal === null;
    }

    reserveAutonomousHouseBuilder(builder) {
        const site = this.findAutonomousHouseSite(builder);

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
            builder.wood >= 3 &&
            builder.house === null &&
            builder.ownedHouse === null &&
            builder.houseSite !== null &&
            this.houses.length < this.getMaximumHouseCountForPopulation(this.getPopulationCount()) &&
            this.canPlaceAutonomousHouseAt(builder.houseSite.x, builder.houseSite.y, builder);
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

        const house = new House(builder.houseSite.x, builder.houseSite.y, builder);
        this.houses.push(house);
        builder.wood -= 3;
        builder.house = house;
        builder.ownedHouse = house;
        this.releaseAutonomousHouseBuilder(builder);
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
        return villager.wood >= 3 && villager.water >= 3 && villager.meat >= 3;
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

        owner.wood -= 3;
        owner.water -= 3;
        owner.meat -= 3;
        owner.partners.push(candidate);
        candidate.partners.push(owner);
        candidate.house = owner.ownedHouse;

        if (!owner.ownedHouse.occupants.includes(candidate)) {
            owner.ownedHouse.occupants.push(candidate);
        }

        owner.partnerFeedbackTimer = 1.5;
        candidate.partnerFeedbackTimer = 1.5;
        this.cancelAutonomousPartnerSearch(owner, candidate);

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

    findAutonomousHouseSite(builder) {
        for (let attempt = 0; attempt < 50; attempt += 1) {
            const site = this.getRandomGrassHouseSite();

            if (this.canPlaceAutonomousHouseAt(site.x, site.y, builder)) {
                return site;
            }
        }

        return null;
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

        return this.contains(x, y) &&
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

        return livingOccupants.reduce((totals, occupant) => {
            totals.wood += occupant.wood || 0;
            totals.water += occupant.water || 0;
            totals.meat += occupant.meat || 0;
            totals.occupants += 1;
            return totals;
        }, { wood: 0, water: 0, meat: 0, occupants: 0 });
    }

    updateHero(delta) {
        if (this.hero.reservedForFertility) {
            return;
        }

        if (this.hero.partnerTarget !== null) {
            this.updateHeroPartnerProposal(delta);
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
            this.hero.state = "idle";
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
        worker.wood += 1;

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
        worker.water += 1;
        if (source.waterRemaining <= 0) { this.removeWaterSource(source); }
        this.clearWaterWork(worker);
    }

    huntAnimal(worker, animal) {
        animal.meatRemaining -= 1;
        animal.hitFeedbackTimer = 0.2;
        worker.meat += 1;
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
        const villager = this.getAvailableVillager();

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

    getAvailableVillager() {
        return this.villagers.find((villager) => {
            return villager.targetTree === null &&
                villager.targetWaterSource === null &&
                villager.targetAnimal === null &&
                !this.isVillagerBuildingHouse(villager) &&
                !villager.reservedForPartnership &&
                !villager.reservedForAutonomousPartnership &&
                !villager.reservedForFertility &&
                villager.relationshipGoal === null &&
                villager.isAdult &&
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
        this.hero.state = "walking";
    }

    commandHeroToCutTree(tree) {
        if (!this.trees.includes(tree)) {
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

        return true;
    }

    releaseTreeFromVillager(tree) {
        if (tree.assignedVillager === null) {
            return;
        }

        this.clearVillagerTreeWork(tree.assignedVillager);
    }


    commandHeroToCollectWater(source) {
        if (!this.waterSources.includes(source)) { return false; }
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
        return true;
    }

    commandHeroToHuntAnimal(animal) {
        if (!this.animals.includes(animal)) { return false; }
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
        villager.reservedForPartnership = true;
        villager.destination = null;
        villager.state = "awaitingPartner";

        return true;
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

        this.hero.wood -= 3;
        this.hero.water -= 3;
        this.hero.meat -= 3;
        this.hero.partners.push(villager);
        villager.partners.push(this.hero);
        villager.house = this.hero.house;

        if (!this.hero.house.occupants.includes(villager)) {
            this.hero.house.occupants.push(villager);
        }

        this.hero.partnerFeedbackTimer = 1.5;
        villager.partnerFeedbackTimer = 1.5;
        this.clearHeroPartnerProposal();

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

        if (this.hero.wood < 3 || this.hero.water < 3 || this.hero.meat < 3) {
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
        return (this.hero === null ? 0 : 1) + this.villagers.length;
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

        this.trees.push(new Tree(x, y));

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

        this.houses.push(house);
        this.hero.house = house;
        this.hero.ownedHouse = house;

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
        this.waterSources.push(new WaterSource(x, y));
        return true;
    }

    canPlaceWaterSourceAt(x, y) {
        const source = new WaterSource(x, y);
        return this.canPlaceResourceAt(source, x, y);
    }

    addAnimalAt(x, y) {
        if (!this.canPlaceAnimalAt(x, y)) { return false; }
        this.animals.push(new Animal("Deer", x, y));
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

    getAnimals() {
        return this.animals;
    }
}
