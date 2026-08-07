import test from 'node:test';
import assert from 'node:assert/strict';
import { RivalWorlds } from '../src/data/RivalWorlds.js';
import { EnemyTypes } from '../src/data/EnemyTypes.js';
import { Enemy } from '../src/entities/Enemy.js';
import { World } from '../src/world/World.js';
import { Character } from '../src/entities/Character.js';

class CombatHarness {
  constructor(typeId){this.world=new World();this.world.create('beast',120);this.target=new Character({id:'elysian',name:'Guard',position:{x:10,y:10},worldType:'beast',chosenOne:false,isArmed:true});this.world.addCharacter(this.target);this.enemy=new Enemy({id:'enemy-1',typeId,position:{x:4,y:10}});this.world.invasions.enemies=[this.enemy];this.world.invasions.active=true;}
}

test('three persistent Rival Worlds and three differentiated enemy factions are registered',()=>{assert.equal(RivalWorlds.all().length,3);assert.deepEqual(RivalWorlds.all().map(w=>w.id),['rivalWorld1','rivalWorld2','rivalWorld3']);assert.equal(new Set(RivalWorlds.all().map(w=>w.rivalOmnipotentName)).size,3);assert.deepEqual(EnemyTypes.all().map(e=>e.rivalWorldId),RivalWorlds.all().map(w=>w.id));assert.equal(RivalWorlds.meteorAttacker().id,'rivalWorld1');});
test('enemy hostility is semantic and enemies never enter social architecture',()=>{const enemy=new Enemy({id:'e',typeId:'blondWarrior',position:{x:1,y:1}});assert.equal(enemy.factionId,'rivalWorld2');assert.equal(enemy.householdId,null);assert.equal(enemy.behaviourMemory,null);assert.equal(enemy.hasHumanLegs,false);});
test('Lion draw releases a travelling configured Arrow before damage',()=>{const h=new CombatHarness('lionArcher');const initial=h.target.health;for(let i=0;i<13;i++)h.world.combat.updateEnemy(h.enemy,.1);assert.equal(h.world.projectiles.projectiles[0].type,'arrow');assert.equal(h.target.health,initial);h.world.projectiles.update(1);assert.equal(h.target.health,initial-EnemyTypes.get('lionArcher').damage);});
test('Blond Warrior requires spear range and creates no projectile',()=>{const h=new CombatHarness('blondWarrior');h.world.combat.updateEnemy(h.enemy,1);assert.equal(h.world.projectiles.projectiles.length,0);h.enemy.position={x:9,y:10};h.world.combat.updateEnemy(h.enemy,.6);assert.equal(h.target.health,100-EnemyTypes.get('blondWarrior').damage);assert.ok(h.enemy.cooldownRemaining>0);});
test('Dolphin hover gunner fires a faster energy projectile without legs',()=>{const h=new CombatHarness('dolphinGunner');h.world.combat.updateEnemy(h.enemy,.5);const bolt=h.world.projectiles.projectiles[0];assert.equal(h.enemy.hover,true);assert.equal(h.enemy.hasHumanLegs,false);assert.equal(bolt.type,'energyBolt');assert.ok(bolt.speed>EnemyTypes.get('lionArcher').projectileSpeed);});
test('Shield consumes hostile protection and divine Lightning kills an enemy directly',()=>{const h=new CombatHarness('dolphinGunner');h.target.hasShield=true;h.world.combat.applyDamage(h.target,12,'energyBolt');assert.equal(h.target.health,100);assert.equal(h.target.hasShield,false);assert.equal(h.world.invasions.lightningAt(h.enemy.position).alive,false);});
