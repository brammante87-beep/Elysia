import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { GameState } from '../src/core/GameState.js';
import { SaveManager } from '../src/persistence/SaveManager.js';
import { TitleScreen } from '../src/ui/TitleScreen.js';
import { Config } from '../src/core/Config.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

class MarkupDocument {
  createElement() {
    return {
      className: '', innerHTML: '',
      setAttribute() {},
    };
  }
}

class GameHarness {
  constructor(storage = new MemoryStorage()) {
    this.game = Object.create(Game.prototype);
    this.game.state = new GameState();
    this.game.saves = new SaveManager(storage);
    this.calls = [];
    this.game.ui = {
      showTitle: (hasSave, handlers) => { this.hasSave = hasSave; this.handlers = handlers; },
      showNewGameConfirmation: (confirm, cancel) => { this.confirm = confirm; this.cancel = cancel; },
      showPlaceholder: lines => this.calls.push(lines),
      showIntro: (page, advance) => { this.introPage = page; this.advance = advance; },
      showWorldSelection: (types, handlers) => { this.types = types; this.worldHandlers = handlers; },
      showWorldConfirmation: (type, confirmWorld, cancelWorld) => { this.pendingType = type; this.confirmWorld = confirmWorld; this.cancelWorld = cancelWorld; },
    };
  }
}

test('boot transitions to TITLE and presents title actions without starting gameplay', () => {
  const harness = new GameHarness();
  harness.game.showTitle();
  assert.equal(harness.game.state.current, GameState.States.TITLE);
  assert.equal(harness.hasSave, false);
  assert.equal(typeof harness.handlers.onNewGame, 'function');
  assert.equal(typeof harness.handlers.onContinue, 'function');
  assert.equal(harness.game.world, undefined);
});

test('title screen contains ELYSIA, NUOVA PARTITA, CONTINUA, and the version', () => {
  const markup = new TitleScreen(new MarkupDocument()).element.innerHTML;
  assert.match(markup, />ELYSIA</);
  assert.match(markup, />NUOVA PARTITA</);
  assert.match(markup, />CONTINUA</);
  assert.match(markup, /Alpha 0\.0\.8/);
});

test('valid saves expose Continue while corrupt and unsupported saves do not', () => {
  const storage = new MemoryStorage();
  const harness = new GameHarness(storage);
  harness.game.showTitle(); assert.equal(harness.hasSave, false);
  storage.setItem(Config.SAVE_KEY, '{bad');
  harness.game.showTitle(); assert.equal(harness.hasSave, false);
  storage.setItem(Config.SAVE_KEY, JSON.stringify({ version: 999, data: {} }));
  harness.game.showTitle(); assert.equal(harness.hasSave, false);
  harness.game.saves.save({ state: GameState.States.INTRO });
  harness.game.showTitle(); assert.equal(harness.hasSave, true);
});

test('New Game starts immediately without a save and creates a minimal valid save', () => {
  const harness = new GameHarness();
  harness.game.requestNewGame();
  assert.equal(harness.game.state.current, GameState.States.INTRO);
  assert.equal(harness.game.saves.load().data.state, GameState.States.INTRO);
  assert.equal(Number.isInteger(harness.game.saves.load().data.worldSeed), true);
  assert.equal(harness.introPage, 0);
});

test('New Game with a save confirms; cancel preserves it and confirm replaces it', () => {
  const harness = new GameHarness();
  harness.game.saves.save({ marker: 'preserve-me' });
  harness.game.requestNewGame();
  assert.equal(harness.game.saves.load().data.marker, 'preserve-me');
  harness.cancel();
  assert.equal(harness.game.saves.load().data.marker, 'preserve-me');
  harness.game.requestNewGame();
  harness.confirm();
  assert.equal(harness.game.saves.load().data.state, GameState.States.INTRO);
});

test('Continue loads through SaveManager and restores the introduction', () => {
  const harness = new GameHarness();
  harness.game.saves.save({ state: GameState.States.INTRO });
  const originalLoad = harness.game.saves.load.bind(harness.game.saves);
  let loadCalls = 0;
  harness.game.saves.load = () => { loadCalls += 1; return originalLoad(); };
  harness.game.characterCreator = { restore: () => null }; harness.game.continueGame();
  assert.equal(loadCalls, 1);
  assert.equal(harness.game.state.current, GameState.States.INTRO);
  assert.equal(harness.introPage, 0);
});

test('menu updates do not execute world gameplay or instantiate later systems', () => {
  const harness = new GameHarness();
  let updates = 0;
  harness.game.clock = { update() {} };
  harness.game.world = { update: () => { updates += 1; } };
  harness.game.renderer = { update() {} };
  harness.game.update(0.016);
  assert.equal(updates, 0);
  for (const name of ['terrain', 'humans', 'animals', 'toolbar', 'miracles']) {
    assert.equal(harness.game[name], undefined);
  }
});
