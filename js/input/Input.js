export class Input {
    constructor(canvas, world, miracleManager) {
        this.canvas = canvas;
        this.world = world;
        this.miracleManager = miracleManager;
        this.pointerX = 0;
        this.pointerY = 0;
        this.ignoreNextClick = false;

        this.bindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener("pointermove", (event) => {
            const position = this.getWorldPosition(event);

            this.pointerX = position.x;
            this.pointerY = position.y;
        });

        this.canvas.addEventListener("click", (event) => {
            if (this.ignoreNextClick) {
                this.ignoreNextClick = false;
                return;
            }

            if (event.button !== 0) {
                return;
            }

            const position = this.getWorldPosition(event);

            this.handleWorldClick(position.x, position.y);
        });

        this.canvas.addEventListener("touchend", (event) => {
            event.preventDefault();
            this.ignoreNextClick = true;

            const touch = event.changedTouches[0];
            const position = this.getWorldPosition(touch);

            this.handleWorldClick(position.x, position.y);
        });
    }

    handleWorldClick(x, y) {
        if (!this.world.contains(x, y)) {
            return;
        }

        if (this.miracleManager.hasSelectedMiracle()) {
            this.clearPointerFeedback();
            this.miracleManager.cast(x, y, this.world);
            return;
        }

        const tree = this.world.getTreeAtWorldPosition(x, y);

        if (tree !== null) {
            this.clearPointerFeedback();
            this.world.commandHeroToCutTree(tree);
            return;
        }

        const villager = this.world.getVillagerAtWorldPosition(x, y);

        if (villager !== null) {
            if (this.world.commandHeroToPartnerWith(villager)) {
                this.clearPointerFeedback();
            } else {
                this.showPointerFeedback(this.world.lastPartnerIneligibilityReason);
            }

            return;
        }

        if (!this.world.isWalkableAtWorldPosition(x, y)) {
            return;
        }

        this.clearPointerFeedback();
        this.world.setHeroDestination(x, y);
    }

    showPointerFeedback(message) {
        this.canvas.title = message || "";
    }

    clearPointerFeedback() {
        this.canvas.title = "";
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
