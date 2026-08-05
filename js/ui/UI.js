export class UI {
    constructor(root, miracleManager) {
        this.root = root;
        this.miracleManager = miracleManager;

        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.miracleManager.clearSelection();
                this.updateMiracleButtons();
            }
        });
    }

    clear() {
        this.root.innerHTML = "";
    }

    showMainMenu(onNewGame) {
        this.clear();

        const screen = document.createElement("div");
        screen.id = "mainMenu";
        screen.className = "menuScreen";

        const panel = document.createElement("section");
        panel.className = "menuPanel";
        panel.setAttribute("aria-label", "Elysia main menu");

        const title = document.createElement("h1");
        title.textContent = "ELYSIA";

        const newGameButton = document.createElement("button");
        newGameButton.type = "button";
        newGameButton.className = "primaryButton";
        newGameButton.textContent = "Nuova partita";

        newGameButton.addEventListener("click", (event) => {
            event.preventDefault();
            onNewGame();
        });

        panel.appendChild(title);
        panel.appendChild(newGameButton);
        screen.appendChild(panel);
        this.root.appendChild(screen);
    }

    showCharacterCreation(onSubmit) {
        this.clear();

        const screen = document.createElement("div");
        screen.id = "characterCreation";
        screen.className = "menuScreen";

        const form = document.createElement("form");
        form.className = "menuPanel characterForm";
        form.setAttribute("aria-label", "Creazione Prescelto");

        const title = document.createElement("h1");
        title.textContent = "Crea il Prescelto";

        const nameLabel = document.createElement("label");
        nameLabel.textContent = "Nome del Prescelto";
        nameLabel.setAttribute("for", "heroName");

        const nameInput = document.createElement("input");
        nameInput.id = "heroName";
        nameInput.type = "text";
        nameInput.maxLength = 20;
        nameInput.placeholder = "Prescelto";

        form.appendChild(title);
        form.appendChild(nameLabel);
        form.appendChild(nameInput);
        form.appendChild(this.createRadioGroup("Identità di genere", "gender", [
            ["uomo", "Uomo"],
            ["donna", "Donna"],
            ["non-binario", "Non binario"]
        ]));
        form.appendChild(this.createRadioGroup("Orientamento sessuale", "orientation", [
            ["etero", "Etero"],
            ["gay-lesbica", "Gay / Lesbica"],
            ["bisessuale", "Bisessuale"],
            ["pansessuale", "Pansessuale"]
        ]));
        form.appendChild(this.createRadioGroup("Stile relazionale", "relationshipStyle", [
            ["monogamo", "Monogamo"],
            ["poliamoroso", "Poliamoroso"]
        ]));

        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.className = "primaryButton";
        submitButton.textContent = "Dona la vita";

        form.appendChild(submitButton);

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            onSubmit({
                name: nameInput.value.trim().slice(0, 20) || "Prescelto",
                gender: this.getSelectedRadioValue(form, "gender"),
                orientation: this.getSelectedRadioValue(form, "orientation"),
                relationshipStyle: this.getSelectedRadioValue(form, "relationshipStyle")
            });
        });

        screen.appendChild(form);
        this.root.appendChild(screen);
    }

    createRadioGroup(title, name, options) {
        const fieldset = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.textContent = title;

        fieldset.appendChild(legend);

        options.forEach(([value, label], index) => {
            const optionLabel = document.createElement("label");
            const input = document.createElement("input");

            input.type = "radio";
            input.name = name;
            input.value = value;
            input.checked = index === 0;

            optionLabel.appendChild(input);
            optionLabel.appendChild(document.createTextNode(label));
            fieldset.appendChild(optionLabel);
        });

        return fieldset;
    }

    getSelectedRadioValue(form, name) {
        return form.querySelector(`input[name="${name}"]:checked`).value;
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
        const iconSource = this.getMiracleIconSource(miracle);

        if (iconSource === null) {
            button.textContent = this.getMiracleIcon(miracle);
        } else {
            button.appendChild(this.createMiracleIconImage(iconSource, this.getMiracleLabel(miracle)));
        }

        const selectMiracle = (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (this.miracleManager.selectedMiracle === miracle) {
                this.miracleManager.clearSelection();
            } else {
                this.miracleManager.select(miracle);
            }

            this.updateMiracleButtons();
        };

        button.addEventListener("click", selectMiracle);
        button.addEventListener("touchstart", selectMiracle, { passive: false });

        return button;
    }

    createMiracleIconImage(source, label) {
        const image = document.createElement("img");

        image.className = "miracleIconImage";
        image.src = source;
        image.alt = label;
        image.draggable = false;

        return image;
    }

    updateMiracleButtons() {
        this.root.querySelectorAll(".miracleButton").forEach((button) => {
            const selected = button.dataset.miracle === this.miracleManager.selectedMiracle;

            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
    }

    getMiracleIconSource(miracle) {
        const iconSources = {
            tree: "assets/sprites/ui/tree_icon.svg"
        };

        return iconSources[miracle] || null;
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
