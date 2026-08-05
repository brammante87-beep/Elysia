import { Entity } from "./Entity.js";

export class Hero extends Entity {
    constructor(name, x, y, personalData = {}) {
        super(name, x, y, "#3b82f6");
        this.gender = personalData.gender || "uomo";
        this.orientation = personalData.orientation || "etero";
        this.relationshipStyle = personalData.relationshipStyle || "monogamo";
        this.selected = true;
        this.speed = 160;
    }
}
