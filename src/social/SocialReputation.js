export class SocialReputation {
  static Labels=Object.freeze(['HELPFUL','SELFISH','BRAVE','COWARDLY','THIEF','PROTECTIVE']); static MAX=24;
  constructor(entries=[]){this.entries=(entries??[]).slice(-SocialReputation.MAX).map(item=>({...item,certainty:Math.max(0,Math.min(1,item.certainty??.5))}));}
  learn(subjectId,label,{source='WITNESSED',certainty=1,reportedBy=null,falseAccusation=false}={}){if(!subjectId||!SocialReputation.Labels.includes(label))return null;const evidence={subjectId,label,source,certainty:source==='TOLD_BY_OTHER'?certainty*.65:certainty,reportedBy,falseAccusation};this.entries.push(evidence);this.entries=this.entries.slice(-SocialReputation.MAX);return evidence;}
  labelsFor(subjectId){const scores=new Map();for(const item of this.entries.filter(e=>e.subjectId===subjectId))scores.set(item.label,(scores.get(item.label)??0)+item.certainty);return [...scores].filter(([,score])=>score>=.55).sort((a,b)=>b[1]-a[1]).map(([label])=>label);}
  share(subjectId,label,listener,ownerId){const known=this.entries.find(e=>e.subjectId===subjectId&&e.label===label);return known?listener.reputation.learn(subjectId,label,{source:'TOLD_BY_OTHER',certainty:known.certainty,reportedBy:ownerId}):null;}
  toJSON(){return this.entries.map(item=>({...item}));}
}
