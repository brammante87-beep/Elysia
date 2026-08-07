import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine } from '../src/core/Engine.js';
import { GameClock } from '../src/core/GameClock.js';
import { GameState } from '../src/core/GameState.js';
import { Input } from '../src/input/Input.js';
import { Renderer } from '../src/rendering/Renderer.js';
import { SaveManager } from '../src/persistence/SaveManager.js';
import { Config } from '../src/core/Config.js';
import { DIVINE_POWERS } from '../src/data/Powers.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

test('clock updates, pauses, resumes, and resets', () => {
  const clock = new GameClock();
  clock.update(1.5); clock.pause(); clock.update(3);
  assert.equal(clock.elapsedSeconds, 1.5);
  clock.resume(); clock.update(0.5); assert.equal(clock.elapsedSeconds, 2);
  clock.reset(); assert.equal(clock.elapsedSeconds, 0);
});

test('state transitions validate centralized states', () => {
  const state = new GameState();
  state.transitionTo(GameState.States.PLAYING);
  assert.equal(state.is(GameState.States.PLAYING), true);
  assert.throws(() => state.transitionTo('UNKNOWN'), TypeError);
});

test('engine calculates seconds and clamps suspended-tab deltas', () => {
  const deltas = [];
  const callbacks = [];
  const engine = new Engine({ update: delta => deltas.push(delta), render() {} }, callback => callbacks.push(callback));
  engine.start(); callbacks.shift()(1000); callbacks.shift()(1016); callbacks.shift()(9016);
  assert.deepEqual(deltas, [0, 0.016, Config.MAX_DELTA_SECONDS]);
});

test('input converts CSS coordinates to backing coordinates', () => {
  const canvas = { width: 1000, height: 500, getBoundingClientRect: () => ({ left: 10, top: 20, width: 500, height: 250 }) };
  const point = new Input(canvas).toCanvasCoordinates(260, 145);
  assert.deepEqual(point, { x: 500, y: 250 });
});

test('renderer resizes its backing buffer and continues drawing', () => {
  const calls = [];
  const context = {
    fillStyle: '', textAlign: '', font: '',
    fillRect: (...args) => calls.push(['fillRect', ...args]),
    fillText: (...args) => calls.push(['fillText', ...args]),
  };
  const canvas = {
    width: 0, height: 0,
    getContext: () => context,
    getBoundingClientRect: () => ({ width: 400, height: 200 }),
  };
  const renderer = new Renderer(canvas, { devicePixelRatio: 2 });
  renderer.resize();
  assert.deepEqual([canvas.width, canvas.height], [800, 400]);
  renderer.render();
  assert.equal(calls.filter(call => call[0] === 'fillText').length, 2);
});

test('save manager handles absent, corrupt, unsupported, and valid saves', () => {
  const storage = new MemoryStorage();
  const saves = new SaveManager(storage);
  assert.equal(saves.hasSave(), false);
  storage.setItem(Config.SAVE_KEY, '{broken'); assert.equal(saves.load(), null);
  storage.setItem(Config.SAVE_KEY, JSON.stringify({ version: 999, data: {} })); assert.equal(saves.load(), null);
  storage.setItem(Config.SAVE_KEY, JSON.stringify({ version: Config.SAVE_VERSION })); assert.equal(saves.load(), null);
  storage.setItem(Config.SAVE_KEY, JSON.stringify({ version: Config.SAVE_VERSION, data: null })); assert.equal(saves.load(), null);
  storage.setItem(Config.SAVE_KEY, JSON.stringify([])); assert.equal(saves.load(), null);
  assert.deepEqual(saves.save({ future: true }), { version: 1, data: { future: true } });
  assert.equal(saves.hasSave(), true); saves.deleteSave(); assert.equal(saves.load(), null);
});

test('power registry has the fixed ten-power order', () => {
  assert.deepEqual(DIVINE_POWERS.map(power => power.id), [
    'plant', 'water', 'flower', 'cow', 'lightning', 'blessing',
    'rayOfLight', 'changeSex', 'giveWeapons', 'shield',
  ]);
});
