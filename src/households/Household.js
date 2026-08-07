export class Household {
  constructor(data) { this.id = data.id; this.memberIds = [...new Set(data.memberIds ?? [])]; this.homeBuildingId = data.homeBuildingId; }
  addMember(characterId) { if (!this.memberIds.includes(characterId)) this.memberIds.push(characterId); }
  toJSON() { return { id: this.id, memberIds: [...this.memberIds], homeBuildingId: this.homeBuildingId }; }
}
