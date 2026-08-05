import { Entity } from "./Entity.js";

export class Villager extends Entity {
    constructor(name, x, y) {
        super(name, x, y, "#f59e0b");
        this.destination = null;
        this.speed = 90;
        this.idleTimer = 0;
        this.state = "idle";
        this.targetTree = null;
        this.wood = 0;
        this.actionTimer = 0;
    }
}
