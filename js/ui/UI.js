export class UI {
    constructor(root) {
        this.root = root;
    }

    clear() {
        this.root.innerHTML = "";
    }
}
