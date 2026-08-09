import { Game } from './core/Game.js';
import { PresentationProfile } from './presentation/PresentationProfile.js';

const game = new Game(document.querySelector('#app'), new PresentationProfile(PresentationProfile.MOBILE));
game.start();
