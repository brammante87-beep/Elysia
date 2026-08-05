import { Terrain } from "./Terrain.js";
import { Hero } from "../entities/Hero.js";
import { Villager } from "../entities/Villager.js";
import { Tree } from "../entities/Tree.js";
import { House } from "../entities/House.js";
import { WaterSource } from "../entities/WaterSource.js";
import { Animal } from "../entities/Animal.js";

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
        this.assignVillagersToResources();
        this.updateResourceFeedback(delta);
        this.updatePartnerFeedback(delta);

        this.villagers.forEach((villager) => {
            this.updateVillager(villager, delta);
        });
    }

    updateHero(delta) {
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
        if (villager.reservedForPartnership) {
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
                !villager.reservedForPartnership &&
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
        this.clearVillagerTreeWork(villager);
        this.clearVillagerWaterWork(villager);
        this.clearVillagerAnimalWork(villager);
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
            return Math.hypot(villager.x - x, villager.y - y) <= villager.radius;
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

        if (!this.isOrientationCompatible(this.hero, villager)) {
            return "Non compatibile con l'orientamento";
        }

        return null;
    }

    isCloseRelative(first, second) {
        return first.parents.includes(second) ||
            first.children.includes(second) ||
            second.parents.includes(first) ||
            second.children.includes(first);
    }

    isOrientationCompatible(hero, villager) {
        if (hero.orientation === "pansessuale") {
            return true;
        }

        if (hero.gender === "non-binario") {
            return true;
        }

        if (hero.orientation === "bisessuale") {
            return villager.gender === "uomo" || villager.gender === "donna";
        }

        if (hero.orientation === "gay-lesbica") {
            return villager.gender === hero.gender;
        }

        if (hero.orientation === "etero") {
            return (hero.gender === "uomo" && villager.gender === "donna") ||
                (hero.gender === "donna" && villager.gender === "uomo");
        }

        return false;
    }

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
