import test from 'node:test';
import assert from 'node:assert/strict';
import { Config } from '../src/core/Config.js';
import { WorldTime } from '../src/world/WorldTime.js';
import { World } from '../src/world/World.js';
import { WorldTypeId } from '../src/data/WorldTypes.js';
import { CharacterCreator } from '../src/entities/CharacterCreator.js';
import { Character } from '../src/entities/Character.js';
import { Hut } from '../src/entities/Hut.js';
import { House } from '../src/entities/House.js';
import { Household } from '../src/households/Household.js';
import { Dwelling } from '../src/entities/Dwelling.js';
import { CharacterAI } from '../src/ai/CharacterAI.js';
import { CharacterAssetRegistry } from '../src/assets/CharacterAssetRegistry.js';

class Alpha007Harness {
  world(type = WorldTypeId.HUMAN) { const world = new World(); world.create(type, 7007); return world; }
  family(type = WorldTypeId.HUMAN, sexes = ['female', 'male']) {
    const world = this.world(type); const creator = new CharacterCreator();
    const position = world.findSpawnPosition();
    const first = type === WorldTypeId.HUMAN
      ? creator.createHuman({ name:'Blu', sexCharacteristics:sexes[0], genderIdentity:'woman', sexualOrientation:'bisexual' },position,7)
      : creator.createBeast({ name:'Rovo', species:'deer' },position,8);
    const second = new Character(type === WorldTypeId.HUMAN
      ? { id:'partner',name:'Elia',position:{...position},worldType:type,chosenOne:false,sexCharacteristics:sexes[1],genderIdentity:'nonBinary',sexualOrientation:'bisexual' }
      : { id:'partner',name:'Elia',position:{...position},worldType:type,chosenOne:false,species:'deer',reproductiveSex:first.reproductiveSex==='male'?'female':'male' });
    first.partnerId=second.id; second.partnerId=first.id; first.householdId=second.householdId='household-1'; first.homeBuildingId=second.homeBuildingId='hut-1';
    world.addCharacter(first); world.addCharacter(second); world.hut=new House({id:'hut-1',position:world.findBuildPosition(position),storage:{wood:6,water:6,food:6},householdId:'household-1',visualVariant:Dwelling.variant(type,true,first.species)});
    world.households=[new Household({id:'household-1',memberIds:[first.id,second.id],homeBuildingId:'hut-1'})];
    return {world,first,second};
  }
}

test('shared dwelling semantics select Human construction and Beast dens',()=>{
  assert.equal(Dwelling.variant(WorldTypeId.HUMAN,false),'hut'); assert.equal(Dwelling.variant(WorldTypeId.HUMAN,true),'house');
  assert.equal(Dwelling.variant(WorldTypeId.BEAST,false,'dog'),'den.dog'); assert.equal(Dwelling.variant(WorldTypeId.BEAST,true,'dog'),'establishedDen.dog');
  const world=new Alpha007Harness().world(WorldTypeId.BEAST); const chosen=new CharacterCreator().createBeast({name:'Rovo',species:'dog'},world.findSpawnPosition(),2); world.addCharacter(chosen); world.beginHut(world.findBuildPosition(chosen.position)); assert.match(world.hut.visualVariant,/^den/); assert.notEqual(world.hut.visualVariant,'hut');
});

test('world time is exactly five active minutes and crosses every phase',()=>{
  assert.equal(Config.WORLD_CYCLE_SECONDS,300); assert.equal(Config.DAY_DURATION_SECONDS,240); assert.equal(Config.NIGHT_DURATION_SECONDS,60);
  const time=new WorldTime(); const start=time.toJSON(); time.update(50,false); assert.deepEqual(time.toJSON(),start);
  time.update(15); assert.equal(time.phase,'day'); time.update(210); assert.equal(time.phase,'dusk'); time.update(15); assert.equal(time.phase,'night'); time.update(60); assert.equal(time.phase,'dawn'); assert.equal(time.cycle,2); assert.equal(time.elapsed,0);
});

test('night sends household adults home and dawn resumes their existing AI',()=>{
  const {world,first,second}=new Alpha007Harness().family(); world.handleTimePhase('night'); assert.equal(world.ais.get(first.id).task,CharacterAI.Tasks.RETURN_HOME); assert.equal(world.ais.get(second.id).task,CharacterAI.Tasks.RETURN_HOME);
  first.insideHome=second.insideHome=true; world.ais.get(first.id).setTask(CharacterAI.Tasks.RESTING); world.ais.get(second.id).setTask(CharacterAI.Tasks.RESTING); world.handleTimePhase('dawn'); assert.equal(first.insideHome,false); assert.equal(world.ais.get(first.id).task,CharacterAI.Tasks.IDLE);
});

test('intimacy needs both partners inside and biology is independent from identity and orientation',()=>{
  const {world,first,second}=new Alpha007Harness().family(); world.reproduction.random.next=()=>0;
  assert.equal(world.reproduction.evaluateNight(1),false); first.insideHome=second.insideHome=true; assert.equal(world.reproduction.evaluateNight(1),true); assert.ok(world.reproduction.pendingBirth);
  const sameSex=new Alpha007Harness().family(WorldTypeId.HUMAN,['female','female']); sameSex.first.insideHome=sameSex.second.insideHome=true; sameSex.world.reproduction.random.next=()=>0; assert.equal(sameSex.world.reproduction.evaluateNight(1),true); assert.equal(sameSex.world.reproduction.pendingBirth,null);
  second.genderIdentity='woman'; second.sexualOrientation='gayLesbian'; assert.equal(world.reproduction.canConceive(first,second),true);
  first.sexCharacteristics='intersex'; assert.equal(world.reproduction.canConceive(first,second),false);
});

test('one birth has unique semantic lineage, household membership, save continuity and no duplicate',()=>{
  const {world,first,second}=new Alpha007Harness().family(); first.insideHome=second.insideHome=true; world.reproduction.random.next=()=>0; world.reproduction.evaluateNight(1);
  const child=world.reproduction.birthAtDawn(2); assert.ok(child.id); assert.notEqual(child.name,first.name); assert.notEqual(child.name,second.name); assert.deepEqual(child.parentIds,[first.id,second.id]); assert.equal(child.householdId,'household-1'); assert.equal(child.lifeStage,'child'); assert.ok(world.households[0].memberIds.includes(child.id)); assert.equal(world.reproduction.birthAtDawn(2),null); assert.equal(world.ais.get(child.id).task,CharacterAI.Tasks.IDLE);
  const restored=new World(); restored.restore(world.worldType,world.worldSeed,null,world.toJSON()); const savedChild=restored.characters.find(item=>item.id===child.id); assert.deepEqual(savedChild.parentIds,child.parentIds); assert.equal(savedChild.lifeStage,'child'); assert.equal(restored.worldTime.elapsed,world.worldTime.elapsed); assert.equal(restored.characters.filter(item=>item.id===child.id).length,1);
});

test('children cannot gather, use species visuals, remain in household, then grow in place',()=>{
  const {world,first,second}=new Alpha007Harness().family(WorldTypeId.BEAST); first.insideHome=second.insideHome=true; world.reproduction.random.next=()=>0; world.reproduction.evaluateNight(1); const child=world.reproduction.birthAtDawn(2); const id=child.id; const parents=[...child.parentIds]; const home={...world.hut.position}; world.ais.get(id).update(10); assert.equal(world.ais.get(id).task,CharacterAI.Tasks.CHILD_IDLE); assert.ok(Math.hypot(child.position.x-home.x,child.position.y-home.y)<1);
  const registry=new CharacterAssetRegistry(); assert.equal(registry.resolveId(child),'beast.deer.child'); assert.equal(registry.resolveId({...child,species:'cat'}),'beast.cat.child'); assert.equal(registry.resolveId({...child,species:'dog'}),'beast.dog.child');
  world.reproduction.growChildren(3); assert.equal(child.id,id); assert.deepEqual(child.parentIds,parents); assert.equal(child.lifeStage,'adult'); assert.equal(child.species,'deer'); assert.equal(world.ais.get(id).task,CharacterAI.Tasks.IDLE);
});

test('Human adulthood assigns independent valid identity fields',()=>{
  const {world,first,second}=new Alpha007Harness().family(); first.insideHome=second.insideHome=true; world.reproduction.random.next=()=>0; world.reproduction.evaluateNight(1); const child=world.reproduction.birthAtDawn(2); world.reproduction.growChildren(3); assert.ok(CharacterCreator.SexCharacteristics.includes(child.sexCharacteristics)); assert.ok(CharacterCreator.GenderIdentities.includes(child.genderIdentity)); assert.ok(CharacterCreator.SexualOrientations.includes(child.sexualOrientation));
});
