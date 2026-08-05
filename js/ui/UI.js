export class UI {
    constructor(root, miracleManager) {
        this.root = root;
        this.miracleManager = miracleManager;
    }

    clear() {
        this.root.innerHTML = "";
    }

    showMiracleToolbar() {
        const toolbar = document.createElement("div");
        toolbar.id = "miracleToolbar";
        toolbar.setAttribute("aria-label", "Miracle toolbar");

        this.miracleManager.availableMiracles.forEach((miracle) => {
            toolbar.appendChild(this.createMiracleButton(miracle));
        });

        this.root.appendChild(toolbar);
        this.updateMiracleButtons();
    }

    createMiracleButton(miracle) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "miracleButton";
        button.dataset.miracle = miracle;
        button.title = this.getMiracleLabel(miracle);
        button.setAttribute("aria-label", this.getMiracleLabel(miracle));
        button.textContent = this.getMiracleIcon(miracle);

        const selectMiracle = (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.miracleManager.select(miracle);
            this.updateMiracleButtons();
        };

        button.addEventListener("click", selectMiracle);
        button.addEventListener("touchstart", selectMiracle, { passive: false });

        return button;
    }

    updateMiracleButtons() {
        this.root.querySelectorAll(".miracleButton").forEach((button) => {
            const selected = button.dataset.miracle === this.miracleManager.selectedMiracle;

            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
    }

    getMiracleIcon(miracle) {
        const icons = {
            tree: "🌳",
            water: "💧",
            light: "✨",
            lightning: "⚡",
            flower: "🌸",
            house: "🏠",
            fertility: "💞",
            animal: "🐾"
        };

        return icons[miracle];
    }

    getMiracleLabel(miracle) {
        const labels = {
            tree: "Tree miracle",
            water: "Water miracle",
            light: "Light miracle",
            lightning: "Lightning miracle",
            flower: "Flower miracle",
            house: "House miracle",
            fertility: "Fertility miracle",
            animal: "Animal miracle"
        };

        return labels[miracle];
    }
}
