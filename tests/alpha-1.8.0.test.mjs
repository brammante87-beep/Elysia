import test from 'node:test';
import assert from 'node:assert/strict';
import { SettlementRelationship } from '../src/diplomacy/SettlementRelationship.js';
import { SettlementDiplomacySystem } from '../src/diplomacy/SettlementDiplomacySystem.js';
import { Settlement } from '../src/settlements/Settlement.js';
import { ResourceStorage } from '../src/resources/ResourceStorage.js';
import { Config } from '../src/core/Config.js';

const settlement=(id,x)=>new Settlement({id,name:id,founderId:`${id}-adult`,center:{x,y:1},foundingHomeId:`${id}-home`});
const adult=(id,s,x)=>({id,name:id,alive:true,lifeStage:'adult',settlementId:s,position:{x,y:1},parentIds:[],reputation:{entries:[]}});
const makeWorld=()=>{const settlements=[settlement('a',1),settlement('b',5),settlement('c',8)],characters=[adult('a-adult','a',1),adult('b-adult','b',5),adult('c-adult','c',8)],homes=settlements.map((s,i)=>({id:`${s.id}-home`,settlementId:s.id,storage:new ResourceStorage({food:i?0:6,water:3,wood:3},10)}));const terrain={getTerrainAt(){return'grass';},isWalkable(){return true;},width:12,height:4};return{settlements,characters,homes,terrain,worldTime:{cycle:10},diagnostics:{trace(){}},dialogue:{say(){}},findHome(id){return homes.find(h=>h.id===id);}};};

test('Alpha 1.8 version and all three independent pair records',()=>{const w=makeWorld(),d=new SettlementDiplomacySystem(w);assert.equal(Config.VERSION,'Alpha 1.8.5');assert.equal(d.relationships.length,3);d.relation('a','b').change('a',{trust:20});assert.equal(d.view('a','c').trust,0);assert.equal(d.view('b','a').trust,0);assert.equal(new SettlementDiplomacySystem(w,d.toJSON()).view('a','b').trust,20);});
test('status is dimensional, hysteretic and minor tension decays',()=>{const r=new SettlementRelationship({settlementAId:'a',settlementBId:'b'});r.change('a',{trust:80,affinity:60,cooperation:60});assert.equal(r.perception('a').statusSummary,'FRIENDLY');r.change('b',{tension:90});assert.equal(r.perception('b').statusSummary,'HOSTILE');r.perception('b').memories=[];r.decay(12);assert.ok(r.perception('b').tension<90);});
test('shortage is real, scarcity refusal is contextual and no fake request forms',()=>{const w=makeWorld(),d=new SettlementDiplomacySystem(w);assert.ok(d.requestAid('b','a','food'));assert.equal(d.requestAid('a','b','food'),null);const decision=d.decideAid({targetSettlementId:'b',requesterSettlementId:'a',resource:'food',amount:3});assert.equal(decision.outcome,'CANNOT_HELP');});
test('known theft creates perspective tension but unknown origin creates none',()=>{const w=makeWorld(),d=new SettlementDiplomacySystem(w),thief=w.characters[0];assert.equal(d.recordTheft({victimSettlementId:'b',thief,originKnown:false}),false);assert.equal(d.view('b','a').tension,0);assert.equal(d.recordTheft({victimSettlementId:'b',thief,originKnown:true}),true);assert.ok(d.view('b','a').tension>0);assert.equal(d.view('a','b').tension,0);});
test('Alpha 1.8.5 closes physical aid and routine family traffic while retaining relationships',()=>{const w=makeWorld(),d=new SettlementDiplomacySystem(w),traveler=w.characters[0];traveler.parentIds=['b-adult'];assert.equal(d.startAidDelivery('a','b','food',3),null);assert.equal(d.startFamilyVisit(traveler,'b'),null);assert.equal(d.relationships.length,3);});
