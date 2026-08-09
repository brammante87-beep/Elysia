export class DivineWeaponRenderer {
  constructor(context){this.context=context;}
  render(character,point,width,height,elapsed){const c=this.context,pulse=.7+.3*Math.sin(elapsed*3.2);c.save();c.globalAlpha=.82+.18*pulse;c.shadowColor='#90eaff';c.shadowBlur=7;
    if(character.worldType==='human'){c.strokeStyle='#e9fbff';c.lineWidth=Math.max(3,width*.055);c.beginPath();c.moveTo(point.x+width*.28,point.y-height*.82);c.lineTo(point.x+width*.28,point.y-height*.18);c.stroke();c.strokeStyle='#d9b66d';c.lineWidth=Math.max(3,width*.07);c.beginPath();c.moveTo(point.x+width*.14,point.y-height*.3);c.lineTo(point.x+width*.42,point.y-height*.3);c.stroke();}
    else if(character.species==='deer'){c.strokeStyle='#b9fff1';c.lineWidth=Math.max(2,width*.045);for(const side of[-1,1]){c.beginPath();c.moveTo(point.x+side*width*.1,point.y-height*.65);c.quadraticCurveTo(point.x+side*width*.4,point.y-height*.88,point.x+side*width*.32,point.y-height);c.moveTo(point.x+side*width*.25,point.y-height*.8);c.lineTo(point.x+side*width*.46,point.y-height*.82);c.stroke();}}
    else if(['dog','puppy'].includes(character.species)){c.strokeStyle='#7ff1ff';c.lineWidth=Math.max(3,width*.08);c.beginPath();c.arc(point.x,point.y-height*.43,width*.3,.1,Math.PI-.1);c.stroke();c.fillStyle='#fff2ad';c.beginPath();c.arc(point.x,point.y-height*.18,width*.08,0,Math.PI*2);c.fill();}
    else{c.strokeStyle='#baffff';c.lineWidth=Math.max(2,width*.04);for(let i=0;i<3;i++){c.beginPath();c.moveTo(point.x+width*(.24+i*.06),point.y-height*.28);c.lineTo(point.x+width*(.42+i*.08),point.y-height*.42);c.stroke();}}
    c.restore();}
}
