export class Settlement {
  constructor(data) { this.id = data.id; this.name = data.name ?? null; this.householdIds = [...new Set(data.householdIds ?? [])]; this.homeBuildingIds = [...new Set(data.homeBuildingIds ?? [])]; this.centralStructureId = data.centralStructureId ?? null; this.foundingHomeId = data.foundingHomeId ?? this.homeBuildingIds[0] ?? null; this.center = data.center ? { ...data.center } : null; this.transformed = data.transformed ?? false; }
  addHousehold(id) { if (!this.householdIds.includes(id)) this.householdIds.push(id); }
  addHome(id) { if (!this.homeBuildingIds.includes(id)) this.homeBuildingIds.push(id); }
  toJSON() { return { ...this, householdIds: [...this.householdIds], homeBuildingIds: [...this.homeBuildingIds], center: this.center ? { ...this.center } : null }; }
}
