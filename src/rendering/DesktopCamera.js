import { Camera } from './Camera.js';

export class DesktopCamera extends Camera {
  static MAX_FIT_ENLARGEMENT = 1.12;

  constructor(viewportWidth = 1, viewportHeight = 1) {
    super(viewportWidth, viewportHeight);
    this.responsiveFraming = false;
  }

  initialZoom() {
    const contain = this.fitZoom();
    const cover = Math.max(this.viewportWidth / this.worldWidth, this.viewportHeight / this.worldHeight);
    return Math.min(cover, contain * DesktopCamera.MAX_FIT_ENLARGEMENT);
  }

  enableResponsiveFraming() {
    this.responsiveFraming = true;
  }

  setZoom(zoom, anchor) {
    this.responsiveFraming = false;
    super.setZoom(zoom, anchor);
  }

  setViewport(width, height) {
    super.setViewport(width, height);
    if (!this.responsiveFraming || this.worldWidth <= 1 || this.worldHeight <= 1) return;
    const center = { x: this.x, y: this.y };
    super.setZoom(this.initialZoom());
    this.centerOn(center);
  }
}
