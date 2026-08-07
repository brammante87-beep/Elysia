import { EnemyTypes } from '../data/EnemyTypes.js';

export class Enemy {
  constructor(data) {
    const type = EnemyTypes.get(data.typeId);
    if (!type) throw new Error(`Unknown enemy type: ${data.typeId}`);
    this.id=data.id; this.typeId=type.id; this.rivalWorldId=type.rivalWorldId; this.factionId=type.rivalWorldId;
    this.position={...data.position}; this.health=data.health ?? type.baseHealth; this.alive=data.alive ?? true;
    this.targetId=data.targetId ?? null; this.cooldownRemaining=data.cooldownRemaining ?? 0; this.attackPhase=data.attackPhase ?? 'idle';
    this.attackElapsed=data.attackElapsed ?? 0; this.facing=data.facing ?? 1; this.animationTime=data.animationTime ?? 0;
    this.hover=type.id==='dolphinGunner'; this.hasHumanLegs=false; this.householdId=null; this.behaviourMemory=null;
    this.visualVariant=data.visualVariant ?? Math.abs(Number(String(data.id).match(/\d+/)?.[0] ?? 0))%3;
  }
  get type() { return EnemyTypes.get(this.typeId); }
  takeDamage(amount) { this.health=Math.max(0,this.health-amount); if (!this.health) this.alive=false; return !this.alive; }
  toJSON() { return { id:this.id,typeId:this.typeId,position:{...this.position},health:this.health,alive:this.alive,targetId:this.targetId,cooldownRemaining:this.cooldownRemaining,attackPhase:this.attackPhase,attackElapsed:this.attackElapsed,facing:this.facing,animationTime:this.animationTime,visualVariant:this.visualVariant }; }
}
