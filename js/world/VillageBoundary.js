export class VillageBoundary {
    constructor(bounds, gate) {
        this.bounds = { ...bounds };
        this.gate = { ...gate, open: true };
        this.postSpacing = 12;
        this.thickness = 8;
    }

    isInside(x, y) {
        return x >= this.bounds.minX && x <= this.bounds.maxX && y >= this.bounds.minY && y <= this.bounds.maxY;
    }

    getGateWaypoints(fromInside) {
        const offset = 18;
        const gate = this.gate;
        if (gate.side === "bottom") {
            return fromInside ? [{ x: gate.x, y: gate.y - offset }, { x: gate.x, y: gate.y + offset }] : [{ x: gate.x, y: gate.y + offset }, { x: gate.x, y: gate.y - offset }];
        }
        if (gate.side === "top") {
            return fromInside ? [{ x: gate.x, y: gate.y + offset }, { x: gate.x, y: gate.y - offset }] : [{ x: gate.x, y: gate.y - offset }, { x: gate.x, y: gate.y + offset }];
        }
        const direction = gate.side === "right" ? 1 : -1;
        return fromInside ? [{ x: gate.x - direction * offset, y: gate.y }, { x: gate.x + direction * offset, y: gate.y }] : [{ x: gate.x + direction * offset, y: gate.y }, { x: gate.x - direction * offset, y: gate.y }];
    }

    crossesSolidSection(from, to) {
        if (this.isInside(from.x, from.y) === this.isInside(to.x, to.y)) { return false; }
        const half = this.gate.width / 2;
        if ((this.gate.side === "top" || this.gate.side === "bottom") && Math.abs(to.x - this.gate.x) <= half) { return false; }
        if ((this.gate.side === "left" || this.gate.side === "right") && Math.abs(to.y - this.gate.y) <= half) { return false; }
        return true;
    }
}
