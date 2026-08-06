export class AssetManager {
    constructor(imageConstructor = globalThis.Image, fallback = null) {
        this.ImageConstructor = imageConstructor;
        this.records = new Map();
        this.sources = new Map();
        this.aliases = new Map();
        this.fallback = fallback || this.createFallback();
    }

    registerAlias(alias, semanticKey) {
        this.aliases.set(alias, semanticKey);
    }

    preloadImages(entries) {
        return Promise.all(entries.map((entry) => this.loadImage(entry.key || entry.name, entry.source, entry)));
    }

    loadImage(key, source, metadata = {}) {
        const semanticKey = this.resolveKey(key);
        const existing = this.records.get(semanticKey);
        if (existing) { return existing.promise; }

        const sourceRecord = this.sources.get(source);
        if (sourceRecord) {
            this.records.set(semanticKey, sourceRecord);
            return sourceRecord.promise;
        }

        const image = new this.ImageConstructor();
        const record = { image, source, metadata, loaded: false, failed: false, promise: null };
        record.promise = new Promise((resolve) => {
            image.addEventListener("load", () => { record.loaded = true; resolve(record); }, { once: true });
            image.addEventListener("error", () => {
                record.failed = true;
                console.error(`[AssetManager] Failed to load "${semanticKey}" from ${source}`);
                resolve(record);
            }, { once: true });
        });
        this.records.set(semanticKey, record);
        this.sources.set(source, record);
        image.src = source;
        return record.promise;
    }

    getImage(key) {
        const record = this.records.get(this.resolveKey(key));
        return record && record.loaded && !record.failed ? record.image : this.fallback;
    }

    hasLoaded(key) {
        const record = this.records.get(this.resolveKey(key));
        return Boolean(record && record.loaded && !record.failed);
    }

    getFrame(key, frame = 0) {
        const semanticKey = this.resolveKey(key);
        const record = this.records.get(semanticKey);
        if (!record || !record.loaded || record.failed) {
            return { image: this.fallback, x: 0, y: 0, width: this.fallback.width || 16, height: this.fallback.height || 16 };
        }
        const frameWidth = record.metadata.frameWidth || record.image.width;
        const frameHeight = record.metadata.frameHeight || record.image.height;
        const columns = record.metadata.columns || Math.max(1, Math.floor(record.image.width / frameWidth));
        return {
            image: record.image,
            x: (frame % columns) * frameWidth,
            y: Math.floor(frame / columns) * frameHeight,
            width: frameWidth,
            height: frameHeight
        };
    }

    resolveKey(key) {
        return this.aliases.get(key) || key;
    }

    createFallback() {
        if (typeof document === "undefined") { return { assetFallback: true }; }
        const canvas = document.createElement("canvas");
        canvas.width = 16; canvas.height = 16;
        const context = canvas.getContext("2d");
        context.fillStyle = "#d946ef"; context.fillRect(0, 0, 16, 16);
        context.fillStyle = "#1f2937";
        context.fillRect(0, 0, 8, 8); context.fillRect(8, 8, 8, 8);
        canvas.assetFallback = true;
        return canvas;
    }
}
