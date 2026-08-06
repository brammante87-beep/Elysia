import { Entity } from "./Entity.js";

export class House extends Entity {
    constructor(x, y, owner) {
        super("House", x, y, "#d9b88f");
        this.owner = owner;
        this.occupants = [owner];
        this.radius = 30;
        this.fertilityInProgress = false;
        this.fertilityPhase = null;
        this.fertilityTimer = 0;
        this.fertilityCooldown = 0;
        this.participants = [];
        this.pendingChild = null;
        this.storage = { wood: 0, water: 0, meat: 0 };
        this.depositFeedback = null;
        this.lastNightResult = null;
    }

    getFoodAmount() {
        // Food is intentionally abstracted here so future food sources can be
        // added without changing the nightly household system.
        return Math.max(0, this.storage.meat || 0);
    }

    consumeFood(amount) {
        const consumed = Math.min(this.getFoodAmount(), Math.max(0, amount));
        this.storage.meat = this.getFoodAmount() - consumed;
        return consumed;
    }
}
