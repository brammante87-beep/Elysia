export class StaticDecorationLayer {
  render(context, renderer) {
    const scale = renderer.model.constructor.PIXELS_PER_WORLD_UNIT;
    for (const detail of renderer.model.decorations) {
      context.save(); context.translate(detail.x * scale, detail.y * scale);
      this.drawDetail(context, detail, detail.size * scale);
      context.restore();
    }
  }

  drawDetail(context, detail, size) {
    if (detail.kind === 'rock') this.drawRock(context, size, detail.variant);
    else if (detail.kind === 'shrub') this.drawShrub(context, size, detail.variant);
    else if (detail.kind === 'flower') this.drawFlower(context, size, detail.variant);
    else this.drawTuft(context, size, detail.variant);
  }

  drawRock(context, size, variant) {
    context.fillStyle = 'rgba(35,54,37,.2)'; context.beginPath(); context.ellipse(size*.1,size*.22,size*.85,size*.35,0,0,Math.PI*2); context.fill();
    context.fillStyle = ['#78887a','#829080','#6f8175','#929984'][variant]; context.beginPath(); context.moveTo(-size*.65,size*.12); context.lineTo(-size*.25,-size*.55); context.lineTo(size*.5,-size*.35); context.lineTo(size*.7,size*.18); context.closePath(); context.fill();
  }

  drawShrub(context, size, variant) {
    const tones = [['#347a43','#5da155'],['#438544','#75b25a'],['#327450','#5a9b65'],['#4b8d49','#80b755']][variant];
    for (const [dx,dy,radius] of [[-.45,0,.55],[.4,.05,.62],[0,-.28,.72]]) { context.fillStyle=tones[0];context.beginPath();context.arc(dx*size,dy*size,radius*size,0,Math.PI*2);context.fill();context.fillStyle=tones[1];context.beginPath();context.arc((dx-.12)*size,(dy-.16)*size,radius*size*.58,0,Math.PI*2);context.fill(); }
  }

  drawFlower(context, size, variant) {
    context.strokeStyle='#438746';context.lineWidth=Math.max(1,size*.1);context.beginPath();context.moveTo(0,size*.35);context.lineTo(0,-size*.32);context.stroke();context.fillStyle=['#ffe8a3','#f0b9d2','#d4dcf6','#ffd08d'][variant];
    for(let petal=0;petal<4;petal+=1){const angle=petal*Math.PI/2;context.beginPath();context.arc(Math.cos(angle)*size*.25,-size*.34+Math.sin(angle)*size*.25,size*.21,0,Math.PI*2);context.fill();}
    context.fillStyle='#dfa63c';context.beginPath();context.arc(0,-size*.34,size*.14,0,Math.PI*2);context.fill();
  }

  drawTuft(context, size, variant) {
    context.strokeStyle=['#438946','#589b4c','#397d48','#70a750'][variant];context.lineWidth=Math.max(1,size*.1);context.lineCap='round';
    for(const bend of[-.65,-.28,.12,.5]){context.beginPath();context.moveTo(0,size*.3);context.quadraticCurveTo(bend*size,0,bend*size*1.3,-size*(.5+Math.abs(bend)*.2));context.stroke();}
  }
}
