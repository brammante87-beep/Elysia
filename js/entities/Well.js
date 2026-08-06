import { Entity } from "./Entity.js";

export class Well extends Entity {
    constructor(x, y) {
        super("Well", x, y, "#8c7358");
        this.radius = 24;
        this.maximumUsers = 2;
        this.assignedWorkers = [];
        this.useFeedbackTimer = 0;
    }

    canAssign(worker) {
        return this.assignedWorkers.includes(worker) || this.assignedWorkers.length < this.maximumUsers;
    }

    assign(worker) {
        if (!this.canAssign(worker)) { return false; }
        if (!this.assignedWorkers.includes(worker)) { this.assignedWorkers.push(worker); }
        return true;
    }

    release(worker) { this.assignedWorkers = this.assignedWorkers.filter((candidate) => candidate !== worker); }
}
