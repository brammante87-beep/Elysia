import { Engine } from './Engine.js';
import { GameClock } from './GameClock.js';
import { GameState } from './GameState.js';
import { World } from '../world/World.js';
import { SaveManager } from '../persistence/SaveManager.js';
import { IntroScreen } from '../ui/IntroScreen.js';
import { WorldTypeId, WorldTypes } from '../data/WorldTypes.js';
import { CharacterCreator } from '../entities/CharacterCreator.js';
import { Miracles } from '../miracles/Miracles.js';
import { PresentationProfile } from '../presentation/PresentationProfile.js';

export class Game {
  constructor(root, presentation = new PresentationProfile(PresentationProfile.DESKTOP)) {
    this.presentation = presentation;
    this.ui = presentation.createUI(root);
    this.canvas = this.ui.createCanvas();
    this.renderer = presentation.createRenderer(this.canvas);
    this.input = presentation.createInput(this.canvas);
    this.world = new World();
    this.clock = new GameClock();
    this.state = new GameState();
    this.saves = new SaveManager();
    this.engine = new Engine(this);
    this.introPage = 0;
    this.worldType = null;
    this.worldSeed = null;
    this.chosenOne = null;
    this.characterCreator = new CharacterCreator();
    this.miracles = new Miracles(this.world);
    this.saveAccumulator = 0;
    this.input.onWorldPointer = point => this.handleWorldPointer(point);
    this.input.onPan = (x, y) => { this.renderer.camera.pan(x, y); this.world.diagnostics.trace('cameraPanStarted'); };
    this.input.onZoom = (factor, point) => { this.renderer.camera.setZoom(this.renderer.camera.zoom*factor, point); this.world.diagnostics.trace('cameraZoomChanged', { zoom:this.renderer.camera.zoom }); };
    this.input.onGesture = type => { this.world.diagnostics.trace(type==='tap'?'mobileTapResolved':type==='drag'?'mobileDragResolved':'cameraZoomChanged'); if(type==='drag')this.world.diagnostics.trace('cameraPanEnded'); };
    this.resize = this.resize.bind(this);
  }

  start() {
    this.input.connect();
    globalThis.window.addEventListener('resize', this.resize);
    globalThis.window.addEventListener('orientationchange', () => this.world.diagnostics.trace('orientationChanged'));
    this.resize();
    this.showTitle();
    this.engine.start();
  }

  showTitle() {
    this.state.transitionTo(GameState.States.TITLE);
    this.ui.showTitle(this.saves.hasSave(), {
      onNewGame: () => this.requestNewGame(),
      onContinue: () => this.continueGame(),
    });
  }

  showGameOver() { this.state.transitionTo(GameState.States.GAME_OVER); this.saveProgress(GameState.States.GAME_OVER); this.ui.showGameOver({ onMenu: () => this.showTitle(), onNewGame: () => this.beginNewGame() }); }

  requestNewGame() {
    if (!this.saves.hasSave()) {
      this.beginNewGame();
      return;
    }
    this.ui.showNewGameConfirmation(
      () => this.beginNewGame(),
      () => this.showTitle(),
    );
  }

  beginNewGame() {
    this.saves.deleteSave();
    this.introPage = 0;
    this.worldType = null;
    this.worldSeed = this.createWorldSeed();
    this.chosenOne = null;
    this.saveProgress(GameState.States.INTRO);
    this.state.transitionTo(GameState.States.INTRO);
    this.showIntro();
  }

  showIntro() {
    this.state.transitionTo(GameState.States.INTRO);
    this.ui.showIntro(this.introPage, () => this.advanceIntro());
  }

  advanceIntro() {
    if (!this.state.is(GameState.States.INTRO)) return;
    if (this.introPage < IntroScreen.Pages.length - 1) {
      this.introPage += 1;
      this.saveProgress(GameState.States.INTRO);
      this.showIntro();
      return;
    }
    this.showWorldSelection();
  }

  showWorldSelection() {
    this.state.transitionTo(GameState.States.WORLD_SELECTION);
    this.saveProgress(GameState.States.WORLD_SELECTION);
    this.ui.showWorldSelection(WorldTypes.all(), { onSelect: id => this.selectWorld(id) });
  }

  selectWorld(id) {
    const selection = WorldTypes.find(id);
    if (selection === null || !this.state.is(GameState.States.WORLD_SELECTION)) return;
    this.ui.showWorldConfirmation(selection, () => this.confirmWorld(id), () => this.showWorldSelection());
  }

  confirmWorld(id) {
    if (!this.state.is(GameState.States.WORLD_SELECTION) || !WorldTypes.isValid(id)) return;
    this.worldType = id;
    if (this.worldSeed === null) this.worldSeed = this.createWorldSeed();
    this.world.create(id, this.worldSeed);
    this.renderer.setWorld(this.world);
    this.state.transitionTo(GameState.States.WORLD_REVEAL);
    this.saveProgress(GameState.States.WORLD_REVEAL);
    this.ui.showWorldReveal(() => this.completeWorldReveal());
  }

  completeWorldReveal() {
    if (this.worldType === WorldTypeId.PLANT) { this.enterPlaying(); return; }
    this.state.transitionTo(GameState.States.CHARACTER_CREATION);
    this.saveProgress(GameState.States.CHARACTER_CREATION);
    this.ui.showCharacterCreation(this.worldType, data => this.createChosenOne(data));
  }

  createChosenOne(data) {
    const position = this.world.findSpawnPosition();
    this.chosenOne = this.worldType === WorldTypeId.HUMAN
      ? this.characterCreator.createHuman(data, position, this.worldSeed)
      : this.characterCreator.createBeast(data, position, this.worldSeed);
    this.world.addCharacter(this.chosenOne);
    this.enterPlaying();
  }

  async enterPlaying() {
    const requiredAssets = this.renderer.assetRegistry.requiredIds(this.worldType);
    if (requiredAssets.length > 0) {
      this.ui.showLoading('Le creature di Elysia si risvegliano…');
      const ready = await this.renderer.assetLoader.preload(requiredAssets);
      if (!ready) {
        this.ui.showLoadingError('Non è stato possibile preparare le creature. Ricarica Elysia per riprovare.');
        return false;
      }
    }
    this.state.transitionTo(GameState.States.PLAYING);
    this.saveProgress(GameState.States.PLAYING);
    this.ui.showPlaying(this.worldType, this.miracles, null, () => this.focusCamera());
    this.configurePlayingCamera();
    return true;
  }

  configurePlayingCamera() {
    if (!this.canvas?.getBoundingClientRect || !this.renderer?.camera) return;
    const bounds=this.canvas.getBoundingClientRect();
    const ratio=this.canvas.width/Math.max(1,bounds.width);
    const zoom=this.presentation.initialZoom(this.renderer.camera, ratio);
    this.renderer.camera.setZoom(zoom);
    this.focusCamera();
  }

  focusCamera() {
    if (!this.renderer?.camera) return;
    const settlement=this.world.settlements?.find(item=>item.founderId===this.chosenOne?.id);
    const target=settlement?.center ?? settlement?.position ?? this.chosenOne?.position;
    if (target) this.renderer.camera.centerOn(target);
  }

  createWorldSeed() {
    const values = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(values);
    return values[0] || (Date.now() >>> 0);
  }

  saveProgress(state) {
    if (this.world?.rivalAttack?.blocksSaving) return false;
    const data = { state, introPage: this.introPage, worldType: this.worldType,
      worldSeed: this.worldSeed, chosenOne: this.chosenOne?.toJSON() ?? null };
    if (this.world?.terrain && this.world.toJSON) data.world = this.world.toJSON();
    this.saves.save(data);
    return true;
  }

  continueGame() {
    const save = this.saves.load();
    if (save === null) {
      this.showTitle();
      return;
    }
    this.introPage = Math.min(save.data.introPage, IntroScreen.Pages.length - 1);
    this.worldType = save.data.worldType;
    this.worldSeed = save.data.worldSeed;
    this.chosenOne = this.characterCreator.restore(save.data.chosenOne);
    if (save.data.state === GameState.States.INTRO) this.showIntro();
    else if (save.data.state === GameState.States.WORLD_SELECTION) this.showWorldSelection();
    else if (this.worldType !== null && this.worldSeed !== null) {
      this.world.restore(this.worldType, this.worldSeed, this.chosenOne, save.data.world);
      this.chosenOne = this.world.characters.find(character => character.chosenOne) ?? null;
      this.renderer.setWorld(this.world);
      if (save.data.state === GameState.States.WORLD_REVEAL) {
        this.state.transitionTo(GameState.States.WORLD_REVEAL);
        this.ui.showWorldReveal(() => this.completeWorldReveal());
      } else if (save.data.state === GameState.States.CHARACTER_CREATION && !this.chosenOne) {
        this.state.transitionTo(GameState.States.CHARACTER_CREATION);
        this.ui.showCharacterCreation(this.worldType, data => this.createChosenOne(data));
      } else if (save.data.state === GameState.States.GAME_OVER) this.showGameOver();
      else this.enterPlaying();
    } else this.showIntro();
  }

  resize() { this.renderer.resize(); this.world.diagnostics.trace('cameraViewportChanged', { width:this.canvas.width, height:this.canvas.height }); }

  handleWorldPointer(screenPoint) { if (!this.state.is(GameState.States.PLAYING)) return false; if (this.world.rivalAttack?.active && !this.world.rivalAttack.allowsMiracles) return false; const worldPoint = this.renderer.screenToWorld(screenPoint); if (!this.miracles.selectedPowerId) { const touchRadius=24*(this.canvas.width/this.canvas.getBoundingClientRect().width)/this.renderer.camera.zoom; return Boolean(this.world.inspectCharacter(worldPoint,touchRadius) ?? this.world.inspectHome(worldPoint,touchRadius)); } const result = this.miracles.castSelected(worldPoint); if (result?.requiresChoice) this.ui.showSexChoice(result.character, choice => { this.miracles.cast('changeSex', result.character.position, choice); this.saveProgress(GameState.States.PLAYING); }); else if (result) this.saveProgress(GameState.States.PLAYING); if(result)this.world.diagnostics.trace('mobileMiracleCast'); return Boolean(result); }

  update(deltaTime) {
    this.clock.update(deltaTime);
    this.renderer.update(deltaTime);
    if (this.state.is(GameState.States.PLAYING)) { this.world.update(deltaTime); if (this.world.plantProgression.complete) { this.showGameOver(); return; } this.saveAccumulator += deltaTime; if (!this.world.plantProgression.triggered && !this.world.rivalAttack.blocksSaving && this.saveAccumulator >= 2) { this.saveAccumulator = 0; this.saveProgress(GameState.States.PLAYING); } }
  }

  render() { this.renderer.render(); }
}
