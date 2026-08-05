export class WorldScene{
 constructor(canvas){
   this.c=canvas;
   this.ctx=canvas.getContext("2d");
   this.cam={x:0,y:0};
   this.keys={};
   this.villagers=[
     {name:"Aiden",x:300,y:250},
     {name:"Leo",x:380,y:300},
     {name:"Emma",x:460,y:220}
   ];
   this.trees=[...Array(120)].map(()=>({
      x:Math.random()*3000,
      y:Math.random()*3000
   }));
   addEventListener("keydown",e=>this.keys[e.key]=true);
   addEventListener("keyup",e=>this.keys[e.key]=false);
 }
 start(){
   const loop=()=>{
      this.update();
      this.draw();
      requestAnimationFrame(loop);
   };
   loop();
 }
 update(){
   if(this.keys["w"]||this.keys["ArrowUp"])this.cam.y-=6;
   if(this.keys["s"]||this.keys["ArrowDown"])this.cam.y+=6;
   if(this.keys["a"]||this.keys["ArrowLeft"])this.cam.x-=6;
   if(this.keys["d"]||this.keys["ArrowRight"])this.cam.x+=6;
   this.villagers.forEach(v=>{
      v.x+=Math.random()*0.8-0.4;
      v.y+=Math.random()*0.8-0.4;
   });
 }
 draw(){
   const ctx=this.ctx,w=this.c.width,h=this.c.height;
   ctx.clearRect(0,0,w,h);
   let g=ctx.createLinearGradient(0,0,0,h);
   g.addColorStop(0,"#84d86e");
   g.addColorStop(1,"#57994a");
   ctx.fillStyle=g;
   ctx.fillRect(0,0,w,h);

   ctx.strokeStyle="rgba(255,255,255,.05)";
   for(let x=(-this.cam.x)%64;x<w;x+=64){
      ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();
   }
   for(let y=(-this.cam.y)%64;y<h;y+=64){
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();
   }

   this.trees.forEach(t=>{
      const x=t.x-this.cam.x,y=t.y-this.cam.y;
      if(x<-20||y<-20||x>w+20||y>h+20)return;
      ctx.fillStyle="#6b4423";
      ctx.fillRect(x-2,y,4,10);
      ctx.beginPath();
      ctx.arc(x,y,10,0,Math.PI*2);
      ctx.fillStyle="#2d8b3c";
      ctx.fill();
   });

   this.villagers.forEach(v=>{
      const x=v.x-this.cam.x,y=v.y-this.cam.y;
      ctx.fillStyle="#ffd8b0";
      ctx.beginPath();ctx.arc(x,y-8,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#3b82f6";
      ctx.fillRect(x-4,y-4,8,12);
      ctx.fillStyle="white";
      ctx.font="12px Arial";
      ctx.fillText(v.name,x-16,y-14);
   });

   ctx.fillStyle="rgba(0,0,0,.45)";
   ctx.fillRect(10,10,230,70);
   ctx.fillStyle="white";
   ctx.fillText("ELYSIA α0.0.3",20,30);
   ctx.fillText("WASD/Frecce: muovi la camera",20,50);
   ctx.fillText("Mondo: 3000 x 3000",20,68);
 }
}
