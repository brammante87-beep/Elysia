import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldGenerator } from '../src/world/WorldGenerator.js';
import { TerrainVisualModel } from '../src/rendering/TerrainVisualModel.js';
import { World } from '../src/world/World.js';

test('visual terrain uses a substantially higher resolution than the logical grid', () => {
  const terrain = new WorldGenerator().generate('human', 42);
  const visual = new TerrainVisualModel(terrain, 'human', 42);
  assert.ok(visual.pixelWidth >= terrain.width * 10);
  assert.ok(visual.pixelHeight >= terrain.height * 10);
});

test('smooth coastline contour is dense, sub-cell, and independent of terrain rectangles', () => {
  const terrain = new WorldGenerator().generate('human', 42);
  const visual = new TerrainVisualModel(terrain, 'human', 42);
  const contour = visual.contour();
  assert.ok(contour.length > terrain.width * 2);
  assert.ok(contour.some(point => !Number.isInteger(point.x) && !Number.isInteger(point.y)));
  assert.equal(contour.some(point => point.x < 0 || point.x > terrain.width), false);
});

test('visual decoration is seeded, world-space, and does not alter walkability', () => {
  const terrain = new WorldGenerator().generate('human', 761);
  const walkability = terrain.cells.map((_, index) => terrain.isWalkable(index % terrain.width, Math.floor(index / terrain.width)));
  const first = new TerrainVisualModel(terrain, 'human', 761);
  const second = new TerrainVisualModel(terrain, 'human', 761);
  assert.deepEqual(first.decorations, second.decorations);
  assert.deepEqual(terrain.cells.map((_, index) => terrain.isWalkable(index % terrain.width, Math.floor(index / terrain.width))), walkability);
  assert.ok(first.decorations.every(item => item.x <= terrain.width && item.y <= terrain.height));
});

test('visual decoration is absent from gameplay persistence', () => {
  const world = new World(); world.create('plant', 71);
  const visual = new TerrainVisualModel(world.terrain, 'plant', 71);
  assert.ok(visual.decorations.length > 0);
  assert.doesNotMatch(JSON.stringify(world.toJSON()), /decorations|tuft|flower|shrub|rock/);
});

test('world coordinates and cache size do not depend on viewport dimensions', () => {
  const terrain = new WorldGenerator().generate('beast', 3);
  const visual = new TerrainVisualModel(terrain, 'beast', 3);
  assert.equal(visual.width, 96); assert.equal(visual.height, 60);
  assert.equal('viewportWidth' in visual, false); assert.equal('viewportHeight' in visual, false);
});
