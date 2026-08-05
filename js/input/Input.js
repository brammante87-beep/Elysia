export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.pointerX = 0;
        this.pointerY = 0;

        this.bindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener("pointermove", (event) => {
            this.pointerX = event.offsetX;
            this.pointerY = event.offsetY;
        });
    }
}
