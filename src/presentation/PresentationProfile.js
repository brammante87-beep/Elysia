import { Input } from '../input/Input.js';
import { MobileInput } from '../input/MobileInput.js';
import { Renderer } from '../rendering/Renderer.js';
import { MobileCamera } from '../rendering/MobileCamera.js';
import { DesktopCamera } from '../rendering/DesktopCamera.js';
import { UI } from '../ui/UI.js';
import { MobileUI } from '../ui/MobileUI.js';
import { PresentationMode } from './PresentationMode.js';

export class PresentationProfile {
  static DESKTOP = 'desktop';
  static MOBILE = 'mobile';

  constructor(id, mode = PresentationMode.STANDARD, modeLockedByEntry = false) {
    if (![PresentationProfile.DESKTOP, PresentationProfile.MOBILE].includes(id)) throw new TypeError(`Unknown presentation: ${id}`);
    if (![PresentationMode.STANDARD, PresentationMode.FAMILY].includes(mode)) throw new TypeError(`Unknown mode: ${mode}`);
    this.id = id;
    this.mode = mode;
    this.modeLockedByEntry = modeLockedByEntry;
  }

  get isFamily() { return this.mode === PresentationMode.FAMILY; }
  setMode(mode) {
    if (this.modeLockedByEntry || ![PresentationMode.STANDARD, PresentationMode.FAMILY].includes(mode)) return false;
    this.mode = mode;
    return true;
  }
  createUI(root) { return this.id === PresentationProfile.MOBILE ? new MobileUI(root, this) : new UI(root, this); }
  createInput(canvas) { return this.id === PresentationProfile.MOBILE ? new MobileInput(canvas) : new Input(canvas); }
  createRenderer(canvas) {
    const camera = this.id === PresentationProfile.MOBILE
      ? new MobileCamera(canvas.width, canvas.height)
      : new DesktopCamera(canvas.width, canvas.height);
    const renderer = new Renderer(canvas, globalThis.window, undefined, null, camera);
    renderer.presentationId = this.id;
    renderer.presentationMode = this.mode;
    return renderer;
  }
  initialZoom(camera, pixelRatio) { return this.id === PresentationProfile.MOBILE ? camera.initialZoom(pixelRatio) : camera.initialZoom(); }
}
