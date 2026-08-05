import { Entity } from "./Entity.js";

export class Animal extends Entity {
    constructor(name, x, y) {
        super(name || "Deer", x, y, "#8b5e34");
        this.meatRemaining = 4;
        this.assignedVillager = null;
        this.assignedHero = null;
        this.isBeingHunted = false;
        this.hitFeedbackTimer = 0;
        this.radius = 18;
    }
}
