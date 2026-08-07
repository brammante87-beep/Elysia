export class CharacterRenderer {
  constructor(context, registry, assetLoader) {
    this.context = context;
    this.registry = registry;
    this.assetLoader = assetLoader;
  }

  resolve(character) { return this.registry.get(this.registry.resolveId(character)); }

  render(character, point, elapsed, pixelsPerWorldUnit) {
    const definition = this.resolve(character);
    const animation = definition?.states[character.visualState] ?? definition?.states.idle;
    if (!animation) return false;
    const frameIndex = Math.floor(elapsed / animation.frameDuration) % animation.frames.length;
    const image = this.assetLoader.get(animation.frames[frameIndex]);
    if (!image) return false;
    const width = definition.worldWidth * pixelsPerWorldUnit;
    const height = definition.worldHeight * pixelsPerWorldUnit;
    this.drawShadow(point, width, height);
    if (character.chosenOne) this.drawChosenMarker(point, width);
    this.context.drawImage(image, point.x - width / 2, point.y - height * 0.82, width, height);
    this.drawName(character.name, point, height);
    return true;
  }

  drawShadow(point, width, height) {
    const context = this.context;
    context.save(); context.fillStyle = 'rgba(8, 22, 25, 0.25)'; context.filter = `blur(${Math.max(1, height * 0.035)}px)`;
    context.beginPath(); context.ellipse(point.x, point.y, width * 0.28, height * 0.075, 0, 0, Math.PI * 2); context.fill(); context.restore();
  }

  drawChosenMarker(point, width) {
    const context = this.context; const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, width * 0.48);
    glow.addColorStop(0, 'rgba(255,241,164,.38)'); glow.addColorStop(0.55, 'rgba(255,223,119,.13)'); glow.addColorStop(1, 'rgba(255,223,119,0)');
    context.save(); context.fillStyle = glow; context.beginPath(); context.ellipse(point.x, point.y, width * 0.48, width * 0.2, 0, 0, Math.PI * 2); context.fill(); context.restore();
  }

  drawName(name, point, height) {
    const context = this.context; const y = point.y + height * 0.2;
    context.save(); context.textAlign = 'center'; context.font = `600 ${Math.max(11, height * 0.22)}px system-ui, sans-serif`;
    context.lineWidth = 4; context.strokeStyle = 'rgba(8,18,18,.75)'; context.strokeText(name, point.x, y);
    context.fillStyle = '#fff5d4'; context.fillText(name, point.x, y); context.restore();
  }
}
