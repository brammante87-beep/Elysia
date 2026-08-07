export class WorldEntity {
  constructor(data) { this.id = data.id; this.position = { ...data.position }; this.alive = data.alive ?? true; this.collisionRadius = data.collisionRadius; this.kind = data.kind; }
  toJSON() { return { ...this, position: { ...this.position } }; }
}
