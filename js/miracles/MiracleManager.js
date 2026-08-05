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
        this.selectedMiracle = this.availableMiracles[0];
    }

    select(miracle) {
        if (!this.availableMiracles.includes(miracle)) {
            return;
        }

        this.selectedMiracle = miracle;
    }
}
