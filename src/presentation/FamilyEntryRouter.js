import { DeviceProfile } from './DeviceProfile.js';
import { PresentationProfile } from './PresentationProfile.js';
import { EntryPresentation } from './EntryPresentation.js';

export class FamilyEntryRouter {
  constructor(locationObject = globalThis.location, deviceProfile = new DeviceProfile(locationObject)) {
    this.location = locationObject;
    this.deviceProfile = deviceProfile;
  }

  destination() {
    const page = this.deviceProfile.resolve() === PresentationProfile.MOBILE ? 'index2.html' : 'desktop.html';
    const parameters = new URLSearchParams(this.location?.search ?? '');
    parameters.delete('mode');
    parameters.set(EntryPresentation.FAMILY_PARAMETER, '1');
    return `${page}?${parameters.toString()}${this.location?.hash ?? ''}`;
  }

  route() { this.location.replace(this.destination()); }
}
