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
        this.state = "idle";
        this.actionTimer = 0;
        this.wood = 0;
        this.house = null;
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
