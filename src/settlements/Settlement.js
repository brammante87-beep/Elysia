import { SettlementCulture } from '../culture/SettlementCulture.js';
export class Settlement {
  static States = Object.freeze({ GROWING: 'GROWING', ESTABLISHED: 'ESTABLISHED' });
  constructor(data) { this.id = data.id; this.name = data.name ?? null; this.waterSourceId = data.waterSourceId ?? null; this.householdIds = [...new Set(data.householdIds ?? [])]; this.homeBuildingIds = [...new Set(data.homeBuildingIds ?? [])]; this.centralStructureId = data.centralStructureId ?? null; this.foundingHomeId = data.foundingHomeId ?? this.homeBuildingIds[0] ?? null; this.founderId = data.founderId ?? null; this.center = data.center ? { ...data.center } : null; this.transformed = data.transformed ?? false; this.state = data.state ?? (this.transformed || this.centralStructureId ? Settlement.States.ESTABLISHED : Settlement.States.GROWING); this.externalArrivalCount = Math.max(0, Math.min(4, data.externalArrivalCount ?? 0)); this.culture = new SettlementCulture(data.culture); }
  addHousehold(id) { if (!this.householdIds.includes(id)) this.householdIds.push(id); }
  addHome(id) { if (!this.homeBuildingIds.includes(id)) this.homeBuildingIds.push(id); }
  isGrowing() { return this.state === Settlement.States.GROWING; }
  establish() { this.state = Settlement.States.ESTABLISHED; this.transformed = true; }
  toJSON() { return { ...this, householdIds: [...this.householdIds], homeBuildingIds: [...this.homeBuildingIds], center: this.center ? { ...this.center } : null, culture: this.culture.toJSON() }; }
}
