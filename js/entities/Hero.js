import { Entity } from "./Entity.js";

export class Hero extends Entity {
    constructor(name, x, y) {
        super(name, x, y, "#3b82f6");
        this.selected = true;
        this.speed = 160;
    }
}
