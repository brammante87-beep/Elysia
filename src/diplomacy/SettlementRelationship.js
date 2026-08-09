export class SettlementRelationship {
  static Statuses = Object.freeze(['FRIENDLY','WARM','NEUTRAL','CAUTIOUS','TENSE','HOSTILE']);
  static MAX_MEMORIES = 12;
  constructor(data = {}) {
    this.settlementAId = data.settlementAId;
    this.settlementBId = data.settlementBId;
    this.perceptions = {};
    for (const id of [this.settlementAId, this.settlementBId]) {
      const saved = data.perceptions?.[id] ?? (id === this.settlementAId ? data : {});
      this.perceptions[id] = { trust:this.bound(saved.trust), affinity:this.bound(saved.affinity), cooperation:this.bound(saved.cooperation), tension:this.bound(saved.tension), statusSummary:saved.statusSummary ?? 'NEUTRAL', memories:(saved.memories ?? []).slice(-SettlementRelationship.MAX_MEMORIES).map(memory=>({...memory})) };
    }
    this.lastDecayCycle = data.lastDecayCycle ?? 0;
  }
  bound(value = 0) { return Math.max(0, Math.min(100, Number(value) || 0)); }
  other(id) { return id === this.settlementAId ? this.settlementBId : this.settlementAId; }
  perception(id) { return this.perceptions[id] ?? null; }
  get trust() { return this.perception(this.settlementAId).trust; }
  get affinity() { return this.perception(this.settlementAId).affinity; }
  get cooperation() { return this.perception(this.settlementAId).cooperation; }
  get tension() { return this.perception(this.settlementAId).tension; }
  get memories() { return this.perception(this.settlementAId).memories; }
  get statusSummary() { return this.perception(this.settlementAId).statusSummary; }
  change(observerId, changes = {}) { const view=this.perception(observerId); if(!view)return false; for(const key of ['trust','affinity','cooperation','tension'])if(changes[key]!==undefined)view[key]=this.bound(view[key]+changes[key]); this.refresh(observerId); return true; }
  remember(observerId, memory) { const view=this.perception(observerId); if(!view||!memory?.type)return null; const item={importance:.5,cycle:0,source:'WITNESSED',...memory}; view.memories.push(item); view.memories.sort((a,b)=>(a.importance-b.importance)||(a.cycle-b.cycle)); while(view.memories.length>SettlementRelationship.MAX_MEMORIES)view.memories.shift(); return item; }
  score(view) { return view.trust*.34+view.affinity*.27+view.cooperation*.24-view.tension*.55; }
  candidate(view) { const score=this.score(view); if(view.tension>=82)return 'HOSTILE'; if(view.tension>=58||score<=-25)return 'TENSE'; if(view.tension>=34||score<0)return 'CAUTIOUS'; if(score>=52&&view.tension<24)return 'FRIENDLY'; if(score>=25&&view.tension<32)return 'WARM'; return 'NEUTRAL'; }
  refresh(observerId) { const view=this.perception(observerId),next=this.candidate(view),current=view.statusSummary; if(next===current)return current; const order=SettlementRelationship.Statuses,index=order.indexOf(current),nextIndex=order.indexOf(next); const margin=Math.abs(this.score(view))%25; if(index>=0&&Math.abs(nextIndex-index)===1&&margin<3)return current; view.statusSummary=next; return next; }
  decay(cycle) { const elapsed=Math.max(0,cycle-this.lastDecayCycle); if(elapsed<3)return false; for(const view of Object.values(this.perceptions)){const protectedTension=view.memories.some(memory=>memory.importance>=.8&&memory.type!=='AID_DELIVERED');if(!protectedTension)view.tension=this.bound(view.tension-Math.floor(elapsed/3));this.refresh(this.settlementAId);this.refresh(this.settlementBId);}this.lastDecayCycle=cycle;return true; }
  reputation(observerId) { const view=this.perception(observerId); if(!view)return 'ISOLATED'; if(view.tension>=70)return 'DANGEROUS'; if(view.trust<15&&view.memories.some(m=>m.type==='THEFT'))return 'UNTRUSTWORTHY'; if(view.cooperation>=45&&view.memories.some(m=>m.type==='AID_DELIVERED'))return 'GENEROUS'; if(view.trust>=45)return 'RELIABLE'; if(view.memories.some(m=>m.type==='SHARED_DEFENSE'))return 'BRAVE'; return 'ISOLATED'; }
  toJSON() { return {settlementAId:this.settlementAId,settlementBId:this.settlementBId,perceptions:Object.fromEntries(Object.entries(this.perceptions).map(([id,view])=>[id,{...view,memories:view.memories.map(memory=>({...memory}))}])),lastDecayCycle:this.lastDecayCycle}; }
}
