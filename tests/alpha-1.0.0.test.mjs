import test from 'node:test';
import assert from 'node:assert/strict';
import { MigrationNarrative } from '../src/data/MigrationNarrative.js';
import { Settlement } from '../src/settlements/Settlement.js';
import { SettlementRules } from '../src/settlements/SettlementRules.js';
import { Config } from '../src/core/Config.js';
import { Character } from '../src/entities/Character.js';
import { World } from '../src/world/World.js';

test('migration narrative owns broad, story-compatible Human and species-specific Beast pools', () => {
  assert.equal(MigrationNarrative.StoryTypes.length, 9);
  assert.ok(MigrationNarrative.OriginWorlds.length >= 25);
  assert.ok(Object.values(MigrationNarrative.Human).flat().length >= 18);
  assert.ok(Object.values(MigrationNarrative.Beast).flat().length >= 9);
  const narrative = new MigrationNarrative();
  const famine = narrative.dialogue('FAMINE', 'Nymara', null, 1);
  assert.match(famine.lines[0], /Nymara/);
  assert.ok(MigrationNarrative.Human.FAMINE.some(([id]) => id === famine.id));
  const deer = narrative.dialogue('WAR', 'Veloran', 'deer', 2);
  assert.ok(MigrationNarrative.Beast.deer.some(([id]) => id === deer.id));
});

test('settlement semantic rules enforce four arrivals, establishment, and three reservations', () => {
  const settlement = new Settlement({ id: 's', externalArrivalCount: 0 });
  assert.equal(settlement.state, 'GROWING');
  assert.equal(SettlementRules.canConstructOrdinaryHome(settlement), true);
  settlement.externalArrivalCount = Config.MAX_EXTERNAL_ARRIVALS;
  assert.equal(SettlementRules.canReceiveExternalArrival(settlement), false);
  settlement.establish(); settlement.externalArrivalCount = 3;
  assert.equal(SettlementRules.canReceiveExternalArrival(settlement), false);
  assert.equal(SettlementRules.canConstructOrdinaryHome(settlement), false);
  const exalted = new Character({ id:'e', name:'E', position:{x:0,y:0}, worldType:'human', isExalted:true, lifeStage:'adult' });
  assert.equal(SettlementRules.canFoundNewSettlement(exalted, { settlements:[{},{}], foundingReservations:[{}] }), false);
});

test('external history and Elysian origin persist without save-version invalidation', () => {
  const world = new World(); world.create('beast', 4100);
  const native = new Character({ id:'native', name:'N', position:world.findSpawnPosition(), worldType:'beast', species:'deer', chosenOne:true });
  world.addCharacter(native); assert.equal(native.originWorld, 'ELYSIA');
  assert.equal(Config.SAVE_VERSION, 1);
  const restored = new Character(new Character({ id:'m', name:'M', position:{x:1,y:1}, worldType:'beast', species:'deer', chosenOne:false, newcomer:true, originWorld:'Orthea', arrivalStoryType:'EXILE', arrivalLineId:'line' }).toJSON());
  assert.equal(restored.originWorld, 'Orthea'); assert.equal(restored.arrivalStoryType, 'EXILE');
});
