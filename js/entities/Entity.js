export class Entity {
    constructor(name, x, y, color) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 12;
        this.id = null;
    }

    update(delta) {
    }
}
