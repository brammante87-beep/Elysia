import { Entity } from "./Entity.js";

export class Tree extends Entity {
    constructor(x, y) {
        super("Tree", x, y, "#2f8f46");
        this.woodRemaining = 4;
        this.assignedVillager = null;
        this.isBeingCut = false;
        this.cutFeedbackTimer = 0;
        this.radius = 18;
    }
}
