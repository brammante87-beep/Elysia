import { TitleScreen } from './TitleScreen.js';
import { IntroScreen } from './IntroScreen.js';
import { WorldSelectionScreen } from './WorldSelectionScreen.js';
import { WorldRevealScreen } from './WorldRevealScreen.js';
import { CharacterCreationScreen } from './CharacterCreationScreen.js';
import { DivineToolbar } from './DivineToolbar.js';
import { GameOverScreen } from './GameOverScreen.js';
import { SexChoicePanel } from './SexChoicePanel.js';

export class UI {
  constructor(root, presentation = null) {
    this.root = root;
    this.presentation = presentation;
    this.titleScreen = new TitleScreen(root.ownerDocument ?? globalThis.document, presentation);
    this.introScreen = new IntroScreen(root.ownerDocument ?? globalThis.document);
    this.worldSelectionScreen = new WorldSelectionScreen(root.ownerDocument ?? globalThis.document);
    this.worldRevealScreen = new WorldRevealScreen(root.ownerDocument ?? globalThis.document);
    this.characterCreationScreen = new CharacterCreationScreen(root.ownerDocument ?? globalThis.document, presentation);
    this.divineToolbar = new DivineToolbar(root.ownerDocument ?? globalThis.document, presentation);
    this.gameOverScreen = new GameOverScreen(root.ownerDocument ?? globalThis.document);
    this.sexChoicePanel = new SexChoicePanel(root.ownerDocument ?? globalThis.document);
  }

  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.setAttribute('aria-label', 'Elysia game canvas');
    this.root.append(canvas);
    return canvas;
  }

  showTitle(hasSave, handlers) {
    this.clearScreens();
    this.titleScreen.show(this.root, hasSave, handlers);
  }

  showNewGameConfirmation(onConfirm, onCancel) {
    this.titleScreen.confirmNewGame(onConfirm, onCancel);
  }

  showIntro(pageIndex, onAdvance) { this.clearScreens(); this.introScreen.show(this.root, pageIndex, onAdvance); }

  showWorldSelection(worldTypes, handlers) { this.clearScreens(); this.worldSelectionScreen.show(this.root, worldTypes, handlers); }

  showWorldConfirmation(worldType, onConfirm, onCancel) { this.worldSelectionScreen.confirm(worldType, onConfirm, onCancel); }

  showWorldReveal(onComplete) { this.clearScreens(); this.worldRevealScreen.show(this.root, onComplete); }
  showCharacterCreation(worldType, onSubmit) { this.clearScreens(); this.characterCreationScreen.show(this.root, worldType, onSubmit); }
  showPlaying(worldType, miracles, onSelect, onFocus) { this.clearScreens(); this.divineToolbar.remove(); this.divineToolbar.show(this.root, worldType, miracles, onSelect, onFocus); }
  showSexChoice(character, onChoose) { this.sexChoicePanel.show(this.root, character, onChoose); }
  showGameOver(handlers) { this.clearScreens(); this.divineToolbar.remove(); this.gameOverScreen.show(this.root, handlers); }

  showLoading(message) { this.showStatus(message, 'loading-screen'); }
  showLoadingError(message) { this.showStatus(message, 'loading-error-screen'); }

  showStatus(message, className) {
    this.clearScreens();
    const screen = this.root.ownerDocument.createElement('section');
    screen.className = `${className} celestial-screen`;
    const panel = this.root.ownerDocument.createElement('p');
    panel.textContent = message; screen.append(panel); this.root.append(screen);
  }

  showPlaceholder(lines) {
    this.clearScreens();
    const screen = this.root.ownerDocument.createElement('section');
    screen.className = 'placeholder-screen';
    const heading = this.root.ownerDocument.createElement('h1');
    heading.textContent = lines[0];
    screen.append(heading);
    if (lines[1]) {
      const detail = this.root.ownerDocument.createElement('p');
      detail.textContent = lines[1];
      screen.append(detail);
    }
    this.root.append(screen);
  }

  clearScreens() {
    this.sexChoicePanel.remove();
    this.root.querySelectorAll('.title-screen, .placeholder-screen, .intro-screen, .world-selection-screen, .world-reveal-screen, .character-creation-screen, .loading-screen, .loading-error-screen, .game-over-screen').forEach(screen => screen.remove());
  }
}
