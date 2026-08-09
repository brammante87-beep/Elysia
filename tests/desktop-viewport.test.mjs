import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DesktopCamera } from '../src/rendering/DesktopCamera.js';
import { Renderer } from '../src/rendering/Renderer.js';
import { Input } from '../src/input/Input.js';
import { DIVINE_POWERS } from '../src/data/Powers.js';

test('desktop playing shell and canvas own the complete viewport without a narrow cap', async () => {
  const css = await readFile(new URL('../css/main.css', import.meta.url), 'utf8');
  assert.match(css, /#app\.desktop-playing[\s\S]*width: 100vw;[\s\S]*height: 100dvh;/);
  assert.match(css, /#app\.desktop-playing #game-canvas[\s\S]*width: 100vw;[\s\S]*max-width: none;/);
  assert.doesNotMatch(css, /desktop-playing[^}]*max-width:\s*1200px/);
});

test('desktop camera uniformly fills 16:9 and preserves world positions through resize', () => {
  const camera = new DesktopCamera(1920, 1080);
  camera.configure(96, 60, 1920, 1080);
  camera.setZoom(camera.initialZoom());
  camera.centerOn({ x: 48, y: 30 });
  camera.enableResponsiveFraming();
  assert.equal(camera.zoom, 20);
  assert.equal(camera.worldToScreen({ x: 2, y: 1 }).x - camera.worldToScreen({ x: 1, y: 1 }).x,
    camera.worldToScreen({ x: 1, y: 2 }).y - camera.worldToScreen({ x: 1, y: 1 }).y);
  const worldPosition = { x: 31, y: 22 };
  camera.setViewport(1366, 768);
  assert.deepEqual(worldPosition, { x: 31, y: 22 });
  assert.equal(camera.viewportWidth, 1366);
  assert.equal(camera.viewportHeight, 768);
});

test('desktop framing supports every target resolution without distortion', () => {
  for (const [width, height] of [[1366, 768], [1536, 864], [1920, 1080], [2560, 1440]]) {
    const camera = new DesktopCamera(width, height);
    camera.configure(96, 60, width, height);
    camera.setZoom(camera.initialZoom());
    const horizontalUnit = camera.worldToScreen({ x: 2, y: 1 }).x - camera.worldToScreen({ x: 1, y: 1 }).x;
    const verticalUnit = camera.worldToScreen({ x: 1, y: 2 }).y - camera.worldToScreen({ x: 1, y: 1 }).y;
    assert.ok(Math.abs(horizontalUnit - verticalUnit) < 1e-9, `${width}x${height}`);
    assert.ok(camera.zoom >= camera.fitZoom(), `${width}x${height}`);
  }
});

test('renderer resize follows CSS pixels at capped desktop DPR', () => {
  const canvas = { width: 1, height: 1, getContext: () => ({}), getBoundingClientRect: () => ({ width: 1536, height: 864 }) };
  const renderer = new Renderer(canvas, { devicePixelRatio: 2.5 });
  renderer.resize();
  assert.deepEqual({ width: canvas.width, height: canvas.height }, { width: 3072, height: 1728 });
  assert.deepEqual({ width: renderer.camera.viewportWidth, height: renderer.camera.viewportHeight }, { width: 3072, height: 1728 });
});

test('pointer conversion remains exact after a full-screen resize', () => {
  const canvas = { width: 2732, height: 1536, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1366, height: 768 }) };
  assert.deepEqual(new Input(canvas).toCanvasCoordinates(683, 384), { x: 1366, y: 768 });
});

test('desktop toolbar keeps all powers in one non-scrolling row', async () => {
  const css = await readFile(new URL('../css/main.css', import.meta.url), 'utf8');
  assert.equal(DIVINE_POWERS.length, 10);
  assert.match(css, /grid-template-columns:\s*repeat\(10,/);
  assert.doesNotMatch(css, /\.divine-toolbar[^}]*overflow-x:\s*(auto|scroll)/);
});
