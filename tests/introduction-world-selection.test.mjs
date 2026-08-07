import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { GameState } from '../src/core/GameState.js';
import { IntroScreen } from '../src/ui/IntroScreen.js';
import { SaveManager } from '../src/persistence/SaveManager.js';
import { WORLD_TYPES, WorldTypeId } from '../src/data/WorldTypes.js';
import { World } from '../src/world/World.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

class AlphaHarness {
  constructor() {
    this.game = Object.create(Game.prototype);
    this.game.state = new GameState();
    this.game.saves = new SaveManager(new MemoryStorage());
    this.game.introPage = 0;
    this.game.worldType = null;
    this.game.worldSeed = 42;
    this.game.world = new World();
    this.game.renderer = { setWorld() {} };
    this.game.characterCreator = { restore: () => null };
    this.game.ui = {
      showIntro: (page, advance) => { this.page = page; this.advance = advance; },
      showWorldSelection: (types, handlers) => { this.types = types; this.select = handlers.onSelect; },
      showWorldConfirmation: (type, confirm, cancel) => { this.pending = type; this.confirm = confirm; this.cancel = cancel; },
      showPlaceholder: lines => { this.placeholder = lines; },
      showWorldReveal: complete => { this.reveal = complete; },
      showCharacterCreation: () => {}, showPlaying: () => {},
      showTitle: () => {},
    };
  }
}

test('intro begins at zero, advances through every page, and finishes at world selection', () => {
  const harness = new AlphaHarness();
  harness.game.beginNewGame();
  assert.equal(harness.page, 0);
  for (let page = 1; page < IntroScreen.Pages.length; page += 1) {
    harness.advance();
    assert.equal(harness.page, page);
    assert.equal(harness.game.state.current, GameState.States.INTRO);
  }
  harness.advance();
  assert.equal(harness.game.state.current, GameState.States.WORLD_SELECTION);
  assert.equal(harness.game.introPage, IntroScreen.Pages.length - 1);
  harness.game.advanceIntro();
  assert.equal(harness.game.introPage, IntroScreen.Pages.length - 1);
});

test('world registry has exactly the three stable IDs', () => {
  assert.equal(WORLD_TYPES.length, 3);
  assert.deepEqual(WORLD_TYPES.map(type => type.id), ['human', 'beast', 'plant']);
});

for (const id of Object.values(WorldTypeId)) {
  test(`${id} requires confirmation and only confirmation stores it`, () => {
    const harness = new AlphaHarness();
    harness.game.showWorldSelection();
    harness.select(id);
    assert.equal(harness.game.worldType, null);
    harness.cancel();
    assert.equal(harness.game.worldType, null);
    harness.select(id);
    harness.confirm();
    assert.equal(harness.game.worldType, id);
    assert.equal(harness.game.state.current, GameState.States.WORLD_REVEAL);
    assert.equal(harness.game.saves.load().data.worldType, id);
  });
}

test('Continue restores intro pages and world selection', () => {
  const harness = new AlphaHarness();
  harness.game.saves.save({ state: GameState.States.INTRO, introPage: 2, worldType: null });
  harness.game.continueGame(); assert.equal(harness.page, 2);
  harness.game.saves.save({ state: GameState.States.WORLD_SELECTION, introPage: 3, worldType: null });
  harness.game.continueGame(); assert.equal(harness.game.state.current, GameState.States.WORLD_SELECTION);
});

test('Alpha 0.0.2 minimal INTRO saves receive safe defaults', () => {
  const harness = new AlphaHarness();
  harness.game.saves.save({ state: GameState.States.INTRO });
  assert.deepEqual(harness.game.saves.load().data, { state: GameState.States.INTRO, introPage: 0, worldType: null, worldSeed: null, chosenOne: null });
});

test('selection creates deterministic terrain but no forbidden gameplay systems', () => {
  const harness = new AlphaHarness();
  harness.game.showWorldSelection(); harness.select(WorldTypeId.PLANT); harness.confirm();
  assert.ok(harness.game.world.terrain);
  for (const name of ['inhabitants', 'powers', 'toolbar']) assert.equal(harness.game[name], undefined);
});
