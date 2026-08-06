import { Entity } from "./Entity.js";

export class Hero extends Entity {
    constructor(name, x, y, personalData = {}) {
        super(name, x, y, "#3b82f6");
        this.gender = personalData.gender || "uomo";
        this.orientation = personalData.orientation || "etero";
        this.relationshipStyle = personalData.relationshipStyle || "monogamo";
        this.selected = true;
        this.speed = 160;
        this.targetTree = null;
        this.targetWaterSource = null;
        this.targetAnimal = null;
        this.targetFruitTree = null;
        this.targetFlower = null;
        this.targetMushroom = null;
        this.state = "idle";
        this.actionTimer = 0;
        this.wood = 0;
        this.water = 0;
        this.meat = 0;
        this.house = null;
        this.ownedHouse = null;
        this.partners = [];
        this.parents = [];
        this.children = [];
        this.partnerTarget = null;
        this.socialTimer = 0;
        this.partnerFeedbackTimer = 0;
        this.isAdult = true;
        this.alive = true;
        this.reservedForFertility = false;
        this.autonomyUnlocked = false;
        this.carrying = { type: null, amount: 0 };
        this.carryingCapacity = 3;
        this.depositTimer = 0;
        this.autonomousAction = false;
    }

    getSpriteKey() {
        if (this.gender === "donna") {
            return "chosenFemale";
        }

        if (this.gender === "non-binario") {
            return "chosenNonbinary";
        }

        return "chosenMale";
    }
}
