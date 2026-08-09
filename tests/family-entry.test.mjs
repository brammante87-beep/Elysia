import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FamilyEntryRouter } from '../src/presentation/FamilyEntryRouter.js';
import { EntryPresentation } from '../src/presentation/EntryPresentation.js';
import { PresentationProfile } from '../src/presentation/PresentationProfile.js';
import { PresentationMode } from '../src/presentation/PresentationMode.js';
import { CharacterCreationScreen } from '../src/ui/CharacterCreationScreen.js';
import { FamilyIdentityGenerator } from '../src/entities/FamilyIdentityGenerator.js';
import { CharacterCreator } from '../src/entities/CharacterCreator.js';
import { SaveManager } from '../src/persistence/SaveManager.js';
import { Renderer } from '../src/rendering/Renderer.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

class TextContext {
  constructor() { this.text = []; }
  fillText(value) { this.text.push(value); }
  save() {} restore() {} fillRect() {} strokeRect() {}
}

test('family static entry is GitHub Pages compatible and resolves mode before game bootstrap', async () => {
  const html = await readFile(new URL('../family.html', import.meta.url), 'utf8');
  const bootstrap = await readFile(new URL('../src/family.js', import.meta.url), 'utf8');
  assert.match(html, /type="module" src="src\/family\.js"/);
  assert.match(bootstrap, /FamilyEntryRouter/);
  assert.doesNotMatch(bootstrap, /Game/);
});

test('family entry routes desktop and phone through existing device decision', () => {
  const location = { search: '?mode=standard&campaign=kids', hash: '#start' };
  assert.equal(new FamilyEntryRouter(location, { resolve: () => PresentationProfile.DESKTOP }).destination(), 'desktop.html?campaign=kids&familyEntry=1#start');
  assert.equal(new FamilyEntryRouter(location, { resolve: () => PresentationProfile.MOBILE }).destination(), 'index2.html?campaign=kids&familyEntry=1#start');
});

test('family marker is authoritative and locks ordinary mode changes while standard remains available', () => {
  const entry = new EntryPresentation({ search: '?mode=standard&familyEntry=1' });
  const family = new PresentationProfile(PresentationProfile.DESKTOP, entry.mode(), entry.modeLockedByEntry());
  assert.equal(family.isFamily, true);
  assert.equal(family.setMode(PresentationMode.STANDARD), false);
  assert.equal(family.isFamily, true);
  const standard = new PresentationProfile(PresentationProfile.DESKTOP);
  assert.equal(standard.isFamily, false);
  assert.equal(standard.setMode(PresentationMode.FAMILY), true);
});

test('family Human creation exposes only name and cosmetic appearance', () => {
  const screen = new CharacterCreationScreen({}, new PresentationProfile(PresentationProfile.DESKTOP, PresentationMode.FAMILY, true));
  const fields = screen.familyHumanFields();
  assert.match(fields, /appearanceStyle/);
  assert.doesNotMatch(fields, /sexCharacteristics|genderIdentity|sexualOrientation|sessual|genere|orientamento/i);
});

test('family identity generator creates complete varied semantic identity', () => {
  const generator = new FamilyIdentityGenerator();
  const identities = [1, 2, 3].map(appearanceStyle => generator.generate({ name: 'Ari', appearanceStyle }, 47));
  for (const identity of identities) {
    assert.ok(CharacterCreator.SexCharacteristics.includes(identity.sexCharacteristics));
    assert.ok(CharacterCreator.GenderIdentities.includes(identity.genderIdentity));
    assert.ok(CharacterCreator.SexualOrientations.includes(identity.sexualOrientation));
  }
  assert.ok(new Set(identities.map(identity => JSON.stringify(identity))).size > 1);
});

test('same save envelope and complete identity interoperate across modes and devices', () => {
  const storage = new MemoryStorage();
  const identity = new FamilyIdentityGenerator().generate({ name: 'Blu', appearanceStyle: 2 }, 18);
  const save = new SaveManager(storage);
  save.save({ chosenOne: identity, world: { relationships: { unchanged: true }, reproduction: { birthsCreated: 2 } } });
  for (const device of [PresentationProfile.DESKTOP, PresentationProfile.MOBILE]) {
    for (const mode of [PresentationMode.STANDARD, PresentationMode.FAMILY]) {
      const loaded = new SaveManager(storage).load().data;
      assert.deepEqual(loaded.chosenOne, identity);
      assert.equal(loaded.world.relationships.unchanged, true);
      assert.equal(loaded.world.reproduction.birthsCreated, 2);
      assert.equal(new PresentationProfile(device, mode).id, device);
    }
  }
});

test('family character panel filters metadata and intimacy uses safe symbols', () => {
  const context = new TextContext();
  const renderer = Object.create(Renderer.prototype);
  Object.assign(renderer, { presentationMode: PresentationMode.FAMILY, context, canvas: { width: 1200 }, camera: { worldToScreen: point => point }, world: {
    selectedCharacterId: 'chosen', characters: [{ id: 'chosen', name: 'Ari', chosenOne: true, originWorld: 'ELYSIA', birthCycle: null, genderIdentity: 'nonBinary', sexualOrientation: 'bisexual' }], ais: new Map(), households: [],
  } });
  renderer.drawCharacterInfo();
  renderer.drawIntimacyHearts({ position: { x: 1, y: 1 }, age: 1, visualVariant: 2 });
  const output = context.text.join(' ');
  assert.doesNotMatch(output, /Identità|Orientamento|♂|♀|⚥/);
  assert.match(output, /[♥★✦✧]/);
});
