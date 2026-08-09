import { Camera } from './Camera.js';

export class MobileCamera extends Camera {
  static LOCAL_ZOOM = 10;

  initialZoom(pixelRatio = 1) {
    return Math.max(this.fitZoom(), MobileCamera.LOCAL_ZOOM * pixelRatio);
  }
}
