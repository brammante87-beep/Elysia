import { Entity } from "./Entity.js";

export class Child extends Entity {
    constructor(settings = {}) {
        super(settings.name || "Figlio", settings.x || 0, settings.y || 0, "#fbbf24");
        this.ageStage = "child";
        this.ageTimer = 0;
        this.ageDuration = 900;
        this.isAdult = false;
        this.alive = true;
        this.gender = settings.gender || "uomo";
        this.orientation = null;
        this.relationshipStyle = null;
        this.parents = settings.parents || [];
        this.children = [];
        this.partners = [];
        this.house = settings.house || null;
        this.spriteKey = settings.spriteKey || "child_male_01";
        this.state = "childIdle";
        this.destination = null;
        this.speed = 70;
        this.idleTimer = 0;
        this.targetTree = null;
        this.targetWaterSource = null;
        this.targetAnimal = null;
        this.actionTimer = 0;
    }
}
