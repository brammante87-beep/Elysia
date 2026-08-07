import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/World.js';
import { Character } from '../src/entities/Character.js';
import { House } from '../src/entities/House.js';
import { Household } from '../src/households/Household.js';
import { Pathfinder } from '../src/world/Pathfinder.js';
import { Config } from '../src/core/Config.js';

class TimeGameplayFixture {
  create(type = 'human', seed = 1701) {
    const world = new World(); world.create(type, seed);
    const origin = world.findSpawnPosition(); const homePosition = world.findBuildPosition(origin);
    const species = type === 'beast' ? 'deer' : undefined;
    const chosen = new Character({ id:'chosen', name:'Blu', position:{...origin}, worldType:type, species, reproductiveSex:'female', sexCharacteristics:'female', genderIdentity:'woman', sexualOrientation:'bisexual', chosenOne:true });
    const partner = new Character({ id:'partner', name:'Elia', position:{x:origin.x + 1,y:origin.y}, worldType:type, species, reproductiveSex:'male', sexCharacteristics:'male', genderIdentity:'man', sexualOrientation:'bisexual', chosenOne:false });
    const home = new House({ id:'home-1', position:homePosition, completed:true, householdId:'household-1', storage:{wood:6,water:6,food:6} });
    const household = new Household({ id:'household-1', memberIds:[chosen.id,partner.id], homeBuildingId:home.id });
    chosen.partnerId=partner.id; partner.partnerId=chosen.id;
    for (const character of [chosen,partner]) { character.householdId=household.id; character.homeBuildingId=home.id; world.addCharacter(character); }
    world.hut=home; world.homes=[home]; world.households=[household]; world.settlementProgression.ensureFoundingSettlement();
    return { world, chosen, partner, home, household };
  }
  advance(world, seconds, step = .1) { for (let elapsed=0; elapsed < seconds-Number.EPSILON; elapsed += step) world.update(Math.min(step, seconds-elapsed)); }
}

test('World.update completes the visible founding-household meal lifecycle', () => {
  const fixture=new TimeGameplayFixture(); const {world,chosen,partner,home}=fixture.create(); world.diagnostics.enabled=true;
  let observedCall=false, observedPot=false, observedChosenReturn=false; for(let elapsed=0;elapsed<64;elapsed+=.1){world.update(.1);observedCall ||= world.meals.speechText==='È pronto!';observedPot ||= partner.carryingMeal==='pot';observedChosenReturn ||= world.ais.get(chosen.id).task==='returnHome';}
  assert.equal(observedCall,true); assert.equal(observedPot,true); assert.equal(observedChosenReturn,true);
  fixture.advance(world,4.5);
  assert.equal(world.meals.mealEventsCompleted,1); assert.deepEqual(home.storage.values,{wood:4,water:4,food:4});
  assert.ok(world.diagnostics.events.some(event=>event.type==='MEAL_COMPLETED'));
});

test('World.update returns a real couple during the 20-second Night and creates its conceived Child at the following Dawn', () => {
  const fixture=new TimeGameplayFixture(); const {world,chosen,partner,household}=fixture.create(); world.reproduction.random.next=()=>0;
  fixture.advance(world,70.1); fixture.advance(world,19.8);
  assert.equal(chosen.insideHome,true); assert.equal(partner.insideHome,true); assert.equal(world.reproduction.intimacyEvents,1); assert.equal(world.reproduction.pendingBirths.length,1);
  fixture.advance(world,.2);
  const child=world.characters.find(character=>character.lifeStage==='child'); assert.ok(child); assert.equal(child.householdId,household.id); assert.ok(household.memberIds.includes(child.id)); assert.equal(world.reproduction.birthsCreated,1);
  assert.equal(world.effects.find(effect=>effect.type==='newLife').message,"La nuova vita nasce dal legame tra due esseri, l'amore invoca un briciolo del tuo potere anche senza la tua volontà.");
});

test('following Dawn creates a visible reachable coastline newcomer across Human island seeds and Beast terrain', () => {
  const fixture=new TimeGameplayFixture();
  for (const [type,seed] of [...Array.from({length:8},(_,index)=>['human',2100+index]),['beast',3100]]) {
    const {world}=fixture.create(type,seed); fixture.advance(world,90.1);
    const newcomer=world.characters.find(character=>character.newcomer); assert.ok(newcomer,`${type} seed ${seed}`);
    assert.equal(world.isWalkable(newcomer.arrivalPosition.x,newcomer.arrivalPosition.y),true); assert.ok(new Pathfinder().findPath(world.terrain,newcomer.arrivalPosition,world.settlements[0].center).length>0);
    if(type==='human') assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!world.isWalkable(newcomer.arrivalPosition.x+dx,newcomer.arrivalPosition.y+dy)));
    assert.ok(newcomer.speechText.includes(newcomer.originWorld)); assert.equal(world.newcomers.newcomersCreated,1);
  }
});

test('pending meal, conception, intimacy cycle, and newcomer retry survive Continue without duplication or loss', () => {
  const fixture=new TimeGameplayFixture(); const {world}=fixture.create('human',4100); world.meals.elapsed=Config.MEAL_INTERVAL_SECONDS; world.newcomers.pendingArrivalCycle=2;
  const [first,second]=world.characters; first.insideHome=second.insideHome=true; world.reproduction.random.next=()=>0; world.worldTime.elapsed=70; world.worldTime.phase='night'; world.update(.1);
  const restored=new World(); restored.restore('human',4100,null,world.toJSON());
  assert.equal(restored.meals.elapsed,Config.MEAL_INTERVAL_SECONDS); assert.equal(restored.reproduction.pendingBirths.length,1); assert.equal(restored.reproduction.evaluateNight(1),false); assert.equal(restored.newcomers.lastArrivalCycle,2); assert.equal(restored.newcomers.pendingArrivalCycle,null); assert.equal(restored.newcomers.newcomersCreated,1);
});
