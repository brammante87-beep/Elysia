import { Entity } from "./Entity.js";

export class House extends Entity {
    static RESOURCE_COLLECTION_TARGETS = { wood: 30, water: 30, meat: 30, apples: 20 };
    static TRIBE_CAPACITY = 4;
    static VILLAGE_CAPACITY = 6;

    constructor(x, y, owner, resourceCollectionTargets = House.RESOURCE_COLLECTION_TARGETS) {
        super("House", x, y, "#d9b88f");
        this.owner = owner;
        this.occupants = [owner];
        this.radius = 30;
        this.capacity = House.TRIBE_CAPACITY;
        this.upgraded = false;
        this.fertilityInProgress = false;
        this.fertilityPhase = null;
        this.fertilityTimer = 0;
        this.fertilityCooldown = 0;
        this.participants = [];
        this.pendingChild = null;
        this.storage = { wood: 0, water: 0, meat: 0, apples: 0 };
        this.resourceCollectionTargets = { ...House.RESOURCE_COLLECTION_TARGETS, ...resourceCollectionTargets };
        this.depositFeedback = null;
        this.lastNightResult = null;
        this.visualVariant = Math.floor(Math.random() * 4);
    }

    getFoodAmount() {
        // Food is intentionally abstracted here so future food sources can be
        // added without changing the nightly household system.
        return Math.max(0, this.storage.meat || 0) + Math.max(0, this.storage.apples || 0);
    }

    consumeFood(amount) {
        const required = Math.max(0, amount);
        const meatConsumed = Math.min(Math.max(0, this.storage.meat || 0), required);
        this.storage.meat = Math.max(0, (this.storage.meat || 0) - meatConsumed);
        const applesConsumed = Math.min(Math.max(0, this.storage.apples || 0), required - meatConsumed);
        this.storage.apples = Math.max(0, (this.storage.apples || 0) - applesConsumed);
        return { meatConsumed, applesConsumed, totalFoodConsumed: meatConsumed + applesConsumed, missingFood: required - meatConsumed - applesConsumed };
    }
}
