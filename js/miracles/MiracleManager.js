export class MiracleManager {
    constructor() {
        this.availableMiracles = this.getMiraclesForEra("tribe");
        this.selectedMiracle = null;
    }

    getMiraclesForEra(worldEra) {
        return worldEra === "community"
            ? ["fertility", "flower", "light", "lightning", "blessing"]
            : ["tree", "water", "animal", "house", "fertility", "mushroom", "flower", "lightning"];
    }

    isMiracleAvailable(miracle, worldEra) { return this.getMiraclesForEra(worldEra).includes(miracle); }

    refreshAvailableMiracles(worldEra) {
        this.availableMiracles = this.getMiraclesForEra(worldEra);
        if (!this.availableMiracles.includes(this.selectedMiracle)) { this.clearSelection(); }
    }

    select(miracle) {
        if (this.availableMiracles.includes(miracle)) { this.selectedMiracle = miracle; }
    }

    clearSelection() { this.selectedMiracle = null; }
    hasSelectedMiracle() { return this.selectedMiracle !== null; }

    cast(x, y, world) {
        if (!this.isMiracleAvailable(this.selectedMiracle, world.getCurrentEra())) { this.clearSelection(); return false; }
        if (this.selectedMiracle === "flower") { return this.castFlower(x, y, world); }
        if (this.selectedMiracle === "mushroom") { return this.castMushroom(x, y, world); }
        if (this.selectedMiracle === "tree") { return world.addTreeAt(x, y); }
        if (this.selectedMiracle === "water") { return world.addWaterSourceAt(x, y); }
        if (this.selectedMiracle === "animal") { return world.addAnimalAt(x, y); }
        if (this.selectedMiracle === "house") { return this.castHouse(x, y, world); }
        if (this.selectedMiracle === "fertility") { return this.castFertility(x, y, world); }
        if (this.selectedMiracle === "lightning") { return this.castLightning(x, y, world); }
        if (["light", "blessing"].includes(this.selectedMiracle)) {
            world.feedbackMessages.push({ text: "Questo miracolo non è ancora disponibile.", timer: 3 });
            this.clearSelection();
        }
        return false;
    }

    castFlower(x, y, world) {
        const result = world.placeFlowerAt(x, y);
        if (result.success) {
            this.clearSelection();
            this.debug("Flower deselected", result);
        }
        return result.success;
    }

    castMushroom(x, y, world) {
        const result = world.placeMushroomAt(x, y);
        if (result.success) { this.clearSelection(); }
        return result.success;
    }

    castLightning(x, y, world) {
        const result = world.strikeWithLightningAt(x, y);
        if (result.success) {
            this.clearSelection();
            this.debug("Lightning deselected");
        } else {
            this.debug("Lightning remains selected");
        }
        return result.success;
    }

    castFertility(x, y, world) {
        if (!world.commandFertilityAt(x, y)) { return false; }
        this.clearSelection(); return true;
    }

    castHouse(x, y, world) {
        if (world.hero.wood < 3 || world.hero.house !== null || !world.addChosenHouseAt(x, y)) { return false; }
        world.hero.wood -= 3; this.clearSelection(); return true;
    }

    debug(message, details) {
        if (globalThis.ELYSIA_DEBUG === true) { console.debug(message, details); }
    }
}
