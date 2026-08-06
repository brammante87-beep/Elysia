import { Entity } from "./Entity.js";

export class Child extends Entity {
    static GROWTH_DURATION_SECONDS = 300;

    constructor(settings = {}) {
        super(settings.name || "Figlio", settings.x || 0, settings.y || 0, "#fbbf24");
        this.ageStage = "child";
        this.ageTimer = 0;
        this.ageDuration = Child.GROWTH_DURATION_SECONDS;
        this.isAdult = false;
        this.alive = true;
        this.gender = settings.gender || "uomo";
        this.orientation = null;
        this.relationshipStyle = null;
        this.parents = settings.parents || [];
        this.children = [];
        this.partners = [];
        this.relationshipGoal = null;
        this.partnerTarget = null;
        this.socialTimer = 0;
        this.reservedForAutonomousPartnership = false;
        this.house = settings.house || null;
        this.ownedHouse = null;
        this.spriteKey = settings.spriteKey || "child_male_01";
        this.state = "childIdle";
        this.destination = null;
        this.speed = 70;
        this.idleTimer = 0;
        this.targetTree = null;
        this.targetWaterSource = null;
        this.targetAnimal = null;
        this.actionTimer = 0;
        this.wood = 0;
        this.water = 0;
        this.meat = 0;
        this.houseSite = null;
        this.houseBuildTimer = 0;
        this.carrying = { type: null, amount: 0 };
        this.carryingCapacity = 3;
        this.depositTimer = 0;
    }
}
