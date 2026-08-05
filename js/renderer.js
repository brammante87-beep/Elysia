/*
=========================================
ELYSIA
Renderer
=========================================
*/

class Renderer {

    constructor(game){

        this.game = game;
        this.ctx = game.ctx;

    }

    //====================================

    render(){

        this.clear();

        this.drawTerrain();

        this.drawObjects();

        this.drawVillagers();

        this.drawEffects();

        this.drawUI();

        this.drawDebug();

    }

    //====================================

    clear(){

        this.ctx.clearRect(
            0,
            0,
            this.game.canvas.width,
            this.game.canvas.height
        );

    }

    //====================================

    drawTerrain(){

        const world=this.game.world;
        const ctx=this.ctx;

        for(let y=0;y<world.height;y++){

            for(let x=0;x<world.width;x++){

                switch(world.tiles[y][x]){

                    case "water":

                        ctx.fillStyle="#4ab6ff";

                    break;

                    case "sand":

                        ctx.fillStyle="#edd58b";

                    break;

                    default:

                        ctx.fillStyle="#68c25a";

                    break;

                }

                ctx.fillRect(

                    x*world.tileSize,

                    y*world.tileSize,

                    world.tileSize,

                    world.tileSize

                );

            }

        }

    }

    //====================================

    drawObjects(){

        const world=this.game.world;

        world.trees.forEach(tree=>{

            this.drawTree(tree);

        });

        world.flowers.forEach(flower=>{

            this.drawFlower(flower);

        });

        world.waters.forEach(source=>{

            this.drawWater(source);

        });

        world.houses.forEach(house=>{

            this.drawHouse(house);

        });

        world.animals.forEach(animal=>{

            this.drawAnimal(animal);

        });

        this.drawCampfire();

    }

    //====================================

    drawVillagers(){

        this.game.world.villagers.forEach(v=>{

            if(v.owner){

                this.drawHero(v);

            }else{

                this.drawNPC(v);

            }

        });

    }

    //====================================

    drawEffects(){

        const ctx=this.ctx;

        this.game.world.lights.forEach(light=>{

            ctx.beginPath();

            ctx.arc(

                light.x,

                light.y,

                80,

                0,

                Math.PI*2

            );

            ctx.fillStyle="rgba(255,255,180,.25)";

            ctx.fill();

        });

    }

    //====================================

    drawTree(tree){

        const ctx=this.ctx;
        const s=this.game.world.tileSize;

        const x=tree.x*s;
        const y=tree.y*s;

        ctx.fillStyle="#704214";

        ctx.fillRect(

            x+28,

            y+30,

            8,

            22

        );

        ctx.beginPath();

        ctx.arc(

            x+32,

            y+20,

            18,

            0,

            Math.PI*2

        );

        ctx.fillStyle="#2f9346";

        ctx.fill();

    }

    //====================================

    drawFlower(flower){

        const ctx=this.ctx;
        const s=this.game.world.tileSize;

        const x=flower.x*s+32;
        const y=flower.y*s+32;

        ctx.fillStyle="#2c8a44";

        ctx.fillRect(

            x-1,

            y,

            2,

            8

        );

        ctx.beginPath();

        ctx.arc(

            x,

            y-3,

            4,

            0,

            Math.PI*2

        );

        ctx.fillStyle="#ff66cc";

        ctx.fill();

    }

    //====================================

    drawWater(source){

        const ctx=this.ctx;
        const s=this.game.world.tileSize;

        const x=source.x*s;
        const y=source.y*s;

        ctx.beginPath();

        ctx.arc(

            x+32,

            y+32,

            18,

            0,

            Math.PI*2

        );

        ctx.fillStyle="#5dc9ff";

        ctx.fill();

    }

    //====================================

    drawHouse(house){

        const ctx=this.ctx;
        const s=this.game.world.tileSize;

        const x=house.x*s;
        const y=house.y*s;

        ctx.fillStyle="#cfa978";

        ctx.fillRect(

            x+12,

            y+24,

            40,

            26

        );

        ctx.beginPath();

        ctx.moveTo(x+8,y+24);

        ctx.lineTo(x+32,y+6);

        ctx.lineTo(x+56,y+24);

        ctx.closePath();

        ctx.fillStyle="#7b4820";

        ctx.fill();

    }
        //====================================

    drawAnimal(animal){

        const ctx=this.ctx;
        const s=this.game.world.tileSize;

        const x=animal.x*s;
        const y=animal.y*s;

        // Ombra
        ctx.fillStyle="rgba(0,0,0,.20)";
        ctx.beginPath();
        ctx.ellipse(x+32,y+42,12,6,0,0,Math.PI*2);
        ctx.fill();

        // Corpo
        ctx.fillStyle="#8b5a2b";
        ctx.fillRect(x+18,y+18,28,18);

        // Testa
        ctx.beginPath();
        ctx.arc(x+48,y+22,8,0,Math.PI*2);
        ctx.fill();

    }

    //====================================

    drawCampfire(){

        const ctx=this.ctx;
        const s=this.game.world.tileSize;

        const x=16*s;
        const y=10*s;

        // Legna

        ctx.fillStyle="#6b3f1d";

        ctx.fillRect(x+24,y+36,18,4);

        ctx.fillRect(x+22,y+32,22,4);

        // Fuoco

        ctx.beginPath();

        ctx.arc(

            x+32,

            y+28,

            10,

            0,

            Math.PI*2

        );

        ctx.fillStyle="#ffb000";

        ctx.fill();

    }

    //====================================

    drawHero(hero){

        const ctx=this.ctx;

        // Ombra

        ctx.fillStyle="rgba(0,0,0,.25)";

        ctx.beginPath();

        ctx.ellipse(

            hero.x,

            hero.y+12,

            8,

            4,

            0,

            0,

            Math.PI*2

        );

        ctx.fill();

        // Testa

        ctx.beginPath();

        ctx.arc(

            hero.x,

            hero.y-8,

            6,

            0,

            Math.PI*2

        );

        ctx.fillStyle="#ffd6b5";

        ctx.fill();

        // Corpo

        ctx.fillStyle=hero.color;

        ctx.fillRect(

            hero.x-6,

            hero.y-2,

            12,

            18

        );

        // Nome

        ctx.fillStyle="white";

        ctx.font="bold 14px Arial";

        ctx.fillText(

            hero.name,

            hero.x-20,

            hero.y-18

        );

    }

    //====================================

    drawNPC(npc){

        const ctx=this.ctx;

        ctx.fillStyle="rgba(0,0,0,.20)";

        ctx.beginPath();

        ctx.ellipse(

            npc.x,

            npc.y+12,

            8,

            4,

            0,

            0,

            Math.PI*2

        );

        ctx.fill();

        ctx.beginPath();

        ctx.arc(

            npc.x,

            npc.y-8,

            6,

            0,

            Math.PI*2

        );

        ctx.fillStyle="#ffd6b5";

        ctx.fill();

        ctx.fillStyle=npc.color;

        ctx.fillRect(

            npc.x-6,

            npc.y-2,

            12,

            18

        );

    }

    //====================================

    drawUI(){

        // Per ora vuoto.
        // La UI sarà gestita da ui.js

    }

    //====================================

    drawDebug(){

        // Debug disattivato

    }

}