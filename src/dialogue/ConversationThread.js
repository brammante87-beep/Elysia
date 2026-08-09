export class ConversationThread {
  constructor(participantIds, maxTurns = 4) { this.participantIds=[...participantIds]; this.maxTurns=Math.max(2,Math.min(4,maxTurns)); this.turns=[]; this.closed=false; }
  add(intent) { if(this.closed||this.turns.length>=this.maxTurns)return false; this.turns.push(intent); if(this.turns.length>=this.maxTurns)this.closed=true; return true; }
  toJSON() { return { participantIds:[...this.participantIds], maxTurns:this.maxTurns, turns:this.turns.map(turn=>({...turn})), closed:this.closed }; }
}
