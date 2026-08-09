import { DeviceProfile } from './DeviceProfile.js';
import { PresentationProfile } from './PresentationProfile.js';

export class EntryRouter {
  constructor(locationObject = globalThis.location, profile = new DeviceProfile(locationObject)) {
    this.location = locationObject;
    this.profile = profile;
  }

  destination() {
    const page = this.profile.resolve() === PresentationProfile.MOBILE ? 'index2.html' : 'desktop.html';
    return `${page}${this.location?.search ?? ''}${this.location?.hash ?? ''}`;
  }

  route() { this.location.replace(this.destination()); }
}
