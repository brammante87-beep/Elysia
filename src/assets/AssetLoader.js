export class AssetLoader {
  constructor(registry, ImageClass = globalThis.Image) {
    this.registry = registry;
    this.ImageClass = ImageClass;
    this.images = new Map();
    this.failures = new Map();
    this.loading = false;
  }

  async preload(ids) {
    this.loading = true;
    const paths = ids.flatMap(id => Object.values(this.registry.get(id)?.states ?? {})
      .flatMap(animation => animation.frames));
    const results = await Promise.all(paths.map(path => this.load(path)));
    this.loading = false;
    return results.every(Boolean);
  }

  load(path) {
    if (this.images.has(path)) return Promise.resolve(true);
    if (!this.ImageClass) { this.failures.set(path, 'Image loading is unavailable.'); return Promise.resolve(false); }
    return new Promise(resolve => {
      const image = new this.ImageClass();
      image.onload = () => { this.images.set(path, image); resolve(true); };
      image.onerror = () => { this.failures.set(path, 'Asset could not be loaded.'); resolve(false); };
      image.src = path;
    });
  }

  get(path) { return this.images.get(path) ?? null; }
  isReady(path) { return this.images.has(path); }
  hasFailures() { return this.failures.size > 0; }
}
