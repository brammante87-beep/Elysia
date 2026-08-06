export class AssetLoader {
    constructor() {
        this.images = new Map();
    }

    preloadImages(imageSources) {
        return Promise.all(imageSources.map((imageSource) => {
            return this.loadImage(imageSource.name, imageSource.source);
        }));
    }

    loadImage(name, source) {
        const image = new Image();
        const record = {
            image,
            loaded: false,
            failed: false
        };

        this.images.set(name, record);

        return new Promise((resolve) => {
            image.addEventListener("load", () => {
                record.loaded = true;
                resolve(record);
            });

            image.addEventListener("error", () => {
                record.failed = true;
                resolve(record);
            });

            image.src = source;
        });
    }

    getImage(name) {
        const record = this.images.get(name);

        if (!record || !record.loaded || record.failed) {
            return null;
        }

        return record.image;
    }

    hasLoaded(name) {
        const record = this.images.get(name);
        return Boolean(record && record.loaded && !record.failed);
    }
}
