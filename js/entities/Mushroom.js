import { Entity } from "./Entity.js";

export class Mushroom extends Entity {
    static RADIUS = 9;
    constructor(x, y, data = {}) { super("Mushroom", x, y, "#a9362b"); this.id = data.id ?? null; this.radius = Mushroom.RADIUS; this.alive = data.alive !== false; this.foodValue = Number.isFinite(data.foodValue) ? data.foodValue : 1; }
    update(delta) { void delta; }
    render(context) {
        if (!this.alive) { return; }
        context.fillStyle = "rgba(31,24,18,.25)"; context.beginPath(); context.ellipse(this.x, this.y + 7, 12, 4, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#ead9bd"; context.fillRect(this.x - 3, this.y - 2, 6, 10);
        context.fillStyle = "#a9362b"; context.beginPath(); context.arc(this.x, this.y - 3, 9, Math.PI, Math.PI * 2); context.lineTo(this.x + 9, this.y - 3); context.fill();
        context.fillStyle = "#f5e9cf"; [[-4, -6], [2, -8], [5, -4]].forEach(([x, y]) => { context.beginPath(); context.arc(this.x + x, this.y + y, 1.3, 0, Math.PI * 2); context.fill(); });
    }
    toData() { return { id: this.id, x: this.x, y: this.y, alive: this.alive, foodValue: this.foodValue }; }
    static fromData(data) { return new Mushroom(data.x, data.y, data); }
}
