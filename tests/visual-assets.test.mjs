import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { CharacterAssetRegistry } from '../src/assets/CharacterAssetRegistry.js';
import { AssetLoader } from '../src/assets/AssetLoader.js';
import { CharacterRenderer } from '../src/rendering/CharacterRenderer.js';
import { Renderer } from '../src/rendering/Renderer.js';
import { CharacterCreator } from '../src/entities/CharacterCreator.js';
import { Game } from '../src/core/Game.js';
import { GameState } from '../src/core/GameState.js';

const registry = new CharacterAssetRegistry();
const required = {
  'human.base': 'human', 'beast.deer': 'deer', 'beast.cat': 'cat', 'beast.dog': 'dog',
};

for (const [id, folder] of Object.entries(required)) test(`${id} has two original idle assets`, async () => {
  const definition = registry.get(id);
  assert.equal(definition.nativeWidth, 160); assert.equal(definition.nativeHeight, 200);
  assert.equal(definition.states.idle.frames.length, 2);
  for (const path of definition.states.idle.frames) {
    assert.match(path, new RegExp(`^assets/characters/${folder}/idle-0[12]\\.svg$`));
    await access(new URL(`../${path}`, import.meta.url));
    assert.match(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'), /<svg/);
  }
});

test('registry resolves stable semantic IDs for every character kind', () => {
  assert.equal(registry.resolveId({}), 'human.base');
  for (const species of ['deer', 'cat', 'dog']) assert.equal(registry.resolveId({ species }), `beast.${species}`);
  assert.deepEqual(registry.requiredIds('plant'), []);
  assert.ok(registry.requiredIds('human').includes('human.base'));
  assert.ok(registry.requiredIds('human').includes('human.child'));
});

test('CharacterRenderer resolves human and each beast without anatomy methods', async () => {
  const context = { save() {}, restore() {}, beginPath() {}, ellipse() {}, fill() {}, strokeText() {}, fillText() {},
    drawImage() {}, createRadialGradient: () => ({ addColorStop() {} }) };
  const characterRenderer = new CharacterRenderer(context, registry, { get: () => ({}) });
  assert.equal(characterRenderer.resolve({}).worldWidth, registry.get('human.base').worldWidth);
  for (const species of ['deer', 'cat', 'dog']) assert.equal(characterRenderer.resolve({ species }), registry.get(`beast.${species}`));
  const source = await readFile(new URL('../src/rendering/Renderer.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /drawHuman|drawAnimal|drawDeer|drawCat|drawDog/);
});

test('sprite source dimensions cannot alter explicit gameplay geometry', () => {
  const character = new CharacterCreator().createBeast({ name: 'Luce', species: 'cat' }, { x: 2, y: 3 }, 4);
  const geometry = [character.collisionRadius, character.interactionRadius];
  const definition = registry.get('beast.cat');
  const enlargedArt = { ...definition, nativeWidth: 4096, nativeHeight: 4096 };
  assert.deepEqual([character.collisionRadius, character.interactionRadius], geometry);
  assert.notEqual(enlargedArt.nativeWidth, definition.nativeWidth);
});

test('save representation stays semantic and contains no asset paths', () => {
  const character = new CharacterCreator().createBeast({ name: 'Brina', species: 'dog' }, { x: 1, y: 1 }, 9);
  const saved = JSON.stringify(character.toJSON());
  assert.match(saved, /"species":"dog"/); assert.match(saved, /"appearanceVariant":"base"/);
  assert.doesNotMatch(saved, /assets\/|\.svg|\.png/);
});

test('AssetLoader finishes every required frame before reporting success', async () => {
  class LoadedImage { set src(value) { this.path = value; queueMicrotask(() => this.onload()); } }
  const loader = new AssetLoader(registry, LoadedImage);
  const pending = loader.preload(registry.requiredIds('beast'));
  assert.equal(loader.loading, true); assert.equal(await pending, true); assert.equal(loader.loading, false);
  for (const id of registry.requiredIds('beast')) for (const frame of registry.get(id).states.idle.frames) assert.equal(loader.isReady(frame), true);
});

test('Game does not enter PLAYING until current-world character assets preload', async () => {
  let release;
  const game = Object.create(Game.prototype); game.worldType = 'human'; game.state = new GameState();
  game.renderer = { assetRegistry: registry, assetLoader: { preload: () => new Promise(resolve => { release = resolve; }) } };
  game.saves = { save() {} }; game.ui = { showLoading() {}, showLoadingError() {}, showPlaying() { game.presented = true; } };
  game.introPage = 0; game.worldSeed = 1; game.chosenOne = null;
  const entering = game.enterPlaying(); assert.notEqual(game.state.current, GameState.States.PLAYING);
  release(true); await entering; assert.equal(game.state.current, GameState.States.PLAYING); assert.equal(game.presented, true);
});

test('legacy procedural character path is absent from active renderer', async () => {
  const source = await readFile(new URL('../src/rendering/Renderer.js', import.meta.url), 'utf8');
  assert.match(source, /characterRenderer\.render/);
  assert.doesNotMatch(source, /palettes|body-part|arc\(0, -9/);
  assert.equal(typeof Renderer.prototype.drawHuman, 'undefined');
  assert.equal(typeof Renderer.prototype.drawAnimal, 'undefined');
});
