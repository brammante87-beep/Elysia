export class EnemyRenderer {
  constructor(context) { this.context = context; }

  render(enemy, point, scale, time) {
    const context = this.context;
    context.save();
    context.translate(point.x, point.y);
    context.scale(enemy.facing * scale / 34, scale / 34);
    if (enemy.typeId === 'lionArcher') this.drawLionArcher(enemy, time);
    else if (enemy.typeId === 'blondWarrior') this.drawWorldIIWarrior(enemy, time);
    else this.drawDolphinGunner(enemy, time);
    context.restore();
  }

  drawLionArcher(enemy, time) {
    const c=this.context, walk=Math.sin(time*6)*3, tail=Math.sin(time*3.2)*8, draw=['draw','aim'].includes(enemy.attackPhase), hit=enemy.attackPhase==='hit'?-.18:0;
    c.rotate(hit); c.lineCap='round';
    c.strokeStyle='#9b6430';c.lineWidth=7;c.beginPath();c.moveTo(-10,-27);c.bezierCurveTo(-30,-29,-34,-10,-23,tail);c.stroke();c.fillStyle='#4b2530';c.beginPath();c.ellipse(-23,tail,6,10,.3,0,Math.PI*2);c.fill();
    c.strokeStyle='#8c623c';c.lineWidth=7;c.beginPath();c.moveTo(-7,-8);c.lineTo(-9+walk,10);c.moveTo(7,-8);c.lineTo(9-walk,10);c.stroke();
    c.fillStyle='#392937';c.beginPath();c.moveTo(-15,-37);c.lineTo(14,-37);c.lineTo(12,-7);c.lineTo(-12,-7);c.closePath();c.fill();
    c.fillStyle='#a87338';c.fillRect(-14,-35,28,8);c.strokeStyle='#dfbc6c';c.lineWidth=2;c.strokeRect(-12,-32,24,19);
    c.fillStyle='#6c3b2d';c.beginPath();c.moveTo(-16,-37);c.lineTo(-9,-45);c.lineTo(-2,-34);c.fill();c.beginPath();c.moveTo(16,-37);c.lineTo(9,-45);c.lineTo(2,-34);c.fill();
    c.fillStyle='#6f3826';c.beginPath();c.arc(0,-51,20,0,Math.PI*2);c.fill();
    c.fillStyle='#c88a43';c.beginPath();c.moveTo(-11,-65);c.lineTo(-5,-75);c.lineTo(0,-64);c.moveTo(11,-65);c.lineTo(5,-75);c.lineTo(0,-64);c.fill();c.beginPath();c.ellipse(0,-53,14,17,0,0,Math.PI*2);c.fill();
    c.fillStyle='#e2b56f';c.beginPath();c.ellipse(7,-49,12,8,0,0,Math.PI*2);c.fill();c.fillStyle='#3a211b';c.beginPath();c.arc(15,-52,3,0,Math.PI*2);c.fill();c.fillStyle='#f3d66f';c.beginPath();c.arc(5,-59,2,0,Math.PI*2);c.fill();
    c.strokeStyle='#d19a45';c.lineWidth=4;c.beginPath();c.arc(23,-28,23,-Math.PI/2,Math.PI/2);c.stroke();c.strokeStyle='#f6e1b5';c.lineWidth=1.5;c.beginPath();c.moveTo(23,-51);c.lineTo(draw?0:23,-28);c.lineTo(23,-5);c.stroke();
    c.strokeStyle='#bd8142';c.lineWidth=6;c.beginPath();c.moveTo(-8,-32);c.lineTo(draw?0:-2,-28);c.moveTo(8,-32);c.lineTo(draw?1:18,-28);c.stroke();
    c.fillStyle='#5a3424';c.fillRect(-19,-39,6,27);c.strokeStyle='#eee0b5';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.moveTo(-16,-38+i);c.lineTo(-10,-57+i);c.stroke();}
  }

  drawWorldIIWarrior(enemy, time) {
    const c=this.context, step=Math.sin(time*6)*4, attack=enemy.attackPhase==='thrust'?16:0, reaction=enemy.attackPhase==='hit'?5:0;c.translate(-reaction,Math.sin(time*2.2));
    c.strokeStyle='#33495d';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(-7,-10);c.lineTo(-10+step,11);c.moveTo(7,-10);c.lineTo(10-step,11);c.stroke();
    c.fillStyle='#17354c';c.beginPath();c.moveTo(-17,-43);c.lineTo(17,-43);c.lineTo(13,-8);c.lineTo(-13,-8);c.closePath();c.fill();
    c.fillStyle='#d5e2e8';c.beginPath();c.moveTo(-15,-40);c.lineTo(-22,-28);c.lineTo(-13,-22);c.lineTo(0,-36);c.lineTo(13,-22);c.lineTo(22,-28);c.lineTo(15,-40);c.fill();
    c.fillStyle='#4e9bb5';c.fillRect(-16,-26,32,7);c.fillStyle='#e0b557';c.beginPath();c.arc(0,-22,4,0,Math.PI*2);c.fill();
    c.fillStyle='#edc3a1';c.beginPath();c.ellipse(0,-54,12,15,0,0,Math.PI*2);c.fill();
    c.fillStyle='#f0d369';c.beginPath();c.moveTo(-13,-58);c.quadraticCurveTo(-5,-75,14,-61);c.lineTo(10,-51);c.lineTo(6,-63);c.lineTo(1,-50);c.lineTo(-4,-64);c.lineTo(-9,-51);c.closePath();c.fill();
    c.fillStyle='#33506b';c.beginPath();c.moveTo(-18,-47);c.lineTo(-12,-66);c.lineTo(-7,-44);c.moveTo(18,-47);c.lineTo(12,-66);c.lineTo(7,-44);c.fill();
    c.strokeStyle='#8d6038';c.lineWidth=4;c.beginPath();c.moveTo(-4,-31);c.lineTo(35+attack,-35);c.stroke();c.fillStyle='#dceaf0';c.beginPath();c.moveTo(43+attack,-35);c.lineTo(32+attack,-43);c.lineTo(35+attack,-35);c.lineTo(32+attack,-27);c.closePath();c.fill();
  }

  drawDolphinGunner(enemy, time) {
    const c=this.context, hover=Math.sin(time*3.4+enemy.visualVariant)*4, swim=Math.sin(time*4), charge=enemy.attackPhase==='charge'||enemy.attackPhase==='aim';c.translate(0,-25+hover);c.rotate(Math.sin(time*2.1)*.035+(enemy.attackPhase==='hit'?.12:0));
    c.fillStyle='rgba(58,238,255,.2)';c.beginPath();c.ellipse(0,18,34+swim,8,0,0,Math.PI*2);c.fill();
    c.strokeStyle='#293b59';c.lineWidth=8;c.beginPath();c.ellipse(-2,1,29,14,0,0,Math.PI*2);c.stroke();c.strokeStyle='#ae55da';c.lineWidth=3;c.beginPath();c.ellipse(-2,1,29,14,0,0,Math.PI*2);c.stroke();
    c.fillStyle='#5798b5';c.beginPath();c.moveTo(-32,-9);c.bezierCurveTo(-15,-27,18,-25,35,-10);c.lineTo(53,-7);c.lineTo(35,-2);c.bezierCurveTo(12,13,-18,10,-32,-2);c.closePath();c.fill();
    c.fillStyle='#8bc8d8';c.beginPath();c.moveTo(29,-13);c.quadraticCurveTo(48,-17,59,-8);c.quadraticCurveTo(45,-3,31,-5);c.fill();
    c.fillStyle='#397892';c.beginPath();c.moveTo(-28,-8);c.lineTo(-48,-24-swim);c.lineTo(-43,-7);c.lineTo(-50,9+swim);c.closePath();c.fill();c.beginPath();c.moveTo(-4,-20);c.lineTo(-16,-39);c.lineTo(6,-22);c.fill();c.beginPath();c.moveTo(3,5);c.lineTo(17,22+swim);c.lineTo(-4,10);c.fill();
    c.fillStyle='#18394d';c.beginPath();c.arc(28,-12,2.5,0,Math.PI*2);c.fill();
    for(const x of[-19,18]){c.fillStyle='#27334c';c.beginPath();c.roundRect(x-7,-2,14,16,4);c.fill();c.fillStyle=charge?'#fff5f8':'#62efff';c.shadowColor='#ec5cea';c.shadowBlur=charge?18:8;c.beginPath();c.arc(x+8,7,5+(charge?2:0),0,Math.PI*2);c.fill();}c.shadowBlur=0;
  }
}
