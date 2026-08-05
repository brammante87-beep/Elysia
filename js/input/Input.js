export class Input {
    constructor(canvas, world) {
        this.canvas = canvas;
        this.world = world;
        this.pointerX = 0;
        this.pointerY = 0;

        this.bindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener("pointermove", (event) => {
            const position = this.getWorldPosition(event);

            this.pointerX = position.x;
            this.pointerY = position.y;
        });

        this.canvas.addEventListener("click", (event) => {
            if (event.button !== 0) {
                return;
            }

            const position = this.getWorldPosition(event);

            if (!this.world.contains(position.x, position.y)) {
                return;
            }

            if (!this.world.isWalkableAtWorldPosition(position.x, position.y)) {
                return;
            }

            this.world.setHeroDestination(position.x, position.y);
        });
    }

    getWorldPosition(event) {
        const rectangle = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rectangle.width;
        const scaleY = this.canvas.height / rectangle.height;

        return {
            x: (event.clientX - rectangle.left) * scaleX,
            y: (event.clientY - rectangle.top) * scaleY
        };
    }
}
