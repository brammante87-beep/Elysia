import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { HumanVisualProfileResolver } from '../src/assets/HumanVisualProfileResolver.js';
import { CharacterAssetRegistry } from '../src/assets/CharacterAssetRegistry.js';
import { HumanIdleAnimation } from '../src/rendering/HumanIdleAnimation.js';
import { CharacterRenderer } from '../src/rendering/CharacterRenderer.js';
import { Character } from '../src/entities/Character.js';
import { CharacterCreator } from '../src/entities/CharacterCreator.js';

const resolver = new HumanVisualProfileResolver();
const registry = new CharacterAssetRegistry();
const human = (sexCharacteristics, genderIdentity, sexualOrientation = 'heterosexual') => ({ sexCharacteristics, genderIdentity, sexualOrientation, worldType: 'human', lifeStage: 'adult' });

test('semantic identity resolves the intended presentation profiles', () => {
  assert.equal(resolver.resolve(human('male', 'man')), 'human.base');
  assert.equal(resolver.resolve(human('female', 'woman')), 'human.femaleWomanLongHair');
  assert.equal(resolver.resolve(human('female', 'woman', 'gayLesbian')), 'human.femaleWomanShortHair');
  assert.equal(resolver.resolve(human('female', 'woman', 'bisexual')), 'human.femaleWomanTiedHair');
  assert.equal(resolver.resolve(human('female', 'man')), 'human.masculine');
  assert.equal(resolver.resolve(human('male', 'woman')), 'human.femaleWomanLongHair');
  assert.equal(resolver.resolve(human('male', 'nonBinary')), 'human.nonBinary');
});

test('intersex identities retain distinct orange and green profile family members', () => {
  assert.deepEqual(['man', 'woman', 'nonBinary'].map(gender => resolver.resolve(human('intersex', gender))), ['human.intersexMan', 'human.intersexWoman', 'human.intersexNonBinary']);
});

test('every valid adult identity resolves complete authored animation assets', async () => {
  for (const sex of CharacterCreator.SexCharacteristics) for (const gender of CharacterCreator.GenderIdentities) for (const orientation of CharacterCreator.SexualOrientations) {
    const id = resolver.resolve(human(sex, gender, orientation)); const definition = registry.get(id);
    assert.ok(definition, `${sex}/${gender}/${orientation} has ${id}`);
    for (const state of ['idle', 'armGesture', 'walk']) {
      assert.ok(definition.states[state]?.frames.length >= 2, `${id} supports ${state}`);
      for (const path of definition.states[state].frames) await access(new URL(`../${path}`, import.meta.url));
    }
  }
});

test('occasional visual gesture lifts, holds, lowers, and returns to idle', () => {
  const animation = new HumanIdleAnimation(() => 0); const character = { id: 'ari', visualState: 'idle', lifeStage: 'adult' };
  assert.equal(animation.state(character, 0), 'idle'); assert.equal(animation.state(character, 3.99), 'idle');
  assert.equal(animation.state(character, 4), 'armGesture'); assert.equal(animation.state(character, 5), 'armGesture');
  assert.equal(animation.state(character, 5.36), 'idle'); assert.equal(animation.state(character, 9), 'idle');
  character.visualState = 'walk'; assert.equal(animation.state(character, 9.1), 'walk');
});

test('children retain child art and resolve adult identity immediately on maturation', () => {
  const character = new Character({ id: 'child', name: 'Ari', position: { x: 1, y: 2 }, worldType: 'human', lifeStage: 'child', sexCharacteristics: 'female', genderIdentity: 'woman', sexualOrientation: 'bisexual' });
  assert.equal(registry.resolveId(character), 'human.child'); character.lifeStage = 'adult';
  assert.equal(registry.resolveId(character), 'human.femaleWomanTiedHair');
});

test('visual resolution and save reconstruction preserve identity and gameplay geometry', () => {
  const character = new Character({ id: 'stable', name: 'Ari', position: { x: 1, y: 2 }, worldType: 'human', sexCharacteristics: 'intersex', genderIdentity: 'woman', sexualOrientation: 'bisexual' });
  const before = [character.id, character.collisionRadius, character.interactionRadius]; const profile = registry.resolveId(character);
  const restored = new CharacterCreator().restore(JSON.parse(JSON.stringify(character.toJSON())));
  assert.deepEqual([character.id, character.collisionRadius, character.interactionRadius], before); assert.equal(registry.resolveId(restored), profile);
  assert.doesNotMatch(JSON.stringify(character.toJSON()), /assets\/characters|\.svg/);
});

test('equipment layers render for every adult Human profile without replacing its sprite', () => {
  const calls = { images: 0, strokes: 0, ellipses: 0 };
  const context = { save() {}, restore() {}, beginPath() {}, fill() {}, strokeText() {}, fillText() {}, moveTo() {}, lineTo() {}, arc() {}, ellipse() { calls.ellipses += 1; }, stroke() { calls.strokes += 1; }, drawImage() { calls.images += 1; }, createRadialGradient: () => ({ addColorStop() {} }) };
  const renderer = new CharacterRenderer(context, registry, { get: () => ({}) });
  for (const id of HumanVisualProfileResolver.ProfileIds) renderer.render({ ...human('intersex', 'woman'), id, name: 'Ari', visualState: 'walk', isExalted: true, isArmed: true, hasShield: true }, { x: 50, y: 50 }, 1, 10);
  assert.equal(calls.images, HumanVisualProfileResolver.ProfileIds.length); assert.ok(calls.strokes >= HumanVisualProfileResolver.ProfileIds.length * 3); assert.ok(calls.ellipses >= HumanVisualProfileResolver.ProfileIds.length * 2);
});
