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
    }
}
