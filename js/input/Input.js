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
        this.debug("handleWorldClick entered", { x, y, worldEra: this.world.getCurrentEra() });
        if (this.miracleManager.selectedMiracle === "mushroom") { this.handleSelectedMiracleClick(x, y); return; }
        if (this.miracleManager.selectedMiracle === "lightning") {
            this.debugLightning("Lightning world click received", { x, y });
            this.handleSelectedMiracleClick(x, y);
            return;
        }
        if (this.miracleManager.selectedMiracle === "flower") {
            this.debugFlower("Flower world click received", { x, y });
            this.handleSelectedMiracleClick(x, y);
            return;
        }
        if (!this.world.contains(x, y)) {
            return;
        }

        if (this.miracleManager.hasSelectedMiracle()) {
            this.handleSelectedMiracleClick(x, y);
            return;
        }

        const mushroom = this.world.getMushroomAtWorldPosition(x, y);
        if (mushroom !== null) { this.clearPointerFeedback(); this.world.commandHeroToCollectMushroom(mushroom); return; }

        const house = this.world.getHouseAtWorldPosition(x, y);
        if (house !== null) {
            this.clearPointerFeedback();
            this.world.selectHouse(house);
            return;
        }

        const tree = this.world.getTreeAtWorldPosition(x, y);

        if (tree !== null) {
            this.clearPointerFeedback();
            if (!this.world.commandHeroToCutTree(tree)) { this.showPointerFeedback(this.world.lastResourceCommandReason); }
            return;
        }

        const fruitTree = this.world.getFruitTreeAtWorldPosition(x, y);
        if (fruitTree !== null) {
            this.clearPointerFeedback();
            if (!this.world.commandHeroToHarvestFruitTree(fruitTree)) { this.showPointerFeedback(this.world.lastResourceCommandReason); }
            return;
        }

        const waterSource = this.world.getWaterSourceAtWorldPosition(x, y);

        if (waterSource !== null) {
            this.clearPointerFeedback();
            if (!this.world.commandHeroToCollectWater(waterSource)) { this.showPointerFeedback(this.world.lastResourceCommandReason); }
            return;
        }

        const well = this.world.getVillageWell();
        if (well !== null && Math.hypot(well.x - x, well.y - y) <= well.radius) {
            this.clearPointerFeedback();
            if (!this.world.commandHeroToCollectWater(well)) { this.showPointerFeedback(this.world.lastResourceCommandReason); }
            return;
        }

        const animal = this.world.getAnimalAtWorldPosition(x, y);

        if (animal !== null) {
            this.clearPointerFeedback();
            if (!this.world.commandHeroToHuntAnimal(animal)) { this.showPointerFeedback(this.world.lastResourceCommandReason); }
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

    handleSelectedMiracleClick(x, y) {
        this.debug("handleSelectedMiracleClick entered", { x, y });
        this.clearPointerFeedback();
        const selectedMiracle = this.miracleManager.selectedMiracle;
        let castSucceeded = false;
        try {
            castSucceeded = this.miracleManager.cast(x, y, this.world);
        } catch (error) {
            this.debug("miracle exception", { error, stack: error && error.stack });
            throw error;
        }
        this.debug("miracle cast result", {
            selectedMiracle,
            castSucceeded,
            feedback: this.world.feedbackMessages.at(-1)?.text || null,
            selectedMiracleAfterCast: this.miracleManager.selectedMiracle,
            flowerPlacementReason: this.world.lastFlowerPlacementReason
        });

        if (castSucceeded) {
            return true;
        }

        if (selectedMiracle === "fertility" && this.world.lastFertilityIneligibilityReason !== null) {
            this.showPointerFeedback(this.world.lastFertilityIneligibilityReason);
        } else if (selectedMiracle === "flower") {
            this.showPointerFeedback("Qui il fiore non può crescere");
        } else if (selectedMiracle === "mushroom") {
            this.showPointerFeedback("Qui il fungo non può crescere");
        } else if (selectedMiracle === "lightning") {
            this.showPointerFeedback("Nessun abitante da colpire");
        }

        return false;
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

        const position = {
            x: (event.clientX - rectangle.left) * scaleX,
            y: (event.clientY - rectangle.top) * scaleY
        };
        if (this.miracleManager.selectedMiracle === "flower") { this.debugFlower("Flower coordinates converted", position); }
        if (this.miracleManager.selectedMiracle === "lightning") { this.debugLightning("Lightning coordinates converted", position); }
        this.debug("canvas pointer converted", {
            pointer: { x: event.clientX, y: event.clientY },
            world: position
        });
        return position;
    }

    debug(message, details) {
        if (globalThis.ELYSIA_DEBUG === true) { console.debug(`[Elysia/Input] ${message}`, details); }
    }

    debugFlower(message, details) {
        if (globalThis.ELYSIA_DEBUG === true) { console.debug(message, details); }
    }

    debugLightning(message, details) {
        if (globalThis.ELYSIA_DEBUG === true) { console.debug(message, details); }
    }
}
