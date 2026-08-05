import { Entity } from "./Entity.js";

export class House extends Entity {
    constructor(x, y, owner) {
        super("House", x, y, "#d9b88f");
        this.owner = owner;
        this.occupants = [owner];
        this.radius = 30;
    }
}
