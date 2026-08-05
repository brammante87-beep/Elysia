import { Entity } from "./Entity.js";

export class Villager extends Entity {
    constructor(settings = {}) {
        super(settings.name || "Villager", settings.x || 0, settings.y || 0, "#f59e0b");
        this.gender = settings.gender || "uomo";
        this.orientation = settings.orientation || "etero";
        this.relationshipStyle = settings.relationshipStyle || "monogamo";
        this.age = settings.age || 18;
        this.isAdult = this.age >= 18;
        this.spriteKey = settings.spriteKey || "villager_male_01";
        this.partners = [];
        this.house = null;
        this.alive = true;
        this.parents = [];
        this.children = [];
        this.reservedForPartnership = false;
        this.partnerFeedbackTimer = 0;
        this.destination = null;
        this.speed = 90;
        this.idleTimer = 0;
        this.state = "idle";
        this.targetTree = null;
        this.wood = 0;
        this.actionTimer = 0;
    }
}
