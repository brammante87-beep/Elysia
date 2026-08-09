import { Config } from '../core/Config.js';
import { WaterSource } from '../entities/WaterSource.js';
import { WorldTypeId } from '../data/WorldTypes.js';

export class SettlementWaterSystem {
  constructor(world) { this.world = world; }

  ensureSources() {
    if (this.world.worldType === WorldTypeId.PLANT) return;
    const anchors = [[.28,.32],[.72,.3],[.62,.72],[.34,.7]];
    for (const [xRatio,yRatio] of anchors) {
      if (this.world.waterSources.length >= Config.MAX_SETTLEMENTS) break;
      const position = this.nearestBuildable({ x:this.world.terrain.width*xRatio, y:this.world.terrain.height*yRatio });
      if (!position || this.world.waterSources.some(source => this.distance(source.position, position) < Config.MIN_SETTLEMENT_DISTANCE)) continue;
      this.world.waterSources.push(new WaterSource({ id:`waterSource-${this.world.nextEntityId++}`, position }));
    }
  }

  nearestBuildable(anchor) {
    for (let radius=0; radius<18; radius+=1) for (let y=-radius;y<=radius;y+=1) for (let x=-radius;x<=radius;x+=1) {
      const point={x:Math.floor(anchor.x+x)+.5,y:Math.floor(anchor.y+y)+.5};
      if (this.world.canPlace(point,1.4)) return point;
    }
    return null;
  }

  availableSource(origin, settlements=this.world.settlements) {
    return this.world.waterSources.filter(source => source.alive && !source.claimedBySettlementId && !source.reservedByFoundingId && !source.dry && settlements.every(settlement => !settlement.center || this.distance(source.position,settlement.center)>=Config.MIN_SETTLEMENT_DISTANCE)).sort((a,b)=>this.distance(a.position,origin)-this.distance(b.position,origin))[0] ?? null;
  }

  foundingPosition(source) {
    if (!source) return null;
    for (let radius=3;radius<=7;radius+=1) for (let index=0;index<16;index+=1) {
      const angle=index*Math.PI/8, point={x:source.position.x+Math.cos(angle)*radius,y:source.position.y+Math.sin(angle)*radius};
      if (this.world.canPlace(point,2)) return point;
    }
    return null;
  }

  claim(settlement, source) {
    if (!settlement || !source || source.claimedBySettlementId && source.claimedBySettlementId !== settlement.id) return false;
    settlement.waterSourceId=source.id; source.claimedBySettlementId=settlement.id; source.reservedByFoundingId=null; return true;
  }

  migrate() {
    if(this.world.settlements.length) this.ensureSources();
    const used=new Set();
    for (const settlement of this.world.settlements) {
      let source=this.world.waterSources.find(item=>item.id===settlement.waterSourceId && (!item.claimedBySettlementId || item.claimedBySettlementId===settlement.id) && !used.has(item.id));
      if (!source) source=this.world.waterSources.filter(item=>!used.has(item.id) && !item.claimedBySettlementId).sort((a,b)=>this.distance(a.position,settlement.center)-this.distance(b.position,settlement.center))[0];
      if (source) { source.claimedBySettlementId=settlement.id; settlement.waterSourceId=source.id; used.add(source.id); }
    }
    for (const source of this.world.waterSources) if (source.claimedBySettlementId && !this.world.settlements.some(item=>item.id===source.claimedBySettlementId)) source.claimedBySettlementId=null;
  }

  sourceFor(character) { const id=character.homeSettlementId ?? character.settlementId; const settlement=this.world.settlements.find(item=>item.id===id); return this.world.waterSources.find(item=>item.id===settlement?.waterSourceId) ?? null; }
  distance(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }
}
