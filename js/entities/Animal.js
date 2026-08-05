import { Entity } from "./Entity.js";

export class Animal extends Entity {
    constructor(name, x, y) {
        super(name, x, y, "#8b5e34");
    }
}
