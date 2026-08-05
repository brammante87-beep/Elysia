/*
=========================================
ELYSIA
World
=========================================
*/

class World {

    constructor() {

        //----------------------------------
        // Mappa
        //----------------------------------

        this.width = 60;
        this.height = 40;

        this.tileSize = 64;

        this.tiles = [];

        //----------------------------------
        // Entità
        //----------------------------------

        this.hero = null;

        this.villagers = [];

        this.trees = [];

        this.flowers = [];

        this.houses = [];

        this.waters = [];

        this.animals = [];

        this.lights = [];

        //----------------------------------
        // Stato
        //----------------------------------

        this.lastMiracle = null;

        this.day = 1;

        this.time = 0;

    }

    //====================================

    createWorld(settings){

        this.generateTerrain();

        this.createHero(settings);

        this.createInitialVillagers(settings);

    }

    //====================================

    generateTerrain(){

        this.tiles=[];

        for(let y=0;y<this.height;y++){

            this.tiles[y]=[];

            for(let x=0;x<this.width;x++){

                if(y<4){

                    this.tiles[y][x]="water";

                }

                else if(y<6){

                    this.tiles[y][x]="sand";

                }

                else{

                    this.tiles[y][x]="grass";

                }

            }

        }

    }

    //====================================

    createHero(settings){

        this.hero={

            id:0,

            selected:true,

            owner:true,

            name:settings.name,

            gender:settings.gender,

            orientation:settings.orientation,

            relation:settings.relation,

            color:"#4ea3ff",

            x:14*this.tileSize,

            y:12*this.tileSize,

            targetX:14*this.tileSize,

            targetY:12*this.tileSize,

            speed:150,

            //--------------------------------

            wood:0,

            water:0,

            meat:0,

            //--------------------------------

            strength:50,

            curiosity:50,

            creativity:50,

            social:50,

            faith:50,

            //--------------------------------

            house:null,

            partners:[]

        };

        this.villagers.push(this.hero);

    }

    //====================================

    createInitialVillagers(){

        this.villagers.push(

            this.createNPC(

                1,

                18,

                12

            )

        );

        this.villagers.push(

            this.createNPC(

                2,

                20,

                15

            )

        );

    }

    //====================================

    createNPC(id,x,y){

        const colors=[

            "#ff6ba5",

            "#6fdc72",

            "#ffd04d",

            "#ff9b55",

            "#a06dff"

        ];

        return{

            id,

            owner:false,

            selected:false,

            name:"NPC "+id,

            gender:Math.random()<0.5?"male":"female",

            orientation:["straight","gay","bi","pan"][

                Math.floor(Math.random()*4)

            ],

            relation:Math.random()<0.7?"mono":"poly",

            color:colors[

                Math.floor(Math.random()*colors.length)

            ],

            x:x*this.tileSize,

            y:y*this.tileSize,

            targetX:x*this.tileSize,

            targetY:y*this.tileSize,

            speed:120,

            //--------------------------------

            wood:0,

            water:0,

            meat:0,

            //--------------------------------

            strength:Math.floor(Math.random()*100),

            curiosity:Math.floor(Math.random()*100),

            creativity:Math.floor(Math.random()*100),

            social:Math.floor(Math.random()*100),

            faith:Math.floor(Math.random()*100),

            //--------------------------------

            house:null,

            partners:[],

            state:"idle"

        };

    }

    //====================================

    update(delta){

        this.updateClock(delta);

        this.updateMiracle(delta);

        this.updateVillagers(delta);

    }

    //====================================

    updateClock(delta){

        this.time+=delta;

    }

    //====================================

    updateMiracle(delta){

        if(!this.lastMiracle) return;

        this.lastMiracle.time-=delta;

        if(this.lastMiracle.time<=0){

            this.lastMiracle=null;

        }

    }

    //====================================

    updateVillagers(delta){

        this.villagers.forEach(v=>{

            this.move(v,delta);

        });

    }

    //====================================

    move(v,delta){

        const dx=v.targetX-v.x;

        const dy=v.targetY-v.y;

        const dist=Math.hypot(dx,dy);

        if(dist<2) return;

        v.x+=(dx/dist)*v.speed*delta;

        v.y+=(dy/dist)*v.speed*delta;

    }

}