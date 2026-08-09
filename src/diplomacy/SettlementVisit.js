export class SettlementVisit {
  static States = Object.freeze({ TRAVELING:'TRAVELING', ARRIVED:'ARRIVED', RETURNING:'RETURNING', COMPLETE:'COMPLETE', INTERRUPTED:'INTERRUPTED' });
  constructor(data = {}) { this.id=data.id;this.characterId=data.characterId;this.homeSettlementId=data.homeSettlementId;this.visitorSettlementId=data.visitorSettlementId;this.purpose=data.purpose??'SOCIAL_VISIT';this.state=data.state??SettlementVisit.States.TRAVELING;this.homePosition=data.homePosition?{...data.homePosition}:null;this.targetPosition=data.targetPosition?{...data.targetPosition}:null;this.startedCycle=data.startedCycle??0;this.stayRemaining=data.stayRemaining??8;this.report=data.report??null; }
  toJSON(){return{...this,homePosition:this.homePosition?{...this.homePosition}:null,targetPosition:this.targetPosition?{...this.targetPosition}:null};}
}
