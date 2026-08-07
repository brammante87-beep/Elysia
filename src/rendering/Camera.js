export class Camera {
  static MIN_ZOOM = 4;
  static MAX_ZOOM = 28;
  static WORLD_MARGIN = 3;

  constructor(viewportWidth = 1, viewportHeight = 1) {
    this.x = 0; this.y = 0; this.zoom = Camera.MIN_ZOOM;
    this.viewportWidth = viewportWidth; this.viewportHeight = viewportHeight;
    this.worldWidth = 1; this.worldHeight = 1;
  }

  configure(worldWidth, worldHeight, viewportWidth, viewportHeight) {
    this.worldWidth = worldWidth; this.worldHeight = worldHeight;
    this.setViewport(viewportWidth, viewportHeight);
  }

  setViewport(width, height) {
    this.viewportWidth = Math.max(1, width); this.viewportHeight = Math.max(1, height); this.clamp();
  }

  fitZoom() { return Math.min(this.viewportWidth / this.worldWidth, this.viewportHeight / this.worldHeight); }

  setZoom(zoom, anchor = { x: this.viewportWidth / 2, y: this.viewportHeight / 2 }) {
    const before = this.screenToWorld(anchor);
    this.zoom = Math.max(Camera.MIN_ZOOM, Math.min(Camera.MAX_ZOOM, zoom));
    const after = this.screenToWorld(anchor);
    this.x += before.x - after.x; this.y += before.y - after.y; this.clamp();
  }

  centerOn(position) { this.x = position.x; this.y = position.y; this.clamp(); }
  pan(dx, dy) { this.x -= dx / this.zoom; this.y -= dy / this.zoom; this.clamp(); }
  worldToScreen(position) { return { x: (position.x-this.x)*this.zoom+this.viewportWidth/2, y: (position.y-this.y)*this.zoom+this.viewportHeight/2 }; }
  screenToWorld(position) { return { x: (position.x-this.viewportWidth/2)/this.zoom+this.x, y: (position.y-this.viewportHeight/2)/this.zoom+this.y }; }

  clamp() {
    this.x = this.clampAxis(this.x, this.viewportWidth/(2*this.zoom), this.worldWidth);
    this.y = this.clampAxis(this.y, this.viewportHeight/(2*this.zoom), this.worldHeight);
  }

  clampAxis(value, halfView, worldSize) {
    const minimum=halfView-Camera.WORLD_MARGIN, maximum=worldSize-halfView+Camera.WORLD_MARGIN;
    return minimum > maximum ? worldSize/2 : Math.max(minimum, Math.min(maximum, value));
  }
}
