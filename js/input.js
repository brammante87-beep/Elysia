/*
=========================================
ELYSIA
Input
=========================================
*/

class Input {

    constructor(game){

        this.game = game;

        this.canvas = game.canvas;

        //----------------------------------
        // Mouse
        //----------------------------------

        this.mouse={

            x:0,
            y:0,

            down:false,

            button:0

        };

        //----------------------------------
        // Touch
        //----------------------------------

        this.touch={

            active:false,

            x:0,

            y:0

        };

        //----------------------------------

        this.bind();

    }

    //====================================

    bind(){

        //------------------------------
        // Mouse
        //------------------------------

        this.canvas.addEventListener(

            "mousemove",

            this.onMouseMove.bind(this)

        );

        this.canvas.addEventListener(

            "mousedown",

            this.onMouseDown.bind(this)

        );

        this.canvas.addEventListener(

            "mouseup",

            this.onMouseUp.bind(this)

        );

        this.canvas.addEventListener(

            "click",

            this.onClick.bind(this)

        );

        //------------------------------
        // Touch
        //------------------------------

        this.canvas.addEventListener(

            "touchstart",

            this.onTouchStart.bind(this),

            {passive:false}

        );

        this.canvas.addEventListener(

            "touchmove",

            this.onTouchMove.bind(this),

            {passive:false}

        );

        this.canvas.addEventListener(

            "touchend",

            this.onTouchEnd.bind(this),

            {passive:false}

        );

    }

    //====================================

    onMouseMove(e){

        this.mouse.x=e.offsetX;

        this.mouse.y=e.offsetY;

    }

    //====================================

    onMouseDown(e){

        this.mouse.down=true;

        this.mouse.button=e.button;

    }

    //====================================

    onMouseUp(){

        this.mouse.down=false;

    }

    //====================================

    onClick(e){

        const x=e.offsetX;

        const y=e.offsetY;

        //--------------------------------
        // Prima prova la UI
        //--------------------------------

        if(this.game.ui.click && this.game.ui.click(x,y))

            return;

        //--------------------------------
        // Poi il mondo
        //--------------------------------

        this.game.miracles.cast(x,y);

    }

    //====================================

    onTouchStart(e){

        e.preventDefault();

        const t=e.touches[0];

        const rect=this.canvas.getBoundingClientRect();

        this.touch.active=true;

        this.touch.x=t.clientX-rect.left;

        this.touch.y=t.clientY-rect.top;

        this.game.miracles.cast(

            this.touch.x,

            this.touch.y

        );

    }

    //====================================

    onTouchMove(e){

        e.preventDefault();

    }

    //====================================

    onTouchEnd(){

        this.touch.active=false;

    }

}
