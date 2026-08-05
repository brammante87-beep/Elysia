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
        this.selectedMiracle = this.availableMiracles[0];
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
        if (this.selectedMiracle !== "tree") {
            return false;
        }

        return world.addTreeAt(x, y);
    }
}
