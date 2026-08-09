import { PresentationProfile } from './PresentationProfile.js';

export class DeviceProfile {
  constructor(locationObject = globalThis.location, windowObject = globalThis.window, navigatorObject = globalThis.navigator) {
    this.location = locationObject;
    this.window = windowObject;
    this.navigator = navigatorObject;
  }

  resolve() {
    const parameters = new URLSearchParams(this.location?.search ?? '');
    if (parameters.get('mobile') === '1') return PresentationProfile.MOBILE;
    if (parameters.get('desktop') === '1') return PresentationProfile.DESKTOP;
    const width = this.window?.innerWidth ?? 1024;
    const height = this.window?.innerHeight ?? 768;
    const smallViewport = Math.min(width, height) <= 820 && Math.max(width, height) <= 1180;
    const coarse = Boolean(this.window?.matchMedia?.('(pointer: coarse)').matches);
    const noHover = Boolean(this.window?.matchMedia?.('(hover: none)').matches);
    const touch = (this.navigator?.maxTouchPoints ?? 0) > 0;
    return smallViewport && (coarse || (noHover && touch)) ? PresentationProfile.MOBILE : PresentationProfile.DESKTOP;
  }
}
