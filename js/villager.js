class Villager extends Entity {

    constructor(name,x,y,color){

        super(x,y);

        this.name=name;

        this.color=color;

        this.state="idle";

        this.speed=80;

        this.targetX=x;

        this.targetY=y;

    }

    update(delta){

        const dx=this.targetX-this.x;

        const dy=this.targetY-this.y;

        const dist=Math.sqrt(dx*dx+dy*dy);

        if(dist>1){

            this.x+=dx/dist*this.speed*delta;

            this.y+=dy/dist*this.speed*delta;

        }

    }

}