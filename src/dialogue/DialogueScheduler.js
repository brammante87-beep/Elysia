import { CommunicationIntent } from './CommunicationIntent.js';
export class DialogueScheduler {
  constructor(data = {}) { this.queue=[]; this.active=[]; this.spoken=new Map(); this.characterCooldowns=new Map(); this.time=0; this.mobile=Boolean(data.mobile); this.maxTurns=4; this.lastSuppressionReason=null; }
  limit() { return this.mobile ? 1 : 3; }
  duration(text) { return text.length < 35 ? 2.2 : text.length < 85 ? 3.2 : 4.7; }
  submit(intent, text) { const signature=intent.signature(); const previous=this.spoken.get(signature); if(previous && this.time-previous.time<20 && (intent.urgency??0)<=previous.urgency){this.lastSuppressionReason='recent repeated statement';return false;} if((this.characterCooldowns.get(intent.speakerId)??0)>this.time && intent.priority!=='CRITICAL'){this.lastSuppressionReason='character cooldown';return false;} this.queue.push({intent,text,duration:this.duration(text)}); this.queue.sort((a,b)=>CommunicationIntent.Priorities[b.intent.priority]-CommunicationIntent.Priorities[a.intent.priority]); return true; }
  update(deltaTime) { this.time+=deltaTime; for(const bubble of this.active) bubble.remaining-=deltaTime; this.active=this.active.filter(bubble=>bubble.remaining>0); while(this.queue.length && (this.active.length<this.limit() || this.queue[0].intent.priority==='CRITICAL')){const bubble=this.queue.shift(); bubble.remaining=bubble.duration; this.active.push(bubble); this.spoken.set(bubble.intent.signature(),{time:this.time,urgency:bubble.intent.urgency??0}); this.characterCooldowns.set(bubble.intent.speakerId,this.time+5); } return this.active; }
  toJSON() { return {}; }
}
