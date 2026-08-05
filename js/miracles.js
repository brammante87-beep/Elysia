/*
=========================================
ELYSIA
Miracle Manager
=========================================
*/

class Miracles {

    constructor(game){

        this.game = game;

        //----------------------------------
        // Miracolo selezionato
        //----------------------------------

        this.selected = "tree";

        //----------------------------------
        // Elenco miracoli
        //----------------------------------

        this.list = [

            "tree",
            "water",
            "flower",
            "light",
            "lightning",
            "house",
            "fertility",
            "animal"

        ];

    }

    //====================================

    select(name){

        if(this.list.includes(name)){

            this.selected = name;

        }

    }

    //====================================

    cast(x,y){

        const world = this.game.world;

        const tileX = Math.floor(x/world.tileSize);

        const tileY = Math.floor(y/world.tileSize);

        //----------------------------------
        // Crea evento
        //----------------------------------

        world.lastMiracle={

            type:this.selected,

            x,
            y,

            tileX,
            tileY,

            life:5

        };

        //----------------------------------
        // Applica miracolo
        //----------------------------------

        switch(this.selected){

            case "tree":

                this.createTree(tileX,tileY);

            break;

            case "water":

                this.createWater(tileX,tileY);

            break;

            case "flower":

                this.createFlower(tileX,tileY);

            break;

            case "house":

                this.createHeroHouse(tileX,tileY);

            break;

            case "light":

                this.createLight(x,y);

            break;

            case "lightning":

                this.createLightning(x,y);

            break;

            case "fertility":

                this.createFertility(tileX,tileY);

            break;

            case "animal":

                this.createAnimal(tileX,tileY);

            break;

        }

    }

    //====================================
    // ALBERO
    //====================================

    createTree(x,y){

        this.game.world.trees.push({

            x,
            y,

            wood:4

        });

    }

    //====================================
    // ACQUA
    //====================================

    createWater(x,y){

        this.game.world.waters.push({

            x,
            y,

            water:20

        });

    }

    //====================================
    // FIORE
    //====================================

    createFlower(x,y){

        this.game.world.flowers.push({

            x,
            y,

            beauty:3,

            observed:0

        });

    }

    //====================================
    // CASA
    //====================================

    createHeroHouse(x,y){

        const hero=this.game.world.hero;

        if(hero.house!=null)

            return;

        const id=this.game.world.houses.length;

        this.game.world.houses.push({

            id,

            owner:hero.id,

            x,
            y,

            wood:0,

            water:0,

            meat:0,

            fertility:false,

            people:[hero.id]

        });

        hero.house=id;

    }

    //====================================
    // LUCE
    //====================================

    createLight(x,y){

        this.game.world.lights.push({

            x,
            y,

            life:4

        });

    }

    //====================================
    // FULMINE
    //====================================

    createLightning(x,y){

        const npc=this.closestNPC(x,y);

        if(!npc) return;

        npc.faith=Math.max(0,npc.faith-15);

        npc.social=Math.max(0,npc.social-10);

        npc.strength=Math.max(0,npc.strength-5);

        npc.lightning=(npc.lightning||0)+1;

    }

    //====================================
    // FERTILITA'
    //====================================

    createFertility(x,y){

        const house=this.closestHouse(x,y);

        if(!house) return;

        house.fertility=true;

        house.fertilityTime=30;

    }

    //====================================
    // ANIMALE
    //====================================

    createAnimal(x,y){

        this.game.world.animals.push({

            x,
            y,

            meat:4

        });

    }

    //====================================

    closestNPC(px,py){

        let best=null;

        let dist=999999;

        this.game.world.villagers.forEach(v=>{

            if(v.owner) return;

            const d=Math.hypot(

                px-v.x,

                py-v.y

            );

            if(d<dist){

                dist=d;

                best=v;

            }

        });

        return best;

    }

    //====================================

    closestHouse(tx,ty){

        let best=null;

        let dist=999;

        this.game.world.houses.forEach(h=>{

            const d=Math.abs(h.x-tx)+Math.abs(h.y-ty);

            if(d<dist){

                dist=d;

                best=h;

            }

        });

        return best;

    }

}