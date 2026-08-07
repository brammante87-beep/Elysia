import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/World.js';
import { Character } from '../src/entities/Character.js';
import { Settlement } from '../src/settlements/Settlement.js';
import { House } from '../src/entities/House.js';
import { FirstRivalAttack } from '../src/events/FirstRivalAttack.js';

class RivalHarness {
  constructor() { this.world=new World();this.world.create('human',110);this.first=this.addSettlement(1,{x:12,y:12}); }
  addSettlement(number,position) { const id=`settlement-${number}`,home=new House({id:`home-${number}`,position,completed:true,settlementId:id}); const settlement=new Settlement({id,name:`S${number}`,founderId:`c${number}`,foundingHomeId:home.id,homeBuildingIds:[home.id],center:position});this.world.homes.push(home);this.world.settlements.push(settlement);return settlement; }
  character(id,settlementId,extra={}) { const character=new Character({id,name:id,position:{x:12,y:12},worldType:'human',chosenOne:false,settlementId,...extra});this.world.addCharacter(character);return character; }
  trigger() { const second=this.addSettlement(2,{x:35,y:35});assert.equal(this.world.rivalAttack.notifySettlementRegistered(second),true);return second; }
}

test('only the completed, registered second Settlement triggers the Rival once',()=>{const h=new RivalHarness();assert.equal(h.world.rivalAttack.firstRivalAttackStarted,false);h.world.exaltedFounding.reservations.push({id:'reserved'});assert.equal(h.world.rivalAttack.firstRivalAttackStarted,false);const second=h.trigger();assert.equal(h.world.rivalAttack.phase,'DELAY');assert.equal(h.world.rivalAttack.notifySettlementRegistered(second),false);h.addSettlement(3,{x:52,y:20});assert.equal(h.world.rivalAttack.notifySettlementRegistered(h.world.settlements[2]),false);});

test('preparation freezes simulation and exposes a ten-second countdown',()=>{const h=new RivalHarness();h.trigger();h.world.rivalAttack.enter(FirstRivalAttack.Phases.PREPARATION);const time=h.world.simulationTime,cycle=h.world.worldTime.elapsed;h.world.update(1);assert.equal(h.world.simulationTime,time);assert.equal(h.world.worldTime.elapsed,cycle);assert.equal(h.world.rivalAttack.countdown,9);assert.equal(h.world.rivalAttack.allowsMiracles,true);});

test('preparation exposes a generous semantic Shield target for a Child',()=>{const h=new RivalHarness();h.trigger();const child=h.character('little',h.first.id,{lifeStage:'child',insideHome:true,interactionRadius:.4});h.world.rivalAttack.enter(FirstRivalAttack.Phases.PREPARATION);assert.equal(child.insideHome,false);assert.equal(child.interactionRadius,1.75);assert.equal(h.world.rivalAttack.allowsMiracles,true);});

test('meteor independently protects shielded Adults and Children and consumes shields',()=>{const h=new RivalHarness();h.trigger();const adult=h.character('adult',h.first.id,{hasShield:true});const child=h.character('child',h.first.id,{lifeStage:'child',hasShield:true});const doomedAdult=h.character('doomed-adult',h.first.id,{isArmed:true});const doomedChild=h.character('doomed-child',h.first.id,{lifeStage:'child'});const safe=h.character('safe','settlement-2');h.world.rivalAttack.enter(FirstRivalAttack.Phases.IMPACT);assert.equal(adult.alive,true);assert.equal(child.alive,true);assert.equal(adult.hasShield,false);assert.equal(child.hasShield,false);assert.equal(doomedAdult.alive,false);assert.equal(doomedChild.alive,false);assert.equal(safe.alive,true);assert.equal(h.world.rivalAttack.casualties,2);});

test('impact preserves Settlements, Homes and Castle-like storage while never ending play',()=>{const h=new RivalHarness();h.trigger();const home=h.world.homes[0],id=home.id;home.storage.values={wood:4,water:3,food:2};const before={...home.storage.values};h.character('only',h.first.id);h.world.rivalAttack.enter(FirstRivalAttack.Phases.CASTLE_RESCUE);h.world.rivalAttack.enter(FirstRivalAttack.Phases.IMPACT);assert.equal(h.world.settlements.length,2);assert.equal(h.world.homes[0].id,id);assert.deepEqual(h.world.homes[0].storage.values,before);assert.equal(h.world.rivalAttack.rescueEmitted,true);assert.equal(h.world.characters.filter(c=>c.alive&&c.settlementId===h.first.id).length,0);});

test('completed encounter persists and normal simulation resumes without replay',()=>{const h=new RivalHarness();h.trigger();h.world.rivalAttack.enter(FirstRivalAttack.Phases.COMPLETE);const saved=h.world.toJSON();const restored=new World();restored.restore('human',110,null,saved);assert.equal(restored.rivalAttack.firstRivalAttackCompleted,true);assert.equal(restored.rivalAttack.active,false);const time=restored.simulationTime;restored.update(.1);assert.ok(restored.simulationTime>time);assert.equal(restored.rivalAttack.notifySettlementRegistered(restored.settlements[1]),false);});
