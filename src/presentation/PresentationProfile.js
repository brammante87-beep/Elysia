import { Input } from '../input/Input.js';
import { MobileInput } from '../input/MobileInput.js';
import { Renderer } from '../rendering/Renderer.js';
import { MobileCamera } from '../rendering/MobileCamera.js';
import { UI } from '../ui/UI.js';
import { MobileUI } from '../ui/MobileUI.js';

export class PresentationProfile {
  static DESKTOP = 'desktop';
  static MOBILE = 'mobile';

  constructor(id) {
    if (![PresentationProfile.DESKTOP, PresentationProfile.MOBILE].includes(id)) throw new TypeError(`Unknown presentation: ${id}`);
    this.id = id;
  }

  createUI(root) { return this.id === PresentationProfile.MOBILE ? new MobileUI(root) : new UI(root); }
  createInput(canvas) { return this.id === PresentationProfile.MOBILE ? new MobileInput(canvas) : new Input(canvas); }
  createRenderer(canvas) {
    const camera = this.id === PresentationProfile.MOBILE ? new MobileCamera(canvas.width, canvas.height) : null;
    const renderer = new Renderer(canvas, globalThis.window, undefined, null, camera);
    renderer.presentationId = this.id;
    return renderer;
  }
  initialZoom(camera, pixelRatio) { return this.id === PresentationProfile.MOBILE ? camera.initialZoom(pixelRatio) : camera.fitZoom(); }
}
