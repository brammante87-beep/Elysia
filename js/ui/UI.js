export class UI {
    constructor(root, miracleManager, world = null) {
        this.root = root;
        this.miracleManager = miracleManager;
        this.world = world;
        this.houseHud = null;
        this.houseHudTitle = null;
        this.houseHudWood = null;
        this.houseHudWater = null;
        this.houseHudMeat = null;
        this.houseHudOccupants = null;
        this.heroCarrying = null;
        this.heroActivity = null;

        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.miracleManager.clearSelection();
                this.updateMiracleButtons();
            }
        });
    }

    clear() {
        this.root.innerHTML = "";
        this.houseHud = null;
        this.houseHudTitle = null;
        this.houseHudWood = null;
        this.houseHudWater = null;
        this.houseHudMeat = null;
        this.houseHudOccupants = null;
        this.heroCarrying = null;
        this.heroActivity = null;
    }

    showMainMenu(options) {
        this.clear();

        const screen = document.createElement("div");
        screen.id = "mainMenu";
        screen.className = "menuScreen";

        const panel = document.createElement("section");
        panel.className = "menuPanel";
        panel.setAttribute("aria-label", "Elysia main menu");

        const title = document.createElement("h1");
        title.textContent = "ELYSIA";

        const continueButton = document.createElement("button");
        continueButton.type = "button";
        continueButton.className = "primaryButton";
        continueButton.textContent = "Continua";
        continueButton.addEventListener("click", (event) => { event.preventDefault(); options.onContinue(); });

        const newGameButton = document.createElement("button");
        newGameButton.type = "button";
        newGameButton.className = "primaryButton";
        newGameButton.textContent = "Nuova partita";

        newGameButton.addEventListener("click", (event) => {
            event.preventDefault();
            options.onNewGame();
        });

        panel.appendChild(title);
        if (options.hasSave) { panel.appendChild(continueButton); }
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

    showTutorialReplayPrompt(options) {
        this.clear();

        const screen = document.createElement("div");
        screen.className = "menuScreen";

        const panel = document.createElement("section");
        panel.className = "menuPanel tutorialReplayPanel";

        const title = document.createElement("h1");
        title.textContent = "Vuoi rivedere l'introduzione?";
        panel.appendChild(title);
        panel.appendChild(this.createActionButton("Sì", options.onReplay));
        panel.appendChild(this.createActionButton("No", options.onContinue));
        screen.appendChild(panel);
        this.root.appendChild(screen);
    }

    showTutorial(options) {
        this.clear();

        const screen = document.createElement("div");
        screen.id = "tutorialScreen";
        screen.setAttribute("aria-label", "Introduzione a Elysia");

        const landscape = document.createElement("div");
        landscape.className = "tutorialLandscape";
        landscape.setAttribute("aria-hidden", "true");

        const skipButton = this.createActionButton("Salta introduzione", options.onSkip);
        skipButton.className = "tutorialSkip";

        const panel = document.createElement("section");
        panel.className = "tutorialPanel";

        const progress = document.createElement("p");
        progress.className = "tutorialProgress";
        progress.textContent = `${options.pageNumber} / ${options.pageCount}`;

        const title = document.createElement("h1");
        title.textContent = options.page.title;

        const text = document.createElement("p");
        text.className = "tutorialText";
        text.textContent = options.page.text;

        const navigation = document.createElement("div");
        navigation.className = "tutorialNavigation";

        if (options.pageNumber > 1) {
            const backButton = this.createActionButton("Indietro", options.onBack);
            backButton.className = "tutorialButton tutorialBack";
            navigation.appendChild(backButton);
        }

        const nextLabel = options.pageNumber === options.pageCount ? "Inizia il viaggio" : "Avanti";
        const nextButton = this.createActionButton(nextLabel, options.onNext);
        nextButton.className = "tutorialButton tutorialNext";
        navigation.appendChild(nextButton);

        panel.appendChild(progress);
        panel.appendChild(title);
        panel.appendChild(text);
        panel.appendChild(navigation);
        screen.appendChild(landscape);
        screen.appendChild(skipButton);
        screen.appendChild(panel);
        this.root.appendChild(screen);
    }

    createActionButton(label, action) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "primaryButton";
        button.textContent = label;
        button.addEventListener("click", (event) => {
            event.preventDefault();
            action();
        });
        return button;
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

    showSaveButton(onSave) {
        const button = document.createElement("button");
        button.id = "saveButton";
        button.type = "button";
        button.textContent = "Salva";
        button.addEventListener("click", (event) => { event.preventDefault(); onSave(); });
        this.root.appendChild(button);
    }

    showFeedback(text) {
        const message = document.createElement("div");
        message.className = "feedbackMessage";
        message.textContent = text;
        this.root.appendChild(message);
        window.setTimeout(() => { message.remove(); }, 2500);
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

    showHouseHud() {
        if (this.houseHud !== null) {
            return;
        }

        this.houseHud = document.createElement("section");
        this.houseHud.id = "chosenHouseHud";
        this.houseHud.setAttribute("aria-label", "Risorse della Casa del Prescelto");

        this.houseHudTitle = document.createElement("h2");
        this.houseHudTitle.textContent = "Nessuna casa";
        this.houseHud.appendChild(this.houseHudTitle);

        const resources = document.createElement("div");
        resources.className = "houseHudResources";

        this.houseHudWood = this.createHouseHudValue(resources, "🪵", "Legna");
        this.houseHudWater = this.createHouseHudValue(resources, "💧", "Acqua");
        this.houseHudMeat = this.createHouseHudValue(resources, "🍖", "Carne");
        this.houseHudOccupants = this.createHouseHudValue(resources, "👥", "Occupanti");

        this.houseHud.appendChild(resources);
        this.heroCarrying = document.createElement("p");
        this.heroActivity = document.createElement("p");
        this.houseHud.appendChild(this.heroCarrying);
        this.houseHud.appendChild(this.heroActivity);
        this.root.appendChild(this.houseHud);
        this.updateHouseHud();
    }

    createHouseHudValue(parent, icon, label) {
        const item = document.createElement("p");
        const text = document.createElement("span");

        item.appendChild(document.createTextNode(`${icon} ${label}: `));
        text.textContent = "0";
        item.appendChild(text);
        parent.appendChild(item);

        return text;
    }

    updateHouseHud() {
        if (this.houseHud === null) {
            return;
        }

        const house = this.world === null ? null : this.world.getChosenHouse();

        if (house === null) {
            this.houseHudTitle.textContent = "Nessuna casa";
            this.houseHud.hidden = false;
            this.setHouseHudTotals({ wood: 0, water: 0, meat: 0, occupants: 0 });
            this.updateHeroDetails();
            return;
        }

        this.houseHudTitle.textContent = "Casa del Prescelto";
        this.houseHud.hidden = false;
        this.setHouseHudTotals(this.world.getHouseResourceTotals(house));
        this.updateHeroDetails();
    }

    setHouseHudTotals(totals) {
        this.houseHudWood.textContent = String(totals.wood);
        this.houseHudWater.textContent = String(totals.water);
        this.houseHudMeat.textContent = String(totals.meat);
        this.houseHudOccupants.textContent = String(totals.occupants);
    }

    updateHeroDetails() {
        const hero = this.world.hero;
        const carrying = hero.carrying;
        const labels = { wood: "Legna", water: "Acqua", meat: "Carne" };
        this.heroCarrying.textContent = carrying.amount > 0 ? `Trasporta: ${carrying.amount} / ${hero.carryingCapacity} ${labels[carrying.type]}` : "Trasporta: nulla";
        const activities = { returningHome: "Torna a casa", depositingResources: "Deposita risorse", autonomousWandering: "Passeggia vicino casa" };
        this.heroActivity.textContent = `Attività: ${activities[hero.state] || "Disponibile"}`;
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

            if (this.isMiracleDisabled(miracle)) {
                this.miracleManager.clearSelection();
                this.updateMiracleButtons();
                return;
            }

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
            const disabled = this.isMiracleDisabled(button.dataset.miracle);

            if (disabled && button.dataset.miracle === this.miracleManager.selectedMiracle) {
                this.miracleManager.clearSelection();
            }

            const selected = button.dataset.miracle === this.miracleManager.selectedMiracle;
            const label = this.getMiracleButtonLabel(button.dataset.miracle);

            button.disabled = disabled;
            button.title = label;
            button.setAttribute("aria-label", label);
            button.classList.toggle("selected", selected);
            button.classList.toggle("disabled", disabled);
            button.setAttribute("aria-pressed", String(selected));
        });
    }

    isMiracleDisabled(miracle) {
        if (miracle !== "house") {
            return false;
        }

        return this.getHouseDisabledReason() !== null;
    }

    getHouseDisabledReason() {
        if (this.world === null || this.world.hero === null) {
            return "Richiede 3 legna";
        }

        if (this.world.hero.house !== null || this.world.hasChosenHouse()) {
            return "Casa già costruita";
        }

        if (this.world.hero.wood < 3) {
            return "Richiede 3 legna";
        }

        return null;
    }

    getMiracleButtonLabel(miracle) {
        if (miracle === "house") {
            return this.getHouseDisabledReason() || this.getMiracleLabel(miracle);
        }

        return this.getMiracleLabel(miracle);
    }

    getMiracleIconSource(miracle) {
        const iconSources = {
            tree: "assets/sprites/ui/tree_icon.svg",
            water: "assets/sprites/ui/water_icon.svg",
            animal: "assets/sprites/ui/animal_icon.svg"
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
