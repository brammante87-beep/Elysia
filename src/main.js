import { WorldScene } from "./scenes/WorldScene.js";

const canvas=document.getElementById("game");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

const scene=new WorldScene(canvas);
scene.start();

window.addEventListener("resize",()=>{
 canvas.width=window.innerWidth;
 canvas.height=window.innerHeight;
});
