import { Entity } from "./Entity.js";

export class Villager extends Entity {
    constructor(name, x, y, personalData = {}) {
        super(name, x, y, "#f59e0b");
        this.gender = personalData.gender || "uomo";
        this.orientation = personalData.orientation || "etero";
        this.relationshipStyle = personalData.relationshipStyle || "monogamo";
        this.partners = [];
        this.house = null;
        this.isAdult = true;
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
