export class SaveManager {
    constructor(storage = window.localStorage) {
        this.storage = storage;
        this.storageKey = "elysia_save_v1";
        this.version = "1.2";
    }

    save(gameState) {
        const payload = { version: this.version, savedAt: Date.now(), gameState };
        this.storage.setItem(this.storageKey, JSON.stringify(payload));
        return payload;
    }

    load() {
        const raw = this.storage.getItem(this.storageKey);
        if (raw === null) { return null; }
        try {
            const payload = JSON.parse(raw);
            return this.isValidSave(payload) ? payload : null;
        } catch (error) {
            console.warn("Salvataggio non leggibile", error);
            return null;
        }
    }

    hasValidSave() { return this.load() !== null; }
    deleteSave() { this.storage.removeItem(this.storageKey); }

    isValidSave(payload) {
        return payload !== null &&
            (payload.version === this.version || payload.version === "1.0") &&
            payload.gameState !== null &&
            typeof payload.gameState === "object" &&
            payload.gameState.world !== null &&
            typeof payload.gameState.world === "object" &&
            payload.gameState.world.hero !== null &&
            typeof payload.gameState.world.hero.id === "string";
    }
}
