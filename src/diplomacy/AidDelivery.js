export class AidDelivery {
  static States=Object.freeze({TRAVELING:'TRAVELING',DELIVERED:'DELIVERED',RETURNING:'RETURNING',COMPLETE:'COMPLETE',LOST:'LOST'});
  constructor(data={}){this.id=data.id;this.requestId=data.requestId??null;this.donorSettlementId=data.donorSettlementId;this.recipientSettlementId=data.recipientSettlementId;this.carrierId=data.carrierId;this.resource=data.resource;this.amount=Math.max(0,data.amount??0);this.state=data.state??AidDelivery.States.TRAVELING;this.rewardApplied=data.rewardApplied??false;}
  toJSON(){return{...this};}
}
