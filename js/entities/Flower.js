import { Entity } from "./Entity.js";

export class Flower extends Entity {
    constructor(x, y, settings = {}) {
        super("Flower", x, y, "#f472b6");
        this.radius = 9;
        this.observerIds = [...new Set(settings.observerIds || [])];
        this.observationProgress = settings.observationProgress || 0;
        this.requiredUniqueObservers = 3;
        this.evolved = settings.evolved === true;
        this.activeObserver = null;
        this.observationFeedbackTimer = 0;
        this.spriteVariant = Number.isInteger(settings.spriteVariant) ? settings.spriteVariant : Math.floor(Math.random() * 3);
    }
}
