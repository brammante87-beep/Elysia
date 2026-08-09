import { LionRenderer } from './LionRenderer.js';
export class EnemyRenderer {
  constructor(context) { this.context = context; this.lionRenderer = new LionRenderer(context); }

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

  drawLionArcher(enemy, time) { this.lionRenderer.render({civilian:false,phase:enemy.attackPhase,time}); }

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
