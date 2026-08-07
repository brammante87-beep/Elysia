import test from 'node:test';
import assert from 'node:assert/strict';
import { Config } from '../src/core/Config.js';
import { WorldTime } from '../src/world/WorldTime.js';
import { Flower } from '../src/entities/Flower.js';
import { Character } from '../src/entities/Character.js';
import { ReproductionSystem } from '../src/simulation/ReproductionSystem.js';

class GrowthWorldStub {
  constructor(character) { this.characters = [character]; this.ais = new Map([[character.id, { setTask() {} }]]); }
  ensureAI(character) { return this.ais.get(character.id); }
}

test('official phase boundaries and cycle are exact', () => {
  assert.deepEqual([Config.DAWN_DURATION_SECONDS, Config.FULL_DAY_DURATION_SECONDS, Config.DUSK_DURATION_SECONDS, Config.NIGHT_DURATION_SECONDS, Config.WORLD_CYCLE_SECONDS], [5, 55, 10, 20, 90]);
  const time = new WorldTime();
  for (const [second, phase] of [[0,'dawn'],[4.999,'dawn'],[5,'day'],[59.999,'day'],[60,'dusk'],[69.999,'dusk'],[70,'night'],[89.999,'night']]) assert.equal(time.phaseAt(second), phase);
  time.update(90); assert.equal(time.cycle, 2); assert.equal(time.elapsed, 0); assert.equal(time.phase, 'dawn');
  time.update(90); assert.equal(time.cycle, 3);
});

test('paused WorldTime and exact daytime accounting exclude night', () => {
  const time = new WorldTime(); const saved = time.toJSON();
  time.update(90, false); assert.deepEqual(time.toJSON(), saved);
  const cycle = time.cycle; const elapsed = time.elapsed; time.update(90);
  assert.equal(time.daytimeBetween(cycle, elapsed), 70);
});

test('flower growth uses 90 elapsed simulation seconds, never a boundary', () => {
  for (const created of [1, 89]) {
    const flower = new Flower({ id: 'flower-1', position: {x: 1, y: 1}, creationCycle: 1, creationSimulationTime: created });
    assert.equal(flower.isReady(created + 89), false);
    assert.equal(flower.isReady(created + 90), true);
  }
});

test('child adulthood uses 90 elapsed simulation seconds', () => {
  const child = new Character({ id: 'child', name: 'Luce', position: {x:0,y:0}, worldType: 'human', lifeStage: 'child', birthCycle: 2, birthSimulationTime: 90 });
  const system = new ReproductionSystem(new GrowthWorldStub(child));
  system.growChildren(179); assert.equal(child.lifeStage, 'child');
  system.growChildren(180); assert.equal(child.lifeStage, 'adult');
});

test('legacy phase time is proportionally normalized and new time round-trips', () => {
  const legacy = new WorldTime({ cycle: 4, elapsed: 270, phase: 'night' });
  assert.equal(legacy.cycle, 4); assert.equal(legacy.elapsed, 80); assert.equal(legacy.phase, 'night');
  assert.deepEqual(new WorldTime(legacy.toJSON()).toJSON(), legacy.toJSON());
});
