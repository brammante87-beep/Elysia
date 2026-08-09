import { Game } from './core/Game.js';
import { PresentationProfile } from './presentation/PresentationProfile.js';
import { EntryPresentation } from './presentation/EntryPresentation.js';

const entry = new EntryPresentation();
const game = new Game(document.querySelector('#app'), new PresentationProfile(PresentationProfile.DESKTOP, entry.mode(), entry.modeLockedByEntry()));
game.start();
