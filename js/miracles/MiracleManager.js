export class MiracleManager {
    constructor() {
        this.availableMiracles = [
            "tree",
            "water",
            "light",
            "lightning",
            "flower",
            "house",
            "fertility",
            "animal"
        ];
        this.selectedMiracle = null;
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

        return false;
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
