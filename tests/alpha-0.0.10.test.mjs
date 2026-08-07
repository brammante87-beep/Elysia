import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/World.js';
import { Character } from '../src/entities/Character.js';
import { House } from '../src/entities/House.js';
import { Household } from '../src/households/Household.js';
import { Miracles } from '../src/miracles/Miracles.js';
import { Config } from '../src/core/Config.js';
import { WorldTime } from '../src/world/WorldTime.js';

class TheftFixture {
  constructor(stage = 'adult') {
    this.world = new World(); this.world.create('human', 1010);
    const origin = this.world.findSpawnPosition();
    this.thief = new Character({ id:'thief', name:'Lia', position:origin, worldType:'human', chosenOne:true, lifeStage:stage, behaviourPreferences:{theft:.5} });
    this.victim = new Character({ id:'victim', name:'Noa', position:{x:origin.x+4,y:origin.y}, worldType:'human', chosenOne:false });
    this.own = new House({id:'own',position:{x:origin.x+1,y:origin.y},householdId:'h1',occupancy:'occupied',storage:{wood:0,water:4,food:4}});
    this.other = new House({id:'other',position:{x:origin.x+3,y:origin.y},householdId:'h2',occupancy:'occupied',storage:{wood:3,water:3,food:3}});
    this.world.homes=[this.own,this.other]; this.world.hut=this.own;
    this.world.households=[new Household({id:'h1',memberIds:['thief'],homeBuildingId:'own'}),new Household({id:'h2',memberIds:['victim'],homeBuildingId:'other'})];
    Object.assign(this.thief,{householdId:'h1',homeBuildingId:'own'}); Object.assign(this.victim,{householdId:'h2',homeBuildingId:'other'});
    this.world.addCharacter(this.thief); this.world.addCharacter(this.victim); this.ai=this.world.ais.get('thief'); this.miracles=new Miracles(this.world);
  }
  start() { this.ai.theft.cooldown=0; this.ai.theft.decisionTimer=0; return this.ai.theft.consider(()=>0); }
  take() { this.ai.theft.arriveAtVictim(); this.ai.theft.take(); }
}

test('theft eligibility excludes children, dead, night, meals and permits a needy living adult',()=>{
  const child=new TheftFixture('child'); assert.equal(child.start(),false);
  const dead=new TheftFixture(); dead.thief.alive=false; assert.equal(dead.start(),false);
  const night=new TheftFixture(); night.world.worldTime.phase=WorldTime.Phases.NIGHT; assert.equal(night.start(),false);
  const meal=new TheftFixture(); meal.world.meals.state='eating'; assert.equal(meal.start(),false);
  const adult=new TheftFixture(); assert.equal(adult.start(),true); assert.equal(adult.ai.theft.state.resource,'wood');
});

test('target selection follows need, rejects own/shared/vacant storage and reserves one unit',()=>{
  const f=new TheftFixture(); const choice=f.ai.theft.selectTarget(); assert.equal(choice.resource,'wood'); assert.equal(choice.victimHomeId,'other'); assert.notEqual(choice.ownHomeId,choice.victimHomeId);
  f.other.householdId='h1'; assert.equal(f.ai.theft.selectTarget(),null); f.other.householdId='h2'; f.other.occupancy='vacant'; assert.equal(f.ai.theft.selectTarget(),null);
});

test('theft sequence transfers exactly one, keeps storage nonnegative, and toggles indicator/cooldown',()=>{
  const f=new TheftFixture(); assert.equal(f.start(),true); assert.equal(f.thief.theftIndicator,true); assert.match(f.ai.status(),/Sta rubando legna/);
  f.take(); assert.equal(f.other.storage.get('wood'),2); assert.equal(f.ai.carried.wood,1); f.ai.theft.deposit();
  assert.equal(f.own.storage.get('wood'),1); assert.equal(f.thief.theftIndicator,false); assert.equal(f.ai.theft.isActive(),false); assert.ok(f.ai.theft.cooldown>0); assert.equal(f.ai.theft.consider(()=>0),false);
  f.other.storage.values.wood=0; f.ai.theft.cooldown=0; f.ai.theft.decisionTimer=0; assert.equal(f.ai.theft.selectTarget(),null); assert.equal(f.other.storage.get('wood'),0);
});

test('Ray of Light and night interruption return a carried unit to the victim',()=>{
  for (const mode of ['ray','night']) { const f=new TheftFixture(); f.start(); f.take(); const before=f.other.storage.get('wood');
    if(mode==='ray') assert.ok(f.miracles.cast('rayOfLight',f.world.findBuildPosition(f.thief.position))); else f.ai.returnHome();
    assert.equal(f.ai.theft.isActive(),false); assert.equal(f.ai.carried.wood,0); assert.equal(f.other.storage.get('wood'),before+1);
  }
});

test('contextual Lightning teaches disapproval and cancels, while unrelated Lightning does not teach',()=>{
  const f=new TheftFixture(); const initial=f.thief.behaviourPreferences.theft; f.start(); f.miracles.cast('lightning',f.thief.position);
  assert.equal(f.thief.behaviourPreferences.theft,Math.max(0,initial-Config.THEFT_TEACHING_AMOUNT)); assert.equal(f.ai.theft.isActive(),false);
  const learned=f.thief.behaviourPreferences.theft; f.miracles.cast('lightning',f.thief.position); assert.equal(f.thief.behaviourPreferences.theft,learned);
});

test('contextual Blessing teaches approval, continues theft, increments count and permits an Exalted thief',()=>{
  const f=new TheftFixture(); f.thief.behaviourPreferences.theft=.2; f.start();
  for(let i=0;i<5;i++) f.miracles.cast('blessing',f.thief.position);
  assert.equal(f.thief.blessingCount,5); assert.equal(f.thief.isExalted,true); assert.equal(f.ai.theft.isActive(),true); assert.equal(f.thief.behaviourPreferences.theft,1);
  f.ai.cancelTheft(); const learned=f.thief.behaviourPreferences.theft; f.miracles.cast('blessing',f.thief.position); assert.equal(f.thief.behaviourPreferences.theft,learned);
});

test('behaviour learning clamps and changes deterministic future theft decisions',()=>{
  const punished=new TheftFixture(); punished.thief.behaviourMemory.teach('theft',-5); assert.equal(punished.thief.behaviourPreferences.theft,0); assert.equal(punished.start(),false);
  const approved=new TheftFixture(); approved.thief.behaviourMemory.teach('theft',5); assert.equal(approved.thief.behaviourPreferences.theft,1); assert.equal(approved.start(),true);
});

test('third Lightning still kills and deterministic theft cleanup prevents a dead deposit',()=>{
  const f=new TheftFixture(); f.start(); f.take(); f.thief.lightningStrikeCount=2; const victimBefore=f.other.storage.get('wood'); f.miracles.cast('lightning',f.thief.position);
  assert.equal(f.thief.alive,false); assert.equal(f.ai.theft.isActive(),false); assert.equal(f.ai.carried.wood,0); assert.equal(f.other.storage.get('wood'),victimBefore+1); assert.equal(f.ai.theft.deposit(),false); assert.equal(f.own.storage.get('wood'),0);
  assert.ok(f.world.households.find(h=>h.id==='h2')); assert.equal(f.victim.householdId,'h2');
});

test('save preserves learned tendency and cooldown while Continue safely cancels an in-progress theft',()=>{
  const f=new TheftFixture(); f.thief.behaviourMemory.teach('theft',.2); f.start(); f.take(); const saved=f.world.toJSON(); const restored=new World(); restored.restore('human',1010,null,saved);
  const character=restored.characters.find(c=>c.id==='thief'); const ai=restored.ais.get('thief'); assert.equal(character.behaviourPreferences.theft,f.thief.behaviourPreferences.theft); assert.equal(ai.theft.isActive(),false); assert.ok(ai.theft.cooldown>0); assert.equal(ai.carried.wood,0); assert.equal(restored.findHome('other').storage.get('wood'),3);
});

test('theft indicator is an authored crossed-stroke canvas effect, not debug text', async()=>{
  const { CharacterRenderer } = await import('../src/rendering/CharacterRenderer.js');
  const strokes=[]; const context={save(){},restore(){},beginPath(){},moveTo(x,y){strokes.push(['move',x,y]);},lineTo(x,y){strokes.push(['line',x,y]);},stroke(){strokes.push(['stroke']);}};
  new CharacterRenderer(context,null,null).drawTheftIndicator({x:50,y:80},30,60);
  assert.equal(strokes.filter(item=>item[0]==='line').length,2); assert.equal(strokes.at(-1)[0],'stroke');
});
