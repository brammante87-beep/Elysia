export class LightningRenderer {
  constructor(context, worldPoint) { this.context=context; this.worldPoint=worldPoint; }
  render(effect) {
    const c=this.context,p=this.worldPoint(effect.position),t=effect.age/(effect.duration??1.25),strike=Math.max(0,Math.min(1,(t-.16)/.18)),fade=Math.max(0,1-Math.max(0,t-.62)/.38);
    c.save();c.globalCompositeOperation='screen';c.globalAlpha=fade;
    if(t<.28){const gather=c.createRadialGradient(p.x,p.y-180,2,p.x,p.y-180,90);gather.addColorStop(0,'rgba(235,248,255,.9)');gather.addColorStop(1,'rgba(91,147,255,0)');c.fillStyle=gather;c.fillRect(p.x-95,p.y-275,190,190);}
    if(strike>0){const points=this.path(p,effect.characterId??'target');c.shadowColor='#5b9dff';c.shadowBlur=22;c.strokeStyle='rgba(82,145,255,.72)';c.lineWidth=12;c.beginPath();this.trace(c,points);c.stroke();c.shadowBlur=7;c.strokeStyle='#f8fdff';c.lineWidth=3.2;c.beginPath();this.trace(c,points);c.stroke();for(let i=2;i<points.length-1;i+=2)this.branch(points[i],i,p);}
    if(t>.3){const impact=Math.max(0,1-(t-.3)*3.2),g=c.createRadialGradient(p.x,p.y,1,p.x,p.y,58);g.addColorStop(0,`rgba(255,255,255,${impact})`);g.addColorStop(.35,`rgba(126,190,255,${impact*.6})`);g.addColorStop(1,'rgba(60,115,255,0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,58,0,Math.PI*2);c.fill();for(let i=0;i<8;i++){const a=i*2.399+effect.age*3,r=12+(t-.3)*70;c.fillStyle='#bce7ff';c.beginPath();c.arc(p.x+Math.cos(a)*r,p.y-5+Math.sin(a)*r*.35,1.8,0,Math.PI*2);c.fill();}}
    c.restore();
  }
  path(p,seed){let hash=[...String(seed)].reduce((n,ch)=>(n*31+ch.charCodeAt(0))|0,17),points=[{x:p.x-20,y:-15}];for(let i=1;i<8;i++){hash=(hash*1664525+1013904223)|0;points.push({x:p.x+(((hash>>>8)%31)-15)*(1-i/9),y:-15+(p.y+15)*i/8});}points.push(p);return points;}
  trace(c,points){c.moveTo(points[0].x,points[0].y);for(const point of points.slice(1))c.lineTo(point.x,point.y);}
  branch(point,index,target){const c=this.context,direction=index%4<2?-1:1;c.moveTo(point.x,point.y);c.quadraticCurveTo(point.x+direction*22,point.y+14,point.x+direction*(35+index*2),Math.min(target.y,point.y+35));}
}
