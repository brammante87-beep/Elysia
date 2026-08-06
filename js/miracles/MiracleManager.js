export class MiracleManager {
    constructor() {
        this.availableMiracles = this.getMiraclesForEra("tribe");
        this.selectedMiracle = null;
    }

    getMiraclesForEra(worldEra) {
        return worldEra === "community"
            ? ["fertility", "flower", "light", "lightning", "blessing"]
            : ["tree", "water", "animal", "house", "fertility"];
    }

    isMiracleAvailable(miracle, worldEra) { return this.getMiraclesForEra(worldEra).includes(miracle); }

    refreshAvailableMiracles(worldEra) {
        this.availableMiracles = this.getMiraclesForEra(worldEra);
        if (!this.availableMiracles.includes(this.selectedMiracle)) { this.clearSelection(); }
    }

    select(miracle) {
        if (!this.availableMiracles.includes(miracle)) {
            return;
        }

        this.selectedMiracle = miracle;
    }

    clearSelection() {
        this.selectedMiracle = null;
    }

    hasSelectedMiracle() {
        return this.selectedMiracle !== null;
    }

    cast(x, y, world) {
        this.debug("MiracleManager.cast entered", { selectedMiracle: this.selectedMiracle, x, y, worldEra: world.getCurrentEra() });
        if (!this.isMiracleAvailable(this.selectedMiracle, world.getCurrentEra())) { this.clearSelection(); return false; }
        if (this.selectedMiracle === "tree") {
            return world.addTreeAt(x, y);
        }

        if (this.selectedMiracle === "water") {
            return world.addWaterSourceAt(x, y);
        }

        if (this.selectedMiracle === "animal") {
            return world.addAnimalAt(x, y);
        }

        if (this.selectedMiracle === "house") {
            return this.castHouse(x, y, world);
        }

        if (this.selectedMiracle === "fertility") {
            return this.castFertility(x, y, world);
        }

        if (this.selectedMiracle === "lightning") {
            const result = world.castLightningAt(x, y);
            if (result) { this.clearSelection(); }
            return result;
        }

        if (this.selectedMiracle === "flower") {
            const result = world.addFlowerAt(x, y);
            if (result) { this.clearSelection(); }
            return result;
        }

        if (["light", "blessing"].includes(this.selectedMiracle)) {
            world.feedbackMessages.push({ text: "Questo miracolo non è ancora disponibile.", timer: 3 });
            this.clearSelection();
        }
        return false;
    }

    debug(message, details) {
        if (globalThis.ELYSIA_DEBUG === true) { console.debug(`[Elysia/Miracles] ${message}`, details); }
    }

    castFertility(x, y, world) {
        if (!world.commandFertilityAt(x, y)) {
            return false;
        }

        this.clearSelection();
        return true;
    }

    castHouse(x, y, world) {
        if (world.hero.wood < 3 || world.hero.house !== null) {
            return false;
        }

        if (!world.addChosenHouseAt(x, y)) {
            return false;
        }

        world.hero.wood -= 3;
        this.clearSelection();

        return true;
    }
}
