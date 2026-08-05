import { Entity } from "./Entity.js";

export class Villager extends Entity {
    constructor(name, x, y) {
        super(name, x, y, "#f59e0b");
    }
}
