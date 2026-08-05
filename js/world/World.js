import { Terrain } from "./Terrain.js";
import { Hero } from "../entities/Hero.js";
import { Villager } from "../entities/Villager.js";
import { Tree } from "../entities/Tree.js";
import { House } from "../entities/House.js";

export class World {
    constructor() {
        this.tileSize = 64;
        this.terrain = new Terrain(16, 10, this.tileSize);
        this.hero = null;
        this.heroDestination = null;
        this.villagers = [];
        this.trees = [];
        this.houses = [];
        this.lastPartnerIneligibilityReason = null;
    }

    initialize(settings = {}) {
        this.terrain.generate();
        this.heroDestination = null;
        this.hero = new Hero(settings.name || "Prescelto", 320, 384, settings);
        this.trees = [];
        this.houses = [];
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
        this.assignVillagersToTrees();
        this.updateTreeFeedback(delta);
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

        while (this.hero.actionTimer >= 1 && this.trees.includes(tree)) {
            this.hero.actionTimer -= 1;
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

        while (villager.actionTimer >= 1 && this.trees.includes(tree)) {
            villager.actionTimer -= 1;
            this.cutTree(villager, tree);
        }
    }

    cutTree(worker, tree) {
        tree.woodRemaining -= 1;
        tree.cutFeedbackTimer = 0.2;
        worker.wood += 1;

        if (tree.woodRemaining <= 0) {
            this.removeTree(tree);
            this.clearTreeWork(worker);
        }

        this.clearVillagerTreeWork(worker);
    }

    clearTreeWork(worker) {
        if (worker === this.hero) {
            this.clearHeroTreeWork();
            return;
        }

        this.clearVillagerTreeWork(worker);
    }

    assignVillagersToTrees() {
        this.trees.forEach((tree) => {
            if (tree.assignedVillager !== null || tree.assignedHero !== null) {
                return;
            }

            const villager = this.getAvailableVillager();

            if (villager === null) {
                return;
            }

            tree.assignedVillager = villager;
            villager.targetTree = tree;
            villager.destination = null;
            villager.actionTimer = 0;
            villager.state = "walking";
        });
    }

    getAvailableVillager() {
        return this.villagers.find((villager) => {
            return villager.targetTree === null &&
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
        villager.destination = null;
        villager.actionTimer = 0;
        villager.idleTimer = this.getRandomVillagerIdleTime();
        villager.state = "idle";
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

    isTreeBeingCutByHero(tree) {
        return tree.assignedHero === this.hero && this.hero.state === "cuttingTree";
    }

    isTreeBeingCutByVillager(tree) {
        return tree.assignedVillager !== null && tree.assignedVillager.state === "cuttingTree";
    }

    removeTree(tree) {
        this.trees = this.trees.filter((existingTree) => existingTree !== tree);
        tree.assignedVillager = null;
        tree.assignedHero = null;
        tree.isBeingCut = false;
    }

    updateTreeFeedback(delta) {
        this.trees.forEach((tree) => {
            tree.cutFeedbackTimer = Math.max(0, tree.cutFeedbackTimer - delta);
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
        this.heroDestination = { x, y };
        this.hero.state = "walking";
    }

    commandHeroToCutTree(tree) {
        if (!this.trees.includes(tree)) {
            return false;
        }

        this.clearHeroPartnerProposal();
        this.clearHeroTreeWork();
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
        this.clearVillagerTreeWork(villager);
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
            !this.overlapsEntity(house, this.hero) &&
            !this.villagers.some((villager) => this.overlapsEntity(house, villager));
    }

    hasChosenHouse() {
        return this.hero !== null && this.hero.house !== null;
    }

    overlapsAnyTree(tree) {
        return this.trees.some((existingTree) => this.overlapsEntity(tree, existingTree));
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
}
