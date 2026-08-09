export class CharacterMovement {
  constructor(character) { this.character = character; this.path = []; this.speed = 3.2; }
  follow(path) { this.path = path; }
  update(deltaTime) {
    let remaining = this.speed * (this.character.injured ? .52 : 1) * deltaTime;
    while (remaining > 0 && this.path.length) { const target = this.path[0]; const dx = target.x - this.character.position.x; const dy = target.y - this.character.position.y; const distance = Math.hypot(dx, dy); if (distance <= remaining) { this.character.position = { ...target }; this.path.shift(); remaining -= distance; } else { this.character.position.x += dx / distance * remaining; this.character.position.y += dy / distance * remaining; remaining = 0; } }
    this.character.visualState = this.path.length ? 'walk' : 'idle';
    return this.path.length === 0;
  }
}
