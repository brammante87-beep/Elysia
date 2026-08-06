import { Entity } from "./Entity.js";

export class FruitTree extends Entity {
    static MAX_APPLES = 6;
    static REGROWTH_INTERVAL = 30;

    constructor(x, y, settings = {}) {
        super("Fruit Tree", x, y, "#3f7d3b");
        this.radius = 25;
        this.apples = Math.max(0, Math.min(FruitTree.MAX_APPLES, settings.apples ?? 3));
        this.maxApples = FruitTree.MAX_APPLES;
        this.regrowthInterval = FruitTree.REGROWTH_INTERVAL;
        this.regrowthTimer = Math.max(0, settings.regrowthTimer ?? this.regrowthInterval);
        this.assignedWorker = null;
        this.harvestFeedbackTimer = 0;
        this.spriteVariant = Number.isInteger(settings.spriteVariant) ? settings.spriteVariant : Math.floor(Math.random() * 3);
    }

    update(delta) {
        this.harvestFeedbackTimer = Math.max(0, this.harvestFeedbackTimer - delta);
        if (this.apples >= this.maxApples) { this.regrowthTimer = this.regrowthInterval; return; }
        this.regrowthTimer -= delta;
        if (this.regrowthTimer <= 0) { this.apples += 1; this.regrowthTimer = this.regrowthInterval; }
    }
}
