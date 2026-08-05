import { Entity } from "./Entity.js";

export class WaterSource extends Entity {
    constructor(x, y) {
        super("Water Source", x, y, "#38bdf8");
        this.waterRemaining = 20;
        this.assignedVillager = null;
        this.assignedHero = null;
        this.isBeingUsed = false;
        this.useFeedbackTimer = 0;
        this.radius = 18;
    }
}
