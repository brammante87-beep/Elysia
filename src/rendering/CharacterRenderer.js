import { HumanIdleAnimation } from './HumanIdleAnimation.js';

export class CharacterRenderer {
  constructor(context, registry, assetLoader) {
    this.context = context;
    this.registry = registry;
    this.assetLoader = assetLoader;
    this.humanIdleAnimation = new HumanIdleAnimation();
  }

  resolve(character) { return this.registry.get(this.registry.resolveId(character)); }

  render(character, point, elapsed, pixelsPerWorldUnit) {
    const definition = this.resolve(character);
    const visualState = this.humanIdleAnimation.state(character, elapsed);
    const animation = definition?.states[visualState] ?? definition?.states.idle;
    if (!animation) return false;
    const animationTime = this.humanIdleAnimation.animationTime(character, elapsed, visualState);
    const frameIndex = Math.floor(animationTime / animation.frameDuration) % animation.frames.length;
    const image = this.assetLoader.get(animation.frames[frameIndex]);
    if (!image) return false;
    const width = definition.worldWidth * pixelsPerWorldUnit;
    const height = definition.worldHeight * pixelsPerWorldUnit;
    this.drawShadow(point, width, height);
    if (character.chosenOne) this.drawChosenMarker(point, width);
    this.context.drawImage(image, point.x - width / 2, point.y - height * 0.82, width, height);
    this.drawDivineEquipment(character, point, width, height);
    if (character.theftIndicator) this.drawTheftIndicator(point, width, height);
    this.drawName(character.name, point, height);
    return true;
  }

  drawTheftIndicator(point, width, height) {
    const context = this.context; const size = Math.max(6, width * .18); const y = point.y - height * .92;
    context.save(); context.strokeStyle = '#df665b'; context.shadowColor = '#5a1717'; context.shadowBlur = 5; context.lineCap = 'round'; context.lineWidth = Math.max(3, width * .065);
    context.beginPath(); context.moveTo(point.x-size, y-size); context.lineTo(point.x+size, y+size); context.moveTo(point.x+size, y-size); context.lineTo(point.x-size, y+size); context.stroke(); context.restore();
  }

  drawDivineEquipment(character, point, width, height) {
    const context=this.context; context.save();
    if (character.isExalted) { context.strokeStyle=character.worldType==='beast'?'#a9e6b0':'#e5bc68'; context.lineWidth=Math.max(3,width*.08); context.beginPath(); context.arc(point.x,point.y-height*.42,width*.34,.15,Math.PI-.15); context.stroke(); }
    if (character.isArmed) { context.strokeStyle=character.worldType==='beast'?'#8be0c2':'#a87947'; context.lineWidth=Math.max(3,width*.07); context.beginPath(); if(character.worldType==='human'){context.moveTo(point.x+width*.3,point.y-height*.65);context.lineTo(point.x+width*.5,point.y+height*.02);}else{context.arc(point.x,point.y-height*.32,width*.43,0,Math.PI*2);} context.stroke(); }
    if (character.hasShield) { context.strokeStyle='rgba(154,221,255,.72)'; context.shadowColor='#9fe9ff'; context.shadowBlur=10; context.lineWidth=2; context.beginPath(); context.ellipse(point.x,point.y-height*.35,width*.58,height*.58,0,0,Math.PI*2); context.stroke(); }
    context.restore();
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
